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

const CoinSVG = ({ symbol, side = 'left', className, style }: { symbol: string, side?: 'left' | 'right', className?: string, style?: React.CSSProperties }) => {
    const isLong = symbol.length > 2;
    // Scale up the font size to make it large enough:
    const fontSize = isLong ? "36" : "90";

    // We adjust viewBox from "0 0 200 240" to "-20 10 240 220" so shapes aren't clipped
    return (
        <svg viewBox="0 0 200 240" overflow="visible" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" className={className} style={style}>
            {side === 'left' ? (
                <>
                    <path d="M 85 30 A 70 90 0 0 0 85 210" />
                    <line x1="85" y1="30" x2="110" y2="30" />
                    <line x1="85" y1="210" x2="110" y2="210" />
                    <ellipse cx="110" cy="120" rx="70" ry="90" />
                    <ellipse cx="110" cy="120" rx="55" ry="75" strokeOpacity="0.4" />
                    {/* Using dominantBaseline ensures perfectly centered text regardless of font line-height bugs */}
                    <text x="110" y="125" fontSize={fontSize} fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" dominantBaseline="middle" strokeWidth="1.5" strokeOpacity="1" fill="none">{symbol}</text>
                </>
            ) : (
                <>
                    <path d="M 115 30 A 70 90 0 0 1 115 210" />
                    <line x1="115" y1="30" x2="90" y2="30" />
                    <line x1="115" y1="210" x2="90" y2="210" />
                    <ellipse cx="90" cy="120" rx="70" ry="90" />
                    <ellipse cx="90" cy="120" rx="55" ry="75" strokeOpacity="0.4" />
                    <text x="90" y="125" fontSize={fontSize} fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" dominantBaseline="middle" strokeWidth="1.5" strokeOpacity="1" fill="none">{symbol}</text>
                </>
            )}
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
        <div className="relative min-h-screen pb-24 overflow-hidden bg-[#FAFAFA]">
            {/* Floating Outline Coins Background (DeBank style) */}
            <div className="absolute top-0 left-0 w-full h-screen pointer-events-none z-0 overflow-hidden flex justify-center">
                <div className="relative w-full max-w-[1400px] h-full">
                    {/* 1. $ - Top Left */}
                    <div style={{ animation: 'float1 8s ease-in-out infinite' }} className="absolute top-[8vh] left-[-10%] md:left-[-2%]">
                        <CoinSVG symbol="$" side="left" className="w-[200px] h-[200px] md:w-[320px] md:h-[320px] text-gray-300 opacity-60 transform -rotate-12 transition-transform duration-[6000ms] hover:scale-105" />
                    </div>
                    {/* 2. AIUSD - Bottom Left */}
                    <div style={{ animation: 'float2 10s ease-in-out infinite 1.5s' }} className="absolute top-[55vh] left-[-5%] md:left-[5%]">
                        <CoinSVG symbol="AIUSD" side="left" className="w-[140px] h-[140px] md:w-[220px] md:h-[220px] text-gray-300 opacity-40 transform rotate-12 transition-transform duration-[8000ms] hover:-translate-x-4" />
                    </div>

                    {/* 3. ¥ - Top Right */}
                    <div style={{ animation: 'float2 9s ease-in-out infinite 0.5s' }} className="absolute top-[12vh] right-[-10%] md:right-[-2%]">
                        <CoinSVG symbol="¥" side="right" className="w-[180px] h-[180px] md:w-[280px] md:h-[280px] text-gray-300 opacity-60 transform rotate-6 transition-transform duration-[7000ms]" />
                    </div>
                    {/* 4. USDC - Middle Right */}
                    <div style={{ animation: 'float1 12s ease-in-out infinite 2s' }} className="absolute top-[38vh] right-[5%] md:right-[15%]">
                        <CoinSVG symbol="USDC" side="right" className="w-[120px] h-[120px] md:w-[180px] md:h-[180px] text-gray-300 opacity-50 transform -rotate-3 transition-transform duration-[9000ms]" />
                    </div>
                    {/* 5. € - Bottom Right */}
                    <div style={{ animation: 'float1 11s ease-in-out infinite 3s' }} className="absolute top-[68vh] right-[-5%] md:right-[5%]">
                        <CoinSVG symbol="€" side="right" className="w-[140px] h-[140px] md:w-[200px] md:h-[200px] text-gray-300 opacity-40 transform rotate-[15deg] transition-transform duration-[10000ms]" />
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
                        <div className="flex bg-white/80 backdrop-blur-xl p-1.5 rounded-2xl mb-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)] border border-gray-200/50 max-w-sm mx-auto">
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
                        <div className="min-h-[260px] flex items-center justify-center text-left" key={heroTab}>
                            {heroTab === 'agent' ? (
                                <div className="w-full bg-[#1C1C1E] rounded-3xl p-6 md:p-8 shadow-[0_30px_60px_rgba(0,0,0,0.4)] border border-white/5 overflow-hidden relative group font-sans animate-fadeIn">
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
                    className={`space-y-16 mt-32 transition-all duration-700 delay-200 ${featuresRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                >
                    <div className="text-center space-y-4 mb-20 relative">
                        <div className="inline-block relative">
                            <h2 className="text-4xl md:text-5xl font-black text-black tracking-tight relative z-10">Ecosystem Architecture</h2>
                        </div>
                        <p className="text-gray-500 text-lg font-medium max-w-2xl mx-auto">Engineered from the ground up to eliminate friction in AI-driven commerce.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Natural Language Flow */}
                        <div className="group bg-white/40 backdrop-blur-2xl p-10 md:p-12 rounded-[2.5rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_30px_60px_rgb(0,0,0,0.08)] hover:bg-white/70 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                            <div className="w-14 h-14 bg-white shadow-lg text-blue-500 rounded-2xl flex items-center justify-center mb-8 border border-white/50 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 relative z-10">
                                <Icons.Chat />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight relative z-10">Conversational Settlement</h3>
                            <p className="text-sm text-gray-500 leading-relaxed relative z-10 font-medium">
                                Execute payments, configure complex conditional logic, and orchestrate capital routing entirely through natural language commands natively optimized for multi-agent workflows.
                            </p>
                        </div>

                        {/* ZK Privacy */}
                        <div className="group bg-white/40 backdrop-blur-2xl p-10 md:p-12 rounded-[2.5rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_30px_60px_rgb(0,0,0,0.08)] hover:bg-white/70 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                            <div className="w-14 h-14 bg-white shadow-lg text-indigo-500 rounded-2xl flex items-center justify-center mb-8 border border-white/50 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 relative z-10">
                                <Icons.Shield />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight relative z-10">Zero-Knowledge Autonomy</h3>
                            <p className="text-sm text-gray-500 leading-relaxed relative z-10 font-medium">
                                Institutional-grade financial privacy. ZK proofs validate policy compliance and portfolio solvency instantly without ever exposing balances, counterparties, or proprietary strategies.
                            </p>
                        </div>

                        {/* Trustless Credit & Identity */}
                        <div className="group bg-white/40 backdrop-blur-2xl p-10 md:p-12 rounded-[2.5rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_30px_60px_rgb(0,0,0,0.08)] hover:bg-white/70 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                            <div className="w-14 h-14 bg-white shadow-lg text-cyan-500 rounded-2xl flex items-center justify-center mb-8 border border-white/50 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 relative z-10">
                                <Icons.User />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight relative z-10">Programmable Reputation</h3>
                            <p className="text-sm text-gray-500 leading-relaxed relative z-10 font-medium">
                                Dynamic deterministic credit scoring establishes behavioral identity on-chain. Progress from anonymous multi-sig wallets to trusted, measurable institutional agent relationships.
                            </p>
                        </div>

                        {/* Zero-fee infrastructure */}
                        <div className="group bg-white/40 backdrop-blur-2xl p-10 md:p-12 rounded-[2.5rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_30px_60px_rgb(0,0,0,0.08)] hover:bg-white/70 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                            <div className="w-14 h-14 bg-white shadow-lg text-violet-500 rounded-2xl flex items-center justify-center mb-8 border border-white/50 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 relative z-10">
                                <Icons.Swap />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight relative z-10">Absolute Zero-Fee Rail</h3>
                            <p className="text-sm text-gray-500 leading-relaxed relative z-10 font-medium">
                                Engineered atop a custom sovereign layer enabling infinite friction-free microtransactions. Seamless T+0 finality deeply integrated alongside structural global fiat gateways.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ─── Deep Tech Architecture ─── */}
                <section
                    ref={stackRef.ref}
                    className={`space-y-16 pt-24 pb-12 transition-all duration-700 delay-300 ${stackRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                >
                    <div className="text-center space-y-4 mb-20">
                        <h2 className="text-4xl md:text-5xl font-black text-black tracking-tight">The Institutional Stack.</h2>
                        <p className="text-gray-500 text-lg font-medium">Modular, secure components forged for enterprise-grade throughput.</p>
                    </div>

                    <div className="relative max-w-5xl mx-auto">
                        {/* Continuous vertical line */}
                        <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-gray-200 via-gray-300 to-transparent transform md:-translate-x-1/2"></div>

                        <div className="space-y-24">
                            {/* Layer 3 */}
                            <div className="relative flex flex-col md:flex-row items-start md:justify-between w-full group">
                                <div className="md:w-5/12 ml-16 md:ml-0 md:text-right md:pr-12 text-left mb-6 md:mb-0">
                                    <h3 className="text-2xl font-black text-black">Experience & SDK Layer</h3>
                                    <p className="text-gray-500 mt-3 font-medium text-sm leading-relaxed">Turnkey integration suites for autonomous agents and decentralized businesses. Featuring automated gas sponsorships, isolated session keys, and comprehensive policy rule configurations.</p>
                                </div>
                                <div className="absolute left-6 md:left-1/2 w-4 h-4 bg-black rounded-full border-4 border-white shadow-md transform -translate-x-1/2 mt-1.5 md:mt-2 transition-transform group-hover:scale-150 group-hover:bg-green-500"></div>
                                <div className="md:w-5/12 ml-16 md:ml-0 md:pl-12 w-[calc(100%-4rem)]">
                                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 hover:border-gray-200">
                                        <h4 className="text-[10px] font-bold text-gray-400 tracking-widest  mb-4">SKILL Framework</h4>
                                        <p className="text-sm font-semibold text-gray-800 mb-2">Plonky2 + Groth16 Native Proofs</p>
                                        <p className="text-xs text-gray-500 leading-relaxed">Local runtime compiling dynamic exposure limits into deployable zero-knowledge circuits directly within the agent workflow.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Layer 2 */}
                            <div className="relative flex flex-col md:flex-row items-start md:justify-between w-full group">
                                <div className="md:w-5/12 ml-16 md:ml-0 md:text-right md:pr-12 text-left mb-6 md:mb-0 md:order-1 order-3 w-[calc(100%-4rem)]">
                                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 hover:border-gray-200">
                                        <h4 className="text-[10px] font-bold text-gray-400 tracking-widest  mb-4">Execution Environment</h4>
                                        <p className="text-sm font-semibold text-gray-800 mb-2">AWS Nitro Enclaves Hub</p>
                                        <p className="text-xs text-gray-500 leading-relaxed">Hardware-level CPU segregation guarantees absolute data confidentiality, rendering proprietary strategies completely opaque to hosts and operators.</p>
                                    </div>
                                </div>
                                <div className="absolute left-6 md:left-1/2 w-4 h-4 bg-gray-300 rounded-full border-4 border-white shadow-md transform -translate-x-1/2 mt-1.5 md:mt-2 md:order-2 order-2 transition-transform group-hover:scale-150 group-hover:bg-green-500"></div>
                                <div className="md:w-5/12 ml-16 md:ml-0 md:pl-12 md:order-3 order-1 mb-6 md:mb-0 text-left">
                                    <h3 className="text-2xl font-black text-black">Computation & Risk Engine</h3>
                                    <p className="text-gray-500 mt-3 font-medium text-sm leading-relaxed">The invisible processing powerhouse safely driving compliance frameworks, multi-tenant agent logical routing, and rigorous fraud deterrence inside restricted boundaries.</p>
                                </div>
                            </div>

                            {/* Layer 1 */}
                            <div className="relative flex flex-col md:flex-row items-start md:justify-between w-full group">
                                <div className="md:w-5/12 ml-16 md:ml-0 md:text-right md:pr-12 text-left mb-6 md:mb-0">
                                    <h3 className="text-2xl font-black text-black">Ledger & Securitization</h3>
                                    <p className="text-gray-500 mt-3 font-medium text-sm leading-relaxed">Algorithmic capital utilization mechanisms capturing risk-free US Treasury yields to fund network emission mechanics, enabling continuous capital creation via AIUSD stablecoins.</p>
                                </div>
                                <div className="absolute left-6 md:left-1/2 w-4 h-4 bg-gray-200 rounded-full border-4 border-white shadow-md transform -translate-x-1/2 mt-1.5 md:mt-2 transition-transform group-hover:scale-150 group-hover:bg-green-500"></div>
                                <div className="md:w-5/12 ml-16 md:ml-0 md:pl-12 w-[calc(100%-4rem)]">
                                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 hover:border-gray-200">
                                        <h4 className="text-[10px] font-bold text-gray-400 tracking-widest  mb-4">Programmable Assets</h4>
                                        <p className="text-sm font-semibold text-gray-800 mb-2">Native Yield & RWA Discounting</p>
                                        <p className="text-xs text-gray-500 leading-relaxed">Convert historically illiquid verifiable business incomes like SaaS API usage or decentralized Compute nodes into instantly tradeable Yield and Principal tokens.</p>
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
