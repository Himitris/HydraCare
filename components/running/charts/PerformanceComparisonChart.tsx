// components/running/charts/PerformanceComparisonChart.tsx
import { formatDuration, formatPace } from '@/utils/formatters';
import { ArrowDownUp, Award, Gauge, Ruler } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface PerformanceComparisonChartProps {
  sessions: any[];
  colors: any;
}

// Define distance ranges for categorization
const DISTANCE_RANGES = [
  { min: 0, max: 2.5, label: '0-2.5km', shortLabel: '<2.5' },
  { min: 2.5, max: 5, label: '2.5-5km', shortLabel: '2.5-5' },
  { min: 5, max: 10, label: '5-10km', shortLabel: '5-10' },
  { min: 10, max: 15, label: '10-15km', shortLabel: '10-15' },
  { min: 15, max: 21.1, label: '15-21km', shortLabel: '15-21' },
  { min: 21.1, max: 30, label: '21-30km', shortLabel: '21-30' },
  { min: 30, max: 50, label: '30km+', shortLabel: '>30' },
];

const PerformanceComparisonChart = ({
  sessions,
  colors,
}: PerformanceComparisonChartProps) => {
  const [metric, setMetric] = useState<'pace' | 'duration'>('pace');
  const animationProgress = useSharedValue(0);

  // Group sessions by distance ranges and calculate metrics
  const distanceStats = useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return [];
    }

    const stats = DISTANCE_RANGES.map((range) => ({
      ...range,
      sessions: [] as any[],
      avgPace: 0,
      bestPace: 0,
      avgDuration: 0,
      totalDistance: 0,
      count: 0,
    }));

    const validSessions = sessions.filter(
      (session) => session.distance && session.duration && session.pace
    );

    validSessions.forEach((session) => {
      const distance = session.distance;
      const rangeIndex = DISTANCE_RANGES.findIndex(
        (range) => distance >= range.min && distance < range.max
      );

      if (rangeIndex !== -1) {
        stats[rangeIndex].sessions.push(session);
        stats[rangeIndex].totalDistance += distance;
        stats[rangeIndex].count++;
      }
    });

    stats.forEach((range) => {
      if (range.count > 0) {
        range.avgPace =
          range.sessions.reduce((sum, s) => sum + s.pace, 0) / range.count;
        range.avgDuration =
          range.sessions.reduce((sum, s) => sum + s.duration, 0) / range.count;
        range.bestPace = Math.min(...range.sessions.map((s) => s.pace));
      }
    });

    return stats;
  }, [sessions]);

  // Filter ranges with data
  const rangesWithData = distanceStats.filter((range) => range.count > 0);

  // Animation when changing metric
  React.useEffect(() => {
    animationProgress.value = 0;
    animationProgress.value = withTiming(1, { duration: 800 });
  }, [metric]);

  // Prepare chart data
  const chartData = {
    labels: rangesWithData.map((range) => range.shortLabel),
    datasets: [
      {
        data: rangesWithData.map((range) =>
          metric === 'pace' ? range.avgPace : range.avgDuration
        ),
        color: () =>
          metric === 'pace' ? colors.error[500] : colors.primary[500],
        strokeWidth: 2,
      },
    ],
    legend: [
      metric === 'pace' ? 'Allure moyenne (min/km)' : 'Durée moyenne (min)',
    ],
  };

  // Chart configuration
  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    color: () => (metric === 'pace' ? colors.error[500] : colors.primary[500]),
    labelColor: () => colors.neutral[500],
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: metric === 'pace' ? colors.error[500] : colors.primary[500],
    },
    decimalPlaces: 1,
    formatYLabel: (value: string) => {
      if (metric === 'pace') {
        return formatPace(parseFloat(value));
      }
      return value;
    },
  };

  // Animation style
  const containerStyle = useAnimatedStyle(() => ({
    opacity: animationProgress.value,
    transform: [{ translateY: (1 - animationProgress.value) * 20 }],
  }));

  // Get best performances
  const bestPerformances = useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return [];
    }

    const result: any[] = [];
    const keyDistances = [5, 10, 21.1];

    keyDistances.forEach((targetDistance) => {
      const targetSessions = sessions.filter(
        (s) =>
          s.distance &&
          s.distance >= targetDistance * 0.95 &&
          s.distance <= targetDistance * 1.05 &&
          s.pace
      );

      if (targetSessions.length > 0) {
        const bestSession = targetSessions.reduce(
          (best, current) => (current.pace < best.pace ? current : best),
          targetSessions[0]
        );

        result.push({
          distance: targetDistance,
          session: bestSession,
          name:
            targetDistance === 5
              ? '5K'
              : targetDistance === 10
              ? '10K'
              : 'Semi-marathon',
        });
      }
    });

    return result;
  }, [sessions]);


  if (rangesWithData.length === 0) {
    return (
      <View
        style={[
          styles.emptyContainer,
          { backgroundColor: colors.cardBackground },
        ]}
      >
        <Ruler size={40} color={colors.neutral[400]} />
        <Text style={[styles.emptyText, { color: colors.text }]}>
          Pas de données pour la comparaison par distance
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.neutral[500] }]}>
          Enregistrez des sorties de différentes distances pour voir des
          comparaisons
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
          <ArrowDownUp size={22} color={colors.text} />
          <Text style={[styles.title, { color: colors.text }]}>
            Performances par distance
          </Text>
        </View>

        <View style={styles.metricToggle}>
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
            <Gauge
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
            <Ruler
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
        </View>
      </View>

      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={width - 64}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          fromZero={false}
        />
      </View>

      {/* Legend explaining distance ranges */}
      <View style={styles.legendContainer}>
        {rangesWithData.map((range, index) => (
          <View key={index} style={styles.legendItem}>
            <View
              style={[
                styles.legendColor,
                {
                  backgroundColor:
                    metric === 'pace' ? colors.error[500] : colors.primary[500],
                },
              ]}
            />
            <Text style={[styles.legendText, { color: colors.neutral[600] }]}>
              {range.shortLabel}: {range.label} ({range.count} sorties)
            </Text>
          </View>
        ))}
      </View>

      {/* Best performances section */}
      {bestPerformances.length > 0 && (
        <View style={styles.bestPerformancesContainer}>
          <View style={styles.bestPerformancesHeader}>
            <Award size={20} color={colors.success[500]} />
            <Text
              style={[styles.bestPerformancesTitle, { color: colors.text }]}
            >
              Meilleures performances
            </Text>
          </View>

          <View style={styles.bestPerformancesList}>
            {bestPerformances.map((performance, index) => (
              <View
                key={index}
                style={[
                  styles.bestPerformanceItem,
                  index < bestPerformances.length - 1 &&
                    styles.bestPerformanceBorder,
                  { borderBottomColor: colors.neutral[200] },
                ]}
              >
                <View style={styles.performanceHeader}>
                  <Text
                    style={[
                      styles.performanceName,
                      { color: colors.success[600] },
                    ]}
                  >
                    {performance.name}
                  </Text>
                  <Text
                    style={[
                      styles.performanceDate,
                      { color: colors.neutral[500] },
                    ]}
                  >
                    {new Date(performance.session.date).toLocaleDateString(
                      'fr-FR'
                    )}
                  </Text>
                </View>

                <View style={styles.performanceStats}>
                  <View style={styles.performanceStat}>
                    <Text
                      style={[styles.performanceValue, { color: colors.text }]}
                    >
                      {performance.session.distance.toFixed(2)} km
                    </Text>
                    <Text
                      style={[
                        styles.performanceLabel,
                        { color: colors.neutral[500] },
                      ]}
                    >
                      Distance
                    </Text>
                  </View>

                  <View style={styles.performanceStat}>
                    <Text
                      style={[styles.performanceValue, { color: colors.text }]}
                    >
                      {formatPace(performance.session.pace)}
                    </Text>
                    <Text
                      style={[
                        styles.performanceLabel,
                        { color: colors.neutral[500] },
                      ]}
                    >
                      Allure
                    </Text>
                  </View>

                  <View style={styles.performanceStat}>
                    <Text
                      style={[styles.performanceValue, { color: colors.text }]}
                    >
                      {formatDuration(performance.session.duration)}
                    </Text>
                    <Text
                      style={[
                        styles.performanceLabel,
                        { color: colors.neutral[500] },
                      ]}
                    >
                      Durée
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Analysis and insights */}
      {rangesWithData.length > 1 && (
        <View
          style={[
            styles.insightContainer,
            { backgroundColor: colors.secondary[50] },
          ]}
        >
          <Text style={[styles.insightText, { color: colors.text }]}>
            {metric === 'pace'
              ? 'Votre allure tend à ' +
                (chartData.datasets[0].data[0] <
                chartData.datasets[0].data[
                  chartData.datasets[0].data.length - 1
                ]
                  ? 'diminuer'
                  : 'augmenter') +
                ' avec la distance, ce qui est ' +
                (chartData.datasets[0].data[0] <
                chartData.datasets[0].data[
                  chartData.datasets[0].data.length - 1
                ]
                  ? "normal car l'endurance diminue sur des distances plus longues."
                  : "inhabituel et indique possiblement que vous êtes plus à l'aise sur des distances plus longues.")
              : 'La durée de vos sorties augmente naturellement avec la distance parcourue. ' +
                "Analysez le graphique d'allure pour une meilleure compréhension de vos performances."}
          </Text>
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
  legendContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
    width: '45%',
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  bestPerformancesContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  bestPerformancesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bestPerformancesTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  bestPerformancesList: {},
  bestPerformanceItem: {
    paddingVertical: 12,
  },
  bestPerformanceBorder: {
    borderBottomWidth: 1,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  performanceName: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  performanceDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  performanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  performanceStat: {
    alignItems: 'center',
    flex: 1,
  },
  performanceValue: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  performanceLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  insightContainer: {
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  insightText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
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

export default PerformanceComparisonChart;
