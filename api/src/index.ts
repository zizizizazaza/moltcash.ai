import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { errorHandler } from './middleware/error.js';
import { authMiddleware } from './middleware/auth.js';
import { rateLimiter } from './middleware/rateLimit.js';
import authRoutes from './routes/auth.js';
import opportunitiesRoutes from './routes/opportunities.js';
import sessionsRoutes from './routes/sessions.js';
import tasksRoutes from './routes/tasks.js';
import commentsRoutes from './routes/comments.js';
import dashboardRoutes from './routes/dashboard.js';
import reviewsRoutes from './routes/reviews.js';
import quotaRoutes from './routes/quota.js';
import leaderboardRoutes from './routes/leaderboard.js';
import pointsRoutes from './routes/points.js';
import adminRoutes from './routes/admin.js';
import apiKeysRoutes from './routes/api-keys.js';
import executionsRoutes from './routes/executions.js';
import { startSyncScheduler } from './services/sync.js';

const app = new Hono();

// ── Global middleware ─────────────────────────────
app.use('*', logger());
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:3001,http://localhost:5173').split(',');
app.use('*', cors({ origin: CORS_ORIGINS, credentials: true }));
app.use('*', errorHandler);
app.use('*', rateLimiter({ windowMs: 60_000, max: 100, keyPrefix: 'global' }));

// ── Health check ──────────────────────────────────
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Public routes ─────────────────────────────────
app.route('/opportunities', opportunitiesRoutes);
app.route('/comments', commentsRoutes); // read comments is public
app.route('/leaderboard', leaderboardRoutes); // public leaderboard

// ── Protected routes (require Privy auth token) ──
const protectedApi = new Hono();
protectedApi.use('*', authMiddleware);
protectedApi.use('*', rateLimiter({ windowMs: 60_000, max: 60, keyPrefix: 'auth' }));

protectedApi.route('/auth', authRoutes);
protectedApi.route('/sessions', sessionsRoutes);
protectedApi.route('/tasks', tasksRoutes);
protectedApi.route('/dashboard', dashboardRoutes);
protectedApi.route('/reviews', reviewsRoutes);
protectedApi.route('/quota', quotaRoutes);
protectedApi.route('/points', pointsRoutes);
protectedApi.route('/admin', adminRoutes);
protectedApi.route('/api-keys', apiKeysRoutes);

app.route('/api', protectedApi);

// ── Skill/Agent routes (API Key auth, not Privy) ──
app.route('/executions', executionsRoutes);

// ── Start server ──────────────────────────────────
const port = parseInt(process.env.PORT || '3003');

console.log(`
╔═══════════════════════════════════════╗
║       MoltCash API Server             ║
║       http://localhost:${port}           ║
╚═══════════════════════════════════════╝
`);

serve({ fetch: app.fetch, port });

// Start external data sync (every 1 hour)
startSyncScheduler(60 * 60 * 1000);
