
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';

const Chat: React.FC = () => {
    // Add custom style to hide scrollbar
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            .scrollbar-hide::-webkit-scrollbar {
                display: none;
            }
            .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [chatHistory, setChatHistory] = useState<{ id: number, title: string }[]>([]);
    const [editingChatId, setEditingChatId] = useState<number | null>(null);
    const [editChatTitle, setEditChatTitle] = useState('');
    const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);
    const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
    const [activeForm, setActiveForm] = useState<'buy' | 'sell' | 'deposit' | 'withdraw' | 'copy_trade' | null>(null);
    const [formAmount, setFormAmount] = useState('');
    const [formAsset, setFormAsset] = useState('AIUSD');
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'revolut' | 'bank_transfer'>('card');
    const [fiatProvider, setFiatProvider] = useState<'swapped' | 'paybis' | 'alchemypay' | 'banxa'>('swapped');
    const [showMethodPicker, setShowMethodPicker] = useState(false);
    const [showProviderPicker, setShowProviderPicker] = useState(false);
    const [currentSquadName, setCurrentSquadName] = useState<string | null>(null);
    const [expandedHandlers, setExpandedHandlers] = useState<Set<number>>(new Set([0])); // Default open first one
    const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
    const [copyTarget, setCopyTarget] = useState('');
    const [copyTag, setCopyTag] = useState('');
    const [copyValue, setCopyValue] = useState('100'); // % or fixed
    const [copyValueMode, setCopyValueMode] = useState<'percent' | 'fixed'>('percent');
    const [copyTp, setCopyTp] = useState('');
    const [copySl, setCopySl] = useState('');
    const [copySlippage, setCopySlippage] = useState('30');
    const [copySpendLimit, setCopySpendLimit] = useState('5000');
    const [copyBuyAtMin, setCopyBuyAtMin] = useState(true);
    const [copySyncSell, setCopySyncSell] = useState(true);

    useEffect(() => {
        if (selectedEntity) {
            setCopyTarget(selectedEntity);
            setCopyTag(`# ${selectedEntity.toLowerCase().replace(/\s+/g, '_')}`);
        }
    }, [selectedEntity]);

    const isCopyingEntity = (name: string) => {
        const copyingNames = ['Theo4', 'Fredi9999']; // This would normally come from actual state
        return copyingNames.includes(name);
    };

    const toggleHandler = (idx: number) => {
        setExpandedHandlers(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    useEffect(() => {
        const pendingProject = sessionStorage.getItem('pending_chat_project');
        if (pendingProject) {
            sessionStorage.removeItem('pending_chat_project');
            handleProjectClick(pendingProject);
        }

        const pendingGroup = sessionStorage.getItem('pending_chat_group');
        if (pendingGroup) {
            sessionStorage.removeItem('pending_chat_group');
            setCurrentSquadName(pendingGroup);
            const userMsg = { role: 'user', content: `View squad details: ${pendingGroup}`, timestamp: new Date().toLocaleTimeString() };
            setMessages(prev => [...prev, userMsg]);

            setTimeout(() => {
                const aiMsg = {
                    role: 'assistant',
                    content: `I've retrieved the operational details for **${pendingGroup}**. This squad is currently optimized for multi-chain liquidity provisioning. Would you like to review their latest performance metrics or join the squad?`,
                    timestamp: new Date().toLocaleTimeString()
                };
                setMessages(prev => [...prev, aiMsg]);
            }, 800);
        }
    }, []);

    const getSquadAgents = (name: string) => {
        const mockData: Record<string, any[]> = {
            'Yield Optimizer Alpha': [
                { id: 1, name: 'Alpha-1', role: 'Lead Strategist', status: 'Active', avatar: '🤖' },
                { id: 2, name: 'Fox-Trade', role: 'MEV Expert', status: 'Active', avatar: '🦊' },
                { id: 3, name: 'Crusty-Yield', role: 'Staking Manager', status: 'Active', avatar: '🦀' },
                { id: 4, name: 'Uni-Liquid', role: 'LP Provisioner', status: 'Syncing', avatar: '🦄' },
                { id: 5, name: 'King-Risk', role: 'Risk Management', status: 'Idle', avatar: '🦁' },
            ],
            'On-chain Arb Syndicate': [
                { id: 1, name: 'Volt-Arb', role: 'Execution Bot', status: 'Active', avatar: '⚡️' },
                { id: 2, name: 'Synth-1', role: 'Arbitrage Scout', status: 'Active', avatar: '🤖' },
                { id: 3, name: 'Glitch-Fix', role: 'Error Correction', status: 'Idle', avatar: '👾' },
            ],
            'RWA Asset Managers': [
                { id: 1, name: 'Building-Lead', role: 'Property Scout', status: 'Active', avatar: '🏢' },
                { id: 2, name: 'Bank-Agent-X', role: 'Forex Pipeline', status: 'Active', avatar: '🏦' },
                { id: 3, name: 'Legal-Bot', role: 'Compliance', status: 'Idle', avatar: '💼' },
            ],
        };
        return mockData[name] || [
            { id: 1, name: 'Core-Bot', role: 'Generalist', status: 'Active', avatar: '🤖' },
            { id: 2, name: 'Helper-Agent', role: 'Support', status: 'Active', avatar: '🤖' },
        ];
    };

    const handleProjectClick = (projectName: string) => {
        setSelectedEntity(projectName);
        const userMsg = { role: 'user', content: `Analyze: ${projectName}`, timestamp: new Date().toLocaleTimeString() };
        setMessages(prev => [...prev, userMsg]);

        setTimeout(() => {
            const isAgentSquad = projectName.includes('Squad') || projectName.includes('Scout') || projectName.includes('Tracker');
            const isHuman = ['Theo4', 'Fredi9999', 'kch123', 'Len9311238', 'zxgngl', 'RepTrump'].includes(projectName);

            let aiMsg: any;

            if (isAgentSquad || isHuman) {
                // Smart Money Analysis Logic
                aiMsg = {
                    role: 'assistant',
                    type: 'smart_money_analysis',
                    name: projectName,
                    category: isAgentSquad ? 'Agent Squad' : 'Smart Money (Human)',
                    content: isAgentSquad
                        ? `This squad comprises multiple AI agents specialized in cross-exchange arbitrage and sentiment-driven rapid execution. Their current objective is capturing volatility in the Prediction Markets with a focus on high-probability political outcomes.`
                        : `I've analyzed ${projectName}'s recent on-chain footprint. This address shows high conviction in political prediction markets and has a consistent track record of early alpha capture in DeFi and Sports betting.`,
                    stats: {
                        totalPnL: isHuman ? '+$10,577,473' : '+$1,240,500',
                        totalGains: isHuman ? '+$51,458,244' : '+$2,100,000',
                        totalLosses: isHuman ? '-$40,880,771' : '-$859,500',
                        winRate: isHuman ? '54.2%' : '78.5%',
                        totalValue: isHuman ? '$538,392' : '$150,000',
                        sharpe: isAgentSquad ? '3.2' : '2.4',
                        avgTrade: '$12,400',
                        currentPositions: [
                            { market: 'Lakers vs. Nuggets (2026-03-06)', value: '$232,064', weight: '39.0%' },
                            { market: 'Pistons vs. Spurs (2026-03-06)', value: '$150,000', weight: '25.2%' },
                            { market: 'Warriors vs. Rockets (2026-03-06)', value: '$95,703', weight: '16.1%' }
                        ],
                        marketPerformance: [
                            { market: 'Seattle vs. New England', profit: '+$1,425,935', type: 'win' },
                            { market: 'Villarreal CF vs. AFC Ajax', profit: '+$1,095,000', type: 'win' },
                            { market: 'Fed Rate Cut Nov', profit: '-$240,500', type: 'loss' }
                        ],
                        categoryPerformance: [
                            { category: 'Sports', profit: '+$10,726,166', color: 'bg-green-500', percentage: 85 },
                            { category: 'Politics', profit: '+$2,450,000', color: 'bg-blue-500', percentage: 65 },
                            { category: 'Crypto', profit: '+$1,200,000', color: 'bg-indigo-500', percentage: 40 }
                        ]
                    },
                    riskScore: isAgentSquad ? 'Low' : 'Medium-High'
                };
            } else {
                // Original Project Detail Logic
                const isShopify = projectName.includes('Shopify');
                aiMsg = {
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
                                    ? 'Dropstream facilitates liquidity for high-growth e-commerce merchants on the Shopify platform. This specific cluster consists of 12 verified sellers with a combined annual GMV exceeding $50M.'
                                    : 'ComputeDAO is a decentralized physical infrastructure network (DePIN). This batch targets NVIDIA H100 GPU clusters.',
                                objective: isShopify
                                    ? '"Inventory financing for seasonal peak demand."'
                                    : '"Purchasing 8 additional NVIDIA H100 GPUs."'
                            },
                            {
                                title: 'Entity Credit & Financial Health',
                                isGrid: true,
                                items: [
                                    { label: 'Total Raising', value: isShopify ? '$1.5M' : '$4.2M' },
                                    { label: 'Repayment Rate', value: '100% On-time' },
                                    { label: 'Loka Risk Score', value: 'AAA (Safe)' },
                                ]
                            }
                        ]
                    }
                };
            }
            aiMsg.timestamp = new Date().toLocaleTimeString();
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
                content: "I've analyzed your request. Based on current market conditions and Loka Protocol's optimization engine, I recommend using our cross-chain liquidity pool for the best price execution. How would you like to proceed?",
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
                content: `I've noted your intent to ${actionStr.toLowerCase()} ${formAmount} USDC of ${formAsset}. Our agents are now scanning multiple DEXs to find the most efficient path for your ${formAmount} USDC. I will notify you once the optimal trade route is secured.`,
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
                <aside className="w-80 border-r border-gray-100 flex flex-col bg-white overflow-hidden shrink-0">
                    <div className="p-4 border-b border-gray-100 shrink-0">
                        <div className="flex items-center gap-2 px-1">
                            <h2 className="text-[11px] font-black text-black tracking-widest uppercase">Smart Money</h2>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                        <div className="flex flex-col">
                            {/* Agent Squads List - Now on top */}
                            <div className="flex flex-col mb-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="space-y-2">
                                    {[
                                        { title: 'Alpha-Arb Squad', apy: '24.5%', profit: '+$5.4K', color: 'bg-black', agents: ['🤖', '📡', '🐋'], tags: ['Arbitrage', 'HFT'] },
                                        { title: 'Sentiment Scout', apy: '42.2%', profit: '+$12.1K', color: 'bg-black', agents: ['📡', '🧠', '🔍'], tags: ['Social', 'Rapid'] },
                                        { title: 'Whale Tracker', apy: '18.9%', profit: '+$3.4K', color: 'bg-black', agents: ['🐋', '🔍', '⚡️'], tags: ['On-chain', 'Whale'] },
                                    ].map((agent, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => handleProjectClick(agent.title)}
                                            className="flex flex-col gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-black/10 hover:shadow-sm transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="text-[12px] font-black text-black truncate pr-2 tracking-tight">{agent.title}</p>
                                                <p className="text-[11px] font-black text-green-600 shrink-0">{agent.profit}</p>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex -space-x-2 shrink-0">
                                                    {agent.agents.map((icon, i) => (
                                                        <div key={i} className={`w-6 h-6 rounded-lg border-2 border-white ${agent.color} flex items-center justify-center text-[10px] text-white shadow-sm ring-1 ring-black/5`}>
                                                            {icon}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-center gap-1 justify-end">
                                                        <div className="w-1 h-1 rounded-full bg-[#c3ff00]"></div>
                                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Est. APY</p>
                                                    </div>
                                                    <p className="text-[10px] font-black text-black leading-none">{agent.apy}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-1 mt-0.5">
                                                {agent.tags.map((tag, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-gray-100 text-[9px] font-bold text-gray-500 tracking-tight rounded border border-gray-100">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Human Smart Money List - Now below */}
                            <div className="space-y-2 animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
                                {[{ rank: 1, name: 'Theo4', pnl: '+$22.05M', winRate: '88.9%', color: 'bg-blue-600', tags: ['Polymarket', 'Whale'] },
                                { rank: 2, name: 'Fredi9999', pnl: '+$16.62M', winRate: '73.3%', color: 'bg-indigo-600', tags: ['Politics', 'Degen'] },
                                { rank: 3, name: 'kch123', pnl: '+$10.58M', winRate: '54.2%', color: 'bg-purple-600', tags: ['Sports', 'Alpha'] },
                                { rank: 4, name: 'Len9311238', pnl: '+$8.71M', winRate: '100%', color: 'bg-pink-600', tags: ['Consistent', 'Pro'] },
                                { rank: 5, name: 'zxgngl', pnl: '+$7.81M', winRate: '80.0%', color: 'bg-orange-600', tags: ['Macro', 'Yield'] },
                                { rank: 6, name: 'RepTrump', pnl: '+$7.53M', winRate: '100%', color: 'bg-red-600', tags: ['Political', 'Bet'] }
                                ].map((human, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleProjectClick(human.name)}
                                        className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-gray-100 hover:border-black/10 hover:shadow-sm transition-all cursor-pointer group"
                                    >
                                        <div className={`w-6 h-6 shrink-0 ${human.color} rounded-lg flex items-center justify-center font-black text-[9px] text-white shadow-sm`}>
                                            {human.rank}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1 mb-0.5">
                                                <p className="text-[11px] font-bold text-black truncate">{human.name}</p>
                                                <p className="text-[11px] font-black text-green-600">{human.pnl}</p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Win Rate</p>
                                                </div>
                                                <p className="text-[10px] font-black text-black">{human.winRate}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {human.tags.map((tag, i) => (
                                                    <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-[8px] font-bold text-gray-500 tracking-tight rounded border border-gray-100">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

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
                                    <div className="relative bg-gradient-to-b from-white to-[#f9fafb] rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 border border-black/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)]">
                                        <div className="flex flex-col items-center justify-center mb-6 md:mb-8">
                                            <div className="flex items-center gap-2.5 mb-4">
                                                <div className="w-7 h-7 rounded-lg bg-black text-[#c3ff00] flex items-center justify-center shadow-lg relative overflow-hidden group">
                                                    <span className="text-[12px] font-black leading-none font-sans relative z-10 scale-x-125">M</span>
                                                </div>
                                                <span className="text-[10px] font-black text-black tracking-[0.2em] uppercase">MoltCash Smart Hub</span>
                                            </div>
                                            <h1 className="text-2xl md:text-3xl font-black text-black tracking-tight text-center leading-tight max-w-md">
                                                Automate Your Wealth with <span className="text-green-600">Smart Money</span>
                                            </h1>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-lg shadow-sm">👤</div>
                                                    <div>
                                                        <h3 className="text-[12px] font-black text-black uppercase tracking-wide">Smart Money Follow</h3>
                                                        <p className="text-[9px] font-bold text-gray-400">Top Polymarket Addresses</p>
                                                    </div>
                                                </div>
                                                <p className="text-[12px] text-gray-600 leading-snug font-medium pl-11">
                                                    Mirror the trades of verified "Smart Money" addresses on Polymarket with sub-second execution.
                                                </p>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-lg shadow-sm">🤖</div>
                                                    <div>
                                                        <h3 className="text-[12px] font-black text-black uppercase tracking-wide">AI Agent Squads</h3>
                                                        <p className="text-[9px] font-bold text-gray-400">Self-Optimizing Portfolios</p>
                                                    </div>
                                                </div>
                                                <p className="text-[12px] text-gray-600 leading-snug font-medium pl-11">
                                                    Deploy autonomous agent squads that collaborate on arbitrage and sentiment analysis 24/7.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-[#c3ff00]/10 rounded-xl border border-[#c3ff00]/20 flex flex-col md:flex-row items-center gap-4 animate-pulse">
                                            <div className="flex-1 text-center md:text-left">
                                                <p className="text-[13px] font-black text-black mb-0.5 italic">Ready to start?</p>
                                                <p className="text-[10px] font-bold text-gray-600">Select any <span className="text-black font-black">Smart Money</span> or <span className="text-black font-black">Agent Squad</span> from the left sidebar.</p>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
                                                <div className="w-1.5 h-1.5 rounded-full bg-black/40"></div>
                                                <div className="w-1.5 h-1.5 rounded-full bg-black/10"></div>
                                            </div>
                                        </div>
                                    </div>
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
                                                ) : msg.role === 'assistant' && msg.type === 'smart_money_analysis' ? (
                                                    <div className="space-y-8 text-left">
                                                        {/* Header Profile */}
                                                        <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-white text-2xl shadow-xl ring-1 ring-white/10">
                                                                    {msg.category === 'Agent Squad' ? '🤖' : '👤'}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <h2 className="text-xl font-black text-black">{msg.name}</h2>
                                                                        <span className="px-2 py-0.5 bg-black text-[8px] font-black text-white rounded uppercase tracking-tighter">Rank #3</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">{msg.category}</p>
                                                                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                                        <span className="text-[10px] text-green-600 font-black uppercase tracking-widest flex items-center gap-1">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Active Syncing
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[10px] text-gray-400 font-black tracking-widest uppercase mb-1">Risk Profile</p>
                                                                <div className={`px-3 py-1 rounded-lg text-xs font-black inline-block ${msg.riskScore === 'Low' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                                                                    {msg.riskScore}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* PnL Highlights Card */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="p-6 bg-black rounded-2xl text-white shadow-xl relative overflow-hidden">
                                                                <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-4xl pointer-events-none">PnL</div>
                                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Overall PnL</p>
                                                                <h3 className="text-3xl font-black text-green-400 tracking-tight mb-4">{msg.stats.totalPnL}</h3>
                                                                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                                                                    <div>
                                                                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Gains</p>
                                                                        <p className="text-sm font-black text-green-400">{msg.stats.totalGains}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Losses</p>
                                                                        <p className="text-sm font-black text-red-400">{msg.stats.totalLosses}</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Portfolio Data</p>
                                                                <div className="space-y-4">
                                                                    <div className="flex justify-between items-end">
                                                                        <div>
                                                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Total Value</p>
                                                                            <p className="text-xl font-black text-black">{msg.stats.totalValue}</p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Win Rate</p>
                                                                            <p className="text-xl font-black text-green-600">{msg.stats.winRate}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <div className="flex justify-between text-[8px] font-black text-gray-400 uppercase">
                                                                            <span>Efficiency Score</span>
                                                                            <span>{msg.stats.sharpe} Sharpe</span>
                                                                        </div>
                                                                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                                            <div className="h-full bg-black rounded-full" style={{ width: '75%' }}></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Strategy Summary */}
                                                        <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm italic">
                                                            <p className="text-sm text-gray-600 leading-relaxed font-medium">"{msg.content}"</p>
                                                        </div>

                                                        {/* Lists Grid */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            {/* Current Positions */}
                                                            <div className="space-y-3">
                                                                <h3 className="text-[10px] font-black text-black uppercase tracking-widest px-1">Current Positions</h3>
                                                                <div className="space-y-2">
                                                                    {msg.stats.currentPositions.map((pos: any, idx: number) => (
                                                                        <div key={idx} className="p-3 bg-gray-50/50 rounded-xl border border-gray-100 flex items-center justify-between group hover:bg-white transition-all">
                                                                            <div className="min-w-0">
                                                                                <p className="text-[11px] font-bold text-black truncate">{pos.market}</p>
                                                                                <p className="text-[9px] text-gray-400 font-bold">{pos.weight} of Portfolio</p>
                                                                            </div>
                                                                            <p className="text-[11px] font-black text-black">{pos.value}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Market Performance */}
                                                            <div className="space-y-3">
                                                                <h3 className="text-[10px] font-black text-black uppercase tracking-widest px-1">Biggest Wins / Losses</h3>
                                                                <div className="space-y-2">
                                                                    {msg.stats.marketPerformance.map((perf: any, idx: number) => (
                                                                        <div key={idx} className="p-3 bg-gray-50/50 rounded-xl border border-gray-100 flex items-center justify-between group hover:bg-white transition-all">
                                                                            <p className="text-[11px] font-bold text-black truncate pr-4">{perf.market}</p>
                                                                            <p className={`text-[11px] font-black shrink-0 ${perf.type === 'win' ? 'text-green-600' : 'text-red-500'}`}>{perf.profit}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Category Performance Bars */}
                                                        <div className="space-y-4">
                                                            <h3 className="text-[10px] font-black text-black uppercase tracking-widest px-1">Category Performance</h3>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                {msg.stats.categoryPerformance.map((cat: any, idx: number) => (
                                                                    <div key={idx} className="space-y-2">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-[11px] font-bold text-black">{cat.category}</span>
                                                                            <span className="text-[10px] font-black text-green-600">{cat.profit}</span>
                                                                        </div>
                                                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                            <div className={`h-full ${cat.color} rounded-full transition-all duration-1000`} style={{ width: `${cat.percentage}%` }}></div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

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
                                                    <div className="space-y-4">
                                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                        {msg.type === 'action' && !msg.actionCompleted && (
                                                            <div className="mt-4 flex gap-2">
                                                                <button onClick={() => handleActionResponse(i, true)} className="px-4 py-2 bg-black text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-all uppercase tracking-widest">Confirm</button>
                                                                <button onClick={() => handleActionResponse(i, false)} className="px-4 py-2 bg-gray-100 text-black text-xs font-bold rounded-lg hover:bg-gray-200 transition-all uppercase tracking-widest">Reject</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <p className={`text-[10px] mt-4 opacity-40 ${msg.role === 'user' ? 'text-white/70' : 'text-gray-500'}`}>{msg.timestamp}</p>
                                            </div>
                                        </div>

                                        {(msg.role === 'assistant' && (msg.type === 'project_detail' || msg.type === 'smart_money_analysis')) && (
                                            <div className="flex flex-wrap gap-2 px-1 animate-in fade-in slide-in-from-top-2 duration-500 delay-300">
                                                {[
                                                    { label: 'Risk & Security Analysis', query: 'What are the specific risk factors and security measures?' },
                                                    { label: 'Strategy Deep Dive', query: 'Can you explain the detailed strategy and historical performance?' },
                                                    { label: 'Alternative Options', query: 'Are there any similar strategies with lower risk?' }
                                                ].map((action, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setInputText(action.query)}
                                                        className="px-4 py-2 bg-white hover:bg-black hover:text-white border border-gray-100 hover:border-black rounded-xl text-[10px] font-bold text-gray-500 transition-all duration-300 shadow-sm"
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
                                        activeForm === 'buy' ? 'Buy Asset' : activeForm === 'copy_trade' ? 'Copy Trade' : 'Sell Asset'
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

                                {activeForm === 'copy_trade' && (
                                    <div className="space-y-5">
                                        {/* Target Wallet - Read Only */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Target Wallet</label>
                                            <div className="p-3 bg-gray-50/50 border border-gray-100 rounded-xl flex items-center justify-between">
                                                <span className="text-xs font-bold text-black truncate">{copyTarget || 'N/A'}</span>
                                                <div className="px-2 py-0.5 bg-black/5 rounded text-[8px] font-black text-gray-400 uppercase tracking-tighter">Verified</div>
                                            </div>
                                        </div>

                                        {/* Copy Value Mode */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Copy {copyValueMode === 'percent' ? 'Percentage' : 'Amount'}</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div
                                                    onClick={() => setCopyValueMode('percent')}
                                                    className={`p-3 rounded-xl text-center text-xs font-black cursor-pointer transition-all ${copyValueMode === 'percent' ? 'bg-black text-white ring-1 ring-black shadow-lg' : 'bg-gray-50 border border-gray-100 text-gray-400 hover:border-black/20'}`}
                                                >
                                                    {copyValueMode === 'percent' ? `${copyValue}%` : '% Share'}
                                                </div>
                                                <div
                                                    onClick={() => setCopyValueMode('fixed')}
                                                    className={`p-3 rounded-xl text-center text-xs font-black cursor-pointer transition-all ${copyValueMode === 'fixed' ? 'bg-black text-white ring-1 ring-black shadow-lg' : 'bg-gray-50 border border-gray-100 text-gray-400 hover:border-black/20'}`}
                                                >
                                                    {copyValueMode === 'fixed' ? `$${copyValue}` : 'Fixed $'}
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 flex items-center focus-within:border-black transition-colors">
                                                <input
                                                    type="number"
                                                    value={copyValue}
                                                    onChange={(e) => setCopyValue(e.target.value)}
                                                    className="bg-transparent border-none outline-none font-bold text-xs w-full text-black"
                                                    placeholder={copyValueMode === 'percent' ? "Enter percentage (1-100)" : "Enter USD amount"}
                                                />
                                                <span className="text-[10px] font-black text-gray-400 uppercase ml-2">{copyValueMode === 'percent' ? '%' : 'USD'}</span>
                                            </div>
                                        </div>

                                        {/* Slippage + Spend Limit - Inline Row */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Max Slippage</label>
                                                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center focus-within:border-black transition-colors">
                                                    <input
                                                        type="number"
                                                        value={copySlippage}
                                                        onChange={(e) => setCopySlippage(e.target.value)}
                                                        className="bg-transparent border-none outline-none text-xs font-bold text-black w-full"
                                                    />
                                                    <span className="text-[10px] font-black text-gray-400 uppercase ml-2">%</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Spend Limit</label>
                                                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center focus-within:border-black transition-colors">
                                                    <input
                                                        type="number"
                                                        value={copySpendLimit}
                                                        onChange={(e) => setCopySpendLimit(e.target.value)}
                                                        className="bg-transparent border-none outline-none text-xs font-bold text-black w-full"
                                                    />
                                                    <span className="text-[10px] font-black text-gray-400 uppercase ml-2">USDC</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Safety Toggles */}
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-bold text-gray-600">Buy at Min if below limit</span>
                                                <button
                                                    onClick={() => setCopyBuyAtMin(!copyBuyAtMin)}
                                                    className={`w-8 h-4 rounded-full p-0.5 transition-all flex ${copyBuyAtMin ? 'bg-black justify-end' : 'bg-gray-200 justify-start'}`}
                                                >
                                                    <div className={`w-3 h-3 rounded-full ${copyBuyAtMin ? 'bg-[#c3ff00]' : 'bg-white'}`}></div>
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-bold text-gray-600">Sync Sell Orders</span>
                                                <button
                                                    onClick={() => setCopySyncSell(!copySyncSell)}
                                                    className={`w-8 h-4 rounded-full p-0.5 transition-all flex ${copySyncSell ? 'bg-black justify-end' : 'bg-gray-200 justify-start'}`}
                                                >
                                                    <div className={`w-3 h-3 rounded-full ${copySyncSell ? 'bg-[#c3ff00]' : 'bg-white'}`}></div>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Submit */}
                                        {/* Submit Area */}
                                        <div className="space-y-3">
                                            <button
                                                onClick={() => {
                                                    const userMsg = {
                                                        role: 'user',
                                                        content: isCopyingEntity(copyTarget)
                                                            ? `Update Copy Trade configuration for ${copyTarget}.`
                                                            : `Initialize Copy Trade for ${copyTarget} with ${copyValueMode === 'percent' ? copyValue + '%' : '$' + copyValue} allocation. Slippage: ${copySlippage}%, Limit: $${copySpendLimit}.`,
                                                        timestamp: new Date().toLocaleTimeString()
                                                    };
                                                    setMessages(prev => [...prev, userMsg]);
                                                    setActiveForm(null);
                                                    setTimeout(() => {
                                                        const aiMsg = {
                                                            role: 'assistant',
                                                            content: isCopyingEntity(copyTarget)
                                                                ? `Configuration updated for **${copyTarget}**. All new trades will follow the revived parameters.`
                                                                : `Configuration complete. I've activated the mirroring engine for **${copyTarget}**. All verified trades on Polymarket will now be replicated to your dedicated sub-account according to your safety limits.`,
                                                            timestamp: new Date().toLocaleTimeString()
                                                        };
                                                        setMessages(prev => [...prev, aiMsg]);
                                                    }, 1000);
                                                }}
                                                className="w-full py-4 bg-black text-[#c3ff00] text-xs font-black rounded-xl hover:bg-gray-800 transition-all uppercase tracking-[0.3em] shadow-xl shadow-black/20"
                                            >
                                                {isCopyingEntity(copyTarget) ? 'Update Setting' : 'Create Copy Trade'}
                                            </button>

                                            {isCopyingEntity(copyTarget) && (
                                                <button
                                                    onClick={() => {
                                                        const userMsg = { role: 'user', content: `Stop copy trading ${copyTarget}.`, timestamp: new Date().toLocaleTimeString() };
                                                        setMessages(prev => [...prev, userMsg]);
                                                        setActiveForm(null);
                                                        setSelectedEntity(null);
                                                        setTimeout(() => {
                                                            const aiMsg = {
                                                                role: 'assistant',
                                                                content: `Copy trading for **${copyTarget}** has been terminated. Your existing positions remain open but will no longer be synced.`,
                                                                timestamp: new Date().toLocaleTimeString()
                                                            };
                                                            setMessages(prev => [...prev, aiMsg]);
                                                        }, 800);
                                                    }}
                                                    className="w-full py-3 bg-red-50 text-red-600 text-[10px] font-black rounded-xl hover:bg-red-100 transition-all uppercase tracking-widest border border-red-100"
                                                >
                                                    Cancel Copy Trade
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="bg-white border border-gray-200 rounded-[2rem] p-3 w-full flex flex-col gap-2 shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-gray-300 transition-all focus-within:border-gray-400 focus-within:shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
                            {!activeForm && selectedEntity && (
                                <div className="flex flex-wrap gap-2.5 px-3 pt-2 justify-start w-full animate-in fade-in">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                        <span>{selectedEntity}</span>
                                        <button
                                            onClick={() => setSelectedEntity(null)}
                                            className="ml-1 p-0.5 hover:bg-black/5 rounded-md transition-colors text-gray-400 hover:text-black"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => setActiveForm('copy_trade')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 group ${isCopyingEntity(selectedEntity)
                                            ? 'bg-white text-black border border-gray-200 hover:bg-gray-50'
                                            : 'bg-black text-white hover:bg-gray-800'
                                            }`}
                                    >
                                        {isCopyingEntity(selectedEntity) ? (
                                            <>
                                                <Icons.Settings className="w-2.5 h-2.5 group-hover:rotate-45 transition-transform" />
                                                Setting
                                            </>
                                        ) : (
                                            <>
                                                <Icons.Flash className="w-2.5 h-2.5 group-hover:scale-125 transition-transform" />
                                                Copy Trade
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center w-full px-1 mb-1">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask anything about Loka Protocol..."
                                    className="flex-1 bg-transparent border-none outline-none text-black text-[15px] px-3 py-3 placeholder:text-gray-300 font-medium"
                                />
                                <button
                                    onClick={handleSend}
                                    className="w-[42px] h-[42px] bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 hover:scale-105 active:scale-95 transition-all shadow-md shrink-0 ml-2"
                                >
                                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </main>

                <aside className="w-80 border-l border-gray-100 flex flex-col bg-white overflow-hidden shrink-0">
                    <div className="p-4 border-b border-gray-100 shrink-0">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-[11px] font-black text-black tracking-widest uppercase">My Portfolio</h2>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <div className="p-8 border-b border-gray-100 bg-[#fafafa]/50">
                            <div className="flex flex-col mb-8">
                                <p className="text-[10px] font-black text-gray-400 tracking-widest mb-2 uppercase">Total Account Balance</p>
                                <h2 className="text-[32px] font-black text-black tracking-tighter leading-none">$15,240.50</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total PnL</p>
                                    <p className="text-sm font-black text-green-600 bg-green-50 w-fit px-2 py-0.5 rounded-md">+$166.30</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Rate of Return</p>
                                    <p className="text-sm font-black text-green-600 bg-green-50 w-fit px-2 py-0.5 rounded-md">+1.09%</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setActiveForm('deposit')}
                                    className="flex-1 py-3 text-[10px] font-black bg-black text-white rounded-xl hover:opacity-80 transition-all uppercase tracking-[1.5px] shadow-sm"
                                >
                                    Deposit
                                </button>
                                <button
                                    onClick={() => setActiveForm('withdraw')}
                                    className="flex-1 py-3 text-[10px] font-black bg-white text-black border border-gray-200 rounded-xl hover:bg-gray-50 transition-all uppercase tracking-[1.5px]"
                                >
                                    Withdraw
                                </button>
                            </div>
                        </div>

                        <div className="py-6">
                            <div className="px-8 flex items-center justify-between mb-4">
                                <h3 className="text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase">Copy Trading</h3>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {[
                                    {
                                        name: 'Theo4',
                                        totalProfit: '+$24,102',
                                        icon: 'T',
                                        color: 'bg-blue-600',
                                        orders: [
                                            { market: 'Trump Win Election', asset: 'YES', profit: '+$12,420', status: 'Active' },
                                            { market: 'Fed Rate Cut Nov', asset: '50bps', profit: '+$1,120', status: 'Active' },
                                        ]
                                    },
                                    {
                                        name: 'Fredi9999',
                                        totalProfit: '+$8,450',
                                        icon: 'F',
                                        color: 'bg-indigo-600',
                                        orders: [
                                            { market: 'BTC Price End of Year', asset: '>$100k', profit: '+$4,210', status: 'Active' },
                                        ]
                                    }
                                ].map((handler, idx) => (
                                    <div key={idx} className="group transition-all">
                                        <div
                                            onClick={() => {
                                                toggleHandler(idx);
                                                setSelectedEntity(handler.name);
                                            }}
                                            className={`px-8 py-5 flex items-center justify-between cursor-pointer transition-all ${selectedEntity === handler.name ? 'bg-gray-100/80' : 'hover:bg-gray-50/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 ${handler.color} rounded-lg flex items-center justify-center text-white text-[9px] font-black shrink-0 shadow-sm transition-transform group-hover:scale-105`}>
                                                    {handler.icon}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <p className="text-[12px] font-bold text-black truncate">{handler.name}</p>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                                        <p className="text-[8px] font-bold text-blue-500 uppercase tracking-tight">Active Syncing</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-[12px] font-black text-green-600">{handler.totalProfit}</p>
                                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">TOTAL PNL</p>
                                                </div>
                                                {expandedHandlers.has(idx) ?
                                                    <Icons.ChevronUp className="w-4 h-4 text-gray-400" /> :
                                                    <Icons.ChevronDown className="w-4 h-4 text-gray-400" />
                                                }
                                            </div>
                                        </div>

                                        {expandedHandlers.has(idx) && (
                                            <div className="px-8 pb-5 animate-in slide-in-from-top-2 duration-300">
                                                <div className="pt-4 border-t border-gray-100/50 space-y-2.5">
                                                    {handler.orders.map((order, oIdx) => (
                                                        <div key={oIdx} className="p-3 bg-gray-50/80 rounded-xl flex items-center justify-between group/order border border-transparent hover:border-gray-200 transition-all">
                                                            <div className="min-w-0">
                                                                <p className="text-[11px] font-bold text-black truncate pr-2">{order.market}</p>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    <span className="text-[8px] font-black text-gray-400 uppercase">{order.asset}</span>
                                                                    <span className="w-1 h-1 bg-green-500/50 rounded-full"></span>
                                                                    <span className="text-[8px] font-bold text-green-600">{order.status}</span>
                                                                </div>
                                                            </div>
                                                            <p className="text-[11px] font-black text-green-600 shrink-0">{order.profit}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Chat;
