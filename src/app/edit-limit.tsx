import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { validateLimit } from '@/core/budget';
import { isValidYearMonth } from '@/core/dates';
import { formatMonthLabel } from '@/core/labels';
import type { Database } from '@/data/database';
import { listBudgetLimits, listCategories, setBudgetLimit } from '@/data/repositories';
import { useDatabase, useDbQuery } from '@/data/useDbQuery';
import { AppText, Button, CategoryBadge, MoneyField, QueryFallback, Screen } from '@/shared/components';
import { MIN_TOUCH_SIZE, spacing } from '@/shared/theme';

export default function EditLimitScreen() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ month?: string; categoryId?: string }>();
  const month = params.month && isValidYearMonth(params.month) ? params.month : null;
  const categoryId = params.categoryId ?? null;

  const load = useCallback(
    async (database: Database) => {
      if (month === null || categoryId === null) return null;
      const [categories, limits] = await Promise.all([listCategories(database, 'EXPENSE'), listBudgetLimits(database, month)]);
      const category = categories.find((item) => item.id === categoryId);
      if (!category) return null;
      return { category, currentLimit: limits.find((limit) => limit.categoryId === categoryId)?.limitInCents ?? null };
    },
    [month, categoryId],
  );
  const result = useDbQuery(load);

  // `null` = o usuário ainda não digitou nada: o campo mostra o limite atual.
  const [typedInCents, setTypedInCents] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const goBack = () => router.back();

  if (month === null || categoryId === null || result.data === null) {
    // Parâmetros inválidos ou categoria removida contam como "não encontrada" (a consulta nem chega a rodar).
    const status = month === null || categoryId === null ? 'ready' : result.status;
    return (
      <Screen title="Limite do mês" onBack={goBack}>
        <QueryFallback
          status={status}
          errorTitle="Não foi possível carregar o limite"
          onRetry={result.reload}
          notFound={{ title: 'Categoria não encontrada', message: 'Volte ao orçamento e escolha uma categoria de despesa.', onBack: goBack }}
        />
      </Screen>
    );
  }

  const { category, currentLimit } = result.data;
  const limitInCents = typedInCents ?? currentLimit ?? 0;
  const error = submitted ? validateLimit(limitInCents) : null;

  const save = async (value: number) => {
    setSubmitted(true);
    if (validateLimit(value) !== null) return;
    setSaving(true);
    try {
      await setBudgetLimit(db, month, category.id, value);
      router.back();
    } catch {
      setSaving(false);
      Alert.alert('Não foi possível salvar', 'Tente de novo.');
    }
  };

  return (
    <Screen title="Limite do mês" onBack={goBack} scroll form>
      <View style={styles.category}>
        <CategoryBadge icon={category.icon} color={category.color} />
        <View>
          <AppText variant="heading">{category.name}</AppText>
          <AppText variant="caption" tone="muted">
            {formatMonthLabel(month)}
          </AppText>
        </View>
      </View>

      <MoneyField
        label="Limite do mês"
        error={error ?? undefined}
        hint="Digite o valor; zero ou vazio remove o limite."
        valueInCents={limitInCents}
        onChangeCents={setTypedInCents}
      />

      <Button label="Salvar limite" loading={saving} onPress={() => save(limitInCents)} />

      {currentLimit !== null ? (
        <Pressable accessibilityRole="button" disabled={saving} onPress={() => save(0)} style={styles.remove}>
          <AppText variant="bodyStrong" tone="danger">
            Remover limite
          </AppText>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  category: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  remove: { minHeight: MIN_TOUCH_SIZE, alignItems: 'center', justifyContent: 'center' },
});
