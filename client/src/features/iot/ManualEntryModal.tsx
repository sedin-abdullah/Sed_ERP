import { useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/form';
import { getApiError } from '@/lib/api';
import { useIotStore } from './iotStore';
import { submitReading } from './controlApi';
import type { MachineReading } from './types';

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
 *  and reports. Pre-fills from the machine's current reading. */
export function ManualEntryModal({ onClose, initialMachineId }: { onClose: () => void; initialMachineId?: string }) {
  const machines = useIotStore((s) => s.machines);
  const [machineId, setMachineId] = useState(initialMachineId ?? machines[0]?.id ?? '');
  const current = useMemo(() => machines.find((m) => m.id === machineId), [machines, machineId]);

  const [values, setValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  // Effective value for a field: typed override, else the machine's live value.
  const valueFor = (key: string) => (values[key] !== undefined ? values[key] : current ? String(current[key as keyof MachineReading]) : '');

  async function submit() {
    if (!machineId) { setError('Select a machine'); return; }
    setLoading(true); setError(null); setOk(false);
    try {
      const reading: Record<string, number | string> = {};
      NUM_FIELDS.forEach(({ key }) => {
        const v = valueFor(key);
        if (v !== '' && Number.isFinite(Number(v))) reading[key] = Number(v);
      });
      const st = status || current?.status;
      if (st) reading.status = st;
      await submitReading(machineId, reading);
      setOk(true);
      setValues({});
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
          <Select value={machineId} onChange={(e) => { setMachineId(e.target.value); setValues({}); setStatus(''); setOk(false); }} data-testid="manual-machine">
            {machines.length === 0 && <option value="">No machines</option>}
            {machines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          {NUM_FIELDS.map(({ key, label }) => (
            <Field key={key} label={label}>
              <Input
                type="number"
                value={valueFor(key)}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                data-testid={`manual-${key}`}
              />
            </Field>
          ))}
          <Field label="Status">
            <Select value={status || current?.status || 'running'} onChange={(e) => setStatus(e.target.value)} data-testid="manual-status">
              {['running', 'idle', 'fault', 'off'].map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
        </div>

        <p className="text-xs text-muted-foreground">
          Publishes as a live reading — updates the machine, runs alert rules, and feeds Reports. Set temperature above the threshold to raise an alert.
        </p>
        {error && <p className="text-sm text-danger" data-testid="manual-error">{error}</p>}
        {ok && <p className="text-sm text-success" data-testid="manual-ok">Reading applied ✓</p>}
        <Button className="w-full" isLoading={loading} onClick={submit} data-testid="manual-submit" disabled={!machineId}>
          Apply reading
        </Button>
      </div>
    </Modal>
  );
}
