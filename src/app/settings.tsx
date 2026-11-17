import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { RotateCcw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { importSampleData } from '@/data/sample/import';
import { useDatabase } from '@/data/useDbQuery';
import { ThemeSwitch } from '@/features/settings/ThemeSwitch';
import { AppText, Screen } from '@/shared/components';
import { MIN_TOUCH_SIZE, radius, spacing, useTheme, useThemePreference } from '@/shared/theme';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const db = useDatabase();
  const { preference, setPreference } = useThemePreference();
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
            Tema
          </AppText>
          <ThemeSwitch value={preference} onChange={setPreference} />
        </View>

        <View style={styles.section}>
          <AppText variant="heading" accessibilityRole="header">
            Dados de exemplo
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: restoring }}
            disabled={restoring}
            onPress={confirmRestore}
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          >
            {restoring ? (
              <ActivityIndicator accessibilityLabel="Restaurando" color={colors.muted} />
            ) : (
              <RotateCcw size={20} color={colors.muted} strokeWidth={1.75} />
            )}
            <AppText variant="bodyStrong">Restaurar dados de exemplo</AppText>
          </Pressable>
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
