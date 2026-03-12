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

  // ============ Repayment & Issuer Seed Data ============

  // Find funded projects for repayment schedules
  const allProjects = await prisma.project.findMany();
  const marketMakerAI = allProjects.find(p => p.title === 'Market Maker AI')!;
  const copyTradingAI = allProjects.find(p => p.title === 'Copy Trading AI')!;
  const aiAgentMarketplace = allProjects.find(p => p.title === 'AI Agent Marketplace')!;

  // Create investments for demo user in funded projects
  const inv1 = await prisma.investment.create({
    data: {
      userId: user.id,
      projectId: marketMakerAI.id,
      amount: 15000,
      shares: 150,
      status: 'active',
    },
  });
  const inv2 = await prisma.investment.create({
    data: {
      userId: user.id,
      projectId: copyTradingAI.id,
      amount: 5000,
      shares: 50,
      status: 'active',
    },
  });
  const inv3 = await prisma.investment.create({
    data: {
      userId: user.id,
      projectId: aiAgentMarketplace.id,
      amount: 2000,
      shares: 20,
      status: 'active',
    },
  });
  console.log('  ✅ Investments (3 projects)');

  // --- Market Maker AI: 6-month schedule, 4 paid + 1 overdue + 1 upcoming ---
  const now = new Date();
  const mmSchedule = [];
  for (let i = 1; i <= 6; i++) {
    const dueDate = new Date(now);
    dueDate.setMonth(dueDate.getMonth() - 6 + i); // spread across past to future
    dueDate.setDate(15); // due on 15th
    const principalDue = 760000 / 6;
    const interestDue = (760000 * 0.22) / 6;
    const totalDue = principalDue + interestDue;

    let status = 'upcoming';
    let paidAmount = 0;
    let paidAt: Date | null = null;

    if (i <= 4) {
      status = 'paid';
      paidAmount = totalDue;
      paidAt = new Date(dueDate);
      paidAt.setDate(paidAt.getDate() - 2); // paid 2 days before due
    } else if (i === 5) {
      status = 'overdue'; // missed this one
    }
    // i === 6 stays 'upcoming'

    mmSchedule.push({
      projectId: marketMakerAI.id,
      periodNumber: i,
      dueDate,
      principalDue: Math.round(principalDue * 100) / 100,
      interestDue: Math.round(interestDue * 100) / 100,
      totalDue: Math.round(totalDue * 100) / 100,
      paidAmount: Math.round(paidAmount * 100) / 100,
      status,
      paidAt,
    });
  }
  await prisma.repaymentSchedule.createMany({ data: mmSchedule });
  console.log('  ✅ Repayment: Market Maker AI (4 paid, 1 overdue, 1 upcoming)');

  // --- Copy Trading AI: 9-month schedule, 3 paid + 6 upcoming (on track) ---
  const ctSchedule = [];
  for (let i = 1; i <= 9; i++) {
    const dueDate = new Date(now);
    dueDate.setMonth(dueDate.getMonth() - 3 + i);
    dueDate.setDate(1);
    const principalDue = 350000 / 9;
    const interestDue = (350000 * 0.168) / 9;
    const totalDue = principalDue + interestDue;

    let status = 'upcoming';
    let paidAmount = 0;
    let paidAt: Date | null = null;

    if (i <= 3) {
      status = 'paid';
      paidAmount = totalDue;
      paidAt = new Date(dueDate);
      paidAt.setDate(paidAt.getDate() + 1); // paid 1 day after due (still on time)
    }

    ctSchedule.push({
      projectId: copyTradingAI.id,
      periodNumber: i,
      dueDate,
      principalDue: Math.round(principalDue * 100) / 100,
      interestDue: Math.round(interestDue * 100) / 100,
      totalDue: Math.round(totalDue * 100) / 100,
      paidAmount: Math.round(paidAmount * 100) / 100,
      status,
      paidAt,
    });
  }
  await prisma.repaymentSchedule.createMany({ data: ctSchedule });
  console.log('  ✅ Repayment: Copy Trading AI (3 paid, 6 upcoming)');

  // --- AI Agent Marketplace: 12-month schedule, 2 paid + 10 upcoming (early stage) ---
  const amSchedule = [];
  for (let i = 1; i <= 12; i++) {
    const dueDate = new Date(now);
    dueDate.setMonth(dueDate.getMonth() - 2 + i);
    dueDate.setDate(20);
    const principalDue = 500000 / 12;
    const interestDue = (500000 * 0.185) / 12;
    const totalDue = principalDue + interestDue;

    let status = 'upcoming';
    let paidAmount = 0;
    let paidAt: Date | null = null;

    if (i <= 2) {
      status = 'paid';
      paidAmount = totalDue;
      paidAt = new Date(dueDate);
      paidAt.setDate(paidAt.getDate() - 1);
    }

    amSchedule.push({
      projectId: aiAgentMarketplace.id,
      periodNumber: i,
      dueDate,
      principalDue: Math.round(principalDue * 100) / 100,
      interestDue: Math.round(interestDue * 100) / 100,
      totalDue: Math.round(totalDue * 100) / 100,
      paidAmount: Math.round(paidAmount * 100) / 100,
      status,
      paidAt,
    });
  }
  await prisma.repaymentSchedule.createMany({ data: amSchedule });
  console.log('  ✅ Repayment: AI Agent Marketplace (2 paid, 10 upcoming)');

  // Create interest payment transactions for the demo user
  const interestTxs = [];
  for (const s of [...mmSchedule, ...ctSchedule, ...amSchedule].filter(s => s.status === 'paid')) {
    interestTxs.push({
      userId: user.id,
      type: 'INTEREST',
      amount: Math.round(s.interestDue * 0.02 * 100) / 100, // user's proportional share (~2%)
      asset: 'AIUSD',
      status: 'COMPLETED',
    });
  }
  if (interestTxs.length > 0) {
    await prisma.transaction.createMany({ data: interestTxs });
  }
  console.log(`  ✅ Interest transactions (${interestTxs.length} payouts)`);

  // ============ Issuer / Enterprise Seed Data ============

  // Create an issuer user (for enterprise tab)
  const issuer = await prisma.user.upsert({
    where: { email: 'issuer@quantflow.io' },
    update: {},
    create: {
      email: 'issuer@quantflow.io',
      name: 'QuantFlow Labs',
      authProvider: 'email',
      role: 'issuer',
      kycStatus: 'verified',
      creditScore: 810,
      riskAccepted: true,
    },
  });
  console.log(`  ✅ Issuer: ${issuer.email}`);

  // Enterprise verification for issuer
  const enterprise = await prisma.enterpriseVerification.create({
    data: {
      userId: issuer.id,
      companyName: 'QuantFlow Labs Pte Ltd',
      country: 'Singapore',
      registrationNo: '202398765B',
      step: 4,
      status: 'verified',
      creditAwarded: 100,
      sbtMinted: true,
    },
  });
  console.log('  ✅ Enterprise verification');

  // Applications for the issuer
  await prisma.proposedApplication.create({
    data: {
      enterpriseId: enterprise.id,
      userId: issuer.id,
      projectName: 'Market Maker AI',
      category: 'Compute',
      monthlyRevenue: 120000,
      requestedAmount: 800000,
      proposedApy: 22,
      durationDays: 90,
      status: 'approved',
      description: 'High-frequency market making AI',
      collateralType: 'deposit',
      collateralValue: 240000,
      revenueSource: 'Stripe API',
    },
  });
  console.log('  ✅ Proposed application (Market Maker AI)');

  // Add collateral for Market Maker AI
  await prisma.collateral.createMany({
    data: [
      { projectId: marketMakerAI.id, type: 'deposit', description: 'USDC Security Deposit', value: 150000, status: 'pledged' },
      { projectId: marketMakerAI.id, type: 'receivable', description: 'Q2 2026 Trading Revenue Receivable', value: 90000, status: 'pledged' },
    ],
  });
  console.log('  ✅ Collateral (Market Maker AI)');

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
