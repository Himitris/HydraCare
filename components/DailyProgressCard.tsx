import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Droplet } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';
import WaterAnimation from './WaterAnimation';

export default function DailyProgressCard() {
  const { settings, dailyProgress, todayIntake, isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  
  // Calculate total intake today
  const totalIntake = todayIntake.reduce((sum, item) => sum + item.amount, 0);
  
  // Format based on user's preferred unit
  const formattedIntake = settings.preferredUnit === 'ml' 
    ? `${totalIntake} ml` 
    : `${Math.round(totalIntake * 0.033814)} oz`;
  
  // Format goal based on user's preferred unit
  const formattedGoal = settings.preferredUnit === 'ml' 
    ? `${settings.dailyGoal} ml` 
    : `${Math.round(settings.dailyGoal * 0.033814)} oz`;
  
  // Calculate percentage
  const percentage = Math.min(Math.round(dailyProgress * 100), 100);
  
  // Get progress status text and color
  const getStatusInfo = () => {
    if (percentage < 25) {
      return {
        text: "Dehydrated",
        color: colors.error[500]
      };
    } else if (percentage < 50) {
      return {
        text: "Drink more",
        color: colors.warning[500]
      };
    } else if (percentage < 75) {
      return {
        text: "Doing good",
        color: colors.success[500]
      };
    } else if (percentage < 100) {
      return {
        text: "Well hydrated",
        color: colors.success[600]
      };
    } else {
      return {
        text: "Goal achieved!",
        color: colors.success[500]
      };
    }
  };
  
  const status = getStatusInfo();
  
  return (
    <View 
      style={[
        styles.container, 
        { backgroundColor: colors.cardBackground }
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Droplet 
            size={20} 
            color={colors.primary[500]} 
            fill={colors.primary[200]}
          />
          <Text 
            style={[
              styles.title, 
              { color: colors.text }
            ]}
          >
            Today's Progress
          </Text>
        </View>
        <Text 
          style={[
            styles.statusText, 
            { color: status.color }
          ]}
        >
          {status.text}
        </Text>
      </View>
      
      <View style={styles.progressContainer}>
        <WaterAnimation size={180} />
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text 
            style={[
              styles.statValue, 
              { color: colors.text }
            ]}
          >
            {formattedIntake}
          </Text>
          <Text 
            style={[
              styles.statLabel, 
              { color: colors.neutral[500] }
            ]}
          >
            Consumed
          </Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text 
            style={[
              styles.statValue, 
              { color: colors.text }
            ]}
          >
            {percentage}%
          </Text>
          <Text 
            style={[
              styles.statLabel, 
              { color: colors.neutral[500] }
            ]}
          >
            of Goal
          </Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text 
            style={[
              styles.statValue, 
              { color: colors.text }
            ]}
          >
            {formattedGoal}
          </Text>
          <Text 
            style={[
              styles.statLabel, 
              { color: colors.neutral[500] }
            ]}
          >
            Daily Goal
          </Text>
        </View>
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
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 8,
  },
});