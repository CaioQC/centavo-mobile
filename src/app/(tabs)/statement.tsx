import { ReceiptText } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, Screen, TAB_BAR_CLEARANCE } from '@/shared/components';

export default function StatementScreen() {
  const insets = useSafeAreaInsets();
  return (
    <Screen title="Extrato" bottomInset={TAB_BAR_CLEARANCE + insets.bottom}>
      <EmptyState
        icon={ReceiptText}
        title="Nenhum lançamento ainda"
        message="Os lançamentos do mês aparecem aqui, agrupados por dia."
      />
    </Screen>
  );
}
