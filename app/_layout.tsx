import { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { SplashScreen } from 'expo-router';
import { Platform } from 'react-native';
import { AppContextProvider } from '@/context/AppContext';
import { initializeI18n } from '@/i18n';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const [isI18nInitialized, setIsI18nInitialized] = useState(false);

  const [loaded, error] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    const initApp = async () => {
      await initializeI18n();
      setIsI18nInitialized(true);
    };

    initApp();
  }, []);

  useEffect(() => {
    if ((loaded || error) && isI18nInitialized) {
      // Hide the splash screen after fonts have loaded and i18n is initialized
      SplashScreen.hideAsync();
    }
  }, [loaded, error, isI18nInitialized]);

  if (!loaded && !error) {
    return null;
  }

  if (!isI18nInitialized) {
    return null;
  }

  return (
    <AppContextProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
      </Stack>
    </AppContextProvider>
  );
}
