import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Landmark, TriangleAlert } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { todayLocal } from '@/core/dates';
import { formatDateInput, maskDateInput, parseDateInput } from '@/core/dateInput';
import { splitInstallments } from '@/core/installments';
import { formatCents, parseDigitsToCents } from '@/core/money';
import {
  MAX_DESCRIPTION_LENGTH,
  validateNewTransaction,
  type NewTransactionForm,
  type TransactionKind,
} from '@/core/newTransaction';
import type { Database } from '@/data/database';
import { createManualTransactions, listAccounts, listCategories } from '@/data/repositories';
import { useDatabase, useDbQuery } from '@/data/useDbQuery';
import { Field } from '@/features/newTransaction/Field';
import { KindSwitch } from '@/features/newTransaction/KindSwitch';
import { AppText, EmptyState, Screen, SelectField, type SelectOption } from '@/shared/components';
import { MIN_TOUCH_SIZE, fontFamily, radius, spacing, useTheme } from '@/shared/theme';

const INSTALLMENT_CHOICES = Array.from({ length: 12 }, (_, index) => index + 1);

export default function NewTransactionScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
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
        {result.status === 'error' ? (
          <EmptyState
            icon={TriangleAlert}
            title="Não foi possível carregar o formulário"
            message="Algo deu errado ao ler as contas do aparelho. Tente de novo."
            actionLabel="Tentar de novo"
            onAction={result.reload}
          />
        ) : (
          <ActivityIndicator accessibilityLabel="Carregando" color={colors.muted} />
        )}
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
    <Screen title="Novo lançamento" onBack={goBack}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        <KindSwitch value={kind} onChange={changeKind} />

        <Field label="Valor" error={errors.amount}>
          <TextInput
            accessibilityLabel="Valor"
            keyboardType="number-pad"
            placeholder="R$ 0,00"
            placeholderTextColor={colors.muted}
            value={amountInCents === 0 ? '' : formatCents(amountInCents)}
            onChangeText={(text) => setAmountInCents(parseDigitsToCents(text))}
            style={[styles.input, styles.amount, inputColors(colors)]}
          />
        </Field>

        <Field label="Descrição" error={errors.description}>
          <TextInput
            accessibilityLabel="Descrição"
            placeholder="Ex.: Mercado, Salário"
            placeholderTextColor={colors.muted}
            value={description}
            onChangeText={setDescription}
            maxLength={MAX_DESCRIPTION_LENGTH}
            style={[styles.input, inputColors(colors)]}
          />
        </Field>

        <Field label="Conta" error={errors.account}>
          <View style={styles.selectRow}>
            <SelectField
              label="Conta"
              sheetTitle="Escolher conta"
              value={accountId}
              options={accountOptions}
              onChange={(value) => setChosenAccountId(value)}
            />
          </View>
        </Field>

        <Field label="Categoria" error={errors.category}>
          <View style={styles.selectRow}>
            <SelectField
              label="Categoria"
              sheetTitle="Escolher categoria"
              value={categoryId}
              options={categoryOptions}
              onChange={setCategoryId}
            />
          </View>
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
              style={[styles.input, styles.dateInput, inputColors(colors)]}
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

        {canSplit ? (
          <Field label="Parcelas" error={errors.installments} hint={installmentPreview}>
            <View style={styles.selectRow}>
              <SelectField
                label="Parcelas"
                sheetTitle="Número de parcelas"
                value={String(installments)}
                options={installmentOptions}
                onChange={(value) => setChosenInstallments(Number(value ?? 1))}
              />
            </View>
          </Field>
        ) : null}

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
              Salvar lançamento
            </AppText>
          )}
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function inputColors(colors: ReturnType<typeof useTheme>['colors']) {
  return { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text };
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
  selectRow: { flexDirection: 'row' },
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
