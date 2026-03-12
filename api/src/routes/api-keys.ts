/**
 * API Key management routes
 * 
 * POST   /api-keys          — Generate new API key
 * GET    /api-keys          — List user's API keys
 * DELETE /api-keys/:id      — Revoke an API key
 */

import { Hono } from 'hono';
import { randomBytes } from 'crypto';
import prisma from '../lib/prisma.js';

const apiKeys = new Hono();

// Generate a unique API key: mc_ + 32 random hex chars
function generateApiKey(): string {
  return `mc_${randomBytes(16).toString('hex')}`;
}

// POST /api-keys — Create new key
apiKeys.post('/', async (c) => {
  const user = c.get('user') as any;
  const body = await c.req.json().catch(() => ({}));
  const name = body.name || 'Default Key';

  // Each user can have max 5 keys
  const existingCount = await prisma.apiKey.count({ where: { userId: user.id } });
  if (existingCount >= 5) {
    return c.json({ error: 'Maximum 5 API keys per user' }, 400);
  }

  // Generate unique key
  let key: string;
  let exists = true;
  do {
    key = generateApiKey();
    const found = await prisma.apiKey.findUnique({ where: { key } });
    exists = !!found;
  } while (exists);

  const apiKey = await prisma.apiKey.create({
    data: {
      userId: user.id,
      key,
      name,
      tier: 'free',
      dailyLimit: 10,
    },
  });

  return c.json({
    data: {
      id: apiKey.id,
      key: apiKey.key,       // Only show full key on creation
      name: apiKey.name,
      tier: apiKey.tier,
      dailyLimit: apiKey.dailyLimit,
      createdAt: apiKey.createdAt,
    },
    message: 'Save this key — it will not be shown in full again.',
  }, 201);
});

// GET /api-keys — List keys (masked)
apiKeys.get('/', async (c) => {
  const user = c.get('user') as any;

  const keys = await prisma.apiKey.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  const masked = keys.map(k => ({
    id: k.id,
    key: `${k.key.slice(0, 6)}...${k.key.slice(-4)}`,  // mc_ab...ef12
    name: k.name,
    tier: k.tier,
    dailyLimit: k.dailyLimit,
    dailyUsed: k.dailyUsed,
    isActive: k.isActive,
    createdAt: k.createdAt,
    expiresAt: k.expiresAt,
  }));

  return c.json({ data: masked });
});

// DELETE /api-keys/:id — Revoke
apiKeys.delete('/:id', async (c) => {
  const user = c.get('user') as any;
  const keyId = c.req.param('id');

  const existing = await prisma.apiKey.findFirst({
    where: { id: keyId, userId: user.id },
  });

  if (!existing) {
    return c.json({ error: 'API key not found' }, 404);
  }

  await prisma.apiKey.update({
    where: { id: keyId },
    data: { isActive: false },
  });

  return c.json({ message: 'API key revoked' });
});

export default apiKeys;
