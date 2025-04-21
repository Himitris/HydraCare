import React from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  Platform
} from 'react-native';
import { DropletPlus } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  Easing
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';

interface WaterActionButtonProps {
  amount: number;
  label: string;
  onPress: () => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function WaterActionButton({ 
  amount, 
  label, 
  onPress 
}: WaterActionButtonProps) {
  const { isDarkMode, settings } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  
  // Animation values
  const scale = useSharedValue(1);
  
  // Handle press with animation and haptic feedback
  const handlePress = () => {
    // Scale down
    scale.value = withSpring(0.9, { damping: 10, stiffness: 200 });
    
    // Provide haptic feedback on non-web platforms
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Execute the onPress callback
    onPress();
    
    // Scale back up
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 10, stiffness: 200 });
    }, 100);
  };
  
  // Animated styles
  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });
  
  // Display unit based on user settings
  const unit = settings.preferredUnit;
  
  return (
    <AnimatedTouchable
      style={[styles.button, buttonStyle, { backgroundColor: colors.primary[500] }]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <DropletPlus color={isDarkMode ? colors.neutral[900] : "white"} size={24} />
      <Text style={[styles.amountText, { color: isDarkMode ? colors.neutral[900] : "white" }]}>
        {amount} {unit}
      </Text>
      <Text style={[styles.labelText, { color: isDarkMode ? colors.neutral[800] : colors.primary[100] }]}>
        {label}
      </Text>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  amountText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginTop: 4,
  },
  labelText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
});