import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db.js';
type Tx = Omit<typeof prisma, '$transaction' | '$connect' | '$disconnect' | '$on' | '$extends'>;
import { authRequired, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { recordCreditEvent, INVESTOR_EVENTS } from '../services/credit.service.js';

const router = Router();

// List active proposals
router.get('/proposals', async (_req, res, next) => {
  try {
    const proposals = await prisma.governanceProposal.findMany({
      include: { creator: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(proposals);
  } catch (err) {
    next(err);
  }
});

// Create a proposal
const proposalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  category: z.enum(['parameter_change', 'treasury_rebalance', 'fee_adjustment', 'tier_threshold']),
  durationDays: z.number().int().min(1).max(30).default(7),
});

router.post('/proposals', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const data = proposalSchema.parse(req.body);
    const userId = req.userId as string;

    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + data.durationDays);

    // Calculate quorum: 10% of total AIUSD holdings
    const totalHoldings = await prisma.portfolioHolding.aggregate({
      _sum: { amount: true },
    });
    const quorum = (totalHoldings._sum.amount || 0) * 0.1;

    const proposal = await prisma.governanceProposal.create({
      data: {
        creatorId: userId,
        title: data.title,
        description: data.description,
        category: data.category,
        endsAt,
        quorum,
      },
    });

    res.status(201).json(proposal);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    next(err);
  }
});

// Vote on a proposal
const voteSchema = z.object({
  vote: z.enum(['for', 'against']),
});

router.post('/proposals/:id/vote', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const { vote } = voteSchema.parse(req.body);
    const userId = req.userId as string;
    const proposalId = req.params.id as string;

    const proposal = await prisma.governanceProposal.findUnique({ where: { id: proposalId } });
    if (!proposal) throw new AppError('Proposal not found', 404);
    if (proposal.status !== 'active') throw new AppError('Voting is closed', 400);
    if (new Date() > proposal.endsAt) throw new AppError('Voting period ended', 400);

    // Calculate vote weight from portfolio holdings
    const holdings = await prisma.portfolioHolding.findMany({ where: { userId } });
    const weight = holdings.reduce((sum: number, h: any) => sum + h.amount, 0);
    if (weight <= 0) throw new AppError('No holdings to vote with', 400);

    // Check for existing vote
    const existing = await prisma.governanceVote.findUnique({
      where: { proposalId_userId: { proposalId, userId } },
    });
    if (existing) throw new AppError('Already voted', 400);

    const result = await prisma.$transaction(async (tx: Tx) => {
      const newVote = await tx.governanceVote.create({
        data: { proposalId, userId, vote, weight },
      });

      const updateData = vote === 'for'
        ? { forVotes: proposal.forVotes + weight }
        : { againstVotes: proposal.againstVotes + weight };

      // Check if proposal should pass/fail
      const totalVotes = (updateData.forVotes || proposal.forVotes) + (updateData.againstVotes || proposal.againstVotes);
      if (totalVotes >= proposal.quorum) {
        const forTotal = updateData.forVotes || proposal.forVotes;
        const againstTotal = updateData.againstVotes || proposal.againstVotes;
        if (forTotal > againstTotal) {
          Object.assign(updateData, { status: 'passed' });
        } else {
          Object.assign(updateData, { status: 'rejected' });
        }
      }

      await tx.governanceProposal.update({ where: { id: proposalId }, data: updateData });

      return newVote;
    });

    // Award credit for participation
    try {
      await recordCreditEvent(
        userId,
        'governance_vote',
        INVESTOR_EVENTS.GOVERNANCE_VOTE.delta,
        INVESTOR_EVENTS.GOVERNANCE_VOTE.reason,
        proposalId,
      );
    } catch {
      // Non-critical
    }

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
