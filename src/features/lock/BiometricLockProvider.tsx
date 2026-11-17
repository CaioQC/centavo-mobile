import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Modal, StyleSheet, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

import {
  BIOMETRIC_LOCK_SETTING_KEY,
  lockErrorMessage,
  nextLocked,
  parseBiometricLockSetting,
  serializeBiometricLockSetting,
} from '../../core/lock';
import { getSetting, setSetting } from '../../data/repositories';
import { useDatabase } from '../../data/useDbQuery';
import { LockScreen } from './LockScreen';

interface BiometricLockValue {
  /** o usuário deixou o desbloqueio ligado */
  enabled: boolean;
  /** o aparelho tem biometria ou PIN cadastrado (sem isso o app não trava) */
  available: boolean;
  /** liga (depois de confirmar a identidade) ou desliga; devolve `false` se não conseguiu */
  setEnabled: (enabled: boolean) => Promise<boolean>;
}

const BiometricLockContext = createContext<BiometricLockValue>({
  enabled: false,
  available: false,
  setEnabled: async () => false,
});

export function useBiometricLock(): BiometricLockValue {
  return useContext(BiometricLockContext);
}

/** Há biometria ou PIN do aparelho cadastrado? Sem nenhum dos dois, travar o app deixaria o usuário de fora. */
async function deviceCanAuthenticate(): Promise<boolean> {
  try {
    return (await LocalAuthentication.getEnrolledLevelAsync()) !== LocalAuthentication.SecurityLevel.NONE;
  } catch {
    return false;
  }
}

/** Pede a digital ou o rosto; o PIN do aparelho é a alternativa. */
async function authenticate(): Promise<{ success: boolean; error?: string; message: string | null }> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Desbloquear o Centavo',
      cancelLabel: 'Cancelar',
    });
    return result.success
      ? { success: true, message: null }
      : { success: false, error: result.error, message: lockErrorMessage(result.error) };
  } catch {
    return { success: false, message: lockErrorMessage(undefined) };
  }
}

/**
 * Trava o app ao abrir e ao voltar do segundo plano enquanto o desbloqueio estiver ligado e o aparelho tiver
 * biometria ou PIN. O app fica montado por trás da tela de bloqueio, para o usuário voltar ao ponto em que estava.
 */
export function BiometricLockProvider({ children }: { children: ReactNode }) {
  const db = useDatabase();
  const [enabled, setEnabledState] = useState<boolean | null>(null);
  const [available, setAvailable] = useState(false);
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [attempt, setAttempt] = useState(0);
  const busy = useRef(false);
  // O pedido automático acontece uma vez a cada trava (abertura ou volta do segundo plano); depois só pelo botão.
  const autoPrompt = useRef(false);
  const toggling = useRef(false);
  const active = enabled === true && available;

  // Primeira leitura: ajuste gravado + o que o aparelho oferece. Falha ao ler = não trava.
  useEffect(() => {
    let mounted = true;
    Promise.all([getSetting(db, BIOMETRIC_LOCK_SETTING_KEY), deviceCanAuthenticate()]).then(
      ([value, canAuthenticate]) => {
        if (!mounted) return;
        const isEnabled = parseBiometricLockSetting(value);
        setAvailable(canAuthenticate);
        setEnabledState(isEnabled);
        setLocked(isEnabled && canAuthenticate);
        autoPrompt.current = true;
        setAppActive(AppState.currentState === 'active');
      },
      () => {
        if (!mounted) return;
        setEnabledState(false);
      },
    );
    return () => {
      mounted = false;
    };
  }, [db]);

  // Voltou do segundo plano: trava de novo.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setAppActive(state === 'active');
      // Durante o pedido de biometria o PIN do aparelho pode levar o app ao segundo plano: isso não é sair do app.
      if (busy.current) return;
      setLocked((current) => {
        const next = nextLocked(current, active, state);
        if (next && !current) autoPrompt.current = true;
        return next;
      });
    });
    return () => subscription.remove();
  }, [active]);

  // Travado e com o app na frente: pede a biometria (uma de cada vez).
  useEffect(() => {
    if (!locked || !appActive || busy.current || !autoPrompt.current) return;
    autoPrompt.current = false;
    busy.current = true;
    authenticate().then((result) => {
      busy.current = false;
      if (result.success) {
        setMessage(null);
        setLocked(false);
      } else {
        setMessage(result.message);
        // A biometria e o PIN sumiram com o app aberto: não há como desbloquear, então o app não trava.
        if (result.error === 'not_enrolled' || result.error === 'passcode_not_set' || result.error === 'not_available') {
          deviceCanAuthenticate().then((canAuthenticate) => {
            if (!canAuthenticate) {
              setAvailable(false);
              setLocked(false);
            }
          });
        }
      }
    });
  }, [locked, appActive, attempt]);

  const setEnabled = useCallback(
    async (next: boolean) => {
      if (toggling.current) return false;
      toggling.current = true;
      try {
        if (next) {
          if (!(await deviceCanAuthenticate())) {
            setAvailable(false);
            return false;
          }
          setAvailable(true);
          if (!(await authenticate()).success) return false;
        }
        await setSetting(db, BIOMETRIC_LOCK_SETTING_KEY, serializeBiometricLockSetting(next));
        setEnabledState(next);
        if (!next) setLocked(false);
        return true;
      } catch {
        return false;
      } finally {
        toggling.current = false;
      }
    },
    [db],
  );

  const value = useMemo(
    () => ({ enabled: enabled === true, available, setEnabled }),
    [enabled, available, setEnabled],
  );

  if (enabled === null) return null;

  return (
    <BiometricLockContext.Provider value={value}>
      <View
        style={styles.fill}
        importantForAccessibility={locked ? 'no-hide-descendants' : 'auto'}
        accessibilityElementsHidden={locked}
      >
        {children}
      </View>
      {/* Modal: cobre também as telas em modal do sistema (novo lançamento), que ficam acima de qualquer View. */}
      <Modal visible={locked} animationType="none" statusBarTranslucent onRequestClose={() => {}}>
        <LockScreen
          message={message}
          onRetry={() => {
            autoPrompt.current = true;
            setAttempt((count) => count + 1);
          }}
        />
      </Modal>
    </BiometricLockContext.Provider>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
