import { useEffect, useState } from 'react';
import { Radio, Settings2 } from 'lucide-react';
import { api, getApiError } from '@/lib/api';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Field, Select, Textarea } from '@/components/ui/form';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/authStore';
import { useIotStore } from './iotStore';
import { MachineControlDrawer } from './MachineControlDrawer';
import { broadcastAlert } from './controlApi';
import type { Machine, MachineStatus } from './types';

const STATUS_STYLE: Record<MachineStatus, string> = {
  running: 'bg-success/15 text-success',
  idle: 'bg-muted text-muted-foreground',
  fault: 'bg-danger/15 text-danger',
  off: 'bg-muted text-muted-foreground',
};

export function MachinesPanel() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Machine | null>(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const readings = useIotStore((s) => s.machines);
  const liveById = new Map(readings.map((r) => [r.id, r]));
  const can = useAuthStore((s) => s.can);
  const canControl = can('canControlMachines') || can('canPowerCycleMachines') || can('canSendMachineAlerts');
  const canBroadcast = can('canControlMachines') || can('canBroadcastAlerts');

  useEffect(() => {
    api
      .get<{ data: Machine[] }>('/iot/machines')
      .then((res) => setMachines(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {canBroadcast && (
        <div className="mb-3 flex justify-end">
          <Button size="sm" variant="outline" data-testid="broadcast-alert-open" onClick={() => setBroadcastOpen(true)}>
            <Radio className="size-4 text-warning" /> Broadcast Alert to ALL
          </Button>
        </div>
      )}
      <Card>
        <CardBody className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4">Machine</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Location</th>
                <th className="py-2 pr-4">Gateway</th>
                <th className="py-2 pr-4">Live status</th>
                <th className="py-2 pr-4">Health</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Loading…</td></tr>
              ) : (
                machines.map((m) => {
                  const live = liveById.get(m.id);
                  return (
                    <tr key={m.id} data-testid={`machine-row-${m.id}`} className="border-b border-border last:border-0">
                      <td className="py-3 pr-4 font-medium">{m.name}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{m.type}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{m.location}</td>
                      <td className="py-3 pr-4">
                        <span className={cn('inline-flex items-center gap-1.5 text-xs', m.online ? 'text-success' : 'text-muted-foreground')}>
                          <span className={cn('size-2 rounded-full', m.online ? 'bg-success' : 'bg-muted-foreground')} />
                          {m.gatewayId} · {m.online ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {live ? (
                          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize', STATUS_STYLE[live.status])}>{live.status}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">{m.healthScore}%</td>
                      <td className="py-3 text-right">
                        <Button size="sm" variant={canControl ? 'outline' : 'ghost'} data-testid={`machine-control-open-${m.id}`} onClick={() => setSelected(m)}>
                          <Settings2 className="size-4" /> {canControl ? 'Control' : 'Details'}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {selected && <MachineControlDrawer machine={selected} onClose={() => setSelected(null)} />}
      {broadcastOpen && <BroadcastModal onClose={() => setBroadcastOpen(false)} />}
    </>
  );
}

function BroadcastModal({ onClose }: { onClose: () => void }) {
  const [severity, setSeverity] = useState<'info' | 'warning' | 'critical'>('warning');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!message.trim()) { setError('Message is required'); return; }
    setLoading(true);
    setError(null);
    try {
      await broadcastAlert({ severity, message: message.trim() });
      onClose();
    } catch (e) {
      setError(getApiError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Broadcast alert to ALL machines" testId="broadcast-modal">
      <div className="space-y-3">
        <Field label="Severity">
          <Select value={severity} onChange={(e) => setSeverity(e.target.value as typeof severity)} data-testid="broadcast-severity">
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </Select>
        </Field>
        <Field label="Message"><Textarea value={message} onChange={(e) => setMessage(e.target.value)} data-testid="broadcast-message" /></Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button className="w-full" isLoading={loading} onClick={submit} data-testid="broadcast-submit">Broadcast</Button>
      </div>
    </Modal>
  );
}
