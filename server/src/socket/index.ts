import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { config } from '../config.js';
import { verifyToken } from '../middleware/auth.js';
import prisma from '../db.js';
import { researchService } from '../services/research.service.js';
import { stockAnalysisService } from '../services/stockanalysis.service.js';
import { hedgefundService } from '../services/hedgefund.service.js';
import { LokaAIService } from '../services/ai.service.js';
import { runConsensusEngine } from '../services/consensus.service.js';
import * as crypto from 'crypto';

let io: Server;
const aiService = new LokaAIService();

// ── Online status tracking ──
const onlineUsers = new Set<string>();
const activeResearchSessions = new Set<string>();
const activeHedgeFundSessions = new Set<string>();
const activeStockAnalysisSessions = new Set<string>();
const activeChatSessions = new Map<string, string>();

export function setupSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: [config.frontendUrl, 'https://www.loka.cash', 'https://loka.cash', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'https://localhost', 'capacitor://localhost'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/api/socket.io',
  });

  // JWT authentication middleware for WebSocket
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = await verifyToken(token as string);
      (socket as any).userId = payload.userId || payload.sub?.replace('did:privy:', '');
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket as any).userId as string;
    console.log(`🔌 Client connected: ${socket.id} (user: ${userId})`);

    // Auto-join the user's personal room
    socket.join(`user:${userId}`);

    // ── Online status ──
    onlineUsers.add(userId);
    // Broadcast to all connected clients (friends will filter client-side)
    socket.broadcast.emit('user:online', { userId });

    // ── Auto-join group rooms from DB ──
    // This is vastly superior to relying on frontend `join-group` emits, as it intrinsically survives 
    // WebSocket disconnects/reconnects without dropping frames or losing synchrony.
    prisma.groupMember.findMany({ where: { userId } })
      .then(members => {
        members.forEach(m => socket.join(`group:${m.groupId}`));
      })
      .catch(err => console.error('Failed to auto-join DB groups:', err));

    // Join group chat room (validated - userId is already authenticated)
    socket.on('join-group', (groupId: string) => {
      if (typeof groupId === 'string' && groupId.length < 100) {
        socket.join(`group:${groupId}`);
      }
    });

    socket.on('leave-group', (groupId: string) => {
      if (typeof groupId === 'string') {
        socket.leave(`group:${groupId}`);
      }
    });

    // ── DM: typing indicator ──
    socket.on('dm:typing', (data: { conversationId: string; recipientId: string }) => {
      if (data?.recipientId && data?.conversationId) {
        emitToUser(data.recipientId, 'dm:typing', {
          userId,
          conversationId: data.conversationId,
        });
      }
    });

    // ── Get online users (client request) ──
    socket.on('get-online-users', (callback: (ids: string[]) => void) => {
      if (typeof callback === 'function') {
        callback(Array.from(onlineUsers));
      }
    });

    socket.on('agent:research:check', (data: { sessionId: string }, callback: (res: { isRunning: boolean }) => void) => {
      if (typeof callback === 'function') {
        callback({ isRunning: activeResearchSessions.has(data.sessionId) });
      }
    });

    // ── Deep Research Agent ──
    socket.on('agent:research', async (data: { topic: string; deep?: boolean; days?: number; sessionId?: string }) => {
      if (!data?.topic) return;
      socket.emit('agent:research:started', { topic: data.topic });

      const sessionId = data.sessionId || crypto.randomUUID();
      activeResearchSessions.add(sessionId);

      try {
        await prisma.chatMessage.create({
          data: {
            userId,
            sessionId,
            role: 'user',
            content: data.topic,
            agentId: 'research'
          }
        });
      } catch (dbErr) {
        console.error('Failed to save user message:', dbErr);
      }

      try {
        const result = await researchService.runDeepResearch(
          data.topic,
          { deep: data.deep, days: data.days },
          (log) => {
            emitToUser(userId, 'agent:research:progress', { topic: data.topic, sessionId, log });
          }
        );

        try {
          await prisma.chatMessage.create({
            data: {
              userId,
              sessionId,
              role: 'assistant',
              content: result.summary,
              agentId: 'research'
            }
          });
        } catch (dbErr) {
          console.error('Failed to save assistant message:', dbErr);
        }

        emitToUser(userId, 'agent:research:done', { ...result, sessionId });
        activeResearchSessions.delete(sessionId);
      } catch (err: any) {
        emitToUser(userId, 'agent:research:error', { topic: data.topic, sessionId, error: err.message });
        activeResearchSessions.delete(sessionId);
      }
    });

    // ── AI Hedge Fund Agent ──
    socket.on('agent:hedgefund:check', (data: { sessionId: string }, callback: (res: { isRunning: boolean }) => void) => {
      if (typeof callback === 'function') {
        callback({ isRunning: activeHedgeFundSessions.has(data.sessionId) });
      }
    });

    socket.on('agent:hedgefund', async (data: { tickers: string[]; sessionId?: string; showReasoning?: boolean }) => {
      if (!data?.tickers?.length) return;

      const sessionId = data.sessionId || crypto.randomUUID();
      activeHedgeFundSessions.add(sessionId);

      const tickerStr = data.tickers.join(', ');
      emitToUser(userId, 'agent:hedgefund:started', { tickers: data.tickers, sessionId });

      // Save user message
      try {
        await prisma.chatMessage.create({
          data: {
            userId,
            sessionId,
            role: 'user',
            content: `Analyze ${tickerStr} using AI Hedge Fund`,
            agentId: 'hedgefund'
          }
        });
      } catch (dbErr) {
        console.error('Failed to save hedgefund user message:', dbErr);
      }

      try {
        const result = await hedgefundService.runAnalysis(
          {
            tickers: data.tickers,
            showReasoning: data.showReasoning ?? true,
          },
          (log) => {
            emitToUser(userId, 'agent:hedgefund:progress', { sessionId, log });
          }
        );

        const report = hedgefundService.formatReport(result);

        // Save assistant message
        try {
          await prisma.chatMessage.create({
            data: {
              userId,
              sessionId,
              role: 'assistant',
              content: report,
              agentId: 'hedgefund'
            }
          });
        } catch (dbErr) {
          console.error('Failed to save hedgefund assistant message:', dbErr);
        }

        emitToUser(userId, 'agent:hedgefund:done', { sessionId, report });
        activeHedgeFundSessions.delete(sessionId);
      } catch (err: any) {
        emitToUser(userId, 'agent:hedgefund:error', { sessionId, error: err.message });
        activeHedgeFundSessions.delete(sessionId);
      }
    });

    // ── Stock Analysis Agent ──
    socket.on('agent:stockanalysis:check', (data: { sessionId: string }, callback: (res: { isRunning: boolean }) => void) => {
      if (typeof callback === 'function') {
        callback({ isRunning: activeStockAnalysisSessions.has(data.sessionId) });
      }
    });

    socket.on('agent:stockanalysis', async (data: { tickers: string[]; sessionId?: string }) => {
      if (!data?.tickers?.length) return;

      const sessionId = data.sessionId || crypto.randomUUID();
      activeStockAnalysisSessions.add(sessionId);

      const tickerStr = data.tickers.join(', ');
      emitToUser(userId, 'agent:stockanalysis:started', { tickers: data.tickers, sessionId });

      // Save user message
      try {
        await prisma.chatMessage.create({
          data: {
            userId,
            sessionId,
            role: 'user',
            content: `Analyze ${tickerStr} using Stock Analysis Agent`,
            agentId: 'stockanalysis'
          }
        });
      } catch (dbErr) {
        console.error('Failed to save stockanalysis user message:', dbErr);
      }

      try {
        await stockAnalysisService.runAnalysis(
          { tickers: data.tickers },
          sessionId,
          socket
        );
        activeStockAnalysisSessions.delete(sessionId);
      } catch (err: any) {
        emitToUser(userId, 'agent:stockanalysis:error', { sessionId, error: err.message });
        activeStockAnalysisSessions.delete(sessionId);
      }
    });

    // ── SuperAgent Chat (Streaming & Consensus) ──
    socket.on('agent:chat:check', (data: { sessionId: string }, callback: (res: { isRunning: boolean; mode?: string }) => void) => {
      if (typeof callback === 'function') {
        callback({ isRunning: activeChatSessions.has(data.sessionId), mode: activeChatSessions.get(data.sessionId) });
      }
    });

    socket.on('agent:chat', async (data: { content: string; mode: string; sessionId?: string; agentId?: string }) => {
      if (!data?.content) return;
      
      const sessionId = data.sessionId || crypto.randomUUID();
      let mode = data.mode || 'auto';
      
      // Dynamic Routing for Auto mode
      if (mode === 'auto') {
        socket.emit('agent:chat:routing', { sessionId });
        mode = await aiService.evaluateRouting(data.content);
        socket.emit('agent:chat:routed', { sessionId, mode });
        // Give frontend a tiny bit of time to render the switch if necessary
        await new Promise(r => setTimeout(r, 300));
      }

      const useConsensus = mode === 'collaborate' || mode === 'roundtable';
      
      activeChatSessions.set(sessionId, mode);

      socket.emit('agent:chat:started', { content: data.content, sessionId, mode });

      try {
        await prisma.chatMessage.create({
          data: {
            userId,
            sessionId,
            role: 'user',
            content: data.content,
            agentId: data.agentId || 'superagent'
          }
        });
      } catch (dbErr) {
        console.error('Failed to save chat user message:', dbErr);
      }

      try {
        if (useConsensus) {
          // Consensus Mode
          const result = await runConsensusEngine(userId, mode, data.content);
          
          try {
            await prisma.chatMessage.create({
              data: {
                userId,
                sessionId,
                role: 'assistant',
                content: result.consensus.finalAnswer || 'No consensus reached.',
                agentId: data.agentId || 'superagent',
                metadata: JSON.stringify({
                  type: 'consensus',
                  mode: result.mode,
                  groupId: result.groupId,
                  confidence: result.consensus.confidence,
                  agentResponses: result.consensus.agentResponses,
                  weightedVotes: result.consensus.weightedVotes,
                  roundsUsed: result.consensus.roundsUsed,
                  executionTime: result.consensus.executionTime,
                  consensusReached: result.consensus.consensusReached,
                })
              }
            });
          } catch (dbErr) {
            console.error('Failed to save chat assistant message:', dbErr);
          }
          
          emitToUser(userId, 'agent:chat:consensus_done', { sessionId, result });
          activeChatSessions.delete(sessionId);
        } else {
          // Streaming Mode (Auto/Fast)
          const context = await prisma.chatMessage.findMany({
            where: { userId, sessionId },
            orderBy: { createdAt: 'asc' },
            take: 20,
          });
          
          // Map to format that AI service expects
          const mappedContext = context.map(m => ({
            role: m.role,
            content: m.content,
            agentId: m.agentId,
          }));
          
          const stream = await aiService.chatStream(mappedContext, data.agentId || 'loka-agent');
          const reader = stream.getReader();
          const decoder = new TextDecoder();
          let fullContent = '';
          let streamBuffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              // Flush any remaining flushable content
              if (streamBuffer.trim().startsWith('data: ') && streamBuffer.trim() !== 'data: [DONE]') {
                try {
                   const parsed = JSON.parse(streamBuffer.trim().slice(6).trim());
                   const delta = parsed.choices?.[0]?.delta?.content || '';
                   if (delta) {
                     fullContent += delta;
                     emitToUser(userId, 'agent:chat:progress', { content: delta, sessionId });
                   }
                } catch(e) {}
              }
              break;
            }

            streamBuffer += decoder.decode(value, { stream: true });
            
            // SSE lines are separated by \n. We split and keep the last (potentially incomplete) piece in the buffer.
            const lines = streamBuffer.split('\n');
            streamBuffer = lines.pop() || ''; 

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                const sseData = trimmed.slice(6).trim();
                if (sseData === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(sseData);
                  const delta = parsed.choices?.[0]?.delta?.content || '';
                  if (delta) {
                    fullContent += delta;
                    emitToUser(userId, 'agent:chat:progress', { content: delta, sessionId });
                  }
                } catch (e) {
                  // ignore parse error if somehow SSE sends broken JSON on a full line
                }
              }
            }
          }
          
          try {
            await prisma.chatMessage.create({
              data: {
                userId,
                sessionId,
                role: 'assistant',
                content: fullContent,
                agentId: data.agentId || 'superagent'
              }
            });
          } catch (dbErr) {
            console.error('Failed to save chat assistant message:', dbErr);
          }

          emitToUser(userId, 'agent:chat:stream_done', { sessionId, content: fullContent });
          activeChatSessions.delete(sessionId);
        }
      } catch (err: any) {
        emitToUser(userId, 'agent:chat:error', { sessionId, error: err.message });
        activeChatSessions.delete(sessionId);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);

      // Check if user has other active sockets before marking offline
      const rooms = io.sockets.adapter.rooms.get(`user:${userId}`);
      if (!rooms || rooms.size === 0) {
        onlineUsers.delete(userId);
        socket.broadcast.emit('user:offline', { userId });
      }
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

// Helper to emit to specific user
export function emitToUser(userId: string, event: string, data: unknown) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

// Helper to emit to group
export function emitToGroup(groupId: string, event: string, data: unknown) {
  if (io) {
    io.to(`group:${groupId}`).emit(event, data);
  }
}

// Helper to make a user's active sockets join a specific room
// Used when a user joins a group via REST API so they immediately receive group events
export function joinSocketRoom(userId: string, room: string) {
  if (!io) return;
  const userRoom = io.sockets.adapter.rooms.get(`user:${userId}`);
  if (userRoom) {
    for (const socketId of userRoom) {
      const s = io.sockets.sockets.get(socketId);
      if (s) s.join(room);
    }
  }
}

// Helper to get online user IDs
export function getOnlineUserIds(): string[] {
  return Array.from(onlineUsers);
}

