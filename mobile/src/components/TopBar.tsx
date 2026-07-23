import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { getSocket, refreshSocketAuth } from '@/socket/socket';
import { colors, spacing } from '@/theme';

/** Screen top bar: title, a live Socket.IO connection dot, and logout. */
export function TopBar({ title, showConnection }: { title: string; showConnection?: boolean }) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!showConnection) return;
    const s = getSocket();
    setConnected(s.connected);
    const on = () => setConnected(true);
    const off = () => setConnected(false);
    s.on('connect', on);
    s.on('disconnect', off);
    return () => { s.off('connect', on); s.off('disconnect', off); };
  }, [showConnection]);

  return (
    <View style={styles.bar}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.right}>
        {showConnection && (
          <View style={styles.conn}>
            <View style={[styles.dot, { backgroundColor: connected ? colors.success : colors.muted }]} />
            <Text style={[styles.connText, { color: connected ? colors.success : colors.muted }]}>
              {connected ? 'Live' : 'Connecting…'}
            </Text>
          </View>
        )}
        <Pressable
          testID="logout"
          onPress={() => { logout(); refreshSocketAuth(); router.replace('/login'); }}
          hitSlop={8}
        >
          <LogOut color={colors.muted} size={20} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  conn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  connText: { fontSize: 12, fontWeight: '600' },
});
