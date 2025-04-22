import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  format,
  subDays,
  isSameDay,
  startOfWeek,
  addDays,
  isToday,
} from 'date-fns';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';

// Get window dimensions
const { width } = Dimensions.get('window');

export default function DailyHistoryChart() {
  const { history, settings, isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  // Generate data for the selected period
  const generateChartData = () => {
    const data = [];

    if (viewMode === 'week') {
      // Start from Sunday of the selected week
      const weekStart = startOfWeek(selectedDate);

      for (let i = 0; i < 7; i++) {
        const date = addDays(weekStart, i);
        const dateKey = `${date.getFullYear()}-${
          date.getMonth() + 1
        }-${date.getDate()}`;

        const dayIntake = history[dateKey] || [];
        const totalAmount = dayIntake.reduce(
          (sum, item) => sum + item.amount,
          0
        );
        const percentage = Math.min(
          (totalAmount / settings.dailyGoal) * 100,
          150
        );

        data.push({
          date,
          label: format(date, 'EEE'),
          shortLabel: format(date, 'E'),
          amount: totalAmount,
          percentage,
          isToday: isToday(date),
          isSelected: isSameDay(date, selectedDate),
        });
      }
    } else {
      // Generate month data (last 30 days)
      for (let i = 29; i >= 0; i--) {
        const date = subDays(selectedDate, i);
        const dateKey = `${date.getFullYear()}-${
          date.getMonth() + 1
        }-${date.getDate()}`;

        const dayIntake = history[dateKey] || [];
        const totalAmount = dayIntake.reduce(
          (sum, item) => sum + item.amount,
          0
        );
        const percentage = Math.min(
          (totalAmount / settings.dailyGoal) * 100,
          150
        );

        data.push({
          date,
          label: format(date, 'd'),
          amount: totalAmount,
          percentage,
          isToday: isToday(date),
          isSelected: isSameDay(date, selectedDate),
        });
      }
    }

    return data;
  };

  const chartData = generateChartData();

  // Find max value for scaling
  const maxPercentage = Math.max(...chartData.map((d) => d.percentage), 100);
  const maxBarHeight = 120;

  // Navigate weeks/months
  const navigateBack = () => {
    setSelectedDate((prev) =>
      viewMode === 'week' ? subDays(prev, 7) : subDays(prev, 30)
    );
  };

  const navigateForward = () => {
    const newDate =
      viewMode === 'week'
        ? addDays(selectedDate, 7)
        : addDays(selectedDate, 30);
    if (!isToday(newDate) && newDate < new Date()) {
      setSelectedDate(newDate);
    }
  };

  // Get selected day details
  const getSelectedDayDetails = () => {
    const dateKey = `${selectedDate.getFullYear()}-${
      selectedDate.getMonth() + 1
    }-${selectedDate.getDate()}`;
    const dayIntake = history[dateKey] || [];
    const totalAmount = dayIntake.reduce((sum, item) => sum + item.amount, 0);

    return {
      dayIntake,
      totalAmount,
      date: selectedDate,
      percentage: (totalAmount / settings.dailyGoal) * 100,
    };
  };

  const selectedDayDetails = getSelectedDayDetails();

  return (
    <View style={styles.container}>
      {/* Navigation header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={navigateBack} style={styles.navButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            {viewMode === 'week'
              ? `Week of ${format(startOfWeek(selectedDate), 'MMM d')}`
              : format(selectedDate, 'MMMM yyyy')}
          </Text>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === 'week' && { backgroundColor: colors.primary[500] },
              ]}
              onPress={() => setViewMode('week')}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: viewMode === 'week' ? 'white' : colors.text },
                ]}
              >
                Week
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === 'month' && {
                  backgroundColor: colors.primary[500],
                },
              ]}
              onPress={() => setViewMode('month')}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: viewMode === 'month' ? 'white' : colors.text },
                ]}
              >
                Month
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={navigateForward} style={styles.navButton}>
          <ChevronRight size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Chart */}
      <ScrollView
        horizontal={viewMode === 'month'}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chartScroll}
      >
        <View
          style={[
            styles.chartContainer,
            viewMode === 'month' && { width: width * 2 },
          ]}
        >
          {chartData.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.barContainer,
                viewMode === 'month' && { width: (width * 2) / 30 },
              ]}
              onPress={() => setSelectedDate(day.date)}
            >
              {/* Bar */}
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.barBackground,
                    { backgroundColor: colors.neutral[200] },
                  ]}
                />
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${(day.percentage / maxPercentage) * 100}%`,
                      backgroundColor: day.isSelected
                        ? colors.primary[600]
                        : day.isToday
                        ? colors.primary[500]
                        : colors.primary[400],
                    },
                  ]}
                />
                {day.percentage > 100 && (
                  <View
                    style={[
                      styles.overflowIndicator,
                      { backgroundColor: colors.success[500] },
                    ]}
                  />
                )}
              </View>

              {/* Day label */}
              <Text
                style={[
                  styles.dayLabel,
                  {
                    color:
                      day.isSelected || day.isToday
                        ? colors.primary[500]
                        : colors.neutral[500],
                    fontFamily:
                      day.isSelected || day.isToday
                        ? 'Inter-Bold'
                        : 'Inter-Regular',
                  },
                ]}
              >
                {viewMode === 'week' ? day.shortLabel : day.label}
              </Text>

              {/* Amount */}
              {day.isSelected && (
                <Text
                  style={[styles.amountLabel, { color: colors.primary[600] }]}
                >
                  {Math.round(day.percentage)}%
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Selected day details */}
      <Animated.View
        entering={FadeInDown}
        exiting={FadeOutUp}
        style={[styles.detailsCard, { backgroundColor: colors.cardBackground }]}
      >
        <View style={styles.detailsHeader}>
          <View>
            <Text style={[styles.detailsDate, { color: colors.text }]}>
              {format(selectedDate, 'EEEE, MMMM d')}
            </Text>
            <Text
              style={[styles.detailsAmount, { color: colors.primary[500] }]}
            >
              {settings.preferredUnit === 'ml'
                ? `${selectedDayDetails.totalAmount} ml`
                : `${Math.round(selectedDayDetails.totalAmount * 0.033814)} oz`}
            </Text>
          </View>
          <View
            style={[
              styles.percentageCircle,
              {
                backgroundColor:
                  selectedDayDetails.percentage >= 100
                    ? colors.success[100]
                    : colors.primary[100],
              },
            ]}
          >
            <Text
              style={[
                styles.percentageText,
                {
                  color:
                    selectedDayDetails.percentage >= 100
                      ? colors.success[600]
                      : colors.primary[600],
                },
              ]}
            >
              {Math.round(selectedDayDetails.percentage)}%
            </Text>
          </View>
        </View>

        {/* Intake breakdown */}
        <View style={styles.intakeList}>
          <Text style={[styles.intakeTitle, { color: colors.text }]}>
            Intake log
          </Text>
          {selectedDayDetails.dayIntake.length > 0 ? (
            selectedDayDetails.dayIntake.map((item, index) => (
              <View key={index} style={styles.intakeItem}>
                <Text
                  style={[styles.intakeTime, { color: colors.neutral[600] }]}
                >
                  {format(new Date(item.timestamp), 'h:mm a')}
                </Text>
                <Text style={[styles.intakeAmount, { color: colors.text }]}>
                  {item.amount} {item.unit}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.noIntake, { color: colors.neutral[500] }]}>
              No water intake recorded for this day
            </Text>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  toggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  toggleText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  chartScroll: {
    paddingBottom: 8,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
  },
  barContainer: {
    alignItems: 'center',
    width: (width - 64) / 7, // Equal width for all bars with spacing
  },
  barWrapper: {
    width: 16,
    height: 120,
    position: 'relative',
  },
  barBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  bar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderRadius: 8,
  },
  overflowIndicator: {
    position: 'absolute',
    top: -4,
    left: '50%',
    marginLeft: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dayLabel: {
    marginTop: 8,
    fontSize: 12,
  },
  amountLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    marginTop: 2,
  },
  detailsCard: {
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailsDate: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  detailsAmount: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginTop: 4,
  },
  percentageCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  intakeList: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingTop: 16,
  },
  intakeTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  intakeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  intakeTime: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  intakeAmount: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  noIntake: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
});
