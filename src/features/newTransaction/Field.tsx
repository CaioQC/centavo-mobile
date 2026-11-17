import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../shared/components';
import { spacing, useTheme } from '../../shared/theme';

interface FieldProps {
  label: string;
  /** mensagem de erro do campo, em português */
  error?: string;
  /** texto de apoio abaixo do campo (quando não há erro) */
  hint?: string;
  children: ReactNode;
}

/** Rótulo, campo e mensagem de erro (ou dica) do formulário. */
export function Field({ label, error, hint, children }: FieldProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.root}>
      <AppText variant="bodyStrong">{label}</AppText>
      {children}
      {error ? (
        <AppText variant="caption" style={{ color: colors.over }} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="captionMoney" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
});
