import { Server as HttpServer } from 'http';
import { Server as IOServer, Socket } from 'socket.io';
import { env } from '../config/env';
import { verifyToken } from '../utils/token';

/**
 * The single Socket.IO server. Every write in the app calls `broadcast(event,
 * payload)` after the DB commit, so all connected clients update instantly —
 * the core real-time sync rule.
 */
let io: IOServer | null = null;

export type SyncEvent =
  | 'iot:update'
  | 'machine:status'
  | 'alert:new'
  | 'alert:cleared'
  | 'user:changed'
  | 'permission:changed'
  | 'service-request:changed'
  | 'quote:changed'
  | 'technician:changed'
  | 'job:changed'
  | 'machine:command-ack';

export function initSocket(server: HttpServer): IOServer {
  io = new IOServer(server, {
    cors: { origin: env.CLIENT_URLS, credentials: true },
  });

  // Optional auth on the handshake — attaches userId/role if a token is sent.
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (token) {
      try {
        const payload = verifyToken(token);
        socket.data.userId = payload.sub;
        socket.data.role = payload.role;
      } catch {
        // allow anonymous connections (public landing pages still get IoT demo data)
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`[socket] connected: ${socket.id} (role=${socket.data.role ?? 'anon'})`);
    socket.on('disconnect', () => console.log(`[socket] disconnected: ${socket.id}`));
  });

  return io;
}

export function getIO(): IOServer {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

/** Broadcast a sync event to every connected client. */
export function broadcast(event: SyncEvent, payload: unknown): void {
  io?.emit(event, payload);
}
