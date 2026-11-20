import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../theme';
import { AppText } from './AppText';

interface SectionProps {
  title: string;
  /** À direita do título (por exemplo, o link "Ver extrato"). */
  action?: ReactNode;
  /** Espaço entre o título e o conteúdo. */
  gap?: number;
  children: ReactNode;
}

/** Bloco de tela com título de seção (lido como cabeçalho) e o conteúdo embaixo. */
export function Section({ title, action, gap = spacing.sm, children }: SectionProps) {
  const heading = (
    <AppText variant="heading" accessibilityRole="header">
      {title}
    </AppText>
  );
  return (
    <View style={{ gap }}>
      {action ? (
        <View style={styles.header}>
          {heading}
          {action}
        </View>
      ) : (
        heading
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
