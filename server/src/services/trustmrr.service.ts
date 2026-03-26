/**
 * TrustMRR Service — Two-layer in-memory cache with request dedup & rate-limited queue.
 *
 * Protection against 20 req/min API limit:
 *   1. Promise coalescing  — same slug in-flight → single request
 *   2. Token-bucket queue  — max 18 req/min (2 reserved for list refresh)
 *   3. Graceful fallback   — if queued, return list-level data with { partial: true }
 */

import { config } from '../config.js';

const TMRR = config.trustmrr;
const HEADERS = { Authorization: `Bearer ${TMRR.apiKey}` };

// ─── Types ──────────────────────────────────────────────────
export interface TrustMRRStartup {
  name: string;
  slug: string;
  icon: string | null;
  description: string;
  website: string | null;
  country: string | null;
  foundedDate: string | null;
  category: string;
  paymentProvider: string;
  targetAudience: string | null;
  revenue: { last30Days: number; mrr: number; total: number };
  customers: number;
  activeSubscriptions: number;
  askingPrice: number | null;
  profitMarginLast30Days: number | null;
  growth30d: number | null;
  growthMRR30d: number | null;
  multiple: number | null;
  rank: number;
  visitorsLast30Days: number | null;
  revenuePerVisitor: number | null;
  xHandle: string | null;
  // Detail-only fields
  xFollowerCount?: number;
  techStack?: { slug: string; category: string }[] | string[];
  cofounders?: { xHandle: string; xName: string; avatarUrl?: string }[];
  // Descriptive fields (returned by some detail endpoints)
  valueProposition?: string;
  problemSolved?: string;
  pricing?: string;
}

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

// ─── State ──────────────────────────────────────────────────
let listCache: CacheEntry<TrustMRRStartup[]> | null = null;
const detailCache = new Map<string, CacheEntry<TrustMRRStartup>>();
const inflight = new Map<string, Promise<TrustMRRStartup | null>>();
let refreshTimer: ReturnType<typeof setInterval> | null = null;

// Token bucket for rate limiting outgoing requests
const BUCKET_INTERVAL_MS = Math.ceil(60_000 / TMRR.maxRequestsPerMinute); // ~3333ms
let tokenAvailableAt = 0;

// ─── Helpers ────────────────────────────────────────────────

/** Normalize startup monetary fields (API returns values in USD, not cents). */
function normalizeMoney(s: any): TrustMRRStartup {
  if (s.revenue) {
    s.revenue = {
      last30Days: s.revenue.last30Days ?? 0,
      mrr: s.revenue.mrr ?? 0,
      total: s.revenue.total ?? 0,
    };
  }
  // askingPrice is also already in USD
  return s as TrustMRRStartup;
}

/** Wait until the next token-bucket slot. */
async function acquireToken(): Promise<void> {
  const now = Date.now();
  if (now >= tokenAvailableAt) {
    tokenAvailableAt = now + BUCKET_INTERVAL_MS;
    return;
  }
  const waitMs = tokenAvailableAt - now;
  tokenAvailableAt += BUCKET_INTERVAL_MS;
  return new Promise(resolve => setTimeout(resolve, waitMs));
}

// ─── List: Fetch & Cache ────────────────────────────────────
async function fetchStartupList(): Promise<TrustMRRStartup[]> {
  try {
    await acquireToken();
    const url = `${TMRR.baseUrl}/startups?sort=revenue-desc&limit=50`;
    const res = await fetch(url, { headers: HEADERS });

    if (!res.ok) {
      console.error(`[TrustMRR] List fetch failed: ${res.status} ${res.statusText}`);
      return listCache?.data ?? [];
    }

    const json = await res.json() as { data: any[]; meta: any };
    const startups = json.data.map(normalizeMoney);

    listCache = { data: startups, fetchedAt: Date.now() };
    console.log(`[TrustMRR] ✅ List cache refreshed — ${startups.length} startups`);
    return startups;
  } catch (err) {
    console.error('[TrustMRR] List fetch error:', err);
    return listCache?.data ?? [];
  }
}

// ─── Detail: Fetch with Dedup & Queue ───────────────────────
async function fetchStartupDetail(slug: string): Promise<TrustMRRStartup | null> {
  try {
    await acquireToken();
    const url = `${TMRR.baseUrl}/startups/${encodeURIComponent(slug)}`;
    const res = await fetch(url, { headers: HEADERS });

    if (!res.ok) {
      console.warn(`[TrustMRR] Detail fetch failed for "${slug}": ${res.status}`);
      return null;
    }

    const json = await res.json() as { data: any };
    const startup = normalizeMoney(json.data);

    detailCache.set(slug, { data: startup, fetchedAt: Date.now() });
    console.log(`[TrustMRR] ✅ Detail cached: ${startup.name} (${slug})`);
    return startup;
  } catch (err) {
    console.error(`[TrustMRR] Detail fetch error for "${slug}":`, err);
    return null;
  }
}

// ─── Public API ─────────────────────────────────────────────

/** Get cached startup list. Always instant (returns [] during first fetch). */
export function getCachedStartups(): TrustMRRStartup[] {
  return listCache?.data ?? [];
}

/** Get startup detail with dedup + rate-limited queue + fallback. */
export async function getStartupDetail(slug: string): Promise<{
  data: TrustMRRStartup | null;
  partial: boolean;
}> {
  // 1. Check detail cache (with TTL)
  const cached = detailCache.get(slug);
  if (cached && (Date.now() - cached.fetchedAt) < TMRR.detailTtlMs) {
    return { data: cached.data, partial: false };
  }

  // 2. Check if request is already in-flight (Promise coalescing)
  const existing = inflight.get(slug);
  if (existing) {
    const result = await existing;
    return { data: result, partial: false };
  }

  // 3. Fire deduped, rate-limited request
  const promise = fetchStartupDetail(slug).finally(() => {
    inflight.delete(slug);
  });
  inflight.set(slug, promise);

  // 4. Race: if the token-bucket wait would be > 5s, return list-level fallback
  const fallback = listCache?.data.find(s => s.slug === slug) ?? null;
  const result = await Promise.race([
    promise,
    new Promise<null>(resolve => setTimeout(() => resolve(null), 5000)),
  ]);

  if (result) {
    return { data: result, partial: false };
  }

  // Timed out waiting for token slot → return list data as partial
  if (fallback) {
    return { data: fallback, partial: true };
  }

  // Still waiting, just await the actual result
  const finalResult = await promise;
  return { data: finalResult, partial: false };
}

/** Get cache statistics for health monitoring. */
export function getCacheStats() {
  return {
    listCached: !!listCache,
    listCount: listCache?.data.length ?? 0,
    listAge: listCache ? Math.round((Date.now() - listCache.fetchedAt) / 1000) + 's ago' : 'never',
    detailCacheSize: detailCache.size,
    inflightRequests: inflight.size,
  };
}

// ─── Lifecycle ──────────────────────────────────────────────

/** Start the service: fetch list immediately + set periodic refresh. */
export async function startTrustMRRService(): Promise<void> {
  if (!TMRR.apiKey) {
    console.warn('[TrustMRR] ⚠️  No API key configured — service disabled');
    return;
  }

  console.log('[TrustMRR] 🚀 Starting service...');
  await fetchStartupList();

  refreshTimer = setInterval(() => {
    fetchStartupList();
  }, TMRR.refreshIntervalMs);

  console.log(`[TrustMRR] ⏰ Auto-refresh every ${TMRR.refreshIntervalMs / 1000}s`);
}

/** Stop the service and clear timers. */
export function stopTrustMRRService(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  console.log('[TrustMRR] Service stopped');
}
