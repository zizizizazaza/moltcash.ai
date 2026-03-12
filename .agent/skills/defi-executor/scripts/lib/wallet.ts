/**
 * Wallet setup using viem — creates public client + wallet client from PRIVATE_KEY
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  type PublicClient,
  type WalletClient,
  type Chain,
  type Transport,
  type Account,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  mainnet, base, arbitrum, optimism, polygon,
  sepolia, baseSepolia, arbitrumSepolia,
} from 'viem/chains';
import { getChain, type ChainConfig } from './chains.js';

// Map chain IDs to viem chain objects
const viemChains: Record<number, Chain> = {
  1: mainnet,
  8453: base,
  42161: arbitrum,
  11155111: sepolia,
  84532: baseSepolia,
  421614: arbitrumSepolia,
};

export interface WalletSetup {
  account: Account;
  publicClient: PublicClient;
  walletClient: WalletClient<Transport, Chain, Account>;
  chainConfig: ChainConfig;
}

export function setupWallet(chainName: string): WalletSetup {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('PRIVATE_KEY env variable is required');
  }

  // Ensure 0x prefix
  const key = (privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`) as `0x${string}`;
  const account = privateKeyToAccount(key);

  const chainConfig = getChain(chainName);
  const viemChain = viemChains[chainConfig.id];
  if (!viemChain) {
    throw new Error(`No viem chain config for chain ID ${chainConfig.id}`);
  }

  const transport = http(chainConfig.rpcUrl);

  const publicClient = createPublicClient({
    chain: viemChain,
    transport,
  });

  const walletClient = createWalletClient({
    account,
    chain: viemChain,
    transport,
  });

  return { account, publicClient, walletClient: walletClient as any, chainConfig };
}

export async function getBalance(publicClient: PublicClient, address: `0x${string}`): Promise<string> {
  const balance = await publicClient.getBalance({ address });
  return formatEther(balance);
}

export function output(data: Record<string, any>) {
  console.log(JSON.stringify(data, null, 2));
}

export function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : 'true';
      result[key] = value;
      if (value !== 'true') i++;
    }
  }
  return result;
}
