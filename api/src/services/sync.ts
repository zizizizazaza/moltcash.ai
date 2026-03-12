/**
 * External Data Source Fetchers
 * 
 * Only syncs opportunities that Claw Agent can actually execute:
 * - DefiLlama Yields: protocols with standard contract interfaces (deposit/stake)
 * - Galxe: quests with on-chain steps (swap/bridge/mint)
 * 
 * Superteam Earn is excluded — those are human bounties, not automatable.
 */

import prisma from '../lib/prisma.js';

// ── Types ─────────────────────────────────────────
interface ExternalOpportunity {
    externalId: string;
    source: string;
    type: string;
    title: string;
    description: string;
    sourceUrl?: string;
    chain: string;
    reward: string;
    rewardType: string;
    rewardAmount?: number;
    estimatedGas?: string;
    difficulty?: string;
    timeEstimate?: string;
    deadline?: Date;
    participantCount?: number;
    tags?: string[];
    isHot?: boolean;
    isNew?: boolean;
}

// ══════════════════════════════════════════════════
// 1. DEFILLAMA YIELDS — Only automatable protocols
// ══════════════════════════════════════════════════

const TARGET_CHAINS = new Set([
    'Ethereum', 'Base', 'Arbitrum', 'Optimism', 'Polygon',
    'BSC', 'Avalanche', 'Solana', 'Scroll', 'zkSync Era',
]);

// Whitelist: protocols where Claw has (or can build) standard contract adapters
// Each maps to a contract action: deposit, stake, supply, etc.
const AUTOMATABLE_PROTOCOLS = new Set([
    // ── ETH Staking ──
    'lido',              // stETH: submit()
    'rocket-pool',       // rETH: deposit()
    'binance-staked-eth', // wBETH
    // ── Lending ──
    'aave-v3',           // supply(asset, amount, onBehalfOf, referralCode)
    'compound-v3',       // supply(asset, amount)
    'morpho',            // supply(marketParams, amount, shares, onBehalf, data)
    'spark',             // supply() — Maker's Spark Protocol
    // ── Yield Vaults ──
    'pendle',            // addLiquiditySingleToken / swapExactTokenForPt
    'yearn-v3',          // deposit(amount)
    'convex-finance',    // deposit(pid, amount, stake)
    'curve-dex',         // add_liquidity()
    // ── Restaking ──
    'eigenlayer',        // depositIntoStrategy()
    // ── Solana ──
    'jito',              // stake SOL → jitoSOL
    'marinade-finance',  // stake SOL → mSOL
]);

async function fetchDefiLlama(): Promise<ExternalOpportunity[]> {
    console.log('[Sync] Fetching DefiLlama yield pools (automatable only)...');

    try {
        const res = await fetch('https://yields.llama.fi/pools');
        if (!res.ok) throw new Error(`DefiLlama API ${res.status}`);

        const json = await res.json() as { data: any[] };
        console.log(`[Sync] DefiLlama: ${json.data.length} total pools`);

        // Filter: target chains + automatable protocols only + min TVL $1M + min APY 1%
        const filtered = json.data.filter((p: any) =>
            TARGET_CHAINS.has(p.chain) &&
            AUTOMATABLE_PROTOCOLS.has(p.project) &&
            p.tvlUsd > 1_000_000 &&
            p.apy > 1
        );

        console.log(`[Sync] DefiLlama: ${filtered.length} automatable pools after filtering`);

        // Take top 30 by APY
        const top = filtered
            .sort((a: any, b: any) => b.apy - a.apy)
            .slice(0, 30);

        return top.map((p: any) => {
            const apy = parseFloat(p.apy.toFixed(2));
            const projectName = capitalize(p.project);
            return {
                externalId: p.pool,
                source: 'DefiLlama',
                type: 'yield',
                title: `${projectName} ${p.symbol}`,
                description: `Claw auto-deposits into ${projectName} on ${p.chain}. Current APY: ${apy}%. TVL: $${formatNumber(p.tvlUsd)}. Fully automated — approve and earn.`,
                sourceUrl: `https://defillama.com/yields/pool/${p.pool}`,
                chain: p.chain,
                reward: `${apy}% APY`,
                rewardType: 'apy',
                rewardAmount: apy,
                estimatedGas: p.chain === 'Ethereum' ? '$2-5' : '$0.05-0.50',
                difficulty: 'Easy',
                timeEstimate: '~1min',
                tags: [
                    `#${p.project}`,
                    `#${p.chain.toLowerCase().replace(/\s/g, '')}`,
                    '#defi', '#yield', '#auto',
                ],
                isHot: apy > 15 || p.tvlUsd > 100_000_000,
                isNew: false,
            };
        });
    } catch (err: any) {
        console.error('[Sync] DefiLlama fetch error:', err.message);
        return [];
    }
}

// ══════════════════════════════════════════════════
// 2. GALXE — Quest / Airdrop Campaigns (on-chain only)
// ══════════════════════════════════════════════════

// Top spaces to track — projects with likely airdrops
const GALXE_SPACES = [
    { id: '34645', alias: 'Movement' },
    { id: '40436', alias: 'ALLO' },
    { id: '12206', alias: 'Scroll' },
    { id: '4063', alias: 'zkSync' },
    { id: '38777', alias: 'Berachain' },
    { id: '46659', alias: 'Monad' },
    { id: '3104', alias: 'Base' },
    { id: '1289', alias: 'Arbitrum' },
    { id: '40637', alias: 'MegaETH' },
];

async function fetchGalxe(): Promise<ExternalOpportunity[]> {
    console.log('[Sync] Fetching Galxe campaigns (on-chain tasks)...');
    const results: ExternalOpportunity[] = [];

    for (const space of GALXE_SPACES) {
        try {
            const query = `{
                space(id: ${space.id}) {
                    name
                    campaigns(input: { first: 5 }) {
                        list {
                            id
                            name
                            description
                            chain
                            status
                            numNFTMinted
                        }
                    }
                }
            }`;

            const res = await fetch('https://graphigo.prd.galaxy.eco/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query }),
            });

            if (!res.ok) continue;

            const json = await res.json() as any;
            const campaigns = json.data?.space?.campaigns?.list || [];
            const spaceName = json.data?.space?.name || space.alias;

            for (const c of campaigns) {
                if (c.status !== 'Active') continue;

                const chainMap: Record<string, string> = {
                    'ETHEREUM': 'Ethereum', 'BSC': 'BSC', 'POLYGON': 'Polygon',
                    'ARBITRUM': 'Arbitrum', 'OPTIMISM': 'Optimism', 'BASE': 'Base',
                    'SCROLL': 'Scroll', 'ZKSYNC': 'zkSync Era',
                    'GRAVITY_ALPHA': 'Gravity',
                };

                results.push({
                    externalId: c.id,
                    source: 'Galxe',
                    type: 'quest',
                    title: c.name || `${spaceName} Quest`,
                    description: c.description
                        ? c.description.replace(/<[^>]*>/g, '').slice(0, 500)
                        : `Claw auto-completes on-chain quest steps on ${spaceName} via Galxe. Earn XP and potential airdrop eligibility.`,
                    sourceUrl: `https://galxe.com/${space.alias}/${c.id}`,
                    chain: chainMap[c.chain] || c.chain || 'Multi-chain',
                    reward: c.numNFTMinted ? `OAT + XP` : 'XP + Points',
                    rewardType: 'potential',
                    participantCount: c.numNFTMinted || 0,
                    difficulty: 'Easy',
                    timeEstimate: '~3min',
                    tags: [`#${spaceName.toLowerCase()}`, '#galxe', '#quest', '#auto'],
                    isHot: (c.numNFTMinted || 0) > 10000,
                    isNew: true,
                });
            }

            // Rate limit: 200ms between requests
            await new Promise(r => setTimeout(r, 200));
        } catch (err: any) {
            console.error(`[Sync] Galxe ${space.alias} error:`, err.message);
        }
    }

    console.log(`[Sync] Galxe: ${results.length} active campaigns found`);
    return results;
}

// ══════════════════════════════════════════════════
// SYNC ENGINE — Upsert to Database
// ══════════════════════════════════════════════════

export async function syncAllSources(): Promise<{
    defiLlama: number;
    galxe: number;
    total: number;
    errors: string[];
}> {
    console.log('[Sync] Starting full sync (automatable tasks only)...');
    const errors: string[] = [];
    let upserted = { defiLlama: 0, galxe: 0 };

    // Fetch all sources in parallel
    const [defiLlamaData, galxeData] = await Promise.all([
        fetchDefiLlama(),
        fetchGalxe(),
    ]);

    // Mark old external entries as expired before upserting new ones
    await prisma.opportunity.updateMany({
        where: {
            source: { in: ['Superteam'] },
        },
        data: { status: 'expired' },
    });

    // Upsert each batch
    for (const item of defiLlamaData) {
        try {
            await upsertOpportunity(item);
            upserted.defiLlama++;
        } catch (e: any) { errors.push(`DefiLlama ${item.title}: ${e.message}`); }
    }

    for (const item of galxeData) {
        try {
            await upsertOpportunity(item);
            upserted.galxe++;
        } catch (e: any) { errors.push(`Galxe ${item.title}: ${e.message}`); }
    }

    const total = upserted.defiLlama + upserted.galxe;
    console.log(`[Sync] Complete: ${total} opportunities synced (DefiLlama: ${upserted.defiLlama}, Galxe: ${upserted.galxe})`);
    if (errors.length) console.warn(`[Sync] ${errors.length} errors:`, errors.slice(0, 5));

    return { ...upserted, total, errors };
}

async function upsertOpportunity(item: ExternalOpportunity) {
    const data = {
        type: item.type,
        title: item.title,
        description: item.description,
        source: item.source,
        sourceUrl: item.sourceUrl || null,
        chain: item.chain,
        reward: item.reward,
        rewardType: item.rewardType,
        rewardAmount: item.rewardAmount || null,
        estimatedGas: item.estimatedGas || null,
        difficulty: item.difficulty || null,
        timeEstimate: item.timeEstimate || null,
        deadline: item.deadline || null,
        participantCount: item.participantCount || 0,
        tags: JSON.stringify(item.tags || []),
        isHot: item.isHot || false,
        isNew: item.isNew || false,
        status: 'active',
    };

    await prisma.opportunity.upsert({
        where: {
            source_externalId: {
                source: item.source,
                externalId: item.externalId,
            },
        },
        create: {
            ...data,
            externalId: item.externalId,
        },
        update: data,
    });
}

// ── Auto Sync Scheduler ───────────────────────────
let syncInterval: ReturnType<typeof setInterval> | null = null;

export function startSyncScheduler(intervalMs = 60 * 60 * 1000) {
    console.log(`[Sync] Scheduler started: every ${intervalMs / 60000} minutes`);

    // Run first sync after 5 seconds
    setTimeout(() => syncAllSources().catch(e => console.error('[Sync] Initial sync error:', e)), 5000);

    // Then every interval
    syncInterval = setInterval(() => {
        syncAllSources().catch(e => console.error('[Sync] Scheduled sync error:', e));
    }, intervalMs);
}

export function stopSyncScheduler() {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
        console.log('[Sync] Scheduler stopped');
    }
}

// ── Helpers ───────────────────────────────────────
function capitalize(s: string): string {
    return s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function formatNumber(n: number): string {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toFixed(0);
}
