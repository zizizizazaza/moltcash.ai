import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { usePrivy, useLogout } from '@privy-io/react-auth';
import { Page } from './types';
import { api } from './services/api';
import { socket } from './services/socket';
import Market from './components/Market';
import ApiLanding from './components/ApiLanding';
import SuperAgentChat from './components/SuperAgentChat';
import AuthModal from './components/AuthModal';
import OAuthCallbackHandler from './components/OAuthCallbackHandler';
import Portfolio from './components/Portfolio';
import TxModal from './components/TxModal';

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
  /* People — address book / contacts */
  People: () => <svg className={sv} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>,
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
  { key: Page.CHATS, icon: I.Chat, label: 'Community', anim: 'nav-chat' },
  { key: Page.CONTACTS, icon: I.People, label: 'Contacts', anim: 'nav-sparkle' },
  { key: Page.DISCOVER, icon: I.Compass, label: 'Discover', anim: 'nav-compass' },
  { key: Page.INVEST, icon: I.Market, label: 'Market', anim: 'nav-market' },
  { key: Page.API, icon: I.Code, label: 'API', anim: 'nav-code' },
];

/* ── User menu popup ── */
const UserMenu: React.FC<{
  open: boolean; onClose: () => void; position?: 'above' | 'right';
  isDark: boolean; onToggleDark: () => void; onLogout?: () => void;
  userName?: string;
  userInitial?: string;
  userAvatar?: string;
}> = ({ open, onClose, position = 'above', isDark, onToggleDark, onLogout, userName, userInitial, userAvatar }) => {
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
          <div className={`w-8 h-8 ${userName ? `bg-${['blue', 'violet', 'emerald', 'amber', 'rose'][Math.abs(userName.charCodeAt(0)) % 5]}-500` : 'bg-gray-200'} rounded-full flex items-center justify-center text-[11px] font-bold text-white overflow-hidden`}>
            {userAvatar ? <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" /> : (userInitial || 'U')}
          </div>
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
  userName?: string; userInitial?: string; userAvatar?: string;
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
        <div onClick={() => isLoggedIn ? setUserMenuOpen(!userMenuOpen) : onLogin()} className={`w-8 h-8 ${isLoggedIn ? `bg-${['blue', 'violet', 'emerald', 'amber', 'rose'][Math.abs((userName || 'a').charCodeAt(0)) % 5]}-500 text-white` : avatarBg} rounded-full flex items-center justify-center text-[10px] font-semibold cursor-pointer hover:ring-2 hover:ring-gray-300 transition-all overflow-hidden`}>
          {isLoggedIn && userAvatar ? <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" /> : (userInitial || 'U')}
        </div>
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
          <div className={`w-7 h-7 ${isLoggedIn ? `bg-${['blue', 'violet', 'emerald', 'amber', 'rose'][Math.abs((userName || 'a').charCodeAt(0)) % 5]}-500 text-white` : avatarBg} rounded-full flex items-center justify-center text-[10px] font-semibold overflow-hidden`}>
            {isLoggedIn && userAvatar ? <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" /> : (userInitial || 'U')}
          </div>
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

type GroupMemberData = {
  agents: string[];
  members: { name: string; online: boolean }[];
  isAdmin: boolean; // whether the current user is admin
  adminName: string; // which member is the admin
};
const MOCK_GROUP_MEMBERS: Record<string, GroupMemberData> = {
  g1: { isAdmin: true,  adminName: 'Alex Chen',    agents: ['Loka Agent', 'Risk Analyzer'], members: [{ name: 'Alex Chen', online: true }, { name: 'Sarah Kim', online: false }, { name: 'CryptoWhale88', online: true }] },
  g2: { isAdmin: false, adminName: 'Marcus Rivera', agents: ['Loka Agent'], members: [{ name: 'Marcus Rivera', online: true }, { name: 'Emily Zhang', online: true }, { name: 'RWA_Bull', online: false }] },
  g3: { isAdmin: true,  adminName: 'David Park',   agents: ['Loka Agent', 'Market Research'], members: [{ name: 'David Park', online: false }, { name: 'AlphaTrader', online: true }] },
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
type LocalMsg = { id: string; type: 'text' | 'image' | 'file' | 'poll'; content: string; poll?: PollData; file?: File };

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

const PollCard: React.FC<{ poll: PollData; onVote?: (pollId: string, optId: string) => void }> = ({ poll: parentPoll, onVote }) => {
  const [poll, setPoll] = useState(parentPoll);

  // Sync with parent when data updates (e.g. from WebSocket)
  useEffect(() => {
    setPoll(prev => ({
      ...parentPoll,
      voted: parentPoll.voted || prev.voted,
    }));
  }, [parentPoll]);

  const vote = async (optId: string) => {
    if (poll.voted) return;
    // Optimistic update
    setPoll(p => ({
      ...p,
      voted: optId,
      total: p.total + 1,
      options: p.options.map(o => o.id === optId ? { ...o, votes: o.votes + 1 } : o),
    }));
    // Call API
    if (onVote) {
      onVote(poll.id, optId);
    } else {
      try {
        await api.votePoll(poll.id, optId);
      } catch (err) {
        console.error('Vote failed:', err);
        setPoll(p => ({
          ...p,
          voted: undefined,
          total: p.total - 1,
          options: p.options.map(o => o.id === optId ? { ...o, votes: o.votes - 1 } : o),
        }));
      }
    }
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
              className={`w-full text-left rounded-xl border transition-all overflow-hidden ${
                poll.voted
                  ? isVoted ? 'border-gray-900 bg-gray-900' : 'border-gray-100 bg-gray-50'
                  : 'border-gray-100 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
              }`}>
              <div className="relative px-3 py-2.5">
                {poll.voted && (
                  <div className={`absolute inset-0 rounded-xl transition-all ${isVoted ? 'bg-gray-900' : 'bg-gray-100'}`}
                    style={{ width: `${pct}%`, borderRadius: 'inherit', opacity: 0.15 }} />
                )}
                <div className="relative flex items-center justify-between">
                  <span className={`text-[13px] font-semibold ${poll.voted ? (isVoted ? 'text-white' : 'text-gray-600') : 'text-gray-800'}`}>{opt.text}</span>
                  {poll.voted && <span className={`text-[11px] font-bold ${isVoted ? 'text-gray-300' : 'text-gray-400'}`}>{pct}%</span>}
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
  existingIds: string[];
  onClose: () => void;
  onConfirm: (userIds: string[]) => void;
}> = ({ existingIds, onClose, onConfirm }) => {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);

  useEffect(() => {
    api.getFriends().then((res: any[]) => {
      const friends = res.map((f: any) => ({
        id: f.user.id,
        name: f.user.name,
        avatar: f.user.avatar,
        email: f.user.email
      }));
      setContacts(friends.filter((u: any) => !existingIds.includes(u.id)));
      setLoadingContacts(false);
    }).catch(err => {
      console.error(err);
      setLoadingContacts(false);
    });
  }, [existingIds]);

  const toggle = (id: string) =>
    setPicked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleConfirm = () => {
    const ids = contacts.filter(c => picked.has(c.id)).map(c => c.id);
    onConfirm(ids);
  };

  const GRAD_MAP: Record<string, string> = {
    'bg-blue-500': 'from-blue-400 to-blue-500',
    'bg-violet-500': 'from-violet-400 to-violet-500',
    'bg-emerald-500': 'from-emerald-400 to-emerald-500',
    'bg-amber-500': 'from-amber-400 to-amber-500',
    'bg-rose-500': 'from-rose-400 to-rose-500',
    'bg-cyan-500': 'from-cyan-400 to-cyan-500',
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
          {loadingContacts ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
            </div>
          ) : contacts.length === 0 ? (
            <p className="text-[13px] text-gray-400 text-center py-8">All valid friends are already in this group</p>
          ) : contacts.map(c => {
            const userColor = `bg-${['blue', 'violet', 'emerald', 'amber', 'rose'][Math.abs((c.name || 'a').charCodeAt(0)) % 5]}-500`;
            const isSel = picked.has(c.id);
            const initials = (c.name || c.email || 'U').substring(0, 2).toUpperCase();
            return (
              <div key={c.id} onClick={() => toggle(c.id)}
                className={`flex items-center gap-3 px-5 py-2.5 cursor-pointer transition-colors ${isSel ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                {c.avatar && c.avatar.startsWith('http') ? (
                  <img src={c.avatar} className="w-8 h-8 rounded-full object-cover shrink-0" alt="" />
                ) : (
                  <div className={`w-8 h-8 rounded-full ${userColor} text-white flex items-center justify-center text-[11px] font-black shrink-0`}>{initials}</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-gray-800 truncate">{c.name || c.email?.split('@')[0]}</p>
                  <p className="text-[10px] text-gray-400 truncate">{c.email}</p>
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
  const [filter, setFilter] = useState<'All' | 'People' | 'Groups'>('All');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const selectedRef = useRef<string | null>(null);

  const setSelected = useCallback((id: string | null) => {
    setSelectedState(id);
    selectedRef.current = id;
  }, []);

  const selected = selectedState;
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const convId = params.get('convId');
    if (convId) {
      setSelected(convId);
      // Optional: clear the url without refreshing so it doesn't get stuck if user closes chat
      window.history.replaceState({}, '', '/chat');
    }
  }, [location.search]);

  const [conversations, setConversations] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [localMsgs, setLocalMsgs] = useState<LocalMsg[]>([]);
  const [showPoll, setShowPoll] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showMembers, setShowMembers] = useState(window.innerWidth >= 768);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [mktSearch, setMktSearch] = useState('');
  const [mktCat, setMktCat] = useState('All');
  const [plusMenu, setPlusMenu] = useState(false);
  const [plusModal, setPlusModal] = useState<'friend' | 'group' | null>(null);
  const [memberMenuOpts, setMemberMenuOpts] = useState<string | null>(null);
  const [memberToKick, setMemberToKick] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [groupPolls, setGroupPolls] = useState<any[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dbUserId = localStorage.getItem('dbUserId') || '';
  const dbUserName = localStorage.getItem('dbUserName') || 'You';

  // Auto-scroll to latest message
  useEffect(() => {
    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Immediate scroll
    scrollToBottom();
    // Delayed scrolls to handle async image/video loading which changes container height
    const t1 = setTimeout(scrollToBottom, 150);
    const t2 = setTimeout(scrollToBottom, 500);
    const t3 = setTimeout(scrollToBottom, 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [chatMessages, localMsgs, groupPolls]);

  // Extract API call so we can reuse it when unknown chats ping us via WS
  const loadConvs = useCallback(() => {
    api.getCommunityConversations()
      .then(data => {
        setConversations(data.map((c: any) => ({
        id: c.id,
        name: c.name,
        avatar: c.avatar || c.name?.charAt(0) || '?',
        role: c.type === 'group' ? 'group' : 'human',
        lastMsg: c.lastMsg || '',
        time: c.lastMsgAt ? new Date(c.lastMsgAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        unread: c.unread || 0,
        isGroup: c.isGroup,
        color: c.isGroup
          ? `bg-${['blue', 'emerald', 'violet', 'amber', 'rose', 'cyan'][Math.abs(c.name.charCodeAt(0)) % 6]}-100 text-${['blue', 'emerald', 'violet', 'amber', 'rose', 'cyan'][Math.abs(c.name.charCodeAt(0)) % 6]}-600`
          : `bg-${['blue', 'violet', 'emerald', 'amber', 'rose'][Math.abs((c.name || 'a').charCodeAt(0)) % 5]}-500 text-white`,
        groupMembers: c.groupMembers || [],
      })));
      setTimeout(() => {
        data.forEach((c: any) => {
          if (c.isGroup) {
            socket.emit('join-group', c.id);
          }
        });
      }, 500);
    }).catch((err) => {
      console.error('[loadConvs] Failed to load conversations:', err.message);
      // Only clear if we have no existing data (first load). Keep stale data on refresh failures.
      setConversations(prev => prev.length > 0 ? prev : []);
    });
  }, []);

  // Load conversations from API on mount (guarded by auth to prevent 401 race)
  const { ready: chatsReady, authenticated: chatsAuthenticated, getAccessToken: chatsGetAccessToken, login: chatsLogin } = usePrivy();
  useEffect(() => {
    if (!(chatsReady && chatsAuthenticated)) return;
    setLoadingConvs(true);
    // Ensure token is set before fetching (child effects fire before parent effects)
    chatsGetAccessToken().then(token => {
      if (token) {
        api.setToken(token);
        api.setTokenGetter(chatsGetAccessToken);
      }
      loadConvs();
    }).catch(() => loadConvs()).finally(() => setLoadingConvs(false));
  }, [loadConvs, chatsReady, chatsAuthenticated, chatsGetAccessToken]);

  // Real-time WebSocket listener for new messages
  useEffect(() => {
    const handleNewMsg = (payload: any) => {
      // Backend sends { conversationId, message: { id, content, sender, ... } }
      // Or for groups: message directly with groupId
      const msg = payload.message || payload;
      const convId = payload.conversationId || msg.groupId;
      const formattedMsg = {
        id: msg.id,
        senderId: msg.senderId || msg.userId,
        content: msg.content,
        attachmentUrl: msg.attachmentUrl || null,
        attachmentType: msg.attachmentType || null,
        createdAt: msg.createdAt,
        sender: msg.sender || msg.user || { id: msg.userId, name: 'User' },
      };

      // 1. Update the active chat log if we are currently looking at it
      if (String(selectedRef.current) === String(convId)) {
        setChatMessages(prev => {
          if (prev.some(m => m.id === formattedMsg.id)) return prev;
          return [...prev, formattedMsg];
        });
        // We received a new message dynamically while targeting this window, reset read cursor
        api.markConversationAsRead(convId).catch(console.error);
      }

      // 2. Update the left conversational menu preview snippets
      setConversations(prev => {
        const exists = prev.some(c => String(c.id) === String(convId));
        if (!exists) {
          // A brand new conversation started (e.g. someone messaged us first time), we must fetch its metadata
          loadConvs();
          return prev;
        }
        return prev.map(c => String(c.id) === String(convId) ? {
          ...c,
          lastMsg: formattedMsg.content || (formattedMsg.attachmentType === 'image' ? '📷 Photo' : formattedMsg.attachmentType === 'video' ? '🎬 Video' : formattedMsg.attachmentType === 'file' ? '📎 File' : ''),
          time: new Date(formattedMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: String(selectedRef.current) === String(convId) ? 0 : (c.unread || 0) + 1
        } : c).sort((a, b) => {
          // Bring updated conversation to top
          if (String(a.id) === String(convId)) return -1;
          if (String(b.id) === String(convId)) return 1;
          return 0;
        });
      });
    };

    socket.on('dm:message', handleNewMsg);
    socket.on('group:message', handleNewMsg);
    socket.on('group:joined', loadConvs);
    socket.on('group:removed', loadConvs);
    const handleDissolved = (data: any) => {
      setConversations(prev => prev.filter(c => String(c.id) !== String(data.groupId)));
      if (String(selectedRef.current) === String(data.groupId)) setSelected(null);
    };
    socket.on('group:dissolved', handleDissolved);

    // Poll events
    const handleNewPoll = (poll: any) => {
      if (String(selectedRef.current) === String(poll.groupId)) {
        setGroupPolls(prev => {
          if (prev.some(p => p.id === poll.id)) return prev;
          return [...prev, poll];
        });
      }
      // Update sidebar preview for all group members
      setConversations(prev => prev.map(c => String(c.id) === String(poll.groupId) ? {
        ...c,
        lastMsg: `📊 Poll: ${poll.question}`,
        time: new Date(poll.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      } : c));
    };
    const handlePollVote = (data: any) => {
      setGroupPolls(prev => prev.map(p => p.id === data.pollId ? {
        ...p, options: data.options, total: data.total,
      } : p));
    };
    socket.on('group:poll', handleNewPoll);
    socket.on('group:poll-vote', handlePollVote);

    return () => {
      socket.off('dm:message', handleNewMsg);
      socket.off('group:message', handleNewMsg);
      socket.off('group:joined', loadConvs);
      socket.off('group:removed', loadConvs);
      socket.off('group:dissolved', handleDissolved);
      socket.off('group:poll', handleNewPoll);
      socket.off('group:poll-vote', handlePollVote);
    };
  }, [loadConvs, setSelected]);

  // Load messages when a conversation is selected
  useEffect(() => {
    if (!selected) { setChatMessages([]); return; }
    
    // Optimistically clear the unread badge on the sidebar
    setConversations(prev => prev.map(c => 
      c.id === selected ? { ...c, unread: 0 } : c
    ));
    
    // Sync the read cursor with the backend database
    api.markConversationAsRead(selected).catch(console.error);

    setLoadingMsgs(true);
    api.getConversationMessages(selected)
      .then(data => {
        setChatMessages(data.messages || []);
        // Scroll to bottom after messages load
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
      })
      .catch(() => setChatMessages([]))
      .finally(() => setLoadingMsgs(false));

    // Load polls (always attempt — API returns 403 for non-groups, which we silently ignore)
    api.getGroupPolls(selected).then(setGroupPolls).catch(() => setGroupPolls([]));
  }, [selected]);

  // Send message handler
  const handleSendMessage = async () => {
    if ((!input.trim() && localMsgs.filter(m => m.type === 'file' || m.type === 'image').length === 0) || !selected || sendingMsg) return;
    const text = input.trim();
    const attachments = localMsgs.filter(m => m.type === 'image' || m.type === 'file');
    setInput('');
    setSendingMsg(true);

    try {
      // 1. Send attachments
      for (const att of attachments) {
        if (!att.file) continue;
        const { url, type } = await api.uploadFile(att.file);
        const msg = await api.sendConversationMessage(selected, '', url, type);
        setChatMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
      
      // 2. Send text message
      if (text) {
        const msg = await api.sendConversationMessage(selected, text);
        setChatMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }

      setLocalMsgs(prev => prev.filter(m => m.type !== 'image' && m.type !== 'file'));
      
      setConversations(prev => prev.map(c =>
        c.id === selected ? { ...c, lastMsg: text || '📷 Photo', time: 'now' } : c
      ));
    } catch {
      // Fallback
    } finally {
      setSendingMsg(false);
    }
  };

  const handleSendFile = async (file: File, type: 'image' | 'file') => {
    if (!selected) return;
    setSendingMsg(true);

    const tempId = Date.now().toString() + 'uploading';
    // Add temporary uploading indicator
    setChatMessages(prev => [...prev, {
      id: tempId,
      senderId: dbUserId,
      content: `Uploading ${file.name}...`,
      attachmentType: 'uploading',
      createdAt: new Date().toISOString(),
      sender: { id: dbUserId, name: dbUserName, avatar: null },
    } as any]);

    try {
      const uploadRes = await api.uploadFile(file);
      const msgContent = uploadRes.type === 'file' ? file.name : '';
      const msg = await api.sendConversationMessage(selected, msgContent, uploadRes.url, uploadRes.type);
      
      setChatMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempId);
        if (filtered.some(m => m.id === msg.id)) return filtered;
        return [...filtered, msg];
      });
      const previewLabel = uploadRes.type === 'image' ? '📷 Photo' : uploadRes.type === 'video' ? '🎬 Video' : '📎 File';
      setConversations(prev => prev.map(c =>
        c.id === selected ? { ...c, lastMsg: previewLabel, time: 'now' } : c
      ));
    } catch (err: any) {
      console.error('[handleSendFile] Upload failed:', err);
      // Replace uploading with error message
      setChatMessages(prev => prev.map(m => m.id === tempId ? {
        ...m,
        content: `Upload failed: ${err.message || 'Unknown error'}`,
        attachmentType: 'error'
      } : m));
      // Remove error after 3 seconds
      setTimeout(() => setChatMessages(p => p.filter(m => m.id !== tempId)), 3000);
    } finally {
      setSendingMsg(false);
    }
  };

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

  // Merge polls into message timeline
  const mergedMsgs = useMemo(() => {
    const pollMsgs = groupPolls.map(p => ({
      id: `poll:${p.id}`,
      _isPoll: true,
      _pollData: p,
      senderId: p.creator?.id || p.userId,
      content: '',
      createdAt: p.createdAt,
      sender: p.creator || { id: p.userId, name: 'User' },
    }));
    return [...chatMessages, ...pollMsgs].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [chatMessages, groupPolls]);

  const msgs = mergedMsgs;
  
  const members = sel?.isGroup && sel.groupMembers ? {
    agents: [],
    members: sel.groupMembers.map((m: any) => ({
      id: m.id || m.userId,
      name: m.name || m.id,
      online: true,
      avatar: m.avatar,
      role: m.role
    })),
    isAdmin: sel.groupMembers.some((m: any) => m.id === dbUserId && ['creator', 'admin'].includes(m.role)),
  } : null;

  const [showAddMember, setShowAddMember] = useState(false);
  const [showDissolve, setShowDissolve] = useState(false);

    const removeMember = async (userId: string) => {
    if (!selected) return;
    try {
      const result = await api.removeGroupMember(selected, userId);
      setConversations(prev => prev.map(c =>
        c.id === selected ? { ...c, groupMembers: result.members } : c
      ));
    } catch (err) {
      console.error('Failed to kick member', err);
    }
  };
  const removeAgent = (name: string) => { console.log('TODO: remove agent', name); };
  const addMembers = async (userIds: string[]) => {
    if (!selected) return;
    try {
      const result = await api.addGroupMembers(selected, userIds);
      // Update the local conversation's groupMembers with the new list from server
      setConversations(prev => prev.map(c =>
        c.id === selected ? { ...c, groupMembers: result.members } : c
      ));
    } catch (err) {
      console.error('Failed to add members', err);
    }
  };
  const dissolveGroup = async () => {
    if (!selected) return;
    try {
      await api.dissolveGroup(selected);
      setConversations(prev => prev.filter(c => c.id !== selected));
      setSelected(null);
      setShowDissolve(false);
    } catch (err) {
      console.error('Failed to dissolve group', err);
      alert('Failed to dissolve group. Only the group creator can perform this action.');
      setShowDissolve(false);
    }
  };

  if (chatsReady && !chatsAuthenticated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-full p-6 animate-fadeIn md:bg-gray-50/50">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <div className="text-center max-w-sm">
          <h2 className="text-2xl font-black text-black mb-2">Authentication Required</h2>
          <p className="text-sm font-medium text-gray-400 leading-relaxed mb-6">
            Please sign in to access your private chats and community groups.
          </p>
          <button
            onClick={() => chatsLogin()}
            className="px-8 py-3 bg-black text-white rounded-full text-xs font-bold tracking-widest hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl active:scale-95"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Modals */}
      {plusModal === 'friend' && <AddFriendModal onClose={() => setPlusModal(null)} />}
      {plusModal === 'group' && (
        <CreateGroupModal
          onClose={() => setPlusModal(null)}
          onCreated={(group: any) => {
            const groupColor = `bg-${['blue', 'emerald', 'violet', 'amber', 'rose', 'cyan'][Math.abs(group.name.charCodeAt(0)) % 6]}-100 text-${['blue', 'emerald', 'violet', 'amber', 'rose', 'cyan'][Math.abs(group.name.charCodeAt(0)) % 6]}-600`;
            setConversations(prev => [{
              id: group.id,
              name: group.name,
              avatar: group.avatar || group.name.charAt(0),
              role: 'group',
              lastMsg: 'Group created',
              time: 'now',
              unread: 0,
              isGroup: true,
              color: groupColor,
              groupMembers: group.members?.map((m: any) => ({
                id: m.user?.id || m.userId,
                name: m.user?.name || 'Unknown',
                avatar: m.user?.avatar,
                role: m.role,
              })) || [],
            }, ...prev]);
            setSelected(group.id);
            setPlusModal(null);
            // Also join the socket room
            socket.emit('join-group', group.id);
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
          {loadingConvs && conversations.length === 0 ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={`sk-${i}`} className="w-full flex items-start gap-3 px-3 py-3 rounded-lg mb-1 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-gray-100 shrink-0"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-2 bg-gray-100 rounded w-3/4"></div>
                </div>
              </div>
            ))
          ) : filtered.map(m => (
            <button key={m.id} onClick={() => setSelected(m.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${selected === m.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[12px] font-bold overflow-hidden ${m.color || 'bg-gray-100 text-gray-600'}`}>
                {m.avatar?.startsWith('http') ? <img src={m.avatar} className="w-full h-full object-cover" alt="" /> : m.avatar?.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 text-left min-w-0 flex flex-col justify-center">
                <p className="text-[14px] font-medium text-gray-900 truncate leading-none mb-1.5">{m.name}</p>
                <p className="text-[12.5px] text-gray-400 truncate leading-none">{m.lastMsg}</p>
              </div>
              <div className="flex flex-col items-end justify-center shrink-0 ml-2 gap-1.5 h-full">
                <span className="text-[11px] text-gray-400 leading-none">{m.time}</span>
                {m.unread > 0 ? (
                  <span className="min-w-[18px] h-[18px] bg-gray-900 text-white text-[10px] font-semibold rounded-full flex items-center justify-center px-1 leading-none shadow-sm">
                    {m.unread}
                  </span>
                ) : (
                  <div className="min-w-[18px] h-[18px]" />
                )}
              </div>
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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold overflow-hidden shrink-0 ${sel.color || 'bg-gray-100 text-gray-600'}`}>
                {sel.avatar?.startsWith('http') ? <img src={sel.avatar} className="w-full h-full object-cover" alt="" /> : sel.avatar?.substring(0, 2).toUpperCase()}
              </div>
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
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="max-w-4xl mx-auto w-full space-y-4">
              {loadingMsgs && msgs.length === 0 ? (
                <div className="space-y-6 animate-pulse pt-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`flex items-start gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                      <div className="w-7 h-7 rounded-full bg-gray-100 shrink-0"></div>
                      <div className={`flex-1 flex flex-col gap-2 ${i % 2 === 0 ? 'items-end' : 'items-start'}`}>
                        <div className="h-2.5 bg-gray-200 rounded w-16"></div>
                        <div className={`h-12 bg-gray-100 rounded-xl ${i % 2 === 0 ? 'rounded-tr-sm' : 'rounded-tl-sm'} ${i === 3 ? 'w-3/4 max-w-[300px] h-20' : 'w-1/2 max-w-[200px]'}`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : msgs.map((msg: any, i: number) => {
                if (!msg._isPoll && msg.attachmentType === 'poll') return null;
                const isMe = msg.senderId === dbUserId;
                return (
                <div key={msg.id || i}>
                  {msg.sender && (
                    <div className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 overflow-hidden bg-${['blue', 'violet', 'emerald', 'amber', 'rose'][Math.abs((msg.sender.name || 'U').charCodeAt(0)) % 5]}-500`}>
                        {msg.sender.avatar?.startsWith('http') 
                           ? <img src={msg.sender.avatar} className="w-full h-full object-cover" alt="" /> 
                           : (msg.sender.name || 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="max-w-[70%]">
                        <div className={`flex items-center gap-1.5 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <span className="text-[12px] font-semibold text-gray-800">{isMe ? 'You' : (msg.sender.name || 'User')}</span>
                          <span className="text-[10px] text-gray-400">{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                        </div>
                        <div className={`flex flex-col gap-1.5 ${isMe ? 'items-end' : 'items-start'}`}>
                          {msg.attachmentUrl && msg.attachmentType === 'image' && (
                            <img src={msg.attachmentUrl} alt="attachment" className="max-w-[260px] rounded-xl border border-gray-100 shadow-sm object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setPreviewImage(msg.attachmentUrl)} onLoad={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })} />
                          )}
                          {msg.attachmentUrl && msg.attachmentType === 'video' && (
                            <video
                              src={msg.attachmentUrl}
                              controls
                              preload="metadata"
                              className="max-w-[300px] rounded-xl border border-gray-100 shadow-sm"
                              onLoadedMetadata={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                            />
                          )}
                          {msg.attachmentUrl && msg.attachmentType === 'file' && (
                            <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" download className={`flex items-center gap-2.5 border border-gray-100 rounded-xl px-3.5 py-2.5 shadow-sm transition-colors ${isMe ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}`}>
                              <svg className={`w-7 h-7 shrink-0 ${isMe ? 'text-gray-300' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                              <div className="min-w-0">
                                <p className="text-[12px] font-semibold truncate max-w-[200px]">{msg.content || 'Document'}</p>
                                <p className={`text-[10px] ${isMe ? 'text-gray-400' : 'text-gray-500'}`}>Click to download</p>
                              </div>
                            </a>
                          )}
                          {msg.attachmentType === 'uploading' && (
                            <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl shadow-sm ${isMe ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-500 border border-gray-100'}`}>
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
                              <span className="text-[13px] italic">{msg.content}</span>
                            </div>
                          )}
                          {msg.attachmentType === 'error' && (
                            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl shadow-sm bg-red-50 text-red-500 border border-red-100">
                              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              <span className="text-[13px]">{msg.content}</span>
                            </div>
                          )}
                          {msg._isPoll && msg._pollData && (
                            <PollCard poll={{ ...msg._pollData, voted: msg._pollData.voted || undefined }} />
                          )}
                          {!msg._isPoll && msg.content && msg.attachmentType !== 'file' && msg.attachmentType !== 'uploading' && msg.attachmentType !== 'error' && msg.attachmentType !== 'poll' && (
                            <div className={`${isMe ? 'bg-gray-900 text-white rounded-xl rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-700 rounded-xl rounded-tl-sm'} px-3.5 py-2.5 text-[13px] shadow-sm leading-relaxed`}>
                              {msg.content}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
              })}
              {loadingMsgs && msgs.length > 0 && (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                </div>
              )}
              {/* Group Polls section removed — polls are now merged into the message timeline */}
              {/* Local messages (images, polls, etc.) */}
              {localMsgs.map((msg) => {
                const myColor = `bg-${['blue', 'violet', 'emerald', 'amber', 'rose'][Math.abs((dbUserName || 'U').charCodeAt(0)) % 5]}-500`;
                const myInitials = (dbUserName || 'U').substring(0, 2).toUpperCase();
                return (
                <div key={msg.id} className="flex items-start gap-2.5 flex-row-reverse">
                  <div className={`w-7 h-7 rounded-full ${myColor} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>{myInitials}</div>
                  <div className="max-w-[75%]">
                    <div className="flex items-center gap-1.5 mb-1 flex-row-reverse">
                      <span className="text-[12px] font-semibold text-gray-800">{dbUserName}</span>
                      <span className="text-[10px] text-gray-300">now</span>
                    </div>
                    {/* Image message */}
                    {msg.type === 'image' && (
                      <img src={msg.content} alt="upload" className="max-w-[260px] rounded-xl border border-gray-100 shadow-sm object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setPreviewImage(msg.content)} />
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
                      <div className="bg-gray-900 rounded-xl rounded-tr-sm px-3.5 py-2.5 text-[13px] text-white shadow-sm leading-relaxed">{msg.content}</div>
                    )}
                    {/* Poll message */}
                    {msg.type === 'poll' && (
                      <PollCard poll={msg.poll!} />
                    )}
                  </div>
                </div>
              )})}
              {msgs.length === 0 && localMsgs.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[13px] text-gray-400">No messages yet</p>
                </div>
              )}
                <div ref={messagesEndRef} className="h-px" />
              </div>
            </div>

            {/* Poll Modal */}
            {showPoll && selected && (
              <PollModal
                onClose={() => setShowPoll(false)}
                onSubmit={async (pollData) => {
                  try {
                    const newPoll = await api.createPoll(selected, {
                      question: pollData.question,
                      options: pollData.options.map(o => o.text),
                      duration: pollData.duration,
                    });
                    // Add poll immediately so creator sees it (WebSocket dedup prevents duplicates)
                    setGroupPolls(prev => {
                      if (prev.some(p => p.id === newPoll.id)) return prev;
                      return [...prev, newPoll];
                    });
                    // Update sidebar conversation preview
                    setConversations(prev => prev.map(c => c.id === selected ? {
                      ...c,
                      lastMsg: `📊 Poll: ${pollData.question}`,
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    } : c));
                  } catch (err) {
                    console.error('Failed to create poll:', err);
                  }
                  setShowPoll(false);
                }}
              />
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100 bg-white shrink-0">
              <div className="max-w-4xl mx-auto w-full relative">
              {showAttachMenu && (
                <div className="absolute bottom-[calc(100%+6px)] right-4 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden w-40 z-10 animate-fadeIn">
                  {/* Photo / Video */}
                  <label className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={e => e.stopPropagation()}>
                    <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <span className="text-[12px] font-semibold text-gray-700">Photo or Video</span>
                    <input type="file" accept="image/*,video/*" className="hidden" onChange={e => {
                      const file = e.target.files?.[0];
                      console.log('[Attach] Photo/Video selected:', file?.name, file?.size);
                      if (!file) return;
                      handleSendFile(file, 'image');
                      setShowAttachMenu(false);
                      e.target.value = '';
                    }} />
                  </label>
                  {/* Document */}
                  <label className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors border-t border-gray-50"
                    onClick={e => e.stopPropagation()}>
                    <div className="w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    </div>
                    <span className="text-[12px] font-semibold text-gray-700">Document</span>
                    <input type="file" className="hidden" onChange={e => {
                      const file = e.target.files?.[0];
                      console.log('[Attach] Document selected:', file?.name, file?.size);
                      if (!file) return;
                      handleSendFile(file, 'file');
                      setShowAttachMenu(false);
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
                      handleSendMessage();
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
                {input.trim() || localMsgs.some(m => m.type === 'image' || m.type === 'file') ? (
                  <button disabled={sendingMsg} onClick={handleSendMessage} className={`w-7 h-7 rounded-lg flex items-center justify-center bg-gray-900 text-white transition-all shrink-0 hover:bg-gray-700 ${sendingMsg ? 'opacity-50' : ''}`}>
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
          </div>

          {/* ── Right: members sidebar (groups only) ── */}
          {/* Mobile: right-sliding drawer with backdrop */}
          {sel.isGroup && members && showMembers && (
            <div className="md:hidden fixed inset-0 z-50 flex justify-end">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/20 backdrop-blur-sm" 
                onClick={() => setShowMembers(false)}
                style={{ animation: 'fadeIn 0.25s ease' }}
              />
              <style>{`
                @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
              `}</style>
              {/* Drawer Container */}
              <div 
                className="relative w-[260px] bg-white h-full flex flex-col shadow-2xl rounded-l-2xl overflow-hidden"
                style={{ animation: 'slideInRight 0.3s cubic-bezier(0.16,1,0.3,1)' }}
              >
                <div className="flex items-center justify-between px-4 pt-6 pb-4 border-b border-gray-100 bg-white z-10">
                  <div>
                    <p className="text-[15px] font-bold text-gray-900">Members</p>
                    <p className="text-[11px] text-gray-400 font-medium">{members.agents.length + members.members.length} total</p>
                  </div>
                  <button onClick={() => setShowMembers(false)} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 pb-20">
                  {/* ── AI Agents ── */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">AI Agents</p>
                    {members.agents.map(a => (
                      <div key={a} className="flex items-center gap-2.5 py-2 group">
                        <div className="relative shrink-0">
                          <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-[12px] font-bold text-violet-600">{a[0]}</div>
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-gray-800 truncate">{a}</p>
                          <p className="text-[10px] text-emerald-500">Always online</p>
                        </div>
                        {members.isAdmin && (
                          <button onClick={() => removeAgent(a)}
                            className="w-8 h-8 rounded flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all active:bg-red-100">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        )}
                      </div>
                    ))}
                    {/* Add Agent button — admin only */}
                    {members.isAdmin && (
                      <button onClick={() => { setShowMembers(false); setShowMarketplace(true); }}
                        className="flex items-center gap-3 mt-2 py-2 w-full text-left active:opacity-70">
                        <div className="w-9 h-9 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14M5 12h14" /></svg>
                        </div>
                        <span className="text-[13px] font-semibold text-gray-400">Add agent</span>
                      </button>
                    )}
                  </div>
                  {/* ── Members ── */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 mt-4">Members</p>
                    {members.members.map(m => {
                      const userColor = `bg-${['blue', 'violet', 'emerald', 'amber', 'rose'][Math.abs((m.name || 'a').charCodeAt(0)) % 5]}-500`;
                      return (
                        <div key={m.name} className="flex items-center gap-2.5 py-2 group">
                          <div className="relative shrink-0">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white overflow-hidden ${userColor}`}>
                              {m.avatar?.startsWith('http') ? <img src={m.avatar} className="w-full h-full object-cover" alt="" /> : m.name[0]?.toUpperCase()}
                            </div>
                            {m.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" /> }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-[13px] font-semibold text-gray-800 truncate">{m.name}</p>
                              {['creator', 'admin'].includes(m.role) && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 shrink-0">Admin</span>
                              )}
                            </div>
                            <p className={`text-[10px] ${m.online ? 'text-emerald-500' : 'text-gray-300'}`}>{m.online ? 'Online' : 'Offline'}</p>
                          </div>
                          {members.isAdmin && m.id !== dbUserId && (
                            <div className="relative shrink-0">
                              <button onClick={() => setMemberMenuOpts(memberMenuOpts === m.id ? null : m.id)}
                                className="w-8 h-8 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all active:bg-gray-200">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                              </button>
                              {memberMenuOpts === m.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setMemberMenuOpts(null)} />
                                  <div className="absolute right-0 top-9 w-40 bg-white border border-gray-100 rounded-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1)] z-20 py-1 animate-fadeIn">
                                    <button onClick={() => { setMemberToKick(m); setMemberMenuOpts(null); }} className="w-full text-left px-4 py-3 text-[14px] font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                      Remove User
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {/* Add Member button — admin only */}
                    {members.isAdmin && (
                      <button onClick={() => { setShowMembers(false); setShowAddMember(true); }}
                        className="flex items-center gap-3 mt-2 py-2 w-full text-left active:opacity-70">
                        <div className="w-9 h-9 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14M5 12h14" /></svg>
                        </div>
                        <span className="text-[13px] font-semibold text-gray-400">Add member</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Admin: Dissolve group */}
                {members.isAdmin && (
                  <div className="px-5 pt-4 pb-24 border-t border-gray-100 bg-gray-50/50 mt-auto shrink-0 z-10">
                    <button onClick={() => setShowDissolve(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-bold text-red-500 bg-white border border-red-100 shadow-sm transition-all active:scale-[0.98]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Dissolve Group
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Desktop: sidebar */}
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
                  {members.members.map(m => {
                    const userColor = `bg-${['blue', 'violet', 'emerald', 'amber', 'rose'][Math.abs((m.name || 'a').charCodeAt(0)) % 5]}-500`;
                    return (
                      <div key={m.name} className="flex items-center gap-2.5 py-1.5 group">
                        <div className="relative shrink-0">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white overflow-hidden ${userColor}`}>
                            {m.avatar?.startsWith('http') ? <img src={m.avatar} className="w-full h-full object-cover" alt="" /> : m.name[0]?.toUpperCase()}
                          </div>
                          {m.online && <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 border-2 border-white rounded-full" />}
                        </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[12px] font-semibold text-gray-800 truncate">{m.name}</p>
                          {['creator', 'admin'].includes(m.role) && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 shrink-0">Admin</span>
                          )}
                        </div>
                        <p className={`text-[10px] ${m.online ? 'text-emerald-500' : 'text-gray-300'}`}>{m.online ? 'Online' : 'Offline'}</p>
                      </div>
                      {members.isAdmin && m.id !== dbUserId && (
                        <div className="relative shrink-0">
                          <button onClick={() => setMemberMenuOpts(memberMenuOpts === m.id ? null : m.id)}
                            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                          </button>
                          {memberMenuOpts === m.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setMemberMenuOpts(null)} />
                              <div className="absolute right-0 top-7 w-36 bg-white border border-gray-100 rounded-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1)] z-20 py-1 animate-fadeIn">
                                <button onClick={() => { setMemberToKick(m); setMemberMenuOpts(null); }} className="w-full text-left px-4 py-2 text-[12px] font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  Remove User
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    );
                  })}
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

            </div>
          )}

          {/* Add Member modal */}
          {showAddMember && members && (
            <AddMemberModal
              existingIds={members.members.map((m: any) => m.id).filter(Boolean)}
              onClose={() => setShowAddMember(false)}
              onConfirm={(userIds) => { addMembers(userIds); setShowAddMember(false); }}
            />
          )}

          {/* Remove Member Confirmation Modal */}
          {memberToKick && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setMemberToKick(null)} />
              <div className="relative bg-white w-full max-w-sm rounded-[24px] shadow-2xl overflow-hidden p-7 animate-fadeInScale">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="text-[18px] font-bold text-gray-900 mb-2">Remove Participant?</h3>
                <p className="text-[14px] text-gray-500 mb-8 leading-relaxed">Are you sure you want to remove <span className="font-semibold text-gray-900">{memberToKick.name}</span> from this group? They will lose all access to the chat history.</p>
                <div className="flex gap-3">
                  <button onClick={() => setMemberToKick(null)} className="flex-1 py-3 px-4 rounded-xl font-bold text-[13px] text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
                  <button onClick={() => { removeMember(memberToKick.id); setMemberToKick(null); }} className="flex-1 py-3 px-4 rounded-xl font-bold text-[13px] text-white bg-red-500 hover:bg-red-600 shadow-sm shadow-red-500/20 transition-all">Remove</button>
                </div>
              </div>
            </div>
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

      {/* ── Image Preview Modal ── */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 transition-opacity animate-fadeIn" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-4 sm:top-6 right-4 sm:right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all z-50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <img src={previewImage} className="max-w-full max-h-full object-contain animate-fadeInScale" alt="Preview" onClick={(e) => e.stopPropagation()} />
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
  { id: 1, name: 'Alex Chen',     role: 'Founder & CEO',    bio: 'Building the future of AI-driven copy trading on-chain.',        twitter: '@alexchen_defi', followers: 12400, initials: 'AC', bgColor: 'bg-blue-500' },
  { id: 2, name: 'Sarah Kim',     role: 'Co-founder & CTO', bio: 'MEV researcher & Solidity engineer. prev @Flashbots.',           twitter: '@sarahkim_eth',  followers: 8900,  initials: 'SK', bgColor: 'bg-violet-500' },
  { id: 3, name: 'Marcus Rivera', role: null,                bio: 'DeFi yield optimizer. Obsessed with capital efficiency.',         twitter: null,             followers: 15600, initials: 'MR', bgColor: 'bg-emerald-500' },
  { id: 4, name: 'Emily Zhang',   role: 'CEO',              bio: 'On-chain credit scoring for the underbanked. ex-Goldman.',       twitter: '@emilyzhang',    followers: 6700,  initials: 'EZ', bgColor: 'bg-amber-500' },
  { id: 5, name: 'David Park',    role: 'Head of Research', bio: 'Tokenomics & AI agent marketplace research. PhD candidate.',     twitter: '@dpark_rsch',    followers: 4200,  initials: 'DP', bgColor: 'bg-rose-500' },
  { id: 6, name: 'Lisa Wang',     role: 'Founder & CPO',   bio: 'Product-led growth for web3 native apps. ex-Figma.',            twitter: null,             followers: 3100,  initials: 'LW', bgColor: 'bg-cyan-500' },
  { id: 7, name: 'James Liu',     role: null,               bio: 'Investing in RWA & stablecoin infrastructure since 2019.',       twitter: '@jamesliu_vc',   followers: 28500, initials: 'JL', bgColor: 'bg-indigo-500' },
  { id: 8, name: 'Nina Patel',    role: 'Lead Engineer',   bio: 'Solidity & ZK circuits. love hard technical problems.',           twitter: null,             followers: 5400,  initials: 'NP', bgColor: 'bg-pink-500' },
  { id: 9, name: 'Tom Wu',        role: 'CFO',              bio: 'Treasury management & tokenomics for DeFi protocols.',           twitter: '@tomwu_fi',      followers: 7800,  initials: 'TW', bgColor: 'bg-orange-500' },
];

const AGENT_CATEGORIES = ['All', 'Finance', 'Research', 'DeFi'];

// Mock "strangers" database — not in contacts
const STRANGER_DB = [
  { id: 's1', name: 'Alice Zhou',   account: '@alicez',     email: 'alice@defi.xyz',        role: 'DeFi Researcher',       mutual: 3, grad: 'from-fuchsia-500 to-pink-500',   initials: 'AZ' },
  { id: 's2', name: 'Bob Chen',     account: '@bobchen',    email: 'bob@cryptofund.io',      role: 'Portfolio Manager',     mutual: 1, grad: 'from-sky-500 to-blue-500',       initials: 'BC' },
  { id: 's3', name: 'Chloe Martin', account: '@chloe_m',    email: 'chloe@loka.fi',         role: 'Smart Contract Auditor',mutual: 7, grad: 'from-emerald-500 to-teal-500',   initials: 'CM' },
  { id: 's4', name: 'Daniel Lee',   account: '@dlee_web3',  email: 'd.lee@rwa.capital',      role: 'RWA Strategist',        mutual: 2, grad: 'from-amber-400 to-orange-400',   initials: 'DL' },
  { id: 's5', name: 'Eva Rossi',    account: '@evarossi',   email: 'eva@stablecoin.io',      role: 'Protocol Economist',    mutual: 0, grad: 'from-violet-500 to-purple-500',  initials: 'ER' },
  { id: 's6', name: 'Tom Zhang',    account: '@tomzhang',   email: 'tom@lokafi.xyz',         role: 'Yield Farmer',          mutual: 4, grad: 'from-rose-500 to-pink-500',      initials: 'TZ' },
  { id: 's7', name: 'Jay Park',     account: '@jaypark',    email: 'jay@onchain.vc',         role: 'On-chain Analyst',      mutual: 0, grad: 'from-indigo-500 to-blue-600',   initials: 'JP' },
  { id: 's8', name: 'Lena Fischer', account: '@lena_fi',    email: 'lena@defiresearch.io',   role: 'Token Economist',       mutual: 2, grad: 'from-cyan-500 to-sky-500',       initials: 'LF' },
  { id: 's9', name: 'Mike Torres',  account: '@miketorres', email: 'mike@creditlayer.io',    role: 'Credit Analyst',        mutual: 1, grad: 'from-orange-400 to-amber-500',   initials: 'MT' },
];

const AddFriendModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [q, setQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [sendError, setSendError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!q.trim() || q.trim().length < 2) return;
    setSearching(true);
    setSearched(false);
    setSendError(null);
    try {
      const users = await api.searchUsers(q.trim());
      setResults(users);
    } catch {
      setResults([]);
    } finally {
      setSearched(true);
      setSearching(false);
    }
  };

  const sendRequest = async (userId: string) => {
    if (sent.has(userId)) return;
    setSendError(null);
    try {
      await api.sendFriendRequest(userId);
      setSent(prev => { const n = new Set(prev); n.add(userId); return n; });
    } catch (err: any) {
      setSendError(err?.message || 'Failed to send request');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-[15px] font-bold text-gray-900">Add Friend</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Search by name or email</p>
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
                placeholder="Name or email..."
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <button onClick={handleSearch}
              className="px-4 py-2.5 bg-gray-900 text-white text-[12px] font-bold rounded-xl hover:bg-gray-700 transition-all shrink-0">
              Search
            </button>
          </div>
          {sendError && <p className="text-[11px] text-red-500 mt-2">{sendError}</p>}
        </div>

        {/* Results area */}
        <div className="min-h-[120px] max-h-72 overflow-y-auto px-5 pb-4">
          {searching && (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
              <p className="text-[11px] text-gray-400">Searching...</p>
            </div>
          )}

          {searched && !searching && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-1.5">
              <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <p className="text-[13px] font-semibold text-gray-400">No users found</p>
              <p className="text-[11px] text-gray-300">Try a different name or email</p>
            </div>
          )}

          {!searching && results.map((s: any) => {
            const isSent = sent.has(s.id);
            const initials = (s.name || 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div key={s.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0 overflow-hidden bg-${['blue', 'violet', 'emerald', 'amber', 'rose'][Math.abs((s.name || s.email?.split('@')[0] || 'U').charCodeAt(0)) % 5]}-500`}>
                  {s.avatar?.startsWith('http') ? <img src={s.avatar} className="w-full h-full object-cover" alt="" /> : (s.avatar || initials)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-gray-900 leading-tight">{s.name || 'Unknown'}</p>
                  {s.email && <p className="text-[10px] text-gray-400 mt-0.5">{s.email}</p>}
                </div>
                <button onClick={() => sendRequest(s.id)}
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

// ── Create Group Modal ─────────────────────────────────────────────────
const CreateGroupModal: React.FC<{
  onClose: () => void;
  onCreated?: (group: any) => void;
}> = ({ onClose, onCreated }) => {
  const [step, setStep] = useState<'members' | 'info'>('members');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const [groupName, setGroupName] = useState('');
  const [groupBio, setGroupBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);

  useEffect(() => {
    api.getFriends().then((res: any[]) => {
      setContacts(res.map((f: any) => ({ id: f.user.id, name: f.user.name, avatar: f.user.avatar })));
      setLoadingContacts(false);
    }).catch(err => {
      console.error(err);
      setLoadingContacts(false);
    });
  }, []);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = ev => setAvatarUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const toggleMember = (id: string | number) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Agents available to add (use negative IDs to distinguish from contacts)
  const AVAILABLE_AGENTS = [
    { id: -1, name: 'Loka Agent',      desc: 'AI-powered investment assistant',   initials: 'L' },
    { id: -2, name: 'Risk Analyzer',   desc: 'Credit scoring & risk analysis',     initials: 'R' },
    { id: -3, name: 'Market Research', desc: 'Real-time market intelligence',      initials: 'M' },
    { id: -4, name: 'Yield Optimizer', desc: 'Find the best yield opportunities',  initials: 'Y' },
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
            {loadingContacts ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
              </div>
            ) : contacts.length > 0 ? contacts.map(c => {
              const userColor = `bg-${['blue', 'violet', 'emerald', 'amber', 'rose'][Math.abs((c.name || 'a').charCodeAt(0)) % 5]}-500`;
              const isSel = selected.has(c.id);
              const initials = (c.name || c.email || 'U').substring(0, 2).toUpperCase();
              return (
                <div key={c.id} onClick={() => toggleMember(c.id)}
                  className={`flex items-center gap-3 px-5 py-2.5 cursor-pointer transition-colors ${isSel ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                  {c.avatar && c.avatar.startsWith('http') ? (
                    <img src={c.avatar} className="w-9 h-9 rounded-full object-cover shrink-0" alt="" />
                  ) : (
                    <div className={`w-9 h-9 rounded-full ${userColor} text-white flex items-center justify-center text-[12px] font-black shrink-0`}>{initials}</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-semibold text-gray-900 leading-tight">{c.name || c.email?.split('@')[0]}</p>
                      <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">User</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">{c.email}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${isSel ? 'bg-gray-900 border-gray-900' : 'border-gray-200'}`}>
                    {isSel && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                </div>
              );
            }) : (
              <div className="px-5 py-6 text-center text-[12px] text-gray-400">No contacts found</div>
            )}
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
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  try {
                    // Upload avatar to R2 if one was selected
                    let uploadedAvatarUrl: string | undefined;
                    if (avatarFile) {
                      const uploadRes = await api.uploadFile(avatarFile);
                      uploadedAvatarUrl = uploadRes.url;
                    }
                    const group = await api.createCommunityGroup({
                      name: groupName.trim() || 'New Group',
                      bio: groupBio,
                      avatar: uploadedAvatarUrl,
                      memberIds: Array.from(selected).map(String)
                    });
                    onCreated?.(group);
                  } catch (err) {
                    console.error('Failed to create group:', err);
                    alert('Failed to create group');
                    setLoading(false);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${loading ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-700'}`}>
                {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {loading ? 'Creating...' : 'Create Group'}
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
  { id: 'r1', name: 'Bob Chen',     account: '@bobchen',    role: 'Portfolio Manager',     mutual: 1, grad: 'from-sky-500 to-blue-500',     initials: 'BC', time: '2m ago' },
  { id: 'r2', name: 'Lena Fischer', account: '@lena_fi',    role: 'Token Economist',       mutual: 2, grad: 'from-cyan-500 to-sky-500',     initials: 'LF', time: '1h ago' },
  { id: 'r3', name: 'Jay Park',     account: '@jaypark',    role: 'On-chain Analyst',      mutual: 0, grad: 'from-indigo-500 to-blue-600', initials: 'JP', time: '3h ago' },
];

// ── ContactsPage ───────────────────────────────────────────────────────
const ContactsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'friend' | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { ready, authenticated, getAccessToken } = usePrivy();

  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [followedUp, setFollowedUp] = useState<Set<string>>(new Set());

  const fetchLists = useCallback(async () => {
    // Self-sufficiently ensure token is set before fetching
    try {
      const token = await getAccessToken();
      if (token) {
        api.setToken(token);
        api.setTokenGetter(getAccessToken);
      }
    } catch {}
    setLoading(true);
    Promise.all([
      api.getFriends().catch(() => []),
      api.getFriendRequests().catch(() => [])
    ])
    .then(([friendsData, requestsData]) => {
      setContacts(friendsData.map((f: any) => ({
        id: f.user.id,
        name: f.user.name || 'User',
        email: f.user.email,
        bio: f.user.email || 'LokaCash Member',
        role: 'LokaCash User',
        initials: (f.user.name || 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
        avatar: f.user.avatar,
        since: f.since,
        bgColor: `bg-${['blue', 'violet', 'emerald', 'amber', 'rose'][Math.abs((f.user.name || 'a').charCodeAt(0)) % 5]}-500`
      })));

      setRequests(requestsData.map((r: any) => ({
        id: r.id, 
        userId: r.requester.id,
        name: r.requester.name || 'User',
        email: r.requester.email,
        account: r.requester.email,
        role: 'New Connection',
        mutual: 0,
        initials: (r.requester.name || 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
        grad: `from-${['sky', 'fuchsia', 'emerald', 'amber'][Math.abs((r.requester.name || 'a').charCodeAt(0)) % 4]}-500 to-${['blue', 'pink', 'teal', 'orange'][Math.abs((r.requester.name || 'a').charCodeAt(0)) % 4]}-500`,
        time: new Date(r.createdAt).toLocaleDateString()
      })));
    })
    .finally(() => setLoading(false));
  }, [getAccessToken]);

  // Re-run when auth state changes (e.g. user logs in while on this page)
  useEffect(() => {
    if (!(ready && authenticated)) {
      // Not logged in — stop the spinner, show empty state
      if (ready) setLoading(false);
      return;
    }
    fetchLists();
    const unsubRequest = socket.on('friend:request', () => fetchLists());
    const unsubAccepted = socket.on('friend:accepted', () => fetchLists());
    return () => { unsubRequest(); unsubAccepted(); };
  }, [ready, authenticated, fetchLists]);

  const handleAccept = async (id: string) => {
    try {
      await api.acceptFriendRequest(id);
      setAccepted(prev => new Set(prev).add(id));
      setTimeout(() => {
        setRequests(prev => prev.filter(r => r.id !== id));
        fetchLists();
      }, 1500);
    } catch (e) { console.error('Accept fail', e); }
  };
  const handleDecline = async (id: string) => {
    try {
      await api.rejectFriendRequest(id);
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (e) { console.error('Decline fail', e); }
  };
  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleMessage = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    try {
      const conv = await api.createDMConversation(userId);
      navigate(`/chat?convId=${conv.id}`);
    } catch (err) { }
  };

  const suggestions = STRANGER_DB
    .filter(s => s.mutual > 0 && !dismissed.has(s.id))
    .sort((a, b) => b.mutual - a.mutual);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto">
      {modal === 'friend' && <AddFriendModal onClose={() => setModal(null)} />}
      <div className="animate-fadeIn pb-24 p-4 sm:p-8 md:p-10 lg:p-12 max-w-[1400px] mx-auto w-full min-h-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">Contacts</h1>
          <p className="text-[13px] text-gray-400 mt-1">Manage your network and professional connections</p>
        </div>
        <div className="flex items-center gap-3">
          {loading ? (
             <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
          ) : (
            <span className="px-3 py-1 rounded-full bg-gray-50 border border-gray-100 text-[11px] text-center leading-tight sm:leading-normal font-bold text-gray-400">{contacts.length} Connections</span>
          )}
          <button onClick={() => setModal('friend')}
            className="w-10 h-10 rounded-[14px] flex items-center justify-center bg-gray-900 text-white hover:bg-black hover:shadow-xl hover:shadow-gray-200 hover:-translate-y-0.5 active:translate-y-0 transition-all group">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path className="group-hover:stroke-[3px] transition-all" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>
      </div>

      {/* ── Section: Friend Requests ── */}
      {requests.length > 0 && (
        <div className="mb-12 animate-slideDown">
          <div className="flex items-center gap-2.5 mb-4 px-1 text-gray-900 font-bold text-[14px] uppercase tracking-widest opacity-80">
            Friend Requests
            <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] flex items-center justify-center font-black">{requests.length}</span>
          </div>
          <div className="bg-white border border-gray-100 rounded-[24px] shadow-sm shadow-gray-50 overflow-hidden divide-y divide-gray-50">
            {requests.map((r) => {
              const isAccepted = accepted.has(r.id);
              return (
                <div key={r.id} className={`flex items-center gap-4 px-6 py-5 transition-all ${isAccepted ? 'bg-emerald-50/40' : 'hover:bg-gray-50/50'}`}>
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${r.grad} flex items-center justify-center text-[14px] font-black text-white shrink-0 shadow-sm shadow-gray-200 overflow-hidden`}>
                    {r.avatar?.startsWith('http') ? <img src={r.avatar} className="w-full h-full object-cover" alt="" /> : r.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-bold text-gray-900">{r.name}</p>
                      <span className="text-[10px] text-gray-400 font-medium px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100">{r.account}</span>
                    </div>
                    <p className="text-[12px] text-gray-400 mt-1">
                      {r.role} · <span className="font-bold text-gray-500">{r.mutual} mutuals</span> · {r.time}
                    </p>
                  </div>
                  {isAccepted ? (
                    <span className="text-[12px] font-black text-emerald-600 flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                      Connected
                    </span>
                  ) : (
                    <div className="flex items-center gap-2.5 shrink-0 ml-4">
                      <button onClick={(e) => { e.stopPropagation(); handleDecline(r.id); }}
                        className="px-5 py-2.5 rounded-2xl text-[12px] font-bold text-gray-400 bg-white hover:bg-gray-50 border border-gray-100 transition-all">
                        Decline
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleAccept(r.id); }}
                        className="px-5 py-2.5 rounded-2xl text-[12px] font-bold text-white bg-gray-900 hover:bg-black shadow-md shadow-gray-100 transition-all active:scale-95">
                        Accept
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Section: All Contacts ── */}
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-1">
          <div className="flex items-center gap-3">
            <h2 className="text-[14px] font-bold text-gray-900 uppercase tracking-widest opacity-80">All Contacts</h2>
            <span className="text-[11px] font-black text-gray-400 bg-gray-100/50 px-2.5 py-1 rounded-xl">{filtered.length}</span>
          </div>
          <div className="relative w-full sm:max-w-[320px]">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search connections..."
              className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-gray-900/5 focus:border-gray-200 focus:bg-white transition-all placeholder:text-gray-300" />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none scale-90"><I.Search /></div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm shadow-gray-50 divide-y divide-gray-50">
          {filtered.map((c) => {
            const gradMap: Record<string, string> = { 'bg-blue-500': 'from-blue-500 to-indigo-500', 'bg-violet-500': 'from-violet-500 to-purple-500', 'bg-emerald-500': 'from-emerald-500 to-teal-500', 'bg-amber-500': 'from-amber-400 to-orange-400', 'bg-rose-500': 'from-rose-500 to-pink-500', 'bg-cyan-500': 'from-cyan-500 to-sky-500', 'bg-indigo-500': 'from-indigo-500 to-blue-600', 'bg-pink-500': 'from-pink-500 to-rose-500', 'bg-orange-500': 'from-orange-400 to-amber-500' };
            const grad = gradMap[c.bgColor] ?? 'from-gray-400 to-gray-500';
            return (
              <div key={c.id} onClick={(e) => handleMessage(e, c.id)} className="flex items-center gap-3 sm:gap-5 px-4 sm:px-6 py-4 sm:py-5 hover:bg-gray-50/50 transition-all cursor-pointer group">
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-[14px] font-black text-white shrink-0 shadow-sm shadow-gray-100 group-hover:scale-105 transition-transform overflow-hidden`}>
                  {c.avatar?.startsWith('http') ? <img src={c.avatar} className="w-full h-full object-cover" alt="" /> : c.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2.5 mb-0.5 min-w-0 pr-2">
                    <p className="text-[14px] sm:text-[15px] font-bold text-gray-900 truncate">{c.name}</p>
                    {c.role && <span className="shrink-0 whitespace-nowrap text-[10px] font-black text-gray-400 uppercase tracking-tighter bg-gray-50 px-1.5 sm:px-2 py-0.5 rounded-lg border border-gray-100 self-start">{c.role}</span>}
                  </div>
                  <p className="text-[13px] text-gray-400 truncate group-hover:text-gray-500 transition-colors font-medium">{c.bio}</p>
                </div>
                <button onClick={(e) => handleMessage(e, c.id)} className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl text-[12px] font-bold text-gray-400 hover:text-gray-900 hover:bg-white hover:border border-transparent hover:border-gray-100 hover:shadow-sm transition-all opacity-0 group-hover:opacity-100">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                  Message
                </button>
              </div>
            );
          })}
          {(!filtered || filtered.length === 0) && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
              <svg className="w-16 h-16 text-gray-200 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-4.35-4.35M16.5 10.5a6 6 0 11-12 0 6 6 0 0112 0z" /></svg>
              <p className="text-[14px] text-gray-400 font-medium tracking-tight">No connections found in your network</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Section: Suggested for You (At Bottom - Horizontal Long Cards) ── */}
      {suggestions.length > 0 && (
        <div className="mt-16 pt-10 border-t border-gray-100 animate-slideUp">
          <div className="flex flex-col mb-6 px-1">
            <h2 className="text-[14px] font-bold text-gray-900 uppercase tracking-widest opacity-80">People you may know</h2>
            <p className="text-[11px] text-gray-400 mt-1.5 font-bold flex items-center gap-1.5 opacity-60">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Suggestions based on your mutual network
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {suggestions.slice(0, 6).map(s => {
              const isFollowed = followedUp.has(s.id);
              return (
                <div key={s.id} className="relative bg-white border border-gray-100 rounded-[28px] p-3.5 sm:p-5 flex items-center gap-3 sm:gap-4 hover:shadow-xl hover:shadow-gray-100/40 hover:-translate-y-1.5 hover:border-gray-200 transition-all group active:scale-[0.98]">
                  {/* Dismiss X */}
                  <button onClick={() => setDismissed(prev => { const n = new Set(prev); n.add(s.id); return n; })}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-gray-200 hover:text-gray-900 hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  
                  {/* Avatar Left */}
                  <div className={`w-14 h-14 rounded-[20px] bg-gradient-to-br ${s.grad} flex items-center justify-center text-[20px] font-black text-white shrink-0 shadow-sm ring-4 ring-gray-50/50 group-hover:scale-110 transition-transform`}>
                    {s.initials}
                  </div>
                  
                  {/* Content Right */}
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-[14px] font-bold text-gray-900 leading-tight mb-0.5 truncate">{s.name}</p>
                    <p className="text-[11px] text-gray-400 font-bold mb-3 truncate italic opacity-80">{s.role}</p>
                    
                    <div className="flex items-center justify-between gap-3 pt-1 border-t border-gray-50 mt-1">
                       <p className="text-[11px] text-gray-400 font-black">
                        <span className="text-gray-900 underline decoration-blue-500/30 underline-offset-2">{s.mutual}</span> MUTUALS
                      </p>
                      {isFollowed ? (
                        <span className="px-3.5 py-1.5 rounded-2xl text-[11px] font-black text-emerald-600 bg-emerald-50/50 border border-emerald-100 flex items-center gap-1.5 animate-bounceIn">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                          SENT
                        </span>
                      ) : (
                        <button onClick={() => setFollowedUp(prev => { const n = new Set(prev); n.add(s.id); return n; })}
                          className="px-4 py-2 rounded-2xl text-[11px] font-black text-white bg-gray-900 hover:bg-black shadow-lg shadow-gray-100 transition-all active:scale-90">
                          ADD
                        </button>
                      )}
                    </div>
                  </div>
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

const DiscoverPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Agents' | 'People' | 'Groups'>('Agents');
  const [agentCat, setAgentCat] = useState('All');

  const tabs = ['Agents', 'People', 'Groups'] as const;

  const filteredAgents = agentCat === 'All' ? DISCOVER_AGENTS : DISCOVER_AGENTS.filter(a => a.category === agentCat);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto">
      <div className="animate-fadeIn pb-24 p-4 sm:p-8 md:p-10 lg:p-12 max-w-[1600px] mx-auto w-full min-h-full">
        {/* Header + Tabs */}
        <h1 className="text-[22px] font-semibold text-gray-900 mb-4">Discover</h1>
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

        {/* ── People Tab ── */}
        {activeTab === 'People' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[
              { name: 'Alex Chen', role: 'Founder', org: 'ComputeDAO', score: 1200, investments: 0, raises: 3, avatar: 'A', color: 'from-violet-500 to-purple-700', followers: '12.5k' },
              { name: 'Sarah Kim', role: 'Investor', org: 'Independent', score: 980, investments: 12, raises: 0, avatar: 'S', color: 'from-indigo-600 to-blue-700', followers: '450' },
              { name: 'Marcus Johnson', role: 'Investor', org: 'Alpha Capital', score: 1450, investments: 28, raises: 0, avatar: 'M', color: 'from-emerald-500 to-teal-700', followers: '2.1k' },
              { name: 'Lisa Wang', role: 'Founder', org: 'Rezi Inc.', score: 890, investments: 0, raises: 2, avatar: 'L', color: 'from-rose-500 to-pink-600', followers: '18.2k' },
              { name: 'David Park', role: 'Investor', org: 'DePhi Ventures', score: 720, investments: 5, raises: 0, avatar: 'D', color: 'from-amber-600 to-orange-600', followers: '8,900' },
              { name: 'Emma Torres', role: 'Contributor', org: 'Loka DAO', score: 650, investments: 3, raises: 0, avatar: 'E', color: 'from-sky-500 to-blue-500', followers: '1,200' },
              { name: 'James Liu', role: 'Founder', org: 'Deeptrue Corp.', score: 760, investments: 1, raises: 1, avatar: 'J', color: 'from-cyan-600 to-blue-700', followers: '34.5k' },
              { name: 'Rachel Green', role: 'Investor', org: 'Onchain Insights', score: 1100, investments: 19, raises: 0, avatar: 'R', color: 'from-fuchsia-600 to-purple-600', followers: '5,020' },
              { name: 'Sam Altman', role: 'Founder', org: 'OpenAI', score: 9990, investments: 42, raises: 5, avatar: 'S', color: 'from-gray-700 to-gray-900', followers: '3.2M' },
              { name: 'Brian Armstrong', role: 'Founder', org: 'Coinbase', score: 8500, investments: 30, raises: 2, avatar: 'B', color: 'from-blue-600 to-blue-800', followers: '1.2M' },
            ].map((person, i) => (
              <div key={i} className="group cursor-pointer flex flex-col h-full rounded-[20px] overflow-hidden bg-white hover:shadow-xl transition-all duration-500 border border-gray-100 hover:border-gray-200">
                {/* Large Profile Image Area */}
                <div className={`h-28 w-full bg-gradient-to-br ${person.color} relative flex items-center justify-center overflow-hidden`}>
                   <span className="text-white/30 font-black text-5xl transition-transform duration-700 group-hover:scale-110 drop-shadow-lg">{person.avatar}</span>
                   {/* Top Left X (Twitter) Followers */}
                   <a href="#" onClick={(e) => e.stopPropagation()} className="absolute top-3 left-3 bg-white/95 backdrop-blur shadow-sm text-gray-900 text-[10px] font-bold px-2 py-1 rounded-lg z-10 flex items-center gap-1.5 border border-white/20 hover:scale-105 hover:bg-white transition-all cursor-pointer">
                     <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                     {person.followers}
                   </a>
                   {/* Top Right Add Friend */}
                   <button onClick={(e) => e.stopPropagation()} className="absolute top-3 right-3 w-8 h-8 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors z-10 border border-white/10">
                     <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                   </button>
                   <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                {/* Content */}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-base font-bold text-gray-900 leading-tight mb-1.5 group-hover:text-blue-600 transition-colors">{person.name}</h3>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed mb-3 line-clamp-3">
                    {person.role} @ {person.org}. {person.investments > 0 ? `${person.investments} investments. ` : ''}Active ({person.score.toLocaleString()} pts).
                  </p>
                  <div className="mt-auto pt-2 flex items-center justify-between border-t border-gray-50">
                    <a href="#" onClick={(e) => e.preventDefault()} className="text-[11px] font-semibold text-gray-400 hover:text-blue-600 transition-all">
                      {person.name.split(' ')[0].toLowerCase() + (person.name.split(' ')[1] ? person.name.split(' ')[1].toLowerCase() : '')}.com
                    </a>
                    <div className="flex items-center gap-2.5 text-gray-400">
                      <button className="hover:text-[#0A66C2] hover:scale-110 transition-all">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
const PAGE_PATHS: Record<string, string> = {
  [Page.SUPER_AGENT]: '/',
  [Page.CHATS]: '/chat',
  [Page.CONTACTS]: '/contacts',
  [Page.DISCOVER]: '/discover',
  [Page.INVEST]: '/market',
  [Page.API]: '/api',
  [Page.SETTINGS]: '/settings',
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const page = (Object.keys(PAGE_PATHS).find(k => location.pathname === PAGE_PATHS[k] || (PAGE_PATHS[k] !== '/' && location.pathname.startsWith(PAGE_PATHS[k] + '/'))) as Page) || Page.SUPER_AGENT;
  const go = (p: Page) => navigate(PAGE_PATHS[p] || '/');
  const [expanded, setExpanded] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { ready, authenticated, user, getAccessToken } = usePrivy();
  const { logout } = useLogout({
    onSuccess: () => navigate('/'),
  });
  const isLoggedIn = ready && authenticated;

  // Sync Privy access token to API client and socket and sync user to DB
  useEffect(() => {
    if (ready && authenticated) {
      // Check for deep-link post-login redirection
      const redirect = sessionStorage.getItem('postLoginRedirect');
      if (redirect) {
        sessionStorage.removeItem('postLoginRedirect');
        navigate(redirect, { replace: true });
      }

      // Provide dynamic token getter to ensure api & socket always fetch fresh tokens on demand
      api.setTokenGetter(getAccessToken);
      socket.setTokenGetter(getAccessToken);

      getAccessToken().then(token => {
        if (token) {
          api.setToken(token);
          socket.setToken(token);
          // Sync user info to backend so they appear in search
          const email = user?.google?.email || user?.twitter?.username || user?.email?.address;
          const name = user?.google?.name || user?.twitter?.name || user?.email?.address?.split('@')[0];
          fetch(`${import.meta.env.VITE_API_BASE || '/api'}/auth/sync`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
             body: JSON.stringify({ email, name, avatar: (user?.google as any)?.picture || (user?.twitter as any)?.profilePictureUrl })
          }).then(r => r.json()).then(data => {
            if (data?.id) localStorage.setItem('dbUserId', data.id);
          }).catch(console.error);
        }
      });

      // ── Telegram-grade: proactive token refresh on wake / tab re-focus ──
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          console.log('[Auth] Page visible — refreshing token proactively');
          getAccessToken().then(freshToken => {
            if (freshToken) {
              api.setToken(freshToken);
              socket.reconnectWithToken(freshToken);
            }
          }).catch(err => console.warn('[Auth] Visibility refresh failed:', err));
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // ── Telegram-grade: periodic keep-alive token refresh (every 5 min) ──
      const keepAliveInterval = setInterval(() => {
        getAccessToken().then(freshToken => {
          if (freshToken) {
            api.setToken(freshToken);
            // Only update socket auth, don't force reconnect if already connected
            socket.reconnectWithToken(freshToken);
          }
        }).catch(() => {});
      }, 5 * 60 * 1000);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        clearInterval(keepAliveInterval);
      };
    } else if (ready && !authenticated) {
      api.clearToken();
      socket.clearToken();
    }
  }, [ready, authenticated, getAccessToken, user]);

  // Real unread count for Community badge
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  
  const fetchUnread = useCallback(() => {
    if (!isLoggedIn) return;
    api.getUnreadCount()
      .then(data => setChatUnreadCount(data.unread || 0))
      .catch(() => {});
  }, [isLoggedIn]);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchUnread]);

  // Live update badge over WebSocket
  useEffect(() => {
    const unsubRequest = socket.on('friend:request', () => fetchUnread());
    const unsubAccepted = socket.on('friend:accepted', () => fetchUnread());
    const unsubMsg = socket.on('dm:message', () => fetchUnread());
    return () => {
      unsubRequest();
      unsubAccepted();
      unsubMsg();
    };
  }, [fetchUnread]);

  // Derive user display info from Privy user object
  const userName = user?.google?.name || user?.twitter?.username || user?.email?.address?.split('@')[0] || 'User';
  const userInitial = userName.charAt(0).toUpperCase();
  const userAvatar = (user?.google as any)?.picture || (user?.twitter as any)?.profilePictureUrl;

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
      <TxModal />

      <Sidebar expanded={expanded} onToggle={() => setExpanded(!expanded)} page={page} go={go} isDark={isDark} onToggleDark={toggleDark}
        isLoggedIn={isLoggedIn} onLogin={() => {
          // Privy's strict OAuth callback whitelist blocks dynamic URLs like /market/startup/:id
          // Intercept the login flow, route the user to the whitelist root, and restore after auth
          if (location.pathname.startsWith('/market/startup/')) {
            sessionStorage.setItem('postLoginRedirect', location.pathname);
            navigate('/market', { replace: true });
            setTimeout(() => setShowAuthModal(true), 50);
          } else {
            setShowAuthModal(true);
          }
        }} onLogout={logout}
        userName={userName} userInitial={userInitial} userAvatar={userAvatar} />

      <main className={`flex-1 flex flex-col overflow-hidden h-full pt-[max(env(safe-area-inset-top),32px)] md:pt-0 pb-14 md:pb-0 ${mainBg}`}>
        <div className="flex-1 overflow-y-auto flex flex-col md:m-0">
          <Routes>
            <Route path="/" element={<SuperAgentHome />} />
            <Route path="/chat" element={<ChatsPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/market/*" element={<Market />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/portfolio" element={<Portfolio isWalletConnected={isLoggedIn} onConnect={() => setShowAuthModal(true)} onLogout={logout} />} />
            <Route path="/api" element={<ApiLanding />} />
            <Route path="*" element={<SuperAgentHome />} />
          </Routes>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 flex items-center justify-around px-1 pt-1 z-50" style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}>
        {navItems.map(({ key, icon: Icon, label }) => {
          const u = key === Page.CHATS ? chatUnreadCount : 0;
          return (
            <button key={key} onClick={() => go(key)}
              className={`relative flex flex-col items-center gap-0.5 py-1.5 px-1.5 rounded-lg transition-all ${page === key ? 'text-gray-900' : 'text-gray-400'}`}>
              <Icon />
              <span className="text-[9px] font-medium">{label}</span>
              {u > 0 && <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-gray-900 text-white text-[7px] font-bold rounded-full flex items-center justify-center">{u > 9 ? '9+' : u}</span>}
            </button>
          );
        })}
        {/* User / Sign-in button */}
        <button
          onClick={() => isLoggedIn ? navigate('/portfolio') : setShowAuthModal(true)}
          className={`relative flex flex-col items-center gap-0.5 py-1.5 px-1.5 rounded-lg transition-all ${location.pathname === '/portfolio' ? 'text-gray-900' : 'text-gray-400'}`}>
          {isLoggedIn ? (
            <div className="w-[18px] h-[18px] rounded-full bg-gray-900 flex items-center justify-center text-[8px] font-bold text-white overflow-hidden">
              {userAvatar ? <img src={userAvatar} alt="" className="w-full h-full object-cover" /> : userInitial}
            </div>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
          <span className="text-[9px] font-medium">{isLoggedIn ? 'Me' : 'Sign in'}</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
