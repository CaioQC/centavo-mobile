import { describe, expect, it } from 'vitest';
import {
  accountBalance,
  groupAccountsByBank,
  MANUAL_GROUP_TITLE,
  MAX_ACCOUNT_NAME_LENGTH,
  totalBalance,
  validateNewManualAccount,
  type NewManualAccountForm,
} from './accounts';

describe('accountBalance', () => {
  it('soma o saldo inicial e as transações', () => {
    expect(accountBalance(100000, -25050)).toBe(74950);
    expect(accountBalance(0, 0)).toBe(0);
  });

  it('pode ficar negativo (cartão com fatura aberta)', () => {
    expect(accountBalance(0, -48990)).toBe(-48990);
    expect(accountBalance(10000, -30000)).toBe(-20000);
  });

  it('aceita valores grandes (R$ 1.000.000,00)', () => {
    expect(accountBalance(100000000, 1)).toBe(100000001);
  });
});

describe('totalBalance', () => {
  it('lista vazia dá zero', () => {
    expect(totalBalance([])).toBe(0);
  });

  it('soma os saldos', () => {
    expect(totalBalance([{ balanceInCents: 150000 }, { balanceInCents: 2500 }])).toBe(152500);
  });

  it('saldo do cartão entra negativo e abate o total', () => {
    expect(totalBalance([{ balanceInCents: 100000 }, { balanceInCents: -35000 }])).toBe(65000);
  });

  it('pode dar total negativo e total zero', () => {
    expect(totalBalance([{ balanceInCents: 1000 }, { balanceInCents: -5000 }])).toBe(-4000);
    expect(totalBalance([{ balanceInCents: 5000 }, { balanceInCents: -5000 }])).toBe(0);
  });
});

describe('groupAccountsByBank', () => {
  const acc = (id: string, institutionName: string | null, balanceInCents: number) => ({
    id,
    institutionName,
    balanceInCents,
  });

  it('sem contas, sem grupos', () => {
    expect(groupAccountsByBank([])).toEqual([]);
  });

  it('agrupa por banco e soma o total de cada grupo', () => {
    const groups = groupAccountsByBank([
      acc('a1', 'Banco Alfa', 100000),
      acc('a2', 'Banco Alfa', -20000),
      acc('b1', 'Banco Beta', 5000),
    ]);
    expect(groups.map((g) => [g.institutionName, g.title, g.totalInCents])).toEqual([
      ['Banco Alfa', 'Banco Alfa', 80000],
      ['Banco Beta', 'Banco Beta', 5000],
    ]);
    expect(groups[0]?.accounts.map((a) => a.id)).toEqual(['a1', 'a2']);
  });

  it('ordena os bancos pela primeira aparição, mesmo com contas intercaladas', () => {
    const groups = groupAccountsByBank([
      acc('b1', 'Banco Beta', 1),
      acc('a1', 'Banco Alfa', 2),
      acc('b2', 'Banco Beta', 3),
    ]);
    expect(groups.map((g) => g.institutionName)).toEqual(['Banco Beta', 'Banco Alfa']);
    expect(groups[0]?.accounts.map((a) => a.id)).toEqual(['b1', 'b2']);
  });

  it('o grupo manual vem sempre por último, mesmo que a conta manual apareça primeiro', () => {
    const groups = groupAccountsByBank([
      acc('m1', null, 3000),
      acc('a1', 'Banco Alfa', 100),
      acc('m2', null, 2000),
      acc('b1', 'Banco Beta', 200),
    ]);
    expect(groups.map((g) => g.institutionName)).toEqual(['Banco Alfa', 'Banco Beta', null]);
    const manual = groups[2];
    expect(manual?.title).toBe(MANUAL_GROUP_TITLE);
    expect(manual?.accounts.map((a) => a.id)).toEqual(['m1', 'm2']);
    expect(manual?.totalInCents).toBe(5000);
  });

  it('só contas manuais: um único grupo manual', () => {
    const groups = groupAccountsByBank([acc('m1', null, 1000)]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.institutionName).toBeNull();
  });

  it('sem contas manuais, não cria o grupo manual', () => {
    const groups = groupAccountsByBank([acc('a1', 'Banco Alfa', 100)]);
    expect(groups.some((g) => g.institutionName === null)).toBe(false);
  });

  it('saldo negativo de cartão entra no total do banco', () => {
    const groups = groupAccountsByBank([acc('a1', 'Banco Alfa', 10000), acc('a2', 'Banco Alfa', -48990)]);
    expect(groups[0]?.totalInCents).toBe(-38990);
  });

  it('grupo com total zero continua existindo', () => {
    const groups = groupAccountsByBank([acc('a1', 'Banco Alfa', 5000), acc('a2', 'Banco Alfa', -5000)]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.totalInCents).toBe(0);
  });

  it('não altera a lista recebida', () => {
    const input = [acc('m1', null, 1), acc('a1', 'Banco Alfa', 2)];
    const copy = structuredClone(input);
    groupAccountsByBank(input);
    expect(input).toEqual(copy);
  });
});

describe('validateNewManualAccount', () => {
  function form(overrides: Partial<NewManualAccountForm> = {}): NewManualAccountForm {
    return { name: 'Carteira', type: 'CASH', initialBalanceInCents: 5000, ...overrides };
  }

  it('formulário completo não tem erros (CASH e BANK)', () => {
    expect(validateNewManualAccount(form())).toEqual({});
    expect(validateNewManualAccount(form({ type: 'BANK' }))).toEqual({});
  });

  it('nome vazio ou só com espaços dá erro no nome', () => {
    expect(validateNewManualAccount(form({ name: '' })).name).toBeDefined();
    expect(validateNewManualAccount(form({ name: '     ' })).name).toBeDefined();
  });

  it('nome com 40 letras passa e com 41 não', () => {
    expect(validateNewManualAccount(form({ name: 'a'.repeat(MAX_ACCOUNT_NAME_LENGTH) }))).toEqual({});
    expect(validateNewManualAccount(form({ name: 'a'.repeat(MAX_ACCOUNT_NAME_LENGTH + 1) })).name).toContain('40');
  });

  it('espaços nas pontas não contam no limite', () => {
    expect(validateNewManualAccount(form({ name: `  ${'a'.repeat(40)}  ` }))).toEqual({});
    expect(validateNewManualAccount(form({ name: `  ${'a'.repeat(41)}  ` })).name).toBeDefined();
  });

  it('tipo fora de CASH e BANK dá erro no tipo', () => {
    const invalid = form({ type: 'CREDIT' as unknown as NewManualAccountForm['type'] });
    expect(validateNewManualAccount(invalid).type).toBeDefined();
  });

  it('saldo inicial zero e valor grande são aceitos', () => {
    expect(validateNewManualAccount(form({ initialBalanceInCents: 0 }))).toEqual({});
    expect(validateNewManualAccount(form({ initialBalanceInCents: 100000000 }))).toEqual({});
  });

  it('saldo inicial negativo dá erro', () => {
    expect(validateNewManualAccount(form({ initialBalanceInCents: -1 })).initialBalance).toBeDefined();
  });

  it('saldo inicial NaN, infinito ou decimal dá erro', () => {
    expect(validateNewManualAccount(form({ initialBalanceInCents: Number.NaN })).initialBalance).toBeDefined();
    expect(validateNewManualAccount(form({ initialBalanceInCents: Infinity })).initialBalance).toBeDefined();
    expect(validateNewManualAccount(form({ initialBalanceInCents: 10.5 })).initialBalance).toBeDefined();
  });

  it('reporta todos os erros de uma vez, cada um no seu campo', () => {
    const errors = validateNewManualAccount({
      name: ' ',
      type: 'X' as unknown as NewManualAccountForm['type'],
      initialBalanceInCents: -5,
    });
    expect(Object.keys(errors).sort()).toEqual(['initialBalance', 'name', 'type']);
  });
});
