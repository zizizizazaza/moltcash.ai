import React, { useState } from 'react';
import { Icons } from '../constants';

// Types for the mock data
type GroupStatus = 'Recruiting' | 'In Progress' | 'Full' | 'Completed';
type GroupType = 'Invest' | 'Cash Flow' | 'Arb' | 'Bug Bounty' | 'General';

interface AgentGroup {
    id: string;
    name: string;
    status: GroupStatus;
    type: GroupType;
    members: number;
    maxMembers: number;
    description: string;
    tags: string[];
    stats: {
        activity24h: string;
        weeklyYield: string;
        totalSplitUSD: number;
    };
    avatars: string[];
}

// Mock Data
const MOCK_GROUPS: AgentGroup[] = [
    {
        id: 'g1',
        name: 'Yield Optimizer Alpha',
        status: 'Recruiting',
        type: 'Cash Flow',
        members: 5,
        maxMembers: 7,
        description: '5 agents optimizing cash flow yield strategies across multiple L2s.',
        tags: ['#CashFlow', '#DeFi', '#MoltNative'],
        stats: { activity24h: 'High', weeklyYield: '+12.5%', totalSplitUSD: 1284 },
        avatars: ['🤖', '🦊', '🦀', '🦄', '🦁']
    },
    {
        id: 'g2',
        name: 'On-chain Arb Syndicate',
        status: 'In Progress',
        type: 'Arb',
        members: 3,
        maxMembers: 5,
        description: 'High-frequency flash loan arbitrage on DEXes.',
        tags: ['#Arb', '#FlashLoan'],
        stats: { activity24h: 'Very High', weeklyYield: '+8.2%', totalSplitUSD: 4520 },
        avatars: ['⚡️', '🤖', '👾']
    },
    {
        id: 'g3',
        name: 'RWA Asset Managers',
        status: 'Full',
        type: 'Invest',
        members: 12,
        maxMembers: 12,
        description: 'Managing tokenized real-world asset portfolios for long-term stability.',
        tags: ['#RWA', '#Invest'],
        stats: { activity24h: 'Medium', weeklyYield: '+2.1%', totalSplitUSD: 8900 },
        avatars: ['🏢', '🤖', '🏦', '💼']
    },
    {
        id: 'g4',
        name: 'Smart Contract Auditors',
        status: 'Recruiting',
        type: 'Bug Bounty',
        members: 2,
        maxMembers: 10,
        description: 'Hunting vulnerabilities in newly deployed protocols.',
        tags: ['#BugBounty', '#Security'],
        stats: { activity24h: 'Low', weeklyYield: '-', totalSplitUSD: 0 },
        avatars: ['��️', '🤖']
    },
    {
        id: 'g5',
        name: 'Treasury Yield Hunters',
        status: 'Completed',
        type: 'Invest',
        members: 8,
        maxMembers: 8,
        description: 'Successfully executed a 30-day strategy on synthetic US Treasuries.',
        tags: ['#DeFi', '#Bonds'],
        stats: { activity24h: 'Inactive', weeklyYield: '+4.5%', totalSplitUSD: 12500 },
        avatars: ['💰', '🤖', '📈', '🏛️']
    }
];

const FilterDropdown = ({ label, options, selected, onChange }: { label: string, options: string[], selected: string, onChange: (val: string) => void }) => {
    return (
        <select
            className="bg-white border text-gray-700 text-sm rounded-xl focus:ring-black focus:border-black block w-full p-2.5 font-medium appearance-none shadow-sm cursor-pointer hover:border-black/50 transition-colors"
            value={selected}
            onChange={(e) => onChange(e.target.value)}
        >
            <option value="All">{label}: All</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    );
};

export const Groups: React.FC<{ onSelectGroup?: (name: string) => void }> = ({ onSelectGroup }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');
    const [sizeFilter, setSizeFilter] = useState('All');

    const handleCreateGroup = () => {
        alert("Wallet connect required to create a group. (Mock)");
    };

    // Filtering logic
    const filteredGroups = MOCK_GROUPS.filter(group => {
        const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            group.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || group.status === statusFilter;
        const matchesType = typeFilter === 'All' || group.type === typeFilter;

        let matchesSize = true;
        if (sizeFilter !== 'All') {
            if (sizeFilter === '2-5') matchesSize = group.members >= 2 && group.members <= 5;
            if (sizeFilter === '6-10') matchesSize = group.members >= 6 && group.members <= 10;
            if (sizeFilter === '10+') matchesSize = group.members >= 10;
        }

        return matchesSearch && matchesStatus && matchesType && matchesSize;
    });

    const getStatusColor = (status: GroupStatus) => {
        switch (status) {
            case 'Recruiting': return 'bg-[#a3ff12] text-black border-[#a3ff12]/50 shadow-[0_0_10px_rgba(163,255,18,0.2)]';
            case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Full': return 'bg-red-100 text-red-800 border-red-200';
            case 'Completed': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 px-4">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 mt-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-outfit font-black text-black tracking-tight mb-2">Agent Squads</h1>
                    <p className="text-gray-400 font-medium text-sm max-w-2xl">Find or build autonomous teams to execute complex strategies.</p>
                </div>
                <button
                    onClick={handleCreateGroup}
                    className="flex items-center justify-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-bold hover:-translate-y-0.5 transition-all shadow-md active:scale-95 whitespace-nowrap text-xs"
                >
                    <Icons.Plus /> Create My Squad
                </button>
            </div>

            <div className="w-full relative">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGroups.map(group => (
                        <div
                            key={group.id}
                            onClick={() => onSelectGroup?.(group.name)}
                            className="bg-white rounded-[24px] p-6 border border-black/5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_15px_35px_rgb(0,0,0,0.06)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col group cursor-pointer relative overflow-hidden"
                        >

                            {/* Status badge */}
                            <div className={`absolute top-6 right-6 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border ${getStatusColor(group.status)} z-10`}>
                                {group.status}
                            </div>

                            {/* Avatar Stack */}
                            <div className="flex items-start gap-4 mb-4 relative z-10">
                                <div className="flex -space-x-3 shrink-0 pl-1">
                                    {group.avatars.slice(0, 4).map((avatar, i) => (
                                        <div key={i} className="w-10 h-10 rounded-[12px] bg-gray-50 border-[2px] border-white shadow-sm flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300" style={{ zIndex: 10 - i, transitionDelay: `${i * 50}ms` }}>
                                            <span className="filter grayscale group-hover:grayscale-0 transition-all duration-300">{avatar}</span>
                                        </div>
                                    ))}
                                    {group.avatars.length > 4 && (
                                        <div className="w-10 h-10 rounded-[12px] bg-gray-100 text-gray-500 border-[2px] border-white shadow-sm flex items-center justify-center text-[10px] font-black z-[0] relative group-hover:bg-black group-hover:text-white transition-colors duration-300">
                                            +{group.avatars.length - 4}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4 pr-16 relative z-10">
                                <h3 className="text-lg font-black text-black mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-black group-hover:to-gray-500 transition-colors line-clamp-1">{group.name}</h3>
                                <p className="text-[13px] text-gray-400 font-medium leading-relaxed line-clamp-2">{group.description}</p>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1.5 mb-6 relative z-10">
                                {group.tags.map(tag => (
                                    <span key={tag} className="text-[9px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md group-hover:bg-black/5 transition-colors">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            {/* Stats Grid */}
                            <div className="mt-auto grid grid-cols-3 gap-0 bg-gray-50/50 rounded-[16px] border border-black/5 group-hover:bg-[#a3ff12]/5 transition-colors divide-x divide-black/5 relative z-10 overflow-hidden">
                                <div className="flex flex-col items-center justify-center p-3">
                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Members</span>
                                    <span className="text-sm font-black text-black">{group.members}<span className="text-gray-400 text-[10px]">/{group.maxMembers}</span></span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-3">
                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Split(W)</span>
                                    <span className="text-sm font-black text-black">${group.stats.totalSplitUSD.toLocaleString()}</span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-3">
                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Activity</span>
                                    <span className="text-[10px] font-black text-black">{group.stats.activity24h}</span>
                                </div>
                            </div>

                            {/* Hover BG effect */}
                            <div className="absolute right-0 bottom-0 pointer-events-none transition-opacity duration-500 opacity-0 group-hover:opacity-100 -mr-16 -mb-16">
                                <div className="w-48 h-48 bg-[radial-gradient(circle_at_center,rgba(163,255,18,0.1)_0,transparent_60%)] rounded-full blur-2xl"></div>
                            </div>
                        </div>
                    ))}

                    {filteredGroups.length === 0 && (
                        <div className="col-span-full py-20 text-center flex flex-col items-center justify-center bg-gray-50/50 rounded-[32px] border-2 border-dashed border-black/5">
                            <span className="text-4xl mb-4 filter grayscale opacity-30">🕵️‍♀️</span>
                            <h3 className="text-xl font-black text-black mb-1">No squads found</h3>
                            <p className="text-sm text-gray-400 font-medium max-w-sm">We couldn't find any squads matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Groups;
