import { describe, expect, it } from 'vitest';
import { MAX_INSTALLMENTS, planInstallments, splitInstallments } from './installments';

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

describe('splitInstallments', () => {
  it('R$ 100,00 em 3x: a diferença de centavo vai para a primeira parcela', () => {
    expect(splitInstallments(10000, 3)).toEqual([3334, 3333, 3333]);
  });

  it('divisão exata fica com parcelas iguais', () => {
    expect(splitInstallments(9000, 3)).toEqual([3000, 3000, 3000]);
    expect(splitInstallments(10000, 4)).toEqual([2500, 2500, 2500, 2500]);
  });

  it('1x (à vista) é uma parcela com o total', () => {
    expect(splitInstallments(12345, 1)).toEqual([12345]);
    expect(splitInstallments(1, 1)).toEqual([1]);
  });

  it('o resto de centavos inteiro cai na primeira parcela (10 centavos em 3x)', () => {
    expect(splitInstallments(10, 3)).toEqual([4, 3, 3]);
    expect(splitInstallments(11, 3)).toEqual([5, 3, 3]);
  });

  it('24x (o máximo) é aceito', () => {
    const parts = splitInstallments(100000, MAX_INSTALLMENTS);
    expect(parts).toHaveLength(24);
    expect(sum(parts)).toBe(100000);
  });

  it('total menor que o nº de parcelas: as parcelas excedentes ficam com 0 centavo (1 centavo em 2x → [1, 0])', () => {
    // Comportamento real: a função não recusa; devolve parcelas de 0 centavo.
    expect(splitInstallments(1, 2)).toEqual([1, 0]);
    expect(splitInstallments(2, 5)).toEqual([2, 0, 0, 0, 0]);
  });

  it('a soma sempre fecha o total, para vários totais e N', () => {
    const totals = [1, 2, 7, 99, 100, 101, 999, 10000, 12345, 99999, 100000, 123457, 100000000, 100000001];
    for (const total of totals) {
      for (let count = 1; count <= MAX_INSTALLMENTS; count += 1) {
        const parts = splitInstallments(total, count);
        expect(parts).toHaveLength(count);
        expect(sum(parts)).toBe(total);
        expect(parts.every((part) => Number.isInteger(part) && part >= 0)).toBe(true);
        // a primeira é a maior, e a diferença entre parcelas nunca passa de count - 1 centavos
        expect(Math.max(...parts)).toBe(parts[0]);
        expect(parts[0]! - Math.min(...parts)).toBeLessThan(count);
      }
    }
  });

  it('lança RangeError para 0x, 25x, negativo e decimal', () => {
    expect(() => splitInstallments(10000, 0)).toThrow(RangeError);
    expect(() => splitInstallments(10000, 25)).toThrow(RangeError);
    expect(() => splitInstallments(10000, -1)).toThrow(RangeError);
    expect(() => splitInstallments(10000, 2.5)).toThrow(RangeError);
    expect(() => splitInstallments(10000, Number.NaN)).toThrow(RangeError);
  });

  it('lança RangeError para total 0, negativo, decimal, NaN ou infinito', () => {
    expect(() => splitInstallments(0, 3)).toThrow(RangeError);
    expect(() => splitInstallments(-10000, 3)).toThrow(RangeError);
    expect(() => splitInstallments(100.5, 3)).toThrow(RangeError);
    expect(() => splitInstallments(Number.NaN, 3)).toThrow(RangeError);
    expect(() => splitInstallments(Number.POSITIVE_INFINITY, 3)).toThrow(RangeError);
  });
});

describe('planInstallments', () => {
  it('3x a partir de 30/11: nov, dez, jan com datas 30/11, 30/12, 30/01', () => {
    const plan = planInstallments('2026-11-30', 30000, 3);
    expect(plan.map((p) => p.budgetMonth)).toEqual(['2026-11', '2026-12', '2027-01']);
    expect(plan.map((p) => p.date)).toEqual(['2026-11-30', '2026-12-30', '2027-01-30']);
    expect(plan.map((p) => p.number)).toEqual([1, 2, 3]);
    expect(plan.map((p) => p.amountInCents)).toEqual([10000, 10000, 10000]);
  });

  it('compra em 31/01 em 3x: 31/01, 28/02, 31/03 (cada data parte da compra, não da anterior)', () => {
    const plan = planInstallments('2026-01-31', 30000, 3);
    expect(plan.map((p) => p.date)).toEqual(['2026-01-31', '2026-02-28', '2026-03-31']);
    expect(plan.map((p) => p.budgetMonth)).toEqual(['2026-01', '2026-02', '2026-03']);
  });

  it('compra em 31/01 de ano bissexto: fevereiro tem 29', () => {
    const plan = planInstallments('2028-01-31', 30000, 3);
    expect(plan.map((p) => p.date)).toEqual(['2028-01-31', '2028-02-29', '2028-03-31']);
  });

  it('compra em 29/02 de ano bissexto em 3x: dia 29 nos meses seguintes', () => {
    const plan = planInstallments('2028-02-29', 30000, 3);
    expect(plan.map((p) => p.date)).toEqual(['2028-02-29', '2028-03-29', '2028-04-29']);
  });

  it('12x atravessando o ano: 12 meses seguidos sem repetir nem pular', () => {
    const plan = planInstallments('2026-11-15', 120000, 12);
    expect(plan).toHaveLength(12);
    expect(plan.map((p) => p.budgetMonth)).toEqual([
      '2026-11', '2026-12', '2027-01', '2027-02', '2027-03', '2027-04',
      '2027-05', '2027-06', '2027-07', '2027-08', '2027-09', '2027-10',
    ]);
    expect(plan[11]!.date).toBe('2027-10-15');
    expect(plan.map((p) => p.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('o budgetMonth de cada parcela é o mês da data dessa parcela', () => {
    for (const purchase of ['2026-01-31', '2026-11-30', '2026-12-31', '2028-02-29', '2026-05-15']) {
      for (const parcela of planInstallments(purchase, 240000, 24)) {
        expect(parcela.budgetMonth).toBe(parcela.date.slice(0, 7));
      }
    }
  });

  it('compra em dezembro: parcela 2 cai em janeiro do ano seguinte', () => {
    const plan = planInstallments('2026-12-31', 20000, 2);
    expect(plan.map((p) => p.budgetMonth)).toEqual(['2026-12', '2027-01']);
    expect(plan.map((p) => p.date)).toEqual(['2026-12-31', '2027-01-31']);
  });

  it('1x é uma parcela só, na data e no mês da compra', () => {
    expect(planInstallments('2026-11-14', 5990, 1)).toEqual([
      { number: 1, amountInCents: 5990, date: '2026-11-14', budgetMonth: '2026-11' },
    ]);
  });

  it('R$ 100,00 em 3x: valores 3334, 3333, 3333 e a soma fecha o total', () => {
    const plan = planInstallments('2026-11-14', 10000, 3);
    expect(plan.map((p) => p.amountInCents)).toEqual([3334, 3333, 3333]);
    expect(sum(plan.map((p) => p.amountInCents))).toBe(10000);
  });

  it('lança RangeError para parcelas inválidas, total inválido e data inválida', () => {
    expect(() => planInstallments('2026-11-14', 10000, 0)).toThrow(RangeError);
    expect(() => planInstallments('2026-11-14', 10000, 25)).toThrow(RangeError);
    expect(() => planInstallments('2026-11-14', 0, 3)).toThrow(RangeError);
    expect(() => planInstallments('2026-02-29', 10000, 3)).toThrow(RangeError);
  });
});
