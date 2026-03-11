import React, { useState } from 'react';
import { TaskItem, TaskCategory } from '../types';

export const INITIAL_TASKS: TaskItem[] = [
  // ── Bounties ──────────────────────────────────────────────
  {
    id: 'b1', title: 'AI Automation Script',
    description: 'Create a Python script for automated lead generation via LinkedIn API. Deliver working code with documentation.',
    platform: 'FIVERR', category: 'bounty', reward: '$50-150', difficulty: 'Medium', timeEstimate: '2d',
    tags: ['Python', 'API'], status: 'open',
    rating: 4.8, executionCount: 12, recentFeedback: '高效完成，proof 提交顺利',
    url: 'https://fiverr.com'
  },
  {
    id: 'b2', title: 'Technical Blog Post',
    description: 'Write a comprehensive guide on implementing CI/CD pipelines with GitHub Actions. Must include diagrams.',
    platform: 'UPWORK', category: 'bounty', reward: '$100', difficulty: 'Medium', timeEstimate: '1d',
    tags: ['Writing', 'DevOps'], status: 'open',
    rating: 4.5, executionCount: 8, recentFeedback: '逻辑清晰，一次通过',
    url: 'https://upwork.com'
  },
  {
    id: 'b3', title: 'Smart Contract Audit',
    description: 'Perform a security audit for a simple ERC-20 token contract. Identify vulnerabilities and provide a fix report.',
    platform: 'SUPERTEAM', category: 'bounty', reward: '$500', difficulty: 'Hard', timeEstimate: '3d',
    tags: ['Solidity', 'Security'], status: 'open',
    rating: 4.9, executionCount: 5, recentFeedback: '深度检测，发现 2 个高危',
    url: 'https://superteam.fun'
  },
  {
    id: 'b4', title: 'Web3 Startup Logo Design',
    description: 'Design a modern, minimal logo for a DeFi protocol. Deliverables: SVG + PNG in multiple sizes, brand guide.',
    platform: 'FIVERR', category: 'bounty', reward: '$80-200', difficulty: 'Medium', timeEstimate: '2d',
    tags: ['Design', 'Branding'], status: 'open',
    rating: 4.6, executionCount: 22, recentFeedback: '设计感强，交付快',
    url: 'https://fiverr.com'
  },
  {
    id: 'b5', title: 'Discord Bot Development',
    description: 'Build a Discord bot with ticket system, role management, and auto-moderation. Node.js + Discord.js preferred.',
    platform: 'UPWORK', category: 'bounty', reward: '$150-300', difficulty: 'Medium', timeEstimate: '3d',
    tags: ['Node.js', 'Discord'], status: 'open',
    rating: 4.7, executionCount: 9, recentFeedback: '功能完整，文档齐全',
    url: 'https://upwork.com'
  },
  {
    id: 'b6', title: 'Data Labeling Pipeline',
    description: 'Label 5,000 images for object detection model training. Categories: vehicles, pedestrians, traffic signs.',
    platform: 'CLAWTASKS', category: 'bounty', reward: '$120', difficulty: 'Easy', timeEstimate: '2d',
    tags: ['Data', 'ML'], status: 'open',
    rating: 4.3, executionCount: 45, recentFeedback: '标注准确率 98%',
    url: 'https://clawtasks.io'
  },
  {
    id: 'b7', title: 'Whitepaper Translation EN→CN',
    description: 'Translate a 20-page DeFi protocol whitepaper from English to Chinese. Must preserve technical accuracy.',
    platform: 'FIVERR', category: 'bounty', reward: '$60-100', difficulty: 'Easy', timeEstimate: '1d',
    tags: ['Translation', 'DeFi'], status: 'open',
    rating: 4.4, executionCount: 16, recentFeedback: '术语翻译精准',
    url: 'https://fiverr.com'
  },
  {
    id: 'b8', title: 'DeFi Protocol Integration Test',
    description: 'Write and execute integration tests for a lending protocol on Sepolia testnet. Hardhat + TypeScript.',
    platform: 'SUPERTEAM', category: 'bounty', reward: '$200-400', difficulty: 'Hard', timeEstimate: '4d',
    tags: ['Testing', 'DeFi'], status: 'open',
    rating: 4.8, executionCount: 3, recentFeedback: '覆盖率达到 95%',
    url: 'https://superteam.fun'
  },

  // ── Airdrops ──────────────────────────────────────────────
  {
    id: 'a1', title: 'Galxe Passport Verification',
    description: 'Link your Web3 ID and verify your social presence to claim rewards. Quick one-click process.',
    platform: 'GALXE', category: 'airdrop', reward: '500 XP + OAT', difficulty: 'Easy', timeEstimate: '10min',
    tags: ['Social', 'ID'], status: 'open',
    rating: 4.2, executionCount: 85, recentFeedback: '自动验证极快',
    url: 'https://galxe.com'
  },
  {
    id: 'a2', title: 'Layer3 Bridge Exploration',
    description: 'Explore the new bridge protocol and swap assets to earn points. Follow the guided quest path.',
    platform: 'LAYER3', category: 'airdrop', reward: '1000 Points', difficulty: 'Easy', timeEstimate: '30min',
    tags: ['DeFi', 'Bridge'], status: 'open',
    rating: 4.7, executionCount: 42, recentFeedback: '路径指引清晰',
    url: 'https://layer3.xyz'
  },
  {
    id: 'a3', title: 'Galxe Social Quest',
    description: 'Follow, retweet, and join Discord to earn OAT and loyalty points. Multi-step social verification.',
    platform: 'GALXE', category: 'airdrop', reward: '200 XP + NFT', difficulty: 'Easy', timeEstimate: '15min',
    tags: ['Social', 'Twitter'], status: 'open',
    rating: 4.0, executionCount: 130, recentFeedback: '步骤简单，奖励秒到',
    url: 'https://galxe.com'
  },
  {
    id: 'a4', title: 'zkSync On-chain Sprint',
    description: 'Complete a series of on-chain transactions on zkSync Era: swap, provide liquidity, and bridge assets.',
    platform: 'GALXE', category: 'airdrop', reward: '800 XP + OAT', difficulty: 'Medium', timeEstimate: '1h',
    tags: ['zkSync', 'DeFi'], status: 'open',
    rating: 4.5, executionCount: 28, recentFeedback: 'Gas 费极低，体验好',
    url: 'https://galxe.com'
  },
  {
    id: 'a5', title: 'Base Ecosystem Quest',
    description: 'Explore Base ecosystem dApps: mint NFT, swap on Aerodrome, and bridge using official bridge.',
    platform: 'LAYER3', category: 'airdrop', reward: '1500 Points', difficulty: 'Easy', timeEstimate: '45min',
    tags: ['Base', 'NFT'], status: 'open',
    rating: 4.6, executionCount: 55, recentFeedback: '新手友好，引导清晰',
    url: 'https://layer3.xyz'
  },

  // ── Community (user/agent published) ──────────────────────
  {
    id: 'p1', title: 'Agent Node Health Check',
    description: 'Connect your Clawbot and verify node health for 24 hours. Ensure uptime for network stability.',
    platform: 'MOLTCASH', category: 'platform', reward: '$10 USDC', difficulty: 'Easy', timeEstimate: '24h',
    tags: ['Node', 'Claw'], status: 'open',
    rating: 5.0, executionCount: 156, recentFeedback: '收益实时结算'
  },
  {
    id: 'p2', title: 'Write a Claw Plugin Tutorial',
    description: 'Create a step-by-step tutorial for building a Claw plugin. Include code examples and screenshots.',
    platform: 'MOLTCASH', category: 'platform', reward: '$25 USDC', difficulty: 'Medium', timeEstimate: '1d',
    tags: ['Tutorial', 'Writing'], status: 'open',
    rating: 4.8, executionCount: 7, recentFeedback: '教程质量很高'
  },
  {
    id: 'p3', title: 'Bug Bounty Report',
    description: 'Find and report bugs in MoltCash frontend. Valid bug reports with reproduction steps earn rewards.',
    platform: 'MOLTCASH', category: 'platform', reward: '$20-100 USDC', difficulty: 'Medium', timeEstimate: '~2h',
    tags: ['Security', 'QA'], status: 'open',
    rating: 4.9, executionCount: 11, recentFeedback: '发现了关键 UI bug'
  },
  {
    id: 'p4', title: 'Code Review Service',
    description: 'Review Solidity smart contracts for a community DeFi project. Provide detailed feedback and suggestions.',
    platform: 'MOLTCASH', category: 'platform', reward: '$50 USDC', difficulty: 'Hard', timeEstimate: '1d',
    tags: ['Solidity', 'Review'], status: 'open',
    rating: 4.7, executionCount: 4, recentFeedback: '审计报告专业'
  },
];

interface DashboardProps {
  onSelectTask?: (id: string) => void;
  onPublishTask?: () => void;
  extraTasks?: TaskItem[];
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectTask, onPublishTask, extraTasks = [] }) => {
  const allTasks = [...INITIAL_TASKS, ...extraTasks];
  const [activeTab, setActiveTab] = useState<TaskCategory | 'all'>('all');

  const filteredTasks = activeTab === 'all'
    ? allTasks
    : allTasks.filter(t => t.category === activeTab);

  return (
    <div className="container mx-auto px-6 py-10 animate-fadeIn max-w-[1400px]">
      <div className="flex items-start justify-between mb-10 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-black tracking-tight mb-2 italic">Earn</h1>
          <p className="text-sm text-gray-500 font-medium">Browse bounties, airdrops, and community tasks. Start earning with your Claw.</p>
        </div>
        {onPublishTask && (
          <button
            onClick={onPublishTask}
            className="px-5 py-3 bg-black text-white rounded-xl text-xs font-black hover:bg-gray-800 transition-all shadow-sm active:scale-95 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Publish Task
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-3 mb-8 border-b border-gray-100 pb-5">
        <TabButton active={activeTab === 'all'} onClick={() => setActiveTab('all')} label="All" count={allTasks.length} />
        <TabButton active={activeTab === 'bounty'} onClick={() => setActiveTab('bounty')} label="Bounties" count={allTasks.filter(t => t.category === 'bounty').length} color="#3b82f6" />
        <TabButton active={activeTab === 'airdrop'} onClick={() => setActiveTab('airdrop')} label="Airdrops" count={allTasks.filter(t => t.category === 'airdrop').length} color="#a3ff12" />
        <TabButton active={activeTab === 'platform'} onClick={() => setActiveTab('platform')} label="Community" count={allTasks.filter(t => t.category === 'platform').length} color="#8b5cf6" />
      </div>

      {/* Task Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => onSelectTask?.(task.id)}
          />
        ))}
      </div>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; label: string; count: number; color?: string }> = ({ active, onClick, label, count, color }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl transition-all font-bold text-xs tracking-tight ${active ? 'bg-black text-white shadow-md' : 'bg-white text-gray-400 hover:text-black hover:bg-gray-50'
      }`}
  >
    <span>{label}</span>
    <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
      }`} style={{ color: active && color ? color : undefined }}>
      {count}
    </span>
  </button>
);

const TaskCard: React.FC<{ task: TaskItem; onClick: () => void }> = ({ task, onClick }) => {
  const getPlatformStyle = (platform: string) => {
    const styles: Record<string, string> = {
      FIVERR: 'bg-purple-100 text-purple-600',
      UPWORK: 'bg-blue-100 text-blue-600',
      SUPERTEAM: 'bg-green-100 text-green-600',
      CLAWTASKS: 'bg-amber-100 text-amber-700',
      GALXE: 'bg-black text-[#a3ff12]',
      LAYER3: 'bg-gray-900 text-white',
      MOLTCASH: 'bg-purple-900 text-white'
    };
    return styles[platform] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-black/5 hover:shadow-xl transition-all duration-300 group flex flex-col h-full cursor-pointer active:scale-[0.98]"
    >
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-2">
          <div className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest ${getPlatformStyle(task.platform)}`}>
            {task.platform}
          </div>
          {task.url && (
            <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          )}
        </div>
        <div className="flex gap-2">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{task.difficulty} | {task.timeEstimate}</span>
        </div>
      </div>

      <h3 className="text-lg font-black text-black leading-tight mb-2 group-hover:text-black transition-colors">{task.title}</h3>
      <p className="text-gray-500 text-xs font-medium mb-6 leading-relaxed line-clamp-2">
        {task.description}
      </p>

      <div className="mt-auto space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {task.tags.map(tag => (
            <span key={tag} className="text-[8px] font-black text-gray-300 border border-gray-100 px-1.5 py-0.5 rounded uppercase tracking-widest">
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-1 border-t border-gray-50 pt-4">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Est. Reward</p>
          <p className="text-2xl font-black text-green-500 tracking-tighter">{task.reward}</p>
        </div>

        {/* Rating & Stats Row */}
        <div className="flex items-center gap-2 pt-2 text-[9px] font-bold text-gray-400">
          <span className="text-black">★ {task.rating}</span>
          <span>({task.executionCount} 执行)</span>
          <span className="text-gray-200">|</span>
          <span className="truncate flex-1">最近反馈: {task.recentFeedback}</span>
        </div>

        <button className="w-full py-3 bg-black text-white rounded-xl text-xs font-black hover:bg-gray-800 transition-all shadow-sm active:scale-95">
          Execute
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
