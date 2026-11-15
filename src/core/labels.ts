// Rótulos de datas e parcelas em português. Nomes escritos aqui (não vêm do Intl) para sair
// igual em qualquer aparelho, inclusive sem dados de idioma.

import { isValidLocalDate, isValidYearMonth, type LocalDate, type YearMonth } from './dates';

const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
const MONTH_ABBREVIATIONS = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
const WEEKDAY_ABBREVIATIONS = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];

/** "2026-11" → "Novembro de 2026". */
export function formatMonthLabel(month: YearMonth): string {
  if (!isValidYearMonth(month)) throw new RangeError(`Mês inválido: ${month}`);
  const [year, monthNumber] = month.split('-').map(Number) as [number, number];
  const name = MONTH_NAMES[monthNumber - 1] as string;
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} de ${year}`;
}

/** Dia de calendário a partir de "YYYY-MM-DD", sem passar pelo fuso do aparelho. */
function parts(date: LocalDate): { year: number; month: number; day: number; weekday: number } {
  if (!isValidLocalDate(date)) throw new RangeError(`Data inválida: ${date}`);
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  return { year, month, day, weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay() };
}

/**
 * Título do grupo do dia no extrato: "Hoje", "Ontem" ou "sex., 13 de nov." (com o ano quando
 * não é o de `today`: "13 de nov. de 2025"). `today` é o dia de hoje em São Paulo.
 */
export function formatDayLabel(date: LocalDate, today: LocalDate): string {
  const target = parts(date);
  const now = parts(today);
  const diffDays = Math.round(
    (Date.UTC(now.year, now.month - 1, now.day) - Date.UTC(target.year, target.month - 1, target.day)) / 86_400_000,
  );
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  const monthLabel = MONTH_ABBREVIATIONS[target.month - 1] as string;
  if (target.year !== now.year) return `${target.day} de ${monthLabel} de ${target.year}`;
  return `${WEEKDAY_ABBREVIATIONS[target.weekday]}, ${target.day} de ${monthLabel}`;
}

/** Parcela no extrato: (2, 3) → "2/3"; compra à vista (sem parcelas) → null. */
export function formatInstallment(number: number | null, total: number | null): string | null {
  if (number === null || total === null) return null;
  return `${number}/${total}`;
}
