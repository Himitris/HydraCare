import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Minus, Plus } from 'lucide-react-native';

interface ZenButtonProps {
  amount: number;
  label: string;
  onPress: () => void;
  correctionMode?: boolean;
  compact?: boolean;
}

const { width } = Dimensions.get('window');
const BUTTON_WIDTH = (width - 80) / 4; // 4 buttons per row with padding

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function ZenButton({
  amount,
  label,
  onPress,
  correctionMode = false,
  compact = false,
}: ZenButtonProps) {
  const { isDarkMode, settings } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  // Animation values
  const pressScale = useSharedValue(1);
  const brightness = useSharedValue(0);

  // Handle press with smooth animation
  const handlePressIn = () => {
    pressScale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
    brightness.value = withTiming(1, { duration: 200 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 15, stiffness: 150 });
    brightness.value = withTiming(0, { duration: 300 });

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onPress();
  };

  // Animated styles
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(brightness.value, [0, 1], [0, 0.1]),
  }));

  // Format amount
  const formattedAmount = amount >= 1000 ? `${amount / 1000}L` : `${amount}ml`;

  // Colors based on mode
  const buttonColors: [string, string] = correctionMode
    ? [colors.error[50], colors.error[100]]
    : [colors.primary[50], colors.primary[100]];

  const textColors = correctionMode ? colors.error[600] : colors.primary[600];

  const iconColor = correctionMode ? colors.error[500] : colors.primary[500];

  return (
    <AnimatedTouchable
      style={[styles.container, buttonStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <LinearGradient
        colors={buttonColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Animated.View style={[styles.overlay, overlayStyle]} />

        <Animated.View style={styles.iconContainer}>
          {correctionMode ? (
            <Minus size={16} color={iconColor} />
          ) : (
            <Plus size={16} color={iconColor} />
          )}
        </Animated.View>

        <Text style={[styles.amount, { color: textColors }]}>
          {formattedAmount}
        </Text>

        <Text style={[styles.label, { color: textColors }]}>{label}</Text>
      </LinearGradient>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: BUTTON_WIDTH,
    height: 72,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
  },
  iconContainer: {
    marginBottom: 2,
  },
  amount: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 1,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    opacity: 0.8,
  },
});
