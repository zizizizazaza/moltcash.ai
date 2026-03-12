import { Hono } from 'hono';
import prisma from '../lib/prisma.js';
import { getUserId } from '../middleware/auth.js';

const comments = new Hono();

// GET /opportunities/:oppId/comments
comments.get('/:oppId', async (c) => {
    const { oppId } = c.req.param();

    const data = await prisma.comment.findMany({
        where: { opportunityId: oppId, parentId: null },
        include: {
            author: { select: { id: true, walletAddress: true, rating: true } },
            replies: {
                include: {
                    author: { select: { id: true, walletAddress: true, rating: true } },
                },
                orderBy: { createdAt: 'asc' },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    return c.json({ success: true, data });
});

// POST /opportunities/:oppId/comments
comments.post('/:oppId', async (c) => {
    const userId = getUserId(c);
    const { oppId } = c.req.param();
    const { content, authorRole } = await c.req.json<{ content: string; authorRole?: string }>();

    if (!content?.trim()) {
        return c.json({ success: false, error: 'Content required' }, 400);
    }

    const comment = await prisma.comment.create({
        data: {
            opportunityId: oppId,
            authorId: userId,
            authorRole: authorRole || 'community',
            content: content.trim(),
        },
        include: {
            author: { select: { id: true, walletAddress: true, rating: true } },
        },
    });

    return c.json({ success: true, data: comment }, 201);
});

// POST /comments/:id/reply
comments.post('/:id/reply', async (c) => {
    const userId = getUserId(c);
    const { id } = c.req.param();
    const { content } = await c.req.json<{ content: string }>();

    const parent = await prisma.comment.findUnique({ where: { id } });
    if (!parent) return c.json({ success: false, error: 'Comment not found' }, 404);
    if (parent.parentId) return c.json({ success: false, error: 'Can only reply to top-level comments' }, 400);

    const reply = await prisma.comment.create({
        data: {
            opportunityId: parent.opportunityId,
            authorId: userId,
            authorRole: 'community',
            content: content.trim(),
            parentId: id,
        },
        include: {
            author: { select: { id: true, walletAddress: true, rating: true } },
        },
    });

    return c.json({ success: true, data: reply }, 201);
});

// POST /comments/:id/like
comments.post('/:id/like', async (c) => {
    const { id } = c.req.param();

    const updated = await prisma.comment.update({
        where: { id },
        data: { likes: { increment: 1 } },
    });

    return c.json({ success: true, data: { likes: updated.likes } });
});

// DELETE /comments/:id
comments.delete('/:id', async (c) => {
    const userId = getUserId(c);
    const { id } = c.req.param();

    const comment = await prisma.comment.findFirst({ where: { id, authorId: userId } });
    if (!comment) return c.json({ success: false, error: 'Comment not found or unauthorized' }, 404);

    await prisma.comment.delete({ where: { id } });
    return c.json({ success: true, data: { message: 'Deleted' } });
});

export default comments;
