import { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Landmark, Plus, TriangleAlert } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { groupAccountsByBank } from '@/core/accounts';
import { formatCents } from '@/core/money';
import type { Database } from '@/data/database';
import { listAccountsWithBalance } from '@/data/repositories';
import { useDbQuery } from '@/data/useDbQuery';
import { AccountRow } from '@/features/accounts/AccountRow';
import { AppText, EmptyState, Screen } from '@/shared/components';
import { MIN_TOUCH_SIZE, radius, spacing, useTheme } from '@/shared/theme';

export default function AccountsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const load = useCallback((db: Database) => listAccountsWithBalance(db), []);
  const result = useDbQuery(load);
  const goBack = () => router.back();
  const newAccount = () => router.push('/new-account');

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
        <EmptyState
          icon={Landmark}
          title="Nenhuma conta ainda"
          message="Crie uma conta manual para começar a registrar seus lançamentos."
          actionLabel="Nova conta manual"
          onAction={newAccount}
        />
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
          <Pressable
            accessibilityRole="button"
            onPress={newAccount}
            style={[styles.add, { backgroundColor: colors.accent }]}
          >
            <Plus size={20} color={colors.onAccent} />
            <AppText variant="bodyStrong" style={{ color: colors.onAccent }}>
              Nova conta manual
            </AppText>
          </Pressable>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl },
  group: { gap: spacing.sm },
  groupHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  add: {
    minHeight: MIN_TOUCH_SIZE + spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
