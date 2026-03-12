import { Hono } from 'hono';
import prisma from '../lib/prisma.js';
import { getUserId } from '../middleware/auth.js';
import { validateBody, createSessionSchema } from '../lib/validators.js';

const sessions = new Hono();

// POST /sessions — create a farm session
sessions.post('/', async (c) => {
    const userId = getUserId(c);
    const { opportunityId } = await validateBody(c, createSessionSchema);

    // Find opportunity
    const opp = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
    if (!opp) {
        return c.json({ success: false, error: 'Opportunity not found' }, 404);
    }
    if (opp.type === 'task') {
        return c.json({ success: false, error: 'Tasks use the apply flow, not farm sessions' }, 400);
    }

    // Check quota
    const quota = await prisma.quota.findUnique({ where: { userId } });
    if (!quota) {
        return c.json({ success: false, error: 'User quota not found' }, 500);
    }

    if (opp.type === 'quest' && quota.questsUsed >= 20) {
        return c.json({ success: false, error: 'Quest free quota exceeded (20/month). Execution fee: $0.5' }, 403);
    }
    if (opp.type === 'testnet' && quota.testnetInteractions >= 50) {
        return c.json({ success: false, error: 'Testnet free quota exceeded (50/month).' }, 403);
    }

    // Parse steps
    let steps: any[] = [];
    try {
        steps = opp.steps ? JSON.parse(opp.steps) : [];
    } catch { steps = []; }

    // Create session
    const session = await prisma.farmSession.create({
        data: {
            opportunityId: opp.id,
            userId,
            totalSteps: steps.length || 1,
        },
    });

    // Update quota
    if (opp.type === 'quest') {
        await prisma.quota.update({
            where: { userId },
            data: { questsUsed: { increment: 1 } },
        });
    }
    if (opp.type === 'testnet') {
        await prisma.quota.update({
            where: { userId },
            data: { testnetInteractions: { increment: 1 } },
        });
    }

    // Increment participant count
    await prisma.opportunity.update({
        where: { id: opp.id },
        data: { participantCount: { increment: 1 } },
    });

    return c.json({ success: true, data: session }, 201);
});

// POST /sessions/:id/start — start execution (creates real Execution record)
sessions.post('/:id/start', async (c) => {
    const userId = getUserId(c);
    const { id } = c.req.param();

    const session = await prisma.farmSession.findFirst({
        where: { id, userId },
        include: { opportunity: true },
    });
    if (!session) {
        return c.json({ success: false, error: 'Session not found' }, 404);
    }
    if (session.status !== 'pending' && session.status !== 'paused') {
        return c.json({ success: false, error: `Cannot start session with status: ${session.status}` }, 400);
    }

    // Update session to running
    const updated = await prisma.farmSession.update({
        where: { id },
        data: { status: 'running' },
    });

    // Create Execution record linked to session
    const execution = await prisma.execution.create({
        data: {
            userId,
            opportunityId: session.opportunityId,
            action: session.opportunity.type === 'yield' ? 'deposit' :
                    session.opportunity.type === 'quest' ? 'quest-onchain' : 'testnet-swap',
            chain: session.opportunity.chain || 'ethereum',
            status: 'executing',
            executionParams: JSON.stringify({
                sessionId: session.id,
                title: session.opportunity.title,
                source: session.opportunity.source,
                sourceUrl: session.opportunity.sourceUrl,
            }),
        },
    });

    return c.json({
        success: true,
        data: {
            ...updated,
            executionId: execution.id,
            message: 'Use the DeFi Executor skill to complete this task. Report txHash via /executions/verify.',
        },
    });
});

// POST /sessions/:id/complete — mark completed with txHash
sessions.post('/:id/complete', async (c) => {
    const userId = getUserId(c);
    const { id } = c.req.param();
    const body = await c.req.json().catch(() => ({}));
    const { txHash } = body;

    const session = await prisma.farmSession.findFirst({
        where: { id, userId, status: 'running' },
    });
    if (!session) {
        return c.json({ success: false, error: 'Running session not found' }, 404);
    }

    const existingHashes = JSON.parse(session.txHashes || '[]');
    if (txHash) existingHashes.push(txHash);

    const updated = await prisma.farmSession.update({
        where: { id },
        data: {
            status: 'completed',
            completedAt: new Date(),
            txHashes: JSON.stringify(existingHashes),
            currentStep: session.totalSteps,
            reward: 'Claimed',
        },
    });

    return c.json({ success: true, data: updated });
});

// POST /sessions/:id/pause
sessions.post('/:id/pause', async (c) => {
    const userId = getUserId(c);
    const { id } = c.req.param();

    const session = await prisma.farmSession.findFirst({
        where: { id, userId, status: 'running' },
    });
    if (!session) {
        return c.json({ success: false, error: 'Running session not found' }, 404);
    }

    const updated = await prisma.farmSession.update({
        where: { id },
        data: { status: 'paused' },
    });

    return c.json({ success: true, data: updated });
});

// GET /sessions/:id — get session + linked execution status
sessions.get('/:id', async (c) => {
    const { id } = c.req.param();

    const session = await prisma.farmSession.findUnique({
        where: { id },
        include: {
            opportunity: { select: { title: true, type: true, chain: true, reward: true } },
        },
    });

    if (!session) {
        return c.json({ success: false, error: 'Session not found' }, 404);
    }

    // Fetch linked execution
    const execution = await prisma.execution.findFirst({
        where: { opportunityId: session.opportunityId, userId: session.userId },
        orderBy: { createdAt: 'desc' },
    });

    return c.json({
        success: true,
        data: {
            ...session,
            txHashes: JSON.parse(session.txHashes),
            logs: session.logs ? JSON.parse(session.logs) : [],
            execution: execution ? {
                id: execution.id,
                status: execution.status,
                txHash: execution.txHash,
                creditsEarned: execution.creditsEarned,
                blockNumber: execution.blockNumber,
            } : null,
        },
    });
});

// GET /sessions — list user's sessions
sessions.get('/', async (c) => {
    const userId = getUserId(c);
    const status = c.req.query('status');

    const where: any = { userId };
    if (status && status !== 'all') where.status = status;

    const data = await prisma.farmSession.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        include: {
            opportunity: { select: { title: true, type: true, chain: true, reward: true } },
        },
    });

    return c.json({
        success: true,
        data: data.map((s) => ({
            ...s,
            txHashes: JSON.parse(s.txHashes),
        })),
    });
});

export default sessions;
