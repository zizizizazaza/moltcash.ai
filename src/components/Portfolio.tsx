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
  defaultTab?: 'personal' | 'enterprise';
}

const Portfolio: React.FC<PortfolioProps> = ({ isWalletConnected = false, onConnect, onSettingsClick, onLogout, defaultTab = 'personal' }) => {
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
  const displayAddress = walletAddress || '0x1a2B3c4D5e6F7890AbCdEf1234567890aBcDeF12';
  const [copied, setCopied] = useState(false);
  const [timeframe, setTimeframe] = useState('7D');
  const [profileTab, setProfileTab] = useState<'personal' | 'enterprise'>(defaultTab);

  useEffect(() => {
    setProfileTab(defaultTab);
  }, [defaultTab]);

  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  // Enterprise verification
  const [isVerified, setIsVerified] = useState(false);
  const [showVerifyWizard, setShowVerifyWizard] = useState(false);
  const [verifyStep, setVerifyStep] = useState(0); // 0=license,1=kyc,2=profile,3=stripe,4=badge
  const [verifyDone, setVerifyDone] = useState(false);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeConnecting, setStripeConnecting] = useState(false);
  const VERIFY_TOTAL = 5;
  const [userProfile, setUserProfile] = useState({
    name: '',
    bio: '',
    twitter: '',
    linkedin: '',
    otherUrl: '',
    isPublic: true
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(displayAddress);
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

  const demoMode = !isWalletConnected;

  const filteredChartData = getFilteredData();

  if (showEditProfile) {
    return (
      <EditProfilePage 
        profile={userProfile} 
        onSave={(p) => { setUserProfile(p); setShowEditProfile(false); }} 
        onClose={() => setShowEditProfile(false)} 
      />
    );
  }

  return (
    <>
      <div className="animate-fadeIn p-4 sm:p-8 md:p-10 lg:p-12 pb-28 md:pb-24 max-w-[1600px] mx-auto w-full min-h-full space-y-6">

        {/* Top bar: Title + Logout (personal only) */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[22px] font-semibold text-gray-900">{profileTab === 'enterprise' ? 'Enterprise' : 'Profile'}</h1>
          {profileTab === 'personal' && (
            <div className="flex items-center gap-2">
              <button
                onClick={onLogout}
                className="p-2 text-red-400 hover:text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                title="Log Out"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          )}
        </div>

        {profileTab === 'personal' ? (
          <>

            {/* TWO COLUMN PORTFOLIO HERO LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-0 pb-6">

              {/* --- Left Card: Profile & Overview --- */}
              <div className="md:col-span-5 bg-white border border-gray-100 rounded-xl shadow-sm p-4 sm:p-6 flex flex-col justify-between space-y-4 sm:space-y-6">

                {/* User Profile */}
                <div className="flex items-start justify-between w-full">
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Gradient Avatar Mock */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#00E676] via-blue-400 to-amber-300 opacity-90 shadow-inner flex-shrink-0" />
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base sm:text-xl font-black text-black tracking-tight truncate">
                          {userProfile.name || `${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}`}
                        </h2>
                        <button onClick={handleCopy} className="text-gray-400 hover:text-black transition-colors" title="Copy Address">
                          {copied ? (
                            <svg className="w-4 h-4 text-[#00E676]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] font-medium text-gray-400">Joined Nov {new Date().getFullYear()}</p>
                      {userProfile.bio && <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">{userProfile.bio}</p>}
                      {(userProfile.twitter || userProfile.linkedin || userProfile.otherUrl) && (
                        <div className="flex flex-col gap-0.5 mt-1">
                          {userProfile.twitter && (
                            <a href={userProfile.twitter.startsWith('http') ? userProfile.twitter : `https://${userProfile.twitter}`} target="_blank" rel="noreferrer" className="text-[11px] text-gray-500 hover:text-black hover:underline truncate max-w-[200px] flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                              {userProfile.twitter.replace(/^https?:\/\/(www\.)?(twitter\.com\/|x\.com\/)?/, '@')}
                            </a>
                          )}
                          {userProfile.linkedin && (
                            <a href={userProfile.linkedin.startsWith('http') ? userProfile.linkedin : `https://${userProfile.linkedin}`} target="_blank" rel="noreferrer" className="text-[11px] text-gray-500 hover:text-blue-600 hover:underline truncate max-w-[200px] flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                              LinkedIn
                            </a>
                          )}
                          {userProfile.otherUrl && (
                            <a href={userProfile.otherUrl.startsWith('http') ? userProfile.otherUrl : `https://${userProfile.otherUrl}`} target="_blank" rel="noreferrer" className="text-[11px] text-blue-500 hover:underline truncate max-w-[200px] flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                              {userProfile.otherUrl.replace(/^https?:\/\//, '')}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setShowEditProfile(true)} className="p-2 text-gray-400 hover:text-black bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                </div>

                {/* Stats Grid */}
                <div className="flex items-center justify-between py-2 border-y border-gray-50/80">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold tracking-widest mb-1">Net Worth</span>
                    <span className="text-base sm:text-lg font-black text-black">${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="w-px h-8 bg-gray-100" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold tracking-widest mb-1">Total Yield</span>
                    <span className="text-base sm:text-lg font-black text-[#00E676]">+$340.00</span>
                  </div>
                  <div className="w-px h-8 bg-gray-100" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold tracking-widest mb-1">Assets</span>
                    <span className="text-base sm:text-lg font-black text-black">4</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('loka-open-modal', { detail: 'deposit' }))}
                    className="w-full py-2.5 bg-black text-white hover:bg-gray-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                    Deposit
                  </button>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('loka-open-modal', { detail: 'withdraw' }))}
                    className="w-full py-2.5 bg-gray-100 text-black hover:bg-gray-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    Withdraw
                  </button>
                </div>

                {/* Invite Friends button */}
                <InvitationCodesTopEntry variant="card" />

              </div>

              {/* --- Right Card: Chart & History --- */}
              <div className="md:col-span-7 bg-white border border-gray-100 rounded-xl shadow-sm p-4 sm:p-6 flex flex-col justify-between">

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
                        title="ComputeDAO - GPU Expansion"
                        statusBadge={<span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-md text-[9px] font-black">Funded</span>}
                        apy="15.5% APY · 60d"
                        amount="$5,000.00"
                        earnings="+$387.50"
                        icon={<div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center font-black text-white text-[10px]">C</div>}
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('loka-nav-market'));
                          setTimeout(() => window.dispatchEvent(new CustomEvent('loka-open-asset', { detail: 'ComputeDAO' })), 100);
                        }}
                      />
                    </div>
                  </section>
                ) : (
                  <section className="space-y-4 animate-fadeIn">
                    <div className="rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100">
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

            {/* Empty state: not verified */}
            {!isVerified && (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                  <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-[17px] font-bold text-gray-900 mb-2">Verify Your Company</h2>
                <p className="text-[13px] text-gray-400 max-w-[280px] leading-relaxed mb-8">
                  Complete company verification to access fundraising on Loka. The process takes about 5 minutes.
                </p>

                {/* Steps preview — 3 big phases */}
                <div className="w-full max-w-sm space-y-2 mb-8 text-left">
                  {[
                    {
                      num: '1',
                      label: 'Company Verification',
                      desc: 'Business license upload · KYC/UBO identity check',
                    },
                    {
                      num: '2',
                      label: 'Company Profile',
                      desc: 'Description · Founded date & location · Tags · Website',
                    },
                    {
                      num: '3',
                      label: 'Connect Revenue',
                      desc: 'Authorize Stripe to share live MRR & revenue data',
                    },
                  ].map((s, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm">
                        <span className="text-[11px] font-black text-gray-500">{s.num}</span>
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-gray-800">{s.label}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => { setVerifyStep(0); setVerifyDone(false); setStripeConnected(false); setShowVerifyWizard(true); }}
                  className="px-6 py-3 bg-gray-900 text-white text-[13px] font-semibold rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-sm"
                >
                  Start Verification
                </button>
              </div>
            )}

            {/* Verified: show company info + fundraising */}
            {isVerified && <>

            {/* Company Info Card - Simplified */}
            <section className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 sm:p-6">
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
                  <span className="text-[10px] font-bold text-violet-600">Verified Issuer</span>
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

            {/* Fundraising Status — company as main entity */}
            <section className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-5 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-[15px] font-semibold text-gray-900">Fundraising</h2>
                    <p className="text-[10px] text-gray-400 font-medium">Company fundraising status</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-full border border-green-200/50">● Active</span>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 font-medium mb-1">Target</p>
                  <p className="text-[15px] font-bold text-gray-900">$500,000</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 font-medium mb-1">Raised</p>
                  <p className="text-[15px] font-bold text-green-600">$375,000</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 font-medium mb-1">APY / Term</p>
                  <p className="text-[15px] font-bold text-gray-900">15.5% <span className="text-[11px] font-medium text-gray-400">60d</span></p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[10px] text-gray-400 font-medium">Progress</span>
                  <span className="text-[10px] font-bold text-gray-900">75% funded</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '75%' }} />
                </div>
              </div>

              <p className="text-[11px] text-gray-400">Fundraising closes in <span className="font-semibold text-gray-700">18 days</span></p>
            </section>

            {/* Platform Deductions (auto-deduction records) */}
            <section className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-gray-900">Repayment Records</h2>
                  <p className="text-[10px] text-gray-400 font-medium">Auto-deducted from revenue for investor repayments</p>
                </div>
              </div>

              {Object.keys(enterpriseDeductions).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400 font-medium">No repayment records yet</p>
                  <p className="text-xs text-gray-300 mt-1">Records appear once your fundraising begins repayment cycles</p>
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
                        {/* Header */}
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

                        {overduePeriods.length > 0 && (
                          <div className="px-4 py-2.5 bg-red-50 border-t border-red-100 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            <p className="text-[10px] font-bold text-red-600">
                              {overduePeriods.length} period{overduePeriods.length > 1 ? 's' : ''} pending — revenue shortfall detected
                            </p>
                          </div>
                        )}

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
            </>}

          </div>
        )}
      </div>

      {/* ── Company Verification Wizard ── */}
      {showVerifyWizard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowVerifyWizard(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slideUp overflow-hidden">

            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-gray-900">Company Verification</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {verifyDone ? 'All done — your profile is ready' : `Step ${verifyStep + 1} of ${VERIFY_TOTAL}`}
                </p>
              </div>
              <button onClick={() => setShowVerifyWizard(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Progress bar */}
            {!verifyDone && (
              <div className="h-1 bg-gray-100">
                <div
                  className="h-full bg-gray-900 transition-all duration-500"
                  style={{ width: `${((verifyStep + 1) / VERIFY_TOTAL) * 100}%` }}
                />
              </div>
            )}

            <div className="p-6">
              {verifyDone ? (
                /* ── All done ── */
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h4 className="text-[16px] font-bold text-gray-900 mb-2">Verified!</h4>
                  <p className="text-[12px] text-gray-400 max-w-[220px] mx-auto leading-relaxed mb-6">
                    Your company is now a Verified Issuer. You can start fundraising on Loka.
                  </p>
                  <button
                    onClick={() => { setIsVerified(true); setShowVerifyWizard(false); }}
                    className="w-full py-3 bg-gray-900 text-white text-[13px] font-semibold rounded-xl hover:bg-gray-800 transition-all active:scale-95"
                  >
                    Go to Enterprise Dashboard
                  </button>
                </div>
              ) : verifyStep === 0 ? (
                /* ── Step 1: Business License ── */
                <div className="space-y-4">
                  <div className="text-center mb-2">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <h4 className="text-[14px] font-bold text-gray-900">Upload Business License</h4>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">Company registration certificate and registered address proof</p>
                  </div>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                    <svg className="w-6 h-6 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <p className="text-[12px] font-medium text-gray-400">Click to upload or drag & drop</p>
                    <p className="text-[10px] text-gray-300 mt-1">PDF, JPG, PNG up to 10MB</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Company Name</label>
                      <input className="w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors" placeholder="Loka Technologies Pte Ltd" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Country / Region</label>
                        <input className="w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors" placeholder="Singapore" />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Registration No.</label>
                        <input className="w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors" placeholder="202312345A" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : verifyStep === 1 ? (
                /* ── Step 2: KYC / UBO ── */
                <div className="space-y-4">
                  <div className="text-center mb-2">
                    <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" /></svg>
                    </div>
                    <h4 className="text-[14px] font-bold text-gray-900">KYC / UBO Verification</h4>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">Declare beneficial owners with ≥ 25% stake and upload identity documents</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Full Legal Name</label>
                      <input className="w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors" placeholder="Your legal name" />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Nationality</label>
                      <input className="w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors" placeholder="e.g. Singaporean" />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 mb-1 block">ID Document</label>
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-gray-400 transition-colors cursor-pointer">
                        <p className="text-[11px] font-medium text-gray-400">Upload Passport or National ID</p>
                        <p className="text-[10px] text-gray-300 mt-0.5">Front + back, PDF / JPG / PNG</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <p className="text-[10px] text-amber-700 leading-relaxed">All shareholders with ≥ 25% ownership must complete individual KYC. Additional owners can be added after submission.</p>
                    </div>
                  </div>
                </div>
              ) : verifyStep === 2 ? (
                /* ── Step 3: Company Profile ── */
                <div className="space-y-4">
                  <div className="text-center mb-2">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                    <h4 className="text-[14px] font-bold text-gray-900">Company Profile</h4>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">Help investors understand your company</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Description</label>
                      <textarea rows={3} className="w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors resize-none" placeholder="What does your company do? What problem does it solve?" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Founded Year</label>
                        <input type="number" min="1900" max="2025" className="w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors" placeholder="2021" />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-gray-500 mb-1 block">City / Location</label>
                        <input className="w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors" placeholder="San Francisco" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Website</label>
                      <input type="url" className="w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors" placeholder="https://yourcompany.com" />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Category Tags</label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {['SaaS', 'AI', 'Health', 'Marketing', 'Content', 'Education', 'E-commerce', 'Fintech'].map(tag => (
                          <button key={tag} className="px-2.5 py-1 text-[10px] font-semibold border border-gray-200 rounded-full text-gray-500 hover:border-gray-900 hover:text-gray-900 hover:bg-gray-50 transition-all">{tag}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : verifyStep === 3 ? (
                /* ── Step 4: Connect Stripe ── */
                <div className="space-y-4">
                  <div className="text-center mb-2">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <h4 className="text-[14px] font-bold text-gray-900">Connect Stripe</h4>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">Authorize read-only access to verify your revenue. Investors will see live MRR and growth data.</p>
                  </div>

                  {!stripeConnected ? (
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setStripeConnecting(true);
                          // Stripe Connect OAuth placeholder
                          // In production: window.location.href = `/api/stripe/connect/oauth?state=...`
                          setTimeout(() => { setStripeConnecting(false); setStripeConnected(true); }, 2000);
                        }}
                        disabled={stripeConnecting}
                        className="w-full py-3 flex items-center justify-center gap-2.5 bg-[#635BFF] text-white text-[13px] font-semibold rounded-xl hover:bg-[#4F46E5] transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {stripeConnecting ? (
                          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Connecting…</>
                        ) : (
                          <><svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.583L20 4.114A18.22 18.22 0 0 0 12.581 2c-3.099 0-5.47 1.498-6.27 3.895-.254.754-.36 1.537-.293 2.344.065.808.318 1.565.742 2.217.854 1.318 2.296 2.089 4.044 2.695 1.927.658 3.095 1.282 3.095 2.303 0 .914-.817 1.481-2.179 1.481-1.876 0-4.153-.742-5.943-1.836l-1.756 3.404C6.05 20.148 9.02 21.5 12.311 21.5c3.408 0 6.056-1.548 6.721-4.078.181-.688.24-1.393.175-2.097-.065-.706-.283-1.384-.65-1.994-.707-1.17-2.014-1.9-4.581-2.181z"/></svg>Connect with Stripe</>
                        )}
                      </button>
                      <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <svg className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        <p className="text-[10px] text-gray-500 leading-relaxed">OAuth read-only access. We never store your Stripe secret key. You can revoke access at any time from your Stripe Dashboard.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-100 mb-3">
                        <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        <p className="text-[11px] font-semibold text-green-700">Stripe account connected successfully</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Revenue Preview</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-gray-500">MRR</span>
                          <span className="text-[12px] font-bold text-gray-900">$28,400</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-gray-500">Last 30d Revenue</span>
                          <span className="text-[12px] font-bold text-gray-900">$31,200</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-gray-500">Active Subscriptions</span>
                          <span className="text-[12px] font-bold text-gray-900">1,247</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-gray-500">MoM Growth</span>
                          <span className="text-[12px] font-bold text-green-600">+12.4%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ── Step 5: Receive Verified Badge ── */
                <div className="space-y-4">
                  <div className="text-center mb-2">
                    <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                    </div>
                    <h4 className="text-[14px] font-bold text-gray-900">Receive Verified Badge</h4>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">All checks passed. Activate your Verified Issuer badge to start fundraising on Loka.</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">KYC Status</span>
                      <span className="text-[11px] font-semibold text-green-600">✓ Approved</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">Business License</span>
                      <span className="text-[11px] font-semibold text-green-600">✓ Verified</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">Company Profile</span>
                      <span className="text-[11px] font-semibold text-green-600">✓ Complete</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">Stripe Revenue</span>
                      <span className="text-[11px] font-semibold text-green-600">{stripeConnected ? '✓ Connected' : '— Skipped'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">Badge Type</span>
                      <span className="text-[11px] font-semibold text-gray-900">Verified Issuer</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-[10px] text-blue-700">Your Verified badge will be displayed on your company profile and visible to all investors.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {!verifyDone && (
              <div className="px-6 pb-6 flex gap-3">
                {verifyStep > 0 && (
                  <button
                    onClick={() => setVerifyStep(s => s - 1)}
                    className="flex-1 py-3 text-[13px] font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={() => {
                    if (verifyStep === 3 && !stripeConnected) {
                      // Allow skipping Stripe
                      setVerifyStep(s => s + 1);
                    } else if (verifyStep < VERIFY_TOTAL - 1) {
                      setVerifyStep(s => s + 1);
                    } else {
                      setVerifyDone(true);
                    }
                  }}
                  className="flex-1 py-3 bg-gray-900 text-white text-[13px] font-semibold rounded-xl hover:bg-gray-800 transition-all active:scale-95"
                >
                  {verifyStep === VERIFY_TOTAL - 1 ? 'Activate Badge' : verifyStep === 3 && !stripeConnected ? 'Skip for now' : 'Continue'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
}> = ({ title, desc, apy, amount, earnings, icon, progress, action, onClick, statusBadge }) => (
  <div onClick={onClick} className="p-4 sm:p-6 rounded-xl bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 hover:border-gray-200 transition-all cursor-pointer group shadow-sm border border-gray-100">
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
    api.getMyInvitationCodes().then(setCodes).catch(() => { });
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
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-xl transition-all ${copiedCode === c.code
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
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
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

// ── Edit Profile Page ──
const EditProfilePage: React.FC<{
  profile: { name: string; bio: string; twitter: string; linkedin: string; otherUrl: string; isPublic: boolean };
  onSave: (p: any) => void;
  onClose: () => void;
}> = ({ profile, onSave, onClose }) => {
  const [data, setData] = useState(profile);

  return (
    <div className="animate-fadeIn p-4 sm:p-8 md:p-10 lg:p-12 pb-28 md:pb-24 max-w-[800px] mx-auto w-full min-h-full space-y-6 pt-10">
      <button onClick={onClose} className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors focus:outline-none group mb-2">
        <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        <span className="text-sm font-bold">Back to Portfolio</span>
      </button>

      <div className="bg-white w-full rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <h2 className="text-2xl font-black text-black">Edit Profile</h2>
          <p className="text-sm text-gray-400 mt-1 font-medium">Update your personal information and links</p>
        </div>

        {/* Form Body */}
        <div className="px-8 py-8 space-y-6">
          {/* Avatar Edit Hint */}
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#00E676] via-blue-400 to-amber-300 opacity-90 shadow-inner flex-shrink-0 relative group cursor-pointer">
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-black">Profile Avatar</span>
              <span className="text-xs text-gray-400 font-medium">Click to upload new image</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Name</label>
            <input 
              type="text" 
              value={data.name} 
              onChange={e => setData({ ...data, name: e.target.value })}
              placeholder="Your display name"
              className="w-full py-3.5 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black placeholder-gray-400 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Bio <span className="text-[9px] text-gray-400 lowercase">(Optional)</span></label>
            <textarea 
              value={data.bio} 
              onChange={e => setData({ ...data, bio: e.target.value })}
              placeholder="A short description about yourself..."
              rows={4}
              className="w-full py-3.5 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black placeholder-gray-400 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all font-medium resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Twitter / X URL <span className="text-[9px] text-gray-400 lowercase">(Optional)</span></label>
              <input 
                type="text" 
                value={data.twitter} 
                onChange={e => setData({ ...data, twitter: e.target.value })}
                placeholder="https://x.com/username"
                className="w-full py-3.5 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black placeholder-gray-400 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">LinkedIn URL <span className="text-[9px] text-gray-400 lowercase">(Optional)</span></label>
              <input 
                type="text" 
                value={data.linkedin} 
                onChange={e => setData({ ...data, linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/username"
                className="w-full py-3.5 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black placeholder-gray-400 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all font-medium"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Other Website <span className="text-[9px] text-gray-400 lowercase">(Optional)</span></label>
            <input 
              type="text" 
              value={data.otherUrl} 
              onChange={e => setData({ ...data, otherUrl: e.target.value })}
              placeholder="https://your-website.com"
              className="w-full py-3.5 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black placeholder-gray-400 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all font-medium"
            />
          </div>

          <div className="pt-4">
            <label className="flex items-center justify-between p-5 border border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-black">Public Profile</span>
                <span className="text-xs text-gray-500 font-medium mt-0.5">Display your profile on the Discover page</span>
              </div>
              <div className="relative inline-block w-12 h-7 select-none shrink-0" onClick={() => setData({ ...data, isPublic: !data.isPublic })}>
                <div className={`block w-12 h-7 rounded-full transition-colors ${data.isPublic ? 'bg-[#00E676]' : 'bg-gray-200'}`} />
                <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${data.isPublic ? 'translate-x-5' : 'translate-x-0'} shadow-sm`} />
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 pt-4">
          <button
            onClick={() => onSave(data)}
            className="w-full sm:w-auto px-10 py-3.5 bg-black text-white text-sm font-bold rounded-2xl hover:bg-gray-800 transition-all active:scale-[0.98] shadow-lg"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
