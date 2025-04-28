import React, { useEffect, useMemo, useCallback } from 'react';
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
} from 'react-native-reanimated';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';

// Animated Circle
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressCircleProps {
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
}

export default function ProgressCircle({
  size = 120,
  strokeWidth = 12,
  showPercentage = true,
}: ProgressCircleProps) {
  const { dailyProgress, isDarkMode, settings } = useAppContext();

  // Memoized colors
  const colors = useMemo(
    () => (isDarkMode ? Colors.dark : Colors.light),
    [isDarkMode]
  );

  // Memoized dimensions
  const { radius, circumference } = useMemo(() => {
    const r = (size - strokeWidth) / 2;
    return {
      radius: r,
      circumference: 2 * Math.PI * r,
    };
  }, [size, strokeWidth]);

  // Shared animation values
  const progressValue = useSharedValue(0);
  const pulseAnimation = useSharedValue(1);
  const colorAnimation = useSharedValue(0);

  // Init animation
  useEffect(() => {
    progressValue.value = 0;
    setTimeout(() => {
      progressValue.value = withTiming(dailyProgress, {
        duration: 1200,
        easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
      });

      pulseAnimation.value = withSequence(
        withTiming(1.05, { duration: 600, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 400, easing: Easing.inOut(Easing.cubic) })
      );

      colorAnimation.value = withTiming(dailyProgress, { duration: 800 });
    }, 300);
  }, []);

  // Update when dailyProgress changes
  useEffect(() => {
    if (progressValue.value > 0) {
      progressValue.value = withTiming(dailyProgress, {
        duration: 1000,
        easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
      });

      colorAnimation.value = withTiming(dailyProgress, { duration: 800 });

      if (Math.abs(progressValue.value - dailyProgress) > 0.05) {
        pulseAnimation.value = withSequence(
          withTiming(1.03, { duration: 300, easing: Easing.out(Easing.cubic) }),
          withTiming(1, { duration: 300, easing: Easing.inOut(Easing.cubic) })
        );
      }
    }
  }, [dailyProgress]);

  // Animated props for progress stroke
  const animatedProps = useAnimatedProps(() => {
    const clampedProgress = Math.min(Math.max(progressValue.value, 0), 1);
    const strokeDashoffset = circumference - circumference * clampedProgress;

    return {
      strokeDashoffset,
    };
  });

  // Pulse animation style
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  // Animated text color style
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

    return { color: textColor };
  });

  // Memoized total intake calculation
  const calculateTotalIntake = useCallback(() => {
    const totalMl = dailyProgress * settings.dailyGoal;

    if (settings.preferredUnit === 'oz') {
      return `${Math.round(totalMl * 0.033814)} oz`;
    }
    return `${Math.round(totalMl)} ml`;
  }, [dailyProgress, settings]);

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

        {/* Animated progress circle */}
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
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Center text */}
      <View style={styles.textContainer}>
        {showPercentage ? (
          <Animated.Text style={[styles.percentageText, textColorStyle]}>
            {percentage}%
          </Animated.Text>
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
