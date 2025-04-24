// app/(apps)/running/_layout.tsx
import Colors from '@/constants/Colors';
import { useAppContext } from '@/context/AppContext';
import { Tabs } from 'expo-router';
import { BarChart2, Filter, Home } from 'lucide-react-native';
import React from 'react';
import { Platform } from 'react-native';

export default function RunningLayout() {
  const { isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopWidth: 0,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.secondary[500],
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="statistics"
        options={{
          title: 'Statistiques',
          tabBarIcon: ({ color, size }) => (
            <BarChart2 color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="filters"
        options={{
          title: 'Filtres',
          tabBarIcon: ({ color, size }) => <Filter color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
