import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Download } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useIotStore } from './iotStore';
import type { AlertSeverity } from './types';

const BRAND = 'hsl(243 75% 62%)';
const ACCENT = 'hsl(187 85% 53%)';
const GRID = 'hsl(215 22% 26%)';
const AXIS = 'hsl(215 20% 65%)';
const TOOLTIP = { background: 'hsl(222 39% 11%)', border: '1px solid hsl(215 22% 26%)', borderRadius: 12, fontSize: 12 };

const SEVERITY_COLOR: Record<AlertSeverity, string> = {
  info: ACCENT,
  warning: 'hsl(38 90% 52%)',
  critical: 'hsl(0 72% 55%)',
};

/** Reports — live plant analytics derived from the same real-time IoT store
 *  that feeds the Dashboard. Every chart re-renders as the stream ticks, so
 *  reports are always current (no refresh, no separate fetch). */
export function Reports() {
  const machines = useIotStore((s) => s.machines);
  const series = useIotStore((s) => s.series);
  const alerts = useIotStore((s) => s.alerts);

  if (!machines.length) {
    return (
      <Card>
        <CardBody className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          Waiting for the live plant stream to populate reports…
        </CardBody>
      </Card>
    );
  }

  const energyByMachine = machines.map((m) => ({ name: m.name.replace(/\s+/g, '\n'), energy: m.energyUsage, oee: m.oeeScore }));
  const openAlerts = alerts.filter((a) => a.status !== 'resolved');
  const severityData = (['critical', 'warning', 'info'] as AlertSeverity[])
    .map((sev) => ({ name: sev, value: openAlerts.filter((a) => a.severity === sev).length }))
    .filter((d) => d.value > 0);
  const totalEnergy = machines.reduce((s, m) => s + m.energyUsage, 0);
  const avgOee = machines.reduce((s, m) => s + m.oeeScore, 0) / machines.length;

  return (
    <div className="space-y-6" data-testid="iot-reports">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Machines" value={String(machines.length)} />
          <Stat label="Total energy" value={`${totalEnergy.toFixed(0)} kWh`} />
          <Stat label="Avg OEE" value={`${avgOee.toFixed(1)}%`} />
          <Stat label="Open alerts" value={String(openAlerts.length)} />
        </div>
        <Button size="sm" variant="outline" data-testid="iot-report-print" onClick={() => window.print()}>
          <Download className="size-4" /> Export
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody>
            <h3 className="mb-3 text-sm font-semibold">Throughput trend (live)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="thr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={BRAND} stopOpacity={0.5} />
                      <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                  <XAxis dataKey="t" tick={{ fontSize: 10, fill: AXIS }} minTickGap={40} />
                  <YAxis tick={{ fontSize: 10, fill: AXIS }} />
                  <Tooltip contentStyle={TOOLTIP} labelStyle={{ color: AXIS }} />
                  <Area type="monotone" dataKey="throughput" name="Throughput t/h" stroke={BRAND} fill="url(#thr)" strokeWidth={2} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="mb-3 text-sm font-semibold">Open alerts by severity</h3>
            <div className="h-64">
              {severityData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No open alerts ✅</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={severityData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={3}>
                      {severityData.map((d) => (
                        <Cell key={d.name} fill={SEVERITY_COLOR[d.name as AlertSeverity]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP} />
                    <Legend wrapperStyle={{ fontSize: 11, textTransform: 'capitalize' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody>
          <h3 className="mb-3 text-sm font-semibold">Energy &amp; OEE by machine</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={energyByMachine} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: AXIS }} interval={0} />
                <YAxis tick={{ fontSize: 10, fill: AXIS }} />
                <Tooltip contentStyle={TOOLTIP} labelStyle={{ color: AXIS }} cursor={{ fill: 'hsl(215 22% 26% / 0.3)' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="energy" name="Energy kWh" fill={BRAND} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="oee" name="OEE %" fill={ACCENT} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/50 px-4 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
