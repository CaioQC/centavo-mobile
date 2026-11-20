import { useState } from 'react';
import { Alert, Switch } from 'react-native';
import { router } from 'expo-router';
import { Fingerprint, RotateCcw } from 'lucide-react-native';

import { THEME_PREFERENCE_LABELS, THEME_PREFERENCES, type ThemePreference } from '@/core/themePreference';
import { importSampleData } from '@/data/sample/import';
import { useDatabase } from '@/data/useDbQuery';
import { useBiometricLock } from '@/features/lock/BiometricLockProvider';
import { AppText, Button, ListRow, Screen, SegmentedControl, Section, type SegmentOption } from '@/shared/components';
import { spacing, useTheme, useThemePreference } from '@/shared/theme';

const THEME_OPTIONS: SegmentOption<ThemePreference>[] = THEME_PREFERENCES.map((preference) => ({
  value: preference,
  label: THEME_PREFERENCE_LABELS[preference],
  accessibilityLabel: `Tema ${THEME_PREFERENCE_LABELS[preference]}`,
}));

export default function SettingsScreen() {
  const { colors } = useTheme();
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
    <Screen title="Ajustes" onBack={() => router.back()} scroll gap={spacing.xl}>
      <Section title="Segurança" gap={spacing.md}>
        <ListRow
          icon={Fingerprint}
          title="Desbloqueio por biometria"
          subtitle={
            lock.available
              ? 'Pede digital, rosto ou PIN ao abrir o app.'
              : 'Cadastre uma biometria ou um PIN no aparelho para usar.'
          }
          trailing={
            <Switch
              accessibilityLabel="Desbloqueio por biometria"
              value={lock.enabled && lock.available}
              disabled={!lock.available && !lock.enabled}
              onValueChange={toggleLock}
              trackColor={{ true: colors.accent, false: colors.track }}
            />
          }
        />
        {lockError ? (
          <AppText variant="caption" tone="danger" accessibilityLiveRegion="polite">
            {lockError}
          </AppText>
        ) : null}
      </Section>

      <Section title="Tema" gap={spacing.md}>
        <SegmentedControl options={THEME_OPTIONS} value={preference} onChange={setPreference} />
      </Section>

      <Section title="Dados de exemplo" gap={spacing.md}>
        <Button label="Restaurar dados de exemplo" icon={RotateCcw} variant="tonal" loading={restoring} onPress={confirmRestore} />
        {restoreMessage ? (
          <AppText
            variant="caption"
            tone={restoreMessage.failed ? 'danger' : 'muted'}
            accessibilityLiveRegion="polite"
          >
            {restoreMessage.text}
          </AppText>
        ) : null}
      </Section>
    </Screen>
  );
}
