import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { usePrivy, useLogout } from '@privy-io/react-auth';
import { Page } from './types';
import Market from './components/Market';
import Portfolio from './components/Portfolio';
import RealChatsPage from './components/ChatsPage';
import RealContactsPage from './components/ContactsPage';
import ApiLanding from './components/ApiLanding';
import SuperAgentChat from './components/SuperAgentChat';
import AuthModal from './components/AuthModal';
import TxModal from './components/TxModal';
import OAuthCallbackHandler from './components/OAuthCallbackHandler';
import DiscoverPage from './components/DiscoverPage';
import DeepResearch from './components/DeepResearch';
import { api } from './services/api';
import { socket } from './services/socket';

/* ────────────────────────────────────────────────────────────
   Icons — richer, hand-crafted 18×18 with fills & details
   ──────────────────────────────────────────────────────────── */
const sv = "w-[18px] h-[18px]";
export const I = {
  Panel: () => <svg className={sv} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M9 3v18" /></svg>,
  Plus: () => <svg className={sv} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>,
  Search: () => <svg className={sv} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M21 21l-4.35-4.35" /></svg>,
  /* Home — house with door */
  Home: () => <svg className={sv} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" fill="currentColor" fillOpacity={0.06} /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
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
  /* People — address book / contacts */
  People: () => <svg className={sv} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>,
  Send: () => <svg className={sv} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>,
  Dots: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>,
  /* Profile — person with circle */
  Profile: () => <svg className={sv} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" fill="currentColor" fillOpacity={0.08} /><path d="M20 21v-1a6 6 0 00-6-6H10a6 6 0 00-6 6v1" /></svg>,
  /* Menu icons */
  UserIcon: () => <svg className={sv} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0112 0v1" /></svg>,
  Settings: () => <svg className={sv} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1.08z" /></svg>,
  Moon: () => <svg className={sv} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>,
  Sun: () => <svg className={sv} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>,
  LogOut: () => <svg className={sv} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>,
  Building: () => <svg className={sv} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M16 10h.01M8 10h.01M12 14h.01M16 14h.01M8 14h.01" /></svg>,
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
  { id: 'signal-radar', icon: ActionIcons.Research, label: 'Signal Radar' },
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

const MOCK_MESSAGES: any[] = [];

/* ════════════════════════════════════════════════════════════
   SIDEBAR
   ════════════════════════════════════════════════════════════ */
const navItems = [
  { key: Page.CHATS, icon: I.Chat, label: 'Community', anim: 'nav-chat' },
  { key: Page.CONTACTS, icon: I.People, label: 'Contacts', anim: 'nav-sparkle' },
  { key: Page.DISCOVER, icon: I.Compass, label: 'Discover', anim: 'nav-compass' },
  { key: Page.INVEST, icon: I.Market, label: 'Market', anim: 'nav-market' },
  // { key: Page.API, icon: I.Code, label: 'API', anim: 'nav-code' },
];

/* ── User menu popup ── */
const UserMenu: React.FC<{
  open: boolean; onClose: () => void; position?: 'above' | 'right';
  isDark: boolean; onToggleDark: () => void; onLogout?: () => void;
  userName?: string;
  userInitial?: string;
  userAvatar?: string | null;
}> = ({ open, onClose, position = 'above', isDark, onToggleDark, onLogout, userName, userInitial, userAvatar }) => {
  const menuNav = useNavigate();
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
    { icon: I.UserIcon, label: 'Profile', action: () => { menuNav('/portfolio'); onClose(); } },
    { icon: I.Building, label: 'Enterprise', action: () => { menuNav('/enterprise'); onClose(); } },
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
          <div className={`w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-[11px] font-bold text-white overflow-hidden`}>{userAvatar ? <img src={userAvatar} alt="" className="w-full h-full object-cover" /> : (userInitial || 'U')}</div>
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
  userName?: string; userInitial?: string; userAvatar?: string | null;
}> = ({ expanded, onToggle, page, go, isDark, onToggleDark, isLoggedIn, onLogin, onLogout, userName, userInitial, userAvatar }) => {
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
        <I.Panel /><span className="rail-tip">Expand</span>
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
        <div onClick={() => isLoggedIn ? setUserMenuOpen(!userMenuOpen) : onLogin()} className={`w-8 h-8 ${isLoggedIn ? 'bg-emerald-500 text-white' : avatarBg} rounded-full flex items-center justify-center text-[10px] font-semibold cursor-pointer hover:ring-2 hover:ring-gray-300 transition-all overflow-hidden`}>{userAvatar ? <img src={userAvatar} alt="" className="w-full h-full object-cover" /> : (userInitial || 'U')}</div>
        <UserMenu open={userMenuOpen} onClose={() => setUserMenuOpen(false)} position="right" isDark={isDark} onToggleDark={onToggleDark} onLogout={onLogout} userName={userName} userInitial={userInitial} userAvatar={userAvatar} />
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
          <div className={`w-7 h-7 ${isLoggedIn ? 'bg-emerald-500 text-white' : avatarBg} rounded-full flex items-center justify-center text-[10px] font-semibold overflow-hidden`}>{userAvatar ? <img src={userAvatar} alt="" className="w-full h-full object-cover" /> : (userInitial || 'U')}</div>
          <span className={`flex-1 text-[13px] font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} truncate`}>{isLoggedIn ? (userName || 'User') : 'Sign in'}</span>
          <div className={`opacity-0 group-hover/user:opacity-100 transition-opacity ${textMuted}`}><I.Dots /></div>
        </div>
        <UserMenu open={userMenuOpen} onClose={() => setUserMenuOpen(false)} isDark={isDark} onToggleDark={onToggleDark} onLogout={onLogout} userName={userName} userInitial={userInitial} userAvatar={userAvatar} />
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
  const navigate = useNavigate();

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
                    onClick={() => {
                      if (a.id === 'signal-radar') {
                        navigate('/signal-radar', { state: { initialTopic: '' } });
                      } else {
                        setChatMessage(a.label);
                      }
                    }}
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

type GroupMemberData = {
  agents: string[];
  members: { name: string; online: boolean }[];
  isAdmin: boolean; // whether the current user is admin
  adminName: string; // which member is the admin
};
const MOCK_GROUP_MEMBERS: Record<string, GroupMemberData> = {
  g1: { isAdmin: true, adminName: 'Alex Chen', agents: ['Loka Agent', 'Risk Analyzer'], members: [{ name: 'Alex Chen', online: true }, { name: 'Sarah Kim', online: false }, { name: 'CryptoWhale88', online: true }] },
  g2: { isAdmin: false, adminName: 'Marcus Rivera', agents: ['Loka Agent'], members: [{ name: 'Marcus Rivera', online: true }, { name: 'Emily Zhang', online: true }, { name: 'RWA_Bull', online: false }] },
  g3: { isAdmin: true, adminName: 'David Park', agents: ['Loka Agent', 'Market Research'], members: [{ name: 'David Park', online: false }, { name: 'AlphaTrader', online: true }] },
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

// ── Poll types & components ─────────────────────────────────────────────────
type PollData = {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  duration: string;
  total: number;
  voted?: string; // option id the user voted for
};
type LocalMsg = { id: string; type: 'text' | 'image' | 'file' | 'poll'; content: string; poll?: PollData };

const POLL_DURATIONS = ['1h', '12h', '1 day', '3 days'];

const PollModal: React.FC<{ onClose: () => void; onSubmit: (p: PollData) => void }> = ({ onClose, onSubmit }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [duration, setDuration] = useState('1 day');

  const updateOption = (i: number, v: string) => setOptions(o => o.map((x, idx) => idx === i ? v : x));
  const removeOption = (i: number) => setOptions(o => o.filter((_, idx) => idx !== i));
  const addOption = () => setOptions(o => [...o, '']);

  const canSubmit = question.trim() && options.filter(o => o.trim()).length >= 2;

  const handleSubmit = () => {
    const filled = options.filter(o => o.trim());
    onSubmit({
      id: Date.now().toString(),
      question: question.trim(),
      options: filled.map((text, i) => ({ id: `opt-${i}`, text, votes: 0 })),
      duration,
      total: 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-[15px] font-bold text-gray-900">Create Poll</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* Question */}
          <div>
            <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Question</label>
            <input autoFocus value={question} onChange={e => setQuestion(e.target.value)}
              placeholder="What do you want to ask?"
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300" />
          </div>
          {/* Options */}
          <div>
            <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Options</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={opt} onChange={e => updateOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 px-3.5 py-2 text-sm bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300" />
                  {options.length > 2 && (
                    <button onClick={() => removeOption(i)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addOption} className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 hover:text-gray-900 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14M5 12h14" /></svg>
              Add option
            </button>
          </div>
          {/* Duration */}
          <div>
            <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Duration</label>
            <div className="flex gap-2 flex-wrap">
              {POLL_DURATIONS.map(d => (
                <button key={d} onClick={() => setDuration(d)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${duration === d ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12px] font-bold text-gray-400 hover:bg-gray-100 transition-all">Cancel</button>
          <button onClick={handleSubmit} disabled={!canSubmit}
            className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${canSubmit ? 'bg-gray-900 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
            Send Poll
          </button>
        </div>
      </div>
    </div>
  );
};

const PollCard: React.FC<{ poll: PollData }> = ({ poll: initialPoll }) => {
  const [poll, setPoll] = useState(initialPoll);

  const vote = (optId: string) => {
    if (poll.voted) return;
    setPoll(p => ({
      ...p,
      voted: optId,
      total: p.total + 1,
      options: p.options.map(o => o.id === optId ? { ...o, votes: o.votes + 1 } : o),
    }));
  };

  const totalVotes = poll.total;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 w-[280px]">
      {/* Badge */}
      <div className="flex items-center gap-1.5 mb-3">
        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Poll · {poll.duration}</span>
      </div>
      {/* Question */}
      <p className="text-[14px] font-bold text-gray-900 mb-3 leading-snug">{poll.question}</p>
      {/* Options */}
      <div className="space-y-2">
        {poll.options.map(opt => {
          const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
          const isVoted = poll.voted === opt.id;
          return (
            <button key={opt.id} onClick={() => vote(opt.id)} disabled={!!poll.voted}
              className={`w-full text-left rounded-xl border transition-all overflow-hidden ${poll.voted
                ? isVoted ? 'border-gray-900 bg-gray-900' : 'border-gray-100 bg-gray-50'
                : 'border-gray-100 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                }`}>
              <div className="relative px-3 py-2.5">
                {poll.voted && (
                  <div className={`absolute inset-0 rounded-xl transition-all ${isVoted ? 'bg-gray-900' : 'bg-gray-100'}`}
                    style={{ width: `${pct}%`, borderRadius: 'inherit', opacity: 0.15 }} />
                )}
                <div className="relative flex items-center justify-between">
                  <span className={`text-[13px] font-semibold ${poll.voted ? (isVoted ? 'text-gray-900' : 'text-gray-600') : 'text-gray-800'}`}>{opt.text}</span>
                  {poll.voted && <span className="text-[11px] font-bold text-gray-400">{pct}%</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {/* Footer */}
      <p className="text-[10px] text-gray-400 mt-3">
        {poll.voted ? `${totalVotes} vote${totalVotes !== 1 ? 's' : ''}` : 'Tap to vote'}
      </p>
    </div>
  );
};

const AddMemberModal: React.FC<{
  existingNames: string[];
  onClose: () => void;
  onConfirm: (names: string[]) => void;
}> = ({ existingNames, onClose, onConfirm }) => {
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const available = DISCOVER_CONTACTS.filter(c => !existingNames.includes(c.name));

  const toggle = (id: number) =>
    setPicked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleConfirm = () => {
    const names = available.filter(c => picked.has(c.id)).map(c => c.name);
    onConfirm(names);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs mx-4 flex flex-col max-h-[70vh]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-[15px] font-bold text-gray-900">Add Member</h2>
            {picked.size > 0 && <p className="text-[11px] text-gray-400">{picked.size} selected</p>}
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {/* List */}
        <div className="overflow-y-auto flex-1 py-2">
          {available.length === 0 ? (
            <p className="text-[13px] text-gray-400 text-center py-8">All friends are already in this group</p>
          ) : available.map(c => {
            const isSel = picked.has(c.id);
            return (
              <div key={c.id} onClick={() => toggle(c.id)}
                className={`flex items-center gap-3 px-5 py-2.5 cursor-pointer transition-colors ${isSel ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-[11px] font-bold text-gray-500 shrink-0">{c.initials}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-gray-800 truncate">{c.name}</p>
                  <p className="text-[10px] text-gray-400 truncate">{c.bio}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${isSel ? 'bg-gray-900 border-gray-900' : 'border-gray-200'}`}>
                  {isSel && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
              </div>
            );
          })}
        </div>
        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all">Cancel</button>
          <button onClick={handleConfirm} disabled={picked.size === 0}
            className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all ${picked.size > 0 ? 'bg-gray-900 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
            {picked.size > 0 ? `Add (${picked.size})` : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ChatsPage: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'All' | 'People' | 'Groups'>('All');
  const [selected, setSelected] = useState<string | null>(null);
  const [conversations, setConversations] = useState(MOCK_MESSAGES);
  const [input, setInput] = useState('');
  const [localMsgs, setLocalMsgs] = useState<LocalMsg[]>([]);
  const [showPoll, setShowPoll] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showMembers, setShowMembers] = useState(true);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [mktSearch, setMktSearch] = useState('');
  const [mktCat, setMktCat] = useState('All');
  const [plusMenu, setPlusMenu] = useState(false);
  const [plusModal, setPlusModal] = useState<'friend' | 'group' | null>(null);

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

  const filtered = filter === 'All' ? conversations
    : filter === 'People' ? conversations.filter(m => !m.isGroup)
      : conversations.filter(m => m.isGroup);

  const sel = selected ? conversations.find(m => m.id === selected) : null;
  const msgs = selected ? (MOCK_CHAT_MESSAGES[selected] || []) : [];
  const [groupMembersState, setGroupMembersState] = useState<Record<string, GroupMemberData>>(MOCK_GROUP_MEMBERS);
  const members = selected ? groupMembersState[selected] : null;

  const [showAddMember, setShowAddMember] = useState(false);
  const [showDissolve, setShowDissolve] = useState(false);

  const removeMember = (name: string) => selected && setGroupMembersState(prev => ({
    ...prev,
    [selected]: { ...prev[selected], members: prev[selected].members.filter(m => m.name !== name) }
  }));
  const removeAgent = (name: string) => selected && setGroupMembersState(prev => ({
    ...prev,
    [selected]: { ...prev[selected], agents: prev[selected].agents.filter(a => a !== name) }
  }));
  const addMember = (name: string) => selected && setGroupMembersState(prev => {
    const existing = prev[selected].members.find(m => m.name === name);
    if (existing) return prev;
    return { ...prev, [selected]: { ...prev[selected], members: [...prev[selected].members, { name, online: false }] } };
  });
  const dissolveGroup = () => {
    if (!selected) return;
    setConversations(prev => prev.filter(c => c.id !== selected));
    setSelected(null);
    setShowDissolve(false);
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Modals */}
      {plusModal === 'friend' && <AddFriendModal onClose={() => setPlusModal(null)} />}
      {plusModal === 'group' && (
        <CreateGroupModal
          onClose={() => setPlusModal(null)}
          onCreated={(newId) => {
            setConversations(prev => [{
              id: newId,
              name: 'New Group',
              avatar: 'NG',
              role: 'group',
              lastMsg: 'Group created',
              time: 'now',
              unread: 0,
              isGroup: true,
              color: 'bg-blue-100 text-blue-600',
            }, ...prev]);
            setSelected(newId);
            setPlusModal(null);
          }}
        />
      )}
      {/* ── Left: conversation list ── */}
      {/* Mobile: full-width when no chat selected, hidden when chat is open */}
      {/* Desktop: always visible as 288px sidebar */}
      <div className={`${selected ? 'hidden md:flex' : 'flex'} w-full md:w-72 border-r border-gray-100 flex-col shrink-0 bg-white`}>
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h2 className="text-[15px] font-semibold text-gray-900">Chats</h2>
          {/* + button with dropdown */}
          <div className="relative">
            <button onClick={() => setPlusMenu(v => !v)}
              className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all">
              <I.Plus />
            </button>
            {plusMenu && (
              <div className="absolute right-0 top-8 w-44 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-30 animate-fadeIn">
                <button onClick={() => { setPlusModal('friend'); setPlusMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-left">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                  Add Friend
                </button>
                <div className="h-px bg-gray-50" />
                <button onClick={() => { setPlusModal('group'); setPlusMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-left">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Create Group
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="px-4 pb-3 flex gap-1">
          {(['All', 'People', 'Groups'] as const).map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1 rounded-md text-[12px] font-medium transition-all ${filter === t ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}>{t}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <p className="text-[13px] font-bold text-gray-900 mb-1">No chats yet</p>
              <p className="text-[11px] text-gray-400 mb-4 max-w-[180px] leading-relaxed">Discover people and build your network</p>
              <button
                onClick={() => navigate('/discover')}
                className="px-4 py-2 bg-gray-900 text-white text-[12px] font-bold rounded-xl hover:bg-gray-800 transition-all active:scale-95 flex items-center gap-2 shadow-sm inline-flex"
              >
                Discover People
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          ) : (
            filtered.map(m => (
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
            ))
          )}
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
                  <p className="text-[11px] text-gray-400 font-medium">{members ? (members.agents.length + members.members.length) : 0} members</p>
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
              {/* Local messages (images, polls, etc.) */}
              {localMsgs.map((msg) => (
                <div key={msg.id} className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center text-[10px] font-bold text-white shrink-0">Me</div>
                  <div className="max-w-[75%]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[12px] font-semibold text-gray-800">You</span>
                      <span className="text-[10px] text-gray-300">now</span>
                    </div>
                    {/* Image message */}
                    {msg.type === 'image' && (
                      <img src={msg.content} alt="upload" className="max-w-[260px] rounded-xl border border-gray-100 shadow-sm object-cover" />
                    )}
                    {/* File message */}
                    {msg.type === 'file' && (
                      <div className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-xl px-3.5 py-2.5 shadow-sm">
                        <svg className="w-7 h-7 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-gray-800 truncate">{msg.content}</p>
                          <p className="text-[10px] text-gray-400">Attachment</p>
                        </div>
                      </div>
                    )}
                    {/* Text message */}
                    {msg.type === 'text' && (
                      <div className="bg-gray-900 rounded-xl rounded-tl-sm px-3.5 py-2.5 text-[13px] text-white shadow-sm leading-relaxed">{msg.content}</div>
                    )}
                    {/* Poll message */}
                    {msg.type === 'poll' && (
                      <PollCard poll={msg.poll!} />
                    )}
                  </div>
                </div>
              ))}
              {msgs.length === 0 && localMsgs.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[13px] text-gray-400">No messages yet</p>
                </div>
              )}
            </div>

            {/* Poll Modal */}
            {showPoll && (
              <PollModal
                onClose={() => setShowPoll(false)}
                onSubmit={(poll) => {
                  setLocalMsgs(prev => [...prev, { id: Date.now().toString(), type: 'poll', content: '', poll }]);
                  setShowPoll(false);
                }}
              />
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100 bg-white shrink-0 relative">
              {/* Attach popup menu */}
              {showAttachMenu && (
                <div className="absolute bottom-[calc(100%+6px)] right-4 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden w-40 z-10 animate-fadeIn"
                  onClick={() => setShowAttachMenu(false)}>
                  {/* Photo / Video */}
                  <label className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <span className="text-[12px] font-semibold text-gray-700">Photo or Video</span>
                    <input type="file" accept="image/*,video/*" className="hidden" onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = ev => setLocalMsgs(prev => [...prev, { id: Date.now().toString(), type: 'image', content: ev.target?.result as string }]);
                      reader.readAsDataURL(file);
                      e.target.value = '';
                    }} />
                  </label>
                  {/* Document */}
                  <label className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors border-t border-gray-50">
                    <div className="w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    </div>
                    <span className="text-[12px] font-semibold text-gray-700">Document</span>
                    <input type="file" className="hidden" onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setLocalMsgs(prev => [...prev, { id: Date.now().toString(), type: 'file', content: file.name }]);
                      e.target.value = '';
                    }} />
                  </label>
                  {/* Poll — group only */}
                  {sel.isGroup && (
                    <button onClick={() => { setShowPoll(true); setShowAttachMenu(false); }}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors w-full text-left border-t border-gray-50">
                      <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                      </div>
                      <span className="text-[12px] font-semibold text-gray-700">Poll</span>
                    </button>
                  )}
                </div>
              )}
              {/* Click-away backdrop */}
              {showAttachMenu && <div className="fixed inset-0 z-[9]" onClick={() => setShowAttachMenu(false)} />}

              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2.5 focus-within:border-gray-300 transition-all">
                {/* Text input */}
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
                      e.preventDefault();
                      setLocalMsgs(prev => [...prev, { id: Date.now().toString(), type: 'text', content: input.trim() }]);
                      setInput('');
                    }
                  }}
                  placeholder="Message..."
                  className="flex-1 bg-transparent outline-none text-[13px] text-gray-900 placeholder:text-gray-400 min-w-0"
                />
                {/* Attach button */}
                <button onClick={() => setShowAttachMenu(v => !v)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 ${showAttachMenu ? 'text-gray-700 bg-gray-100' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                </button>
                {/* Mic / Send */}
                {input.trim() ? (
                  <button onClick={() => {
                    setLocalMsgs(prev => [...prev, { id: Date.now().toString(), type: 'text', content: input.trim() }]);
                    setInput('');
                  }} className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-900 text-white transition-all shrink-0 hover:bg-gray-700">
                    <I.Send />
                  </button>
                ) : (
                  <button title="Voice input (coming soon)"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Right: members sidebar (groups only, desktop only) ── */}
          {sel.isGroup && members && showMembers && (
            <div className="hidden md:flex w-60 border-l border-gray-100 bg-white flex-col shrink-0 overflow-y-auto">
              {/* Header */}
              <div className="px-4 pt-5 pb-3 border-b border-gray-50">
                <p className="text-[13px] font-bold text-gray-900">Members</p>
                <p className="text-[11px] text-gray-400">{members.agents.length + members.members.length} total</p>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
                {/* ── AI Agents ── */}
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">AI Agents</p>
                  {members.agents.map(a => (
                    <div key={a} className="flex items-center gap-2.5 py-1.5 group">
                      <div className="relative shrink-0">
                        <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-[11px] font-bold text-violet-600">{a[0]}</div>
                        <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 border-2 border-white rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-gray-800 truncate">{a}</p>
                        <p className="text-[10px] text-emerald-500">Always online</p>
                      </div>
                      {members.isAdmin && (
                        <button onClick={() => removeAgent(a)}
                          className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                  {/* Add Agent button — admin only */}
                  {members.isAdmin && (
                    <button onClick={() => setShowMarketplace(true)}
                      className="flex items-center gap-2 mt-1 py-1.5 w-full text-left group">
                      <div className="w-7 h-7 rounded-full border-2 border-dashed border-gray-200 group-hover:border-gray-400 flex items-center justify-center shrink-0 transition-colors">
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14M5 12h14" /></svg>
                      </div>
                      <span className="text-[11px] font-semibold text-gray-400 group-hover:text-gray-700 transition-colors">Add agent</span>
                    </button>
                  )}
                </div>

                {/* ── Members ── */}
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Members</p>
                  {members.members.map(m => (
                    <div key={m.name} className="flex items-center gap-2.5 py-1.5 group">
                      <div className="relative shrink-0">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-bold text-gray-500">{m.name[0].toUpperCase()}</div>
                        {m.online && <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 border-2 border-white rounded-full" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[12px] font-semibold text-gray-800 truncate">{m.name}</p>
                          {m.name === members.adminName && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 shrink-0">Admin</span>
                          )}
                        </div>
                        <p className={`text-[10px] ${m.online ? 'text-emerald-500' : 'text-gray-300'}`}>{m.online ? 'Online' : 'Offline'}</p>
                      </div>
                      {members.isAdmin && m.name !== members.adminName && (
                        <button onClick={() => removeMember(m.name)}
                          className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                  {/* Add Member button — admin only */}
                  {members.isAdmin && (
                    <button onClick={() => setShowAddMember(true)}
                      className="flex items-center gap-2 mt-1 py-1.5 w-full text-left group">
                      <div className="w-7 h-7 rounded-full border-2 border-dashed border-gray-200 group-hover:border-gray-400 flex items-center justify-center shrink-0 transition-colors">
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14M5 12h14" /></svg>
                      </div>
                      <span className="text-[11px] font-semibold text-gray-400 group-hover:text-gray-700 transition-colors">Add member</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Admin: Dissolve group */}
              {members.isAdmin && (
                <div className="px-4 py-3 border-t border-gray-50">
                  <button onClick={() => setShowDissolve(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold text-red-400 hover:bg-red-50 hover:text-red-500 transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Dissolve Group
                  </button>
                </div>
              )}

              {/* Add Member modal */}
              {showAddMember && members && (
                <AddMemberModal
                  existingNames={members.members.map(m => m.name)}
                  onClose={() => setShowAddMember(false)}
                  onConfirm={(names) => { names.forEach(addMember); setShowAddMember(false); }}
                />
              )}

              {/* Dissolve confirmation */}
              {showDissolve && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowDissolve(false)}>
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs mx-4 p-6" onClick={e => e.stopPropagation()}>
                    <div className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <p className="text-[15px] font-bold text-gray-900 text-center mb-1">Dissolve Group?</p>
                    <p className="text-[12px] text-gray-400 text-center mb-5">This action cannot be undone. All members will be removed and the group chat will be permanently deleted.</p>
                    <div className="flex gap-2">
                      <button onClick={() => setShowDissolve(false)}
                        className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all">Cancel</button>
                      <button onClick={dissolveGroup}
                        className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white bg-red-500 hover:bg-red-600 transition-all">Dissolve</button>
                    </div>
                  </div>
                </div>
              )}
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
export const DISCOVER_GROUPS = [
  { id: 1, name: 'Alpha Investors Network', desc: 'Find early-stage investment opportunities before everyone else. We share deal flow, term sheets, and real-time signals from top angel investors and VCs.', members: 1240, letter: 'A', color: 'bg-blue-100 text-blue-600', grad: 'from-blue-500 to-indigo-600', tag: 'Investing', activity: 'Very Active' },
  { id: 2, name: 'SaaS Founders Club', desc: 'B2B SaaS founders sharing growth metrics, fundraising war stories, and operator playbooks. Monthly revenue milestones celebrated here.', members: 890, letter: 'S', color: 'bg-emerald-100 text-emerald-600', grad: 'from-emerald-500 to-teal-600', tag: 'Startups', activity: 'Active' },
  { id: 3, name: 'AI Builders Circle', desc: 'AI-powered product builders sharing tools, demos, and launch strategies. Stay updated on the latest LLM releases and practical applications.', members: 2100, letter: 'A', color: 'bg-violet-100 text-violet-600', grad: 'from-violet-500 to-purple-700', tag: 'AI', activity: 'Very Active' },
  { id: 4, name: 'Credit & Lending Pros', desc: 'A community of credit analysts, lending officers, and fintech builders sharing best practices, scoring models, and underwriting frameworks.', members: 560, letter: 'C', color: 'bg-amber-100 text-amber-600', grad: 'from-amber-400 to-orange-500', tag: 'Finance', activity: 'Active' },
  { id: 5, name: 'Macro Research Daily', desc: 'Daily macro economic research, global policy commentary, and deep-dive reports. Stay ahead of institutional narratives and position your portfolio accordingly.', members: 1780, letter: 'M', color: 'bg-rose-100 text-rose-600', grad: 'from-rose-500 to-pink-600', tag: 'Research', activity: 'Very Active' },
  { id: 6, name: 'Growth & Revenue Hacks', desc: 'GTM strategies, conversion rate optimization, and revenue growth frameworks. Members share experiments, wins, and playbooks from real companies.', members: 920, letter: 'G', color: 'bg-cyan-100 text-cyan-600', grad: 'from-cyan-500 to-sky-600', tag: 'Growth', activity: 'Active' },
  { id: 7, name: 'Data & Analytics Hub', desc: 'SQL wizards, BI engineers, and data scientists sharing dashboards, metric frameworks, and analytical approaches for product and business decisions.', members: 670, letter: 'D', color: 'bg-indigo-100 text-indigo-600', grad: 'from-indigo-500 to-blue-700', tag: 'Analytics', activity: 'Moderate' },
  { id: 8, name: 'Portfolio Management', desc: 'Build and optimize your investment portfolio using modern portfolio theory, factor models, and AI-assisted rebalancing. Monthly performance reviews included.', members: 430, letter: 'P', color: 'bg-pink-100 text-pink-600', grad: 'from-pink-500 to-rose-600', tag: 'Portfolio', activity: 'Active' },
];

export const DISCOVER_AGENTS = [
  { id: 1, name: 'Finance Assistant', desc: 'Analyze financial data and generate investment insights', category: 'Finance', letter: 'F', color: 'bg-blue-500' },
  { id: 2, name: 'Risk Analyzer', desc: 'Evaluate portfolio risk and suggest hedging strategies', category: 'Finance', letter: 'R', color: 'bg-red-500' },
  { id: 3, name: 'Market Research', desc: 'Research market trends, competitors, and opportunities', category: 'Research', letter: 'M', color: 'bg-emerald-500' },
  { id: 4, name: 'Credit Scorer', desc: 'AI-powered credit assessment for lending decisions', category: 'Finance', letter: 'C', color: 'bg-amber-500' },
  { id: 5, name: 'Growth Advisor', desc: 'Identify the highest-leverage growth opportunities for your business', category: 'Growth', letter: 'G', color: 'bg-violet-500' },
  { id: 6, name: 'News Aggregator', desc: 'Curate and summarize financial news in real-time', category: 'Research', letter: 'N', color: 'bg-cyan-500' },
  { id: 7, name: 'Competitor Intelligence', desc: 'Monitor competitors, track pricing changes, and surface strategic insights', category: 'Research', letter: 'C', color: 'bg-indigo-500' },
  { id: 8, name: 'Revenue Forecaster', desc: 'Model revenue scenarios and forecast business performance using AI', category: 'Finance', letter: 'R', color: 'bg-pink-500' },
];

export const DISCOVER_CONTACTS = [
  { id: 1, name: 'Alex Chen', role: 'Founder & CEO', bio: 'Building the future of AI-driven investment research tools.', twitter: '@alexchen_ai', followers: 12400, initials: 'AC', bgColor: 'bg-blue-500' },
  { id: 2, name: 'Sarah Kim', role: 'Co-founder & CTO', bio: 'ML engineer & fintech architect. prev @Stripe, @Plaid.', twitter: '@sarahkim_dev', followers: 8900, initials: 'SK', bgColor: 'bg-violet-500' },
  { id: 3, name: 'Marcus Rivera', role: null, bio: 'Angel investor & portfolio advisor. Obsessed with capital efficiency.', twitter: null, followers: 15600, initials: 'MR', bgColor: 'bg-emerald-500' },
  { id: 4, name: 'Emily Zhang', role: 'CEO', bio: 'AI-powered credit scoring for the underbanked. ex-Goldman.', twitter: '@emilyzhang', followers: 6700, initials: 'EZ', bgColor: 'bg-amber-500' },
  { id: 5, name: 'David Park', role: 'Head of Research', bio: 'Macro economics & AI agent research. PhD candidate.', twitter: '@dpark_rsch', followers: 4200, initials: 'DP', bgColor: 'bg-rose-500' },
  { id: 6, name: 'Lisa Wang', role: 'Founder & CPO', bio: 'Product-led growth for fintech apps. ex-Figma, ex-Notion.', twitter: null, followers: 3100, initials: 'LW', bgColor: 'bg-cyan-500' },
  { id: 7, name: 'James Liu', role: null, bio: 'Investing in real assets & infrastructure funds since 2019.', twitter: '@jamesliu_vc', followers: 28500, initials: 'JL', bgColor: 'bg-indigo-500' },
  { id: 8, name: 'Nina Patel', role: 'Lead Engineer', bio: 'Backend systems & distributed infra. love hard technical problems.', twitter: null, followers: 5400, initials: 'NP', bgColor: 'bg-pink-500' },
  { id: 9, name: 'Tom Wu', role: 'CFO', bio: 'Treasury management & financial modeling for high-growth startups.', twitter: '@tomwu_fi', followers: 7800, initials: 'TW', bgColor: 'bg-orange-500' },
];

export const AGENT_CATEGORIES = ['All', 'Finance', 'Research', 'Growth'];

// Mock "strangers" database — not in contacts
const STRANGER_DB = [
  { id: 's1', name: 'Alice Zhou', account: '@alicez', email: 'alice@primeresearch.co', role: 'Investment Researcher', mutual: 3, grad: 'from-fuchsia-500 to-pink-500', initials: 'AZ' },
  { id: 's2', name: 'Bob Chen', account: '@bobchen', email: 'bob@capitalfund.io', role: 'Portfolio Manager', mutual: 1, grad: 'from-sky-500 to-blue-500', initials: 'BC' },
  { id: 's3', name: 'Chloe Martin', account: '@chloe_m', email: 'chloe@loka.fi', role: 'Risk & Compliance Lead', mutual: 7, grad: 'from-emerald-500 to-teal-500', initials: 'CM' },
  { id: 's4', name: 'Daniel Lee', account: '@dlee_invest', email: 'd.lee@assetcapital.co', role: 'Alternatives Strategist', mutual: 2, grad: 'from-amber-400 to-orange-400', initials: 'DL' },
  { id: 's5', name: 'Eva Rossi', account: '@evarossi', email: 'eva@finmodels.io', role: 'Quantitative Analyst', mutual: 0, grad: 'from-violet-500 to-purple-500', initials: 'ER' },
  { id: 's6', name: 'Tom Zhang', account: '@tomzhang', email: 'tom@lokafi.xyz', role: 'Revenue Operations', mutual: 4, grad: 'from-rose-500 to-pink-500', initials: 'TZ' },
  { id: 's7', name: 'Jay Park', account: '@jaypark', email: 'jay@growthvc.co', role: 'Growth Investor', mutual: 0, grad: 'from-indigo-500 to-blue-600', initials: 'JP' },
  { id: 's8', name: 'Lena Fischer', account: '@lena_fi', email: 'lena@finresearch.io', role: 'Macro Economist', mutual: 2, grad: 'from-cyan-500 to-sky-500', initials: 'LF' },
  { id: 's9', name: 'Mike Torres', account: '@miketorres', email: 'mike@creditlayer.io', role: 'Credit Analyst', mutual: 1, grad: 'from-orange-400 to-amber-500', initials: 'MT' },
];

const AddFriendModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [q, setQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<typeof STRANGER_DB>([]);
  const [sent, setSent] = useState<Set<string>>(new Set());

  const handleSearch = () => {
    if (!q.trim()) return;
    setSearching(true);
    setSearched(false);
    // Simulate async search
    setTimeout(() => {
      const lower = q.toLowerCase();
      const found = STRANGER_DB.filter(s =>
        s.account.toLowerCase().includes(lower) ||
        s.name.toLowerCase().includes(lower) ||
        s.email.toLowerCase().includes(lower)
      );
      setResults(found);
      setSearched(true);
      setSearching(false);
    }, 600);
  };

  const sendRequest = (id: string) =>
    setSent(prev => { const n = new Set(prev); n.add(id); return n; });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-[15px] font-bold text-gray-900">Add Friend</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Search by account, nickname, or email</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Search bar */}
        <div className="px-5 pt-4 pb-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                autoFocus value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="@account · nickname · email"
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <button onClick={handleSearch}
              className="px-4 py-2.5 bg-gray-900 text-white text-[12px] font-bold rounded-xl hover:bg-gray-700 transition-all shrink-0">
              Search
            </button>
          </div>
          {/* Search hints */}
          {!searched && !searching && (
            <div className="flex gap-2 mt-2.5">
              {['Account ID', 'Nickname', 'Email'].map(hint => (
                <span key={hint} className="text-[10px] font-medium text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">{hint}</span>
              ))}
            </div>
          )}
        </div>

        {/* Results area */}
        <div className="min-h-[120px] max-h-72 overflow-y-auto px-5 pb-4">
          {/* Loading */}
          {searching && (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
              <p className="text-[11px] text-gray-400">Searching...</p>
            </div>
          )}

          {/* No results */}
          {searched && !searching && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-1.5">
              <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <p className="text-[13px] font-semibold text-gray-400">No users found</p>
              <p className="text-[11px] text-gray-300">Try a different account ID or email</p>
            </div>
          )}

          {/* Results */}
          {!searching && results.map(s => {
            const isSent = sent.has(s.id);
            return (
              <div key={s.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.grad} flex items-center justify-center text-[12px] font-black text-white shrink-0`}>
                  {s.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[13px] font-semibold text-gray-900 leading-tight">{s.name}</p>
                    <span className="text-[10px] text-gray-400 font-mono">{s.account}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">{s.role}</p>
                  {s.mutual > 0 && (
                    <p className="text-[10px] text-gray-300 mt-0.5">{s.mutual} mutual connection{s.mutual > 1 ? 's' : ''}</p>
                  )}
                </div>
                <button onClick={() => !isSent && sendRequest(s.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${isSent ? 'bg-gray-100 text-gray-400 cursor-default' : 'bg-gray-900 text-white hover:bg-gray-700'}`}>
                  {isSent ? 'Sent ✓' : 'Add'}
                </button>
              </div>
            );
          })}

          {/* Empty initial state */}
          {!searching && !searched && (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-300">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
              <p className="text-[12px]">Enter a keyword to find people</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12px] font-bold text-gray-500 hover:bg-gray-100 transition-all">Close</button>
        </div>
      </div>
    </div>
  );
};

// ── Create Agent Modal ────────────────────────────────────────────────
export const CreateAgentModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  type AgentType = 'single' | 'multi';
  type MultiMode = 'loka' | 'mirrorfish' | null;
  type Visibility = 'public' | 'group' | 'private';
  type Pricing = 'free' | 'subscription' | 'pay_per_use';
  type Step = 'type' | 'behavior' | 'info' | 'publish' | 'done';

  const STEPS: Step[] = ['type', 'behavior', 'info', 'publish'];
  const STEP_LABELS: Record<Step, string> = {
    type: 'Agent Type',
    behavior: 'Behavior',
    info: 'Basic Info',
    publish: 'Publish',
    done: 'Done',
  };

  const [step, setStep] = useState<Step>('type');
  const [agentType, setAgentType] = useState<AgentType>('single');
  const [multiMode, setMultiMode] = useState<MultiMode>(null);
  const [model, setModel] = useState('gpt-4o');
  const [prompt, setPrompt] = useState('');
  const [capabilities, setCapabilities] = useState<Set<string>>(new Set());
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [category, setCategory] = useState('Research');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [pricing, setPricing] = useState<Pricing>('free');
  const [premiumPrice, setPremiumPrice] = useState('');
  // Cross-Check config
  const [ccDomain, setCcDomain] = useState<string[]>([]);
  const [ccThreshold, setCcThreshold] = useState(67);
  const [ccMode, setCcMode] = useState<'consensus' | 'collaboration'>('consensus');
  const [ccDepth, setCcDepth] = useState<1 | 2 | 3>(2);
  // MirrorFish config
  const [mfSeed, setMfSeed] = useState('');
  const [mfTask, setMfTask] = useState('');
  const [mfFiles, setMfFiles] = useState<File[]>([]);
  const [mfTemperature, setMfTemperature] = useState(50);
  const [mfDuration, setMfDuration] = useState<24 | 72 | 168>(72);
  // Multi-agent model panel: [{modelId, count}]
  const [agentPanel, setAgentPanel] = useState<{ modelId: string; count: number }[]>([
    { modelId: 'gpt-4o', count: 1 }
  ]);
  const totalAgentCount = agentPanel.reduce((s, r) => s + r.count, 0);
  const updatePanelRow = (idx: number, field: 'modelId' | 'count', val: string | number) =>
    setAgentPanel(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  const removePanelRow = (idx: number) =>
    setAgentPanel(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  const addPanelRow = () =>
    setAgentPanel(prev => [...prev, { modelId: 'gpt-4o', count: 1 }]);
  const [openPanelDropdown, setOpenPanelDropdown] = useState<number | null>(null);

  const stepIdx = STEPS.indexOf(step);
  const canNext = step === 'type'
    ? (agentType === 'single' || multiMode !== null)
    : step === 'behavior'
      ? (agentType === 'multi' && multiMode === 'mirrorfish' ? mfSeed.trim().length > 0 : prompt.trim().length > 0)
      : step === 'info'
        ? name.trim().length > 0
        : true;


  const MODELS = [
    { id: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
    { id: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'OpenAI' },
    { id: 'gpt-3-5-turbo', label: 'GPT-3.5 Turbo', provider: 'OpenAI' },
    { id: 'claude-3-5', label: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
    { id: 'claude-3-haiku', label: 'Claude 3 Haiku', provider: 'Anthropic' },
    { id: 'gemini-1-5-pro', label: 'Gemini 1.5 Pro', provider: 'Google' },
    { id: 'gemini-flash', label: 'Gemini 1.5 Flash', provider: 'Google' },
    { id: 'loka-fast', label: 'Loka Fast', provider: 'Loka' },
  ];
  const modelDotColor = (id: string) =>
    id.startsWith('gpt') ? 'bg-green-500' : id.startsWith('claude') ? 'bg-violet-500' : id.startsWith('gemini') ? 'bg-blue-500' : 'bg-indigo-400';
  const CATEGORIES = ['Research', 'Analysis', 'Strategy', 'Data', 'Forecasting', 'Automation'];
  const CAPS = ['Web Search', 'File Analysis', 'On-chain Data', 'Chart Generation'];

  const toggleCap = (c: string) =>
    setCapabilities(prev => { const n = new Set(prev); n.has(c) ? n.delete(c) : n.add(c); return n; });

  const next = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };
  const prev = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-gray-50 md:bg-gray-100/80">
      <div className="flex-1 p-4 sm:p-8 md:p-10 lg:p-12 max-w-[960px] mx-auto w-full pb-24 animate-fadeIn">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {stepIdx > 0 && step !== 'done' && (
              <button onClick={prev} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
            )}
            <div>
              <h1 className="text-[20px] font-semibold text-gray-900">
                {agentType === 'multi' && stepIdx > 0 ? 'Create Multi-agent' : 'Create Agent'}
              </h1>
              {step !== 'done' && (
                <p className="text-[12px] text-gray-400 mt-0.5">Step {stepIdx + 1} of 4 — {STEP_LABELS[step]}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-1.5">
              {STEPS.map((s, i) => (
                <div key={s} className={`w-2 h-2 rounded-full transition-all ${i <= stepIdx ? 'bg-gray-900' : 'bg-gray-200'}`} />
              ))}
            </div>
            <button onClick={onClose} className="text-[12px] font-medium text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
          </div>
        </div>

        {/* Body Card — hidden when done (done screen is rendered outside) */}
        {step !== 'done' && <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">

          {/* ── Step 1: Agent Type ── */}
          {step === 'type' && (
            <div>
              <p className="text-[12px] text-gray-400 mb-5">Choose how your agent operates. You can always change this later.</p>

              {/* ── Top: Single vs Multi (side-by-side) ── */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Single Agent Card */}
                <button
                  onClick={() => { setAgentType('single'); setMultiMode(null); }}
                  className={`relative p-5 rounded-2xl border-2 text-left transition-all overflow-hidden group ${agentType === 'single' ? 'border-gray-900 ring-1 ring-gray-900/5' : 'border-gray-100 hover:border-gray-300'
                    }`}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <p className="text-[14px] font-bold text-gray-900 mb-1">Single Agent</p>
                    <p className="text-[11px] text-gray-400 leading-relaxed">A standalone AI with custom persona, instructions, and tools. Best for focused tasks.</p>
                    {agentType === 'single' && (
                      <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-gray-700">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        Selected
                      </div>
                    )}
                  </div>
                </button>

                {/* Multi-Agent Card */}
                <button
                  onClick={() => setAgentType('multi')}
                  className={`relative p-5 rounded-2xl border-2 text-left transition-all overflow-hidden group ${agentType === 'multi' ? 'border-gray-900 ring-1 ring-gray-900/5' : 'border-gray-100 hover:border-gray-300'
                    }`}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <p className="text-[14px] font-bold text-gray-900">Multi-Agent</p>
                      <span className="text-[9px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">Advanced</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">Multiple agents collaborate to deliver more reliable and powerful results.</p>
                    {agentType === 'multi' && (
                      <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-gray-700">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        Choose a mode below
                      </div>
                    )}
                  </div>
                </button>
              </div>

              {/* ── Multi-Agent Mode Selection ── */}
              {agentType === 'multi' && (
                <div className="animate-fadeIn">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Choose collaboration mode</p>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Cross-Check Precision */}
                    <div
                      onClick={() => setMultiMode('loka')}
                      className={`relative rounded-2xl border text-left transition-all cursor-pointer overflow-hidden flex flex-col ${multiMode === 'loka' ? 'border-indigo-300 shadow-sm shadow-indigo-100' : 'border-gray-150 hover:border-gray-200 bg-white'
                        }`}
                    >
                      {/* Hero: Cross-Check — compact triangle */}
                      <div className="h-28 bg-slate-50 flex items-center justify-center">
                        <svg viewBox="0 0 160 96" width="160" height="96" fill="none" xmlns="http://www.w3.org/2000/svg">
                          {/* 3 nodes: tight equilateral triangle */}
                          {/* A — top */}
                          <circle cx="80" cy="20" r="10" fill="white" stroke="#6366f1" strokeWidth="1.2" />
                          <path d="M76.5 20l2.5 2.5 5-5" stroke="#6366f1" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          {/* B — bottom-left */}
                          <circle cx="44" cy="78" r="10" fill="white" stroke="#6366f1" strokeWidth="1.2" />
                          <path d="M40.5 78l2.5 2.5 5-5" stroke="#6366f1" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          {/* C — bottom-right */}
                          <circle cx="116" cy="78" r="10" fill="white" stroke="#6366f1" strokeWidth="1.2" />
                          <path d="M112.5 78l2.5 2.5 5-5" stroke="#6366f1" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          {/* Edges */}
                          <line x1="74" y1="29" x2="50" y2="69" stroke="#c7d2fe" strokeWidth="0.8" strokeDasharray="4 3" />
                          <line x1="86" y1="29" x2="110" y2="69" stroke="#c7d2fe" strokeWidth="0.8" strokeDasharray="4 3" />
                          <line x1="54" y1="78" x2="106" y2="78" stroke="#c7d2fe" strokeWidth="0.8" strokeDasharray="4 3" />
                        </svg>
                      </div>
                      {/* Content */}
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[13px] font-semibold text-gray-900">Cross-Check Precision</p>
                          <div className={`w-4 h-4 rounded-full border-2 transition-all shrink-0 ${multiMode === 'loka' ? 'border-indigo-500 bg-indigo-500' : 'border-gray-200'
                            }`}>
                            {multiMode === 'loka' && <div className="w-1.5 h-1.5 rounded-full bg-white mx-auto mt-[3px]" />}
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-relaxed mb-3">Agents cross-verify each other's output for maximum factual accuracy.</p>
                        <div className="border-t border-gray-100 pt-3 mt-auto">
                          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Ideal for</p>
                          <div className="space-y-1.5">
                            {[
                              { icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z', title: 'Financial Report Audit' },
                              { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', title: 'Legal Document Review' },
                              { icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4', title: 'Code Quality Analysis' },
                              { icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', title: 'Research Fact-Check' },
                            ].map(ex => (
                              <div key={ex.title} className="flex items-center gap-2 py-0.5">
                                <div className="w-4 h-4 rounded bg-slate-100 flex items-center justify-center shrink-0">
                                  <svg className="w-2.5 h-2.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={ex.icon} /></svg>
                                </div>
                                <p className="text-[10px] text-gray-500">{ex.title}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Predictive Insight */}
                    <div
                      onClick={() => setMultiMode('mirrorfish')}
                      className={`relative rounded-2xl border text-left transition-all cursor-pointer overflow-hidden flex flex-col ${multiMode === 'mirrorfish' ? 'border-indigo-300 shadow-sm shadow-indigo-100' : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                      {/* Hero: Predictive — compact fan tree */}
                      <div className="h-28 bg-slate-50 flex items-center justify-center">
                        <svg viewBox="0 0 160 96" width="160" height="96" fill="none" xmlns="http://www.w3.org/2000/svg">
                          {/* Root */}
                          <circle cx="80" cy="14" r="9" fill="white" stroke="#6366f1" strokeWidth="1.2" />
                          <circle cx="80" cy="14" r="3.5" fill="#6366f1" opacity="0.35" />
                          {/* L1 branches */}
                          <line x1="74" y1="22" x2="50" y2="46" stroke="#a5b4fc" strokeWidth="0.9" strokeDasharray="3.5 2.5" />
                          <line x1="80" y1="23" x2="80" y2="46" stroke="#a5b4fc" strokeWidth="0.9" strokeDasharray="3.5 2.5" />
                          <line x1="86" y1="22" x2="110" y2="46" stroke="#a5b4fc" strokeWidth="0.9" strokeDasharray="3.5 2.5" />
                          {/* L1 nodes */}
                          <circle cx="50" cy="48" r="6" fill="white" stroke="#818cf8" strokeWidth="1" />
                          <circle cx="80" cy="48" r="6" fill="white" stroke="#818cf8" strokeWidth="1" />
                          <circle cx="110" cy="48" r="6" fill="white" stroke="#818cf8" strokeWidth="1" />
                          {/* L2 branches from each */}
                          <line x1="45" y1="54" x2="32" y2="76" stroke="#c7d2fe" strokeWidth="0.7" strokeDasharray="3 2" />
                          <line x1="55" y1="54" x2="58" y2="76" stroke="#c7d2fe" strokeWidth="0.7" strokeDasharray="3 2" />
                          <line x1="76" y1="54" x2="70" y2="76" stroke="#c7d2fe" strokeWidth="0.7" strokeDasharray="3 2" />
                          <line x1="84" y1="54" x2="90" y2="76" stroke="#c7d2fe" strokeWidth="0.7" strokeDasharray="3 2" />
                          <line x1="105" y1="54" x2="102" y2="76" stroke="#c7d2fe" strokeWidth="0.7" strokeDasharray="3 2" />
                          <line x1="115" y1="54" x2="124" y2="76" stroke="#c7d2fe" strokeWidth="0.7" strokeDasharray="3 2" />
                          {/* L2 dots */}
                          <circle cx="32" cy="78" r="3" fill="#c7d2fe" />
                          <circle cx="58" cy="78" r="3" fill="#c7d2fe" />
                          <circle cx="70" cy="78" r="3" fill="#c7d2fe" />
                          <circle cx="90" cy="78" r="3" fill="#c7d2fe" />
                          <circle cx="102" cy="78" r="3" fill="#c7d2fe" />
                          <circle cx="124" cy="78" r="3" fill="#c7d2fe" />
                        </svg>
                      </div>
                      {/* Content */}
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[13px] font-semibold text-gray-900">Predictive Insight</p>
                            <span className="text-[8px] font-semibold text-indigo-400 bg-indigo-50 border border-indigo-100 px-1 py-0.5 rounded">Prediction</span>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 transition-all shrink-0 ${multiMode === 'mirrorfish' ? 'border-indigo-500 bg-indigo-500' : 'border-gray-200'
                            }`}>
                            {multiMode === 'mirrorfish' && <div className="w-1.5 h-1.5 rounded-full bg-white mx-auto mt-[3px]" />}
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-relaxed mb-3">Multiple models debate to generate probabilistic forecasts and trends.</p>
                        <div className="border-t border-gray-100 pt-3 mt-auto">
                          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Try something like</p>
                          <div className="space-y-1.5">
                            {[
                              { icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Predict BTC Price Tomorrow' },
                              { icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z', title: 'Forecast Q2 Market Trends' },
                              { icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', title: 'Predict Story Endings (Novel)' },
                              { icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Election Outcome Analysis' },
                            ].map(ex => (
                              <div key={ex.title} className="flex items-center gap-2 py-0.5">
                                <div className="w-4 h-4 rounded bg-slate-100 flex items-center justify-center shrink-0">
                                  <svg className="w-2.5 h-2.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={ex.icon} /></svg>
                                </div>
                                <p className="text-[10px] text-gray-500">{ex.title}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}








          {/* ── Step 2: Behavior ── */}
          {step === 'behavior' && (
            <div className="space-y-4">
              {/* Model — single pick for single; dynamic panel for multi-agent */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[13px] font-semibold text-gray-500">
                    {agentType === 'multi' ? 'Agent Panel' : 'Model'}
                  </label>
                  {agentType === 'multi' && (
                    <span className="text-[12px] text-gray-400">
                      {totalAgentCount} agent{totalAgentCount !== 1 ? 's' : ''} total
                    </span>
                  )}
                </div>

                {/* Single: radio list */}
                {agentType === 'single' && (
                  <div className="space-y-2">
                    {MODELS.map(m => (
                      <button key={m.id} onClick={() => setModel(m.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${model === m.id ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                          }`}
                      >
                        <div className={`w-2 h-2 rounded-full shrink-0 ${modelDotColor(m.id)}`} />
                        <div className="flex-1">
                          <p className="text-[13px] font-bold text-gray-900">{m.label}</p>
                          <p className="text-[12px] text-gray-400">{m.provider}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${model === m.id ? 'border-gray-900 bg-gray-900' : 'border-gray-200'
                          }`}>
                          {model === m.id && <div className="w-1.5 h-1.5 rounded-full bg-white mx-auto mt-[2px]" />}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Multi: dynamic panel builder */}
                {agentType === 'multi' && (
                  <div className="space-y-2">
                    {agentPanel.map((row, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-100 bg-gray-50/60">
                        {/* Color dot */}
                        <div className={`w-2 h-2 rounded-full shrink-0 ${modelDotColor(row.modelId)}`} />

                        {/* Custom dropdown */}
                        <div className="relative w-48">
                          <button
                            onClick={() => setOpenPanelDropdown(openPanelDropdown === idx ? null : idx)}
                            className="w-full flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[13px] font-medium text-gray-800 hover:border-gray-300 transition-all text-left"
                          >
                            <span className="flex-1 truncate">{MODELS.find(m => m.id === row.modelId)?.label}</span>
                            <svg className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${openPanelDropdown === idx ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {openPanelDropdown === idx && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenPanelDropdown(null)} />
                              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-20 min-w-full py-1 overflow-hidden">
                                {MODELS.map(m => (
                                  <button
                                    key={m.id}
                                    onClick={() => { updatePanelRow(idx, 'modelId', m.id); setOpenPanelDropdown(null); }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-[12px] transition-colors ${row.modelId === m.id
                                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                      : 'text-gray-700 hover:bg-gray-50'
                                      }`}
                                  >
                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${modelDotColor(m.id)}`} />
                                    <span className="flex-1">{m.label}</span>
                                    <span className="text-[12px] text-gray-400">{m.provider}</span>
                                    {row.modelId === m.id && (
                                      <svg className="w-3 h-3 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Count input */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[12px] text-gray-400">×</span>
                          <input
                            type="number" min={1} max={20} value={row.count}
                            onChange={e => updatePanelRow(idx, 'count', Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                            className="w-20 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-[13px] font-semibold text-gray-800 text-center focus:outline-none focus:border-indigo-300"
                          />
                          <span className="text-[12px] text-gray-400">agent{row.count !== 1 ? 's' : ''}</span>
                        </div>

                        {/* Remove row */}
                        <button
                          onClick={() => removePanelRow(idx)}
                          disabled={agentPanel.length === 1}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-200 transition-all disabled:opacity-20 disabled:cursor-not-allowed shrink-0"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                    {/* Add row button */}
                    <button
                      onClick={addPanelRow}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-gray-200 text-[11px] font-medium text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all w-full"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Add another model
                    </button>
                  </div>
                )}
              </div>

              {/* System prompt — skip for MirrorFish */}
              {(agentType === 'single' || multiMode === 'loka') && (
                <div>
                  <label className="text-[13px] font-semibold text-gray-500 mb-2 block">Background Context</label>
                  <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder={agentType === 'multi'
                      ? 'Provide background context or domain information for the agent panel...'
                      : 'Describe the role, background, and expertise of this agent...'}
                    className="w-full h-32 px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 placeholder-gray-300 focus:outline-none focus:border-gray-400 resize-none leading-relaxed"
                  />
                </div>
              )}

              {/* ── Cross-Check Precision config ── */}
              {agentType === 'multi' && multiMode === 'loka' && (
                <div className="space-y-5 pt-1">

                  {/* Decision Mode — FIRST, with SVG illustrations */}
                  <div>
                    <label className="text-[13px] font-semibold text-gray-500 mb-2 block">Decision Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Consensus card */}
                      <button onClick={() => setCcMode('consensus')}
                        className={`rounded-xl border text-left transition-all overflow-hidden ${ccMode === 'consensus' ? 'border-indigo-300 shadow-sm shadow-indigo-100' : 'border-gray-100 hover:border-gray-200'
                          }`}
                      >
                        {/* SVG: all agents output full answers, then debate → merge */}
                        <div className="h-20 bg-slate-50 flex items-center justify-center">
                          <svg viewBox="0 0 140 72" width="140" height="72" fill="none">
                            {/* 3 agent nodes on left */}
                            <circle cx="22" cy="18" r="8" fill="white" stroke="#6366f1" strokeWidth="1.2" />
                            <circle cx="22" cy="36" r="8" fill="white" stroke="#6366f1" strokeWidth="1.2" />
                            <circle cx="22" cy="54" r="8" fill="white" stroke="#6366f1" strokeWidth="1.2" />
                            {/* Speech bubble dots = full answer */}
                            {[18, 36, 54].map(y => <>
                              <circle key={`d1-${y}`} cx="18" cy={y} r="1.2" fill="#6366f1" />
                              <circle key={`d2-${y}`} cx="22" cy={y} r="1.2" fill="#6366f1" />
                              <circle key={`d3-${y}`} cx="26" cy={y} r="1.2" fill="#6366f1" />
                            </>)}
                            {/* Arrows right toward center discussion */}
                            <line x1="30" y1="18" x2="60" y2="36" stroke="#a5b4fc" strokeWidth="0.9" strokeDasharray="3 2" />
                            <line x1="30" y1="36" x2="60" y2="36" stroke="#a5b4fc" strokeWidth="0.9" strokeDasharray="3 2" />
                            <line x1="30" y1="54" x2="60" y2="36" stroke="#a5b4fc" strokeWidth="0.9" strokeDasharray="3 2" />
                            {/* Discussion circle */}
                            <circle cx="75" cy="36" r="14" fill="white" stroke="#818cf8" strokeWidth="1" />
                            {/* Debate arrows inside */}
                            <path d="M67 33 Q75 28 83 33" stroke="#818cf8" strokeWidth="0.9" fill="none" markerEnd="url(#arr)" />
                            <path d="M83 39 Q75 44 67 39" stroke="#818cf8" strokeWidth="0.9" fill="none" />
                            {/* Arrow out to result */}
                            <line x1="89" y1="36" x2="112" y2="36" stroke="#6366f1" strokeWidth="1" />
                            <polygon points="112,33 118,36 112,39" fill="#6366f1" />
                            {/* Result node */}
                            <circle cx="126" cy="36" r="8" fill="#eef2ff" stroke="#6366f1" strokeWidth="1.2" />
                            <path d="M122.5 36l2.5 2.5 5-5" stroke="#6366f1" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div className="p-3">
                          <p className={`text-[13px] font-semibold mb-0.5 ${ccMode === 'consensus' ? 'text-indigo-700' : 'text-gray-700'}`}>Consensus</p>
                          <p className="text-[11px] text-gray-400 leading-tight">Each agent produces a full answer, then agents debate until agreement is reached.</p>
                        </div>
                      </button>

                      {/* Collaboration card */}
                      <button onClick={() => setCcMode('collaboration')}
                        className={`rounded-xl border text-left transition-all overflow-hidden ${ccMode === 'collaboration' ? 'border-indigo-300 shadow-sm shadow-indigo-100' : 'border-gray-100 hover:border-gray-200'
                          }`}
                      >
                        {/* SVG: 4 agents each handle one part → combined output */}
                        <div className="h-20 bg-slate-50 flex items-center justify-center">
                          <svg viewBox="0 0 140 72" width="140" height="72" fill="none">
                            {/* 4 agent nodes stacked */}
                            <circle cx="22" cy="12" r="7" fill="white" stroke="#6366f1" strokeWidth="1.2" />
                            <circle cx="22" cy="28" r="7" fill="white" stroke="#6366f1" strokeWidth="1.2" />
                            <circle cx="22" cy="44" r="7" fill="white" stroke="#6366f1" strokeWidth="1.2" />
                            <circle cx="22" cy="60" r="7" fill="white" stroke="#6366f1" strokeWidth="1.2" />
                            {/* Partial output bars (each has 1 bar = one part) */}
                            <rect x="33" y="10" width="20" height="4" rx="2" fill="#c7d2fe" />
                            <rect x="33" y="26" width="20" height="4" rx="2" fill="#a5b4fc" />
                            <rect x="33" y="42" width="20" height="4" rx="2" fill="#818cf8" />
                            <rect x="33" y="58" width="20" height="4" rx="2" fill="#6366f1" />
                            {/* Merge arrows */}
                            <line x1="53" y1="12" x2="82" y2="30" stroke="#a5b4fc" strokeWidth="0.8" strokeDasharray="3 2" />
                            <line x1="53" y1="28" x2="82" y2="33" stroke="#a5b4fc" strokeWidth="0.8" strokeDasharray="3 2" />
                            <line x1="53" y1="44" x2="82" y2="39" stroke="#a5b4fc" strokeWidth="0.8" strokeDasharray="3 2" />
                            <line x1="53" y1="60" x2="82" y2="42" stroke="#a5b4fc" strokeWidth="0.8" strokeDasharray="3 2" />
                            {/* Assembled output block */}
                            <rect x="82" y="26" width="28" height="4" rx="2" fill="#c7d2fe" />
                            <rect x="82" y="32" width="28" height="4" rx="2" fill="#a5b4fc" />
                            <rect x="82" y="38" width="28" height="4" rx="2" fill="#818cf8" />
                            <rect x="82" y="44" width="28" height="4" rx="2" fill="#6366f1" />
                            {/* Border around assembled */}
                            <rect x="81" y="24" width="30" height="26" rx="3" stroke="#6366f1" strokeWidth="1" fill="none" />
                            {/* Arrow to final */}
                            <line x1="111" y1="36" x2="124" y2="36" stroke="#6366f1" strokeWidth="1" />
                            <polygon points="124,33 130,36 124,39" fill="#6366f1" />
                          </svg>
                        </div>
                        <div className="p-3">
                          <p className={`text-[13px] font-semibold mb-0.5 ${ccMode === 'collaboration' ? 'text-indigo-700' : 'text-gray-700'}`}>Collaboration</p>
                          <p className="text-[11px] text-gray-400 leading-tight">Each agent handles one segment; results are assembled into a unified output.</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Agreement threshold — Consensus only */}
                  {ccMode === 'consensus' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[13px] font-semibold text-gray-500">Agreement Threshold</label>
                        <span className="text-[12px] font-semibold text-indigo-600">{ccThreshold}%</span>
                      </div>
                      <p className="text-[12px] text-gray-400 mb-2.5">When this percentage of agents reach the same conclusion, it counts as a pass.</p>
                      <div className="relative">
                        <input type="range" min={50} max={95} step={5} value={ccThreshold}
                          onChange={e => setCcThreshold(Number(e.target.value))}
                          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                          style={{ background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${(ccThreshold - 50) / 45 * 100}%, #e5e7eb ${(ccThreshold - 50) / 45 * 100}%, #e5e7eb 100%)` }}
                        />
                        <div className="flex justify-between mt-1">
                          <span className="text-[11px] text-gray-400">Lenient 50%</span>
                          <span className="text-[11px] text-gray-400">Strict 95%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Analysis depth — Consensus only */}
                  {ccMode === 'consensus' && (
                    <div>
                      <label className="text-[13px] font-semibold text-gray-500 mb-2 block">Analysis Depth</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { rounds: 1 as const, label: 'Fast', sub: '1 round' },
                          { rounds: 2 as const, label: 'Standard', sub: '2 rounds' },
                          { rounds: 3 as const, label: 'Deep', sub: '3 rounds' },
                        ].map(d => (
                          <button key={d.rounds} onClick={() => setCcDepth(d.rounds)}
                            className={`p-2.5 rounded-xl border text-left transition-all ${ccDepth === d.rounds ? 'border-indigo-300 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'
                              }`}
                          >
                            <p className={`text-[13px] font-semibold mb-0.5 ${ccDepth === d.rounds ? 'text-indigo-700' : 'text-gray-700'}`}>{d.label}</p>
                            <p className="text-[11px] text-gray-400">{d.sub}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── MirrorFish / Predictive config ── */}
              {agentType === 'multi' && multiMode === 'mirrorfish' && (
                <div className="space-y-5 pt-1">

                  {/* 1. Background Context (Seed) */}
                  <div>
                    <label className="text-[13px] font-semibold text-gray-700 mb-1 block">Background Context</label>
                    <p className="text-[12px] text-gray-400 mb-2.5">Provide background information as the seed for the simulation. You can type directly or upload a file.</p>
                    <textarea
                      value={mfSeed}
                      onChange={e => setMfSeed(e.target.value)}
                      placeholder="e.g. Recent macro data, company financials, event context..."
                      className="w-full h-24 px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 placeholder-gray-300 focus:outline-none focus:border-indigo-300 resize-none leading-relaxed"
                    />
                    {/* File upload */}
                    <div className="mt-2">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="file"
                          multiple
                          accept=".txt,.pdf,.md,.csv,.json,.docx"
                          className="hidden"
                          onChange={e => setMfFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
                        />
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-gray-200 text-[12px] text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/40 transition-all">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          Attach file
                        </div>
                      </label>
                      {/* Attached file chips */}
                      {mfFiles.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {mfFiles.map((f, i) => (
                            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-[11px] text-gray-600">
                              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="max-w-[120px] truncate">{f.name}</span>
                              <button
                                onClick={() => setMfFiles(prev => prev.filter((_, j) => j !== i))}
                                className="text-gray-400 hover:text-gray-700 transition-colors ml-0.5"
                              >×</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. Task */}
                  <div>
                    <label className="text-[13px] font-semibold text-gray-700 mb-1 block">Task</label>
                    <p className="text-[12px] text-gray-400 mb-2.5">Describe the specific scenario or event you want the agents to simulate and forecast.</p>
                    <textarea
                      value={mfTask}
                      onChange={e => setMfTask(e.target.value)}
                      placeholder="e.g. Predict BTC price movement in the 72 hours following the next Fed rate decision..."
                      className="w-full h-24 px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 placeholder-gray-300 focus:outline-none focus:border-indigo-300 resize-none leading-relaxed"
                    />
                  </div>

                  {/* Creativity / Temperature */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[13px] font-semibold text-gray-500">Creativity</label>
                      <span className="text-[12px] text-gray-400">
                        {mfTemperature < 35 ? 'Conservative' : mfTemperature < 65 ? 'Balanced' : 'Exploratory'}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-400 mb-2.5">Higher values produce more speculative, diverse forecasts; lower stays closer to consensus.</p>
                    <input type="range" min={0} max={100} step={5} value={mfTemperature}
                      onChange={e => setMfTemperature(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{ background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${mfTemperature}%, #e5e7eb ${mfTemperature}%, #e5e7eb 100%)` }}
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-[11px] text-gray-400">Conservative</span>
                      <span className="text-[11px] text-gray-400">Exploratory</span>
                    </div>
                  </div>

                  {/* Simulation duration */}
                  <div>
                    <label className="text-[13px] font-semibold text-gray-500 mb-2 block">Simulation Depth</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { h: 24 as const, label: 'Fast', sub: '24 hours' },
                        { h: 72 as const, label: 'Standard', sub: '72 hours' },
                        { h: 168 as const, label: 'Deep', sub: '7 days' },
                      ].map(d => (
                        <button key={d.h} onClick={() => setMfDuration(d.h)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${mfDuration === d.h ? 'border-indigo-300 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'
                            }`}
                        >
                          <p className={`text-[13px] font-semibold mb-0.5 ${mfDuration === d.h ? 'text-indigo-700' : 'text-gray-700'}`}>{d.label}</p>
                          <p className="text-[11px] text-gray-400">{d.sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Capabilities */}
              <div>
                <label className="text-[13px] font-semibold text-gray-500 mb-2 block">Capabilities</label>
                <div className="grid grid-cols-2 gap-2">
                  {CAPS.map(c => (
                    <button key={c} onClick={() => toggleCap(c)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all ${capabilities.has(c) ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                        }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${capabilities.has(c) ? 'bg-gray-900 border-gray-900' : 'border-gray-300'
                        }`}>
                        {capabilities.has(c) && <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className="text-[11px] font-medium text-gray-700">{c}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Basic Info ── */}
          {step === 'info' && (
            <div className="space-y-4">
              {/* Avatar upload */}
              <div className="flex justify-center mb-2">
                <label className="cursor-pointer group relative">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        setAvatarUrl(url);
                      }
                    }}
                  />
                  {/* Preview or placeholder */}
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md relative">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-2xl">
                        {name ? name[0].toUpperCase() : '🤖'}
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 text-center mt-1.5">Upload photo</p>
                </label>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-gray-500 mb-1.5 block">Name *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Market Research Assistant"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 placeholder-gray-300 focus:outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-gray-500 mb-1.5 block">Description</label>
                <textarea
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="A short description to help others understand what this agent does..."
                  className="w-full h-20 px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 placeholder-gray-300 focus:outline-none focus:border-gray-400 resize-none"
                />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-gray-500 mb-1.5 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setCategory(c)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${category === c ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}>{c}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Publish ── */}
          {step === 'publish' && (
            <div className="space-y-5">
              {/* Visibility */}
              <div>
                <label className="text-[13px] font-semibold text-gray-500 mb-2 block">Visibility</label>
                <div className="space-y-2">
                  {([
                    {
                      id: 'public' as const, label: 'Public', desc: 'Anyone on Loka can discover and use this agent.',
                      icon: <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="1.5" /><path strokeLinecap="round" strokeWidth="1.5" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" /></svg>
                    },
                    {
                      id: 'group' as const, label: 'Group', desc: 'Only members of your groups can access this agent.',
                      icon: <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    },
                    {
                      id: 'private' as const, label: 'Private', desc: 'Only you can see and use this agent.',
                      icon: <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" strokeWidth="1.5" /><path strokeLinecap="round" strokeWidth="1.5" d="M7 11V7a5 5 0 0110 0v4" /></svg>
                    },
                  ]).map(v => (
                    <button key={v.id} onClick={() => setVisibility(v.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${visibility === v.id ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                        }`}
                    >
                      {v.icon}
                      <div className="flex-1">
                        <p className="text-[13px] font-bold text-gray-900">{v.label}</p>
                        <p className="text-[12px] text-gray-400">{v.desc}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${visibility === v.id ? 'border-gray-900 bg-gray-900' : 'border-gray-200'
                        }`}>
                        {visibility === v.id && <div className="w-1.5 h-1.5 rounded-full bg-white mx-auto mt-[2px]" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div>
                <label className="text-[13px] font-semibold text-gray-500 mb-2 block">Creator Premium</label>
                <div className="space-y-2">
                  <button onClick={() => setPricing('free')}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${pricing === 'free' ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                      }`}
                  >
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-gray-900">Free</p>
                      <p className="text-[12px] text-gray-400">Users only pay the model base cost. No extra charge from you.</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${pricing === 'free' ? 'border-gray-900 bg-gray-900' : 'border-gray-200'}`}>
                      {pricing === 'free' && <div className="w-1.5 h-1.5 rounded-full bg-white mx-auto mt-[2px]" />}
                    </div>
                  </button>
                  <button onClick={() => setPricing('subscription')}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${pricing === 'subscription' ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                      }`}
                  >
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-gray-900">Subscription</p>
                      <p className="text-[12px] text-gray-400">Users pay a monthly fee to access your agent.</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${pricing === 'subscription' ? 'border-gray-900 bg-gray-900' : 'border-gray-200'}`}>
                      {pricing === 'subscription' && <div className="w-1.5 h-1.5 rounded-full bg-white mx-auto mt-[2px]" />}
                    </div>
                  </button>
                  {pricing === 'subscription' && (
                    <div className="ml-4 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <input type="number" value={premiumPrice} onChange={e => setPremiumPrice(e.target.value)}
                          placeholder="0.00" className="w-24 px-3 py-1.5 rounded-lg border border-gray-200 text-[13px] text-gray-800 focus:outline-none focus:border-gray-400" />
                        <span className="text-[11px] text-gray-400 font-medium">USDC / month</span>
                      </div>
                      <p className="text-[11px] text-amber-600 flex items-center gap-1">
                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Platform takes a 10% fee. You receive {premiumPrice ? (Number(premiumPrice) * 0.9).toFixed(2) : '—'} USDC / month.
                      </p>
                    </div>
                  )}
                  <button onClick={() => setPricing('pay_per_use')}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${pricing === 'pay_per_use' ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                      }`}
                  >
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-gray-900">Pay per use</p>
                      <p className="text-[12px] text-gray-400">Charge an extra fee on top of model cost per message.</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${pricing === 'pay_per_use' ? 'border-gray-900 bg-gray-900' : 'border-gray-200'}`}>
                      {pricing === 'pay_per_use' && <div className="w-1.5 h-1.5 rounded-full bg-white mx-auto mt-[2px]" />}
                    </div>
                  </button>
                  {pricing === 'pay_per_use' && (
                    <div className="ml-4 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <input type="number" value={premiumPrice} onChange={e => setPremiumPrice(e.target.value)}
                          placeholder="0.00" className="w-24 px-3 py-1.5 rounded-lg border border-gray-200 text-[13px] text-gray-800 focus:outline-none focus:border-gray-400" />
                        <span className="text-[11px] text-gray-400 font-medium">USDC / message</span>
                      </div>
                      <p className="text-[11px] text-amber-600 flex items-center gap-1">
                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Platform takes a 10% fee. You receive {premiumPrice ? (Number(premiumPrice) * 0.9).toFixed(4) : '—'} USDC / message.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>}

        {/* ── Done: Success screen ── */}
        {step === 'done' && (
          <div className="flex flex-col items-center justify-center py-12 text-center">

            {/* Celebration icon */}
            <div className="relative mb-6"
              style={{ animation: 'scaleIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
              {/* Outer glow ring */}
              <div className="w-24 h-24 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center">
                  {/* Sparkle / check */}
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    style={{ strokeDasharray: 30, strokeDashoffset: 30, animation: 'drawCheck 0.4s ease 0.35s forwards' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              {/* Decorative dots */}
              <span style={{ position: 'absolute', top: '-4px', right: '4px', width: 8, height: 8, borderRadius: '50%', background: '#6366f1', animation: 'popIn 0.3s ease 0.5s both' }} />
              <span style={{ position: 'absolute', top: '10px', right: '-8px', width: 5, height: 5, borderRadius: '50%', background: '#a5b4fc', animation: 'popIn 0.3s ease 0.6s both' }} />
              <span style={{ position: 'absolute', bottom: '4px', right: '-6px', width: 6, height: 6, borderRadius: '50%', background: '#4f46e5', animation: 'popIn 0.3s ease 0.7s both' }} />
              <span style={{ position: 'absolute', top: '-2px', left: '6px', width: 6, height: 6, borderRadius: '50%', background: '#c7d2fe', animation: 'popIn 0.3s ease 0.55s both' }} />
              <span style={{ position: 'absolute', bottom: '2px', left: '-6px', width: 5, height: 5, borderRadius: '50%', background: '#818cf8', animation: 'popIn 0.3s ease 0.65s both' }} />
            </div>

            <h2 className="text-[20px] font-bold text-gray-900 mb-1.5">Agent published!</h2>
            <p className="text-[13px] text-gray-400 mb-6 max-w-[220px] leading-relaxed">
              <span className="font-semibold text-gray-700">{name || 'Your agent'}</span> is now live
              {visibility === 'public' ? ' and discoverable by everyone' : visibility === 'group' ? ' for your group members' : ' (private)'}.
            </p>

            {/* Summary chips */}
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              {agentType === 'multi' && multiMode && (
                <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-semibold">
                  {multiMode === 'loka' ? 'Cross-check' : 'MirrorFace'}
                </span>
              )}
              {agentType !== 'multi' && (
                <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-[11px] font-semibold">
                  {MODELS.find(m => m.id === model)?.label}
                </span>
              )}
              {category && (
                <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-[11px] font-semibold">
                  {category}
                </span>
              )}
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${pricing === 'free' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                }`}>
                {pricing === 'free' ? 'Free' : pricing === 'subscription' ? `${premiumPrice || '—'} USDC/mo` : `${premiumPrice || '—'} USDC/msg`}
              </span>
            </div>

            {/* CTAs */}
            <div className="flex gap-2.5">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-500 hover:bg-gray-50 transition-all"
              >
                Close
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-[13px] font-bold transition-all active:scale-[0.98] flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Chat with Agent
              </button>
            </div>

            <style>{`
                @keyframes scaleIn {
                  from { transform: scale(0.5); opacity: 0; }
                  to   { transform: scale(1);   opacity: 1; }
                }
                @keyframes drawCheck {
                  to { stroke-dashoffset: 0; }
                }
                @keyframes popIn {
                  from { transform: scale(0); opacity: 0; }
                  to   { transform: scale(1); opacity: 1; }
                }
              `}</style>
          </div>
        )}

        {/* Footer — hidden on done screen */}
        {step !== 'done' && <div className="mt-6 flex justify-end">
          {step === 'publish' ? (
            <button
              onClick={() => setStep('done')}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-[13px] font-bold transition-all active:scale-[0.98]"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              Publish Agent
            </button>
          ) : (
            <button
              onClick={next}
              disabled={!canNext}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-[13px] font-bold transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          )}
        </div>}
      </div>
    </div>
  );
};

// ── Create Group Modal ─────────────────────────────────────────────────
export const CreateGroupModal: React.FC<{
  onClose: () => void;
  onCreated?: (newGroupId: string) => void;
}> = ({ onClose, onCreated }) => {
  const [step, setStep] = useState<'members' | 'info'>('members');
  const [selected, setSelected] = useState<Set<any>>(new Set());
  const [groupName, setGroupName] = useState('');
  const [groupBio, setGroupBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [realFriends, setRealFriends] = useState<any[]>([]);

  useEffect(() => {
    api.getFriends().then((data: any[]) => {
      setRealFriends(data.map((f: any) => ({
        id: f.user.id,
        name: f.user.name || 'User',
        role: 'Friend',
        bio: f.user.email || 'LokaCash Member',
        initials: (f.user.name || 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
        avatar: f.user.avatar,
        bgColor: 'bg-' + ['blue', 'violet', 'emerald', 'amber', 'rose'][Math.abs((f.user.name || 'a').charCodeAt(0)) % 5] + '-500'
      })));
    }).catch(() => { });
  }, []);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setAvatarUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const toggleMember = (id: number) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Agents available to add (use negative IDs to distinguish from contacts)
  const AVAILABLE_AGENTS = [
    { id: -1, name: 'Loka Agent', desc: 'AI-powered investment assistant', initials: 'L' },
    { id: -2, name: 'Risk Analyzer', desc: 'Credit scoring & risk analysis', initials: 'R' },
    { id: -3, name: 'Market Research', desc: 'Real-time market intelligence', initials: 'M' },
    { id: -4, name: 'Yield Optimizer', desc: 'Find the best yield opportunities', initials: 'Y' },
  ];

  const selectedCount = selected.size;

  const GRAD_MAP: Record<string, string> = {
    'bg-blue-500': 'from-blue-500 to-indigo-500', 'bg-violet-500': 'from-violet-500 to-purple-500',
    'bg-emerald-500': 'from-emerald-500 to-teal-500', 'bg-amber-500': 'from-amber-400 to-orange-400',
    'bg-rose-500': 'from-rose-500 to-pink-500', 'bg-cyan-500': 'from-cyan-500 to-sky-500',
    'bg-indigo-500': 'from-indigo-500 to-blue-600', 'bg-pink-500': 'from-pink-500 to-rose-500',
    'bg-orange-500': 'from-orange-400 to-amber-500',
  };

  const stepLabel = step === 'members' ? 'Step 1 of 2 — Select members'
    : 'Step 2 of 2 — Group info (optional)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {step === 'info' && (
              <button onClick={() => setStep('members')} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
            )}
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">Create Group</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">{stepLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* ── Step 1: Select Members ── */}
        {step === 'members' && (
          <div className="max-h-[26rem] overflow-y-auto">
            {/* AI Agents section */}
            <div className="px-5 pt-3 pb-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">AI Agents</p>
            </div>
            {AVAILABLE_AGENTS.map(a => {
              const isSel = selected.has(a.id);
              return (
                <div key={a.id} onClick={() => toggleMember(a.id)}
                  className={`flex items-center gap-3 px-5 py-2.5 cursor-pointer transition-colors ${isSel ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                  <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-[12px] font-black text-violet-600 shrink-0">{a.initials}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-semibold text-gray-900 leading-tight">{a.name}</p>
                      <span className="text-[10px] font-semibold text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded-md">Agent</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">{a.desc}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${isSel ? 'bg-gray-900 border-gray-900' : 'border-gray-200'}`}>
                    {isSel && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                </div>
              );
            })}

            {/* Divider */}
            <div className="px-5 pt-3 pb-1 border-t border-gray-50 mt-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Contacts</p>
            </div>
            {realFriends.length === 0 ? (
              <p className="px-5 py-4 text-[12px] text-gray-400 text-center">No friends yet. Add friends from the Contacts page.</p>
            ) : null}
            {realFriends.map(c => {
              const grad = GRAD_MAP[c.bgColor] ?? 'from-gray-400 to-gray-500';
              const isSel = selected.has(c.id);
              return (
                <div key={c.id} onClick={() => toggleMember(c.id)}
                  className={`flex items-center gap-3 px-5 py-2.5 cursor-pointer transition-colors ${isSel ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                  {c.avatar && typeof c.avatar === 'string' && c.avatar.startsWith('http') ? (
                    <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
                      <img src={c.avatar} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-[12px] font-black text-white shrink-0`}>{c.initials}</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-semibold text-gray-900 leading-tight">{c.name}</p>
                      {c.role && <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">{c.role}</span>}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">{c.bio}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${isSel ? 'bg-gray-900 border-gray-900' : 'border-gray-200'}`}>
                    {isSel && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Step 2: Group Info (optional) ── */}
        {step === 'info' && (
          <div className="px-5 py-5 space-y-4">
            {/* Avatar upload */}
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-2">Avatar <span className="font-normal text-gray-300">(optional)</span></label>
              <div className="flex items-center gap-3">
                {/* Preview */}
                <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                  {avatarUrl
                    ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    : <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  }
                </div>
                {/* Upload button */}
                <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-100 bg-gray-50 text-[12px] font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer transition-all">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  Upload photo
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
                {avatarUrl && (
                  <button onClick={() => setAvatarUrl(null)} className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors">Remove</button>
                )}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-2">Name <span className="font-normal text-gray-300">(optional)</span></label>
              <input autoFocus value={groupName} onChange={e => setGroupName(e.target.value)}
                placeholder="e.g. DeFi Alpha Hunters"
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300" />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-2">Description <span className="font-normal text-gray-300">(optional)</span></label>
              <textarea value={groupBio} onChange={e => setGroupBio(e.target.value)} rows={2}
                placeholder="What's this group about?"
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300 resize-none" />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex justify-between items-center gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12px] font-bold text-gray-400 hover:bg-gray-100 transition-all">Cancel</button>
          <div className="flex items-center gap-2">
            {step === 'members' ? (
              <button onClick={() => selected.size > 0 && setStep('info')}
                className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${selected.size > 0 ? 'bg-gray-900 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                {selectedCount > 0 ? `Next (${selectedCount} selected)` : 'Select at least 1'}
              </button>
            ) : (
              <button
                onClick={() => {
                  const newId = `g-${Date.now()}`;
                  onCreated?.(newId);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-[12px] font-bold bg-gray-900 text-white hover:bg-gray-700 transition-all">
                Create Group
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// ── Mock pending friend requests ─────────────────────────────────────
const MOCK_REQUESTS = [
  { id: 'r1', name: 'Bob Chen', account: '@bobchen', role: 'Portfolio Manager', mutual: 1, grad: 'from-sky-500 to-blue-500', initials: 'BC', time: '2m ago' },
  { id: 'r2', name: 'Lena Fischer', account: '@lena_fi', role: 'Token Economist', mutual: 2, grad: 'from-cyan-500 to-sky-500', initials: 'LF', time: '1h ago' },
  { id: 'r3', name: 'Jay Park', account: '@jaypark', role: 'On-chain Analyst', mutual: 0, grad: 'from-indigo-500 to-blue-600', initials: 'JP', time: '3h ago' },
];

// ── ContactsPage ───────────────────────────────────────────────────────


const SettingsPage: React.FC = () => (
  <div className="flex-1 flex items-center justify-center h-full">
    <div className="text-center space-y-3">
      <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mx-auto text-xl">⚙️</div>
      <h2 className="text-[16px] font-semibold text-gray-900">Settings</h2>
      <p className="text-[13px] text-gray-400 max-w-[240px]">Account and preferences.</p>
    </div>
  </div>
);

const PAGE_PATHS: Record<string, string> = {
  [Page.SUPER_AGENT]: '/',
  [Page.CHATS]: '/chat',
  [Page.CONTACTS]: '/contacts',
  [Page.DISCOVER]: '/discover',
  [Page.INVEST]: '/market',
  [Page.API]: '/api',
  [Page.SETTINGS]: '/settings',
  [Page.PORTFOLIO]: '/portfolio',
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const page = (Object.keys(PAGE_PATHS).find(k => location.pathname === PAGE_PATHS[k] || (PAGE_PATHS[k] !== '/' && location.pathname.startsWith(PAGE_PATHS[k] + '/'))) as Page) || Page.SUPER_AGENT;
  const go = (p: Page) => navigate(PAGE_PATHS[p] || '/');
  const [expanded, setExpanded] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLaunch, setShowLaunch] = useState(true);

  const { ready, authenticated, user, getAccessToken } = usePrivy();
  const { logout } = useLogout({
    onSuccess: () => navigate('/'),
  });
  const isLoggedIn = ready && authenticated;

  // ── Socket + API token initialization ──
  useEffect(() => {
    if (ready && authenticated) {
      getAccessToken().then(token => {
        if (token) {
          api.setToken(token);
          api.setTokenGetter(getAccessToken);
          socket.setTokenGetter(getAccessToken);
          socket.reconnectWithToken(token);

          // Force sync to DB so it doesn't 404
          const email = user?.email?.address;
          const name = user?.google?.name || user?.twitter?.username || user?.email?.address?.split('@')[0];
          const avatar = (user?.google as any)?.pictureUrl || user?.twitter?.profilePictureUrl || (user?.discord as any)?.avatarUrl;
          api.syncPrivyUser({ email, name, avatar }).then(() => {
            window.dispatchEvent(new Event('loka-profile-updated'));
          }).catch(console.error);
        }
      }).catch(err => console.warn('[Auth] Token fetch failed:', err));



      // Periodic token refresh (every 5 min)
      const interval = setInterval(() => {
        getAccessToken().then(freshToken => {
          if (freshToken) {
            api.setToken(freshToken);
            socket.reconnectWithToken(freshToken);
          }
        }).catch(err => console.warn('[Auth] Refresh failed:', err));
      }, 5 * 60 * 1000);

      // Visibility-based token refresh
      const handleVisibility = () => {
        if (document.visibilityState === 'visible') {
          getAccessToken().then(freshToken => {
            if (freshToken) {
              api.setToken(freshToken);
              socket.reconnectWithToken(freshToken);
            }
          }).catch(() => { });
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);

      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibility);
      };
    } else if (ready && !authenticated) {
      api.clearToken();
      socket.clearToken();
    }
  }, [ready, authenticated, getAccessToken, user]);

  // Derive user display info from Privy user object
  // Fetch profile from backend for accurate name/avatar
  const [profileData, setProfileData] = useState<any>(null);
  useEffect(() => {
    if (!isLoggedIn) { setProfileData(null); return; }
    api.getProfile().then(p => setProfileData(p)).catch(() => { });
  }, [isLoggedIn]);
  // Listen for profile updates
  useEffect(() => {
    const handler = () => {
      api.getProfile().then(p => setProfileData(p)).catch(() => { });
    };
    window.addEventListener('loka-profile-updated', handler);
    return () => window.removeEventListener('loka-profile-updated', handler);
  }, []);

  const userName = profileData?.name || user?.google?.name || user?.twitter?.username || user?.email?.address?.split('@')[0] || 'User';
  const userInitial = userName.charAt(0).toUpperCase();
  const userAvatar = profileData?.avatar || null;

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

  // Auto-collapse sidebar when entering Chats page, restore on leave
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
      <TxModal />

      <Sidebar expanded={expanded} onToggle={() => setExpanded(!expanded)} page={page} go={go} isDark={isDark} onToggleDark={toggleDark}
        isLoggedIn={isLoggedIn} onLogin={() => setShowAuthModal(true)} onLogout={logout}
        userName={userName} userInitial={userInitial} userAvatar={userAvatar} />

      <main className={`flex-1 flex flex-col overflow-hidden h-full pt-[max(env(safe-area-inset-top),32px)] md:pt-0 pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-0 ${mainBg}`}>
        <div className={`flex-1 overflow-y-auto flex flex-col md:m-0 ${location.pathname.startsWith('/market/startup/') ? 'bg-gray-50 md:bg-gray-100/80' : ''}`}>
          <Routes>
            <Route path="/" element={<SuperAgentHome />} />
            <Route path="/chat" element={<RealChatsPage />} />
            <Route path="/contacts" element={<RealContactsPage />} />
            <Route path="/market/*" element={<Market />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/api" element={<ApiLanding />} />
            <Route path="/signal-radar" element={<DeepResearch />} />
            <Route path="/portfolio" element={<Portfolio isWalletConnected={isLoggedIn} onConnect={() => setShowAuthModal(true)} onLogout={logout} defaultTab="personal" />} />
            <Route path="/enterprise" element={<Portfolio isWalletConnected={isLoggedIn} onConnect={() => setShowAuthModal(true)} onLogout={logout} defaultTab="enterprise" />} />
            <Route path="*" element={<SuperAgentHome />} />
          </Routes>
        </div>
      </main>

      {/* Mobile bottom nav — 6-tab layout */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 flex items-center justify-around px-0 pt-1 z-50" style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}>
        {([
          { key: Page.SUPER_AGENT, icon: I.Home, label: 'Home' },
          { key: Page.CHATS, icon: I.Chat, label: 'Chat' },
          { key: Page.CONTACTS, icon: I.People, label: 'Contacts' },
          { key: Page.DISCOVER, icon: I.Compass, label: 'Discover' },
          { key: Page.INVEST, icon: I.Market, label: 'Market' },
          { key: Page.PORTFOLIO, icon: I.Profile, label: 'Me' },
        ] as { key: Page; icon: React.FC; label: string }[]).map(({ key, icon: Icon, label }) => {
          const isActive = page === key;
          return (
            <button key={key} onClick={() => go(key)}
              className={`relative flex flex-col items-center gap-0.5 py-1.5 px-1.5 min-w-0 transition-all ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
              <Icon />
              <span className={`text-[8px] leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default App;
