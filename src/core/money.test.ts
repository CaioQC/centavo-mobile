import { describe, expect, it } from 'vitest';
import { formatCents, formatSignedCents, MAX_AMOUNT_DIGITS, parseDigitsToCents } from './money';

// O Intl pt-BR separa "R$" do número com um espaço não separável (U+00A0).
const NBSP = ' ';

describe('parseDigitsToCents', () => {
  it('converte só dígitos em centavos', () => {
    expect(parseDigitsToCents('30000')).toBe(30000);
    expect(formatCents(parseDigitsToCents('30000'))).toBe(`R$${NBSP}300,00`);
  });

  it('vale 0 para vazio, só zeros e texto sem dígitos', () => {
    expect(parseDigitsToCents('')).toBe(0);
    expect(parseDigitsToCents('0')).toBe(0);
    expect(parseDigitsToCents('0000')).toBe(0);
    expect(parseDigitsToCents('abc')).toBe(0);
    expect(parseDigitsToCents('R$ ,')).toBe(0);
  });

  it('vale 1 para um centavo, com ou sem zeros à esquerda', () => {
    expect(parseDigitsToCents('1')).toBe(1);
    expect(parseDigitsToCents('001')).toBe(1);
  });

  it('descarta tudo que não é dígito (vírgula, ponto, R$, espaço, sinal)', () => {
    expect(parseDigitsToCents('R$ 1.234,56')).toBe(123456);
    expect(parseDigitsToCents('-12,50')).toBe(1250);
    expect(parseDigitsToCents(' 1 2 ')).toBe(12);
  });

  it('aceita valor grande (R$ 1.000.000,00)', () => {
    expect(parseDigitsToCents('100000000')).toBe(100000000);
  });

  it('descarta os dígitos além do máximo', () => {
    expect(MAX_AMOUNT_DIGITS).toBe(11);
    expect(parseDigitsToCents('99999999999')).toBe(99999999999);
    expect(parseDigitsToCents('999999999999')).toBe(99999999999);
    expect(parseDigitsToCents('123456789012345')).toBe(12345678901);
  });

  it('conta o limite depois de remover os zeros à esquerda', () => {
    expect(parseDigitsToCents('000000000000001')).toBe(1);
  });

  it('sempre devolve inteiro seguro', () => {
    expect(Number.isSafeInteger(parseDigitsToCents('9'.repeat(40)))).toBe(true);
  });
});

describe('formatCents', () => {
  it('formata 0 e 1 centavo', () => {
    expect(formatCents(0)).toBe(`R$${NBSP}0,00`);
    expect(formatCents(1)).toBe(`R$${NBSP}0,01`);
  });

  it('formata no padrão pt-BR com milhar e vírgula', () => {
    expect(formatCents(123456)).toBe(`R$${NBSP}1.234,56`);
    expect(formatCents(100)).toBe(`R$${NBSP}1,00`);
  });

  it('formata valores grandes', () => {
    expect(formatCents(100000000)).toBe(`R$${NBSP}1.000.000,00`);
    expect(formatCents(99999999999)).toBe(`R$${NBSP}999.999.999,99`);
  });

  it('formata negativo (despesa) com sinal antes do R$', () => {
    expect(formatCents(-100)).toBe(`-R$${NBSP}1,00`);
    expect(formatCents(-123456)).toBe(`-R$${NBSP}1.234,56`);
  });

  it('usa o espaço especial do Intl, não o espaço comum', () => {
    expect(formatCents(100)).toContain(NBSP);
    expect(formatCents(100)).not.toContain(' ');
  });

  it('rejeita valor com decimal, NaN e infinito', () => {
    expect(() => formatCents(1.5)).toThrow(RangeError);
    expect(() => formatCents(Number.NaN)).toThrow(RangeError);
    expect(() => formatCents(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });

  it('rejeita inteiro acima do seguro', () => {
    expect(() => formatCents(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
  });
});

describe('formatSignedCents', () => {
  const MINUS = '−'; // sinal de menos U+2212, não o hífen "-"

  it('zero sai sem sinal', () => {
    expect(formatSignedCents(0)).toBe(`R$${NBSP}0,00`);
    expect(formatSignedCents(0)).not.toContain('+');
    expect(formatSignedCents(0)).not.toContain(MINUS);
  });

  it('1 centavo positivo tem "+" e 1 centavo negativo tem o menos', () => {
    expect(formatSignedCents(1)).toBe(`+R$${NBSP}0,01`);
    expect(formatSignedCents(-1)).toBe(`${MINUS}R$${NBSP}0,01`);
  });

  it('despesa usa o sinal de menos U+2212 antes do R$', () => {
    expect(formatSignedCents(-4990)).toBe(`${MINUS}R$${NBSP}49,90`);
    expect(formatSignedCents(-4990).charCodeAt(0)).toBe(0x2212);
    expect(formatSignedCents(-4990)).not.toContain('-');
  });

  it('receita usa "+" antes do R$', () => {
    expect(formatSignedCents(4990)).toBe(`+R$${NBSP}49,90`);
  });

  it('valores grandes (R$ 1.000.000,00 e o máximo de 11 dígitos)', () => {
    expect(formatSignedCents(100000000)).toBe(`+R$${NBSP}1.000.000,00`);
    expect(formatSignedCents(-100000000)).toBe(`${MINUS}R$${NBSP}1.000.000,00`);
    expect(formatSignedCents(99999999999)).toBe(`+R$${NBSP}999.999.999,99`);
  });

  it('mantém o espaço especial do Intl entre o R$ e o número', () => {
    expect(formatSignedCents(100)).toContain(NBSP);
    expect(formatSignedCents(-100)).toContain(NBSP);
    expect(formatSignedCents(100)).not.toContain(' ');
  });

  it('rejeita valor com decimal, NaN e infinito (como formatCents)', () => {
    expect(() => formatSignedCents(1.5)).toThrow(RangeError);
    expect(() => formatSignedCents(-1.5)).toThrow(RangeError);
    expect(() => formatSignedCents(Number.NaN)).toThrow(RangeError);
    expect(() => formatSignedCents(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});
