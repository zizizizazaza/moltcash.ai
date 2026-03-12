import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db.js';
type Tx = Omit<typeof prisma, '$transaction' | '$connect' | '$disconnect' | '$on' | '$extends'>;
import { authRequired, authOptional, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { financialLimiter } from '../middleware/rateLimiter.js';
import { getTierDetails } from '../services/credit.service.js';

// Base rate: 1 USDC = 1 AIUSD, fee based on credit tier
const BASE_RATE = 1.0;
const BASE_APY = 5.24;

const router = Router();

// Get portfolio holdings
router.get('/holdings', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const holdings = await prisma.portfolioHolding.findMany({
      where: { userId: req.userId },
    });
    res.json(holdings);
  } catch (err) {
    next(err);
  }
});

// Get transaction history
router.get('/history', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(transactions);
  } catch (err) {
    next(err);
  }
});

// Get investments
router.get('/investments', authRequired, async (req: AuthRequest, res, next) => {
  try {
    const investments = await prisma.investment.findMany({
      where: { userId: req.userId },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            apy: true,
            status: true,
            coverImage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(investments);
  } catch (err) {
    next(err);
  }
});

// ============ Swap Quote (preview fee + net amounts) ============
const quoteSchema = z.object({
  amount: z.number().positive(),
  action: z.enum(['mint', 'redeem']),
});

router.post('/swap-quote', authOptional, async (req: AuthRequest, res, next) => {
  try {
    const { amount, action } = quoteSchema.parse(req.body);

    // Get user's credit tier for fee calculation
    let feeRate = 0.025; // default: 2.5% for unauthenticated
    let tierName = 'Unranked';
    if (req.userId) {
      const user = await prisma.user.findUnique({ where: { id: req.userId } });
      if (user) {
        const tier = getTierDetails(user.creditScore);
        feeRate = tier.feeRate;
        tierName = tier.name;
      }
    }

    const fee = amount * feeRate;
    const netAmount = amount - fee;

    res.json({
      action,
      inputAmount: amount,
      rate: BASE_RATE,
      feeRate,
      fee: parseFloat(fee.toFixed(4)),
      netAmount: parseFloat(netAmount.toFixed(4)),
      tier: tierName,
      apy: BASE_APY,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    next(err);
  }
});

// ============ Mint AIUSD (Deposit USDC → AIUSD) ============
const mintSchema = z.object({
  amount: z.number().positive(),
});

router.post('/mint', authRequired, financialLimiter, async (req: AuthRequest, res, next) => {
  try {
    const { amount } = mintSchema.parse(req.body);
    const userId = req.userId as string;

    // Calculate fee based on credit tier
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tier = getTierDetails(user?.creditScore ?? 100);
    const fee = amount * tier.feeRate;
    const netAmount = amount - fee;

    const result = await prisma.$transaction(async (tx: Tx) => {
      // Upsert AIUSD holding (net of fees)
      const existing = await tx.portfolioHolding.findUnique({
        where: { userId_asset: { userId, asset: 'AIUSD' } },
      });

      if (existing) {
        await tx.portfolioHolding.update({
          where: { id: existing.id },
          data: { amount: existing.amount + netAmount, currentApy: BASE_APY },
        });
      } else {
        await tx.portfolioHolding.create({
          data: { userId, asset: 'AIUSD', amount: netAmount, avgCost: BASE_RATE, currentApy: BASE_APY },
        });
      }

      const transaction = await tx.transaction.create({
        data: { userId, type: 'MINT', amount: netAmount, asset: 'AIUSD', status: 'COMPLETED' },
      });

      return transaction;
    });

    res.status(201).json({
      ...result,
      inputAmount: amount,
      fee: parseFloat(fee.toFixed(4)),
      feeRate: tier.feeRate,
      netAmount: parseFloat(netAmount.toFixed(4)),
      tier: tier.name,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    next(err);
  }
});

// ============ Token Swap (Buy/Sell Web3 tokens with USDC) ============
const swapSchema = z.object({
  token: z.string().min(1),
  tokenSymbol: z.string().min(1),
  action: z.enum(['buy', 'sell']),
  amount: z.number().positive(),
  amountType: z.enum(['token', 'usd']).default('token'),
  estimatedUSD: z.number().positive().optional(),
  chain: z.string().default('base'),
});

// Simulated price feed — in production: use CoinGecko / 0x quote API / Pyth oracle
const TOKEN_PRICES: Record<string, number> = {
  // Major tokens
  ETH: 2450, WETH: 2450, WBTC: 62500, BTC: 62500,
  // Stablecoins
  USDC: 1.0, DAI: 1.0, USDT: 1.0,
  // DeFi blue chips
  LINK: 14.5, UNI: 7.2, AAVE: 95.0, COMP: 52.0, MKR: 1450,
  SNX: 2.8, CRV: 0.55, SUSHI: 1.1, BAL: 3.8, YFI: 7200,
  // Base ecosystem tokens
  AERO: 1.35, WELL: 0.045, VIRTUAL: 0.82, DEGEN: 0.008,
  BRETT: 0.095, TOSHI: 0.0003, PRIME: 8.5, RSR: 0.008, AXL: 0.72,
  // L2 / Cross-chain
  ARB: 1.1, OP: 2.3, MATIC: 0.72, SOL: 145,
  // Liquid staking
  cbETH: 2520, rETH: 2580, wstETH: 2600,
  // Other popular  
  PEPE: 0.0000085, SHIB: 0.000015, DOGE: 0.12, LDO: 1.9,
};

// Get supported tokens and prices
router.get('/supported-tokens', (_req, res) => {
  const tokens = Object.entries(TOKEN_PRICES).map(([symbol, price]) => ({
    symbol,
    price,
    chain: 'base',
  }));
  res.json({ chain: 'base', count: tokens.length, tokens });
});

router.post('/swap', authRequired, financialLimiter, async (req: AuthRequest, res, next) => {
  try {
    const data = swapSchema.parse(req.body);
    const userId = req.userId as string;
    const symbol = data.tokenSymbol.toUpperCase();
    const price = TOKEN_PRICES[symbol];
    if (!price) throw new AppError(`Token ${symbol} is not supported`, 400);

    // Calculate amounts
    let tokenAmount: number;
    let usdAmount: number;
    if (data.amountType === 'usd') {
      usdAmount = data.amount;
      tokenAmount = usdAmount / price;
    } else {
      tokenAmount = data.amount;
      usdAmount = tokenAmount * price;
    }

    // Simulate ~0.5% slippage + $0.02 gas
    const slippage = usdAmount * 0.005;
    const gasFee = 0.02;
    const totalCostUSD = usdAmount + slippage + gasFee;

    const result = await prisma.$transaction(async (tx: Tx) => {
      if (data.action === 'buy') {
        // Upsert token holding
        const existing = await tx.portfolioHolding.findUnique({
          where: { userId_asset: { userId, asset: symbol } },
        });
        if (existing) {
          const newAmount = existing.amount + tokenAmount;
          const newAvgCost = ((existing.avgCost * existing.amount) + (price * tokenAmount)) / newAmount;
          await tx.portfolioHolding.update({
            where: { id: existing.id },
            data: { amount: newAmount, avgCost: newAvgCost },
          });
        } else {
          await tx.portfolioHolding.create({
            data: { userId, asset: symbol, amount: tokenAmount, avgCost: price },
          });
        }
      } else {
        // Sell — check balance
        const existing = await tx.portfolioHolding.findUnique({
          where: { userId_asset: { userId, asset: symbol } },
        });
        if (!existing || existing.amount < tokenAmount) {
          throw new AppError(`Insufficient ${symbol} balance`, 400);
        }
        if (existing.amount === tokenAmount) {
          await tx.portfolioHolding.delete({ where: { id: existing.id } });
        } else {
          await tx.portfolioHolding.update({
            where: { id: existing.id },
            data: { amount: existing.amount - tokenAmount },
          });
        }
      }

      // Record transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: 'SWAP',
          amount: tokenAmount,
          asset: symbol,
          status: 'COMPLETED',
          txHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        },
      });

      return {
        transaction,
        action: data.action,
        token: symbol,
        tokenAmount: parseFloat(tokenAmount.toFixed(8)),
        pricePerToken: price,
        totalUSD: parseFloat(totalCostUSD.toFixed(2)),
        slippage: parseFloat(slippage.toFixed(2)),
        gasFee,
        chain: data.chain,
      };
    });

    res.status(201).json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    next(err);
  }
});

// ============ Redeem AIUSD (AIUSD → USDC) ============
router.post('/redeem', authRequired, financialLimiter, async (req: AuthRequest, res, next) => {
  try {
    const { amount } = mintSchema.parse(req.body);
    const userId = req.userId as string;

    // Calculate fee based on credit tier
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tier = getTierDetails(user?.creditScore ?? 100);
    const fee = amount * tier.feeRate;
    const netAmount = amount - fee;

    const result = await prisma.$transaction(async (tx: Tx) => {
      const holding = await tx.portfolioHolding.findUnique({
        where: { userId_asset: { userId, asset: 'AIUSD' } },
      });

      if (!holding || holding.amount < amount) {
        throw new AppError('Insufficient AIUSD balance', 400);
      }

      if (holding.amount === amount) {
        await tx.portfolioHolding.delete({ where: { id: holding.id } });
      } else {
        await tx.portfolioHolding.update({
          where: { id: holding.id },
          data: { amount: holding.amount - amount },
        });
      }

      const transaction = await tx.transaction.create({
        data: { userId, type: 'REDEEM', amount: netAmount, asset: 'AIUSD', status: 'COMPLETED' },
      });

      return transaction;
    });

    res.status(201).json({
      ...result,
      inputAmount: amount,
      fee: parseFloat(fee.toFixed(4)),
      feeRate: tier.feeRate,
      netAmount: parseFloat(netAmount.toFixed(4)),
      tier: tier.name,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    next(err);
  }
});

export default router;
