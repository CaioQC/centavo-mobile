import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { Fingerprint, RotateCcw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { importSampleData } from '@/data/sample/import';
import { useDatabase } from '@/data/useDbQuery';
import { useBiometricLock } from '@/features/lock/BiometricLockProvider';
import { ThemeSwitch } from '@/features/settings/ThemeSwitch';
import { AppText, Button, Screen } from '@/shared/components';
import { MIN_TOUCH_SIZE, radius, spacing, useTheme, useThemePreference } from '@/shared/theme';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const db = useDatabase();
  const { preference, setPreference } = useThemePreference();
  const lock = useBiometricLock();
  const [lockError, setLockError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<{ text: string; failed: boolean } | null>(null);

  const restore = async () => {
    setRestoring(true);
    setRestoreMessage(null);
    try {
      const summary = await importSampleData(db);
      setRestoreMessage({
        text: `Dados de exemplo restaurados: ${summary.accounts} contas e ${summary.transactions} transações. Suas categorias e observações foram mantidas.`,
        failed: false,
      });
    } catch {
      setRestoreMessage({ text: 'Não foi possível restaurar os dados de exemplo. Tente de novo.', failed: true });
    } finally {
      setRestoring(false);
    }
  };

  const toggleLock = async (next: boolean) => {
    setLockError(null);
    const done = await lock.setEnabled(next);
    if (!done) {
      setLockError(
        next
          ? 'Não foi possível ligar o desbloqueio. Confirme sua identidade ou cadastre biometria ou PIN no aparelho.'
          : 'Não foi possível desligar o desbloqueio. Tente de novo.',
      );
    }
  };

  const confirmRestore = () =>
    Alert.alert(
      'Restaurar dados de exemplo?',
      'O banco fictício e as transações de exemplo que faltarem voltam. Nada do que você mudou é sobrescrito.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Restaurar', onPress: restore },
      ],
    );

  return (
    <Screen title="Ajustes" onBack={() => router.back()}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.section}>
          <AppText variant="heading" accessibilityRole="header">
            Segurança
          </AppText>
          <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Fingerprint size={20} color={colors.muted} strokeWidth={1.75} />
            <View style={styles.rowText}>
              <AppText variant="bodyStrong">Desbloqueio por biometria</AppText>
              <AppText variant="caption" tone="muted">
                {lock.available
                  ? 'Pede digital, rosto ou PIN ao abrir o app.'
                  : 'Cadastre uma biometria ou um PIN no aparelho para usar.'}
              </AppText>
            </View>
            <Switch
              accessibilityLabel="Desbloqueio por biometria"
              value={lock.enabled && lock.available}
              disabled={!lock.available && !lock.enabled}
              onValueChange={toggleLock}
              trackColor={{ true: colors.accent, false: colors.track }}
            />
          </View>
          {lockError ? (
            <AppText variant="caption" style={{ color: colors.over }} accessibilityLiveRegion="polite">
              {lockError}
            </AppText>
          ) : null}
        </View>

        <View style={styles.section}>
          <AppText variant="heading" accessibilityRole="header">
            Tema
          </AppText>
          <ThemeSwitch value={preference} onChange={setPreference} />
        </View>

        <View style={styles.section}>
          <AppText variant="heading" accessibilityRole="header">
            Dados de exemplo
          </AppText>
          <Button
            label="Restaurar dados de exemplo"
            icon={RotateCcw}
            variant="tonal"
            loading={restoring}
            onPress={confirmRestore}
          />
          {restoreMessage ? (
            <AppText
              variant="caption"
              tone={restoreMessage.failed ? 'text' : 'muted'}
              accessibilityLiveRegion="polite"
              style={restoreMessage.failed ? { color: colors.over } : undefined}
            >
              {restoreMessage.text}
            </AppText>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl },
  section: { gap: spacing.md },
  rowText: { flex: 1 },
  row: {
    minHeight: MIN_TOUCH_SIZE + spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
  },
});
