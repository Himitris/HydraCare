import React from 'react';
import { StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';

interface QuickAddButtonProps {
  amount: number;
  onPress: () => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function QuickAddButton({
  amount,
  onPress,
}: QuickAddButtonProps) {
  const { isDarkMode, settings } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  // Animation value for press feedback
  const scale = useSharedValue(1);

  // Handle press with animation and haptic feedback
  const handlePress = () => {
    scale.value = withSpring(0.95, { damping: 10, stiffness: 200 });

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onPress();

    setTimeout(() => {
      scale.value = withSpring(1, { damping: 10, stiffness: 200 });
    }, 100);
  };

  // Animated style
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Format amount based on unit preference
  const displayAmount =
    settings.preferredUnit === 'ml'
      ? `${amount} ml`
      : `${Math.round(amount * 0.033814)} oz`;

  return (
    <AnimatedTouchable
      style={[
        styles.button,
        buttonStyle,
        { backgroundColor: colors.neutral[100] },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Text style={[styles.buttonText, { color: colors.primary[500] }]}>
        + {displayAmount}
      </Text>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    margin: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});
