import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page } from '../types';
import { I } from './Icons';
import { navItems, RECENTS } from '../constants';

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

export const Sidebar: React.FC<{
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

export default Sidebar;
