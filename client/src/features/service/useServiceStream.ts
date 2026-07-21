import { useEffect } from 'react';
import { subscribe } from '@/socket/socket';
import { useAuthStore } from '@/store/authStore';
import { useServiceStore } from './serviceStore';
import { fetchJobs, fetchRequests, fetchTechnicians, fetchUsers } from './serviceApi';
import type { AdminUser, Quote } from './types';

interface StreamOpts {
  loadUsers?: boolean;
  loadJobs?: boolean;
  loadTechnicians?: boolean;
}

/**
 * Loads the SedService dataset once and keeps it live. The load flags scope the
 * initial fetches to what a view needs (the user side skips jobs/users/techs).
 * Subscriptions mirror the server's broadcast channels so any action anywhere
 * updates here instantly. A permission:changed for the current user also
 * refreshes their own granted abilities in the auth store.
 */
export function useServiceStream(opts: StreamOpts = {}): void {
  const { loadUsers = false, loadJobs = true, loadTechnicians = true } = opts;
  const store = useServiceStore.getState();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [requests, technicians, jobs] = await Promise.all([
        fetchRequests(),
        loadTechnicians ? fetchTechnicians() : Promise.resolve([]),
        loadJobs ? fetchJobs() : Promise.resolve([]),
      ]);
      const users = loadUsers ? await fetchUsers().catch(() => []) : [];
      if (!cancelled) store.setAll({ requests, technicians, jobs, users });
    })().catch(() => undefined);

    const offs = [
      subscribe('service-request:changed', store.upsertRequest),
      subscribe('technician:changed', store.upsertTechnician),
      subscribe('job:changed', store.upsertJob),
      subscribe<Quote>('quote:changed', store.upsertQuote),
      subscribe<AdminUser>('user:changed', store.upsertUser),
      subscribe<AdminUser>('permission:changed', (u) => {
        store.upsertUser(u);
        const auth = useAuthStore.getState();
        if (auth.user && auth.user.id === u.id) {
          auth.setUser({ ...auth.user, permissions: u.permissions, active: u.active });
        }
      }),
    ];
    return () => {
      cancelled = true;
      offs.forEach((off) => off());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadUsers, loadJobs, loadTechnicians]);
}
