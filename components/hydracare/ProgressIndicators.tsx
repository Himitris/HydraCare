// components/hydracare/ProgressIndicators.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withSequence,
  withDelay,
  interpolateColor,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  subDays,
  format,
  isSameDay,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import { Trophy, Droplet, TrendingUp, Calendar } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

interface ProgressIndicatorsProps {
  period?: 'week' | 'month';
}

const ProgressIndicators = ({ period = 'week' }: ProgressIndicatorsProps) => {
  const { history, settings, dailyProgress, isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const { t } = useTranslation();

  // Animated values
  const progressAnimation = useSharedValue(0);
  const weeklyProgressAnimation = useSharedValue(0);
  const streakAnimation = useSharedValue(0);
  const bestDayAnimation = useSharedValue(0);

  // Calculate metrics
  const metrics = React.useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    // Last 30 days
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), i);
      return date;
    });

    // Period adjusted days (either week or month)
    const periodDays = period === 'week' ? daysInWeek : last30Days;

    // Calculate week intake
    let totalPeriodIntake = 0;
    let daysWithData = 0;
    let goalMetDays = 0;
    let maxIntakePercent = 0;
    let bestDay = today;
    let currentStreak = 0;
    let maxDailyAmount = 0;

    // Process days
    periodDays.forEach((date) => {
      const dateKey = `${date.getFullYear()}-${
        date.getMonth() + 1
      }-${date.getDate()}`;
      const dayIntake = history[dateKey] || [];
      const totalAmount = dayIntake.reduce((sum, item) => sum + item.amount, 0);
      const percentage = totalAmount / settings.dailyGoal;

      if (totalAmount > 0) {
        daysWithData++;
        totalPeriodIntake += totalAmount;
      }

      if (percentage >= 1) {
        goalMetDays++;

        // Check for streak (only for continuous days from today)
        if (isSameDay(date, subDays(today, currentStreak))) {
          currentStreak++;
        }
      }

      // Track best day
      if (percentage > maxIntakePercent) {
        maxIntakePercent = percentage;
        bestDay = date;
        maxDailyAmount = totalAmount;
      }
    });

    // Calculate average
    const periodGoal = settings.dailyGoal * (period === 'week' ? 7 : 30);
    const periodProgress = totalPeriodIntake / periodGoal;

    return {
      periodProgress: Math.min(periodProgress, 1),
      daysCount: periodDays.length,
      daysWithData,
      goalMetDays,
      goalMetPercentage:
        periodDays.length > 0 ? (goalMetDays / periodDays.length) * 100 : 0,
      bestDay,
      bestDayPercentage: maxIntakePercent * 100,
      bestDayAmount: maxDailyAmount,
      currentStreak,
    };
  }, [history, settings.dailyGoal, period]);

  // Update animations when values change
  useEffect(() => {
    // Animate today's progress
    progressAnimation.value = withTiming(dailyProgress, {
      duration: 1000,
      easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
    });

    // Animate weekly/monthly progress
    weeklyProgressAnimation.value = withSequence(
      withDelay(
        300,
        withTiming(0.9 * metrics.periodProgress, { duration: 600 })
      ),
      withTiming(metrics.periodProgress, { duration: 400 })
    );

    // Animate streak count
    streakAnimation.value = 0;
    for (let i = 0; i <= metrics.currentStreak; i++) {
      streakAnimation.value = withDelay(
        800 + i * 120,
        withTiming(i, { duration: 400 })
      );
    }

    // Animate best day
    bestDayAnimation.value = withDelay(1000, withTiming(1, { duration: 800 }));
  }, [metrics, dailyProgress]);

  // Animated styles
  const dailyProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${Math.min(progressAnimation.value * 100, 100)}%`,
      backgroundColor: interpolateColor(
        progressAnimation.value,
        [0, 0.4, 0.7, 1],
        [
          colors.error[500],
          colors.warning[500],
          colors.secondary[500],
          colors.primary[500],
        ]
      ),
    };
  });

  const weeklyProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${Math.min(weeklyProgressAnimation.value * 100, 100)}%`,
      backgroundColor: interpolateColor(
        weeklyProgressAnimation.value,
        [0, 0.4, 0.7, 1],
        [
          colors.error[500],
          colors.warning[500],
          colors.secondary[500],
          colors.primary[500],
        ]
      ),
    };
  });

  const streakCountStyle = useAnimatedStyle(() => {
    return {
      opacity: metrics.currentStreak > 0 ? 1 : 0.7,
      transform: [
        {
          scale: withTiming(metrics.currentStreak > 0 ? 1 : 0.95, {
            duration: 300,
          }),
        },
      ],
    };
  });

  const bestDayStyle = useAnimatedStyle(() => {
    return {
      opacity: bestDayAnimation.value,
      transform: [
        {
          translateY: withTiming(bestDayAnimation.value * 0, { duration: 500 }),
        },
        { scale: bestDayAnimation.value },
      ],
    };
  });

  return (
    <View style={styles.container}>
      {/* Today's Progress */}
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: colors.cardBackground },
          { transform: [{ scale: 1 }] },
        ]}
      >
        <View style={styles.cardHeader}>
          <Droplet size={20} color={colors.primary[500]} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Progrès aujourd'hui
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: colors.neutral[200] },
            ]}
          >
            <Animated.View style={[styles.progressFill, dailyProgressStyle]} />
          </View>

          <Text style={[styles.progressText, { color: colors.text }]}>
            {Math.round(dailyProgress * 100)}%
          </Text>
        </View>

        <Text style={[styles.progressDetail, { color: colors.neutral[500] }]}>
          {Math.round(dailyProgress * settings.dailyGoal)} ml sur{' '}
          {settings.dailyGoal} ml
        </Text>
      </Animated.View>

      {/* Weekly/Monthly Progress */}
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: colors.cardBackground },
          { transform: [{ scale: 1 }] },
        ]}
      >
        <View style={styles.cardHeader}>
          <Calendar size={20} color={colors.secondary[500]} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {period === 'week' ? 'Cette semaine' : 'Ce mois-ci'}
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: colors.neutral[200] },
            ]}
          >
            <Animated.View style={[styles.progressFill, weeklyProgressStyle]} />
          </View>

          <Text style={[styles.progressText, { color: colors.text }]}>
            {Math.round(metrics.periodProgress * 100)}%
          </Text>
        </View>

        <Text style={[styles.progressDetail, { color: colors.neutral[500] }]}>
          {metrics.goalMetDays} jour{metrics.goalMetDays !== 1 ? 's' : ''}{' '}
          d'objectif atteint sur {metrics.daysCount}
        </Text>
      </Animated.View>

      {/* Streak Count */}
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: colors.cardBackground },
          streakCountStyle,
        ]}
      >
        <View style={styles.cardHeader}>
          <Trophy size={20} color={colors.warning[500]} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Série en cours
          </Text>
        </View>

        <View style={styles.streakContainer}>
          <Animated.Text
            style={[
              styles.streakNumber,
              {
                color:
                  metrics.currentStreak > 0
                    ? colors.warning[500]
                    : colors.neutral[400],
              },
            ]}
          >
            {metrics.currentStreak}
          </Animated.Text>

          <Text style={[styles.streakLabel, { color: colors.neutral[500] }]}>
            jour{metrics.currentStreak !== 1 ? 's' : ''} consécutif
            {metrics.currentStreak !== 1 ? 's' : ''}
          </Text>
        </View>

        <Text style={[styles.progressDetail, { color: colors.neutral[500] }]}>
          {metrics.currentStreak > 0
            ? 'Continuez comme ça !'
            : "Atteignez votre objectif aujourd'hui pour commencer une série"}
        </Text>
      </Animated.View>

      {/* Best Day */}
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: colors.cardBackground },
          bestDayStyle,
        ]}
      >
        <View style={styles.cardHeader}>
          <TrendingUp size={20} color={colors.success[500]} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Meilleure journée
          </Text>
        </View>

        <View style={styles.bestDayContainer}>
          <View style={styles.bestDayInfo}>
            <Text
              style={[styles.bestDayAmount, { color: colors.success[500] }]}
            >
              {Math.round(metrics.bestDayAmount)} ml
            </Text>
            <Text style={[styles.bestDayDate, { color: colors.neutral[500] }]}>
              {format(metrics.bestDay, 'd MMMM', { locale: fr })}
            </Text>
          </View>

          <View style={styles.bestDayPercentage}>
            <View style={styles.percentageCircle}>
              <CircularProgress
                percentage={Math.min(metrics.bestDayPercentage, 150)}
                color={colors.success[500]}
                trailColor={colors.neutral[200]}
              />
              <Text style={[styles.percentageText, { color: colors.text }]}>
                {Math.round(metrics.bestDayPercentage)}%
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

// Circular progress component for the best day
interface CircularProgressProps {
  percentage: number;
  color: string;
  trailColor: string;
  size?: number;
  strokeWidth?: number;
}

const CircularProgress = ({
  percentage,
  color,
  trailColor,
  size = 70,
  strokeWidth = 8,
}: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressValue = useSharedValue(0);

  useEffect(() => {
    progressValue.value = withTiming(percentage / 100, {
      duration: 1000,
      easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
    });
  }, [percentage]);

  const animatedProps = useAnimatedStyle(() => {
    const strokeDashoffset =
      circumference - circumference * progressValue.value;

    return {
      transform: [{ rotate: '-90deg' }],
    };
  });

  return (
    <Animated.View style={[styles.circularProgress, animatedProps]}>
      <Svg width={size} height={size}>
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trailColor}
          fill="transparent"
        />

        {/* Progress Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - circumference * (percentage / 100)}
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    flex: 1,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    width: 50,
    textAlign: 'right',
  },
  progressDetail: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  streakNumber: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
  },
  streakLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 12,
    flex: 1,
  },
  bestDayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bestDayInfo: {
    flex: 1,
  },
  bestDayAmount: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  bestDayDate: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  bestDayPercentage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
  },
  circularProgress: {
    position: 'absolute',
  },
  percentageText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
});

export default ProgressIndicators;
