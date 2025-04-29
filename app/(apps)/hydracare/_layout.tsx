// app/(apps)/hydracare/_layout.tsx (mise à jour)
import Colors from '@/constants/Colors';
import { useAppContext } from '@/context/AppContext';
import { Stack } from 'expo-router';
import {
  BarChart2,
  TrendingUp,
  Calculator,
  Droplet,
} from 'lucide-react-native';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import CustomTabBar from '@/components/common/CustomTabBar';

export default function TabLayout() {
  const { isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  // Définir les tabs pour HydraCare
  const tabs = [
    {
      name: 'index',
      label: 'Accueil',
      icon: ({ color, size }: { color: string; size: number }) => (
        <Droplet size={size} color={color} />
      ),
    },
    {
      name: 'insights',
      label: 'Tendances',
      icon: ({ color, size }: { color: string; size: number }) => (
        <TrendingUp size={size} color={color} />
      ),
    },
    {
      name: 'history',
      label: 'Historique',
      icon: ({ color, size }: { color: string; size: number }) => (
        <BarChart2 size={size} color={color} />
      ),
    },
    {
      name: 'calculator',
      label: 'Calculer',
      icon: ({ color, size }: { color: string; size: number }) => (
        <Calculator size={size} color={color} />
      ),
    },
  ];

  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="insights" />
        <Stack.Screen name="history" />
        <Stack.Screen name="calculator" />
      </Stack>

      <CustomTabBar
        tabs={tabs}
        baseRoute="/(apps)/hydracare"
        activeColor={colors.primary[500]}
        inactiveColor={colors.neutral[400]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
