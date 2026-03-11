import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

// Get latest treasury stats
router.get('/stats', async (_req, res, next) => {
  try {
    const snapshot = await prisma.treasurySnapshot.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!snapshot) {
      // Return default mock data if no snapshot exists
      res.json({
        tvl: 128450000,
        collateralRatio: 104.2,
        treasuryRevenue: 2450000,
        lastPoR: new Date().toISOString(),
        reserveAllocation: {
          tBills: 90,
          liquidity: 7,
          operations: 3,
        },
      });
      return;
    }

    res.json({
      tvl: snapshot.tvl,
      collateralRatio: snapshot.collateralRatio,
      treasuryRevenue: snapshot.treasuryRevenue,
      lastPoR: snapshot.lastPoR.toISOString(),
      reserveAllocation: {
        tBills: snapshot.tBillsPercent,
        liquidity: snapshot.liquidityPercent,
        operations: snapshot.operationsPercent,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
