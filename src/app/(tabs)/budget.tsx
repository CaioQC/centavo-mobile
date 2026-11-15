import { ChartPie } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, Screen, TAB_BAR_CLEARANCE } from '@/shared/components';

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  return (
    <Screen title="Orçamento" bottomInset={TAB_BAR_CLEARANCE + insets.bottom}>
      <EmptyState
        icon={ChartPie}
        title="Nenhum limite definido"
        message="Defina quanto quer gastar em cada categoria no mês."
      />
    </Screen>
  );
}
