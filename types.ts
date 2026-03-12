export enum Page {
  LANDING = 'LANDING',
  OPPORTUNITIES = 'OPPORTUNITIES',
  FARM_DETAIL = 'FARM_DETAIL',
  TASK_DETAIL = 'TASK_DETAIL',
  PUBLISH_TASK = 'PUBLISH_TASK',
  MY_DASHBOARD = 'MY_DASHBOARD',
}

// ── Farm (薅羊毛) ──────────────────────────────────

export type FarmType = 'quest' | 'testnet' | 'yield' | 'bounty';

export interface FarmItem {
  id: string;
  type: FarmType;
  title: string;
  description: string;
  source: string;           // 'Galxe' | 'Superteam' | 'DefiLlama' | ...
  chain: string;            // 'zkSync Era' | 'Base' | 'Solana' | ...
  reward: string;           // '500 XP' | '5000 USDC' | '12.5% APY'
  rewardType: 'fixed' | 'potential' | 'apy' | 'variable';
  estimatedGas: string;     // '$0.12' | 'Free'
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  timeEstimate?: string;
  tags: string[];
  isHot?: boolean;
  isNew?: boolean;
  participantCount?: number;
  deadline?: string;
  steps?: FarmStep[];
}

export interface FarmStep {
  action: string;
  protocol: string;
  gas: string;
}

// ── Tasks (做任务) ─────────────────────────────────

export type TaskCategory = 'bounty' | 'airdrop' | 'platform';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  platform: string;
  category: TaskCategory;
  reward: string;
  rewardAmount?: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeEstimate: string;
  tags: string[];
  status: 'open' | 'assigned' | 'in_progress' | 'submitted' | 'completed' | 'cancelled';
  rating?: number;
  executionCount?: number;
  recentFeedback?: string;
  applicants?: number;
  deadline?: string;
  url?: string;
}
