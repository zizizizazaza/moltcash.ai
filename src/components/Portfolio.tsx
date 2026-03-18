import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { usePrivy } from '@privy-io/react-auth';
import { AreaChart, Area, Tooltip, ResponsiveContainer, CartesianGrid, YAxis, XAxis } from 'recharts';
import { Icons } from '../constants';
import { api } from '../services/api';
import type { RepaymentSchedule } from '../types';

// Generate 90 days of dummy data
const generateChartData = () => {
  const data = [];
  let currentTotal = 11000;
  const now = new Date();
  for (let i = 90; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    currentTotal = currentTotal + (Math.random() * 200 - 90); // Random walk
    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timestamp: d.getTime(),
      total: currentTotal
    });
  }
  return data;
};

const chartData = generateChartData();

interface PortfolioProps {
  isWalletConnected?: boolean;
  onConnect?: () => void;
  onSettingsClick?: () => void;
  onLogout?: () => void;
}

const Portfolio: React.FC<PortfolioProps> = ({ isWalletConnected = false, onConnect, onSettingsClick, onLogout }) => {
  const [balance, setBalance] = useState(12450.88);
  const [yieldAccumulated, setYieldAccumulated] = useState(0.00012);
  const [isHidden, setIsHidden] = useState(false);
  const [greeting, setGreeting] = useState('Good Morning');
  const [apiHoldings, setApiHoldings] = useState<any[]>([]);
  const [apiInvestments, setApiInvestments] = useState<any[]>([]);
  const [apiHistory, setApiHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'holdings' | 'activity'>('holdings');
  const [enterpriseDeductions, setEnterpriseDeductions] = useState<Record<string, { schedule: RepaymentSchedule[]; project: any }>>({});
  const enterpriseFetched = useRef(false);

  const { user } = usePrivy();
  const linkedWallets = (user?.linkedAccounts ?? []).filter(
    (acc) => (acc.type === 'wallet' || acc.type === 'smart_wallet') && 'address' in acc
  ) as Array<{ address: string; walletClientType?: string }>;
  const privyEmbeddedWallet = linkedWallets.find((w) => w.walletClientType === 'privy');
  const walletAddress = privyEmbeddedWallet?.address ?? linkedWallets[0]?.address ?? '';
  const [copied, setCopied] = useState(false);
  const [timeframe, setTimeframe] = useState('7D');
  const [profileTab, setProfileTab] = useState<'personal' | 'enterprise'>('personal');
  const [showCreditModal, setShowCreditModal] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  useEffect(() => {
    if (!isWalletConnected || !api.isAuthenticated) return;
    Promise.all([
      api.getHoldings().catch(() => []),
      api.getInvestments().catch(() => []),
      api.getHistory().catch(() => []),
    ]).then(([h, inv, hist]) => {
      if (Array.isArray(h) && h.length > 0) {
        setApiHoldings(h);
        const total = h.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
        if (total > 0) setBalance(total);
      }
      if (Array.isArray(inv) && inv.length > 0) setApiInvestments(inv);
      if (Array.isArray(hist) && hist.length > 0) setApiHistory(hist);
    });
  }, [isWalletConnected]);

  // Fetch enterprise deduction data when enterprise tab is active
  useEffect(() => {
    if (profileTab !== 'enterprise' || !isWalletConnected) return;
    if (enterpriseFetched.current) return;
    enterpriseFetched.current = true;
    (async () => {
      try {
        // Try applications first (auth-required)
        let hasData = false;
        if (api.isAuthenticated) {
          const apps = await api.getApplications().catch(() => []);
          if (Array.isArray(apps) && apps.length > 0) {
            const results: Record<string, { schedule: RepaymentSchedule[]; project: any }> = {};
            await Promise.all(
              apps.filter((a: any) => a.projectId).map(async (app: any) => {
                const schedule = await api.getRepaymentSchedule(app.projectId).catch(() => []);
                if (Array.isArray(schedule) && schedule.length > 0) {
                  results[app.projectId] = { schedule, project: { id: app.projectId, title: app.projectName || app.projectId } };
                }
              })
            );
            if (Object.keys(results).length > 0) {
              setEnterpriseDeductions(results);
              hasData = true;
            }
          }
        }
        // Fallback: use all projects that have repayment schedules
        if (!hasData) {
          const projects = await api.getProjects().catch(() => []);
          if (Array.isArray(projects)) {
            const fundedProjects = projects.filter((p: any) => p.status === 'Funded' || p.status === 'Sold Out');
            const results: Record<string, { schedule: RepaymentSchedule[]; project: any }> = {};
            await Promise.all(
              fundedProjects.map(async (p: any) => {
                const schedule = await api.getRepaymentSchedule(p.id).catch(() => []);
                if (Array.isArray(schedule) && schedule.length > 0) {
                  results[p.id] = { schedule, project: { id: p.id, title: p.title } };
                }
              })
            );
            setEnterpriseDeductions(results);
          }
        }
      } catch { /* ignore */ }
    })();
  }, [profileTab, isWalletConnected, enterpriseDeductions]);

  const getFilteredData = () => {
    if (timeframe === '7D') return chartData.slice(-7);
    if (timeframe === '30D') return chartData; // Currently dataset is small, so returning full data for 30D
    if (timeframe === '3M') return chartData;
    return chartData; // Return full data by default
  };

  const filteredChartData = getFilteredData();

  if (!isWalletConnected) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-fadeIn">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-2">
          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-black">Authentication Required</h2>
          <p className="text-sm font-medium text-gray-400 max-w-sm mx-auto leading-relaxed">
            Please connect your wallet to access your portfolio positions, track yields, and review transaction history.
          </p>
        </div>
        <button
          onClick={onConnect}
          className="mt-6 px-8 py-3 bg-black text-white rounded-full text-xs font-bold tracking-widest  hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl active:scale-95"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto animate-fadeIn pb-28 md:pb-24 px-4 space-y-6">

        {/* Top bar: Tabs + Settings/Logout */}
        <div className="pt-10 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setProfileTab('personal')}
              className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${profileTab === 'personal' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
            >
              Personal
            </button>
            <button
              onClick={() => setProfileTab('enterprise')}
              className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${profileTab === 'enterprise' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
            >
              Enterprise
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onSettingsClick}
              className="p-2 text-gray-400 hover:text-black bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
              title="Account Settings"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
            <button
              onClick={onLogout}
              className="p-2 text-red-400 hover:text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
              title="Log Out"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>

        {profileTab === 'personal' ? (
          <>

            {/* TWO COLUMN PORTFOLIO HERO LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-0 pb-6">

              {/* --- Left Card: Profile & Overview --- */}
              <div className="md:col-span-5 bg-white border border-gray-100 rounded-3xl shadow-sm p-4 sm:p-6 flex flex-col justify-between space-y-4 sm:space-y-6">

                {/* User Profile */}
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Gradient Avatar Mock */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#00E676] via-blue-400 to-amber-300 opacity-90 shadow-inner flex-shrink-0" />
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-xl font-black text-black tracking-tight truncate">
                        {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Setting up wallet...'}
                      </h2>
                      {walletAddress && (
                      <button onClick={handleCopy} className="text-gray-400 hover:text-black transition-colors" title="Copy Address">
                        {copied ? (
                          <svg className="w-4 h-4 text-[#00E676]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        )}
                      </button>
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-gray-400">Joined Nov {new Date().getFullYear()}</p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-between sm:items-center py-2 border-y border-gray-50/80">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold  tracking-widest mb-1">Net Worth</span>
                    <span className="text-base sm:text-lg font-black text-black">${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="hidden sm:block w-px h-8 bg-gray-100"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold  tracking-widest mb-1">Total Yield</span>
                    <span className="text-base sm:text-lg font-black text-[#00E676]">+$340.00</span>
                  </div>
                  <div className="hidden sm:block w-px h-8 bg-gray-100"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold  tracking-widest mb-1">Assets</span>
                    <span className="text-base sm:text-lg font-black text-black">4</span>
                  </div>
                  <div className="hidden sm:block w-px h-8 bg-gray-100 mx-1"></div>
                  <div
                    className="col-span-2 sm:col-span-1 flex flex-col justify-center cursor-pointer group px-4 py-2 bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border border-violet-100/60 hover:border-violet-200 hover:shadow-md transition-all shadow-sm"
                    onClick={() => setShowCreditModal(true)}
                  >
                    <span className="text-[8px] text-violet-400 font-black tracking-widest flex items-center gap-1">
                      CREDIT
                    </span>
                    <div className="flex items-center gap-1.5 leading-none mt-1">
                      <Icons.Coins className="w-4 h-4 text-violet-500" />
                      <span className="text-xl font-black text-violet-600 leading-none">850</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('loka-open-modal', { detail: 'deposit' }))}
                    className="w-full py-2.5 bg-transparent border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-500 hover:text-black rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                    Deposit
                  </button>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('loka-open-modal', { detail: 'withdraw' }))}
                    className="w-full py-2.5 bg-transparent border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-500 hover:text-black rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    Withdraw
                  </button>
                </div>

                {/* Invite Friends button */}
                <InvitationCodesTopEntry variant="card" />

              </div>

              {/* --- Right Card: Chart & History --- */}
              <div className="md:col-span-7 bg-white border border-gray-100 rounded-3xl shadow-sm p-4 sm:p-6 flex flex-col justify-between">

                {/* Chart Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00E676] animate-pulse"></div>
                      <span className="text-[10px] text-gray-500 font-bold tracking-widest ">Profit / Loss</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-black">+${(340.00).toFixed(2)}</h2>
                    <p className="text-[11px] font-bold text-gray-400 mt-1  tracking-widest">{timeframe === 'ALL' ? 'All Time' : `Past ${timeframe}`}</p>
                  </div>

                  {/* Toggles */}
                  <div className="flex bg-gray-50 p-1 rounded-full border border-gray-100 gap-0.5 mt-3 sm:mt-0 self-start">
                    {['7D', '30D', '3M', 'ALL'].map(t => (
                      <button
                        key={t}
                        onClick={() => setTimeframe(t)}
                        className={`px-3 py-1.5 text-[10px] font-black rounded-full transition-all ${timeframe === t ? 'bg-white text-black shadow-sm border border-gray-200/50' : 'text-gray-400 hover:text-black'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chart Container */}
                <div className="h-[150px] w-full mt-6 overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredChartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00E676" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#00E676" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="timestamp"
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={30}
                        tickFormatter={(tick) => {
                          const date = new Date(tick);
                          if (timeframe === '7D') return date.toLocaleDateString('en-US', { weekday: 'short' });
                          if (timeframe === '30D') return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          return date.toLocaleDateString('en-US', { month: 'short' });
                        }}
                        tick={{ fontSize: 9, fill: '#9CA3AF', fontWeight: 'bold' }}
                        dy={5}
                      />
                      <YAxis domain={['dataMin - 200', 'dataMax + 100']} hide />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-xl">
                                <p className="text-[10px] text-gray-400 font-bold mb-0.5  tracking-widest">{new Date(payload[0].payload.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                <p className="text-sm font-black text-black">${payload[0].value?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#00E676"
                        fillOpacity={1}
                        fill="url(#colorTotal)"
                        strokeWidth={2.5}
                        animationDuration={800}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

              </div>
            </div>

            {/* BOTTOM SECTION: Tabs for Holding / Activity */}
            <div className="space-y-6">

              {/* Tabs Control */}
              <div className="flex items-center gap-6 border-b border-gray-100 pb-px">
                <button
                  onClick={() => setActiveTab('holdings')}
                  className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'holdings' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Holdings
                  {activeTab === 'holdings' && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black rounded-t-full" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'activity' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Activity
                  {activeTab === 'activity' && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black rounded-t-full" />
                  )}
                </button>
              </div>

              {/* Tab Content */}
              <div className="pt-2">
                {activeTab === 'holdings' ? (
                  <section className="space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-1 gap-4">
                      <AllocationCard
                        title="AIUSD"
                        desc="Treasury Backed Stablecoin"
                        apy="5.24% APY"
                        amount="$10,340.00"
                        earnings="+$340.00"
                        icon={<div className="w-6 h-6 bg-black rounded flex items-center justify-center font-black text-white text-[10px]">A</div>}
                        creditBadge="120 pts"
                        onClick={() => window.dispatchEvent(new CustomEvent('loka-nav-swap'))}
                        action={
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('loka-nav-swap')); }}
                              className="px-4 py-1.5 bg-gray-100/80 text-black text-[11px] font-bold rounded-full hover:bg-gray-200 transition-colors shadow-sm"
                            >
                              Add
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('loka-nav-swap')); }}
                              className="px-4 py-1.5 bg-black text-white text-[11px] font-bold rounded-full hover:bg-gray-800 transition-colors shadow-sm"
                            >
                              Sell
                            </button>
                          </div>
                        }
                      />
                      <AllocationCard
                        title="ComputeDAO - GPU Expansion"
                        statusBadge={<span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-md text-[9px] font-black">Funded</span>}
                        apy="15.5% APY · 60d"
                        amount="$5,000.00"
                        earnings="+$387.50"
                        icon={<div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center font-black text-white text-[10px]">C</div>}
                        creditBadge="65 pts"
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('loka-nav-market'));
                          setTimeout(() => window.dispatchEvent(new CustomEvent('loka-open-asset', { detail: 'ComputeDAO' })), 100);
                        }}
                      />
                    </div>
                  </section>
                ) : (
                  <section className="space-y-4 animate-fadeIn">
                    <div className="glass rounded-2xl sm:rounded-[32px] overflow-hidden bg-white shadow-sm border border-gray-100">
                      <ActivityItem
                        title="Daily Interest Payout"
                        time="Today, 08:00 AM"
                        source="AIUSD"
                        amount="+$5.24"
                        type="INTEREST"
                        onSourceClick={() => window.dispatchEvent(new CustomEvent('loka-nav-swap'))}
                      />
                      <ActivityItem
                        title="USDC Deposit"
                        time="Yesterday, 04:15 PM"
                        amount="+$1,000.00"
                        type="DEPOSIT"
                      />
                      <ActivityItem
                        title="Daily Interest Payout"
                        time="Jan 22, 08:00 AM"
                        source="ComputeDAO - GPU Expansion"
                        amount="+$5.10"
                        type="INTEREST"
                        onSourceClick={() => {
                          window.dispatchEvent(new CustomEvent('loka-nav-market'));
                          setTimeout(() => window.dispatchEvent(new CustomEvent('loka-open-asset', { detail: 'ComputeDAO' })), 100);
                        }}
                      />
                    </div>
                  </section>
                )}
              </div>

            </div>


          </>
        ) : (
          /* ============ ENTERPRISE TAB ============ */
          <div className="space-y-6 animate-fadeIn">

            {/* Company Info Card - Simplified */}
            <section className="bg-white border border-gray-100 rounded-3xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black text-black">Company Information</h2>
                <span className="px-2.5 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-full border border-green-200/50 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  Verified Issuer
                </span>
              </div>

              <div className="space-y-0 divide-y divide-gray-100">
                <div className="flex items-center justify-between py-3">
                  <span className="text-[11px] text-gray-400 font-medium">Company Name</span>
                  <span className="text-[13px] font-bold text-black">Loka Technologies Pte Ltd</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-[11px] text-gray-400 font-medium">Country / Region</span>
                  <span className="text-[13px] font-bold text-black">Singapore</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-[11px] text-gray-400 font-medium">Registration No.</span>
                  <span className="text-[13px] font-bold text-black">202312345A</span>
                </div>
                <div className="flex items-start sm:items-center justify-between py-3 gap-2">
                  <span className="text-[11px] text-gray-400 font-medium shrink-0">Registered Address</span>
                  <span className="text-[13px] font-bold text-black text-right">1 Raffles Place, #20-01, Singapore 048616</span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 rounded-full border border-violet-100">
                  <span className="text-xs">🔗</span>
                  <span className="text-[10px] font-bold text-violet-600">SBT #1024</span>
                  <span className="text-[9px] text-violet-400">Active</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
                  <span className="text-xs">🪪</span>
                  <span className="text-[10px] font-bold text-green-600">KYC Verified</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200">
                  <span className="text-xs">📄</span>
                  <span className="text-[10px] font-bold text-gray-600">2 Docs</span>
                </div>
              </div>
            </section>

            {/* Submitted Projects */}
            <section className="bg-white border border-gray-100 rounded-3xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-5 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <span className="text-lg">📋</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-black">Submitted Projects</h2>
                    <p className="text-[10px] text-gray-400 font-medium">Your fundraising campaigns</p>
                  </div>
                </div>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('loka-nav-groups'))}
                  className="px-3.5 py-1.5 bg-gray-100 text-black text-[11px] font-bold rounded-lg hover:bg-gray-200 transition-all flex items-center gap-1 active:scale-95"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                  New Project
                </button>
              </div>

              <div className="space-y-3">
                {/* Project 1 - Active/Fundraising */}
                <div
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('loka-nav-market'));
                    setTimeout(() => window.dispatchEvent(new CustomEvent('loka-open-asset', { detail: 'ComputeDAO' })), 100);
                  }}
                  className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center font-black text-white text-sm shrink-0">C</div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-black group-hover:text-violet-600 transition-colors truncate">ComputeDAO - GPU Expansion</h3>
                        <p className="text-[10px] text-gray-400 font-medium">Target: $500,000 · 60d · 15.5% APY</p>
                        <div className="flex items-center gap-2 mt-1.5 sm:hidden">
                          <span className="text-xs font-bold text-black">$375,000</span>
                          <span className="text-[9px] text-gray-400">75%</span>
                          <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[9px] font-black rounded-full border border-green-200/50">Fundraising</span>
                        </div>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-black">$375,000</p>
                        <p className="text-[10px] text-gray-400">75% funded</p>
                      </div>
                      <span className="px-2.5 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-full border border-green-200/50">● Fundraising</span>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors sm:hidden shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>

                {/* Project 2 - Under Review */}
                <div
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('loka-nav-market'));
                    setTimeout(() => window.dispatchEvent(new CustomEvent('loka-open-asset', { detail: 'Shopify' })), 100);
                  }}
                  className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center font-black text-white text-sm shrink-0">S</div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-black group-hover:text-violet-600 transition-colors truncate">Shopify Merchant Cluster X</h3>
                        <p className="text-[10px] text-gray-400 font-medium">Target: $200,000 · 45d · 12% APY</p>
                        <div className="flex items-center gap-2 mt-1.5 sm:hidden">
                          <span className="text-xs font-bold text-black">—</span>
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black rounded-full border border-amber-200/50">Under Review</span>
                        </div>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-black">—</p>
                        <p className="text-[10px] text-gray-400">Pending</p>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-full border border-amber-200/50">● Under Review</span>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors sm:hidden shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>

                {/* Project 3 - Completed */}
                <div
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('loka-nav-market'));
                    setTimeout(() => window.dispatchEvent(new CustomEvent('loka-open-asset', { detail: 'Vercel' })), 100);
                  }}
                  className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center font-black text-white text-sm shrink-0">V</div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-black group-hover:text-violet-600 transition-colors truncate">Vercel SaaS Pool</h3>
                        <p className="text-[10px] text-gray-400 font-medium">Target: $150,000 · 30d · 10% APY</p>
                        <div className="flex items-center gap-2 mt-1.5 sm:hidden">
                          <span className="text-xs font-bold text-black">$150,000</span>
                          <span className="text-[9px] text-green-500">Repaid</span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-black rounded-full border border-gray-200/50">Completed</span>
                        </div>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-black">$150,000</p>
                        <p className="text-[10px] text-green-500">Fully repaid</p>
                      </div>
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-[10px] font-black rounded-full border border-gray-200/50">● Completed</span>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors sm:hidden shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </div>
            </section>

            {/* Platform Deductions (Issuer view: auto-deduction records) */}
            <section className="bg-white border border-gray-100 rounded-3xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                  <span className="text-lg">🔄</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-black">Platform Deductions</h2>
                  <p className="text-[10px] text-gray-400 font-medium">Auto-deducted from project revenue for investor repayments</p>
                </div>
              </div>

              {Object.keys(enterpriseDeductions).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400 font-medium">No deduction records yet</p>
                  <p className="text-xs text-gray-300 mt-1">Records appear once your funded projects begin repayment cycles</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(enterpriseDeductions).map(([projectId, { schedule, project }]) => {
                    const paidPeriods = schedule.filter(s => s.status === 'paid');
                    const totalDeducted = paidPeriods.reduce((sum, s) => sum + s.paidAmount, 0);
                    const totalPeriods = schedule.length;
                    const overduePeriods = schedule.filter(s => s.status === 'overdue');

                    return (
                      <div key={projectId} className="border border-gray-100 rounded-2xl overflow-hidden">
                        {/* Project header */}
                        <div className="p-4 bg-gray-50/50 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center font-black text-white text-xs shrink-0">
                              {(project.title || 'P')[0]}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-black truncate">{project.title || projectId}</h4>
                              <p className="text-[9px] text-gray-400">{paidPeriods.length}/{totalPeriods} periods deducted</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black text-black">${totalDeducted.toLocaleString()}</p>
                            <p className="text-[9px] text-gray-400">total deducted</p>
                          </div>
                        </div>

                        {/* Overdue warning */}
                        {overduePeriods.length > 0 && (
                          <div className="px-4 py-2.5 bg-red-50 border-t border-red-100 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            <p className="text-[10px] font-bold text-red-600">
                              {overduePeriods.length} period{overduePeriods.length > 1 ? 's' : ''} pending deduction — revenue shortfall detected
                            </p>
                          </div>
                        )}

                        {/* Deduction records */}
                        {paidPeriods.length > 0 && (
                          <div className="divide-y divide-gray-50">
                            {paidPeriods.slice(-5).reverse().map((s) => (
                              <div key={s.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-6 h-6 rounded-md bg-violet-50 flex items-center justify-center">
                                    <svg className="w-3 h-3 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-bold text-black">Period {s.periodNumber}</p>
                                    <p className="text-[9px] text-gray-400">{s.paidAt ? new Date(s.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-[11px] font-bold text-black">-${s.paidAmount.toFixed(2)}</p>
                                  <p className="text-[9px] text-gray-400">P: ${s.principalDue.toFixed(2)} + I: ${s.interestDue.toFixed(2)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

          </div>
        )}
      </div>

      {/* ── Credit Info Modal ── */}
      {showCreditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowCreditModal(false)} />
          <div className="relative bg-white rounded-[40px] shadow-2xl border border-gray-100 w-full max-w-md max-h-[90vh] overflow-y-auto animate-slideUp flex flex-col p-6 m-auto scrollbar-hide">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-black tracking-tight">Credit System</h3>
              <button
                onClick={() => setShowCreditModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-6 relative z-10 flex-1">
              {/* Score Header - Clean Text Style - More Compact */}
              <div className="flex items-center gap-5 bg-violet-600 p-6 rounded-[28px] text-white shadow-xl shadow-violet-100 relative overflow-hidden">
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10">
                  <p className="text-3xl font-black leading-none mb-1">850</p>
                  <p className="text-[9px] font-bold opacity-60 tracking-[0.2em] uppercase">Current Score</p>
                </div>

                <div className="w-px h-10 bg-white/20" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <Icons.Coins className="w-5 h-5 text-white" />
                    <span className="text-sm font-black whitespace-nowrap">Believer Tier</span>
                  </div>
                  <p className="text-[10px] font-bold opacity-70 flex items-center gap-1.5">
                    150 pts until <Icons.Crown className="w-3.5 h-3.5 text-white" /> Legend
                  </p>
                </div>
              </div>

              {profileTab === 'personal' ? (
                <>
                  {/* Personal (Investors) */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-1">How to Earn</p>
                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                      <span className="text-xl">💰</span>
                      <div className="flex-1">
                        <p className="text-xs font-black text-black leading-tight">Investment Bonus</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1">First deposit & early bird subscription rewards</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                      <span className="text-xl">⏳</span>
                      <div className="flex-1">
                        <p className="text-xs font-black text-black leading-tight">Capital Holding</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1">Earn up to +80 pts for 30-360 day holding</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                      <span className="text-xl">🔄</span>
                      <div className="flex-1">
                        <p className="text-xs font-black text-black leading-tight">Reinvestment</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1">Roll over principal & interest for bonus pts</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-violet-600 p-5 rounded-[28px] text-white shadow-xl shadow-violet-100">
                    <p className="text-[8px] font-black text-violet-300 tracking-widest uppercase mb-3">Tier Privileges</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-black">🚀 Early Access</p>
                        <p className="text-[9px] opacity-70 font-bold">6-24h head start</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-black">🛡 Fee Discount</p>
                        <p className="text-[9px] opacity-70 font-bold">Down to 0.5%</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-black">🎟 Reserved Alloc</p>
                        <p className="text-[9px] opacity-70 font-bold">Hot deals guaranteed</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-black">⚖️ Governance</p>
                        <p className="text-[9px] opacity-70 font-bold">Vote at 150+ pts</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Enterprise (Issuers) */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-1">How to Build Credit</p>
                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                      <span className="text-xl">✅</span>
                      <div className="flex-1">
                        <p className="text-xs font-black text-black leading-tight">Timely Repayment</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1">Core source: on-time payout each cycle</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                      <span className="text-xl">🪪</span>
                      <div className="flex-1">
                        <p className="text-xs font-black text-black leading-tight">KYC / KYB Certification</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1">Instant +100 pts upon verification</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-violet-600 p-6 rounded-[32px] text-white shadow-xl shadow-violet-100">
                    <p className="text-[9px] font-black text-violet-300 tracking-widest uppercase mb-4">Issuer Perks</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-black">📈 LTV Boost</p>
                        <p className="text-[10px] opacity-70 font-bold">Collateral 30% &rarr; 10%</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-black">💎 Fee Reduction</p>
                        <p className="text-[10px] opacity-70 font-bold">Platform fee to 1%</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <button
                onClick={() => setShowCreditModal(false)}
                className="w-full py-4 bg-black text-white rounded-2xl text-[11px] font-black tracking-widest hover:bg-gray-900 active:scale-95 transition-all"
              >
                GOT IT
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const ActionButton: React.FC<{ label: string; sub: string; icon: React.ReactNode; primary?: boolean; highlight?: boolean; onClick?: () => void }> = ({ label, sub, icon, primary, highlight, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center p-6 rounded-[32px] transition-all group w-full ${primary ? 'bg-black text-white shadow-xl hover:bg-gray-800' :
    highlight ? 'bg-white border-2 border-green-500/20 text-black shadow-lg shadow-green-500/5 hover:bg-green-50' :
      'bg-white glass text-black hover:bg-gray-50 shadow-md border-gray-100'
    }`}>
    <div className={`mb-3 transition-transform group-hover:-translate-y-1 ${primary ? 'text-white' : highlight ? 'text-green-500' : 'text-gray-400'}`}>
      {icon}
    </div>
    <span className="text-xs font-bold tracking-tight">{label}</span>
    <span className={`text-[9px] font-medium opacity-50  tracking-widest mt-1 ${primary ? 'text-gray-400' : 'text-gray-500'}`}>{sub}</span>
  </button>
);

const AllocationCard: React.FC<{
  title: string;
  desc?: string;
  apy: string;
  amount: string;
  earnings: string;
  icon: React.ReactNode;
  progress?: string;
  action?: React.ReactNode;
  onClick?: () => void;
  statusBadge?: React.ReactNode;
  creditBadge?: string;
}> = ({ title, desc, apy, amount, earnings, icon, progress, action, onClick, statusBadge, creditBadge }) => (
  <div onClick={onClick} className="glass p-4 sm:p-6 rounded-2xl sm:rounded-[32px] bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 hover:border-black/20 transition-all cursor-pointer group shadow-sm border-gray-100">
    <div className="flex items-center gap-3 sm:gap-5 min-w-0">
      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-all shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <h5 className="text-sm font-bold text-black truncate max-w-[140px] sm:max-w-none" title={title}>{title}</h5>
          {desc && <span className="text-[9px] font-bold text-gray-400 tracking-tighter hidden sm:inline">({desc})</span>}
          {statusBadge}
        </div>
        <p className="text-[11px] text-gray-500 font-medium mt-0.5">{apy}</p>
        {progress && <p className="text-[10px] text-orange-500 font-bold mt-1 tracking-tight">{progress}</p>}
      </div>
    </div>
    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 text-right pl-[52px] sm:pl-0">
      <div className="flex flex-col sm:items-end">
        <p className="text-sm font-bold text-black">{amount}</p>
        <div className="flex items-center gap-2 mt-0.5 leading-none">
          <p className="text-[11px] font-bold text-green-600">{earnings}</p>
          {creditBadge && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-violet-50 rounded-md border border-violet-100/50 shadow-sm">
              <Icons.Coins className="w-2.5 h-2.5 text-violet-600" />
              <span className="text-[9px] font-black text-violet-600">
                {creditBadge.replace('+', '').replace('pts', '').trim()}
              </span>
            </div>
          )}
        </div>
      </div>
      {action && (
        <div onClick={(e) => e.stopPropagation()}>
          {action}
        </div>
      )}
    </div>
  </div>
);

const ActivityItem: React.FC<{ title: string; time: string; amount: string; type: 'INTEREST' | 'DEPOSIT'; source?: string; onSourceClick?: () => void }> = ({ title, time, amount, type, source, onSourceClick }) => (
  <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-50 last:border-none hover:bg-gray-50/50 transition-colors gap-3">
    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${type === 'INTEREST' ? 'bg-green-50 text-green-500' : 'bg-gray-100 text-black'}`}>
        {type === 'INTEREST' ? '💰' : '⬇️'}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-xs font-bold text-black">{title}</p>
          {source && (
            <>
              <span className="text-gray-300 text-[10px] hidden sm:inline">•</span>
              <span className="text-[10px] sm:text-[11px] font-medium text-gray-400">
                <span className="sm:hidden">· </span>
                <span className="hidden sm:inline">From </span>
                <span
                  onClick={onSourceClick}
                  className="font-bold text-black hover:text-blue-500 hover:underline cursor-pointer transition-colors truncate inline-block max-w-[100px] sm:max-w-none align-bottom"
                  title={source}
                >
                  {source}
                </span>
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-[10px] text-gray-400 font-medium">{time}</p>
        </div>
      </div>
    </div>
    <span className={`text-sm font-bold shrink-0 ${type === 'INTEREST' ? 'text-green-600' : 'text-black'}`}>{amount}</span>
  </div>
);

// ── Invitation Codes: entry (topbar or card variant) ──
const InvitationCodesTopEntry: React.FC<{ variant?: 'topbar' | 'card' }> = ({ variant = 'topbar' }) => {
  const [open, setOpen] = useState(false);
  if (!api.isAuthenticated) return null;

  if (variant === 'card') {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="w-full relative overflow-hidden rounded-2xl transition-all group"
          style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #222 50%, #182018 100%)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15), 0 2px 12px rgba(0,230,118,0.1)',
            border: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          {/* Shimmer on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(0,230,118,0.07) 50%, transparent 65%)' }} />
          {/* Green glow blob */}
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(0,230,118,0.35) 0%, transparent 70%)' }} />

          <div className="relative flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(0,230,118,0.15)', border: '1px solid rgba(0,230,118,0.25)' }}>
                <svg className="w-4 h-4" style={{ color: '#00E676' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-white leading-tight">Invite Friends</p>
                <p className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Earn rewards for every referral</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full"
                style={{ color: '#00E676', background: 'rgba(0,230,118,0.15)', border: '1px solid rgba(0,230,118,0.3)' }}>
                + New Code
              </span>
              <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
                style={{ color: 'rgba(255,255,255,0.35)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </button>
        {open && <InvitationCodesModal onClose={() => setOpen(false)} />}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 bg-[#00E676]/10 hover:bg-[#00E676]/20 text-[#00C853] rounded-xl transition-all text-[11px] font-bold"
        title="Invite Friends"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
        Invite
      </button>
      {open && <InvitationCodesModal onClose={() => setOpen(false)} />}
    </>
  );
};

// ── Invitation Codes Modal ──
const InvitationCodesModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [codes, setCodes] = useState<Array<{ code: string; maxUses: number; useCount: number; isActive: boolean; createdAt: string }>>([]);
  const [generating, setGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    api.getMyInvitationCodes().then(setCodes).catch(() => {});
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await api.generateInvitationCode();
      setCodes(prev => [{ ...result, isActive: true }, ...prev]);
    } catch (err: any) {
      alert(err?.message || 'Failed to generate code');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ animation: 'fadeIn 0.2s ease' }}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-[400px] rounded-[28px] shadow-2xl border border-gray-100 overflow-hidden" style={{ animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#00E676]/10 rounded-xl flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-[#00E676]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-black text-black">Invite Friends</h2>
              <p className="text-[10px] text-gray-400 font-medium">Share codes to invite people to Loka</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-all">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Code list */}
        <div className="px-6 py-4 max-h-[340px] overflow-y-auto space-y-2">
          {codes.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <p className="text-sm text-gray-400 font-medium">No codes yet</p>
              <p className="text-xs text-gray-300 mt-1">Generate one to start inviting</p>
            </div>
          ) : (
            codes.map((c) => (
              <div key={c.code} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-black text-black font-mono tracking-widest">{c.code}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="h-1 w-16 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00E676] rounded-full" style={{ width: `${Math.min((c.useCount / c.maxUses) * 100, 100)}%` }} />
                      </div>
                      <span className="text-[9px] text-gray-400 font-medium">{c.useCount}/{c.maxUses} used</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(c.code)}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-xl transition-all ${
                    copiedCode === c.code
                      ? 'bg-[#00E676]/10 text-[#00C853] border border-[#00E676]/30'
                      : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-black'
                  }`}
                >
                  {copiedCode === c.code ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2">
          <button
            onClick={handleGenerate}
            disabled={generating || codes.length >= 10}
            className="w-full py-3.5 bg-[#00E676] text-black text-sm font-black rounded-2xl hover:bg-[#00C853] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#00E676]/20"
          >
            {generating ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                Generate New Code
              </>
            )}
          </button>
          {codes.length >= 10 && (
            <p className="text-[10px] text-gray-400 text-center mt-2">Maximum 10 codes per account</p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Portfolio;
