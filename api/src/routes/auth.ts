import { Hono } from 'hono';
import prisma from '../lib/prisma.js';
import privy from '../lib/privy.js';
import { getUserId } from '../middleware/auth.js';
import { validateBody, authSyncSchema } from '../lib/validators.js';

const auth = new Hono();

// POST /auth/sync — Sync Privy user profile to local DB
// Called by frontend after Privy login to keep local user in sync
auth.post('/sync', async (c) => {
    const userId = getUserId(c);

    // Get full Privy user profile
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        return c.json({ success: false, error: 'User not found' }, 404);
    }

    // Validate & parse request body
    const body = await validateBody(c, authSyncSchema);

    // Build update payload
    const updateData: any = {};
    if (body.walletAddress && !user.walletAddress) {
        updateData.walletAddress = body.walletAddress.toLowerCase();
    }
    if (body.email && !user.email) updateData.email = body.email;
    if (body.twitterHandle && !user.twitterHandle) updateData.twitterHandle = body.twitterHandle;
    if (body.displayName) updateData.displayName = body.displayName;
    if (body.avatarUrl) updateData.avatarUrl = body.avatarUrl;

    // Handle referral on first sync
    if (body.referralCode && !user.referredById) {
        const referrer = await prisma.user.findUnique({
            where: { referralCode: body.referralCode },
        });
        if (referrer && referrer.id !== user.id) {
            updateData.referredById = referrer.id;

            // Create referral record
            await prisma.referral.create({
                data: {
                    referrerId: referrer.id,
                    refereeId: user.id,
                },
            }).catch(() => { /* ignore duplicate */ });
        }
    }

    const updated = Object.keys(updateData).length > 0
        ? await prisma.user.update({ where: { id: userId }, data: updateData })
        : user;

    return c.json({
        success: true,
        data: {
            id: updated.id,
            privyId: updated.privyId,
            walletAddress: updated.walletAddress,
            email: updated.email,
            twitterHandle: updated.twitterHandle,
            displayName: updated.displayName,
            totalEarned: updated.totalEarned,
            credits: updated.credits,
            points: updated.points,
            rating: updated.rating,
            referralCode: updated.referralCode,
            joinedAt: updated.joinedAt,
        },
    });
});

// GET /auth/me — get current user profile + API key for agent
auth.get('/me', async (c) => {
    const userId = getUserId(c);

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            quota: true,
            apiKeys: { where: { isActive: true }, take: 1 },
        },
    });

    if (!user) {
        return c.json({ success: false, error: 'User not found' }, 404);
    }

    // Auto-create key if user has none (legacy users)
    let apiKey = user.apiKeys[0]?.key;
    if (!apiKey) {
        const { randomBytes } = await import('crypto');
        const newKey = `mc_${randomBytes(16).toString('hex')}`;
        await prisma.apiKey.create({
            data: {
                userId: user.id,
                key: newKey,
                name: 'Auto-generated',
                tier: 'free',
                dailyLimit: 10,
            },
        });
        apiKey = newKey;
    }

    return c.json({
        success: true,
        data: {
            id: user.id,
            privyId: user.privyId,
            walletAddress: user.walletAddress,
            email: user.email,
            twitterHandle: user.twitterHandle,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            totalEarned: user.totalEarned,
            credits: user.credits,
            points: user.points,
            rating: user.rating,
            completedTasks: user.completedTasks,
            completedQuests: user.completedQuests,
            referralCode: user.referralCode,
            joinedAt: user.joinedAt,
            quota: user.quota,
            // Masked API key (agent can use /auth/api-key for full key)
            apiKey: apiKey ? `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}` : null,
            hasApiKey: !!apiKey,
        },
    });
});

// GET /auth/api-key — get full API key (for agent setup, one-time retrieval)
auth.get('/api-key', async (c) => {
    const userId = getUserId(c);

    const existing = await prisma.apiKey.findFirst({
        where: { userId, isActive: true },
    });

    if (existing) {
        return c.json({ success: true, data: { key: existing.key, tier: existing.tier, dailyLimit: existing.dailyLimit } });
    }

    // Auto-create if none exists
    const { randomBytes } = await import('crypto');
    const newKey = `mc_${randomBytes(16).toString('hex')}`;
    const created = await prisma.apiKey.create({
        data: { userId, key: newKey, name: 'Auto-generated', tier: 'free', dailyLimit: 10 },
    });

    return c.json({ success: true, data: { key: created.key, tier: created.tier, dailyLimit: created.dailyLimit } });
});

export default auth;
