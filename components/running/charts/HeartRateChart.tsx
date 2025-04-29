// components/running/charts/HeartRateChart.tsx
import { Heart, TrendingDown, TrendingUp } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
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

interface HeartRateChartProps {
  sessions: any[];
  colors: any;
  period?: 'recent' | 'all';
}

const HeartRateChart = ({
  sessions, // Les sessions d'entraînement à analyser
  colors, // Les couleurs de thème pour l'interface
  period = 'recent', // La période d'analyse: 'recent' ou 'all'
}: HeartRateChartProps) => {
  // État pour basculer entre fréquence cardiaque moyenne ou maximale
  const [selectedChart, setSelectedChart] = useState<'avg' | 'max'>('avg');

  // Valeur partagée pour l'animation du composant
  const animationProgress = useSharedValue(0);

  // Déclencher l'animation lorsque les sessions ou le type de graphique change
  useEffect(() => {
    animationProgress.value = 0;
    animationProgress.value = withTiming(1, { duration: 1000 });
  }, [sessions, selectedChart]);

  // PARTIE PROBLÉMATIQUE: Filtrage des sessions avec des données de fréquence cardiaque
  // Le code original ne vérifie pas correctement si les données sont valides
  const sessionsWithHeartRate = sessions.filter(
    (session) =>
      (selectedChart === 'avg' && session.avgHeartRate !== undefined) ||
      (selectedChart === 'max' && session.maxHeartRate !== undefined)
  );

  // SOLUTION: Filtrage amélioré avec des vérifications complètes
  const safeSessionsWithHeartRate = sessions.filter(
    (session) =>
      session && // Vérifier que la session existe
      ((selectedChart === 'avg' &&
        typeof session.avgHeartRate === 'number' &&
        !isNaN(session.avgHeartRate)) ||
        (selectedChart === 'max' &&
          typeof session.maxHeartRate === 'number' &&
          !isNaN(session.maxHeartRate)))
  );

  // Afficher un état vide si aucune donnée de fréquence cardiaque n'est disponible
  if (safeSessionsWithHeartRate.length === 0) {
    return (
      <View
        style={[
          styles.emptyContainer,
          { backgroundColor: colors.cardBackground },
        ]}
      >
        <Heart size={40} color={colors.neutral[400]} />
        <Text style={[styles.emptyText, { color: colors.text }]}>
          Pas de données de fréquence cardiaque disponibles
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.neutral[500] }]}>
          Commencez à enregistrer vos FC pour voir des statistiques ici
        </Text>
      </View>
    );
  }

  // Limiter le nombre de sessions selon la période ou utiliser toutes les sessions
  const filteredSessions =
    period === 'recent'
      ? safeSessionsWithHeartRate.slice(0, 10)
      : safeSessionsWithHeartRate;

  // PARTIE PROBLÉMATIQUE: Tri des sessions par date sans vérification
  // Le code original suppose que toutes les dates sont valides
  const sortedSessions = [...filteredSessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // SOLUTION: Tri sécurisé des sessions avec vérification des dates
  const safeSortedSessions = [...filteredSessions].sort((a, b) => {
    try {
      if (!a.date || !b.date) return 0;

      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;

      return dateA.getTime() - dateB.getTime();
    } catch (error) {
      console.error('Error sorting sessions by date:', error);
      return 0;
    }
  });

  // Préparation des données pour le graphique, avec mémorisation pour optimiser les performances
  const chartData = useMemo(
    () => ({
      // Étiquettes pour l'axe X (dates des sessions)
      labels: safeSortedSessions.map((session, index) => {
        try {
          const date = new Date(session.date);
          if (isNaN(date.getTime())) return '';

          // Afficher seulement quelques dates pour éviter l'encombrement
          return index %
            Math.max(1, Math.floor(safeSortedSessions.length / 5)) ===
            0
            ? `${date.getDate()}/${date.getMonth() + 1}`
            : '';
        } catch (error) {
          console.error('Error formatting date label:', error);
          return '';
        }
      }),
      // Données pour le graphique (FC moyenne ou maximale)
      datasets: [
        {
          data: safeSortedSessions.map((session) =>
            selectedChart === 'avg'
              ? session.avgHeartRate
              : session.maxHeartRate
          ),
          color: () =>
            selectedChart === 'avg' ? colors.secondary[500] : colors.error[500],
          strokeWidth: 2,
        },
      ],
      legend: [selectedChart === 'avg' ? 'FC Moyenne (bpm)' : 'FC Max (bpm)'],
    }),
    [safeSortedSessions, selectedChart, colors]
  );

  // Calcul des statistiques sur les données de fréquence cardiaque
  const heartRateData = safeSortedSessions.map((session) =>
    selectedChart === 'avg' ? session.avgHeartRate : session.maxHeartRate
  );

  // Calcul de la moyenne, du min et du max avec vérifications
  const validHeartRateData = heartRateData.filter(
    (hr) => typeof hr === 'number' && !isNaN(hr)
  );

  const averageHeartRate = validHeartRateData.length
    ? Math.round(
        validHeartRateData.reduce((sum, hr) => sum + hr, 0) /
          validHeartRateData.length
      )
    : 0;

  const minHeartRate = validHeartRateData.length
    ? Math.min(...validHeartRateData)
    : 0;
  const maxHeartRate = validHeartRateData.length
    ? Math.max(...validHeartRateData)
    : 0;

  // Calcul de la tendance (régression linéaire) avec vérifications de sécurité
  let trend = 0;

  if (
    validHeartRateData.length >= 3 // Avoir au moins 3 points pour une tendance significative
  ) {
    try {
      const x = Array.from({ length: validHeartRateData.length }, (_, i) => i);
      const y = validHeartRateData;

      const n = x.length;
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
      const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);

      const denominator = n * sumX2 - sumX * sumX;
      trend = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
    } catch (error) {
      console.error('Error calculating heart rate trend:', error);
      trend = 0;
    }
  }

  // Configuration du graphique
  const chartConfig = useMemo(
    () => ({
      backgroundColor: 'transparent',
      backgroundGradientFrom: 'transparent',
      backgroundGradientTo: 'transparent',
      color: () => colors.text,
      labelColor: () => colors.neutral[500],
      propsForDots: {
        r: '4',
        strokeWidth: '2',
        stroke:
          selectedChart === 'avg' ? colors.secondary[500] : colors.error[500],
      },
      propsForBackgroundLines: {
        stroke: colors.neutral[300],
        strokeWidth: 1,
        strokeDasharray: '5, 5',
      },
      useShadowColorFromDataset: false,
      decimalPlaces: 0,
    }),
    [colors, selectedChart]
  );

  // Style d'animation pour le composant
  const cardStyle = useAnimatedStyle(() => ({
    opacity: animationProgress.value,
    transform: [{ translateY: (1 - animationProgress.value) * 20 }],
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.cardBackground },
        cardStyle,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Heart
            size={22}
            color={
              selectedChart === 'avg'
                ? colors.secondary[500]
                : colors.error[500]
            }
          />
          <Text style={[styles.title, { color: colors.text }]}>
            {selectedChart === 'avg'
              ? 'Fréquence cardiaque moyenne'
              : 'Fréquence cardiaque maximale'}
          </Text>
        </View>

        <View style={styles.buttonToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              selectedChart === 'avg' && {
                backgroundColor: colors.secondary[100],
                borderColor: colors.secondary[300],
              },
              selectedChart !== 'avg' && {
                borderColor: colors.neutral[300],
              },
            ]}
            onPress={() => setSelectedChart('avg')}
          >
            <Text
              style={[
                styles.toggleText,
                {
                  color:
                    selectedChart === 'avg'
                      ? colors.secondary[600]
                      : colors.neutral[600],
                },
              ]}
            >
              Moyenne
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              selectedChart === 'max' && {
                backgroundColor: colors.error[100],
                borderColor: colors.error[300],
              },
              selectedChart !== 'max' && {
                borderColor: colors.neutral[300],
              },
            ]}
            onPress={() => setSelectedChart('max')}
          >
            <Text
              style={[
                styles.toggleText,
                {
                  color:
                    selectedChart === 'max'
                      ? colors.error[600]
                      : colors.neutral[600],
                },
              ]}
            >
              Maximale
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {sortedSessions.length > 0 ? (
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={width - 64}
            height={220}
            chartConfig={chartConfig}
            bezier
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLines={false}
            withHorizontalLines={true}
            fromZero={false}
            yAxisSuffix=" bpm"
            style={styles.chart}
          />
        </View>
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={[styles.noDataText, { color: colors.neutral[500] }]}>
            Pas assez de données pour afficher un graphique
          </Text>
        </View>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {averageHeartRate} bpm
          </Text>
          <Text style={[styles.statLabel, { color: colors.neutral[500] }]}>
            Moyenne
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {minHeartRate} bpm
          </Text>
          <Text style={[styles.statLabel, { color: colors.neutral[500] }]}>
            Minimum
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {maxHeartRate} bpm
          </Text>
          <Text style={[styles.statLabel, { color: colors.neutral[500] }]}>
            Maximum
          </Text>
        </View>
      </View>

      {trend !== 0 && (
        <View
          style={[
            styles.trendContainer,
            {
              backgroundColor:
                trend < 0 ? colors.success[100] : colors.warning[100],
            },
          ]}
        >
          {trend < 0 ? (
            <TrendingDown size={18} color={colors.success[600]} />
          ) : (
            <TrendingUp size={18} color={colors.warning[600]} />
          )}
          <Text
            style={[
              styles.trendText,
              { color: trend < 0 ? colors.success[600] : colors.warning[600] },
            ]}
          >
            {selectedChart === 'avg'
              ? 'Votre FC moyenne '
              : 'Votre FC maximale '}
            {trend < 0 ? 'diminue' : 'augmente'} au fil du temps
            {trend < 0
              ? ' (amélioration de votre condition cardiaque)'
              : " (augmentation de l'intensité des sorties)"}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  buttonToggle: {
    flexDirection: 'row',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 8,
  },
  toggleText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
    flex: 1,
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
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});

export default HeartRateChart;
