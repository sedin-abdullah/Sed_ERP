import { useEffect } from 'react';
import { api } from '@/lib/api';
import { subscribe } from '@/socket/socket';
import { useIotStore } from './iotStore';
import type { Alert, IotUpdate } from './types';

/**
 * Wires the live IoT channel into the store: seeds current alerts via REST,
 * then keeps machines/series/alerts in sync from Socket.IO. Mount once at the
 * SedIoT layout level.
 */
export function useIotStream(): void {
  const applyUpdate = useIotStore((s) => s.applyUpdate);
  const upsertAlert = useIotStore((s) => s.upsertAlert);
  const resolveAlert = useIotStore((s) => s.resolveAlert);
  const setAlerts = useIotStore((s) => s.setAlerts);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ data: Alert[] }>('/iot/alerts')
      .then((res) => { if (!cancelled) setAlerts(res.data.data); })
      .catch(() => undefined);

    const offUpdate = subscribe<IotUpdate>('iot:update', applyUpdate);
    const offNew = subscribe<Alert>('alert:new', upsertAlert);
    const offCleared = subscribe<{ id: string }>('alert:cleared', (p) => resolveAlert(p.id));

    return () => {
      cancelled = true;
      offUpdate();
      offNew();
      offCleared();
    };
  }, [applyUpdate, upsertAlert, resolveAlert, setAlerts]);
}
