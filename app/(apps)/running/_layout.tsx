// app/(apps)/running/_layout.tsx
import Colors from '@/constants/Colors';
import { useAppContext } from '@/context/AppContext';
import { Stack } from 'expo-router';
import { Activity, BarChart2, Filter, Calendar } from 'lucide-react-native';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import CustomTabBar from '@/components/common/CustomTabBar';

export default function RunningLayout() {
  const { isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  // Définir les tabs pour Running - Ajout de l'onglet Programme
  const tabs = [
    {
      name: 'index',
      label: 'Journal',
      icon: ({ color, size }: { color: string; size: number }) => (
        <Activity size={size} color={color} />
      ),
    },
    {
      name: 'statistics',
      label: 'Stats',
      icon: ({ color, size }: { color: string; size: number }) => (
        <BarChart2 size={size} color={color} />
      ),
    },
    {
      name: 'program',
      label: 'Program',
      icon: ({ color, size }: { color: string; size: number }) => (
        <Calendar size={size} color={color} />
      ),
    },
    {
      name: 'filters',
      label: 'Filtres',
      icon: ({ color, size }: { color: string; size: number }) => (
        <Filter size={size} color={color} />
      ),
    },
  ];

  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="statistics" />
        <Stack.Screen name="program" />
        <Stack.Screen name="filters" />
      </Stack>

      <CustomTabBar
        tabs={tabs}
        baseRoute="/(apps)/running"
        activeColor={colors.secondary[500]}
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
