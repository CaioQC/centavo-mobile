import { describe, expect, it } from 'vitest';

import { monthOf } from '../../core/dates';
import { SAMPLE_ACCOUNTS } from './catalog';
import { generateSampleTransactions } from './generate';

const TODAY = '2026-11-14';
const CATEGORY_IDS = [
  'housing', 'food', 'transport', 'health', 'leisure', 'shopping', 'subscriptions', 'education',
  'other', 'salary', 'other-income',
];

describe('generateSampleTransactions', () => {
  const items = generateSampleTransactions(TODAY);

  it('cobre três meses (mais a parcela futura) e é determinístico', () => {
    const months = new Set(items.map((item) => monthOf(item.date)));
    expect(months).toEqual(new Set(['2026-09', '2026-10', '2026-11', '2026-12']));
    expect(generateSampleTransactions(TODAY)).toEqual(items);
  });

  it('não tem external_id repetido por conta', () => {
    const keys = items.map((item) => `${item.accountExternalId}/${item.externalId}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('usa só contas e categorias que existem', () => {
    const accounts = SAMPLE_ACCOUNTS.map((account) => account.externalId);
    for (const item of items) {
      expect(accounts).toContain(item.accountExternalId);
      expect(CATEGORY_IDS).toContain(item.categoryId);
    }
  });

  it('não tem nada depois de hoje, exceto a parcela futura da compra parcelada', () => {
    const future = items.filter((item) => item.date > TODAY);
    expect(future.map((item) => item.description)).toEqual(['Notebook TechMais']);
    expect(future[0]?.installmentNumber).toBe(3);
  });

  it('a compra parcelada soma o total e fica uma parcela por mês', () => {
    const parcels = items.filter((item) => item.totalInstallments === 3);
    expect(parcels.map((item) => item.installmentNumber)).toEqual([1, 2, 3]);
    expect(parcels.map((item) => monthOf(item.date))).toEqual(['2026-10', '2026-11', '2026-12']);
    expect(parcels.reduce((sum, item) => sum + item.amountInCents, 0)).toBe(-150000);
  });

  it('receitas são positivas e despesas negativas', () => {
    for (const item of items) {
      const isIncome = item.categoryId === 'salary' || item.categoryId === 'other-income';
      expect(item.amountInCents > 0).toBe(isIncome);
    }
  });

  it('no dia 1º do mês só há o que já aconteceu', () => {
    const early = generateSampleTransactions('2026-11-01');
    const late = early.filter((item) => item.date > '2026-11-01' && item.totalInstallments === null);
    expect(late).toEqual([]);
  });

  it('funciona na virada do ano', () => {
    const jan = generateSampleTransactions('2027-01-20');
    expect(new Set(jan.map((item) => monthOf(item.date)))).toContain('2026-11');
  });
});
