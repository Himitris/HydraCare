import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
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
  
  // Animation value for progress
  const progressValue = useSharedValue(0);
  
  // Update progress value when dailyProgress changes
  useEffect(() => {
    progressValue.value = withTiming(dailyProgress, {
      duration: 1000,
      easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
    });
  }, [dailyProgress]);
  
  // Animated props for the progress circle
  const animatedProps = useAnimatedProps(() => {
    // Clamp progress between 0 and 1
    const clampedProgress = Math.min(Math.max(progressValue.value, 0), 1);
    // Calculate stroke dashoffset based on progress
    const strokeDashoffset = circumference - (circumference * clampedProgress);
    
    return {
      strokeDashoffset,
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
    <View style={styles.container}>
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
            <Text style={[styles.percentageText, { color: colors.text }]}>
              {percentage}%
            </Text>
          </>
        ) : (
          <Text style={[styles.amountText, { color: colors.text }]}>
            {calculateTotalIntake()}
          </Text>
        )}
        <Text style={[styles.labelText, { color: colors.neutral[500] }]}>
          {showPercentage ? 'of goal' : 'consumed'}
        </Text>
      </View>
    </View>
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