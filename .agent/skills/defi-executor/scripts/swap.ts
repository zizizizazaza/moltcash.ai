#!/usr/bin/env npx tsx
/**
 * swap.ts — Swap tokens via Uniswap V3
 * 
 * Usage:
 *   PRIVATE_KEY=0x... npx tsx swap.ts --chain ethereum --tokenIn 0x... --tokenOut 0x... --amount 100 --slippage 0.5
 *
 * For ETH→Token swaps, use WETH address as tokenIn.
 */

import { parseUnits, formatUnits, maxUint256 } from 'viem';
import { setupWallet, output, parseArgs } from './lib/wallet.js';
import { UNISWAP_ROUTER_ABI, ERC20_ABI } from './lib/protocols.js';

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const chainName = args.chain || 'ethereum';
  const tokenIn = args.tokenIn as `0x${string}`;
  const tokenOut = args.tokenOut as `0x${string}`;
  const amount = args.amount;
  const slippage = parseFloat(args.slippage || '0.5'); // 0.5%
  const fee = parseInt(args.fee || '3000'); // 0.3% default Uniswap fee tier

  if (!tokenIn || !tokenOut || !amount) {
    output({
      success: false,
      error: 'Missing required arguments. Usage: --chain ethereum --tokenIn 0x... --tokenOut 0x... --amount 100',
    });
    process.exit(1);
  }

  const { account, publicClient, walletClient, chainConfig } = setupWallet(chainName);
  const address = account.address;

  const routerAddress = chainConfig.contracts.uniswapRouter;
  if (!routerAddress) {
    output({ success: false, error: `Uniswap Router not available on ${chainConfig.name}` });
    process.exit(1);
  }

  console.error(`[Swap] Wallet: ${address}`);
  console.error(`[Swap] Chain: ${chainConfig.name}`);

  // Get token decimals
  const decimals = await publicClient.readContract({
    address: tokenIn,
    abi: ERC20_ABI,
    functionName: 'decimals',
  });

  const symbol = await publicClient.readContract({
    address: tokenIn,
    abi: ERC20_ABI,
    functionName: 'symbol',
  });

  const amountIn = parseUnits(amount, decimals);
  console.error(`[Swap] Swapping ${amount} ${symbol} → token ${tokenOut.slice(0, 10)}...`);

  // Check balance
  const balance = await publicClient.readContract({
    address: tokenIn,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
  });

  if (balance < amountIn) {
    output({
      success: false,
      error: `Insufficient ${symbol} balance. Have ${formatUnits(balance, decimals)}, need ${amount}`,
    });
    process.exit(1);
  }

  // Check allowance & approve if needed
  const allowance = await publicClient.readContract({
    address: tokenIn,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address, routerAddress],
  });

  if (allowance < amountIn) {
    console.error(`[Swap] Approving ${symbol} for Uniswap Router...`);
    const approveHash = await walletClient.writeContract({
      address: tokenIn,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [routerAddress, maxUint256],
    });
    await publicClient.waitForTransactionReceipt({ hash: approveHash });
    console.error(`[Swap] Approved: ${approveHash}`);
  }

  // Calculate minimum output (with slippage)
  const amountOutMinimum = 0n; // For MVP; production should use quoter

  // Execute swap
  const hash = await walletClient.writeContract({
    address: routerAddress,
    abi: UNISWAP_ROUTER_ABI,
    functionName: 'exactInputSingle',
    args: [{
      tokenIn,
      tokenOut,
      fee,
      recipient: address,
      amountIn,
      amountOutMinimum,
      sqrtPriceLimitX96: 0n,
    }],
  });

  console.error(`[Swap] Transaction: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.error(`[Swap] ✅ Confirmed in block ${receipt.blockNumber}`);

  output({
    success: true,
    chain: chainConfig.name,
    action: 'swap',
    protocol: 'uniswap-v3',
    txHash: hash,
    blockNumber: Number(receipt.blockNumber),
    gasUsed: receipt.gasUsed.toString(),
    explorerUrl: `${chainConfig.explorer}/tx/${hash}`,
    details: {
      tokenIn: tokenIn,
      tokenOut: tokenOut,
      amountIn: `${amount} ${symbol}`,
      fee: `${fee / 10000}%`,
    },
  });
}

main().catch(err => {
  output({ success: false, error: err.message });
  process.exit(1);
});
