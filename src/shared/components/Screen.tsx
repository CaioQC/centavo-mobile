import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing, useTheme } from '../theme';
import { AppText } from './AppText';

interface ScreenProps {
  title: string;
  /** Espaço extra no rodapé, para o conteúdo não ficar atrás da barra de abas flutuante. */
  bottomInset?: number;
  children: ReactNode;
}

/** Fundo, título e margens comuns das telas. */
export function Screen({ title, bottomInset = 0, children }: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.bg, paddingTop: insets.top + spacing.lg, paddingBottom: bottomInset },
      ]}
    >
      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.lg },
  content: { flex: 1, paddingTop: spacing.lg },
});
