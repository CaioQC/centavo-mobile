import { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Landmark, Link2, Plus, TriangleAlert } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { groupAccountsByBank } from '@/core/accounts';
import { formatCents } from '@/core/money';
import type { Database } from '@/data/database';
import { listAccountsWithBalance } from '@/data/repositories';
import { useDbQuery } from '@/data/useDbQuery';
import { AccountRow } from '@/features/accounts/AccountRow';
import { AppText, Button, EmptyState, Screen } from '@/shared/components';
import { spacing, useTheme } from '@/shared/theme';

export default function AccountsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const load = useCallback((db: Database) => listAccountsWithBalance(db), []);
  const result = useDbQuery(load);
  const goBack = () => router.back();
  const newAccount = () => router.push('/new-account');
  const connectBank = () => router.push('/connect-bank');

  if (!result.data) {
    return (
      <Screen title="Contas e conexões" onBack={goBack}>
        {result.status === 'error' ? (
          <EmptyState
            icon={TriangleAlert}
            title="Não foi possível carregar as contas"
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

  const groups = groupAccountsByBank(result.data);

  return (
    <Screen title="Contas e conexões" onBack={goBack}>
      {groups.length === 0 ? (
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
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
          {groups.map((group) => (
            <View key={group.title} style={styles.group}>
              <View style={styles.groupHeader}>
                <AppText variant="heading" accessibilityRole="header">
                  {group.title}
                </AppText>
                <AppText variant="captionMoney" tone="muted">
                  {formatCents(group.totalInCents)}
                </AppText>
              </View>
              {group.accounts.map((account) => (
                <AccountRow key={account.id} account={account} />
              ))}
            </View>
          ))}
          <View style={styles.actions}>
            <Button label="Conectar banco" icon={Link2} onPress={connectBank} />
            <Button label="Nova conta manual" icon={Plus} variant="secondary" onPress={newAccount} />
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl },
  group: { gap: spacing.sm },
  groupHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  empty: { gap: spacing.lg },
  actions: { gap: spacing.sm },
});
