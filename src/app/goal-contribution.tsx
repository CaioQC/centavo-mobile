import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Target } from 'lucide-react-native';

import { formatDateInput, parseDateInput } from '@/core/dateInput';
import { todayLocal } from '@/core/dates';
import { validateContribution, type ContributionKind } from '@/core/goals';
import { formatCents } from '@/core/money';
import type { Database } from '@/data/database';
import { addContribution, ContributionExceedsBalanceError, getGoal } from '@/data/repositories';
import { useDatabase, useDbQuery } from '@/data/useDbQuery';
import { AppText, Button, DateField, MoneyField, QueryFallback, Screen } from '@/shared/components';

export default function GoalContributionScreen() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ goalId?: string; kind?: string }>();
  const goalId = params.goalId ?? '';
  const kind: ContributionKind = params.kind === 'WITHDRAWAL' ? 'WITHDRAWAL' : 'DEPOSIT';

  const load = useCallback((database: Database) => getGoal(database, goalId), [goalId]);
  const result = useDbQuery(load);

  const [amountInCents, setAmountInCents] = useState(0);
  const [dateText, setDateText] = useState(() => formatDateInput(todayLocal()));
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const isWithdrawal = kind === 'WITHDRAWAL';
  const title = isWithdrawal ? 'Retirar da meta' : 'Novo aporte';
  const goBack = () => router.back();
  const goal = result.data ?? null;

  if (!goal) {
    return (
      <Screen title={title} onBack={goBack}>
        <QueryFallback
          status={result.status}
          errorTitle="Não foi possível carregar a meta"
          onRetry={result.reload}
          notFound={{ icon: Target, title: 'Meta não encontrada', message: 'Volte às metas e escolha outra.', onBack: goBack }}
        />
      </Screen>
    );
  }

  const date = parseDateInput(dateText);
  const form = { kind, amountInCents, date, savedInCents: goal.savedInCents };
  const errors = submitted ? validateContribution(form) : {};

  const save = async () => {
    setSubmitted(true);
    if (Object.keys(validateContribution(form)).length > 0 || date === null) return;
    setSaving(true);
    try {
      await addContribution(db, goal.id, kind, amountInCents, date);
      router.back();
    } catch (error) {
      setSaving(false);
      if (error instanceof ContributionExceedsBalanceError) {
        Alert.alert('Retirada maior que o guardado', `A meta tem ${formatCents(error.savedInCents)} guardado.`);
      } else {
        Alert.alert('Não foi possível salvar', 'Tente de novo.');
      }
    }
  };

  return (
    <Screen title={title} onBack={goBack} scroll form>
      <View>
        <AppText variant="heading">{goal.name}</AppText>
        <AppText variant="captionMoney" tone="muted">
          Guardado: {formatCents(Math.max(goal.savedInCents, 0))}
        </AppText>
      </View>

      <MoneyField label="Valor" error={errors.amount} valueInCents={amountInCents} onChangeCents={setAmountInCents} />

      <DateField label="Data" error={errors.date} value={dateText} onChangeText={setDateText} showToday />

      <Button label={isWithdrawal ? 'Registrar retirada' : 'Registrar aporte'} loading={saving} onPress={save} />
    </Screen>
  );
}
