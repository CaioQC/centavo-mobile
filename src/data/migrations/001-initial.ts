import type { Migration } from './types';

// Migração 1: todas as tabelas de docs/mobile/modelo-de-dados.md e as categorias fixas.
// IDs em UUID (TEXT), valores em centavos (INTEGER), dias "YYYY-MM-DD" e meses "YYYY-MM".
// As categorias têm ID fixo (igual à chave de cor) para os dados de exemplo as referenciarem.
// `icon` guarda o nome do ícone Lucide; `color` guarda a chave de cor do tema (CategoryColorKey).

export const initialMigration: Migration = {
  version: 1,
  statements: [
    `CREATE TABLE connections (
      id TEXT PRIMARY KEY NOT NULL,
      institution_key TEXT NOT NULL,
      institution_name TEXT NOT NULL,
      connected_at TEXT NOT NULL,
      last_synced_at TEXT
    )`,
    `CREATE TABLE accounts (
      id TEXT PRIMARY KEY NOT NULL,
      connection_id TEXT REFERENCES connections(id),
      source TEXT NOT NULL CHECK (source IN ('SIMULATED', 'MANUAL')),
      external_id TEXT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('BANK', 'CREDIT_CARD', 'CASH')),
      initial_balance_in_cents INTEGER NOT NULL DEFAULT 0,
      credit_limit_in_cents INTEGER,
      archived_at TEXT
    )`,
    `CREATE UNIQUE INDEX accounts_connection_external_unique
      ON accounts (connection_id, external_id) WHERE external_id IS NOT NULL`,
    `CREATE TABLE categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('EXPENSE', 'INCOME')),
      icon TEXT NOT NULL,
      color TEXT NOT NULL
    )`,
    `CREATE TABLE transactions (
      id TEXT PRIMARY KEY NOT NULL,
      account_id TEXT NOT NULL REFERENCES accounts(id),
      source TEXT NOT NULL CHECK (source IN ('SIMULATED', 'MANUAL')),
      external_id TEXT,
      description TEXT NOT NULL,
      amount_in_cents INTEGER NOT NULL,
      date TEXT NOT NULL,
      budget_month TEXT NOT NULL,
      category_id TEXT REFERENCES categories(id),
      category_source TEXT NOT NULL DEFAULT 'IMPORT' CHECK (category_source IN ('IMPORT', 'MANUAL')),
      installment_group_id TEXT,
      installment_number INTEGER,
      total_installments INTEGER,
      note TEXT,
      created_at TEXT NOT NULL
    )`,
    `CREATE INDEX transactions_budget_month_category ON transactions (budget_month, category_id)`,
    `CREATE INDEX transactions_account_date ON transactions (account_id, date)`,
    `CREATE UNIQUE INDEX transactions_account_external_unique
      ON transactions (account_id, external_id) WHERE external_id IS NOT NULL`,
    `CREATE TABLE budgets (
      id TEXT PRIMARY KEY NOT NULL,
      month TEXT NOT NULL,
      category_id TEXT NOT NULL REFERENCES categories(id),
      limit_in_cents INTEGER NOT NULL,
      UNIQUE (month, category_id)
    )`,
    `CREATE TABLE goals (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      target_in_cents INTEGER NOT NULL,
      target_date TEXT,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at TEXT NOT NULL,
      archived_at TEXT
    )`,
    `CREATE TABLE goal_contributions (
      id TEXT PRIMARY KEY NOT NULL,
      goal_id TEXT NOT NULL REFERENCES goals(id),
      amount_in_cents INTEGER NOT NULL,
      date TEXT NOT NULL
    )`,
    `CREATE INDEX goal_contributions_goal ON goal_contributions (goal_id)`,
    `CREATE TABLE settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    )`,
    `INSERT INTO categories (id, name, kind, icon, color) VALUES
      ('housing', 'Moradia', 'EXPENSE', 'House', 'housing'),
      ('food', 'Alimentação', 'EXPENSE', 'Utensils', 'food'),
      ('transport', 'Transporte', 'EXPENSE', 'Car', 'transport'),
      ('health', 'Saúde', 'EXPENSE', 'HeartPulse', 'health'),
      ('leisure', 'Lazer', 'EXPENSE', 'PartyPopper', 'leisure'),
      ('shopping', 'Compras', 'EXPENSE', 'ShoppingBag', 'shopping'),
      ('subscriptions', 'Assinaturas', 'EXPENSE', 'Repeat', 'subscriptions'),
      ('education', 'Educação', 'EXPENSE', 'GraduationCap', 'education'),
      ('other', 'Outros', 'EXPENSE', 'Ellipsis', 'other'),
      ('salary', 'Salário', 'INCOME', 'Banknote', 'income'),
      ('other-income', 'Outras receitas', 'INCOME', 'CirclePlus', 'income')`,
  ],
};
