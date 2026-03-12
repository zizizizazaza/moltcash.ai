
import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Page, FarmItem, TaskItem } from './types';
import Landing from './components/Landing';
import Opportunities, { FARM_DATA, TASK_DATA } from './components/Opportunities';
import FarmDetail from './components/FarmDetail';
import TaskDetail from './components/TaskDetail';
import PublishTask from './components/PublishTask';
import ConnectModal from './components/ConnectModal';
import { setAccessTokenGetter, auth, opportunities as opportunitiesApi } from './lib/api';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.LANDING);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [publishedTasks, setPublishedTasks] = useState<TaskItem[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<FarmItem | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  const { ready, authenticated, logout, user, getAccessToken } = usePrivy();
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Wire Privy access token into API client
  useEffect(() => {
    setAccessTokenGetter(getAccessToken);
  }, [getAccessToken]);

  // Sync Privy user profile to backend on login
  useEffect(() => {
    if (authenticated && user) {
      const wallet = user.wallet;
      const google = user.google;
      const twitter = user.twitter;

      auth.sync({
        walletAddress: wallet?.address,
        email: google?.email || undefined,
        twitterHandle: twitter?.username || undefined,
        displayName: google?.name || twitter?.name || undefined,
      }).catch(() => { /* silently fail for now */ });
    }
  }, [authenticated, user]);

  // Fetch farm detail when selected
  useEffect(() => {
    if (!selectedFarmId) { setSelectedFarm(null); return; }
    // Try API first, fallback to local mock
    opportunitiesApi.detail(selectedFarmId).then(res => {
      if (res.success && res.data) {
        const o = res.data as any;
        setSelectedFarm({
          id: o.id, type: o.type, title: o.title, description: o.description,
          source: o.source, chain: o.chain, reward: o.reward, rewardType: o.rewardType,
          estimatedGas: o.estimatedGas || 'N/A', difficulty: o.difficulty, timeEstimate: o.timeEstimate,
          tags: o.tags || [], isHot: o.isHot, isNew: o.isNew,
          participantCount: o.participantCount, deadline: o.deadline,
          steps: o.steps?.map((s: any) => ({ action: s.description || s.action, protocol: s.protocol, gas: s.estimatedGas ? `$${s.estimatedGas}` : (s.gas || 'Free') })),
        });
      } else {
        // Fallback to local mock
        const found = FARM_DATA.find(f => f.id === selectedFarmId) || null;
        setSelectedFarm(found);
      }
    }).catch(() => {
      const found = FARM_DATA.find(f => f.id === selectedFarmId) || null;
      setSelectedFarm(found);
    });
  }, [selectedFarmId]);

  // Fetch task detail when selected
  useEffect(() => {
    if (!selectedTaskId) { setSelectedTask(null); return; }
    opportunitiesApi.detail(selectedTaskId).then(res => {
      if (res.success && res.data) {
        const o = res.data as any;
        setSelectedTask({
          id: o.id, title: o.title, description: o.description,
          platform: o.source || 'MOLTCASH', category: 'platform',
          reward: o.reward, rewardAmount: o.rewardAmount,
          difficulty: o.difficulty || 'Medium', timeEstimate: o.timeEstimate || 'TBD',
          tags: o.tags || [], status: o.status || 'open', applicants: o.applicationCount || 0,
        });
      } else {
        const allTasks = [...TASK_DATA, ...publishedTasks];
        setSelectedTask(allTasks.find(t => t.id === selectedTaskId) || null);
      }
    }).catch(() => {
      const allTasks = [...TASK_DATA, ...publishedTasks];
      setSelectedTask(allTasks.find(t => t.id === selectedTaskId) || null);
    });
  }, [selectedTaskId, publishedTasks]);

  const isOpportunitiesSection = [Page.OPPORTUNITIES, Page.FARM_DETAIL, Page.TASK_DETAIL, Page.PUBLISH_TASK].includes(currentPage);

  // Get display name from Privy user
  const getDisplayName = () => {
    if (!user) return '';
    // Wallet address
    const wallet = user.wallet;
    if (wallet?.address) {
      const addr = wallet.address;
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    }
    // Google
    const google = user.google;
    if (google?.email) return google.email.split('@')[0];
    // Twitter
    const twitter = user.twitter;
    if (twitter?.username) return `@${twitter.username}`;
    return 'Connected';
  };

  return (
    <>
      <div className="min-h-screen flex flex-col selection:bg-black selection:text-white overflow-x-hidden bg-[#fafafa]">

        {/* Navbar */}
        <nav className="sticky top-0 z-40 py-5 px-6 md:px-12 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-gray-100">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentPage(Page.LANDING)}>
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center font-black text-white text-sm group-hover:rotate-12 transition-transform">M</div>
              <span className="text-xl font-black tracking-tight text-black">MoltCash</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <NavButton
                active={currentPage === Page.LANDING}
                onClick={() => setCurrentPage(Page.LANDING)}
                label="Home"
              />
              <NavButton
                active={isOpportunitiesSection}
                onClick={() => setCurrentPage(Page.OPPORTUNITIES)}
                label="Earn"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!ready ? (
              <div className="px-5 py-2.5 rounded-full text-xs font-bold tracking-widest text-gray-300">
                Loading...
              </div>
            ) : !authenticated ? (
              <button
                onClick={() => setShowConnectModal(true)}
                className="px-5 py-2.5 rounded-full text-xs font-bold tracking-widest transition-all bg-black text-white hover:bg-gray-800 shadow-md cursor-pointer"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={logout}
                  className="px-5 py-2.5 rounded-full text-xs font-bold tracking-widest transition-all border bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:text-black cursor-pointer flex items-center gap-2.5"
                >
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  {getDisplayName()}
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile Nav */}
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full p-1.5 flex gap-1 shadow-2xl bg-white/95 backdrop-blur-xl border border-gray-100">
          <MobileNavButton active={currentPage === Page.LANDING} onClick={() => setCurrentPage(Page.LANDING)} label="Home" icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          } />
          <MobileNavButton active={isOpportunitiesSection} onClick={() => setCurrentPage(Page.OPPORTUNITIES)} label="Earn" icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          } />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {currentPage === Page.LANDING && (
            <Landing onGetStarted={() => setCurrentPage(Page.OPPORTUNITIES)} />
          )}
          {currentPage === Page.OPPORTUNITIES && (
            <Opportunities
              extraTasks={publishedTasks}
              onSelectFarm={(id) => {
                setSelectedFarmId(id);
                setCurrentPage(Page.FARM_DETAIL);
              }}
              onSelectTask={(id) => {
                setSelectedTaskId(id);
                setCurrentPage(Page.TASK_DETAIL);
              }}
              onPublishTask={() => setCurrentPage(Page.PUBLISH_TASK)}
            />
          )}
          {currentPage === Page.FARM_DETAIL && selectedFarm && (
            <FarmDetail
              item={selectedFarm}
              onBack={() => setCurrentPage(Page.OPPORTUNITIES)}
            />
          )}
          {currentPage === Page.TASK_DETAIL && selectedTask && (
            <TaskDetail
              task={selectedTask}
              onBack={() => setCurrentPage(Page.OPPORTUNITIES)}
            />
          )}
          {currentPage === Page.PUBLISH_TASK && (
            <PublishTask
              onBack={() => setCurrentPage(Page.OPPORTUNITIES)}
              onSubmit={(task) => {
                setPublishedTasks(prev => [task, ...prev]);
                setCurrentPage(Page.OPPORTUNITIES);
              }}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="py-10 border-t border-gray-100 text-center px-6">
          <p className="text-gray-300 text-[10px] tracking-[0.4em] font-medium">
            Powered by Claw Protocol &bull; 2026 MoltCash
          </p>
        </footer>
      </div>

      {/* ConnectModal rendered outside the main div to avoid backdrop-blur containing block */}
      <ConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
      />
    </>
  );
};

const NavButton: React.FC<{ active: boolean; label: string; onClick: () => void }> = ({ active, label, onClick }) => (
  <button
    onClick={onClick}
    className={`text-sm font-bold tracking-wide transition-all py-1 border-b-2 ${active ? 'text-black border-black' : 'text-gray-400 hover:text-black border-transparent'}`}
  >
    {label}
  </button>
);

const MobileNavButton: React.FC<{ active: boolean; icon: React.ReactNode; label: string; onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-0.5 px-5 py-2 rounded-full transition-all ${active ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}
  >
    {icon}
    <span className="text-[9px] font-bold">{label}</span>
  </button>
);

export default App;
