// Novo lançamento manual: validação do formulário e montagem das transações a gravar.
// Funções puras; mensagens em português porque a tela as mostra como estão.

import type { LocalDate, YearMonth } from './dates';
import { MAX_INSTALLMENTS, planInstallments } from './installments';

export type TransactionKind = 'EXPENSE' | 'INCOME';

export interface NewTransactionForm {
  kind: TransactionKind;
  /** valor digitado, em centavos e sempre positivo; o sinal vem do `kind` */
  amountInCents: number;
  description: string;
  accountId: string | null;
  /** a conta escolhida é um cartão de crédito */
  accountIsCreditCard: boolean;
  categoryId: string | null;
  /** dia da compra; nulo quando a digitação é inválida ou está incompleta */
  date: LocalDate | null;
  installments: number;
}

export type NewTransactionField = 'amount' | 'description' | 'account' | 'category' | 'date' | 'installments';
export type NewTransactionErrors = Partial<Record<NewTransactionField, string>>;

export const MAX_DESCRIPTION_LENGTH = 80;

/** Erros do formulário por campo (objeto vazio = pode salvar). */
export function validateNewTransaction(form: NewTransactionForm): NewTransactionErrors {
  const errors: NewTransactionErrors = {};
  if (!Number.isSafeInteger(form.amountInCents) || form.amountInCents <= 0) {
    errors.amount = 'Informe um valor maior que zero.';
  }
  const description = form.description.trim();
  if (description === '') errors.description = 'Informe uma descrição.';
  else if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `A descrição pode ter até ${MAX_DESCRIPTION_LENGTH} letras.`;
  }
  if (form.accountId === null) errors.account = 'Escolha a conta.';
  if (form.categoryId === null) errors.category = 'Escolha a categoria.';
  if (form.date === null) errors.date = 'Informe uma data válida, como 14/11/2026.';
  if (!Number.isInteger(form.installments) || form.installments < 1 || form.installments > MAX_INSTALLMENTS) {
    errors.installments = `Escolha de 1 a ${MAX_INSTALLMENTS} parcelas.`;
  } else if (form.installments > 1 && !(form.accountIsCreditCard && form.kind === 'EXPENSE')) {
    errors.installments = 'Só despesas no cartão de crédito podem ser parceladas.';
  } else if (form.installments > 1 && form.amountInCents < form.installments) {
    errors.installments = 'O valor é pequeno demais para tantas parcelas.';
  }
  return errors;
}

/** Uma transação pronta para gravar (o repositório acrescenta conta, categoria, grupo e IDs). */
export interface ManualTransactionDraft {
  description: string;
  /** negativo para despesa, positivo para receita */
  amountInCents: number;
  date: LocalDate;
  budgetMonth: YearMonth;
  /** nulos na compra à vista */
  installmentNumber: number | null;
  totalInstallments: number | null;
}

/**
 * Monta as transações do lançamento: uma só (à vista ou receita) ou as N parcelas, cada uma com a sua
 * data e o seu `budget_month`. Lança `RangeError` se o formulário tiver erro de validação.
 */
export function buildManualTransactions(form: NewTransactionForm): ManualTransactionDraft[] {
  const errors = validateNewTransaction(form);
  if (Object.keys(errors).length > 0 || form.date === null) {
    throw new RangeError('Formulário inválido: valide antes de montar o lançamento.');
  }
  const sign = form.kind === 'EXPENSE' ? -1 : 1;
  const description = form.description.trim();
  const parceled = form.installments > 1;
  return planInstallments(form.date, form.amountInCents, form.installments).map((plan) => ({
    description,
    amountInCents: sign * plan.amountInCents,
    date: plan.date,
    budgetMonth: plan.budgetMonth,
    installmentNumber: parceled ? plan.number : null,
    totalInstallments: parceled ? form.installments : null,
  }));
}
