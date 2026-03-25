import { io, Socket } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
// Extract the domain part for WebSocket URL (e.g. "http://localhost:3002")
const SOCKET_URL = API_BASE.startsWith('http') 
  ? API_BASE.replace('/api', '') 
  : window.location.origin.replace('3000', '3002'); // Fallback hack for local dev

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
      path: '/ws',
      auth: { token: this.token },
      transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
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
