/**
 * MoltCash API Client
 * 
 * Thin wrapper over fetch() for calling the backend API.
 * Uses Privy access token for authentication.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3003';

// Token getter — set by App.tsx after Privy login
let getAccessToken: (() => Promise<string | null>) | null = null;

export function setAccessTokenGetter(fn: () => Promise<string | null>) {
    getAccessToken = fn;
}

async function request<T = any>(
    path: string,
    options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; pagination?: any }> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    // Get Privy access token if available
    if (getAccessToken) {
        try {
            const token = await getAccessToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        } catch {
            // silently continue without auth
        }
    }

    try {
        const res = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers,
        });

        const json = await res.json();

        if (!res.ok) {
            return { success: false, error: json.error || `HTTP ${res.status}` };
        }

        return json;
    } catch (err: any) {
        return { success: false, error: err.message || 'Network error' };
    }
}

// ── Auth ──────────────────────────────────────────
export const auth = {
    sync: (data: {
        walletAddress?: string;
        email?: string;
        twitterHandle?: string;
        displayName?: string;
        avatarUrl?: string;
        referralCode?: string;
    }) =>
        request('/api/auth/sync', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    me: () => request('/api/auth/me'),
};

// ── Opportunities (Public) ────────────────────────
export const opportunities = {
    list: (params?: {
        type?: string;
        chain?: string;
        hot?: boolean;
        page?: number;
        limit?: number;
        sort?: string;
        order?: string;
    }) => {
        const query = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                if (v !== undefined) query.set(k, String(v));
            });
        }
        return request(`/opportunities?${query}`);
    },

    hot: () => request('/opportunities/hot'),

    detail: (id: string) => request(`/opportunities/${id}`),
};

// ── Leaderboard (Public) ──────────────────────────
export const leaderboard = {
    get: (sort?: 'points' | 'credits' | 'totalEarned', limit?: number) => {
        const query = new URLSearchParams();
        if (sort) query.set('sort', sort);
        if (limit) query.set('limit', String(limit));
        return request(`/leaderboard?${query}`);
    },
};

// ── Farm Sessions (Protected) ─────────────────────
export const sessions = {
    create: (opportunityId: string) =>
        request('/api/sessions', {
            method: 'POST',
            body: JSON.stringify({ opportunityId }),
        }),

    start: (id: string) =>
        request(`/api/sessions/${id}/start`, { method: 'POST' }),

    pause: (id: string) =>
        request(`/api/sessions/${id}/pause`, { method: 'POST' }),

    complete: (id: string, txHash?: string) =>
        request(`/api/sessions/${id}/complete`, {
            method: 'POST',
            body: JSON.stringify({ txHash }),
        }),

    get: (id: string) => request(`/api/sessions/${id}`),

    list: (status?: string) =>
        request(`/api/sessions${status ? `?status=${status}` : ''}`),
};

// ── Executions (Public, API Key auth) ─────────────
export const executions = {
    list: (page?: number, limit?: number) => {
        const query = new URLSearchParams();
        if (page) query.set('page', String(page));
        if (limit) query.set('limit', String(limit));
        return request(`/api/dashboard/history?${query}`);
    },
};

// ── Task Market (Protected) ───────────────────────
export const tasks = {
    create: (data: {
        title: string;
        description: string;
        reward?: string;
        rewardAmount: number;
        difficulty?: string;
        timeEstimate?: string;
        tags?: string[];
        deadline?: string;
    }) =>
        request('/api/tasks', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (id: string, data: any) =>
        request(`/api/tasks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    cancel: (id: string) =>
        request(`/api/tasks/${id}`, { method: 'DELETE' }),

    apply: (id: string, message: string) =>
        request(`/api/tasks/${id}/apply`, {
            method: 'POST',
            body: JSON.stringify({ message }),
        }),

    applications: (id: string) =>
        request(`/api/tasks/${id}/applications`),

    assign: (id: string, applicationId: string) =>
        request(`/api/tasks/${id}/assign`, {
            method: 'POST',
            body: JSON.stringify({ applicationId }),
        }),

    submit: (id: string, description: string, attachmentUrl?: string) =>
        request(`/api/tasks/${id}/submit`, {
            method: 'POST',
            body: JSON.stringify({ description, attachmentUrl }),
        }),

    approve: (id: string) =>
        request(`/api/tasks/${id}/approve`, { method: 'POST' }),

    requestRevision: (id: string, note: string) =>
        request(`/api/tasks/${id}/request-revision`, {
            method: 'POST',
            body: JSON.stringify({ note }),
        }),

    myPublished: () => request('/api/tasks/my/published'),

    myApplied: () => request('/api/tasks/my/applied'),
};

// ── Comments (Public read, Protected write) ───────
export const comments = {
    list: (opportunityId: string) =>
        request(`/comments/${opportunityId}`),

    create: (opportunityId: string, content: string, authorRole?: string) =>
        request(`/api/comments/${opportunityId}`, {
            method: 'POST',
            body: JSON.stringify({ content, authorRole }),
        }),

    reply: (commentId: string, content: string) =>
        request(`/api/comments/${commentId}/reply`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        }),

    like: (commentId: string) =>
        request(`/api/comments/${commentId}/like`, { method: 'POST' }),

    remove: (commentId: string) =>
        request(`/api/comments/${commentId}`, { method: 'DELETE' }),
};

// ── Reviews (Protected) ──────────────────────────
export const reviews = {
    submit: (opportunityId: string, rating: number, comment?: string) =>
        request(`/api/reviews/${opportunityId}`, {
            method: 'POST',
            body: JSON.stringify({ rating, comment }),
        }),

    forTask: (opportunityId: string) =>
        request(`/api/reviews/${opportunityId}`),

    forUser: (userId: string) =>
        request(`/api/reviews/user/${userId}`),
};

// ── Dashboard (Protected) ─────────────────────────
export const dashboard = {
    stats: () => request('/api/dashboard/stats'),

    activeFarms: () => request('/api/dashboard/active-farms'),

    history: (page?: number, limit?: number) => {
        const query = new URLSearchParams();
        if (page) query.set('page', String(page));
        if (limit) query.set('limit', String(limit));
        return request(`/api/dashboard/history?${query}`);
    },

    transactions: (page?: number, limit?: number) => {
        const query = new URLSearchParams();
        if (page) query.set('page', String(page));
        if (limit) query.set('limit', String(limit));
        return request(`/api/dashboard/transactions?${query}`);
    },
};

// ── Points & Credits (Protected) ──────────────────
export const points = {
    summary: () => request('/api/points'),

    history: (page?: number, limit?: number) => {
        const query = new URLSearchParams();
        if (page) query.set('page', String(page));
        if (limit) query.set('limit', String(limit));
        return request(`/api/points/history?${query}`);
    },
};

// ── Quota (Protected) ─────────────────────────────
export const quotaApi = {
    get: () => request('/api/quota'),
};

export default {
    auth,
    opportunities,
    leaderboard,
    sessions,
    tasks,
    comments,
    reviews,
    dashboard,
    points,
    quota: quotaApi,
    setAccessTokenGetter,
};
