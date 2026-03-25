import { Router, Request, Response } from 'express';
import { getCachedStartups, getStartupDetail, getCacheStats } from '../services/trustmrr.service.js';

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

  res.json({ data, partial });
});

/**
 * GET /api/trustmrr/stats
 * Cache health check for monitoring.
 */
router.get('/stats', (_req: Request, res: Response) => {
  res.json(getCacheStats());
});

export default router;
