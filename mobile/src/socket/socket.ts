import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/config';
import { useAuthStore } from '@/store/authStore';

/** Single shared Socket.IO connection — the client half of the real-time sync
 *  rule. Screens call subscribe(event, handler) on mount; the cleanup removes
 *  the listener. Reconnects automatically after backend cold-starts. */
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token: useAuthStore.getState().accessToken ?? undefined },
    });
  }
  return socket;
}

export function subscribe<T = unknown>(event: string, handler: (payload: T) => void): () => void {
  const s = getSocket();
  s.on(event, handler as (payload: unknown) => void);
  return () => s.off(event, handler as (payload: unknown) => void);
}

/** Re-authenticate the socket after login/logout. */
export function refreshSocketAuth(): void {
  if (!socket) return;
  socket.auth = { token: useAuthStore.getState().accessToken ?? undefined };
  socket.disconnect().connect();
}
