import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/form';
import { getApiError } from '@/lib/api';
import { useIotStore } from './iotStore';
import { fetchMachines, submitReading } from './controlApi';
import type { Machine, MachineReading } from './types';

const NUM_FIELDS: { key: keyof MachineReading; label: string }[] = [
  { key: 'temperature', label: 'Temperature (°C)' },
  { key: 'vibration', label: 'Vibration (mm/s)' },
  { key: 'throughput', label: 'Throughput (t/h)' },
  { key: 'energyUsage', label: 'Energy (kWh)' },
  { key: 'pressure', label: 'Pressure (bar)' },
  { key: 'uptime', label: 'Uptime (%)' },
  { key: 'oeeScore', label: 'OEE (%)' },
];

/** Admin manual reading entry (used when the live stream is OFF). Publishes
 *  through the same MQTT telemetry path, so it replicates to machines, alerts
 *  and reports.
 *
 *  The machine list comes from the REST registry (authoritative, always
 *  available) — NOT the realtime store — so the picker + Apply button never
 *  depend on a socket update having arrived. Metric fields pre-fill from the
 *  live store reading when present. */
export function ManualEntryModal({ onClose, initialMachineId }: { onClose: () => void; initialMachineId?: string }) {
  const liveMachines = useIotStore((s) => s.machines);
  const [registry, setRegistry] = useState<Machine[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [machineId, setMachineId] = useState(initialMachineId ?? '');
  const [values, setValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  // Authoritative machine list from REST.
  useEffect(() => {
    let cancelled = false;
    fetchMachines()
      .then((list: Machine[]) => {
        if (cancelled) return;
        setRegistry(list);
        setMachineId((cur) => cur || list[0]?.id || '');
      })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setLoadingList(false); });
    return () => { cancelled = true; };
  }, []);

  const live = useMemo(() => liveMachines.find((m) => m.id === machineId), [liveMachines, machineId]);

  // Effective field value: the admin's typed override, else the live reading.
  const valueFor = (key: string) =>
    values[key] !== undefined ? values[key] : live ? String(live[key as keyof MachineReading]) : '';

  async function submit() {
    if (!machineId) { setError('Select a machine'); return; }
    setLoading(true); setError(null); setOk(false);
    try {
      const reading: Record<string, number | string> = {};
      NUM_FIELDS.forEach(({ key }) => {
        const v = valueFor(key);
        if (v !== '' && Number.isFinite(Number(v))) reading[key] = Number(v);
      });
      const st = status || live?.status;
      if (st) reading.status = st;
      await submitReading(machineId, reading);
      setOk(true);
      setValues({});
      setTimeout(onClose, 700); // close so the dashboard update is visible
    } catch (e) {
      setError(getApiError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Manual reading entry" testId="manual-entry-modal">
      <div className="space-y-3">
        <Field label="Machine">
          <Select
            value={machineId}
            onChange={(e) => { setMachineId(e.target.value); setValues({}); setStatus(''); setOk(false); }}
            data-testid="manual-machine"
          >
            {loadingList && <option value="">Loading…</option>}
            {!loadingList && registry.length === 0 && <option value="">No machines</option>}
            {registry.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          {NUM_FIELDS.map(({ key, label }) => (
            <Field key={key} label={label}>
              <Input
                type="number"
                inputMode="decimal"
                value={valueFor(key)}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                data-testid={`manual-${key}`}
              />
            </Field>
          ))}
          <Field label="Status">
            <Select value={status || live?.status || 'running'} onChange={(e) => setStatus(e.target.value)} data-testid="manual-status">
              {['running', 'idle', 'fault', 'off'].map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
        </div>

        <p className="text-xs text-muted-foreground">
          Publishes as a live reading — updates the machine, runs alert rules, and feeds Reports. Set temperature above the threshold to raise an alert.
        </p>
        {error && <p className="text-sm text-danger" data-testid="manual-error">{error}</p>}
        {ok && <p className="text-sm text-success" data-testid="manual-ok">Reading applied ✓</p>}
        <Button className="w-full" isLoading={loading} onClick={submit} data-testid="manual-submit" disabled={!machineId || loading}>
          Apply reading
        </Button>
      </div>
    </Modal>
  );
}
