import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { maskDateInput } from '@/core/dateInput';
import { todayLocal } from '@/core/dates';
import {
  DEFAULT_GOAL_APPEARANCE,
  GOAL_APPEARANCES,
  MAX_GOAL_NAME_LENGTH,
  validateNewGoal,
  type NewGoalForm,
} from '@/core/goals';
import { formatCents, parseDigitsToCents } from '@/core/money';
import { createGoal } from '@/data/repositories';
import { useDatabase } from '@/data/useDbQuery';
import { GoalIconPicker } from '@/features/goals/GoalIconPicker';
import { Field } from '@/features/newTransaction/Field';
import { AppText, Screen } from '@/shared/components';
import { MIN_TOUCH_SIZE, fontFamily, radius, spacing, useTheme } from '@/shared/theme';

export default function NewGoalScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const db = useDatabase();

  const [name, setName] = useState('');
  const [targetInCents, setTargetInCents] = useState(0);
  const [targetDateText, setTargetDateText] = useState('');
  const [icon, setIcon] = useState<string>(DEFAULT_GOAL_APPEARANCE.icon);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const form: NewGoalForm = { name, targetInCents, targetDateText, icon };
  const errors = submitted ? validateNewGoal(form, todayLocal()) : {};
  const inputStyle = useMemo(
    () => ({ backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }),
    [colors],
  );

  const save = async () => {
    setSubmitted(true);
    if (Object.keys(validateNewGoal(form, todayLocal())).length > 0) return;
    const color = GOAL_APPEARANCES.find((option) => option.icon === icon)?.color ?? DEFAULT_GOAL_APPEARANCE.color;
    setSaving(true);
    try {
      await createGoal(db, { name, targetInCents, targetDateText, icon, color });
      router.back();
    } catch {
      setSaving(false);
      Alert.alert('Não foi possível salvar', 'Tente de novo.');
    }
  };

  return (
    <Screen title="Nova meta" onBack={() => router.back()}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        <Field label="Nome" error={errors.name}>
          <TextInput
            accessibilityLabel="Nome"
            placeholder="Ex.: Viagem, Reserva de emergência"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
            maxLength={MAX_GOAL_NAME_LENGTH}
            style={[styles.input, inputStyle]}
          />
        </Field>

        <Field label="Valor-alvo" error={errors.target}>
          <TextInput
            accessibilityLabel="Valor-alvo"
            keyboardType="number-pad"
            placeholder="R$ 0,00"
            placeholderTextColor={colors.muted}
            value={targetInCents === 0 ? '' : formatCents(targetInCents)}
            onChangeText={(text) => setTargetInCents(parseDigitsToCents(text))}
            style={[styles.input, styles.amount, inputStyle]}
          />
        </Field>

        <Field label="Data-alvo (opcional)" error={errors.targetDate} hint="Deixe em branco se não houver prazo.">
          <TextInput
            accessibilityLabel="Data-alvo"
            keyboardType="number-pad"
            placeholder="DD/MM/AAAA"
            placeholderTextColor={colors.muted}
            value={targetDateText}
            onChangeText={(text) => setTargetDateText(maskDateInput(text))}
            maxLength={10}
            style={[styles.input, inputStyle]}
          />
        </Field>

        <Field label="Ícone" error={errors.icon}>
          <GoalIconPicker value={icon} onChange={setIcon} />
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
              Criar meta
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
  save: {
    minHeight: MIN_TOUCH_SIZE + spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
