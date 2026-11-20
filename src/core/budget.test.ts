import { describe, expect, it } from 'vitest';
import {
  buildMonthBudget,
  isCommitted,
  limitsToCopy,
  MAX_LIMIT_IN_CENTS,
  settledTransactions,
  validateLimit,
  type BudgetLimit,
  type BudgetTransaction,
} from './budget';

const TODAY = '2026-11-16';
const YESTERDAY = '2026-11-15';
const TOMORROW = '2026-11-17';

const tx = (
  amountInCents: number,
  categoryId: string | null,
  date: string = TODAY,
  installmentNumber: number | null = null,
): BudgetTransaction => ({ amountInCents, categoryId, date, installmentNumber });

const limit = (categoryId: string, limitInCents: number): BudgetLimit => ({ categoryId, limitInCents });

describe('isCommitted', () => {
  it('parcela 1 com data futura NÃO é comprometida', () => {
    expect(isCommitted(tx(-10000, 'mercado', TOMORROW, 1), TODAY)).toBe(false);
  });

  it('parcela 2 com data de hoje NÃO é comprometida (só date > today)', () => {
    expect(isCommitted(tx(-10000, 'mercado', TODAY, 2), TODAY)).toBe(false);
  });

  it('parcela 2 com data passada não é comprometida', () => {
    expect(isCommitted(tx(-10000, 'mercado', YESTERDAY, 2), TODAY)).toBe(false);
  });

  it('parcela 2 com data de amanhã é comprometida', () => {
    expect(isCommitted(tx(-10000, 'mercado', TOMORROW, 2), TODAY)).toBe(true);
  });

  it('parcela 12 com data futura é comprometida', () => {
    expect(isCommitted(tx(-10000, 'mercado', '2027-10-16', 12), TODAY)).toBe(true);
  });

  it('despesa à vista com data futura não é comprometida', () => {
    expect(isCommitted(tx(-10000, 'mercado', TOMORROW, null), TODAY)).toBe(false);
  });

  it('valor positivo (estorno) de parcela futura não é comprometido', () => {
    expect(isCommitted(tx(10000, 'mercado', TOMORROW, 2), TODAY)).toBe(false);
  });

  it('compara a data como texto também na virada de mês e de ano', () => {
    expect(isCommitted(tx(-100, null, '2026-12-01', 2), '2026-11-30')).toBe(true);
    expect(isCommitted(tx(-100, null, '2027-01-01', 2), '2026-12-31')).toBe(true);
    expect(isCommitted(tx(-100, null, '2026-12-31', 2), '2027-01-01')).toBe(false);
  });
});

describe('settledTransactions', () => {
  it('tira só o comprometido e mantém a ordem', () => {
    const a = tx(-1000, 'mercado', TODAY, 1);
    const b = tx(-1000, 'mercado', TOMORROW, 2);
    const c = tx(500000, 'salario', TOMORROW, null);
    const d = tx(-2000, 'lazer', TODAY, 2);
    expect(settledTransactions([a, b, c, d], TODAY)).toEqual([a, c, d]);
  });

  it('lista vazia devolve lista vazia', () => {
    expect(settledTransactions([], TODAY)).toEqual([]);
  });

  it('não altera a lista recebida', () => {
    const input = [tx(-1000, 'mercado', TOMORROW, 2)];
    settledTransactions(input, TODAY);
    expect(input).toHaveLength(1);
  });
});

describe('buildMonthBudget', () => {
  it('lista de categorias vazia gera orçamento vazio', () => {
    const budget = buildMonthBudget([], [], [], TODAY);
    expect(budget.lines).toEqual([]);
    expect(budget.totalLimitInCents).toBe(0);
    expect(budget.spentInCents).toBe(0);
    expect(budget.committedInCents).toBe(0);
    expect(budget.usage.status).toBe('NONE');
  });

  it('a ordem das linhas é a das categorias recebidas', () => {
    const budget = buildMonthBudget(['transporte', 'lazer', 'mercado'], [limit('mercado', 1000)], [], TODAY);
    expect(budget.lines.map((line) => line.categoryId)).toEqual(['transporte', 'lazer', 'mercado']);
  });

  it('gasto zero com limite: disponível é o limite inteiro e status OK', () => {
    const budget = buildMonthBudget(['mercado'], [limit('mercado', 50000)], [], TODAY);
    expect(budget.lines[0]).toMatchObject({
      limitInCents: 50000,
      spentInCents: 0,
      committedInCents: 0,
      availableInCents: 50000,
    });
    expect(budget.lines[0]?.usage.status).toBe('OK');
    expect(budget.lines[0]?.usage.percent).toBe(0);
  });

  it('categoria sem limite: limite e disponível nulos, uso NONE, mas o gasto aparece', () => {
    const budget = buildMonthBudget(['lazer'], [], [tx(-2500, 'lazer')], TODAY);
    expect(budget.lines[0]).toMatchObject({
      categoryId: 'lazer',
      limitInCents: null,
      spentInCents: 2500,
      availableInCents: null,
    });
    expect(budget.lines[0]?.usage.status).toBe('NONE');
    expect(budget.totalLimitInCents).toBe(0);
    expect(budget.usage.status).toBe('NONE');
    expect(budget.spentInCents).toBe(2500);
  });

  it('disponível = limite − gasto − comprometido', () => {
    const budget = buildMonthBudget(
      ['mercado'],
      [limit('mercado', 100000)],
      [tx(-30000, 'mercado'), tx(-20000, 'mercado', '2026-11-25', 2)],
      TODAY,
    );
    expect(budget.lines[0]).toMatchObject({ spentInCents: 30000, committedInCents: 20000, availableInCents: 50000 });
  });

  it('disponível pode ficar negativo', () => {
    const budget = buildMonthBudget(
      ['mercado'],
      [limit('mercado', 10000)],
      [tx(-8000, 'mercado'), tx(-5000, 'mercado', '2026-11-25', 2)],
      TODAY,
    );
    expect(budget.lines[0]?.availableInCents).toBe(-3000);
  });

  it('o comprometido não entra no uso (status e percentual usam só o gasto)', () => {
    const budget = buildMonthBudget(
      ['mercado'],
      [limit('mercado', 10000)],
      [tx(-1000, 'mercado'), tx(-50000, 'mercado', '2026-11-25', 2)],
      TODAY,
    );
    expect(budget.lines[0]?.usage.status).toBe('OK');
    expect(budget.lines[0]?.usage.percent).toBe(10);
  });

  describe('compra de R$ 300 em 3x lançada hoje', () => {
    // parcela 1 hoje (budget_month = mês atual); parcelas 2 e 3 caem nos meses seguintes
    it('mês atual: gasto R$ 100 e nada comprometido', () => {
      const budget = buildMonthBudget(['mercado'], [limit('mercado', 100000)], [tx(-10000, 'mercado', TODAY, 1)], TODAY);
      expect(budget.lines[0]).toMatchObject({ spentInCents: 10000, committedInCents: 0, availableInCents: 90000 });
      expect(budget.spentInCents).toBe(10000);
      expect(budget.committedInCents).toBe(0);
    });

    it('mês seguinte: comprometido R$ 100 e gasto zero', () => {
      const budget = buildMonthBudget(
        ['mercado'],
        [limit('mercado', 100000)],
        [tx(-10000, 'mercado', '2026-12-16', 2)],
        TODAY,
      );
      expect(budget.lines[0]).toMatchObject({ spentInCents: 0, committedInCents: 10000, availableInCents: 90000 });
      expect(budget.spentInCents).toBe(0);
      expect(budget.committedInCents).toBe(10000);
    });

    it('dois meses à frente: também comprometido', () => {
      const budget = buildMonthBudget(['mercado'], [], [tx(-10000, 'mercado', '2027-01-16', 3)], TODAY);
      expect(budget.committedInCents).toBe(10000);
      expect(budget.spentInCents).toBe(0);
    });
  });

  it('parcela 2 com data de hoje vira gasto, não comprometido', () => {
    const budget = buildMonthBudget(['mercado'], [], [tx(-10000, 'mercado', TODAY, 2)], TODAY);
    expect(budget.lines[0]).toMatchObject({ spentInCents: 10000, committedInCents: 0 });
  });

  it('parcela 1 com data futura (banco que lança tudo de uma vez) conta como gasto', () => {
    const budget = buildMonthBudget(['mercado'], [], [tx(-10000, 'mercado', TOMORROW, 1)], TODAY);
    expect(budget.lines[0]).toMatchObject({ spentInCents: 10000, committedInCents: 0 });
  });

  it('despesa à vista com data futura conta como gasto', () => {
    const budget = buildMonthBudget(['mercado'], [], [tx(-7000, 'mercado', TOMORROW, null)], TODAY);
    expect(budget.lines[0]).toMatchObject({ spentInCents: 7000, committedInCents: 0 });
    expect(budget.spentInCents).toBe(7000);
  });

  it('estorno em categoria de despesa abate o gasto da categoria e do total', () => {
    const budget = buildMonthBudget(
      ['mercado', 'lazer'],
      [limit('mercado', 50000)],
      [tx(-10000, 'mercado'), tx(3000, 'mercado'), tx(-4000, 'lazer')],
      TODAY,
    );
    expect(budget.lines[0]?.spentInCents).toBe(7000);
    expect(budget.lines[1]?.spentInCents).toBe(4000);
    expect(budget.spentInCents).toBe(11000);
    expect(budget.lines[0]?.availableInCents).toBe(43000);
  });

  it('estorno maior que o gasto não deixa o gasto negativo', () => {
    const budget = buildMonthBudget(
      ['mercado'],
      [limit('mercado', 50000)],
      [tx(-1000, 'mercado'), tx(5000, 'mercado')],
      TODAY,
    );
    expect(budget.lines[0]?.spentInCents).toBe(0);
    expect(budget.lines[0]?.availableInCents).toBe(50000);
    expect(budget.spentInCents).toBe(0);
  });

  it('só estorno, sem nenhuma despesa, dá gasto zero', () => {
    const budget = buildMonthBudget(['mercado'], [limit('mercado', 50000)], [tx(2000, 'mercado')], TODAY);
    expect(budget.lines[0]?.spentInCents).toBe(0);
    expect(budget.spentInCents).toBe(0);
  });

  it('receita fica fora do gasto', () => {
    const budget = buildMonthBudget(
      ['mercado'],
      [limit('mercado', 50000)],
      [tx(-10000, 'mercado'), tx(500000, 'salario'), tx(2000, null)],
      TODAY,
    );
    expect(budget.spentInCents).toBe(10000);
    expect(budget.lines[0]?.spentInCents).toBe(10000);
  });

  it('transação sem categoria entra no gasto total, mas em nenhuma linha', () => {
    const budget = buildMonthBudget(
      ['mercado'],
      [limit('mercado', 50000)],
      [tx(-10000, 'mercado'), tx(-4000, null)],
      TODAY,
    );
    expect(budget.lines).toHaveLength(1);
    expect(budget.lines[0]?.spentInCents).toBe(10000);
    expect(budget.spentInCents).toBe(14000);
  });

  it('parcela futura sem categoria entra no comprometido total, mas em nenhuma linha', () => {
    const budget = buildMonthBudget(['mercado'], [], [tx(-9000, null, '2026-12-16', 2)], TODAY);
    expect(budget.lines[0]?.committedInCents).toBe(0);
    expect(budget.committedInCents).toBe(9000);
  });

  it('despesa em categoria que não está na lista entra no total, mas em nenhuma linha', () => {
    const budget = buildMonthBudget(['mercado'], [], [tx(-6000, 'outra')], TODAY);
    expect(budget.lines[0]?.spentInCents).toBe(0);
    expect(budget.spentInCents).toBe(6000);
  });

  describe('status por categoria', () => {
    const statusFor = (spent: number, limitInCents: number) =>
      buildMonthBudget(['mercado'], [limit('mercado', limitInCents)], [tx(-spent, 'mercado')], TODAY).lines[0]?.usage;

    it('abaixo de 80% é OK', () => {
      expect(statusFor(7999, 10000)?.status).toBe('OK');
    });

    it('exatamente 80% é Atenção', () => {
      expect(statusFor(8000, 10000)?.status).toBe('WARNING');
    });

    it('exatamente 100% ainda é Atenção', () => {
      const usage = statusFor(10000, 10000);
      expect(usage?.status).toBe('WARNING');
      expect(usage?.percent).toBe(100);
    });

    it('100% + 1 centavo é Estourou', () => {
      expect(statusFor(10001, 10000)?.status).toBe('OVER');
    });
  });

  describe('total', () => {
    it('totalLimit soma só os limites das categorias de despesa recebidas', () => {
      const budget = buildMonthBudget(
        ['mercado', 'lazer', 'transporte'],
        [limit('mercado', 50000), limit('lazer', 20000), limit('desconhecida', 99999)],
        [],
        TODAY,
      );
      expect(budget.totalLimitInCents).toBe(70000);
    });

    it('o uso total compara o gasto do mês com a soma dos limites', () => {
      const budget = buildMonthBudget(
        ['mercado', 'lazer'],
        [limit('mercado', 50000), limit('lazer', 50000)],
        [tx(-80000, 'mercado')],
        TODAY,
      );
      expect(budget.usage.status).toBe('WARNING');
      expect(budget.usage.percent).toBe(80);
    });

    it('o gasto sem categoria pesa no uso total', () => {
      const budget = buildMonthBudget(
        ['mercado'],
        [limit('mercado', 10000)],
        [tx(-1000, 'mercado'), tx(-10000, null)],
        TODAY,
      );
      expect(budget.lines[0]?.usage.status).toBe('OK');
      expect(budget.usage.status).toBe('OVER');
    });

    it('o limite de categoria desconhecida não vira linha', () => {
      const budget = buildMonthBudget(['mercado'], [limit('desconhecida', 5000)], [], TODAY);
      expect(budget.lines.map((line) => line.categoryId)).toEqual(['mercado']);
      expect(budget.lines[0]?.limitInCents).toBeNull();
    });
  });
});

describe('limitsToCopy', () => {
  it('copia os limites do mês anterior que o mês novo não tem', () => {
    expect(limitsToCopy([limit('mercado', 50000), limit('lazer', 20000)], [])).toEqual([
      limit('mercado', 50000),
      limit('lazer', 20000),
    ]);
  });

  it('não sobrescreve um limite já definido no mês novo', () => {
    expect(limitsToCopy([limit('mercado', 50000), limit('lazer', 20000)], [limit('mercado', 60000)])).toEqual([
      limit('lazer', 20000),
    ]);
  });

  it('ignora limite zero', () => {
    expect(limitsToCopy([limit('mercado', 0), limit('lazer', 20000)], [])).toEqual([limit('lazer', 20000)]);
  });

  it('mês anterior vazio não copia nada', () => {
    expect(limitsToCopy([], [limit('mercado', 60000)])).toEqual([]);
  });

  it('mês novo já completo não copia nada', () => {
    expect(limitsToCopy([limit('mercado', 50000)], [limit('mercado', 1)])).toEqual([]);
  });

  it('mantém a ordem do mês anterior', () => {
    const previous = [limit('c', 3), limit('a', 1), limit('b', 2)];
    expect(limitsToCopy(previous, []).map((l) => l.categoryId)).toEqual(['c', 'a', 'b']);
  });
});

describe('validateLimit', () => {
  it('zero é válido (remove o limite)', () => {
    expect(validateLimit(0)).toBeNull();
  });

  it('um valor comum é válido', () => {
    expect(validateLimit(50000)).toBeNull();
  });

  it('negativo é erro', () => {
    expect(validateLimit(-1)).toBe('Informe um limite válido, de zero para cima.');
  });

  it('decimal é erro', () => {
    expect(validateLimit(10.5)).toBe('Informe um limite válido, de zero para cima.');
  });

  it('NaN e infinito são erro', () => {
    expect(validateLimit(Number.NaN)).toBe('Informe um limite válido, de zero para cima.');
    expect(validateLimit(Number.POSITIVE_INFINITY)).toBe('Informe um limite válido, de zero para cima.');
  });

  it('MAX_LIMIT_IN_CENTS é válido', () => {
    expect(MAX_LIMIT_IN_CENTS).toBe(99_999_999_999);
    expect(validateLimit(MAX_LIMIT_IN_CENTS)).toBeNull();
  });

  it('MAX_LIMIT_IN_CENTS + 1 é erro', () => {
    expect(validateLimit(MAX_LIMIT_IN_CENTS + 1)).toBe('O limite é grande demais.');
  });
});

describe('buildMonthBudget: total igual à soma das linhas', () => {
  const tx = (amountInCents: number, categoryId: string | null) => ({
    amountInCents,
    categoryId,
    date: '2026-11-10',
    installmentNumber: null,
  });

  it('estorno de uma categoria não abate o gasto de outra', () => {
    const budget = buildMonthBudget(['food', 'leisure'], [], [tx(-1000, 'food'), tx(5000, 'leisure')], '2026-11-14');
    expect(budget.lines.map((line) => line.spentInCents)).toEqual([1000, 0]);
    expect(budget.spentInCents).toBe(1000);
  });

  it('despesa sem categoria ou de categoria desconhecida entra no total, mas positivo fora das linhas não abate', () => {
    const budget = buildMonthBudget(['food'], [], [tx(-1000, 'food'), tx(-300, null), tx(-200, 'outra'), tx(900, null)], '2026-11-14');
    expect(budget.spentInCents).toBe(1500);
  });
});
