import { Router, Request, Response } from 'express';
import { getCachedStartups, getStartupDetail, getCacheStats } from '../services/trustmrr.service.js';
import { getStartupInsight, getInsightCacheStats } from '../services/startup-insights.service.js';

const router = Router();

/**
 * GET /api/trustmrr/startups
 * Returns the cached list of startups (instant, no external API call).
 * Query params: category, limit
 */
router.get('/startups', (_req: Request, res: Response) => {
  let data = getCachedStartups();

  // Optional category filter
  const category = _req.query.category as string | undefined;
  if (category && category !== 'All') {
    data = data.filter(s => s.category.toLowerCase() === category.toLowerCase());
  }

  // Deliver full catalog for frontend's local pagination (default to 5000)
  const limit = parseInt(_req.query.limit as string) || 5000;
  data = data.slice(0, limit);

  res.json({ data, meta: { total: data.length, cached: true } });
});

/**
 * GET /api/trustmrr/startups/:slug
 * Returns full detail for a single startup. Uses dedup + queue + fallback.
 * AI-generates valueProposition & problemSolved if missing.
 */
router.get('/startups/:slug', async (req: Request, res: Response) => {
  const slug = req.params.slug as string;

  if (!slug) {
    res.status(400).json({ error: 'Slug is required' });
    return;
  }

  const { data, partial } = await getStartupDetail(slug);

  if (!data) {
    res.status(404).json({ error: 'Startup not found' });
    return;
  }

  // Enrich with AI-generated insights if missing
  let enrichedData = { ...data } as any;
  if (!enrichedData.valueProposition || !enrichedData.problemSolved) {
    const insight = await getStartupInsight({
      slug,
      name: data.name,
      description: data.description,
      category: data.category,
      targetAudience: data.targetAudience,
      paymentProvider: data.paymentProvider,
      customers: data.customers,
      revenue: data.revenue,
    });
    if (insight) {
      enrichedData.valueProposition = enrichedData.valueProposition || insight.valueProposition;
      enrichedData.problemSolved = enrichedData.problemSolved || insight.problemSolved;
    }
  }

  res.json({ data: enrichedData, partial });
});

/**
 * GET /api/trustmrr/stats
 * Cache health check for monitoring.
 */
router.get('/stats', (_req: Request, res: Response) => {
  res.json({ ...getCacheStats(), insights: getInsightCacheStats() });
});

export default router;
