import { describe, expect, it } from 'vitest';
import { formatDateInput, maskDateInput, parseDateInput } from './dateInput';

describe('maskDateInput', () => {
  it('data completa recebe as barras', () => {
    expect(maskDateInput('14112026')).toBe('14/11/2026');
  });

  it('digitação parcial, dígito a dígito', () => {
    expect(maskDateInput('')).toBe('');
    expect(maskDateInput('1')).toBe('1');
    expect(maskDateInput('14')).toBe('14');
    expect(maskDateInput('141')).toBe('14/1');
    expect(maskDateInput('1411')).toBe('14/11');
    expect(maskDateInput('14112')).toBe('14/11/2');
    expect(maskDateInput('141120')).toBe('14/11/20');
    expect(maskDateInput('1411202')).toBe('14/11/202');
  });

  it('ignora letras e símbolos', () => {
    expect(maskDateInput('abc')).toBe('');
    expect(maskDateInput('1a4b1c1d2e0f2g6')).toBe('14/11/2026');
    expect(maskDateInput('-+*#')).toBe('');
  });

  it('com mais de 8 dígitos, corta o excesso', () => {
    expect(maskDateInput('141120261234')).toBe('14/11/2026');
    expect(maskDateInput('123456789')).toBe('12/34/5678');
  });

  it('é idempotente: mascarar um texto já mascarado não muda nada', () => {
    for (const text of ['14/11/2026', '14/1', '14/11/2', '14']) {
      expect(maskDateInput(text)).toBe(text);
    }
  });

  it('apagar a barra pendente: "14/" vira "14" (a barra volta quando vier o próximo dígito)', () => {
    expect(maskDateInput('14/')).toBe('14');
  });
});

describe('parseDateInput', () => {
  it('converte DD/MM/AAAA para AAAA-MM-DD', () => {
    expect(parseDateInput('14/11/2026')).toBe('2026-11-14');
    expect(parseDateInput('01/01/2026')).toBe('2026-01-01');
    expect(parseDateInput('31/12/2026')).toBe('2026-12-31');
  });

  it('aceita também só os dígitos', () => {
    expect(parseDateInput('14112026')).toBe('2026-11-14');
  });

  it('29/02 em ano comum é inválido; em bissexto é válido', () => {
    expect(parseDateInput('29/02/2026')).toBeNull();
    expect(parseDateInput('29/02/2028')).toBe('2028-02-29');
    expect(parseDateInput('29/02/1900')).toBeNull();
    expect(parseDateInput('29/02/2000')).toBe('2000-02-29');
  });

  it('dia 31 em mês de 30 dias é inválido', () => {
    expect(parseDateInput('31/04/2026')).toBeNull();
    expect(parseDateInput('31/11/2026')).toBeNull();
  });

  it('dia 00, mês 00 e mês 13 são inválidos', () => {
    expect(parseDateInput('00/01/2026')).toBeNull();
    expect(parseDateInput('01/00/2026')).toBeNull();
    expect(parseDateInput('01/13/2026')).toBeNull();
    expect(parseDateInput('32/01/2026')).toBeNull();
  });

  it('digitação incompleta ou vazia devolve null', () => {
    expect(parseDateInput('')).toBeNull();
    expect(parseDateInput('14')).toBeNull();
    expect(parseDateInput('14/11')).toBeNull();
    expect(parseDateInput('14/11/202')).toBeNull();
    expect(parseDateInput('abc')).toBeNull();
  });

  it('mais de 8 dígitos devolve null', () => {
    expect(parseDateInput('14/11/20261')).toBeNull();
  });

  it('o texto da máscara completa sempre volta como data válida', () => {
    expect(parseDateInput(maskDateInput('29022028'))).toBe('2028-02-29');
  });
});

describe('formatDateInput', () => {
  it('AAAA-MM-DD vira DD/MM/AAAA', () => {
    expect(formatDateInput('2026-11-14')).toBe('14/11/2026');
    expect(formatDateInput('2028-02-29')).toBe('29/02/2028');
    expect(formatDateInput('2026-01-05')).toBe('05/01/2026');
  });

  it('é o inverso de parseDateInput', () => {
    for (const date of ['2026-11-14', '2028-02-29', '2026-12-31', '2026-01-01']) {
      expect(parseDateInput(formatDateInput(date))).toBe(date);
    }
  });

  it('lança RangeError para data inválida', () => {
    expect(() => formatDateInput('2026-02-29')).toThrow(RangeError);
    expect(() => formatDateInput('14/11/2026')).toThrow(RangeError);
    expect(() => formatDateInput('')).toThrow(RangeError);
  });
});
