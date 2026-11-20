import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { Landmark } from 'lucide-react-native';

import { todayLocal } from '@/core/dates';
import { formatDateInput, parseDateInput } from '@/core/dateInput';
import { splitInstallments } from '@/core/installments';
import { formatCents } from '@/core/money';
import {
  MAX_DESCRIPTION_LENGTH,
  validateNewTransaction,
  type NewTransactionForm,
  type TransactionKind,
} from '@/core/newTransaction';
import type { Database } from '@/data/database';
import { createManualTransactions, listAccounts, listCategories } from '@/data/repositories';
import { useDatabase, useDbQuery } from '@/data/useDbQuery';
import {
  Button,
  DateField,
  EmptyState,
  MoneyField,
  QueryFallback,
  Screen,
  SegmentedControl,
  SelectFormField,
  TextField,
  type SegmentOption,
  type SelectOption,
} from '@/shared/components';

const KIND_OPTIONS: SegmentOption<TransactionKind>[] = [
  { value: 'EXPENSE', label: 'Despesa' },
  { value: 'INCOME', label: 'Receita' },
];

const INSTALLMENT_CHOICES = Array.from({ length: 12 }, (_, index) => index + 1);

export default function NewTransactionScreen() {
  const db = useDatabase();

  const load = useCallback(async (database: Database) => {
    const [accounts, categories] = await Promise.all([listAccounts(database), listCategories(database)]);
    return { accounts, categories };
  }, []);
  const result = useDbQuery(load);
  const accounts = useMemo(() => result.data?.accounts ?? [], [result.data]);
  const categories = useMemo(() => result.data?.categories ?? [], [result.data]);

  const [kind, setKind] = useState<TransactionKind>('EXPENSE');
  const [amountInCents, setAmountInCents] = useState(0);
  const [description, setDescription] = useState('');
  const [chosenAccountId, setChosenAccountId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [dateText, setDateText] = useState(() => formatDateInput(todayLocal()));
  const [chosenInstallments, setChosenInstallments] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  // Conta padrão: a conta corrente (ou a primeira da lista); o usuário pode trocar.
  const accountId =
    chosenAccountId ?? (accounts.find((account) => account.type === 'BANK') ?? accounts[0])?.id ?? null;
  const account = accounts.find((item) => item.id === accountId);
  const accountIsCreditCard = account?.type === 'CREDIT_CARD';
  const canSplit = accountIsCreditCard && kind === 'EXPENSE';
  const installments = canSplit ? chosenInstallments : 1;

  const form: NewTransactionForm = {
    kind,
    amountInCents,
    description,
    accountId,
    accountIsCreditCard,
    categoryId,
    date: parseDateInput(dateText),
    installments,
  };
  const errors = submitted ? validateNewTransaction(form) : {};

  const accountOptions = useMemo<SelectOption[]>(
    () => accounts.map((item) => ({ value: item.id, label: item.name })),
    [accounts],
  );
  const categoryOptions = useMemo<SelectOption[]>(() => {
    const options: SelectOption[] = categories
      .filter((category) => category.kind === kind)
      .map((category) => ({
        value: category.id,
        label: category.name,
        categoryIcon: category.icon,
        categoryColor: category.color,
      }));
    return categoryId === null ? [{ value: null, label: 'Escolher categoria' }, ...options] : options;
  }, [categories, kind, categoryId]);
  const installmentOptions = useMemo<SelectOption[]>(
    () => INSTALLMENT_CHOICES.map((count) => ({ value: String(count), label: count === 1 ? 'À vista' : `${count}x` })),
    [],
  );

  const installmentPreview = useMemo(() => {
    if (installments < 2 || amountInCents < installments) return undefined;
    const parts = splitInstallments(amountInCents, installments);
    const first = parts[0] as number;
    const others = parts[1] as number;
    return first === others
      ? `${installments}x de ${formatCents(first)}`
      : `1ª parcela de ${formatCents(first)} e ${installments - 1}x de ${formatCents(others)}`;
  }, [amountInCents, installments]);

  const changeKind = (next: TransactionKind) => {
    if (next === kind) return;
    setKind(next);
    setCategoryId(null); // as categorias de despesa e de receita são diferentes
  };

  const save = async () => {
    setSubmitted(true);
    if (Object.keys(validateNewTransaction(form)).length > 0) return;
    setSaving(true);
    try {
      await createManualTransactions(db, form);
      router.back();
    } catch {
      setSaving(false);
      Alert.alert('Não foi possível salvar', 'Tente de novo.');
    }
  };

  const goBack = () => router.back();

  if (!result.data) {
    return (
      <Screen title="Novo lançamento" onBack={goBack}>
        <QueryFallback
          status={result.status}
          errorTitle="Não foi possível carregar o formulário"
          errorMessage="Algo deu errado ao ler as contas do aparelho. Tente de novo."
          onRetry={result.reload}
        />
      </Screen>
    );
  }

  if (accounts.length === 0) {
    return (
      <Screen title="Novo lançamento" onBack={goBack}>
        <EmptyState
          icon={Landmark}
          title="Nenhuma conta ainda"
          message="O app precisa de ao menos uma conta para registrar despesas e receitas."
          actionLabel="Voltar"
          onAction={goBack}
        />
      </Screen>
    );
  }

  return (
    <Screen title="Novo lançamento" onBack={goBack} scroll form>
      <SegmentedControl options={KIND_OPTIONS} value={kind} onChange={changeKind} />

      <MoneyField label="Valor" error={errors.amount} valueInCents={amountInCents} onChangeCents={setAmountInCents} />

      <TextField
        label="Descrição"
        error={errors.description}
        placeholder="Ex.: Mercado, Salário"
        value={description}
        onChangeText={setDescription}
        maxLength={MAX_DESCRIPTION_LENGTH}
      />

      <SelectFormField
        label="Conta"
        sheetTitle="Escolher conta"
        error={errors.account}
        value={accountId}
        options={accountOptions}
        onChange={(value) => setChosenAccountId(value)}
      />

      <SelectFormField
        label="Categoria"
        sheetTitle="Escolher categoria"
        error={errors.category}
        value={categoryId}
        options={categoryOptions}
        onChange={setCategoryId}
      />

      <DateField label="Data" error={errors.date} value={dateText} onChangeText={setDateText} showToday />

      {canSplit ? (
        <SelectFormField
          label="Parcelas"
          sheetTitle="Número de parcelas"
          error={errors.installments}
          hint={installmentPreview}
          value={String(installments)}
          options={installmentOptions}
          onChange={(value) => setChosenInstallments(Number(value ?? 1))}
        />
      ) : null}

      <Button label="Salvar lançamento" loading={saving} onPress={save} />
    </Screen>
  );
}
