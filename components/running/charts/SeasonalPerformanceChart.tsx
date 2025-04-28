// components/running/charts/SeasonalPerformanceChart.tsx
import { formatPace } from '@/utils/formatters';
import {
  endOfMonth,
  format,
  getMonth,
  getYear,
  isWithinInterval,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart2, Calendar, Clock, Flame, Zap } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface SeasonalPerformanceChartProps {
  sessions: any[];
  colors: any;
  timeFrame?: 'semester' | 'year';
}

const SeasonalPerformanceChart = ({
  sessions,
  colors,
  timeFrame = 'semester',
}: SeasonalPerformanceChartProps) => {
  const [metric, setMetric] = useState<'distance' | 'pace' | 'duration'>(
    'distance'
  );
  const [chartReady, setChartReady] = useState(false);
  const animationProgress = useSharedValue(0);

  // Get months range based on selected time frame
  const monthsRange = timeFrame === 'semester' ? 6 : 12;

  // Calculate month ranges for chart
  const monthRanges = useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return [];
    }

    const today = new Date();
    const ranges = [];

    for (let i = monthsRange - 1; i >= 0; i--) {
      const monthDate = subMonths(today, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      ranges.push({
        monthName: format(monthDate, 'MMM', { locale: fr }),
        fullMonthName: format(monthDate, 'MMMM', { locale: fr }),
        year: getYear(monthDate),
        month: getMonth(monthDate),
        startDate: monthStart,
        endDate: monthEnd,
      });
    }

    return ranges;
  }, [monthsRange, sessions]);

  // Calculate chart data
  const chartData = useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return {
        labels: [],
        distance: [],
        duration: [],
        pace: [],
        sessionCounts: [],
      };
    }

    const labels = monthRanges.map((m) => m.monthName);
    const distanceData = new Array(monthRanges.length).fill(0);
    const durationData = new Array(monthRanges.length).fill(0);
    const paceData = new Array(monthRanges.length).fill(0);
    const sessionCounts = new Array(monthRanges.length).fill(0);

    sessions.forEach((session) => {
      const sessionDate = new Date(session.date);
      const monthIndex = monthRanges.findIndex((range) =>
        isWithinInterval(sessionDate, {
          start: range.startDate,
          end: range.endDate,
        })
      );

      if (monthIndex !== -1) {
        if (session.distance) {
          distanceData[monthIndex] += session.distance;
          sessionCounts[monthIndex]++;
        }

        if (session.duration) {
          durationData[monthIndex] += session.duration;
        }
      }
    });

    for (let i = 0; i < monthRanges.length; i++) {
      if (distanceData[i] > 0 && durationData[i] > 0) {
        paceData[i] = durationData[i] / distanceData[i];
      }
    }

    const filteredPaceData = paceData.map((p) => (p === 0 ? null : p));

    return {
      labels,
      distance: distanceData,
      duration: durationData,
      pace: filteredPaceData,
      sessionCounts,
    };
  }, [sessions, monthRanges]);

  // Calculate insights
  const insights = useMemo(() => {
    // Get the relevant data array based on selected metric
    const data = chartData?.[metric] ?? [];

    if (!Array.isArray(data) || data.length === 0) {
      return {
        bestMonth: null,
        worstMonth: null,
        bestValue: '-',
        worstValue: '-',
        trend: 0,
        trendPercent: 0,
      };
    }

    // Initialize tracking variables
    let bestMonthIndex = -1;
    let worstMonthIndex = -1;
    let bestValue = metric === 'pace' ? Number.MAX_VALUE : 0;
    let worstValue = metric === 'pace' ? 0 : Number.MAX_VALUE;

    data.forEach((value, index) => {
      if (value == null || value === 0) return; // skip null or 0

      if (metric === 'pace') {
        if (value < bestValue) {
          bestValue = value;
          bestMonthIndex = index;
        }
        if (value > worstValue) {
          worstValue = value;
          worstMonthIndex = index;
        }
      } else {
        if (value > bestValue) {
          bestValue = value;
          bestMonthIndex = index;
        }
        if (value < worstValue && value > 0) {
          worstValue = value;
          worstMonthIndex = index;
        }
      }
    });

    // Format best/worst values
    let bestMetricDisplay = '-';
    let worstMetricDisplay = '-';

    if (bestMonthIndex !== -1) {
      if (metric === 'distance') {
        bestMetricDisplay = `${bestValue.toFixed(1)} km`;
        worstMetricDisplay =
          worstValue === Number.MAX_VALUE ? '-' : `${worstValue.toFixed(1)} km`;
      } else if (metric === 'duration') {
        bestMetricDisplay = `${Math.round(bestValue)} min`;
        worstMetricDisplay =
          worstValue === Number.MAX_VALUE
            ? '-'
            : `${Math.round(worstValue)} min`;
      } else if (metric === 'pace') {
        bestMetricDisplay = formatPace(bestValue);
        worstMetricDisplay = worstValue === 0 ? '-' : formatPace(worstValue);
      }
    }

    // Calculate trend safely
    const currentMonth = data.length >= 1 ? data[data.length - 1] : null;
    const previousMonth = data.length >= 2 ? data[data.length - 2] : null;

    let trend = 0;
    if (currentMonth != null && previousMonth != null) {
      if (metric === 'pace') {
        trend = previousMonth - currentMonth;
      } else {
        trend = currentMonth - previousMonth;
      }
    }

    return {
      bestMonth:
        bestMonthIndex !== -1
          ? monthRanges[bestMonthIndex]?.fullMonthName ?? null
          : null,
      worstMonth:
        worstMonthIndex !== -1
          ? monthRanges[worstMonthIndex]?.fullMonthName ?? null
          : null,
      bestValue: bestMetricDisplay,
      worstValue: worstMetricDisplay,
      trend,
      trendPercent: previousMonth ? (Math.abs(trend) / previousMonth) * 100 : 0,
    };
  }, [chartData, metric, monthRanges]);

  useEffect(() => {
    // Reset animation when metric changes
    setChartReady(false);
    animationProgress.value = 0;

    // Trigger animation
    setTimeout(() => {
      setChartReady(true);
      animationProgress.value = withTiming(1, { duration: 800 });
    }, 100);
  }, [metric]);

  // Prepare chart configuration
  const chartConfig = useMemo(
    () => ({
      backgroundColor: 'transparent',
      backgroundGradientFrom: 'transparent',
      backgroundGradientTo: 'transparent',
      color: () => {
        if (metric === 'distance') return colors.secondary[500];
        if (metric === 'duration') return colors.primary[500];
        return colors.error[500];
      },
      labelColor: () => colors.neutral[500],
      style: {
        borderRadius: 16,
      },
      barPercentage: 0.7,
      decimalPlaces: metric === 'pace' ? 1 : 0,
      formatYLabel: (value: string) => {
        if (metric === 'pace') {
          return formatPace(parseFloat(value));
        }
        return value;
      },
    }),
    [colors, metric]
  );

  // Get proper chart data based on selected metric
  const chartDisplayData = useMemo(
    () => ({
      labels: chartData.labels,
      datasets: [
        {
          data: chartData[metric] ?? [],
          color: () => {
            if (metric === 'distance') return colors.secondary[500];
            if (metric === 'duration') return colors.primary[500];
            return colors.error[500];
          },
        },
      ],
      legend: [
        metric === 'distance'
          ? 'Distance (km)'
          : metric === 'duration'
          ? 'Durée (min)'
          : 'Allure (min/km)',
      ],
    }),
    [chartData, colors, metric]
  );

  // Animation style
  const containerStyle = useAnimatedStyle(() => ({
    opacity: animationProgress.value,
    transform: [{ translateY: (1 - animationProgress.value) * 20 }],
  }));

  // Check if we have any data to display
  const hasData = chartData.sessionCounts.some((count) => count > 0);

  if (!hasData) {
    return (
      <View
        style={[
          styles.emptyContainer,
          { backgroundColor: colors.cardBackground },
        ]}
      >
        <Calendar size={40} color={colors.neutral[400]} />
        <Text style={[styles.emptyText, { color: colors.text }]}>
          Pas de données pour cette période
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.neutral[500] }]}>
          Commencez à enregistrer vos sorties régulièrement pour voir des
          tendances saisonnières
        </Text>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.cardBackground },
        containerStyle,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <BarChart2 size={22} color={colors.secondary[500]} />
          <Text style={[styles.title, { color: colors.text }]}>
            Tendances {timeFrame === 'semester' ? 'semestrielles' : 'annuelles'}
          </Text>
        </View>

        <View style={styles.metricToggle}>
          <TouchableOpacity
            style={[
              styles.metricButton,
              metric === 'distance' && {
                backgroundColor: colors.secondary[100],
                borderColor: colors.secondary[300],
              },
              metric !== 'distance' && {
                borderColor: colors.neutral[300],
              },
            ]}
            onPress={() => setMetric('distance')}
          >
            <Zap
              size={14}
              color={
                metric === 'distance'
                  ? colors.secondary[600]
                  : colors.neutral[600]
              }
            />
            <Text
              style={[
                styles.metricText,
                {
                  color:
                    metric === 'distance'
                      ? colors.secondary[600]
                      : colors.neutral[600],
                },
              ]}
            >
              Distance
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.metricButton,
              metric === 'duration' && {
                backgroundColor: colors.primary[100],
                borderColor: colors.primary[300],
              },
              metric !== 'duration' && {
                borderColor: colors.neutral[300],
              },
            ]}
            onPress={() => setMetric('duration')}
          >
            <Clock
              size={14}
              color={
                metric === 'duration'
                  ? colors.primary[600]
                  : colors.neutral[600]
              }
            />
            <Text
              style={[
                styles.metricText,
                {
                  color:
                    metric === 'duration'
                      ? colors.primary[600]
                      : colors.neutral[600],
                },
              ]}
            >
              Durée
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.metricButton,
              metric === 'pace' && {
                backgroundColor: colors.error[100],
                borderColor: colors.error[300],
              },
              metric !== 'pace' && {
                borderColor: colors.neutral[300],
              },
            ]}
            onPress={() => setMetric('pace')}
          >
            <Flame
              size={14}
              color={
                metric === 'pace' ? colors.error[600] : colors.neutral[600]
              }
            />
            <Text
              style={[
                styles.metricText,
                {
                  color:
                    metric === 'pace' ? colors.error[600] : colors.neutral[600],
                },
              ]}
            >
              Allure
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {chartReady && (
        <View style={styles.chartContainer}>
          <BarChart
            data={chartDisplayData}
            width={width - 64}
            height={220}
            chartConfig={chartConfig}
            fromZero={true}
            showBarTops={false}
            withInnerLines={true}
            yAxisLabel={
              metric === 'distance'
                ? 'km '
                : metric === 'duration'
                ? 'min '
                : ''
            }
            yAxisSuffix={
              metric === 'distance'
                ? ' km'
                : metric === 'duration'
                ? ' min'
                : ''
            }
            style={styles.chart}
          />
        </View>
      )}

      {/* Insights section */}
      {insights.bestMonth && (
        <View style={styles.insightsContainer}>
          <View style={styles.insightRow}>
            <View style={styles.insight}>
              <Text
                style={[styles.insightLabel, { color: colors.neutral[500] }]}
              >
                Meilleur mois
              </Text>
              <Text
                style={[styles.insightValue, { color: colors.success[500] }]}
              >
                {insights.bestMonth}
              </Text>
              <Text style={[styles.insightMetric, { color: colors.text }]}>
                {insights.bestValue}
              </Text>
            </View>

            <View style={styles.insight}>
              <Text
                style={[styles.insightLabel, { color: colors.neutral[500] }]}
              >
                Mois le moins performant
              </Text>
              <Text
                style={[styles.insightValue, { color: colors.warning[500] }]}
              >
                {insights.worstMonth || '-'}
              </Text>
              <Text style={[styles.insightMetric, { color: colors.text }]}>
                {insights.worstValue}
              </Text>
            </View>
          </View>

          {insights.trend !== 0 && Math.abs(insights.trendPercent) > 5 && (
            <View
              style={[
                styles.trendContainer,
                {
                  backgroundColor:
                    (metric === 'pace' && insights.trend < 0) ||
                    (metric !== 'pace' && insights.trend > 0)
                      ? colors.success[100]
                      : colors.warning[100],
                },
              ]}
            >
              <Text
                style={[
                  styles.trendText,
                  {
                    color:
                      (metric === 'pace' && insights.trend < 0) ||
                      (metric !== 'pace' && insights.trend > 0)
                        ? colors.success[600]
                        : colors.warning[600],
                  },
                ]}
              >
                Tendance récente: {Math.abs(insights.trendPercent).toFixed(1)}%
                {(metric === 'pace' && insights.trend < 0) ||
                (metric !== 'pace' && insights.trend > 0)
                  ? "d'amélioration"
                  : 'de diminution'}
                {metric === 'distance'
                  ? ' de distance'
                  : metric === 'duration'
                  ? " de temps d'activité"
                  : " d'allure"}
              </Text>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  metricToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  metricText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginLeft: 4,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  insightsContainer: {
    marginTop: 8,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  insight: {
    flex: 1,
    padding: 8,
  },
  insightLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  insightMetric: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  trendContainer: {
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  trendText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  emptyContainer: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});

export default SeasonalPerformanceChart;
