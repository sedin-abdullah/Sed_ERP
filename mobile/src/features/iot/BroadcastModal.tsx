import { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput } from 'react-native';
import { X } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { colors, radius, spacing } from '@/theme';
import { getApiError } from '@/lib/api';
import { broadcastAlert } from './controlApi';

export function BroadcastModal({ onClose }: { onClose: () => void }) {
  const [severity, setSeverity] = useState('warning');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!message.trim()) { setError('Message is required'); return; }
    setLoading(true); setError(null);
    try { await broadcastAlert({ severity, message: message.trim() }); onClose(); }
    catch (e) { setError(getApiError(e)); }
    finally { setLoading(false); }
  }

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.head}>
            <Text style={styles.title}>Broadcast alert to ALL machines</Text>
            <Pressable onPress={onClose} hitSlop={10}><X color={colors.muted} size={20} /></Pressable>
          </View>
          <Text style={styles.label}>Severity</Text>
          <View style={styles.sevRow}>
            {['info', 'warning', 'critical'].map((s) => (
              <Pressable key={s} onPress={() => setSeverity(s)} style={[styles.sevPill, severity === s && { borderColor: colors.brand }]}>
                <Text style={{ color: severity === s ? colors.brand : colors.muted, fontSize: 12, textTransform: 'capitalize' }}>{s}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput value={message} onChangeText={setMessage} placeholder="Alert message" placeholderTextColor={colors.muted} style={styles.input} />
          {error ? <Text style={{ color: colors.danger, marginTop: 6 }}>{error}</Text> : null}
          <Button title="Broadcast" onPress={submit} loading={loading} style={{ marginTop: spacing.md }} testID="broadcast-submit" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: spacing.lg },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  title: { color: colors.text, fontWeight: '700', fontSize: 15, flex: 1 },
  label: { color: colors.muted, fontSize: 12, marginBottom: 6 },
  sevRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  sevPill: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  input: { height: 44, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface2, color: colors.text, paddingHorizontal: 12 },
});
