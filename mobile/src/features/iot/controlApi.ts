import { api } from '@/lib/api';
import type { CommandName, MachineCommand } from './types';

export const fetchMachines = () => api.get('/iot/machines').then((r) => r.data.data);
export const fetchCommands = (machineId: string) =>
  api.get<{ data: MachineCommand[] }>(`/iot/machines/${machineId}/commands`).then((r) => r.data.data);
export const sendCommand = (machineId: string, command: CommandName, payload?: Record<string, unknown>) =>
  api.post<{ data: MachineCommand }>(`/iot/machines/${machineId}/commands`, { command, payload }).then((r) => r.data.data);
export const sendMachineAlert = (machineId: string, body: { severity: string; message: string; autoDismissMs?: number }) =>
  api.post(`/iot/machines/${machineId}/alert`, body).then((r) => r.data.data);
export const broadcastAlert = (body: { severity: string; message: string }) =>
  api.post('/iot/alerts/broadcast', body).then((r) => r.data.data);
export const setAlertStatus = (id: string, status: 'ack' | 'resolved') =>
  api.patch(`/iot/alerts/${id}`, { status }).then((r) => r.data.data);
