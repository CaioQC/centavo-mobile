import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';

import {
  MAX_ACCOUNT_NAME_LENGTH,
  validateNewManualAccount,
  type ManualAccountType,
  type NewManualAccountForm,
} from '@/core/accounts';
import { createManualAccount } from '@/data/repositories';
import { useDatabase } from '@/data/useDbQuery';
import { Button, MoneyField, Screen, SelectFormField, TextField, type SelectOption } from '@/shared/components';

const TYPE_OPTIONS: SelectOption[] = [
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'BANK', label: 'Conta' },
];

export default function NewAccountScreen() {
  const db = useDatabase();

  const [name, setName] = useState('');
  const [type, setType] = useState<ManualAccountType>('CASH');
  const [initialBalanceInCents, setInitialBalanceInCents] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const form: NewManualAccountForm = { name, type, initialBalanceInCents };
  const errors = submitted ? validateNewManualAccount(form) : {};

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
    <Screen title="Nova conta manual" onBack={() => router.back()} scroll form>
      <TextField
        label="Nome"
        error={errors.name}
        placeholder="Ex.: Carteira, Poupança"
        value={name}
        onChangeText={setName}
        maxLength={MAX_ACCOUNT_NAME_LENGTH}
      />

      <SelectFormField
        label="Tipo"
        sheetTitle="Tipo da conta"
        error={errors.type}
        value={type}
        options={TYPE_OPTIONS}
        onChange={(value) => setType(value === 'BANK' ? 'BANK' : 'CASH')}
      />

      <MoneyField
        label="Saldo inicial"
        error={errors.initialBalance}
        hint="Quanto há na conta hoje. Pode ficar em zero."
        valueInCents={initialBalanceInCents}
        onChangeCents={setInitialBalanceInCents}
      />

      <Button label="Salvar conta" loading={saving} onPress={save} />
    </Screen>
  );
}
