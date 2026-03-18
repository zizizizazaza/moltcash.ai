import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ═══════════════════════════════════════════════
   Loka Developer Platform — API Page
   Flat UI / Full-Width Grid / Minimalist Typographic
═══════════════════════════════════════════════ */

// ─── Scroll Reveal ─────────────────────────────
const useScrollReveal = (threshold = 0.05) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setIsVisible(true); obs.unobserve(el); } },
      { threshold, rootMargin: '0px 0px 0px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, isVisible };
};

const Reveal: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({
  children, className = '', delay = 0
}) => {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div ref={ref}
      className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
};

// ─── Particle Canvas (Flat neutral) ─────────────
const ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const animRef = useRef<number>(0);

  const boot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const p = canvas.parentElement;
      if (!p) return;
      canvas.width = p.clientWidth * dpr;
      canvas.height = p.clientHeight * dpr;
      canvas.style.width = `${p.clientWidth}px`;
      canvas.style.height = `${p.clientHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);
    interface P { x: number; y: number; vx: number; vy: number; r: number; a: number; }
    const w = () => canvasRef.current!.width / dpr;
    const h = () => canvasRef.current!.height / dpr;
    const pts: P[] = Array.from({ length: 80 }, () => ({
      x: Math.random() * 2000, y: Math.random() * 1000,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5, a: Math.random() * 0.15 + 0.05,
    }));
    const frame = () => {
      const W = w(), H = h();
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(0,0,0,${(1 - d / 120) * 0.1})`; ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      const { x: mx, y: my } = mouseRef.current;
      for (const p of pts) {
        const d = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
        if (d < 160) {
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mx, my);
          ctx.strokeStyle = `rgba(0,0,0,${(1 - d / 160) * 0.15})`; ctx.lineWidth = 0.8; ctx.stroke();
        }
      }
      for (const p of pts) {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,0,0,${p.a})`; ctx.fill();
      }
      animRef.current = requestAnimationFrame(frame);
    };
    frame();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animRef.current); };
  }, []);

  useEffect(() => { const c = boot(); return c; }, [boot]);

  return (
    <canvas ref={canvasRef}
      onMouseMove={e => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      }}
      onMouseLeave={() => { mouseRef.current = { x: -9999, y: -9999 }; }}
      className="absolute inset-0 w-full h-full z-0 pointer-events-auto" />
  );
};

// ─── Data ───────────────────────────────────────
const CODE: Record<string, string> = {
  React: `import { LokaCashPrivyRoot, useLokaCashDeposit }
from '@lokacash/fiat/react';

export default function App() {
  return (
    <LokaCashPrivyRoot apiKey="lk_live_xxxx">
      <DeFiDashboard />
    </LokaCashPrivyRoot>
  );
}

function DeFiDashboard() {
  const { open } = useLokaCashDeposit();
  return (
    <button onClick={() => open({
      amount: '1000', asset: 'USDC',
      preferredProvider: 'onramper'
    })}>
      Deposit via Credit Card
    </button>
  );
}`,
  'Node.js': `const { LokaClient } = require("@lokacash/node-sdk");
const loka = new LokaClient("lk_live_xxxx");

async function autonomousInvest() {
  // Find AAA opportunities
  const picks = await loka.ai.getOpportunities({
    minApy: 12.5, riskLevel: "Low",
    assetClass: "Cash Flow Notes"
  });

  // Execute on-chain in one call
  const tx = await loka.invest({
    projectId: picks[0].id,
    amountUsdc: 50_000, autoStake: true
  });
  console.log("✅ TX:", tx.hash);
}`,
  Python: `from loka.agent import LokaAgentSDK
sdk = LokaAgentSDK("lk_live_xxxx")

def run_agent():
    # Live market yield feed
    assets = sdk.market.get_live_yields(
        sector="SME_Loans"
    )
    for asset in assets:
        # DeepSeek V3 risk profiling
        risk = sdk.ai.risk_report(asset.id)
        if risk.safety_score > 90:
            print(f"🔥 {asset.name} · {asset.apy}%")
            sdk.invest(asset.id, amount=10_000)

run_agent()`,
};

const USE_CASES = [
  { id: 'wallet', label: 'DeFi Wallets', desc: 'No bank redirects, no friction. Drop in the Fiat SDK, and users buy USDC instantly directly inside your wallet UI. Access 190+ countries out of the box.' },
  { id: 'agent', label: 'AI Agents', desc: 'Feed unstructured REST endpoints directly to your LLM. Let your agent query yields, score credit risks on the fly, and execute standard trades fully autonomously.' },
  { id: 'institution', label: 'Institutions', desc: 'WebSocket streams power algorithmic trading bots. Subscribe to on-chain repayment events and auto-reinvest AIUSD yield programmatically with sub-50ms latency.' },
];

const ENDPOINTS = [
  { method: 'GET', path: '/v1/projects', desc: 'List active projects with pagination' },
  { method: 'POST', path: '/v1/projects/:id/invest', desc: 'Invest liquidity into a cash flow note' },
  { method: 'DELETE', path: '/v1/projects/:id/revoke', desc: 'Revoke and refund during fundraising' },
  { method: 'POST', path: '/v1/portfolio/mint', desc: 'Mint AIUSD stablecoin from collateral' },
  { method: 'POST', path: '/v1/portfolio/redeem', desc: 'Redeem AIUSD back to underlying USDC' },
  { method: 'GET', path: '/v1/portfolio/holdings', desc: 'Retrieve full user portfolio state' },
  { method: 'GET', path: '/v1/credit/score', desc: 'AI-powered credit score for assets' },
];

const PARTNERS = ['Coinbase', 'Base', 'Privy', 'DeepSeek', 'Onramper'];

// ─── Copy Button ────────────────────────────────
const CopyBtn: React.FC<{ code: string }> = ({ code }) => {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={async () => {
        try { await navigator.clipboard.writeText(code); setOk(true); setTimeout(() => setOk(false), 2000); } catch { /**/ }
      }}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all border ${
        ok ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-gray-500 border-white/10 hover:text-white hover:bg-white/5'
      }`}>
      {ok ? 'Copied' : 'Copy Code'}
    </button>
  );
};

// ─── Code Block ─────────────────────────────────
const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
  const h = code
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/(\/\/.+)/g, '<span style="color:#6b7280">$1</span>')
    .replace(/(#.+)/g, '<span style="color:#6b7280">$1</span>')
    .replace(/\b(import|from|export default|return|const|let|function|async|await|def|for|if|class|require)\b/g,
      '<span style="color:#a8a29e">$1</span>') // Light gray for keywords
    .replace(/"(lk_live_[^"]+)"/g, '"<span style="color:#fff">$1</span>"')
    .replace(/("([^"<]+)")/g, match => match.includes('#fff') ? match : `<span style="color:#e5e5e5">${match}</span>`)
    .replace(/\b(\d[\d_]*\.?\d*)\b/g, '<span style="color:#d4d4d8">$1</span>');
  return (
    <div className="font-mono text-[11px] sm:text-xs leading-[1.8] tracking-tight">
      {h.split('\n').map((line, i) => (
        <div key={i} className="flex hover:bg-white/[0.04] transition-colors rounded items-start px-2">
          <span className="w-8 flex-shrink-0 text-right pr-4 text-gray-600 select-none border-r border-[#333] mr-4 pt-px shrink-0">{i + 1}</span>
          <span className="text-gray-300 whitespace-pre-wrap break-words flex-1" dangerouslySetInnerHTML={{ __html: line || ' ' }} />
        </div>
      ))}
    </div>
  );
};

// ─── Main ───────────────────────────────────────
const ApiLanding: React.FC = () => {
  const [activeLang, setActiveLang] = useState('React');
  const [activeCase, setActiveCase] = useState('wallet');

  return (
    <div className="h-full overflow-y-auto bg-white text-black selection:bg-black selection:text-white font-sans">
      
      {/* ── 1. Hero (Full-width, flat, typography focus) ── */}
      <section className="relative w-full min-h-[85vh] flex flex-col justify-center border-b border-gray-200 bg-[#fafafa]">
        {/* Flat Grid Pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
        
        {/* Interactive Particles limited to hero */}
        <div className="absolute inset-0 overflow-hidden mix-blend-multiply opacity-60">
          <ParticleCanvas />
        </div>

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 sm:px-12 xl:px-24">
          <Reveal delay={100}>
            <h1 className="text-5xl sm:text-7xl md:text-[5.5rem] font-black tracking-[-0.03em] leading-[0.95] text-black max-w-4xl">
              Fiat to DeFi.<br />
              AI Scoring.<br />
              <span className="text-gray-400">One API.</span>
            </h1>
          </Reveal>
          
          <Reveal delay={200}>
            <p className="text-lg sm:text-xl text-gray-500 font-medium leading-relaxed max-w-2xl mt-8">
              On-ramp fiat liquidity, run AI credit analysis, and execute on-chain investments — all through a single endpoint. Ship in hours, not months.
            </p>
          </Reveal>
          
          <Reveal delay={300}>
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-12">
              <button className="w-full sm:w-auto px-8 py-4 bg-black text-white text-sm font-bold hover:bg-gray-900 transition-colors flex items-center justify-center gap-2">
                Generate API Key
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </button>
              <a href="https://github.com/loka-network" target="_blank" rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 bg-transparent border border-gray-300 text-black text-sm font-bold hover:border-black transition-colors flex items-center justify-center gap-2">
                View Documentation
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Partners strip (Flat) ── */}
      <section className="border-b border-gray-200 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-6 opacity-60">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Trusted By Platform Teams</span>
          <div className="flex gap-8 sm:gap-14">
            {PARTNERS.map(p => (
              <span key={p} className="text-sm sm:text-base font-black text-gray-400 hover:text-black transition-colors cursor-default">{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. SDK Showcase (50/50 Split) ── */}
      <section className="border-b border-gray-200 flex flex-col lg:flex-row">
        {/* Left: Copy */}
        <div className="lg:w-1/2 p-8 sm:p-16 xl:p-24 border-b lg:border-b-0 lg:border-r border-gray-200 bg-white flex flex-col justify-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">Drop-in Fiat Liquidity.</h2>
            <p className="text-base text-gray-600 leading-relaxed mb-10 max-w-md">
              Integrate global on-ramps in 5 lines of code. We abstracted the UI overlays, routing, and geo-compliance across 190+ countries.
            </p>
            <div className="space-y-8">
              <div className="border-l-2 border-black pl-5">
                <h4 className="text-sm font-bold text-black mb-1">Privy Native Integration</h4>
                <p className="text-sm text-gray-500">Root Wrapper supercharges `useFundWallet`. Zero config required.</p>
              </div>
              <div className="border-l-2 border-gray-200 pl-5 hover:border-gray-400 transition-colors">
                <h4 className="text-sm font-bold text-black mb-1">Universal Direct Overlay</h4>
                <p className="text-sm text-gray-500">Using MetaMask? Just pass the 0x address. We handle the rest.</p>
              </div>
            </div>
          </Reveal>
        </div>
        
        {/* Right: Code Block */}
        <div className="lg:w-1/2 bg-[#0a0a0b] flex flex-col text-white">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex gap-2">
              {(['React', 'Node.js', 'Python'] as const).map(lang => (
                <button key={lang} onClick={() => setActiveLang(lang)}
                  className={`px-3 py-1.5 rounded text-[11px] font-bold transition-colors ${activeLang === lang ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>
                  {lang}
                </button>
              ))}
            </div>
            <CopyBtn code={CODE[activeLang]} />
          </div>
          <div className="p-6 overflow-x-auto flex-1 min-h-[300px] flex flex-col justify-center">
            <CodeBlock code={CODE[activeLang]} />
          </div>
        </div>
      </section>

      {/* ── 3. API Grid (Flat Borders) ── */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12 xl:px-24 py-20 lg:py-32">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 max-w-2xl">A Backend Built for True Autonomy.</h2>
            <p className="text-lg text-gray-500 mb-16 max-w-2xl">No ABIs. No RPC nodes. Power complex DeFi structures using standard HTTP requests and standard JSON responses.</p>
          </Reveal>

          {/* Minimal Grid instead of Cards */}
          <div className="border-t border-gray-200">
            <Reveal delay={100}>
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 border-b border-gray-200">
                <div className="p-8 sm:p-12 hover:bg-gray-50 transition-colors group">
                  <div className="text-[10px] font-bold text-gray-400 mb-6 uppercase tracking-widest group-hover:text-black transition-colors">01 / Analysis</div>
                  <h3 className="text-2xl font-black mb-3">AI Risk Engine</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">One endpoint returns a DeepSeek-generated risk report, cash flow probability, and borrower fingerprint instantly.</p>
                </div>
                <div className="p-8 sm:p-12 hover:bg-gray-50 transition-colors group">
                  <div className="text-[10px] font-bold text-gray-400 mb-6 uppercase tracking-widest group-hover:text-black transition-colors">02 / Protocol</div>
                  <h3 className="text-2xl font-black mb-3">AIUSD Standard</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">Mint & redeem the treasury-backed stablecoin programmatically. Construct auto-compound vaults with zero frontend UI.</p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 border-b border-gray-200">
                <div className="p-8 sm:p-12 hover:bg-gray-50 transition-colors group">
                  <div className="text-[10px] font-bold text-gray-400 mb-6 uppercase tracking-widest group-hover:text-black transition-colors">03 / Notification</div>
                  <h3 className="text-2xl font-black mb-3">Real-Time Webhooks</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">Instant push notifications when targets are hit, repayments arrive, or yield compounds on-chain. Subscribe rather than poll.</p>
                </div>
                <div className="p-8 sm:p-12 hover:bg-gray-50 transition-colors group">
                  <div className="text-[10px] font-bold text-gray-400 mb-6 uppercase tracking-widest group-hover:text-black transition-colors">04 / Execution</div>
                  <h3 className="text-2xl font-black mb-3">Programmatic Assets</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">Search, filter, and invest in assets via simple HTTP POST. Complete pipeline automation tailored for sophisticated trading bots.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 4. Use Cases (Sticky scroll layout) ── */}
      <section className="bg-[#fafafa] border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12 xl:px-24 py-20 lg:py-32">
          
          <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
            {/* Left Col: Titles & Selector */}
            <div className="lg:w-1/3">
              <Reveal>
                <div className="sticky top-24">
                  <h2 className="text-3xl font-black tracking-tight mb-2">Built for Builders.</h2>
                  <p className="text-gray-500 text-sm mb-12">See how teams launch 10x faster with Loka's stack.</p>
                  
                  <div className="flex flex-col gap-2">
                    {USE_CASES.map((uc) => (
                      <button key={uc.id} onClick={() => setActiveCase(uc.id)}
                        className={`text-left px-5 py-4 border-l-2 transition-all duration-300 ${activeCase === uc.id ? 'border-black bg-white shadow-sm' : 'border-transparent hover:border-gray-300'}`}>
                        <h4 className={`text-base font-bold mb-1 ${activeCase === uc.id ? 'text-black' : 'text-gray-500'}`}>{uc.label}</h4>
                        {activeCase === uc.id && (
                          <p className="text-sm text-gray-600 leading-relaxed mt-2 animate-fade-in">{uc.desc}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Right Col: Code Viewer */}
            <div className="lg:w-2/3">
              <Reveal delay={100}>
                <div className="bg-[#0a0a0b] border border-gray-800 flex flex-col text-white shadow-xl min-h-[400px]">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <span className="text-[11px] font-bold text-white tracking-widest uppercase">
                      {activeCase === 'wallet' ? 'wallet.tsx' : activeCase === 'agent' ? 'agent.py' : 'quant.ts'}
                    </span>
                    <CopyBtn code={activeCase === 'wallet' ? CODE['React'] : activeCase === 'agent' ? CODE['Python'] : CODE['Node.js']} />
                  </div>
                  <div className="p-6 overflow-x-auto flex-1 flex flex-col justify-center">
                    <CodeBlock code={activeCase === 'wallet' ? CODE['React'] : activeCase === 'agent' ? CODE['Python'] : CODE['Node.js']} />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Endpoints Table (Typography focused) ── */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-[1000px] mx-auto px-6 sm:px-12 py-20 lg:py-32">
          <Reveal>
            <div className="flex items-end justify-between mb-12 border-b border-black pb-4">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-black">Data Endpoints</h2>
                <p className="text-sm text-gray-500 mt-2">Standard JSON. OpenAPI 3.0 specs available.</p>
              </div>
              <a href="#" className="text-sm font-bold text-black border border-gray-300 px-4 py-2 hover:bg-gray-50 transition-colors">
                Read API Reference
              </a>
            </div>
          </Reveal>
          
          <Reveal delay={100}>
            <div className="flex flex-col">
              {ENDPOINTS.map((ep, i) => (
                <div key={i} className={`flex flex-col sm:flex-row sm:items-center py-5 group hover:bg-gray-50 transition-colors px-4 border-b border-gray-100`}>
                  <div className="flex items-center gap-4 sm:w-[400px] shrink-0 mb-2 sm:mb-0">
                    <span className={`text-[10px] font-black px-2 py-1 uppercase tracking-wider w-16 text-center
                      ${ep.method === 'GET' ? 'bg-gray-100 text-gray-600' : ep.method === 'POST' ? 'bg-black text-white' : 'bg-red-50 text-red-600'}`}>
                      {ep.method}
                    </span>
                    <code className="text-sm font-mono font-bold text-black">{ep.path}</code>
                  </div>
                  <span className="text-sm text-gray-500 sm:ml-4 group-hover:text-black transition-colors">{ep.desc}</span>
                  <button className="hidden sm:block ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-black">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#fafafa]">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12 xl:px-24 py-32 text-center">
          <Reveal>
            <h2 className="text-4xl sm:text-6xl font-black text-black tracking-tight mb-6">Build the backend.</h2>
            <p className="text-xl text-gray-500 mb-12 max-w-xl mx-auto font-medium">Stop wrestling with legacy banking APIs. Generate your key and ship in hours.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto px-10 py-4 bg-black text-white text-sm font-bold hover:bg-gray-900 transition-colors">
                Start Building for Free
              </button>
              <button className="w-full sm:w-auto px-10 py-4 border border-gray-300 bg-white text-black text-sm font-bold hover:border-black transition-colors">
                Contact Enterprise Sales
              </button>
            </div>
          </Reveal>
        </div>
      </section>

    </div>
  );
};

export default ApiLanding;
