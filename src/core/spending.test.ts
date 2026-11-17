import { describe, expect, it } from 'vitest';
import { budgetUsage, topSpendingCategories, totalSpending, type SpendingItem } from './spending';

const expenseCategories = new Set(['mercado', 'lazer', 'transporte']);
const tx = (amountInCents: number, categoryId: string | null): SpendingItem => ({ amountInCents, categoryId });

describe('totalSpending', () => {
  it('sem transações o gasto é zero', () => {
    expect(totalSpending([], expenseCategories)).toBe(0);
  });

  it('soma as despesas como valor positivo', () => {
    expect(totalSpending([tx(-10000, 'mercado'), tx(-2550, 'lazer')], expenseCategories)).toBe(12550);
  });

  it('estorno em categoria de despesa abate o gasto', () => {
    expect(totalSpending([tx(-10000, 'mercado'), tx(3000, 'mercado')], expenseCategories)).toBe(7000);
  });

  it('receita (categoria fora das de despesa) não entra no gasto', () => {
    expect(totalSpending([tx(-10000, 'mercado'), tx(500000, 'salario')], expenseCategories)).toBe(10000);
  });

  it('valor positivo sem categoria fica de fora', () => {
    expect(totalSpending([tx(-10000, 'mercado'), tx(2000, null)], expenseCategories)).toBe(10000);
  });

  it('despesa sem categoria conta no gasto', () => {
    expect(totalSpending([tx(-4000, null)], expenseCategories)).toBe(4000);
  });

  it('transação de valor zero não pesa', () => {
    expect(totalSpending([tx(0, 'mercado'), tx(-100, 'mercado')], expenseCategories)).toBe(100);
  });

  it('o gasto nunca é negativo (estorno maior que a despesa)', () => {
    expect(totalSpending([tx(-1000, 'mercado'), tx(5000, 'mercado')], expenseCategories)).toBe(0);
    expect(totalSpending([tx(5000, 'mercado')], expenseCategories)).toBe(0);
  });

  it('estorno em uma categoria abate o gasto total, mesmo de outra categoria', () => {
    expect(totalSpending([tx(-10000, 'mercado'), tx(4000, 'lazer')], expenseCategories)).toBe(6000);
  });
});

describe('topSpendingCategories', () => {
  it('sem transações, lista vazia', () => {
    expect(topSpendingCategories([], expenseCategories)).toEqual([]);
  });

  it('ordena da maior para a menor e agrupa por categoria', () => {
    const result = topSpendingCategories(
      [tx(-1000, 'lazer'), tx(-5000, 'mercado'), tx(-2000, 'lazer'), tx(-1500, 'transporte')],
      expenseCategories,
    );
    expect(result).toEqual([
      { categoryId: 'mercado', totalInCents: 5000 },
      { categoryId: 'lazer', totalInCents: 3000 },
      { categoryId: 'transporte', totalInCents: 1500 },
    ]);
  });

  it('limite padrão é 3', () => {
    const items = [tx(-4, 'mercado'), tx(-3, 'lazer'), tx(-2, 'transporte'), tx(-1, 'saude')];
    expect(topSpendingCategories(items, expenseCategories)).toHaveLength(3);
  });

  it('respeita o limit informado, inclusive 0 e maior que o total', () => {
    const items = [tx(-3, 'mercado'), tx(-2, 'lazer')];
    expect(topSpendingCategories(items, expenseCategories, 1)).toEqual([{ categoryId: 'mercado', totalInCents: 3 }]);
    expect(topSpendingCategories(items, expenseCategories, 0)).toEqual([]);
    expect(topSpendingCategories(items, expenseCategories, 10)).toHaveLength(2);
  });

  it('limit negativo não quebra e devolve lista vazia', () => {
    expect(topSpendingCategories([tx(-3, 'mercado')], expenseCategories, -2)).toEqual([]);
  });

  it('empate no valor é ordenado pelo id da categoria', () => {
    const items = [tx(-1000, 'transporte'), tx(-1000, 'lazer'), tx(-1000, 'mercado')];
    expect(topSpendingCategories(items, expenseCategories).map((c) => c.categoryId)).toEqual([
      'lazer',
      'mercado',
      'transporte',
    ]);
  });

  it('transações sem categoria (null) aparecem no ranking', () => {
    const result = topSpendingCategories([tx(-9000, null), tx(-1000, null), tx(-2000, 'mercado')], expenseCategories);
    expect(result).toEqual([
      { categoryId: null, totalInCents: 10000 },
      { categoryId: 'mercado', totalInCents: 2000 },
    ]);
  });

  it('estorno abate o total da própria categoria', () => {
    const result = topSpendingCategories([tx(-10000, 'mercado'), tx(2500, 'mercado')], expenseCategories);
    expect(result).toEqual([{ categoryId: 'mercado', totalInCents: 7500 }]);
  });

  it('categoria com só estorno (total negativo) ou totalmente estornada não entra', () => {
    expect(topSpendingCategories([tx(3000, 'mercado')], expenseCategories)).toEqual([]);
    expect(topSpendingCategories([tx(-3000, 'mercado'), tx(3000, 'mercado')], expenseCategories)).toEqual([]);
    expect(topSpendingCategories([tx(-1000, 'mercado'), tx(4000, 'mercado')], expenseCategories)).toEqual([]);
  });

  it('receita fora das categorias de despesa não entra', () => {
    expect(topSpendingCategories([tx(500000, 'salario'), tx(1000, null)], expenseCategories)).toEqual([]);
  });
});

describe('budgetUsage', () => {
  it('limite zero ou negativo: sem orçamento (NONE), mesmo com gasto', () => {
    expect(budgetUsage(5000, 0)).toEqual({ status: 'NONE', ratio: 0, percent: 0 });
    expect(budgetUsage(0, 0)).toEqual({ status: 'NONE', ratio: 0, percent: 0 });
    expect(budgetUsage(5000, -100).status).toBe('NONE');
  });

  it('limite NaN ou infinito: NONE', () => {
    expect(budgetUsage(100, Number.NaN).status).toBe('NONE');
    expect(budgetUsage(100, Infinity).status).toBe('NONE');
  });

  it('gasto zero: OK com 0%', () => {
    expect(budgetUsage(0, 10000)).toEqual({ status: 'OK', ratio: 0, percent: 0 });
  });

  it('79% ainda é OK', () => {
    const usage = budgetUsage(7900, 10000);
    expect(usage.status).toBe('OK');
    expect(usage.percent).toBe(79);
  });

  it('exatamente 80% vira WARNING', () => {
    const usage = budgetUsage(8000, 10000);
    expect(usage.status).toBe('WARNING');
    expect(usage.percent).toBe(80);
    expect(usage.ratio).toBeCloseTo(0.8);
  });

  it('1 centavo antes dos 80% ainda é OK', () => {
    expect(budgetUsage(7999, 10000).status).toBe('OK');
  });

  it('exatamente 100% ainda é WARNING', () => {
    const usage = budgetUsage(10000, 10000);
    expect(usage.status).toBe('WARNING');
    expect(usage.percent).toBe(100);
    expect(usage.ratio).toBe(1);
  });

  it('100% mais 1 centavo vira OVER, com percent ainda 100 (arredonda para baixo)', () => {
    const usage = budgetUsage(10001, 10000);
    expect(usage.status).toBe('OVER');
    expect(usage.percent).toBe(100);
    expect(usage.ratio).toBeGreaterThan(1);
  });

  it('acima de 100% o percent passa de 100', () => {
    const usage = budgetUsage(25000, 10000);
    expect(usage.status).toBe('OVER');
    expect(usage.percent).toBe(250);
  });

  it('percent é arredondado para baixo: 82,99% → 82', () => {
    expect(budgetUsage(8299, 10000).percent).toBe(82);
    expect(budgetUsage(1, 3).percent).toBe(33);
    expect(budgetUsage(2, 3).percent).toBe(66);
  });

  it('exatamente 80% em limite que não é redondo', () => {
    expect(budgetUsage(80, 100).status).toBe('WARNING');
    expect(budgetUsage(4, 5).status).toBe('WARNING');
    expect(budgetUsage(799, 1000).status).toBe('OK');
  });

  it('gasto negativo é tratado como zero', () => {
    expect(budgetUsage(-500, 10000)).toEqual({ status: 'OK', ratio: 0, percent: 0 });
  });

  it('valores grandes (R$ 1.000.000,00) não perdem a precisão', () => {
    expect(budgetUsage(80000000, 100000000).status).toBe('WARNING');
    expect(budgetUsage(100000001, 100000000).status).toBe('OVER');
  });
});
