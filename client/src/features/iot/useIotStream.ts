import { useEffect } from 'react';
import { api } from '@/lib/api';
import { subscribe } from '@/socket/socket';
import { useIotStore } from './iotStore';
import type { Alert, IotUpdate, MachineCommand, MachineStatus } from './types';

/**
 * Wires the live IoT channel into the store: seeds current alerts via REST,
 * then keeps machines/series/alerts/commands in sync from Socket.IO. Mount once
 * at the SedIoT layout level.
 */
export function useIotStream(): void {
  const applyUpdate = useIotStore((s) => s.applyUpdate);
  const upsertAlert = useIotStore((s) => s.upsertAlert);
  const resolveAlert = useIotStore((s) => s.resolveAlert);
  const setAlerts = useIotStore((s) => s.setAlerts);
  const setMachineStatus = useIotStore((s) => s.setMachineStatus);
  const upsertCommand = useIotStore((s) => s.upsertCommand);
  const setStreamMode = useIotStore((s) => s.setStreamMode);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ data: Alert[] }>('/iot/alerts')
      .then((res) => { if (!cancelled) setAlerts(res.data.data); })
      .catch(() => undefined);
    api
      .get<{ data: { mode: 'live' | 'manual' } }>('/iot/stream')
      .then((res) => { if (!cancelled) setStreamMode(res.data.data.mode); })
      .catch(() => undefined);

    const offUpdate = subscribe<IotUpdate>('iot:update', applyUpdate);
    const offNew = subscribe<Alert>('alert:new', upsertAlert);
    const offCleared = subscribe<{ id: string }>('alert:cleared', (p) => resolveAlert(p.id));
    const offStatus = subscribe<{ machineId: string; status: MachineStatus }>('machine:status', (p) =>
      setMachineStatus(p.machineId, p.status),
    );
    const offAck = subscribe<MachineCommand>('machine:command-ack', upsertCommand);
    const offMode = subscribe<{ mode: 'live' | 'manual' }>('stream:mode', (p) => setStreamMode(p.mode));

    return () => {
      cancelled = true;
      offUpdate();
      offNew();
      offCleared();
      offStatus();
      offAck();
      offMode();
    };
  }, [applyUpdate, upsertAlert, resolveAlert, setAlerts, setMachineStatus, upsertCommand, setStreamMode]);
}
