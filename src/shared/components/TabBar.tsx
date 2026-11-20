import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, type Tabs } from 'expo-router';
import { ChartPie, House, Plus, ReceiptText, Target, type LucideIcon } from 'lucide-react-native';

import { MIN_TOUCH_SIZE, radius, spacing, useTheme } from '../theme';
import { AppText } from './AppText';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TAB_BAR_HEIGHT = 68;
const TAB_BAR_MARGIN = spacing.sm;
const ADD_BUTTON_SIZE = 56;

/** Espaço que as telas das abas reservam no rodapé para a barra flutuante (somar a área segura). */
export const TAB_BAR_CLEARANCE = TAB_BAR_HEIGHT + TAB_BAR_MARGIN * 2;

const icons: Record<string, LucideIcon> = {
  index: House,
  statement: ReceiptText,
  budget: ChartPie,
  goals: Target,
};

/** Barra de abas flutuante: duas abas, o botão "+" no centro e mais duas abas. */
export function TabBar({ state, descriptors, emitter, navigateToTab }: TabBarProps) {
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();

  const renderTab = (routeName: string) => {
    const index = state.routes.findIndex((route) => route.name === routeName);
    const route = state.routes[index];
    if (!route) return null;
    const focused = state.index === index;
    const label = descriptors[route.key]?.options.title ?? route.name;
    const Icon = icons[route.name] ?? House;
    const color = focused ? colors.accentText : colors.muted;

    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected: focused }}
        onPress={() => {
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigateToTab(route.key);
        }}
        style={styles.tab}
      >
        <Icon size={22} color={color} strokeWidth={focused ? 2.25 : 1.75} />
        <AppText variant="caption" style={{ color }}>
          {label}
        </AppText>
      </Pressable>
    );
  };

  return (
    <View
      style={[
        styles.bar,
        {
          bottom: insets.bottom + TAB_BAR_MARGIN,
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          // Claro: sombra suave. Escuro: só o contorno de 1 px.
          shadowColor: colors.shadow,
          shadowOpacity: scheme === 'light' ? 0.1 : 0,
          elevation: scheme === 'light' ? 6 : 0,
        },
      ]}
    >
      {renderTab('index')}
      {renderTab('statement')}
      <View style={styles.addSlot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Novo lançamento"
          onPress={() => router.push('/new-transaction')}
          style={[styles.addButton, { backgroundColor: colors.accent }]}
        >
          <Plus size={28} color={colors.onAccent} strokeWidth={2.5} />
        </Pressable>
      </View>
      {renderTab('budget')}
      {renderTab('goals')}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    height: TAB_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.cardLarge,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  tab: {
    flex: 1,
    minHeight: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addSlot: { width: ADD_BUTTON_SIZE + spacing.md, alignItems: 'center' },
  addButton: {
    width: ADD_BUTTON_SIZE,
    height: ADD_BUTTON_SIZE,
    borderRadius: ADD_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
