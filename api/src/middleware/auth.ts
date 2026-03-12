import { Context, Next } from 'hono';
import { verifyAuthToken } from '@privy-io/node';
import { randomBytes } from 'crypto';
import prisma from '../lib/prisma.js';

const PRIVY_APP_ID = process.env.PRIVY_APP_ID || 'cmm5pmk0d00sf0dl1sq4q7r1j';
const PRIVY_VERIFICATION_KEY = process.env.PRIVY_VERIFICATION_KEY || '';

// ── Privy auth middleware ─────────────────────────
export async function authMiddleware(c: Context, next: Next) {
    const header = c.req.header('Authorization');
    if (!header?.startsWith('Bearer ')) {
        return c.json({ success: false, error: 'Missing or invalid token' }, 401);
    }

    try {
        const token = header.slice(7);

        // Verify the Privy access token
        const payload = await verifyAuthToken({
            auth_token: token,
            app_id: PRIVY_APP_ID,
            verification_key: PRIVY_VERIFICATION_KEY,
        });

        // payload.user_id is the Privy DID (e.g., "did:privy:cmxxx...")
        const privyUserId = payload.user_id;

        // Find-or-create local user by privyId
        let user = await prisma.user.findUnique({
            where: { privyId: privyUserId },
        });

        if (!user) {
            // Auto-create user on first authenticated request
            // Also auto-generate an API key for agent/skill access
            const apiKey = `mc_${randomBytes(16).toString('hex')}`;
            user = await prisma.user.create({
                data: {
                    privyId: privyUserId,
                    quota: { create: {} },
                    apiKeys: {
                        create: {
                            key: apiKey,
                            name: 'Auto-generated',
                            tier: 'free',
                            dailyLimit: 10,
                        },
                    },
                },
            });
        }

        // Set context for downstream handlers
        c.set('userId', user.id);
        c.set('privyUserId', privyUserId);
        c.set('walletAddress', user.walletAddress || '');

        await next();
    } catch (err: any) {
        console.error('Auth error:', err?.message || err);
        return c.json({ success: false, error: 'Invalid or expired token' }, 401);
    }
}

// Helper: get userId from context (use after authMiddleware)
export function getUserId(c: Context): string {
    return c.get('userId') as string;
}
