import { SAMPLE_ACCOUNTS, SAMPLE_DATA_ANCHOR_KEY, SAMPLE_INSTITUTION } from '../sample/catalog';
import { JABUTICABA_SCRIPT } from '../sample/generate';
import { BANCO_PITANGA, CAJU_DIGITAL, COOPERATIVA_CAMBUCI } from './fictionalBanks';
import type { Bank } from './types';

/** O banco dos dados de exemplo, conectado na primeira abertura do app. */
export const BANCO_JABUTICABA: Bank = {
  key: SAMPLE_INSTITUTION.key,
  name: SAMPLE_INSTITUTION.name,
  tagline: 'Conta corrente e cartão de crédito.',
  // chave de sempre: quem já tinha os dados de exemplo mantém a mesma âncora
  anchorSettingKey: SAMPLE_DATA_ANCHOR_KEY,
  accounts: SAMPLE_ACCOUNTS,
  script: JABUTICABA_SCRIPT,
};

/** Bancos fictícios que a conexão simulada oferece, na ordem da lista. */
export const BANK_CATALOG: readonly Bank[] = [BANCO_JABUTICABA, BANCO_PITANGA, CAJU_DIGITAL, COOPERATIVA_CAMBUCI];

export function findBank(key: string): Bank | null {
  return BANK_CATALOG.find((bank) => bank.key === key) ?? null;
}
