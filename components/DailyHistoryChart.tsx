import React from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { format, subDays, isSameDay } from 'date-fns';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';

// Get window dimensions
const { width } = Dimensions.get('window');

export default function DailyHistoryChart() {
  const { history, settings, isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  
  // Generate data for the last 7 days
  const generateWeekData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      
      // Get intake for this day or default to 0
      const dayIntake = history[dateKey] || [];
      const totalAmount = dayIntake.reduce((sum, item) => sum + item.amount, 0);
      
      // Calculate percentage of goal
      const percentage = Math.min((totalAmount / settings.dailyGoal) * 100, 100);
      
      data.push({
        date,
        label: format(date, 'E'),
        amount: totalAmount,
        percentage,
        isToday: isSameDay(date, today),
      });
    }
    
    return data;
  };
  
  const weekData = generateWeekData();
  
  // Determine max bar height
  const maxBarHeight = 120;
  
  return (
    <View style={styles.container}>
      <Text 
        style={[
          styles.title, 
          { color: colors.text }
        ]}
      >
        Last 7 Days
      </Text>
      
      <View style={styles.chartContainer}>
        {weekData.map((day, index) => (
          <View key={index} style={styles.barContainer}>
            {/* Bar */}
            <View style={styles.barWrapper}>
              <View 
                style={[
                  styles.barBackground,
                  { backgroundColor: colors.neutral[200] },
                ]}
              />
              <View 
                style={[
                  styles.bar,
                  { 
                    height: `${day.percentage}%`,
                    backgroundColor: day.isToday 
                      ? colors.primary[500] 
                      : colors.primary[400],
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                  },
                ]}
              />
            </View>
            
            {/* Day label */}
            <Text 
              style={[
                styles.dayLabel,
                { 
                  color: day.isToday 
                    ? colors.primary[500] 
                    : colors.neutral[500],
                  fontFamily: day.isToday 
                    ? 'Inter-Bold' 
                    : 'Inter-Regular',
                },
              ]}
            >
              {day.label}
            </Text>
          </View>
        ))}
      </View>
      
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View 
            style={[
              styles.legendColor, 
              { backgroundColor: colors.primary[500] }
            ]} 
          />
          <Text 
            style={[
              styles.legendText, 
              { color: colors.text }
            ]}
          >
            Today
          </Text>
        </View>
        
        <View style={styles.legendItem}>
          <View 
            style={[
              styles.legendColor, 
              { backgroundColor: colors.primary[400] }
            ]} 
          />
          <Text 
            style={[
              styles.legendText, 
              { color: colors.text }
            ]}
          >
            Previous Days
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
  },
  barContainer: {
    alignItems: 'center',
    width: (width - 64) / 7, // Equal width for all bars with spacing
  },
  barWrapper: {
    width: 16,
    height: 120,
    position: 'relative',
  },
  barBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  bar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  dayLabel: {
    marginTop: 8,
    fontSize: 12,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
});