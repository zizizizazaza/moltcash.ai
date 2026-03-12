import { Hono } from 'hono';
import prisma from '../lib/prisma.js';

const opportunities = new Hono();

// GET /opportunities — list with filters
opportunities.get('/', async (c) => {
    const type = c.req.query('type');        // quest | testnet | yield | task
    const chain = c.req.query('chain');
    const status = c.req.query('status');
    const hot = c.req.query('hot');
    const sort = c.req.query('sort') || 'createdAt';
    const order = c.req.query('order') || 'desc';
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');

    const where: any = {};
    if (type) where.type = type;
    if (chain) where.chain = chain;
    // Default to active only unless explicitly requested
    where.status = status || 'active';
    if (hot === 'true') where.isHot = true;

    const [data, total] = await Promise.all([
        prisma.opportunity.findMany({
            where,
            orderBy: { [sort]: order },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                _count: { select: { comments: true, applications: true, farmSessions: true } },
            },
        }),
        prisma.opportunity.count({ where }),
    ]);

    // Parse JSON string fields
    const parsed = data.map((o) => ({
        ...o,
        tags: JSON.parse(o.tags),
        steps: o.steps ? JSON.parse(o.steps) : null,
        txHashes: undefined,
        commentCount: o._count.comments,
        applicationCount: o._count.applications,
        farmCount: o._count.farmSessions,
        _count: undefined,
    }));

    return c.json({
        success: true,
        data: parsed,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
});

// GET /opportunities/hot — hot today
opportunities.get('/hot', async (c) => {
    const data = await prisma.opportunity.findMany({
        where: { isHot: true, status: 'active' },
        orderBy: { createdAt: 'desc' },
        take: 6,
    });

    const parsed = data.map((o) => ({
        ...o,
        tags: JSON.parse(o.tags),
        steps: o.steps ? JSON.parse(o.steps) : null,
    }));

    return c.json({ success: true, data: parsed });
});

// GET /opportunities/:id — detail
opportunities.get('/:id', async (c) => {
    const { id } = c.req.param();

    const data = await prisma.opportunity.findUnique({
        where: { id },
        include: {
            publisher: {
                select: { id: true, walletAddress: true, rating: true, completedTasks: true },
            },
            _count: { select: { comments: true, applications: true, farmSessions: true } },
        },
    });

    if (!data) {
        return c.json({ success: false, error: 'Opportunity not found' }, 404);
    }

    return c.json({
        success: true,
        data: {
            ...data,
            tags: JSON.parse(data.tags),
            steps: data.steps ? JSON.parse(data.steps) : null,
            commentCount: data._count.comments,
            applicationCount: data._count.applications,
            farmCount: data._count.farmSessions,
            _count: undefined,
        },
    });
});

export default opportunities;
