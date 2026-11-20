import { describe, expect, it } from 'vitest';

import { monthOf } from '../../core/dates';
import { BANK_CATALOG, findBank } from './catalog';
import { generateBankTransactions } from './generate';

const TODAY = '2026-11-14';
const CATEGORY_IDS = [
  'housing', 'food', 'transport', 'health', 'leisure', 'shopping', 'subscriptions', 'education',
  'other', 'salary', 'other-income',
];
const INCOME_CATEGORIES = ['salary', 'other-income'];
// Marcas reais que um banco fictício não pode lembrar (CLAUDE.md): comparação sem acento nem caixa.
const REAL_BRANDS = [
  'nubank', 'itau', 'bradesco', 'santander', 'caixa', 'banco do brasil', 'inter', 'c6', 'picpay',
  'neon', 'next', 'original', 'sicoob', 'sicredi', 'mercado pago', 'xp', 'btg', 'safra', 'pagbank', 'folha',
];
const plain = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

describe('catálogo de bancos fictícios', () => {
  it('tem bancos com chave, nome e âncora únicos e o Jabuticaba dos dados de exemplo', () => {
    expect(BANK_CATALOG.length).toBeGreaterThanOrEqual(4);
    for (const field of ['key', 'name', 'anchorSettingKey'] as const) {
      const values = BANK_CATALOG.map((bank) => bank[field]);
      expect(new Set(values).size).toBe(values.length);
    }
    expect(findBank('jabuticaba')?.name).toBe('Banco Jabuticaba');
    expect(findBank('nao-existe')).toBeNull();
  });

  it('não imita a marca de nenhuma instituição real', () => {
    for (const bank of BANK_CATALOG) {
      const words = plain(`${bank.name} ${bank.tagline}`).split(/[^a-z0-9]+/);
      for (const brand of REAL_BRANDS) {
        const brandWords = brand.split(' ');
        const found = brandWords.length === 1 ? words.includes(brand) : plain(bank.name).includes(brand);
        expect(found, `${bank.name} lembra "${brand}"`).toBe(false);
      }
    }
  });

  it('cada banco tem contas com ID único e limite só no cartão', () => {
    for (const bank of BANK_CATALOG) {
      expect(bank.accounts.length).toBeGreaterThan(0);
      const ids = bank.accounts.map((account) => account.externalId);
      expect(new Set(ids).size).toBe(ids.length);
      for (const account of bank.accounts) {
        expect(account.name.trim()).not.toBe('');
        expect(account.creditLimitInCents !== null).toBe(account.type === 'CREDIT_CARD');
      }
    }
  });
});

describe.each(BANK_CATALOG.map((bank) => [bank.name, bank] as const))('transações de %s', (_name, bank) => {
  const items = generateBankTransactions(bank.script, TODAY);

  it('é determinístico: mesmo dia de referência, mesma saída', () => {
    expect(generateBankTransactions(bank.script, TODAY)).toEqual(items);
    expect(items.length).toBeGreaterThan(10);
  });

  it('cobre os três meses até o dia de referência', () => {
    const months = new Set(items.map((item) => monthOf(item.date)));
    for (const month of ['2026-09', '2026-10', '2026-11']) expect(months).toContain(month);
  });

  it('não tem external_id repetido por conta', () => {
    const keys = items.map((item) => `${item.accountExternalId}/${item.externalId}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('usa só contas e categorias que existem', () => {
    const accounts = bank.accounts.map((account) => account.externalId);
    for (const item of items) {
      expect(accounts).toContain(item.accountExternalId);
      expect(CATEGORY_IDS).toContain(item.categoryId);
    }
  });

  it('receitas são positivas e despesas negativas', () => {
    for (const item of items) expect(item.amountInCents > 0).toBe(INCOME_CATEGORIES.includes(item.categoryId));
  });

  it('só as parcelas das compras parceladas têm data depois do dia de referência', () => {
    for (const item of items.filter((entry) => entry.date > TODAY)) {
      expect(item.installmentNumber).not.toBeNull();
    }
  });

  it('compra parcelada soma o total, com uma parcela por mês e todas as parcelas', () => {
    for (const purchase of bank.script.installmentPurchases) {
      const parcels = items.filter((item) => item.externalId.includes(`-${purchase.slug}-`));
      expect(parcels.map((item) => item.installmentNumber)).toEqual(
        Array.from({ length: purchase.count }, (_, index) => index + 1),
      );
      expect(new Set(parcels.map((item) => monthOf(item.date))).size).toBe(purchase.count);
      expect(parcels.reduce((sum, item) => sum + item.amountInCents, 0)).toBe(-purchase.totalInCents);
    }
  });

  it('mudar o dia de referência dentro do mês só adianta ou atrasa lançamentos, sem mudar valores', () => {
    const early = generateBankTransactions(bank.script, '2026-11-20');
    const byKey = new Map(items.map((item) => [`${item.accountExternalId}/${item.externalId}`, item]));
    for (const item of early) {
      const same = byKey.get(`${item.accountExternalId}/${item.externalId}`);
      if (same) expect(same).toEqual(item);
    }
  });

  it('funciona na virada do ano', () => {
    const january = generateBankTransactions(bank.script, '2027-01-20');
    expect(new Set(january.map((item) => monthOf(item.date)))).toContain('2026-11');
  });
});
