// components/hydracare/MonthlyHeatmap.tsx
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useAppContext } from '@/context/AppContext';
import {
  addMonths,
  subMonths,
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  getDay,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import Colors from '@/constants/Colors';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { useTranslation } from '@/i18n/hooks/useTranslation';

// Recalcul de la taille des cellules en fonction de la taille disponible
const { width } = Dimensions.get('window');
// Réduction de la largeur pour s'assurer que tout le calendrier s'affiche correctement
const AVAILABLE_WIDTH = width - 80; // 40px de marge pour éviter le débordement
const CELL_SIZE = AVAILABLE_WIDTH / 7; // Réparti sur 7 colonnes seulement
const CELL_MARGIN = 1; // Réduction des marges
const ACTUAL_CELL_SIZE = CELL_SIZE - CELL_MARGIN * 2;

interface MonthlyHeatmapProps {
  onDaySelect?: (date: Date) => void;
}

const MonthlyHeatmap = ({ onDaySelect }: MonthlyHeatmapProps) => {
  const { history, settings, isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const monthAnimValue = useSharedValue(1);

  // Animation when changing months
  const changeMonth = (delta: number) => {
    // Start animation - scale down
    monthAnimValue.value = withSequence(
      withTiming(0.9, { duration: 150 }),
      withTiming(1, { duration: 150 })
    );

    // Update month while animating
    setTimeout(() => {
      if (delta > 0) {
        setCurrentMonth(addMonths(currentMonth, delta));
      } else {
        setCurrentMonth(subMonths(currentMonth, Math.abs(delta)));
      }
    }, 100);
  };

  const monthContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: monthAnimValue.value }],
    };
  });

  // Generate calendar data
  const calendarData = useMemo(() => {
    // Get all days in current month
    const firstDay = startOfMonth(currentMonth);
    const lastDay = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: firstDay, end: lastDay });

    // Calculate first day of week (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = getDay(firstDay);

    // Adjust for Monday as first day of week (European calendar)
    const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    // Create calendar grid with null for empty cells
    const calendar: any[] = [];
    let week = Array(7).fill(null);

    // Add empty days at start
    for (let i = 0; i < adjustedFirstDay; i++) {
      week[i] = null;
    }

    // Fill with actual days
    daysInMonth.forEach((day, index) => {
      const dayOfWeek = getDay(day);
      // Convert to 0 = Monday, ..., 6 = Sunday
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      week[adjustedDay] = day;

      // End of week or month
      if (adjustedDay === 6 || index === daysInMonth.length - 1) {
        calendar.push([...week]);
        week = Array(7).fill(null);
      }
    });

    return calendar;
  }, [currentMonth]);

  // Get level of hydration for a day (0-4: 0=none, 1=low, 2=medium, 3=good, 4=excellent)
  const getHydrationLevel = (date: Date | null) => {
    if (!date) return -1; // Empty cell

    const dateKey = `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()}`;
    const dayIntake = history[dateKey] || [];
    const totalAmount = dayIntake.reduce((sum, item) => sum + item.amount, 0);
    const percentage = (totalAmount / settings.dailyGoal) * 100;

    if (totalAmount === 0) return 0;
    if (percentage < 50) return 1;
    if (percentage < 80) return 2;
    if (percentage < 100) return 3;
    return 4;
  };

  // Get color for hydration level
  const getHydrationColor = (level: number) => {
    switch (level) {
      case -1:
        return 'transparent'; // Empty cell
      case 0:
        return colors.neutral[200]; // No data
      case 1:
        return colors.error[300]; // Low
      case 2:
        return colors.warning[300]; // Medium
      case 3:
        return colors.secondary[300]; // Good
      case 4:
        return colors.primary[500]; // Excellent
      default:
        return colors.neutral[200];
    }
  };

  // Format day number with special styling for today
  const formatDay = (date: Date | null) => {
    if (!date) return '';

    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    return (
      <Text
        style={[
          styles.dayNumber,
          { color: colors.text },
          isToday && {
            fontFamily: 'Inter-Bold',
            color: colors.primary[600],
          },
        ]}
      >
        {date.getDate()}
      </Text>
    );
  };

  // Render animated cell that fades in with sequence
  const AnimatedCell = ({
    date,
    level,
    index,
    weekIndex,
  }: {
    date: Date | null;
    level: number;
    index: number;
    weekIndex: number;
  }) => {
    const cellOpacity = useSharedValue(0);

    React.useEffect(() => {
      // Stagger animation based on position
      const delay = (weekIndex * 7 + index) * 30;
      cellOpacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    }, [currentMonth]);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: cellOpacity.value,
    }));

    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          style={[
            styles.calendarCell,
            { backgroundColor: getHydrationColor(level) },
            date && {
              borderRadius: 8,
              opacity: level === 0 ? 0.4 : 1,
            },
          ]}
          onPress={() => (date && onDaySelect ? onDaySelect(date) : null)}
          disabled={!date}
        >
          {formatDay(date)}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Hydration levels legend
  const Legend = () => (
    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <View
          style={[styles.legendColor, { backgroundColor: colors.error[300] }]}
        />
        <Text style={[styles.legendText, { color: colors.neutral[600] }]}>
          {'<50%'}
        </Text>
      </View>
      <View style={styles.legendItem}>
        <View
          style={[styles.legendColor, { backgroundColor: colors.warning[300] }]}
        />
        <Text style={[styles.legendText, { color: colors.neutral[600] }]}>
          50-79%
        </Text>
      </View>
      <View style={styles.legendItem}>
        <View
          style={[
            styles.legendColor,
            { backgroundColor: colors.secondary[300] },
          ]}
        />
        <Text style={[styles.legendText, { color: colors.neutral[600] }]}>
          80-99%
        </Text>
      </View>
      <View style={styles.legendItem}>
        <View
          style={[styles.legendColor, { backgroundColor: colors.primary[500] }]}
        />
        <Text style={[styles.legendText, { color: colors.neutral[600] }]}>
          {'≥100%'}
        </Text>
      </View>
    </View>
  );

  // Calculate monthly statistics
  const monthStats = useMemo(() => {
    const firstDay = startOfMonth(currentMonth);
    const lastDay = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: firstDay, end: lastDay });

    let totalDays = 0;
    let daysWithData = 0;
    let goalReachedDays = 0;
    let totalPercentage = 0;

    daysInMonth.forEach((day) => {
      const dateKey = `${day.getFullYear()}-${
        day.getMonth() + 1
      }-${day.getDate()}`;
      const dayIntake = history[dateKey] || [];
      const totalAmount = dayIntake.reduce((sum, item) => sum + item.amount, 0);
      const percentage = (totalAmount / settings.dailyGoal) * 100;

      totalDays++;
      if (totalAmount > 0) {
        daysWithData++;
        totalPercentage += percentage;
      }
      if (percentage >= 100) {
        goalReachedDays++;
      }
    });

    return {
      daysWithData,
      goalReachedDays,
      averagePercentage: daysWithData > 0 ? totalPercentage / daysWithData : 0,
      totalDays,
    };
  }, [currentMonth, history, settings.dailyGoal]);

  const weekdayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <View style={styles.container}>
      {/* Header with month navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => changeMonth(-1)}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.monthTitle, { color: colors.text }]}>
          {format(currentMonth, 'MMMM yyyy', { locale: fr })}
        </Text>

        <TouchableOpacity onPress={() => changeMonth(1)}>
          <ChevronRight size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Weekday labels */}
      <View style={styles.weekdayLabels}>
        {weekdayLabels.map((day, index) => (
          <View key={`label-${index}`} style={styles.weekdayLabel}>
            <Text style={[styles.weekdayText, { color: colors.neutral[500] }]}>
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <Animated.View style={[styles.calendarGrid, monthContainerStyle]}>
        {calendarData.map((week, weekIndex) => (
          <View key={`week-${weekIndex}`} style={styles.calendarRow}>
            {week.map((day: Date | null, dayIndex: number) => (
              <AnimatedCell
                key={`day-${weekIndex}-${dayIndex}`}
                date={day}
                level={getHydrationLevel(day)}
                index={dayIndex}
                weekIndex={weekIndex}
              />
            ))}
          </View>
        ))}
      </Animated.View>

      {/* Legend */}
      <Legend />

      {/* Monthly stats */}
      <View
        style={[
          styles.statsContainer,
          { backgroundColor: colors.cardBackground },
        ]}
      >
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary[500] }]}>
            {monthStats.daysWithData}
          </Text>
          <Text style={[styles.statLabel, { color: colors.neutral[500] }]}>
            Jours actifs
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary[500] }]}>
            {monthStats.goalReachedDays}
          </Text>
          <Text style={[styles.statLabel, { color: colors.neutral[500] }]}>
            Objectifs atteints
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary[500] }]}>
            {Math.round(monthStats.averagePercentage)}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.neutral[500] }]}>
            Moyenne
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8, // Réduit le padding pour avoir plus d'espace
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  weekdayLabels: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayLabel: {
    width: CELL_SIZE,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  calendarGrid: {
    marginBottom: 16
  },
  calendarRow: {
    flexDirection: 'row',
    marginBottom: 2, // Réduit l'espacement vertical
  },
  calendarCell: {
    width: ACTUAL_CELL_SIZE,
    height: ACTUAL_CELL_SIZE,
    margin: CELL_MARGIN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 11, // Taille de texte réduite pour la légende
    fontFamily: 'Inter-Regular',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
});

export default MonthlyHeatmap;
