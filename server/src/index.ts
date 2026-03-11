import { createServer } from 'http';
import app from './app.js';
import { config } from './config.js';
import { setupSocket } from './socket/index.js';
import prisma from './db.js';

const server = createServer(app);

// Setup WebSocket
setupSocket(server);

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    server.listen(config.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.port}`);
      console.log(`📡 WebSocket ready`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  server.close();
  process.exit(0);
});

main();
