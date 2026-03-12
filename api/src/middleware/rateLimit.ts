/**
 * Simple in-memory rate limiter middleware for Hono
 * 
 * Uses a sliding window approach. In production, replace with Redis-based limiter.
 */
import { Context, Next } from 'hono';

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
        if (entry.resetAt <= now) store.delete(key);
    }
}, 5 * 60 * 1000);

interface RateLimitOptions {
    windowMs?: number;  // Window size in ms (default: 60s)
    max?: number;       // Max requests per window (default: 100)
    keyPrefix?: string; // Key prefix for different limiters
}

export function rateLimiter(options: RateLimitOptions = {}) {
    const { windowMs = 60_000, max = 100, keyPrefix = 'global' } = options;

    return async (c: Context, next: Next) => {
        // Use IP + user ID as the key
        const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
        const userId = c.get('userId') || '';
        const key = `${keyPrefix}:${userId || ip}`;

        const now = Date.now();
        const entry = store.get(key);

        if (!entry || entry.resetAt <= now) {
            // New window
            store.set(key, { count: 1, resetAt: now + windowMs });
            c.header('X-RateLimit-Limit', String(max));
            c.header('X-RateLimit-Remaining', String(max - 1));
            c.header('X-RateLimit-Reset', String(Math.ceil((now + windowMs) / 1000)));
            await next();
            return;
        }

        entry.count++;

        if (entry.count > max) {
            const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
            c.header('Retry-After', String(retryAfter));
            c.header('X-RateLimit-Limit', String(max));
            c.header('X-RateLimit-Remaining', '0');
            return c.json(
                { success: false, error: 'Too many requests. Please try again later.' },
                429
            );
        }

        c.header('X-RateLimit-Limit', String(max));
        c.header('X-RateLimit-Remaining', String(max - entry.count));
        c.header('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));
        await next();
    };
}
