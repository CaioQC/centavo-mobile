// Contas: saldo, agrupamento por banco e validação da conta manual. Funções puras (ADR 01: tudo em centavos).

/** Saldo = saldo inicial + soma das transações da conta. É calculado, nunca gravado (modelo de dados). */
export function accountBalance(initialBalanceInCents: number, transactionsSumInCents: number): number {
  return initialBalanceInCents + transactionsSumInCents;
}

/** Soma dos saldos. Cartão com saldo devedor entra negativo, então o total é o que sobra depois de pagar a fatura. */
export function totalBalance(items: readonly { balanceInCents: number }[]): number {
  return items.reduce((sum, item) => sum + item.balanceInCents, 0);
}

/** Título do grupo das contas que não vêm de um banco conectado. */
export const MANUAL_GROUP_TITLE = 'Contas manuais';

export interface AccountGroup<T> {
  /** nome do banco; nulo no grupo das contas manuais */
  institutionName: string | null;
  title: string;
  accounts: T[];
  totalInCents: number;
}

/**
 * Agrupa as contas por banco, na ordem em que cada banco aparece, e põe as contas manuais num grupo
 * no fim. Dentro de cada grupo a ordem de entrada é mantida.
 */
export function groupAccountsByBank<T extends { institutionName: string | null; balanceInCents: number }>(
  accounts: readonly T[],
): AccountGroup<T>[] {
  const banks = new Map<string, AccountGroup<T>>();
  const manual: AccountGroup<T> = { institutionName: null, title: MANUAL_GROUP_TITLE, accounts: [], totalInCents: 0 };
  for (const account of accounts) {
    let group = manual;
    if (account.institutionName !== null) {
      const existing = banks.get(account.institutionName);
      group = existing ?? {
        institutionName: account.institutionName,
        title: account.institutionName,
        accounts: [],
        totalInCents: 0,
      };
      if (!existing) banks.set(account.institutionName, group);
    }
    group.accounts.push(account);
    group.totalInCents += account.balanceInCents;
  }
  return manual.accounts.length > 0 ? [...banks.values(), manual] : [...banks.values()];
}

/** Tipos que o usuário pode criar à mão: dinheiro em espécie ou uma conta fora da conexão simulada. */
export type ManualAccountType = 'CASH' | 'BANK';

export const MANUAL_ACCOUNT_TYPES: readonly ManualAccountType[] = ['CASH', 'BANK'];

export const MAX_ACCOUNT_NAME_LENGTH = 40;

export interface NewManualAccountForm {
  name: string;
  type: ManualAccountType;
  /** saldo inicial digitado, em centavos e sem sinal */
  initialBalanceInCents: number;
}

export type NewManualAccountField = 'name' | 'type' | 'initialBalance';
export type NewManualAccountErrors = Partial<Record<NewManualAccountField, string>>;

/** Erros do formulário de conta manual por campo (objeto vazio = pode salvar). */
export function validateNewManualAccount(form: NewManualAccountForm): NewManualAccountErrors {
  const errors: NewManualAccountErrors = {};
  const name = form.name.trim();
  if (name === '') errors.name = 'Informe o nome da conta.';
  else if (name.length > MAX_ACCOUNT_NAME_LENGTH) {
    errors.name = `O nome pode ter até ${MAX_ACCOUNT_NAME_LENGTH} letras.`;
  }
  if (!MANUAL_ACCOUNT_TYPES.includes(form.type)) errors.type = 'Escolha o tipo da conta.';
  if (!Number.isSafeInteger(form.initialBalanceInCents) || form.initialBalanceInCents < 0) {
    errors.initialBalance = 'Informe um saldo inicial válido, de zero para cima.';
  }
  return errors;
}
