import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Droplet, Trash2 } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';
import { format } from 'date-fns';

interface WaterIntakeItemProps {
  id: string;
  amount: number;
  timestamp: number;
  unit: 'ml' | 'oz';
}

export default function WaterIntakeItem({
  id,
  amount,
  timestamp,
  unit,
}: WaterIntakeItemProps) {
  const { removeWaterIntake, isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  
  // Format the timestamp
  const timeString = format(new Date(timestamp), 'h:mm a');
  
  return (
    <View 
      style={[
        styles.container, 
        { backgroundColor: colors.cardBackground }
      ]}
    >
      <View style={styles.iconContainer}>
        <Droplet 
          size={24} 
          color={colors.primary[500]} 
          fill={colors.primary[300]} 
        />
      </View>
      
      <View style={styles.detailsContainer}>
        <Text 
          style={[
            styles.amountText, 
            { color: colors.text }
          ]}
        >
          {amount} {unit}
        </Text>
        <Text 
          style={[
            styles.timeText, 
            { color: colors.neutral[500] }
          ]}
        >
          {timeString}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => removeWaterIntake(id)}
      >
        <Trash2 
          size={18} 
          color={colors.error[500]} 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    marginRight: 12,
  },
  detailsContainer: {
    flex: 1,
  },
  amountText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  timeText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
});