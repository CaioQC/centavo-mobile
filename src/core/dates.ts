// Datas: dia e mês sempre em America/Sao_Paulo, mesmo com o aparelho em outro fuso (ADR 10).
// Dia é "YYYY-MM-DD" e mês é "YYYY-MM", como gravados no SQLite.

export const APP_TIME_ZONE = 'America/Sao_Paulo';

/** Dia local no formato "YYYY-MM-DD". */
export type LocalDate = string;
/** Mês no formato "YYYY-MM". */
export type YearMonth = string;

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const YEAR_MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

/** Dia (em São Paulo) em que o instante cai. 23h30 de 31/01 em São Paulo continua 31/01, mesmo sendo 01/02 em UTC. */
export function toLocalDate(instant: Date): LocalDate {
  const parts = dayFormatter.formatToParts(instant);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${pick('year')}-${pick('month')}-${pick('day')}`;
}

/** Hoje em São Paulo. `now` existe para os testes. */
export function todayLocal(now: Date = new Date()): LocalDate {
  return toLocalDate(now);
}

/** Mês corrente em São Paulo. */
export function currentMonth(now: Date = new Date()): YearMonth {
  return monthOf(toLocalDate(now));
}

/** Confere se o texto é um dia real do calendário ("2026-02-29" não é). */
export function isValidLocalDate(value: string): boolean {
  const match = LOCAL_DATE_PATTERN.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const probe = new Date(Date.UTC(year, month - 1, day));
  return probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day;
}

/** Confere se o texto é um mês válido ("2026-13" não é). */
export function isValidYearMonth(value: string): boolean {
  const match = YEAR_MONTH_PATTERN.exec(value);
  if (!match) return false;
  const month = Number(match[2]);
  return month >= 1 && month <= 12;
}

/** Mês de um dia: "2026-11-30" → "2026-11". */
export function monthOf(date: LocalDate): YearMonth {
  if (!isValidLocalDate(date)) throw new RangeError(`Data inválida: ${date}`);
  return date.slice(0, 7);
}

/** Soma (ou subtrai) meses a um mês: ("2026-11", 2) → "2027-01". */
export function addMonths(month: YearMonth, months: number): YearMonth {
  if (!isValidYearMonth(month)) throw new RangeError(`Mês inválido: ${month}`);
  if (!Number.isInteger(months)) throw new RangeError(`Quantidade de meses deve ser inteira: ${months}`);
  const [year, monthNumber] = month.split('-').map(Number) as [number, number];
  const index = year * 12 + (monthNumber - 1) + months;
  const newYear = Math.floor(index / 12);
  const newMonth = (index % 12 + 12) % 12 + 1;
  return `${String(newYear).padStart(4, '0')}-${String(newMonth).padStart(2, '0')}`;
}

/**
 * Mês do orçamento de uma parcela (ADR 11): mês da compra + (número da parcela − 1).
 * Compra à vista é a parcela 1. `purchaseDate` é o dia da compra (a parcela 1).
 */
export function budgetMonth(purchaseDate: LocalDate, installmentNumber = 1): YearMonth {
  if (!Number.isInteger(installmentNumber) || installmentNumber < 1) {
    throw new RangeError(`Número da parcela deve ser inteiro a partir de 1: ${installmentNumber}`);
  }
  return addMonths(monthOf(purchaseDate), installmentNumber - 1);
}

/**
 * Primeiro dia do mês e primeiro dia do mês seguinte: o intervalo `[start, endExclusive)` que
 * seleciona os dias de um mês com `date >= start AND date < endExclusive`.
 * Como os dias são texto "YYYY-MM-DD", a comparação alfabética é a cronológica.
 */
export function monthRange(month: YearMonth): { start: LocalDate; endExclusive: LocalDate } {
  if (!isValidYearMonth(month)) throw new RangeError(`Mês inválido: ${month}`);
  return { start: `${month}-01`, endExclusive: `${addMonths(month, 1)}-01` };
}
