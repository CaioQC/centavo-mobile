import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  MAX_ACCOUNT_NAME_LENGTH,
  validateNewManualAccount,
  type ManualAccountType,
  type NewManualAccountForm,
} from '@/core/accounts';
import { formatCents, parseDigitsToCents } from '@/core/money';
import { createManualAccount } from '@/data/repositories';
import { useDatabase } from '@/data/useDbQuery';
import { Field } from '@/features/newTransaction/Field';
import { Button, Screen, SelectField, type SelectOption } from '@/shared/components';
import { MIN_TOUCH_SIZE, fontFamily, radius, spacing, useTheme } from '@/shared/theme';

const TYPE_OPTIONS: SelectOption[] = [
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'BANK', label: 'Conta' },
];

export default function NewAccountScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const db = useDatabase();

  const [name, setName] = useState('');
  const [type, setType] = useState<ManualAccountType>('CASH');
  const [initialBalanceInCents, setInitialBalanceInCents] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const form: NewManualAccountForm = { name, type, initialBalanceInCents };
  const errors = submitted ? validateNewManualAccount(form) : {};
  const inputStyle = useMemo(
    () => ({ backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }),
    [colors],
  );

  const save = async () => {
    setSubmitted(true);
    if (Object.keys(validateNewManualAccount(form)).length > 0) return;
    setSaving(true);
    try {
      await createManualAccount(db, form);
      router.back();
    } catch {
      setSaving(false);
      Alert.alert('Não foi possível salvar', 'Tente de novo.');
    }
  };

  return (
    <Screen title="Nova conta manual" onBack={() => router.back()}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        <Field label="Nome" error={errors.name}>
          <TextInput
            accessibilityLabel="Nome"
            placeholder="Ex.: Carteira, Poupança"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
            maxLength={MAX_ACCOUNT_NAME_LENGTH}
            style={[styles.input, inputStyle]}
          />
        </Field>

        <Field label="Tipo" error={errors.type}>
          <View style={styles.row}>
            <SelectField
              label="Tipo"
              sheetTitle="Tipo da conta"
              value={type}
              options={TYPE_OPTIONS}
              onChange={(value) => setType(value === 'BANK' ? 'BANK' : 'CASH')}
            />
          </View>
        </Field>

        <Field label="Saldo inicial" error={errors.initialBalance} hint="Quanto há na conta hoje. Pode ficar em zero.">
          <TextInput
            accessibilityLabel="Saldo inicial"
            keyboardType="number-pad"
            placeholder="R$ 0,00"
            placeholderTextColor={colors.muted}
            value={initialBalanceInCents === 0 ? '' : formatCents(initialBalanceInCents)}
            onChangeText={(text) => setInitialBalanceInCents(parseDigitsToCents(text))}
            style={[styles.input, styles.amount, inputStyle]}
          />
        </Field>

        <Button label="Salvar conta" loading={saving} onPress={save} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  row: { flexDirection: 'row' },
  input: {
    minHeight: MIN_TOUCH_SIZE + spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    fontFamily: fontFamily.regular,
    fontSize: 15,
  },
  amount: { fontFamily: fontFamily.extrabold, fontSize: 24, fontVariant: ['tabular-nums'] },
});
