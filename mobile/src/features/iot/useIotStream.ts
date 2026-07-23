import { useEffect } from 'react';
import { api } from '@/lib/api';
import { subscribe } from '@/socket/socket';
import { useIotStore } from './iotStore';
import type { Alert, IotUpdate, MachineCommand, MachineStatus } from './types';

/** Seeds alerts via REST, then keeps machines/series/alerts/commands live from
 *  Socket.IO — the same event contract as the web client. Mount once in the
 *  SedIoT tab. */
export function useIotStream(): void {
  const store = useIotStore.getState();

  useEffect(() => {
    let cancelled = false;
    api.get<{ data: Alert[] }>('/iot/alerts').then((r) => { if (!cancelled) store.setAlerts(r.data.data); }).catch(() => undefined);

    const offs = [
      subscribe<IotUpdate>('iot:update', store.applyUpdate),
      subscribe<Alert>('alert:new', store.upsertAlert),
      subscribe<{ id: string }>('alert:cleared', (p) => store.resolveAlert(p.id)),
      subscribe<{ machineId: string; status: MachineStatus }>('machine:status', (p) => store.setMachineStatus(p.machineId, p.status)),
      subscribe<MachineCommand>('machine:command-ack', store.upsertCommand),
    ];
    return () => { cancelled = true; offs.forEach((off) => off()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
