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
  private listeners: Record<string, Function[]> = {};

  setToken(token: string) {
    if (this.token === token) return;
    this.token = token;
    this.connect();
  }

  clearToken() {
    this.token = null;
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
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket Connected');
    });

    this.socket.on('disconnect', () => {
      console.log('🔴 WebSocket Disconnected');
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
