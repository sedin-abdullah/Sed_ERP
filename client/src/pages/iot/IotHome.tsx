import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, BarChart3, Boxes, Cpu, FileText, Layers, UserCircle } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { getSocket } from '@/socket/socket';
import { cn } from '@/lib/cn';

const SECTIONS = [
  { key: 'dashboard', label: 'Dashboard', icon: Activity },
  { key: 'industries', label: 'Industries', icon: Layers },
  { key: 'process', label: 'Process Technologies', icon: Cpu },
  { key: 'services', label: 'Services', icon: Boxes },
  { key: 'machines', label: 'Machines', icon: Boxes },
  { key: 'alerts', label: 'Alerts', icon: AlertTriangle },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
  { key: 'portal', label: 'Portal', icon: UserCircle },
];

export function IotHome() {
  const [active, setActive] = useState('dashboard');
  const [connected, setConnected] = useState(false);

  // Verify the real-time channel is live (Phase 2 fills the dashboard with data).
  useEffect(() => {
    const s = getSocket();
    setConnected(s.connected);
    const on = () => setConnected(true);
    const off = () => setConnected(false);
    s.on('connect', on);
    s.on('disconnect', off);
    return () => { s.off('connect', on); s.off('disconnect', off); };
  }, []);

  return (
    <div className="container grid gap-6 py-8 lg:grid-cols-[240px_1fr]">
      <aside className="flex gap-1 overflow-x-auto lg:flex-col">
        {SECTIONS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              active === key ? 'bg-brand-500/15 text-brand-500' : 'text-muted-foreground hover:bg-surface-2',
            )}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </aside>

      <section className="min-w-0">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl capitalize">{SECTIONS.find((s) => s.key === active)?.label}</h1>
          <span className={cn('flex items-center gap-1.5 text-xs font-medium', connected ? 'text-success' : 'text-muted-foreground')}>
            <span className={cn('size-2 rounded-full', connected ? 'bg-success animate-pulse-soft' : 'bg-muted-foreground')} />
            {connected ? 'Live' : 'Connecting…'}
          </span>
        </div>
        <Card>
          <CardBody className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
            <FileText className="size-8 text-muted-foreground" />
            <p className="font-medium">SedIoT — {SECTIONS.find((s) => s.key === active)?.label}</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Foundation ready and the real-time channel is wired up. Live dashboards, machine
              registry, alerts and directories arrive in the next build phase.
            </p>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
