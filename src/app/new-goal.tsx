import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';

import { todayLocal } from '@/core/dates';
import {
  DEFAULT_GOAL_APPEARANCE,
  GOAL_APPEARANCES,
  MAX_GOAL_NAME_LENGTH,
  validateNewGoal,
  type NewGoalForm,
} from '@/core/goals';
import { createGoal } from '@/data/repositories';
import { useDatabase } from '@/data/useDbQuery';
import { GoalIconPicker } from '@/features/goals/GoalIconPicker';
import { Button, DateField, Field, MoneyField, Screen, TextField } from '@/shared/components';

export default function NewGoalScreen() {
  const db = useDatabase();

  const [name, setName] = useState('');
  const [targetInCents, setTargetInCents] = useState(0);
  const [targetDateText, setTargetDateText] = useState('');
  const [icon, setIcon] = useState<string>(DEFAULT_GOAL_APPEARANCE.icon);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const form: NewGoalForm = { name, targetInCents, targetDateText, icon };
  const errors = submitted ? validateNewGoal(form, todayLocal()) : {};

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
    <Screen title="Nova meta" onBack={() => router.back()} scroll form>
      <TextField
        label="Nome"
        error={errors.name}
        placeholder="Ex.: Viagem, Reserva de emergência"
        value={name}
        onChangeText={setName}
        maxLength={MAX_GOAL_NAME_LENGTH}
      />

      <MoneyField label="Valor-alvo" error={errors.target} valueInCents={targetInCents} onChangeCents={setTargetInCents} />

      <DateField
        label="Data-alvo (opcional)"
        accessibilityLabel="Data-alvo"
        error={errors.targetDate}
        hint="Deixe em branco se não houver prazo."
        value={targetDateText}
        onChangeText={setTargetDateText}
      />

      <Field label="Ícone" error={errors.icon}>
        <GoalIconPicker value={icon} onChange={setIcon} />
      </Field>

      <Button label="Criar meta" loading={saving} onPress={save} />
    </Screen>
  );
}
