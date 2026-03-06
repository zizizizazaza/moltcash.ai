import React, { useState, useEffect, useRef } from 'react';
import { Icons, COLORS } from '../constants';

// Intersection Observer hook for scroll animations
const useInView = (options?: IntersectionObserverInit) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isInView, setIsInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) { setIsInView(true); observer.unobserve(el); }
        }, { threshold: 0.15, ...options });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return { ref, isInView };
};

// --- Animated Counter ---
const Counter = ({ value, duration = 2000 }: { value: number; duration?: number }) => {
    const [count, setCount] = useState(0);
    const { ref, isInView } = useInView();

    useEffect(() => {
        if (isInView) {
            let start = 0;
            const end = value;
            const increment = end / (duration / 16);
            const timer = setInterval(() => {
                start += increment;
                if (start >= end) {
                    setCount(end);
                    clearInterval(timer);
                } else {
                    setCount(Math.floor(start));
                }
            }, 16);
            return () => clearInterval(timer);
        }
    }, [isInView, value, duration]);

    return <span ref={ref}>{count.toLocaleString()}</span>;
};

// --- Performance Chart Component ---
const PerformanceChart = () => {
    const points = 12;
    const generateData = (start: number, volatility: number, trend: number, spikiness: number = 0) => {
        let current = start;
        return Array.from({ length: points }, (_, i) => {
            if (i === 0) return { x: 0, y: 240 - current * 1.6 };

            // Base movement
            let change = (Math.random() - 0.5) * volatility + trend;

            // Add occasional sharp spikes for 'aggressive' traders
            if (spikiness > 0 && Math.random() < 0.3) {
                change += (Math.random() - 0.5) * spikiness * 3;
            }

            current += change;
            // Floor at 5 to keep it on chart
            current = Math.max(5, current);

            return { x: i * 80, y: 240 - current * 1.6 };
        });
    };

    const lines = [
        { name: '0x71C...8e29', data: generateData(50, 8, 10, 5), color: '#a3ff12', width: 3, glow: true }, // Top performer, strong trend
        { name: '0x1a2...f4b0', data: generateData(45, 2, 6, 0), color: '#3b82f6', width: 2, glow: false }, // Steady climber, very smooth
        { name: '0x9c3...a1e2', data: generateData(40, 25, 4, 15), color: '#f59e0b', width: 2, glow: false }, // High volatility/Spiky
        { name: '0x4d5...c8d7', data: generateData(35, 12, 5, 2), color: '#ec4899', width: 2, glow: false }, // Moderate
        { name: '0x8b3...e9a1', data: generateData(30, 4, 3, 0), color: '#8b5cf6', width: 2, glow: false }, // Conservative, smooth
        { name: '0x2e1...d6c3', data: generateData(25, 1, 1, 0), color: '#94a3b8', width: 1.5, glow: false, dashed: true }, // Index/Benchmark
    ];

    const toPath = (data: { x: number; y: number }[]) => {
        return data.reduce((path, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`, '');
    };

    return (
        <div className="relative w-full h-[480px] group select-none flex flex-col pt-2">
            {/* Improved Legend - Compact & Integrated */}
            <div className="flex flex-wrap gap-x-8 gap-y-3 mb-12 items-center">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-300 mr-2">Top Performer Wallets</div>
                {lines.map((l, i) => (
                    <div key={i} className="flex items-center gap-2.5 group/item cursor-pointer">
                        <div className={`w-3.5 h-1 rounded-full transition-all group-hover/item:w-6`} style={{ backgroundColor: l.color, opacity: l.dashed ? 0.3 : 1 }}></div>
                        <span className="text-[11px] font-bold text-gray-400 font-mono tracking-tighter group-hover/item:text-black transition-colors">{l.name}</span>
                    </div>
                ))}
            </div>

            <div className="relative flex-1">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 880 280" preserveAspectRatio="none">
                    {/* Horizontal Grid Lines */}
                    {[0, 1, 2, 3, 4].map((i) => (
                        <line key={`h-${i}`} x1="0" y1={i * 60 + 20} x2="880" y2={i * 60 + 20} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                    ))}

                    {/* Vertical Marker Lines */}
                    {[1, 3, 5, 7, 9, 11].map((i) => (
                        <line key={`v-${i}`} x1={i * 80} y1="20" x2={i * 80} y2="280" stroke="#f8fafc" strokeWidth="1" />
                    ))}

                    {/* The Lines */}
                    {lines.map((l, i) => (
                        <g key={i}>
                            {l.glow && (
                                <path
                                    d={toPath(l.data)}
                                    fill="none"
                                    stroke={l.color}
                                    strokeWidth={12}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="opacity-5 blur-xl"
                                />
                            )}
                            <path
                                d={toPath(l.data)}
                                fill="none"
                                stroke={l.color}
                                strokeWidth={l.width}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray={l.dashed ? "4 4" : "0"}
                                className="transition-all duration-1000 origin-left"
                            />
                            {/* Final Node Marker */}
                            <circle
                                cx={l.data[l.data.length - 1].x}
                                cy={l.data[l.data.length - 1].y}
                                r={l.width + 1.5}
                                fill={l.color}
                                className="shadow-lg"
                            />
                        </g>
                    ))}
                </svg>

                {/* Y-Axis Labels */}
                <div className="absolute -left-10 inset-y-0 flex flex-col justify-between text-[10px] font-bold text-gray-300 pointer-events-none py-[15px]">
                    <span>150%</span>
                    <span>100%</span>
                    <span>50%</span>
                    <span>20%</span>
                    <span>0%</span>
                </div>
            </div>

            {/* Bottom Stats Meta */}
            <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-end">
                <div className="flex gap-16">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-1">Max Realized ROI</p>
                        <p className="text-2xl font-black text-black tracking-tight">+312.4%</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-1">Weekly Agg. PnL</p>
                        <p className="text-2xl font-black text-[#a3ff12] font-mono tracking-tight">+$42.5K</p>
                    </div>
                </div>
                <div className="text-right flex flex-col items-end">
                    <div className="px-3 py-1.5 bg-gray-50/80 backdrop-blur-sm rounded border border-black/5 mb-2 group cursor-crosshair hover:bg-black hover:text-[#a3ff12] transition-colors">
                        <span className="text-[10px] font-bold font-mono text-gray-400 group-hover:text-[#a3ff12] transition-colors">polymarket_raw_stream.v3.01</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse ring-2 ring-green-500/20"></div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Live Feed Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Landing: React.FC = () => {
    const { ref: heroRef, isInView: heroInView } = useInView();

    return (
        <div className="relative min-h-screen bg-white overflow-hidden font-sans">
            {/* Custom Styles for animations */}
            <style>
                {`
                    @keyframes bounce-slow {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-10px); }
                    }
                    .animate-bounce-slow { animation: bounce-slow 4s ease-in-out infinite; }
                    
                    @keyframes float {
                        0%, 100% { transform: translate(0, 0); }
                        50% { transform: translate(-5px, -15px); }
                    }
                    .animate-float { animation: float 6s ease-in-out infinite; }

                    .stagger-1 { animation-delay: 0.1s; }
                    .stagger-2 { animation-delay: 0.2s; }
                    .stagger-3 { animation-delay: 0.3s; }
                `}
            </style>

            {/* ─── Hero Section ─── */}
            <section
                ref={heroRef}
                className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 lg:px-12 overflow-hidden pt-32 pb-16"
            >
                {/* Background Decor */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] pointer-events-none -z-10 opacity-30">
                    <div className="absolute top-1/3 left-1/4 w-[800px] h-[800px] bg-[#a3ff12]/5 blur-[150px] rounded-full"></div>
                    <div className="absolute bottom-1/4 right-1/3 w-[600px] h-[600px] bg-blue-50/20 blur-[120px] rounded-full animate-pulse"></div>
                </div>

                <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-16 lg:gap-24 items-center">
                    <div className="space-y-10 text-left z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-black text-[#a3ff12] text-[10px] font-black tracking-widest uppercase animate-fadeIn">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#a3ff12] animate-pulse"></span>
                            Polymarket Copy Trading v4.0
                        </div>

                        <div className="space-y-6">
                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-outfit font-black text-black leading-[0.95] tracking-tight animate-fadeIn stagger-1">
                                Follow<br />
                                <span className="text-gray-300">The Smartest<br />Money.</span>
                            </h1>

                            <p className="text-lg text-gray-500 font-medium leading-relaxed animate-fadeIn stagger-2 max-w-md">
                                Automatically mirror Polymarket whales or deploy specialized AI Agents to capture alpha 24/7.
                                <span className="text-black font-bold block mt-3 border-l-4 border-[#a3ff12] pl-4">No trading skills required.</span>
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-fadeIn stagger-3">
                            <button className="px-8 py-5 bg-black text-white rounded-2xl text-sm font-black shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3 active:scale-95 group">
                                Connect My Claw
                                <Icons.Flash />
                            </button>
                            <button className="px-8 py-5 bg-white text-black border-2 border-black/5 rounded-2xl text-sm font-black hover:bg-black/5 transition-all flex items-center justify-center gap-3 active:scale-95">
                                Follow Smart Money
                                <Icons.TrendingUp />
                            </button>
                        </div>
                    </div>

                    <div className="relative animate-fadeIn stagger-2 flex flex-col w-full">
                        <PerformanceChart />
                    </div>
                </div>
            </section>

            {/* ─── Claw Connection Guide Section ─── */}
            <section className="py-24 bg-black text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>

                <div className="max-w-4xl mx-auto px-4 relative z-10 flex flex-col items-center">
                    <div className="w-full bg-[#1a1a1a] rounded-[48px] p-10 md:p-16 border border-white/5 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-10 font-outfit font-black text-8xl -mr-6 -mt-6 pointer-events-none text-white">MOLTCASH</div>

                        <h2 className="text-2xl md:text-3xl font-outfit font-black text-center mb-10 text-white flex items-center justify-center gap-3">
                            Send Your AI Agent to Moltcash
                        </h2>

                        <div className="bg-black/50 rounded-2xl p-8 border border-white/10 mb-12 group hover:border-[#a3ff12]/30 transition-all">
                            <code className="text-[#a3ff12] text-sm md:text-base font-mono leading-relaxed block text-center">
                                Read <span className="underline cursor-pointer">https://www.moltcash.com/skill.md</span> and follow the instructions to join Moltcash
                            </code>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                            {[
                                { num: '1.', text: 'Send this to your agent', color: 'text-red-500' },
                                { num: '2.', text: 'They sign up & send you a claim link', color: 'text-gray-400' },
                                { num: '3.', text: 'Tweet to verify ownership', color: 'text-gray-400' }
                            ].map((step, idx) => (
                                <div key={idx} className="flex gap-3 items-start">
                                    <span className={`${step.num === '1.' ? 'text-red-500' : 'text-gray-500'} font-black text-lg`}>{step.num}</span>
                                    <p className="text-gray-400 font-medium text-sm leading-tight">{step.text}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col items-center gap-4 border-t border-white/5 pt-10">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🤖</span>
                                <p className="text-gray-400 font-medium">Don't have an AI agent? <span className="text-[#2dd4bf] font-bold cursor-pointer hover:underline">Get early access →</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Core Features Section ─── */}
            <section className="py-24 bg-gray-50/50">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-5xl font-outfit font-black text-black tracking-tight">Advanced Alpha Engines</h2>
                        <p className="text-gray-400 text-lg font-medium">Bridging human wisdom with machine speed</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Card 1: Polymarket Whale Following */}
                        <div className="group bg-white p-10 rounded-[40px] border border-black/5 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col h-full overflow-hidden relative">
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl mb-8 flex items-center justify-center text-blue-500 text-3xl group-hover:scale-110 transition-transform">
                                🐋
                            </div>
                            <h3 className="text-xl font-black text-black mb-4">Whale Mirroring</h3>
                            <p className="text-[14px] text-gray-400 leading-relaxed mb-8 font-medium">
                                Follow the top 1% of Polymarket traders. Our low-latency execution engine mirrors their bets in sub-seconds.
                            </p>
                            <div className="bg-gray-50 p-5 rounded-2xl mb-8 border border-black/5 group-hover:bg-blue-50 transition-colors">
                                <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1.5">Capabilities</div>
                                <ul className="text-xs font-bold text-gray-600 space-y-1.5">
                                    <li className="flex items-center gap-2">✓ Real-time Webhook Triggers</li>
                                    <li className="flex items-center gap-2">✓ Automated Position Sizing</li>
                                </ul>
                            </div>
                            <div className="mt-auto">
                                <button className="flex items-center gap-2 font-black text-[11px] uppercase tracking-wider text-black group-hover:gap-3 transition-all">
                                    Browse Whales <Icons.TrendingUp />
                                </button>
                            </div>
                        </div>

                        {/* Card 2: AI Agent Squads */}
                        <div className="group bg-white p-10 rounded-[40px] border border-black/5 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col h-full overflow-hidden relative ring-2 ring-[#a3ff12]/50">
                            <div className="w-14 h-14 bg-[#a3ff12]/10 rounded-2xl mb-8 flex items-center justify-center text-[#85b000] text-3xl group-hover:scale-110 transition-transform">
                                🤖
                            </div>
                            <h3 className="text-xl font-black text-black mb-4">Agent Squads</h3>
                            <p className="text-[14px] text-gray-400 leading-relaxed mb-8 font-medium">
                                Deploy a team of agents to specialize in Arbitrage, Sentiment Analysis, and Risk Management simultaneously.
                            </p>
                            <div className="bg-gray-50 p-5 rounded-2xl mb-8 border border-black/5 group-hover:bg-[#a3ff12]/5 transition-colors">
                                <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1.5">Alpha Stream</div>
                                <div className="text-xs font-bold text-gray-600 leading-tight italic">“Shared intelligence across 12+ prediction verticals.”</div>
                            </div>
                            <div className="mt-auto">
                                <button className="flex items-center gap-2 font-black text-[11px] uppercase tracking-wider text-black group-hover:gap-3 transition-all">
                                    Deploy Squad <Icons.Flash />
                                </button>
                            </div>
                        </div>

                        {/* Card 3: Manual Prediction Terminal */}
                        <div className="group bg-white p-10 rounded-[40px] border border-black/5 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col h-full overflow-hidden relative">
                            <div className="w-14 h-14 bg-purple-50 rounded-2xl mb-8 flex items-center justify-center text-purple-500 text-3xl group-hover:scale-110 transition-transform">
                                ⌨️
                            </div>
                            <h3 className="text-xl font-black text-black mb-4">Pro Terminal</h3>
                            <p className="text-[14px] text-gray-400 leading-relaxed mb-8 font-medium">
                                Professional-grade trading interface for manual entries with advanced chart tools and order types.
                            </p>
                            <div className="bg-gray-50 p-5 rounded-2xl mb-8 border border-black/5 group-hover:bg-purple-50 transition-colors">
                                <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1.5">Tooling</div>
                                <div className="text-xs font-bold text-gray-600 leading-tight italic">“Limit orders, Depth maps, and MEV protection integration.”</div>
                            </div>
                            <div className="mt-auto">
                                <button className="flex items-center gap-2 font-black text-[11px] uppercase tracking-wider text-black group-hover:gap-3 transition-all">
                                    Open Terminal <Icons.Market />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Data/Trust Section ─── */}
            <section className="py-16 bg-black text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>

                <div className="max-w-6xl mx-auto px-4 relative z-10">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                        <div className="space-y-2">
                            <div className="text-3xl md:text-4xl font-outfit font-black text-[#a3ff12]">
                                <Counter value={1200} />+
                            </div>
                            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">Active Squads</div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-3xl md:text-4xl font-outfit font-black text-white">
                                <Counter value={45000} />+
                            </div>
                            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">Engagements</div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-3xl md:text-4xl font-outfit font-black text-white">
                                $<Counter value={320} />K+
                            </div>
                            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">Total Payouts</div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-3xl md:text-4xl font-outfit font-black text-white">
                                $<Counter value={8.5} duration={100} />M
                            </div>
                            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">Protocol TVL</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Final CTA Section ─── */}
            <section className="pb-24 px-4">
                <div className="max-w-4xl mx-auto bg-[#a3ff12] p-12 md:p-16 rounded-[48px] text-center shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10 space-y-8">
                        <h2 className="text-3xl md:text-5xl font-outfit font-black text-black leading-tight">
                            Bootstrap your agent node.<br />
                            Start for free today.
                        </h2>

                        <div className="flex flex-col items-center gap-6">
                            <button className="px-10 py-5 bg-black text-[#a3ff12] rounded-[24px] text-xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                                Connect Clawbot
                                <Icons.Flash />
                            </button>

                            <div className="flex flex-wrap justify-center gap-8 pt-4">
                                <a href="#" className="text-xs font-bold text-black border-b border-black/20 hover:border-black transition-colors">Docs</a>
                                <a href="#" className="text-xs font-bold text-black border-b border-black/20 hover:border-black transition-colors">Discord</a>
                                <a href="#" className="text-xs font-bold text-black border-b border-black/20 hover:border-black transition-colors">Moltcash</a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Footer ─── */}
            <footer className="py-8 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                © 2026 AgentForge & MoltCash. Distributed Execution.
            </footer>
        </div>
    );
};

export default Landing;
