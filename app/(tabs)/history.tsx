import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';
import DailyHistoryChart from '@/components/DailyHistoryChart';

export default function HistoryScreen() {
  const { isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>
          Water Intake History
        </Text>
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <DailyHistoryChart />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginTop: 40,
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});