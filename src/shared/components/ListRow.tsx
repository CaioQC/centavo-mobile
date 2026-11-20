import type { ComponentType, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { LucideProps } from 'lucide-react-native';

import { MIN_TOUCH_SIZE, radius, spacing, useTheme } from '../theme';
import { AppText } from './AppText';
import { Card } from './Card';

interface ListRowProps {
  /** Ícone Lucide dentro de um quadrado na cor de trilha. */
  icon?: ComponentType<LucideProps>;
  /** Alternativa ao `icon`: qualquer elemento à esquerda (por exemplo, o `CategoryBadge`). */
  leading?: ReactNode;
  title: string;
  /** Texto (vira legenda cinza) ou elemento próprio. */
  subtitle?: ReactNode;
  /** `captionMoney` quando o subtítulo traz valores (algarismos tabulares). */
  subtitleVariant?: 'caption' | 'captionMoney';
  /** Limite de linhas do subtítulo em texto; sem valor, quebra livremente. */
  subtitleLines?: number;
  /** À direita: valor, porcentagem, seta. */
  trailing?: ReactNode;
  /** Quando existe, a linha inteira vira um botão. */
  onPress?: () => void;
  /** Texto lido pelo leitor de tela (título, subtítulo e valor numa frase só). */
  accessibilityLabel?: string;
  /** Conteúdo abaixo do cabeçalho: barra de progresso, botão. */
  children?: ReactNode;
}

/** Linha em cartão: [ícone] título e subtítulo [à direita], com conteúdo opcional embaixo. Base de contas, extrato, bancos, orçamento e metas. */
export function ListRow({
  icon: Icon,
  leading,
  title,
  subtitle,
  subtitleVariant = 'caption',
  subtitleLines,
  trailing,
  onPress,
  accessibilityLabel,
  children,
}: ListRowProps) {
  const { colors } = useTheme();
  const header = (
    <View style={styles.header}>
      {Icon ? (
        <View style={[styles.icon, { backgroundColor: colors.track }]}>
          <Icon size={20} color={colors.muted} strokeWidth={1.75} />
        </View>
      ) : (
        leading
      )}
      <View style={styles.texts}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {title}
        </AppText>
        {typeof subtitle === 'string' ? (
          <AppText variant={subtitleVariant} tone="muted" numberOfLines={subtitleLines}>
            {subtitle}
          </AppText>
        ) : (
          subtitle
        )}
      </View>
      {trailing}
    </View>
  );

  // Com `onPress` o rótulo fica no cartão inteiro; sem ele, só o cabeçalho é agrupado, para um botão
  // embaixo (como "Sincronizar de novo") continuar sendo um elemento à parte.
  return (
    <Card onPress={onPress} accessibilityLabel={onPress ? accessibilityLabel : undefined} style={styles.card}>
      {onPress || accessibilityLabel === undefined ? (
        header
      ) : (
        <View accessible accessibilityLabel={accessibilityLabel}>
          {header}
        </View>
      )}
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: MIN_TOUCH_SIZE + spacing.lg, gap: spacing.md, padding: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 40, height: 40, borderRadius: radius.categoryIcon, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1 },
});
