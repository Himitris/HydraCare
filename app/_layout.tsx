// app/_layout.tsx
import { AppContextProvider, useAppContext } from '@/context/AppContext';
import { RunningContextProvider } from '@/context/RunningContext';
import { initializeI18n } from '@/i18n';
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
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import AppSwitcher from './AppSwitcher';
import { registerWidgets } from 'expo-widgets';
import HydraCareWidget from '../widgets/HydraCareWidget';


// Enregistrer les widgets
registerWidgets({ HydraCareWidget });

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Main content component with app context
function RootLayoutContent() {
  const { isDarkMode } = useAppContext();

  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    async function prepare() {
      try {
        await initializeI18n();
      } catch (e) {
        console.warn(e);
      } finally {
        if (fontsLoaded) {
          await SplashScreen.hideAsync();
        }
      }
    }
    prepare();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(apps)"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      <AppSwitcher />
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <AppContextProvider>
        <RunningContextProvider>
          <RootLayoutContent />
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
