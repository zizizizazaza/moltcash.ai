import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db.js';
type Tx = Omit<typeof prisma, '$transaction' | '$connect' | '$disconnect' | '$on' | '$extends'>;
import { authRequired, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Get portfolio holdings
router.get('/holdings', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const holdings = await prisma.portfolioHolding.findMany({
      where: { userId: req.userId },
    });
    res.json(holdings);
  } catch (err) {
    next(err);
  }
});

// Get transaction history
router.get('/history', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(transactions);
  } catch (err) {
    next(err);
  }
});

// Get investments
router.get('/investments', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const investments = await prisma.investment.findMany({
      where: { userId: req.userId },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            apy: true,
            status: true,
            coverImage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(investments);
  } catch (err) {
    next(err);
  }
});

// ============ Mint AIUSD (Deposit USDC → AIUSD) ============
const mintSchema = z.object({
  amount: z.number().positive(),
});

router.post('/mint', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const { amount } = mintSchema.parse(req.body);
    const userId = req.userId as string;

    const result = await prisma.$transaction(async (tx: Tx) => {
      // Upsert AIUSD holding
      const existing = await tx.portfolioHolding.findUnique({
        where: { userId_asset: { userId, asset: 'AIUSD' } },
      });

      if (existing) {
        await tx.portfolioHolding.update({
          where: { id: existing.id },
          data: { amount: existing.amount + amount, currentApy: 5.24 },
        });
      } else {
        await tx.portfolioHolding.create({
          data: { userId, asset: 'AIUSD', amount, avgCost: 1.0, currentApy: 5.24 },
        });
      }

      const transaction = await tx.transaction.create({
        data: { userId, type: 'MINT', amount, asset: 'AIUSD', status: 'COMPLETED' },
      });

      return transaction;
    });

    res.status(201).json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    next(err);
  }
});

// ============ Redeem AIUSD (AIUSD → USDC) ============
router.post('/redeem', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const { amount } = mintSchema.parse(req.body);
    const userId = req.userId as string;

    const result = await prisma.$transaction(async (tx: Tx) => {
      const holding = await tx.portfolioHolding.findUnique({
        where: { userId_asset: { userId, asset: 'AIUSD' } },
      });

      if (!holding || holding.amount < amount) {
        throw new AppError('Insufficient AIUSD balance', 400);
      }

      if (holding.amount === amount) {
        await tx.portfolioHolding.delete({ where: { id: holding.id } });
      } else {
        await tx.portfolioHolding.update({
          where: { id: holding.id },
          data: { amount: holding.amount - amount },
        });
      }

      const transaction = await tx.transaction.create({
        data: { userId, type: 'REDEEM', amount, asset: 'AIUSD', status: 'COMPLETED' },
      });

      return transaction;
    });

    res.status(201).json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    next(err);
  }
});

export default router;
