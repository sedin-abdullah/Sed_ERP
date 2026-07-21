import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:5100';

/**
 * Single shared Socket.IO connection — the client half of the real-time sync
 * rule. Pages call `subscribe(event, handler)` on mount; the returned cleanup
 * removes the listener. Reconnects automatically after backend cold-starts.
 */
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ['websocket'],
      auth: { token: useAuthStore.getState().accessToken ?? undefined },
    });
    socket.on('connect', () => console.debug('[socket] connected'));
    socket.on('disconnect', () => console.debug('[socket] disconnected'));
  }
  return socket;
}

/** Subscribe to a sync event; returns an unsubscribe cleanup for useEffect. */
export function subscribe<T = unknown>(event: string, handler: (payload: T) => void): () => void {
  const s = getSocket();
  s.on(event, handler as (payload: unknown) => void);
  return () => s.off(event, handler as (payload: unknown) => void);
}

/** Re-authenticate the socket after login/logout so future events are scoped. */
export function refreshSocketAuth(): void {
  if (!socket) return;
  socket.auth = { token: useAuthStore.getState().accessToken ?? undefined };
  socket.disconnect().connect();
}
