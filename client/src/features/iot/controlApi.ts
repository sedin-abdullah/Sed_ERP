import { api } from '@/lib/api';
import type { CommandName, MachineCommand } from './types';

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
