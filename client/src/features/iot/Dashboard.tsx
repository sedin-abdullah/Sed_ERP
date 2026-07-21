import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, AlertTriangle, Cpu, Gauge, Leaf, Zap } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import { useIotStore } from './iotStore';
import type { MachineReading, MachineStatus } from './types';

const BRAND = 'hsl(243 75% 62%)';
const ACCENT = 'hsl(187 85% 53%)';
const GOLD = 'hsl(38 90% 52%)';

const STATUS_STYLE: Record<MachineStatus, string> = {
  running: 'bg-success/15 text-success',
  idle: 'bg-muted text-muted-foreground',
  fault: 'bg-danger/15 text-danger',
};

function Kpi({ icon: Icon, label, value, unit }: { icon: typeof Zap; label: string; value: string; unit?: string }) {
  return (
    <Card>
      <CardBody className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-500">
          <Icon className="size-5" />
        </span>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold">
            {value}
            {unit && <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function Benefit({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/50 p-4">
      <div className="text-sm font-semibold">{title}</div>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </div>
  );
}

export function Dashboard() {
  const machines = useIotStore((s) => s.machines);
  const series = useIotStore((s) => s.series);
  const alerts = useIotStore((s) => s.alerts);
  const activeAlerts = alerts.filter((a) => a.status !== 'resolved');

  const avg = (fn: (m: MachineReading) => number) =>
    machines.length ? machines.reduce((s, m) => s + fn(m), 0) / machines.length : 0;
  const totalThroughput = machines.reduce((s, m) => s + m.throughput, 0);
  const totalEnergy = machines.reduce((s, m) => s + m.energyUsage, 0);
  const co2 = totalEnergy * 0.4;

  if (!machines.length) {
    return (
      <Card>
        <CardBody className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          Connecting to the live plant stream…
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi icon={Gauge} label="Uptime" value={avg((m) => m.uptime).toFixed(1)} unit="%" />
        <Kpi icon={Activity} label="Throughput" value={totalThroughput.toFixed(0)} unit="t/h" />
        <Kpi icon={Zap} label="Energy" value={totalEnergy.toFixed(0)} unit="kWh" />
        <Kpi icon={Cpu} label="OEE" value={avg((m) => m.oeeScore).toFixed(1)} unit="%" />
        <Kpi icon={AlertTriangle} label="Active Alerts" value={String(activeAlerts.length)} />
        <Kpi icon={Leaf} label="CO₂ est." value={co2.toFixed(0)} unit="kg/h" />
      </div>

      {/* Live chart + alerts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Live telemetry</h3>
              <span className="text-xs text-muted-foreground">avg temp / vibration · total throughput</span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 22% 26%)" />
                  <XAxis dataKey="t" tick={{ fontSize: 10, fill: 'hsl(215 20% 65%)' }} minTickGap={40} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(215 20% 65%)' }} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(222 39% 11%)', border: '1px solid hsl(215 22% 26%)', borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: 'hsl(215 20% 65%)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="temperature" name="Temp °C" stroke={GOLD} dot={false} strokeWidth={2} isAnimationActive={false} />
                  <Line type="monotone" dataKey="vibration" name="Vibration" stroke={ACCENT} dot={false} strokeWidth={2} isAnimationActive={false} />
                  <Line type="monotone" dataKey="throughput" name="Throughput" stroke={BRAND} dot={false} strokeWidth={2} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="mb-3 text-sm font-semibold">Active alerts ({activeAlerts.length})</h3>
            {activeAlerts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">All systems nominal ✅</p>
            ) : (
              <ul className="space-y-2">
                {activeAlerts.slice(0, 6).map((a) => (
                  <li key={a.id} className="flex items-start gap-2 rounded-lg border border-border p-2 text-sm">
                    <span className={cn('mt-0.5 size-2 shrink-0 rounded-full', a.severity === 'critical' ? 'bg-danger' : 'bg-warning')} />
                    <div>
                      <div className="font-medium">{a.machineName}</div>
                      <div className="text-xs text-muted-foreground">{a.message}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Machine status grid */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Machines</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {machines.map((m) => (
            <Card key={m.id}>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.type} · {m.location}</div>
                  </div>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize', STATUS_STYLE[m.status])}>{m.status}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div><div className="font-semibold">{m.temperature}°</div><div className="text-muted-foreground">Temp</div></div>
                  <div><div className="font-semibold">{m.vibration}</div><div className="text-muted-foreground">Vib mm/s</div></div>
                  <div><div className="font-semibold">{m.throughput}</div><div className="text-muted-foreground">t/h</div></div>
                  <div><div className="font-semibold">{m.energyUsage}</div><div className="text-muted-foreground">kWh</div></div>
                  <div><div className="font-semibold">{m.oeeScore}%</div><div className="text-muted-foreground">OEE</div></div>
                  <div><div className="font-semibold">{m.uptime}%</div><div className="text-muted-foreground">Uptime</div></div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* Efficiency benefits */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Efficiency benefits</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Benefit title="Uptime" body={`Avg uptime ${avg((m) => m.uptime).toFixed(1)}%. Preventive maintenance on fault-prone lines reduces unplanned downtime.`} />
          <Benefit title="Capacity" body={`Plant output ${totalThroughput.toFixed(0)} t/h. Balance throughput across lines to lift total capacity.`} />
          <Benefit title="Sustainability" body={`${totalEnergy.toFixed(0)} kWh → ~${co2.toFixed(0)} kg CO₂/h. Optimize energy per unit produced.`} />
          <Benefit title="Lifetime Extension" body="Condition-based maintenance from vibration/temperature trends forecasts wear before failure." />
        </div>
      </div>
    </div>
  );
}
