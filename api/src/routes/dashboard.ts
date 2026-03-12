import { Hono } from 'hono';
import prisma from '../lib/prisma.js';
import { getUserId } from '../middleware/auth.js';

const dashboard = new Hono();

// GET /dashboard/stats
dashboard.get('/stats', async (c) => {
    const userId = getUserId(c);

    const [user, activeFarms, totalGas, quota] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.farmSession.count({ where: { userId, status: 'running' } }),
        prisma.farmSession.aggregate({ where: { userId }, _sum: { gasSpent: true } }),
        prisma.quota.findUnique({ where: { userId } }),
    ]);

    return c.json({
        success: true,
        data: {
            totalEarned: user?.totalEarned || 0,
            credits: user?.credits || 0,
            points: user?.points || 0,
            activeFarms,
            gasSpent: totalGas._sum.gasSpent || 0,
            completedQuests: user?.completedQuests || 0,
            completedTasks: user?.completedTasks || 0,
            rating: user?.rating || 0,
            referralCode: user?.referralCode || '',
            quota: quota
                ? {
                    questsUsed: quota.questsUsed,
                    questsTotal: 20,
                    testnetInteractions: quota.testnetInteractions,
                    testnetInteractionsTotal: 100,
                    yieldDeposited: quota.yieldDeposited,
                    yieldLimit: 500,
                }
                : null,
        },
    });
});

// GET /dashboard/active-farms
dashboard.get('/active-farms', async (c) => {
    const userId = getUserId(c);

    const data = await prisma.farmSession.findMany({
        where: { userId, status: { in: ['running', 'paused', 'pending'] } },
        include: {
            opportunity: { select: { title: true, type: true, chain: true, reward: true } },
        },
        orderBy: { startedAt: 'desc' },
    });

    return c.json({
        success: true,
        data: data.map((s) => ({
            ...s,
            txHashes: JSON.parse(s.txHashes),
            progress: s.totalSteps > 0 ? Math.round((s.currentStep / s.totalSteps) * 100) : 0,
        })),
    });
});

// GET /dashboard/history
dashboard.get('/history', async (c) => {
    const userId = getUserId(c);
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');

    const [data, total] = await Promise.all([
        prisma.farmSession.findMany({
            where: { userId, status: { in: ['completed', 'failed'] } },
            include: {
                opportunity: { select: { title: true, type: true, chain: true, reward: true } },
            },
            orderBy: { completedAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.farmSession.count({
            where: { userId, status: { in: ['completed', 'failed'] } },
        }),
    ]);

    return c.json({
        success: true,
        data: data.map((s) => ({ ...s, txHashes: JSON.parse(s.txHashes) })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
});

// GET /dashboard/transactions
dashboard.get('/transactions', async (c) => {
    const userId = getUserId(c);
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');

    const [data, total] = await Promise.all([
        prisma.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.transaction.count({ where: { userId } }),
    ]);

    return c.json({
        success: true,
        data,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
});

export default dashboard;
