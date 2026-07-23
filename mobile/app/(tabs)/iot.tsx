import { useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TopBar } from '@/components/TopBar';
import { Segmented } from '@/components/Segmented';
import { colors } from '@/theme';
import { useIotStream } from '@/features/iot/useIotStream';
import { useIotStore } from '@/features/iot/iotStore';
import { Dashboard } from '@/features/iot/Dashboard';
import { Machines } from '@/features/iot/Machines';
import { Alerts } from '@/features/iot/Alerts';

export default function IotScreen() {
  useIotStream();
  const [section, setSection] = useState('dashboard');
  const activeAlerts = useIotStore((s) => s.alerts.filter((a) => a.status !== 'resolved').length);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <TopBar title="SedIoT" showConnection />
      <Segmented
        options={[
          { key: 'dashboard', label: 'Dashboard' },
          { key: 'machines', label: 'Machines' },
          { key: 'alerts', label: 'Alerts', badge: activeAlerts || undefined },
        ]}
        value={section}
        onChange={setSection}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {section === 'dashboard' && <Dashboard />}
        {section === 'machines' && <Machines />}
        {section === 'alerts' && <Alerts />}
      </ScrollView>
    </SafeAreaView>
  );
}
