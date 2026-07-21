import { create } from 'zustand';
import type { AdminUser, Job, ServiceRequest, Technician } from './types';

/** Shared SedService state. Populated by an initial REST fetch, then kept live
 *  by useServiceStream via Socket.IO upserts — so every admin console sees the
 *  same data update the instant anyone acts. */
interface ServiceState {
  requests: ServiceRequest[];
  technicians: Technician[];
  jobs: Job[];
  users: AdminUser[];
  loaded: boolean;
  setAll: (data: Partial<Pick<ServiceState, 'requests' | 'technicians' | 'jobs' | 'users'>>) => void;
  upsertRequest: (r: ServiceRequest) => void;
  upsertTechnician: (t: Technician) => void;
  upsertJob: (j: Job) => void;
  upsertUser: (u: AdminUser) => void;
}

const upsert = <T extends { id: string }>(list: T[], item: T): T[] => {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) return [item, ...list];
  const next = list.slice();
  next[i] = item;
  return next;
};

export const useServiceStore = create<ServiceState>((set) => ({
  requests: [],
  technicians: [],
  jobs: [],
  users: [],
  loaded: false,
  setAll: (data) => set((s) => ({ ...s, ...data, loaded: true })),
  upsertRequest: (r) => set((s) => ({ requests: upsert(s.requests, r) })),
  upsertTechnician: (t) => set((s) => ({ technicians: upsert(s.technicians, t) })),
  upsertJob: (j) => set((s) => ({ jobs: upsert(s.jobs, j) })),
  upsertUser: (u) => set((s) => ({ users: upsert(s.users, u) })),
}));
