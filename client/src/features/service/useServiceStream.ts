import { useEffect } from 'react';
import { subscribe } from '@/socket/socket';
import { useAuthStore } from '@/store/authStore';
import { useServiceStore } from './serviceStore';
import { fetchJobs, fetchRequests, fetchTechnicians, fetchUsers } from './serviceApi';
import type { AdminUser } from './types';

/**
 * Loads the SedService dataset once and keeps it live. `loadUsers` gates the
 * users fetch behind canManageUsers (a non-admin would get 403). Subscriptions
 * mirror the server's broadcast channels so any action anywhere updates here
 * instantly. A permission:changed for the current user also refreshes their
 * own granted abilities in the auth store.
 */
export function useServiceStream(opts: { loadUsers?: boolean } = {}): void {
  const { setAll, upsertRequest, upsertTechnician, upsertJob, upsertUser } = useServiceStore.getState();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [requests, technicians, jobs] = await Promise.all([fetchRequests(), fetchTechnicians(), fetchJobs()]);
      const users = opts.loadUsers ? await fetchUsers().catch(() => []) : [];
      if (!cancelled) setAll({ requests, technicians, jobs, users });
    })().catch(() => undefined);

    const offs = [
      subscribe('service-request:changed', upsertRequest),
      subscribe('technician:changed', upsertTechnician),
      subscribe('job:changed', upsertJob),
      subscribe<AdminUser>('user:changed', upsertUser),
      subscribe<AdminUser>('permission:changed', (u) => {
        upsertUser(u);
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
  }, [opts.loadUsers]);
}
