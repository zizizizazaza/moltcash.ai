import { Context, Next } from 'hono';

// Generate short request ID
function reqId(): string {
    return Math.random().toString(36).substring(2, 10);
}

// Unified error response with request ID
export async function errorHandler(c: Context, next: Next) {
    const id = reqId();
    c.header('X-Request-Id', id);

    try {
        await next();
    } catch (err: any) {
        const status = err.status || 500;
        const message = err.message || 'Internal Server Error';

        // Log with request details
        console.error(`[Error] ${id} | ${c.req.method} ${c.req.path} | ${status} | ${message}`);
        if (status >= 500) {
            console.error(err.stack || err);
        }

        return c.json({
            success: false,
            error: status >= 500 ? 'Internal Server Error' : message,
            requestId: id,
        }, status);
    }
}
