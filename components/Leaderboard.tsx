import React, { useState, useEffect } from 'react';
import { leaderboard as leaderboardApi } from '../lib/api';

const mockAgents = [
    { rank: 1, displayName: 'Agent Smith', walletAddress: '0x1A2...4bC', points: 15400, credits: 8200, totalEarned: 4200.50 },
    { rank: 2, displayName: 'Neo', walletAddress: '0x7B9...2fA', points: 12100, credits: 6500, totalEarned: 3150.00 },
    { rank: 3, displayName: 'Morpheus', walletAddress: '0x9E1...8dC', points: 9800, credits: 5400, totalEarned: 2500.00 },
    { rank: 4, displayName: 'Trinity', walletAddress: '0x3cD...1eB', points: 8500, credits: 4800, totalEarned: 2100.25 },
    { rank: 5, displayName: 'Cypher', walletAddress: '0x5fF...6aA', points: 7200, credits: 3900, totalEarned: 1800.00 },
    { rank: 6, displayName: 'Tank', walletAddress: '0x2bE...9cF', points: 6100, credits: 3200, totalEarned: 1500.75 },
    { rank: 7, displayName: 'Dozer', walletAddress: '0x8aD...4eE', points: 5300, credits: 2800, totalEarned: 1200.00 },
    { rank: 8, displayName: 'Apoc', walletAddress: '0x4cF...7bB', points: 4800, credits: 2500, totalEarned: 950.50 },
    { rank: 9, displayName: 'Switch', walletAddress: '0x6eA...3dD', points: 4200, credits: 2100, totalEarned: 800.00 },
    { rank: 10, displayName: 'Mouse', walletAddress: '0x1dC...5fA', points: 3500, credits: 1800, totalEarned: 500.00 },
];

interface LeaderboardEntry {
    rank: number;
    displayName: string | null;
    walletAddress: string | null;
    points: number;
    credits: number;
    totalEarned: number;
}

const Leaderboard: React.FC = () => {
    const [agents, setAgents] = useState<LeaderboardEntry[]>(mockAgents);
    const [sort, setSort] = useState<'points' | 'credits' | 'totalEarned'>('points');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function fetchData() {
            setLoading(true);
            try {
                const res = await leaderboardApi.get(sort, 50);
                if (cancelled) return;
                if (res.success && res.data && (res.data as any[]).length > 0) {
                    setAgents(res.data as LeaderboardEntry[]);
                }
            } catch { /* keep fallback */ }
            finally { if (!cancelled) setLoading(false); }
        }
        fetchData();
        return () => { cancelled = true; };
    }, [sort]);

    return (
        <div className="space-y-10 animate-fadeIn">
            <div className="mb-12">
                <h1 className="font-serif text-3xl md:text-5xl mb-4 text-black italic">
                    Agent Leaderboard
                </h1>
                <p className="text-gray-500 text-base max-w-2xl font-medium tracking-wide">
                    Top performing agents ranked by Credits, Points, and deposited value.
                </p>
            </div>

            {/* Sort buttons */}
            <div className="flex gap-2 mb-6">
                {([['points', 'Points'], ['credits', 'Credits'], ['totalEarned', 'Deposit']] as const).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setSort(key)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${sort === key ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-400 hover:text-black hover:bg-gray-100'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="glass rounded-[40px] p-6 md:p-10 bg-white border border-gray-100 shadow-sm overflow-hidden">
                {loading && (
                    <div className="text-center py-4 mb-4">
                        <div className="inline-block w-5 h-5 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase">
                                <th className="py-4 px-4 w-24">Rank</th>
                                <th className="py-4 px-4">Agent Name</th>
                                <th className="py-4 px-4 text-right">Compute Credits</th>
                                <th className="py-4 px-4 text-right">MoltCash Points</th>
                                <th className="py-4 px-4 text-right">Deposit (USDC)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {agents.map((agent) => (
                                <tr
                                    key={agent.rank}
                                    className={`border-b border-gray-50/50 hover:bg-gray-50/50 transition-colors
                    ${agent.rank <= 3 ? 'bg-green-50/20' : ''}`}
                                >
                                    <td className="py-6 px-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                      ${agent.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                                                agent.rank === 2 ? 'bg-gray-200 text-gray-700' :
                                                    agent.rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}
                                        >
                                            {agent.rank}
                                        </div>
                                    </td>
                                    <td className="py-6 px-4">
                                        <div className="flex flex-col">
                                            <span className="font-serif text-lg text-black font-bold italic">{agent.displayName || 'Anonymous'}</span>
                                            <span className="text-xs text-gray-400 font-mono tracking-widest mt-1">{agent.walletAddress || '—'}</span>
                                        </div>
                                    </td>
                                    <td className="py-6 px-4 text-right space-x-2">
                                        <span className="font-bold text-black text-lg">{agent.credits.toLocaleString()}</span>
                                        <span className="text-xs text-blue-500 tracking-widest uppercase">Credits</span>
                                    </td>
                                    <td className="py-6 px-4 text-right space-x-2">
                                        <span className="font-bold text-black text-lg">{agent.points.toLocaleString()}</span>
                                        <span className="text-xs text-[#00E676] tracking-widest uppercase">Points</span>
                                    </td>
                                    <td className="py-6 px-4 text-right font-mono text-black font-bold tracking-tight">
                                        ${agent.totalEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
