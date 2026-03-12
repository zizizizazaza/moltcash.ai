import { Hono } from 'hono';
import { syncAllSources } from '../services/sync.js';

const admin = new Hono();

// POST /admin/sync — manually trigger data sync
admin.post('/sync', async (c) => {
    try {
        const result = await syncAllSources();
        return c.json({ success: true, data: result });
    } catch (err: any) {
        return c.json({ success: false, error: err.message }, 500);
    }
});

export default admin;
