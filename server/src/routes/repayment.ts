import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db.js';
import { authRequired, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { recordCreditEvent, ISSUER_EVENTS } from '../services/credit.service.js';
import { emitToUser } from '../socket/index.js';

const router = Router();

// Get repayment schedule for a project
router.get('/:projectId/schedule', async (req, res, next) => {
  try {
    const projectId = req.params.projectId as string;
    const schedule = await prisma.repaymentSchedule.findMany({
      where: { projectId },
      orderBy: { periodNumber: 'asc' },
    });
    res.json(schedule);
  } catch (err) {
    next(err);
  }
});

// Create repayment schedule for a project (issuer action)
const scheduleSchema = z.object({
  periods: z.number().int().min(1).max(60),
});

router.post('/:projectId/schedule', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const projectId = req.params.projectId as string;
    const { periods } = scheduleSchema.parse(req.body);

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new AppError('Project not found', 404);
    if (!['Funded', 'Sold Out'].includes(project.status)) {
      throw new AppError('Project must be funded to create repayment schedule', 400);
    }

    // Calculate monthly payments (simple amortization)
    const monthlyRate = project.apy / 100 / 12;
    const totalInterest = project.raisedAmount * monthlyRate * periods;
    const principalPerPeriod = project.raisedAmount / periods;
    const interestPerPeriod = totalInterest / periods;

    const scheduleItems = [];
    const now = new Date();
    for (let i = 1; i <= periods; i++) {
      const dueDate = new Date(now);
      dueDate.setMonth(dueDate.getMonth() + i);

      scheduleItems.push({
        projectId,
        periodNumber: i,
        dueDate,
        principalDue: principalPerPeriod,
        interestDue: interestPerPeriod,
        totalDue: principalPerPeriod + interestPerPeriod,
      });
    }

    const created = await prisma.repaymentSchedule.createMany({ data: scheduleItems });
    const schedule = await prisma.repaymentSchedule.findMany({
      where: { projectId },
      orderBy: { periodNumber: 'asc' },
    });

    res.status(201).json(schedule);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    next(err);
  }
});

// Record a repayment (issuer pays one period)
router.post('/:projectId/pay/:periodNumber', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const projectId = req.params.projectId as string;
    const periodNumber = parseInt(req.params.periodNumber as string, 10);
    const userId = req.userId as string;

    const schedule = await prisma.repaymentSchedule.findUnique({
      where: { projectId_periodNumber: { projectId, periodNumber } },
    });
    if (!schedule) throw new AppError('Schedule period not found', 404);
    if (schedule.status === 'paid') throw new AppError('Already paid', 400);

    const updated = await prisma.repaymentSchedule.update({
      where: { id: schedule.id },
      data: { status: 'paid', paidAmount: schedule.totalDue, paidAt: new Date() },
    });

    // Award credit for on-time payment
    const isLate = new Date() > schedule.dueDate;
    if (!isLate) {
      await recordCreditEvent(
        userId,
        'repayment',
        ISSUER_EVENTS.REPAYMENT_ON_TIME.delta,
        `${ISSUER_EVENTS.REPAYMENT_ON_TIME.reason} (period ${periodNumber})`,
        projectId,
      );
    }

    // Create INTEREST transactions for all investors in this project
    const investments = await prisma.investment.findMany({
      where: { projectId, status: 'active' },
    });

    for (const inv of investments) {
      const investorShare = inv.amount / (await prisma.project.findUnique({ where: { id: projectId } }))!.raisedAmount;
      const interestAmount = schedule.interestDue * investorShare;

      await prisma.transaction.create({
        data: {
          userId: inv.userId,
          type: 'INTEREST',
          amount: interestAmount,
          asset: `AIUSD-${projectId}`,
          status: 'COMPLETED',
        },
      });

      // Notify investor
      try {
        emitToUser(inv.userId, 'repayment:received', {
          projectId,
          periodNumber,
          amount: interestAmount,
        });
      } catch {
        // Socket may not be initialized
      }
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Check and mark overdue payments
router.post('/check-overdue', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const now = new Date();
    const overdue = await prisma.repaymentSchedule.updateMany({
      where: {
        status: 'upcoming',
        dueDate: { lt: now },
      },
      data: { status: 'overdue' },
    });

    res.json({ markedOverdue: overdue.count });
  } catch (err) {
    next(err);
  }
});

export default router;
