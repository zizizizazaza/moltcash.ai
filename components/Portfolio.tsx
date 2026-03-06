
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, CartesianGrid, YAxis, XAxis } from 'recharts';
import { Icons } from '../constants';

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
  const [balance] = useState(12450.88);
  const [yieldAccumulated, setYieldAccumulated] = useState(0.00012);
  const [isHidden, setIsHidden] = useState(false);
  const [greeting, setGreeting] = useState('Good Morning');

  const walletAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'holdings' | 'activity'>('holdings');
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
      <div className="max-w-7xl mx-auto animate-fadeIn pb-24 px-4 space-y-6">

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
              <div className="md:col-span-5 bg-white border border-gray-100 rounded-3xl shadow-sm p-6 flex flex-col justify-between space-y-6">

                {/* User Profile */}
                <div className="flex items-start gap-4">
                  {/* Gradient Avatar Mock */}
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#00E676] via-blue-400 to-amber-300 opacity-90 shadow-inner flex-shrink-0" />
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-black tracking-tight">{walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}</h2>
                      <button onClick={handleCopy} className="text-gray-400 hover:text-black transition-colors" title="Copy Address">
                        {copied ? (
                          <svg className="w-4 h-4 text-[#00E676]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] font-medium text-gray-400">Joined Nov {new Date().getFullYear()}</p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="flex justify-between items-center py-2 border-y border-gray-50/80">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold  tracking-widest mb-1">Net Worth</span>
                    <span className="text-lg font-black text-black">${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="w-px h-8 bg-gray-100"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold  tracking-widest mb-1">Total Yield</span>
                    <span className="text-lg font-black text-[#00E676]">+$340.00</span>
                  </div>
                  <div className="w-px h-8 bg-gray-100"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold  tracking-widest mb-1">Assets</span>
                    <span className="text-lg font-black text-black">4</span>
                  </div>
                  <div className="w-px h-8 bg-gray-100 mx-1"></div>
                  <div
                    className="flex flex-col justify-center cursor-pointer group px-4 py-2 bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border border-violet-100/60 hover:border-violet-200 hover:shadow-md transition-all shadow-sm"
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

              </div>

              {/* --- Right Card: Chart & History --- */}
              <div className="md:col-span-7 bg-white border border-gray-100 rounded-3xl shadow-sm p-6 flex flex-col justify-between">

                {/* Chart Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00E676] animate-pulse"></div>
                      <span className="text-[10px] text-gray-500 font-bold tracking-widest ">Profit / Loss</span>
                    </div>
                    <h2 className="text-3xl font-black text-black">+${(340.00).toFixed(2)}</h2>
                    <p className="text-[11px] font-bold text-gray-400 mt-1  tracking-widest">{timeframe === 'ALL' ? 'All Time' : `Past ${timeframe}`}</p>
                  </div>

                  {/* Toggles */}
                  <div className="flex bg-gray-50 p-1 rounded-full border border-gray-100 gap-0.5">
                    {['7D', '30D', '3M', 'ALL'].map(t => (
                      <button
                        key={t}
                        onClick={() => setTimeframe(t)}
                        className={`px-3.5 py-1.5 text-[10px] font-black rounded-full transition-all ${timeframe === t ? 'bg-white text-black shadow-sm border border-gray-200/50' : 'text-gray-400 hover:text-black'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chart Container */}
                <div className="h-[150px] w-full mt-6 -mx-1">
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
                    <div className="glass rounded-[32px] overflow-hidden bg-white shadow-sm border border-gray-100">
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
            <section className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6">
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
                <div className="flex items-center justify-between py-3">
                  <span className="text-[11px] text-gray-400 font-medium">Registered Address</span>
                  <span className="text-[13px] font-bold text-black">1 Raffles Place, #20-01, Singapore 048616</span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 flex-wrap">
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
            <section className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
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
                    window.dispatchEvent(new CustomEvent('loka-nav-swap'));
                    setTimeout(() => window.dispatchEvent(new CustomEvent('loka-open-asset', { detail: 'ComputeDAO' })), 100);
                  }}
                  className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center font-black text-white text-sm">C</div>
                      <div>
                        <h3 className="text-sm font-bold text-black group-hover:text-violet-600 transition-colors">ComputeDAO - GPU Expansion</h3>
                        <p className="text-[10px] text-gray-400 font-medium">Target: $500,000 · Duration: 60 days · 15.5% APY</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold text-black">$375,000</p>
                        <p className="text-[10px] text-gray-400">75% funded</p>
                      </div>
                      <span className="px-2.5 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-full border border-green-200/50">● Fundraising</span>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                </div>

                {/* Project 2 - Under Review */}
                <div
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('loka-nav-swap'));
                    setTimeout(() => window.dispatchEvent(new CustomEvent('loka-open-asset', { detail: 'Shopify' })), 100);
                  }}
                  className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center font-black text-white text-sm">S</div>
                      <div>
                        <h3 className="text-sm font-bold text-black group-hover:text-violet-600 transition-colors">Shopify Merchant Cluster X</h3>
                        <p className="text-[10px] text-gray-400 font-medium">Target: $200,000 · Duration: 45 days · 12% APY</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold text-black">—</p>
                        <p className="text-[10px] text-gray-400">Pending</p>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-full border border-amber-200/50">● Under Review</span>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                </div>

                {/* Project 3 - Completed */}
                <div
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('loka-nav-swap'));
                    setTimeout(() => window.dispatchEvent(new CustomEvent('loka-open-asset', { detail: 'Vercel' })), 100);
                  }}
                  className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center font-black text-white text-sm">V</div>
                      <div>
                        <h3 className="text-sm font-bold text-black group-hover:text-violet-600 transition-colors">Vercel SaaS Pool</h3>
                        <p className="text-[10px] text-gray-400 font-medium">Target: $150,000 · Duration: 30 days · 10% APY</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold text-black">$150,000</p>
                        <p className="text-[10px] text-green-500">Fully repaid</p>
                      </div>
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-[10px] font-black rounded-full border border-gray-200/50">● Completed</span>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                </div>
              </div>
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
  <div onClick={onClick} className="glass p-6 rounded-[32px] bg-white flex items-center justify-between hover:border-black/20 transition-all cursor-pointer group shadow-sm border-gray-100">
    <div className="flex items-center gap-5">
      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-all">
        {icon}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h5 className="text-sm font-bold text-black">{title}</h5>
          {desc && <span className="text-[9px] font-bold text-gray-400 tracking-tighter">({desc})</span>}
          {statusBadge}
        </div>
        <p className="text-[11px] text-gray-500 font-medium mt-0.5">{apy}</p>
        {progress && <p className="text-[10px] text-orange-500 font-bold mt-1 tracking-tight">{progress}</p>}
      </div>
    </div>
    <div className="flex items-center gap-6 text-right">
      <div className="flex flex-col items-end">
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
  <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50 last:border-none hover:bg-gray-50/50 transition-colors">
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type === 'INTEREST' ? 'bg-green-50 text-green-500' : 'bg-gray-100 text-black'}`}>
        {type === 'INTEREST' ? '💰' : '⬇️'}
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-bold text-black">{title}</p>
          {source && (
            <>
              <span className="text-gray-300 text-[10px]">•</span>
              <span className="text-[11px] font-medium text-gray-400">
                From{' '}
                <span
                  onClick={onSourceClick}
                  className="font-bold text-black hover:text-blue-500 hover:underline cursor-pointer transition-colors"
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
    <span className={`text-sm font-bold ${type === 'INTEREST' ? 'text-green-600' : 'text-black'}`}>{amount}</span>
  </div>
);

export default Portfolio;
