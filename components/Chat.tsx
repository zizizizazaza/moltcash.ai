
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { Icons } from '../constants';

const Chat: React.FC = () => {
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [activeAgent, setActiveAgent] = useState('ComputeDAO GPU');
    const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
    const [activeForm, setActiveForm] = useState<'buy' | 'sell' | 'deposit' | 'withdraw' | null>(null);
    const [formAmount, setFormAmount] = useState('');
    const [formAsset, setFormAsset] = useState('AIUSD');
    const [activeAssetTab, setActiveAssetTab] = useState<'Background' | 'Financial Health' | 'Rules'>('Background');
    const [projectCardExpanded, setProjectCardExpanded] = useState(false);
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
        }

        const handleSetAgent = (e: Event) => {
            const customEvent = e as CustomEvent;
            setMessages([]);
            setActiveAgent(customEvent.detail);
        };
        window.addEventListener('loka-set-chat-agent', handleSetAgent);

        return () => window.removeEventListener('loka-set-chat-agent', handleSetAgent);
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
        { title: 'ComputeDAO GPU', category: 'Infrastructure', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=300&fit=crop', desc: 'Enterprise data center expansion funding with verified cash flows.' },
        { title: 'Shopify Merchant', category: 'E-commerce', image: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=400&h=300&fit=crop', desc: 'Working capital loan for top-tier Shopify sellers with low risk.' },
        { title: 'Vercel SaaS Pool', category: 'Software', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop', desc: 'Recurring revenue financing for enterprise SaaS deployments.' },
        { title: 'CloudScale SaaS', category: 'SaaS', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop', desc: 'Enterprise SaaS revenue financing with Vercel integrations.' },
        { title: 'ArtBot AI', category: 'AI Tools', image: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=400&h=300&fit=crop', desc: 'Generative AI content royalties and subscription backing.' },
        { title: 'AWS Cloud Note', category: 'Infrastructure', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop', desc: 'Secure yield generated from backing AWS capacity reservations.' },
        { title: 'Stripe Escrow Pool', category: 'DeFi Data', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop', desc: 'Automated revenue streaming and escrow financing.' },
        { title: 'Cloudflare Capacity', category: 'Infrastructure', image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=300&fit=crop', desc: 'Global edge network capacity lending with 12% APY.' },
        { title: 'Amazon FBA Sellers', category: 'E-commerce', image: 'https://images.unsplash.com/photo-1586880244406-556ebe35f282?w=400&h=300&fit=crop', desc: 'Inventory-backed financing for proven Amazon FBA vendors.' },
        { title: 'DigitalOcean Tier', category: 'Infrastructure', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop', desc: 'Financing for SME cloud deployments with high retention.' }
    ];

    return (
        <div className="flex flex-col h-full bg-[#fafafa] text-black overflow-hidden font-sans">
            <div className="flex flex-1 overflow-hidden relative">
                {/* Left Sidebar - Chat History */}
                <aside
                    className={`border-r border-gray-100 flex flex-col bg-white transition-all duration-300 ease-in-out relative ${leftSidebarCollapsed ? 'w-0 opacity-0 -translate-x-full overflow-hidden border-0' : 'w-72 opacity-100 translate-x-0'
                        }`}
                >
                    <div className="flex-1 overflow-y-auto w-full pt-4">
                        <div className="px-6 mb-4 mt-2">
                            <h4 className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Cash Flow Assets</h4>
                        </div>
                        {cashFlowAssets.map((asset) => (
                            <div
                                key={asset.title}
                                onClick={() => setActiveAgent(asset.title)}
                                className={`flex items-center gap-3 px-6 py-4 cursor-pointer transition-all ${activeAgent === asset.title ? 'bg-green-50/50 border-r-2 border-green-500' : 'hover:bg-gray-50 bg-white border-r-2 border-transparent'}`}
                            >
                                <div className={`w-10 h-10 rounded-xl overflow-hidden shadow-sm shrink-0 border border-gray-100`}>
                                    <img src={asset.image} alt={asset.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-sm text-black truncate">{asset.title}</h3>
                                    <p className="text-[10px] text-gray-400 font-medium truncate">{asset.desc}</p>
                                </div>
                            </div>
                        ))}
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
                <main className="flex-1 flex flex-col relative bg-white border-l border-gray-100">
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
                                    <div className="flex items-center justify-between mb-8 px-4">
                                        <div className="flex gap-8 border-b border-gray-100 flex-1 mr-8">
                                            {['Background', 'Financial Health', 'Rules'].map(tab => (
                                                <button
                                                    key={tab}
                                                    onClick={() => setActiveAssetTab(tab as any)}
                                                    className={`text-sm font-black tracking-widest uppercase pb-4 -mb-px transition-colors border-b-[3px] ${activeAssetTab === tab ? 'border-green-500 text-black' : 'border-transparent text-gray-300 hover:text-black hover:border-black/20'}`}
                                                >
                                                    {tab}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex gap-3 shrink-0">
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
                                                        <div className="flex bg-black rounded-3xl p-5 gap-8 shrink-0 shadow-lg">
                                                            <div>
                                                                <p className="text-xl font-serif italic font-bold text-white leading-none">$1.5M</p>
                                                                <p className="text-[8px] font-bold text-gray-500 tracking-widest mt-2 uppercase">Total Funding Raised</p>
                                                            </div>
                                                            <div className="w-px h-full bg-white/10" />
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
                                                        {['https://images.unsplash.com/photo-1558494949-ef010cbdcc51?q=80&w=800', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800'].map((url, i) => (
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
                                        <div className="w-full lg:w-[460px] bg-gray-50/80 rounded-3xl p-6 shrink-0 border border-gray-100/80">
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
                                <div className="min-h-full w-full flex flex-col max-w-5xl mx-auto px-10 pt-32 pb-32">
                                    <div className="flex flex-col items-center mb-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-black font-black shadow-lg">
                                                L
                                            </div>
                                            <h1 className="text-3xl font-black text-black tracking-tight">Loka AI</h1>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-gray-100 shadow-[0_15px_60px_-15px_rgba(0,0,0,0.05)] rounded-[2.5rem] p-4 w-full flex flex-col max-w-4xl mx-auto mb-16 relative hover:border-black/5 transition-all">
                                        <div className="flex items-center w-full">
                                            <input
                                                type="text"
                                                value={inputText}
                                                onChange={(e) => setInputText(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                                placeholder="What should we start with?"
                                                className="flex-1 bg-transparent border-none outline-none text-black text-2xl px-10 py-8 placeholder:text-gray-300 font-medium"
                                            />
                                            <button
                                                onClick={handleSend}
                                                className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 transition-all shrink-0 mr-2"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                            </button>
                                        </div>

                                        {/* Embedded Quick Actions in initial view */}
                                        <div className="flex gap-4 px-8 pb-4 pt-2">
                                            <button onClick={() => { setActiveForm('buy'); setFormAsset('AIUSD'); }} className="px-5 py-2.5 bg-gray-50 border border-gray-100 rounded-full text-xs font-bold text-gray-600 hover:border-black hover:text-black hover:shadow-sm transition-all flex items-center gap-2">
                                                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                                Buy Asset
                                            </button>
                                            <button onClick={() => { setActiveForm('sell'); setFormAsset('AIUSD'); }} className="px-5 py-2.5 bg-gray-50 border border-gray-100 rounded-full text-xs font-bold text-gray-600 hover:border-black hover:text-black hover:shadow-sm transition-all flex items-center gap-2">
                                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>
                                                Sell Asset
                                            </button>
                                        </div>
                                    </div>

                                    {/* Asset Brief Micro-dashboard */}
                                    <div className="w-full max-w-5xl mx-auto mt-2 mb-8 bg-white border border-gray-100 rounded-[2rem] p-6 shadow-[0_5px_40px_-15px_rgba(0,0,0,0.05)] transition-all">
                                        <div className="flex flex-col lg:flex-row gap-8">
                                            {/* Left Side: Basic Info & Core Metrics */}
                                            <div className="flex-1 flex flex-col justify-between">
                                                <div className="mb-6 lg:mb-0 flex gap-4">
                                                    <img src={selectedCurrent.image} className="w-12 h-12 rounded-full object-cover border border-gray-100 shrink-0 mt-1" alt={selectedCurrent.title} />
                                                    <div>
                                                        <h3 className="text-2xl font-bold text-black mb-2">{selectedCurrent.title}</h3>
                                                        <p className="text-xs text-gray-500 font-medium leading-relaxed pr-8">{selectedCurrent.desc}</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-8 items-end pt-4 border-t border-gray-50 lg:border-none lg:pt-0">
                                                    <div>
                                                        <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-1">Target Yield</p>
                                                        <p className="text-lg font-serif italic text-black font-bold">15.5% <span className="text-[10px] text-gray-400 not-italic font-sans">APY</span></p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-1">Target Raise</p>
                                                        <p className="text-lg font-serif italic text-black font-bold">$500,000</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-1">Duration</p>
                                                        <p className="text-base font-bold text-black">60 Days</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Side: Detailed Status Card (from mockup) */}
                                            <div className="w-full lg:w-[460px] bg-gray-50/80 rounded-3xl p-6 shrink-0 border border-gray-100/80">
                                                {progress >= 100 ? (
                                                    <div className="space-y-6">
                                                        <div className="flex justify-between items-end">
                                                            <div>
                                                                <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-2">Campaign Progress</p>
                                                                <p className="text-3xl font-serif italic text-black font-bold">$500,000</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-2">Goal</p>
                                                                <p className="text-sm font-bold text-black font-serif italic">$500k</p>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2.5">
                                                            <div className="w-full h-3 bg-black rounded-full" />
                                                            <div className="flex justify-between items-center text-[10px] font-bold">
                                                                <span className="text-black">100% funded</span>
                                                                <span className="text-green-500 tracking-wide">Successfully Funded</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <div className="flex -space-x-1.5">
                                                                <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-gray-50" />
                                                                <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-gray-50" />
                                                                <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-gray-50" />
                                                                <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center border-2 border-gray-50 z-10">
                                                                    <span className="text-[8px] font-bold text-white">+124</span>
                                                                </div>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-gray-400 ml-1">Backers pledged</span>
                                                        </div>

                                                        <div className="grid grid-cols-1 pt-2">
                                                            <div className="bg-green-50 rounded-2xl p-5 flex items-center justify-between border border-green-100">
                                                                <div>
                                                                    <h4 className="font-bold text-black text-sm mb-1">Campaign Successful</h4>
                                                                    <p className="text-[10px] text-gray-600 font-medium leading-tight pr-4">This asset has been fully funded and is now generating yield.</p>
                                                                </div>
                                                                <span className="text-3xl block drop-shadow-sm shrink-0">🎉</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-6">
                                                        <div className="flex justify-between items-end">
                                                            <div>
                                                                <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-2">Campaign Progress</p>
                                                                <p className="text-3xl font-serif italic text-black font-bold">${((500000 * progress) / 100).toLocaleString()}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-2">Goal</p>
                                                                <p className="text-sm font-bold text-black font-serif italic">$500k</p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2.5">
                                                            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                                                <div className="h-full bg-black rounded-full" style={{ width: `${progress}%` }} />
                                                            </div>
                                                            <div className="flex justify-between items-center text-[10px] font-bold">
                                                                <span className="text-black">{progress}% funded</span>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                                    <span className="text-black tracking-wide">Fundraising</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex -space-x-1.5">
                                                                <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-gray-50" />
                                                                <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-gray-50" />
                                                                <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center border-2 border-gray-50 z-10">
                                                                    <span className="text-[8px] font-bold text-white">+86</span>
                                                                </div>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-gray-400 ml-1">Backers pledged</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>


                                    <div className="w-full max-w-5xl mx-auto mt-10">
                                        <div className="flex items-center justify-between mb-8 px-4">
                                            <div className="flex gap-8 border-b border-gray-100 flex-1 mr-8">
                                                {['Background', 'Financial Health', 'Rules'].map(tab => (
                                                    <button
                                                        key={tab}
                                                        onClick={() => setActiveAssetTab(tab as any)}
                                                        className={`text-sm font-black tracking-widest uppercase pb-4 -mb-px transition-colors border-b-[3px] ${activeAssetTab === tab ? 'border-green-500 text-black' : 'border-transparent text-gray-300 hover:text-black hover:border-black/20'}`}
                                                    >
                                                        {tab}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex gap-3 shrink-0">
                                                <span className="px-3 py-1 bg-black text-white text-[10px] font-bold rounded-full">Verified by Loka</span>
                                                <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-full">Stripe API Verified</span>
                                            </div>
                                        </div>

                                        <div className="w-full transition-all">
                                            {/* Content Grid */}
                                            <div className="flex flex-col gap-12 pt-4">
                                                {/* Details */}

                                                {activeAssetTab === 'Background' && (
                                                    <div className="w-full space-y-12 animate-fadeIn pb-10">

                                                        {/* Issuer Profile & Socials */}
                                                        <div className="flex flex-col lg:flex-row items-center justify-between bg-gray-50/40 p-5 rounded-[2.5rem] border border-gray-100/50 gap-6">
                                                            <div className="flex items-center gap-6 w-full">
                                                                <div className="w-16 h-16 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center justify-center text-2xl font-bold text-black shrink-0">
                                                                    {selectedCurrent.title.charAt(0)}
                                                                </div>
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

                                                                    {/* Social Links moved here */}
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {[
                                                                            {
                                                                                label: 'Twitter',
                                                                                icon: <svg className="w-3.5 h-3.5 text-[#1DA1F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                                                                            },
                                                                            {
                                                                                label: 'LinkedIn',
                                                                                icon: <svg className="w-3.5 h-3.5 text-[#0077b5]" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.778-.773 1.778-1.729V1.729C24 .774 23.204 0 22.225 0z" /></svg>
                                                                            },
                                                                            {
                                                                                label: 'GitHub',
                                                                                icon: <svg className="w-3.5 h-3.5 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.82 1.102.82 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                                                                            }
                                                                        ].map((social, i) => (
                                                                            <div key={i} className="flex items-center gap-1.5 bg-white border border-gray-100 px-3 py-1.5 rounded-xl shadow-sm hover:shadow-md hover:border-black/5 transition-all cursor-pointer group">
                                                                                {social.icon}
                                                                                <span className="text-[10px] font-bold text-gray-500 group-hover:text-black">{social.label}</span>
                                                                                <div className="w-3 h-3 bg-green-50 rounded-full flex items-center justify-center">
                                                                                    <svg className="w-1.5 h-1.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 13l4 4L19 7" /></svg>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {/* Right Side Stats from Screenshot */}
                                                            <div className="flex bg-black rounded-3xl p-5 gap-8 shrink-0 shadow-lg">
                                                                <div>
                                                                    <p className="text-xl font-serif italic font-bold text-white leading-none">$1.5M</p>
                                                                    <p className="text-[8px] font-bold text-gray-500 tracking-widest mt-2 uppercase">Total Funding Raised</p>
                                                                </div>
                                                                <div className="w-px h-full bg-white/10" />
                                                                <div>
                                                                    <p className="text-xl font-serif italic font-bold text-green-500 leading-none">100% ↑</p>
                                                                    <p className="text-[8px] font-bold text-gray-500 tracking-widest mt-2 uppercase">On-time Repayment</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Narrative Section */}
                                                        <div className="space-y-6">
                                                            <div className="flex items-center gap-4">
                                                                <h3 className="text-base font-black text-black">Business Narrative</h3>
                                                                <div className="h-px flex-1 bg-gray-50" />
                                                            </div>
                                                            <p className="text-sm text-gray-500 leading-loose font-medium max-w-4xl">
                                                                We are operating over 500 GPUs in Singapore. This funding batch will be used to prepay electricity and bandwidth expansion for our next month of generative AI rendering contracts. Over the past 12 months, we have maintained a 99.9% uptime and generated consistent cash flows from our enterprise clients.
                                                            </p>
                                                            <div className="bg-[#fcfbf9] p-8 rounded-[2rem] border-l-4 border-green-500 italic text-sm text-gray-600 shadow-sm">
                                                                "Purchasing 8 additional H100 GPUs and pre-paying data center rack fees in Tokyo to expand computing rental capacity."
                                                            </div>
                                                        </div>

                                                        {/* Image Gallery from Screenshot */}
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                            <div className="aspect-[1.6/1] bg-gray-100 rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm group">
                                                                <img src="https://images.unsplash.com/photo-1558494949-ef010cbdcc51?q=80&w=800" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                            </div>
                                                            <div className="aspect-[1.6/1] bg-gray-100 rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm group">
                                                                <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                            </div>
                                                            <div className="aspect-[1.6/1] bg-gray-100 rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm group">
                                                                <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                            </div>
                                                        </div>

                                                        {/* Leadership Section from Screenshot */}
                                                        <div className="space-y-8">
                                                            <div className="flex items-center gap-4">
                                                                <h3 className="text-base font-black text-black">Leadership & Backing</h3>
                                                                <div className="h-px flex-1 bg-gray-50" />
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                {/* CEO */}
                                                                <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 flex items-start gap-6 shadow-sm hover:shadow-md transition-all">
                                                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center font-serif text-2xl text-gray-300 shrink-0">A</div>
                                                                    <div className="space-y-1">
                                                                        <p className="font-black text-black text-base">Alex Chen</p>
                                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Chief Executive Officer</p>
                                                                        <div className="pt-2">
                                                                            <span className="text-[11px] text-blue-600 font-black bg-blue-50 px-2.5 py-1 rounded-lg">Ex-AWS Principal Architect</span>
                                                                        </div>
                                                                        <p className="text-xs text-gray-500 mt-4 font-medium leading-relaxed">10+ years scaling global cloud infrastructure. Led GPU cluster deployments for Fortune 500 AI divisions.</p>
                                                                    </div>
                                                                </div>
                                                                {/* CTO */}
                                                                <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 flex items-start gap-6 shadow-sm hover:shadow-md transition-all">
                                                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center font-serif text-2xl text-gray-300 shrink-0">S</div>
                                                                    <div className="space-y-1">
                                                                        <p className="font-black text-black text-base">Sarah Li</p>
                                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Chief Technology Officer</p>
                                                                        <div className="pt-2">
                                                                            <span className="text-[11px] text-blue-600 font-black bg-blue-50 px-2.5 py-1 rounded-lg">Ex-Ethereum Foundation</span>
                                                                        </div>
                                                                        <p className="text-xs text-gray-500 mt-4 font-medium leading-relaxed">Expert in secure protocol & smart contract auditing. Specializes in DePIN hardware attestation layers.</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                    </div>
                                                )}

                                                {activeAssetTab === 'Financial Health' && (
                                                    <div className="w-full space-y-8 animate-fadeIn">
                                                        {/* 1. Live Monitor */}
                                                        <section className="space-y-6">
                                                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                                                <div className="flex items-center gap-3">
                                                                    <h3 className="text-base font-bold text-black">Stripe Connect API Monitor</h3>
                                                                    <div className="bg-blue-50 text-blue-600 text-[9px] font-bold px-3 py-1 rounded-full italic">Read-Only Access</div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse" />
                                                                    <span className="text-[10px] font-bold text-[#00E676]">Oracle Online</span>
                                                                </div>
                                                            </div>

                                                            {/* High Level Metrics */}
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                {[
                                                                    { label: '30d Gross Flow', value: `$1,245,600`, sub: 'Up 11.2% MoM', trend: 'up' },
                                                                    { label: 'Coverage Ratio', value: '2.49x', sub: 'Calculated at Maturity', trend: 'safe' },
                                                                    { label: 'MRR', value: '$42,000', sub: 'Enterprise Focus', trend: 'up' }
                                                                ].map((stat, i) => (
                                                                    <div key={i} className="p-6 bg-white glass rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                                                                        <p className="text-[10px] font-bold text-gray-400  tracking-widest mb-3">{stat.label}</p>
                                                                        <p className="text-3xl font-serif italic text-black mb-1">{stat.value}</p>
                                                                        <p className="text-[10px] font-bold text-[#00E676]  tracking-tighter flex items-center gap-1">
                                                                            {stat.trend === 'up' && '▲'} {stat.sub}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* Detailed Analysis Section */}
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                {/* Revenue History */}
                                                                <div className="p-6 bg-white glass rounded-3xl border border-gray-100 shadow-sm space-y-4">
                                                                    <div className="flex justify-between items-center">
                                                                        <p className="text-sm font-bold text-black">Revenue Timeline (6mo)</p>
                                                                        <p className="text-[10px] font-bold text-gray-400">Verifiably Accurate</p>
                                                                    </div>
                                                                    <div className="h-[200px] w-full">
                                                                        <ResponsiveContainer width="100%" height="100%">
                                                                            <BarChart data={mockMonthlyRevenue}>
                                                                                <CartesianGrid strokeDasharray="1 6" vertical={false} stroke="#f0f0f0" />
                                                                                <XAxis
                                                                                    dataKey="month"
                                                                                    axisLine={false}
                                                                                    tickLine={false}
                                                                                    tick={{ fontSize: 9, fontWeight: 700, fill: '#999' }}
                                                                                    dy={8}
                                                                                />
                                                                                <YAxis hide />
                                                                                <Tooltip
                                                                                    cursor={{ fill: '#f9f9f9' }}
                                                                                    content={({ payload }) => payload?.[0] ? (
                                                                                        <div className="bg-black text-white p-3 rounded-2xl text-[10px] font-black shadow-2xl">
                                                                                            ${payload[0].value?.toLocaleString()}
                                                                                        </div>
                                                                                    ) : null}
                                                                                />
                                                                                <Bar dataKey="amount" fill="#000" radius={[4, 4, 4, 4]} barSize={32} />
                                                                            </BarChart>
                                                                        </ResponsiveContainer>
                                                                    </div>
                                                                </div>

                                                                {/* Concentration Analysis */}
                                                                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                                                                    <p className="text-sm font-bold text-black">Customer Concentration Analysis</p>
                                                                    <div className="space-y-4">
                                                                        {[
                                                                            { label: 'Top 1 Customer', value: '15%', color: 'bg-black' },
                                                                            { label: 'Top 5 Customers', value: '42%', color: 'bg-gray-400' },
                                                                            { label: 'Long-Tail Borrowers', value: '43%', color: 'bg-gray-200' }
                                                                        ].map((item, i) => (
                                                                            <div key={i} className="space-y-2">
                                                                                <div className="flex justify-between text-[11px] font-bold">
                                                                                    <span className="text-gray-400">{item.label}</span>
                                                                                    <span className="text-black">{item.value}</span>
                                                                                </div>
                                                                                <div className="w-full h-1.5 bg-white rounded-full overflow-hidden border border-gray-100/50">
                                                                                    <div className={`h-full ${item.color}`} style={{ width: item.value }} />
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <p className="text-[10px] text-gray-400 italic leading-relaxed">Diversified customer base ensures that if a single client churns, the underlying asset revenue remains robust enough to cover interest payments.</p>
                                                                </div>
                                                            </div>
                                                        </section>

                                                        {/* AI Risk Report */}
                                                        <section className="space-y-4">
                                                            <div className="flex items-center gap-4">
                                                                <h3 className="text-base font-bold text-black">Loka AI Risk scoring</h3>
                                                                <div className="h-px flex-1 bg-gray-100" />
                                                            </div>
                                                            <div className="p-8 bg-purple-50 rounded-[40px] border-2 border-purple-100/50 relative overflow-hidden group">
                                                                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-purple-200/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                                                                <div className="relative z-10 space-y-6">
                                                                    <div className="flex justify-between items-start">
                                                                        <div className="space-y-1">
                                                                            <div className="p-2 bg-purple-600 rounded-lg w-fit text-white text-xs">Loka AI v2.4</div>
                                                                            <p className="text-[10px] font-bold text-purple-400 mt-2">Analysis Engine: Predictive Default Model</p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <div className="text-5xl font-serif italic text-purple-600">AAA</div>
                                                                            <p className="text-xs font-bold text-purple-400">98/100 Confidence</p>
                                                                        </div>
                                                                    </div>

                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                        <div className="space-y-3">
                                                                            <p className="text-[11px] font-bold text-purple-900 border-b border-purple-100 pb-1">Key Strengths</p>
                                                                            <ul className="space-y-2">
                                                                                {[
                                                                                    'Market Fit: AI computing demand is in a phase of exponential growth.',
                                                                                    'Cash Flow Quality: Stripe lock-box account with mandatory repayment mechanism.',
                                                                                    'Strong Collateral: Physical GPU lien + Accounts receivable security interest.'
                                                                                ].map((point, i) => (
                                                                                    <li key={i} className="flex items-center gap-3 text-[11px] text-purple-800 font-medium italic">
                                                                                        <span className="text-[#00E676] text-lg">✓</span> {point}
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                        <div className="space-y-3">
                                                                            <p className="text-[11px] font-bold text-purple-900 border-b border-purple-100 pb-1">Risk Observations</p>
                                                                            <ul className="space-y-2">
                                                                                {[
                                                                                    'Geopolitics: Data center electricity rates in Tokyo impacted by energy price volatility.',
                                                                                    'Obsolescence: Risk of H100 computing power facing depreciation after 24 months.'
                                                                                ].map((point, i) => (
                                                                                    <li key={i} className="flex items-center gap-3 text-[11px] text-purple-800 font-medium italic">
                                                                                        <span className="text-orange-400 text-lg">⚠️</span> {point}
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </section>
                                                    </div>
                                                )}

                                                {activeAssetTab === 'Rules' && (
                                                    <div className="w-full space-y-12 animate-fadeIn">
                                                        {/* 1. Fundraising Mechanics */}
                                                        <section className="space-y-6">
                                                            <h3 className="text-base font-bold text-black">Campaign Rules & Mechanics</h3>
                                                            <div className="p-8 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-8">
                                                                {/* Visual Timeline */}
                                                                <div className="relative pt-6 pb-2">
                                                                    {/* Background Bar */}
                                                                    <div className="absolute top-8 left-[16%] right-[16%] h-1 bg-gray-100 rounded-full" />
                                                                    {/* Progress Bar */}
                                                                    <div className="absolute top-8 left-[16%] h-1 bg-[#00E676] transition-all duration-1000 rounded-full" style={{ width: `${progress * 0.68}%` }} />

                                                                    <div className="relative flex justify-between z-10 w-full">
                                                                        {/* Step 1 */}
                                                                        <div className="flex flex-col items-center w-1/3 text-center space-y-3">
                                                                            <div className="w-5 h-5 rounded-full bg-white border-4 border-gray-200 shadow-sm relative">
                                                                                <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] font-black  tracking-widest text-gray-400 whitespace-nowrap">Start</span>
                                                                            </div>
                                                                            <div>
                                                                                <h4 className="text-[11px] font-black  tracking-widest text-black mb-1">Fundraising</h4>
                                                                                <p className="text-[10px] text-gray-500 font-medium px-2 leading-relaxed">Freely deposit or withdraw USDC.</p>
                                                                            </div>
                                                                        </div>

                                                                        {/* Step 2 */}
                                                                        <div className="flex flex-col items-center w-1/3 text-center space-y-3">
                                                                            <div className="w-5 h-5 rounded-full bg-white border-4 border-black shadow-sm relative">
                                                                                <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] font-black  tracking-widest text-black whitespace-nowrap">$250k</span>
                                                                            </div>
                                                                            <div>
                                                                                <h4 className="text-[11px] font-black  tracking-widest text-black mb-1">Success Point</h4>
                                                                                <p className="text-[10px] text-gray-500 font-medium px-2 leading-relaxed">Goal met. Campaign secures funding.</p>
                                                                            </div>
                                                                        </div>

                                                                        {/* Step 3 */}
                                                                        <div className="flex flex-col items-center w-1/3 text-center space-y-3">
                                                                            <div className="w-5 h-5 rounded-full bg-white border-4 border-gray-200 shadow-sm relative">
                                                                                <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] font-black  tracking-widest text-gray-400 whitespace-nowrap">$500k</span>
                                                                            </div>
                                                                            <div>
                                                                                <h4 className="text-[11px] font-black  tracking-widest text-black mb-1">Lock & Deploy</h4>
                                                                                <p className="text-[10px] text-gray-500 font-medium px-2 leading-relaxed">Pool locked immediately. Yield begins.</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Conditions */}
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                                                                    <div className="flex gap-4 p-5 bg-green-50/50 rounded-2xl border border-green-100/50">
                                                                        <div className="text-xl" style={{ marginTop: '2px' }}>💸</div>
                                                                        <div>
                                                                            <h4 className="text-[11px] font-black  tracking-widest text-black mb-1">If Campaign Succeeds</h4>
                                                                            <p className="text-[10px] text-gray-500 leading-relaxed font-medium">Funds are locked. Guaranteed payout rules execute to distribute principal and yield direct to wallet.</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-4 p-5 bg-red-50/40 rounded-2xl border border-red-100/50">
                                                                        <div className="text-xl" style={{ marginTop: '2px' }}>↩️</div>
                                                                        <div>
                                                                            <h4 className="text-[11px] font-black  tracking-widest text-black mb-1">If Campaign Fails</h4>
                                                                            <p className="text-[10px] text-gray-500 leading-relaxed font-medium">Should the soft cap be missed before deadline, smart contracts auto-refund 100% of participants' capital safety.</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </section>

                                                        {/* 2. Asset Structure Flow */}
                                                        <section className="space-y-8">
                                                            <h3 className="text-base font-bold text-black">Fund Flow & Asset Structure</h3>
                                                            <div className="p-10 bg-gray-50 rounded-[32px] border border-gray-100 flex flex-wrap items-center justify-center gap-x-4 gap-y-8 text-center relative overflow-hidden">
                                                                <div className="absolute top-0 right-0 p-4">
                                                                    <div className="px-2 py-0.5 bg-white/80 backdrop-blur rounded text-[9px] font-bold text-gray-400 border border-gray-100">Immutable Smart Contract</div>
                                                                </div>
                                                                {[
                                                                    'Investors', 'Loka SPV', 'Borrower', 'Purchase H100', 'Revenue Gen', 'Stripe Escrow', 'Auto-Repay'
                                                                ].map((step, i) => (
                                                                    <React.Fragment key={i}>
                                                                        <div className="relative group">
                                                                            <div className={`px-4 py-3 rounded-2xl border shadow-sm transition-all duration-500 flex items-center justify-center min-w-[100px] ${i === 6 ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-100 group-hover:border-black'
                                                                                }`}>
                                                                                <p className="text-[9px] font-black  tracking-widest">{step}</p>
                                                                            </div>
                                                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold text-gray-300 italic">Step 0{i + 1}</div>
                                                                        </div>
                                                                        {i < 6 && (
                                                                            <div className="text-gray-300 font-light text-xl animate-pulse">→</div>
                                                                        )}
                                                                    </React.Fragment>
                                                                ))}
                                                            </div>
                                                        </section>

                                                        {/* 3. Key Rights & Protections */}
                                                        <section className="space-y-6">
                                                            <h3 className="text-base font-bold text-black">Key Rights & Protections</h3>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {[
                                                                    {
                                                                        icon: '🥇',
                                                                        title: 'Seniority',
                                                                        badge: 'Senior Secured',
                                                                        plainEnglish: 'In the event of liquidation, you are paid back first—before the company’s shareholders.'
                                                                    },
                                                                    {
                                                                        icon: '🛡️',
                                                                        title: 'Structure',
                                                                        badge: 'Bankruptcy Remote',
                                                                        plainEnglish: 'Assets are held in a secure, independent SPV. Even if the parent company fails, your investment remains out of reach for their creditors.'
                                                                    },
                                                                    {
                                                                        icon: '🧱',
                                                                        title: 'Collateral Ratio',
                                                                        badge: '120%-150%',
                                                                        plainEnglish: 'Every $100 lent is backed by up to $150 in expected revenue. Even if earnings drop by 30%, your principal remains secure.'
                                                                    },
                                                                    {
                                                                        icon: '🤖',
                                                                        title: 'Smart Escrow',
                                                                        badge: 'Code Enforced',
                                                                        plainEnglish: 'Revenue is intercepted by SDK and flows directly into on-chain contracts. It is tamper-proof and automatically distributed at maturity.'
                                                                    }
                                                                ].map((item, i) => (
                                                                    <div key={i} className="group relative bg-white border border-gray-100 p-6 rounded-[32px] hover:border-black transition-all duration-300 shadow-sm overflow-hidden h-48 flex flex-col justify-between">
                                                                        {/* Normal State */}
                                                                        <div className="space-y-3">
                                                                            <div className="text-2xl">{item.icon}</div>
                                                                            <div>
                                                                                <p className="text-[11px] font-bold text-gray-400  tracking-tight">{item.title}</p>
                                                                                <p className="text-sm font-black text-black leading-tight mt-1">{item.badge}</p>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center gap-1.5 pt-2 border-t border-gray-50">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-[#00E676]" />
                                                                            <span className="text-[9px] font-bold text-gray-400  tracking-widest">Active Protection</span>
                                                                        </div>

                                                                        {/* Hover State - Explanation */}
                                                                        <div className="absolute inset-0 bg-black/95 p-6 flex flex-col justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 cursor-default">
                                                                            <p className="text-[13px] text-white font-medium leading-relaxed italic text-center">
                                                                                "{item.plainEnglish}"
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </section>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 space-y-8 max-w-5xl mx-auto">
                                    {/* Expandable Project Details Card at top of chat */}
                                    <div className="w-full bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden">
                                        {/* Compact Header - always visible */}
                                        <div
                                            className="flex items-center gap-4 p-5 cursor-pointer group"
                                            onClick={() => setProjectCardExpanded(!projectCardExpanded)}
                                        >
                                            <img src={selectedCurrent.image} className="w-11 h-11 rounded-xl object-cover border border-gray-100 shrink-0" alt={selectedCurrent.title} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-sm font-black text-black truncate">{selectedCurrent.title}</h3>
                                                    <span className="px-1.5 py-0.5 bg-green-50 text-green-600 text-[8px] font-black rounded tracking-wider shrink-0">VERIFIED</span>
                                                </div>
                                                <p className="text-[11px] text-gray-400 font-medium leading-snug line-clamp-1">{selectedCurrent.desc}</p>
                                            </div>
                                            <div className="flex items-center gap-5 shrink-0 pl-4 border-l border-gray-100">
                                                <div className="text-right">
                                                    <p className="text-[8px] font-bold text-gray-400 tracking-widest uppercase">Yield</p>
                                                    <p className="text-sm font-black text-black">15.5%</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[8px] font-bold text-gray-400 tracking-widest uppercase">Raise</p>
                                                    <p className="text-sm font-black text-black">$500k</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[8px] font-bold text-gray-400 tracking-widest uppercase">Term</p>
                                                    <p className="text-sm font-bold text-black">60d</p>
                                                </div>
                                            </div>
                                            {/* Progress bar inline */}
                                            <div className="flex items-center gap-2 shrink-0 pl-4 border-l border-gray-100">
                                                <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-black rounded-full" style={{ width: `${progress}%` }} />
                                                </div>
                                                <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap">{progress}%</span>
                                            </div>
                                            {/* Expand/Collapse Chevron */}
                                            <div className={`w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-gray-100 transition-all ${projectCardExpanded ? 'rotate-180' : ''}`}>
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
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
                            );
                        })()}
                    </div>

                    {activeForm && (
                        <div
                            className="absolute inset-0 z-40 bg-black/5 backdrop-blur-[3px] animate-in fade-in transition-all duration-500 rounded-lg"
                            onClick={() => setActiveForm(null)}
                        />
                    )}

                    {activeForm && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white border-0 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] ring-1 ring-black/5 rounded-[2rem] p-6 w-full max-w-2xl text-left animate-in zoom-in-[0.98] fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex justify-between items-center mb-5 px-1">
                                <h4 className="text-sm font-bold text-black tracking-widest">{
                                    activeForm === 'buy' ? 'Buy Asset' : 'Sell Asset'
                                }</h4>
                                <button onClick={() => setActiveForm(null)} className="text-gray-400 hover:text-black bg-gray-50 hover:bg-gray-100 transition-colors p-1.5 rounded-full">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
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
                        </div>
                    )}

                    {messages.length > 0 && (
                        <div className="px-12 pb-8 pt-0 flex flex-col items-center relative z-50 mt-auto bg-gradient-to-t from-[#fafafa] via-[#fafafa] to-transparent shrink-0">
                            <div className="bg-white border border-gray-200 rounded-[2.5rem] p-3 w-full max-w-4xl flex items-center shadow-2xl shadow-black/5 hover:border-black/10 transition-all">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask your assistant..."
                                    className="flex-1 bg-transparent border-none outline-none text-black text-sm px-6 py-2 placeholder:text-gray-300 font-medium"
                                />
                                <button
                                    onClick={handleSend}
                                    className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 hover:scale-105 active:scale-95 transition-all shadow-lg shrink-0 mr-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Chat;
