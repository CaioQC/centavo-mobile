import { describe, expect, it } from 'vitest';
import { lastSyncText, mergeBanksWithConnections, pluralize, syncSummaryText } from './connections';

describe('pluralize', () => {
  it('zero usa o plural', () => {
    expect(pluralize(0, 'conta nova', 'contas novas')).toBe('0 contas novas');
  });

  it('um usa o singular', () => {
    expect(pluralize(1, 'conta nova', 'contas novas')).toBe('1 conta nova');
  });

  it('dois ou mais usam o plural', () => {
    expect(pluralize(2, 'conta nova', 'contas novas')).toBe('2 contas novas');
    expect(pluralize(120, 'transação nova', 'transações novas')).toBe('120 transações novas');
  });
});

describe('syncSummaryText', () => {
  it('só contas novas', () => {
    expect(syncSummaryText({ newAccounts: 1, newTransactions: 0 })).toBe('Importamos 1 conta nova.');
    expect(syncSummaryText({ newAccounts: 2, newTransactions: 0 })).toBe('Importamos 2 contas novas.');
  });

  it('só transações novas', () => {
    expect(syncSummaryText({ newAccounts: 0, newTransactions: 1 })).toBe('Importamos 1 transação nova.');
    expect(syncSummaryText({ newAccounts: 0, newTransactions: 15 })).toBe('Importamos 15 transações novas.');
  });

  it('contas e transações novas, cada uma no seu plural', () => {
    expect(syncSummaryText({ newAccounts: 2, newTransactions: 15 })).toBe(
      'Importamos 2 contas novas e 15 transações novas.',
    );
    expect(syncSummaryText({ newAccounts: 1, newTransactions: 1 })).toBe(
      'Importamos 1 conta nova e 1 transação nova.',
    );
  });

  it('tudo zero: tudo atualizado', () => {
    expect(syncSummaryText({ newAccounts: 0, newTransactions: 0 })).toBe('Nada de novo: tudo já estava atualizado.');
  });
});

describe('lastSyncText', () => {
  // 14/11/2026, 12h00 em São Paulo (UTC-3).
  const now = new Date('2026-11-14T15:00:00Z');

  it('sem data: ainda não sincronizado', () => {
    expect(lastSyncText(null, now)).toBe('Ainda não sincronizado');
  });

  it('data ilegível: ainda não sincronizado', () => {
    expect(lastSyncText('não é uma data', now)).toBe('Ainda não sincronizado');
    expect(lastSyncText('', now)).toBe('Ainda não sincronizado');
  });

  it('hoje, com a hora de São Paulo', () => {
    expect(lastSyncText('2026-11-14T14:32:00Z', now)).toBe('Sincronizado hoje às 11:32');
  });

  it('ontem, com a hora de São Paulo', () => {
    expect(lastSyncText('2026-11-13T12:10:00Z', now)).toBe('Sincronizado ontem às 09:10');
  });

  it('hora e minuto com zero à esquerda', () => {
    expect(lastSyncText('2026-11-14T12:05:00Z', now)).toBe('Sincronizado hoje às 09:05');
  });

  it('meia-noite de São Paulo aparece como 00:00, não 24:00', () => {
    expect(lastSyncText('2026-11-14T03:00:00Z', now)).toBe('Sincronizado hoje às 00:00');
  });

  it('02h00 UTC ainda é o dia anterior em São Paulo (ontem às 23:00)', () => {
    expect(lastSyncText('2026-11-14T02:00:00Z', now)).toBe('Sincronizado ontem às 23:00');
  });

  it('23h30 de São Paulo já é o dia seguinte em UTC, mas continua sendo hoje em São Paulo', () => {
    const lateNow = new Date('2026-11-15T02:45:00Z'); // 23h45 de 14/11 em São Paulo
    expect(lastSyncText('2026-11-15T02:30:00Z', lateNow)).toBe('Sincronizado hoje às 23:30');
  });

  it('23h30 de São Paulo vira "ontem" quando São Paulo já virou o dia', () => {
    const nextMorning = new Date('2026-11-15T12:00:00Z'); // 09h00 de 15/11 em São Paulo
    expect(lastSyncText('2026-11-15T02:30:00Z', nextMorning)).toBe('Sincronizado ontem às 23:30');
  });

  it('data antiga mostra o dia por extenso, sem hora', () => {
    expect(lastSyncText('2026-11-05T15:00:00Z', now)).toBe('Sincronizado em 5 de novembro de 2026');
    expect(lastSyncText('2025-12-31T15:00:00Z', now)).toBe('Sincronizado em 31 de dezembro de 2025');
  });

  it('dois dias atrás já não é "ontem"', () => {
    expect(lastSyncText('2026-11-12T15:00:00Z', now)).toBe('Sincronizado em 12 de novembro de 2026');
  });
});

describe('mergeBanksWithConnections', () => {
  const banks = [
    { key: 'banco-azul', name: 'Banco Azul', color: '#0000ff' },
    { key: 'banco-verde', name: 'Banco Verde', color: '#00ff00' },
    { key: 'banco-roxo', name: 'Banco Roxo', color: '#800080' },
  ];

  it('mantém a ordem do catálogo, qualquer que seja a ordem das conexões', () => {
    const result = mergeBanksWithConnections(banks, [
      { institutionKey: 'banco-roxo', lastSyncedAt: '2026-11-14T15:00:00Z' },
      { institutionKey: 'banco-azul', lastSyncedAt: null },
    ]);
    expect(result.map((bank) => bank.key)).toEqual(['banco-azul', 'banco-verde', 'banco-roxo']);
  });

  it('marca como conectado só o banco cuja chave tem conexão, com a data da sincronização', () => {
    const result = mergeBanksWithConnections(banks, [
      { institutionKey: 'banco-verde', lastSyncedAt: '2026-11-14T15:00:00Z' },
    ]);
    expect(result.map((bank) => [bank.key, bank.connected, bank.lastSyncedAt])).toEqual([
      ['banco-azul', false, null],
      ['banco-verde', true, '2026-11-14T15:00:00Z'],
      ['banco-roxo', false, null],
    ]);
  });

  it('conexão sem sincronização ainda conta como conectada, com lastSyncedAt null', () => {
    const [azul] = mergeBanksWithConnections(banks, [{ institutionKey: 'banco-azul', lastSyncedAt: null }]);
    expect(azul?.connected).toBe(true);
    expect(azul?.lastSyncedAt).toBeNull();
  });

  it('sem conexões, nenhum banco fica conectado', () => {
    const result = mergeBanksWithConnections(banks, []);
    expect(result).toHaveLength(3);
    expect(result.every((bank) => !bank.connected && bank.lastSyncedAt === null)).toBe(true);
  });

  it('conexão de chave desconhecida é ignorada', () => {
    const result = mergeBanksWithConnections(banks, [
      { institutionKey: 'banco-inexistente', lastSyncedAt: '2026-11-14T15:00:00Z' },
    ]);
    expect(result).toHaveLength(3);
    expect(result.some((bank) => bank.connected)).toBe(false);
  });

  it('catálogo vazio devolve lista vazia', () => {
    expect(mergeBanksWithConnections([], [{ institutionKey: 'banco-azul', lastSyncedAt: null }])).toEqual([]);
  });

  it('não altera os campos do banco, só acrescenta connected e lastSyncedAt', () => {
    const result = mergeBanksWithConnections(banks, [
      { institutionKey: 'banco-azul', lastSyncedAt: '2026-11-14T15:00:00Z' },
    ]);
    expect(result[0]).toEqual({
      key: 'banco-azul',
      name: 'Banco Azul',
      color: '#0000ff',
      connected: true,
      lastSyncedAt: '2026-11-14T15:00:00Z',
    });
    expect(result[1]).toEqual({
      key: 'banco-verde',
      name: 'Banco Verde',
      color: '#00ff00',
      connected: false,
      lastSyncedAt: null,
    });
  });

  it('não muda o catálogo original', () => {
    const original = banks.map((bank) => ({ ...bank }));
    mergeBanksWithConnections(banks, [{ institutionKey: 'banco-azul', lastSyncedAt: null }]);
    expect(banks).toEqual(original);
  });
});
