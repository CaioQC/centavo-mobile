import { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { TriangleAlert } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { mergeBanksWithConnections } from '@/core/connections';
import { BANK_CATALOG } from '@/data/banks/catalog';
import type { Database } from '@/data/database';
import { listConnections } from '@/data/repositories';
import { useDbQuery } from '@/data/useDbQuery';
import { BankRow } from '@/features/connections/BankRow';
import { AppText, EmptyState, Screen } from '@/shared/components';
import { spacing, useTheme } from '@/shared/theme';

export default function ConnectBankScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const load = useCallback(async (db: Database) => mergeBanksWithConnections(BANK_CATALOG, await listConnections(db)), []);
  const result = useDbQuery(load);
  const goBack = () => router.back();

  if (!result.data) {
    return (
      <Screen title="Conectar banco" onBack={goBack}>
        {result.status === 'error' ? (
          <EmptyState
            icon={TriangleAlert}
            title="Não foi possível carregar os bancos"
            message="Algo deu errado ao ler os dados do aparelho. Tente de novo."
            actionLabel="Tentar de novo"
            onAction={result.reload}
          />
        ) : (
          <ActivityIndicator accessibilityLabel="Carregando" color={colors.muted} />
        )}
      </Screen>
    );
  }

  return (
    <Screen title="Conectar banco" onBack={goBack}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <AppText tone="muted">
          Escolha um banco para simular a conexão. Os bancos são fictícios e os dados são inventados: nada real é lido.
        </AppText>
        <View style={styles.list}>
          {result.data.map((bank) => (
            <BankRow
              key={bank.key}
              bank={bank}
              onConnect={() => router.push({ pathname: '/connect-bank-consent', params: { key: bank.key } })}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  list: { gap: spacing.md },
});
