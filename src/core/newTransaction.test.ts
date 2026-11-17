import { describe, expect, it } from 'vitest';
import {
  buildManualTransactions,
  MAX_DESCRIPTION_LENGTH,
  validateNewTransaction,
  type NewTransactionForm,
} from './newTransaction';

function form(overrides: Partial<NewTransactionForm> = {}): NewTransactionForm {
  return {
    kind: 'EXPENSE',
    amountInCents: 10000,
    description: 'Mercado',
    accountId: 'conta-1',
    accountIsCreditCard: false,
    categoryId: 'cat-1',
    date: '2026-11-14',
    installments: 1,
    ...overrides,
  };
}

const creditCard = (overrides: Partial<NewTransactionForm> = {}) => form({ accountIsCreditCard: true, ...overrides });

describe('validateNewTransaction', () => {
  it('formulário completo não tem erros', () => {
    expect(validateNewTransaction(form())).toEqual({});
    expect(validateNewTransaction(form({ kind: 'INCOME' }))).toEqual({});
  });

  it('valor 0, negativo, decimal e NaN dão erro de valor', () => {
    for (const amountInCents of [0, -100, 10.5, Number.NaN]) {
      expect(validateNewTransaction(form({ amountInCents }))).toEqual({ amount: 'Informe um valor maior que zero.' });
    }
  });

  it('1 centavo é um valor válido', () => {
    expect(validateNewTransaction(form({ amountInCents: 1 }))).toEqual({});
  });

  it('descrição vazia ou só com espaços dá erro', () => {
    expect(validateNewTransaction(form({ description: '' })).description).toBe('Informe uma descrição.');
    expect(validateNewTransaction(form({ description: '     ' })).description).toBe('Informe uma descrição.');
    expect(validateNewTransaction(form({ description: '\t\n ' })).description).toBe('Informe uma descrição.');
  });

  it('descrição com 80 letras é aceita e com 81 dá erro', () => {
    expect(MAX_DESCRIPTION_LENGTH).toBe(80);
    expect(validateNewTransaction(form({ description: 'a'.repeat(80) }))).toEqual({});
    expect(validateNewTransaction(form({ description: 'a'.repeat(81) })).description).toBe(
      'A descrição pode ter até 80 letras.',
    );
  });

  it('o limite de 80 conta a descrição sem os espaços das pontas', () => {
    expect(validateNewTransaction(form({ description: `  ${'a'.repeat(80)}  ` }))).toEqual({});
    expect(validateNewTransaction(form({ description: `  ${'a'.repeat(81)}  ` })).description).toBeDefined();
  });

  it('sem conta, sem categoria e sem data dão o erro de cada campo', () => {
    expect(validateNewTransaction(form({ accountId: null }))).toEqual({ account: 'Escolha a conta.' });
    expect(validateNewTransaction(form({ categoryId: null }))).toEqual({ category: 'Escolha a categoria.' });
    expect(validateNewTransaction(form({ date: null }))).toEqual({
      date: 'Informe uma data válida, como 14/11/2026.',
    });
  });

  it('vários erros ao mesmo tempo, um por campo', () => {
    const errors = validateNewTransaction(
      form({ amountInCents: 0, description: ' ', accountId: null, categoryId: null, date: null, installments: 0 }),
    );
    expect(Object.keys(errors).sort()).toEqual(['account', 'amount', 'category', 'date', 'description', 'installments']);
  });

  it('combinação: só valor e data com erro', () => {
    const errors = validateNewTransaction(form({ amountInCents: -1, date: null }));
    expect(Object.keys(errors).sort()).toEqual(['amount', 'date']);
  });

  it('parcelas fora de 1 a 24 dão erro, mesmo no cartão', () => {
    for (const installments of [0, -1, 25, 1.5, Number.NaN]) {
      expect(validateNewTransaction(creditCard({ installments })).installments).toBe('Escolha de 1 a 24 parcelas.');
    }
  });

  it('valor pequeno demais para as parcelas dá erro de parcelas; no limite (1 centavo por parcela) passa', () => {
    expect(validateNewTransaction(creditCard({ amountInCents: 1, installments: 2 })).installments).toBe(
      'O valor é pequeno demais para tantas parcelas.',
    );
    expect(validateNewTransaction(creditCard({ amountInCents: 23, installments: 24 })).installments).toBe(
      'O valor é pequeno demais para tantas parcelas.',
    );
    expect(validateNewTransaction(creditCard({ amountInCents: 24, installments: 24 }))).toEqual({});
    expect(validateNewTransaction(creditCard({ amountInCents: 1, installments: 1 }))).toEqual({});
  });

  it('despesa no cartão pode ser parcelada de 2 a 24', () => {
    expect(validateNewTransaction(creditCard({ installments: 2 }))).toEqual({});
    expect(validateNewTransaction(creditCard({ installments: 24 }))).toEqual({});
  });

  it('receita não pode ser parcelada, nem no cartão', () => {
    expect(validateNewTransaction(creditCard({ kind: 'INCOME', installments: 3 })).installments).toBe(
      'Só despesas no cartão de crédito podem ser parceladas.',
    );
  });

  it('despesa em conta que não é cartão não pode ser parcelada', () => {
    expect(validateNewTransaction(form({ installments: 3 })).installments).toBe(
      'Só despesas no cartão de crédito podem ser parceladas.',
    );
  });

  it('1x vale em qualquer conta e tipo', () => {
    for (const kind of ['EXPENSE', 'INCOME'] as const) {
      for (const accountIsCreditCard of [true, false]) {
        expect(validateNewTransaction(form({ kind, accountIsCreditCard, installments: 1 }))).toEqual({});
      }
    }
  });
});

describe('buildManualTransactions', () => {
  it('despesa à vista: valor negativo, parcelas nulas, data e mês da compra', () => {
    expect(buildManualTransactions(form({ amountInCents: 5990 }))).toEqual([
      {
        description: 'Mercado',
        amountInCents: -5990,
        date: '2026-11-14',
        budgetMonth: '2026-11',
        installmentNumber: null,
        totalInstallments: null,
      },
    ]);
  });

  it('receita: valor positivo', () => {
    const [income] = buildManualTransactions(form({ kind: 'INCOME', amountInCents: 250000, description: 'Salário' }));
    expect(income).toMatchObject({ amountInCents: 250000, installmentNumber: null, totalInstallments: null });
  });

  it('despesa no cartão em 1x também é à vista (installmentNumber nulo)', () => {
    const drafts = buildManualTransactions(creditCard({ installments: 1 }));
    expect(drafts).toHaveLength(1);
    expect(drafts[0]!.installmentNumber).toBeNull();
    expect(drafts[0]!.totalInstallments).toBeNull();
  });

  it('3x no cartão: parcelas 1/3 a 3/3, meses e datas de cada uma', () => {
    const drafts = buildManualTransactions(creditCard({ amountInCents: 10000, installments: 3, date: '2026-11-30' }));
    expect(drafts.map((d) => d.installmentNumber)).toEqual([1, 2, 3]);
    expect(drafts.every((d) => d.totalInstallments === 3)).toBe(true);
    expect(drafts.map((d) => d.amountInCents)).toEqual([-3334, -3333, -3333]);
    expect(drafts.map((d) => d.date)).toEqual(['2026-11-30', '2026-12-30', '2027-01-30']);
    expect(drafts.map((d) => d.budgetMonth)).toEqual(['2026-11', '2026-12', '2027-01']);
  });

  it('a soma das parcelas é exatamente -total', () => {
    for (const [amountInCents, installments] of [[10000, 3], [99999, 7], [1234567, 24], [100, 12]] as const) {
      const drafts = buildManualTransactions(creditCard({ amountInCents, installments }));
      expect(drafts.reduce((total, d) => total + d.amountInCents, 0)).toBe(-amountInCents);
    }
  });

  it('descrição sai com trim, em todas as parcelas', () => {
    const drafts = buildManualTransactions(creditCard({ description: '  Notebook  ', installments: 2 }));
    expect(drafts.map((d) => d.description)).toEqual(['Notebook', 'Notebook']);
  });

  it('lança RangeError se o formulário for inválido', () => {
    expect(() => buildManualTransactions(form({ amountInCents: 0 }))).toThrow(RangeError);
    expect(() => buildManualTransactions(form({ description: '   ' }))).toThrow(RangeError);
    expect(() => buildManualTransactions(form({ date: null }))).toThrow(RangeError);
    expect(() => buildManualTransactions(form({ installments: 3 }))).toThrow(RangeError);
    expect(() => buildManualTransactions(creditCard({ kind: 'INCOME', installments: 3 }))).toThrow(RangeError);
    expect(() => buildManualTransactions(creditCard({ installments: 25 }))).toThrow(RangeError);
  });

  it('valor menor que o nº de parcelas é recusado (nenhuma parcela de 0 centavo)', () => {
    expect(() => buildManualTransactions(creditCard({ amountInCents: 1, installments: 2 }))).toThrow(RangeError);
    // no limite (1 centavo por parcela) funciona
    const drafts = buildManualTransactions(creditCard({ amountInCents: 2, installments: 2 }));
    expect(drafts.map((d) => d.amountInCents)).toEqual([-1, -1]);
  });
});
