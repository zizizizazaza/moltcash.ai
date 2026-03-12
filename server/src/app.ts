import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';
import { requestId } from './middleware/requestId.js';
import { apiLimiter, authLimiter, financialLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import projectRoutes from './routes/projects.js';
import treasuryRoutes from './routes/treasury.js';
import portfolioRoutes from './routes/portfolio.js';
import tradeRoutes from './routes/trade.js';
import chatRoutes from './routes/chat.js';
import groupRoutes from './routes/groups.js';
import creditRoutes from './routes/credit.js';
import applyRoutes from './routes/apply.js';
import governanceRoutes from './routes/governance.js';
import repaymentRoutes from './routes/repayment.js';
import liquidationRoutes from './routes/liquidation.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import prisma from './db.js';

const app = express();

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// Request ID tracking
app.use(requestId);

// Request logging
app.use(morgan(config.isProduction ? 'combined' : 'dev'));

// CORS
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Global rate limit
app.use('/api', apiLimiter);

// Health check (before rate limit for monitoring)
app.get('/api/health', async (_req, res) => {
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {}
  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: { database: dbOk ? 'connected' : 'disconnected' },
  });
});

// API Routes — auth endpoints get stricter rate limit
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/treasury', treasuryRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/credit', creditRoutes);
app.use('/api/apply', applyRoutes);
app.use('/api/governance', governanceRoutes);
app.use('/api/repayment', repaymentRoutes);
app.use('/api/liquidation', liquidationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
