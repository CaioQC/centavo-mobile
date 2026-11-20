import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Target, TriangleAlert } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatDateInput, maskDateInput, parseDateInput } from '@/core/dateInput';
import { todayLocal } from '@/core/dates';
import { validateContribution, type ContributionKind } from '@/core/goals';
import { formatCents, parseDigitsToCents } from '@/core/money';
import type { Database } from '@/data/database';
import { addContribution, ContributionExceedsBalanceError, getGoal } from '@/data/repositories';
import { useDatabase, useDbQuery } from '@/data/useDbQuery';
import { Field } from '@/features/newTransaction/Field';
import { AppText, EmptyState, Screen } from '@/shared/components';
import { MIN_TOUCH_SIZE, fontFamily, radius, spacing, useTheme } from '@/shared/theme';

export default function GoalContributionScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
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
  const inputStyle = useMemo(
    () => ({ backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }),
    [colors],
  );

  const isWithdrawal = kind === 'WITHDRAWAL';
  const title = isWithdrawal ? 'Retirar da meta' : 'Novo aporte';
  const goBack = () => router.back();
  const goal = result.data ?? null;

  if (!goal) {
    const failed = result.status === 'error';
    if (result.status === 'loading') {
      return (
        <Screen title={title} onBack={goBack}>
          <ActivityIndicator accessibilityLabel="Carregando" color={colors.muted} />
        </Screen>
      );
    }
    return (
      <Screen title={title} onBack={goBack}>
        <EmptyState
          icon={failed ? TriangleAlert : Target}
          title={failed ? 'Não foi possível carregar a meta' : 'Meta não encontrada'}
          message={failed ? 'Algo deu errado ao ler os dados do aparelho. Tente de novo.' : 'Volte às metas e escolha outra.'}
          actionLabel={failed ? 'Tentar de novo' : 'Voltar'}
          onAction={failed ? result.reload : goBack}
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
    <Screen title={title} onBack={goBack}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        <View>
          <AppText variant="heading">{goal.name}</AppText>
          <AppText variant="captionMoney" tone="muted">
            Guardado: {formatCents(Math.max(goal.savedInCents, 0))}
          </AppText>
        </View>

        <Field label="Valor" error={errors.amount}>
          <TextInput
            accessibilityLabel="Valor"
            keyboardType="number-pad"
            placeholder="R$ 0,00"
            placeholderTextColor={colors.muted}
            value={amountInCents === 0 ? '' : formatCents(amountInCents)}
            onChangeText={(text) => setAmountInCents(parseDigitsToCents(text))}
            style={[styles.input, styles.amount, inputStyle]}
          />
        </Field>

        <Field label="Data" error={errors.date}>
          <View style={styles.dateRow}>
            <TextInput
              accessibilityLabel="Data"
              keyboardType="number-pad"
              placeholder="DD/MM/AAAA"
              placeholderTextColor={colors.muted}
              value={dateText}
              onChangeText={(text) => setDateText(maskDateInput(text))}
              maxLength={10}
              style={[styles.input, styles.dateInput, inputStyle]}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Usar a data de hoje"
              onPress={() => setDateText(formatDateInput(todayLocal()))}
              style={styles.today}
            >
              <AppText tone="accent" variant="bodyStrong">
                Hoje
              </AppText>
            </Pressable>
          </View>
        </Field>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: saving }}
          disabled={saving}
          onPress={save}
          style={[styles.save, { backgroundColor: colors.accent }]}
        >
          {saving ? (
            <ActivityIndicator accessibilityLabel="Salvando" color={colors.onAccent} />
          ) : (
            <AppText variant="bodyStrong" style={{ color: colors.onAccent }}>
              {isWithdrawal ? 'Registrar retirada' : 'Registrar aporte'}
            </AppText>
          )}
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  input: {
    minHeight: MIN_TOUCH_SIZE + spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    fontFamily: fontFamily.regular,
    fontSize: 15,
  },
  amount: { fontFamily: fontFamily.extrabold, fontSize: 24, fontVariant: ['tabular-nums'] },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dateInput: { flex: 1 },
  today: { minHeight: MIN_TOUCH_SIZE, minWidth: MIN_TOUCH_SIZE, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
  save: {
    minHeight: MIN_TOUCH_SIZE + spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
