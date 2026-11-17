// Compra parcelada no cartão (ADR 11): as N parcelas são gravadas na hora do lançamento,
// cada uma no seu mês do orçamento. Funções puras; o repositório só grava o plano.

import { addMonthsToDate, budgetMonth, type LocalDate, type YearMonth } from './dates';

/** Máximo de parcelas aceito num lançamento. */
export const MAX_INSTALLMENTS = 24;

export interface InstallmentPlan {
  /** 1 a N */
  number: number;
  /** valor da parcela em centavos, positivo */
  amountInCents: number;
  /** a parcela 1 tem a data da compra; a k tem essa data + (k − 1) meses */
  date: LocalDate;
  /** mês da compra + (k − 1) */
  budgetMonth: YearMonth;
}

/**
 * Divide o total em `count` parcelas inteiras em centavos. A diferença de centavo vai para a
 * primeira parcela, e a soma sempre fecha o total: (10000, 3) → [3334, 3333, 3333].
 */
export function splitInstallments(totalInCents: number, count: number): number[] {
  if (!Number.isSafeInteger(totalInCents) || totalInCents <= 0) {
    throw new RangeError(`Total deve ser um inteiro positivo em centavos: ${totalInCents}`);
  }
  if (!Number.isInteger(count) || count < 1 || count > MAX_INSTALLMENTS) {
    throw new RangeError(`Parcelas devem ser de 1 a ${MAX_INSTALLMENTS}: ${count}`);
  }
  const base = Math.floor(totalInCents / count);
  const remainder = totalInCents - base * count;
  return Array.from({ length: count }, (_, index) => (index === 0 ? base + remainder : base));
}

/** Plano completo: valor, data e mês do orçamento de cada parcela. À vista (1x) é uma parcela só. */
export function planInstallments(purchaseDate: LocalDate, totalInCents: number, count: number): InstallmentPlan[] {
  return splitInstallments(totalInCents, count).map((amountInCents, index) => ({
    number: index + 1,
    amountInCents,
    date: addMonthsToDate(purchaseDate, index),
    budgetMonth: budgetMonth(purchaseDate, index + 1),
  }));
}
