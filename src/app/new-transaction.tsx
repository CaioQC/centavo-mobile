import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { CirclePlus } from 'lucide-react-native';

import { AppText, EmptyState, Screen } from '@/shared/components';

// Marcador do "Novo lançamento": o formulário entra na etapa 1 do roadmap.
export default function NewTransactionScreen() {
  return (
    <Screen title="Novo lançamento">
      <EmptyState
        icon={CirclePlus}
        title="Em breve"
        message="Aqui você vai lançar despesas e receitas, inclusive compras parceladas no cartão."
      />
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center' }}>
        <AppText tone="accent" variant="bodyStrong">
          Fechar
        </AppText>
      </Pressable>
    </Screen>
  );
}
