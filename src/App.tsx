import React, { useState, useEffect } from 'react';
import { usePrivy, useLogout } from '@privy-io/react-auth';
import { Icons, COLORS } from './constants';
import { Page } from './types';
import Dashboard from './components/Dashboard';
import Swap from './components/Swap';
import Market from './components/Market';
import AgentMode from './components/AgentMode';
import Portfolio from './components/Portfolio';
import Chat from './components/Chat';
import RiskModal from './components/RiskModal';
import AuthModal from './components/AuthModal';
import OAuthCallbackHandler from './components/OAuthCallbackHandler';
import TxModal from './components/TxModal';
import Landing from './components/Landing';
import Settings from './components/Settings';
import Groups from './components/Groups';
import Trade from './components/Trade';
import ApiLanding from './components/ApiLanding';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.CHAT);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalInitialStep, setAuthModalInitialStep] = useState<'login' | 'invite'>('login');
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { ready, authenticated } = usePrivy();
  const { logout } = useLogout({
    onSuccess: () => setCurrentPage(Page.CHAT),
  });
  const isWalletConnected = ready && authenticated;

  useEffect(() => {
    // Disclaimer removed — no longer auto-show risk modal

    const handleNav = () => setCurrentPage(Page.CHAT);
    const handleNavSwap = () => setCurrentPage(Page.SWAP);
    const handleNavMarket = () => setCurrentPage(Page.MARKET);
    const handleNavGroups = () => setCurrentPage(Page.GROUPS);
    const handleNavTrade = () => setCurrentPage(Page.TRADE);

    window.addEventListener('loka-nav-chat', handleNav);
    window.addEventListener('loka-nav-swap', handleNavSwap);
    window.addEventListener('loka-nav-market', handleNavMarket);
    window.addEventListener('loka-nav-groups', handleNavGroups);
    window.addEventListener('loka-nav-trade', handleNavTrade);

    return () => {
      window.removeEventListener('loka-nav-chat', handleNav);
      window.removeEventListener('loka-nav-swap', handleNavSwap);
      window.removeEventListener('loka-nav-market', handleNavMarket);
      window.removeEventListener('loka-nav-groups', handleNavGroups);
      window.removeEventListener('loka-nav-trade', handleNavTrade);
    };
  }, []);

  // After OAuth redirect: if authenticated but no invite code, show invite step
  useEffect(() => {
    if (ready && authenticated && !localStorage.getItem('loka_invite_code')) {
      setAuthModalInitialStep('invite');
      setShowAuthModal(true);
    }
  }, [ready, authenticated]);

  const triggerComingSoon = () => {
    setShowComingSoon(true);
    setTimeout(() => setShowComingSoon(false), 3000);
  };

  const acceptRisk = () => {
    localStorage.setItem('loka_risk_accepted', 'true');
    setShowRiskModal(false);
  };

  const connectWallet = () => {
    setAuthModalInitialStep('login');
    setShowAuthModal(true);
  };

  const handleLogin = () => {
    setShowAuthModal(false);
  };

  const isChatPage = currentPage === Page.CHAT;

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden selection:bg-black selection:text-white bg-white">
      <OAuthCallbackHandler />
    
      <div className={`fixed top-6 right-6 z-[100] transition-all duration-500 transform ${showComingSoon ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0 pointer-events-none'
        }`}>
        <div className="bg-black text-white px-6 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3">
          <span className="text-sm">⏳</span>
          <p className="text-xs font-bold tracking-widest ">Coming soon</p>
        </div>
      </div>

      {showRiskModal && <RiskModal onAccept={acceptRisk} onClose={() => setShowRiskModal(false)} />}
      {showAuthModal && <AuthModal initialStep={authModalInitialStep} onLogin={handleLogin} onClose={() => setShowAuthModal(false)} />}
      <TxModal />

      {/* Desktop Sidebar — hidden on mobile */}
      <nav className="hidden md:flex w-20 bg-white border-r border-gray-100 flex-col items-center py-6 shrink-0 z-50 shadow-sm relative">
        <div className="flex flex-col items-center gap-8 w-full">
          {/* Logo */}
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center font-black text-white hover:rotate-12 transition-transform cursor-pointer mb-2" onClick={() => setCurrentPage(Page.CHAT)}>
            L
          </div>

          {/* Primary Nav Links */}
          <div className="flex flex-col gap-6 w-full px-3">
            <SideNavButton
              active={currentPage === Page.CHAT}
              onClick={() => setCurrentPage(Page.CHAT)}
              icon={<Icons.Assets />}
              label="Assets"
            />
            <SideNavButton
              active={currentPage === Page.GROUPS}
              onClick={() => setCurrentPage(Page.GROUPS)}
              icon={<Icons.Groups />}
              label="Groups"
            />
            <SideNavButton
              active={currentPage === Page.TRADE}
              onClick={() => setCurrentPage(Page.TRADE)}
              icon={<Icons.Market />}
              label="Market"
            />
          </div>
        </div>

        {/* Bottom Nav Links */}
        <div className="mt-auto flex flex-col gap-6 w-full px-3 relative">
          <SideNavButton
            active={currentPage === Page.API}
            onClick={() => setCurrentPage(Page.API)}
            icon={<Icons.Code />}
            label="API"
          />
          <div className="relative">
            <SideNavButton
              active={currentPage === Page.PORTFOLIO}
              onClick={() => {
                if (!isWalletConnected) connectWallet();
                else setCurrentPage(Page.PORTFOLIO);
              }}
              icon={<Icons.User />}
              label={isWalletConnected ? "Profile" : "Sign in"}
              customClass={isWalletConnected ? "text-green-500" : ""}
            />
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col overflow-hidden h-full relative pb-16 md:pb-0">
        <div className="flex-1 overflow-y-auto">
          {currentPage === Page.DASHBOARD && <Dashboard />}
          {currentPage === Page.SWAP && <Swap />}
          {currentPage === Page.MARKET && <Market />}
          {currentPage === Page.AGENT && <AgentMode />}
          {currentPage === Page.PORTFOLIO && <Portfolio isWalletConnected={isWalletConnected} onConnect={connectWallet} onSettingsClick={() => setCurrentPage(Page.SETTINGS)} onLogout={() => logout()} />}
          {currentPage === Page.SETTINGS && <Settings onBack={() => setCurrentPage(Page.PORTFOLIO)} />}
          {currentPage === Page.CHAT && <Chat />}
          {currentPage === Page.GROUPS && <Groups />}
          {currentPage === Page.TRADE && <Trade />}
          {currentPage === Page.API && <ApiLanding />}
        </div>
      </main>

      {/* Mobile Bottom Tab Bar — visible only on mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around px-2 py-1 z-50 safe-bottom">
        <MobileTabButton active={currentPage === Page.CHAT} onClick={() => setCurrentPage(Page.CHAT)} icon={<Icons.Assets />} label="Assets" />
        <MobileTabButton active={currentPage === Page.GROUPS} onClick={() => setCurrentPage(Page.GROUPS)} icon={<Icons.Groups />} label="Groups" />
        <MobileTabButton active={currentPage === Page.TRADE} onClick={() => setCurrentPage(Page.TRADE)} icon={<Icons.Market />} label="Market" />
        <MobileTabButton active={currentPage === Page.API} onClick={() => setCurrentPage(Page.API)} icon={<Icons.Code />} label="API" />
        <MobileTabButton
          active={currentPage === Page.PORTFOLIO}
          onClick={() => { if (!isWalletConnected) connectWallet(); else setCurrentPage(Page.PORTFOLIO); }}
          icon={<Icons.User />}
          label={isWalletConnected ? "Profile" : "Sign in"}
          customClass={isWalletConnected ? "text-green-500" : ""}
        />
      </nav>
    </div>
  );
};

const SideNavButton: React.FC<{ active: boolean; label: string; icon: React.ReactNode; onClick: () => void; customClass?: string }> = ({ active, label, icon, onClick, customClass = '' }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl w-full transition-all group ${active ? 'bg-gray-100 text-black' : 'text-gray-400 hover:text-black hover:bg-gray-50'}`}
  >
    <div className={`transition-transform group-hover:scale-110 ${customClass}`}>{icon}</div>
    <span className="text-[9px] font-bold tracking-widest">{label}</span>
  </button>
);

const MobileTabButton: React.FC<{ active: boolean; label: string; icon: React.ReactNode; onClick: () => void; customClass?: string }> = ({ active, label, icon, onClick, customClass = '' }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 min-w-[60px] rounded-xl transition-all ${active ? 'text-black' : 'text-gray-400'}`}
  >
    <div className={`${customClass}`}>{icon}</div>
    <span className="text-[10px] font-bold tracking-wide">{label}</span>
  </button>
);


export default App;
