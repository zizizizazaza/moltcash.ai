
import React, { useState } from 'react';
import { Page, TaskItem } from './types';
import Landing from './components/Landing';
import Opportunities, { FARM_DATA, TASK_DATA } from './components/Opportunities';
import FarmDetail from './components/FarmDetail';
import TaskDetail from './components/TaskDetail';
import PublishTask from './components/PublishTask';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.LANDING);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [publishedTasks, setPublishedTasks] = useState<TaskItem[]>([]);

  const allTasks = [...TASK_DATA, ...publishedTasks];
  const selectedFarm = FARM_DATA.find(f => f.id === selectedFarmId);
  const selectedTask = allTasks.find(t => t.id === selectedTaskId);

  const connectWallet = () => setIsWalletConnected(true);

  const isOpportunitiesSection = [Page.OPPORTUNITIES, Page.FARM_DETAIL, Page.TASK_DETAIL, Page.PUBLISH_TASK].includes(currentPage);

  return (
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
          <div className="relative">
            <button
              onClick={() => {
                if (!isWalletConnected) connectWallet();
                else setShowDropdown(!showDropdown);
              }}
              className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-widest transition-all border flex items-center justify-between gap-2.5 ${isWalletConnected
                ? 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:text-black cursor-pointer'
                : 'bg-black text-white hover:bg-gray-800 shadow-md'}`}
            >
              {isWalletConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span>0x71C...8e29</span>
                  <svg className={`w-3.5 h-3.5 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                </>
              ) : 'Connect Wallet'}
            </button>

            {isWalletConnected && showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden py-1.5 z-50">
                <button
                  onClick={() => {
                    setIsWalletConnected(false);
                    setShowDropdown(false);
                    setCurrentPage(Page.LANDING);
                  }}
                  className="w-full text-left px-5 py-3 text-sm font-bold text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Log Out
                </button>
              </div>
            )}
          </div>
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
