import { create } from 'zustand';
import type { Alert, IotUpdate, MachineReading } from './types';

export interface SeriesPoint {
  t: string; // HH:MM:SS
  temperature: number; // avg across running machines
  vibration: number;
  throughput: number; // total
}

const MAX_POINTS = 30;

interface IotState {
  machines: MachineReading[];
  series: SeriesPoint[];
  alerts: Alert[];
  applyUpdate: (update: IotUpdate) => void;
  upsertAlert: (alert: Alert) => void;
  resolveAlert: (id: string) => void;
  setAlerts: (alerts: Alert[]) => void;
}

export const useIotStore = create<IotState>((set) => ({
  machines: [],
  series: [],
  alerts: [],
  applyUpdate: (update) =>
    set((state) => {
      const running = update.machines.filter((m) => m.status === 'running');
      const avg = (fn: (m: MachineReading) => number) =>
        running.length ? Math.round((running.reduce((s, m) => s + fn(m), 0) / running.length) * 10) / 10 : 0;
      const point: SeriesPoint = {
        t: new Date(update.ts).toLocaleTimeString(undefined, { hour12: false }),
        temperature: avg((m) => m.temperature),
        vibration: avg((m) => m.vibration),
        throughput: Math.round(update.machines.reduce((s, m) => s + m.throughput, 0) * 10) / 10,
      };
      return { machines: update.machines, series: [...state.series, point].slice(-MAX_POINTS) };
    }),
  upsertAlert: (alert) =>
    set((state) => {
      const rest = state.alerts.filter((a) => a.id !== alert.id);
      return { alerts: [alert, ...rest].slice(0, 100) };
    }),
  resolveAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, status: 'resolved' } : a)),
    })),
  setAlerts: (alerts) => set({ alerts }),
}));
