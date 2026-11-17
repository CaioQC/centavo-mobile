import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { House, Landmark } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ShortcutRow } from '@/features/home/ShortcutRow';
import { EmptyState, Screen, TAB_BAR_CLEARANCE } from '@/shared/components';
import { spacing } from '@/shared/theme';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <Screen title="Início" bottomInset={TAB_BAR_CLEARANCE + insets.bottom}>
      <View style={styles.content}>
        <EmptyState
          icon={House}
          title="Nada por aqui ainda"
          message="Seu saldo e o gasto do mês aparecem aqui quando houver contas e lançamentos."
        />
        <ShortcutRow
          icon={Landmark}
          title="Contas e conexões"
          subtitle="Saldo de cada conta"
          onPress={() => router.push('/accounts')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ content: { gap: spacing.lg } });
