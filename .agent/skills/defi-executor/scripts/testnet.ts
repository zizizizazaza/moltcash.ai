#!/usr/bin/env npx tsx
/**
 * testnet.ts — Perform testnet interactions for airdrop farming
 * 
 * Usage:
 *   PRIVATE_KEY=0x... npx tsx testnet.ts --chain sepolia --action faucet
 *   PRIVATE_KEY=0x... npx tsx testnet.ts --chain sepolia --action swap --amount 0.001
 *   PRIVATE_KEY=0x... npx tsx testnet.ts --chain sepolia --action deploy
 *   PRIVATE_KEY=0x... npx tsx testnet.ts --chain sepolia --action transfer --to 0x... --amount 0.001
 */

import { parseEther, formatEther, encodeFunctionData } from 'viem';
import { setupWallet, getBalance, output, parseArgs } from './lib/wallet.js';

// Minimal contract bytecode: a simple storage contract for deploy action
const SIMPLE_CONTRACT_BYTECODE = '0x6080604052348015600f57600080fd5b5060ac8061001e6000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c806360fe47b11460375780636d4ce63c14604f575b600080fd5b604d60048036038101906049919060699060830391505683565b005b60556057565b60408051918252519081900360200190f35b60005490565b600080fd5b6000819050919050565b607d81606c565b8114608757600080fd5b50565b600060208284031215609b57600080fd5b81356099816076565b905092915050565bfea264697066735822122000000000000000000000000000000000000000000000000000000000000000006473' as `0x${string}`;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const chainName = args.chain || 'sepolia';
  const action = args.action || 'faucet';

  const { account, publicClient, walletClient, chainConfig } = setupWallet(chainName);
  const address = account.address;

  if (!chainConfig.isTestnet) {
    output({ success: false, error: `${chainConfig.name} is not a testnet. Use a testnet chain for safety.` });
    process.exit(1);
  }

  console.error(`[Testnet] Wallet: ${address}`);
  console.error(`[Testnet] Chain: ${chainConfig.name} (testnet)`);

  const balance = await getBalance(publicClient, address);
  console.error(`[Testnet] Balance: ${balance} ETH`);

  switch (action) {
    case 'faucet':
      await handleFaucet(chainName, address);
      break;

    case 'swap':
      await handleSwap(args, { account, publicClient, walletClient, chainConfig });
      break;

    case 'deploy':
      await handleDeploy({ account, publicClient, walletClient, chainConfig });
      break;

    case 'transfer':
      await handleTransfer(args, { account, publicClient, walletClient, chainConfig });
      break;

    default:
      output({ success: false, error: `Unknown action: "${action}". Available: faucet, swap, deploy, transfer` });
      process.exit(1);
  }
}

// ── Faucet ──
async function handleFaucet(chainName: string, address: string) {
  const faucets: Record<string, string[]> = {
    sepolia: [
      `https://faucets.chain.link/sepolia`,
      `https://sepolia-faucet.pk910.de`,
      `https://www.alchemy.com/faucets/ethereum-sepolia`,
    ],
    'base-sepolia': [
      `https://www.coinbase.com/faucets/base-ethereum-goerli-faucet`,
    ],
    'arbitrum-sepolia': [
      `https://faucets.chain.link/arbitrum-sepolia`,
    ],
  };

  const urls = faucets[chainName] || [];
  
  // Try programmatic faucet if available
  console.error(`[Faucet] Attempting programmatic faucet claim...`);
  
  // For Sepolia, try the PoW faucet API
  if (chainName === 'sepolia') {
    try {
      const res = await fetch('https://sepolia-faucet.pk910.de/api/getFaucetStatus');
      if (res.ok) {
        const data = await res.json() as any;
        console.error(`[Faucet] PoW Faucet available. Queue: ${data.queueLength || 'unknown'}`);
      }
    } catch {
      // ignore
    }
  }

  output({
    success: true,
    chain: chainName,
    action: 'faucet',
    details: {
      address,
      message: 'Visit one of the faucet URLs below to claim testnet ETH',
      faucetUrls: urls,
      tip: 'Some faucets require connecting a wallet or solving a captcha',
    },
  });
}

// ── Testnet Swap (self-transfer to create tx activity) ──
async function handleSwap(args: Record<string, string>, wallet: any) {
  const { account, publicClient, walletClient, chainConfig } = wallet;
  const amount = args.amount || '0.0001';
  const amountWei = parseEther(amount);

  const balance = await publicClient.getBalance({ address: account.address });
  if (balance < amountWei + parseEther('0.001')) {
    output({ success: false, error: `Insufficient testnet ETH. Have ${formatEther(balance)}, need ${amount} + gas` });
    process.exit(1);
  }

  // WETH wrap/unwrap as a swap-like tx (if WETH available)
  const weth = chainConfig.contracts.weth;
  if (weth) {
    console.error(`[Swap] Wrapping ${amount} ETH → WETH on ${chainConfig.name}...`);
    
    // WETH deposit() — just send ETH with deposit function selector
    const hash = await walletClient.sendTransaction({
      to: weth,
      value: amountWei,
      data: '0xd0e30db0' as `0x${string}`, // deposit() selector
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.error(`[Swap] ✅ Wrapped in block ${receipt.blockNumber}`);

    output({
      success: true,
      chain: chainConfig.name,
      action: 'swap',
      protocol: 'weth',
      txHash: hash,
      blockNumber: Number(receipt.blockNumber),
      gasUsed: receipt.gasUsed.toString(),
      explorerUrl: `${chainConfig.explorer}/tx/${hash}`,
      details: {
        type: 'ETH → WETH wrap',
        amount: `${amount} ETH`,
      },
    });
  } else {
    // Fallback: self-transfer
    console.error(`[Swap] Self-transfer ${amount} ETH for tx activity...`);
    const hash = await walletClient.sendTransaction({
      to: account.address,
      value: amountWei,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    output({
      success: true,
      chain: chainConfig.name,
      action: 'swap',
      protocol: 'self-transfer',
      txHash: hash,
      blockNumber: Number(receipt.blockNumber),
      gasUsed: receipt.gasUsed.toString(),
      explorerUrl: `${chainConfig.explorer}/tx/${hash}`,
      details: { amount: `${amount} ETH`, type: 'self-transfer for activity' },
    });
  }
}

// ── Deploy a simple contract ──
async function handleDeploy(wallet: any) {
  const { account, publicClient, walletClient, chainConfig } = wallet;

  console.error(`[Deploy] Deploying simple storage contract on ${chainConfig.name}...`);

  // Deploy minimal contract (simple getter/setter)
  const hash = await walletClient.sendTransaction({
    data: SIMPLE_CONTRACT_BYTECODE,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const contractAddress = receipt.contractAddress;

  console.error(`[Deploy] ✅ Contract deployed at ${contractAddress} in block ${receipt.blockNumber}`);

  output({
    success: true,
    chain: chainConfig.name,
    action: 'deploy',
    txHash: hash,
    blockNumber: Number(receipt.blockNumber),
    gasUsed: receipt.gasUsed.toString(),
    explorerUrl: `${chainConfig.explorer}/tx/${hash}`,
    details: {
      contractAddress,
      type: 'SimpleStorage',
    },
  });
}

// ── Transfer ETH ──
async function handleTransfer(args: Record<string, string>, wallet: any) {
  const { account, publicClient, walletClient, chainConfig } = wallet;
  const to = args.to as `0x${string}`;
  const amount = args.amount || '0.001';

  if (!to) {
    output({ success: false, error: 'Missing --to address' });
    process.exit(1);
  }

  const amountWei = parseEther(amount);
  console.error(`[Transfer] Sending ${amount} ETH to ${to}...`);

  const hash = await walletClient.sendTransaction({
    to,
    value: amountWei,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.error(`[Transfer] ✅ Confirmed in block ${receipt.blockNumber}`);

  output({
    success: true,
    chain: chainConfig.name,
    action: 'transfer',
    txHash: hash,
    blockNumber: Number(receipt.blockNumber),
    gasUsed: receipt.gasUsed.toString(),
    explorerUrl: `${chainConfig.explorer}/tx/${hash}`,
    details: { to, amount: `${amount} ETH` },
  });
}

main().catch(err => {
  output({ success: false, error: err.message });
  process.exit(1);
});
