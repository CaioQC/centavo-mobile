// Conexão simulada: textos do resumo da sincronização e junção do catálogo de bancos com as conexões. Funções puras.

import { toLocalDate, APP_TIME_ZONE } from './dates';
import { formatDayLabel, formatFullDate } from './labels';

/** "1 conta nova" / "2 contas novas": o plural vem de `count`. */
export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export interface SyncCounts {
  newAccounts: number;
  newTransactions: number;
}

/** Frase do resumo: o que a sincronização trouxe de novo ou, se nada mudou, que está tudo atualizado. */
export function syncSummaryText({ newAccounts, newTransactions }: SyncCounts): string {
  const parts: string[] = [];
  if (newAccounts > 0) parts.push(pluralize(newAccounts, 'conta nova', 'contas novas'));
  if (newTransactions > 0) parts.push(pluralize(newTransactions, 'transação nova', 'transações novas'));
  if (parts.length === 0) return 'Nada de novo: tudo já estava atualizado.';
  return `Importamos ${parts.join(' e ')}.`;
}

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: APP_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/**
 * Quando o banco foi sincronizado pela última vez, em São Paulo: "Sincronizado hoje às 14:32",
 * "Sincronizado ontem às 09:10" ou "Sincronizado em 5 de novembro de 2026". Sem data (ou data
 * ilegível), "Ainda não sincronizado". `now` existe para os testes.
 */
export function lastSyncText(lastSyncedAt: string | null, now: Date = new Date()): string {
  if (lastSyncedAt === null) return 'Ainda não sincronizado';
  const instant = new Date(lastSyncedAt);
  if (Number.isNaN(instant.getTime())) return 'Ainda não sincronizado';
  const day = toLocalDate(instant);
  const label = formatDayLabel(day, toLocalDate(now));
  if (label === 'Hoje' || label === 'Ontem') {
    return `Sincronizado ${label.toLowerCase()} às ${timeFormatter.format(instant)}`;
  }
  return `Sincronizado em ${formatFullDate(day)}`;
}

export type BankListItem<B> = B & { connected: boolean; lastSyncedAt: string | null };

/**
 * Junta o catálogo com as conexões existentes (pela chave do banco): cada banco diz se já está
 * conectado e quando foi sincronizado. Mantém a ordem do catálogo.
 */
export function mergeBanksWithConnections<B extends { key: string }>(
  banks: readonly B[],
  connections: readonly { institutionKey: string; lastSyncedAt: string | null }[],
): BankListItem<B>[] {
  return banks.map((bank) => {
    const connection = connections.find((item) => item.institutionKey === bank.key);
    return { ...bank, connected: connection !== undefined, lastSyncedAt: connection?.lastSyncedAt ?? null };
  });
}
