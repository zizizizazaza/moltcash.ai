
import React, { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Icons, COLORS } from '../constants';
import { MarketAsset, RepaymentSchedule } from '../types';
import { api } from '../services/api';

// Cover image SVG generator — gradient + icon composition (same approach as Chat.tsx)
const coverSvg = (c1: string, c2: string, icon: string, w = 800, h = 400) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#bg)"/><circle cx="160" cy="200" r="120" fill="rgba(255,255,255,0.06)"/><circle cx="640" cy="100" r="180" fill="rgba(255,255,255,0.04)"/><circle cx="500" cy="350" r="100" fill="rgba(255,255,255,0.05)"/><rect x="60" y="60" width="680" height="280" rx="24" fill="rgba(255,255,255,0.07)"/><text x="400" y="220" font-size="120" text-anchor="middle" dominant-baseline="middle">${icon}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

// Logo SVG generator
const logoSvg = (c1: string, c2: string, letter: string, w = 100, h = 100) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><rect width="${w}" height="${h}" rx="20" fill="url(#bg)"/><text x="50%" y="58%" font-family="system-ui" font-size="48" fill="#fff" text-anchor="middle" dominant-baseline="middle" font-weight="900">${letter}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

// Visual config per project
const PROJECT_VISUALS: Record<string, { c1: string; c2: string; icon: string; letter: string }> = {
  'AI Agent Marketplace': { c1: '#4f46e5', c2: '#7c3aed', icon: '🤖', letter: 'A' },
  'Climapp.io Utility': { c1: '#047857', c2: '#0d9488', icon: '🌿', letter: 'C' },
  'Market Maker AI': { c1: '#0f172a', c2: '#334155', icon: '📈', letter: 'M' },
  'MEV Searcher Agent': { c1: '#b45309', c2: '#dc2626', icon: '⚡', letter: 'M' },
  'Copy Trading AI': { c1: '#9333ea', c2: '#db2777', icon: '🔄', letter: 'C' },

  'DigitalOcean Tier': { c1: '#0e7490', c2: '#0f766e', icon: '🌊', letter: 'D' },
  'DeFi Yield Optimizer': { c1: '#6d28d9', c2: '#4338ca', icon: '💎', letter: 'D' },
};
const getVisual = (title: string) => PROJECT_VISUALS[title] || { c1: '#64748b', c2: '#334155', icon: '💰', letter: '?' };

const MOCK_ASSETS: MarketAsset[] = [
  {
    id: '1',
    title: 'AI Agent Marketplace',
    subtitle: 'Making it easier for AI agent markets to showcase themselves on a platform that facilitates exchanges.',
    category: 'SaaS',
    issuer: 'AgentHub Inc.',
    issuerLogo: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=100&h=100&fit=crop',
    faceValue: 100,
    askPrice: 95.00,
    apy: 18.5,
    durationDays: 30,
    creditScore: 780,
    status: 'Fundraising',
    targetAmount: 500000,
    raisedAmount: 105000,
    backersCount: 4,
    remainingCap: 395000,
    coverageRatio: 1.6,
    verifiedSource: 'Stripe API',
    description: 'AI Agent Marketplace is building the leading discovery and exchange platform for autonomous AI agents. Our platform connects agent developers with enterprise buyers seeking specialized AI capabilities.',
    useOfFunds: 'Platform development and agent onboarding incentives.',
    monthlyRevenue: [
      { month: 'Aug', amount: 120000 },
      { month: 'Sep', amount: 145000 },
      { month: 'Oct', amount: 180000 },
      { month: 'Nov', amount: 210000 },
      { month: 'Dec', amount: 260000 },
      { month: 'Jan', amount: 300000 }
    ],
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop'
  },
  {
    id: '2',
    title: 'Climapp.io Utility',
    subtitle: 'AI-enabled platform that helps you understand and manage your utility bills — all in one place.',
    category: 'SaaS',
    issuer: 'Climapp Inc.',
    issuerLogo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&h=100&fit=crop',
    faceValue: 100,
    askPrice: 98.00,
    apy: 14.2,
    durationDays: 90,
    creditScore: 750,
    status: 'Fundraising',
    targetAmount: 300000,
    raisedAmount: 6000,
    backersCount: 2,
    remainingCap: 294000,
    coverageRatio: 1.4,
    verifiedSource: 'QuickBooks Verified',
    description: 'Climapp.io uses AI to analyze utility consumption patterns and recommend cost-saving strategies for households and businesses. Our SaaS model generates recurring subscription revenue.',
    useOfFunds: 'AI model training and customer acquisition.',
    monthlyRevenue: [
      { month: 'Aug', amount: 85000 },
      { month: 'Sep', amount: 92000 },
      { month: 'Oct', amount: 98000 },
      { month: 'Nov', amount: 110000 },
      { month: 'Dec', amount: 125000 },
      { month: 'Jan', amount: 140000 }
    ],
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop'
  },
  {
    id: '3',
    title: 'Market Maker AI',
    subtitle: 'Provides deep liquidity for new pairs with optimized spread management.',
    category: 'SaaS',
    issuer: 'LiquidityAI LLC',
    issuerLogo: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=100&h=100&fit=crop',
    faceValue: 100,
    askPrice: 92.00,
    apy: 22.0,
    durationDays: 120,
    creditScore: 860,
    status: 'Funded',
    targetAmount: 800000,
    raisedAmount: 760000,
    backersCount: 124,
    remainingCap: 40000,
    coverageRatio: 2.2,
    verifiedSource: 'API Oracle',
    description: 'Market Maker AI provides automated, intelligent liquidity provisioning for decentralized exchanges. Our proprietary algorithms ensure tight spreads and deep order books across multiple trading pairs.',
    useOfFunds: 'Liquidity pool capitalization and algorithm research.',
    monthlyRevenue: [
      { month: 'Aug', amount: 450000 },
      { month: 'Sep', amount: 520000 },
      { month: 'Oct', amount: 580000 },
      { month: 'Nov', amount: 650000 },
      { month: 'Dec', amount: 720000 },
      { month: 'Jan', amount: 810000 }
    ],
    coverImage: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&h=400&fit=crop'
  },
  {
    id: '4',
    title: 'MEV Searcher Agent',
    subtitle: 'Captures Maximal Extractable Value opportunities efficiently.',
    category: 'Compute',
    issuer: 'MEVLabs Inc.',
    issuerLogo: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=100&h=100&fit=crop',
    faceValue: 100,
    askPrice: 94.00,
    apy: 25.5,
    durationDays: 60,
    creditScore: 720,
    status: 'Fundraising',
    targetAmount: 400000,
    raisedAmount: 160000,
    backersCount: 18,
    remainingCap: 240000,
    coverageRatio: 1.3,
    verifiedSource: 'Stripe API',
    description: 'MEV Searcher Agent uses advanced algorithms to identify and capture Maximal Extractable Value opportunities across multiple blockchains, generating consistent returns from on-chain arbitrage.',
    useOfFunds: 'Infrastructure scaling and strategy development.',
    monthlyRevenue: [
      { month: 'Aug', amount: 200000 },
      { month: 'Sep', amount: 240000 },
      { month: 'Oct', amount: 280000 },
      { month: 'Nov', amount: 320000 },
      { month: 'Dec', amount: 380000 },
      { month: 'Jan', amount: 420000 }
    ],
    coverImage: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=400&fit=crop'
  },
  {
    id: '5',
    title: 'Copy Trading AI',
    subtitle: 'Mirrors trades of top-performing wallets automatically.',
    category: 'SaaS',
    issuer: 'CopyFi Inc.',
    issuerLogo: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop',
    faceValue: 100,
    askPrice: 96.00,
    apy: 16.8,
    durationDays: 45,
    creditScore: 800,
    status: 'Fundraising',
    targetAmount: 350000,
    raisedAmount: 273000,
    backersCount: 56,
    remainingCap: 77000,
    coverageRatio: 1.7,
    verifiedSource: 'API Oracle',
    description: 'Copy Trading AI automatically mirrors the trading strategies of top-performing wallets using on-chain analysis. Our platform democratizes access to sophisticated trading strategies.',
    useOfFunds: 'Trading capital and AI model improvements.',
    monthlyRevenue: [
      { month: 'Aug', amount: 180000 },
      { month: 'Sep', amount: 210000 },
      { month: 'Oct', amount: 245000 },
      { month: 'Nov', amount: 280000 },
      { month: 'Dec', amount: 310000 },
      { month: 'Jan', amount: 350000 }
    ],
    coverImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop'
  },
  {
    id: '6',
    title: 'Cloudflare Capacity',
    subtitle: 'Global edge network capacity lending with 12% APY.',
    category: 'Compute',
    issuer: 'EdgeFund LLC',
    issuerLogo: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=100&h=100&fit=crop',
    faceValue: 100,
    askPrice: 97.00,
    apy: 12.0,
    durationDays: 30,
    creditScore: 830,
    status: 'Fundraising',
    targetAmount: 500000,
    raisedAmount: 350000,
    backersCount: 42,
    remainingCap: 150000,
    coverageRatio: 1.8,
    verifiedSource: 'Cloudflare Partner',
    description: 'Cloudflare Capacity finances edge computing infrastructure expansion. By funding global CDN and compute node deployments, investors earn stable returns from enterprise usage fees.',
    useOfFunds: 'Edge node deployments and bandwidth procurement.',
    monthlyRevenue: [
      { month: 'Aug', amount: 250000 },
      { month: 'Sep', amount: 270000 },
      { month: 'Oct', amount: 290000 },
      { month: 'Nov', amount: 310000 },
      { month: 'Dec', amount: 330000 },
      { month: 'Jan', amount: 350000 }
    ],
    coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop'
  },
  {
    id: '7',
    title: 'DigitalOcean Tier',
    subtitle: 'Financing for SME cloud deployments with high retention.',
    category: 'Compute',
    issuer: 'OceanScale Inc.',
    issuerLogo: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=100&h=100&fit=crop',
    faceValue: 100,
    askPrice: 96.00,
    apy: 14.0,
    durationDays: 30,
    creditScore: 790,
    status: 'Fundraising',
    targetAmount: 400000,
    raisedAmount: 240000,
    backersCount: 37,
    remainingCap: 160000,
    coverageRatio: 1.6,
    verifiedSource: 'DigitalOcean Partner',
    description: 'DigitalOcean Tier finances cloud infrastructure for SME customers with high retention rates. Our lending pool is backed by verified monthly recurring revenue from DigitalOcean usage data.',
    useOfFunds: 'Cloud capacity expansion and customer onboarding.',
    monthlyRevenue: [
      { month: 'Aug', amount: 180000 },
      { month: 'Sep', amount: 195000 },
      { month: 'Oct', amount: 210000 },
      { month: 'Nov', amount: 225000 },
      { month: 'Dec', amount: 240000 },
      { month: 'Jan', amount: 260000 }
    ],
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop'
  }
];

// Unsplash image map per project (realistic photos)
const PROJECT_IMAGES: Record<string, { cover: string; logo: string }> = {
  'AI Agent Marketplace': { cover: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop', logo: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=100&h=100&fit=crop' },
  'Climapp.io Utility': { cover: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop', logo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&h=100&fit=crop' },
  'Market Maker AI': { cover: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&h=400&fit=crop', logo: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=100&h=100&fit=crop' },
  'MEV Searcher Agent': { cover: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=400&fit=crop', logo: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=100&h=100&fit=crop' },
  'Copy Trading AI': { cover: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop', logo: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop' },

  'DigitalOcean Tier': { cover: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop', logo: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=100&h=100&fit=crop' },
  'DeFi Yield Optimizer': { cover: 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=800&h=400&fit=crop', logo: 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=100&h=100&fit=crop' },
};

const mapApiProject = (p: any): MarketAsset => {
  const v = getVisual(p.title);
  const imgs = PROJECT_IMAGES[p.title];
  const firstLetter = (p.issuer || p.title || '?')[0].toUpperCase();
  return {
    id: p.id,
    title: p.title,
    subtitle: p.subtitle || '',
    category: p.category as MarketAsset['category'],
    issuer: p.issuer,
    issuerLogo: p.issuerLogo || (imgs?.logo) || logoSvg(v.c1, v.c2, firstLetter),
    coverImage: p.coverImage || (imgs?.cover) || coverSvg(v.c1, v.c2, v.icon),
    faceValue: p.faceValue,
    askPrice: p.askPrice,
    apy: p.apy,
    durationDays: p.durationDays,
    creditScore: p.creditScore,
    status: p.status as MarketAsset['status'],
    targetAmount: p.targetAmount,
    raisedAmount: p.raisedAmount,
    backersCount: p.backersCount,
    remainingCap: p.remainingCap,
    coverageRatio: p.coverageRatio,
    verifiedSource: p.verifiedSource || '',
    description: p.description || '',
    useOfFunds: p.useOfFunds || '',
    monthlyRevenue: (p.monthlyRevenue || []).map((m: any) => ({ month: m.month, amount: m.amount })),
  };
};

const Market: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<MarketAsset | null>(null);
  const [filter, setFilter] = useState<'All' | 'Fundraising' | 'Funded' | 'Failed'>('All');
  const [assets, setAssets] = useState<MarketAsset[]>(MOCK_ASSETS);

  const refreshAssets = () => {
    api.getProjects().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setAssets(data.map(mapApiProject));
      }
    }).catch(() => { });
  };

  useEffect(() => {
    refreshAssets();
  }, []);

  const filteredAssets = useMemo(() => {
    const statusPriority: Record<string, number> = {
      'Fundraising': 0, 'Ending Soon': 0,
      'Funded': 1, 'Sold Out': 1,
      'Failed': 2,
    };
    const sorted = [...assets].sort((a, b) => {
      const pa = statusPriority[a.status] ?? 9;
      const pb = statusPriority[b.status] ?? 9;
      if (pa !== pb) return pa - pb;
      // 同状态下，按募资进度从高到低
      const progA = a.targetAmount > 0 ? a.raisedAmount / a.targetAmount : 0;
      const progB = b.targetAmount > 0 ? b.raisedAmount / b.targetAmount : 0;
      return progB - progA;
    });
    if (filter === 'All') return sorted;
    return sorted.filter(a => a.status === filter);
  }, [filter, assets]);

  useEffect(() => {
    const handleOpenAsset = (e: Event) => {
      const customEvent = e as CustomEvent;
      const match = assets.find(a => a.title.includes(customEvent.detail));
      if (match) setSelectedAsset(match);
    };

    window.addEventListener('loka-open-asset', handleOpenAsset);
    return () => window.removeEventListener('loka-open-asset', handleOpenAsset);
  }, [assets]);

  if (selectedAsset) {
    return (
      <AssetDetail
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
        onInvested={refreshAssets}
      />
    );
  }

  return (
    <div className="space-y-12 animate-fadeIn pb-24 p-4 sm:p-8 md:p-12 lg:p-16 max-w-[1600px] mx-auto w-full bg-white min-h-full">
      {/* 1. Header & Filters */}
      <section className="space-y-6">
        <button onClick={() => window.dispatchEvent(new CustomEvent('loka-nav-chat'))} className="flex items-center gap-2 text-[12px] font-bold text-gray-400 hover:text-black transition-colors group">
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Chat
        </button>
        <div className="text-center">
          <h2 className="text-3xl sm:text-5xl text-black tracking-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 900 }}>Cash Flow Market.</h2>
          <p className="text-gray-400 mt-3 font-medium">Invest in the future cash flow of verified businesses.</p>
        </div>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
          <div className="flex bg-white glass p-1 rounded-full border border-gray-100 shadow-sm overflow-x-auto max-w-full">
            {['All', 'Fundraising', 'Funded', 'Failed'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat as any)}
                className={`px-4 sm:px-6 py-2 rounded-full text-xs font-bold tracking-wide transition-all whitespace-nowrap ${filter === cat ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-black hover:bg-gray-50'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('loka-nav-groups'))}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#00E676] text-black rounded-full text-xs font-black tracking-wide shadow-md hover:bg-[#00C853] transition-all active:scale-[0.97] whitespace-nowrap"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Apply
          </button>
        </div>
      </section>

      {/* 2. Asset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {filteredAssets.map(asset => (
          <AssetCard
            key={asset.id}
            asset={asset}
            onClick={() => setSelectedAsset(asset)}
          />
        ))}
      </div>
    </div>
  );
};

const AssetCard: React.FC<{ asset: MarketAsset; onClick: () => void }> = ({ asset, onClick }) => {
  const [activeTab, setActiveTab] = useState<'STORY' | 'AGREEMENT' | 'FINANCIALS'>('STORY');
  const progress = Math.min(100, (asset.raisedAmount / asset.targetAmount) * 100);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-black/10 transition-all cursor-pointer group shadow-sm flex flex-col h-full"
    >
      {/* Header - Cover Image & Badges */}
      <div className="relative h-32 overflow-hidden">
        <img
          src={asset.coverImage}
          alt={asset.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start">
          <div className={`backdrop-blur-lg px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-wide shadow-xl border ${
            asset.status === 'Failed'
              ? 'bg-gray-100/95 border-gray-300/60 text-gray-500'
              : asset.status === 'Funded' || asset.status === 'Sold Out'
                ? 'bg-emerald-50/95 border-emerald-200/60 text-emerald-800'
                : 'bg-white/95 border-white/40 text-black'
          }`}>
            {asset.status === 'Fundraising' || asset.status === 'Ending Soon' ? '🔥 Fundraising' :
              asset.status === 'Funded' ? '✅ Funded' :
                asset.status === 'Failed' ? 'Failed' :
                  asset.status}
          </div>
        </div>
      </div>

      {/* Body - Project Info */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Company Info */}
        <div className="flex items-center gap-2 mb-3">
          <img
            src={asset.issuerLogo}
            alt={asset.issuer}
            className="w-5 h-5 rounded-full object-cover border border-gray-100"
          />
          <span className="text-[9px] font-bold text-gray-400  tracking-widest truncate">{asset.issuer}</span>
          <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100/80 leading-none ml-1 shrink-0 flex items-center gap-1">
            {asset.issuer === 'ComputeDAO LLC' ? <><Icons.Crown className="w-2.5 h-2.5" /> 1000+</> : asset.issuer === 'DropStream LLC' ? <><Icons.Diamond className="w-2.5 h-2.5" /> 500+</> : <><Icons.Compass className="w-2.5 h-2.5" /> 200+</>}
          </span>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-bold text-black group-hover:text-gray-600 transition-colors line-clamp-1">{asset.title}</h4>
          <p className="text-[10px] text-gray-400 font-medium mt-1 line-clamp-2 leading-relaxed">{asset.subtitle}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100/50">
            <p className="text-[8px] font-bold text-gray-400  tracking-wide sm:tracking-widest mb-1">Target</p>
            <p className="text-[10px] font-bold text-black">${(asset.targetAmount / 1000).toFixed(0)}k</p>
          </div>
          <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100/50">
            <p className="text-[8px] font-bold text-gray-400  tracking-wide sm:tracking-widest mb-1">APY</p>
            <p className="text-[10px] font-bold text-[#00E676]">{asset.apy}%</p>
          </div>
          <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100/50">
            <p className="text-[8px] font-bold text-gray-400  tracking-wide sm:tracking-widest mb-1">Term</p>
            <p className="text-[10px] font-bold text-black">{asset.durationDays}d</p>
          </div>
        </div>

        {/* Footer - Progress */}
        <div className="mt-auto space-y-2.5">
          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00E676] transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-black">${asset.raisedAmount.toLocaleString()} <span className="text-gray-400 font-medium tracking-wide">pledged</span></p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 tracking-tighter">{progress.toFixed(0)}% <span className="text-gray-300">&bull;</span> {asset.backersCount} backers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AssetDetail: React.FC<{ asset: MarketAsset; onClose: () => void; onInvested?: () => void }> = ({ asset, onClose, onInvested }) => {
  const [activeTab, setActiveTab] = useState<'STORY' | 'AGREEMENT' | 'FINANCIALS'>('STORY');
  const [pledgeAmount, setPledgeAmount] = useState<string>('');
  const [investing, setInvesting] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [investError, setInvestError] = useState<string | null>(null);
  const [investSuccess, setInvestSuccess] = useState<string | null>(null);
  const [repaymentSchedule, setRepaymentSchedule] = useState<RepaymentSchedule[]>([]);
  const [repaymentLoading, setRepaymentLoading] = useState(false);
  const progress = Math.min(100, (asset.raisedAmount / asset.targetAmount) * 100);
  const allTimeRevenue = asset.monthlyRevenue.reduce((sum, m) => sum + m.amount, 0);
  const mrr = asset.monthlyRevenue[asset.monthlyRevenue.length - 1]?.amount || 0;

  const canInvest = ['Fundraising', 'Ending Soon'].includes(asset.status);
  const isFunded = ['Funded', 'Sold Out'].includes(asset.status);

  // Fetch repayment schedule for funded projects
  useEffect(() => {
    if (!isFunded) return;
    setRepaymentLoading(true);
    api.getRepaymentSchedule(asset.id).then(data => {
      if (Array.isArray(data)) setRepaymentSchedule(data);
    }).catch(() => { }).finally(() => setRepaymentLoading(false));
  }, [asset.id, isFunded]);

  const handleInvest = async () => {
    const amount = parseFloat(pledgeAmount);
    if (!amount || amount <= 0) { setInvestError('Please enter a valid amount'); return; }
    if (amount < 10) { setInvestError('Minimum investment is $10'); return; }
    if (amount > asset.remainingCap) { setInvestError(`Max available: $${asset.remainingCap.toLocaleString()}`); return; }

    setInvesting(true);
    setInvestError(null);
    setInvestSuccess(null);
    try {
      const result = await api.investInProject(asset.id, amount);
      setInvestSuccess(`Successfully invested $${amount.toLocaleString()}!`);
      setPledgeAmount('');
      // Update the asset in place so progress bar reflects changes
      asset.raisedAmount = result.project.raisedAmount;
      asset.remainingCap = result.project.remainingCap;
      asset.status = result.project.status;
      onInvested?.();
    } catch (err: any) {
      setInvestError(err.message || 'Investment failed');
    } finally {
      setInvesting(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirm('Are you sure you want to revoke your investment?')) return;
    setRevoking(true);
    setInvestError(null);
    setInvestSuccess(null);
    try {
      const result = await api.revokeInvestment(asset.id);
      setInvestSuccess(`Refunded $${result.refundAmount.toLocaleString()}`);
      asset.raisedAmount = result.project.raisedAmount;
      asset.remainingCap = result.project.remainingCap;
      asset.status = result.project.status;
      onInvested?.();
    } catch (err: any) {
      setInvestError(err.message || 'Revocation failed');
    } finally {
      setRevoking(false);
    }
  };

  const handleAddToChat = () => {
    sessionStorage.setItem('pending_chat_agent', asset.title);
    window.dispatchEvent(new CustomEvent('loka-nav-chat'));
    window.dispatchEvent(new CustomEvent('loka-set-chat-agent', { detail: asset.title }));
  };

  return (
    <div className="animate-fadeIn pb-32 p-4 sm:p-6 md:p-10 lg:p-12 max-w-[1100px] mx-auto w-full min-h-full bg-white">
      {/* Back Navigation */}
      <button onClick={onClose} className="flex items-center gap-2 text-[12px] font-bold text-gray-400 hover:text-black transition-colors group mb-6 sm:mb-8">
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Cash Flow Market
      </button>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:items-start justify-between mb-6">
        <div className="flex gap-3 sm:gap-6 items-start">
          <img src={asset.issuerLogo} className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl object-cover border border-gray-100 shadow-sm shrink-0" alt={asset.title} />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-black tracking-tight mb-2 sm:mb-3 truncate sm:whitespace-normal" title={asset.title}>{asset.title}</h1>
            <p className="text-[12px] sm:text-[14px] text-gray-500 font-medium leading-relaxed max-w-2xl line-clamp-2 sm:line-clamp-none" title={asset.subtitle}>
              {asset.subtitle}
            </p>
          </div>
        </div>

        <div className="flex gap-2 sm:gap-3 shrink-0">
          <button className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-white border border-gray-200 text-black rounded-xl font-bold text-xs sm:text-sm hover:bg-gray-50 hover:border-black transition-all shadow-sm h-fit">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            <span className="hidden sm:inline">Share</span>
          </button>
          <button onClick={handleAddToChat} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 bg-black text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-gray-800 transition-all shadow-md active:scale-[0.98] h-fit">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <span className="hidden sm:inline">Add to</span> Chat
          </button>
        </div>
      </div>

      {/* Progress Bar / Funded Banner Section */}
      {isFunded ? (
        /* ── Fully Funded Banner ── */
        <div className="mb-6 sm:mb-10 rounded-2xl sm:rounded-[28px] overflow-hidden border border-emerald-100 shadow-sm">
          {/* Top strip */}
          <div className="bg-emerald-500 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎉</span>
              <span className="text-white font-black tracking-wide text-sm">Fully Funded</span>
            </div>
            <span className="text-emerald-100 text-[11px] font-bold tracking-widest uppercase">Awaiting Returns</span>
          </div>
          {/* Stats row */}
          <div className="bg-white px-6 py-5 grid grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-[9px] font-black tracking-[0.18em] text-gray-400 uppercase">Total Raised</p>
              <p className="text-xl sm:text-2xl font-black text-black tracking-tight">${asset.raisedAmount.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 font-medium">of ${(asset.targetAmount / 1000).toFixed(0)}k target</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black tracking-[0.18em] text-gray-400 uppercase">Funded</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-500 tracking-tight">{progress.toFixed(1)}%</p>
              <p className="text-[10px] text-gray-400 font-medium">of goal reached</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black tracking-[0.18em] text-gray-400 uppercase">Backers</p>
              <p className="text-xl sm:text-2xl font-black text-black tracking-tight">{asset.backersCount}</p>
              <p className="text-[10px] text-gray-400 font-medium">investors backed</p>
            </div>
          </div>
        </div>
      ) : asset.status === 'Failed' ? (
        /* ── Failed Banner ── */
        <div className="mb-6 sm:mb-10 rounded-2xl sm:rounded-[28px] overflow-hidden border border-gray-200 shadow-sm">
          <div className="bg-gray-700 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" d="M15 9l-6 6M9 9l6 6" />
              </svg>
              <span className="text-white font-black tracking-wide text-sm">Fundraising Failed</span>
            </div>
            <span className="text-gray-400 text-[11px] font-bold tracking-widest uppercase">Refunded</span>
          </div>
          <div className="bg-gray-50 px-6 py-5 grid grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-[9px] font-black tracking-[0.18em] text-gray-400 uppercase">Total Raised</p>
              <p className="text-xl sm:text-2xl font-black text-gray-700 tracking-tight">${asset.raisedAmount.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 font-medium">of ${(asset.targetAmount / 1000).toFixed(0)}k target</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black tracking-[0.18em] text-gray-400 uppercase">Shortfall</p>
              <p className="text-xl sm:text-2xl font-black text-gray-500 tracking-tight">${(asset.targetAmount - asset.raisedAmount).toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 font-medium">below goal · {progress.toFixed(1)}% reached</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black tracking-[0.18em] text-gray-400 uppercase">Backers</p>
              <p className="text-xl sm:text-2xl font-black text-gray-700 tracking-tight">{asset.backersCount}</p>
              <p className="text-[10px] text-gray-400 font-medium">pledges refunded</p>
            </div>
          </div>
        </div>
      ) : (
        /* ── Progress Bar (Fundraising) ── */
        <div className="mb-6 sm:mb-10 flex flex-col md:flex-row items-stretch md:items-center gap-4 sm:gap-8 bg-white border border-gray-100 rounded-2xl sm:rounded-[28px] p-4 sm:p-6 shadow-sm">
          <div className="flex-1 w-full space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <p className="text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase">Campaign Progress</p>
              </div>
              <p className="text-[12px] font-black text-black tracking-tight">{progress.toFixed(1)}% <span className="text-gray-400 font-bold ml-0.5">Funded</span></p>
            </div>
            <div className="flex items-center gap-5">
              <div className="flex-1 h-3 bg-white rounded-full overflow-hidden border border-gray-200 relative">
                <div
                  className="h-full bg-[#00E676] transition-all duration-1000 relative z-10"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
              </div>
              <p className="text-[10px] font-black text-gray-400 whitespace-nowrap italic tracking-tighter">12 Days Remained</p>
            </div>
          </div>

          <div className="hidden md:block w-px h-12 bg-gradient-to-b from-transparent via-gray-100 to-transparent" />

          <div className="flex items-center gap-4 sm:gap-8 shrink-0 flex-wrap">
            <div className="space-y-1">
              <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Currently Pledged</p>
              <div className="flex items-baseline gap-1.5">
                <p className="text-xl sm:text-3xl font-black text-black tracking-tight">${asset.raisedAmount.toLocaleString()}</p>
                <p className="text-sm sm:text-lg font-black text-gray-400 tracking-tight">/ ${(asset.targetAmount / 1000).toFixed(0)}k</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex -space-x-2 mb-1.5">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center overflow-hidden shadow-sm">
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                  </div>
                ))}
              </div>
              <p className="text-[9px] font-black text-gray-400 tracking-tight">
                <span className="text-black font-black">{asset.backersCount}</span> Backers
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Primary Metrics Grid (4 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <div className="p-3 sm:p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-gray-200 transition-all">
          <div className="flex items-center gap-1.5 mb-2 sm:mb-4">
            <p className="text-[10px] sm:text-[11px] font-bold text-gray-500">All-time revenue</p>
          </div>
          <p className="text-lg sm:text-2xl font-black text-black mb-1 truncate" title={`$${allTimeRevenue.toLocaleString()}`}>${allTimeRevenue.toLocaleString()}</p>
          <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium truncate">Coverage ratio: {asset.coverageRatio}x</p>
        </div>

        <div className="p-3 sm:p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-gray-200 transition-all">
          <div className="flex items-center gap-1.5 mb-2 sm:mb-4">
            <p className="text-[10px] sm:text-[11px] font-bold text-gray-500">MRR (verified)</p>
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-lg sm:text-2xl font-black text-black mb-1 truncate">${mrr.toLocaleString()}</p>
          <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium truncate" title={asset.verifiedSource}>{asset.verifiedSource}</p>
        </div>

        <div className="p-3 sm:p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-gray-200 transition-all">
          <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 mb-2 sm:mb-4">Issuer Profile</p>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold border border-gray-200 shrink-0 overflow-hidden">
              <img src={asset.issuerLogo} className="w-full h-full object-cover" />
            </div>
            <p className="text-xs sm:text-sm font-black text-black truncate" title={asset.issuer}>{asset.issuer}</p>
            <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center text-[7px] text-white shrink-0">{'\u2713'}</div>
          </div>

        </div>

        <div className="p-3 sm:p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-gray-200 transition-all flex flex-col justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 mb-1">Yield Rules</p>
            <p className="text-lg sm:text-xl font-black text-[#00E676]">{asset.apy}% APY</p>
          </div>
          <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium mt-auto bg-gray-50 w-fit px-2 py-1 rounded-md border border-gray-100 truncate" title={`${asset.durationDays} Days Lock-up Term`}>{asset.durationDays} Days Lock-up</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-100 gap-4 sm:gap-10 mt-8 sm:mt-12 mb-6 sm:mb-8 overflow-x-auto">
        {[
          { id: 'STORY', label: 'Background' },
          { id: 'FINANCIALS', label: 'Financial Health' },
          { id: 'AGREEMENT', label: 'Rules' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-4 sm:pb-5 pt-2 text-xs sm:text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-black' : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-black" />
            )}
          </button>
        ))}
      </div>

      <div className="py-6">
        {activeTab === 'STORY' && (
          <div className="space-y-12 animate-fadeIn">
            {/* 1. Issuer Profile */}
            <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 pb-6 border-b border-gray-100/50">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <img src={asset.issuerLogo} className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl object-cover border border-gray-100 shadow-sm shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-base sm:text-xl font-black tracking-tight text-black flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="truncate max-w-[150px] sm:max-w-none" title={asset.issuer}>{asset.issuer}</span>
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[8px] text-white italic shadow-sm">✓</div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 leading-none ml-1 flex items-center gap-1 text-gray-500">
                      {asset.issuer === 'ComputeDAO LLC' ? <><Icons.Crown className="w-2.5 h-2.5 text-amber-500" /> 1000+</> : asset.issuer === 'DropStream LLC' ? <><Icons.Diamond className="w-2.5 h-2.5 text-blue-500" /> 500+</> : <><Icons.Compass className="w-2.5 h-2.5 text-emerald-500" /> 200+</>}
                    </span>
                  </h4>
                  <p className="text-[11px] sm:text-[12px] text-gray-400 font-medium truncate" title="Singapore (ACRA ID: 20230812X) • Founded 2023">Singapore (ACRA ID: 20230812X) • Founded 2023</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {[
                  { label: 'Twitter', icon: '🐦' },
                  { label: 'LinkedIn', icon: '🔗' },
                  { label: 'GitHub', icon: '💻' }
                ].map(social => (
                  <div key={social.label} className="px-2.5 py-1.5 sm:px-3 bg-white hover:bg-gray-50 transition-colors rounded-xl text-[10px] font-bold tracking-tight flex items-center gap-1 sm:gap-1.5 text-gray-600 border border-gray-100 shadow-sm cursor-pointer lg:px-4 lg:py-2">
                    <span>{social.icon}</span>
                    {social.label}
                    <span className="text-[#00E676] text-[10px] ml-1">✓</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. Leadership & Backing */}
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <h3 className="text-base font-bold text-black">Leadership & Backing</h3>
                <div className="h-px flex-1 bg-gray-100" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { name: 'Alex Chen', role: 'Chief Executive Officer', extra: 'Ex-AWS Principal Architect', bio: '10+ years scaling global cloud infrastructure.' },
                  { name: 'Sarah Li', role: 'Chief Technology Officer', extra: 'Ex-Ethereum Foundation', bio: 'Expert in secure protocol & smart contract auditing.' }
                ].map((member, i) => (
                  <div key={i} className="flex items-start gap-4 p-5 bg-white border border-gray-100 rounded-3xl shadow-sm hover:border-black/5 transition-all">
                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-serif italic text-xl text-gray-400">
                      {member.name[0]}
                    </div>
                    <div>
                      <p className="text-[12px] font-black text-black">{member.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 tracking-tighter mb-1">{member.role}</p>
                      <p className="text-[9px] text-blue-500 font-bold tracking-widest mb-2">{member.extra}</p>
                      <p className="text-[11px] text-gray-500 font-light leading-relaxed">{member.bio}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. Business Narrative */}
            <section className="space-y-6">
              <h3 className="text-base font-bold text-black">Business Narrative</h3>
              <div className="space-y-6">
                <p className="text-sm text-gray-500 leading-relaxed font-medium">{asset.description}</p>
                <div className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <h4 className="text-[11px] font-bold text-gray-400 mb-2">Primary Funding Objective</h4>
                  <p className="text-sm text-black font-medium leading-relaxed">"{asset.useOfFunds || 'Purchasing 8 additional H100 GPUs and pre-paying data center rack fees in Tokyo to expand computing rental capacity.'}"</p>
                </div>
              </div>
            </section>

            {/* 4. Enterprise Insights */}
            <section className="space-y-6 pt-6">
              <div className="flex items-center gap-4">
                <h3 className="text-base font-bold text-black">Enterprise Insights</h3>
                <div className="h-px flex-1 bg-gray-100" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {/* VALUE PROPOSITION */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black tracking-widest text-[#00E676] uppercase">Value Proposition</p>
                    <p className="text-sm font-medium text-gray-700 leading-relaxed">Skip the prompt engineering. Get operator-tested AI configurations that actually ship — with playbooks, tool setups, and step-by-step guides.</p>
                  </div>
                </div>

                {/* TARGET AUDIENCE */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black tracking-widest text-[#00E676] uppercase">Target Audience</p>
                    <p className="text-sm font-medium text-gray-700 leading-relaxed">Entrepreneurs, Content Marketers, Social Media Operators, Creative Directors</p>
                  </div>
                </div>

                {/* PROBLEM SOLVED */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black tracking-widest text-[#00E676] uppercase">Problem Solved</p>
                    <p className="text-sm font-medium text-gray-700 leading-relaxed">Provides pre-built, battle-tested AI configurations to save time on prompt engineering.</p>
                  </div>
                </div>

                {/* BUSINESS DETAILS */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black tracking-widest text-[#00E676] uppercase">Business Details</p>
                    <div className="px-3 py-1 bg-gray-100/80 rounded-lg w-fit text-xs font-black text-gray-600 border border-gray-200/60 shadow-sm">B2C</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-4">
                {['Artificial Intelligence', 'Marketplace', 'Productivity', 'Marketing', 'Ecommerce'].map(tag => (
                  <span key={tag} className="px-4 py-2 bg-gray-50 border border-gray-100 shadow-sm rounded-xl text-[11px] font-bold text-gray-500 hover:bg-gray-100 hover:text-black transition-colors cursor-pointer">{tag}</span>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'AGREEMENT' && (
          <div className="space-y-12 animate-fadeIn">
            {/* 1. Fundraising Mechanics */}
            <section className="space-y-6">
              <h3 className="text-base font-bold text-black">Campaign Rules & Mechanics</h3>
              <div className="p-4 sm:p-8 bg-white border border-gray-100 rounded-2xl sm:rounded-3xl shadow-sm space-y-6 sm:space-y-8">
                {/* Visual Timeline */}
                <div className="relative pt-6 pb-2">
                  {/* Background Bar */}
                  <div className="absolute top-8 left-[16%] right-[16%] h-1 bg-gray-100 rounded-full" />
                  {/* Progress Bar */}
                  <div className="absolute top-8 left-[16%] h-1 bg-[#00E676] transition-all duration-1000 rounded-full" style={{ width: `${progress * 0.68}%` }} />

                  <div className="relative flex justify-between z-10 w-full">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center w-1/3 text-center space-y-3">
                      <div className="w-5 h-5 rounded-full bg-white border-4 border-gray-200 shadow-sm relative">
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] font-black  tracking-widest text-gray-400 whitespace-nowrap">Start</span>
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black  tracking-widest text-black mb-1">Fundraising</h4>
                        <p className="text-[10px] text-gray-500 font-medium px-2 leading-relaxed">Freely deposit or withdraw USDC.</p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center w-1/3 text-center space-y-3">
                      <div className="w-5 h-5 rounded-full bg-white border-4 border-black shadow-sm relative">
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] font-black  tracking-widest text-black whitespace-nowrap">${((asset.targetAmount * 0.5) / 1000).toFixed(0)}k</span>
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black  tracking-widest text-black mb-1">Success Point</h4>
                        <p className="text-[10px] text-gray-500 font-medium px-2 leading-relaxed">Goal met. Campaign secures funding.</p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col items-center w-1/3 text-center space-y-3">
                      <div className="w-5 h-5 rounded-full bg-white border-4 border-gray-200 shadow-sm relative">
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] font-black  tracking-widest text-gray-400 whitespace-nowrap">${(asset.targetAmount / 1000).toFixed(0)}k</span>
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black  tracking-widest text-black mb-1">Lock & Deploy</h4>
                        <p className="text-[10px] text-gray-500 font-medium px-2 leading-relaxed">Pool locked immediately. Yield begins.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conditions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                  <div className="flex gap-4 p-5 bg-green-50/50 rounded-2xl border border-green-100/50">
                    <div className="text-xl" style={{ marginTop: '2px' }}>💸</div>
                    <div>
                      <h4 className="text-[11px] font-black  tracking-widest text-black mb-1">If Campaign Succeeds</h4>
                      <p className="text-[10px] text-gray-500 leading-relaxed font-medium">Funds are locked. Guaranteed payout rules execute to distribute principal and yield (e.g., monthly) direct to wallet.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-5 bg-red-50/40 rounded-2xl border border-red-100/50">
                    <div className="text-xl" style={{ marginTop: '2px' }}>↩️</div>
                    <div>
                      <h4 className="text-[11px] font-black  tracking-widest text-black mb-1">If Campaign Fails</h4>
                      <p className="text-[10px] text-gray-500 leading-relaxed font-medium">Should the soft cap be missed before deadline, smart contracts auto-refund 100% of participants' capital safety.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Asset Structure Flow */}
            <section className="space-y-8">
              <h3 className="text-base font-bold text-black">Fund Flow & Asset Structure</h3>
              <div className="p-4 sm:p-10 bg-gray-50 rounded-2xl sm:rounded-[32px] border border-gray-100 flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 gap-y-4 sm:gap-y-8 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <div className="px-2 py-0.5 bg-white/80 backdrop-blur rounded text-[9px] font-bold text-gray-400 border border-gray-100">Immutable Smart Contract</div>
                </div>
                {[
                  'Investors', 'Loka SPV', 'Borrower', 'Purchase H100', 'Revenue Gen', 'Stripe Escrow', 'Auto-Repay'
                ].map((step, i) => (
                  <React.Fragment key={i}>
                    <div className="relative group">
                      <div className={`px-4 py-3 rounded-2xl border shadow-sm transition-all duration-500 flex items-center justify-center min-w-[100px] ${i === 6 ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-100 group-hover:border-black'
                        }`}>
                        <p className="text-[9px] font-black  tracking-widest">{step}</p>
                      </div>
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold text-gray-300 italic">Step 0{i + 1}</div>
                    </div>
                    {i < 6 && (
                      <div className="text-gray-300 font-light text-xl animate-pulse">→</div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </section>

            {/* 3. Key Rights & Protections */}
            <section className="space-y-6">
              <h3 className="text-base font-bold text-black">Key Rights & Protections</h3>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  {
                    icon: '🥇',
                    title: 'Seniority',
                    badge: 'Senior Secured',
                    plainEnglish: 'In the event of liquidation, you are paid back first—before the company’s shareholders.'
                  },
                  {
                    icon: '🛡️',
                    title: 'Structure',
                    badge: 'Bankruptcy Remote',
                    plainEnglish: 'Assets are held in a secure, independent SPV. Even if the parent company fails, your investment remains out of reach for their creditors.'
                  },
                  {
                    icon: '🧱',
                    title: 'Collateral Ratio',
                    badge: '120%-150%',
                    plainEnglish: 'Every $100 lent is backed by up to $150 in expected revenue. Even if earnings drop by 30%, your principal remains secure.'
                  },
                  {
                    icon: '🤖',
                    title: 'Smart Escrow',
                    badge: 'Code Enforced',
                    plainEnglish: 'Revenue is intercepted by SDK and flows directly into on-chain contracts. It is tamper-proof and automatically distributed at maturity.'
                  }
                ].map((item, i) => (
                  <div key={i} className="group relative bg-white border border-gray-100 p-4 sm:p-6 rounded-2xl sm:rounded-[32px] hover:border-black transition-all duration-300 shadow-sm overflow-hidden h-40 sm:h-48 flex flex-col justify-between">
                    {/* Normal State */}
                    <div className="space-y-3">
                      <div className="text-2xl">{item.icon}</div>
                      <div>
                        <p className="text-[11px] font-bold text-gray-400  tracking-tight">{item.title}</p>
                        <p className="text-sm font-black text-black leading-tight mt-1">{item.badge}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-gray-50">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00E676]" />
                      <span className="text-[9px] font-bold text-gray-400  tracking-widest">Active Protection</span>
                    </div>

                    {/* Hover State - Explanation */}
                    <div className="absolute inset-0 bg-black/95 p-3 sm:p-6 flex flex-col justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 cursor-default">
                      <p className="text-[13px] text-white font-medium leading-relaxed italic text-center">
                        "{item.plainEnglish}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. Documentation */}
            <section className="space-y-6">
              <h3 className="text-base font-bold text-black">Verifiable Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { name: 'Loan_Agreement_v1.pdf', type: 'Framework' },
                  { name: 'UCC-1_Filing_Evidence.pdf', type: 'Collateral' },
                  { name: 'Legal_Compliance_Opinion.pdf', type: 'Audit' },
                  { name: 'SPV_Org_Document.pdf', type: 'Structure' }
                ].map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-3xl group cursor-pointer hover:border-black transition-all shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                        <Icons.Shield />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold block">{doc.name}</span>
                        <span className="text-[9px] font-medium text-gray-400">{doc.type} Document • 2.4MB</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all text-gray-400">Preview</span>
                      <span className="text-xl">📄</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'FINANCIALS' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Repayment Progress — only for funded projects with schedule data */}
            {isFunded && repaymentSchedule.length > 0 && (() => {
              const paidCount = repaymentSchedule.filter(s => s.status === 'paid').length;
              const overdueCount = repaymentSchedule.filter(s => s.status === 'overdue').length;
              const totalPeriods = repaymentSchedule.length;

              return (
                <section className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-base font-bold text-black">Repayment Progress</h3>
                    <span className="text-[11px] font-bold text-gray-400">{paidCount}/{totalPeriods} periods</span>
                    <div className="h-px flex-1 bg-gray-100" />
                    {overdueCount > 0 ? (
                      <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-full border border-red-200/50 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                        {overdueCount} Overdue
                      </span>
                    ) : paidCount === totalPeriods ? (
                      <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-full border border-green-200/50">✓ Completed</span>
                    ) : (
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full border border-blue-200/50">On Track</span>
                    )}
                  </div>

                  {/* Period bars with hover tooltip */}
                  <div className="p-4 sm:p-5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3">
                    <div className="flex gap-1">
                      {repaymentSchedule.map((s, i) => {
                        const dueDate = new Date(s.dueDate);
                        const monthLabel = dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
                        const dueDateStr = dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                        const statusLabel = s.status === 'paid' ? 'Paid' : s.status === 'overdue' ? 'Overdue' : s.status === 'due' ? 'Due' : s.status === 'defaulted' ? 'Defaulted' : 'Upcoming';
                        return (
                          <div
                            key={i}
                            className={`relative h-3 flex-1 rounded-full cursor-pointer transition-all peer ${s.status === 'paid' ? 'bg-green-400 hover:bg-green-500' :
                                s.status === 'overdue' ? 'bg-red-400 animate-pulse hover:bg-red-500' :
                                  s.status === 'defaulted' ? 'bg-gray-400 hover:bg-gray-500' :
                                    s.status === 'due' ? 'bg-amber-400 hover:bg-amber-500' :
                                      'bg-gray-200 hover:bg-gray-300'
                              }`}
                            style={{ zIndex: 1 }}
                            onMouseEnter={(e) => {
                              const tip = e.currentTarget.querySelector('[data-tip]') as HTMLElement;
                              if (tip) {
                                tip.style.opacity = '1';
                                // Reposition if overflowing
                                const rect = tip.getBoundingClientRect();
                                if (rect.left < 8) tip.style.transform = `translateX(${8 - rect.left}px)`;
                                else if (rect.right > window.innerWidth - 8) tip.style.transform = `translateX(${window.innerWidth - 8 - rect.right}px)`;
                              }
                            }}
                            onMouseLeave={(e) => {
                              const tip = e.currentTarget.querySelector('[data-tip]') as HTMLElement;
                              if (tip) { tip.style.opacity = '0'; tip.style.transform = ''; }
                            }}
                          >
                            <div data-tip className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 transition-opacity pointer-events-none" style={{ zIndex: 50 }}>
                              <div className="bg-gray-900 text-white rounded-xl px-3 py-2.5 text-[10px] font-medium whitespace-nowrap shadow-lg space-y-1">
                                <p className="font-bold text-[11px]">{monthLabel}</p>
                                <p>Due: {dueDateStr}</p>
                                <p>Amount: ${s.status === 'paid' ? s.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : s.totalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                <p>Status: <span className={
                                  s.status === 'paid' ? 'text-green-400' :
                                    s.status === 'overdue' ? 'text-red-400' :
                                      s.status === 'due' ? 'text-amber-400' :
                                        'text-gray-400'
                                }>{statusLabel}</span></p>
                              </div>
                              <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-4">
                      {[
                        { color: 'bg-green-400', label: 'Paid' },
                        { color: 'bg-amber-400', label: 'Due' },
                        { color: 'bg-red-400', label: 'Overdue' },
                        { color: 'bg-gray-200', label: 'Upcoming' },
                      ].map(l => (
                        <div key={l.label} className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${l.color}`} />
                          <span className="text-[9px] font-bold text-gray-400">{l.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              );
            })()}

            {isFunded && repaymentLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
              </div>
            )}

            {/* 1. Live Monitor */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-bold text-black">Stripe Connect API Monitor</h3>
                  <div className="bg-blue-50 text-blue-600 text-[9px] font-bold px-3 py-1 rounded-full italic">Read-Only Access</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse" />
                  <span className="text-[10px] font-bold text-[#00E676]">Oracle Online</span>
                </div>
              </div>

              {/* High Level Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {[
                  { label: '30d Gross Flow', value: `$1,245,600`, sub: 'Up 11.2% MoM', trend: 'up' },
                  { label: 'Coverage Ratio', value: '2.49x', sub: 'Calculated at Maturity', trend: 'safe' },
                  { label: 'MRR', value: '$42,000', sub: 'Enterprise Focus', trend: 'up' }
                ].map((stat, i) => (
                  <div key={i} className="p-4 sm:p-6 bg-white glass rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <p className="text-[10px] font-bold text-gray-400  tracking-widest mb-2 sm:mb-3">{stat.label}</p>
                    <p className="text-xl sm:text-3xl font-black text-black mb-1 tracking-tight">{stat.value}</p>
                    <p className="text-[10px] font-bold text-[#00E676]  tracking-tighter flex items-center gap-1">
                      {stat.trend === 'up' && '▲'} {stat.sub}
                    </p>
                  </div>
                ))}
              </div>

              {/* Detailed Analysis Section */}
              <div className="space-y-6">
                {/* Revenue History Light Area Chart */}
                <div className="bg-white rounded-2xl sm:rounded-[24px] border border-gray-100 p-4 sm:p-8 space-y-6 sm:space-y-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-baseline gap-2 sm:gap-3">
                      <h4 className="text-xl sm:text-3xl font-black text-black">$79,479</h4>
                      <p className="text-[#00E676] text-xs font-bold flex items-center gap-1">↑ 139.3% <span className="text-gray-400 font-medium">vs. prev period</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="px-4 py-2 rounded-xl border border-gray-100 bg-gray-50 text-[11px] font-bold text-gray-600 flex items-center gap-2 cursor-pointer shadow-sm hover:bg-gray-100 transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        Revenue
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                      <div className="px-4 py-2 rounded-xl border border-gray-100 bg-gray-50 text-[11px] font-bold text-gray-600 flex items-center gap-2 cursor-pointer shadow-sm hover:bg-gray-100 transition-colors">
                        Last 30 days
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>

                  <div className="h-[200px] sm:h-[280px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={asset.monthlyRevenue}>
                        <defs>
                          <linearGradient id="colorAmountLight" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="1 6" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 600 }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 600 }}
                          tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                          width={45}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E5E7EB', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                          itemStyle={{ color: '#000' }}
                          cursor={{ stroke: '#E5E7EB', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorAmountLight)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Concentration Analysis */}
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-6">
                  <p className="text-sm font-bold text-black border-b border-gray-100 pb-3">Customer Concentration Analysis</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    {[
                      { label: 'Top 1 Customer', value: '15%', color: 'bg-black' },
                      { label: 'Top 5 Customers', value: '42%', color: 'bg-gray-400' },
                      { label: 'Long-Tail Borrowers', value: '43%', color: 'bg-gray-200' }
                    ].map((item, i) => (
                      <div key={i} className="space-y-3">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-gray-400">{item.label}</span>
                          <span className="text-black">{item.value}</span>
                        </div>
                        <div className="w-full h-1.5 bg-white rounded-full overflow-hidden border border-gray-100/50">
                          <div className={`h-full ${item.color}`} style={{ width: item.value }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 italic leading-relaxed pt-2">Diversified customer base ensures that if a single client churns, the underlying asset revenue remains robust enough to cover interest payments.</p>
                </div>
              </div>
            </section>

          </div>
        )}
      </div>
    </div>
  );
};

export { AssetDetail, mapApiProject };
export default Market;
