
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';

const Chat: React.FC = () => {
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [chatHistory, setChatHistory] = useState<{ id: number, title: string }[]>([]);
    const [editingChatId, setEditingChatId] = useState<number | null>(null);
    const [editChatTitle, setEditChatTitle] = useState('');
    const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);
    const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
    const [sidebarTab, setSidebarTab] = useState<'recommend' | 'portfolio'>('recommend');
    const [activeForm, setActiveForm] = useState<'buy' | 'sell' | 'deposit' | 'withdraw' | null>(null);
    const [formAmount, setFormAmount] = useState('');
    const [formAsset, setFormAsset] = useState('AIUSD');
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'revolut' | 'bank_transfer'>('card');
    const [fiatProvider, setFiatProvider] = useState<'swapped' | 'paybis' | 'alchemypay' | 'banxa'>('swapped');
    const [showMethodPicker, setShowMethodPicker] = useState(false);
    const [showProviderPicker, setShowProviderPicker] = useState(false);
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
    }, []);

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

    const handleSend = () => {
        if (!inputText.trim()) return;

        const userMsg = { role: 'user', content: inputText, timestamp: new Date().toLocaleTimeString() };
        setMessages(prev => [...prev, userMsg]);

        // Simulate AI behavior
        setTimeout(() => {
            const aiMsg = {
                role: 'assistant',
                content: `I've prepared a transaction for you: Swap $10 USDT for AIUSD on Solana. Would you like to proceed?`,
                type: 'action',
                actionCompleted: false,
                timestamp: new Date().toLocaleTimeString()
            };
            setMessages(prev => [...prev, aiMsg]);
        }, 1000);

        setInputText('');
    };

    const handleActionSubmit = () => {
        if (!formAmount) return;

        let actionStr = '';
        if (activeForm === 'buy') actionStr = 'Buy';
        if (activeForm === 'sell') actionStr = 'Sell';

        const userMsgText = `I want to ${actionStr.toLowerCase()} ${formAmount} USDC of ${formAsset}.`;
        const userMsg = { role: 'user', content: userMsgText, timestamp: new Date().toLocaleTimeString() };
        setMessages(prev => [...prev, userMsg]);
        setActiveForm(null);
        setFormAmount('');

        setTimeout(() => {
            const aiMsg = {
                role: 'assistant',
                content: `I've prepared the intentional transaction for you: ${actionStr} ${formAmount} USDC of ${formAsset}. Please confirm.`,
                type: 'action',
                actionCompleted: false,
                timestamp: new Date().toLocaleTimeString()
            };
            setMessages(prev => [...prev, aiMsg]);
        }, 1000);
    };

    const handleModalSubmit = () => {
        if (!formAmount) return;
        setFormAmount('');
        setShowMethodPicker(false);
        setShowProviderPicker(false);
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

    return (
        <div className="flex flex-col h-[calc(100vh-81px)] bg-[#fafafa] text-black overflow-hidden font-sans">
            <div className="flex flex-1 overflow-hidden relative">
                {/* Left Sidebar - Chat History */}
                <aside
                    className={`border-r border-gray-200 flex flex-col pt-6 bg-white transition-all duration-300 ease-in-out relative ${leftSidebarCollapsed ? 'w-0 opacity-0 -translate-x-full overflow-hidden' : 'w-72 opacity-100 translate-x-0'
                        }`}
                >
                    <div className="px-6 mb-6 min-w-[18rem]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-bold text-gray-400  tracking-widest">Chat History</h2>
                        </div>
                        <button
                            onClick={() => {
                                if (messages.length > 0) {
                                    const title = messages.find(m => m.role === 'user')?.content || 'New Conversation';
                                    setChatHistory(prev => [{ id: Date.now(), title }, ...prev]);
                                }
                                setMessages([]);
                            }}
                            className="w-full py-3 px-4 rounded-xl border border-black/10 text-black font-bold text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                        >
                            <Icons.Plus />
                            New chat
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 flex flex-col items-center min-w-[18rem]">
                        {messages.length === 0 && chatHistory.length === 0 ? (
                            <div className="opacity-40 h-full flex flex-col items-center justify-center">
                                <p className="text-xs font-medium text-gray-500">No conversations yet</p>
                            </div>
                        ) : (
                            <div className="w-full space-y-2 pb-6">
                                {messages.length > 0 && (
                                    <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-xl text-sm font-bold text-black border border-gray-200 truncate">
                                        {messages.find(m => m.role === 'user')?.content || 'New Conversation'}
                                    </button>
                                )}
                                {chatHistory.map(chat => (
                                    <div key={chat.id} className="relative group flex items-center w-full bg-white hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-100 transition-all">
                                        {editingChatId === chat.id ? (
                                            <input
                                                value={editChatTitle}
                                                onChange={e => setEditChatTitle(e.target.value)}
                                                onBlur={() => {
                                                    setChatHistory(prev => prev.map(c => c.id === chat.id ? { ...c, title: editChatTitle || c.title } : c));
                                                    setEditingChatId(null);
                                                }}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        setChatHistory(prev => prev.map(c => c.id === chat.id ? { ...c, title: editChatTitle || c.title } : c));
                                                        setEditingChatId(null);
                                                    }
                                                }}
                                                autoFocus
                                                className="w-full bg-transparent px-4 py-3 text-sm font-bold text-black outline-none"
                                            />
                                        ) : (
                                            <>
                                                <button className="flex-1 text-left px-4 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 truncate">
                                                    {chat.title}
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setActiveDropdownId(activeDropdownId === chat.id ? null : chat.id); }}
                                                    className="opacity-0 group-hover:opacity-100 px-3 py-3 text-gray-400 hover:text-black transition-all flex items-center justify-center"
                                                >
                                                    <div className="flex gap-[3px]">
                                                        <div className="w-1 h-1 bg-current rounded-full"></div>
                                                        <div className="w-1 h-1 bg-current rounded-full"></div>
                                                        <div className="w-1 h-1 bg-current rounded-full"></div>
                                                    </div>
                                                </button>

                                                {activeDropdownId === chat.id && (
                                                    <div
                                                        className="absolute right-2 top-10 w-32 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] ring-1 ring-black/5 py-1 z-50 text-xs font-bold"
                                                        onMouseLeave={() => setActiveDropdownId(null)}
                                                    >
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingChatId(chat.id);
                                                                setEditChatTitle(chat.title);
                                                                setActiveDropdownId(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-black"
                                                        >
                                                            Rename
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setChatHistory(prev => prev.filter(c => c.id !== chat.id));
                                                                setActiveDropdownId(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>

                {/* Collapse Toggle Button */}
                <button
                    onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
                    className={`absolute top-6 z-10 p-2 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-all transition-colors group ${leftSidebarCollapsed ? 'left-4' : 'left-[17.2rem]'
                        }`}
                >
                    <svg
                        className={`w-3 h-3 text-gray-400 group-hover:text-black transition-transform duration-300 ${leftSidebarCollapsed ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Main Chat Area */}
                <main className="flex-1 flex flex-col relative bg-[#f4f4f4]" style={{ backgroundImage: 'radial-gradient(#e5e5e5 1px, transparent 1px)', backgroundSize: '12px 12px' }}>
                    <div className="flex-1 overflow-y-auto">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center px-12 py-12">
                                <div className="relative w-full max-w-2xl mt-4 px-2 md:px-0">
                                    {/* Outer Neon Green Dot Matrix Border */}
                                    <div className="absolute inset-[-0.75rem] md:inset-[-1.25rem] rounded-[2rem] md:rounded-[2.5rem] bg-[#c3ff00] overflow-hidden" style={{ boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)' }}>
                                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.4) 1.5px, transparent 1.5px)', backgroundSize: '8px 8px', backgroundPosition: '0 0' }}></div>
                                    </div>

                                    {/* Inner Card Container */}
                                    <div className="relative bg-gradient-to-b from-white to-[#f4f8f0] rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 border border-black/10 shadow-[0_10px_40px_rgba(0,0,0,0.1)]">
                                        <div className="flex flex-col items-center justify-center mb-6 md:mb-8">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-6 h-6 rounded bg-black text-[#c3ff00] flex items-center justify-center shadow-sm relative overflow-hidden group">
                                                    <span className="text-[12px] font-black leading-none font-sans relative z-10 scale-x-125">L</span>
                                                </div>
                                                <span className="text-xs font-bold text-gray-800 tracking-wide font-sans">Loka Protocol</span>
                                            </div>
                                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-black mt-2">Intelligent Yield Engine</h1>
                                        </div>

                                        <div className="space-y-6 mb-8 mt-2">
                                            <p className="text-[15px] text-gray-600 leading-tight text-center px-4 font-medium">
                                                Earn on-chain yields easily, safely, and stably.
                                            </p>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-stretch pt-2 px-0 md:px-4">
                                                <div
                                                    onClick={() => handleAssetClick('AIUSD')}
                                                    className="flex flex-col relative p-5 bg-gray-50/50 rounded-xl group hover:bg-white transition-all cursor-pointer"
                                                >
                                                    {/* Dotted border wrapper */}
                                                    <div className="absolute inset-0 border-[1.5px] border-dotted border-gray-400/80 rounded-xl group-hover:border-black pointer-events-none transition-colors"></div>
                                                    <h3 className="text-[13px] font-black text-black mb-2 select-none">AIUSD Assets</h3>
                                                    <p className="text-[11px] text-gray-500 leading-relaxed font-medium flex-1 select-none pr-2">Institutional stablecoin solutions, under-collateralized chain architecture.</p>
                                                </div>

                                                <div
                                                    onClick={() => handleAssetClick('Cash Flow')}
                                                    className="flex flex-col relative p-5 bg-gray-50/50 rounded-xl group hover:bg-white transition-all cursor-pointer"
                                                >
                                                    {/* Dotted border wrapper */}
                                                    <div className="absolute inset-0 border-[1.5px] border-dotted border-gray-400/80 rounded-xl group-hover:border-black pointer-events-none transition-colors"></div>
                                                    <h3 className="text-[13px] font-black text-black mb-2 select-none">Cash Flow Assets</h3>
                                                    <p className="text-[11px] text-gray-500 leading-relaxed font-medium flex-1 select-none pr-2">Securitized real-world AI investments, for growth and achievements.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 mt-4">
                                            <ul className="grid grid-cols-2 gap-x-6 gap-y-4 px-4 md:px-8">
                                                <li className="text-[13px] text-gray-700 flex items-center gap-3 font-medium">
                                                    <div className="w-[5px] h-[5px] bg-black rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.1)]"></div> AI-driven trading
                                                </li>
                                                <li className="text-[13px] text-gray-700 flex items-center gap-3 font-medium">
                                                    <div className="w-[5px] h-[5px] bg-black rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.1)]"></div> Optimized routing
                                                </li>
                                                <li className="text-[13px] text-gray-700 flex items-center gap-3 font-medium">
                                                    <div className="w-[5px] h-[5px] bg-black rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.1)]"></div> Over-collateralized
                                                </li>
                                                <li className="text-[13px] text-gray-700 flex items-center gap-3 font-medium">
                                                    <div className="w-[5px] h-[5px] bg-black rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.1)]"></div> Instant liquidity
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3 mt-8 justify-center animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    {[
                                        "How do I earn yields with AIUSD?",
                                        "Tell me about Cash Flow assets",
                                        "How is the protocol collateralized?"
                                    ].map((q, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setInputText(q)}
                                            className="px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-[10px] font-bold text-gray-500 hover:border-black hover:text-black hover:shadow-md transition-all whitespace-nowrap"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="p-12 space-y-8 max-w-4xl mx-auto">
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
                                                        <p className="text-sm leading-relaxed">{msg.content}</p>
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
                        )}
                    </div>

                    {/* Layer Dimming Backdrop for Form Focus */}
                    {activeForm && (
                        <div
                            className="absolute inset-0 z-40 bg-black/5 backdrop-blur-[3px] animate-in fade-in transition-all duration-500 rounded-lg"
                            onClick={() => setActiveForm(null)}
                        />
                    )}

                    {/* Input Area */}
                    <div className="px-12 pb-12 pt-0 flex flex-col items-center relative z-50">
                        {activeForm && (
                            <div className="bg-white border-0 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] ring-1 ring-black/5 rounded-[2rem] p-6 mb-6 w-full max-w-2xl text-left animate-in zoom-in-[0.98] fade-in slide-in-from-bottom-4 duration-300">
                                <div className="flex justify-between items-center mb-5 px-1">
                                    <h4 className="text-sm font-bold text-black tracking-widest">{
                                        activeForm === 'buy' ? 'Buy Asset' : 'Sell Asset'
                                    }</h4>
                                    <button onClick={() => setActiveForm(null)} className="text-gray-400 hover:text-black bg-gray-50 hover:bg-gray-100 transition-colors p-1.5 rounded-full">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                                {(activeForm === 'buy' || activeForm === 'sell') && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2">
                                            {[
                                                { id: 'AIUSD', label: 'AIUSD Treasury Stablecoin', apy: '12.4%', tag: 'Stable', balance: '1,250.00', profit: '+12.50' },
                                                { id: 'ComputeDAO - GPU Expansion', label: 'ComputeDAO - GPU Expansion', apy: '15.5%', tag: 'Yield', balance: '5,000.00', profit: '+387.50' },
                                                { id: 'Shopify Merchant Cluster X', label: 'Shopify Merchant Cluster X', apy: '8.9%', tag: 'Yield', balance: '2,500.00', profit: '+111.25' },
                                                { id: 'Vercel Enterprise Flow', label: 'Vercel Enterprise Flow', apy: '10.2%', tag: 'Yield', balance: '3,000.00', profit: '+153.00' },
                                                { id: 'Stripe SaaS Revenue Pool', label: 'Stripe SaaS Revenue Pool', apy: '11.8%', tag: 'Yield', balance: '0.00', profit: '0.00' },
                                                { id: 'AWS Cloud Infrastructure', label: 'AWS Cloud Infrastructure', apy: '9.5%', tag: 'Yield', balance: '0.00', profit: '0.00' },
                                            ].map(a => (
                                                <div
                                                    key={a.id}
                                                    onClick={() => setFormAsset(a.id)}
                                                    className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-start ${formAsset === a.id ? 'border-black bg-white shadow-md ring-1 ring-black/5' : 'border-gray-100 bg-gray-50 hover:border-black/30 text-black'}`}
                                                >
                                                    <div className="flex-1 min-w-0 pr-3">
                                                        <p className="text-[12px] font-bold mb-1 text-black truncate">{a.label}</p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[11px] font-black text-green-500">{a.apy}</span>
                                                            <span className="text-[9px] font-bold  text-gray-500 bg-gray-200/50 px-1.5 py-0.5 rounded-md">{a.tag}</span>
                                                        </div>
                                                        {activeForm === 'sell' && (
                                                            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-200/50">
                                                                <span className="text-[10px] text-gray-400">Bal: <span className="font-semibold text-gray-700">${a.balance}</span></span>
                                                                <span className="text-[10px] text-gray-400">Pnl: <span className="font-bold text-green-500">{a.profit}</span></span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleProjectClick(a.id);
                                                            setActiveForm(null);
                                                        }}
                                                        className={`shrink-0 text-[10px]  font-bold px-3 py-1.5 rounded-lg border transition-all mt-0.5 ${formAsset === a.id ? 'bg-black text-white border-black hover:bg-gray-800' : 'bg-white border-gray-200 text-gray-600 hover:border-black hover:text-black'}`}
                                                    >
                                                        Detail
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {activeForm === 'sell' && (
                                            <div className="flex gap-2 justify-start mb-2">
                                                {['25%', '50%', '75%', '100%'].map((pct) => (
                                                    <button
                                                        key={pct}
                                                        onClick={() => {
                                                            const rawBal = {
                                                                'AIUSD': '1250',
                                                                'ComputeDAO - GPU Expansion': '5000',
                                                                'Shopify Merchant Cluster X': '2500',
                                                                'Vercel Enterprise Flow': '3000'
                                                            }[formAsset || ''] || '0';
                                                            const bal = parseFloat(rawBal);
                                                            setFormAmount((bal * parseInt(pct) / 100).toFixed(2).replace(/\.00$/, ''));
                                                        }}
                                                        className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:border-black hover:text-black transition-all"
                                                    >
                                                        {pct}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex gap-3 items-center">
                                            <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 flex items-center focus-within:border-black transition-colors">
                                                <input
                                                    type="number"
                                                    placeholder="Enter exact USDC amount"
                                                    value={formAmount}
                                                    onChange={(e) => setFormAmount(e.target.value)}
                                                    className="bg-transparent border-none outline-none font-medium text-sm w-full"
                                                />
                                                <span className="text-xs font-bold text-gray-400 ml-2">USDC</span>
                                            </div>
                                            <button
                                                onClick={handleActionSubmit}
                                                className="px-6 py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all  tracking-widest shrink-0"
                                            >
                                                Submit
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {!activeForm && (
                            <div className="flex flex-wrap gap-3 mb-4 justify-start w-full max-w-full animate-in fade-in slide-in-from-bottom-2">
                                {[
                                    { label: 'Buy Asset', id: 'buy' },
                                    { label: 'Sell Asset', id: 'sell' },
                                ].map((btn) => (
                                    <button
                                        key={btn.id}
                                        onClick={() => {
                                            setActiveForm(btn.id as any);
                                            setFormAsset('AIUSD');
                                        }}
                                        className="px-5 py-2 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-600 hover:border-black hover:text-black hover:shadow-md transition-all shadow-sm"
                                    >
                                        {btn.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="bg-white border border-gray-200 rounded-[2.5rem] p-3 w-full flex items-center shadow-2xl shadow-black/5 hover:border-black/10 transition-all">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask anything about Loka Protocol..."
                                className="flex-1 bg-transparent border-none outline-none text-black text-sm px-6 py-2 placeholder:text-gray-300 font-medium"
                            />
                            <button
                                onClick={handleSend}
                                className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 hover:scale-105 active:scale-95 transition-all shadow-lg shrink-0 mr-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                            </button>
                        </div>
                    </div>
                </main>

                {/* Right Sidebar - Wallet */}
                <aside className="w-80 border-l border-gray-100 flex flex-col bg-white overflow-hidden">
                    {/* Sidebar Tabs - Segmented Control UI */}
                    <div className="p-4 border-b border-gray-100 shrink-0">
                        <div className="bg-gray-100/80 p-1 rounded-2xl flex gap-1">
                            <button
                                onClick={() => setSidebarTab('recommend')}
                                className={`flex-1 py-2 text-[10px] font-black  tracking-widest transition-all rounded-xl ${sidebarTab === 'recommend' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Recommend
                            </button>
                            <button
                                onClick={() => setSidebarTab('portfolio')}
                                className={`flex-1 py-2 text-[10px] font-black  tracking-widest transition-all rounded-xl ${sidebarTab === 'portfolio' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Portfolio
                            </button>
                        </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 flex flex-col min-h-0">
                            {sidebarTab === 'recommend' ? (
                                <>
                                    {/* AI USD Assets Section */}
                                    <div className="mb-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="space-y-3">
                                            <div
                                                onClick={() => handleAssetClick('AIUSD')}
                                                className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:border-black/20 hover:shadow-md transition-all cursor-pointer group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center font-bold text-[10px] text-white group-hover:scale-110 transition-transform">AI</div>
                                                    <div>
                                                        <p className="text-xs font-bold text-black">AIUSD</p>
                                                        <p className="text-[10px] text-gray-400">0.00</p>
                                                    </div>
                                                </div>
                                                <p className="text-xs font-bold text-black">$0.00</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cash Flow Section */}
                                    <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-right-4 duration-500 delay-100">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-[10px] font-bold text-gray-400  tracking-[0.2em]">Cash Flow</h3>
                                        </div>
                                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 -mr-2">
                                            {[
                                                { title: 'ComputeDAO - GPU Expansion', target: '$500k', apy: '15.5%', term: '60d', pledged: '$375,420', progress: 75, backers: 124 },
                                                { title: 'Shopify Merchant Cluster X', target: '$200k', apy: '8.9%', term: '30d', pledged: '$185,000', progress: 93, backers: 89 },
                                                { title: 'Vercel Enterprise Flow', target: '$1000k', apy: '10.2%', term: '90d', pledged: '$420k', progress: 42, backers: 56 },
                                            ].map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => handleProjectClick(item.title)}
                                                    className="p-2.5 bg-white rounded-xl border border-gray-100 hover:border-black/20 hover:shadow-md transition-all shadow-sm cursor-pointer group"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-[11px] font-bold text-black truncate pr-2 group-hover:text-black transition-colors">{item.title}</p>
                                                    </div>

                                                    <div className="flex items-center gap-3 mb-2 text-[9px] text-gray-500 font-medium">
                                                        <span>Target <span className="text-black font-bold">{item.target}</span></span>
                                                        <span>APY <span className="text-green-600 font-bold">{item.apy}</span></span>
                                                        <span>{item.term}</span>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden relative">
                                                            <div
                                                                className="h-full rounded-full bg-[#c3ff00]"
                                                                style={{
                                                                    width: `${item.progress}%`,
                                                                    backgroundImage: 'radial-gradient(rgba(0,0,0,0.6) 1.5px, transparent 1.5px)',
                                                                    backgroundSize: '5px 5px'
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <div className="flex justify-between items-center text-[8px] font-bold text-gray-400  tracking-tighter">
                                                            <span>{item.pledged} / {item.progress}%</span>
                                                            <span>{item.backers} Backers</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                    {/* Portfolio Summary */}
                                    <div className="p-6 bg-white rounded-[2rem] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                                        <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-1.5 uppercase">Total Portfolio Value</p>
                                        <h2 className="text-[32px] font-black text-black mb-6 tracking-tight leading-none">$15,240.50</h2>

                                        <div className="flex items-end gap-6">
                                            <div className="flex flex-col gap-1.5">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total Profit</p>
                                                <p className="text-[13px] font-black text-[#85b000] bg-[#c3ff00]/15 w-fit px-2.5 py-1 rounded-md">+$166.30</p>
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Profit Rate</p>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-[13px] font-black text-[#85b000] bg-[#c3ff00]/15 px-2.5 py-1 rounded-md">+1.09%</p>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setActiveForm('deposit')}
                                                            className="px-4 py-[5px] text-[11px] font-bold bg-white text-black border border-gray-200 rounded-full shadow-sm hover:border-black hover:shadow-md transition-all active:scale-95"
                                                        >
                                                            Deposit
                                                        </button>
                                                        <button
                                                            onClick={() => setActiveForm('withdraw')}
                                                            className="px-4 py-[5px] text-[11px] font-bold bg-white text-black border border-gray-200 rounded-full shadow-sm hover:border-black hover:shadow-md transition-all active:scale-95"
                                                        >
                                                            Withdraw
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Holdings List */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <h3 className="text-[10px] font-black text-gray-400  tracking-widest">Current Holdings</h3>
                                            <Icons.TrendingUp className="w-3 h-3 text-gray-400" />
                                        </div>
                                        <div className="space-y-3">
                                            {[
                                                { name: 'AIUSD Assets', balance: '$10,240.50', profit: '+$124.20', rate: '+1.21%', icon: 'AI' },
                                                { name: 'ComputeDAO - GPU Expansion', balance: '$5,000.00', profit: '+$42.10', rate: '+0.84%', icon: <Icons.TrendingUp className="w-3 h-3" />, status: 'Funded' }
                                            ].map((holding, idx) => (
                                                <div key={idx} className="p-4 bg-white border border-gray-100 rounded-2xl hover:border-black/10 hover:shadow-lg transition-all group">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-[9px] font-black group-hover:scale-110 transition-transform shrink-0">
                                                                {holding.icon}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <p className="text-xs font-bold text-black truncate max-w-[120px]">{holding.name}</p>
                                                                {holding.status && <p className="text-[8px] font-bold text-green-600 bg-green-50 px-1 py-0.5 rounded-md w-fit mt-0.5">{holding.status}</p>}
                                                            </div>
                                                        </div>
                                                        <p className="text-xs font-black text-black">{holding.balance}</p>
                                                    </div>
                                                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-50">
                                                        <p className="text-[9px] font-black text-green-500">{holding.profit}</p>
                                                        <p className="text-[9px] font-bold text-green-500/70">{holding.rate}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
            </div>

        </div>
    );
};

export default Chat;
