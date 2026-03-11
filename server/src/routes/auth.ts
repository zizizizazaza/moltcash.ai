import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { config } from '../config.js';
import prisma from '../db.js';
import { authRequired, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

function generateToken(userId: string): string {
  return jwt.sign({ userId }, config.jwt.secret, { expiresIn: config.jwt.expiresIn as any });
}

// Email login (simplified for dev - creates user if not exists)
const emailLoginSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

router.post('/login/email', async (req, res, next) => {
  try {
    const { email, name } = emailLoginSchema.parse(req.body);

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          authProvider: 'email',
        },
      });
    }

    const token = generateToken(user.id);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        walletAddress: user.walletAddress,
        kycStatus: user.kycStatus,
        creditScore: user.creditScore,
      },
    });
  } catch (err) {
    next(err);
  }
});

// OAuth login placeholder (Google, Apple, X)
const oauthLoginSchema = z.object({
  provider: z.enum(['google', 'apple', 'x']),
  providerId: z.string(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  avatar: z.string().url().optional(),
});

router.post('/login/oauth', async (req, res, next) => {
  try {
    const { provider, providerId, email, name, avatar } = oauthLoginSchema.parse(req.body);

    // Find by provider ID or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { authProvider: provider, authProviderId: providerId },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          avatar,
          authProvider: provider,
          authProviderId: providerId,
        },
      });
    }

    const token = generateToken(user.id);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        walletAddress: user.walletAddress,
        kycStatus: user.kycStatus,
        creditScore: user.creditScore,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Get current user
router.get('/me', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        walletAddress: true,
        kycStatus: true,
        creditScore: true,
        riskAccepted: true,
        createdAt: true,
      },
    });
    if (!user) throw new AppError('User not found', 404);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Accept risk disclaimer
router.post('/accept-risk', authRequired, async (req: AuthRequest, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.userId },
      data: { riskAccepted: true },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
