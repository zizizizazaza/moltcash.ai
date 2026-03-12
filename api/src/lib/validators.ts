/**
 * Zod schemas for API input validation
 */
import { z } from 'zod';

// ── Auth ──────────────────────────────────────────
export const authSyncSchema = z.object({
    walletAddress: z.string().optional(),
    email: z.string().email().optional(),
    twitterHandle: z.string().max(30).optional(),
    displayName: z.string().max(100).optional(),
    avatarUrl: z.string().url().optional(),
    referralCode: z.string().max(20).optional(),
});

// ── Sessions ──────────────────────────────────────
export const createSessionSchema = z.object({
    opportunityId: z.string().min(1, 'opportunityId is required'),
});

// ── Tasks ─────────────────────────────────────────
export const createTaskSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(5000),
    reward: z.string().max(100).optional(),
    rewardAmount: z.number().min(0).default(0),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']).default('Medium'),
    timeEstimate: z.string().max(50).optional(),
    tags: z.array(z.string().max(50)).max(10).default([]),
    deadline: z.string().datetime().optional(),
});

export const applyTaskSchema = z.object({
    message: z.string().min(1).max(2000),
});

export const submitTaskSchema = z.object({
    description: z.string().min(1).max(5000),
    attachmentUrl: z.string().url().optional(),
});

export const updateTaskSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(5000).optional(),
    reward: z.string().max(100).optional(),
    rewardAmount: z.number().min(0).optional(),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
    timeEstimate: z.string().max(50).optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
    deadline: z.string().datetime().optional(),
});

// ── Comments ──────────────────────────────────────
export const createCommentSchema = z.object({
    content: z.string().min(1).max(2000),
    authorRole: z.string().max(50).optional(),
});

export const replyCommentSchema = z.object({
    content: z.string().min(1).max(2000),
});

// ── Reviews ───────────────────────────────────────
export const createReviewSchema = z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().max(2000).optional(),
});

// ── Points ────────────────────────────────────────
export const requestRevisionSchema = z.object({
    note: z.string().min(1).max(2000),
});

// ── Pagination ────────────────────────────────────
export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Helper: validate request body ─────────────────
import { Context } from 'hono';

export async function validateBody<T>(c: Context, schema: z.ZodSchema<T>): Promise<T> {
    const raw = await c.req.json();
    const result = schema.safeParse(raw);
    if (!result.success) {
        const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
        throw Object.assign(new Error(errors.join('; ')), { status: 400 });
    }
    return result.data;
}

export function validateQuery<T>(c: Context, schema: z.ZodSchema<T>): T {
    const raw = Object.fromEntries(new URL(c.req.url).searchParams);
    const result = schema.safeParse(raw);
    if (!result.success) {
        const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
        throw Object.assign(new Error(errors.join('; ')), { status: 400 });
    }
    return result.data;
}
