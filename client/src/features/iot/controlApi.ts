import { api } from '@/lib/api';
import type { CommandName, Machine, MachineCommand } from './types';

/** Authoritative machine registry (used where the realtime store may be empty). */
export const fetchMachines = () => api.get<{ data: Machine[] }>('/iot/machines').then((r) => r.data.data);

/** REST layer for admin machine control. Each mutating call publishes an MQTT
 *  command server-side; the ack comes back over Socket.IO (machine:command-ack),
 *  so callers don't poll. */

export const fetchCommands = (machineId: string) =>
  api.get<{ data: MachineCommand[] }>(`/iot/machines/${machineId}/commands`).then((r) => r.data.data);

export const sendCommand = (machineId: string, command: CommandName, payload?: Record<string, unknown>) =>
  api.post<{ data: MachineCommand }>(`/iot/machines/${machineId}/commands`, { command, payload }).then((r) => r.data.data);

export const sendMachineAlert = (
  machineId: string,
  body: { severity: 'info' | 'warning' | 'critical'; message: string; autoDismissMs?: number },
) => api.post(`/iot/machines/${machineId}/alert`, body).then((r) => r.data.data);

export const broadcastAlert = (body: { severity: 'info' | 'warning' | 'critical'; message: string }) =>
  api.post(`/iot/alerts/broadcast`, body).then((r) => r.data.data);

// --- Live stream mode + manual reading entry ---
export const fetchStreamMode = () =>
  api.get<{ data: { mode: 'live' | 'manual' } }>('/iot/stream').then((r) => r.data.data.mode);
export const setStreamModeApi = (mode: 'live' | 'manual') =>
  api.post<{ data: { mode: 'live' | 'manual' } }>('/iot/stream', { mode }).then((r) => r.data.data.mode);
export const submitReading = (machineId: string, reading: Record<string, number | string>) =>
  api.post(`/iot/machines/${machineId}/reading`, reading).then((r) => r.data.data);
