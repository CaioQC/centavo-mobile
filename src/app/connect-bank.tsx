import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Landmark } from 'lucide-react-native';

import { mergeBanksWithConnections } from '@/core/connections';
import { BANK_CATALOG } from '@/data/banks/catalog';
import type { Database } from '@/data/database';
import { listConnections } from '@/data/repositories';
import { useDbQuery } from '@/data/useDbQuery';
import { BankRow } from '@/features/connections/BankRow';
import { AppText, EmptyState, QueryFallback, Screen } from '@/shared/components';
import { spacing } from '@/shared/theme';

export default function ConnectBankScreen() {
  const load = useCallback(async (db: Database) => mergeBanksWithConnections(BANK_CATALOG, await listConnections(db)), []);
  const result = useDbQuery(load);
  const goBack = () => router.back();

  if (!result.data) {
    return (
      <Screen title="Conectar banco" onBack={goBack}>
        <QueryFallback status={result.status} errorTitle="Não foi possível carregar os bancos" onRetry={result.reload} />
      </Screen>
    );
  }

  return (
    <Screen title="Conectar banco" onBack={goBack} scroll>
      <AppText tone="muted">
        Escolha um banco para simular a conexão. Os bancos são fictícios e os dados são inventados: nada real é lido.
      </AppText>
      {result.data.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="Nenhum banco disponível"
          message="A lista de bancos fictícios está vazia."
          actionLabel="Voltar"
          onAction={goBack}
        />
      ) : null}
      <View style={styles.list}>
        {result.data.map((bank) => (
          <BankRow
            key={bank.key}
            bank={bank}
            onConnect={() => router.push({ pathname: '/connect-bank-consent', params: { key: bank.key } })}
            onSync={() => router.push({ pathname: '/connect-bank-sync', params: { key: bank.key } })}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
});
