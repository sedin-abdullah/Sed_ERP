import { Tabs, Redirect } from 'expo-router';
import { Home, Activity, Wrench } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/theme';

export default function TabsLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      <Tabs.Screen name="iot" options={{ title: 'SedIoT', tabBarIcon: ({ color, size }) => <Activity color={color} size={size} /> }} />
      <Tabs.Screen name="service" options={{ title: 'SedService', tabBarIcon: ({ color, size }) => <Wrench color={color} size={size} /> }} />
    </Tabs>
  );
}
