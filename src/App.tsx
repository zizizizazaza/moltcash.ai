import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { usePrivy, useLogout } from '@privy-io/react-auth';
import { Page } from './types';
import { I } from './components/Icons';
import AnimStyles from './components/AnimStyles';
import { Sidebar } from './components/Sidebar';
import SuperAgentHome from './components/SuperAgentHome';
import Market from './components/Market';
import Portfolio from './components/Portfolio';
import RealChatsPage from './components/ChatsPage';
import RealContactsPage from './components/ContactsPage';
import DiscoverPage from './components/DiscoverPage';
import ApiLanding from './components/ApiLanding';
import DeepResearch from './components/DeepResearch';
import AuthModal from './components/AuthModal';
import TxModal from './components/TxModal';
import OAuthCallbackHandler from './components/OAuthCallbackHandler';
import { PAGE_PATHS } from './constants';
import { api } from './services/api';
import { socket } from './services/socket';

// ── Re-exports for backward compatibility ──
// Other components import these from '../App'
export { I } from './components/Icons';
export { DISCOVER_AGENTS, AGENT_CATEGORIES, DISCOVER_CONTACTS, DISCOVER_GROUPS, STRANGER_DB } from './constants';
export { CreateAgentModal } from './components/CreateAgentModal';
export { CreateGroupModal } from './components/CreateGroupModal';
export { AddFriendModal } from './components/AddFriendModal';

const SettingsPage: React.FC = () => (
  <div className="flex-1 flex items-center justify-center h-full">
    <div className="text-center space-y-3">
      <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mx-auto text-xl">⚙️</div>
      <h2 className="text-[16px] font-semibold text-gray-900">Settings</h2>
      <p className="text-[13px] text-gray-400 max-w-[240px]">Account and preferences.</p>
    </div>
  </div>
);

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
