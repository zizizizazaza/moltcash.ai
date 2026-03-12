#!/usr/bin/env npx tsx
/**
 * report.ts — Report execution result to MoltCash for credit
 * 
 * Usage:
 *   MOLTCASH_API_KEY=mc_xxx npx tsx report.ts --taskId abc123 --txHash 0x... --chain ethereum
 */

import { output, parseArgs } from './lib/wallet.js';

const API_BASE = process.env.MOLTCASH_API_URL || 'https://api.moltcash.com';

async function main() {
  const apiKey = process.env.MOLTCASH_API_KEY;
  if (!apiKey) {
    output({ success: false, error: 'MOLTCASH_API_KEY is required' });
    process.exit(1);
  }

  const args = parseArgs(process.argv.slice(2));
  const { taskId, txHash, chain, sessionId } = args;

  if (!txHash) {
    output({ success: false, error: 'Missing --txHash' });
    process.exit(1);
  }

  console.error(`[Report] Submitting execution proof to MoltCash...`);
  console.error(`[Report] txHash: ${txHash}`);
  console.error(`[Report] chain: ${chain || 'auto-detect'}`);

  const res = await fetch(`${API_BASE}/executions/verify`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      taskId: taskId || null,
      sessionId: sessionId || null,
      txHash,
      chain: chain || null,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 401) {
      output({ success: false, error: 'Invalid API key' });
    } else if (res.status === 409) {
      output({ success: false, error: 'Transaction already reported' });
    } else {
      output({ success: false, error: `Verification failed: ${text}` });
    }
    process.exit(1);
  }

  const json = await res.json() as any;
  const credits = json.data?.creditsEarned || 0;
  const verified = json.data?.verified || false;

  console.error(`[Report] ${verified ? '✅ Verified' : '⏳ Pending verification'}`);
  if (credits > 0) console.error(`[Report] +${credits} credits earned!`);

  output({
    success: true,
    verified,
    creditsEarned: credits,
    message: verified
      ? `Transaction verified! You earned ${credits} credits.`
      : 'Transaction submitted for verification. Credits will be awarded after on-chain confirmation.',
  });
}

main().catch(err => {
  output({ success: false, error: err.message });
  process.exit(1);
});
