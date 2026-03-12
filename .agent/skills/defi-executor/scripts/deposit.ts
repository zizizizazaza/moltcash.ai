#!/usr/bin/env npx tsx
/**
 * deposit.ts — Supply tokens to Aave V3 lending pool
 * 
 * Usage:
 *   PRIVATE_KEY=0x... npx tsx deposit.ts --chain ethereum --token 0x... --amount 100
 */

import { parseUnits, formatUnits, maxUint256 } from 'viem';
import { setupWallet, output, parseArgs } from './lib/wallet.js';
import { AAVE_POOL_ABI, ERC20_ABI } from './lib/protocols.js';

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const chainName = args.chain || 'ethereum';
  const tokenAddress = args.token as `0x${string}`;
  const amount = args.amount;

  if (!tokenAddress || !amount) {
    output({
      success: false,
      error: 'Missing required arguments. Usage: --chain ethereum --token 0x... --amount 100',
    });
    process.exit(1);
  }

  const { account, publicClient, walletClient, chainConfig } = setupWallet(chainName);
  const address = account.address;

  const aavePool = chainConfig.contracts.aavePool;
  if (!aavePool) {
    output({ success: false, error: `Aave V3 Pool not available on ${chainConfig.name}` });
    process.exit(1);
  }

  console.error(`[Deposit] Wallet: ${address}`);
  console.error(`[Deposit] Chain: ${chainConfig.name}`);

  // Get token info
  const [decimals, symbol] = await Promise.all([
    publicClient.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'decimals' }),
    publicClient.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'symbol' }),
  ]);

  const amountWei = parseUnits(amount, decimals);

  // Check balance
  const balance = await publicClient.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
  });

  if (balance < amountWei) {
    output({
      success: false,
      error: `Insufficient ${symbol} balance. Have ${formatUnits(balance, decimals)}, need ${amount}`,
    });
    process.exit(1);
  }

  console.error(`[Deposit] Supplying ${amount} ${symbol} to Aave V3...`);

  // Check allowance & approve if needed
  const allowance = await publicClient.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address, aavePool],
  });

  if (allowance < amountWei) {
    console.error(`[Deposit] Approving ${symbol} for Aave Pool...`);
    const approveHash = await walletClient.writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [aavePool, maxUint256],
    });
    await publicClient.waitForTransactionReceipt({ hash: approveHash });
    console.error(`[Deposit] Approved: ${approveHash}`);
  }

  // Supply to Aave V3
  const hash = await walletClient.writeContract({
    address: aavePool,
    abi: AAVE_POOL_ABI,
    functionName: 'supply',
    args: [tokenAddress, amountWei, address, 0],
  });

  console.error(`[Deposit] Transaction: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.error(`[Deposit] ✅ Confirmed in block ${receipt.blockNumber}`);

  output({
    success: true,
    chain: chainConfig.name,
    action: 'deposit',
    protocol: 'aave-v3',
    txHash: hash,
    blockNumber: Number(receipt.blockNumber),
    gasUsed: receipt.gasUsed.toString(),
    explorerUrl: `${chainConfig.explorer}/tx/${hash}`,
    details: {
      token: tokenAddress,
      symbol,
      amount: `${amount} ${symbol}`,
      pool: aavePool,
    },
  });
}

main().catch(err => {
  output({ success: false, error: err.message });
  process.exit(1);
});
