import { Hono } from 'hono';
import prisma from '../lib/prisma.js';
import { getUserId } from '../middleware/auth.js';

const reviews = new Hono();

// POST /reviews/:opportunityId — submit review after task completion
reviews.post('/:opportunityId', async (c) => {
    const userId = getUserId(c);
    const { opportunityId } = c.req.param();
    const { rating, comment } = await c.req.json<{ rating: number; comment?: string }>();

    if (!rating || rating < 1 || rating > 5) {
        return c.json({ success: false, error: 'Rating must be 1-5' }, 400);
    }

    // Verify task is completed
    const task = await prisma.opportunity.findFirst({
        where: { id: opportunityId, type: 'task', status: 'completed' },
    });
    if (!task) {
        return c.json({ success: false, error: 'Completed task not found' }, 404);
    }

    // Determine target: publisher reviews executor, executor reviews publisher
    let targetId: string;
    if (userId === task.publisherId) {
        // Publisher reviewing executor
        if (!task.assignedTo) return c.json({ success: false, error: 'No executor assigned' }, 400);
        targetId = task.assignedTo;
    } else if (userId === task.assignedTo) {
        // Executor reviewing publisher  
        if (!task.publisherId) return c.json({ success: false, error: 'No publisher found' }, 400);
        targetId = task.publisherId;
    } else {
        return c.json({ success: false, error: 'Only publisher or executor can review' }, 403);
    }

    // Check if already reviewed
    const existing = await prisma.review.findFirst({
        where: { opportunityId, authorId: userId },
    });
    if (existing) {
        return c.json({ success: false, error: 'Already reviewed' }, 400);
    }

    // Create review
    const review = await prisma.review.create({
        data: {
            opportunityId,
            authorId: userId,
            targetId,
            rating,
            comment: comment || null,
        },
    });

    // Update target's average rating
    const allReviews = await prisma.review.findMany({
        where: { targetId },
        select: { rating: true },
    });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.user.update({
        where: { id: targetId },
        data: { rating: +avgRating.toFixed(1) },
    });

    return c.json({ success: true, data: review }, 201);
});

// GET /reviews/:opportunityId — get reviews for a task
reviews.get('/:opportunityId', async (c) => {
    const { opportunityId } = c.req.param();

    const data = await prisma.review.findMany({
        where: { opportunityId },
        include: {
            author: { select: { id: true, walletAddress: true } },
            target: { select: { id: true, walletAddress: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    return c.json({ success: true, data });
});

// GET /reviews/user/:userId — get all reviews for a user
reviews.get('/user/:userId', async (c) => {
    const { userId } = c.req.param();

    const [received, given] = await Promise.all([
        prisma.review.findMany({
            where: { targetId: userId },
            include: {
                author: { select: { id: true, walletAddress: true } },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.review.findMany({
            where: { authorId: userId },
            include: {
                target: { select: { id: true, walletAddress: true } },
            },
            orderBy: { createdAt: 'desc' },
        }),
    ]);

    return c.json({ success: true, data: { received, given } });
});

export default reviews;
