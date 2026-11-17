import { useEffect } from 'react';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { DatabaseProvider } from '@/data/DatabaseProvider';
import { BiometricLockProvider } from '@/features/lock/BiometricLockProvider';
import { ThemePreferenceProvider } from '@/features/settings/ThemePreferenceProvider';
import { useTheme } from '@/shared/theme';

// Mantém a splash até as fontes e o banco estarem prontos.
SplashScreen.preventAutoHideAsync();

function HideSplashWhenMounted() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);
  return null;
}

function AppShell() {
  const { colors, scheme } = useTheme();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="new-transaction" options={{ presentation: 'modal' }} />
        <Stack.Screen name="accounts" />
        <Stack.Screen name="new-account" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings" />
      </Stack>
      <HideSplashWhenMounted />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <DatabaseProvider>
      <ThemePreferenceProvider>
        <BiometricLockProvider>
          <AppShell />
        </BiometricLockProvider>
      </ThemePreferenceProvider>
    </DatabaseProvider>
  );
}
