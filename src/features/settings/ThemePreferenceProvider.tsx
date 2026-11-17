import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Appearance } from 'react-native';

import { parseThemePreference, THEME_SETTING_KEY, type ThemePreference } from '../../core/themePreference';
import { getSetting, setSetting } from '../../data/repositories';
import { useDatabase } from '../../data/useDbQuery';
import { ThemePreferenceContext } from '../../shared/theme';

/** Faz também os diálogos e controles nativos (Alert, Switch) seguirem o tema escolhido; `unspecified` volta ao sistema. */
function applyNativeScheme(preference: ThemePreference) {
  Appearance.setColorScheme(preference === 'LIGHT' ? 'light' : preference === 'DARK' ? 'dark' : 'unspecified');
}

/**
 * Lê a preferência de tema do banco antes de mostrar o app (sem piscar o tema errado) e a grava ao trocar.
 * Se a leitura falhar, segue o sistema; se a gravação falhar, a escolha vale até fechar o app.
 */
export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const db = useDatabase();
  const [preference, setPreferenceState] = useState<ThemePreference | null>(null);

  useEffect(() => {
    let active = true;
    getSetting(db, THEME_SETTING_KEY).then(
      (value) => {
        if (!active) return;
        const loaded = parseThemePreference(value);
        applyNativeScheme(loaded);
        setPreferenceState(loaded);
      },
      () => active && setPreferenceState('SYSTEM'),
    );
    return () => {
      active = false;
    };
  }, [db]);

  const setPreference = useCallback(
    (next: ThemePreference) => {
      applyNativeScheme(next);
      setPreferenceState(next);
      setSetting(db, THEME_SETTING_KEY, next).catch(() => {});
    },
    [db],
  );

  const value = useMemo(
    () => ({ preference: preference ?? 'SYSTEM', setPreference }),
    [preference, setPreference],
  );

  if (preference === null) return null;
  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}
