import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FARM_DATA = [
    {
        type: 'quest', title: 'zkSync DeFi Explorer', description: 'Complete a full DeFi loop on zkSync Era: swap, provide liquidity, and bridge assets.',
        source: 'Galxe', chain: 'zkSync Era', reward: '500 XP + OAT', rewardType: 'fixed',
        estimatedGas: '$0.12', difficulty: 'Easy', tags: ['#defi', '#zksync'], isHot: true,
        steps: [
            { order: 1, action: 'swap', protocol: 'SyncSwap', description: 'Swap 0.01 ETH to USDC', estimatedGas: 0.02 },
            { order: 2, action: 'lp', protocol: 'Mute.io', description: 'Add liquidity to ETH-USDC pool', estimatedGas: 0.03 },
            { order: 3, action: 'bridge', protocol: 'zkSync Bridge', description: 'Bridge assets to mainnet', estimatedGas: 0.05 },
        ],
        participantCount: 1240, deadline: '2026-04-15',
    },
    {
        type: 'quest', title: 'Base Social Verification', description: 'Verify your social accounts and complete on-chain interactions on Base.',
        source: 'Layer3', chain: 'Base', reward: '1000 Points', rewardType: 'fixed',
        estimatedGas: '$0.08', difficulty: 'Easy', tags: ['#social', '#base'], isHot: false, isNew: true,
        steps: [
            { order: 1, action: 'social', protocol: 'Twitter', description: 'Connect Twitter account', estimatedGas: 0 },
            { order: 2, action: 'swap', protocol: 'Uniswap', description: 'Swap on Uniswap Base', estimatedGas: 0.04 },
            { order: 3, action: 'mint', protocol: 'Base NFT', description: 'Mint verification NFT', estimatedGas: 0.04 },
        ],
        participantCount: 890,
    },
    {
        type: 'quest', title: 'Scroll Origins NFT', description: 'Interact with Scroll mainnet protocols and claim your Origins NFT.',
        source: 'Galxe', chain: 'Scroll', reward: '300 XP + NFT', rewardType: 'fixed',
        estimatedGas: '$0.15', difficulty: 'Medium', tags: ['#nft', '#scroll'], isNew: true,
        steps: [
            { order: 1, action: 'swap', protocol: 'Ambient', description: 'Swap ETH on Ambient', estimatedGas: 0.05 },
            { order: 2, action: 'lp', protocol: 'Ambient', description: 'Provide LP on Ambient', estimatedGas: 0.05 },
            { order: 3, action: 'mint', protocol: 'Scroll', description: 'Mint Origins NFT', estimatedGas: 0.05 },
        ],
        participantCount: 2100,
    },
    {
        type: 'testnet', title: 'Monad Devnet Daily', description: 'Daily interactions on Monad devnet to build early activity history.',
        source: 'Monad', chain: 'Monad', reward: '🎰 Potential Airdrop', rewardType: 'potential',
        estimatedGas: 'Free', difficulty: 'Easy', tags: ['#testnet', '#monad'], isHot: true,
        steps: [
            { order: 1, action: 'faucet', protocol: 'Monad Faucet', description: 'Claim test tokens', estimatedGas: 0 },
            { order: 2, action: 'swap', protocol: 'Monad DEX', description: 'Swap on testnet DEX', estimatedGas: 0 },
            { order: 3, action: 'mint', protocol: 'Monad NFT', description: 'Mint test NFT', estimatedGas: 0 },
        ],
        participantCount: 5400,
    },
    {
        type: 'testnet', title: 'MegaETH Testnet', description: 'Interact with MegaETH testnet — the 100k TPS L2.',
        source: 'MegaETH', chain: 'MegaETH', reward: '🎰 Potential Airdrop', rewardType: 'potential',
        estimatedGas: 'Free', tags: ['#testnet', '#megaeth'], isNew: true,
        participantCount: 3200,
    },
    {
        type: 'testnet', title: 'Berachain bArtio', description: 'Stake, swap, and provide liquidity on Berachain testnet.',
        source: 'Berachain', chain: 'Berachain', reward: '🎰 Potential Airdrop', rewardType: 'potential',
        estimatedGas: 'Free', tags: ['#testnet', '#berachain'], isHot: true,
        participantCount: 8900,
    },
    {
        type: 'yield', title: 'Aave USDC Lending', description: 'Lend USDC on Aave Arbitrum for stable yield.',
        source: 'Aave', chain: 'Arbitrum', reward: '8.2% APY', rewardType: 'apy', rewardAmount: 8.2,
        estimatedGas: '$0.05', tags: ['#defi', '#aave', '#stablecoin'],
    },
    {
        type: 'yield', title: 'Pendle PT-stETH', description: 'Fixed yield on stETH via Pendle protocol.',
        source: 'Pendle', chain: 'Ethereum', reward: '12.5% APY', rewardType: 'apy', rewardAmount: 12.5,
        estimatedGas: '$2.50', tags: ['#defi', '#pendle'], isHot: true,
    },
    {
        type: 'yield', title: 'Morpho USDT Vault', description: 'Optimized USDT lending via Morpho curated vaults.',
        source: 'Morpho', chain: 'Base', reward: '6.8% APY', rewardType: 'apy', rewardAmount: 6.8,
        estimatedGas: '$0.03', tags: ['#defi', '#morpho', '#stablecoin'],
    },
];

const TASK_DATA = [
    {
        type: 'task', title: 'Audit DeFi Staking Contract', description: 'Review and audit a Solidity staking contract for vulnerabilities.',
        source: 'MoltCash', chain: 'Base', reward: '500 USDC', rewardType: 'fixed', rewardAmount: 500,
        difficulty: 'Hard', timeEstimate: '3-5 days', tags: ['#solidity', '#audit'], status: 'open',
    },
    {
        type: 'task', title: 'Translate Whitepaper EN→CN', description: 'Professional translation of a 20-page DeFi protocol whitepaper.',
        source: 'MoltCash', chain: 'Base', reward: '200 USDC', rewardType: 'fixed', rewardAmount: 200,
        difficulty: 'Medium', timeEstimate: '2-3 days', tags: ['#translation', '#content'], status: 'open',
    },
    {
        type: 'task', title: 'Build Token Dashboard UI', description: 'Create a React dashboard showing token analytics with charts.',
        source: 'MoltCash', chain: 'Base', reward: '800 USDC', rewardType: 'fixed', rewardAmount: 800,
        difficulty: 'Medium', timeEstimate: '3-5 days', tags: ['#frontend', '#react'], status: 'open',
    },
    {
        type: 'task', title: 'Data Labeling for AI Model', description: 'Label 5000 crypto transaction records for fraud detection model training.',
        source: 'MoltCash', chain: 'Base', reward: '150 USDC', rewardType: 'fixed', rewardAmount: 150,
        difficulty: 'Easy', timeEstimate: '1-2 days', tags: ['#data', '#labeling'], status: 'open',
    },
];

async function seed() {
    console.log('🌱 Seeding database...');

    // Clean
    await prisma.comment.deleteMany();
    await prisma.deliverable.deleteMany();
    await prisma.application.deleteMany();
    await prisma.farmSession.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.review.deleteMany();
    await prisma.opportunity.deleteMany();
    await prisma.quota.deleteMany();
    await prisma.user.deleteMany();

    // Create demo user
    const user = await prisma.user.create({
        data: {
            privyId: 'did:privy:demo-user-001',
            walletAddress: '0xdemo000000000000000000000000000000000001',
            displayName: 'Demo Agent',
            totalEarned: 1284.5,
            credits: 2500,
            points: 8400,
            completedQuests: 42,
            completedTasks: 3,
            rating: 4.8,
            quota: {
                create: { questsUsed: 3, testnetInteractions: 12, yieldDeposited: 120 },
            },
        },
    });

    console.log(`  ✓ User created: ${user.walletAddress}`);

    // Seed opportunities
    for (const item of [...FARM_DATA, ...TASK_DATA]) {
        await prisma.opportunity.create({
            data: {
                type: item.type,
                title: item.title,
                description: item.description,
                source: item.source,
                chain: item.chain,
                reward: item.reward,
                rewardType: item.rewardType,
                rewardAmount: (item as any).rewardAmount || null,
                estimatedGas: (item as any).estimatedGas || null,
                difficulty: (item as any).difficulty || null,
                timeEstimate: (item as any).timeEstimate || null,
                tags: JSON.stringify(item.tags || []),
                isHot: (item as any).isHot || false,
                isNew: (item as any).isNew || false,
                steps: (item as any).steps ? JSON.stringify((item as any).steps) : null,
                participantCount: (item as any).participantCount || 0,
                deadline: (item as any).deadline ? new Date((item as any).deadline) : null,
                status: (item as any).status || 'active',
                publisherId: item.type === 'task' ? user.id : null,
            },
        });
    }

    console.log(`  ✓ ${FARM_DATA.length + TASK_DATA.length} opportunities seeded`);
    console.log('✅ Seed complete!');
}

seed()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
