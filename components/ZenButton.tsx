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
const BUTTON_WIDTH = (width - 60) / 2; // 2 buttons per row with padding

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
    pressScale.value = withSpring(0.96, { damping: 15, stiffness: 150 });
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
  const displayAmount =
    settings.preferredUnit === 'ml'
      ? `${amount} ml`
      : `${Math.round(amount * 0.033814)} oz`;

  // Colors based on mode
  const buttonColors = correctionMode
    ? [colors.error[100], colors.error[200]]
    : [colors.primary[100], colors.primary[200]];

  const textColors = correctionMode ? colors.error[600] : colors.primary[600];

  const labelColor = correctionMode ? colors.error[700] : colors.primary[700];

  return (
    <AnimatedTouchable
      style={[
        styles.container,
        buttonStyle,
        compact && styles.compactContainer,
      ]}
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

        <Text
          style={[
            styles.label,
            { color: labelColor },
            compact && styles.compactLabel,
          ]}
        >
          {label}
        </Text>

        <Text
          style={[
            styles.amount,
            { color: textColors },
            compact && styles.compactAmount,
          ]}
        >
          {correctionMode ? '-' : '+'} {displayAmount}
        </Text>

        <Animated.View
          style={[styles.iconContainer, compact && styles.compactIcon]}
        >
          {correctionMode ? (
            <Minus size={compact ? 16 : 20} color={textColors} />
          ) : (
            <Plus size={compact ? 16 : 20} color={textColors} />
          )}
        </Animated.View>
      </LinearGradient>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: BUTTON_WIDTH,
    aspectRatio: 1.2,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  compactContainer: {
    aspectRatio: 1.5,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  compactLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  amount: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  compactAmount: {
    fontSize: 16,
    marginBottom: 4,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});
