import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Card } from '@/components/Card';
import { LineChart } from '@/components/LineChart';
import { colors, radius, spacing } from '@/theme';
import { useIotStore } from './iotStore';
import { severityColor } from './statusColors';
import type { MachineReading } from './types';

function Kpi({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}<Text style={styles.kpiUnit}>{unit ? ` ${unit}` : ''}</Text></Text>
    </View>
  );
}

export function Dashboard() {
  const { width } = useWindowDimensions();
  const machines = useIotStore((s) => s.machines);
  const series = useIotStore((s) => s.series);
  const alerts = useIotStore((s) => s.alerts);
  const active = alerts.filter((a) => a.status !== 'resolved');

  if (!machines.length) {
    return (
      <Card style={{ margin: spacing.lg }}>
        <Text style={{ color: colors.muted, textAlign: 'center', paddingVertical: spacing.xl }}>
          Connecting to the live plant stream… (free-tier server may be waking up)
        </Text>
      </Card>
    );
  }

  const avg = (fn: (m: MachineReading) => number) => machines.reduce((s, m) => s + fn(m), 0) / machines.length;
  const totalThr = machines.reduce((s, m) => s + m.throughput, 0);
  const totalEnergy = machines.reduce((s, m) => s + m.energyUsage, 0);

  return (
    <View style={{ padding: spacing.lg, gap: spacing.lg }}>
      <View style={styles.kpiGrid}>
        <Kpi label="Uptime" value={avg((m) => m.uptime).toFixed(1)} unit="%" />
        <Kpi label="Throughput" value={totalThr.toFixed(0)} unit="t/h" />
        <Kpi label="Energy" value={totalEnergy.toFixed(0)} unit="kWh" />
        <Kpi label="OEE" value={avg((m) => m.oeeScore).toFixed(1)} unit="%" />
        <Kpi label="Active alerts" value={String(active.length)} />
        <Kpi label="CO₂ est." value={(totalEnergy * 0.4).toFixed(0)} unit="kg/h" />
      </View>

      <Card>
        <Text style={styles.cardTitle}>Live throughput</Text>
        <LineChart data={series.map((p) => p.throughput)} width={width - spacing.lg * 2 - spacing.lg * 2} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Active alerts ({active.length})</Text>
        {active.length === 0 ? (
          <Text style={{ color: colors.muted, paddingVertical: spacing.md }}>All systems nominal ✅</Text>
        ) : (
          active.slice(0, 6).map((a) => {
            const c = severityColor(a.severity);
            return (
              <View key={a.id} style={styles.alertRow}>
                <View style={[styles.dot, { backgroundColor: c.fg }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertName}>{a.machineName}</Text>
                  <Text style={styles.alertMsg}>{a.message}</Text>
                </View>
              </View>
            );
          })
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  kpi: { flexGrow: 1, flexBasis: '30%', backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md },
  kpiLabel: { color: colors.muted, fontSize: 11, textTransform: 'uppercase' },
  kpiValue: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 2 },
  kpiUnit: { color: colors.muted, fontSize: 12, fontWeight: '400' },
  cardTitle: { color: colors.text, fontWeight: '600', marginBottom: spacing.sm },
  alertRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  alertName: { color: colors.text, fontWeight: '600', fontSize: 13 },
  alertMsg: { color: colors.muted, fontSize: 12 },
});
