import { useCallback } from 'react';
import { router } from 'expo-router';
import { Plus, Target } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Database } from '@/data/database';
import { listGoals } from '@/data/repositories';
import { useDbQuery } from '@/data/useDbQuery';
import { GoalCard } from '@/features/goals/GoalCard';
import { Button, EmptyState, QueryFallback, Screen, TAB_BAR_CLEARANCE } from '@/shared/components';
import { spacing } from '@/shared/theme';

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const load = useCallback((db: Database) => listGoals(db), []);
  const result = useDbQuery(load);
  const bottomInset = TAB_BAR_CLEARANCE + insets.bottom;
  const newGoal = () => router.push('/new-goal');

  if (!result.data) {
    return (
      <Screen title="Metas" bottomInset={bottomInset}>
        <QueryFallback status={result.status} errorTitle="Não foi possível carregar as metas" onRetry={result.reload} />
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
    <Screen title="Metas" bottomInset={bottomInset} scroll gap={spacing.md}>
      {result.data.map((goal) => (
        <GoalCard key={goal.id} goal={goal} onPress={() => router.push(`/goal/${goal.id}`)} />
      ))}
      <Button label="Nova meta" icon={Plus} onPress={newGoal} />
    </Screen>
  );
}
