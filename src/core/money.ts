// Centavos: todo valor monetário do app é um inteiro em centavos (ADR 01).
// Nunca há decimal, nem na digitação: o campo de valor recebe só dígitos.

/** Máximo de dígitos aceitos na digitação (R$ 999.999.999,99), bem abaixo de Number.MAX_SAFE_INTEGER. */
export const MAX_AMOUNT_DIGITS = 11;

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Converte o texto digitado em centavos, usando só os dígitos: "30000" → 30000 (R$ 300,00).
 * Qualquer outro caractere (vírgula, ponto, "R$", espaço, sinal) é ignorado.
 * Dígitos além de MAX_AMOUNT_DIGITS são descartados, e texto sem dígitos vale 0.
 */
export function parseDigitsToCents(input: string): number {
  const digits = input.replace(/\D/g, '').replace(/^0+/, '').slice(0, MAX_AMOUNT_DIGITS);
  return digits === '' ? 0 : Number(digits);
}

/** Formata centavos em reais no padrão pt-BR: 123456 → "R$ 1.234,56"; negativo → "-R$ 1,00". */
export function formatCents(amountInCents: number): string {
  if (!Number.isSafeInteger(amountInCents)) {
    throw new RangeError(`Valor em centavos deve ser inteiro seguro: ${amountInCents}`);
  }
  return currencyFormatter.format(amountInCents / 100);
}
