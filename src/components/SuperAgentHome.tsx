import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { I, InputIcons, UseCaseIcons } from './Icons';
import { QUICK_ACTIONS, USE_CASES, AGENT_GUIDES, FEATURED_GROUPS } from '../constants';
import ChatContainer from './chat/ChatContainer';
import ModeSelector from './chat/ModeSelector';
import type { ChatMode, ChatInitParams } from '../types/chat';

// Import app registry so adapters are registered
import '../components/apps';

const SuperAgentHome: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionToRestore = searchParams.get('session');
  const [input, setInput] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [mode, setMode] = useState<ChatMode>('auto');

  // ── Chat init params (replaces the old string-prefix approach) ──
  const [chatInit, setChatInit] = useState<ChatInitParams | null>(null);

  const { isListening, startListening, stopListening, isAvailable } = useSpeechToText({
    onResult: (text) => setInput(text),
    language: 'zh-CN'
  });
  const [phIdx, setPhIdx] = useState(0);

  const PLACEHOLDERS = [
    'Ask about any asset, market, or investing idea…',
    'Is NVIDIA still a strong buy after Q4?',
    'Compare Tesla vs BYD fundamentals for 2026',
    'Which AI infrastructure companies have the best moat?',
    'Build me a diversified portfolio for a 3-year horizon',
  ];

  useEffect(() => {
    if (input) return;
    const id = setInterval(() => setPhIdx(i => (i + 1) % PLACEHOLDERS.length), 3500);
    return () => clearInterval(id);
  }, [input]);

  // Reset local state when URL is cleared (e.g., clicking "New Chat" in Sidebar)
  useEffect(() => {
    if (!sessionToRestore) {
      setChatInit(null);
      setInput('');
      setSelectedAgent(null);
      setSelectedScenario(null);
    } else {
      setChatInit(null);
    }
  }, [sessionToRestore]);

  // ── Submit handler — explicit app/mode/query, NO string prefixes ──
  const handleSubmit = () => {
    if (!input.trim()) return;
    if (isListening) stopListening();

    if (selectedAgent === 'research' && mode !== 'collaborate' && mode !== 'roundtable') {
      // Signal Radar standalone page
      navigate('/signal-radar', { state: { initialTopic: input.trim() } });
    } else {
      // Use ChatContainer with explicit params
      setChatInit({
        app: selectedAgent === 'hedgefund' ? 'hedgefund'
           : selectedAgent === 'stockanalysis' ? 'stockanalysis'
           : selectedAgent === 'research' ? 'research'
           : null,
        mode,
        query: input.trim(),
      });
    }
  };

  // ── Render: Active chat (NEW session — must check BEFORE sessionToRestore) ──
  if (chatInit) {
    return (
      <ChatContainer
        app={chatInit.app}
        initialMessage={chatInit.query}
        mode={chatInit.mode}
        onBack={() => setChatInit(null)}
      />
    );
  }

  // ── Render: Restore session (from sidebar click) ──
  if (sessionToRestore) {
    return <ChatContainer restoreSessionId={sessionToRestore} onBack={() => setSearchParams({})} />;
  }

  // ── Render: Home page ──
  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto">
      {/* ── Hero + Input ── */}
      <div className="hero-zone flex flex-col items-center pt-16 md:pt-28 pb-8 px-4">
        <div className="max-w-[640px] w-full space-y-7" style={{ position: 'relative', zIndex: 1 }}>
          {/* Title */}
          <div className="text-center hero-title space-y-2">
            <h1 className="text-[38px] md:text-[46px] font-extrabold tracking-tight leading-[1.15]">
              <span className="text-gray-900">Where would you like to </span>
              <span style={{ color: 'var(--accent)' }}>invest?</span>
            </h1>
            <p className="text-[14px] text-gray-400 font-normal">
              Multi-agent AI built for investment intelligence.
            </p>
          </div>

          {/* Input Box */}
          <div className="input-box hero-input bg-white border border-gray-200 rounded-2xl" style={{ boxShadow: '0 2px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={PLACEHOLDERS[phIdx]}
              rows={3}
              className="w-full bg-transparent outline-none text-[15px] text-gray-900 placeholder:text-gray-400 px-4 pt-4 pb-2 resize-none transition-colors"
            />
            {/* Input toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-1 px-3 pb-3">
              <div className="flex items-center gap-1 flex-wrap">
                <ModeSelector mode={mode} onModeChange={setMode} />
                {/* Selected Agent tag */}
                {selectedAgent && (() => {
                  const ag = QUICK_ACTIONS.find(a => a.id === selectedAgent);
                  if (!ag) return null;
                  const AgIc = ag.icon;
                  return (
                    <div className="agent-tag flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-[12px] font-medium whitespace-nowrap">
                      <AgIc />
                      <span>{ag.label}</span>
                      <button
                        onClick={() => setSelectedAgent(null)}
                        className="ml-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors"
                      >
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </button>
                    </div>
                  );
                })()}
              </div>
              <div className="flex items-center gap-1 md:gap-2 shrink-0">
                {selectedAgent !== 'research' && (
                  <>
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all" title="Attach file">
                      <InputIcons.Attach />
                    </button>
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all" title="Add image">
                      <InputIcons.Image />
                    </button>
                  </>
                )}
                {isAvailable && (
                  <button 
                    onClick={isListening ? stopListening : startListening}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      isListening ? 'text-red-500 bg-red-50 animate-pulse' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`} 
                    title={isListening ? 'Stop recording' : 'Voice input'}
                  >
                    <InputIcons.Mic />
                  </button>
                )}
                <button
                  onClick={handleSubmit}
                  className={`send-btn-active w-8 h-8 rounded-lg flex items-center justify-center transition-all ${input.trim() ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                >
                  <I.Send />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions / Agent Guide */}
          {selectedAgent && AGENT_GUIDES[selectedAgent] ? (
            <div className="hero-guide space-y-3" style={{ animation: 'fade-up 0.35s var(--ease-out-expo) both' }}>
              <p className="text-[13px] font-semibold text-gray-700">{AGENT_GUIDES[selectedAgent].desc}</p>

              {/* Scenario pills */}
              {AGENT_GUIDES[selectedAgent].scenarios && (
                <div className="flex flex-wrap gap-2">
                  {AGENT_GUIDES[selectedAgent].scenarios!.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedScenario(selectedScenario === s.id ? null : s.id)}
                      className={`scenario-pill px-3 py-1.5 rounded-full text-[12px] font-medium border ${selectedScenario === s.id
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-900'
                        }`}
                    >{s.label}</button>
                  ))}
                </div>
              )}

              {/* Prompt examples */}
              {(() => {
                const guide = AGENT_GUIDES[selectedAgent];
                const prompts = guide.scenarios
                  ? guide.scenarios.find(s => s.id === selectedScenario)?.prompts ?? []
                  : guide.prompts ?? [];
                if (!prompts.length) return null;
                return (
                  <div className="space-y-1">
                    <p className="text-[13px] font-semibold text-gray-700 px-1 mb-2">Explore Ideas</p>
                    {prompts.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(p)}
                        className="prompt-item w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-left text-[13px] text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent hover:border-gray-100 transition-colors group"
                      >
                        <span>{p}</span>
                        <svg className="w-3 h-3 text-gray-300 group-hover:text-gray-400 shrink-0 ml-3 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="hero-actions -mx-4 px-4 py-1 overflow-x-auto" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
              <div className="flex items-center justify-start md:justify-center md:flex-wrap gap-2 min-w-max md:min-w-0 md:w-full">
                {QUICK_ACTIONS.slice(0, 5).map(a => {
                  const Ic = a.icon;
                  return (
                    <button key={a.id}
                      onClick={() => { setSelectedAgent(a.id); setSelectedScenario(null); }}
                      className="qa-pill flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-gray-200 bg-white text-[13px] font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900 hover:shadow-sm whitespace-nowrap shrink-0">
                      <Ic /> {a.label}
                    </button>
                  );
                })}
                <button className="qa-pill px-3.5 py-2 rounded-full border border-gray-200 bg-white text-[13px] font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900 hover:shadow-sm whitespace-nowrap shrink-0">
                  More
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Use Cases ── */}
      {!selectedAgent && (
        <div className="px-4 pb-10 pt-8 max-w-[640px] w-full mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <span style={{ display: 'inline-block', width: 3, height: 14, borderRadius: 2, backgroundColor: 'var(--accent)', flexShrink: 0 }} />
            <h2 className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Explore Use Cases</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {USE_CASES.map(uc => (
              <button
                key={uc.id}
                onClick={() => setChatInit({ app: null, mode: 'auto', query: uc.prompt })}
                className="usecase-card group text-left bg-white border border-gray-100 rounded-xl p-3 cursor-pointer"
              >
                <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center text-gray-400 mb-2">{UseCaseIcons[uc.id] ? React.createElement(UseCaseIcons[uc.id]) : null}</div>
                <h3 className="text-[12px] font-semibold text-gray-900 mb-0.5 leading-snug">{uc.title}</h3>
                <p className="text-[11px] text-gray-400 leading-snug mb-2">{uc.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {uc.tags.map(tag => (
                    <span key={tag} className="px-1.5 py-px rounded bg-gray-50 text-[10px] font-medium text-gray-400">{tag}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Featured Groups ── */}
      {!selectedAgent && (() => {
        const avatarColors = ['bg-blue-400', 'bg-emerald-400', 'bg-violet-400', 'bg-amber-400', 'bg-rose-400', 'bg-cyan-400', 'bg-indigo-400'];
        return (
          <div className="pb-12 px-4 max-w-[640px] w-full mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <span style={{ display: 'inline-block', width: 3, height: 14, borderRadius: 2, backgroundColor: 'var(--accent)', flexShrink: 0 }} />
              <h2 className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Featured Groups</h2>
            </div>
            <div className="flex flex-col gap-2.5">
              {FEATURED_GROUPS.map(g => (
                <button key={g.id}
                  onClick={() => navigate(`/chat?group=${g.id}`)}
                  className="group w-full text-left bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200 overflow-hidden cursor-pointer"
                >
                  <div className="px-4 py-3.5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="relative shrink-0 flex items-center h-7" style={{ width: Math.min(g.avatars.length, 4) * 18 + 12 }}>
                        {g.avatars.slice(0, 4).map((initials, i) => (
                          <div key={i} className={`absolute w-7 h-7 rounded-full ${avatarColors[i % avatarColors.length]} text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white shadow-sm transition-transform hover:-translate-y-0.5`} style={{ left: i * 16, zIndex: 10 - i }}>{initials}</div>
                        ))}
                        {g.avatars.length > 4 && (
                          <div className="absolute w-7 h-7 rounded-full bg-gray-50 text-gray-400 text-[9px] font-bold flex items-center justify-center ring-2 ring-white shadow-sm" style={{ left: 4 * 16, zIndex: 0 }}>
                            +{g.avatars.length - 4}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-bold text-gray-900 leading-tight truncate">{g.name}</p>
                          <span className="text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0" style={{ color: 'var(--accent)' }}>View →</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-snug line-clamp-1 mb-2.5">{g.desc}</p>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
                        {g.memberCount} members
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" /></svg>
                        {g.agentCount} agents
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                        {g.online} online
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default SuperAgentHome;
