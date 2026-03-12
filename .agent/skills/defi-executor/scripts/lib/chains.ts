/**
 * Chain configurations — RPC endpoints, contract addresses, explorer URLs
 */

export interface ChainConfig {
  id: number;
  name: string;
  rpcUrl: string;
  explorer: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  isTestnet: boolean;
  contracts: {
    weth?: `0x${string}`;
    uniswapRouter?: `0x${string}`;
    lido?: `0x${string}`;
    aavePool?: `0x${string}`;
  };
}

export const CHAINS: Record<string, ChainConfig> = {
  ethereum: {
    id: 1,
    name: 'Ethereum',
    rpcUrl: process.env.RPC_URL || 'https://eth.drpc.org',
    explorer: 'https://etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    isTestnet: false,
    contracts: {
      weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      uniswapRouter: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
      lido: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
      aavePool: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    },
  },
  base: {
    id: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    isTestnet: false,
    contracts: {
      weth: '0x4200000000000000000000000000000000000006',
      uniswapRouter: '0x2626664c2603336E57B271c5C0b26F421741e481',
      aavePool: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
    },
  },
  arbitrum: {
    id: 42161,
    name: 'Arbitrum One',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://arbiscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    isTestnet: false,
    contracts: {
      weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      uniswapRouter: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
      aavePool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    },
  },
  // ── Testnets ──
  sepolia: {
    id: 11155111,
    name: 'Sepolia',
    rpcUrl: 'https://sepolia.drpc.org',
    explorer: 'https://sepolia.etherscan.io',
    nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
    isTestnet: true,
    contracts: {
      weth: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
      uniswapRouter: '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E',
      aavePool: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951',
    },
  },
  'base-sepolia': {
    id: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    explorer: 'https://sepolia.basescan.org',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    isTestnet: true,
    contracts: {
      weth: '0x4200000000000000000000000000000000000006',
    },
  },
  'arbitrum-sepolia': {
    id: 421614,
    name: 'Arbitrum Sepolia',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    explorer: 'https://sepolia.arbiscan.io',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    isTestnet: true,
    contracts: {
      weth: '0x980B62Da83eFf3D4576C647993b0c1V7199CaD7F',
    },
  },
};

export function getChain(name: string): ChainConfig {
  const chain = CHAINS[name.toLowerCase()];
  if (!chain) {
    const available = Object.keys(CHAINS).join(', ');
    throw new Error(`Unknown chain: "${name}". Available: ${available}`);
  }
  return chain;
}
