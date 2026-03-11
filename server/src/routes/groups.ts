import { Router } from 'express';
import prisma from '../db.js';
import { authRequired, type AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

// List groups
router.get('/', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const groups = await prisma.groupChat.findMany({
      include: {
        project: { select: { id: true, title: true, status: true } },
        members: { select: { userId: true, role: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(groups);
  } catch (err) {
    next(err);
  }
});

// Get group messages
router.get('/:id/messages', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const messages = await prisma.groupMessage.findMany({
      where: { groupId: req.params.id as string },
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
    res.json(messages);
  } catch (err) {
    next(err);
  }
});

// Send group message
const sendGroupMessageSchema = z.object({
  content: z.string().min(1).max(5000),
});

router.post('/:id/messages', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const { content } = sendGroupMessageSchema.parse(req.body);

    // Verify user is a member
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId: req.params.id as string, userId: req.userId! },
      },
    });

    if (!member) {
      res.status(403).json({ error: 'Not a member of this group' });
      return;
    }

    const message = await prisma.groupMessage.create({
      data: {
        groupId: req.params.id as string,
        userId: req.userId!,
        content,
        role: member.role,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });

    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
});

export default router;
