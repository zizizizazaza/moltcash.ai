import { Hono } from 'hono';
import prisma from '../lib/prisma.js';

const leaderboard = new Hono();

// GET /leaderboard — public leaderboard
leaderboard.get('/', async (c) => {
    const sort = c.req.query('sort') || 'points'; // points | credits | totalEarned
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);

    const orderByField = sort === 'credits' ? 'credits'
        : sort === 'totalEarned' ? 'totalEarned'
        : 'points';

    const users = await prisma.user.findMany({
        select: {
            id: true,
            displayName: true,
            walletAddress: true,
            twitterHandle: true,
            avatarUrl: true,
            totalEarned: true,
            credits: true,
            points: true,
            rating: true,
            completedTasks: true,
            completedQuests: true,
            joinedAt: true,
        },
        orderBy: { [orderByField]: 'desc' },
        take: limit,
    });

    // Add rank
    const ranked = users.map((u, i) => ({
        rank: i + 1,
        ...u,
        // Mask wallet address for privacy
        walletAddress: u.walletAddress
            ? `${u.walletAddress.slice(0, 6)}...${u.walletAddress.slice(-4)}`
            : null,
    }));

    return c.json({ success: true, data: ranked });
});

export default leaderboard;
