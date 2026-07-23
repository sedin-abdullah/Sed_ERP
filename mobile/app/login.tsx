import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { api, getApiError } from '@/lib/api';
import { useAuthStore, AuthUser } from '@/store/authStore';
import { refreshSocketAuth } from '@/socket/socket';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, radius, spacing } from '@/theme';

const DEMO = [
  { label: 'Admin', email: 'admin@sederp.com', password: 'Admin@123' },
  { label: 'User', email: 'user1@sederp.com', password: 'User@123' },
  { label: 'Technician', email: 'tech1@sederp.com', password: 'Tech@123' },
];

export default function Login() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Redirect href="/(tabs)" />;

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ data: { user: AuthUser; accessToken: string } }>('/auth/login', { email, password });
      login(res.data.data.user, res.data.data.accessToken);
      refreshSocketAuth();
      router.replace('/(tabs)');
    } catch (err) {
      setError(getApiError(err, 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>Sed<Text style={{ color: colors.brand }}>ERP</Text></Text>
        <Card style={{ width: '100%', gap: spacing.md }}>
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.subtitle}>Use a demo account below or your credentials.</Text>

          <View>
            <Text style={styles.label}>Email</Text>
            <TextInput
              testID="login-email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={colors.muted}
              style={styles.input}
              placeholder="you@sederp.com"
            />
          </View>
          <View>
            <Text style={styles.label}>Password</Text>
            <TextInput
              testID="login-password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor={colors.muted}
              style={styles.input}
              placeholder="••••••••"
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Sign in" onPress={submit} loading={loading} testID="login-submit" />

          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>Demo accounts</Text>
            {DEMO.map((d) => (
              <Pressable key={d.email} onPress={() => { setEmail(d.email); setPassword(d.password); }}>
                <Text style={styles.demoRow}>{d.label}: {d.email} · {d.password}</Text>
              </Pressable>
            ))}
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.xl },
  brand: { fontSize: 30, fontWeight: '800', color: colors.text },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.muted },
  label: { fontSize: 12, color: colors.muted, marginBottom: 4 },
  input: { height: 46, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface2, color: colors.text, paddingHorizontal: 12 },
  error: { color: colors.danger, fontSize: 13 },
  demoBox: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, gap: 4 },
  demoTitle: { color: colors.text, fontWeight: '600', fontSize: 12 },
  demoRow: { color: colors.muted, fontSize: 12 },
});
