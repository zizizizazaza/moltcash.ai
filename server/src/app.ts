import express from 'express';
import cors from 'cors';
import { config } from './config.js';
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

const app = express();

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
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

// Error handler (must be last)
app.use(errorHandler);

export default app;
