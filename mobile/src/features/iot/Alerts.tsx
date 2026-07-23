import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Segmented } from '@/components/Segmented';
import { colors, radius, spacing } from '@/theme';
import { useIotStore } from './iotStore';
import { setAlertStatus } from './controlApi';
import { severityColor } from './statusColors';

export function Alerts() {
  const alerts = useIotStore((s) => s.alerts);
  const upsertAlert = useIotStore((s) => s.upsertAlert);
  const resolveAlert = useIotStore((s) => s.resolveAlert);
  const [filter, setFilter] = useState('active');
  const [busy, setBusy] = useState<string | null>(null);

  const shown = alerts.filter((a) => (filter === 'all' ? true : filter === 'active' ? a.status !== 'resolved' : a.status === filter));

  async function act(id: string, status: 'ack' | 'resolved') {
    setBusy(id);
    try {
      const updated = await setAlertStatus(id, status);
      if (status === 'resolved') resolveAlert(id);
      else upsertAlert(updated);
    } finally {
      setBusy(null);
    }
  }

  return (
    <View>
      <Segmented
        options={[{ key: 'active', label: 'Active' }, { key: 'ack', label: 'Acknowledged' }, { key: 'resolved', label: 'Resolved' }, { key: 'all', label: 'All' }]}
        value={filter}
        onChange={setFilter}
      />
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        {shown.length === 0 && <Text style={{ color: colors.muted, textAlign: 'center', paddingVertical: spacing.xl }}>No alerts in this view.</Text>}
        {shown.map((a) => {
          const c = severityColor(a.severity);
          return (
            <Card key={a.id}>
              <View style={styles.top}>
                <View style={[styles.sev, { backgroundColor: c.bg }]}><Text style={[styles.sevText, { color: c.fg }]}>{a.severity}</Text></View>
                {a.source === 'admin' && <Text style={styles.tag}>admin</Text>}
                <Text style={styles.status}>{a.status}</Text>
              </View>
              <Text style={styles.name}>{a.machineName}</Text>
              <Text style={styles.msg}>{a.message}</Text>
              {a.status !== 'resolved' && (
                <View style={styles.actions}>
                  {a.status === 'active' && <Button title="Acknowledge" variant="outline" onPress={() => act(a.id, 'ack')} loading={busy === a.id} style={{ flex: 1 }} />}
                  <Button title="Resolve" variant="outline" onPress={() => act(a.id, 'resolved')} loading={busy === a.id} style={{ flex: 1 }} />
                </View>
              )}
            </Card>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sev: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  sevText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  tag: { color: colors.brand, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  status: { color: colors.muted, fontSize: 11, marginLeft: 'auto', textTransform: 'capitalize' },
  name: { color: colors.text, fontWeight: '700', marginTop: spacing.sm },
  msg: { color: colors.muted, fontSize: 13, marginTop: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
});
