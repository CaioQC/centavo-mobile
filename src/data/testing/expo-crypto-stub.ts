// Substitui o `expo-crypto` (módulo nativo) nos testes do Vitest; ver vitest.config.mts.
export function randomUUID(): string {
  return globalThis.crypto.randomUUID();
}
