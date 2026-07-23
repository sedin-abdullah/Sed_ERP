import { Pressable, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { ReactNode } from 'react';
import { colors, radius } from '@/theme';

type Variant = 'primary' | 'outline' | 'ghost';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, icon, style, testID }: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        (pressed || isDisabled) && { opacity: 0.6 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.white : colors.brand} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, variant === 'primary' ? { color: colors.white } : { color: colors.text }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, paddingHorizontal: 18, borderRadius: radius.md },
  primary: { backgroundColor: colors.brand },
  outline: { borderWidth: 1, borderColor: colors.border, backgroundColor: 'transparent' },
  ghost: { backgroundColor: 'transparent' },
  text: { fontSize: 15, fontWeight: '600' },
});
