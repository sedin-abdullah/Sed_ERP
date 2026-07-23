import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { colors, radius } from '@/theme';

interface Option { key: string; label: string; badge?: number }

export function Segmented({ options, value, onChange }: { options: Option[]; value: string; onChange: (k: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            testID={`iot-seg-${o.key}`}
            onPress={() => onChange(o.key)}
            style={[styles.pill, active ? styles.active : styles.inactive]}
          >
            <Text style={[styles.label, { color: active ? colors.brand : colors.muted }]}>{o.label}</Text>
            {o.badge ? <Text style={styles.badge}>{o.badge}</Text> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1 },
  active: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  inactive: { backgroundColor: 'transparent', borderColor: colors.border },
  label: { fontSize: 13, fontWeight: '600' },
  badge: { backgroundColor: colors.danger, color: colors.white, fontSize: 10, fontWeight: '700', paddingHorizontal: 6, borderRadius: 999, overflow: 'hidden' },
});
