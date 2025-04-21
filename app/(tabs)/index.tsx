import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  SafeAreaView, 
  FlatList 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import DailyProgressCard from '@/components/DailyProgressCard';
import WaterGoalCard from '@/components/WaterGoalCard';
import WaterIntakeItem from '@/components/WaterIntakeItem';
import { useAppContext } from '@/context/AppContext';
import { Droplet } from 'lucide-react-native';
import Colors from '@/constants/Colors';

export default function HomeScreen() {
  const { todayIntake, isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  
  // Sort intake entries by timestamp (newest first)
  const sortedIntake = [...todayIntake].sort((a, b) => b.timestamp - a.timestamp);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.logo, { color: colors.primary[500] }]}>
            Hydra<Text style={{ color: colors.text }}>Care</Text>
          </Text>
        </View>
        
        <View style={styles.progressSection}>
          <DailyProgressCard />
        </View>
        
        <View style={styles.goalSection}>
          <WaterGoalCard />
        </View>
        
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Droplet size={20} color={colors.primary[500]} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Intake
            </Text>
          </View>
          
          {sortedIntake.length > 0 ? (
            <FlatList
              data={sortedIntake.slice(0, 5)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <WaterIntakeItem
                  id={item.id}
                  amount={item.amount}
                  timestamp={item.timestamp}
                  unit={item.unit}
                />
              )}
              scrollEnabled={false}
            />
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.emptyStateText, { color: colors.neutral[500] }]}>
                No water intake recorded today.
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.neutral[400] }]}>
                Tap the + button to log your first drink!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginTop: 40,
    marginBottom: 24,
    alignItems: 'center',
  },
  logo: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
  },
  progressSection: {
    marginBottom: 16,
  },
  goalSection: {
    marginBottom: 24,
  },
  recentSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  emptyState: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});