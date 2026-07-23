import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Settings2, Radio } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, radius, spacing } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useIotStore } from './iotStore';
import { fetchMachines } from './controlApi';
import { machineStatusColor } from './statusColors';
import { MachineControl } from './MachineControl';
import { BroadcastModal } from './BroadcastModal';
import type { Machine } from './types';

export function Machines() {
  const [registry, setRegistry] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Machine | null>(null);
  const [broadcast, setBroadcast] = useState(false);
  const readings = useIotStore((s) => s.machines);
  const liveById = new Map(readings.map((r) => [r.id, r]));
  const can = useAuthStore((s) => s.can);
  const canControl = can('canControlMachines') || can('canPowerCycleMachines') || can('canSendMachineAlerts');
  const canBroadcast = can('canControlMachines') || can('canBroadcastAlerts');

  useEffect(() => {
    fetchMachines().then(setRegistry).finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />;

  return (
    <View style={{ padding: spacing.lg, gap: spacing.md }}>
      {canBroadcast && (
        <Button title="Broadcast Alert to ALL" variant="outline" icon={<Radio color={colors.warning} size={16} />} onPress={() => setBroadcast(true)} testID="broadcast-open" />
      )}
      {registry.map((m) => {
        const live = liveById.get(m.id);
        const c = machineStatusColor(live?.status ?? 'off');
        return (
          <Card key={m.id}>
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{m.name}</Text>
                <Text style={styles.sub}>{m.type} · {m.location}</Text>
              </View>
              <View style={[styles.pill, { backgroundColor: c.bg }]}>
                <Text style={[styles.pillText, { color: c.fg }]}>{live?.status ?? '—'}</Text>
              </View>
            </View>
            {live && (
              <View style={styles.metrics}>
                <Metric label="Temp" value={`${live.temperature}°`} />
                <Metric label="Vib" value={`${live.vibration}`} />
                <Metric label="t/h" value={`${live.throughput}`} />
                <Metric label="OEE" value={`${live.oeeScore}%`} />
              </View>
            )}
            <Button
              title={canControl ? 'Control' : 'Details'}
              variant="outline"
              icon={<Settings2 color={colors.text} size={16} />}
              onPress={() => setSelected(m)}
              testID={`machine-control-open-${m.id}`}
              style={{ marginTop: spacing.md }}
            />
          </Card>
        );
      })}

      {selected && <MachineControl machine={selected} onClose={() => setSelected(null)} />}
      {broadcast && <BroadcastModal onClose={() => setBroadcast(false)} />}
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  name: { color: colors.text, fontWeight: '700', fontSize: 15 },
  sub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
  pillText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  metrics: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  metric: { alignItems: 'center', flex: 1 },
  metricValue: { color: colors.text, fontWeight: '700', fontSize: 14 },
  metricLabel: { color: colors.muted, fontSize: 11, marginTop: 2 },
});
