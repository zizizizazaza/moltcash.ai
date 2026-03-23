import React, { useState, useEffect, useRef } from 'react';
import { usePrivy, useLogout } from '@privy-io/react-auth';
import { Page } from './types';
import Market from './components/Market';
import ApiLanding from './components/ApiLanding';
import SuperAgentChat from './components/SuperAgentChat';
import AuthModal from './components/AuthModal';
import OAuthCallbackHandler from './components/OAuthCallbackHandler';

/* ────────────────────────────────────────────────────────────
   Icons — richer, hand-crafted 18×18 with fills & details
   ──────────────────────────────────────────────────────────── */
const sv = "w-[18px] h-[18px]";
const I = {
  Panel: () => <svg className={sv} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M9 3v18" /></svg>,
  Plus: () => <svg className={sv} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>,
  Search: () => <svg className={sv} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M21 21l-4.35-4.35" /></svg>,
  /* SuperAgent — layered sparkle star */
  Sparkles: () => <svg className={sv} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="currentColor" fillOpacity={0.12} stroke="currentColor" strokeWidth={1.8} /><path d="M20 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" fill="currentColor" fillOpacity={0.2} stroke="currentColor" strokeWidth={1.4} /></svg>,
  /* Discover — compass with needle */
  Compass: () => <svg className={sv} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="9" /><polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" fill="currentColor" fillOpacity={0.15} stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" /></svg>,
  /* Chat — clean speech bubble */
  Chat: () => <svg className={sv} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" fill="currentColor" fillOpacity={0.06} /></svg>,
  /* Market — rising trend line */
  Market: () => <svg className={sv} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3" strokeWidth={1.6} fill="currentColor" fillOpacity={0.04} /><path d="M7 17l4-5 3 2.5L20 8" strokeWidth={2} /><circle cx="20" cy="8" r="1.5" fill="currentColor" stroke="none" /></svg>,
  /* API — terminal prompt */
  Code: () => <svg className={sv} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="18" rx="3" stroke="currentColor" strokeWidth={1.6} fill="currentColor" fillOpacity={0.05} /><path d="M6 10l3 3-3 3" stroke="currentColor" strokeWidth={2} /><path d="M13 16h5" stroke="currentColor" strokeWidth={2} /></svg>,
  Send: () => <svg className={sv} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>,
  Dots: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>,
  /* Menu icons */
  UserIcon: () => <svg className={sv} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0112 0v1" /></svg>,
  Settings: () => <svg className={sv} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1.08z" /></svg>,
  Moon: () => <svg className={sv} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>,
  Sun: () => <svg className={sv} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>,
  LogOut: () => <svg className={sv} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>,
};

/* Hover micro-animations + tooltip for collapsed sidebar */
const AnimStyles = () => (
  <style>{`
    .nav-sparkle:hover .nav-icon-wrap { animation: sparkle-pulse 0.5s ease; }
    .nav-compass:hover .nav-icon-wrap { animation: compass-wiggle 0.5s ease; }
    .nav-chat:hover .nav-icon-wrap { animation: chat-bounce 0.35s ease; }
    .nav-market:hover .nav-icon-wrap { animation: market-bounce 0.4s ease; }
    .nav-code:hover .nav-icon-wrap { animation: code-type 0.4s ease; }
    @keyframes sparkle-pulse { 0%,100%{transform:rotate(0)} 30%{transform:rotate(12deg)} 60%{transform:rotate(-6deg)} }
    @keyframes compass-wiggle { 0%,100%{transform:rotate(0)} 25%{transform:rotate(15deg)} 75%{transform:rotate(-10deg)} }
    @keyframes chat-bounce { 0%,100%{transform:translateY(0)} 40%{transform:translateY(-2px)} }
    @keyframes market-bounce { 0%,100%{transform:translateY(0)} 30%{transform:translateY(-3px)} 60%{transform:translateY(-1px)} }
    @keyframes code-type { 0%,100%{transform:translateX(0)} 50%{transform:translateX(2px)} }
    /* Tooltip for collapsed rail */
    .rail-btn { position: relative; }
    .rail-btn .rail-tip {
      position: absolute; left: calc(100% + 6px); top: 50%; transform: translateY(-50%);
      background: #1a1a1a; color: #fff; font-size: 12px; font-weight: 500;
      padding: 4px 10px; border-radius: 6px; white-space: nowrap;
      opacity: 0; pointer-events: none; transition: opacity 0.15s;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 50;
    }
    .rail-btn:hover .rail-tip { opacity: 1; }
    @keyframes menu-pop { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
  `}</style>
);

/* ────────────────────────────────────────────────────────────
   Mock data
   ──────────────────────────────────────────────────────────── */
/* Action icon components */
const ActionIcons = {
  Invest: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>,
  Risk: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  Trade: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
  Research: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>,
  Sentiment: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>,
  Portfolio: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" /></svg>,
  Trending: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>,
};

const QUICK_ACTIONS = [
  { id: 'invest', icon: ActionIcons.Invest, label: 'Analyze Investment' },
  { id: 'research', icon: ActionIcons.Research, label: 'Deep Research' },
  { id: 'trade', icon: ActionIcons.Trade, label: 'Execute Trade' },
  { id: 'risk', icon: ActionIcons.Risk, label: 'Assess Risk' },
  { id: 'sentiment', icon: ActionIcons.Sentiment, label: 'Check Sentiment' },
  { id: 'portfolio', icon: ActionIcons.Portfolio, label: 'Review Portfolio' },
];

const TRENDING_PROJECTS = [
  { id: 1, name: 'Copy Trading AI', desc: 'AI-powered copy trading protocol', mrr: '$128,500', mom: '+49%', momUp: true, pct: 78 },
  { id: 2, name: 'MEV Searcher Agent', desc: 'Automated MEV extraction', mrr: '$89,200', mom: '+22%', momUp: true, pct: 40 },
  { id: 3, name: 'DeFi Yield Optimizer', desc: 'Cross-chain yield aggregation', mrr: '$67,800', mom: '+15%', momUp: true, pct: 100 },
  { id: 4, name: 'On-chain Credit Score', desc: 'AI credit scoring on-chain', mrr: '$45,300', mom: '+8%', momUp: true, pct: 7 },
  { id: 5, name: 'AI Agent Marketplace', desc: 'Decentralized agent marketplace', mrr: '$38,600', mom: '-4%', momUp: false, pct: 21 },
  { id: 6, name: 'Climapp.io Utility', desc: 'Climate data tokenization', mrr: '$12,400', mom: '+31%', momUp: true, pct: 2 },
];

const RECENTS = [
  'ETH Risk Assessment',
  'BTC Q2 Outlook',
  'Portfolio Rebalance',
  'SOL Sentiment Check',
];

const MOCK_MESSAGES = [
  { id: 'c1', name: 'Alex Chen', avatar: 'AC', role: 'human', lastMsg: 'Check out this DeFi project', time: '10m', unread: 2, isGroup: false, color: 'bg-blue-500' },
  { id: 'c2', name: "Sarah's Avatar", avatar: 'SK', role: 'avatar', lastMsg: 'I analyzed the proposal', time: '1h', unread: 0, isGroup: false, color: 'bg-violet-500' },
  { id: 'c3', name: 'Mike', avatar: 'MR', role: 'human', lastMsg: 'Sounds good!', time: '3h', unread: 0, isGroup: false, color: 'bg-emerald-500' },
  // Groups from Discover
  { id: 'g1', name: 'DeFi Alpha Hunters', avatar: 'D', role: 'group', lastMsg: 'John: The yield is impressive…', time: '25m', unread: 5, isGroup: true, color: 'bg-blue-100 text-blue-600' },
  { id: 'g2', name: 'RWA Investment Club', avatar: 'R', role: 'group', lastMsg: 'New project just listed 🔥', time: '2h', unread: 0, isGroup: true, color: 'bg-emerald-100 text-emerald-600' },
  { id: 'g3', name: 'AI Trading Signals', avatar: 'A', role: 'group', lastMsg: 'Mike: Bullish pattern forming', time: '3h', unread: 12, isGroup: true, color: 'bg-violet-100 text-violet-600' },
  { id: 'g4', name: 'Credit Score Maximizers', avatar: 'C', role: 'group', lastMsg: 'Lisa: New agent dropped', time: '5h', unread: 0, isGroup: true, color: 'bg-amber-100 text-amber-600' },
  { id: 'g5', name: 'Macro Research Daily', avatar: 'M', role: 'group', lastMsg: 'Weekly report is out', time: '1d', unread: 3, isGroup: true, color: 'bg-rose-100 text-rose-600' },
  { id: 'g6', name: 'Stablecoin Yield Farming', avatar: 'S', role: 'group', lastMsg: 'New pool launched', time: '1d', unread: 0, isGroup: true, color: 'bg-cyan-100 text-cyan-600' },
  { id: 'g7', name: 'On-chain Data Analysis', avatar: 'O', role: 'group', lastMsg: 'Check the on-chain metrics', time: '2d', unread: 0, isGroup: true, color: 'bg-indigo-100 text-indigo-600' },
  { id: 'g8', name: 'Portfolio Construction', avatar: 'P', role: 'group', lastMsg: 'Rebalance thread started', time: '2d', unread: 0, isGroup: true, color: 'bg-pink-100 text-pink-600' },
];

/* ════════════════════════════════════════════════════════════
   SIDEBAR
   ════════════════════════════════════════════════════════════ */
const navItems = [
  { key: Page.SUPER_AGENT, icon: I.Sparkles, label: 'SuperAgent', anim: 'nav-sparkle' },
  { key: Page.DISCOVER, icon: I.Compass, label: 'Playground', anim: 'nav-compass' },
  { key: Page.CHATS, icon: I.Chat, label: 'Chats', anim: 'nav-chat' },
  { key: Page.INVEST, icon: I.Market, label: 'Invest', anim: 'nav-market' },
  { key: Page.API, icon: I.Code, label: 'API', anim: 'nav-code' },
];

/* ── User menu popup ── */
const UserMenu: React.FC<{
  open: boolean; onClose: () => void; position?: 'above' | 'right';
  isDark: boolean; onToggleDark: () => void; onLogout?: () => void;
  userName?: string;
  userInitial?: string;
}> = ({ open, onClose, position = 'above', isDark, onToggleDark, onLogout, userName, userInitial }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, onClose]);
  if (!open) return null;

  const posClass = position === 'right'
    ? 'left-full bottom-0 ml-2'
    : 'bottom-full left-0 mb-2';

  const widthClass = position === 'right' ? 'w-56' : 'w-full';

  const items: (null | { icon: React.FC; label: string; action: () => void; danger?: boolean })[] = [
    { icon: I.UserIcon, label: 'Profile', action: () => { } },
    { icon: I.Settings, label: 'Settings', action: () => { } },
    { icon: isDark ? I.Sun : I.Moon, label: isDark ? 'Light Mode' : 'Dark Mode', action: onToggleDark },
    null,
    { icon: I.LogOut, label: 'Log out', action: () => { if (onLogout) onLogout(); onClose(); }, danger: true },
  ];

  /* Light vs dark menu styling */
  const bg = isDark ? 'bg-[#1e1e1e] border-white/10' : 'bg-white border-gray-200 shadow-lg';
  const headerBorder = isDark ? 'border-white/10' : 'border-gray-100';
  const nameColor = isDark ? 'text-white' : 'text-gray-900';
  const subColor = isDark ? 'text-gray-400' : 'text-gray-500';
  const itemColor = isDark ? 'text-gray-300 hover:bg-white/8 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900';
  const dangerColor = isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50';
  const dividerColor = isDark ? 'bg-white/10' : 'bg-gray-100';

  return (
    <div ref={ref} className={`absolute ${posClass} z-50 ${widthClass} ${bg} rounded-xl border py-1.5`}
      style={{ animation: 'menu-pop 0.15s ease-out' }}>
      {/* User header */}
      <div className={`px-3.5 py-2.5 border-b ${headerBorder}`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-[11px] font-bold text-white`}>{userInitial || 'U'}</div>
          <div>
            <p className={`text-[13px] font-semibold ${nameColor}`}>{userName || 'User'}</p>
            <p className={`text-[11px] ${subColor}`}>@user</p>
          </div>
        </div>
      </div>
      {/* Items */}
      <div className="py-1">
        {items.map((item, i) => {
          if (!item) return <div key={i} className={`my-1 h-px ${dividerColor}`} />;
          const Ic = item.icon;
          return (
            <button key={i} onClick={() => { item.action(); if (!item.label.includes('Mode')) onClose(); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2 text-[13px] transition-colors ${item.danger ? dangerColor : itemColor
                }`}>
              <Ic />{item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const Sidebar: React.FC<{
  expanded: boolean; onToggle: () => void; page: Page; go: (p: Page) => void;
  isDark: boolean; onToggleDark: () => void;
  isLoggedIn: boolean; onLogin: () => void; onLogout: () => void;
  userName?: string; userInitial?: string;
}> = ({ expanded, onToggle, page, go, isDark, onToggleDark, isLoggedIn, onLogin, onLogout, userName, userInitial }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  /* theme classes */
  const bg = isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-100';
  const textPrimary = isDark ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-500';
  const textMuted = isDark ? 'text-gray-500' : 'text-gray-400';
  const hoverBg = isDark ? 'hover:bg-white/8' : 'hover:bg-gray-100';
  const activeBg = isDark ? 'bg-white/10 text-white font-semibold' : 'bg-gray-100 text-gray-900 font-semibold';
  const divider = isDark ? 'bg-white/8' : 'bg-gray-100';
  const avatarBg = isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-500';

  /* ── Collapsed: 56px icon rail with hover tooltips ── */
  if (!expanded) return (
    <nav className={`hidden md:flex w-14 border-r flex-col items-center pt-3 pb-4 shrink-0 ${bg}`}>
      <button onClick={onToggle} className={`rail-btn w-9 h-9 rounded-lg flex items-center justify-center ${textSecondary} ${hoverBg} transition-all mb-1`}>
        <I.Panel /><span className="rail-tip">展开</span>
      </button>
      <button onClick={() => go(Page.SUPER_AGENT)} className={`rail-btn w-9 h-9 rounded-lg flex items-center justify-center ${textSecondary} ${hoverBg} transition-all mb-1`}>
        <I.Plus /><span className="rail-tip">New chat</span>
      </button>
      <button className={`rail-btn w-9 h-9 rounded-lg flex items-center justify-center ${textSecondary} ${hoverBg} transition-all mb-3`}>
        <I.Search /><span className="rail-tip">Search</span>
      </button>
      <div className="flex flex-col gap-0.5 flex-1 w-full px-2">
        {navItems.map(({ key, icon: Icon, label, anim }) => (
          <button key={key} onClick={() => go(key)}
            className={`rail-btn ${anim} relative w-full h-9 rounded-lg flex items-center justify-center transition-all ${page === key ? activeBg : `${textSecondary} ${hoverBg}`
              }`}>
            <div className="nav-icon-wrap"><Icon /></div>
            <span className="rail-tip">{label}</span>
          </button>
        ))}
      </div>
      <div className="relative">
        <div onClick={() => isLoggedIn ? setUserMenuOpen(!userMenuOpen) : onLogin()} className={`w-8 h-8 ${isLoggedIn ? 'bg-emerald-500 text-white' : avatarBg} rounded-full flex items-center justify-center text-[10px] font-semibold cursor-pointer hover:ring-2 hover:ring-gray-300 transition-all`}>{userInitial || 'U'}</div>
        <UserMenu open={userMenuOpen} onClose={() => setUserMenuOpen(false)} position="right" isDark={isDark} onToggleDark={onToggleDark} onLogout={onLogout} userName={userName} userInitial={userInitial} />
      </div>
    </nav>
  );

  /* ── Expanded: 256px full sidebar ── */
  return (
    <aside className={`hidden md:flex w-64 border-r flex-col shrink-0 ${bg}`}>
      {/* Header */}
      <div className="flex items-center justify-between pl-5 pr-2 pt-5 pb-3">
        <span className={`text-[15px] font-bold tracking-tight ${textPrimary} cursor-default select-none`}>Loka</span>
        <div className="flex items-center gap-0.5">
          <button className={`w-7 h-7 rounded-md flex items-center justify-center ${textMuted} ${hoverBg} transition-all`} title="Search"><I.Search /></button>
          <button onClick={onToggle} className={`w-7 h-7 rounded-md flex items-center justify-center ${textMuted} ${hoverBg} transition-all`} title="Collapse sidebar"><I.Panel /></button>
        </div>
      </div>

      {/* New chat */}
      <div className="px-3 pb-1">
        <SideLink icon={I.Plus} label="New chat" onClick={() => go(Page.SUPER_AGENT)} isDark={isDark} />
      </div>

      <div className={`mx-4 my-2 h-px ${divider}`} />

      {/* Nav */}
      <div className="px-3 space-y-px">
        {navItems.map(({ key, icon, label, anim }) => (
          <SideLink key={key} icon={icon} label={label} active={page === key} anim={anim}
            onClick={() => go(key)} isDark={isDark} />
        ))}
      </div>

      <div className={`mx-4 my-3 h-px ${divider}`} />

      {/* Recents */}
      <div className="px-3 flex-1 overflow-y-auto min-h-0">
        <p className={`px-2 pb-2 text-[11px] font-medium ${textMuted} select-none`}>Recents</p>
        {RECENTS.map((r, i) => (
          <button key={i} className={`w-full text-left px-2 py-1.5 rounded-md text-[13px] ${textSecondary} hover:${textPrimary} ${hoverBg} transition-all truncate`}>
            {r}
          </button>
        ))}
      </div>

      {/* User */}
      <div className="px-3 py-3 relative">
        <div onClick={() => isLoggedIn ? setUserMenuOpen(!userMenuOpen) : onLogin()} className={`flex items-center gap-2.5 px-2 py-2 rounded-lg ${hoverBg} transition-all cursor-pointer group/user`}>
          <div className={`w-7 h-7 ${isLoggedIn ? 'bg-emerald-500 text-white' : avatarBg} rounded-full flex items-center justify-center text-[10px] font-semibold`}>{userInitial || 'U'}</div>
          <span className={`flex-1 text-[13px] font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} truncate`}>{isLoggedIn ? (userName || 'User') : 'Sign in'}</span>
          <div className={`opacity-0 group-hover/user:opacity-100 transition-opacity ${textMuted}`}><I.Dots /></div>
        </div>
        <UserMenu open={userMenuOpen} onClose={() => setUserMenuOpen(false)} isDark={isDark} onToggleDark={onToggleDark} onLogout={onLogout} userName={userName} userInitial={userInitial} />
      </div>
    </aside>
  );
};

/* Sidebar nav link */
const SideLink: React.FC<{
  icon: React.FC; label: string; active?: boolean; badge?: number; anim?: string; onClick: () => void; isDark?: boolean;
}> = ({ icon: Icon, label, active, badge, anim, onClick, isDark }) => (
  <button onClick={onClick}
    className={`${anim || ''} w-full flex items-center gap-2.5 px-2 py-[7px] rounded-md text-[14px] transition-all ${active
      ? (isDark ? 'bg-white/10 text-white font-semibold' : 'bg-gray-100 text-gray-900 font-semibold')
      : (isDark ? 'text-gray-400 hover:text-gray-100 hover:bg-white/8' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50')
      }`}>
    <div className={`nav-icon-wrap ${active ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}><Icon /></div>
    <span className="flex-1 text-left">{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className="min-w-[18px] h-[18px] bg-gray-900 text-white text-[10px] font-semibold rounded-full flex items-center justify-center px-1">{badge}</span>
    )}
  </button>
);

/* ════════════════════════════════════════════════════════════
   PAGES
   ════════════════════════════════════════════════════════════ */

/* ── SVG icons for input bar ── */
const InputIcons = {
  Attach: () => <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>,
  Mic: () => <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>,
  Image: () => <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>,
  Chevron: () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>,
};

const SuperAgentHome: React.FC = () => {
  const [input, setInput] = useState('');
  const [model, setModel] = useState('GPT-4o');
  const [chatMessage, setChatMessage] = useState<string | null>(null);

  if (chatMessage) {
    return <SuperAgentChat initialMessage={chatMessage} onBack={() => setChatMessage(null)} />;
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto">
      {/* ── Hero + Input ── */}
      <div className="flex flex-col items-center pt-20 md:pt-32 pb-6 px-4">
        <div className="max-w-[640px] w-full space-y-8">
          {/* Title */}
          <div className="text-center">
            <h1 className="text-[28px] md:text-[32px] font-semibold tracking-tight text-gray-900 leading-tight">
              Where would you like to invest?
            </h1>
          </div>

          {/* Input Box */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm focus-within:border-gray-300 focus-within:shadow-md transition-all">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && input.trim()) { e.preventDefault(); setChatMessage(input.trim()); } }}
              placeholder="Describe what you want to invest in, or ask about any asset..."
              rows={3}
              className="w-full bg-transparent outline-none text-[15px] text-gray-900 placeholder:text-gray-400 px-4 pt-4 pb-2 resize-none"
            />
            {/* Input toolbar */}
            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex items-center gap-1">
                <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-gray-500 hover:bg-gray-100 transition-all">
                  {model} <InputIcons.Chevron />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all" title="Attach file">
                  <InputIcons.Attach />
                </button>
                <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all" title="Add image">
                  <InputIcons.Image />
                </button>
                <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all" title="Voice input">
                  <InputIcons.Mic />
                </button>
                <button
                  onClick={() => { if (input.trim()) setChatMessage(input.trim()); }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${input.trim() ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  }`}>
                  <I.Send />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions — horizontally scrollable on mobile */}
          <div className="-mx-4 px-4 overflow-x-auto border-b border-transparent" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            <div className="flex items-center justify-start md:justify-center gap-2 min-w-max md:min-w-0 md:w-full">
              {QUICK_ACTIONS.slice(0, 4).map(a => {
                const Ic = a.icon;
                return (
                  <button key={a.id}
                    onClick={() => setChatMessage(a.label)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-gray-200 bg-white text-[13px] font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900 hover:shadow-sm active:scale-[0.98] transition-all whitespace-nowrap shrink-0">
                    <Ic /> {a.label}
                  </button>
                );
              })}
              <button className="px-3.5 py-2 rounded-full border border-gray-200 bg-white text-[13px] font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900 hover:shadow-sm active:scale-[0.98] transition-all whitespace-nowrap shrink-0">
                More
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Investment Opportunities (table-style) ── */}
      <div className="px-4 md:px-8 pb-10 pt-16 max-w-[800px] w-full mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold text-gray-900">Investment Opportunities</h2>
          </div>
          <button className="text-[12px] font-medium text-gray-400 hover:text-gray-600 transition-colors">View all →</button>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          {/* Table header — hidden on mobile */}
          <div className="hidden md:grid grid-cols-[minmax(0,2fr)_100px_100px_120px] gap-2 px-4 py-2.5 border-b border-gray-100 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
            <span>Project</span>
            <span className="text-right">MRR</span>
            <span className="text-right">MoM</span>
            <span className="text-right">Progress</span>
          </div>
          {/* Rows — table on desktop, stacked card on mobile */}
          {TRENDING_PROJECTS.map((p, idx) => (
            <div key={p.id}
              className={`md:grid md:grid-cols-[minmax(0,2fr)_100px_100px_120px] md:gap-2 px-4 py-3 md:items-center hover:bg-gray-50/80 transition-colors cursor-pointer ${idx < TRENDING_PROJECTS.length - 1 ? 'border-b border-gray-50' : ''
                }`}>
              {/* Project name + desc */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-[11px] font-bold text-gray-500 shrink-0">
                  {p.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-gray-900 truncate">{p.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">{p.desc}</p>
                </div>
              </div>
              {/* Stats row — inline on mobile, separate columns on desktop */}
              <div className="flex items-center justify-between mt-2 md:mt-0 md:contents pl-10 md:pl-0">
                <span className="text-[13px] font-semibold text-gray-900 md:text-right">{p.mrr}</span>
                <span className={`text-[13px] font-semibold md:text-right ${p.momUp ? 'text-emerald-600' : 'text-red-500'}`}>
                  {p.momUp ? '↑' : '↓'} {p.mom.replace(/[+-]/, '')}
                </span>
                <div className="flex items-center gap-2 md:justify-end">
                  <div className="w-12 md:w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${p.pct >= 100 ? 'bg-emerald-500' : 'bg-gray-900'}`}
                      style={{ width: `${Math.min(p.pct, 100)}%` }} />
                  </div>
                  <span className="text-[11px] text-gray-500 w-8 text-right">{p.pct}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MOCK_GROUP_MEMBERS: Record<string, { agents: string[], team: { name: string, online: boolean }[], investors: { name: string, score: number, color: string }[] }> = {
  g1: { agents: ['Loka Agent', 'Risk Analyzer'], team: [{ name: 'Alex Chen', online: true }, { name: 'Sarah Kim', online: false }], investors: [{ name: 'CryptoWhale88', score: 850, color: 'text-emerald-600' }, { name: 'DeFi_Maxoor', score: 520, color: 'text-blue-600' }, { name: 'YieldKing', score: 1120, color: 'text-amber-600' }] },
  g2: { agents: ['Loka Agent'], team: [{ name: 'Marcus Rivera', online: true }, { name: 'Emily Zhang', online: true }], investors: [{ name: 'RWA_Bull', score: 680, color: 'text-emerald-600' }, { name: 'OnChainFred', score: 390, color: 'text-blue-600' }] },
  g3: { agents: ['Loka Agent', 'Market Research'], team: [{ name: 'David Park', online: false }], investors: [{ name: 'AlphaTrader', score: 720, color: 'text-emerald-600' }] },
};

const MOCK_CHAT_MESSAGES: Record<string, { role: string, name: string, text: string, time: string, tag?: string }[]> = {
  g1: [
    { role: 'agent', name: 'Loka Agent', tag: 'AI Agent', text: '✅ Milestone Update: Data center lease verified on-chain. Contract hash: 0x8f2a...3b4c. Compliance check passed.', time: '2:10 PM' },
    { role: 'user', name: 'Alex Chen', tag: 'Issuer', text: 'Should we prioritize H100 or A100 GPUs for the first batch?', time: '2:31 PM' },
    { role: 'system', name: 'Loka Agent', text: 'Hardware shipment tracking is live. We\'re on schedule for the 60-day deployment plan.', time: '3:31 PM' },
    { role: 'user', name: 'Alex Chen', tag: 'Issuer', text: 'Great! Let\'s update investors on the milestone.', time: '4:10 PM' },
  ],
  g2: [
    { role: 'agent', name: 'Loka Agent', tag: 'AI Agent', text: 'New RWA project just listed: Shopify Merchant Cluster — $200k target, 8.9% APY. Due diligence report attached.', time: '9:00 AM' },
    { role: 'user', name: 'Marcus Rivera', tag: 'Issuer', text: 'The receivables data has been verified by Stripe Connect. Coverage ratio is at 2.1x.', time: '10:30 AM' },
    { role: 'system', name: 'Loka Agent', text: 'Monthly repayment of $18,400 received. Distributed to 42 investors on-chain. ✅', time: '11:00 AM' },
  ],
  g3: [
    { role: 'agent', name: 'Loka Agent', tag: 'AI Agent', text: '📊 Weekly Market Report: BTC dominance ↑ 2.3%, DeFi TVL ↑ 4.1%. AI sector outperforming by +12%.', time: '8:00 AM' },
    { role: 'user', name: 'David Park', tag: 'Research', text: 'The on-chain metrics suggest a bullish accumulation pattern. Volume is confirming the move.', time: '9:15 AM' },
    { role: 'system', name: 'Loka Agent', text: 'New signal generated: Long ETH/USD at $2,840 — risk/reward 1:3.2. Confidence: 78%.', time: '10:00 AM' },
  ],
  c1: [
    { role: 'user', name: 'Alex Chen', text: 'Check out this DeFi project — 15.5% APY, 60-day term. Verified by Loka.', time: '10:00 AM' },
    { role: 'agent', name: 'Loka Agent', tag: 'AI Agent', text: 'I\'ve analyzed the project. Strong cash flow coverage at 1.8x. Risk rating: A-. Would you like to invest?', time: '10:02 AM' },
  ],
};

const ChatsPage: React.FC = () => {
  const [filter, setFilter] = useState<'All' | 'People' | 'Groups'>('All');
  const [selected, setSelected] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [showMembers, setShowMembers] = useState(true);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [mktSearch, setMktSearch] = useState('');
  const [mktCat, setMktCat] = useState('All');

  const MKT_CATS = ['All', 'Risk Management', 'Investment Analysis', 'Operations', 'DeFi & On-chain'];
  const MKT_AGENTS = [
    { name: 'Risk Assessor', desc: 'Real-time credit scoring & borrower risk analysis using on-chain data', cat: 'Risk Management', color: 'bg-orange-500' },
    { name: 'Portfolio Risk Monitor', desc: 'Monitors concentration risk, liquidation thresholds & VaR metrics', cat: 'Risk Management', color: 'bg-rose-500' },
    { name: 'Fraud Detector', desc: 'ML-powered anomaly detection across transactions and wallet activities', cat: 'Risk Management', color: 'bg-red-400' },
    { name: 'Yield Optimizer', desc: 'Find and optimize the best yield opportunities across protocols', cat: 'DeFi & On-chain', color: 'bg-violet-500' },
    { name: 'Market Analyst', desc: 'Real-time market intelligence and investment opportunity identification', cat: 'Investment Analysis', color: 'bg-blue-500' },
    { name: 'Compliance Bot', desc: 'Automated KYC/AML checks and regulatory reporting', cat: 'Operations', color: 'bg-emerald-500' },
  ];
  const filteredMkt = mktSearch
    ? MKT_AGENTS.filter(a => a.name.toLowerCase().includes(mktSearch.toLowerCase()))
    : mktCat === 'All' ? MKT_AGENTS : MKT_AGENTS.filter(a => a.cat === mktCat);

  const filtered = filter === 'All' ? MOCK_MESSAGES
    : filter === 'People' ? MOCK_MESSAGES.filter(m => !m.isGroup)
      : MOCK_MESSAGES.filter(m => m.isGroup);

  const sel = selected ? MOCK_MESSAGES.find(m => m.id === selected) : null;
  const msgs = selected ? (MOCK_CHAT_MESSAGES[selected] || []) : [];
  const members = selected ? MOCK_GROUP_MEMBERS[selected] : null;

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* ── Left: conversation list ── */}
      {/* Mobile: full-width when no chat selected, hidden when chat is open */}
      {/* Desktop: always visible as 288px sidebar */}
      <div className={`${selected ? 'hidden md:flex' : 'flex'} w-full md:w-72 border-r border-gray-100 flex-col shrink-0 bg-white`}>
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h2 className="text-[15px] font-semibold text-gray-900">Chats</h2>
          <button className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all"><I.Plus /></button>
        </div>
        <div className="px-4 pb-3 flex gap-1">
          {(['All', 'People', 'Groups'] as const).map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1 rounded-md text-[12px] font-medium transition-all ${filter === t ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}>{t}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-2">
          {filtered.map(m => (
            <button key={m.id} onClick={() => setSelected(m.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${selected === m.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[12px] font-bold ${m.color || 'bg-gray-100 text-gray-600'}`}>{m.avatar}</div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-center">
                  <p className="text-[13px] font-medium text-gray-900 truncate">{m.name}</p>
                  <span className="text-[11px] text-gray-300 shrink-0 ml-2">{m.time}</span>
                </div>
                <p className="text-[12px] text-gray-400 truncate mt-0.5">{m.lastMsg}</p>
              </div>
              {m.unread > 0 && <span className="min-w-[18px] h-[18px] bg-gray-900 text-white text-[9px] font-semibold rounded-full flex items-center justify-center px-1 shrink-0">{m.unread}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ── Center: chat detail ── */}
      {sel ? (
        <>
          <div className="flex-1 flex flex-col min-w-0 bg-gray-50/30">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-white shrink-0">
              {/* Back button — mobile only */}
              <button onClick={() => setSelected(null)} className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold ${sel.color || 'bg-gray-100 text-gray-600'}`}>{sel.avatar}</div>
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-gray-900">{sel.name}</p>
                {sel.isGroup && members && (
                  <p className="text-[11px] text-gray-400">{(members.agents.length + members.team.length + members.investors.length)} members</p>
                )}
              </div>
              {/* Toggle members sidebar */}
              {sel.isGroup && members && (
                <button onClick={() => setShowMembers(v => !v)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${showMembers ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
                    }`} title="Members">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {msgs.map((msg, i) => (
                <div key={i}>
                  {(msg.role === 'agent' || msg.role === 'user') && (
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 shrink-0">
                        {msg.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="max-w-[70%]">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[12px] font-semibold text-gray-800">{msg.name}</span>
                          {msg.tag && <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-violet-100 text-violet-600">{msg.tag}</span>}
                          <span className="text-[10px] text-gray-300">{msg.time}</span>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-xl rounded-tl-sm px-3.5 py-2.5 text-[13px] text-gray-700 shadow-sm leading-relaxed">
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  )}
                  {msg.role === 'system' && (
                    <div className="flex justify-center">
                      <div className="bg-gray-100 rounded-xl px-4 py-2 text-[12px] text-gray-500 max-w-[80%] text-center">
                        {msg.text}
                        <span className="ml-2 text-[10px] text-gray-300">{msg.time}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {msgs.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[13px] text-gray-400">No messages yet</p>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-5 py-3 border-t border-gray-100 bg-white shrink-0">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-gray-300 transition-all">
                <input value={input} onChange={e => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent outline-none text-[13px] text-gray-900 placeholder:text-gray-400"
                />
                <button className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${input.trim() ? 'bg-gray-900 text-white' : 'text-gray-300 cursor-not-allowed'}`}>
                  <I.Send />
                </button>
              </div>
            </div>
          </div>

          {/* ── Right: members sidebar (groups only, desktop only) ── */}
          {sel.isGroup && members && showMembers && (
            <div className="hidden md:flex w-60 border-l border-gray-100 bg-white flex-col shrink-0 overflow-y-auto px-5 py-5">
              <p className="text-[14px] font-semibold text-gray-900 mb-5">Members ({members.agents.length + members.team.length + members.investors.length})</p>

              {/* AI Agent */}
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">AI Agent</p>
              {members.agents.map(a => (
                <div key={a} className="flex items-center gap-3 mb-3">
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-[12px] font-bold text-violet-600">{a[0]}</div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-gray-800">{a}</p>
                    <p className="text-[11px] text-emerald-500">Always Online</p>
                  </div>
                </div>
              ))}

              {/* Add Agent */}
              <button onClick={() => setShowMarketplace(true)}
                className="flex items-center gap-3 mb-4 w-full py-1 rounded-lg hover:bg-gray-50 transition-all group">
                <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-200 group-hover:border-gray-400 flex items-center justify-center shrink-0 transition-colors">
                  <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 5v14M5 12h14" /></svg>
                </div>
                <div className="text-left">
                  <p className="text-[12px] font-semibold text-gray-700">Add Agent</p>
                  <p className="text-[11px] text-gray-400">Explore marketplace</p>
                </div>
              </button>

              {/* Project Team */}
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Project Team</p>
              {members.team.map(t => (
                <div key={t.name} className="flex items-center gap-3 mb-3">
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[12px] font-bold text-blue-600">{t.name[0]}</div>
                    {t.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />}
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-gray-800">{t.name}</p>
                    <p className={`text-[11px] ${t.online ? 'text-emerald-500' : 'text-gray-300'}`}>{t.online ? 'Online' : 'Offline'}</p>
                  </div>
                </div>
              ))}

              {/* Investors */}
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-1 mb-3">Investors</p>
              {members.investors.map(inv => (
                <div key={inv.name} className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-bold text-gray-500 shrink-0">{inv.name[0].toUpperCase()}</div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-gray-800 truncate">{inv.name}</p>
                    <p className="text-[11px] text-gray-400">Investor</p>
                  </div>
                </div>
              ))}
            </div>
          )}


          {/* ── Agent Marketplace Modal ── */}
          {showMarketplace && (
            <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowMarketplace(false)}>
              <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:w-[640px] max-h-[85vh] md:max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Modal header */}
                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h2 className="text-[18px] font-bold text-gray-900">Agent Marketplace</h2>
                      <p className="text-[13px] text-gray-400 mt-0.5">Add AI agents to enhance your group's capabilities</p>
                    </div>
                    <button onClick={() => setShowMarketplace(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                  {/* Search */}
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mt-4">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                    <input value={mktSearch} onChange={e => setMktSearch(e.target.value)} placeholder="Search agents..." className="flex-1 bg-transparent outline-none text-[13px] text-gray-900 placeholder:text-gray-400" />
                  </div>
                  {/* Categories */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {MKT_CATS.map(c => (
                      <button key={c} onClick={() => setMktCat(c)}
                        className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all ${mktCat === c ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}>{c}</button>
                    ))}
                  </div>
                </div>
                {/* Agent list */}
                <div className="flex-1 overflow-y-auto px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredMkt.map(a => (
                    <div key={a.name} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 hover:shadow-sm transition-all flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl ${a.color} flex items-center justify-center text-white text-[14px] font-bold shrink-0`}>{a.name[0]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900">{a.name}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{a.desc}</p>
                      </div>
                      <button className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all shrink-0">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 5v14M5 12h14" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-[13px] text-gray-400">0 agents added to this group</p>
                  <button onClick={() => setShowMarketplace(false)} className="px-5 py-2 rounded-xl bg-gray-900 text-white text-[13px] font-semibold hover:bg-gray-800 transition-colors">Done</button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50/50">
          <p className="text-[14px] text-gray-400">Select a conversation</p>
        </div>
      )}
    </div>
  );
};

/* ── Discover Page Data ── */
const DISCOVER_GROUPS = [
  { id: 1, name: 'DeFi Alpha Hunters', desc: 'Find early DeFi opportunities and yield strategies', members: 1240, letter: 'D', color: 'bg-blue-100 text-blue-600' },
  { id: 2, name: 'RWA Investment Club', desc: 'Real-world asset tokenization discussion', members: 890, letter: 'R', color: 'bg-emerald-100 text-emerald-600' },
  { id: 3, name: 'AI Trading Signals', desc: 'AI-generated trading signals and market analysis', members: 2100, letter: 'A', color: 'bg-violet-100 text-violet-600' },
  { id: 4, name: 'Credit Score Maximizers', desc: 'Tips to improve your Loka credit score', members: 560, letter: 'C', color: 'bg-amber-100 text-amber-600' },
  { id: 5, name: 'Macro Research Daily', desc: 'Daily macro economic research and insights', members: 1780, letter: 'M', color: 'bg-rose-100 text-rose-600' },
  { id: 6, name: 'Stablecoin Yield Farming', desc: 'Best stablecoin yield farming strategies', members: 920, letter: 'S', color: 'bg-cyan-100 text-cyan-600' },
  { id: 7, name: 'On-chain Data Analysis', desc: 'Deep dive into on-chain metrics and trends', members: 670, letter: 'O', color: 'bg-indigo-100 text-indigo-600' },
  { id: 8, name: 'Portfolio Construction', desc: 'Build and optimize your investment portfolio', members: 430, letter: 'P', color: 'bg-pink-100 text-pink-600' },
];

const DISCOVER_AGENTS = [
  { id: 1, name: 'Finance Assistant', desc: 'Analyze financial data and generate investment insights', category: 'Finance', letter: 'F', color: 'bg-blue-500' },
  { id: 2, name: 'Risk Analyzer', desc: 'Evaluate portfolio risk and suggest hedging strategies', category: 'Finance', letter: 'R', color: 'bg-red-500' },
  { id: 3, name: 'Market Research', desc: 'Research market trends, competitors, and opportunities', category: 'Research', letter: 'M', color: 'bg-emerald-500' },
  { id: 4, name: 'Credit Scorer', desc: 'AI-powered credit assessment for lending decisions', category: 'Finance', letter: 'C', color: 'bg-amber-500' },
  { id: 5, name: 'Yield Optimizer', desc: 'Find and optimize the best yield opportunities', category: 'DeFi', letter: 'Y', color: 'bg-violet-500' },
  { id: 6, name: 'News Aggregator', desc: 'Curate and summarize financial news in real-time', category: 'Research', letter: 'N', color: 'bg-cyan-500' },
  { id: 7, name: 'Smart Contract Auditor', desc: 'Audit smart contracts for security vulnerabilities', category: 'DeFi', letter: 'S', color: 'bg-indigo-500' },
  { id: 8, name: 'Tokenomics Analyst', desc: 'Analyze token economics and distribution models', category: 'Research', letter: 'T', color: 'bg-pink-500' },
];

const DISCOVER_CONTACTS = [
  { id: 1, name: 'Alex Chen', role: 'Founder & CEO', org: 'Copy Trading AI', followers: 12400, initials: 'AC', bgColor: 'bg-blue-500' },
  { id: 2, name: 'Sarah Kim', role: 'Co-founder & CTO', org: 'MEV Searcher Agent', followers: 8900, initials: 'SK', bgColor: 'bg-violet-500' },
  { id: 3, name: 'Marcus Rivera', role: 'Founder', org: 'DeFi Yield Optimizer', followers: 15600, initials: 'MR', bgColor: 'bg-emerald-500' },
  { id: 4, name: 'Emily Zhang', role: 'CEO', org: 'On-chain Credit Score', followers: 6700, initials: 'EZ', bgColor: 'bg-amber-500' },
  { id: 5, name: 'David Park', role: 'Head of Research', org: 'AI Agent Marketplace', followers: 4200, initials: 'DP', bgColor: 'bg-rose-500' },
  { id: 6, name: 'Lisa Wang', role: 'Founder & CPO', org: 'Climapp.io Utility', followers: 3100, initials: 'LW', bgColor: 'bg-cyan-500' },
  { id: 7, name: 'James Liu', role: 'Managing Partner', org: 'Loka Ventures', followers: 28500, initials: 'JL', bgColor: 'bg-indigo-500' },
  { id: 8, name: 'Nina Patel', role: 'Lead Engineer', org: 'Copy Trading AI', followers: 5400, initials: 'NP', bgColor: 'bg-pink-500' },
  { id: 9, name: 'Tom Wu', role: 'CFO', org: 'MEV Searcher Agent', followers: 7800, initials: 'TW', bgColor: 'bg-orange-500' },
];

const AGENT_CATEGORIES = ['All', 'Finance', 'Research', 'DeFi'];

const DiscoverPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Agents' | 'Groups'>('Agents');
  const [agentCat, setAgentCat] = useState('All');

  const tabs = ['Agents', 'Groups'] as const;

  const filteredAgents = agentCat === 'All' ? DISCOVER_AGENTS : DISCOVER_AGENTS.filter(a => a.category === agentCat);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto">
      <div className="animate-fadeIn pb-24 p-4 sm:p-8 md:p-10 lg:p-12 max-w-[1600px] mx-auto w-full min-h-full">
        {/* Header + Tabs — flat style */}
        <h1 className="text-[22px] font-semibold text-gray-900 mb-4">Playground</h1>
        <div className="flex items-center gap-6 border-b border-gray-100 mb-6">
          {tabs.map(t => (
            <button key={t}
              onClick={() => setActiveTab(t)}
              className={`pb-2 text-[14px] font-medium transition-all border-b-2 -mb-px flex items-center gap-1.5 ${activeTab === t
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}>{t}</button>
          ))}
        </div>

        {/* ── Groups Tab ── */}
        {activeTab === 'Groups' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {DISCOVER_GROUPS.map(g => (
              <div key={g.id} className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-xl ${g.color} flex items-center justify-center text-[13px] font-bold shrink-0`}>{g.letter}</div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 truncate leading-tight">{g.name}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{g.members.toLocaleString()} members</p>
                  </div>
                </div>
                {/* Desc */}
                <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2 mb-3">{g.desc}</p>
                {/* Action */}
                <button className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-700 hover:text-gray-900 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Join group
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Agents Tab ── */}
        {activeTab === 'Agents' && (
          <div>
            <div className="flex items-center gap-2 mb-5">
              {AGENT_CATEGORIES.map(c => (
                <button key={c}
                  onClick={() => setAgentCat(c)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${agentCat === c ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}>{c}</button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {filteredAgents.map(a => {
                // Map solid color to gradient pair
                const gradMap: Record<string, string> = {
                  'bg-blue-500': 'from-blue-500 to-indigo-500',
                  'bg-red-500': 'from-red-500 to-rose-500',
                  'bg-emerald-500': 'from-emerald-500 to-teal-500',
                  'bg-amber-500': 'from-amber-400 to-orange-400',
                  'bg-violet-500': 'from-violet-500 to-purple-500',
                  'bg-cyan-500': 'from-cyan-500 to-sky-500',
                  'bg-indigo-500': 'from-indigo-500 to-blue-600',
                  'bg-pink-500': 'from-pink-500 to-rose-500',
                };
                const grad = gradMap[a.color] ?? 'from-gray-400 to-gray-500';
                return (
                  <div key={a.id} className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group">
                    {/* Avatar + name row */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-[13px] font-black text-white shadow-sm shrink-0`}>
                        {a.letter}
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-[13px] font-semibold text-gray-900 leading-tight">{a.name}</p>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">{a.category}</p>
                      </div>
                    </div>
                    {/* Desc */}
                    <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2 mb-3">{a.desc}</p>
                    {/* Action — lightweight, not full-width black */}
                    <button className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-700 hover:text-gray-900 transition-colors group-hover:underline underline-offset-2">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                      Start a chat
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SettingsPage: React.FC = () => (
  <div className="flex-1 flex items-center justify-center h-full">
    <div className="text-center space-y-3">
      <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mx-auto text-xl">⚙️</div>
      <h2 className="text-[16px] font-semibold text-gray-900">Settings</h2>
      <p className="text-[13px] text-gray-400 max-w-[240px]">Account and preferences.</p>
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════
   APP
   ════════════════════════════════════════════════════════════ */
const App: React.FC = () => {
  const [page, setPage] = useState<Page>(Page.SUPER_AGENT);
  const [expanded, setExpanded] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { ready, authenticated, user } = usePrivy();
  const { logout } = useLogout({
    onSuccess: () => setPage(Page.SUPER_AGENT),
  });
  const isLoggedIn = ready && authenticated;

  // Derive user display info from Privy user object
  const userName = user?.google?.name || user?.twitter?.username || user?.email?.address?.split('@')[0] || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  const toggleDark = () => {
    setIsDark(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  };

  useEffect(() => {
    if (window.matchMedia('(max-width: 768px)').matches) setExpanded(false);
  }, []);

  // 进入 Chats 页自动收起侧边栏，离开时恢复
  useEffect(() => {
    if (window.matchMedia('(max-width: 768px)').matches) return;
    if (page === Page.CHATS) {
      setExpanded(false);
    } else {
      setExpanded(true);
    }
  }, [page]);

  const appBg = isDark ? 'bg-[#0e0e0e]' : 'bg-gray-50/30';
  const mainBg = isDark ? 'bg-[#141414]' : 'bg-white md:bg-transparent';

  return (
    <div className={`h-screen w-screen flex overflow-hidden ${appBg} selection:bg-gray-900 selection:text-white transition-colors duration-300`}>
      <AnimStyles />
      <OAuthCallbackHandler />
      {showAuthModal && <AuthModal onLogin={() => setShowAuthModal(false)} onClose={() => setShowAuthModal(false)} />}

      <Sidebar expanded={expanded} onToggle={() => setExpanded(!expanded)} page={page} go={setPage} isDark={isDark} onToggleDark={toggleDark}
        isLoggedIn={isLoggedIn} onLogin={() => setShowAuthModal(true)} onLogout={logout}
        userName={userName} userInitial={userInitial} />

      <main className={`flex-1 flex flex-col overflow-hidden h-full pb-14 md:pb-0 ${mainBg}`}>
        <div className="flex-1 overflow-y-auto flex flex-col md:m-0">
          {page === Page.SUPER_AGENT && <SuperAgentHome />}
          {page === Page.CHATS && <ChatsPage />}
          {page === Page.INVEST && <Market />}
          {page === Page.DISCOVER && <DiscoverPage />}
          {page === Page.SETTINGS && <SettingsPage />}
          {page === Page.API && <ApiLanding />}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 flex items-center justify-around px-2 pt-1 z-50" style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}>
        {navItems.map(({ key, icon: Icon, label }) => {
          const u = key === Page.CHATS ? MOCK_MESSAGES.reduce((s, m) => s + m.unread, 0) : 0;
          return (
            <button key={key} onClick={() => setPage(key)}
              className={`relative flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg transition-all ${page === key ? 'text-gray-900' : 'text-gray-400'}`}>
              <Icon />
              <span className="text-[9px] font-medium">{label}</span>
              {u > 0 && <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-gray-900 text-white text-[7px] font-bold rounded-full flex items-center justify-center">{u > 9 ? '9+' : u}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default App;
