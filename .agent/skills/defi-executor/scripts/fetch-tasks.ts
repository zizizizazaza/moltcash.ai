#!/usr/bin/env npx tsx
/**
 * fetch-tasks.ts — Fetch available opportunities from MoltCash API
 * 
 * Usage:
 *   MOLTCASH_API_KEY=mc_xxx npx tsx fetch-tasks.ts
 *   MOLTCASH_API_KEY=mc_xxx npx tsx fetch-tasks.ts --type yield
 *   MOLTCASH_API_KEY=mc_xxx npx tsx fetch-tasks.ts --type quest --chain Ethereum
 */

import { parseArgs, output } from './lib/wallet.js';

const API_BASE = process.env.MOLTCASH_API_URL || 'https://api.moltcash.com';

async function main() {
  const apiKey = process.env.MOLTCASH_API_KEY;
  if (!apiKey) {
    output({
      success: false,
      error: 'MOLTCASH_API_KEY is required. Get one at https://moltcash.com/settings/api-keys',
    });
    process.exit(1);
  }

  const args = parseArgs(process.argv.slice(2));
  const type = args.type;     // yield | quest | testnet
  const chain = args.chain;   // Ethereum | Base | Arbitrum | Sepolia
  const limit = args.limit || '10';

  // Build query params
  const params = new URLSearchParams({ limit, sort: 'rewardAmount', order: 'desc' });
  if (type) params.set('type', type);
  if (chain) params.set('chain', chain);

  console.error(`[MoltCash] Fetching opportunities (type=${type || 'all'}, chain=${chain || 'all'})...`);

  const res = await fetch(`${API_BASE}/opportunities?${params}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 401) {
      output({ success: false, error: 'Invalid API key. Get one at https://moltcash.com/settings/api-keys' });
    } else if (res.status === 429) {
      output({ success: false, error: 'Rate limit exceeded. Upgrade to Pro at https://moltcash.com/pricing' });
    } else {
      output({ success: false, error: `API error ${res.status}: ${text}` });
    }
    process.exit(1);
  }

  const json = await res.json() as any;
  const opportunities = json.data || [];

  // Format for agent consumption
  const tasks = opportunities.map((opp: any) => ({
    taskId: opp.id,
    type: opp.type,
    title: opp.title,
    protocol: opp.source,
    chain: opp.chain,
    reward: opp.reward,
    rewardAmount: opp.rewardAmount,
    estimatedGas: opp.estimatedGas,
    difficulty: opp.difficulty,
    description: opp.description?.slice(0, 200),
    tags: opp.tags,
    sourceUrl: opp.sourceUrl,
    // Execution hints from MoltCash
    executionType: getExecutionType(opp),
  }));

  console.error(`[MoltCash] Found ${tasks.length} opportunities`);

  output({
    success: true,
    count: tasks.length,
    tasks,
  });
}

function getExecutionType(opp: any): string {
  if (opp.type === 'yield') {
    const src = (opp.source || '').toLowerCase();
    if (src.includes('lido')) return 'stake';
    if (src.includes('aave') || src.includes('compound') || src.includes('morpho')) return 'deposit';
    if (src.includes('pendle') || src.includes('curve') || src.includes('convex')) return 'deposit';
    return 'deposit';
  }
  if (opp.type === 'quest') return 'quest-onchain';
  if (opp.type === 'testnet') return 'testnet-interact';
  return 'unknown';
}

main().catch(err => {
  output({ success: false, error: err.message });
  process.exit(1);
});
