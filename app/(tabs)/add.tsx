import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';
import WaterActionButton from '@/components/WaterActionButton';

export default function AddScreen() {
  const { addWaterIntake, isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  
  const presetAmounts = [
    { amount: 250, label: 'Glass' },
    { amount: 330, label: 'Can' },
    { amount: 500, label: 'Bottle' },
    { amount: 750, label: 'Large Bottle' },
  ];
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {presetAmounts.map((preset, index) => (
            <WaterActionButton
              key={index}
              amount={preset.amount}
              label={preset.label}
              onPress={() => addWaterIntake(preset.amount)}
            />
          ))}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
});