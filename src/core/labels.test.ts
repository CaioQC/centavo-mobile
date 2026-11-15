import { describe, expect, it } from 'vitest';
import { formatDayLabel, formatFullDate, formatInstallment, formatMonthLabel } from './labels';

describe('formatMonthLabel', () => {
  it('escreve o mês por extenso com inicial maiúscula', () => {
    expect(formatMonthLabel('2026-11')).toBe('Novembro de 2026');
    expect(formatMonthLabel('2026-01')).toBe('Janeiro de 2026');
    expect(formatMonthLabel('2026-12')).toBe('Dezembro de 2026');
  });

  it('mantém o acento de março', () => {
    expect(formatMonthLabel('2027-03')).toBe('Março de 2027');
  });

  it('cobre os doze meses', () => {
    const names = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];
    names.forEach((name, index) => {
      const month = `2026-${String(index + 1).padStart(2, '0')}`;
      expect(formatMonthLabel(month)).toBe(`${name} de 2026`);
    });
  });

  it('lança RangeError para mês inválido', () => {
    expect(() => formatMonthLabel('2026-13')).toThrow(RangeError);
    expect(() => formatMonthLabel('2026-00')).toThrow(RangeError);
    expect(() => formatMonthLabel('2026-1')).toThrow(RangeError);
    expect(() => formatMonthLabel('')).toThrow(RangeError);
    expect(() => formatMonthLabel('2026-11-14')).toThrow(RangeError);
  });
});

describe('formatDayLabel', () => {
  const today = '2026-11-14'; // sábado

  it('"Hoje" para o mesmo dia', () => {
    expect(formatDayLabel('2026-11-14', today)).toBe('Hoje');
  });

  it('"Ontem" para o dia anterior', () => {
    expect(formatDayLabel('2026-11-13', today)).toBe('Ontem');
  });

  it('"Ontem" na virada de mês', () => {
    expect(formatDayLabel('2026-10-31', '2026-11-01')).toBe('Ontem');
    expect(formatDayLabel('2026-02-28', '2026-03-01')).toBe('Ontem');
  });

  it('"Ontem" na virada de ano', () => {
    expect(formatDayLabel('2025-12-31', '2026-01-01')).toBe('Ontem');
  });

  it('"Hoje" no primeiro dia do ano', () => {
    expect(formatDayLabel('2026-01-01', '2026-01-01')).toBe('Hoje');
  });

  it('dia da semana correto: 14/11/2026 é sábado', () => {
    expect(formatDayLabel('2026-11-14', '2026-11-20')).toBe('sáb., 14 de nov.');
  });

  it('cobre os sete dias da semana (08/11/2026 é domingo)', () => {
    const labels = ['08', '09', '10', '11', '12', '13', '14'].map((day) => formatDayLabel(`2026-11-${day}`, '2026-11-30'));
    expect(labels).toEqual([
      'dom., 8 de nov.',
      'seg., 9 de nov.',
      'ter., 10 de nov.',
      'qua., 11 de nov.',
      'qui., 12 de nov.',
      'sex., 13 de nov.',
      'sáb., 14 de nov.',
    ]);
  });

  it('dois dias atrás já mostra a data, sem dia zero à esquerda', () => {
    expect(formatDayLabel('2026-11-12', today)).toBe('qui., 12 de nov.');
    expect(formatDayLabel('2026-11-05', today)).toBe('qui., 5 de nov.');
  });

  it('o dia da semana não depende do fuso do aparelho (domingo 01/11/2026 e segunda 02/11/2026)', () => {
    expect(formatDayLabel('2026-11-01', today)).toBe('dom., 1 de nov.');
    expect(formatDayLabel('2026-11-02', today)).toBe('seg., 2 de nov.');
  });

  it('abreviações dos meses', () => {
    const expected = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
    expected.forEach((abbreviation, index) => {
      const month = String(index + 1).padStart(2, '0');
      expect(formatDayLabel(`2026-${month}-15`, '2026-12-31')).toContain(`15 de ${abbreviation}`);
    });
  });

  it('inclui o ano quando é diferente do de hoje', () => {
    expect(formatDayLabel('2025-11-13', today)).toBe('13 de nov. de 2025');
    expect(formatDayLabel('2025-12-30', '2026-01-02')).toBe('30 de dez. de 2025');
  });

  it('não inclui o ano nem dia da semana errado ao cruzar o ano só no calendário (31/12 vs 01/01)', () => {
    expect(formatDayLabel('2025-12-30', '2026-01-01')).toBe('30 de dez. de 2025');
  });

  it('ano bissexto: 29/02/2028 existe e é terça-feira', () => {
    expect(formatDayLabel('2028-02-29', '2028-03-05')).toBe('ter., 29 de fev.');
  });

  it('ano bissexto: 29/02 é "Ontem" para 01/03 e 28/02 é "Ontem" para 29/02', () => {
    expect(formatDayLabel('2028-02-29', '2028-03-01')).toBe('Ontem');
    expect(formatDayLabel('2028-02-28', '2028-02-29')).toBe('Ontem');
  });

  it('ano não bissexto: 28/02 e 01/03 são dias seguidos', () => {
    expect(formatDayLabel('2026-02-28', '2026-03-01')).toBe('Ontem');
  });

  it('29/02 de ano bissexto visto de outro ano mostra o ano', () => {
    expect(formatDayLabel('2028-02-29', '2029-03-01')).toBe('29 de fev. de 2028');
  });

  it('data futura não vira "Hoje" nem "Ontem" e mostra a data', () => {
    expect(formatDayLabel('2026-11-15', today)).toBe('dom., 15 de nov.');
    expect(formatDayLabel('2026-11-14', '2026-11-13')).toBe('sáb., 14 de nov.');
  });

  it('lança RangeError para data inválida', () => {
    expect(() => formatDayLabel('2026-02-29', today)).toThrow(RangeError);
    expect(() => formatDayLabel('2026-13-01', today)).toThrow(RangeError);
    expect(() => formatDayLabel('14/11/2026', today)).toThrow(RangeError);
    expect(() => formatDayLabel('', today)).toThrow(RangeError);
  });

  it('lança RangeError quando o "hoje" é inválido', () => {
    expect(() => formatDayLabel('2026-11-14', '2026-02-30')).toThrow(RangeError);
    expect(() => formatDayLabel('2026-11-14', 'hoje')).toThrow(RangeError);
  });
});

describe('formatInstallment', () => {
  it('formata "número/total"', () => {
    expect(formatInstallment(2, 3)).toBe('2/3');
    expect(formatInstallment(1, 12)).toBe('1/12');
    expect(formatInstallment(12, 12)).toBe('12/12');
  });

  it('compra à vista (sem parcelas) devolve null', () => {
    expect(formatInstallment(null, null)).toBeNull();
  });

  it('devolve null se faltar qualquer um dos dois', () => {
    expect(formatInstallment(1, null)).toBeNull();
    expect(formatInstallment(null, 3)).toBeNull();
  });

  it('1x aparece como "1/1"', () => {
    expect(formatInstallment(1, 1)).toBe('1/1');
  });
});

describe('formatFullDate', () => {
  it('escreve dia, mês por extenso e ano', () => {
    expect(formatFullDate('2026-11-14')).toBe('14 de novembro de 2026');
    expect(formatFullDate('2026-03-01')).toBe('1 de março de 2026');
  });

  it('aceita 29/02 de ano bissexto e o último dia do ano', () => {
    expect(formatFullDate('2028-02-29')).toBe('29 de fevereiro de 2028');
    expect(formatFullDate('2026-12-31')).toBe('31 de dezembro de 2026');
  });

  it('lança RangeError para data inválida', () => {
    expect(() => formatFullDate('2026-02-29')).toThrow(RangeError);
    expect(() => formatFullDate('14/11/2026')).toThrow(RangeError);
  });
});
