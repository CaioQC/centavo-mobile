import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { MIN_TOUCH_SIZE, spacing, useTheme } from '../theme';
import { AppText } from './AppText';

interface ScreenProps {
  title: string;
  /** Espaço extra no rodapé, para o conteúdo não ficar atrás da barra de abas flutuante. */
  bottomInset?: number;
  /** Mostra o botão "Voltar" acima do título (telas empilhadas, fora das abas). */
  onBack?: () => void;
  children: ReactNode;
}

/** Fundo, título e margens comuns das telas. */
export function Screen({ title, bottomInset = 0, onBack, children }: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.bg, paddingTop: insets.top + spacing.lg, paddingBottom: bottomInset },
      ]}
    >
      {onBack ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={onBack} style={styles.back}>
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
      ) : null}
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
  back: { width: MIN_TOUCH_SIZE, height: MIN_TOUCH_SIZE, marginLeft: -spacing.sm, justifyContent: 'center' },
});
