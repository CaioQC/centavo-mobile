import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Landmark, Link2, Plus } from 'lucide-react-native';

import { groupAccountsByBank } from '@/core/accounts';
import { formatCents } from '@/core/money';
import type { Database } from '@/data/database';
import { listAccountsWithBalance } from '@/data/repositories';
import { useDbQuery } from '@/data/useDbQuery';
import { AccountRow } from '@/features/accounts/AccountRow';
import { AppText, Button, EmptyState, QueryFallback, Screen, Section } from '@/shared/components';
import { spacing } from '@/shared/theme';

export default function AccountsScreen() {
  const load = useCallback((db: Database) => listAccountsWithBalance(db), []);
  const result = useDbQuery(load);
  const goBack = () => router.back();
  const newAccount = () => router.push('/new-account');
  const connectBank = () => router.push('/connect-bank');

  if (!result.data) {
    return (
      <Screen title="Contas e conexões" onBack={goBack}>
        <QueryFallback status={result.status} errorTitle="Não foi possível carregar as contas" onRetry={result.reload} />
      </Screen>
    );
  }

  const groups = groupAccountsByBank(result.data);

  if (groups.length === 0) {
    return (
      <Screen title="Contas e conexões" onBack={goBack}>
        <View style={styles.empty}>
          <EmptyState
            icon={Landmark}
            title="Nenhuma conta ainda"
            message="Conecte um banco fictício ou crie uma conta manual para começar a registrar seus lançamentos."
            actionLabel="Nova conta manual"
            onAction={newAccount}
          />
          <Button label="Conectar banco" icon={Link2} onPress={connectBank} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen title="Contas e conexões" onBack={goBack} scroll gap={spacing.xl}>
      {groups.map((group) => (
        <Section
          key={group.title}
          title={group.title}
          action={
            <AppText variant="captionMoney" tone="muted">
              {formatCents(group.totalInCents)}
            </AppText>
          }
        >
          {group.accounts.map((account) => (
            <AccountRow key={account.id} account={account} />
          ))}
        </Section>
      ))}
      <View style={styles.actions}>
        <Button label="Conectar banco" icon={Link2} onPress={connectBank} />
        <Button label="Nova conta manual" icon={Plus} variant="tonal" onPress={newAccount} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { gap: spacing.lg },
  actions: { gap: spacing.sm },
});
