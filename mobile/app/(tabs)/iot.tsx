import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity } from 'lucide-react-native';
import { TopBar } from '@/components/TopBar';
import { Card } from '@/components/Card';
import { colors, spacing } from '@/theme';

export default function IotScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <TopBar title="SedIoT" showConnection />
      <View style={{ padding: spacing.lg }}>
        <Card>
          <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl }}>
            <Activity color={colors.muted} size={28} />
            <Text style={{ color: colors.text, fontWeight: '600' }}>Live plant monitoring</Text>
            <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center' }}>
              Dashboard, machines, alerts and machine control arrive in Phase 2.
            </Text>
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
}
