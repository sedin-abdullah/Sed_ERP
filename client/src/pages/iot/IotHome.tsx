import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, BarChart3, Boxes, Cpu, FileText, Layers, UserCircle } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { getSocket } from '@/socket/socket';
import { cn } from '@/lib/cn';
import { useIotStream } from '@/features/iot/useIotStream';
import { useIotStore } from '@/features/iot/iotStore';
import { Dashboard } from '@/features/iot/Dashboard';
import { MachinesPanel } from '@/features/iot/MachinesPanel';
import { AlertsPanel } from '@/features/iot/AlertsPanel';

const SECTIONS = [
  { key: 'dashboard', label: 'Dashboard', icon: Activity },
  { key: 'machines', label: 'Machines', icon: Boxes },
  { key: 'alerts', label: 'Alerts', icon: AlertTriangle },
  { key: 'industries', label: 'Industries', icon: Layers },
  { key: 'process', label: 'Process Technologies', icon: Cpu },
  { key: 'services', label: 'Services', icon: Boxes },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
  { key: 'portal', label: 'Portal', icon: UserCircle },
];

const READY = new Set(['dashboard', 'machines', 'alerts']);

export function IotHome() {
  const [active, setActive] = useState('dashboard');
  const [connected, setConnected] = useState(false);
  const activeAlerts = useIotStore((s) => s.alerts.filter((a) => a.status !== 'resolved').length);

  // Live IoT channel → store (mounted once for the whole SedIoT module).
  useIotStream();

  useEffect(() => {
    const s = getSocket();
    setConnected(s.connected);
    const on = () => setConnected(true);
    const off = () => setConnected(false);
    s.on('connect', on);
    s.on('disconnect', off);
    return () => { s.off('connect', on); s.off('disconnect', off); };
  }, []);

  const label = SECTIONS.find((s) => s.key === active)?.label;

  return (
    <div className="container grid gap-6 py-8 lg:grid-cols-[240px_1fr]">
      <aside className="flex gap-1 overflow-x-auto lg:flex-col">
        {SECTIONS.map(({ key, label: lbl, icon: Icon }) => (
          <button
            key={key}
            data-testid={`iot-nav-${key}`}
            onClick={() => setActive(key)}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              active === key ? 'bg-brand-500/15 text-brand-500' : 'text-muted-foreground hover:bg-surface-2',
            )}
          >
            <Icon className="size-4" /> {lbl}
            {key === 'alerts' && activeAlerts > 0 && (
              <span className="ml-auto rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">{activeAlerts}</span>
            )}
          </button>
        ))}
      </aside>

      <section className="min-w-0" data-testid={`iot-section-${active}`}>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl">{label}</h1>
          <span className={cn('flex items-center gap-1.5 text-xs font-medium', connected ? 'text-success' : 'text-muted-foreground')} data-testid="iot-connection">
            <span className={cn('size-2 rounded-full', connected ? 'bg-success animate-pulse-soft' : 'bg-muted-foreground')} />
            {connected ? 'Live' : 'Connecting…'}
          </span>
        </div>

        {active === 'dashboard' && <Dashboard />}
        {active === 'machines' && <MachinesPanel />}
        {active === 'alerts' && <AlertsPanel />}
        {!READY.has(active) && (
          <Card>
            <CardBody className="flex min-h-[36vh] flex-col items-center justify-center gap-2 text-center">
              <FileText className="size-8 text-muted-foreground" />
              <p className="font-medium">SedIoT — {label}</p>
              <p className="max-w-md text-sm text-muted-foreground">
                This directory arrives in Phase 3 (Industries, Process Technologies, Services, Reports, Portal).
              </p>
            </CardBody>
          </Card>
        )}
      </section>
    </div>
  );
}
