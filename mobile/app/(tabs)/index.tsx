import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Activity, Wrench, ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TopBar } from '@/components/TopBar';
import { Card } from '@/components/Card';
import { useAuthStore } from '@/store/authStore';
import { colors, radius, spacing } from '@/theme';

const PRODUCTS = [
  { href: '/(tabs)/iot', icon: Activity, name: 'SedIoT', desc: 'Real-time plant monitoring — live sensors, KPIs, alerts and machine control.' },
  { href: '/(tabs)/service', icon: Wrench, name: 'SedService', desc: 'Field-service marketplace — requests, quotes, technicians and jobs.' },
] as const;

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <TopBar title="SedERP" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <View>
          <Text style={styles.hi}>Welcome{user ? `, ${user.name.split(' ')[0]}` : ''}</Text>
          <Text style={styles.sub}>One platform for your plant and your field service.</Text>
        </View>

        {PRODUCTS.map((p) => (
          <Pressable key={p.name} onPress={() => router.push(p.href)} testID={`home-product-${p.name.toLowerCase()}`}>
            <Card>
              <View style={styles.iconWrap}><p.icon color={colors.brand} size={24} /></View>
              <Text style={styles.name}>{p.name}</Text>
              <Text style={styles.desc}>{p.desc}</Text>
              <View style={styles.open}>
                <Text style={styles.openText}>Open {p.name}</Text>
                <ChevronRight color={colors.brand} size={16} />
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hi: { fontSize: 24, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.muted, marginTop: 4 },
  iconWrap: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  name: { fontSize: 20, fontWeight: '700', color: colors.text },
  desc: { fontSize: 13, color: colors.muted, marginTop: 4 },
  open: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.md },
  openText: { color: colors.brand, fontWeight: '600', fontSize: 14 },
});
