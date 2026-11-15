import { StyleSheet, View } from 'react-native';

import { Ellipsis } from 'lucide-react-native';

import { categoryIcons } from '../categoryIcons';
import { radius, useTheme } from '../theme';

interface CategoryBadgeProps {
  /** nome do ícone Lucide (`categories.icon`) */
  icon: string | null | undefined;
  /** chave de cor da categoria (`categories.color`) */
  color: string | null | undefined;
  size?: number;
}

/** Quadrado arredondado com o ícone da categoria, na cor dela (pastel no claro, translúcido no escuro). */
export function CategoryBadge({ icon, color, size = 40 }: CategoryBadgeProps) {
  const { category } = useTheme();
  const palette = (color ? (category as Record<string, { background: string; icon: string } | undefined>)[color] : undefined) ?? category.other;
  const Icon = (icon ? categoryIcons[icon] : undefined) ?? Ellipsis;
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[styles.box, { width: size, height: size, backgroundColor: palette.background }]}
    >
      <Icon size={size * 0.5} color={palette.icon} strokeWidth={2} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.categoryIcon, alignItems: 'center', justifyContent: 'center' },
});
