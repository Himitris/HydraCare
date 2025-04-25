// app/(apps)/running/statistics.tsx
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
  TrendingUp,
  Heart,
} from 'lucide-react-native';
import React, { useEffect, useState, useCallback } from 'react';
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
import SeasonalPerformanceChart from '@/components/running/charts/SeasonalPerformanceChart';
import PerformanceComparisonChart from '@/components/running/charts/PerformanceComparisonChart';

// Importer les fonctions de formatage
import { formatPace, formatDistance, formatDuration } from '@/utils/formatters';

const { width } = Dimensions.get('window');

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

    const filtered = sessions.filter(
      (session) =>
        isAfter(new Date(session.date), cutoffDate) &&
        isBefore(new Date(session.date), now)
    );

    setFilteredSessions(filtered);
  }, [sessions, period]);

  // Calcul des statistiques pour la période sélectionnée
  const stats = React.useMemo(() => {
    if (filteredSessions.length === 0) {
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
      };
    }

    // Total des sessions, distance et durée
    const totalSessions = filteredSessions.length;
    const totalDistance = filteredSessions.reduce(
      (sum, s) => sum + (s.distance || 0),
      0
    );
    const totalDuration = filteredSessions.reduce(
      (sum, s) => sum + (s.duration || 0),
      0
    );

    // Moyennes
    const avgDistance = totalDistance / totalSessions;
    const avgDuration = totalDuration / totalSessions;
    const avgPace = totalDistance > 0 ? totalDuration / totalDistance : 0;

    // Meilleure performance
    const sessionsWithPace = filteredSessions.filter(
      (s) => s.pace && s.distance && s.distance > 1
    );
    const bestPace =
      sessionsWithPace.length > 0
        ? sessionsWithPace.reduce(
            (best, current) =>
              (current.pace || Infinity) < (best.pace || Infinity)
                ? current
                : best,
            sessionsWithPace[0]
          )
        : null;

    // Course la plus longue
    const sessionsWithDistance = filteredSessions.filter((s) => s.distance);
    const longestRun =
      sessionsWithDistance.length > 0
        ? sessionsWithDistance.reduce(
            (longest, current) =>
              (current.distance || 0) > (longest.distance || 0)
                ? current
                : longest,
            sessionsWithDistance[0]
          )
        : null;

    // Répartition des ressentis
    const feelingCounts = {
      Excellent: filteredSessions.filter((s) => s.feeling === 'Excellent')
        .length,
      Bien: filteredSessions.filter((s) => s.feeling === 'Bien').length,
      Moyen: filteredSessions.filter((s) => s.feeling === 'Moyen').length,
      Difficile: filteredSessions.filter((s) => s.feeling === 'Difficile')
        .length,
    };

    // Calcul des données pour graphique de distance par semaine
    const distanceByWeek: { week: string; distance: number }[] = [];
    if (filteredSessions.length > 0) {
      // Grouper par semaine
      const sessionsByWeek = filteredSessions.reduce(
        (acc: { [key: string]: any[] }, session) => {
          const weekStart = format(
            startOfWeek(new Date(session.date), { weekStartsOn: 1 }),
            'yyyy-MM-dd'
          );
          if (!acc[weekStart]) {
            acc[weekStart] = [];
          }
          acc[weekStart].push(session);
          return acc;
        },
        {}
      );

      // Calculer la distance totale par semaine
      Object.entries(sessionsByWeek).forEach(([weekStart, sessionsInWeek]) => {
        const weekLabel = format(new Date(weekStart), 'dd/MM');
        const totalDistance = sessionsInWeek.reduce(
          (sum, s) => sum + (s.distance || 0),
          0
        );
        distanceByWeek.push({
          week: weekLabel,
          distance: parseFloat(totalDistance.toFixed(1)),
        });
      });

      // Trier par date
      distanceByWeek.sort((a, b) => {
        const dateA = new Date(
          a.week.split('/')[1] + '/' + a.week.split('/')[0] + '/2023'
        );
        const dateB = new Date(
          b.week.split('/')[1] + '/' + b.week.split('/')[0] + '/2023'
        );
        return dateA.getTime() - dateB.getTime();
      });
    }

    // Progression de l'allure dans le temps
    const paceProgression = filteredSessions
      .filter((s) => s.pace && s.distance && s.distance > 1)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((s) => ({
        date: format(new Date(s.date), 'dd/MM'),
        pace: s.pace || 0,
      }));

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
