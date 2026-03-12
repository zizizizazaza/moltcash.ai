#!/usr/bin/env npx tsx
/**
 * execute.ts — Execute a DeFi task via MoltCash
 * 
 * Flow:
 *   1. Fetch execution params from MoltCash API (by taskId)
 *   2. Execute on-chain transaction
 *   3. Report result back to MoltCash API
 * 
 * Usage:
 *   # By task ID (recommended)
 *   MOLTCASH_API_KEY=mc_xxx PRIVATE_KEY=0x... npx tsx execute.ts --taskId abc123
 * 
 *   # Direct action
 *   MOLTCASH_API_KEY=mc_xxx PRIVATE_KEY=0x... npx tsx execute.ts \
 *     --action stake --chain ethereum --amount 0.1
 */

import { parseEther, parseUnits, formatEther, formatUnits, maxUint256 } from 'viem';
import { setupWallet, getBalance, output, parseArgs } from './lib/wallet.js';
import { LIDO_ABI, AAVE_POOL_ABI, UNISWAP_ROUTER_ABI, ERC20_ABI } from './lib/protocols.js';

const API_BASE = process.env.MOLTCASH_API_URL || 'https://api.moltcash.com';

interface ExecutionPlan {
  action: 'stake' | 'swap' | 'deposit' | 'testnet-swap' | 'testnet-deploy';
  chain: string;
  params: Record<string, any>;
  taskId?: string;
}

async function main() {
  const apiKey = process.env.MOLTCASH_API_KEY;
  if (!apiKey) {
    output({ success: false, error: 'MOLTCASH_API_KEY is required. Get one at https://moltcash.com/settings/api-keys' });
    process.exit(1);
  }

  const args = parseArgs(process.argv.slice(2));
  let plan: ExecutionPlan;

  if (args.taskId) {
    // Fetch execution plan from MoltCash API
    plan = await fetchExecutionPlan(apiKey, args.taskId);
  } else if (args.action) {
    // Build plan from CLI args
    plan = {
      action: args.action as any,
      chain: args.chain || 'ethereum',
      params: { ...args },
      taskId: undefined,
    };
  } else {
    output({
      success: false,
      error: 'Provide --taskId (recommended) or --action. Run fetch-tasks.ts first to get task IDs.',
    });
    process.exit(1);
  }

  console.error(`[Execute] Action: ${plan.action} on ${plan.chain}`);

  // Create session on MoltCash API (tracks execution, counts quota)
  const sessionId = await createSession(apiKey, plan);

  // Execute on-chain
  let result: any;
  try {
    switch (plan.action) {
      case 'stake':
        result = await executeStake(plan);
        break;
      case 'swap':
        result = await executeSwap(plan);
        break;
      case 'deposit':
        result = await executeDeposit(plan);
        break;
      case 'testnet-swap':
        result = await executeTestnetSwap(plan);
        break;
      case 'testnet-deploy':
        result = await executeTestnetDeploy(plan);
        break;
      default:
        throw new Error(`Unsupported action: ${plan.action}`);
    }
  } catch (err: any) {
    // Report failure to MoltCash
    await reportResult(apiKey, sessionId, { success: false, error: err.message });
    throw err;
  }

  // Report success to MoltCash → earn credits
  const credits = await reportResult(apiKey, sessionId, result);
  result.credits = credits;

  output(result);
}

// ── MoltCash API Calls ────────────────────────────

async function fetchExecutionPlan(apiKey: string, taskId: string): Promise<ExecutionPlan> {
  console.error(`[MoltCash] Fetching execution plan for task ${taskId}...`);

  const res = await fetch(`${API_BASE}/opportunities/${taskId}/execute`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('Invalid API key');
    if (res.status === 429) throw new Error('Quota exceeded. Upgrade at https://moltcash.com/pricing');
    if (res.status === 404) throw new Error(`Task ${taskId} not found`);
    throw new Error(`API error: ${res.status}`);
  }

  const json = await res.json() as any;
  return json.data as ExecutionPlan;
}

async function createSession(apiKey: string, plan: ExecutionPlan): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskId: plan.taskId,
        action: plan.action,
        chain: plan.chain,
      }),
    });

    if (res.ok) {
      const json = await res.json() as any;
      return json.data?.id || 'local';
    }
  } catch {
    // Non-critical — continue without session
  }
  return 'local';
}

async function reportResult(apiKey: string, sessionId: string, result: any): Promise<number> {
  if (sessionId === 'local') return 0;

  try {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: result.success,
        txHash: result.txHash,
        gasUsed: result.gasUsed,
        error: result.error,
      }),
    });

    if (res.ok) {
      const json = await res.json() as any;
      const credits = json.data?.creditsEarned || 0;
      if (credits > 0) console.error(`[MoltCash] +${credits} credits earned!`);
      return credits;
    }
  } catch {
    // Non-critical
  }
  return 0;
}

// ── On-Chain Executors ────────────────────────────

async function executeStake(plan: ExecutionPlan) {
  const amount = plan.params.amount;
  if (!amount) throw new Error('Missing amount for stake');

  const { account, publicClient, walletClient, chainConfig } = setupWallet(plan.chain);
  const lidoAddress = chainConfig.contracts.lido;
  if (!lidoAddress) throw new Error(`Lido not available on ${plan.chain}`);

  const balance = await getBalance(publicClient, account.address);
  const amountWei = parseEther(amount);
  if (parseEther(balance) < amountWei) {
    throw new Error(`Insufficient balance: ${balance} ETH, need ${amount} ETH`);
  }

  console.error(`[Stake] ${amount} ETH → stETH via Lido on ${chainConfig.name}...`);

  const hash = await walletClient.writeContract({
    address: lidoAddress,
    abi: LIDO_ABI,
    functionName: 'submit',
    args: ['0x0000000000000000000000000000000000000000'],
    value: amountWei,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  return {
    success: true,
    chain: chainConfig.name,
    action: 'stake',
    protocol: 'lido',
    txHash: hash,
    blockNumber: Number(receipt.blockNumber),
    gasUsed: receipt.gasUsed.toString(),
    explorerUrl: `${chainConfig.explorer}/tx/${hash}`,
    details: { amountIn: `${amount} ETH`, amountOut: `~${amount} stETH` },
  };
}

async function executeSwap(plan: ExecutionPlan) {
  const { tokenIn, tokenOut, amount, fee: feeStr } = plan.params;
  if (!tokenIn || !tokenOut || !amount) throw new Error('Missing tokenIn, tokenOut, or amount');

  const { account, publicClient, walletClient, chainConfig } = setupWallet(plan.chain);
  const routerAddress = chainConfig.contracts.uniswapRouter;
  if (!routerAddress) throw new Error(`Uniswap not available on ${plan.chain}`);

  const decimals = await publicClient.readContract({
    address: tokenIn as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'decimals',
  });

  const amountIn = parseUnits(amount, decimals);
  const fee = parseInt(feeStr || '3000');

  // Approve
  const allowance = await publicClient.readContract({
    address: tokenIn as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [account.address, routerAddress],
  });

  if (allowance < amountIn) {
    console.error(`[Swap] Approving token...`);
    const approveHash = await walletClient.writeContract({
      address: tokenIn as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [routerAddress, maxUint256],
    });
    await publicClient.waitForTransactionReceipt({ hash: approveHash });
  }

  console.error(`[Swap] Executing swap on ${chainConfig.name}...`);

  const hash = await walletClient.writeContract({
    address: routerAddress,
    abi: UNISWAP_ROUTER_ABI,
    functionName: 'exactInputSingle',
    args: [{
      tokenIn: tokenIn as `0x${string}`,
      tokenOut: tokenOut as `0x${string}`,
      fee,
      recipient: account.address,
      amountIn,
      amountOutMinimum: 0n,
      sqrtPriceLimitX96: 0n,
    }],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  return {
    success: true,
    chain: chainConfig.name,
    action: 'swap',
    protocol: 'uniswap-v3',
    txHash: hash,
    blockNumber: Number(receipt.blockNumber),
    gasUsed: receipt.gasUsed.toString(),
    explorerUrl: `${chainConfig.explorer}/tx/${hash}`,
    details: { tokenIn, tokenOut, amount, fee: `${fee / 10000}%` },
  };
}

async function executeDeposit(plan: ExecutionPlan) {
  const { token, amount } = plan.params;
  if (!token || !amount) throw new Error('Missing token or amount');

  const { account, publicClient, walletClient, chainConfig } = setupWallet(plan.chain);
  const aavePool = chainConfig.contracts.aavePool;
  if (!aavePool) throw new Error(`Aave not available on ${plan.chain}`);

  const [decimals, symbol] = await Promise.all([
    publicClient.readContract({ address: token as `0x${string}`, abi: ERC20_ABI, functionName: 'decimals' }),
    publicClient.readContract({ address: token as `0x${string}`, abi: ERC20_ABI, functionName: 'symbol' }),
  ]);

  const amountWei = parseUnits(amount, decimals);

  // Approve
  const allowance = await publicClient.readContract({
    address: token as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [account.address, aavePool],
  });

  if (allowance < amountWei) {
    console.error(`[Deposit] Approving ${symbol}...`);
    const approveHash = await walletClient.writeContract({
      address: token as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [aavePool, maxUint256],
    });
    await publicClient.waitForTransactionReceipt({ hash: approveHash });
  }

  console.error(`[Deposit] Supplying ${amount} ${symbol} to Aave V3...`);

  const hash = await walletClient.writeContract({
    address: aavePool,
    abi: AAVE_POOL_ABI,
    functionName: 'supply',
    args: [token as `0x${string}`, amountWei, account.address, 0],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  return {
    success: true,
    chain: chainConfig.name,
    action: 'deposit',
    protocol: 'aave-v3',
    txHash: hash,
    blockNumber: Number(receipt.blockNumber),
    gasUsed: receipt.gasUsed.toString(),
    explorerUrl: `${chainConfig.explorer}/tx/${hash}`,
    details: { token, symbol, amount: `${amount} ${symbol}` },
  };
}

async function executeTestnetSwap(plan: ExecutionPlan) {
  const amount = plan.params.amount || '0.0001';
  const { account, publicClient, walletClient, chainConfig } = setupWallet(plan.chain);

  if (!chainConfig.isTestnet) throw new Error(`${plan.chain} is not a testnet`);

  const weth = chainConfig.contracts.weth;
  const amountWei = parseEther(amount);

  if (weth) {
    console.error(`[Testnet] Wrapping ${amount} ETH → WETH...`);
    const hash = await walletClient.sendTransaction({
      to: weth,
      value: amountWei,
      data: '0xd0e30db0' as `0x${string}`,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      success: true,
      chain: chainConfig.name,
      action: 'testnet-swap',
      txHash: hash,
      blockNumber: Number(receipt.blockNumber),
      gasUsed: receipt.gasUsed.toString(),
      explorerUrl: `${chainConfig.explorer}/tx/${hash}`,
      details: { type: 'ETH → WETH wrap', amount: `${amount} ETH` },
    };
  }

  // Fallback: self-transfer
  const hash = await walletClient.sendTransaction({
    to: account.address,
    value: amountWei,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  return {
    success: true,
    chain: chainConfig.name,
    action: 'testnet-swap',
    txHash: hash,
    blockNumber: Number(receipt.blockNumber),
    gasUsed: receipt.gasUsed.toString(),
    explorerUrl: `${chainConfig.explorer}/tx/${hash}`,
    details: { type: 'self-transfer', amount: `${amount} ETH` },
  };
}

async function executeTestnetDeploy(plan: ExecutionPlan) {
  const { account, publicClient, walletClient, chainConfig } = setupWallet(plan.chain);
  if (!chainConfig.isTestnet) throw new Error(`${plan.chain} is not a testnet`);

  const bytecode = '0x6080604052348015600f57600080fd5b5060ac8061001e6000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c806360fe47b11460375780636d4ce63c14604f575b600080fd5b604d60048036038101906049919060699060830391505683565b005b60556057565b60408051918252519081900360200190f35b60005490565b600080fd5b6000819050919050565b607d81606c565b8114608757600080fd5b50565b600060208284031215609b57600080fd5b81356099816076565b905092915050565bfea264697066735822122000000000000000000000000000000000000000000000000000000000000000006473' as `0x${string}`;

  console.error(`[Testnet] Deploying contract on ${chainConfig.name}...`);
  const hash = await walletClient.sendTransaction({ data: bytecode });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  return {
    success: true,
    chain: chainConfig.name,
    action: 'testnet-deploy',
    txHash: hash,
    blockNumber: Number(receipt.blockNumber),
    gasUsed: receipt.gasUsed.toString(),
    explorerUrl: `${chainConfig.explorer}/tx/${hash}`,
    details: { contractAddress: receipt.contractAddress },
  };
}

main().catch(err => {
  output({ success: false, error: err.message });
  process.exit(1);
});
