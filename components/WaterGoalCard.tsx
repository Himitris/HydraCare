import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Target } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';
import ProgressCircle from './ProgressCircle';

export default function WaterGoalCard() {
  const { settings, isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  
  // Format goal based on user's preferred unit
  const formattedGoal = settings.preferredUnit === 'ml' 
    ? `${settings.dailyGoal} ml` 
    : `${Math.round(settings.dailyGoal * 0.033814)} oz`;
  
  return (
    <View 
      style={[
        styles.container, 
        { backgroundColor: colors.cardBackground }
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Target 
            size={20} 
            color={colors.primary[500]} 
          />
          <Text 
            style={[
              styles.title, 
              { color: colors.text }
            ]}
          >
            Daily Goal
          </Text>
        </View>
        <Text 
          style={[
            styles.goalText, 
            { color: colors.primary[500] }
          ]}
        >
          {formattedGoal}
        </Text>
      </View>
      
      <View style={styles.progressContainer}>
        <ProgressCircle />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  goalText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
});