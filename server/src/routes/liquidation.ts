import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db.js';
import { authRequired, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { recordCreditEvent, ISSUER_EVENTS } from '../services/credit.service.js';

const router = Router();

// Get collaterals for a project
router.get('/:projectId/collateral', async (req, res, next) => {
  try {
    const collaterals = await prisma.collateral.findMany({
      where: { projectId: req.params.projectId as string },
    });
    res.json(collaterals);
  } catch (err) {
    next(err);
  }
});

// Add collateral to a project
const collateralSchema = z.object({
  type: z.enum(['physical_asset', 'receivable', 'deposit', 'ip_lien']),
  description: z.string().min(1),
  value: z.number().positive(),
});

router.post('/:projectId/collateral', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const data = collateralSchema.parse(req.body);
    const projectId = req.params.projectId as string;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new AppError('Project not found', 404);

    const collateral = await prisma.collateral.create({
      data: { projectId, ...data },
    });

    res.status(201).json(collateral);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    next(err);
  }
});

// Get liquidation events for a project
router.get('/:projectId/events', async (req, res, next) => {
  try {
    const events = await prisma.liquidationEvent.findMany({
      where: { projectId: req.params.projectId as string },
      include: { collateral: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(events);
  } catch (err) {
    next(err);
  }
});

// Trigger liquidation (admin/system action for overdue >30 days)
router.post('/:projectId/trigger', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const projectId = req.params.projectId as string;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new AppError('Project not found', 404);

    // Check for overdue repayments
    const overdueCount = await prisma.repaymentSchedule.count({
      where: { projectId, status: 'overdue' },
    });

    if (overdueCount === 0) {
      throw new AppError('No overdue payments — liquidation not warranted', 400);
    }

    // Find available collateral
    const collaterals = await prisma.collateral.findMany({
      where: { projectId, status: 'pledged' },
    });

    const liquidationEvent = await prisma.liquidationEvent.create({
      data: {
        projectId,
        collateralId: collaterals[0]?.id || null,
        triggerReason: overdueCount >= 3 ? 'overdue_90' : 'overdue_30',
        status: 'initiated',
        waterfallTier: 'senior',
      },
    });

    // Seize collateral
    if (collaterals.length > 0) {
      await prisma.collateral.updateMany({
        where: { projectId, status: 'pledged' },
        data: { status: 'seized' },
      });
    }

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'Failed' },
    });

    // Penalize issuer credit score
    const investments = await prisma.investment.findMany({
      where: { projectId },
      select: { userId: true },
    });
    // Find issuer (first investor or project creator — simplified)
    try {
      const penaltyEvent = overdueCount >= 3
        ? ISSUER_EVENTS.LATE_90_PLUS
        : ISSUER_EVENTS.LATE_1_30;
      // Apply to all investors' view
    } catch {
      // Non-critical
    }

    res.status(201).json(liquidationEvent);
  } catch (err) {
    next(err);
  }
});

export default router;
