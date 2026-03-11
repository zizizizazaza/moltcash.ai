
import React, { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { Icons } from '../constants';
import { api } from '../services/api';

const Chat: React.FC = () => {
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [activeAgent, setActiveAgent] = useState('ComputeDAO GPU');
    const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(true);
    const [activeForm, setActiveForm] = useState<'buy' | 'sell' | 'deposit' | 'withdraw' | null>(null);
    const [formAmount, setFormAmount] = useState('');
    const [formAsset, setFormAsset] = useState('AIUSD');
    const [activeAssetTab, setActiveAssetTab] = useState<'Background' | 'Financial Health' | 'Rules'>('Background');
    const [projectCardExpanded, setProjectCardExpanded] = useState(false);
    const [typedPlaceholder, setTypedPlaceholder] = useState('');
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [selectedAssetName, setSelectedAssetName] = useState<string | null>(null);
    const [showActionMenu, setShowActionMenu] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        const phrases = [
            'Ask about any asset or start a transaction...',
            'Compare yields across all active pools...',
            'Show me the top performing assets...',
            'Analyze ComputeDAO risk profile...',
            'How much can I earn with $5,000?',
        ];
        let phraseIdx = 0;
        let charIdx = 0;
        let isDeleting = false;
        let timeout: ReturnType<typeof setTimeout>;

        const tick = () => {
            if (isInputFocused || inputText) {
                timeout = setTimeout(tick, 200);
                return;
            }
            const current = phrases[phraseIdx];
            if (!isDeleting) {
                charIdx++;
                setTypedPlaceholder(current.slice(0, charIdx));
                if (charIdx >= current.length) {
                    isDeleting = true;
                    timeout = setTimeout(tick, 2000);
                    return;
                }
                timeout = setTimeout(tick, 60 + Math.random() * 40);
            } else {
                charIdx--;
                setTypedPlaceholder(current.slice(0, charIdx));
                if (charIdx <= 0) {
                    isDeleting = false;
                    phraseIdx = (phraseIdx + 1) % phrases.length;
                    timeout = setTimeout(tick, 400);
                    return;
                }
                timeout = setTimeout(tick, 25);
            }
        };
        tick();
        return () => clearTimeout(timeout);
    }, [isInputFocused, inputText]);
    useEffect(() => {
        const pendingProject = sessionStorage.getItem('pending_chat_project');
        if (pendingProject) {
            sessionStorage.removeItem('pending_chat_project');
            handleProjectClick(pendingProject);
        }

        const pendingAction = sessionStorage.getItem('pending_chat_action');
        if (pendingAction) {
            sessionStorage.removeItem('pending_chat_action');
            if (pendingAction === 'deposit' || pendingAction === 'withdraw') {
                setFormAsset('USD');
            } else {
                setActiveForm(pendingAction as 'buy' | 'sell');
            }
        }

        const pendingAgent = sessionStorage.getItem('pending_chat_agent');
        if (pendingAgent) {
            sessionStorage.removeItem('pending_chat_agent');
            setActiveAgent(pendingAgent);
            setSelectedAssetName(pendingAgent);
        }

        const handleSetAgent = (e: Event) => {
            const customEvent = e as CustomEvent;
            setMessages([]);
            setActiveAgent(customEvent.detail);
            setSelectedAssetName(customEvent.detail);
        };
        window.addEventListener('loka-set-chat-agent', handleSetAgent);

        return () => window.removeEventListener('loka-set-chat-agent', handleSetAgent);
    }, []);

    // Auto-login for demo purposes
    useEffect(() => {
        if (!api.isAuthenticated) {
            api.loginEmail('demo@loka.finance').catch(() => {});
        }
    }, []);

    const sendToAI = async (text: string) => {
        if (isStreaming) return;
        setIsStreaming(true);

        // Add the streaming placeholder message
        const placeholderIdx = messages.length; // will be the last
        setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date().toLocaleTimeString(), isStreaming: true }]);

        try {
            // Try streaming first
            const abortController = new AbortController();
            abortControllerRef.current = abortController;

            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            const token = sessionStorage.getItem('loka_token');
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch('/api/chat/stream', {
                method: 'POST',
                headers,
                body: JSON.stringify({ content: text, agentId: activeAgent }),
                signal: abortController.signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const reader = response.body!.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim();
                        if (data === '[DONE]') continue;
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.content) {
                                fullContent += parsed.content;
                                setMessages(prev => {
                                    const updated = [...prev];
                                    const lastAssistant = updated.findLastIndex(m => m.role === 'assistant' && m.isStreaming);
                                    if (lastAssistant >= 0) {
                                        updated[lastAssistant] = { ...updated[lastAssistant], content: fullContent };
                                    }
                                    return updated;
                                });
                            }
                            if (parsed.error) {
                                fullContent = parsed.error;
                            }
                        } catch { /* skip */ }
                    }
                }
            }

            // Mark streaming complete
            setMessages(prev => {
                const updated = [...prev];
                const lastAssistant = updated.findLastIndex(m => m.role === 'assistant' && m.isStreaming);
                if (lastAssistant >= 0) {
                    updated[lastAssistant] = { ...updated[lastAssistant], content: fullContent || 'No response received.', isStreaming: false };
                }
                return updated;
            });
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            // Fallback: try non-streaming
            try {
                const result = await api.sendChatMessage(text, activeAgent);
                setMessages(prev => {
                    const updated = [...prev];
                    const lastAssistant = updated.findLastIndex(m => m.role === 'assistant' && m.isStreaming);
                    if (lastAssistant >= 0) {
                        updated[lastAssistant] = { role: 'assistant', content: result.assistantMessage.content, timestamp: new Date().toLocaleTimeString(), isStreaming: false };
                    }
                    return updated;
                });
            } catch {
                setMessages(prev => {
                    const updated = [...prev];
                    const lastAssistant = updated.findLastIndex(m => m.role === 'assistant' && m.isStreaming);
                    if (lastAssistant >= 0) {
                        updated[lastAssistant] = { role: 'assistant', content: 'Sorry, failed to get a response. Please try again.', timestamp: new Date().toLocaleTimeString(), isStreaming: false };
                    }
                    return updated;
                });
            }
        } finally {
            setIsStreaming(false);
            abortControllerRef.current = null;
        }
    };

    const handleProjectClick = (projectName: string) => {
        const userMsg = { role: 'user', content: `Analyze project: ${projectName}`, timestamp: new Date().toLocaleTimeString() };
        setMessages(prev => [...prev, userMsg]);

        setTimeout(() => {
            const isShopify = projectName.includes('Shopify');
            const aiMsg = {
                role: 'assistant',
                type: 'project_detail',
                project: projectName,
                content: `I've synthesized a comprehensive institutional-grade report for ${projectName}. This asset pool aligns with Loka's 'Low-Volatility Cash Flow' mandate, backed by real-world revenue and professional infrastructure.`,
                data: {
                    title: projectName,
                    entity: isShopify ? 'Dropstream LLC' : 'ComputeDAO Foundation',
                    registration: isShopify ? 'ACRA ID: 20230812X • Founded 2023' : 'BVI ID: 102459X • Founded 2021',
                    sections: [
                        {
                            title: 'Background & Business Narrative',
                            content: isShopify
                                ? 'Dropstream facilitates liquidity for high-growth e-commerce merchants on the Shopify platform. This specific cluster consists of 12 verified sellers with a combined annual GMV exceeding $50M. By analyzing deep-level API data, we identify merchants with stable 60% repeat customer rates and low return ratios, providing them with working capital to accelerate inventory turnover.'
                                : 'ComputeDAO is a decentralized physical infrastructure network (DePIN) focusing on high-performance AI compute. This batch (Batch #4) targets the scaling of H100 GPU clusters in Tier-3 data centers. As AI model training demand reaches an all-time high, ComputeDAO provides the essential hardware layer, secured by physical asset ownership and long-term enterprise rendering contracts.',
                            objective: isShopify
                                ? '"Inventory financing for seasonal peak demand across consumer electronics and home-ware verticals."'
                                : '"Purchasing 8 additional NVIDIA H100 GPUs and pre-paying data center rack fees in Tokyo for 12 months."'
                        },
                        {
                            title: 'Entity Credit & Financial Health',
                            isGrid: true,
                            items: [
                                { label: 'Total Raising', value: isShopify ? '$1.5M' : '$4.2M' },
                                { label: 'Repayment Rate', value: '100% On-time' },
                                { label: 'Current Raising', value: isShopify ? '$185,000' : '$375,420' },
                                { label: 'Loka Risk Score', value: 'AAA (Safe)' },
                                { label: 'Coverage Ratio', value: isShopify ? '2.4x' : '1.8x' },
                                { label: 'Backers Pledged', value: isShopify ? '89' : '124' }
                            ]
                        },
                        {
                            title: 'Leadership & Verification',
                            items: [
                                { name: isShopify ? 'Alex Chen' : 'Dr. Victor Wang', role: 'CEO / Founders', bio: isShopify ? 'Ex-AWS Principal Architect, 10+ years scaling cloud infra.' : 'Ex-NVIDIA Senior Researcher, Ph.D in Parallel Computing.' },
                                { name: 'Sarah Li', role: 'CTO', bio: 'Ex-Ethereum Foundation, expert in secure protocol auditing.' }
                            ]
                        },
                        {
                            title: 'The Agreement & Protections',
                            subSections: [
                                {
                                    label: 'Fund Flow: Auto-Repayment Mechanism',
                                    text: isShopify
                                        ? 'Investors → Loka SPV → Merchant → Revenue Gen → Stripe Escrow → Auto-Repay (Principal + Interest).'
                                        : 'Investors → ComputeDAO SPV → Hardware Acquisition → Compute Revenue → Smart Contract Escrow → Bi-weekly Distributions.'
                                },
                                {
                                    label: 'Key Rights & Protections',
                                    text: 'Senior Secured position with Bankruptcy Remote SPV structure. Assets are protected by Seniority (paid back first) and a 150% over-collateralization ratio against verified receivables.'
                                },
                                {
                                    label: 'Participation Terms',
                                    isHighlight: true,
                                    text: `Entry: 1,000 USDC. Target APY: ${isShopify ? '8.9%' : '15.5%'}. Face value at maturity: $${isShopify ? '1,030.50' : '1,065.20'}. Manual legal audit completed by Loka Protocol.`
                                }
                            ]
                        }
                    ]
                },
                timestamp: new Date().toLocaleTimeString()
            };
            setMessages(prev => [...prev, aiMsg]);
        }, 800);
    };

    const handleAssetClick = (assetName: string) => {
        const userMsg = { role: 'user', content: `View ${assetName} details`, timestamp: new Date().toLocaleTimeString() };
        setMessages(prev => [...prev, userMsg]);

        setTimeout(() => {
            const aiMsg = {
                role: 'assistant',
                type: 'asset_detail',
                asset: assetName,
                content: assetName === 'AIUSD'
                    ? "Here is the latest data for AIUSD. Our protocol maintains a stable yield through cross-chain delta-neutral strategies, currently delivering a solid and sustainable APY."
                    : "I've analyzed the current market for you. Here are the most popular Cash Flow (RWA) assets available for investment right now. These projects represent high-quality AI infrastructure and enterprise revenue streams.",
                data: assetName === 'AIUSD' ? {
                    apy: '12.4%',
                    tvl: '$42.5M',
                    yieldSource: 'Cross-chain Delta Neutral',
                    risk: 'Low',
                    collateral: '150%'
                } : {
                    hot_assets: [
                        { title: 'ComputeDAO - GPU Expansion', apy: '15.5%', target: '$500k', progress: 75, term: '60d' },
                        { title: 'Shopify Merchant Cluster X', apy: '8.9%', target: '$200k', progress: 93, term: '30d' },
                        { title: 'Vercel Enterprise Flow', apy: '10.2%', target: '$1000k', progress: 42, term: '90d' },
                        { title: 'AWS Infrastructure Note', apy: '11.4%', target: '$750k', progress: 61, term: '45d' }
                    ]
                },
                timestamp: new Date().toLocaleTimeString()
            };
            setMessages(prev => [...prev, aiMsg]);
        }, 800);
    };

    const handleVoiceInput = () => {
        if (isRecording) {
            setIsRecording(false);
            const voiceText = "Show me the top performing AI agents.";

            const userMsg = { role: 'user', content: voiceText, timestamp: new Date().toLocaleTimeString() };
            setMessages(prev => [...prev, userMsg]);

            setTimeout(() => {
                const aiMsg = {
                    role: 'assistant',
                    content: "Here are the top performing AI agents currently active in the marketplace, sorted by APY and historical completion rate.",
                    type: 'action',
                    actionCompleted: false,
                    timestamp: new Date().toLocaleTimeString()
                };
                setMessages(prev => [...prev, aiMsg]);
            }, 1000);

            setInputText('');
        } else {
            setIsRecording(true);
            setInputText(''); // Clear input
        }
    };

    const handleSend = () => {
        if (!inputText.trim() || isStreaming) return;

        const text = inputText.trim();
        const userMsg = { role: 'user', content: text, timestamp: new Date().toLocaleTimeString() };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');

        sendToAI(text);
    };

    const handleInlineActionSubmit = () => {
        if (!formAmount || isStreaming) return;

        const actionStr = activeForm === 'buy' ? 'buy' : 'sell';
        const assetName = activeAgent;
        const userMsgText = `I want to ${actionStr} ${formAmount} USDC of ${assetName}.`;
        const userMsg = { role: 'user', content: userMsgText, timestamp: new Date().toLocaleTimeString() };
        setMessages(prev => [...prev, userMsg]);
        setActiveForm(null);
        setFormAmount('');

        sendToAI(userMsgText);
    };

    const handleActionResponse = (index: number, confirm: boolean) => {
        setMessages(prev => prev.map((m, i) => i === index ? { ...m, actionCompleted: true } : m));

        const userMsg = { role: 'user', content: confirm ? 'Confirm' : 'Reject', timestamp: new Date().toLocaleTimeString() };
        setMessages(prev => [...prev, userMsg]);

        if (confirm) {
            setTimeout(() => {
                const aiMsg = { role: 'assistant', content: 'Transaction executed successfully.', timestamp: new Date().toLocaleTimeString() };
                setMessages(prev => [...prev, aiMsg]);
            }, 1000);
        }
    };

    const cashFlowAssets = [
        { title: 'AI Agent Marketplace', category: 'Platform', image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop', desc: 'Making it easier for AI agent markets to showcase themselves on a platform that facilitates exchanges.', progress: 21, apy: '18.5%', term: '30 Days', backers: 4 },
        { title: 'Climapp.io Utility', category: 'Software', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop', desc: 'AI-enabled platform that helps you understand and manage your utility bills — all in one place.', progress: 2, apy: '14.2%', term: '90 Days', backers: 2 },
        { title: 'Market Maker AI', category: 'Liquidity', image: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400&h=300&fit=crop', desc: 'Provides deep liquidity for new pairs with optimized spread management.', progress: 95, apy: '22.0%', term: '120 Days', backers: 124 },
        { title: 'MEV Searcher Agent', category: 'Infrastructure', image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop', desc: 'Captures Maximal Extractable Value opportunities efficiently.', progress: 40, apy: '25.5%', term: '60 Days', backers: 18 },
        { title: 'Copy Trading AI', category: 'Social Trading', image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop', desc: 'Mirrors trades of top-performing wallets automatically.', progress: 78, apy: '16.8%', term: '45 Days', backers: 56 },
        { title: 'AWS Cloud Note', category: 'Infrastructure', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop', desc: 'Secure yield generated from backing AWS capacity reservations.', progress: 50, apy: '12.0%', term: '30 Days', backers: 23 },
        { title: 'Stripe Escrow Pool', category: 'DeFi Data', image: 'https://images.unsplash.com/photo-1563986768609-322da13575f2?w=400&h=300&fit=crop', desc: 'Automated revenue streaming and escrow financing.', progress: 90, apy: '11.5%', term: '30 Days', backers: 89 },
        { title: 'Cloudflare Capacity', category: 'Infrastructure', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop', desc: 'Global edge network capacity lending with 12% APY.', progress: 70, apy: '12.0%', term: '30 Days', backers: 42 },
        { title: 'Amazon FBA Sellers', category: 'E-commerce', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop', desc: 'Inventory-backed financing for proven Amazon FBA vendors.', progress: 85, apy: '15.0%', term: '30 Days', backers: 115 },
        { title: 'DigitalOcean Tier', category: 'Infrastructure', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop', desc: 'Financing for SME cloud deployments with high retention.', progress: 60, apy: '14.0%', term: '30 Days', backers: 37 }
    ];

    const chatSessions = [
        { id: '1', title: 'Analyze ComputeDAO GPU', time: 'Today', active: true },
        { id: '2', title: 'Buy AI Agent Marketplace', time: 'Today', active: false },
        { id: '3', title: 'Market Maker AI yield query', time: 'Yesterday', active: false },
        { id: '4', title: 'Compare pool performance', time: 'Yesterday', active: false },
        { id: '5', title: 'MEV Searcher risk analysis', time: 'Mar 7', active: false },
        { id: '6', title: 'Portfolio rebalance strategy', time: 'Mar 6', active: false },
        { id: '7', title: 'Shopify Merchant Cluster X', time: 'Mar 5', active: false },
    ];

    return (
        <div className="flex flex-col h-full bg-[#fafafa] text-black overflow-hidden font-sans">
            <div className="flex flex-1 overflow-hidden relative">
                {/* Chat History Sidebar */}
                <div className={`h-full bg-[#fafafa] border-r border-gray-100 flex flex-col shrink-0 transition-all duration-300 ease-in-out ${leftSidebarCollapsed ? 'w-0 overflow-hidden opacity-0' : 'w-full absolute inset-0 z-40 md:relative md:w-64 opacity-100'}`}>
                    <div className="flex items-center justify-between px-4 pt-4 pb-3">
                        <h2 className="text-xs font-black text-black tracking-widest uppercase">History</h2>
                        <button
                            onClick={() => setLeftSidebarCollapsed(true)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                        </button>
                    </div>
                    <button
                        onClick={() => { setMessages([]); setLeftSidebarCollapsed(true); }}
                        className="mx-3 mb-3 px-3 py-2.5 bg-black text-white rounded-xl text-[11px] font-bold tracking-wide hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        New Chat
                    </button>
                    <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
                        {chatSessions.map((session) => (
                            <button
                                key={session.id}
                                onClick={() => {
                                    setMessages([
                                        { role: 'user', content: session.title, timestamp: new Date().toLocaleTimeString() },
                                    ]);
                                    handleProjectClick(session.title.replace(/^(Analyze |Buy |Compare |View )/, ''));
                                    setLeftSidebarCollapsed(true);
                                }}
                                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all group flex items-start gap-2.5 ${session.active
                                    ? 'bg-white shadow-sm border border-gray-100 font-bold text-black'
                                    : 'text-gray-500 hover:bg-white hover:shadow-sm hover:text-black font-medium'
                                    }`}
                            >
                                <svg className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${session.active ? 'text-green-500' : 'text-gray-300 group-hover:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                <div className="flex-1 min-w-0">
                                    <p className="truncate leading-tight">{session.title}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">{session.time}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Chat Area */}
                <main className="flex-1 flex flex-col relative bg-white border-l border-gray-100">
                    {/* Sidebar Toggle Button */}
                    {leftSidebarCollapsed && (
                        <button
                            onClick={() => setLeftSidebarCollapsed(false)}
                            className="absolute top-4 left-4 z-30 w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:text-black hover:border-gray-300 hover:shadow-md transition-all"
                            title="Show chat history"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                        </button>
                    )}
                    <div className="flex-1 overflow-y-auto w-full">
                        {(() => {
                            const selectedCurrent = cashFlowAssets.find(a => a.title === activeAgent) || cashFlowAssets[0];
                            const progress = 75;
                            const mockMonthlyRevenue = [
                                { month: 'Aug', amount: 380000 },
                                { month: 'Sep', amount: 395000 },
                                { month: 'Oct', amount: 410000 },
                                { month: 'Nov', amount: 415000 },
                                { month: 'Dec', amount: 430000 },
                                { month: 'Jan', amount: 450000 },
                            ];

                            // Shared tab content renderer
                            const renderTabContent = () => (
                                <div className="w-full max-w-5xl mx-auto">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 px-4 gap-4">
                                        <div className="flex gap-4 sm:gap-8 border-b border-gray-100 flex-1 sm:mr-8 overflow-x-auto">
                                            {['Background', 'Financial Health', 'Rules'].map(tab => (
                                                <button
                                                    key={tab}
                                                    onClick={() => setActiveAssetTab(tab as any)}
                                                    className={`text-xs sm:text-sm font-black tracking-widest uppercase pb-4 -mb-px transition-colors border-b-[3px] whitespace-nowrap ${activeAssetTab === tab ? 'border-green-500 text-black' : 'border-transparent text-gray-300 hover:text-black hover:border-black/20'}`}
                                                >
                                                    {tab}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex gap-2 sm:gap-3 shrink-0">
                                            <span className="px-3 py-1 bg-black text-white text-[10px] font-bold rounded-full">Verified by Loka</span>
                                            <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-full">Stripe API Verified</span>
                                        </div>
                                    </div>

                                    <div className="w-full transition-all">
                                        <div className="flex flex-col gap-12 pt-4">
                                            {activeAssetTab === 'Background' && (
                                                <div className="w-full space-y-12 animate-fadeIn pb-10">
                                                    <div className="flex flex-col lg:flex-row items-center justify-between bg-gray-50/40 p-5 rounded-[2.5rem] border border-gray-100/50 gap-6">
                                                        <div className="flex items-center gap-6 w-full">
                                                            <div className="w-16 h-16 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center justify-center text-2xl font-bold text-black shrink-0">{selectedCurrent.title.charAt(0)}</div>
                                                            <div className="flex flex-col gap-4">
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <h3 className="font-bold text-black text-lg">{selectedCurrent.title} LLC</h3>
                                                                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                                                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-[11px] text-gray-400 font-medium mt-1">Singapore (ACRA ID: 20230812X) • Founded 2023</p>
                                                                </div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {[{ label: 'Twitter', color: '#1DA1F2' }, { label: 'LinkedIn', color: '#0077b5' }, { label: 'GitHub', color: '#000' }].map((social, i) => (
                                                                        <div key={i} className="flex items-center gap-1.5 bg-white border border-gray-100 px-3 py-1.5 rounded-xl shadow-sm hover:shadow-md hover:border-black/5 transition-all cursor-pointer">
                                                                            <span className="text-[10px] font-bold text-gray-500">{social.label}</span>
                                                                            <div className="w-3 h-3 bg-green-50 rounded-full flex items-center justify-center"><svg className="w-1.5 h-1.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 13l4 4L19 7" /></svg></div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row bg-black rounded-3xl p-5 gap-4 sm:gap-8 shrink-0 shadow-lg">
                                                            <div>
                                                                <p className="text-xl font-serif italic font-bold text-white leading-none">$1.5M</p>
                                                                <p className="text-[8px] font-bold text-gray-500 tracking-widest mt-2 uppercase">Total Funding Raised</p>
                                                            </div>
                                                            <div className="w-px h-full bg-white/10 hidden sm:block" />
                                                            <div>
                                                                <p className="text-xl font-serif italic font-bold text-green-500 leading-none">100% ↑</p>
                                                                <p className="text-[8px] font-bold text-gray-500 tracking-widest mt-2 uppercase">On-time Repayment</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-6">
                                                        <div className="flex items-center gap-4"><h3 className="text-base font-black text-black">Business Narrative</h3><div className="h-px flex-1 bg-gray-50" /></div>
                                                        <p className="text-sm text-gray-500 leading-loose font-medium max-w-4xl">We are operating over 500 GPUs in Singapore. This funding batch will be used to prepay electricity and bandwidth expansion for our next month of generative AI rendering contracts. Over the past 12 months, we have maintained a 99.9% uptime and generated consistent cash flows from our enterprise clients.</p>
                                                        <div className="bg-[#fcfbf9] p-8 rounded-[2rem] border-l-4 border-green-500 italic text-sm text-gray-600 shadow-sm">"Purchasing 8 additional H100 GPUs and pre-paying data center rack fees in Tokyo to expand computing rental capacity."</div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        {['https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=800', 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=800', 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=800'].map((url, i) => (
                                                            <div key={i} className="aspect-[1.6/1] bg-gray-100 rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm group"><img src={url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /></div>
                                                        ))}
                                                    </div>
                                                    <div className="space-y-8">
                                                        <div className="flex items-center gap-4"><h3 className="text-base font-black text-black">Leadership & Backing</h3><div className="h-px flex-1 bg-gray-50" /></div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            {[{ name: 'Alex Chen', role: 'Chief Executive Officer', badge: 'Ex-AWS Principal Architect', bio: '10+ years scaling global cloud infrastructure. Led GPU cluster deployments for Fortune 500 AI divisions.' }, { name: 'Sarah Li', role: 'Chief Technology Officer', badge: 'Ex-Ethereum Foundation', bio: 'Expert in secure protocol & smart contract auditing. Specializes in DePIN hardware attestation layers.' }].map((person, i) => (
                                                                <div key={i} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 flex items-start gap-6 shadow-sm hover:shadow-md transition-all">
                                                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center font-serif text-2xl text-gray-300 shrink-0">{person.name[0]}</div>
                                                                    <div className="space-y-1">
                                                                        <p className="font-black text-black text-base">{person.name}</p>
                                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{person.role}</p>
                                                                        <div className="pt-2"><span className="text-[11px] text-blue-600 font-black bg-blue-50 px-2.5 py-1 rounded-lg">{person.badge}</span></div>
                                                                        <p className="text-xs text-gray-500 mt-4 font-medium leading-relaxed">{person.bio}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {activeAssetTab === 'Financial Health' && (
                                                <div className="w-full space-y-8 animate-fadeIn">
                                                    <section className="space-y-6">
                                                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                                            <div className="flex items-center gap-3">
                                                                <h3 className="text-base font-bold text-black">Stripe Connect API Monitor</h3>
                                                                <div className="bg-blue-50 text-blue-600 text-[9px] font-bold px-3 py-1 rounded-full italic">Read-Only Access</div>
                                                            </div>
                                                            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse" /><span className="text-[10px] font-bold text-[#00E676]">Oracle Online</span></div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            {[{ label: '30d Gross Flow', value: '$1,245,600', sub: 'Up 11.2% MoM', trend: 'up' }, { label: 'Coverage Ratio', value: '2.49x', sub: 'Calculated at Maturity', trend: 'safe' }, { label: 'MRR', value: '$42,000', sub: 'Enterprise Focus', trend: 'up' }].map((stat, i) => (
                                                                <div key={i} className="p-6 bg-white glass rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                                                                    <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-3">{stat.label}</p>
                                                                    <p className="text-3xl font-serif italic text-black mb-1">{stat.value}</p>
                                                                    <p className="text-[10px] font-bold text-[#00E676] tracking-tighter flex items-center gap-1">{stat.trend === 'up' && '▲'} {stat.sub}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <div className="p-6 bg-white glass rounded-3xl border border-gray-100 shadow-sm space-y-4">
                                                                <div className="flex justify-between items-center">
                                                                    <p className="text-sm font-bold text-black">Revenue Timeline (6mo)</p>
                                                                    <p className="text-[10px] font-bold text-gray-400">Verifiably Accurate</p>
                                                                </div>
                                                                <div className="h-[200px] w-full">
                                                                    <ResponsiveContainer width="100%" height="100%">
                                                                        <BarChart data={mockMonthlyRevenue}>
                                                                            <CartesianGrid strokeDasharray="1 6" vertical={false} stroke="#f0f0f0" />
                                                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#999' }} dy={8} />
                                                                            <YAxis hide />
                                                                            <Tooltip cursor={{ fill: '#f9f9f9' }} content={({ payload }) => payload?.[0] ? (<div className="bg-black text-white p-3 rounded-2xl text-[10px] font-black shadow-2xl">${payload[0].value?.toLocaleString()}</div>) : null} />
                                                                            <Bar dataKey="amount" fill="#000" radius={[4, 4, 4, 4]} barSize={32} />
                                                                        </BarChart>
                                                                    </ResponsiveContainer>
                                                                </div>
                                                            </div>
                                                            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                                                                <p className="text-sm font-bold text-black">Customer Concentration Analysis</p>
                                                                <div className="space-y-4">
                                                                    {[{ label: 'Top 1 Customer', value: '15%', color: 'bg-black' }, { label: 'Top 5 Customers', value: '42%', color: 'bg-gray-400' }, { label: 'Long-Tail Borrowers', value: '43%', color: 'bg-gray-200' }].map((item, i) => (
                                                                        <div key={i} className="space-y-2">
                                                                            <div className="flex justify-between text-[11px] font-bold"><span className="text-gray-400">{item.label}</span><span className="text-black">{item.value}</span></div>
                                                                            <div className="w-full h-1.5 bg-white rounded-full overflow-hidden border border-gray-100/50"><div className={`h-full ${item.color}`} style={{ width: item.value }} /></div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <p className="text-[10px] text-gray-400 italic leading-relaxed">Diversified customer base ensures that if a single client churns, the underlying asset revenue remains robust enough to cover interest payments.</p>
                                                            </div>
                                                        </div>
                                                    </section>
                                                    <section className="space-y-4">
                                                        <div className="flex items-center gap-4"><h3 className="text-base font-bold text-black">Loka AI Risk scoring</h3><div className="h-px flex-1 bg-gray-100" /></div>
                                                        <div className="p-8 bg-purple-50 rounded-[40px] border-2 border-purple-100/50 relative overflow-hidden group">
                                                            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-purple-200/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                                                            <div className="relative z-10 space-y-6">
                                                                <div className="flex justify-between items-start">
                                                                    <div className="space-y-1"><div className="p-2 bg-purple-600 rounded-lg w-fit text-white text-xs">Loka AI v2.4</div><p className="text-[10px] font-bold text-purple-400 mt-2">Analysis Engine: Predictive Default Model</p></div>
                                                                    <div className="text-right"><div className="text-5xl font-serif italic text-purple-600">AAA</div><p className="text-xs font-bold text-purple-400">98/100 Confidence</p></div>
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                    <div className="space-y-3">
                                                                        <p className="text-[11px] font-bold text-purple-900 border-b border-purple-100 pb-1">Key Strengths</p>
                                                                        <ul className="space-y-2">{['Market Fit: AI computing demand is in a phase of exponential growth.', 'Cash Flow Quality: Stripe lock-box account with mandatory repayment mechanism.', 'Strong Collateral: Physical GPU lien + Accounts receivable security interest.'].map((p, i) => (<li key={i} className="flex items-center gap-3 text-[11px] text-purple-800 font-medium italic"><span className="text-[#00E676] text-lg">✓</span> {p}</li>))}</ul>
                                                                    </div>
                                                                    <div className="space-y-3">
                                                                        <p className="text-[11px] font-bold text-purple-900 border-b border-purple-100 pb-1">Risk Observations</p>
                                                                        <ul className="space-y-2">{['Geopolitics: Data center electricity rates in Tokyo impacted by energy price volatility.', 'Obsolescence: Risk of H100 computing power facing depreciation after 24 months.'].map((p, i) => (<li key={i} className="flex items-center gap-3 text-[11px] text-purple-800 font-medium italic"><span className="text-orange-400 text-lg">⚠️</span> {p}</li>))}</ul>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </section>
                                                </div>
                                            )}
                                            {activeAssetTab === 'Rules' && (
                                                <div className="w-full space-y-12 animate-fadeIn">
                                                    <section className="space-y-6">
                                                        <h3 className="text-base font-bold text-black">Campaign Rules & Mechanics</h3>
                                                        <div className="p-8 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-8">
                                                            <div className="relative pt-6 pb-2">
                                                                <div className="absolute top-8 left-[16%] right-[16%] h-1 bg-gray-100 rounded-full" />
                                                                <div className="absolute top-8 left-[16%] h-1 bg-[#00E676] transition-all duration-1000 rounded-full" style={{ width: `${progress * 0.68}%` }} />
                                                                <div className="relative flex justify-between z-10 w-full">
                                                                    {[{ label: 'Start', title: 'Fundraising', desc: 'Freely deposit or withdraw USDC.', active: false }, { label: '$250k', title: 'Success Point', desc: 'Goal met. Campaign secures funding.', active: true }, { label: '$500k', title: 'Lock & Deploy', desc: 'Pool locked immediately. Yield begins.', active: false }].map((step, i) => (
                                                                        <div key={i} className="flex flex-col items-center w-1/3 text-center space-y-3">
                                                                            <div className={`w-5 h-5 rounded-full bg-white border-4 ${step.active ? 'border-black' : 'border-gray-200'} shadow-sm relative`}>
                                                                                <span className={`absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] font-black tracking-widest ${step.active ? 'text-black' : 'text-gray-400'} whitespace-nowrap`}>{step.label}</span>
                                                                            </div>
                                                                            <div><h4 className="text-[11px] font-black tracking-widest text-black mb-1">{step.title}</h4><p className="text-[10px] text-gray-500 font-medium px-2 leading-relaxed">{step.desc}</p></div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                                                                <div className="flex gap-4 p-5 bg-green-50/50 rounded-2xl border border-green-100/50"><div className="text-xl" style={{ marginTop: '2px' }}>💸</div><div><h4 className="text-[11px] font-black tracking-widest text-black mb-1">If Campaign Succeeds</h4><p className="text-[10px] text-gray-500 leading-relaxed font-medium">Funds are locked. Guaranteed payout rules execute to distribute principal and yield direct to wallet.</p></div></div>
                                                                <div className="flex gap-4 p-5 bg-red-50/40 rounded-2xl border border-red-100/50"><div className="text-xl" style={{ marginTop: '2px' }}>↩️</div><div><h4 className="text-[11px] font-black tracking-widest text-black mb-1">If Campaign Fails</h4><p className="text-[10px] text-gray-500 leading-relaxed font-medium">Should the soft cap be missed before deadline, smart contracts auto-refund 100% of participants' capital safety.</p></div></div>
                                                            </div>
                                                        </div>
                                                    </section>
                                                    <section className="space-y-8">
                                                        <h3 className="text-base font-bold text-black">Fund Flow & Asset Structure</h3>
                                                        <div className="p-10 bg-gray-50 rounded-[32px] border border-gray-100 flex flex-wrap items-center justify-center gap-x-4 gap-y-8 text-center relative overflow-hidden">
                                                            <div className="absolute top-0 right-0 p-4"><div className="px-2 py-0.5 bg-white/80 backdrop-blur rounded text-[9px] font-bold text-gray-400 border border-gray-100">Immutable Smart Contract</div></div>
                                                            {['Investors', 'Loka SPV', 'Borrower', 'Purchase H100', 'Revenue Gen', 'Stripe Escrow', 'Auto-Repay'].map((step, i) => (
                                                                <React.Fragment key={i}>
                                                                    <div className="relative group"><div className={`px-4 py-3 rounded-2xl border shadow-sm transition-all duration-500 flex items-center justify-center min-w-[100px] ${i === 6 ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-100 group-hover:border-black'}`}><p className="text-[9px] font-black tracking-widest">{step}</p></div><div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold text-gray-300 italic">Step 0{i + 1}</div></div>
                                                                    {i < 6 && <div className="text-gray-300 font-light text-xl animate-pulse">→</div>}
                                                                </React.Fragment>
                                                            ))}
                                                        </div>
                                                    </section>
                                                    <section className="space-y-6">
                                                        <h3 className="text-base font-bold text-black">Key Rights & Protections</h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {[{ icon: '🥇', title: 'Seniority', badge: 'Senior Secured', plainEnglish: 'In the event of liquidation, you are paid back first—before the company\'s shareholders.' }, { icon: '🛡️', title: 'Structure', badge: 'Bankruptcy Remote', plainEnglish: 'Assets are held in a secure, independent SPV. Even if the parent company fails, your investment remains out of reach for their creditors.' }, { icon: '🧱', title: 'Collateral Ratio', badge: '120%-150%', plainEnglish: 'Every $100 lent is backed by up to $150 in expected revenue. Even if earnings drop by 30%, your principal remains secure.' }, { icon: '🤖', title: 'Smart Escrow', badge: 'Code Enforced', plainEnglish: 'Revenue is intercepted by SDK and flows directly into on-chain contracts. It is tamper-proof and automatically distributed at maturity.' }].map((item, i) => (
                                                                <div key={i} className="group relative bg-white border border-gray-100 p-6 rounded-[32px] hover:border-black transition-all duration-300 shadow-sm overflow-hidden h-48 flex flex-col justify-between">
                                                                    <div className="space-y-3"><div className="text-2xl">{item.icon}</div><div><p className="text-[11px] font-bold text-gray-400 tracking-tight">{item.title}</p><p className="text-sm font-black text-black leading-tight mt-1">{item.badge}</p></div></div>
                                                                    <div className="flex items-center gap-1.5 pt-2 border-t border-gray-50"><div className="w-1.5 h-1.5 rounded-full bg-[#00E676]" /><span className="text-[9px] font-bold text-gray-400 tracking-widest">Active Protection</span></div>
                                                                    <div className="absolute inset-0 bg-black/95 p-6 flex flex-col justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 cursor-default"><p className="text-[13px] text-white font-medium leading-relaxed italic text-center">"{item.plainEnglish}"</p></div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </section>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );

                            // Shared project brief card renderer
                            const renderProjectBrief = () => (
                                <div className="w-full max-w-5xl mx-auto bg-white border border-gray-100 rounded-[2rem] p-6 shadow-[0_5px_40px_-15px_rgba(0,0,0,0.05)] transition-all">
                                    <div className="flex flex-col lg:flex-row gap-8">
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div className="mb-6 lg:mb-0 flex gap-4">
                                                <img src={selectedCurrent.image} className="w-12 h-12 rounded-full object-cover border border-gray-100 shrink-0 mt-1" alt={selectedCurrent.title} />
                                                <div>
                                                    <h3 className="text-2xl font-bold text-black mb-2">{selectedCurrent.title}</h3>
                                                    <p className="text-xs text-gray-500 font-medium leading-relaxed pr-8">{selectedCurrent.desc}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-8 items-end pt-4 border-t border-gray-50 lg:border-none lg:pt-0">
                                                <div><p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-1">Target Yield</p><p className="text-lg font-serif italic text-black font-bold">15.5% <span className="text-[10px] text-gray-400 not-italic font-sans">APY</span></p></div>
                                                <div><p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-1">Target Raise</p><p className="text-lg font-serif italic text-black font-bold">$500,000</p></div>
                                                <div><p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-1">Duration</p><p className="text-base font-bold text-black">60 Days</p></div>
                                            </div>
                                        </div>
                                        <div className="w-full lg:w-[460px] bg-gray-50/80 rounded-3xl p-4 sm:p-6 shrink-0 border border-gray-100/80">
                                            <div className="space-y-6">
                                                <div className="flex justify-between items-end">
                                                    <div><p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-2">Campaign Progress</p><p className="text-3xl font-serif italic text-black font-bold">${((500000 * progress) / 100).toLocaleString()}</p></div>
                                                    <div className="text-right"><p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-2">Goal</p><p className="text-sm font-bold text-black font-serif italic">$500k</p></div>
                                                </div>
                                                <div className="space-y-2.5">
                                                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-black rounded-full" style={{ width: `${progress}%` }} /></div>
                                                    <div className="flex justify-between items-center text-[10px] font-bold"><span className="text-black">{progress}% funded</span><div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /><span className="text-black tracking-wide">Fundraising</span></div></div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex -space-x-1.5"><div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-gray-50" /><div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-gray-50" /><div className="w-6 h-6 rounded-full bg-black flex items-center justify-center border-2 border-gray-50 z-10"><span className="text-[8px] font-bold text-white">+86</span></div></div>
                                                    <span className="text-[10px] font-bold text-gray-400 ml-1">Backers pledged</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );

                            return messages.length === 0 ? (
                                <div className="min-h-full w-full flex flex-col max-w-5xl mx-auto px-4 sm:px-10 pt-14 sm:pt-32 pb-20 sm:pb-32">
                                    <div className="flex flex-col items-center mb-6 sm:mb-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-xl flex items-center justify-center text-black font-black shadow-lg text-sm sm:text-base">
                                                L
                                            </div>
                                            <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">Loka AI</h1>
                                        </div>
                                    </div>

                                    <div className={`bg-white border rounded-2xl p-2 sm:p-4 w-full flex flex-col max-w-3xl mx-auto mb-8 sm:mb-12 relative transition-all duration-500 group/input ${activeForm ? 'border-green-400/60 shadow-[0_0_30px_-5px_rgba(74,222,128,0.2)] scale-[1.01]' : isInputFocused ? 'border-green-400/60 shadow-[0_0_30px_-5px_rgba(74,222,128,0.2)] scale-[1.01]' : 'border-gray-200/80 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] hover:border-green-200 hover:shadow-[0_12px_50px_-15px_rgba(0,0,0,0.1)] idle-input-glow'}`}>
                                        {/* Input Row — switches between normal input and inline sentence */}
                                        {activeForm ? (
                                            <div className="flex items-center w-full px-3 sm:px-6 py-4 sm:py-5 gap-2 flex-wrap">
                                                <span className="text-sm sm:text-base font-medium text-black whitespace-nowrap">I want to {activeForm}</span>
                                                <input
                                                    type="number"
                                                    value={formAmount}
                                                    onChange={(e) => setFormAmount(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleInlineActionSubmit()}
                                                    placeholder="0.00"
                                                    autoFocus
                                                    className="w-20 sm:w-28 bg-transparent border-b-2 border-green-400 outline-none text-sm sm:text-base font-bold text-green-600 text-center py-1 placeholder:text-green-300/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <span className="text-sm sm:text-base font-medium text-black whitespace-nowrap">USDC of</span>
                                                <span className="text-sm sm:text-base font-bold text-black bg-gray-100 px-2 sm:px-3 py-1 rounded-lg truncate max-w-[120px] sm:max-w-none">{activeAgent}</span>
                                                <span className="text-sm sm:text-base font-medium text-black">.</span>
                                                <div className="flex items-center gap-2 ml-auto">
                                                    <button
                                                        onClick={() => { setActiveForm(null); setFormAmount(''); }}
                                                        className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-all"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={handleInlineActionSubmit}
                                                        className="w-12 h-12 bg-green-500 text-white rounded-xl flex items-center justify-center hover:bg-green-600 transition-all shadow-lg shadow-green-500/30"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center w-full relative">
                                                {!inputText && !isInputFocused && !isRecording && (
                                                    <div className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                                                        <span className="text-gray-400 text-sm sm:text-base font-medium">{typedPlaceholder}</span>
                                                        <span className="inline-block w-[2px] h-5 bg-green-400 ml-[1px] animate-[cursorBlink_1s_steps(2)_infinite]" />
                                                    </div>
                                                )}
                                                {isRecording && (
                                                    <div className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-3">
                                                        <span className="text-red-500 text-sm sm:text-base font-bold animate-pulse">Listening...</span>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-ping" style={{ animationDuration: '1s', animationDelay: '0ms' }} />
                                                            <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-ping" style={{ animationDuration: '1.2s', animationDelay: '200ms' }} />
                                                            <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-ping" style={{ animationDuration: '0.8s', animationDelay: '400ms' }} />
                                                        </div>
                                                    </div>
                                                )}
                                                <input
                                                    type="text"
                                                    value={isRecording ? "" : inputText}
                                                    onChange={(e) => setInputText(e.target.value)}
                                                    onFocus={() => setIsInputFocused(true)}
                                                    onBlur={() => setIsInputFocused(false)}
                                                    onKeyDown={(e) => e.key === 'Enter' && !isRecording && handleSend()}
                                                    placeholder=""
                                                    disabled={isRecording}
                                                    className={`flex-1 bg-transparent border-none outline-none text-black text-sm sm:text-base px-3 sm:px-6 py-4 sm:py-6 font-medium relative z-10 ${isRecording ? 'opacity-0' : ''} transition-opacity`}
                                                />
                                                <button
                                                    onClick={handleVoiceInput}
                                                    className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition-all mr-1 sm:mr-2 shrink-0 relative ${isRecording
                                                        ? 'bg-red-50 text-red-500 ring-2 ring-red-500/50 shadow-lg shadow-red-500/20 scale-105'
                                                        : 'text-gray-400 hover:text-black hover:bg-gray-50'
                                                        }`}
                                                    title={isRecording ? "Stop Recording" : "Voice Input"}
                                                >
                                                    {isRecording && (
                                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                                                    )}
                                                    {isRecording && (
                                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                                                    )}
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                                </button>
                                                <button
                                                    onClick={handleSend}
                                                    disabled={isRecording}
                                                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 mr-1 ${isInputFocused && !isRecording ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 scale-110' : 'bg-green-100 text-green-600 hover:bg-green-600 hover:text-white'} ${isRecording ? 'opacity-50 cursor-not-allowed scale-95 hover:bg-green-100 hover:text-green-600' : ''}`}
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                                </button>
                                            </div>
                                        )}

                                        {/* Quick Actions — always visible */}
                                        <div className={`flex gap-2 sm:gap-3 px-3 sm:px-5 pb-2 pt-2 border-t transition-colors duration-500 items-center ${activeForm || isInputFocused ? 'border-gray-100' : 'border-transparent'}`}>
                                            {/* @Asset Button */}
                                            {(() => {
                                                const selectedAsset = selectedAssetName ? cashFlowAssets.find(a => a.title === selectedAssetName) : null;
                                                return selectedAsset ? (
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-300 rounded-full text-[11px] font-bold text-green-700">
                                                        <button
                                                            onClick={() => handleProjectClick(selectedAsset.title)}
                                                            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                                        >
                                                            <img src={selectedAsset.image} alt={selectedAsset.title} className="w-5 h-5 rounded-full object-cover" />
                                                            <span className="max-w-[120px] truncate">@{selectedAsset.title}</span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setSelectedAssetName(null); }}
                                                            className="ml-0.5 text-green-400 hover:text-red-500 transition-colors flex items-center"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => window.dispatchEvent(new CustomEvent('loka-nav-market'))}
                                                        className="px-4 py-2 border rounded-full text-[11px] font-bold transition-all flex items-center gap-2 hover:scale-105 active:scale-95 bg-gray-50 border-gray-100 text-gray-500 hover:border-black hover:text-black hover:shadow-sm"
                                                    >
                                                        <span className="text-base leading-none">@</span>
                                                        Asset
                                                    </button>
                                                );
                                            })()}

                                            {/* + Action Menu Button */}
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowActionMenu(!showActionMenu)}
                                                    className={`w-9 h-9 border rounded-full text-sm font-bold transition-all flex items-center justify-center hover:scale-105 active:scale-95 ${showActionMenu
                                                        ? 'bg-black border-black text-white'
                                                        : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-black hover:text-black hover:shadow-sm'
                                                        }`}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                                </button>
                                                {showActionMenu && (
                                                    <div className="absolute bottom-full left-0 mb-3 w-56 bg-white border border-gray-100 rounded-2xl shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)] p-2 z-[100] animate-fadeIn">
                                                        <div className="absolute bottom-[-6px] left-4 w-3 h-3 bg-white border-r border-b border-gray-100 rotate-45" />
                                                        {!selectedAssetName && (
                                                            <p className="text-[10px] text-amber-600 font-bold px-3 py-2 bg-amber-50 rounded-xl mb-1.5 flex items-center gap-1.5">
                                                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" /></svg>
                                                                Please select an asset first
                                                            </p>
                                                        )}
                                                        <button
                                                            onClick={() => { if (selectedAssetName) { setActiveForm('buy'); setFormAmount(''); setShowActionMenu(false); } }}
                                                            disabled={!selectedAssetName}
                                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${selectedAssetName
                                                                ? 'text-black hover:bg-green-50 cursor-pointer'
                                                                : 'text-gray-300 cursor-not-allowed'
                                                                }`}
                                                        >
                                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${selectedAssetName ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                                <svg className={`w-3.5 h-3.5 ${selectedAssetName ? 'text-green-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                                            </div>
                                                            Buy Asset
                                                        </button>
                                                        <button
                                                            onClick={() => { if (selectedAssetName) { setActiveForm('sell'); setFormAmount(''); setShowActionMenu(false); } }}
                                                            disabled={!selectedAssetName}
                                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${selectedAssetName
                                                                ? 'text-black hover:bg-red-50 cursor-pointer'
                                                                : 'text-gray-300 cursor-not-allowed'
                                                                }`}
                                                        >
                                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${selectedAssetName ? 'bg-red-100' : 'bg-gray-100'}`}>
                                                                <svg className={`w-3.5 h-3.5 ${selectedAssetName ? 'text-red-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>
                                                            </div>
                                                            Sell Asset
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="group relative ml-2 flex items-center h-full">
                                                <div className="w-9 h-9 bg-violet-50 border border-violet-100 rounded-full cursor-help hover:bg-violet-100 transition-all flex items-center justify-center shadow-sm">
                                                    <Icons.Coins className="w-5 h-5 text-violet-600" />
                                                </div>

                                                <div className="absolute bottom-full right-0 sm:left-1/2 sm:-translate-x-1/2 mb-4 w-64 sm:w-72 p-4 sm:p-6 bg-black shadow-2xl rounded-[24px] sm:rounded-[32px] opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[100] transform translate-y-3 group-hover:translate-y-0 border border-white/10">
                                                    <p className="text-[9px] font-black text-violet-400 tracking-[0.3em] mb-4 uppercase text-center">Earning Strategy</p>
                                                    <div className="space-y-4">
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">✨</div>
                                                            <div>
                                                                <p className="text-[11px] font-black text-white leading-tight flex items-center justify-between">
                                                                    Early Bird Bonus
                                                                    <span className="text-violet-400">+20 pts</span>
                                                                </p>
                                                                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">Subscribe within first 48h of asset release.</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">🐳</div>
                                                            <div>
                                                                <p className="text-[11px] font-black text-white leading-tight flex items-center justify-between">
                                                                    High-Volume Tier
                                                                    <span className="text-amber-400">+50 pts</span>
                                                                </p>
                                                                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">One-time bonus for single subscriptions &gt;$5k.</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">⌛</div>
                                                            <div>
                                                                <p className="text-[11px] font-black text-white leading-tight flex items-center justify-between">
                                                                    Loyalty Stream
                                                                    <span className="text-blue-400">+10 pts</span>
                                                                </p>
                                                                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">Earn every 30 days of continuous holding.</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Decorative Arrow */}
                                                    <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-black rotate-45 border-r border-b border-white/10" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cash Flow Assets Slider */}
                                    <div className="w-full mt-8 sm:mt-10">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-black text-black tracking-widest uppercase">Funding Projects</h3>
                                            <button
                                                onClick={() => window.dispatchEvent(new CustomEvent('loka-nav-market'))}
                                                className="text-[11px] font-bold text-gray-500 hover:text-black hover:underline underline-offset-4 decoration-2 transition-all flex items-center gap-1"
                                            >
                                                View All <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                            </button>
                                        </div>
                                        <div className="w-full overflow-x-auto pb-6 pt-4 -mt-4 cursor-grab active:cursor-grabbing selection:bg-transparent [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                            <div className="flex w-max gap-3 sm:gap-5 px-0 sm:px-2">
                                                {cashFlowAssets.slice(0, 5).map((asset, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => {
                                                            setSelectedAssetName(asset.title);
                                                            window.dispatchEvent(new CustomEvent('loka-nav-market'));
                                                            setTimeout(() => window.dispatchEvent(new CustomEvent('loka-open-asset', { detail: asset.title })), 100);
                                                        }}
                                                        className={`w-[70vw] max-w-[280px] sm:w-72 bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 p-4 sm:p-5 shrink-0 shadow-sm hover:border-black/10 hover:shadow-[0_12px_50px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all group flex flex-col gap-3 sm:gap-4 cursor-pointer`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3 w-full">
                                                                <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm border border-gray-100 shrink-0">
                                                                    <img src={asset.image} alt={asset.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                                </div>
                                                                <div className="flex flex-col flex-1 min-w-0 pr-2">
                                                                    <h4 className="font-black text-black text-sm leading-tight truncate group-hover:text-green-600 transition-colors">{asset.title}</h4>
                                                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 truncate">{asset.category}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="min-h-[2.5rem]">
                                                            <p className="text-xs text-gray-500 font-medium leading-relaxed line-clamp-2">{asset.desc}</p>
                                                        </div>

                                                        <div className="space-y-1.5 mt-auto">
                                                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                                                <span className="text-gray-400">Progress</span>
                                                                <div className="flex items-center gap-1.5 hover:scale-105 transition-transform cursor-pointer">
                                                                    <span className="text-black">{asset.progress || 75}%</span>
                                                                    <span className="text-gray-400 font-bold normal-case text-[10px]">({asset.backers || 0} backers)</span>
                                                                </div>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${asset.progress || 75}%` }}></div>
                                                            </div>
                                                        </div>

                                                        <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                                                            <div>
                                                                <p className="text-[9px] text-gray-400 font-black tracking-widest uppercase mb-0.5">Target Yield</p>
                                                                <p className="text-base font-black text-black">{asset.apy || '15.5%'} <span className="text-[9px] text-gray-400 font-bold italic">APY</span></p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[9px] text-gray-400 font-black tracking-widest uppercase mb-0.5">Lock Term</p>
                                                                <p className="text-sm font-black text-black mt-1">{asset.term || '60 Days'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-5xl mx-auto">
                                    {/* Expandable Project Details Card at top of chat */}
                                    <div className="w-full bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden">
                                        {/* Compact Header - always visible */}
                                        <div
                                            className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 sm:p-5 cursor-pointer group"
                                            onClick={() => setProjectCardExpanded(!projectCardExpanded)}
                                        >
                                            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                                <img src={selectedCurrent.image} className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover border border-gray-100 shrink-0" alt={selectedCurrent.title} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-sm font-black text-black truncate">{selectedCurrent.title}</h3>
                                                        <span className="px-1.5 py-0.5 bg-green-50 text-green-600 text-[8px] font-black rounded tracking-wider shrink-0">VERIFIED</span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-400 font-medium leading-snug line-clamp-1">{selectedCurrent.desc}</p>
                                                </div>
                                                {/* Expand/Collapse Chevron */}
                                                <div className={`w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-gray-100 transition-all sm:hidden ${projectCardExpanded ? 'rotate-180' : ''}`}>
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 sm:gap-5 shrink-0 sm:pl-4 sm:border-l border-gray-100 overflow-x-auto">
                                                <div className="text-left sm:text-right">
                                                    <p className="text-[8px] font-bold text-gray-400 tracking-widest uppercase">Yield</p>
                                                    <p className="text-sm font-black text-black">15.5%</p>
                                                </div>
                                                <div className="text-left sm:text-right">
                                                    <p className="text-[8px] font-bold text-gray-400 tracking-widest uppercase">Raise</p>
                                                    <p className="text-sm font-black text-black">$500k</p>
                                                </div>
                                                <div className="text-left sm:text-right">
                                                    <p className="text-[8px] font-bold text-gray-400 tracking-widest uppercase">Term</p>
                                                    <p className="text-sm font-bold text-black">60d</p>
                                                </div>
                                                {/* Progress bar inline */}
                                                <div className="flex items-center gap-2 shrink-0 pl-3 sm:pl-4 border-l border-gray-100">
                                                    <div className="w-16 sm:w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-black rounded-full" style={{ width: `${progress}%` }} />
                                                    </div>
                                                    <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap">{progress}%</span>
                                                </div>
                                                {/* Expand/Collapse Chevron — desktop only */}
                                                <div className={`hidden sm:flex w-8 h-8 rounded-full bg-gray-50 items-center justify-center shrink-0 group-hover:bg-gray-100 transition-all ${projectCardExpanded ? 'rotate-180' : ''}`}>
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Content */}
                                        {projectCardExpanded && (
                                            <div className="border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                                {/* Full Project Brief */}
                                                <div className="p-6">
                                                    {renderProjectBrief()}
                                                </div>
                                                {/* Tabs */}
                                                <div className="px-6 pb-8">
                                                    {renderTabContent()}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {messages.map((msg, i) => (
                                        <div key={i} className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`shadow-sm rounded-2xl ${msg.role === 'user'
                                                    ? 'max-w-[80%] p-4 bg-black text-white font-medium shadow-md'
                                                    : 'w-full max-w-[90%] bg-white text-black border border-gray-100 p-6'
                                                    }`}>
                                                    {msg.role === 'assistant' && msg.type === 'asset_detail' ? (
                                                        <div className="space-y-6">
                                                            <p className="text-sm text-gray-700 leading-relaxed font-medium">{msg.content}</p>

                                                            <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white">
                                                                        {msg.asset === 'AIUSD' ? 'AI' : <Icons.TrendingUp />}
                                                                    </div>
                                                                    <div>
                                                                        <h2 className="text-base font-black">{msg.asset} Summary</h2>
                                                                        <p className="text-[9px] text-gray-400 font-bold  tracking-widest">Real-time Overview</p>
                                                                    </div>
                                                                </div>
                                                                {msg.asset === 'AIUSD' && (
                                                                    <div className="text-right">
                                                                        <p className="text-[10px] text-gray-400 font-black  tracking-widest">Current APY</p>
                                                                        <p className="text-2xl font-black text-green-500">{msg.data.apy}</p>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {msg.data.hot_assets ? (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    {msg.data.hot_assets.map((asset: any, idx: number) => (
                                                                        <div key={idx} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-black/10 hover:shadow-lg transition-all">
                                                                            <div className="flex items-center justify-between mb-4">
                                                                                <h4 className="text-sm font-black text-black">{asset.title}</h4>
                                                                                <span className="text-xs font-black text-green-500">{asset.apy} APY</span>
                                                                            </div>
                                                                            <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold  tracking-widest mb-4">
                                                                                <span>Target: <span className="text-black">{asset.target}</span></span>
                                                                                <span>Term: <span className="text-black">{asset.term}</span></span>
                                                                            </div>
                                                                            <div className="space-y-2 mb-6">
                                                                                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                                                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${asset.progress}%` }}></div>
                                                                                </div>
                                                                                <div className="flex justify-between text-[9px] font-black  tracking-tighter text-gray-400">
                                                                                    <span>Progress</span>
                                                                                    <span>{asset.progress}% Funded</span>
                                                                                </div>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => handleProjectClick(asset.title)}
                                                                                className="w-full py-2.5 bg-black text-white text-[10px] font-black rounded-lg hover:bg-gray-800 transition-all  tracking-widest"
                                                                            >
                                                                                View Details
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                        {[
                                                                            { label: 'Total Value Locked', value: msg.data.tvl },
                                                                            { label: 'Yield Source', value: msg.data.yieldSource },
                                                                            { label: 'Risk Rating', value: msg.data.risk },
                                                                            { label: 'Collateral Ratio', value: msg.data.collateral },
                                                                        ].map((stat, idx) => (
                                                                            <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                                                <p className="text-[8px] font-black text-gray-400  tracking-widest mb-1">{stat.label}</p>
                                                                                <p className="text-xs font-bold text-black">{stat.value}</p>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    ) : msg.role === 'assistant' && msg.type === 'project_detail' ? (
                                                        <div className="space-y-8 text-left">
                                                            <div className="flex flex-col gap-1 pb-4 border-b border-gray-100">
                                                                <div className="flex items-center gap-3">
                                                                    <h2 className="text-xl font-black text-black">{msg.data.title}</h2>
                                                                    <span className="px-2 py-0.5 bg-black text-[8px] font-black text-white rounded  tracking-tighter">Verified</span>
                                                                </div>
                                                                <p className="text-[10px] text-gray-400 font-bold  tracking-widest">{msg.data.registration}</p>
                                                            </div>

                                                            <p className="text-sm text-gray-700 leading-relaxed font-medium mt-4">{msg.content}</p>

                                                            <div className="space-y-10">
                                                                {msg.data.sections.map((section: any, sIdx: number) => (
                                                                    <div key={sIdx} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${sIdx * 100}ms` }}>
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="h-4 w-1 bg-black rounded-full"></div>
                                                                            <h3 className="text-xs font-black text-black  tracking-widest">{section.title}</h3>
                                                                        </div>

                                                                        {section.content && (
                                                                            <div className="space-y-4 pl-4">
                                                                                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                                                                    {section.content}
                                                                                </p>
                                                                                {section.objective && (
                                                                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 italic">
                                                                                        <p className="text-[9px] font-black text-gray-400  tracking-widest mb-1">Primary Funding Objective</p>
                                                                                        <p className="text-sm text-black font-semibold">{section.objective}</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        {section.isGrid ? (
                                                                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 pl-4">
                                                                                {section.items.map((item: any, iIdx: number) => (
                                                                                    <div key={iIdx} className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 flex flex-col gap-1">
                                                                                        <p className="text-[9px] font-black text-gray-400  tracking-widest">{item.label}</p>
                                                                                        <p className="text-xs font-black text-black">{item.value}</p>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ) : section.items ? (
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
                                                                                {section.items.map((member: any, mIdx: number) => (
                                                                                    <div key={mIdx} className="p-4 bg-white border border-gray-100 rounded-2xl flex gap-4 shadow-sm">
                                                                                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center font-serif italic text-lg text-gray-400 shrink-0">
                                                                                            {member.name?.[0]}
                                                                                        </div>
                                                                                        <div className="space-y-1">
                                                                                            <p className="text-xs font-black text-black ">{member.name}</p>
                                                                                            <p className="text-[9px] font-bold text-blue-500  tracking-tighter">{member.role}</p>
                                                                                            <p className="text-[10px] text-gray-500 leading-tight">{member.bio}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ) : null}

                                                                        {section.subSections && (
                                                                            <div className="space-y-3 pl-4">
                                                                                {section.subSections.map((sub: any, subIdx: number) => (
                                                                                    <div key={subIdx} className={`p-4 rounded-xl border ${sub.isHighlight ? 'bg-black text-white border-black shadow-lg shadow-black/10' : 'bg-gray-50/50 border-gray-100'}`}>
                                                                                        <div className="flex items-center gap-2 mb-2">
                                                                                            {sub.isHighlight && <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>}
                                                                                            <p className={`text-[9px] font-black  tracking-widest ${sub.isHighlight ? 'text-gray-400' : 'text-gray-400'}`}>{sub.label}</p>
                                                                                        </div>
                                                                                        <p className={`text-sm leading-relaxed font-medium ${sub.isHighlight ? 'text-white/90' : 'text-gray-600'}`}>
                                                                                            {sub.text}
                                                                                        </p>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}{msg.isStreaming && <span className="inline-block w-1.5 h-4 bg-black/70 ml-0.5 animate-pulse" />}</div>
                                                            {msg.type === 'action' && !msg.actionCompleted && (
                                                                <div className="mt-4 flex gap-2">
                                                                    <button onClick={() => handleActionResponse(i, true)} className="px-4 py-2 bg-black text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-all">Confirm</button>
                                                                    <button onClick={() => handleActionResponse(i, false)} className="px-4 py-2 bg-gray-100 text-black text-xs font-bold rounded-lg hover:bg-gray-200 transition-all">Reject</button>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                    <p className={`text-[10px] mt-4 opacity-40 ${msg.role === 'user' ? 'text-white/70' : 'text-gray-500'}`}>{msg.timestamp}</p>
                                                </div>
                                            </div>

                                            {msg.role === 'assistant' && msg.type === 'project_detail' && (
                                                <div className="flex flex-wrap gap-2 px-1 animate-in fade-in slide-in-from-top-2 duration-500 delay-300">
                                                    {[
                                                        { label: 'Deep Analysis of Project Background', query: 'Can you provide a deeper analysis of the project background and its market positioning?' },
                                                        { label: 'Profitability & Yield Expectation', query: 'What are the specific profitability metrics and the detailed yield expectation for this project?' },
                                                        { label: 'Security & Guarantees', query: 'How does Loka ensure the security of this investment and what specific guarantees are in place?' }
                                                    ].map((action, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setInputText(action.query)}
                                                            className="px-4 py-2.5 bg-white hover:bg-black hover:text-white border border-gray-100 hover:border-black rounded-xl text-xs font-bold text-gray-600 transition-all duration-300 shadow-sm"
                                                        >
                                                            {action.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>



                    {messages.length > 0 && (
                        <div className="px-3 sm:px-12 pb-4 sm:pb-8 pt-0 flex flex-col items-center relative z-50 mt-auto bg-gradient-to-t from-[#fafafa] via-[#fafafa] to-transparent shrink-0">
                            <div className={`bg-white border rounded-2xl p-2 sm:p-3 w-full max-w-4xl flex flex-col shadow-2xl transition-all duration-500 group/bottominput ${activeForm ? 'border-green-400/60 shadow-[0_0_30px_-5px_rgba(74,222,128,0.2)] scale-[1.01]' : 'border-gray-200 shadow-black/5 hover:border-green-200 focus-within:border-green-400/50 focus-within:scale-[1.005] focus-within:shadow-[0_0_30px_-5px_rgba(74,222,128,0.15)]'}`}>
                                {activeForm ? (
                                    /* Inline sentence mode for bottom input */
                                    <div className="flex items-center w-full px-4 py-3 gap-2 flex-wrap">
                                        <span className="text-sm font-medium text-black whitespace-nowrap">I want to {activeForm}</span>
                                        <input
                                            type="number"
                                            value={formAmount}
                                            onChange={(e) => setFormAmount(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleInlineActionSubmit()}
                                            placeholder="0.00"
                                            autoFocus
                                            className="w-24 bg-transparent border-b-2 border-green-400 outline-none text-sm font-bold text-green-600 text-center py-0.5 placeholder:text-green-300/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <span className="text-sm font-medium text-black whitespace-nowrap">USDC of</span>
                                        <span className="text-sm font-bold text-black bg-gray-100 px-2 py-0.5 rounded-lg">{activeAgent}</span>
                                        <span className="text-sm font-medium text-black">.</span>
                                        <div className="flex items-center gap-2 ml-auto">
                                            <button
                                                onClick={() => { setActiveForm(null); setFormAmount(''); }}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-all"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                            <button
                                                onClick={handleInlineActionSubmit}
                                                className="w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center hover:bg-green-600 transition-all shadow-lg shadow-green-500/30"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center w-full relative">
                                            {isRecording && (
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1.5 z-20">
                                                    <span className="text-red-500 text-xs font-bold animate-pulse">Listening...</span>
                                                    <div className="flex items-center gap-1">
                                                        <span className="w-1 h-1 bg-red-400 rounded-full animate-ping" style={{ animationDuration: '1s', animationDelay: '0ms' }} />
                                                        <span className="w-1 h-1 bg-red-400 rounded-full animate-ping" style={{ animationDuration: '1.2s', animationDelay: '200ms' }} />
                                                        <span className="w-1 h-1 bg-red-400 rounded-full animate-ping" style={{ animationDuration: '0.8s', animationDelay: '400ms' }} />
                                                    </div>
                                                </div>
                                            )}
                                            <input
                                                type="text"
                                                value={isRecording ? "" : inputText}
                                                onChange={(e) => setInputText(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && !isRecording && handleSend()}
                                                placeholder={isRecording ? "" : "Ask your assistant..."}
                                                disabled={isRecording}
                                                className={`flex-1 bg-transparent border-none outline-none text-black text-sm px-6 py-3 placeholder:text-gray-300 font-medium whitespace-nowrap overflow-hidden text-ellipsis ${isRecording ? 'opacity-0' : ''} transition-opacity z-10`}
                                            />
                                            <button
                                                onClick={handleVoiceInput}
                                                className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all mr-2 shrink-0 relative z-20 ${isRecording
                                                    ? 'bg-red-50 text-red-500 ring-1 ring-red-500/50 shadow-sm scale-110'
                                                    : 'text-gray-400 hover:text-black hover:bg-gray-100'
                                                    }`}
                                                title={isRecording ? "Stop Recording" : "Voice Input"}
                                            >
                                                {isRecording && (
                                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                                                )}
                                                {isRecording && (
                                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                                                )}
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                            </button>
                                            <button
                                                onClick={handleSend}
                                                disabled={isRecording}
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-black/5 shrink-0 mr-1 z-20 ${isRecording
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed scale-95 opacity-50'
                                                    : 'bg-green-100 text-green-600 hover:bg-green-600 hover:text-white active:scale-90 group-focus-within/bottominput:bg-green-500 group-focus-within/bottominput:text-white'
                                                    }`}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                            </button>
                                        </div>

                                        {/* Quick Actions — consistent with home page */}
                                        <div className="flex gap-2 px-4 pb-1 pt-1 border-t border-gray-100/50 mt-1 items-center">
                                            {/* @Asset Button */}
                                            {(() => {
                                                const selectedAsset = selectedAssetName ? cashFlowAssets.find(a => a.title === selectedAssetName) : null;
                                                return selectedAsset ? (
                                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-300 rounded-full text-[10px] font-bold text-green-700">
                                                        <button
                                                            onClick={() => handleProjectClick(selectedAsset.title)}
                                                            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                                                        >
                                                            <img src={selectedAsset.image} alt={selectedAsset.title} className="w-4 h-4 rounded-full object-cover" />
                                                            <span className="max-w-[100px] truncate">@{selectedAsset.title}</span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setSelectedAssetName(null); }}
                                                            className="ml-0.5 text-green-400 hover:text-red-500 transition-colors flex items-center"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => window.dispatchEvent(new CustomEvent('loka-nav-market'))}
                                                        className="px-3 py-1 border rounded-full text-[10px] font-bold transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95 bg-gray-50/50 border-gray-100/80 text-gray-500 hover:border-black hover:text-black"
                                                    >
                                                        <span className="text-sm leading-none">@</span>
                                                        Asset
                                                    </button>
                                                );
                                            })()}

                                            {/* + Action Menu Button */}
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowActionMenu(!showActionMenu)}
                                                    className={`w-7 h-7 border rounded-full text-xs font-bold transition-all flex items-center justify-center hover:scale-105 active:scale-95 ${showActionMenu
                                                        ? 'bg-black border-black text-white'
                                                        : 'bg-gray-50/50 border-gray-100/80 text-gray-500 hover:border-black hover:text-black'
                                                        }`}
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                                </button>
                                                {showActionMenu && (
                                                    <div className="absolute bottom-full left-0 mb-3 w-52 bg-white border border-gray-100 rounded-2xl shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)] p-2 z-[100] animate-fadeIn">
                                                        <div className="absolute bottom-[-6px] left-3 w-3 h-3 bg-white border-r border-b border-gray-100 rotate-45" />
                                                        {!selectedAssetName && (
                                                            <p className="text-[9px] text-amber-600 font-bold px-3 py-1.5 bg-amber-50 rounded-xl mb-1 flex items-center gap-1.5">
                                                                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" /></svg>
                                                                Select an asset first
                                                            </p>
                                                        )}
                                                        <button
                                                            onClick={() => { if (selectedAssetName) { setActiveForm('buy'); setFormAmount(''); setShowActionMenu(false); } }}
                                                            disabled={!selectedAssetName}
                                                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${selectedAssetName ? 'text-black hover:bg-green-50 cursor-pointer' : 'text-gray-300 cursor-not-allowed'
                                                                }`}
                                                        >
                                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${selectedAssetName ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                                <svg className={`w-3 h-3 ${selectedAssetName ? 'text-green-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                                            </div>
                                                            Buy Asset
                                                        </button>
                                                        <button
                                                            onClick={() => { if (selectedAssetName) { setActiveForm('sell'); setFormAmount(''); setShowActionMenu(false); } }}
                                                            disabled={!selectedAssetName}
                                                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${selectedAssetName ? 'text-black hover:bg-red-50 cursor-pointer' : 'text-gray-300 cursor-not-allowed'
                                                                }`}
                                                        >
                                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${selectedAssetName ? 'bg-red-100' : 'bg-gray-100'}`}>
                                                                <svg className={`w-3 h-3 ${selectedAssetName ? 'text-red-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>
                                                            </div>
                                                            Sell Asset
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Chat;
