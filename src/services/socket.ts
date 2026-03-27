import { io, Socket } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

// Properly derive socket connection URL and path from API_BASE
// e.g. "https://nftkashai.online/lokacash/api" → origin: "https://nftkashai.online", path: "/lokacash/api/socket.io"
let SOCKET_URL: string;
let SOCKET_PATH: string;

if (API_BASE.startsWith('http')) {
  const url = new URL(API_BASE);
  SOCKET_URL = url.origin;
  SOCKET_PATH = url.pathname.replace(/\/?$/, '') + '/socket.io';
} else {
  SOCKET_URL = window.location.origin.replace('3000', '3002');
  SOCKET_PATH = API_BASE.replace(/\/?$/, '') + '/socket.io';
}

class SocketClient {
  private socket: Socket | null = null;
  private token: string | null = null;
  private tokenGetter: (() => Promise<string | null>) | null = null;
  private listeners: Record<string, Function[]> = {};
  private isRefreshing = false; // Prevent concurrent refresh loops

  setToken(token: string) {
    if (this.token === token) return;
    this.token = token;
    this.connect();
  }

  /** Register a dynamic token getter (e.g. Privy getAccessToken) for auto-refresh */
  setTokenGetter(getter: () => Promise<string | null>) {
    this.tokenGetter = getter;
  }

  clearToken() {
    this.token = null;
    this.tokenGetter = null;
    this.disconnect();
  }

  private connect() {
    if (!this.token) return;
    
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(SOCKET_URL, {
      path: SOCKET_PATH,
      auth: { token: this.token },
      reconnection: true,
      reconnectionAttempts: Infinity,  // Never give up (Telegram-style)
      reconnectionDelay: 2000,
      reconnectionDelayMax: 30000,     // Cap at 30s with exponential backoff
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket Connected');
      this.isRefreshing = false; // Reset on successful connect
    });

    this.socket.on('disconnect', () => {
      console.log('🔴 WebSocket Disconnected');
    });

    this.socket.on('connect_error', async (err) => {
      console.error('Socket connect error:', err.message);

      // If the error is auth-related and we have a tokenGetter, refresh and retry
      const isAuthError = /expired|invalid|auth|unauthorized|jwt/i.test(err.message);
      if (isAuthError && this.tokenGetter && !this.isRefreshing) {
        this.isRefreshing = true;
        console.warn('[Socket] Auth error detected, refreshing token...');
        try {
          const freshToken = await this.tokenGetter();
          if (freshToken && this.socket) {
            this.token = freshToken;
            (this.socket.auth as any).token = freshToken;
            // socket.io will auto-retry with the updated auth on next reconnection attempt
            console.log('[Socket] Token refreshed, reconnecting...');
          }
        } catch (refreshErr) {
          console.error('[Socket] Token refresh failed:', refreshErr);
        } finally {
          // Allow another refresh attempt after a cooldown
          setTimeout(() => { this.isRefreshing = false; }, 5000);
        }
      }
    });

    this.socket.on('error', (err) => {
      console.error('Socket error:', err);
    });

    // Setup global listeners dispatcher
    this.socket.onAny((event, ...args) => {
      if (this.listeners[event]) {
        this.listeners[event].forEach(cb => cb(...args));
      }
    });
  }

  /** Reconnect with a fresh token (e.g. after Privy refreshes it or on visibility change) */
  reconnectWithToken(token: string) {
    this.token = token;
    if (this.socket) {
      (this.socket.auth as any).token = token;
      this.socket.disconnect().connect();
    } else {
      this.connect();
    }
  }

  private disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Subscribe to typed events
  on(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return () => this.off(event, callback); // Return unsubscribe function
  }

  off(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event: string, ...args: any[]) {
    if (this.socket?.connected) {
      this.socket.emit(event, ...args);
    }
  }
}

export const socket = new SocketClient();
