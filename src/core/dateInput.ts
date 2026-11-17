// Digitação de data no formato brasileiro DD/MM/AAAA: o campo recebe só dígitos e a máscara
// põe as barras, como o campo de valor recebe só dígitos.

import { isValidLocalDate, type LocalDate } from './dates';

/** "14112026" → "14/11/2026"; aceita digitação parcial ("141" → "14/1") e ignora o que não é dígito. */
export function maskDateInput(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter((part) => part !== '');
  return parts.join('/');
}

/** "14/11/2026" → "2026-11-14"; devolve null se estiver incompleto ou não for um dia real do calendário. */
export function parseDateInput(input: string): LocalDate | null {
  const digits = input.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  const date = `${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
  return isValidLocalDate(date) ? date : null;
}

/** "2026-11-14" → "14/11/2026". */
export function formatDateInput(date: LocalDate): string {
  if (!isValidLocalDate(date)) throw new RangeError(`Data inválida: ${date}`);
  return `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`;
}
