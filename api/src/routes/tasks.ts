import { Hono } from 'hono';
import prisma from '../lib/prisma.js';
import { getUserId } from '../middleware/auth.js';
import { validateBody, createTaskSchema, applyTaskSchema, submitTaskSchema, updateTaskSchema, requestRevisionSchema } from '../lib/validators.js';

const tasks = new Hono();

// POST /tasks — publish a new task
tasks.post('/', async (c) => {
    const userId = getUserId(c);
    const body = await validateBody(c, createTaskSchema);

    const task = await prisma.opportunity.create({
        data: {
            type: 'task',
            title: body.title,
            description: body.description,
            source: 'MoltCash',
            chain: 'Base',
            reward: body.reward || `${body.rewardAmount} USDC`,
            rewardType: 'fixed',
            rewardAmount: body.rewardAmount,
            difficulty: body.difficulty || 'Medium',
            timeEstimate: body.timeEstimate || '1-2 days',
            tags: JSON.stringify(body.tags || []),
            deadline: body.deadline ? new Date(body.deadline) : null,
            status: 'active',
            publisherId: userId,
        },
    });

    return c.json({ success: true, data: { ...task, tags: JSON.parse(task.tags) } }, 201);
});

// PUT /tasks/:id — edit (only when open)
tasks.put('/:id', async (c) => {
    const userId = getUserId(c);
    const { id } = c.req.param();
    const body = await c.req.json();

    const task = await prisma.opportunity.findFirst({
        where: { id, publisherId: userId, type: 'task' },
    });
    if (!task) return c.json({ success: false, error: 'Task not found' }, 404);
    if (task.status !== 'open') return c.json({ success: false, error: 'Can only edit tasks in open status' }, 400);

    const updated = await prisma.opportunity.update({
        where: { id },
        data: {
            ...(body.title && { title: body.title }),
            ...(body.description && { description: body.description }),
            ...(body.rewardAmount && { rewardAmount: body.rewardAmount, reward: `${body.rewardAmount} USDC` }),
            ...(body.tags && { tags: JSON.stringify(body.tags) }),
            ...(body.deadline && { deadline: new Date(body.deadline) }),
        },
    });

    return c.json({ success: true, data: { ...updated, tags: JSON.parse(updated.tags) } });
});

// DELETE /tasks/:id — cancel
tasks.delete('/:id', async (c) => {
    const userId = getUserId(c);
    const { id } = c.req.param();

    const task = await prisma.opportunity.findFirst({
        where: { id, publisherId: userId, type: 'task' },
    });
    if (!task) return c.json({ success: false, error: 'Task not found' }, 404);
    if (task.status !== 'open') return c.json({ success: false, error: 'Can only cancel open tasks' }, 400);

    await prisma.opportunity.update({
        where: { id },
        data: { status: 'cancelled' },
    });

    return c.json({ success: true, data: { message: 'Task cancelled' } });
});

// POST /tasks/:id/apply — apply for a task
tasks.post('/:id/apply', async (c) => {
    const userId = getUserId(c);
    const { id } = c.req.param();
    const { message } = await c.req.json<{ message: string }>();

    const task = await prisma.opportunity.findFirst({
        where: { id, type: 'task', status: 'open' },
    });
    if (!task) return c.json({ success: false, error: 'Open task not found' }, 404);

    // Check if already applied
    const existing = await prisma.application.findFirst({
        where: { opportunityId: id, applicantId: userId },
    });
    if (existing) return c.json({ success: false, error: 'Already applied' }, 400);

    const app = await prisma.application.create({
        data: {
            opportunityId: id,
            applicantId: userId,
            message: message || '',
        },
    });

    // Bump participant count
    await prisma.opportunity.update({
        where: { id },
        data: { participantCount: { increment: 1 } },
    });

    return c.json({ success: true, data: app }, 201);
});

// GET /tasks/:id/applications — list applicants (publisher only)
tasks.get('/:id/applications', async (c) => {
    const userId = getUserId(c);
    const { id } = c.req.param();

    const task = await prisma.opportunity.findFirst({
        where: { id, publisherId: userId, type: 'task' },
    });
    if (!task) return c.json({ success: false, error: 'Task not found or unauthorized' }, 404);

    const apps = await prisma.application.findMany({
        where: { opportunityId: id },
        include: {
            applicant: {
                select: { id: true, walletAddress: true, rating: true, completedTasks: true },
            },
        },
        orderBy: { appliedAt: 'desc' },
    });

    return c.json({ success: true, data: apps });
});

// POST /tasks/:id/assign — select an applicant (publisher)
tasks.post('/:id/assign', async (c) => {
    const userId = getUserId(c);
    const { id } = c.req.param();
    const { applicationId } = await c.req.json<{ applicationId: string }>();

    const task = await prisma.opportunity.findFirst({
        where: { id, publisherId: userId, type: 'task', status: 'open' },
    });
    if (!task) return c.json({ success: false, error: 'Open task not found or unauthorized' }, 404);

    const app = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!app || app.opportunityId !== id) {
        return c.json({ success: false, error: 'Application not found' }, 404);
    }

    // Select this, reject others
    await prisma.$transaction([
        prisma.application.update({ where: { id: applicationId }, data: { status: 'selected' } }),
        prisma.application.updateMany({
            where: { opportunityId: id, id: { not: applicationId } },
            data: { status: 'rejected' },
        }),
        prisma.opportunity.update({
            where: { id },
            data: { status: 'in_progress', assignedTo: app.applicantId },
        }),
    ]);

    return c.json({ success: true, data: { message: 'Applicant assigned' } });
});

// POST /tasks/:id/submit — submit deliverable (executor)
tasks.post('/:id/submit', async (c) => {
    const userId = getUserId(c);
    const { id } = c.req.param();
    const { description, attachmentUrl } = await c.req.json<{
        description: string;
        attachmentUrl?: string;
    }>();

    const task = await prisma.opportunity.findFirst({
        where: { id, assignedTo: userId, type: 'task' },
    });
    if (!task) return c.json({ success: false, error: 'Assigned task not found' }, 404);
    if (!['in_progress', 'revision'].includes(task.status)) {
        return c.json({ success: false, error: 'Task not in submittable status' }, 400);
    }

    const app = await prisma.application.findFirst({
        where: { opportunityId: id, applicantId: userId, status: 'selected' },
    });
    if (!app) return c.json({ success: false, error: 'Application not found' }, 404);

    const deliverable = await prisma.deliverable.create({
        data: {
            applicationId: app.id,
            description,
            attachmentUrl,
        },
    });

    await prisma.opportunity.update({
        where: { id },
        data: { status: 'submitted' },
    });

    return c.json({ success: true, data: deliverable }, 201);
});

// POST /tasks/:id/approve — approve deliverable (publisher)
tasks.post('/:id/approve', async (c) => {
    const userId = getUserId(c);
    const { id } = c.req.param();

    const task = await prisma.opportunity.findFirst({
        where: { id, publisherId: userId, type: 'task', status: 'submitted' },
    });
    if (!task) return c.json({ success: false, error: 'Submitted task not found' }, 404);

    // Record transactions (mock — real version uses smart contract)
    const bounty = task.rewardAmount || 0;
    const platformFee = bounty * 0.15;
    const agentPayout = bounty - platformFee;

    await prisma.$transaction([
        prisma.opportunity.update({ where: { id }, data: { status: 'completed' } }),
        // Agent earns
        prisma.transaction.create({
            data: {
                userId: task.assignedTo!,
                type: 'task_bounty',
                amount: agentPayout,
                description: `Bounty for: ${task.title}`,
            },
        }),
        // Platform fee
        prisma.transaction.create({
            data: {
                userId,
                type: 'platform_fee',
                amount: -platformFee,
                description: `Platform fee for: ${task.title}`,
            },
        }),
        // Update agent stats
        prisma.user.update({
            where: { id: task.assignedTo! },
            data: {
                totalEarned: { increment: agentPayout },
                completedTasks: { increment: 1 },
            },
        }),
    ]);

    return c.json({
        success: true,
        data: { message: 'Task approved', agentPayout, platformFee },
    });
});

// POST /tasks/:id/request-revision — ask for revision (publisher)
tasks.post('/:id/request-revision', async (c) => {
    const userId = getUserId(c);
    const { id } = c.req.param();
    const { note } = await c.req.json<{ note: string }>();

    const task = await prisma.opportunity.findFirst({
        where: { id, publisherId: userId, type: 'task', status: 'submitted' },
    });
    if (!task) return c.json({ success: false, error: 'Submitted task not found' }, 404);

    // Check revision count
    const app = await prisma.application.findFirst({
        where: { opportunityId: id, status: 'selected' },
        include: { deliverables: true },
    });
    if (app && app.deliverables.length >= 3) {
        return c.json({ success: false, error: 'Maximum revisions (3) reached' }, 400);
    }

    // Mark latest deliverable
    if (app) {
        const latest = app.deliverables[app.deliverables.length - 1];
        if (latest) {
            await prisma.deliverable.update({
                where: { id: latest.id },
                data: { status: 'revision_needed', reviewNote: note },
            });
        }
    }

    await prisma.opportunity.update({
        where: { id },
        data: { status: 'revision' },
    });

    return c.json({ success: true, data: { message: 'Revision requested' } });
});

// GET /my/tasks/published
tasks.get('/my/published', async (c) => {
    const userId = getUserId(c);
    const data = await prisma.opportunity.findMany({
        where: { publisherId: userId, type: 'task' },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { applications: true } } },
    });

    return c.json({
        success: true,
        data: data.map((t) => ({ ...t, tags: JSON.parse(t.tags), applicationCount: t._count.applications })),
    });
});

// GET /my/tasks/applied
tasks.get('/my/applied', async (c) => {
    const userId = getUserId(c);
    const apps = await prisma.application.findMany({
        where: { applicantId: userId },
        include: {
            opportunity: { select: { id: true, title: true, status: true, reward: true } },
        },
        orderBy: { appliedAt: 'desc' },
    });

    return c.json({ success: true, data: apps });
});

export default tasks;
