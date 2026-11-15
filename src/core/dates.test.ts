import { describe, expect, it } from 'vitest';
import {
  addMonths,
  budgetMonth,
  currentMonth,
  isValidLocalDate,
  isValidYearMonth,
  monthOf,
  todayLocal,
  toLocalDate,
} from './dates';

describe('toLocalDate / todayLocal / currentMonth (America/Sao_Paulo, UTC-3)', () => {
  it('23h30 do dia 31 em São Paulo continua no dia 31, embora em UTC já seja o dia seguinte', () => {
    const instant = new Date('2026-01-31T23:30:00-03:00');
    expect(instant.toISOString()).toBe('2026-02-01T02:30:00.000Z');
    expect(toLocalDate(instant)).toBe('2026-01-31');
    expect(currentMonth(instant)).toBe('2026-01');
    expect(todayLocal(instant)).toBe('2026-01-31');
  });

  it('virada de mês: 00h00 em São Paulo já é o dia 1', () => {
    expect(toLocalDate(new Date('2026-02-01T00:00:00-03:00'))).toBe('2026-02-01');
    expect(toLocalDate(new Date('2026-01-31T23:59:59-03:00'))).toBe('2026-01-31');
  });

  it('virada de ano', () => {
    expect(toLocalDate(new Date('2026-12-31T23:30:00-03:00'))).toBe('2026-12-31');
    expect(toLocalDate(new Date('2027-01-01T00:00:00-03:00'))).toBe('2027-01-01');
  });

  it('instante de madrugada em UTC ainda é o dia anterior em São Paulo', () => {
    expect(toLocalDate(new Date('2026-03-01T01:00:00Z'))).toBe('2026-02-28');
  });

  it('29/02 de ano bissexto', () => {
    expect(toLocalDate(new Date('2028-02-29T23:30:00-03:00'))).toBe('2028-02-29');
  });

  it('todayLocal sem argumento devolve um dia válido', () => {
    expect(isValidLocalDate(todayLocal())).toBe(true);
  });
});

describe('isValidLocalDate', () => {
  it('aceita 29/02 em ano bissexto e recusa em ano comum', () => {
    expect(isValidLocalDate('2028-02-29')).toBe(true);
    expect(isValidLocalDate('2026-02-29')).toBe(false);
    expect(isValidLocalDate('1900-02-29')).toBe(false);
    expect(isValidLocalDate('2000-02-29')).toBe(true);
  });

  it('recusa dia e mês fora do calendário', () => {
    expect(isValidLocalDate('2026-04-31')).toBe(false);
    expect(isValidLocalDate('2026-13-01')).toBe(false);
    expect(isValidLocalDate('2026-00-10')).toBe(false);
    expect(isValidLocalDate('2026-01-00')).toBe(false);
  });

  it('recusa formato errado', () => {
    expect(isValidLocalDate('')).toBe(false);
    expect(isValidLocalDate('2026-1-5')).toBe(false);
    expect(isValidLocalDate('05/01/2026')).toBe(false);
    expect(isValidLocalDate('2026-01-05T10:00')).toBe(false);
  });

  it('aceita o último dia dos meses', () => {
    expect(isValidLocalDate('2026-12-31')).toBe(true);
    expect(isValidLocalDate('2026-02-28')).toBe(true);
  });
});

describe('isValidYearMonth', () => {
  it('aceita 01 a 12 e recusa o resto', () => {
    expect(isValidYearMonth('2026-01')).toBe(true);
    expect(isValidYearMonth('2026-12')).toBe(true);
    expect(isValidYearMonth('2026-00')).toBe(false);
    expect(isValidYearMonth('2026-13')).toBe(false);
    expect(isValidYearMonth('2026-1')).toBe(false);
    expect(isValidYearMonth('2026-01-01')).toBe(false);
  });
});

describe('monthOf', () => {
  it('extrai o mês do dia', () => {
    expect(monthOf('2026-11-30')).toBe('2026-11');
    expect(monthOf('2028-02-29')).toBe('2028-02');
  });

  it('lança para dia inexistente', () => {
    expect(() => monthOf('2026-02-29')).toThrow(RangeError);
    expect(() => monthOf('lixo')).toThrow(RangeError);
  });
});

describe('addMonths', () => {
  it('soma meses dentro do ano', () => {
    expect(addMonths('2026-01', 1)).toBe('2026-02');
    expect(addMonths('2026-05', 0)).toBe('2026-05');
  });

  it('vira o ano ao somar', () => {
    expect(addMonths('2026-11', 2)).toBe('2027-01');
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', 12)).toBe('2027-01');
    expect(addMonths('2026-03', 25)).toBe('2028-04');
  });

  it('subtrai meses (negativos), inclusive virando o ano para trás', () => {
    expect(addMonths('2026-03', -1)).toBe('2026-02');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2026-01', -12)).toBe('2025-01');
    expect(addMonths('2026-02', -14)).toBe('2024-12');
  });

  it('lança para mês inválido e para quantidade não inteira', () => {
    expect(() => addMonths('2026-13', 1)).toThrow(RangeError);
    expect(() => addMonths('2026-01', 1.5)).toThrow(RangeError);
    expect(() => addMonths('2026-01', Number.NaN)).toThrow(RangeError);
  });
});

describe('budgetMonth', () => {
  it('1x (à vista) cai no mês da compra, e o padrão é a parcela 1', () => {
    expect(budgetMonth('2026-11-15')).toBe('2026-11');
    expect(budgetMonth('2026-11-15', 1)).toBe('2026-11');
  });

  it('3x a partir de novembro: nov, dez, jan do ano seguinte', () => {
    expect([1, 2, 3].map((n) => budgetMonth('2026-11-15', n))).toEqual(['2026-11', '2026-12', '2027-01']);
  });

  it('12x cobre 12 meses seguidos, terminando um mês antes do aniversário da compra', () => {
    expect(budgetMonth('2026-11-15', 12)).toBe('2027-10');
    expect(budgetMonth('2026-01-10', 12)).toBe('2026-12');
  });

  it('compra em dezembro: parcela 1 em dezembro, parcela 2 em janeiro', () => {
    expect(budgetMonth('2026-12-31', 1)).toBe('2026-12');
    expect(budgetMonth('2026-12-31', 2)).toBe('2027-01');
  });

  it('compra no dia 31 não "pula" meses curtos (conta por mês, não por dia)', () => {
    expect(budgetMonth('2026-01-31', 2)).toBe('2026-02');
    expect(budgetMonth('2026-01-31', 3)).toBe('2026-03');
  });

  it('lança para parcela 0, negativa, decimal ou NaN', () => {
    expect(() => budgetMonth('2026-11-15', 0)).toThrow(RangeError);
    expect(() => budgetMonth('2026-11-15', -1)).toThrow(RangeError);
    expect(() => budgetMonth('2026-11-15', 1.5)).toThrow(RangeError);
    expect(() => budgetMonth('2026-11-15', Number.NaN)).toThrow(RangeError);
  });

  it('lança para data de compra inválida', () => {
    expect(() => budgetMonth('2026-02-29', 1)).toThrow(RangeError);
  });
});
