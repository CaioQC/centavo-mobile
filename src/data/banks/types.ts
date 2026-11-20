import type { AccountType } from '../types';
import type { BankScript } from './generate';

/** Conta de um banco fictício. */
export interface BankAccount {
  /** ID da conta no banco fictício (único por conexão) */
  externalId: string;
  name: string;
  type: AccountType;
  initialBalanceInCents: number;
  creditLimitInCents: number | null;
}

/** Banco do catálogo da conexão simulada: nome inventado, contas e roteiro de transações. */
export interface Bank {
  /** identifica o banco (vira `institution_key` da conexão) */
  key: string;
  name: string;
  /** frase curta para a lista de bancos */
  tagline: string;
  accounts: readonly BankAccount[];
  script: BankScript;
  /**
   * Chave em `settings` com o dia que ancora os dados do banco (o "hoje" da primeira importação):
   * sincronizar de novo em outro mês não muda valores nem duplica a compra parcelada.
   */
  anchorSettingKey: string;
}
