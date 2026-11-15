import { describe, expect, it } from 'vitest';
import {
  filterStatement,
  groupByDay,
  normalizeSearch,
  summarizeStatement,
  type StatementItem,
} from './statement';

function item(overrides: Partial<StatementItem> & { description: string }): StatementItem {
  return {
    date: '2026-11-14',
    amountInCents: -1000,
    accountId: 'acc-1',
    categoryId: 'cat-1',
    ...overrides,
  };
}

describe('normalizeSearch', () => {
  it('tira acento e põe em minúsculas', () => {
    expect(normalizeSearch('Padaria Pão Quente')).toBe('padaria pao quente');
    expect(normalizeSearch('AÇÚCAR')).toBe('acucar');
  });

  it('normaliza espaços duplicados, nas pontas e de outros tipos', () => {
    expect(normalizeSearch('  Padaria   PÃO  ')).toBe('padaria pao');
    expect(normalizeSearch('a\t\nb')).toBe('a b');
  });

  it('trata texto já decomposto (NFD) igual ao composto', () => {
    expect(normalizeSearch('pão')).toBe('pao');
  });

  it('devolve vazio para vazio e para só espaços', () => {
    expect(normalizeSearch('')).toBe('');
    expect(normalizeSearch('    ')).toBe('');
  });
});

describe('filterStatement', () => {
  const padaria = item({ description: 'Padaria Pão Quente', accountId: 'acc-1', categoryId: 'food' });
  const mercado = item({ description: 'Mercado Central', accountId: 'acc-2', categoryId: 'food' });
  const uber = item({ description: 'Uber', accountId: 'acc-1', categoryId: 'transport' });
  const semCategoria = item({ description: 'Pão de queijo avulso', accountId: 'acc-2', categoryId: null });
  const all = [padaria, mercado, uber, semCategoria];

  it('sem filtros devolve tudo, na mesma ordem, em um array novo', () => {
    const result = filterStatement(all, {});
    expect(result).toEqual(all);
    expect(result).not.toBe(all);
  });

  it('lista vazia devolve lista vazia', () => {
    expect(filterStatement([], {})).toEqual([]);
    expect(filterStatement([], { accountId: 'acc-1', categoryId: 'food', query: 'pao' })).toEqual([]);
  });

  it('busca sem acento e sem diferenciar caixa: "pao" acha "Padaria Pão Quente"', () => {
    expect(filterStatement(all, { query: 'pao' })).toEqual([padaria, semCategoria]);
    expect(filterStatement(all, { query: 'PÃO' })).toEqual([padaria, semCategoria]);
  });

  it('busca com espaços duplicados e nas pontas', () => {
    expect(filterStatement(all, { query: '  padaria   pao  ' })).toEqual([padaria]);
  });

  it('busca casa trecho no meio da descrição', () => {
    expect(filterStatement(all, { query: 'central' })).toEqual([mercado]);
  });

  it('busca vazia ou só espaços não filtra', () => {
    expect(filterStatement(all, { query: '' })).toEqual(all);
    expect(filterStatement(all, { query: '   ' })).toEqual(all);
  });

  it('busca sem resultado devolve lista vazia', () => {
    expect(filterStatement(all, { query: 'inexistente' })).toEqual([]);
  });

  it('filtra por conta', () => {
    expect(filterStatement(all, { accountId: 'acc-1' })).toEqual([padaria, uber]);
  });

  it('filtra por categoria', () => {
    expect(filterStatement(all, { categoryId: 'food' })).toEqual([padaria, mercado]);
  });

  it('conta e categoria nulas, indefinidas ou vazias significam "todas"', () => {
    expect(filterStatement(all, { accountId: null, categoryId: null })).toEqual(all);
    expect(filterStatement(all, { accountId: undefined, categoryId: undefined })).toEqual(all);
    expect(filterStatement(all, { accountId: '', categoryId: '' })).toEqual(all);
  });

  it('transação sem categoria (categoryId nulo) some quando há filtro de categoria, mas aparece sem ele', () => {
    expect(filterStatement(all, { categoryId: 'food' })).not.toContain(semCategoria);
    expect(filterStatement(all, {})).toContain(semCategoria);
  });

  it('combina conta e categoria', () => {
    expect(filterStatement(all, { accountId: 'acc-1', categoryId: 'food' })).toEqual([padaria]);
    expect(filterStatement(all, { accountId: 'acc-2', categoryId: 'transport' })).toEqual([]);
  });

  it('combina conta, categoria e busca', () => {
    expect(filterStatement(all, { accountId: 'acc-1', categoryId: 'food', query: 'pao' })).toEqual([padaria]);
    expect(filterStatement(all, { accountId: 'acc-2', categoryId: 'food', query: 'pao' })).toEqual([]);
  });

  it('combina conta e busca', () => {
    expect(filterStatement(all, { accountId: 'acc-2', query: 'pao' })).toEqual([semCategoria]);
  });

  it('mantém as referências dos itens e as propriedades extras', () => {
    const extra = { ...padaria, id: 'tx-1' };
    const [found] = filterStatement([extra], { query: 'padaria' });
    expect(found).toBe(extra);
    expect(found?.id).toBe('tx-1');
  });

  it('não altera a lista de entrada', () => {
    const copy = [...all];
    filterStatement(all, { accountId: 'acc-1', query: 'u' });
    expect(all).toEqual(copy);
  });
});

describe('groupByDay', () => {
  it('lista vazia devolve nenhum grupo', () => {
    expect(groupByDay([])).toEqual([]);
  });

  it('agrupa por dia e soma o total do dia com receita e despesa', () => {
    const groups = groupByDay([
      item({ description: 'Almoço', date: '2026-11-14', amountInCents: -4500 }),
      item({ description: 'Salário', date: '2026-11-14', amountInCents: 300000 }),
      item({ description: 'Café', date: '2026-11-14', amountInCents: -800 }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.date).toBe('2026-11-14');
    expect(groups[0]?.items).toHaveLength(3);
    expect(groups[0]?.totalInCents).toBe(300000 - 4500 - 800);
  });

  it('total do dia fica negativo quando as despesas superam as receitas e zero quando se anulam', () => {
    const [negative] = groupByDay([
      item({ description: 'a', amountInCents: -500 }),
      item({ description: 'b', amountInCents: 200 }),
    ]);
    expect(negative?.totalInCents).toBe(-300);

    const [zero] = groupByDay([
      item({ description: 'a', amountInCents: -500 }),
      item({ description: 'b', amountInCents: 500 }),
    ]);
    expect(zero?.totalInCents).toBe(0);
  });

  it('ordena os dias do mais recente ao mais antigo, qualquer que seja a ordem de entrada', () => {
    const groups = groupByDay([
      item({ description: 'a', date: '2026-11-10' }),
      item({ description: 'b', date: '2026-11-14' }),
      item({ description: 'c', date: '2026-11-12' }),
    ]);
    expect(groups.map((group) => group.date)).toEqual(['2026-11-14', '2026-11-12', '2026-11-10']);
  });

  it('mantém a ordem de entrada dentro do dia', () => {
    const groups = groupByDay([
      item({ description: 'primeiro', date: '2026-11-14' }),
      item({ description: 'outro dia', date: '2026-11-13' }),
      item({ description: 'segundo', date: '2026-11-14' }),
      item({ description: 'terceiro', date: '2026-11-14' }),
    ]);
    expect(groups[0]?.items.map((entry) => entry.description)).toEqual(['primeiro', 'segundo', 'terceiro']);
    expect(groups[1]?.items.map((entry) => entry.description)).toEqual(['outro dia']);
  });

  it('ordena corretamente na virada de mês e de ano', () => {
    const groups = groupByDay([
      item({ description: 'a', date: '2025-12-31' }),
      item({ description: 'b', date: '2026-01-01' }),
      item({ description: 'c', date: '2026-10-31' }),
      item({ description: 'd', date: '2026-11-01' }),
      item({ description: 'e', date: '2026-02-09' }),
      item({ description: 'f', date: '2026-02-10' }),
    ]);
    expect(groups.map((group) => group.date)).toEqual([
      '2026-11-01',
      '2026-10-31',
      '2026-02-10',
      '2026-02-09',
      '2026-01-01',
      '2025-12-31',
    ]);
  });

  it('mantém as referências dos itens e as propriedades extras', () => {
    const entry = { date: '2026-11-14', amountInCents: -100, id: 'tx-1' };
    const [group] = groupByDay([entry]);
    expect(group?.items[0]).toBe(entry);
  });

  it('não altera a lista de entrada', () => {
    const input = [
      item({ description: 'a', date: '2026-11-10' }),
      item({ description: 'b', date: '2026-11-14' }),
    ];
    const copy = [...input];
    groupByDay(input);
    expect(input).toEqual(copy);
  });
});

describe('summarizeStatement', () => {
  it('lista vazia dá zero e zero', () => {
    expect(summarizeStatement([])).toEqual({ incomeInCents: 0, expenseInCents: 0 });
  });

  it('separa receitas e despesas, com a despesa positiva (sem o sinal)', () => {
    expect(
      summarizeStatement([
        { amountInCents: -4990 },
        { amountInCents: 300000 },
        { amountInCents: -1010 },
        { amountInCents: 1 },
      ]),
    ).toEqual({ incomeInCents: 300001, expenseInCents: 6000 });
  });

  it('só despesas deixa a receita em zero', () => {
    expect(summarizeStatement([{ amountInCents: -100 }, { amountInCents: -250 }])).toEqual({
      incomeInCents: 0,
      expenseInCents: 350,
    });
  });

  it('só receitas deixa a despesa em zero', () => {
    expect(summarizeStatement([{ amountInCents: 100 }, { amountInCents: 250 }])).toEqual({
      incomeInCents: 350,
      expenseInCents: 0,
    });
  });

  it('valor zero não conta para nenhum lado', () => {
    expect(summarizeStatement([{ amountInCents: 0 }, { amountInCents: 0 }])).toEqual({
      incomeInCents: 0,
      expenseInCents: 0,
    });
  });

  it('não devolve -0 para a despesa', () => {
    const { expenseInCents } = summarizeStatement([{ amountInCents: 500 }]);
    expect(Object.is(expenseInCents, 0)).toBe(true);
  });

  it('soma valores grandes sem perder precisão (R$ 1.000.000,00)', () => {
    expect(summarizeStatement([{ amountInCents: 100000000 }, { amountInCents: -100000000 }])).toEqual({
      incomeInCents: 100000000,
      expenseInCents: 100000000,
    });
  });
});
