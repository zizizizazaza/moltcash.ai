import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, base, arbitrum, optimism, polygon, zkSync, scroll } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
    appName: 'MoltCash',
    // 去 https://cloud.walletconnect.com 免费注册获取
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'PLACEHOLDER_PROJECT_ID',
    chains: [mainnet, base, arbitrum, optimism, polygon, zkSync, scroll],
    ssr: false,
});
