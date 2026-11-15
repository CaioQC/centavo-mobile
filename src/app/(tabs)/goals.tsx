import { Target } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, Screen, TAB_BAR_CLEARANCE } from '@/shared/components';

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <Screen title="Metas" bottomInset={TAB_BAR_CLEARANCE + insets.bottom}>
      <EmptyState
        icon={Target}
        title="Nenhuma meta ainda"
        message="Crie uma meta de economia e acompanhe o progresso dos aportes."
      />
    </Screen>
  );
}
