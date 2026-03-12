import { Hono } from 'hono';
import prisma from '../lib/prisma.js';
import { getUserId } from '../middleware/auth.js';

const pointsRouter = new Hono();

// GET /points — get user's credits and points summary
pointsRouter.get('/', async (c) => {
    const userId = getUserId(c);

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true, points: true },
    });

    if (!user) return c.json({ success: false, error: 'User not found' }, 404);

    // Weekly credits earned (for cap check)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);

    const weeklyCredits = await prisma.pointsLedger.aggregate({
        where: {
            userId,
            type: 'earn',
            createdAt: { gte: weekStart },
        },
        _sum: { credits: true },
    });

    return c.json({
        success: true,
        data: {
            credits: user.credits,
            points: user.points,
            weeklyCreditsEarned: weeklyCredits._sum.credits || 0,
            weeklyCreditsLimit: 3000,
        },
    });
});

// GET /points/history — get points ledger
pointsRouter.get('/history', async (c) => {
    const userId = getUserId(c);
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');

    const [data, total] = await Promise.all([
        prisma.pointsLedger.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.pointsLedger.count({ where: { userId } }),
    ]);

    return c.json({
        success: true,
        data,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
});

// Internal: award credits/points to a user (used by other routes)
export async function awardPoints(
    userId: string,
    source: string,
    credits: number,
    points: number,
    note?: string,
) {
    // Check weekly cap for credits (3000/week)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weeklyCredits = await prisma.pointsLedger.aggregate({
        where: {
            userId,
            type: 'earn',
            createdAt: { gte: weekStart },
        },
        _sum: { credits: true },
    });

    const currentWeekly = weeklyCredits._sum.credits || 0;
    const cappedCredits = Math.min(credits, 3000 - currentWeekly);

    if (cappedCredits <= 0 && points <= 0) {
        return { awarded: false, reason: 'Weekly credits cap reached' };
    }

    const actualCredits = Math.max(0, cappedCredits);

    // Create ledger entry
    await prisma.pointsLedger.create({
        data: {
            userId,
            type: 'earn',
            source,
            credits: actualCredits,
            points,
            note,
        },
    });

    // Update user totals
    await prisma.user.update({
        where: { id: userId },
        data: {
            credits: { increment: actualCredits },
            points: { increment: points },
        },
    });

    return { awarded: true, credits: actualCredits, points };
}

export default pointsRouter;
