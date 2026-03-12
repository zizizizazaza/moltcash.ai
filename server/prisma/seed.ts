import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@loka.finance' },
    update: {},
    create: {
      email: 'demo@loka.finance',
      name: 'Demo User',
      authProvider: 'email',
      role: 'investor',
      kycStatus: 'verified',
      creditScore: 850,
      riskAccepted: true,
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    },
  });

  console.log(`  ✅ User: ${user.email}`);

  // Create projects (matching frontend mock data)
  const projects = [
    {
      title: 'AI Agent Marketplace',
      subtitle: 'Autonomous Agent Revenue Stream',
      category: 'Compute',
      issuer: 'AgentDAO',
      faceValue: 100,
      askPrice: 97,
      apy: 18.5,
      durationDays: 180,
      creditScore: 780,
      status: 'Fundraising',
      targetAmount: 500000,
      raisedAmount: 105000,
      backersCount: 45,
      remainingCap: 395000,
      coverageRatio: 1.5,
      verifiedSource: 'Stripe API',
      description: 'Marketplace for autonomous AI agents generating revenue through task completion and API services.',
      useOfFunds: 'GPU infrastructure scaling, agent training, marketplace development',
      coverImage: '',
      issuerLogo: '',
    },
    {
      title: 'Climapp.io Utility',
      subtitle: 'Climate Data SaaS Revenue',
      category: 'SaaS',
      issuer: 'ClimApp Inc.',
      faceValue: 100,
      askPrice: 98,
      apy: 14.2,
      durationDays: 365,
      creditScore: 720,
      status: 'Fundraising',
      targetAmount: 300000,
      raisedAmount: 6000,
      backersCount: 12,
      remainingCap: 294000,
      coverageRatio: 1.2,
      verifiedSource: 'QuickBooks',
      description: 'B2B climate data analytics platform serving enterprise customers with real-time environmental insights.',
      useOfFunds: 'Data infrastructure, sales team expansion, API development',
      coverImage: '',
      issuerLogo: '',
    },
    {
      title: 'Market Maker AI',
      subtitle: 'Algorithmic Trading Revenue',
      category: 'Compute',
      issuer: 'QuantFlow Labs',
      faceValue: 100,
      askPrice: 95,
      apy: 22.0,
      durationDays: 90,
      creditScore: 810,
      status: 'Funded',
      targetAmount: 800000,
      raisedAmount: 760000,
      backersCount: 180,
      remainingCap: 40000,
      coverageRatio: 2.1,
      verifiedSource: 'Stripe API',
      description: 'High-frequency market making AI generating consistent returns through spread capture.',
      useOfFunds: 'Trading infrastructure, risk management systems, compliance',
      coverImage: '',
      issuerLogo: '',
    },
    {
      title: 'MEV Searcher Agent',
      subtitle: 'On-chain MEV Extraction',
      category: 'Compute',
      issuer: 'FlashLabs',
      faceValue: 100,
      askPrice: 93,
      apy: 25.5,
      durationDays: 120,
      creditScore: 690,
      status: 'Fundraising',
      targetAmount: 400000,
      raisedAmount: 160000,
      backersCount: 67,
      remainingCap: 240000,
      coverageRatio: 1.8,
      verifiedSource: 'On-chain Analytics',
      description: 'MEV extraction bot operating across multiple EVM chains.',
      useOfFunds: 'Node infrastructure, strategy development, gas optimization',
      coverImage: '',
      issuerLogo: '',
    },
    {
      title: 'Copy Trading AI',
      subtitle: 'Social Trading Revenue',
      category: 'SaaS',
      issuer: 'MirrorTrade',
      faceValue: 100,
      askPrice: 96,
      apy: 16.8,
      durationDays: 270,
      creditScore: 750,
      status: 'Fundraising',
      targetAmount: 350000,
      raisedAmount: 273000,
      backersCount: 92,
      remainingCap: 77000,
      coverageRatio: 1.6,
      verifiedSource: 'Stripe API',
      description: 'AI-powered copy trading platform with automated portfolio management.',
      useOfFunds: 'AI model training, platform development, marketing',
      coverImage: '',
      issuerLogo: '',
    },
  ];

  for (const p of projects) {
    const project = await prisma.project.create({ data: p });

    // Add monthly revenue data
    const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    const baseRevenue = p.targetAmount * 0.05;
    for (const month of months) {
      await prisma.monthlyRevenue.create({
        data: {
          projectId: project.id,
          month,
          amount: baseRevenue + Math.random() * baseRevenue * 0.4,
        },
      });
    }

    console.log(`  ✅ Project: ${project.title}`);
  }

  // Create treasury snapshot
  await prisma.treasurySnapshot.create({
    data: {
      tvl: 128450000,
      collateralRatio: 104.2,
      treasuryRevenue: 2450000,
      tBillsPercent: 90,
      liquidityPercent: 7,
      operationsPercent: 3,
      lastPoR: new Date(),
    },
  });
  console.log('  ✅ Treasury snapshot');

  // Create portfolio holdings for demo user
  await prisma.portfolioHolding.createMany({
    data: [
      { userId: user.id, asset: 'AIUSD', amount: 10000, avgCost: 1.0, currentApy: 5.24 },
      { userId: user.id, asset: 'T-Bill Fund', amount: 2000, avgCost: 99.5, currentApy: 4.8 },
      { userId: user.id, asset: 'AI Agent Marketplace', amount: 450.88, avgCost: 97, currentApy: 18.5 },
    ],
  });
  console.log('  ✅ Portfolio holdings');

  // Create some transaction history
  await prisma.transaction.createMany({
    data: [
      { userId: user.id, type: 'DEPOSIT', amount: 10000, asset: 'USDC', status: 'COMPLETED' },
      { userId: user.id, type: 'MINT', amount: 10000, asset: 'AIUSD', status: 'COMPLETED' },
      { userId: user.id, type: 'INTEREST', amount: 45.2, asset: 'AIUSD', status: 'COMPLETED' },
      { userId: user.id, type: 'DEPOSIT', amount: 2500, asset: 'USDC', status: 'COMPLETED' },
    ],
  });
  console.log('  ✅ Transactions');

  console.log('✅ Seed complete!');
}

seed()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
