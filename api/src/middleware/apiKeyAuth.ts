/**
 * API Key authentication middleware for Skill/Agent access
 * 
 * Validates `Authorization: Bearer mc_xxx` header
 * Checks daily quota, resets if new day
 */

import { Context, Next } from 'hono';
import prisma from '../lib/prisma.js';

export async function apiKeyAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing API key. Set Authorization: Bearer mc_xxx' }, 401);
  }

  const key = authHeader.replace('Bearer ', '').trim();

  // Must be a MoltCash API key (mc_ prefix)
  if (!key.startsWith('mc_')) {
    return c.json({ error: 'Invalid API key format. Keys start with mc_' }, 401);
  }

  const apiKey = await prisma.apiKey.findUnique({
    where: { key },
    include: { user: true },
  });

  if (!apiKey) {
    return c.json({ error: 'Invalid API key' }, 401);
  }

  if (!apiKey.isActive) {
    return c.json({ error: 'API key is deactivated' }, 403);
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return c.json({ error: 'API key expired' }, 403);
  }

  // Reset daily counter if new day
  const now = new Date();
  const lastReset = new Date(apiKey.lastResetAt);
  if (now.toDateString() !== lastReset.toDateString()) {
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { dailyUsed: 0, lastResetAt: now },
    });
    apiKey.dailyUsed = 0;
  }

  // Check quota
  if (apiKey.dailyUsed >= apiKey.dailyLimit) {
    return c.json({
      error: 'Daily execution limit reached',
      limit: apiKey.dailyLimit,
      tier: apiKey.tier,
      upgrade: 'https://moltcash.com/pricing',
    }, 429);
  }

  // Attach to context
  c.set('apiKey', apiKey);
  c.set('apiKeyUser', apiKey.user);

  await next();
}
