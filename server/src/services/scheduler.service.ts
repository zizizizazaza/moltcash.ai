import prisma from '../db.js';
import { recordCreditEvent, ISSUER_EVENTS, INVESTOR_EVENTS } from './credit.service.js';

// Interval handles for cleanup
let overdueInterval: ReturnType<typeof setInterval> | null = null;
let holdTimeInterval: ReturnType<typeof setInterval> | null = null;
let proposalInterval: ReturnType<typeof setInterval> | null = null;

// ==================== Overdue Detection ====================
// Mark overdue payments + apply credit penalties
async function checkOverduePayments() {
  try {
    const now = new Date();

    const newlyOverdue = await prisma.repaymentSchedule.findMany({
      where: { status: 'upcoming', dueDate: { lt: now } },
      select: { id: true, projectId: true },
    });

    if (newlyOverdue.length === 0) return;

    // Mark as overdue
    await prisma.repaymentSchedule.updateMany({
      where: { status: 'upcoming', dueDate: { lt: now } },
      data: { status: 'overdue' },
    });

    // Group by project and apply penalties
    const projectIds = [...new Set(newlyOverdue.map((r: any) => r.projectId))] as string[];
    for (const projectId of projectIds as string[]) {
      const totalOverdue = await prisma.repaymentSchedule.count({
        where: { projectId, status: 'overdue' },
      });

      // Find issuer (first investment creator as proxy)
      const firstInvestment = await prisma.investment.findFirst({
        where: { projectId },
        select: { userId: true },
      });
      if (!firstInvestment) continue;

      let penaltyEvent;
      if (totalOverdue > 3) penaltyEvent = ISSUER_EVENTS.LATE_90_PLUS;
      else if (totalOverdue > 1) penaltyEvent = ISSUER_EVENTS.LATE_31_90;
      else penaltyEvent = ISSUER_EVENTS.LATE_1_30;

      try {
        await recordCreditEvent(
          firstInvestment.userId,
          'late_payment_auto',
          penaltyEvent.delta,
          `${penaltyEvent.reason} (auto-detected)`,
          projectId,
        );
      } catch { /* non-critical */ }
    }

    console.log(`[Scheduler] Marked ${newlyOverdue.length} payments overdue across ${projectIds.length} projects`);
  } catch (err) {
    console.error('[Scheduler] Overdue check failed:', err);
  }
}

// ==================== Hold Time Milestones ====================
// Check investments for 30-day and 90-day hold bonuses
async function checkHoldTimeMilestones() {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Find investments held for 90+ days that haven't received the 90-day bonus
    const hold90 = await prisma.investment.findMany({
      where: {
        status: 'active',
        createdAt: { lt: ninetyDaysAgo },
      },
      select: { id: true, userId: true, projectId: true },
    });

    for (const inv of hold90) {
      // Check if already awarded
      const existing = await prisma.creditScoreEvent.findFirst({
        where: { userId: inv.userId, eventType: 'hold_90_days', refId: inv.id },
      });
      if (!existing) {
        try {
          await recordCreditEvent(
            inv.userId, 'hold_90_days',
            INVESTOR_EVENTS.HOLD_90_DAYS.delta,
            INVESTOR_EVENTS.HOLD_90_DAYS.reason,
            inv.id,
          );
        } catch { /* non-critical */ }
      }
    }

    // Find investments held for 30+ days that haven't received the 30-day bonus
    const hold30 = await prisma.investment.findMany({
      where: {
        status: 'active',
        createdAt: { lt: thirtyDaysAgo },
      },
      select: { id: true, userId: true, projectId: true },
    });

    for (const inv of hold30) {
      const existing = await prisma.creditScoreEvent.findFirst({
        where: { userId: inv.userId, eventType: 'hold_30_days', refId: inv.id },
      });
      if (!existing) {
        try {
          await recordCreditEvent(
            inv.userId, 'hold_30_days',
            INVESTOR_EVENTS.HOLD_30_DAYS.delta,
            INVESTOR_EVENTS.HOLD_30_DAYS.reason,
            inv.id,
          );
        } catch { /* non-critical */ }
      }
    }

    const awarded = hold90.length + hold30.length;
    if (awarded > 0) {
      console.log(`[Scheduler] Checked ${awarded} investments for hold-time milestones`);
    }
  } catch (err) {
    console.error('[Scheduler] Hold time check failed:', err);
  }
}

// ==================== Proposal Finalization ====================
// Auto-finalize expired governance proposals
async function finalizeExpiredProposals() {
  try {
    const now = new Date();

    const expired = await prisma.governanceProposal.findMany({
      where: { status: 'active', endsAt: { lt: now } },
    });

    for (const proposal of expired) {
      const totalVotes = proposal.forVotes + proposal.againstVotes;
      let newStatus: string;

      if (totalVotes < proposal.quorum) {
        newStatus = 'rejected'; // quorum not met
      } else {
        newStatus = proposal.forVotes > proposal.againstVotes ? 'passed' : 'rejected';
      }

      await prisma.governanceProposal.update({
        where: { id: proposal.id },
        data: { status: newStatus },
      });
    }

    if (expired.length > 0) {
      console.log(`[Scheduler] Finalized ${expired.length} expired proposals`);
    }
  } catch (err) {
    console.error('[Scheduler] Proposal finalization failed:', err);
  }
}

// ==================== Start / Stop ====================
export function startScheduler() {
  console.log('[Scheduler] Starting background jobs...');

  // Check overdue payments every hour
  overdueInterval = setInterval(checkOverduePayments, 60 * 60 * 1000);

  // Check hold-time milestones every 6 hours
  holdTimeInterval = setInterval(checkHoldTimeMilestones, 6 * 60 * 60 * 1000);

  // Finalize expired proposals every 30 minutes
  proposalInterval = setInterval(finalizeExpiredProposals, 30 * 60 * 1000);

  // Run once immediately on startup
  setTimeout(() => {
    checkOverduePayments();
    checkHoldTimeMilestones();
    finalizeExpiredProposals();
  }, 5000);
}

export function stopScheduler() {
  if (overdueInterval) clearInterval(overdueInterval);
  if (holdTimeInterval) clearInterval(holdTimeInterval);
  if (proposalInterval) clearInterval(proposalInterval);
  console.log('[Scheduler] Background jobs stopped');
}
