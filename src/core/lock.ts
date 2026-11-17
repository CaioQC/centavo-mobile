// Desbloqueio por biometria: regras puras de quando travar e o que mostrar. A biometria em si (expo-local-authentication)
// fica em src/features/lock.

export const BIOMETRIC_LOCK_SETTING_KEY = 'biometric_lock_enabled';

/** Valor lido de `settings` → ligado? Sem valor gravado (primeira abertura) o desbloqueio vem ligado. */
export function parseBiometricLockSetting(value: string | null | undefined): boolean {
  return value !== 'false';
}

export function serializeBiometricLockSetting(enabled: boolean): string {
  return enabled ? 'true' : 'false';
}

/** Estados do app como o React Native os informa (`AppState`). */
export type AppStateName = 'active' | 'inactive' | 'background' | 'unknown' | 'extension';

/**
 * Trava de novo quando o app vai para o segundo plano. `inactive` não conta: o próprio pedido de biometria
 * deixa o app "inativo" por um instante, e travar nele criaria um laço. Desligado, nunca fica travado.
 */
export function nextLocked(locked: boolean, enabled: boolean, appState: AppStateName): boolean {
  if (!enabled) return false;
  return appState === 'background' ? true : locked;
}

/** Mensagem em português para o motivo da falha devolvido pelo `expo-local-authentication`. */
export function lockErrorMessage(error: string | undefined): string {
  switch (error) {
    case 'user_cancel':
    case 'system_cancel':
    case 'app_cancel':
      return 'Desbloqueio cancelado. Toque em "Desbloquear" para tentar de novo.';
    case 'lockout':
      return 'Muitas tentativas. Aguarde um pouco e tente de novo.';
    case 'not_enrolled':
    case 'passcode_not_set':
      return 'Nenhuma biometria ou PIN cadastrado neste aparelho.';
    default:
      return 'Não foi possível desbloquear. Tente de novo.';
  }
}
