import { useEffect, useState } from 'react';
import { Power, PowerOff, RotateCcw, BellRing, SlidersHorizontal, BellOff } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { cn } from '@/lib/cn';
import { getApiError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useIotStore } from './iotStore';
import { fetchCommands, sendCommand, sendMachineAlert } from './controlApi';
import type { AckStatus, CommandName, Machine, MachineStatus } from './types';

const ACK_STYLE: Record<AckStatus, string> = {
  pending: 'bg-warning/15 text-warning',
  ok: 'bg-success/15 text-success',
  error: 'bg-danger/15 text-danger',
  timeout: 'bg-danger/15 text-danger',
};

const STATUS_STYLE: Record<MachineStatus, string> = {
  running: 'bg-success/15 text-success',
  idle: 'bg-muted text-muted-foreground',
  fault: 'bg-danger/15 text-danger',
  off: 'bg-muted text-muted-foreground',
};

export function MachineControlDrawer({ machine, onClose }: { machine: Machine; onClose: () => void }) {
  const can = useAuthStore((s) => s.can);
  const commands = useIotStore((s) => s.commands.filter((c) => c.machineId === machine.id));
  const setCommands = useIotStore((s) => s.setCommands);
  const upsertCommand = useIotStore((s) => s.upsertCommand);
  const liveStatus = useIotStore((s) => s.machines.find((m) => m.id === machine.id)?.status);

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [paramOpen, setParamOpen] = useState(false);

  const canPower = can('canControlMachines') || can('canPowerCycleMachines');
  const canControl = can('canControlMachines');
  const canAlert = can('canControlMachines') || can('canSendMachineAlerts');

  useEffect(() => {
    fetchCommands(machine.id).then(setCommands).catch(() => undefined);
  }, [machine.id, setCommands]);

  async function run(key: string, command: CommandName, payload?: Record<string, unknown>) {
    setBusy(key);
    setError(null);
    try {
      upsertCommand(await sendCommand(machine.id, command, payload));
    } catch (e) {
      setError(getApiError(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Drawer open onClose={onClose} title={machine.name} subtitle={`${machine.type} · ${machine.location}`} testId="machine-drawer">
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Live status</span>
          <span
            data-testid="machine-drawer-status"
            className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize', STATUS_STYLE[liveStatus ?? 'off'])}
          >
            {liveStatus ?? 'unknown'}
          </span>
        </div>

        {/* Control Panel */}
        <div data-testid="machine-control-panel" className="rounded-2xl border border-border p-4">
          <h3 className="mb-3 text-sm font-semibold">Control Panel</h3>
          {!canPower && !canControl && !canAlert ? (
            <p className="text-xs text-muted-foreground">You don't have machine-control permissions.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {canPower && (
                <Button size="sm" variant="outline" isLoading={busy === 'power_on'} data-testid="ctrl-power-on" onClick={() => run('power_on', 'power_on')}>
                  <Power className="size-4 text-success" /> Power ON
                </Button>
              )}
              {canPower && (
                <Button size="sm" variant="outline" isLoading={busy === 'power_off'} data-testid="ctrl-power-off" onClick={() => run('power_off', 'power_off')}>
                  <PowerOff className="size-4 text-danger" /> Power OFF
                </Button>
              )}
              {canPower && (
                <Button size="sm" variant="outline" isLoading={busy === 'restart'} data-testid="ctrl-restart" onClick={() => run('restart', 'restart')}>
                  <RotateCcw className="size-4" /> Restart
                </Button>
              )}
              {canControl && (
                <Button size="sm" variant="outline" isLoading={busy === 'clear_alerts'} data-testid="ctrl-clear-alerts" onClick={() => run('clear_alerts', 'clear_alerts')}>
                  <BellOff className="size-4" /> Clear Alerts
                </Button>
              )}
              {canAlert && (
                <Button size="sm" variant="outline" data-testid="ctrl-send-alert" onClick={() => setAlertOpen(true)}>
                  <BellRing className="size-4 text-warning" /> Send Alert
                </Button>
              )}
              {canControl && (
                <Button size="sm" variant="outline" data-testid="ctrl-set-param" onClick={() => setParamOpen(true)}>
                  <SlidersHorizontal className="size-4" /> Set Parameter
                </Button>
              )}
            </div>
          )}
          {error && <p className="mt-2 text-sm text-danger" data-testid="machine-control-error">{error}</p>}
        </div>

        {/* Command History */}
        <div>
          <h3 className="mb-2 text-sm font-semibold">Command History</h3>
          <div className="overflow-x-auto rounded-xl border border-border" data-testid="command-history">
            <table className="w-full min-w-[420px] text-xs">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr>
                  <th className="p-2">Command</th>
                  <th className="p-2">By</th>
                  <th className="p-2">Ack</th>
                  <th className="p-2">Message</th>
                </tr>
              </thead>
              <tbody>
                {commands
                  .slice()
                  .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
                  .map((c) => (
                    <tr key={c.id} data-testid={`command-row-${c.commandId}`} data-ack={c.ackStatus} className="border-b border-border/60 last:border-0">
                      <td className="p-2 font-medium capitalize">{c.command.replace(/_/g, ' ')}</td>
                      <td className="p-2 text-muted-foreground">{c.issuedByName}</td>
                      <td className="p-2">
                        <span className={cn('rounded-full px-1.5 py-0.5 font-medium', ACK_STYLE[c.ackStatus])}>{c.ackStatus}</span>
                      </td>
                      <td className="p-2 text-muted-foreground">{c.ackMessage ?? '—'}</td>
                    </tr>
                  ))}
                {commands.length === 0 && (
                  <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No commands yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {alertOpen && <SendAlertModal machineId={machine.id} onClose={() => setAlertOpen(false)} />}
      {paramOpen && <SetParamModal onClose={() => setParamOpen(false)} onSubmit={(key, value) => { void run('set_param', 'set_param', { key, value }); setParamOpen(false); }} />}
    </Drawer>
  );
}

function SendAlertModal({ machineId, onClose }: { machineId: string; onClose: () => void }) {
  const [severity, setSeverity] = useState<'info' | 'warning' | 'critical'>('warning');
  const [message, setMessage] = useState('');
  const [autoDismiss, setAutoDismiss] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!message.trim()) { setError('Message is required'); return; }
    setLoading(true);
    setError(null);
    try {
      await sendMachineAlert(machineId, {
        severity, message: message.trim(),
        autoDismissMs: autoDismiss ? Number(autoDismiss) * 1000 : undefined,
      });
      onClose();
    } catch (e) {
      setError(getApiError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Send alert to machine" testId="send-alert-modal">
      <div className="space-y-3">
        <Field label="Severity">
          <Select value={severity} onChange={(e) => setSeverity(e.target.value as typeof severity)} data-testid="send-alert-severity">
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </Select>
        </Field>
        <Field label="Message"><Textarea value={message} onChange={(e) => setMessage(e.target.value)} data-testid="send-alert-message" /></Field>
        <Field label="Auto-dismiss after (seconds, optional)"><Input type="number" min="0" value={autoDismiss} onChange={(e) => setAutoDismiss(e.target.value)} data-testid="send-alert-dismiss" /></Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button className="w-full" isLoading={loading} onClick={submit} data-testid="send-alert-submit">Send alert</Button>
      </div>
    </Modal>
  );
}

function SetParamModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (key: string, value: number) => void }) {
  const [key, setKey] = useState('maxTemperature');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <Modal open onClose={onClose} title="Set operating parameter" testId="set-param-modal">
      <div className="space-y-3">
        <Field label="Parameter">
          <Select value={key} onChange={(e) => setKey(e.target.value)} data-testid="set-param-key">
            <option value="maxTemperature">Max temperature (°C)</option>
            <option value="maxVibration">Max vibration (mm/s)</option>
          </Select>
        </Field>
        <Field label="Value"><Input type="number" value={value} onChange={(e) => setValue(e.target.value)} data-testid="set-param-value" placeholder="85" /></Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button
          className="w-full"
          data-testid="set-param-submit"
          onClick={() => {
            const v = Number(value);
            if (!Number.isFinite(v)) { setError('Enter a number'); return; }
            onSubmit(key, v);
          }}
        >
          Apply
        </Button>
      </div>
    </Modal>
  );
}
