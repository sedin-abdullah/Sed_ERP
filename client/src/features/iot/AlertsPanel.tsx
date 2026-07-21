import { useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { useIotStore } from './iotStore';
import type { AlertStatus } from './types';

const FILTERS: { key: 'all' | AlertStatus; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'ack', label: 'Acknowledged' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'all', label: 'All' },
];

export function AlertsPanel() {
  const alerts = useIotStore((s) => s.alerts);
  const [filter, setFilter] = useState<'all' | AlertStatus>('active');
  const [busy, setBusy] = useState<string | null>(null);

  const shown = filter === 'all' ? alerts : alerts.filter((a) => a.status === filter);

  async function setStatus(id: string, status: AlertStatus) {
    setBusy(id);
    try {
      // Socket broadcast from the server updates the store for all clients.
      await api.patch(`/iot/alerts/${id}`, { status });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            data-testid={`alerts-filter-${f.key}`}
            onClick={() => setFilter(f.key)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              filter === f.key ? 'bg-brand-500/15 text-brand-500' : 'text-muted-foreground hover:bg-surface-2',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        <CardBody>
          {shown.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No alerts in this view.</p>
          ) : (
            <ul className="divide-y divide-border">
              {shown.map((a) => (
                <li key={a.id} data-testid="alert-row" data-alert-id={a.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className={cn('size-2.5 shrink-0 rounded-full', a.severity === 'critical' ? 'bg-danger' : a.severity === 'warning' ? 'bg-warning' : 'bg-info')} />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{a.machineName} <span className="text-xs font-normal text-muted-foreground">· {a.metric}</span></div>
                    <div className="text-xs text-muted-foreground">{a.message} · {new Date(a.createdAt).toLocaleString()}</div>
                  </div>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                    a.status === 'active' ? 'bg-danger/15 text-danger' : a.status === 'ack' ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success')}>
                    {a.status}
                  </span>
                  {a.status !== 'resolved' && (
                    <div className="flex gap-2">
                      {a.status === 'active' && (
                        <Button size="sm" variant="outline" data-testid="alert-ack" isLoading={busy === a.id} onClick={() => setStatus(a.id, 'ack')}>
                          Acknowledge
                        </Button>
                      )}
                      <Button size="sm" data-testid="alert-resolve" isLoading={busy === a.id} onClick={() => setStatus(a.id, 'resolved')}>
                        Resolve
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
