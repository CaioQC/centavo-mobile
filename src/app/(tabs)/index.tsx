import { House } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, Screen, TAB_BAR_CLEARANCE } from '@/shared/components';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <Screen title="Início" bottomInset={TAB_BAR_CLEARANCE + insets.bottom}>
      <EmptyState
        icon={House}
        title="Nada por aqui ainda"
        message="Seu saldo e o gasto do mês aparecem aqui quando houver contas e lançamentos."
      />
    </Screen>
  );
}
