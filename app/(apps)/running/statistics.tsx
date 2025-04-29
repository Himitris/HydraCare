import Colors from '@/constants/Colors';
import { useAppContext } from '@/context/AppContext';
import { useRunningData } from '@/hooks/useRunningData';
import { format, isAfter, isBefore, startOfWeek, subDays } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import {
  Activity,
  BarChart2,
  Calendar,
  ChevronDown,
  Clock,
  Heart,
  RefreshCw,
  TrendingUp,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Importer les composants de visualisation
import HeartRateChart from '@/components/running/charts/HeartRateChart';
import PerformanceComparisonChart from '@/components/running/charts/PerformanceComparisonChart';
import SeasonalPerformanceChart from '@/components/running/charts/SeasonalPerformanceChart';

// Importer les fonctions de formatage
import { formatPace } from '@/utils/formatters';

// Périodes disponibles pour les statistiques
type StatsPeriod = '7d' | '30d' | '90d' | 'all';

export default function RunningStatisticsScreen() {
  const { isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const { sessions, isLoading, loadSessions } = useRunningData();
  const [period, setPeriod] = useState<StatsPeriod>('30d');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'heart' | 'season' | 'compare'
  >('overview');
  const [filteredSessions, setFilteredSessions] = useState(sessions);

  // État pour le rafraîchissement
  const [refreshing, setRefreshing] = useState(false);

  // Fonction pour gérer le rafraîchissement
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  }, [loadSessions]);

  // Filtrer les sessions selon la période sélectionnée
  useEffect(() => {
    const now = new Date();
    let cutoffDate: Date;

    switch (period) {
      case '7d':
        cutoffDate = subDays(now, 7);
        break;
      case '30d':
        cutoffDate = subDays(now, 30);
        break;
      case '90d':
        cutoffDate = subDays(now, 90);
        break;
      case 'all':
      default:
        cutoffDate = new Date(0); // Début du temps UNIX
        break;
    }

    const filtered = sessions.filter((session) => {
      // Vérifier que session.date est défini et valide
      if (!session || !session.date) return false;

      const sessionDate = new Date(session.date);
      // Vérifier que la date est valide
      if (isNaN(sessionDate.getTime())) return false;

      return isAfter(sessionDate, cutoffDate) && isBefore(sessionDate, now);
    });

    setFilteredSessions(filtered);
  }, [sessions, period]);

  // Calcul des statistiques pour la période sélectionnée
  const stats = useMemo(() => {
    // Vérifier que les sessions sont bien définies
    if (!filteredSessions || filteredSessions.length === 0) {
      return {
        totalSessions: 0,
        totalDistance: 0,
        totalDuration: 0,
        avgDistance: 0,
        avgDuration: 0,
        avgPace: 0,
        bestPace: null,
        longestRun: null,
        feelingCounts: {
          Excellent: 0,
          Bien: 0,
          Moyen: 0,
          Difficile: 0,
        },
        distanceByWeek: [],
        paceProgression: [],
        totalRuns: 0,
        totalRests: 0,
        restRatio: 0,
      };
    }

    // Séparer les sorties valides des jours de repos
    const runSessions = filteredSessions.filter(
      (s) => (s.type === 'run' || s.type === undefined) && s !== null
    );
    const restSessions = filteredSessions.filter(
      (s) => s !== null && s.type === 'rest'
    );

    // Total des sessions par type
    const totalRuns = runSessions.length;
    const totalRests = restSessions.length;

    // Total des sessions, distance et durée avec vérifications supplémentaires
    const totalSessions = filteredSessions.length;
    const totalDistance = runSessions.reduce(
      (sum, s) => sum + (s && typeof s.distance === 'number' ? s.distance : 0),
      0
    );
    const totalDuration = runSessions.reduce(
      (sum, s) => sum + (s && typeof s.duration === 'number' ? s.duration : 0),
      0
    );

    // Moyennes avec protection contre division par zéro
    const avgDistance = totalRuns > 0 ? totalDistance / totalRuns : 0;
    const avgDuration = totalRuns > 0 ? totalDuration / totalRuns : 0;
    const avgPace = totalDistance > 0 ? totalDuration / totalDistance : 0;

    // Meilleure performance avec vérifications supplémentaires
    const sessionsWithPace = runSessions.filter(
      (s) => s && s.pace && s.distance && s.distance > 1
    );
    const bestPace =
      sessionsWithPace.length > 0
        ? sessionsWithPace.reduce((best, current) => {
            const currentPace = current?.pace ?? Infinity;
            const bestPace = best?.pace ?? Infinity;
            return currentPace < bestPace ? current : best;
          }, sessionsWithPace[0])
        : null;

    // Course la plus longue avec vérifications
    const sessionsWithDistance = runSessions.filter(
      (s) => s && typeof s.distance === 'number'
    );
    const longestRun =
      sessionsWithDistance.length > 0
        ? sessionsWithDistance.reduce((longest, current) => {
            const currentDistance = current?.distance ?? 0;
            const longestDistance = longest?.distance ?? 0;
            return currentDistance > longestDistance ? current : longest;
          }, sessionsWithDistance[0])
        : null;

    // Répartition des ressentis avec vérifications
    const feelingCounts = {
      Excellent: runSessions.filter((s) => s && s.feeling === 'Excellent').length,
      Bien: runSessions.filter((s) => s && s.feeling === 'Bien').length,
      Moyen: runSessions.filter((s) => s && s.feeling === 'Moyen').length,
      Difficile: runSessions.filter((s) => s && s.feeling === 'Difficile').length,
    };

    // Calcul des données pour graphique de distance par semaine
    const distanceByWeek: { week: string; distance: number }[] = [];
    if (runSessions.length > 0) {
      // Grouper par semaine avec vérifications
      const sessionsByWeek = runSessions.reduce(
        (acc: { [key: string]: any[] }, session) => {
          if (!session || !session.date) return acc;

          try {
            const sessionDate = new Date(session.date);
            if (isNaN(sessionDate.getTime())) return acc;

            const weekStart = format(
              startOfWeek(sessionDate, { weekStartsOn: 1 }),
              'yyyy-MM-dd'
            );
            if (!acc[weekStart]) {
              acc[weekStart] = [];
            }
            acc[weekStart].push(session);
          } catch (error) {
            console.error('Error processing session date:', error);
          }
          return acc;
        },
        {}
      );

      // Calculer la distance totale par semaine avec vérifications
      Object.entries(sessionsByWeek).forEach(([weekStart, sessionsInWeek]) => {
        try {
          const weekLabel = format(new Date(weekStart), 'dd/MM');
          const totalDistance = sessionsInWeek.reduce(
            (sum, s) =>
              sum + (s && typeof s.distance === 'number' ? s.distance : 0),
            0
          );
          distanceByWeek.push({
            week: weekLabel,
            distance: parseFloat(totalDistance.toFixed(1)),
          });
        } catch (error) {
          console.error('Error calculating distance by week:', error);
        }
      });

      // Trier par date avec vérifications
      try {
        distanceByWeek.sort((a, b) => {
          if (!a.week || !b.week) return 0;

          try {
            const partsA = a.week.split('/');
            const partsB = b.week.split('/');

            if (partsA.length !== 2 || partsB.length !== 2) return 0;

            const dateA = new Date(
              2023,
              parseInt(partsA[1]) - 1,
              parseInt(partsA[0])
            );
            const dateB = new Date(
              2023,
              parseInt(partsB[1]) - 1,
              parseInt(partsB[0])
            );

            if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;

            return dateA.getTime() - dateB.getTime();
          } catch (error) {
            console.error('Error sorting distance by week:', error);
            return 0;
          }
        });
      } catch (error) {
        console.error('Error sorting distance by week:', error);
      }
    }

    // Progression de l'allure dans le temps avec vérifications
    const paceProgression = runSessions
      .filter((s) => s && s.pace && s.distance && s.distance > 1)
      .sort((a, b) => {
        try {
          if (!a.date || !b.date) return 0;

          const dateA = new Date(a.date);
          const dateB = new Date(b.date);

          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;

          return dateA.getTime() - dateB.getTime();
        } catch (error) {
          console.error('Error sorting pace progression:', error);
          return 0;
        }
      })
      .map((s) => {
        try {
          if (!s.date) return { date: '', pace: 0 };

          const sessionDate = new Date(s.date);
          if (isNaN(sessionDate.getTime())) return { date: '', pace: 0 };

          return {
            date: format(sessionDate, 'dd/MM'),
            pace: s.pace || 0,
          };
        } catch (error) {
          console.error('Error mapping pace progression:', error);
          return { date: '', pace: 0 };
        }
      });

    return {
      totalSessions,
      totalDistance,
      totalDuration,
      avgDistance,
      avgDuration,
      avgPace,
      bestPace,
      longestRun,
      feelingCounts,
      distanceByWeek,
      paceProgression,
      totalRuns,
      totalRests,
      restRatio:
        totalRuns + totalRests > 0 ? totalRests / (totalRuns + totalRests) : 0,
    };
  }, [filteredSessions]);

  const periodLabels = {
    '7d': '7 derniers jours',
    '30d': '30 derniers jours',
    '90d': '3 derniers mois',
    all: "Tout l'historique",
  };

  if (isLoading) {
    return (
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <LinearGradient
          colors={
            isDarkMode
              ? [colors.background, colors.secondary[50]]
              : [colors.secondary[50], colors.background]
          }
          locations={[0, 0.3]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={[styles.safeArea, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={colors.secondary[500]} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Chargement des statistiques...
          </Text>
        </SafeAreaView>
      </Animated.View>
    );
  }

  // Fonction de rendu pour la vue des statistiques générales
  const renderOverviewTab = () => (
    <>
      {/* Cartes de statistiques */}
      <View style={styles.statsCardGrid}>
        <Animated.View entering={FadeInDown.delay(50)} style={styles.statsCard}>
          <View
            style={[
              styles.statsCardContent,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <View style={styles.statsCardHeader}>
              <Activity size={20} color={colors.secondary[500]} />
              <Text style={[styles.statsCardTitle, { color: colors.text }]}>
                Activité Totale
              </Text>
            </View>
            <View style={styles.statsCardBody}>
              <View style={styles.statsCardItem}>
                <Text style={[styles.statsCardValue, { color: colors.text }]}>
                  {stats.totalSessions}
                </Text>
                <Text
                  style={[
                    styles.statsCardLabel,
                    { color: colors.neutral[500] },
                  ]}
                >
                  Sessions
                </Text>
              </View>
              <View style={styles.statsCardItem}>
                <Text style={[styles.statsCardValue, { color: colors.text }]}>
                  {stats.totalDistance.toFixed(1)} km
                </Text>
                <Text
                  style={[
                    styles.statsCardLabel,
                    { color: colors.neutral[500] },
                  ]}
                >
                  Distance
                </Text>
              </View>
              <View style={styles.statsCardItem}>
                <Text style={[styles.statsCardValue, { color: colors.text }]}>
                  {Math.floor(stats.totalDuration / 60)}h{' '}
                  {Math.round(stats.totalDuration % 60)}min
                </Text>
                <Text
                  style={[
                    styles.statsCardLabel,
                    { color: colors.neutral[500] },
                  ]}
                >
                  Durée
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(100)}
          style={styles.statsCard}
        >
          <View
            style={[
              styles.statsCardContent,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <View style={styles.statsCardHeader}>
              <TrendingUp size={20} color={colors.primary[500]} />
              <Text style={[styles.statsCardTitle, { color: colors.text }]}>
                Moyennes
              </Text>
            </View>
            <View style={styles.statsCardBody}>
              <View style={styles.statsCardItem}>
                <Text style={[styles.statsCardValue, { color: colors.text }]}>
                  {stats.avgDistance.toFixed(1)} km
                </Text>
                <Text
                  style={[
                    styles.statsCardLabel,
                    { color: colors.neutral[500] },
                  ]}
                >
                  Distance
                </Text>
              </View>
              <View style={styles.statsCardItem}>
                <Text style={[styles.statsCardValue, { color: colors.text }]}>
                  {Math.round(stats.avgDuration)} min
                </Text>
                <Text
                  style={[
                    styles.statsCardLabel,
                    { color: colors.neutral[500] },
                  ]}
                >
                  Durée
                </Text>
              </View>
              <View style={styles.statsCardItem}>
                <Text style={[styles.statsCardValue, { color: colors.text }]}>
                  {formatPace(stats.avgPace)} /km
                </Text>
                <Text
                  style={[
                    styles.statsCardLabel,
                    { color: colors.neutral[500] },
                  ]}
                >
                  Allure
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Carte pour les jours de repos */}
        <Animated.View
          entering={FadeInDown.delay(250)}
          style={styles.statsCard}
        >
          <View
            style={[
              styles.statsCardContent,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <View style={styles.statsCardHeader}>
              <RefreshCw size={20} color={colors.success[500]} />
              <Text style={[styles.statsCardTitle, { color: colors.text }]}>
                Jours de repos
              </Text>
            </View>
            <View style={styles.statsCardBody}>
              <View style={styles.statsCardItem}>
                <Text style={[styles.statsCardValue, { color: colors.text }]}>
                  {stats.totalRests}
                </Text>
                <Text
                  style={[
                    styles.statsCardLabel,
                    { color: colors.neutral[500] },
                  ]}
                >
                  Total
                </Text>
              </View>
              <View style={styles.statsCardItem}>
                <Text style={[styles.statsCardValue, { color: colors.text }]}>
                  {Math.round(stats.restRatio * 100)}%
                </Text>
                <Text
                  style={[
                    styles.statsCardLabel,
                    { color: colors.neutral[500] },
                  ]}
                >
                  Ratio
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Records et performances */}
      <Animated.View entering={FadeInDown.delay(150)}>
        <View
          style={[
            styles.recordsCard,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          <View style={styles.sectionHeader}>
            <BarChart2 size={20} color={colors.success[500]} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Meilleures performances
            </Text>
          </View>

          <View style={styles.recordsGrid}>
            <View style={styles.recordItem}>
              <Text
                style={[styles.recordLabel, { color: colors.neutral[500] }]}
              >
                Course la plus longue
              </Text>
              <Text style={[styles.recordValue, { color: colors.text }]}>
                {stats.longestRun
                  ? `${stats.longestRun.distance?.toFixed(1)} km`
                  : '-'}
              </Text>
              <Text style={[styles.recordDate, { color: colors.neutral[400] }]}>
                {stats.longestRun
                  ? format(new Date(stats.longestRun.date), 'dd/MM/yyyy')
                  : ''}
              </Text>
            </View>

            <View style={styles.recordItem}>
              <Text
                style={[styles.recordLabel, { color: colors.neutral[500] }]}
              >
                Meilleure allure
              </Text>
              <Text style={[styles.recordValue, { color: colors.text }]}>
                {stats.bestPace
                  ? `${formatPace(stats.bestPace.pace)} /km`
                  : '-'}
              </Text>
              <Text style={[styles.recordDate, { color: colors.neutral[400] }]}>
                {stats.bestPace
                  ? format(new Date(stats.bestPace.date), 'dd/MM/yyyy')
                  : ''}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </>
  );

  // Rendu principal
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={
          isDarkMode
            ? [colors.background, colors.secondary[50]]
            : [colors.secondary[50], colors.background]
        }
        locations={[0, 0.3]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />

        {/* En-tête avec période */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <BarChart2 size={28} color={colors.secondary[500]} />
            <View style={styles.titleTextContainer}>
              <Text style={[styles.title, { color: colors.text }]}>
                Statistiques
              </Text>
              <Text style={[styles.subtitle, { color: colors.neutral[500] }]}>
                {filteredSessions.length} sessions analysées
              </Text>
            </View>
          </View>

          {/* Sélecteur de période */}
          <TouchableOpacity
            style={[
              styles.periodSelector,
              { backgroundColor: colors.secondary[100] },
            ]}
            onPress={() => {
              // Rotation pour afficher un menu de sélection de période
              // Note: Implémentation simple ici, on change juste la période en cycle
              if (period === '7d') setPeriod('30d');
              else if (period === '30d') setPeriod('90d');
              else if (period === '90d') setPeriod('all');
              else setPeriod('7d');
            }}
          >
            <Calendar size={16} color={colors.secondary[500]} />
            <Text style={[styles.periodText, { color: colors.secondary[600] }]}>
              {periodLabels[period]}
            </Text>
            <ChevronDown size={16} color={colors.secondary[500]} />
          </TouchableOpacity>
        </View>

        {/* Onglets de navigation pour les différentes analyses */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'overview' && {
                backgroundColor: colors.secondary[100],
                borderBottomColor: colors.secondary[500],
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => setActiveTab('overview')}
          >
            <BarChart2
              size={16}
              color={
                activeTab === 'overview'
                  ? colors.secondary[600]
                  : colors.neutral[500]
              }
            />
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'overview'
                      ? colors.secondary[600]
                      : colors.neutral[500],
                },
              ]}
            >
              Résumé
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'heart' && {
                backgroundColor: colors.secondary[100],
                borderBottomColor: colors.secondary[500],
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => setActiveTab('heart')}
          >
            <Heart
              size={16}
              color={
                activeTab === 'heart'
                  ? colors.secondary[600]
                  : colors.neutral[500]
              }
            />
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'heart'
                      ? colors.secondary[600]
                      : colors.neutral[500],
                },
              ]}
            >
              Cardio
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'season' && {
                backgroundColor: colors.secondary[100],
                borderBottomColor: colors.secondary[500],
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => setActiveTab('season')}
          >
            <Calendar
              size={16}
              color={
                activeTab === 'season'
                  ? colors.secondary[600]
                  : colors.neutral[500]
              }
            />
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'season'
                      ? colors.secondary[600]
                      : colors.neutral[500],
                },
              ]}
            >
              Saisons
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'compare' && {
                backgroundColor: colors.secondary[100],
                borderBottomColor: colors.secondary[500],
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => setActiveTab('compare')}
          >
            <TrendingUp
              size={16}
              color={
                activeTab === 'compare'
                  ? colors.secondary[600]
                  : colors.neutral[500]
              }
            />
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'compare'
                      ? colors.secondary[600]
                      : colors.neutral[500],
                },
              ]}
            >
              Distances
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.secondary[500]]}
              tintColor={colors.secondary[500]}
              title="Actualisation..."
              titleColor={colors.text}
            />
          }
        >
          {activeTab === 'overview' && renderOverviewTab()}

          {activeTab === 'heart' && (
            <HeartRateChart
              sessions={filteredSessions}
              colors={colors}
              period={period === 'all' ? 'all' : 'recent'}
            />
          )}

          {activeTab === 'season' && (
            <SeasonalPerformanceChart
              sessions={sessions}
              colors={colors}
              timeFrame={
                period === 'all' || period === '90d' ? 'year' : 'semester'
              }
            />
          )}

          {activeTab === 'compare' && (
            <PerformanceComparisonChart
              sessions={period === 'all' ? sessions : filteredSessions}
              colors={colors}
            />
          )}

          {/* Message si pas assez de données */}
          {filteredSessions.length < 2 && (
            <Animated.View entering={FadeInDown.delay(350)}>
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: colors.cardBackground },
                ]}
              >
                <Clock size={40} color={colors.neutral[400]} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Pas assez de données
                </Text>
                <Text
                  style={[styles.emptyText, { color: colors.neutral[500] }]}
                >
                  Ajoutez plus de sessions de course pour voir des statistiques
                  détaillées et des graphiques de progression.
                </Text>
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginTop: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleTextContainer: {
    marginLeft: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  periodText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 8,
    justifyContent: 'space-between',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statsCardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  statsCard: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  statsCardContent: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsCardTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  statsCardBody: {
    gap: 8,
  },
  statsCardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsCardValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  statsCardLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  recordsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  recordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  recordItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  recordLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  recordValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  recordDate: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
});
