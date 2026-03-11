import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { config } from '../config.js';

let io: Server;

export function setupSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: config.frontendUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/ws',
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join user-specific room
    socket.on('join', (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`👤 User ${userId} joined`);
    });

    // Join group chat room
    socket.on('join-group', (groupId: string) => {
      socket.join(`group:${groupId}`);
    });

    socket.on('leave-group', (groupId: string) => {
      socket.leave(`group:${groupId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
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
