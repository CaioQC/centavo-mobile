import { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Plus, Target, TriangleAlert } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Database } from '@/data/database';
import { listGoals } from '@/data/repositories';
import { useDbQuery } from '@/data/useDbQuery';
import { GoalCard } from '@/features/goals/GoalCard';
import { AppText, EmptyState, Screen, TAB_BAR_CLEARANCE } from '@/shared/components';
import { MIN_TOUCH_SIZE, radius, spacing, useTheme } from '@/shared/theme';

export default function GoalsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const load = useCallback((db: Database) => listGoals(db), []);
  const result = useDbQuery(load);
  const bottomInset = TAB_BAR_CLEARANCE + insets.bottom;
  const newGoal = () => router.push('/new-goal');

  if (!result.data) {
    return (
      <Screen title="Metas" bottomInset={bottomInset}>
        {result.status === 'error' ? (
          <EmptyState
            icon={TriangleAlert}
            title="Não foi possível carregar as metas"
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

  if (result.data.length === 0) {
    return (
      <Screen title="Metas" bottomInset={bottomInset}>
        <EmptyState
          icon={Target}
          title="Nenhuma meta ainda"
          message="Crie uma meta de economia e acompanhe o progresso dos aportes."
          actionLabel="Criar meta"
          onAction={newGoal}
        />
      </Screen>
    );
  }

  return (
    <Screen title="Metas" bottomInset={bottomInset}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {result.data.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
        <Pressable accessibilityRole="button" onPress={newGoal} style={[styles.add, { backgroundColor: colors.accent }]}>
          <Plus size={20} color={colors.onAccent} />
          <AppText variant="bodyStrong" style={{ color: colors.onAccent }}>
            Nova meta
          </AppText>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.lg },
  add: {
    minHeight: MIN_TOUCH_SIZE + spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
