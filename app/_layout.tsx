// app/_layout.tsx (version mise à jour)
import { AppContextProvider, useAppContext } from '@/context/AppContext';
import { RunningContextProvider } from '@/context/RunningContext';
import { TodoContextProvider } from '@/context/TodoContext';
import { IntegrationContextProvider } from '@/context/IntegrationContext';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import Colors from '@/constants/Colors';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Content with all hooks and contexts
const AppContent = React.memo(() => {
  const { isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  // Optimiser les options de navigation
  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      animation: 'slide_from_right' as const,
      // Accélérer les transitions
      animationDuration: 200,
      // Éviter les rendus superposés
      freezeOnBlur: true,
    }),
    []
  );

  return (
    <View style={styles.container}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(apps)" />
        <Stack.Screen name="settings" />
      </Stack>
    </View>
  );
});

// Main layout component with all providers
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  // Optimisation: état pour suivre les rendus initiaux
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Attendre le chargement des polices et autres ressources
        if (fontsLoaded) {
          // Retarder légèrement pour permettre le rendu initial
          await new Promise((resolve) => setTimeout(resolve, 100));
          await SplashScreen.hideAsync();
          setIsAppReady(true);
        }
      } catch (e) {
        console.warn(e);
      }
    }
    prepare();
  }, [fontsLoaded]);

  if (!fontsLoaded || !isAppReady) {
    // Retourner un écran vide plutôt que null pour une meilleure transition
    return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <AppContextProvider>
        <RunningContextProvider>
          <TodoContextProvider>
            <IntegrationContextProvider>
              <AppContent />
            </IntegrationContextProvider>
          </TodoContextProvider>
        </RunningContextProvider>
      </AppContextProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
