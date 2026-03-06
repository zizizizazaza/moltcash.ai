
export interface TreasuryStats {
  tvl: number;
  collateralRatio: number;
  treasuryRevenue: number;
  lastPoR: string;
  reserveAllocation: {
    tBills: number;
    liquidity: number;
    operations: number;
  };
}

export interface MarketAsset {
  id: string;
  title: string;
  subtitle: string;
  category: 'Compute' | 'SaaS' | 'E-commerce';
  issuer: string;
  faceValue: number;
  askPrice: number;
  apy: number;
  durationDays: number;
  creditScore: number;
  status: 'Fundraising' | 'Ending Soon' | 'Sold Out' | 'Failed' | 'Funded';
  targetAmount: number;
  raisedAmount: number;
  backersCount: number;
  remainingCap: number;
  coverageRatio: number;
  verifiedSource: string;
  description: string;
  useOfFunds: string;
  monthlyRevenue: { month: string; amount: number }[];
  coverImage: string;
  issuerLogo: string;
}

export interface HistoryItem {
  timestamp: string;
  type: 'MINT' | 'REDEEM' | 'INTEREST' | 'DEPOSIT';
  amount: number;
  asset: string;
  status: 'COMPLETED' | 'PENDING' | 'QUEUED';
}

export interface TradeOrder {
  id: string;
  projectId: string;
  projectTitle: string;
  projectCoverImage: string;
  projectIssuer: string;
  projectIssuerLogo: string;
  projectApy: number;
  projectDurationDays: number;
  seller: string;
  listPrice: number;
  originalPrice: number;
  shares: number;
  totalValue: number;
  expectedReturn: number;
  expectedYield: number;
  listedAt: string;
  status: 'Listed' | 'Sold';
  buyer?: string;
  soldAt?: string;
}

export enum Page {
  LANDING = 'LANDING',
  DASHBOARD = 'DASHBOARD',
  SWAP = 'SWAP',
  MARKET = 'MARKET',
  PORTFOLIO = 'PORTFOLIO',
  AGENT = 'AGENT',
  CHAT = 'CHAT',
  GROUPS = 'GROUPS',
  SETTINGS = 'SETTINGS',
  TRADE = 'TRADE'
}
