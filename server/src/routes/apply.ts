import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db.js';
import { authRequired, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { recordCreditEvent, ISSUER_EVENTS } from '../services/credit.service.js';

const router = Router();

// ============ Enterprise Verification ============

const enterpriseSchema = z.object({
  companyName: z.string().min(1).max(200),
  country: z.string().min(2).max(100),
  registrationNo: z.string().optional(),
  licenseDoc: z.string().optional(),
});

// Submit enterprise verification
router.post('/enterprise/submit', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const data = enterpriseSchema.parse(req.body);
    const userId = req.userId as string;

    const enterprise = await prisma.enterpriseVerification.create({
      data: { userId, ...data },
    });

    res.status(201).json(enterprise);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    next(err);
  }
});

// Get enterprise verification status
router.get('/enterprise', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const enterprises = await prisma.enterpriseVerification.findMany({
      where: { userId: req.userId as string },
      orderBy: { createdAt: 'desc' },
    });
    res.json(enterprises);
  } catch (err) {
    next(err);
  }
});

// Advance enterprise verification step (simulates KYC progress)
router.post('/enterprise/:id/advance', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const id = req.params.id as string;
    const userId = req.userId as string;

    const enterprise = await prisma.enterpriseVerification.findUnique({ where: { id } });
    if (!enterprise) throw new AppError('Enterprise not found', 404);
    if (enterprise.userId !== userId) throw new AppError('Unauthorized', 403);
    if (enterprise.step >= 4) throw new AppError('All steps completed', 400);

    const newStep = enterprise.step + 1;
    const isComplete = newStep >= 4;

    const updated = await prisma.enterpriseVerification.update({
      where: { id },
      data: {
        step: newStep,
        status: isComplete ? 'verified' : 'in_review',
        creditAwarded: enterprise.creditAwarded + 25,
        sbtMinted: isComplete,
      },
    });

    // Award credit score
    await recordCreditEvent(
      userId,
      'enterprise_verify',
      ISSUER_EVENTS.ENTERPRISE_VERIFY_STEP.delta,
      `${ISSUER_EVENTS.ENTERPRISE_VERIFY_STEP.reason} (step ${newStep}/4)`,
      id,
    );

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ============ Project Application ============

const applicationSchema = z.object({
  enterpriseId: z.string(),
  projectName: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.string(),
  monthlyRevenue: z.number().positive(),
  requestedAmount: z.number().positive(),
  proposedApy: z.number().positive().max(50),
  durationDays: z.number().int().positive(),
  collateralType: z.string().optional(),
  collateralValue: z.number().optional(),
  revenueSource: z.string().optional(),
});

// Submit project application
router.post('/projects/apply', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const data = applicationSchema.parse(req.body);
    const userId = req.userId as string;

    // Verify enterprise exists and belongs to user
    const enterprise = await prisma.enterpriseVerification.findUnique({
      where: { id: data.enterpriseId },
    });
    if (!enterprise || enterprise.userId !== userId) {
      throw new AppError('Enterprise verification required', 400);
    }

    const application = await prisma.proposedApplication.create({
      data: { userId, ...data, status: 'submitted' },
    });

    res.status(201).json(application);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    next(err);
  }
});

// Get my applications
router.get('/projects/applications', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const applications = await prisma.proposedApplication.findMany({
      where: { userId: req.userId as string },
      include: { enterprise: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(applications);
  } catch (err) {
    next(err);
  }
});

// Get single application
router.get('/projects/applications/:id', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const application = await prisma.proposedApplication.findUnique({
      where: { id: req.params.id as string },
      include: { enterprise: true },
    });
    if (!application) throw new AppError('Application not found', 404);
    if (application.userId !== (req.userId as string)) throw new AppError('Unauthorized', 403);
    res.json(application);
  } catch (err) {
    next(err);
  }
});

export default router;
