import React, { useState, useMemo, useCallback } from 'react';
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
  endOfWeek,
  addDays,
  isToday,
  isSameWeek,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useTranslation } from '@/i18n/hooks/useTranslation';

type ChartDataItem = {
  date: Date;
  label: string;
  shortLabel?: string; // Optionnel car utilisé uniquement en mode 'week'
  amount: number;
  percentage: number;
  isToday: boolean;
  isSelected: boolean;
  isFuture: boolean;
  average?: number; // Optionnel car utilisé uniquement en mode 'month'
};

// Get window dimensions
const { width } = Dimensions.get('window');

export default function DailyHistoryChart() {
  const { history, settings, isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const { t } = useTranslation();

  // Configure week to start on Monday
  const weekStartsOn = 1; // Monday

  // Check if we can navigate forward - mémorisé pour éviter les recalculs
  const canNavigateForward = useMemo(() => {
    if (viewMode === 'week') {
      const nextWeekStart = addDays(
        startOfWeek(selectedDate, { weekStartsOn }),
        7
      );
      const currentWeekStart = startOfWeek(new Date(), { weekStartsOn });
      return nextWeekStart.getTime() <= currentWeekStart.getTime();
    } else {
      const nextMonthStart = addDays(startOfMonth(selectedDate), 32);
      return nextMonthStart < new Date();
    }
  }, [viewMode, selectedDate, weekStartsOn]);

  // Generate data for the selected period - mémorisé avec dépendances appropriées
  const chartData: ChartDataItem[] = useMemo(() => {
    const data: ChartDataItem[] = [];

    if (viewMode === 'week') {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn });

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
          label: format(date, 'EEEE', { locale: fr }),
          shortLabel: format(date, 'EEEEE', { locale: fr }),
          amount: totalAmount,
          percentage,
          isToday: isToday(date),
          isSelected: isSameDay(date, selectedDate),
          isFuture: date > new Date(),
        });
      }
    } else {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      const weeksInMonth = eachWeekOfInterval(
        { start: monthStart, end: monthEnd },
        { weekStartsOn }
      );

      weeksInMonth.forEach((weekStart, index) => {
        let weekTotal = 0;
        let daysWithData = 0;

        for (let i = 0; i < 7; i++) {
          const date = addDays(weekStart, i);
          if (date >= monthStart && date <= monthEnd) {
            const dateKey = `${date.getFullYear()}-${
              date.getMonth() + 1
            }-${date.getDate()}`;
            const dayIntake = history[dateKey] || [];
            const dayTotal = dayIntake.reduce(
              (sum, item) => sum + item.amount,
              0
            );
            weekTotal += dayTotal;
            if (dayTotal > 0) daysWithData++;
          }
        }

        const weekAverage = daysWithData > 0 ? weekTotal / daysWithData : 0;
        const percentage = Math.min(
          (weekAverage / settings.dailyGoal) * 100,
          150
        );

        data.push({
          date: weekStart,
          label: `S${index + 1}`,
          amount: weekTotal,
          average: weekAverage, // Ajout de la propriété average
          percentage,
          isToday: isSameWeek(weekStart, new Date(), { weekStartsOn }),
          isSelected: isSameWeek(weekStart, selectedDate, { weekStartsOn }),
          isFuture: weekStart > new Date(),
        });
      });
    }

    return data;
  }, [history, settings.dailyGoal, selectedDate, viewMode, weekStartsOn]);

  // Find max value for scaling - mémorisé car dépend uniquement de chartData
  const maxPercentage = useMemo(
    () => Math.max(...chartData.map((d) => d.percentage), 100),
    [chartData]
  );

  // Navigate weeks/months - avec useCallback pour éviter les recréations de fonction
  const navigateBack = useCallback(() => {
    setSelectedDate((prev) =>
      viewMode === 'week' ? subDays(prev, 7) : subDays(startOfMonth(prev), 1)
    );
  }, [viewMode]);

  const navigateForward = useCallback(() => {
    if (canNavigateForward) {
      if (viewMode === 'week') {
        const nextWeekStart = addDays(
          startOfWeek(selectedDate, { weekStartsOn }),
          7
        );
        const currentWeekStart = startOfWeek(new Date(), { weekStartsOn });

        if (nextWeekStart.getTime() >= currentWeekStart.getTime()) {
          setSelectedDate(new Date());
        } else {
          setSelectedDate((prev) => addDays(prev, 7));
        }
      } else {
        const nextMonth = addDays(startOfMonth(selectedDate), 32);
        setSelectedDate(startOfMonth(nextMonth));
      }
    }
  }, [canNavigateForward, viewMode, selectedDate, weekStartsOn]);

  // Navigate to today - avec useCallback
  const navigateToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  // Get selected day/week details - mémorisé pour éviter les calculs répétés
  const selectedDetails = useMemo(() => {
    if (viewMode === 'week') {
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
    } else {
      // For month view, show week details
      const weekStart = startOfWeek(selectedDate, { weekStartsOn });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn });
      let weekIntake: any[] = [];
      let weekTotal = 0;

      for (let date = weekStart; date <= weekEnd; date = addDays(date, 1)) {
        const dateKey = `${date.getFullYear()}-${
          date.getMonth() + 1
        }-${date.getDate()}`;
        const dayIntake = history[dateKey] || [];
        weekIntake = [...weekIntake, ...dayIntake];
        weekTotal += dayIntake.reduce((sum, item) => sum + item.amount, 0);
      }

      return {
        dayIntake: weekIntake,
        totalAmount: weekTotal,
        date: weekStart,
        percentage: (weekTotal / (settings.dailyGoal * 7)) * 100,
        isWeek: true,
      };
    }
  }, [history, settings.dailyGoal, selectedDate, viewMode, weekStartsOn]);

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
              ? `${format(
                  startOfWeek(selectedDate, { weekStartsOn }),
                  'd MMM',
                  { locale: fr }
                )} - ${format(
                  endOfWeek(selectedDate, { weekStartsOn }),
                  'd MMM',
                  { locale: fr }
                )}`
              : format(selectedDate, 'MMMM yyyy', { locale: fr })}
          </Text>

          {/* Today button */}
          {((viewMode === 'week' &&
            !isSameWeek(selectedDate, new Date(), { weekStartsOn })) ||
            (viewMode === 'month' &&
              format(selectedDate, 'MM-yyyy') !==
                format(new Date(), 'MM-yyyy'))) && (
            <TouchableOpacity
              style={[
                styles.todayButton,
                { backgroundColor: colors.primary[100] },
              ]}
              onPress={navigateToToday}
            >
              <Text
                style={[styles.todayButtonText, { color: colors.primary[600] }]}
              >
                {t('common.today')}
              </Text>
            </TouchableOpacity>
          )}

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
                {t('history.week')}
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
                {t('history.month')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={navigateForward}
          style={[styles.navButton, !canNavigateForward && { opacity: 0.3 }]}
          disabled={!canNavigateForward}
        >
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
            viewMode === 'month' && { width: '100%', paddingHorizontal: 10 },
          ]}
        >
          {chartData.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.barContainer,
                viewMode === 'month' && { flex: 1, marginHorizontal: 4 },
              ]}
              onPress={() => !item.isFuture && setSelectedDate(item.date)}
              disabled={item.isFuture}
            >
              {/* Bar */}
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.barBackground,
                    { backgroundColor: colors.neutral[200] },
                    item.isToday && {
                      backgroundColor: colors.primary[100],
                      borderWidth: 2,
                      borderColor: colors.primary[500],
                    },
                  ]}
                />
                {!item.isFuture && (
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${Math.min(
                          (item.percentage / maxPercentage) * 100,
                          85
                        )}%`,
                        backgroundColor: item.isSelected
                          ? colors.primary[600]
                          : item.isToday
                          ? colors.primary[500]
                          : colors.primary[400],
                      },
                    ]}
                  />
                )}
                {item.percentage > 100 && !item.isFuture && (
                  <View
                    style={[
                      styles.overflowIndicator,
                      { backgroundColor: colors.success[500] },
                    ]}
                  />
                )}
              </View>

              {/* Label */}
              <Text
                style={[
                  styles.dayLabel,
                  {
                    color: item.isSelected
                      ? colors.primary[600]
                      : item.isToday
                      ? colors.primary[500]
                      : item.isFuture
                      ? colors.neutral[300]
                      : colors.neutral[500],
                    fontFamily:
                      item.isSelected || item.isToday
                        ? 'Inter-Bold'
                        : 'Inter-Regular',
                  },
                ]}
              >
                {viewMode === 'week' ? item.shortLabel : item.label}
              </Text>

              {/* Today indicator */}
              {item.isToday && (
                <View
                  style={[
                    styles.todayIndicator,
                    { backgroundColor: colors.primary[500] },
                  ]}
                />
              )}

              {/* Amount */}
              {item.isSelected && !item.isFuture && (
                <Text
                  style={[
                    styles.amountLabel,
                    {
                      color: colors.primary[600],
                      top: -20, // Placé au-dessus de la barre
                    },
                  ]}
                >
                  {viewMode === 'month'
                    ? `${Math.round(item.average ?? 0)}ml/j`
                    : `${Math.round(item.percentage)}%`}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Selected day/week details */}
      <Animated.View
        entering={FadeInDown}
        exiting={FadeOutUp}
        style={[styles.detailsCard, { backgroundColor: colors.cardBackground }]}
      >
        <View style={styles.detailsHeader}>
          <View>
            <Text style={[styles.detailsDate, { color: colors.text }]}>
              {selectedDetails.isWeek
                ? `${format(selectedDetails.date, 'EEEE d', {
                    locale: fr,
                  })} - ${format(
                    addDays(selectedDetails.date, 6),
                    'EEEE d MMMM',
                    { locale: fr }
                  )}`
                : format(selectedDetails.date, 'EEEE d MMMM', { locale: fr })}
            </Text>
            <Text
              style={[styles.detailsAmount, { color: colors.primary[500] }]}
            >
              {settings.preferredUnit === 'ml'
                ? `${selectedDetails.totalAmount} ml`
                : `${Math.round(selectedDetails.totalAmount * 0.033814)} oz`}
              {selectedDetails.isWeek &&
                ` (${Math.round(selectedDetails.totalAmount / 7)} ml/jour)`}
            </Text>
          </View>
          <View
            style={[
              styles.percentageCircle,
              {
                backgroundColor:
                  selectedDetails.percentage >= 100
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
                    selectedDetails.percentage >= 100
                      ? colors.success[600]
                      : colors.primary[600],
                },
              ]}
            >
              {Math.round(selectedDetails.percentage)}%
            </Text>
          </View>
        </View>

        {/* Intake breakdown */}
        <View style={styles.intakeList}>
          <Text style={[styles.intakeTitle, { color: colors.text }]}>
            {t('history.intakeLog')}
          </Text>
          {selectedDetails.dayIntake.length > 0 ? (
            selectedDetails.dayIntake.map((item, index) => (
              <View key={index} style={styles.intakeItem}>
                <Text
                  style={[styles.intakeTime, { color: colors.neutral[600] }]}
                >
                  {format(new Date(item.timestamp), 'EEEE d MMM à H:mm', {
                    locale: fr,
                  })}
                </Text>
                <Text style={[styles.intakeAmount, { color: colors.text }]}>
                  {item.amount} {item.unit}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.noIntake, { color: colors.neutral[500] }]}>
              {t('history.noIntakeRecorded')}
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
  todayButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  todayButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
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
    height: 110, // Réduit de 120 à 110 pour s'assurer que la barre ne dépasse pas
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
  todayIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  amountLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    marginTop: 2,
    position: 'absolute',
    top: 0,
    width: '100%',
    textAlign: 'center',
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
