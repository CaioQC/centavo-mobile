import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { TriangleAlert } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { validateLimit } from '@/core/budget';
import { isValidYearMonth } from '@/core/dates';
import { formatMonthLabel } from '@/core/labels';
import { formatCents, parseDigitsToCents } from '@/core/money';
import type { Database } from '@/data/database';
import { listBudgetLimits, listCategories, setBudgetLimit } from '@/data/repositories';
import { useDatabase, useDbQuery } from '@/data/useDbQuery';
import { Field } from '@/features/newTransaction/Field';
import { AppText, Button, CategoryBadge, EmptyState, Screen } from '@/shared/components';
import { MIN_TOUCH_SIZE, fontFamily, radius, spacing, useTheme } from '@/shared/theme';

export default function EditLimitScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
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
    const failed = result.status === 'error';
    if (result.status === 'loading' && month !== null && categoryId !== null) {
      return (
        <Screen title="Limite do mês" onBack={goBack}>
          <ActivityIndicator accessibilityLabel="Carregando" color={colors.muted} />
        </Screen>
      );
    }
    return (
      <Screen title="Limite do mês" onBack={goBack}>
        <EmptyState
          icon={TriangleAlert}
          title={failed ? 'Não foi possível carregar o limite' : 'Categoria não encontrada'}
          message={failed ? 'Algo deu errado ao ler os dados do aparelho. Tente de novo.' : 'Volte ao orçamento e escolha uma categoria de despesa.'}
          actionLabel={failed ? 'Tentar de novo' : 'Voltar'}
          onAction={failed ? result.reload : goBack}
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
    <Screen title="Limite do mês" onBack={goBack}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        <View style={styles.category}>
          <CategoryBadge icon={category.icon} color={category.color} />
          <View>
            <AppText variant="heading">{category.name}</AppText>
            <AppText variant="caption" tone="muted">
              {formatMonthLabel(month)}
            </AppText>
          </View>
        </View>

        <Field label="Limite do mês" error={error ?? undefined} hint="Digite o valor; zero ou vazio remove o limite.">
          <TextInput
            accessibilityLabel="Limite do mês"
            keyboardType="number-pad"
            placeholder="R$ 0,00"
            placeholderTextColor={colors.muted}
            value={limitInCents === 0 ? '' : formatCents(limitInCents)}
            onChangeText={(text) => setTypedInCents(parseDigitsToCents(text))}
            style={[
              styles.input,
              { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text },
            ]}
          />
        </Field>

        <Button label="Salvar limite" loading={saving} onPress={() => save(limitInCents)} />

        {currentLimit !== null ? (
          <Pressable accessibilityRole="button" disabled={saving} onPress={() => save(0)} style={styles.remove}>
            <AppText variant="bodyStrong" style={{ color: colors.over }}>
              Remover limite
            </AppText>
          </Pressable>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  category: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  input: {
    minHeight: MIN_TOUCH_SIZE + spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    fontFamily: fontFamily.extrabold,
    fontSize: 24,
    fontVariant: ['tabular-nums'],
  },
  remove: { minHeight: MIN_TOUCH_SIZE, alignItems: 'center', justifyContent: 'center' },
});
