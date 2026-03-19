import { Router } from 'express';
import multer from 'multer';
import prisma from '../db.js';
import { authRequired, authOptional, type AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';
import { LokaAIService, type ChatMessage } from '../services/ai.service.js';
import { config } from '../config.js';

const router = Router();
const aiService = new LokaAIService();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

// Get chat history (optionally filter by time range or sessionId)
router.get('/history', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const where: any = { userId: req.userId };
    if (req.query.sessionId) where.sessionId = req.query.sessionId as string;
    if (req.query.from) where.createdAt = { ...(where.createdAt || {}), gte: new Date(req.query.from as string) };
    if (req.query.to) where.createdAt = { ...(where.createdAt || {}), lte: new Date(req.query.to as string) };

    const messages = await prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
    res.json(messages);
  } catch (err) {
    next(err);
  }
});

// Get conversation list (group by sessionId)
router.get('/conversations', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, sessionId: true, role: true, content: true, createdAt: true },
    });

    // Group by sessionId (null sessionId = legacy, group by time gap)
    const sessionMap = new Map<string, { id: string; title: string; time: string; messageCount: number; firstMessageAt: string; lastMessageAt: string }>();

    for (const msg of messages) {
      const sid = msg.sessionId || '__legacy__';
      const existing = sessionMap.get(sid);
      if (!existing) {
        const title = msg.role === 'user'
          ? msg.content.slice(0, 60) + (msg.content.length > 60 ? '...' : '')
          : 'New Chat';
        sessionMap.set(sid, {
          id: sid === '__legacy__' ? msg.id : sid,
          title,
          time: msg.createdAt.toISOString(),
          messageCount: 1,
          firstMessageAt: msg.createdAt.toISOString(),
          lastMessageAt: msg.createdAt.toISOString(),
        });
      } else {
        existing.messageCount++;
        existing.lastMessageAt = msg.createdAt.toISOString();
      }
    }

    // Return newest first
    const conversations = Array.from(sessionMap.values()).sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );
    res.json(conversations);
  } catch (err) {
    next(err);
  }
});

// Send message to AI agent (non-streaming)
const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  agentId: z.string().optional(),
  sessionId: z.string().optional(),
  assetContext: z.object({
    name: z.string(),
    category: z.string().optional(),
    apy: z.string().optional(),
    term: z.string().optional(),
    progress: z.number().optional(),
    backers: z.number().optional(),
    description: z.string().optional(),
  }).optional(),
});

router.post('/send', authOptional, async (req: AuthRequest, res, next) => {
  try {
    const { content, agentId, sessionId } = sendMessageSchema.parse(req.body);
    const userId = req.userId;
    const isAnonymous = !userId;

    // Save user message (skip for anonymous — no valid FK)
    let userMessage: any = { role: 'user', content, timestamp: new Date() };
    if (!isAnonymous) {
      userMessage = await prisma.chatMessage.create({
        data: { userId, sessionId, role: 'user', content, agentId },
      });
    }

    // Get conversation context (same session, last 20)
    let context: any[] = [];
    if (!isAnonymous) {
      context = await prisma.chatMessage.findMany({
        where: { userId, ...(sessionId ? { sessionId } : {}) },
        orderBy: { createdAt: 'asc' },
        take: 20,
      });
    } else {
      context = [{ role: 'user', content }];
    }

    // Call AI service
    const aiResponse = await aiService.chat(context, agentId);

    // Save AI response (skip for anonymous)
    let assistantMessage: any = { role: 'assistant', content: aiResponse.content, timestamp: new Date() };
    if (!isAnonymous) {
      assistantMessage = await prisma.chatMessage.create({
        data: {
          userId,
          sessionId,
          role: 'assistant',
          content: aiResponse.content,
          agentId: aiResponse.agentId,
          metadata: aiResponse.metadata ? JSON.stringify(aiResponse.metadata) : null,
        },
      });
    }

    res.json({ userMessage, assistantMessage });
  } catch (err) {
    next(err);
  }
});

// Send message with streaming (SSE)
router.post('/stream', authOptional, async (req: AuthRequest, res, next) => {
  try {
    const { content, agentId, sessionId } = sendMessageSchema.parse(req.body);
    const userId = req.userId;
    const isAnonymous = !userId;

    // Save user message (skip for anonymous)
    if (!isAnonymous) {
      await prisma.chatMessage.create({
        data: { userId, sessionId, role: 'user', content, agentId },
      });
    }

    // Get conversation context (same session)
    let context: any[] = [];
    if (!isAnonymous) {
      context = await prisma.chatMessage.findMany({
        where: { userId, ...(sessionId ? { sessionId } : {}) },
        orderBy: { createdAt: 'asc' },
        take: 20,
      });
    } else {
      context = [{ role: 'user', content }];
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const assetCtx = sendMessageSchema.parse(req.body).assetContext;
    const stream = await aiService.chatStream(context, agentId, assetCtx);
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

    // Save complete AI response to DB (skip for anonymous)
    if (fullContent && !isAnonymous) {
      await prisma.chatMessage.create({
        data: {
          userId,
          sessionId,
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

// Clear all chat history
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

// Delete a single conversation by sessionId
router.delete('/conversations/:sessionId', authRequired, async (req: AuthRequest, res, next) => {
  try {
    await prisma.chatMessage.deleteMany({
      where: { userId: req.userId, sessionId: req.params.sessionId as string },
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
    // baseUrl may be full endpoint like "https://api.x.cn/v1/chat/completions"
    // or just base like "https://api.x.cn/v1" — extract origin and build Whisper URL
    const urlOrigin = baseUrl.replace(/\/v1\/.*$/, '').replace(/\/v1\/?$/, '');
    const whisperUrl = `${urlOrigin}/v1/audio/transcriptions`;
    console.log('[Transcribe] baseUrl:', baseUrl, '→ whisperUrl:', whisperUrl);

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
      console.error('[Transcribe] Whisper API error:', response.status, response.statusText, errBody);
      res.status(502).json({ error: 'Transcription service error', detail: errBody });
      return;
    }

    const result = await response.json() as { text?: string };
    res.json({ text: result.text || '' });
  } catch (err) {
    next(err);
  }
});

export default router;
