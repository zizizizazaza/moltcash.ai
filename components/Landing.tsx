import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../constants';

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

// --- CoinSVG with pure dense dot-matrix rendering ---
const CoinSVG = ({ symbol, side = 'left', className, style, delayOffset = 0 }: { symbol: string, side?: 'left' | 'right', className?: string, style?: React.CSSProperties, delayOffset?: number }) => {
    const isLong = symbol.length > 2;
    const fontSize = isLong ? "65" : "140";

    const width = 300;
    const height = 300;
    const spacing = 7; // Dense dots
    const maskId = `mask-${symbol}`;

    const backgroundBlackDots = [];
    const foregroundGreenDots = [];

    // Halftone generation
    for (let x = 0; x <= width; x += spacing) {
        for (let y = 0; y <= height; y += spacing) {
            let dx = x - 150;
            let dy = y - 150;
            let d = Math.sqrt(dx * dx + dy * dy);

            if (d <= 145) {
                // Base layer of dots everywhere inside the coin, changed to grey
                backgroundBlackDots.push(<circle key={`bg-${x}-${y}`} cx={x} cy={y} r={1.8} fill="#D1D5DB" opacity={0.6} />);

                // Determine if this area should be bright green
                let isBright = false;
                if (d > 130) {
                    isBright = false; // Outer dark ring
                } else if (d > 105 && d <= 130) {
                    isBright = true; // Outer bright ring
                } else if (d > 95 && d <= 105) {
                    isBright = false; // Inner dark ring
                } else {
                    isBright = true; // Inner bright fill
                }

                if (isBright) {
                    const animDelay = `${(x + y) * 2 + delayOffset}ms`;
                    foregroundGreenDots.push(
                        <circle key={`fg-${x}-${y}`} cx={x} cy={y} r={2.8} fill="#c3ff00" className="coin-dot" style={{ animationDelay: animDelay }} />
                    );
                }
            }
        }
    }

    return (
        <svg viewBox="0 0 300 300" overflow="visible" className={className} style={style}>
            <defs>
                <style>
                    {`
                        @keyframes pulseDot {
                            0%, 100% { opacity: 0.85; transform: scale(0.9); }
                            50% { opacity: 1; transform: scale(1.05); }
                        }
                        .coin-dot {
                            transform-origin: center;
                            animation: pulseDot 4s infinite ease-in-out;
                        }
                    `}
                </style>
                <mask id={maskId}>
                    {/* Use page background color #fafdf3 instead of white to avoid white borders */}
                    <rect width="100%" height="100%" fill="#fafdf3" />
                    {/* Punch a hole for the text, revealing the grey dots underneath */}
                    <text x="150" y="155" fontSize={fontSize} fontWeight="900" fontFamily="sans-serif" textAnchor="middle" dominantBaseline="central" fill="black">{symbol}</text>
                </mask>
            </defs>

            <g>
                {backgroundBlackDots}
            </g>
            <g mask={`url(#${maskId})`}>
                {foregroundGreenDots}
            </g>
        </svg>
    );
};


const Landing: React.FC = () => {
    const [heroTab, setHeroTab] = useState<'agent' | 'human'>('agent');
    const [copied, setCopied] = useState(false);

    const quoteRef = useInView();
    const featuresRef = useInView();
    const stackRef = useInView();

    const handleCopy = () => {
        navigator.clipboard.writeText('curl -sL https://docs.openclaw.com/install.sh | bash');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative min-h-screen pb-24 overflow-hidden bg-[#fafdf3]"> {/* Updated background color to warm off-white */}
            {/* Restored Floating Dot Matrix Coins Container */}
            <div className="absolute top-0 left-0 w-full h-screen pointer-events-none z-0 overflow-hidden flex justify-center">
                <style>
                    {`
                        @keyframes float1 { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-20px) rotate(3deg); } }
                        @keyframes float2 { 0%, 100% { transform: translateY(0) rotate(-12deg); } 50% { transform: translateY(-25px) rotate(-8deg); } }
                        @keyframes float3 { 0%, 100% { transform: translateY(0) rotate(15deg); } 50% { transform: translateY(-30px) rotate(10deg); } }
                    `}
                </style>
                <div className="relative w-full max-w-[1400px] h-full">
                    {/* 1. $ - Top Left */}
                    <div style={{ animation: 'float1 12s ease-in-out infinite' }} className="absolute top-[2vh] left-[-8%] md:left-[-2%]">
                        <CoinSVG symbol="$" side="left" delayOffset={0} className="w-[280px] h-[280px] md:w-[420px] md:h-[420px] opacity-90 transition-transform hover:scale-105" />
                    </div>
                    {/* 2. AIUSD - Bottom Left */}
                    <div style={{ animation: 'float2 14s ease-in-out infinite 2s' }} className="absolute top-[60vh] left-[-7%] md:left-[3%]">
                        <CoinSVG symbol="AIUSD" side="left" delayOffset={1200} className="w-[180px] h-[180px] md:w-[260px] md:h-[260px] opacity-70 transition-transform hover:-translate-x-4" />
                    </div>

                    {/* 3. ¥ - Top Right */}
                    <div style={{ animation: 'float2 13s ease-in-out infinite 1s' }} className="absolute top-[8vh] right-[-10%] md:right-[-4%]">
                        <CoinSVG symbol="¥" side="right" delayOffset={500} className="w-[220px] h-[220px] md:w-[350px] md:h-[350px] opacity-80 transition-transform hover:scale-105" />
                    </div>
                    {/* 4. USDC - Middle Right */}
                    <div style={{ animation: 'float3 15s ease-in-out infinite 3s' }} className="absolute top-[45vh] right-[1%] md:right-[15%]">
                        <CoinSVG symbol="USDC" side="right" delayOffset={2000} className="w-[160px] h-[160px] md:w-[200px] md:h-[200px] opacity-80" />
                    </div>
                    {/* 5. € - Bottom Right */}
                    <div style={{ animation: 'float1 16s ease-in-out infinite 4s' }} className="absolute top-[75vh] right-[2%] md:right-[8%]">
                        <CoinSVG symbol="€" side="right" delayOffset={3200} className="w-[200px] h-[200px] md:w-[280px] md:h-[280px] opacity-70" />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* ─── Hero Section ─── */}
                <section className="text-center space-y-4 pt-4 md:pt-6 relative animate-fadeIn">
                    <div className="flex justify-center mb-2">
                        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/60 border border-gray-200/50 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:scale-105 hover:bg-white/80 transition-all duration-500 cursor-default hover:shadow-[0_5px_15px_rgba(0,0,0,0.05)]">
                            <span className="text-xs sm:text-sm font-bold text-gray-700 tracking-wide">
                                MoltCash <span className="text-gray-400 font-medium mx-1">powered by</span> Loka
                            </span>
                        </div>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-outfit font-black text-black tracking-[-0.03em] max-w-5xl mx-auto leading-[1.1] md:leading-[1.05] relative z-20 transition-transform duration-700 hover:scale-[1.02]">
                        The Agentic <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-black via-gray-700 to-black bg-[length:200%_auto] hover:bg-right transition-all duration-1000">Payment Engine</span>
                    </h1>
                    <p className="text-base md:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed font-medium">
                        A decentralized settlement infrastructure built for autonomous AI agents. Zero-fee microtransactions, absolute ZK privacy, and instant stablecoin liquidity.
                    </p>

                    <div className="pt-4 max-w-2xl mx-auto">
                        {/* Toggle Buttons */}
                        <div className="flex bg-white/80 backdrop-blur-xl p-1.5 rounded-2xl mb-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)] border border-gray-200/50 max-w-sm mx-auto relative z-20">
                            <button
                                onClick={() => setHeroTab('agent')}
                                className={`flex flex-col items-center justify-center py-3 px-6 rounded-xl text-sm font-bold transition-all duration-300 w-1/2 hover:-translate-y-1 ${heroTab === 'agent' ? 'bg-black text-white shadow-xl scale-[1.02]' : 'text-gray-400 hover:text-black hover:bg-gray-50'}`}
                            >
                                <span className="flex items-center gap-2 mb-0.5">
                                    <Icons.Code /> For Agent
                                </span>
                                <span className={`text-[10px] font-normal ${heroTab === 'agent' ? 'text-gray-300' : 'text-gray-400'}`}>Integrate SKILL</span>
                            </button>
                            <button
                                onClick={() => setHeroTab('human')}
                                className={`flex flex-col items-center justify-center py-3 px-6 rounded-xl text-sm font-bold transition-all duration-300 w-1/2 hover:-translate-y-1 ${heroTab === 'human' ? 'bg-black text-white shadow-xl scale-[1.02]' : 'text-gray-400 hover:text-black hover:bg-gray-50'}`}
                            >
                                <span className="flex items-center gap-2 mb-0.5">
                                    <Icons.User /> For Human
                                </span>
                                <span className={`text-[10px] font-normal ${heroTab === 'human' ? 'text-gray-300' : 'text-gray-400'}`}>Enter Portal</span>
                            </button>
                        </div>

                        {/* Dynamic Content Area */}
                        <div className="min-h-[260px] flex items-center justify-center text-left relative z-10" key={heroTab}>
                            {heroTab === 'agent' ? (
                                <div className="w-full bg-[#111827] rounded-3xl p-6 md:p-8 shadow-[0_50px_100px_-20px_rgba(195,255,0,0.4)] border border-[#c3ff00]/40 overflow-hidden relative group font-sans animate-fadeIn">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-15 transition-opacity duration-500"><Icons.Shield /></div>

                                    <div className="space-y-8">
                                        {/* Terminal Command Banner */}
                                        <div
                                            onClick={handleCopy}
                                            className="w-full bg-[#0D0D0D] font-mono rounded-2xl p-4 md:p-5 shadow-inner border border-white/10 flex items-center justify-between cursor-pointer hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all duration-300 group/cmd relative overflow-hidden active:scale-[0.98]"
                                        >
                                            <div className="text-xs md:text-sm tracking-wide text-gray-300 flex flex-wrap gap-2 items-center leading-relaxed">
                                                <span className="text-gray-500 select-none group-hover/cmd:text-white transition-colors duration-300">$</span>
                                                <span className="text-[#00E676] group-hover/cmd:opacity-80 transition-opacity">curl</span>
                                                <span>-sL</span>
                                                <span className="text-white break-all">https://docs.openclaw.com/install.sh</span>
                                                <span className="text-yellow-400">&nbsp;|&nbsp;</span>
                                                <span className="text-[#00E676] group-hover/cmd:opacity-80 transition-opacity">bash</span>
                                            </div>
                                            <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-[10px] font-bold text-gray-400 hover:text-white transition-all border border-white/10 ml-4 whitespace-nowrap  tracking-widest">
                                                {copied ? '✓ Copied' : 'Copy'}
                                            </div>
                                        </div>

                                        {/* Steps */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 lg:gap-8 px-2">
                                            {[
                                                { num: '01', label: 'READ', desc: 'Tell your agent to read the installation script.' },
                                                { num: '02', label: 'FETCH', desc: 'Agent installs the OpenClaw skill dependency locally.' },
                                                { num: '03', label: 'START', desc: 'Runtime restarts and connects to the settlement layer.' },
                                            ].map((step, i) => (
                                                <div key={i} className="flex flex-col gap-2 relative group/step" style={{ animationDelay: `${i * 100}ms` }}>
                                                    <div className="text-[#FF4525] font-black text-sm tracking-widest  mb-1 flex items-center gap-2">
                                                        <span className="bg-[#FF4525]/10 rounded-md px-2 py-0.5">{step.num}</span>
                                                        <span>{step.label}</span>
                                                        {i < 2 && <div className="h-px bg-white/10 flex-1 hidden sm:block"></div>}
                                                    </div>
                                                    <p className="text-xs md:text-sm font-medium text-gray-400 leading-relaxed pr-2">
                                                        {step.desc}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => window.dispatchEvent(new CustomEvent('loka-nav-chat'))}
                                    className="w-full h-full bg-white rounded-3xl p-8 md:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-gray-200/50 flex flex-col items-center justify-center text-center gap-5 group hover:border-black/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer relative overflow-hidden animate-fadeIn"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-tr from-gray-50 via-white to-gray-50 opacity-50"></div>
                                    <div className="relative z-10 w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform group-hover:-rotate-6 duration-300">
                                        <Icons.Chat />
                                    </div>
                                    <div className="relative z-10 flex flex-col items-center gap-6">
                                        <p className="text-gray-500 font-medium max-w-[280px] mx-auto leading-relaxed text-sm">Experience the MoltCash protocol manually through our natural language gateway.</p>
                                        <button className="px-8 py-3 bg-black text-white rounded-full text-sm font-bold shadow-xl transition-all flex items-center gap-2 group-hover:bg-gray-800 tracking-widest  hover:scale-105">
                                            start to chat <Icons.Flash />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>



                {/* ─── Vision Quote ─── */}
                <section
                    ref={quoteRef.ref}
                    className={`max-w-4xl mx-auto mt-16 relative transition-all duration-700 delay-100 ${quoteRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                >

                    <div className="p-10 md:p-16 rounded-[3rem] bg-white/60 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] relative overflow-hidden backdrop-blur-3xl text-center group hover:-translate-y-1 transition-transform duration-700">
                        <div className="absolute -top-6 -left-2 text-[12rem] text-transparent bg-clip-text bg-gradient-to-br from-gray-300/50 to-transparent font-serif leading-none italic select-none pointer-events-none">"</div>
                        <p className="text-xl md:text-3xl font-serif italic text-gray-800 leading-relaxed relative z-10 px-4 md:px-10">
                            Capture sovereign yields completely on-chain. Transform rigid, real-world cash flows into highly programmable, liquid capital loops.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-4">
                            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1 max-w-[100px]"></div>
                            <p className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-gray-900  tracking-widest">— Protocol Vision</p>
                            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1 max-w-[100px]"></div>
                        </div>
                    </div>
                </section>

                {/* ─── Features Showcase ─── */}
                <section
                    ref={featuresRef.ref}
                    className={`space-y-16 mt-32 relative transition-all duration-700 delay-200 ${featuresRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                >
                    {/* Background Coins for this section */}
                    <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
                        <CoinSVG symbol="USDC" side="right" className="absolute top-0 right-[-10%] w-[400px] h-[400px] opacity-[0.03] rotate-12" />
                        <CoinSVG symbol="AIUSD" side="left" className="absolute bottom-[-10%] left-[-15%] w-[500px] h-[500px] opacity-[0.04] -rotate-12" />
                    </div>

                    <div className="md:flex md:items-end md:justify-between mb-16 relative">
                        <div className="inline-block relative">
                            <h2 className="text-4xl md:text-5xl font-black text-black tracking-tight relative z-10">Ecosystem <br className="hidden md:block" />Architecture</h2>
                            <div className="absolute -left-6 top-0 bottom-0 w-2 bg-[#c3ff00] hidden md:block"></div>
                        </div>
                        <p className="text-gray-500 text-sm font-mono max-w-sm md:text-right mt-6 md:mt-0 uppercase tracking-widest leading-relaxed">Engineered from the ground up to eliminate friction in AI-driven commerce.</p>
                    </div>

                    <div className="flex flex-col border-t-2 border-black/10">
                        {/* Item 1 */}
                        <div className="group flex flex-col md:flex-row md:items-start py-8 md:py-12 border-b border-black/10 hover:bg-black/[0.02] transition-colors relative overflow-hidden cursor-default">
                            {/* Hover accent line */}
                            <div className="absolute left-0 top-0 bottom-0 w-0 group-hover:w-1 bg-[#c3ff00] transition-all duration-300"></div>

                            <div className="md:w-1/4 flex flex-row items-center md:items-start pl-6 md:pl-8 mb-6 md:mb-0 space-x-4">
                                <span className="text-xs font-mono text-gray-400 font-bold uppercase tracking-widest shrink-0">[ 01 ]</span>
                                <div className="md:hidden block h-px bg-black/10 flex-1"></div>
                            </div>

                            <div className="md:w-3/4 flex flex-col md:flex-row gap-4 md:gap-12 pr-6 md:pr-12 pl-6 md:pl-0">
                                <h3 className="text-2xl md:text-3xl font-black text-black tracking-tight leading-tight md:w-1/2 group-hover:text-gray-700 transition-colors">Conversational Settlement</h3>
                                <p className="text-sm md:text-base text-gray-500 font-medium leading-relaxed md:w-1/2">
                                    Execute payments, configure complex conditional logic, and orchestrate capital routing entirely through natural language commands natively optimized for multi-agent workflows.
                                </p>
                            </div>
                        </div>

                        {/* Item 2 */}
                        <div className="group flex flex-col md:flex-row md:items-start py-8 md:py-12 border-b border-black/10 hover:bg-black/[0.02] transition-colors relative overflow-hidden cursor-default">
                            <div className="absolute left-0 top-0 bottom-0 w-0 group-hover:w-1 bg-[#c3ff00] transition-all duration-300"></div>
                            <div className="md:w-1/4 flex flex-row items-center md:items-start pl-6 md:pl-8 mb-6 md:mb-0 space-x-4">
                                <span className="text-xs font-mono text-gray-400 font-bold uppercase tracking-widest shrink-0">[ 02 ]</span>
                                <div className="md:hidden block h-px bg-black/10 flex-1"></div>
                            </div>
                            <div className="md:w-3/4 flex flex-col md:flex-row gap-4 md:gap-12 pr-6 md:pr-12 pl-6 md:pl-0">
                                <h3 className="text-2xl md:text-3xl font-black text-black tracking-tight leading-tight md:w-1/2 group-hover:text-gray-700 transition-colors">Zero-Knowledge Autonomy</h3>
                                <p className="text-sm md:text-base text-gray-500 font-medium leading-relaxed md:w-1/2">
                                    Institutional-grade financial privacy. ZK proofs validate policy compliance and portfolio solvency instantly without ever exposing balances, counterparties, or proprietary strategies.
                                </p>
                            </div>
                        </div>

                        {/* Item 3 */}
                        <div className="group flex flex-col md:flex-row md:items-start py-8 md:py-12 border-b border-black/10 hover:bg-black/[0.02] transition-colors relative overflow-hidden cursor-default">
                            <div className="absolute left-0 top-0 bottom-0 w-0 group-hover:w-1 bg-[#c3ff00] transition-all duration-300"></div>
                            <div className="md:w-1/4 flex flex-row items-center md:items-start pl-6 md:pl-8 mb-6 md:mb-0 space-x-4">
                                <span className="text-xs font-mono text-gray-400 font-bold uppercase tracking-widest shrink-0">[ 03 ]</span>
                                <div className="md:hidden block h-px bg-black/10 flex-1"></div>
                            </div>
                            <div className="md:w-3/4 flex flex-col md:flex-row gap-4 md:gap-12 pr-6 md:pr-12 pl-6 md:pl-0">
                                <h3 className="text-2xl md:text-3xl font-black text-black tracking-tight leading-tight md:w-1/2 group-hover:text-gray-700 transition-colors">Programmable Reputation</h3>
                                <p className="text-sm md:text-base text-gray-500 font-medium leading-relaxed md:w-1/2">
                                    Dynamic deterministic credit scoring establishes behavioral identity on-chain. Progress from anonymous multi-sig wallets to trusted, measurable institutional agent relationships.
                                </p>
                            </div>
                        </div>

                        {/* Item 4 */}
                        <div className="group flex flex-col md:flex-row md:items-start py-8 md:py-12 border-b border-black/10 hover:bg-black/[0.02] transition-colors relative overflow-hidden cursor-default">
                            <div className="absolute left-0 top-0 bottom-0 w-0 group-hover:w-1 bg-[#c3ff00] transition-all duration-300"></div>
                            <div className="md:w-1/4 flex flex-row items-center md:items-start pl-6 md:pl-8 mb-6 md:mb-0 space-x-4">
                                <span className="text-xs font-mono text-gray-400 font-bold uppercase tracking-widest shrink-0">[ 04 ]</span>
                                <div className="md:hidden block h-px bg-black/10 flex-1"></div>
                            </div>
                            <div className="md:w-3/4 flex flex-col md:flex-row gap-4 md:gap-12 pr-6 md:pr-12 pl-6 md:pl-0">
                                <h3 className="text-2xl md:text-3xl font-black text-black tracking-tight leading-tight md:w-1/2 group-hover:text-gray-700 transition-colors">Absolute Zero-Fee Rail</h3>
                                <p className="text-sm md:text-base text-gray-500 font-medium leading-relaxed md:w-1/2">
                                    Engineered atop a custom sovereign layer enabling infinite friction-free microtransactions. Seamless T+0 finality deeply integrated alongside structural global fiat gateways.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── Deep Tech Architecture ─── */}
                <section
                    ref={stackRef.ref}
                    className={`space-y-16 pt-24 pb-12 relative transition-all duration-700 delay-300 ${stackRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                >
                    {/* Background Coins for this section */}
                    <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
                        <CoinSVG symbol="€" side="left" className="absolute top-[20%] left-[-5%] w-[350px] h-[350px] opacity-[0.03] -rotate-[15deg]" />
                        <CoinSVG symbol="¥" side="right" className="absolute bottom-[10%] right-[-8%] w-[450px] h-[450px] opacity-[0.04] rotate-[20deg]" />
                    </div>

                    <div className="md:flex md:items-end md:justify-between mb-24 relative">
                        <div className="inline-block relative">
                            <h2 className="text-4xl md:text-5xl font-black text-black tracking-tight relative z-10">The Institutional<br className="hidden md:block" /> Stack<span className="text-[#c3ff00]">.</span></h2>
                            <div className="absolute -left-6 top-0 bottom-0 w-2 bg-[#c3ff00] hidden md:block"></div>
                        </div>
                        <p className="text-gray-500 text-sm font-mono max-w-sm md:text-right mt-6 md:mt-0 uppercase tracking-widest leading-relaxed">Modular, secure components forged for enterprise-grade throughput.</p>
                    </div>

                    <div className="relative max-w-5xl mx-auto">
                        <div className="space-y-12 md:space-y-24">
                            {/* Layer 3 */}
                            <div className="relative flex flex-col md:flex-row items-start md:justify-between w-full group">
                                <div className="md:w-[45%] pl-8 md:pl-0 md:text-right md:pr-16 text-left mb-4 md:mb-0">
                                    <h3 className="text-2xl font-black text-black group-hover:text-gray-600 transition-colors">Experience & SDK Layer</h3>
                                    <p className="text-gray-500 mt-3 font-medium text-sm leading-relaxed">Turnkey integration suites for autonomous agents and decentralized businesses. Featuring automated gas sponsorships, isolated session keys, and comprehensive policy rule configurations.</p>
                                </div>
                                <div className="absolute left-[-4px] md:left-1/2 w-2 h-2 bg-black/20 group-hover:bg-[#c3ff00] transform md:-translate-x-1/2 mt-2 transition-colors duration-300"></div>
                                <div className="md:w-[45%] pl-8 md:pl-16 w-full">
                                    <div className="bg-transparent group-hover:bg-black/[0.02] transition-colors p-6 relative">
                                        <h4 className="text-[10px] font-mono font-bold text-gray-400 tracking-wider mb-2 uppercase">SKILL Framework</h4>
                                        <p className="text-xl font-black text-black mb-3">Plonky2 + Groth16 Native Proofs</p>
                                        <p className="text-sm text-gray-500 leading-relaxed font-medium">Local runtime compiling dynamic exposure limits into deployable zero-knowledge circuits directly within the agent workflow.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Layer 2 */}
                            <div className="relative flex flex-col md:flex-row items-start md:justify-between w-full group">
                                <div className="md:w-[45%] pl-8 md:pl-0 md:text-right md:pr-16 text-left mb-4 md:mb-0 md:order-1 order-3 w-full">
                                    <div className="bg-transparent group-hover:bg-black/[0.02] transition-colors p-6 relative md:text-right">
                                        <h4 className="text-[10px] font-mono font-bold text-gray-400 tracking-wider mb-2 uppercase">Execution Environment</h4>
                                        <p className="text-xl font-black text-black mb-3">AWS Nitro Enclaves Hub</p>
                                        <p className="text-sm text-gray-500 leading-relaxed font-medium">Hardware-level CPU segregation guarantees absolute data confidentiality, rendering proprietary strategies completely opaque to hosts and operators.</p>
                                    </div>
                                </div>
                                <div className="absolute left-[-4px] md:left-1/2 w-2 h-2 bg-black/20 group-hover:bg-[#c3ff00] transform md:-translate-x-1/2 mt-2 md:order-2 order-2 transition-colors duration-300"></div>
                                <div className="md:w-[45%] pl-8 md:pl-16 md:order-3 order-1 mb-4 md:mb-0 text-left">
                                    <h3 className="text-2xl font-black text-black group-hover:text-gray-600 transition-colors">Computation & Risk Engine</h3>
                                    <p className="text-gray-500 mt-3 font-medium text-sm leading-relaxed">The invisible processing powerhouse safely driving compliance frameworks, multi-tenant agent logical routing, and rigorous fraud deterrence inside restricted boundaries.</p>
                                </div>
                            </div>

                            {/* Layer 1 */}
                            <div className="relative flex flex-col md:flex-row items-start md:justify-between w-full group">
                                <div className="md:w-[45%] pl-8 md:pl-0 md:text-right md:pr-16 text-left mb-4 md:mb-0">
                                    <h3 className="text-2xl font-black text-black group-hover:text-gray-600 transition-colors">Ledger & Securitization</h3>
                                    <p className="text-gray-500 mt-3 font-medium text-sm leading-relaxed">Algorithmic capital utilization mechanisms capturing risk-free US Treasury yields to fund network emission mechanics, enabling continuous capital creation via AIUSD stablecoins.</p>
                                </div>
                                <div className="absolute left-[-4px] md:left-1/2 w-2 h-2 bg-black/20 group-hover:bg-[#c3ff00] transform md:-translate-x-1/2 mt-2 transition-colors duration-300"></div>
                                <div className="md:w-[45%] pl-8 md:pl-16 w-full">
                                    <div className="bg-transparent group-hover:bg-black/[0.02] transition-colors p-6 relative">
                                        <h4 className="text-[10px] font-mono font-bold text-gray-400 tracking-wider mb-2 uppercase">Programmable Assets</h4>
                                        <p className="text-xl font-black text-black mb-3">Native Yield & RWA Discounting</p>
                                        <p className="text-sm text-gray-500 leading-relaxed font-medium">Convert historically illiquid verifiable business incomes like SaaS API usage or decentralized Compute nodes into instantly tradeable Yield and Principal tokens.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Landing;
