import { Tabs } from 'expo-router';

import { TabBar } from '@/shared/components';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="statement" options={{ title: 'Extrato' }} />
      <Tabs.Screen name="budget" options={{ title: 'Orçamento' }} />
      <Tabs.Screen name="goals" options={{ title: 'Metas' }} />
    </Tabs>
  );
}
