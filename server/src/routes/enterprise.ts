import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db.js';
import { authRequired, type AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET current verification status
router.get('/verify-status', authRequired, async (req: AuthRequest, res, next) => {
  try {
    let verification = await prisma.enterpriseVerification.findFirst({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });

    if (!verification) {
      return res.json({ status: 'none', step: 0 });
    }

    res.json(verification);
  } catch (err) {
    next(err);
  }
});

// POST to update verification step
const verifyStepSchema = z.object({
  step: z.number().int().min(1).max(5),
  companyName: z.string().optional(),
  country: z.string().optional(),
  registrationNo: z.string().optional(),
  licenseDoc: z.string().optional(),
  uboName: z.string().optional(),
  uboIdDoc: z.string().optional(),
});

router.post('/verify-step', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const data = verifyStepSchema.parse(req.body);
    
    // Find absolute latest or create
    let verification = await prisma.enterpriseVerification.findFirst({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });

    if (!verification) {
      if (!data.companyName || !data.country) {
         return res.status(400).json({ error: 'Company Name and Country are required for first step' });
      }
      verification = await prisma.enterpriseVerification.create({
        data: {
          userId: req.userId as string,
          companyName: data.companyName,
          country: data.country,
          step: data.step,
          status: 'pending'
        }
      });
    } else {
      verification = await prisma.enterpriseVerification.update({
        where: { id: verification.id },
        data: {
          step: data.step,
          ...(data.companyName ? { companyName: data.companyName } : {}),
          ...(data.country ? { country: data.country } : {}),
          ...(data.registrationNo ? { registrationNo: data.registrationNo } : {}),
          ...(data.licenseDoc ? { licenseDoc: data.licenseDoc } : {}),
          ...(data.uboName ? { uboName: data.uboName } : {}),
          ...(data.uboIdDoc ? { uboIdDoc: data.uboIdDoc } : {}),
          ...(data.step >= 4 ? { status: 'verified' } : {}) // Auto verify for MVP demo
        }
      });
    }

    res.json(verification);
  } catch (err) {
    next(err);
  }
});

export default router;
