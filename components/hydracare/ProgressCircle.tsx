import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  interpolateColor,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';

interface ProgressCircleProps {
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
}

// Create animated component for Circle
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function ProgressCircle({
  size = 120,
  strokeWidth = 12,
  showPercentage = true,
}: ProgressCircleProps) {
  const { dailyProgress, isDarkMode, settings } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  // Calculate circle properties
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Animation values for progress
  const progressValue = useSharedValue(0);
  const pulseAnimation = useSharedValue(1);
  const colorAnimation = useSharedValue(0);

  // Initialize animation on mount
  useEffect(() => {
    // Initial animation
    progressValue.value = 0;
    setTimeout(() => {
      progressValue.value = withTiming(dailyProgress, {
        duration: 1200,
        easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
      });

      // Add a pulse effect when the circle first loads
      pulseAnimation.value = withSequence(
        withTiming(1.05, { duration: 600, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 400, easing: Easing.inOut(Easing.cubic) })
      );

      // Animate color based on progress
      colorAnimation.value = withTiming(dailyProgress, { duration: 800 });
    }, 300);
  }, []);

  // Update progress value when dailyProgress changes
  useEffect(() => {
    // Only run if this isn't the first render - first render is handled above
    if (progressValue.value > 0) {
      progressValue.value = withTiming(dailyProgress, {
        duration: 1000,
        easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
      });

      colorAnimation.value = withTiming(dailyProgress, { duration: 800 });

      // Add a subtle pulse effect when the circle updates
      if (Math.abs(progressValue.value - dailyProgress) > 0.05) {
        pulseAnimation.value = withSequence(
          withTiming(1.03, { duration: 300, easing: Easing.out(Easing.cubic) }),
          withTiming(1, { duration: 300, easing: Easing.inOut(Easing.cubic) })
        );
      }
    }
  }, [dailyProgress]);

  // Animated props for the progress circle
  const animatedProps = useAnimatedProps(() => {
    // Clamp progress between 0 and 1
    const clampedProgress = Math.min(Math.max(progressValue.value, 0), 1);
    // Calculate stroke dashoffset based on progress
    const strokeDashoffset = circumference - circumference * clampedProgress;

    return {
      strokeDashoffset,
    };
  });

  // Animated style for the pulse effect
  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseAnimation.value }],
    };
  });

  // Animated style for text color
  const textColorStyle = useAnimatedStyle(() => {
    const textColor = interpolateColor(
      colorAnimation.value,
      [0, 0.4, 0.7, 1],
      [
        colors.neutral[500],
        colors.primary[400],
        colors.primary[500],
        colors.primary[600],
      ]
    );

    return {
      color: textColor,
    };
  });

  // Calculate total intake
  const calculateTotalIntake = () => {
    // Sum up all the intake amounts
    const totalml = dailyProgress * settings.dailyGoal;

    // Format based on user's preferred unit
    if (settings.preferredUnit === 'oz') {
      // Convert ml to oz (1 ml = 0.033814 oz)
      return `${Math.round(totalml * 0.033814)} oz`;
    } else {
      return `${Math.round(totalml)} ml`;
    }
  };

  // Calculate percentage for display
  const percentage = Math.min(Math.round(dailyProgress * 100), 100);

  return (
    <Animated.View style={[styles.container, pulseStyle]}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={colors.neutral[200]}
          fill="transparent"
        />

        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={colors.primary[500]}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          // Rotate to start from top
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Center text */}
      <View style={styles.textContainer}>
        {showPercentage ? (
          <>
            <Animated.Text style={[styles.percentageText, textColorStyle]}>
              {percentage}%
            </Animated.Text>
          </>
        ) : (
          <Animated.Text style={[styles.amountText, textColorStyle]}>
            {calculateTotalIntake()}
          </Animated.Text>
        )}
        <Text style={[styles.labelText, { color: colors.neutral[500] }]}>
          {showPercentage ? 'of goal' : 'consumed'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  textContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  amountText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  labelText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
});
