import { addMonths, budgetMonth, monthOf, type LocalDate } from '../../core/dates';

/** Quantos meses cada banco fictício cobre: o mês de referência e os dois anteriores. */
export const BANK_MONTHS = 3;

export interface BankTransaction {
  accountExternalId: string;
  /** ID da transação no banco fictício; é a chave que impede duplicar na importação */
  externalId: string;
  description: string;
  /** negativo para despesa */
  amountInCents: number;
  date: LocalDate;
  categoryId: string;
  installmentNumber: number | null;
  totalInstallments: number | null;
}

/** Lançamento que se repete todo mês no roteiro de um banco. */
export interface BankTemplate {
  /** identifica o lançamento dentro do banco (entra no `external_id`) */
  slug: string;
  /** `externalId` da conta onde o lançamento cai */
  account: string;
  description: string;
  /** valor em centavos, positivo; o sinal vem de `income` */
  amountInCents: number;
  income?: boolean;
  categoryId: string;
  /** dias do mês em que acontece (todos ≤ 28, valem em qualquer mês) */
  days: number[];
  /** se o valor varia de mês a mês e de ocorrência a ocorrência */
  varies?: boolean;
  /** só em alguns meses, em relação ao mês de referência (0 = corrente, -1 = anterior...) */
  onlyOffsets?: number[];
}

/** Compra parcelada que o banco lança de uma vez (parcelas futuras com data futura; ADR 11). */
export interface BankInstallmentPurchase {
  slug: string;
  account: string;
  description: string;
  totalInCents: number;
  count: number;
  categoryId: string;
  /** dia da compra e das parcelas (≤ 28) */
  day: number;
  /** mês da compra em relação ao mês de referência */
  offset: number;
}

/** Tudo que um banco fictício "tem a dizer": lançamentos mensais e compras parceladas. */
export interface BankScript {
  templates: readonly BankTemplate[];
  installmentPurchases: readonly BankInstallmentPurchase[];
}

/** Variação determinística (sem Math.random): os mesmos dados a cada importação. */
function vary(base: number, seed: number): number {
  const steps = ((seed * 7919) % 11) - 5; // -5 a +5
  return base + steps * Math.round(base / 50);
}

const pad = (day: number) => String(day).padStart(2, '0');

/**
 * Transações fictícias dos últimos três meses até `today` (o dia de referência): nada com data depois
 * dele, exceto as parcelas futuras das compras parceladas. Determinístico: mesmo roteiro e mesmo
 * `today`, mesma saída.
 */
export function generateBankTransactions(script: BankScript, today: LocalDate): BankTransaction[] {
  const thisMonth = monthOf(today);
  const result: BankTransaction[] = [];

  for (let offset = -(BANK_MONTHS - 1); offset <= 0; offset += 1) {
    const month = addMonths(thisMonth, offset);
    script.templates.forEach((template, templateIndex) => {
      if (template.onlyOffsets && !template.onlyOffsets.includes(offset)) return;
      template.days.forEach((day, occurrence) => {
        const date = `${month}-${pad(day)}`;
        if (date > today) return;
        const absolute = template.varies
          ? vary(template.amountInCents, offset * 101 + templateIndex * 13 + occurrence * 3 + 400)
          : template.amountInCents;
        result.push({
          accountExternalId: template.account,
          externalId: `${month}-${template.slug}-${occurrence + 1}`,
          description: template.description,
          amountInCents: template.income ? absolute : -absolute,
          date,
          categoryId: template.categoryId,
          installmentNumber: null,
          totalInstallments: null,
        });
      });
    });
  }

  for (const purchase of script.installmentPurchases) {
    const purchaseMonth = addMonths(thisMonth, purchase.offset);
    const purchaseDate = `${purchaseMonth}-${pad(purchase.day)}`;
    const base = Math.floor(purchase.totalInCents / purchase.count);
    for (let number = 1; number <= purchase.count; number += 1) {
      const installmentMonth = budgetMonth(purchaseDate, number);
      result.push({
        accountExternalId: purchase.account,
        externalId: `${purchaseMonth}-${purchase.slug}-${number}`,
        description: purchase.description,
        // a diferença de centavo fica na primeira parcela
        amountInCents: -(number === 1 ? purchase.totalInCents - base * (purchase.count - 1) : base),
        date: `${installmentMonth}-${pad(purchase.day)}`,
        categoryId: purchase.categoryId,
        installmentNumber: number,
        totalInstallments: purchase.count,
      });
    }
  }

  return result;
}
