import { Hono } from 'hono';
import prisma from '../lib/prisma.js';
import { getUserId } from '../middleware/auth.js';

const quota = new Hono();

// GET /quota — get current user's quota
quota.get('/', async (c) => {
    const userId = getUserId(c);

    const data = await prisma.quota.findUnique({ where: { userId } });
    if (!data) {
        return c.json({ success: false, error: 'Quota not found' }, 404);
    }

    // Check if reset is needed (first day of month)
    const now = new Date();
    const resetDate = new Date(data.resetAt);
    const needsReset = now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear();

    if (needsReset) {
        const updated = await prisma.quota.update({
            where: { userId },
            data: {
                questsUsed: 0,
                testnetInteractions: 0,
                resetAt: now,
            },
        });

        return c.json({
            success: true,
            data: {
                questsUsed: updated.questsUsed,
                questsTotal: 20,
                testnetInteractions: updated.testnetInteractions,
                testnetInteractionsTotal: 100,
                yieldDeposited: updated.yieldDeposited,
                yieldLimit: 500,
                resetAt: updated.resetAt,
                wasReset: true,
            },
        });
    }

    return c.json({
        success: true,
        data: {
            questsUsed: data.questsUsed,
            questsTotal: 20,
            testnetInteractions: data.testnetInteractions,
            testnetInteractionsTotal: 100,
            yieldDeposited: data.yieldDeposited,
            yieldLimit: 500,
            resetAt: data.resetAt,
            wasReset: false,
        },
    });
});

export default quota;
