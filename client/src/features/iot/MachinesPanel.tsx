import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardBody } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import { useIotStore } from './iotStore';
import type { Machine, MachineStatus } from './types';

const STATUS_STYLE: Record<MachineStatus, string> = {
  running: 'bg-success/15 text-success',
  idle: 'bg-muted text-muted-foreground',
  fault: 'bg-danger/15 text-danger',
};

export function MachinesPanel() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const readings = useIotStore((s) => s.machines);
  const liveById = new Map(readings.map((r) => [r.id, r]));

  useEffect(() => {
    api
      .get<{ data: Machine[] }>('/iot/machines')
      .then((res) => setMachines(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardBody className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 pr-4">Machine</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Location</th>
              <th className="py-2 pr-4">Gateway</th>
              <th className="py-2 pr-4">Live status</th>
              <th className="py-2">Health</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Loading…</td></tr>
            ) : (
              machines.map((m) => {
                const live = liveById.get(m.id);
                return (
                  <tr key={m.id} className="border-b border-border last:border-0">
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
                    <td className="py-3">{m.healthScore}%</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </CardBody>
    </Card>
  );
}
