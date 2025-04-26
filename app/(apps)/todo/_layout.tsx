// app/(apps)/todo/_layout.tsx (mise à jour)
import Colors from '@/constants/Colors';
import { useAppContext } from '@/context/AppContext';
import { Stack } from 'expo-router';
import { Calendar, CheckSquare, Tag } from 'lucide-react-native';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import CustomTabBar from '@/components/common/CustomTabBar';

export default function TodoLayout() {
  const { isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  // Définir les tabs pour Todo
  const tabs = [
    {
      name: 'index',
      label: 'Tâches',
      icon: ({ color, size }: { color: string; size: number }) => (
        <CheckSquare size={size} color={color} />
      ),
    },
    {
      name: 'calendar',
      label: 'Calendrier',
      icon: ({ color, size }: { color: string; size: number }) => (
        <Calendar size={size} color={color} />
      ),
    },
    {
      name: 'tags',
      label: 'Étiquettes',
      icon: ({ color, size }: { color: string; size: number }) => (
        <Tag size={size} color={color} />
      ),
    },
  ];

  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="calendar" />
        <Stack.Screen name="tags" />
      </Stack>

      <CustomTabBar
        tabs={tabs}
        baseRoute="/(apps)/todo"
        activeColor={colors.accent[500]}
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
