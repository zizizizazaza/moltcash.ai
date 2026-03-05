
import React, { useState, useRef, useEffect } from 'react';

// --- Types ---

interface GroupMember {
    id: string;
    name: string;
    role: 'issuer' | 'investor' | 'agent';
    avatar: string;
    online: boolean;
}

interface PollOption {
    id: string;
    text: string;
    votes: string[]; // voter IDs
}

interface Poll {
    question: string;
    options: PollOption[];
    duration: string;
    createdAt: Date;
    status: 'active' | 'ended';
}

interface GroupMessage {
    id: string;
    senderId: string;
    senderName: string;
    role: 'issuer' | 'investor' | 'agent';
    content: string;
    timestamp: Date;
    image?: string;
    poll?: Poll;
}

interface GroupChat {
    id: string;
    projectName: string;
    projectShort: string;
    status: 'active' | 'completed';
    members: GroupMember[];
    messages: GroupMessage[];
    unread: number;
    lastActivity: string;
    fundedAmount: string;
    apy: string;
}

// --- Mock Data ---

const mockGroups: GroupChat[] = [
    {
        id: 'g1',
        projectName: 'ComputeDAO - GPU Expansion',
        projectShort: 'ComputeDAO',
        status: 'active',
        fundedAmount: '$500,000',
        apy: '15.5%',
        unread: 3,
        lastActivity: '2 min ago',
        members: [
            { id: 'u1', name: 'Alex Chen', role: 'issuer', avatar: '🧑‍💼', online: true },
            { id: 'u2', name: 'Sarah Kim', role: 'issuer', avatar: '👩‍💻', online: false },
            { id: 'u3', name: '0x71C...8e29', role: 'investor', avatar: '💎', online: true },
            { id: 'u4', name: '0xA3F...2d1a', role: 'investor', avatar: '🦊', online: true },
            { id: 'u5', name: '0xB8E...9c3f', role: 'investor', avatar: '🐋', online: false },
            { id: 'u6', name: '0x5D2...7e4b', role: 'investor', avatar: '🎯', online: false },
            { id: 'agent1', name: 'Loka Agent', role: 'agent', avatar: '🤖', online: true },
        ],
        messages: [
            { id: 'm1', senderId: 'agent1', senderName: 'Loka Agent', role: 'agent', content: '🎉 Group created! ComputeDAO - GPU Expansion has been fully funded. All stakeholders are now connected.', timestamp: new Date(Date.now() - 86400000 * 2) },
            { id: 'm2', senderId: 'u1', senderName: 'Alex Chen', role: 'issuer', content: 'Thank you everyone for your support! We are excited to begin the GPU cluster expansion. First batch of H100s arrives next week.', timestamp: new Date(Date.now() - 86400000 * 2 + 3600000) },
            { id: 'm3', senderId: 'u3', senderName: '0x71C...8e29', role: 'investor', content: 'Great to hear! What\'s the expected timeline for the first revenue payout?', timestamp: new Date(Date.now() - 86400000) },
            { id: 'm4', senderId: 'agent1', senderName: 'Loka Agent', role: 'agent', content: '📊 Based on the project terms: first interest distribution is scheduled for Day 30. Current projected APY remains at 15.5%. I\'ll send automated updates as milestones are reached.', timestamp: new Date(Date.now() - 86400000 + 600000) },
            { id: 'm5', senderId: 'u2', senderName: 'Sarah Kim', role: 'issuer', content: 'We\'ve secured the data center lease. Infrastructure setup begins Monday. Will share photos of the rack installation.', timestamp: new Date(Date.now() - 3600000 * 5) },
            { id: 'm6', senderId: 'u4', senderName: '0xA3F...2d1a', role: 'investor', content: 'Looking forward to it! Transparency is key 🔑', timestamp: new Date(Date.now() - 3600000 * 3) },
            { id: 'm7', senderId: 'agent1', senderName: 'Loka Agent', role: 'agent', content: '✅ Milestone Update: Data center lease verified on-chain. Contract hash: 0x8f2a...3b4c. Compliance check passed.', timestamp: new Date(Date.now() - 3600000 * 2) },
            {
                id: 'm_poll1', senderId: 'u1', senderName: 'Alex Chen', role: 'issuer', content: '', timestamp: new Date(Date.now() - 3600000),
                poll: {
                    question: 'Should we prioritize H100 or A100 GPUs for the first batch?',
                    options: [
                        { id: 'o1', text: 'H100 (Higher performance)', votes: ['u3', 'u4', 'u1', 'agent1'] },
                        { id: 'o2', text: 'A100 (Better cost efficiency)', votes: ['u5', 'u2'] },
                        { id: 'o3', text: 'Mix of both', votes: ['u6'] },
                    ],
                    duration: '1d',
                    createdAt: new Date(Date.now() - 3600000),
                    status: 'active',
                }
            },
            { id: 'm8', senderId: 'u1', senderName: 'Alex Chen', role: 'issuer', content: 'Hardware shipment tracking is live. We\'re on schedule for the 60-day deployment plan.', timestamp: new Date(Date.now() - 600000) },
        ]
    },
    {
        id: 'g2',
        projectName: 'Shopify Merchant Cluster X',
        projectShort: 'ShopifyMerch',
        status: 'active',
        fundedAmount: '$185,000',
        apy: '8.9%',
        unread: 0,
        lastActivity: '1 hour ago',
        members: [
            { id: 'u10', name: 'Mike Johnson', role: 'issuer', avatar: '👨‍💼', online: true },
            { id: 'u11', name: '0x71C...8e29', role: 'investor', avatar: '💎', online: true },
            { id: 'u12', name: '0xC4D...5f2e', role: 'investor', avatar: '🌟', online: false },
            { id: 'u13', name: '0xE7F...8a1b', role: 'investor', avatar: '🔮', online: false },
            { id: 'agent2', name: 'Loka Agent', role: 'agent', avatar: '🤖', online: true },
        ],
        messages: [
            { id: 'sm1', senderId: 'agent2', senderName: 'Loka Agent', role: 'agent', content: '🎉 Group created! Shopify Merchant Cluster X has reached 93% funding and is now active.', timestamp: new Date(Date.now() - 86400000 * 5) },
            { id: 'sm2', senderId: 'u10', senderName: 'Mike Johnson', role: 'issuer', content: 'Welcome everyone! We\'re processing our first batch of receivables this week.', timestamp: new Date(Date.now() - 86400000 * 4) },
            { id: 'sm3', senderId: 'u11', senderName: '0x71C...8e29', role: 'investor', content: 'What\'s the average receivable cycle time?', timestamp: new Date(Date.now() - 86400000 * 3) },
            { id: 'sm4', senderId: 'u10', senderName: 'Mike Johnson', role: 'issuer', content: 'Typically 15-30 days for Shopify merchants. We factor at a 2-3% discount.', timestamp: new Date(Date.now() - 86400000 * 3 + 1800000) },
            { id: 'sm5', senderId: 'agent2', senderName: 'Loka Agent', role: 'agent', content: '📈 Weekly Report: $23,400 in receivables processed. Default rate: 0%. On track for projected 8.9% APY.', timestamp: new Date(Date.now() - 3600000) },
        ]
    }
];

// --- Component ---

// --- Available Agents Catalog ---
interface AvailableAgent {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: string;
    color: string;
}

const AGENT_CATEGORIES = [
    { key: 'risk', label: 'Risk Management', icon: '🛡️' },
    { key: 'investment', label: 'Investment Analysis', icon: '📊' },
    { key: 'operations', label: 'Operations', icon: '⚙️' },
    { key: 'compliance', label: 'Compliance & Legal', icon: '📜' },
    { key: 'defi', label: 'DeFi & On-chain', icon: '🔗' },
    { key: 'social', label: 'Social & Community', icon: '💬' },
];

const AVAILABLE_AGENTS: AvailableAgent[] = [
    // Risk Management
    { id: 'risk_assessment', name: 'Risk Assessor', description: 'Real-time credit scoring & borrower risk analysis using on-chain data', category: 'risk', icon: '🛡️', color: 'from-red-400 to-orange-500' },
    { id: 'portfolio_risk', name: 'Portfolio Risk Monitor', description: 'Monitors concentration risk, liquidation thresholds & VaR metrics', category: 'risk', icon: '📉', color: 'from-amber-400 to-red-500' },
    { id: 'fraud_detector', name: 'Fraud Detector', description: 'ML-powered anomaly detection across transactions and wallet activities', category: 'risk', icon: '🔍', color: 'from-rose-400 to-pink-600' },
    // Investment Analysis
    { id: 'yield_optimizer', name: 'Yield Optimizer', description: 'Identifies optimal yield strategies across DeFi protocols', category: 'investment', icon: '💎', color: 'from-blue-400 to-indigo-500' },
    { id: 'market_analyst', name: 'Market Analyst', description: 'Token price prediction, sentiment analysis & market trend reporting', category: 'investment', icon: '📈', color: 'from-green-400 to-emerald-500' },
    { id: 'fundamental_analyst', name: 'Fundamental Analyst', description: 'Deep-dive analysis on project financials, team & tokenomics', category: 'investment', icon: '🧮', color: 'from-cyan-400 to-blue-500' },
    { id: 'arb_scanner', name: 'Arbitrage Scanner', description: 'Scans cross-chain and cross-DEX arbitrage opportunities in real-time', category: 'investment', icon: '⚡', color: 'from-yellow-400 to-amber-500' },
    // Operations
    { id: 'treasury_manager', name: 'Treasury Manager', description: 'Automated treasury rebalancing, cash flow forecasting & reporting', category: 'operations', icon: '🏦', color: 'from-violet-400 to-purple-500' },
    { id: 'milestone_tracker', name: 'Milestone Tracker', description: 'Tracks project milestones, deliverables & sends automated alerts', category: 'operations', icon: '🎯', color: 'from-teal-400 to-cyan-500' },
    { id: 'report_generator', name: 'Report Generator', description: 'Generates weekly/monthly performance reports for stakeholders', category: 'operations', icon: '📋', color: 'from-indigo-400 to-blue-500' },
    // Compliance & Legal
    { id: 'kyc_verifier', name: 'KYC/AML Verifier', description: 'Automated identity verification and anti-money laundering checks', category: 'compliance', icon: '✅', color: 'from-emerald-400 to-green-500' },
    { id: 'regulatory_monitor', name: 'Regulatory Monitor', description: 'Monitors regulatory changes across jurisdictions impacting your assets', category: 'compliance', icon: '⚖️', color: 'from-slate-400 to-gray-600' },
    { id: 'contract_auditor', name: 'Smart Contract Auditor', description: 'Continuous smart contract monitoring for vulnerabilities & exploits', category: 'compliance', icon: '🔐', color: 'from-orange-400 to-red-500' },
    // DeFi & On-chain
    { id: 'liquidity_monitor', name: 'Liquidity Monitor', description: 'Tracks pool liquidity, impermanent loss & LP position health', category: 'defi', icon: '🌊', color: 'from-sky-400 to-blue-500' },
    { id: 'gas_optimizer', name: 'Gas Optimizer', description: 'Optimizes transaction timing and gas costs across EVM chains', category: 'defi', icon: '⛽', color: 'from-lime-400 to-green-500' },
    { id: 'bridge_monitor', name: 'Bridge Monitor', description: 'Monitors cross-chain bridge health, delays & security incidents', category: 'defi', icon: '🌉', color: 'from-purple-400 to-pink-500' },
    // Social & Community
    { id: 'sentiment_analyzer', name: 'Sentiment Analyzer', description: 'Tracks social media sentiment across Twitter, Discord & Telegram', category: 'social', icon: '💬', color: 'from-pink-400 to-rose-500' },
    { id: 'governance_assistant', name: 'Governance Assistant', description: 'Summarizes proposals, tracks voting results & alerts on key votes', category: 'social', icon: '🗳️', color: 'from-fuchsia-400 to-purple-500' },
];

const Groups: React.FC = () => {
    const [selectedGroup, setSelectedGroup] = useState<string>(mockGroups[0].id);
    const [inputValue, setInputValue] = useState('');
    const [localMessages, setLocalMessages] = useState<Record<string, GroupMessage[]>>(() => {
        const init: Record<string, GroupMessage[]> = {};
        mockGroups.forEach(g => { init[g.id] = [...g.messages]; });
        return init;
    });
    const [showMembers, setShowMembers] = useState(true);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [showPollModal, setShowPollModal] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [pollDuration, setPollDuration] = useState('1d');
    const [showAgentModal, setShowAgentModal] = useState(false);
    const [agentSearch, setAgentSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [addedAgents, setAddedAgents] = useState<Record<string, string[]>>(() => {
        // Initialize: no extra agents added by default (Loka Agent is built-in)
        const init: Record<string, string[]> = {};
        mockGroups.forEach(g => { init[g.id] = []; });
        return init;
    });
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textInputRef = useRef<HTMLInputElement>(null);

    const currentGroup = mockGroups.find(g => g.id === selectedGroup)!;
    const currentMessages = localMessages[selectedGroup] || [];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentMessages.length, selectedGroup]);

    // --- Image ---
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target?.result as string);
        reader.readAsDataURL(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // --- Send Message ---
    const handleSend = () => {
        if (!inputValue.trim() && !imagePreview) return;
        const newMsg: GroupMessage = {
            id: `user_${Date.now()}`,
            senderId: 'u3',
            senderName: '0x71C...8e29',
            role: 'investor',
            content: inputValue.trim(),
            timestamp: new Date(),
            image: imagePreview || undefined,
        };
        setLocalMessages(prev => ({
            ...prev,
            [selectedGroup]: [...(prev[selectedGroup] || []), newMsg],
        }));
        const capturedInput = inputValue.trim();
        setInputValue('');
        setImagePreview(null);

        if (capturedInput) {
            setTimeout(() => {
                const agentReply: GroupMessage = {
                    id: `agent_${Date.now()}`,
                    senderId: 'agent1',
                    senderName: 'Loka Agent',
                    role: 'agent',
                    content: getAgentReply(capturedInput),
                    timestamp: new Date(),
                };
                setLocalMessages(prev => ({
                    ...prev,
                    [selectedGroup]: [...(prev[selectedGroup] || []), agentReply],
                }));
            }, 1200);
        }
    };

    // --- Poll ---
    const handlePostPoll = () => {
        const validOptions = pollOptions.filter(o => o.trim());
        if (!pollQuestion.trim() || validOptions.length < 2) return;
        const pollMsg: GroupMessage = {
            id: `poll_${Date.now()}`,
            senderId: 'u3',
            senderName: '0x71C...8e29',
            role: 'investor',
            content: '',
            timestamp: new Date(),
            poll: {
                question: pollQuestion.trim(),
                options: validOptions.map((text, i) => ({
                    id: `po_${Date.now()}_${i}`,
                    text: text.trim(),
                    votes: [],
                })),
                duration: pollDuration,
                createdAt: new Date(),
                status: 'active',
            },
        };
        setLocalMessages(prev => ({
            ...prev,
            [selectedGroup]: [...(prev[selectedGroup] || []), pollMsg],
        }));
        setShowPollModal(false);
        setPollQuestion('');
        setPollOptions(['', '']);
        setPollDuration('1d');
    };

    const handleVote = (msgId: string, optionId: string) => {
        setLocalMessages(prev => {
            const msgs = prev[selectedGroup] || [];
            return {
                ...prev,
                [selectedGroup]: msgs.map(m => {
                    if (m.id !== msgId || !m.poll) return m;
                    const alreadyVoted = m.poll.options.some(o => o.votes.includes('u3'));
                    if (alreadyVoted) return m;
                    return {
                        ...m,
                        poll: {
                            ...m.poll,
                            options: m.poll.options.map(o =>
                                o.id === optionId ? { ...o, votes: [...o.votes, 'u3'] } : o
                            ),
                        },
                    };
                }),
            };
        });
    };

    const getAgentReply = (msg: string): string => {
        const lower = msg.toLowerCase();
        if (lower.includes('status') || lower.includes('update')) return '📊 Project Status: All milestones on track. Next payout in 12 days. No anomalies detected.';
        if (lower.includes('risk') || lower.includes('safe')) return '🛡️ Risk Assessment: Current risk level is LOW. Collateral ratio at 1.35x. All compliance checks passed.';
        if (lower.includes('revenue') || lower.includes('earning')) return '💰 Revenue Update: Estimated monthly revenue at $12,400. Running above projections by 8.2%.';
        if (lower.includes('when') || lower.includes('payout')) return '📅 Next interest distribution: scheduled for March 15, 2026. Amount will be proportional to your holding.';
        return '👋 Thanks for your message! I\'m monitoring this project 24/7. Feel free to ask about project status, risk assessment, revenue updates, or payout schedules.';
    };

    const formatTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'issuer': return <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded-md">Issuer</span>;
            case 'agent': return <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-black rounded-md">AI Agent</span>;
            case 'investor': return <span className="px-1.5 py-0.5 bg-green-50 text-green-600 text-[9px] font-black rounded-md">Investor</span>;
            default: return null;
        }
    };

    const getMsgBubbleStyle = (role: string, isMe: boolean) => {
        if (isMe) return 'bg-black text-white rounded-2xl rounded-br-md';
        if (role === 'agent') return 'bg-gradient-to-br from-purple-50 to-blue-50 text-black border border-purple-100/50 rounded-2xl rounded-bl-md';
        if (role === 'issuer') return 'bg-blue-50 text-black border border-blue-100/50 rounded-2xl rounded-bl-md';
        return 'bg-gray-100 text-black rounded-2xl rounded-bl-md';
    };

    // --- Render Poll Card ---
    const renderPoll = (poll: Poll, msgId: string) => {
        const totalVotes = poll.options.reduce((sum, o) => sum + o.votes.length, 0);
        const hasVoted = poll.options.some(o => o.votes.includes('u3'));
        const maxVotes = Math.max(...poll.options.map(o => o.votes.length));
        return (
            <div className="w-[380px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Poll Header */}
                <div className="px-5 pt-5 pb-3">
                    <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        <span className="text-[10px] font-bold text-blue-500 tracking-wide uppercase">Poll</span>
                    </div>
                    <h4 className="text-sm font-bold text-black leading-snug">{poll.question}</h4>
                </div>
                {/* Options */}
                <div className="px-5 pb-2 space-y-2">
                    {poll.options.map(option => {
                        const pct = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0;
                        const isLeading = option.votes.length === maxVotes && maxVotes > 0;
                        const iVoted = option.votes.includes('u3');
                        return (
                            <button
                                key={option.id}
                                onClick={() => !hasVoted && handleVote(msgId, option.id)}
                                disabled={hasVoted}
                                className={`w-full relative rounded-xl overflow-hidden transition-all text-left ${hasVoted ? 'cursor-default' : 'cursor-pointer hover:shadow-md active:scale-[0.99]'
                                    } ${iVoted ? 'ring-2 ring-blue-400' : ''}`}
                            >
                                {/* Background bar */}
                                <div className="absolute inset-0 rounded-xl bg-gray-50" />
                                {hasVoted && (
                                    <div
                                        className={`absolute inset-y-0 left-0 rounded-xl transition-all duration-700 ${isLeading ? 'bg-blue-100' : 'bg-gray-100'}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                )}
                                <div className="relative flex items-center justify-between px-4 py-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                        {!hasVoted && (
                                            <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
                                        )}
                                        {hasVoted && iVoted && (
                                            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                        )}
                                        {hasVoted && !iVoted && (
                                            <div className="w-4 h-4 rounded-full border-2 border-gray-200 shrink-0" />
                                        )}
                                        <span className={`text-[13px] truncate ${isLeading && hasVoted ? 'font-bold text-black' : 'font-medium text-gray-700'}`}>
                                            {option.text}
                                        </span>
                                        {isLeading && hasVoted && totalVotes > 1 && (
                                            <span className="text-sm">🏆</span>
                                        )}
                                    </div>
                                    {hasVoted && (
                                        <span className={`text-sm font-black shrink-0 ml-3 ${isLeading ? 'text-blue-600' : 'text-gray-400'}`}>
                                            {pct}%
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
                {/* Footer */}
                <div className="px-5 py-3 flex items-center justify-between border-t border-gray-50">
                    <span className="text-[11px] text-gray-400 font-medium">{totalVotes} voted</span>
                    <span className={`text-[11px] font-bold ${poll.status === 'ended' ? 'text-red-400' : 'text-green-500'}`}>
                        {poll.status === 'ended' ? 'Ended' : `${poll.duration} remaining`}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-full overflow-hidden animate-fadeIn">
            {/* --- Poll Modal --- */}
            {showPollModal && (
                <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center" onClick={() => setShowPollModal(false)}>
                    <div className="bg-white rounded-3xl w-[420px] max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <h3 className="text-xl font-black text-black">Create Poll</h3>
                            <p className="text-xs text-gray-400 mt-1">Ask the group to vote on a decision</p>

                            {/* Question */}
                            <div className="mt-6">
                                <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Question</label>
                                <input
                                    type="text"
                                    value={pollQuestion}
                                    onChange={e => setPollQuestion(e.target.value)}
                                    placeholder="What would you like to ask?"
                                    className="w-full mt-2 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-gray-300 focus:bg-white transition-all placeholder:text-gray-300"
                                />
                            </div>

                            {/* Options */}
                            <div className="mt-5">
                                <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Options</label>
                                <div className="mt-2 space-y-2">
                                    {pollOptions.map((opt, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={opt}
                                                onChange={e => {
                                                    const next = [...pollOptions];
                                                    next[i] = e.target.value;
                                                    setPollOptions(next);
                                                }}
                                                placeholder={`Option ${i + 1}`}
                                                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-gray-300 focus:bg-white transition-all placeholder:text-gray-300"
                                            />
                                            {pollOptions.length > 2 && (
                                                <button
                                                    onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}
                                                    className="w-8 h-8 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 flex items-center justify-center transition-colors shrink-0"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {pollOptions.length < 6 && (
                                    <button
                                        onClick={() => setPollOptions([...pollOptions, ''])}
                                        className="mt-2 text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                        Add Option
                                    </button>
                                )}
                            </div>

                            {/* Duration */}
                            <div className="mt-5">
                                <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Duration</label>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    {['1h', '2h', '6h', '12h', '1d', '2d', '3d'].map(d => (
                                        <button
                                            key={d}
                                            onClick={() => setPollDuration(d)}
                                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${pollDuration === d
                                                ? 'bg-black text-white shadow-sm'
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }`}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setShowPollModal(false)}
                                    className="flex-1 py-3 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePostPoll}
                                    disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
                                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-black hover:bg-gray-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                                >
                                    Post Poll
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Left: Group List --- */}
            <div className="w-80 border-r border-gray-100 flex flex-col bg-white shrink-0">
                <div className="p-5 border-b border-gray-100">
                    <h2 className="text-lg font-black text-black tracking-tight">Groups</h2>
                    <p className="text-[11px] text-gray-400 font-medium mt-1">Project stakeholder channels</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {mockGroups.map(group => (
                        <button
                            key={group.id}
                            onClick={() => setSelectedGroup(group.id)}
                            className={`w-full text-left p-4 border-b border-gray-50 transition-all hover:bg-gray-50 ${selectedGroup === group.id ? 'bg-green-50/50 border-r-2 border-r-green-500 border-l-0' : ''}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-white text-sm font-black shrink-0 shadow-sm">
                                        {group.projectShort.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-xs font-bold text-black truncate">{group.projectName}</h3>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className="text-[10px] text-gray-400 font-medium">{group.members.length} members</span>
                                            <span className="text-gray-300">·</span>
                                            <span className="text-[10px] text-gray-400 font-medium">{group.lastActivity}</span>
                                        </div>
                                    </div>
                                </div>
                                {group.unread > 0 && (
                                    <span className="bg-black text-white text-[9px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 shrink-0">
                                        {group.unread}
                                    </span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* --- Right: Chat Area --- */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-sm">
                            {currentGroup.projectShort.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-black">{currentGroup.projectName}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-gray-400 font-medium">{currentGroup.fundedAmount} funded</span>
                                <span className="text-gray-300">·</span>
                                <span className="text-[10px] text-green-600 font-bold">{currentGroup.apy} APY</span>
                                <span className="text-gray-300">·</span>
                                <span className="text-[10px] text-gray-400 font-medium">{currentGroup.members.length} members</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowMembers(!showMembers)}
                        className={`p-2 rounded-xl transition-colors ${showMembers ? 'bg-gray-100 text-black' : 'text-gray-400 hover:text-black hover:bg-gray-50'}`}
                        title="Toggle Members"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </button>
                </div>

                {/* Chat Body */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Messages */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                            {currentMessages.map((msg, i) => {
                                const isMe = msg.senderId === 'u3';
                                const showAvatar = i === 0 || currentMessages[i - 1].senderId !== msg.senderId;
                                return (
                                    <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                        {showAvatar ? (
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${msg.role === 'agent' ? 'bg-gradient-to-br from-purple-400 to-blue-500 shadow-sm' : msg.role === 'issuer' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                                {msg.role === 'agent' ? '🤖' : msg.role === 'issuer' ? '🧑‍💼' : '💎'}
                                            </div>
                                        ) : (
                                            <div className="w-8 shrink-0" />
                                        )}
                                        <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                            {showAvatar && (
                                                <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                    <span className="text-[11px] font-bold text-gray-700">{msg.senderName}</span>
                                                    {getRoleBadge(msg.role)}
                                                </div>
                                            )}
                                            {/* Poll */}
                                            {msg.poll ? (
                                                renderPoll(msg.poll, msg.id)
                                            ) : (
                                                <div className={`px-4 py-2.5 text-[13px] leading-relaxed ${getMsgBubbleStyle(msg.role, isMe)}`}>
                                                    {msg.image && (
                                                        <img src={msg.image} alt="shared" className="rounded-xl max-w-[280px] max-h-[200px] object-cover mb-2 shadow-sm" />
                                                    )}
                                                    {msg.content && <span>{msg.content}</span>}
                                                </div>
                                            )}
                                            <span className={`text-[9px] text-gray-300 font-medium mt-1 block ${isMe ? 'text-right' : ''}`}>
                                                {formatTime(msg.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Enhanced Input */}
                        <div className="px-5 py-4 bg-gray-50/50 shrink-0">
                            {imagePreview && (
                                <div className="mb-3 relative inline-block">
                                    <img src={imagePreview} alt="preview" className="max-h-[120px] rounded-xl border border-gray-100 shadow-sm" />
                                    <button
                                        onClick={() => setImagePreview(null)}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors shadow-lg"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            )}

                            <div className={`flex items-end gap-2 rounded-2xl border bg-white transition-all shadow-sm ${isFocused ? 'border-gray-300 shadow-md' : 'border-gray-200'}`}>
                                <div className="flex items-center gap-0.5 pl-2 pb-2.5 pt-2.5 shrink-0">
                                    <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-all active:scale-90"
                                        title="Upload Image"
                                    >
                                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </button>
                                    <button
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-all active:scale-90"
                                        title="Attach File"
                                    >
                                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                    </button>
                                    <button
                                        onClick={() => setShowPollModal(true)}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-all active:scale-90"
                                        title="Create Poll"
                                    >
                                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                    </button>
                                </div>

                                <input
                                    ref={textInputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    placeholder="Type a message..."
                                    className="flex-1 py-3 bg-transparent text-sm focus:outline-none placeholder:text-gray-300 min-w-0"
                                />

                                <div className="pr-2 pb-2 pt-2 shrink-0">
                                    <button
                                        onClick={handleSend}
                                        disabled={!inputValue.trim() && !imagePreview}
                                        className="w-9 h-9 bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-90 shadow-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Members Panel */}
                    {showMembers && (
                        <div className="w-64 border-l border-gray-100 bg-white overflow-y-auto shrink-0">
                            <div className="p-4 border-b border-gray-50">
                                <h4 className="text-xs font-black text-black tracking-tight">Members ({currentGroup.members.length + (addedAgents[selectedGroup]?.length || 0)})</h4>
                            </div>
                            <div className="p-2">
                                {(['agent', 'issuer', 'investor'] as const).map(role => {
                                    const roleMembers = currentGroup.members.filter(m => m.role === role);
                                    const extraAgents = role === 'agent' ? (addedAgents[selectedGroup] || []).map(agentId => AVAILABLE_AGENTS.find(a => a.id === agentId)!).filter(Boolean) : [];
                                    if (roleMembers.length === 0 && extraAgents.length === 0) return null;
                                    const roleLabel = role === 'agent' ? 'AI Agent' : role === 'issuer' ? 'Project Team' : 'Investors';
                                    return (
                                        <div key={role} className="mb-4">
                                            <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase px-2 mb-2">{roleLabel}</p>
                                            {roleMembers.map(member => (
                                                <div key={member.id} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                                                    <div className="relative">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${role === 'agent' ? 'bg-gradient-to-br from-purple-400 to-blue-500' : role === 'issuer' ? 'bg-blue-50' : 'bg-gray-100'}`}>
                                                            {member.avatar}
                                                        </div>
                                                        {member.online && (
                                                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-black truncate">{member.name}</p>
                                                        <p className="text-[9px] text-gray-400 font-medium capitalize">{role === 'agent' ? 'Always Online' : member.online ? 'Online' : 'Offline'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {/* Extra added agents */}
                                            {extraAgents.map(agent => (
                                                <div key={agent.id} className="group flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                                                    <div className="relative">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm bg-gradient-to-br ${agent.color}`}>
                                                            {agent.icon}
                                                        </div>
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-bold text-black truncate">{agent.name}</p>
                                                        <p className="text-[9px] text-gray-400 font-medium">Always Online</p>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setAddedAgents(prev => ({
                                                                ...prev,
                                                                [selectedGroup]: (prev[selectedGroup] || []).filter(id => id !== agent.id),
                                                            }));
                                                        }}
                                                        className="w-5 h-5 rounded-md opacity-0 group-hover:opacity-100 bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-all"
                                                        title="Remove Agent"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>
                                                    </button>
                                                </div>
                                            ))}
                                            {/* Add Agent Button Component */}
                                            {role === 'agent' && (
                                                <button
                                                    onClick={() => setShowAgentModal(true)}
                                                    className="w-full mt-1 flex items-center gap-3 px-2 py-2 rounded-xl text-left hover:bg-gray-50 transition-colors group"
                                                >
                                                    <div className="relative">
                                                        <div className="w-8 h-8 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 group-hover:border-black group-hover:text-black transition-colors bg-gray-50/50 group-hover:bg-white shrink-0">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                                        </div>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-bold text-gray-500 group-hover:text-black transition-colors">Add Agent</p>
                                                        <p className="text-[9px] text-gray-400 font-medium truncate">Explore marketplace</p>
                                                    </div>
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* --- Agent Marketplace Modal --- */}
                    {showAgentModal && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center animate-fadeIn" onClick={() => { setShowAgentModal(false); setAgentSearch(''); setSelectedCategory(null); }}>
                            <div
                                className="bg-white rounded-3xl w-[720px] max-h-[80vh] shadow-2xl flex flex-col overflow-hidden"
                                onClick={e => e.stopPropagation()}
                                style={{ animation: 'slideUp 0.3s ease-out' }}
                            >
                                {/* Modal Header */}
                                <div className="p-6 pb-4 border-b border-gray-100 shrink-0">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xl font-black text-black">Agent Marketplace</h3>
                                            <p className="text-xs text-gray-400 mt-1">Add AI agents to enhance your group's capabilities</p>
                                        </div>
                                        <button
                                            onClick={() => { setShowAgentModal(false); setAgentSearch(''); setSelectedCategory(null); }}
                                            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-black transition-all"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                    {/* Search */}
                                    <div className="mt-4 relative">
                                        <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                        <input
                                            type="text"
                                            value={agentSearch}
                                            onChange={e => setAgentSearch(e.target.value)}
                                            placeholder="Search agents..."
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-gray-300 focus:bg-white transition-all placeholder:text-gray-300"
                                            autoFocus
                                        />
                                    </div>
                                    {/* Category Filter */}
                                    <div className="mt-3 flex gap-1.5 flex-wrap">
                                        <button
                                            onClick={() => setSelectedCategory(null)}
                                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${!selectedCategory ? 'bg-black text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                        >
                                            All
                                        </button>
                                        {AGENT_CATEGORIES.map(cat => (
                                            <button
                                                key={cat.key}
                                                onClick={() => setSelectedCategory(selectedCategory === cat.key ? null : cat.key)}
                                                className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${selectedCategory === cat.key ? 'bg-black text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                            >
                                                {cat.icon} {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Agent List */}
                                <div className="flex-1 overflow-y-auto p-6 pt-4">
                                    {(() => {
                                        const searchLower = agentSearch.toLowerCase();
                                        const filtered = AVAILABLE_AGENTS.filter(a => {
                                            const matchesSearch = !agentSearch || a.name.toLowerCase().includes(searchLower) || a.description.toLowerCase().includes(searchLower);
                                            const matchesCategory = !selectedCategory || a.category === selectedCategory;
                                            return matchesSearch && matchesCategory;
                                        });
                                        const currentGroupAddedAgents = addedAgents[selectedGroup] || [];

                                        if (filtered.length === 0) {
                                            return (
                                                <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                                                    <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    <p className="text-sm font-bold">No agents found</p>
                                                    <p className="text-xs mt-1">Try adjusting your search or filter</p>
                                                </div>
                                            );
                                        }

                                        // Group by category
                                        const grouped: Record<string, AvailableAgent[]> = {};
                                        filtered.forEach(a => {
                                            if (!grouped[a.category]) grouped[a.category] = [];
                                            grouped[a.category].push(a);
                                        });

                                        return Object.entries(grouped).map(([catKey, agents]) => {
                                            const catInfo = AGENT_CATEGORIES.find(c => c.key === catKey);
                                            return (
                                                <div key={catKey} className="mb-6 last:mb-0">
                                                    <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-3 flex items-center gap-1.5">
                                                        <span>{catInfo?.icon}</span> {catInfo?.label}
                                                    </p>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {agents.map(agent => {
                                                            const isAdded = currentGroupAddedAgents.includes(agent.id);
                                                            return (
                                                                <div
                                                                    key={agent.id}
                                                                    className={`relative p-4 rounded-2xl border transition-all cursor-pointer group ${isAdded
                                                                        ? 'bg-green-50/50 border-green-200 shadow-sm'
                                                                        : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-md'
                                                                        }`}
                                                                    onClick={() => {
                                                                        if (isAdded) {
                                                                            setAddedAgents(prev => ({
                                                                                ...prev,
                                                                                [selectedGroup]: (prev[selectedGroup] || []).filter(id => id !== agent.id),
                                                                            }));
                                                                        } else {
                                                                            setAddedAgents(prev => ({
                                                                                ...prev,
                                                                                [selectedGroup]: [...(prev[selectedGroup] || []), agent.id],
                                                                            }));
                                                                        }
                                                                    }}
                                                                >
                                                                    <div className="flex items-start gap-3">
                                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br ${agent.color} shadow-sm shrink-0`}>
                                                                            {agent.icon}
                                                                        </div>
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="text-sm font-bold text-black truncate">{agent.name}</p>
                                                                            <p className="text-[11px] text-gray-400 leading-snug mt-0.5 line-clamp-2">{agent.description}</p>
                                                                        </div>
                                                                    </div>
                                                                    {/* Add/Added indicator */}
                                                                    <div className="absolute top-3 right-3">
                                                                        {isAdded ? (
                                                                            <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center shadow-sm">
                                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 group-hover:bg-black group-hover:text-white flex items-center justify-center transition-all">
                                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>

                                {/* Modal Footer */}
                                <div className="p-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-gray-400">
                                            <span className="font-bold text-black">{(addedAgents[selectedGroup] || []).length}</span> agent{(addedAgents[selectedGroup] || []).length !== 1 ? 's' : ''} added to this group
                                        </p>
                                        <button
                                            onClick={() => { setShowAgentModal(false); setAgentSearch(''); setSelectedCategory(null); }}
                                            className="px-6 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-sm active:scale-95"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Groups;
