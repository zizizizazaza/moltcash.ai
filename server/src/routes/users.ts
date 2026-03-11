import { Router } from 'express';
import prisma from '../db.js';
import { authRequired, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';

const router = Router();

// Get user profile
router.get('/profile', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });
    if (!user) throw new AppError('User not found', 404);

    const { ...profile } = user;
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

// Update user profile
const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional(),
  walletAddress: z.string().optional(),
});

router.patch('/profile', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
