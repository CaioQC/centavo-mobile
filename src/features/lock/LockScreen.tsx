import { Pressable, StyleSheet, View } from 'react-native';
import { Lock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../shared/components';
import { MIN_TOUCH_SIZE, radius, spacing, useTheme } from '../../shared/theme';

interface LockScreenProps {
  /** por que o último pedido não deu certo; nulo no primeiro pedido */
  message: string | null;
  onRetry: () => void;
}

/** Tela de desbloqueio: cobre o app inteiro até a biometria (ou o PIN do aparelho) ser confirmada. */
export function LockScreen({ message, onRetry }: LockScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityViewIsModal
      style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xl }]}
    >
      <View style={styles.center}>
        <View style={[styles.logo, { backgroundColor: colors.accent }]}>
          <Lock size={32} color={colors.onAccent} strokeWidth={2} />
        </View>
        <AppText variant="title" accessibilityRole="header">
          Centavo
        </AppText>
        <AppText tone="muted" style={styles.centered}>
          Use sua digital, seu rosto ou o PIN do aparelho para abrir.
        </AppText>
        {message ? (
          <AppText variant="caption" style={[styles.centered, { color: colors.over }]} accessibilityLiveRegion="polite">
            {message}
          </AppText>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={[styles.button, { backgroundColor: colors.accent }]}
      >
        <AppText variant="bodyStrong" style={{ color: colors.onAccent }}>
          Desbloquear
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, paddingHorizontal: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  logo: { width: 72, height: 72, borderRadius: radius.cardLarge, alignItems: 'center', justifyContent: 'center' },
  centered: { textAlign: 'center' },
  button: {
    minHeight: MIN_TOUCH_SIZE + spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
