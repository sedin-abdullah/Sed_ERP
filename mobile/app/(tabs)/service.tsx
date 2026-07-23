import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wrench } from 'lucide-react-native';
import { TopBar } from '@/components/TopBar';
import { Card } from '@/components/Card';
import { colors, spacing } from '@/theme';

export default function ServiceScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <TopBar title="SedService" />
      <View style={{ padding: spacing.lg }}>
        <Card>
          <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl }}>
            <Wrench color={colors.muted} size={28} />
            <Text style={{ color: colors.text, fontWeight: '600' }}>Field-service marketplace</Text>
            <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center' }}>
              Requests, quotes, technicians and jobs arrive in Phase 3.
            </Text>
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
}
