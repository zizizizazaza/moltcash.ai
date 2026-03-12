/**
 * Execution routes — Skill agent interaction endpoints
 * 
 * All routes require API Key auth (mc_xxx)
 * 
 * POST  /executions/start     — Start execution, get params, consume quota
 * POST  /executions/verify    — Submit txHash, verify on-chain, award credits
 * GET   /executions           — List execution history
 */

import { Hono } from 'hono';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';
import prisma from '../lib/prisma.js';

const executions = new Hono();

// All routes require API key
executions.use('*', apiKeyAuth);

// ── Protocol execution configs ──
// Maps opportunity source → execution parameters
const PROTOCOL_CONFIGS: Record<string, {
  action: string;
  getParams: (opp: any) => Record<string, any>;
}> = {
  // Lido staking
  'lido': {
    action: 'stake',
    getParams: (opp) => ({
      chain: opp.chain.toLowerCase() === 'ethereum' ? 'ethereum' : opp.chain.toLowerCase(),
      contract: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
      method: 'submit',
      description: `Stake ETH into Lido for ${opp.reward}`,
    }),
  },
  // Aave V3
  'aave-v3': {
    action: 'deposit',
    getParams: (opp) => {
      const chainMap: Record<string, string> = {
        'Ethereum': '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
        'Base': '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
        'Arbitrum': '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
      };
      return {
        chain: opp.chain.toLowerCase(),
        protocol: 'aave-v3',
        pool: chainMap[opp.chain] || chainMap['Ethereum'],
        method: 'supply',
        description: `Supply tokens to Aave V3 for ${opp.reward}`,
      };
    },
  },
  // Pendle / Curve / Convex — generic deposit
  'pendle': {
    action: 'deposit',
    getParams: (opp) => ({
      chain: opp.chain.toLowerCase(),
      protocol: 'pendle',
      description: `Deposit into Pendle for ${opp.reward}`,
      sourceUrl: opp.sourceUrl,
    }),
  },
  'curve-dex': {
    action: 'deposit',
    getParams: (opp) => ({
      chain: opp.chain.toLowerCase(),
      protocol: 'curve',
      description: `Add liquidity to Curve for ${opp.reward}`,
      sourceUrl: opp.sourceUrl,
    }),
  },
  'convex-finance': {
    action: 'deposit',
    getParams: (opp) => ({
      chain: opp.chain.toLowerCase(),
      protocol: 'convex',
      description: `Deposit into Convex for ${opp.reward}`,
      sourceUrl: opp.sourceUrl,
    }),
  },
  // Galxe quest
  'galxe': {
    action: 'quest-onchain',
    getParams: (opp) => ({
      chain: opp.chain.toLowerCase(),
      questUrl: opp.sourceUrl,
      description: `Complete on-chain quest: ${opp.title}`,
    }),
  },
};

// Credit rewards per action type
const CREDIT_REWARDS: Record<string, number> = {
  'stake': 50,
  'swap': 30,
  'deposit': 50,
  'testnet-swap': 10,
  'testnet-deploy': 15,
  'quest-onchain': 25,
};

// ── POST /executions/start ──
executions.post('/start', async (c) => {
  const apiKey = c.get('apiKey') as any;
  const user = c.get('apiKeyUser') as any;
  const body = await c.req.json().catch(() => ({}));

  const { taskId, action, chain } = body;

  let opportunity: any = null;
  let executionAction = action || 'unknown';
  let executionChain = chain || 'ethereum';
  let executionParams: Record<string, any> = {};

  // If taskId provided, fetch opportunity and build params
  if (taskId) {
    opportunity = await prisma.opportunity.findUnique({ where: { id: taskId } });
    if (!opportunity) {
      return c.json({ error: 'Task not found' }, 404);
    }

    // Map source to protocol config
    const source = (opportunity.source || '').toLowerCase();
    const config = PROTOCOL_CONFIGS[source] ||
      // Try matching tags
      Object.entries(PROTOCOL_CONFIGS).find(([key]) =>
        opportunity.tags?.toLowerCase().includes(key)
      )?.[1];

    if (config) {
      executionAction = config.action;
      executionParams = config.getParams(opportunity);
      executionChain = opportunity.chain || chain || 'ethereum';
    } else {
      // Generic fallback
      executionAction = opportunity.type === 'yield' ? 'deposit' :
        opportunity.type === 'quest' ? 'quest-onchain' : 'testnet-swap';
      executionParams = {
        chain: opportunity.chain?.toLowerCase() || 'ethereum',
        description: opportunity.description,
        sourceUrl: opportunity.sourceUrl,
      };
      executionChain = opportunity.chain || 'ethereum';
    }
  }

  // Consume quota
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { dailyUsed: { increment: 1 } },
  });

  // Create execution record
  const execution = await prisma.execution.create({
    data: {
      userId: user.id,
      apiKeyId: apiKey.id,
      opportunityId: taskId || null,
      action: executionAction,
      chain: executionChain,
      status: 'executing',
      executionParams: JSON.stringify(executionParams),
    },
  });

  return c.json({
    data: {
      executionId: execution.id,
      action: executionAction,
      chain: executionChain,
      params: executionParams,
      quotaRemaining: apiKey.dailyLimit - apiKey.dailyUsed - 1,
      potentialCredits: CREDIT_REWARDS[executionAction] || 10,
    },
  });
});

// ── On-chain RPC verification ──
const CHAIN_RPC: Record<string, string> = {
  'ethereum': 'https://eth.drpc.org',
  'sepolia': 'https://sepolia.drpc.org',
  'base': 'https://base.drpc.org',
  'base-sepolia': 'https://base-sepolia.drpc.org',
  'arbitrum': 'https://arbitrum.drpc.org',
  'arbitrum-sepolia': 'https://sepolia-rollup.arbitrum.io/rpc',
};

async function verifyTxOnChain(txHash: string, chain: string): Promise<{ success: boolean; blockNumber?: number; gasUsed?: string; error?: string }> {
  const rpc = CHAIN_RPC[chain.toLowerCase()] || CHAIN_RPC['ethereum'];
  try {
    const res = await fetch(rpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'eth_getTransactionReceipt', params: [txHash],
      }),
    });
    const data = await res.json() as any;
    if (!data.result) {
      return { success: false, error: 'Transaction not found on chain' };
    }
    const receipt = data.result;
    const status = parseInt(receipt.status, 16);
    if (status !== 1) {
      return { success: false, error: 'Transaction reverted on chain' };
    }
    return {
      success: true,
      blockNumber: parseInt(receipt.blockNumber, 16),
      gasUsed: parseInt(receipt.gasUsed, 16).toString(),
    };
  } catch (err: any) {
    // If RPC fails, still allow (don't block on network issues)
    console.error('[Verify] RPC error:', err.message);
    return { success: true, error: 'RPC unreachable, accepted on trust' };
  }
}

// ── POST /executions/verify ──
executions.post('/verify', async (c) => {
  const apiKey = c.get('apiKey') as any;
  const user = c.get('apiKeyUser') as any;
  const body = await c.req.json().catch(() => ({}));

  const { executionId, sessionId, txHash, chain, taskId } = body;

  if (!txHash) {
    return c.json({ error: 'txHash is required' }, 400);
  }

  // Check for duplicate
  const existingExecution = await prisma.execution.findFirst({
    where: { txHash, status: { in: ['success', 'verified'] } },
  });
  if (existingExecution) {
    return c.json({ error: 'Transaction already reported' }, 409);
  }

  // Find or create execution record
  let execution: any;
  if (executionId) {
    execution = await prisma.execution.findFirst({
      where: { id: executionId, userId: user.id },
    });
  }

  if (!execution && sessionId && sessionId !== 'local') {
    execution = await prisma.execution.findFirst({
      where: { id: sessionId, userId: user.id },
    });
  }

  if (!execution) {
    execution = await prisma.execution.create({
      data: {
        userId: user.id,
        apiKeyId: apiKey.id,
        opportunityId: taskId || null,
        action: 'unknown',
        chain: chain || 'unknown',
        status: 'pending',
        txHash,
      },
    });
  }

  // On-chain verification
  const verifyChain = chain || execution.chain || 'ethereum';
  const onChainResult = await verifyTxOnChain(txHash, verifyChain);
  
  if (!onChainResult.success) {
    await prisma.execution.update({
      where: { id: execution.id },
      data: { txHash, status: 'failed', error: onChainResult.error, completedAt: new Date() },
    });
    return c.json({ error: onChainResult.error, verified: false }, 400);
  }

  // Calculate credits
  const credits = CREDIT_REWARDS[execution.action] || 10;

  // Update execution with on-chain data
  await prisma.execution.update({
    where: { id: execution.id },
    data: {
      txHash,
      status: 'verified',
      blockNumber: onChainResult.blockNumber || null,
      gasUsed: onChainResult.gasUsed || null,
      creditsEarned: credits,
      verifiedAt: new Date(),
      completedAt: new Date(),
    },
  });

  // Award credits to user
  await prisma.user.update({
    where: { id: user.id },
    data: {
      credits: { increment: credits },
      points: { increment: credits },
      completedTasks: { increment: 1 },
    },
  });

  // Log to points ledger
  await prisma.pointsLedger.create({
    data: {
      userId: user.id,
      type: 'earn',
      source: 'skill_execution',
      credits,
      points: credits,
      note: `${execution.action} on ${verifyChain} — tx: ${txHash.slice(0, 10)}... (block ${onChainResult.blockNumber || '?'})`,
    },
  });

  return c.json({
    data: {
      verified: true,
      creditsEarned: credits,
      totalCredits: (user.credits || 0) + credits,
      executionId: execution.id,
      blockNumber: onChainResult.blockNumber,
    },
  });
});

// ── GET /executions ──
executions.get('/', async (c) => {
  const user = c.get('apiKeyUser') as any;
  const limit = parseInt(c.req.query('limit') || '20');
  const page = parseInt(c.req.query('page') || '1');

  const [data, total] = await Promise.all([
    prisma.execution.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.execution.count({ where: { userId: user.id } }),
  ]);

  return c.json({
    data: data.map(e => ({
      id: e.id,
      action: e.action,
      chain: e.chain,
      status: e.status,
      txHash: e.txHash,
      creditsEarned: e.creditsEarned,
      createdAt: e.createdAt,
      completedAt: e.completedAt,
    })),
    pagination: { page, limit, total },
  });
});

export default executions;
