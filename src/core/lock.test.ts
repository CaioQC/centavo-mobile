import { describe, expect, it } from 'vitest';

import {
  BIOMETRIC_LOCK_SETTING_KEY,
  lockErrorMessage,
  nextLocked,
  parseBiometricLockSetting,
  serializeBiometricLockSetting,
  type AppStateName,
} from './lock';

describe('parseBiometricLockSetting', () => {
  it('sem valor gravado (primeira abertura) vem ligado', () => {
    expect(parseBiometricLockSetting(null)).toBe(true);
    expect(parseBiometricLockSetting(undefined)).toBe(true);
  });

  it("'true' é ligado e 'false' é desligado", () => {
    expect(parseBiometricLockSetting('true')).toBe(true);
    expect(parseBiometricLockSetting('false')).toBe(false);
  });

  it('valor desconhecido ou vazio não desliga o desbloqueio', () => {
    expect(parseBiometricLockSetting('')).toBe(true);
    expect(parseBiometricLockSetting('FALSE')).toBe(true);
    expect(parseBiometricLockSetting('0')).toBe(true);
  });
});

describe('serializeBiometricLockSetting', () => {
  it('grava como texto', () => {
    expect(serializeBiometricLockSetting(true)).toBe('true');
    expect(serializeBiometricLockSetting(false)).toBe('false');
  });

  it('ida e volta preserva o valor', () => {
    expect(parseBiometricLockSetting(serializeBiometricLockSetting(true))).toBe(true);
    expect(parseBiometricLockSetting(serializeBiometricLockSetting(false))).toBe(false);
  });

  it('a chave da configuração é estável', () => {
    expect(BIOMETRIC_LOCK_SETTING_KEY).toBe('biometric_lock_enabled');
  });
});

describe('nextLocked', () => {
  const allStates: AppStateName[] = ['active', 'inactive', 'background', 'unknown', 'extension'];

  it('desligado nunca trava, nem em segundo plano nem se já estava travado', () => {
    for (const state of allStates) {
      expect(nextLocked(false, false, state)).toBe(false);
      expect(nextLocked(true, false, state)).toBe(false);
    }
  });

  it('ligado: ir para o segundo plano trava', () => {
    expect(nextLocked(false, true, 'background')).toBe(true);
    expect(nextLocked(true, true, 'background')).toBe(true);
  });

  it('ligado: inactive não trava nem destrava (evita o laço do próprio pedido de biometria)', () => {
    expect(nextLocked(false, true, 'inactive')).toBe(false);
    expect(nextLocked(true, true, 'inactive')).toBe(true);
  });

  it('ligado: voltar para active não destrava sozinho nem trava', () => {
    expect(nextLocked(false, true, 'active')).toBe(false);
    expect(nextLocked(true, true, 'active')).toBe(true);
  });

  it('ligado: já travado continua travado em qualquer estado', () => {
    for (const state of allStates) {
      expect(nextLocked(true, true, state)).toBe(true);
    }
  });

  it('ligado: estados unknown e extension não mudam o estado', () => {
    expect(nextLocked(false, true, 'unknown')).toBe(false);
    expect(nextLocked(false, true, 'extension')).toBe(false);
  });
});

describe('lockErrorMessage', () => {
  const cancelled = 'Desbloqueio cancelado. Toque em "Desbloquear" para tentar de novo.';
  const generic = 'Não foi possível desbloquear. Tente de novo.';

  it('cancelamentos (usuário, sistema ou app) pedem para tentar de novo', () => {
    expect(lockErrorMessage('user_cancel')).toBe(cancelled);
    expect(lockErrorMessage('system_cancel')).toBe(cancelled);
    expect(lockErrorMessage('app_cancel')).toBe(cancelled);
  });

  it('lockout avisa de muitas tentativas', () => {
    expect(lockErrorMessage('lockout')).toBe('Muitas tentativas. Aguarde um pouco e tente de novo.');
  });

  it('sem biometria ou PIN cadastrado', () => {
    const message = 'Nenhuma biometria ou PIN cadastrado neste aparelho.';
    expect(lockErrorMessage('not_enrolled')).toBe(message);
    expect(lockErrorMessage('passcode_not_set')).toBe(message);
  });

  it('ausente, vazio ou desconhecido cai na mensagem genérica', () => {
    expect(lockErrorMessage(undefined)).toBe(generic);
    expect(lockErrorMessage('')).toBe(generic);
    expect(lockErrorMessage('erro_inventado')).toBe(generic);
    expect(lockErrorMessage('USER_CANCEL')).toBe(generic);
  });
});
