// Extrato: filtrar, buscar e agrupar por dia. Funções puras sobre os dados que o repositório já trouxe.

import type { LocalDate } from './dates';

export interface StatementItem {
  date: LocalDate;
  description: string;
  /** negativo para despesa, positivo para receita */
  amountInCents: number;
  accountId: string;
  categoryId: string | null;
}

export interface StatementFilters {
  /** só desta conta; vazio ou ausente = todas */
  accountId?: string | null;
  /** só desta categoria; vazio ou ausente = todas */
  categoryId?: string | null;
  /** texto da busca; vazio = sem busca */
  query?: string;
}

export interface DayGroup<T> {
  date: LocalDate;
  items: T[];
  /** soma do dia (receitas − despesas) */
  totalInCents: number;
}

/** Minúsculas, sem acento e com espaços normalizados: "  Padaria  PÃO " → "padaria pao". */
export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Aplica conta, categoria e busca pela descrição (sem diferenciar maiúsculas nem acentos). A ordem é mantida. */
export function filterStatement<T extends StatementItem>(items: readonly T[], filters: StatementFilters): T[] {
  const query = normalizeSearch(filters.query ?? '');
  return items.filter((item) => {
    if (filters.accountId && item.accountId !== filters.accountId) return false;
    if (filters.categoryId && item.categoryId !== filters.categoryId) return false;
    if (query !== '' && !normalizeSearch(item.description).includes(query)) return false;
    return true;
  });
}

/** Agrupa por dia, do mais recente ao mais antigo; dentro de cada dia a ordem de entrada é mantida. */
export function groupByDay<T extends { date: LocalDate; amountInCents: number }>(items: readonly T[]): DayGroup<T>[] {
  const byDate = new Map<LocalDate, DayGroup<T>>();
  for (const item of items) {
    const group = byDate.get(item.date);
    if (group) {
      group.items.push(item);
      group.totalInCents += item.amountInCents;
    } else {
      byDate.set(item.date, { date: item.date, items: [item], totalInCents: item.amountInCents });
    }
  }
  return [...byDate.values()].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export interface StatementSummary {
  /** soma das receitas (positiva) */
  incomeInCents: number;
  /** soma das despesas (positiva, sem o sinal) */
  expenseInCents: number;
}

/** Totais de entradas e saídas das transações listadas. Valor zero não conta para nenhum lado. */
export function summarizeStatement(items: readonly { amountInCents: number }[]): StatementSummary {
  let incomeInCents = 0;
  let expenseInCents = 0;
  for (const { amountInCents } of items) {
    if (amountInCents > 0) incomeInCents += amountInCents;
    else if (amountInCents < 0) expenseInCents += -amountInCents;
  }
  return { incomeInCents, expenseInCents };
}
