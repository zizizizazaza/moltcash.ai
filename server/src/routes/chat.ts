import { Router } from 'express';
import multer from 'multer';
import prisma from '../db.js';
import { authRequired, type AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';
import { LokaAIService, type ChatMessage } from '../services/ai.service.js';
import { config } from '../config.js';

const router = Router();
const aiService = new LokaAIService();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

// Get chat history
router.get('/history', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
    res.json(messages);
  } catch (err) {
    next(err);
  }
});

// Send message to AI agent (non-streaming)
const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  agentId: z.string().optional(),
});

router.post('/send', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const { content, agentId } = sendMessageSchema.parse(req.body);
    const userId = req.userId!;

    // Save user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        userId,
        role: 'user',
        content,
        agentId,
      },
    });

    // Get conversation context (last 20 messages)
    const context = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    // Call AI service
    const aiResponse = await aiService.chat(context, agentId);

    // Save AI response
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        userId,
        role: 'assistant',
        content: aiResponse.content,
        agentId: aiResponse.agentId,
        metadata: aiResponse.metadata ? JSON.stringify(aiResponse.metadata) : null,
      },
    });

    res.json({
      userMessage,
      assistantMessage,
    });
  } catch (err) {
    next(err);
  }
});

// Send message with streaming (SSE)
router.post('/stream', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const { content, agentId } = sendMessageSchema.parse(req.body);
    const userId = req.userId!;

    // Save user message
    await prisma.chatMessage.create({
      data: { userId, role: 'user', content, agentId },
    });

    // Get conversation context
    const context = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const stream = await aiService.chatStream(context, agentId);
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Parse SSE lines from the upstream API
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              res.write('data: [DONE]\n\n');
              continue;
            }
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content || '';
              if (delta) {
                fullContent += delta;
                res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
              }
            } catch {
              // Skip unparseable chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Save complete AI response to DB
    if (fullContent) {
      await prisma.chatMessage.create({
        data: {
          userId,
          role: 'assistant',
          content: fullContent,
          agentId: agentId || 'loka-agent',
        },
      });
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    // If headers already sent, just end the response
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`);
      res.end();
    } else {
      next(err);
    }
  }
});

// Clear chat history
router.delete('/history', authRequired, async (req: AuthRequest, res, next) => {
  try {
    await prisma.chatMessage.deleteMany({
      where: { userId: req.userId },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Transcribe audio (Whisper-compatible API for iOS/Firefox fallback)
router.post('/transcribe', authRequired, upload.single('audio'), async (req: AuthRequest, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No audio file provided' });
      return;
    }

    const language = (req.body?.language as string) || 'en';

    // If we have an OpenAI-compatible API configured, use it
    const apiKey = config.lokaAi.apiKey;
    const baseUrl = config.lokaAi.baseUrl;

    if (!apiKey || !baseUrl) {
      // No API configured — return a helpful error
      res.status(503).json({ error: 'Speech transcription service not configured' });
      return;
    }

    // Build OpenAI-compatible Whisper request
    const whisperUrl = `${baseUrl.replace(/\/v1\/?$/, '')}/v1/audio/transcriptions`;

    const formData = new FormData();
    formData.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname || 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', language.split('-')[0]); // 'en-US' → 'en'
    formData.append('response_format', 'json');

    const response = await fetch(whisperUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: formData,
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('[Transcribe] Whisper API error:', response.status, errBody);
      res.status(502).json({ error: 'Transcription service error' });
      return;
    }

    const result = await response.json() as { text?: string };
    res.json({ text: result.text || '' });
  } catch (err) {
    next(err);
  }
});

export default router;
