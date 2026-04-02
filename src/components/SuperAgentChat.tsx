/**
 * SuperAgentChat — Chat Detail Page
 * Clean chat interface similar to Surf style, with multi-agent thinking process
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { renderMarkdownContent } from '../utils/markdown';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

// ─── Types and Interfaces ────────────────────────────────────

const InputIcons = {
  Attach: () => <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>,
  Mic: () => <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>,
  Image: () => <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
};

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    isStreaming?: boolean;
}

interface AgentStep {
    label: string;
    status: 'done' | 'active' | 'pending';
    detailType?: 'table' | 'news';
}

interface AgentThought {
    agentId: string;
    agentName: string;
    agentIcon: string;
    agentColor: string;
    status: 'waiting' | 'analyzing' | 'completed';
    summary: string;
    details?: string;
    verdict?: 'bullish' | 'bearish' | 'neutral';
    confidence?: number;
    steps?: AgentStep[];
}

interface ThinkingProcess {
    agents: AgentThought[];
    consensus?: { verdict: 'bullish' | 'bearish' | 'neutral'; confidence: number; duration: number };
    isActive: boolean;
    phase?: 'generating' | 'evaluating' | 'persuading';
}

// ─── Agent Council Config ───────────────────────────────────
const AGENT_COUNCIL = [
    { id: 'agent_0', name: 'Fundamental Analyst', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: 'bg-emerald-500', steps: ['Ingesting 10-K & financial statements', 'Calculating DCF valuation models', 'Evaluating balance sheet health', 'Formulating core thesis'] },
    { id: 'agent_1', name: 'Macro Strategist', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-blue-500', steps: ['Analyzing cross-asset correlations', 'Evaluating interest rate impact', 'Scanning global liquidity trends', 'Synthesizing macro regime context'] },
    { id: 'agent_2', name: 'Sentiment Engine', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z', color: 'bg-violet-500', steps: ['Parsing FinTwit & Retail sentiment', 'Scanning news & events momentum', 'Analyzing option market skew', 'Identifying market pivot risks'] },
    { id: 'agent_3', name: 'Quant Tracker', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', color: 'bg-rose-500', steps: ['Processing Stock OHLC Data', 'Evaluating moving average bounds', 'Calculating RSI & Volatility bands', 'Detecting anomalous trading volume'] }
];

const MODES = [
    { id: 'auto' as const, label: 'Auto', desc: 'System picks the best mode for you', icon: () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" /></svg> },
    { id: 'fast' as const, label: 'Fast', desc: 'Single agent, quick response', icon: () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg> },
    { id: 'collaborate' as const, label: 'Collaborate', desc: 'Agents split work, assemble one answer', icon: () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg> },
    { id: 'roundtable' as const, label: 'Roundtable', desc: 'Multi-agent debate & cross-validation', icon: () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" /><path d="M14 5.5a7.5 7.5 0 014.5 12" /><path d="M17 19.5H7" /><path d="M5.5 17A7.5 7.5 0 0110 5.5" /></svg> },
];

// ─── Knowledge Graph Types ──────────────────────────────────
interface KGNode {
    id: string;
    type: 'agent' | 'task' | 'stance';
    label: string;
    x: number;
    y: number;
    data?: Record<string, string>;
}

interface KGEdge {
    id: string;
    source: string;
    target: string;
    label: string;
}

interface KnowledgeGraphData {
    nodes: KGNode[];
    edges: KGEdge[];
}

const STATIC_KG_DATA: KnowledgeGraphData = {
    nodes: [
        { id: 'agent_0', type: 'agent', label: 'agent_0', x: 0, y: 0 },
        { id: 'agent_1', type: 'agent', label: 'agent_1', x: 0, y: 0 },
        { id: 'agent_2', type: 'agent', label: 'agent_2', x: 0, y: 0 },
        { id: 'agent_3', type: 'agent', label: 'agent_3', x: 0, y: 0 },
        { id: 'round_1', type: 'task', label: 'Round 1', x: 0, y: 0 },
        { id: 'round_2', type: 'task', label: 'Round 2', x: 0, y: 0 },
        { id: 'round_3', type: 'task', label: 'Round 3', x: 0, y: 0 },
        { id: 'round_4', type: 'task', label: 'Round 4', x: 0, y: 0 },
        { id: 'node_A', type: 'stance', label: 'A', x: 0, y: 0 },
        { id: 'node_B', type: 'stance', label: 'B', x: 0, y: 0 },
    ],
    edges: [
        { id: 'e1', source: 'agent_1', target: 'round_2', label: 'participates_in' },
        { id: 'e2', source: 'agent_1', target: 'round_3', label: 'participates_in' },
        { id: 'e3', source: 'agent_1', target: 'round_4', label: 'participates_in' },
        { id: 'e4', source: 'agent_1', target: 'node_B', label: 'supports' },

        { id: 'e5', source: 'agent_3', target: 'round_2', label: 'participates_in' },
        { id: 'e6', source: 'agent_3', target: 'round_3', label: 'participates_in' },
        { id: 'e7', source: 'agent_3', target: 'round_4', label: 'participates_in' },
        { id: 'e8', source: 'agent_3', target: 'node_B', label: 'supports' },

        { id: 'e9', source: 'agent_2', target: 'round_1', label: 'participates_in' },
        { id: 'e10', source: 'agent_2', target: 'round_2', label: 'participates_in' },
        { id: 'e11', source: 'agent_2', target: 'round_3', label: 'participates_in' },
        { id: 'e12', source: 'agent_2', target: 'round_4', label: 'participates_in' },
        { id: 'e13', source: 'agent_2', target: 'node_A', label: 'supports' },
        { id: 'e14', source: 'agent_2', target: 'node_B', label: 'supports' },

        { id: 'e15', source: 'agent_0', target: 'round_1', label: 'participates_in' },
        { id: 'e16', source: 'agent_0', target: 'round_2', label: 'participates_in' },
        { id: 'e17', source: 'agent_0', target: 'round_3', label: 'participates_in' },
        { id: 'e18', source: 'agent_0', target: 'round_4', label: 'participates_in' },
        { id: 'e19', source: 'agent_0', target: 'node_B', label: 'supports' },
    ]
};

// Build a knowledge graph from thinking process data (static mock, per user request)
const buildKnowledgeGraph = (): KnowledgeGraphData => STATIC_KG_DATA;



// ─── KnowledgeGraphView Component ──────────────────────────
const KnowledgeGraphView: React.FC<{ data: KnowledgeGraphData }> = ({ data }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!svgRef.current || !data.nodes.length) return;

        const svg = d3.select(svgRef.current);
        const width = containerRef.current?.clientWidth || 400;
        const height = containerRef.current?.clientHeight || 600;

        svg.selectAll('*').remove();

        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on('zoom', (e) => {
                g.attr('transform', e.transform);
            });
        
        svg.call(zoom as any); // Cast to any to satisfy d3.zoom type

        const g = svg.append('g');

        // Dark theme arrow marker
        svg.append('defs').append('marker')
            .attr('id', 'arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 22)
            .attr('refY', 0)
            .attr('markerWidth', 5)
            .attr('markerHeight', 5)
            .attr('orient', 'auto')
            .append('path')
            .attr('fill', '#9ca3af')
            .attr('d', 'M0,-4L8,0L0,4');

        // Clone data for d3 mutation
        const nodes = data.nodes.map(d => ({ ...d }));
        const edges = data.edges.map(d => ({ ...d }));

        const simulation = d3.forceSimulation(nodes as any)
            .force('link', d3.forceLink(edges).id((d: any) => d.id).distance(110))
            .force('charge', d3.forceManyBody().strength(-400))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collide', d3.forceCollide().radius(40));

        const link = g.append('g')
            .attr('stroke', '#9ca3af')
            .attr('stroke-opacity', 0.8)
            .selectAll('line')
            .data(edges)
            .join('line')
            .attr('stroke-width', 1.5)
            .attr('marker-end', 'url(#arrow)');

        const linkLabel = g.append('g')
            .selectAll('text')
            .data(edges)
            .join('text')
            .text((d: any) => d.label)
            .attr('font-size', '8px')
            .attr('fill', '#9ca3af')
            .attr('text-anchor', 'middle');

        const drag = d3.drag<SVGGElement, any>()
            .on('start', (event, d) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', (event, d) => {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });

        const node = g.append('g')
            .selectAll('g')
            .data(nodes)
            .join('g')
            .call(drag as any) // Cast to any to satisfy d3.drag type
            .style('cursor', 'grab');

        node.append('circle')
            .attr('r', (d: any) => d.type === 'agent' ? 18 : 14)
            .attr('fill', (d: any) => d.type === 'agent' ? '#f3f4f6' : d.type === 'stance' ? '#f5f3ff' : '#eff6ff')
            .attr('stroke', (d: any) => d.type === 'agent' ? '#6b7280' : d.type === 'stance' ? '#7c3aed' : '#3b82f6')
            .attr('stroke-width', 1.5);

        node.append('text')
            .text((d: any) => {
                const parts = d.label.split(' ');
                return d.type === 'agent' ? parts[0] : (d.label.length > 15 ? d.label.slice(0, 13) + '…' : d.label);
            })
            .attr('y', 28)
            .attr('font-size', '9px')
            .attr('fill', (d: any) => d.type === 'agent' ? '#374151' : d.type === 'stance' ? '#5b21b6' : '#1d4ed8')
            .attr('text-anchor', 'middle')
            .attr('font-weight', '500');

        simulation.on('tick', () => {
            link
                .attr('x1', (d: any) => d.source.x)
                .attr('y1', (d: any) => d.source.y)
                .attr('x2', (d: any) => d.target.x)
                .attr('y2', (d: any) => d.target.y);

            linkLabel
                .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
                .attr('y', (d: any) => (d.source.y + d.target.y) / 2 - 4);

            node
                .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
        });

        return () => {
            simulation.stop();
        };
    }, [data.nodes, data.edges]);

    return (
        <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-white" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
            <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
            
            {/* Legend overlay */}
            <div className="absolute bottom-4 left-4 flex gap-4 z-10">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#f3f4f6] border border-[#6b7280]"></div><span className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">Agent</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#eff6ff] border border-[#3b82f6]"></div><span className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">Task</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#f5f3ff] border border-[#7c3aed]"></div><span className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">Stance</span></div>
            </div>
            <div className="absolute top-4 right-4 text-[10px] text-gray-500 font-mono text-right pointer-events-none">
                scroll to zoom<br/>drag to pan
            </div>
        </div>
    );
};

// ─── AgentStepPanel Component ───────────────────────────────
const AgentStepPanel: React.FC<{ agent: AgentThought; isExpanded: boolean; onToggle: () => void }> = ({ agent, isExpanded, onToggle }) => {
    const isActive = agent.status === 'analyzing';
    const isDone = agent.status === 'completed';

    return (
        <div className={`transition-all duration-300`}>
            <button onClick={onToggle} className="w-full flex items-center gap-3 py-2 text-left group">
                {/* Status icon */}
                <div className="shrink-0">
                    {isActive ? (
                        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    ) : isDone ? (
                        <div className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                    ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-gray-700">{agent.agentIcon} {agent.agentName}</span>
                        {isActive && <span className="text-[10px] text-blue-500 font-medium animate-pulse">Thinking...</span>}
                        {isDone && agent.verdict && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                agent.verdict === 'bullish' ? 'bg-emerald-50 text-emerald-600' :
                                agent.verdict === 'bearish' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
                            }`}>{agent.verdict === 'bullish' ? '↑ Low Risk' : agent.verdict === 'bearish' ? '↓ High Risk' : '— Moderate'}</span>
                        )}
                    </div>
                    {isDone && agent.summary && (
                        <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{agent.summary}</p>
                    )}
                </div>
                {(isDone || isActive) && (
                    <svg className={`w-3.5 h-3.5 text-gray-300 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                )}
            </button>

            {isExpanded && (isActive || isDone) && (
                <div className="ml-8 mb-2 space-y-1">
                    {agent.steps?.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            {step.status === 'done' ? (
                                <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            ) : step.status === 'active' ? (
                                <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                            ) : (
                                <div className="w-3 h-3 rounded-full border border-gray-200 shrink-0" />
                            )}
                            <span className={`text-[10px] leading-relaxed ${
                                step.status === 'done' ? 'text-gray-400 line-through' :
                                step.status === 'active' ? 'text-blue-500 font-medium' : 'text-gray-300'
                            }`}>{step.label}</span>
                        </div>
                    ))}
                    {isDone && agent.details && (
                        <div className="mt-2 text-[10px] text-gray-400 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed border border-gray-100">
                            {agent.details}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── CollaborationProcess Component ─────────────────────────────────
const CollaborationProcess: React.FC<{ thinking: ThinkingProcess }> = ({ thinking }) => {
    const p = thinking.phase;
    const isDone = !thinking.isActive;
    const activePhase = isDone ? 3 : p === 'persuading' ? 2 : p === 'evaluating' ? 1 : 0;
    const steps = [
        { id: 0, label: 'Generating Answers' },
        { id: 1, label: 'Peer Evaluation' },
        { id: 2, label: 'Reaching Consensus' },
    ];

    return (
        <div className="mt-3 pt-3 border-t border-gray-100 pb-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Agent Collaboration</span>
            <div className="space-y-1.5 ml-1">
                {steps.map(s => {
                    const status = isDone || activePhase > s.id ? 'done' : activePhase === s.id ? 'active' : 'pending';
                    return (
                        <div key={s.id} className="flex items-center gap-2">
                            {status === 'done' ? (
                                <svg className="w-2.5 h-2.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            ) : status === 'active' ? (
                                <div className="w-2.5 h-2.5 border border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                            ) : (
                                <div className="w-2.5 h-2.5 rounded-full border border-gray-200 shrink-0" />
                            )}
                            <span className={`text-[10px] ${
                                status === 'done' ? 'text-gray-400 line-through' :
                                status === 'active' ? 'text-blue-500 font-medium' : 'text-gray-300'
                            }`}>{s.label}</span>
                        </div>
                    );
                })}
            </div>
            {isDone && thinking.consensus && (
                <div className="mt-3 bg-gray-50 rounded bg-opacity-50 p-2 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 font-semibold uppercase">Final Verdict</span>
                    <span className={`text-[10px] font-bold ${
                        thinking.consensus.verdict === 'bullish' ? 'text-emerald-600' : 
                        thinking.consensus.verdict === 'bearish' ? 'text-red-500' : 'text-gray-500'
                    }`}>{thinking.consensus.verdict === 'bullish' ? '↑ Low Risk' : thinking.consensus.verdict === 'bearish' ? '↓ High Risk' : '— Moderate'} ({thinking.consensus.confidence}%)</span>
                </div>
            )}
        </div>
    );
};

// ─── ThinkingProcessPanel ───────────────────────────────────
const ThinkingProcessPanel: React.FC<{
    thinking: ThinkingProcess;
    userQuery?: string;
    onOpenGraph?: () => void;
}> = ({ thinking, userQuery = '', onOpenGraph }) => {
    const [collapsed, setCollapsed] = useState(false);
    const completedCount = thinking.agents.filter(a => a.status === 'completed').length;
    const allDone = !thinking.isActive && !!thinking.consensus;

    useEffect(() => {
        if (allDone) {
            setCollapsed(false);
        }
    }, [allDone]);

    const handleOpenGraph = () => {
        onOpenGraph?.();
    };
    const kgData = allDone ? buildKnowledgeGraph() : null;

    return (
        <div className="mb-4">
            {/* Header — single toggle */}
            <button
                onClick={() => setCollapsed(c => !c)}
                className="flex items-center gap-2 mb-2 w-full text-left"
            >
                <div className="flex items-center gap-1.5">
                    {thinking.isActive ? (
                        <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <div className="w-3.5 h-3.5 rounded-full bg-gray-200 flex items-center justify-center">
                            <svg className="w-2 h-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                    )}
                    <span className="text-[11px] font-semibold text-gray-500">
                        {thinking.isActive ? 'Agents thinking...' : 'Analysis complete'}
                    </span>
                    <span className="text-[10px] text-gray-300">{completedCount}/{thinking.agents.length}</span>
                </div>
                <svg className={`w-3 h-3 text-gray-300 ml-auto transition-transform ${collapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>

            {/* Body — flat list, no sub-collapse */}
            {!collapsed && (
                <div className="pl-2 border-l-2 border-gray-100 ml-2 space-y-3">
                    {thinking.agents.map(agent => {
                        const isActive = agent.status === 'analyzing';
                        const isDone = agent.status === 'completed';
                        return (
                            <div key={agent.agentId}>
                                {/* Flat step list */}
                                <div className="space-y-0.5">
                                    {agent.steps?.map((step, idx) => (
                                        <div key={idx} className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-1.5">
                                                {step.status === 'done' ? (
                                                    <svg className="w-2.5 h-2.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                ) : step.status === 'active' ? (
                                                    <div className="w-2.5 h-2.5 border border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
                                                ) : (
                                                    <div className="w-2.5 h-2.5 rounded-full border border-gray-200 shrink-0" />
                                                )}
                                                <span className={`text-[11px] ${
                                                    step.status === 'done' ? 'text-gray-600 font-medium' :
                                                    step.status === 'active' ? 'text-blue-600 font-bold' : 'text-gray-400'
                                                }`}>{step.label}</span>
                                            </div>
                                            {/* Step Details rendering */}
                                            {step.status !== 'pending' && step.detailType === 'table' && (
                                                <div className="ml-4 mr-2 bg-gray-50 border border-gray-100 rounded p-2 overflow-x-auto">
                                                    <table className="w-full text-left text-[9px] text-gray-500 whitespace-nowrap">
                                                        <thead>
                                                            <tr className="border-b border-gray-200 text-gray-400">
                                                                <th className="pb-1 font-medium">Metric</th>
                                                                <th className="pb-1 font-medium">Value</th>
                                                                <th className="pb-1 font-medium">Benchmark</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr className="border-b border-gray-100 last:border-0"><td className="py-1">MoM Growth</td><td className="py-1 text-gray-700">28%</td><td className="py-1">15%</td></tr>
                                                            <tr className="border-b border-gray-100 last:border-0"><td className="py-1">Default Prob</td><td className="py-1 text-gray-700">2.3%</td><td className="py-1">{'<'} 5.0%</td></tr>
                                                            <tr className="border-b border-gray-100 last:border-0"><td className="py-1">Profit Margin</td><td className="py-1 text-gray-700">65%</td><td className="py-1">40%</td></tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                            {step.status !== 'pending' && step.detailType === 'news' && (
                                                <div className="ml-4 mr-2 space-y-1.5">
                                                    <div className="flex items-center gap-1.5 p-1.5 bg-gray-50 border border-gray-100 rounded">
                                                        <div className="w-4 h-4 rounded bg-gray-200 shrink-0 flex items-center justify-center text-[8px]">📰</div>
                                                        <span className="text-[9px] text-gray-600 truncate">Key executive departure impacts quarterly guidance</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 p-1.5 bg-gray-50 border border-gray-100 rounded">
                                                        <div className="w-4 h-4 rounded bg-gray-200 shrink-0 flex items-center justify-center text-[8px]">📰</div>
                                                        <span className="text-[9px] text-gray-600 truncate">Institutional accumulation accelerates across top funds</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {isDone && agent.summary && (
                                        <p className="text-[10px] text-gray-400 mt-1">{agent.summary}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <CollaborationProcess thinking={thinking} />
                </div>
            )}

            {/* Collapsed summary */}
            {collapsed && thinking.consensus && (
                <div className="flex items-center gap-3 ml-6">
                    <button onClick={() => setCollapsed(false)} className="flex items-center gap-2 text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
                        <span className={`font-bold ${
                            thinking.consensus.verdict === 'bullish' ? 'text-emerald-500' :
                            thinking.consensus.verdict === 'bearish' ? 'text-red-400' : 'text-gray-500'
                        }`}>
                            {thinking.consensus.verdict === 'bullish' ? '↑ Low Risk' : thinking.consensus.verdict === 'bearish' ? '↓ High Risk' : '— Moderate'}
                        </span>
                        <span>· {thinking.consensus.confidence}% confidence</span>
                        <span className="text-[9px] underline ml-1">Expand</span>
                    </button>
                </div>
            )}
        </div>
    );
};




// ═════════════════════════════════════════════════════════════
// SuperAgentChat — Main Component
// ═════════════════════════════════════════════════════════════
interface SuperAgentChatProps {
    initialMessage?: string;
    restoreSessionId?: string;
    onBack: () => void;
    agentCount?: number;   // how many agents to use (default 2)
    mode?: 'auto' | 'fast' | 'collaborate' | 'roundtable';
    initialAgent?: string;
}

const SuperAgentChat: React.FC<SuperAgentChatProps> = ({ initialMessage, restoreSessionId, onBack, agentCount = 2, mode = 'auto', initialAgent }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [thinkingProcesses, setThinkingProcesses] = useState<Record<number, ThinkingProcess>>({});
    
    // Two-Phase Workflow State
    const [workflowPhase, setWorkflowPhase] = useState<'idle' | 'research' | 'consensus'>('idle');
    const [researchLogs, setResearchLogs] = useState<string[]>([]);
    const [researchSummary, setResearchSummary] = useState<string | null>(null);
    const hasStartedResearch = useRef(false);
    const [isRouting, setIsRouting] = useState(false);

    
    // Mode tracking
    const [currentMode, setCurrentMode] = useState<'auto' | 'fast' | 'collaborate' | 'roundtable'>(mode);
    const [modeOpen, setModeOpen] = useState(false);
    const modeRef = useRef<HTMLDivElement>(null);

    // Stable session tracking
    const [generatedId] = useState(() => crypto.randomUUID());
    const activeSessionId = restoreSessionId || generatedId;
    
    const [searchParams, setSearchParams] = useSearchParams();
    const [justCreatedId] = useState(() => ({ current: null as string | null }));

    // Keep URL in sync for new sessions via React Router
    useEffect(() => {
        if (!restoreSessionId && !searchParams.get('session')) {
            justCreatedId.current = activeSessionId;
            setSearchParams({ session: activeSessionId }, { replace: true });
        }
    }, [activeSessionId, restoreSessionId, searchParams, setSearchParams]);

    useEffect(() => {
        if (!modeOpen) return;
        const h = (e: MouseEvent) => { if (modeRef.current && !modeRef.current.contains(e.target as Node)) setModeOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [modeOpen]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const hasSentInitial = useRef(false);

    useEffect(() => {
        if (!restoreSessionId) return;
        
        // Bypass fetching history if we *just* created this session and the URL update triggered a prop change.
        if (justCreatedId.current === restoreSessionId) {
            justCreatedId.current = null;
            return;
        }

        const fetchHistory = async () => {
             // Reset state to avoid leakage from previous sessions
            setMessages([]);
            setThinkingProcesses({});
            setActiveGraphMsgIdx(null);
            setShowGraphPanel(false);

            try {
                const token = sessionStorage.getItem('loka_token') || localStorage.getItem('loka_token');
                const headers: Record<string, string> = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;
                const res = await fetch(`${API_BASE}/chat/history?sessionId=${restoreSessionId}`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    const newThinking: Record<number, ThinkingProcess> = {};
                    const lastAssistantIdx = data.map((d: any)=>d.role).lastIndexOf('assistant');

                    setMessages(data.map((m: any, idx: number) => {
                        if (m.metadata) {
                            try {
                                const parsedMeta = JSON.parse(m.metadata);
                                if (parsedMeta && parsedMeta.mode === 'collaborate' || parsedMeta.mode === 'roundtable') {
                                    const agents = AGENT_COUNCIL.map((a, aIdx) => {
                                        const r = parsedMeta.agentResponses && parsedMeta.agentResponses[aIdx];
                                        return {
                                            agentId: a.id, agentName: a.name, agentIcon: a.icon, agentColor: a.color,
                                            status: r ? 'completed' : 'waiting',
                                            summary: r ? r.answer.slice(0, 150) : '',
                                            details: r ? r.answer : '',
                                            confidence: r ? Math.round(r.confidence * 100) : 0,
                                            verdict: r && r.confidence > 0.7 ? 'bullish' : 'neutral',
                                            steps: [ { label: r ? `${a.name} responded` : 'No response', status: 'done' } ],
                                        };
                                    });
                                    newThinking[idx] = {
                                        agents: agents as any,
                                        isActive: false,
                                        phase: 'persuading',
                                        consensus: {
                                            verdict: parsedMeta.confidence > 0.7 ? 'bullish' : 'neutral',
                                            confidence: Math.round(parsedMeta.confidence * 100),
                                            duration: parsedMeta.executionTime,
                                        }
                                    };
                                }
                            } catch (e) {}
                        }
                        return {
                            role: m.role,
                            content: m.content,
                            timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        };
                    }));

                    setThinkingProcesses(newThinking);
                    if (Object.keys(newThinking).length > 0) {
                        const maxIdx = Math.max(...Object.keys(newThinking).map(Number));
                        setActiveGraphMsgIdx(maxIdx);
                        setShowGraphPanel(true);
                    }

                    // Reconnection check
                    if (data.length > 0 && data[data.length - 1].role === 'user') {
                        socket.emit('agent:chat:check', { sessionId: restoreSessionId }, (res: { isRunning: boolean; mode?: string }) => {
                            if (res.isRunning) {
                                setIsStreaming(true);
                                const msgIdx = data.length;
                                
                                setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date().toLocaleTimeString(), isStreaming: true }]);
                                
                                const useConsensusEngine = res.mode === 'collaborate' || res.mode === 'roundtable';
                                if (useConsensusEngine) {
                                    const council = AGENT_COUNCIL;
                                    const agents: AgentThought[] = council.map(a => ({
                                        agentId: a.id, agentName: a.name, agentIcon: a.icon, agentColor: a.color,
                                        status: 'analyzing' as const, summary: '', 
                                        steps: [{ label: `${a.name} reconnecting...`, status: 'active' as const }],
                                    }));
                                    setThinkingProcesses(prev => ({ ...prev, [msgIdx]: { agents, isActive: true, phase: 'generating' } }));
                                    setActiveGraphMsgIdx(msgIdx);
                                    setShowGraphPanel(true);
                                }

                                window.dispatchEvent(new CustomEvent('session-started', { 
                                    detail: { id: restoreSessionId, title: data[0].content.slice(0, 60), agentId: 'superagent' } 
                                }));
                            }
                        });
                    }
                }
            } catch (err) {
                console.error('Failed to load chat history', err);
            }
        };
        fetchHistory();
    }, [restoreSessionId]);
    // ─── Knowledge Graph Panel ───────────────────────────────
    const [showGraphPanel, setShowGraphPanel] = useState(false);
    const [activeGraphMsgIdx, setActiveGraphMsgIdx] = useState<number | null>(null);

    const currentThinking = activeGraphMsgIdx !== null ? thinkingProcesses[activeGraphMsgIdx] : null;
    const currentQuery = activeGraphMsgIdx !== null ? messages.slice(0, activeGraphMsgIdx).reverse().find(m => m.role === 'user')?.content ?? '' : '';
    const currentKgData = currentThinking ? buildKnowledgeGraph() : null;

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, thinkingProcesses]);

    // ─── Send to AI (WebSocket) ─────────────────────────────
    const sendToAI = useCallback((text: string, existingMessages?: Message[]) => {
        // Socket handles everything via server now!
        const currentMessages = existingMessages ?? [];
        const msgIdx = currentMessages.length; // Will be the index for assistant bubble
        
        socket.emit('agent:chat', { content: text, mode: currentMode, sessionId: activeSessionId, agentId: 'superagent' });

        window.dispatchEvent(new CustomEvent('session-started', { 
            detail: { id: activeSessionId, title: text.slice(0, 60), agentId: 'superagent' } 
        }));

        setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date().toLocaleTimeString(), isStreaming: true }]);

        if (currentMode === 'auto') {
            // Routing will take care of rendering the panel once it resolves
            return;
        }

        const useConsensusEngine = currentMode === 'collaborate' || currentMode === 'roundtable';
        if (useConsensusEngine) {
            const council = AGENT_COUNCIL;
            const agents: AgentThought[] = council.map(a => ({
                agentId: a.id, agentName: a.name, agentIcon: a.icon, agentColor: a.color,
                status: 'analyzing' as const, summary: '', 
                steps: [{ label: `${a.name} is thinking...`, status: 'active' as const }],
            }));
            setThinkingProcesses(prev => ({ ...prev, [msgIdx]: { agents, isActive: true, phase: 'generating' } }));
            setActiveGraphMsgIdx(msgIdx);
            setShowGraphPanel(true);
        }
    }, [activeSessionId, currentMode]);

    /* Socket listeners */
    useEffect(() => {
        const onStarted = (data: any) => {
            if (data.sessionId && restoreSessionId && data.sessionId !== restoreSessionId) return;
            if (!restoreSessionId && data.sessionId && activeSessionId !== data.sessionId) return;
            setShowGraphPanel(true);
            setIsStreaming(true);
        };

        const onProgress = (data: { content: string; sessionId?: string }) => {
            if (data.sessionId && restoreSessionId && data.sessionId !== restoreSessionId) return;
            if (!restoreSessionId && data.sessionId && activeSessionId !== data.sessionId) return;
            
            setMessages(prev => {
                let updated = [...prev];
                let last = updated[updated.length - 1];
                if (!last || last.role !== 'assistant') {
                    updated.push({ role: 'assistant', content: data.content, timestamp: new Date().toLocaleTimeString(), isStreaming: true });
                } else {
                    updated[updated.length - 1] = { ...last, content: (last.content || '') + data.content };
                }
                return updated;
            });
        };

        const onStreamDone = (data: { content: string; sessionId?: string }) => {
            if (data.sessionId && restoreSessionId && data.sessionId !== restoreSessionId) return;
            if (!restoreSessionId && data.sessionId && activeSessionId !== data.sessionId) return;
            setIsStreaming(false);
            setMessages(prev => {
                let updated = [...prev];
                let last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                    updated[updated.length - 1] = { ...last, content: data.content, isStreaming: false };
                }
                return updated;
            });
            window.dispatchEvent(new CustomEvent('session-done', { detail: { id: data.sessionId || activeSessionId } }));
        };

        const onConsensusDone = (data: { result: any; sessionId?: string }) => {
            if (data.sessionId && restoreSessionId && data.sessionId !== restoreSessionId) return;
            if (!restoreSessionId && data.sessionId && activeSessionId !== data.sessionId) return;
            setIsStreaming(false);

            setMessages(prev => {
                const updated = [...prev];
                const msgIdx = updated.length - 1; // Assuming the streaming blank message is last
                if (updated[msgIdx] && updated[msgIdx].role === 'assistant') {
                    const finalAnswer = data.result.consensus?.finalAnswer || 'No consensus reached.';
                    updated[msgIdx] = { ...updated[msgIdx], content: finalAnswer, isStreaming: false, timestamp: new Date().toLocaleTimeString() };
                }
                return updated;
            });

            setThinkingProcesses(prev => {
                const keys = Object.keys(prev).map(Number).sort((a,b)=>b-a);
                if (keys.length === 0) return prev;
                const msgIdx = keys[0];

                const tp = prev[msgIdx];
                if (!tp) return prev;

                const updatedAgents = tp.agents.map((agent: any, idx: number) => {
                    const realResponse = data.result.consensus.agentResponses[idx];
                    if (realResponse) {
                        return {
                            ...agent,
                            status: 'completed',
                            summary: realResponse.answer.slice(0, 150),
                            details: realResponse.answer,
                            confidence: Math.round(realResponse.confidence * 100),
                            verdict: realResponse.confidence > 0.7 ? 'bullish' : 'neutral',
                            steps: [{ label: `${agent.agentName} responded`, status: 'done' }],
                        };
                    }
                    return { ...agent, status: 'completed', steps: [{ label: 'No response', status: 'done' }] };
                });

                return {
                    ...prev, [msgIdx]: {
                        ...tp,
                        agents: updatedAgents as any,
                        isActive: false,
                        phase: 'persuading',
                        consensus: {
                            verdict: data.result.consensus.confidence > 0.7 ? 'bullish' : 'neutral',
                            confidence: Math.round(data.result.consensus.confidence * 100),
                            duration: data.result.consensus.executionTime,
                        },
                    }
                };
            });
            window.dispatchEvent(new CustomEvent('session-done', { detail: { id: data.sessionId || activeSessionId } }));
        };

        const onError = (data: { error: string; sessionId?: string }) => {
            if (data.sessionId && restoreSessionId && data.sessionId !== restoreSessionId) return;
            if (!restoreSessionId && data.sessionId && activeSessionId !== data.sessionId) return;
            setIsStreaming(false);
            setMessages(prev => {
                let updated = [...prev];
                let last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                    updated[updated.length - 1] = { ...last, content: `⚠️ Error: ${data.error}`, isStreaming: false };
                } else {
                    updated.push({ role: 'assistant', content: `⚠️ Error: ${data.error}`, timestamp: new Date().toLocaleTimeString() });
                }
                return updated;
            });
            setThinkingProcesses(prev => {
                const keys = Object.keys(prev).map(Number).sort((a,b)=>b-a);
                if (keys.length === 0) return prev;
                return { ...prev, [keys[0]]: { ...prev[keys[0]], isActive: false } };
            });
            window.dispatchEvent(new CustomEvent('session-done', { detail: { id: data.sessionId || activeSessionId } }));
        };

        const onResearchStarted = (data: any) => {
            if (data.sessionId && restoreSessionId && data.sessionId !== restoreSessionId) return;
            if (!restoreSessionId && data.sessionId && activeSessionId !== data.sessionId) return;
            setResearchLogs([]);
        };

        const onResearchProgress = (data: { log: string; sessionId?: string }) => {
            if (data.sessionId && restoreSessionId && data.sessionId !== restoreSessionId) return;
            if (!restoreSessionId && data.sessionId && activeSessionId !== data.sessionId) return;
            setResearchLogs(prev => [...prev, data.log]);
        };

        const onResearchDone = (data: { summary: string; sessionId?: string }) => {
            if (data.sessionId && restoreSessionId && data.sessionId !== restoreSessionId) return;
            if (!restoreSessionId && data.sessionId && activeSessionId !== data.sessionId) return;
            
            setResearchSummary(data.summary);
            setResearchLogs(prev => [...prev, '✓ Report generated successfully']);
            setWorkflowPhase('consensus');

            // Now automatically forward this summary to the multi-agent consensus network
            // Note: Since we are in an effect callback, we use the initialMessage stored in state/props
            const fullPrompt = `${initialMessage}\n\n[Signal Radar Intercepted Data]:\n${data.summary}`;
            const existingMessages: Message[] = [{ role: 'user', content: initialMessage || '', timestamp: new Date().toLocaleTimeString() }];
            sendToAI(fullPrompt, existingMessages);
        };

        const onResearchError = (data: { error: string; sessionId?: string }) => {
            if (data.sessionId && restoreSessionId && data.sessionId !== restoreSessionId) return;
            if (!restoreSessionId && data.sessionId && activeSessionId !== data.sessionId) return;
            setResearchLogs(prev => [...prev, `⚠️ Error: ${data.error}`]);
            setWorkflowPhase('consensus');
            
            // Still fallback to regular consensus even if research failed
            const existingMessages: Message[] = [{ role: 'user', content: initialMessage || '', timestamp: new Date().toLocaleTimeString() }];
            sendToAI(initialMessage || '', existingMessages);
        };

        const onChatRouting = (data: { sessionId: string }) => {
            if (data.sessionId && restoreSessionId && data.sessionId !== restoreSessionId) return;
            if (!restoreSessionId && data.sessionId && activeSessionId !== data.sessionId) return;
            setIsRouting(true);
        };

        const onChatRouted = (data: { sessionId: string; mode: string }) => {
            if (data.sessionId && restoreSessionId && data.sessionId !== restoreSessionId) return;
            if (!restoreSessionId && data.sessionId && activeSessionId !== data.sessionId) return;
            setIsRouting(false);
            setCurrentMode(data.mode as any);
            
            // If it resolved to a consensus mode, inject the fake thinking panel now!
            const useConsensusEngine = data.mode === 'collaborate' || data.mode === 'roundtable';
            if (useConsensusEngine) {
                setMessages(prev => {
                    const msgIdx = prev.length - 1; // Assuming the streaming blank message is last
                    const council = AGENT_COUNCIL;
                    const agents: AgentThought[] = council.map(a => ({
                        agentId: a.id, agentName: a.name, agentIcon: a.icon, agentColor: a.color,
                        status: 'analyzing' as const, summary: '', 
                        steps: [{ label: `${a.name} is thinking...`, status: 'active' as const }],
                    }));
                    setThinkingProcesses(tp => ({ ...tp, [msgIdx]: { agents, isActive: true, phase: 'generating' } }));
                    setActiveGraphMsgIdx(msgIdx);
                    setShowGraphPanel(true);
                    return prev;
                });
            }
        };

        socket.on('agent:chat:started', onStarted);
        socket.on('agent:chat:progress', onProgress);
        socket.on('agent:chat:stream_done', onStreamDone);
        socket.on('agent:chat:consensus_done', onConsensusDone);
        socket.on('agent:chat:error', onError);
        socket.on('agent:chat:routing', onChatRouting);
        socket.on('agent:chat:routed', onChatRouted);
        
        socket.on('agent:research:started', onResearchStarted);
        socket.on('agent:research:progress', onResearchProgress);
        socket.on('agent:research:done', onResearchDone);
        socket.on('agent:research:error', onResearchError);

        return () => {
            socket.off('agent:chat:started', onStarted);
            socket.off('agent:chat:progress', onProgress);
            socket.off('agent:chat:stream_done', onStreamDone);
            socket.off('agent:chat:consensus_done', onConsensusDone);
            socket.off('agent:chat:error', onError);
            socket.off('agent:chat:routing', onChatRouting);
            socket.off('agent:chat:routed', onChatRouted);
            
            socket.off('agent:research:started', onResearchStarted);
            socket.off('agent:research:progress', onResearchProgress);
            socket.off('agent:research:done', onResearchDone);
            socket.off('agent:research:error', onResearchError);
        };
    }, [restoreSessionId, activeSessionId, currentMode, initialMessage, sendToAI]);

    // ─── Auto-send initial message ──────────────────────────
    useEffect(() => {
        if (hasSentInitial.current || restoreSessionId || !initialMessage) return;
        hasSentInitial.current = true;
        
        const userMsg: Message = { role: 'user', content: initialMessage, timestamp: new Date().toLocaleTimeString() };
        const initialMessages = [userMsg];
        setMessages(initialMessages);

        if (initialAgent === 'research' && (currentMode === 'collaborate' || currentMode === 'roundtable')) {
            setWorkflowPhase('research');
            hasStartedResearch.current = true;
            setTimeout(() => {
                socket.emit('agent:research', { topic: initialMessage, deep: false, days: 30, sessionId: activeSessionId });
                window.dispatchEvent(new CustomEvent('session-started', { 
                    detail: { id: activeSessionId, title: initialMessage.slice(0, 60), agentId: 'superagent' } 
                }));
            }, 50);
        } else {
            setWorkflowPhase('consensus');
            setTimeout(() => sendToAI(initialMessage, initialMessages), 50);
        }
    }, [initialMessage, restoreSessionId, sendToAI, initialAgent, currentMode, activeSessionId]);

    // ─── Handle send ────────────────────────────────────────
    const handleSend = () => {
        if (!inputText.trim() || isStreaming) return;
        const text = inputText.trim();
        const userMsg: Message = { role: 'user', content: text, timestamp: new Date().toLocaleTimeString() };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInputText('');
        sendToAI(text, newMessages);
    };

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden">
            {/* ══ Shared Header ══ */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
                <button onClick={onBack} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center text-white text-xs font-black">L</div>
                    <span className="text-sm font-semibold text-gray-900">Loka SuperAgent</span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-gray-400 font-medium">{agentCount} Agents Online</span>
                    {currentKgData && (
                        <div className="ml-2 pl-3 border-l border-gray-200 flex items-center gap-2 cursor-pointer" onClick={() => setShowGraphPanel(g => !g)}>
                            <svg className={`w-3.5 h-3.5 transition-colors ${showGraphPanel ? 'text-blue-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="6" cy="6" r="3" strokeWidth="2"/>
                                <circle cx="18" cy="6" r="3" strokeWidth="2"/>
                                <circle cx="12" cy="18" r="3" strokeWidth="2"/>
                                <line x1="8.83" y1="7.83" x2="15.17" y2="7.83" strokeWidth="1.5"/>
                                <line x1="6.93" y1="8.5" x2="11.07" y2="15.5" strokeWidth="1.5"/>
                                <line x1="17.07" y1="8.5" x2="12.93" y2="15.5" strokeWidth="1.5"/>
                            </svg>
                            <span className="text-[11px] font-medium text-gray-500">Multi-Agent Graph</span>
                            <button
                                type="button"
                                className={`relative inline-flex h-4 w-7 ml-1 items-center rounded-full transition-colors ${
                                    showGraphPanel ? 'bg-blue-500' : 'bg-gray-200'
                                }`}
                                aria-pressed={showGraphPanel}
                            >
                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${
                                    showGraphPanel ? 'translate-x-[14px]' : 'translate-x-[2px]'
                                }`} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ══ Content Row ══ */}
            <div className="flex flex-1 overflow-hidden">
                {/* Chat column */}
                <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-4 md:px-10 py-8">
                        <div className="max-w-2xl mx-auto space-y-8">
                            {messages.map((msg, i) => (
                                <div key={i}>
                                    {msg.role === 'user' ? (
                                        <div className="flex justify-end">
                                            <div className="max-w-[72%] px-4 py-3 bg-gray-900 text-white rounded-2xl rounded-br-sm shadow-sm">
                                                <p className="text-[13px] leading-relaxed">{msg.content}</p>
                                                <p className="text-[9px] text-gray-400 mt-1.5 text-right">{msg.timestamp}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-3">
                                            <div className="w-7 h-7 rounded-xl bg-gray-900 flex items-center justify-center text-white text-[10px] font-black shrink-0 mt-0.5">L</div>
                                            <div className="flex-1 min-w-0">
                                                {(researchSummary && i === 1) && (
                                                    <div className="mb-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600">
                                                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                            </div>
                                                            <span className="text-[11px] font-semibold text-gray-600">Phase 1: Signal Radar Intelligence Assembled</span>
                                                        </div>
                                                        <div className="ml-5 text-[10px] text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-3 max-h-32 overflow-y-auto">
                                                            <div className="font-semibold text-gray-700 mb-1">Raw Intelligence Report:</div>
                                                            {researchSummary.slice(0, 300)}... <span className="text-blue-500 underline cursor-pointer" title={researchSummary}>Hover to view</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {thinkingProcesses[i] && (
                                                    <ThinkingProcessPanel
                                                        thinking={thinkingProcesses[i]}
                                                        userQuery={messages.slice(0, i).reverse().find(m => m.role === 'user')?.content ?? ''}
                                                        onOpenGraph={() => {
                                                            setActiveGraphMsgIdx(i);
                                                            setShowGraphPanel(true);
                                                        }}
                                                    />
                                                )}
                                                {isRouting && msg.isStreaming && i === messages.length - 1 && (
                                                    <div className="mb-3 mt-1 flex items-center gap-2 text-blue-500 font-mono text-[10px]">
                                                        <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                                        Router Agent: Evaluating intent & scaling capacity...
                                                    </div>
                                                )}
                                                {msg.content ? (
                                                    <div className="text-[13px] text-gray-700 leading-relaxed markdown-content">
                                                        {renderMarkdownContent(msg.content)}
                                                    </div>
                                                ) : msg.isStreaming ? (
                                                    <div className="flex items-center gap-1 py-1">
                                                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
                                                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '240ms' }} />
                                                    </div>
                                                ) : null}
                                                {!msg.isStreaming && msg.content && (
                                                    <p className="text-[9px] text-gray-400 mt-2">{msg.timestamp}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {workflowPhase === 'research' && messages.length === 1 && (
                                <div className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-xl bg-gray-900 flex items-center justify-center text-white text-[10px] font-black shrink-0 mt-0.5">L</div>
                                    <div className="flex-1 min-w-0 mt-1">
                                        <div className="mb-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                                <span className="text-[11px] font-semibold text-gray-500">Phase 1: Signal Radar acquiring intelligence... (This may take up to 5 minutes)</span>
                                            </div>
                                            <div className="pl-2 border-l-2 border-gray-100 ml-1.5 space-y-1.5 max-h-64 overflow-y-auto">
                                                {researchLogs.map((log, lIdx) => (
                                                    <div key={lIdx} className="text-[10px] text-gray-400 font-mono flex items-start gap-1.5 leading-relaxed">
                                                        <span className="text-gray-300 mt-0.5">&gt;</span>
                                                        <span className={log.includes('Error') || log.includes('error') ? 'text-red-400' : ''}>{log}</span>
                                                    </div>
                                                ))}
                                                <div ref={messagesEndRef} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Input */}
                    <div className="shrink-0 pt-2 pb-8 px-4 md:px-8 bg-gradient-to-t from-white via-white to-transparent">
                        <div className="max-w-3xl mx-auto">
                            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl shadow-sm pl-2 pr-4 py-2 focus-within:border-gray-300 focus-within:shadow-md transition-all">
                                <div className="relative shrink-0" ref={modeRef}>
                                    <button
                                        onClick={() => setModeOpen(v => !v)}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[12px] font-medium text-gray-500 hover:bg-gray-100 transition-all"
                                    >
                                        {React.createElement(MODES.find(m => m.id === currentMode)!.icon)}
                                        <span className="hidden sm:inline">{MODES.find(m => m.id === currentMode)?.label}</span>
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    </button>
                                    {modeOpen && (
                                        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-30" style={{ animation: 'menu-pop 0.15s ease-out' }}>
                                            {MODES.map(m => {
                                                const MIcon = m.icon;
                                                const isActive = currentMode === m.id;
                                                return (
                                                <button
                                                    key={m.id}
                                                    onClick={() => { setCurrentMode(m.id); setModeOpen(false); }}
                                                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors ${isActive ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                                                >
                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                        <MIcon />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className={`text-[12px] font-semibold ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>{m.label}</p>
                                                        <p className="text-[10px] text-gray-400 leading-tight">{m.desc}</p>
                                                    </div>
                                                    {isActive && (
                                                        <svg className="w-3.5 h-3.5 text-gray-900 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                    )}
                                                </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                    placeholder="Ask a follow-up question..."
                                    disabled={isStreaming}
                                    className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400 py-2 min-w-0"
                                />
                                <div className="flex items-center gap-1 shrink-0">
                                    <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all" title="Attach file">
                                        <InputIcons.Attach />
                                    </button>
                                    <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all" title="Add image">
                                        <InputIcons.Image />
                                    </button>
                                    <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all" title="Voice input">
                                        <InputIcons.Mic />
                                    </button>
                                    <button
                                        onClick={handleSend}
                                        disabled={!inputText.trim() || isStreaming}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ml-1 ${inputText.trim() && !isStreaming ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Knowledge Graph Card */}
                {showGraphPanel && currentKgData && (
                    <div className="w-[400px] shrink-0 border-l border-gray-100 overflow-hidden relative">
                        {/* Close button */}
                        <button
                            onClick={() => setShowGraphPanel(false)}
                            className="absolute top-2 right-2 z-20 w-7 h-7 rounded-lg bg-white/80 backdrop-blur border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all shadow-sm"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <KnowledgeGraphView data={currentKgData} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperAgentChat;
