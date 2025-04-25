import Colors from '@/constants/Colors';
import { useAppContext } from '@/context/AppContext';
import { Tabs } from 'expo-router';
import { BarChart2, Home, Settings, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { Platform } from 'react-native';
import { useTranslation } from '@/i18n/hooks/useTranslation';

export default function TabLayout() {
  const { isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const { t } = useTranslation();

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
        tabBarActiveTintColor: colors.primary[500],
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
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="insights"
        options={{
          title: 'Tendances',
          tabBarIcon: ({ color, size }) => (
            <TrendingUp color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: 'Historique',
          tabBarIcon: ({ color, size }) => (
            <BarChart2 color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Réglages',
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}