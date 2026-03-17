import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ──────────────────────────────────────────────
   Loka Developer Platform Landing Page
   A highly premium, innovative, "aisa.one"-level
   showcase of the API and SDK capabilities.
   ────────────────────────────────────────────── */

// ─── Scroll Reveal Hook ────────────────────────
const useScrollReveal = (threshold = 0.15) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(el); } },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};

// Wrapper component for scroll-reveal sections
const RevealSection: React.FC<{ children: React.ReactNode; className?: string; delay?: number; id?: string }> = ({ children, className = '', delay = 0, id }) => {
  const { ref, isVisible } = useScrollReveal(0.1);
  return (
    <div
      ref={ref}
      id={id}
      className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// ─── Particle Canvas Component ─────────────────
const ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animRef = useRef<number>(0);

  const initParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth * dpr;
      canvas.height = parent.clientHeight * dpr;
      canvas.style.width = `${parent.clientWidth}px`;
      canvas.style.height = `${parent.clientHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const w = () => canvas.width / (window.devicePixelRatio || 1);
    const h = () => canvas.height / (window.devicePixelRatio || 1);

    const PARTICLE_COUNT = 80;
    const CONNECTION_DISTANCE = 120;
    const MOUSE_RADIUS = 180;

    interface Particle { x: number; y: number; vx: number; vy: number; r: number; alpha: number; }
    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * w(),
        y: Math.random() * h(),
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, w(), h());
      const cw = w(), ch = h();

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = cw;
        if (p.x > cw) p.x = 0;
        if (p.y < 0) p.y = ch;
        if (p.y > ch) p.y = 0;
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DISTANCE) {
            const opacity = (1 - dist / CONNECTION_DISTANCE) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Mouse connections
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      for (const p of particles) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS) {
          const opacity = (1 - dist / MOUSE_RADIUS) * 0.3;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mx, my);
          ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // Draw particles
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16, 185, 129, ${p.alpha})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  useEffect(() => {
    const cleanup = initParticles();
    return cleanup;
  }, [initParticles]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -1000, y: -1000 };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto z-0"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    />
  );
};

// ─── Data & Copywriting ────────────────────────
const CODE_SAMPLES: Record<string, string> = {
  'React (Fiat SDK)': `import { LokaCashPrivyRoot, useLokaCashDeposit } from '@lokacash/fiat/react';

// 1. Wrap your entire application in 1 line
export default function App() {
  return (
    <LokaCashPrivyRoot apiKey="lk_live_xxxxxxxxxxxx">
      <DeFiDashboard />
    </LokaCashPrivyRoot>
  );
}

// 2. Unleash global fiat liquidity in 1 click
function DeFiDashboard() {
  const { open, isOpening } = useLokaCashDeposit();
  
  return (
    <button 
      className="bg-black text-white px-4 py-2 rounded-lg hover:scale-105"
      onClick={() => open({ 
        amount: '1000', 
        asset: 'USDC', 
        preferredProvider: 'onramper' // Global coverage across 190+ countries
      })}
      disabled={isOpening}
    >
      Deposit Crypto via Credit Card
    </button>
  );
}`,

  'Node.js (Loka AI API)': `const { LokaClient } = require("@lokacash/node-sdk");

// Initialize the Loka Enterprise Client
const client = new LokaClient("lk_live_xxxxxxxxxxxx");

async function runAutonomousInvestment() {
  // 1. Ask the AI Risk Engine for AAA-rated opportunities
  const recommendations = await client.ai.getOpportunities({
    minApy: 12.5,
    riskLevel: "Low",
    assetClass: "Real Estate Cash Flows"
  });

  const topPick = recommendations[0];
  console.log(\`🤖 AI selected: \${topPick.name} (Score: \${topPick.aiRating})\`);

  // 2. Instantly execute the investment programmatically
  const tx = await client.invest({
    projectId: topPick.id,
    amountUsdc: 50000,
    autoStake: true
  });

  console.log(\`✅ Invested! TX Hash: \${tx.hash}\`);
}

runAutonomousInvestment();`,

  'Python (Agents)': `from loka.agent import LokaAgentSDK

sdk = LokaAgentSDK("lk_live_xxxxxxxxxxxx")

# Give your autonomous AI Agent a financial brain
def fetch_and_analyze_market():
    print("🧠 Scanning real-world asset yields...")
    
    # Direct access to the Loka Oracle Network
    market_data = sdk.market.get_live_yields(sector="SME_Loans")
    
    for asset in market_data:
        # Utilize DeepSeek V3 integration for deep risk profiling
        risk_report = sdk.ai.generate_risk_report(asset.id)
        
        if risk_report.safety_score > 90:
            print(f"🔥 Prime Asset Found: {asset.name} yielding {asset.apy}%")
            # Agent can now trigger smart contract interactions
            
fetch_and_analyze_market()`
};

// ─── Use Cases Data ────────────────────────────
const USE_CASES = [
  {
    id: 'wallet',
    title: 'DeFi Wallets',
    desc: 'Integrate the Fiat SDK to let users buy USDC directly into your wallet interface, instantly converting fiat to on-chain purchasing power without leaving your app.',
    metric: '+40% Conversion',
  },
  {
    id: 'agent',
    title: 'Autonomous AI Agents',
    desc: 'Feed our REST APIs directly to your LLM agent. Let it query real-time RWA yields, assess credit scores via our AI engine, and execute trades fully autonomously.',
    metric: '100% On-Chain',
  },
  {
    id: 'institution',
    title: 'Institutional Funds',
    desc: 'Use our Webhooks and WebSocket streams to build algorithmic trading bots for cash flow assets, automatically reinvesting AIUSD stablecoins for compound yield.',
    metric: '<50ms Latency',
  }
];

// ─── API Endpoints ─────────────────────────────
const ENDPOINTS = [
  { method: 'GET', path: '/v1/projects', desc: 'List all fundraising projects with filters' },
  { method: 'POST', path: '/v1/projects/:id/invest', desc: 'Invest in a cash flow project' },
  { method: 'DELETE', path: '/v1/projects/:id/revoke', desc: 'Revoke investment during fundraising' },
  { method: 'POST', path: '/v1/portfolio/mint', desc: 'Mint AIUSD from USDC' },
  { method: 'POST', path: '/v1/portfolio/redeem', desc: 'Redeem AIUSD to USDC' },
  { method: 'GET', path: '/v1/portfolio/holdings', desc: 'Get user portfolio holdings' },
  { method: 'GET', path: '/v1/credit/score', desc: 'Get AI-powered credit score' },
  { method: 'POST', path: '/v1/chat/send', desc: 'Send message to AI advisor' },
];

const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  GET: { bg: '#ecfdf5', text: '#059669' },
  POST: { bg: '#eff6ff', text: '#2563eb' },
  PUT: { bg: '#fffbeb', text: '#d97706' },
  DELETE: { bg: '#fef2f2', text: '#dc2626' },
};

// ─── Partner Logos with SVG Icons ───────────────
const PARTNER_LOGOS = [
  {
    name: 'Coinbase',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 1024 1024" fill="currentColor">
        <circle cx="512" cy="512" r="512" fill="#0052FF"/>
        <path d="M512.14 692c-99.27 0-180-80.73-180-180s80.73-180 180-180c89.47 0 163.87 65.47 177.6 151h182.4C878.14 296.4 714.94 152 512.14 152 313.34 152 152.14 313.2 152.14 512s161.2 360 360 360c202.8 0 366-144.4 379.87-331h-182.4C695.94 626.53 601.54 692 512.14 692z" fill="white"/>
      </svg>
    ),
  },
  {
    name: 'Onramper',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    name: 'Privy',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.83-3.23 9.36-7 10.5-3.77-1.14-7-5.67-7-10.5V6.3l7-3.12z"/>
        <circle cx="12" cy="10" r="3"/>
        <path d="M12 14c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4z"/>
      </svg>
    ),
  },
  {
    name: 'Base',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 111 111" fill="currentColor">
        <circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF"/>
        <path d="M55.39 94.14c21.36 0 38.67-17.31 38.67-38.67S76.75 16.8 55.39 16.8c-20.07 0-36.55 15.29-38.44 34.85h57.56v7.64H16.95c1.89 19.56 18.37 34.85 38.44 34.85z" fill="white"/>
      </svg>
    ),
  },
  {
    name: 'DeepSeek',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
      </svg>
    ),
  },
];

// ─── Code Render Helper ────────────────────────
const RenderCodeWithLines = ({ codeHtml }: { codeHtml: string }) => {
  const lines = codeHtml.split('\n');
  return (
    <div className="font-mono text-[11px] sm:text-[13px] leading-[1.7] w-full">
      {lines.map((line, i) => (
        <div key={i} className="flex px-1 hover:bg-white/5 transition-colors rounded group items-start">
          <div className="w-6 sm:w-8 flex-shrink-0 text-right pr-2 sm:pr-4 text-gray-600 select-none border-r border-gray-800 mr-2 sm:mr-4 group-hover:text-gray-400 transition-colors pt-[2px]">
            {i + 1}
          </div>
          <div className="whitespace-pre-wrap break-words flex-1 text-gray-300" dangerouslySetInnerHTML={{ __html: line || ' ' }} />
        </div>
      ))}
    </div>
  );
};

// ─── Copy Button Component ─────────────────────
const CopyButton: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback silently */ }
  };
  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 ${
        copied
          ? 'bg-emerald-500/20 text-emerald-400'
          : 'bg-white/10 text-gray-400 hover:text-white hover:bg-white/20'
      }`}
      title="Copy code"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          Copy
        </>
      )}
    </button>
  );
};

// ─── Nav Links ─────────────────────────────────
const NAV_LINKS = [
  { label: 'SDK', href: '#sdk' },
  { label: 'API', href: '#api' },
  { label: 'Use Cases', href: '#usecases' },
  { label: 'Endpoints', href: '#endpoints' },
];

// ─── Main Component ────────────────────────────
const ApiLanding: React.FC = () => {
  const [activeUseCase, setActiveUseCase] = useState<string>('wallet');
  const [scrolled, setScrolled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = (containerRef.current?.scrollTop || 0) > 50;
      setScrolled(isScrolled);
    };
    const container = containerRef.current;
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div ref={containerRef} className="min-h-full overflow-y-auto bg-[#fafafa] relative pb-32 text-slate-900 font-sans selection:bg-black selection:text-white" id="api-container">
      
      {/* ── Sticky Glassmorphism Nav ── */}
      <div className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl shadow-lg shadow-gray-200/30 border-b border-gray-200/50' : 'bg-transparent'}`}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-2">
            <span className={`font-black text-lg tracking-tight transition-opacity duration-300 ${scrolled ? 'opacity-100' : 'opacity-0'}`}>Loka</span>
          </div>
          <nav className={`hidden md:flex items-center gap-8 transition-opacity duration-300 ${scrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {NAV_LINKS.map(link => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="text-sm font-semibold text-gray-600 hover:text-black transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>
          <button className={`hidden sm:block px-5 py-2 rounded-xl text-sm font-bold bg-black text-white hover:bg-gray-800 transition-all hover:scale-105 ${scrolled ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
            Get API Key
          </button>
        </div>
      </div>

      {/* ── Abstract Premium Backgrounds ── */}
      <div className="absolute inset-0 pointer-events-none" 
           style={{ 
             backgroundImage: 'linear-gradient(to right, #00000008 1px, transparent 1px), linear-gradient(to bottom, #00000008 1px, transparent 1px)', 
             backgroundSize: '40px 40px',
             maskImage: 'linear-gradient(to bottom, black 20%, transparent 80%)',
             WebkitMaskImage: 'linear-gradient(to bottom, black 20%, transparent 80%)'
           }} />
           
      {/* Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-400 blur-[140px] opacity-10 mix-blend-multiply pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute top-[-5%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-400 blur-[130px] opacity-10 mix-blend-multiply pointer-events-none animate-pulse" style={{ animationDuration: '12s' }} />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12 sm:py-32 space-y-16 sm:space-y-32 relative z-10 w-full">
        
        {/* ── 1. Hero Section (Hyper-Premium) ── */}
        <section className="text-center space-y-5 sm:space-y-8 flex flex-col items-center relative">
          
          {/* Particle Canvas Background */}
          <div className="absolute inset-0 -top-32 -bottom-32 -left-20 -right-20 pointer-events-none overflow-hidden">
            <ParticleCanvas />
          </div>

          <RevealSection>
            <a href="#sdk" className="group inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer relative z-10">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-600"></span>
              </span>
              <span className="text-[10px] sm:text-xs font-bold tracking-wide text-gray-800">Loka Developer Platform v2.0 is Live</span>
              <span className="text-gray-400 group-hover:text-black transition-colors">→</span>
            </a>
          </RevealSection>

          <RevealSection delay={100}>
            <div className="relative z-10">
              <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-[80px] font-black tracking-tighter leading-[1.1] sm:leading-[1.05] text-black max-w-5xl mx-auto" style={{ fontFeatureSettings: '"salt" 1' }}>
                The Unified Liquidity &{' '}
                <br className="hidden sm:block" />
                Intelligence Layer for{' '}
                <span className="relative inline-block italic pr-4">
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                    RWA.
                  </span>
                </span>
              </h1>
            </div>
          </RevealSection>

          <RevealSection delay={200}>
            <p className="text-base sm:text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed text-gray-500 font-medium relative z-10">
              Powering the next generation of financial applications. Access instant fiat on-ramps, 
              AI-driven credit scoring, and programmatic cash flow investments through a single, elegant API.
            </p>
          </RevealSection>

          <RevealSection delay={300}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 sm:pt-6 w-full sm:w-auto relative z-10">
              <button className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 rounded-2xl text-sm sm:text-base font-black bg-black text-white hover:bg-gray-800 transition-all hover:scale-105 shadow-xl shadow-black/20 flex items-center justify-center gap-2">
                Generate API Key
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
              </button>
              <a href="https://github.com/loka-network" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 rounded-2xl text-sm sm:text-base font-bold text-black border-2 border-gray-200 bg-white hover:border-black hover:bg-gray-50 transition-all hover:scale-105 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                View on GitHub
              </a>
            </div>
          </RevealSection>

          <RevealSection delay={400}>
            <div className="pt-8 sm:pt-16 pb-4 w-full border-b border-gray-200 relative z-10">
              <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 sm:mb-8">Trusted by the best builders in Web3</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap items-center justify-center gap-x-8 sm:gap-x-14 gap-y-4 sm:gap-y-6">
                {PARTNER_LOGOS.map((partner) => (
                  <div
                    key={partner.name}
                    className="flex items-center gap-2.5 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-default"
                  >
                    <div className="text-gray-600">{partner.icon}</div>
                    <span className="text-sm sm:text-lg font-black text-gray-700">{partner.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </RevealSection>
        </section>

        {/* ── 2. The Fiat SDK Showcase (Bento Hero) ── */}
        <RevealSection id="sdk">
          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-black tracking-tight mb-2">
                  Drop-in Fiat Liquidity.
                </h2>
                <p className="text-base sm:text-lg text-gray-500 font-medium">Turn any user into a funded user in 5 lines of code.</p>
              </div>
              <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold border border-emerald-200 shadow-sm flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Production Ready
              </div>
            </div>

            {/* Massive Bento Card */}
            <div className="rounded-[24px] sm:rounded-[40px] bg-white border border-gray-200 shadow-2xl shadow-gray-200/50 overflow-hidden flex flex-col lg:flex-row hover:shadow-3xl transition-shadow duration-500">
              
              {/* Left Info Panel */}
              <div className="p-6 sm:p-10 lg:p-14 lg:w-5/12 bg-gray-50/50 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-gray-200 relative overflow-hidden">
                 {/* Decorative background element */}
                 <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-[80px]" />
                 
                 <code className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-lg w-fit mb-6 border border-emerald-200 shadow-sm">
                   @lokacash/fiat
                 </code>
                 <h3 className="text-3xl font-black text-black mb-4 leading-tight">
                   Global On-Ramp SDK
                 </h3>
                 <p className="text-gray-500 text-lg leading-relaxed mb-8">
                   We abstracted away the absolute nightmare of fiat integration. 
                   By combining <strong>Coinbase Onramp</strong> and the <strong>Onramper Aggregator</strong>, 
                   we give your app access to instant USDC deposits across 190+ countries.
                 </p>

                 <div className="space-y-6">
                   <div className="flex gap-4 items-start">
                     <div className="w-10 h-10 rounded-2xl bg-white shadow-md border border-gray-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                     </div>
                     <div>
                       <h4 className="text-base font-bold text-black">Option A: Privy Native</h4>
                       <p className="text-sm text-gray-500 mt-1 leading-relaxed">If you use React and Privy, our Root Wrapper automatically intercepts and supercharges `useFundWallet`.</p>
                     </div>
                   </div>
                   
                   <div className="flex gap-4 items-start">
                     <div className="w-10 h-10 rounded-2xl bg-white shadow-md border border-gray-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                     </div>
                     <div>
                       <h4 className="text-base font-bold text-black">Option B: Universal Direct</h4>
                       <p className="text-sm text-gray-500 mt-1 leading-relaxed">Using MetaMask or WalletConnect? Just pass us the user's 0x address. We handle the entire UI modal overlay.</p>
                     </div>
                   </div>
                 </div>
              </div>

              {/* Right Interactive Code Panel */}
              <div className="p-4 sm:p-8 lg:p-12 lg:w-7/12 bg-[#0A0A0B] relative flex flex-col justify-center">
                {/* Fake IDE Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
                      <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-red-500/80 border border-red-500/50"></div>
                      <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-amber-500/80 border border-amber-500/50"></div>
                      <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-green-500/80 border border-green-500/50"></div>
                    </div>
                    <div className="px-2 sm:px-3 py-1 rounded-md bg-white/10 text-[10px] sm:text-[11px] text-gray-400 font-mono border border-white/5 truncate">
                      App.tsx — Loka Integration
                    </div>
                  </div>
                  <CopyButton code={CODE_SAMPLES['React (Fiat SDK)']} />
                </div>
                
                <div className="overflow-x-auto selection:bg-blue-500/30 pb-4">
                  <RenderCodeWithLines codeHtml={
                    CODE_SAMPLES['React (Fiat SDK)']
                      .replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;')
                      .replace(/import/g, '<span class="text-pink-400">import</span>')
                      .replace(/from/g, '<span class="text-pink-400">from</span>')
                      .replace(/export default/g, '<span class="text-pink-400">export default</span>')
                      .replace(/function/g, '<span class="text-blue-400">function</span>')
                      .replace(/return/g, '<span class="text-blue-400">return</span>')
                      .replace(/const/g, '<span class="text-purple-400">const</span>')
                      .replace(/className/g, '<span class="text-sky-300">className</span>')
                      .replace(/"lk_live_xxxxxxxxxxxx"/g, '<span class="text-emerald-300">"lk_live_xxxxxxxxxxxx"</span>')
                      .replace(/'1000'/g, '<span class="text-emerald-300">\'1000\'</span>')
                      .replace(/'USDC'/g, '<span class="text-emerald-300">\'USDC\'</span>')
                      .replace(/'onramper'/g, '<span class="text-emerald-300">\'onramper\'</span>')
                      .replace(/\/\/.*/g, match => `<span class="text-gray-500">${match}</span>`)
                  } />
                </div>

                {/* Floating Fake UI snippet */}
                <div className="absolute bottom-10 right-10 bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 w-64 transform rotate-2 hover:rotate-0 transition-transform origin-bottom-right hidden sm:block">
                  <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">C</div>
                    <div className="text-sm font-bold text-black">Buy USDC via Coinbase</div>
                  </div>
                  <div className="text-3xl font-black text-black mb-2">$1,000.00</div>
                  <div className="text-xs text-gray-500 mb-4">You will receive ~998.50 USDC on Base</div>
                  <div className="w-full bg-blue-600 text-white text-center py-2.5 rounded-xl font-bold text-sm shadow-md">Confirm Deposit</div>
                </div>
              </div>
            </div>
          </section>
        </RevealSection>

        {/* ── 3. The Core API Grid (Modern Bento) ── */}
        <RevealSection id="api">
          <section className="space-y-6 sm:space-y-8 relative pt-8 sm:pt-16">
            <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-16 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-5xl font-black text-black tracking-tight">
                A Backend Built for <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Autonomy</span>
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed">
                Loka's REST API exposes our entire smart contract architecture through standard web requests. No complex ABIs, no RPC nodes required.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* API Card 1: Risk Engine (Large) */}
              <div className="md:col-span-8 p-6 sm:p-10 rounded-[20px] sm:rounded-[32px] bg-white border border-gray-200 shadow-xl shadow-gray-200/40 group hover:border-black/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[60px] group-hover:bg-indigo-500/25 transition-all duration-500" />
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 border border-indigo-100">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                </div>
                <h3 className="text-2xl font-black text-black mb-3">AI-Powered Risk Engine</h3>
                <p className="text-gray-500 leading-relaxed max-w-md">
                   Bypass manual due diligence. Ping our `GET /v1/credit/score` endpoint to receive a DeepSeek-generated, AAA-to-D risk report and real-time cash flow probability assessment for any protocol asset.
                </p>
              </div>

              {/* API Card 2: AIUSD (Square) */}
              <div className="md:col-span-4 p-6 sm:p-10 rounded-[20px] sm:rounded-[32px] bg-black text-white shadow-2xl shadow-black/30 group relative overflow-hidden flex flex-col justify-end min-h-[240px] sm:min-h-[300px] hover:-translate-y-1 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 border border-white/20 relative z-20 group-hover:bg-white/20 transition-colors duration-300">
                  <span className="text-2xl">🪙</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-3 relative z-20">AIUSD Protocol</h3>
                <p className="text-gray-400 leading-relaxed text-sm relative z-20">
                  Mint and redeem the treasury-backed stablecoin programmatically. Build DeFi vaults that auto-compound yield with zero UI interaction.
                </p>
              </div>

              {/* API Card 3: Cash Flow (Square) */}
              <div className="md:col-span-5 p-6 sm:p-10 rounded-[20px] sm:rounded-[32px] bg-white border border-gray-200 shadow-xl shadow-gray-200/40 relative overflow-hidden group hover:border-black/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <div className="absolute -left-20 -bottom-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-[50px] group-hover:bg-emerald-500/25 transition-all duration-500" />
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 border border-emerald-100">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <h3 className="text-xl font-black text-black mb-2">Programmatic Assets</h3>
                <p className="text-gray-500 leading-relaxed text-sm">
                  Search, filter, and buy fragmented real-world cash flow notes via simple HTTP POST requests. Total liquidity control.
                </p>
              </div>

              {/* API Card 4: Webhooks (Wide) */}
              <div className="md:col-span-7 p-6 sm:p-10 rounded-[20px] sm:rounded-[32px] bg-white border border-gray-200 shadow-xl shadow-gray-200/40 relative overflow-hidden group hover:border-black/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                 <div className="absolute inset-0 bg-white/90" />
                 <div className="relative z-10 w-full h-full flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 border border-blue-100">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <h3 className="text-xl font-black text-black mb-2">Real-Time Webhooks</h3>
                      <p className="text-gray-500 leading-relaxed text-sm">
                        Don't poll. Get instantly notified when a project hits its fundraising target, or when borrower repayments hit the smart contract waterfall.
                      </p>
                    </div>
                    <div className="w-full md:w-48 h-32 bg-slate-900 rounded-2xl border-4 border-slate-800 p-4 shadow-inner flex flex-col justify-center group-hover:border-slate-700 transition-colors duration-300">
                       <div className="font-mono text-[10px] text-green-400 mb-1">POST /webhooks/receive</div>
                       <div className="font-mono text-[9px] text-gray-400">{"{"}</div>
                       <div className="font-mono text-[9px] text-gray-300 pl-2">"event": "REPAYMENT",</div>
                       <div className="font-mono text-[9px] text-gray-300 pl-2">"amount": "12500.00"</div>
                       <div className="font-mono text-[9px] text-gray-400">{"}"}</div>
                    </div>
                 </div>
              </div>

            </div>
          </section>
        </RevealSection>

        {/* ── 4. Use Cases Interactive ── */}
        <RevealSection id="usecases">
          <section className="py-20 border-y border-gray-200 space-y-10">
            {/* Header */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-black tracking-tight">Built for Builders</h2>
              <p className="text-gray-500 text-lg leading-relaxed">See how industry leaders are leveraging Loka's composite architecture to launch products 10x faster.</p>
            </div>

            {/* ── Horizontal Tab Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {USE_CASES.map(uc => {
                const isActive = activeUseCase === uc.id;
                const icons: Record<string, React.ReactNode> = {
                  wallet: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
                  agent: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
                  institution: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
                };
                return (
                  <button
                    key={uc.id}
                    onClick={() => setActiveUseCase(uc.id)}
                    className={`group relative text-left p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer
                      ${isActive
                        ? 'bg-black text-white border-black shadow-xl shadow-black/20 scale-[1.02]'
                        : 'bg-white text-black border-gray-200 hover:border-gray-400 hover:shadow-lg hover:-translate-y-0.5'
                      }`}
                  >
                    {/* Icon + Metric row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-white/15' : 'bg-gray-100 group-hover:bg-gray-200'} transition-colors`}>
                        <span className={isActive ? 'text-white' : 'text-gray-600'}>{icons[uc.id]}</span>
                      </div>
                      <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                        {uc.metric}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold mb-1.5">{uc.title}</h4>
                    <p className={`text-sm leading-relaxed ${isActive ? 'text-gray-300' : 'text-gray-500'}`}>{uc.desc}</p>
                    {/* Active indicator bar */}
                    <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-1 rounded-full transition-all duration-300 ${isActive ? 'w-12 bg-emerald-400' : 'w-0 bg-transparent'}`} />
                  </button>
                );
              })}
            </div>

            {/* ── Full-Width Code Window ── */}
            <div className="rounded-[24px] overflow-hidden bg-[#0A0A0B] shadow-2xl border border-gray-800 transition-all duration-500 hover:shadow-[0_25px_60px_rgba(0,0,0,0.4)]">
              <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    {activeUseCase === 'wallet' ? 'wallet-integration.ts' : activeUseCase === 'agent' ? 'ai-trader.py' : 'quant-bot.go'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-[10px] text-emerald-400 font-bold bg-emerald-400/10 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    LIVE
                  </div>
                  <CopyButton code={
                    activeUseCase === 'wallet'
                      ? CODE_SAMPLES['React (Fiat SDK)']
                      : activeUseCase === 'agent'
                      ? CODE_SAMPLES['Python (Agents)']
                      : CODE_SAMPLES['Node.js (Loka AI API)'] || ''
                  } />
                </div>
              </div>
              <div className="p-3 sm:p-6 overflow-x-auto min-h-[280px] sm:min-h-[320px] max-h-[480px] selection:bg-blue-500/30">
                <RenderCodeWithLines codeHtml={
                  activeUseCase === 'wallet' 
                    ? CODE_SAMPLES['React (Fiat SDK)'].replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\/\/.*/g, match => `<span class="text-gray-500">${match}</span>`).replace(/import/g, '<span class="text-pink-400">import</span>').replace(/from/g, '<span class="text-pink-400">from</span>').replace(/export default/g, '<span class="text-pink-400">export default</span>').replace(/function/g, '<span class="text-blue-400">function</span>').replace(/return/g, '<span class="text-blue-400">return</span>').replace(/const/g, '<span class="text-purple-400">const</span>')
                    : activeUseCase === 'agent'
                    ? CODE_SAMPLES['Python (Agents)'].replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/#.*/g, match => `<span class="text-gray-500">${match}</span>`).replace(/def/g, '<span class="text-blue-400">def</span>').replace(/for/g, '<span class="text-pink-400">for</span>').replace(/if/g, '<span class="text-pink-400">if</span>').replace(/import/g, '<span class="text-pink-400">import</span>').replace(/print/g, '<span class="text-yellow-200">print</span>')
                    : (CODE_SAMPLES['Node.js (Loka AI API)'] || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\/\/.*/g, match => `<span class="text-gray-500">${match}</span>`).replace(/const/g, '<span class="text-purple-400">const</span>').replace(/require/g, '<span class="text-blue-400">require</span>').replace(/async/g, '<span class="text-pink-400">async</span>').replace(/await/g, '<span class="text-pink-400">await</span>').replace(/function/g, '<span class="text-blue-400">function</span>')
                } />
              </div>
            </div>
          </section>
        </RevealSection>

        {/* ── 5. Endpoints Reference ── */}
        <RevealSection id="endpoints">
          <section className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-black text-black">Data Endpoints</h2>
                <p className="text-gray-500">All responses are standard JSON. OpenAPI 3.0 spec available.</p>
              </div>
              <button className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1">
                View API Documentation <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </button>
            </div>
            
            <div className="rounded-[16px] sm:rounded-[24px] overflow-hidden border border-gray-200 bg-white shadow-lg shadow-gray-200/50 hover:shadow-xl transition-shadow duration-300">
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left">
                  <tbody>
                    {ENDPOINTS.map((ep, i) => {
                      const mc = METHOD_COLORS[ep.method] || METHOD_COLORS.GET;
                      return (
                        <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors group">
                          <td className="px-6 py-5 w-[120px]">
                            <span className="text-[11px] font-black px-3 py-1.5 rounded-lg inline-block text-center w-full" style={{ background: mc.bg, color: mc.text }}>
                              {ep.method}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-sm font-mono font-bold text-gray-800">{ep.path}</td>
                          <td className="px-6 py-5 text-sm text-gray-500 group-hover:text-black transition-colors">{ep.desc}</td>
                          <td className="px-6 py-5 text-right w-10">
                            <button className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-black">
                               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Mobile stacked cards */}
              <div className="sm:hidden divide-y divide-gray-100">
                {ENDPOINTS.map((ep, i) => {
                  const mc = METHOD_COLORS[ep.method] || METHOD_COLORS.GET;
                  return (
                    <div key={i} className="p-4 flex items-start gap-3">
                      <span className="text-[10px] font-black px-2 py-1 rounded-md flex-shrink-0 mt-0.5" style={{ background: mc.bg, color: mc.text }}>
                        {ep.method}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-mono font-bold text-gray-800 truncate">{ep.path}</div>
                        <div className="text-xs text-gray-500 mt-1">{ep.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </RevealSection>

        {/* ── Bottom CTA ────────────────────── */}
        <RevealSection>
          <section className="text-center space-y-6 sm:space-y-8 py-12 sm:py-20 px-4 sm:px-6 rounded-[24px] sm:rounded-[40px] bg-black text-white relative overflow-hidden mt-8 sm:mt-16 shadow-2xl shadow-black/30">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="relative z-10 space-y-4 sm:space-y-6 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                Ready to shift to Web3 rails?
              </h2>
              <p className="text-base sm:text-lg text-gray-300">
                Stop messing with legacy banking APIs. Generate your Loka API key in seconds and drop the Fiat SDK into your app today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-4">
                <button className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 rounded-2xl text-sm font-black bg-white text-black hover:bg-gray-100 transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                  Start Building for Free
                </button>
                <button className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 rounded-2xl text-sm font-bold text-white border border-gray-700 bg-black/50 backdrop-blur-sm hover:bg-gray-800 transition-all hover:scale-105">
                  Contact Enterprise Sales
                </button>
              </div>
              <p className="text-[10px] sm:text-xs pt-2 sm:pt-4 text-gray-500">
                No credit card required for Sandbox access. We respond to Enterprise inquiries within 2 hours.
              </p>
            </div>
          </section>
        </RevealSection>

      </div>
    </div>
  );
};

export default ApiLanding;
