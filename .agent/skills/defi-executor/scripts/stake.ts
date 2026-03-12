#!/usr/bin/env npx tsx
/**
 * stake.ts — Stake ETH into Lido, receive stETH
 * 
 * Usage:
 *   PRIVATE_KEY=0x... npx tsx stake.ts --chain ethereum --amount 0.01
 */

import { parseEther, formatEther } from 'viem';
import { setupWallet, getBalance, output, parseArgs } from './lib/wallet.js';
import { LIDO_ABI } from './lib/protocols.js';

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const chainName = args.chain || 'ethereum';
  const amount = args.amount;

  if (!amount) {
    output({ success: false, error: 'Missing --amount argument. Usage: --chain ethereum --amount 0.01' });
    process.exit(1);
  }

  const { account, publicClient, walletClient, chainConfig } = setupWallet(chainName);
  const address = account.address;

  console.error(`[Stake] Wallet: ${address}`);
  console.error(`[Stake] Chain: ${chainConfig.name} (${chainConfig.id})`);

  // Check balance
  const balance = await getBalance(publicClient, address);
  console.error(`[Stake] Balance: ${balance} ETH`);

  const amountWei = parseEther(amount);
  if (parseEther(balance) < amountWei) {
    output({ success: false, error: `Insufficient balance. Have ${balance} ETH, need ${amount} ETH` });
    process.exit(1);
  }

  // Check Lido contract
  const lidoAddress = chainConfig.contracts.lido;
  if (!lidoAddress) {
    output({ success: false, error: `Lido not available on ${chainConfig.name}` });
    process.exit(1);
  }

  console.error(`[Stake] Staking ${amount} ETH into Lido at ${lidoAddress}...`);

  // Execute: submit(referral=0x0) with ETH value
  const hash = await walletClient.writeContract({
    address: lidoAddress,
    abi: LIDO_ABI,
    functionName: 'submit',
    args: ['0x0000000000000000000000000000000000000000'],
    value: amountWei,
  });

  console.error(`[Stake] Transaction submitted: ${hash}`);
  console.error(`[Stake] Waiting for confirmation...`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  console.error(`[Stake] ✅ Confirmed in block ${receipt.blockNumber}`);

  output({
    success: true,
    chain: chainConfig.name,
    action: 'stake',
    protocol: 'lido',
    txHash: hash,
    blockNumber: Number(receipt.blockNumber),
    gasUsed: receipt.gasUsed.toString(),
    explorerUrl: `${chainConfig.explorer}/tx/${hash}`,
    details: {
      amountIn: `${amount} ETH`,
      amountOut: `~${amount} stETH`,
      contract: lidoAddress,
    },
  });
}

main().catch(err => {
  output({ success: false, error: err.message });
  process.exit(1);
});
