
import React, { useState, useEffect } from 'react';
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
import TxModal from './components/TxModal';
import Landing from './components/Landing';
import Settings from './components/Settings';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.MARKET);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const hasSeenRisk = localStorage.getItem('loka_risk_accepted');
    if (!hasSeenRisk) {
      setShowRiskModal(true);
    }

    const handleNav = () => setCurrentPage(Page.CHAT);
    const handleNavSwap = () => setCurrentPage(Page.SWAP);
    const handleNavMarket = () => setCurrentPage(Page.MARKET);

    window.addEventListener('loka-nav-chat', handleNav);
    window.addEventListener('loka-nav-swap', handleNavSwap);
    window.addEventListener('loka-nav-market', handleNavMarket);

    return () => {
      window.removeEventListener('loka-nav-chat', handleNav);
      window.removeEventListener('loka-nav-swap', handleNavSwap);
      window.removeEventListener('loka-nav-market', handleNavMarket);
    };
  }, []);

  const triggerComingSoon = () => {
    setShowComingSoon(true);
    setTimeout(() => setShowComingSoon(false), 3000);
  };

  const acceptRisk = () => {
    localStorage.setItem('loka_risk_accepted', 'true');
    setShowRiskModal(false);
  };

  const connectWallet = () => {
    setShowAuthModal(true);
  };

  const handleLogin = () => {
    setIsWalletConnected(true);
    setShowAuthModal(false);
  };

  const isChatPage = currentPage === Page.CHAT;

  return (
    <div className="h-screen w-screen flex overflow-hidden selection:bg-black selection:text-white" style={{ backgroundColor: '#F5F0E6' }}>
      {/* Toast Notification */}
      <div className={`fixed top-6 right-6 z-[100] transition-all duration-500 transform ${showComingSoon ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0 pointer-events-none'
        }`}>
        <div className="bg-black text-white px-6 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3">
          <span className="text-sm">⏳</span>
          <p className="text-xs font-bold tracking-widest ">Coming soon</p>
        </div>
      </div>

      {showRiskModal && <RiskModal onAccept={acceptRisk} onClose={() => setShowRiskModal(false)} />}
      {showAuthModal && <AuthModal onLogin={handleLogin} onClose={() => setShowAuthModal(false)} />}
      <TxModal />

      {/* Far-Left App Navigation */}
      <nav className="w-20 bg-white border-r border-gray-100 flex flex-col items-center py-6 shrink-0 z-50 shadow-sm relative">
        <div className="flex flex-col items-center gap-8 w-full">
          {/* Logo */}
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center font-black text-white hover:rotate-12 transition-transform cursor-pointer mb-2" onClick={() => setCurrentPage(Page.MARKET)}>
            L
          </div>

          {/* Primary Nav Links */}
          <div className="flex flex-col gap-6 w-full px-3">
            <SideNavButton
              active={currentPage === Page.CHAT}
              onClick={() => setCurrentPage(Page.CHAT)}
              icon={<Icons.Chat />}
              label="Chat"
            />
            <SideNavButton
              active={currentPage === Page.MARKET}
              onClick={() => setCurrentPage(Page.MARKET)}
              icon={<svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>}
              label="Discover"
            />
          </div>
        </div>

        {/* Bottom Nav Links */}
        <div className="mt-auto flex flex-col gap-6 w-full px-3 relative">
          <SideNavButton
            active={currentPage === Page.SETTINGS}
            onClick={() => setCurrentPage(Page.SETTINGS)}
            icon={<svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            label="Settings"
          />
          <div className="relative">
            <SideNavButton
              active={false}
              onClick={() => {
                if (!isWalletConnected) connectWallet();
                else setShowDropdown(!showDropdown);
              }}
              icon={<Icons.User />}
              label={isWalletConnected ? "Profile" : "Sign in"}
              customClass={isWalletConnected ? "text-green-500" : ""}
            />
            {isWalletConnected && showDropdown && (
              <div className="absolute left-full bottom-0 ml-4 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden py-1.5 z-50 animate-in fade-in slide-in-from-left-2">
                <button
                  onClick={() => {
                    setIsWalletConnected(false);
                    setShowDropdown(false);
                    setCurrentPage(Page.MARKET);
                  }}
                  className="w-full text-left px-5 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col overflow-hidden h-full relative">
        <div className="flex-1 overflow-y-auto">
          {currentPage === Page.DASHBOARD && <Dashboard />}
          {currentPage === Page.SWAP && <Swap />}
          {currentPage === Page.MARKET && <Market />}
          {currentPage === Page.AGENT && <AgentMode />}
          {currentPage === Page.PORTFOLIO && <Portfolio isWalletConnected={isWalletConnected} onConnect={connectWallet} onSettingsClick={() => setCurrentPage(Page.SETTINGS)} />}
          {currentPage === Page.SETTINGS && <Settings onBack={() => setCurrentPage(Page.PORTFOLIO)} />}
          {currentPage === Page.CHAT && <Chat />}
        </div>
      </main>
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

export default App;
