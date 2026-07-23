import { create } from 'zustand';
import type { Alert, IotUpdate, MachineCommand, MachineReading, MachineStatus } from './types';

export interface SeriesPoint { t: number; temperature: number; throughput: number }
const MAX_POINTS = 30;

interface IotState {
  machines: MachineReading[];
  series: SeriesPoint[];
  alerts: Alert[];
  commands: MachineCommand[];
  applyUpdate: (u: IotUpdate) => void;
  setAlerts: (a: Alert[]) => void;
  upsertAlert: (a: Alert) => void;
  resolveAlert: (id: string) => void;
  setMachineStatus: (machineId: string, status: MachineStatus) => void;
  setCommands: (c: MachineCommand[]) => void;
  upsertCommand: (c: MachineCommand) => void;
}

export const useIotStore = create<IotState>((set) => ({
  machines: [],
  series: [],
  alerts: [],
  commands: [],
  applyUpdate: (u) =>
    set((state) => {
      const running = u.machines.filter((m) => m.status === 'running');
      const avgTemp = running.length ? running.reduce((s, m) => s + m.temperature, 0) / running.length : 0;
      const totalThr = u.machines.reduce((s, m) => s + m.throughput, 0);
      const point: SeriesPoint = { t: u.ts, temperature: Math.round(avgTemp * 10) / 10, throughput: Math.round(totalThr * 10) / 10 };
      // Normalize machineId -> id (telemetry carries machineId).
      const machines = u.machines.map((m) => ({ ...m, id: m.id ?? (m.machineId as string) }));
      return { machines, series: [...state.series, point].slice(-MAX_POINTS) };
    }),
  setAlerts: (alerts) => set({ alerts }),
  upsertAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts.filter((a) => a.id !== alert.id)].slice(0, 100) })),
  resolveAlert: (id) => set((state) => ({ alerts: state.alerts.map((a) => (a.id === id ? { ...a, status: 'resolved' } : a)) })),
  setMachineStatus: (machineId, status) =>
    set((state) => ({ machines: state.machines.map((m) => (m.id === machineId ? { ...m, status } : m)) })),
  setCommands: (commands) =>
    set((state) => {
      const map = new Map(state.commands.map((c) => [c.id, c]));
      commands.forEach((c) => map.set(c.id, c));
      return { commands: [...map.values()] };
    }),
  upsertCommand: (command) => set((state) => ({ commands: [command, ...state.commands.filter((c) => c.id !== command.id)].slice(0, 200) })),
}));
