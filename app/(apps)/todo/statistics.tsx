// app/(apps)/todo/statistics.tsx
import Colors from '@/constants/Colors';
import { useAppContext } from '@/context/AppContext';
import { useTodoContext } from '@/context/TodoContext';
import {
  addDays,
  differenceInDays,
  eachDayOfInterval,
  eachWeekOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import {
  BarChart2,
  Calendar,
  CheckSquare,
  Clock,
  TrendingUp,
  Award,
  Flag,
  Filter,
} from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BarChart, LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

// Types de période pour les statistiques
type StatsPeriod = '7d' | '30d' | '90d' | 'all';

export default function TodoStatisticsScreen() {
  const { isDarkMode } = useAppContext();
  const { todos } = useTodoContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const [selectedPeriod, setSelectedPeriod] = useState<StatsPeriod>('30d');
  const [selectedChart, setSelectedChart] = useState<'completion' | 'priorities' | 'streak'>('completion');

  // Filtrer les tâches selon la période sélectionnée
  const filteredTodos = useMemo(() => {
    const now = new Date();
    let cutoffDate: Date;

    switch (selectedPeriod) {
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
        cutoffDate = new Date(0); // Début du temps Unix
        break;
    }

    return todos.filter(todo => {
      const todoDate = todo.createdAt;
      return todoDate >= cutoffDate;
    });
  }, [todos, selectedPeriod]);

  // Calcul des statistiques
  const stats = useMemo(() => {
    // Statistiques de base
    const completedTodos = filteredTodos.filter(todo => todo.completed);
    const overdueTodos = filteredTodos.filter(
      todo => !todo.completed && todo.dueDate && todo.dueDate < new Date()
    );
    
    // Répartition par priorité
    const priorityCounts = {
      high: filteredTodos.filter(todo => todo.priority === 'high').length,
      medium: filteredTodos.filter(todo => todo.priority === 'medium').length,
      low: filteredTodos.filter(todo => todo.priority === 'low').length,
    };
    
    const priorityCompletionRates = {
      high: (() => {
        const highTodos = filteredTodos.filter(todo => todo.priority === 'high');
        return highTodos.length > 0
          ? (highTodos.filter(todo => todo.completed).length / highTodos.length) * 100
          : 0;
      })(),
      medium: (() => {
        const mediumTodos = filteredTodos.filter(todo => todo.priority === 'medium');
        return mediumTodos.length > 0
          ? (mediumTodos.filter(todo => todo.completed).length / mediumTodos.length) * 100
          : 0;
      })(),
      low: (() => {
        const lowTodos = filteredTodos.filter(todo => todo.priority === 'low');
        return lowTodos.length > 0
          ? (lowTodos.filter(todo => todo.completed).length / lowTodos.length) * 100
          : 0;
      })(),
    };
    
    // Calcul du temps moyen de complétion
    const completionTimes = completedTodos
      .filter(todo => todo.completedAt && todo.createdAt)
      .map(todo => {
        const created = new Date(todo.createdAt);
        const completed = new Date(todo.completedAt!);
        return differenceInDays(completed, created);
      });
    
    const avgCompletionTime = completionTimes.length > 0
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
      : 0;
    
    // Calcul des séries de complétion
    const completedByDay = new Map<string, number>();
    const now = new Date();
    const daysToCheck = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
    
    for (let i = 0; i < daysToCheck; i++) {
      const date = subDays(now, i);
      const dateKey = format(date, 'yyyy-MM-dd');
      completedByDay.set(dateKey, 0);
    }
    
    completedTodos.forEach(todo => {
      if (todo.completedAt) {
        const completedDate = new Date(todo.completedAt);
        if (completedDate >= subDays(now, daysToCheck)) {
          const dateKey = format(completedDate, 'yyyy-MM-dd');
          completedByDay.set(dateKey, (completedByDay.get(dateKey) || 0) + 1);
        }
      }
    });
    
    // Calcul de la plus longue série
    let currentStreak = 0;
    let maxStreak = 0;
    
    // On vérifie si aujourd'hui a des tâches complétées
    const todayKey = format(now, 'yyyy-MM-dd');
    if (completedByDay.get(todayKey) && completedByDay.get(todayKey)! > 0) {
      currentStreak = 1;
      
      // On remonte dans le temps pour vérifier la série
      for (let i = 1; i < daysToCheck; i++) {
        const date = subDays(now, i);
        const dateKey = format(date, 'yyyy-MM-dd');
        
        if (completedByDay.get(dateKey) && completedByDay.get(dateKey)! > 0) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
    
    // Recherche de la meilleure série
    for (let startDay = 0; startDay < daysToCheck; startDay++) {
      let streakCount = 0;
      
      for (let i = startDay; i < daysToCheck; i++) {
        const date = subDays(now, i);
        const dateKey = format(date, 'yyyy-MM-dd');
        
        if (completedByDay.get(dateKey) && completedByDay.get(dateKey)! > 0) {
          streakCount++;
        } else {
          break;
        }
      }
      
      if (streakCount > maxStreak) {
        maxStreak = streakCount;
      }
    }
    
    // Données pour les graphiques
    const weeklyCompletionData = Array.from(completedByDay.entries())
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .slice(-7)
      .map(([date, count]) => ({
        date: format(new Date(date), 'E', { locale: fr }),
        count,
      }));
    
    return {
      total: filteredTodos.length,
      completed: completedTodos.length,
      overdue: overdueTodos.length,
      completionRate: filteredTodos.length > 0
        ? (completedTodos.length / filteredTodos.length) * 100
        : 0,
      priorityCounts,
      priorityCompletionRates,
      avgCompletionTime,
      currentStreak,
      maxStreak,
      weeklyCompletionData,
    };
  }, [filteredTodos, selectedPeriod]);

  // Configuration des graphiques
  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    color: (opacity = 1) => `rgba(${isDarkMode ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${isDarkMode ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    barPercentage: 0.6,
    propsForLabels: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
    },
  };

  // Données pour le graphique de complétion hebdomadaire
  const completionData = {
    labels: stats.weeklyCompletionData.map(item => item.date),
    datasets: [
      {
        data: stats.weeklyCompletionData.map(item => item.count),
        color: (opacity = 1) => colors.accent[500],
        strokeWidth: 2,
      },
    ],
    legend: ['Tâches complétées'],
  };

  // Données pour le graphique de répartition des priorités
  const priorityData = {
    labels: ['Haute', 'Moyenne', 'Basse'],
    datasets: [
      {
        data: [
          stats.priorityCounts.high,
          stats.priorityCounts.medium,
          stats.priorityCounts.low,
        ],
        colors: [
          colors.error[500],
          colors.warning[500],
          colors.success[500],
        ],
      },
    ],
  };

  const renderCompletionChart = () => (
    <Animated.View
      entering={FadeInDown.delay(100)}
      style={[styles.chartCard, { backgroundColor: colors.cardBackground }]}
    >
      <Text style={[styles.chartTitle, { color: colors.text }]}>
        Tâches complétées (7 derniers jours)
      </Text>
      <BarChart
        data={completionData}
        width={width - 64}
        height={220}
        yAxisLabel=""
        yAxisSuffix=" tâches"
        chartConfig={{
          ...chartConfig,
          color: (opacity = 1) => colors.accent[500],
        }}
        style={styles.chart}
        withInnerLines={true}
      />
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.accent[500] }]}>
            {Math.round(stats.completionRate)}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.neutral[500] }]}>
            Taux de complétion
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.accent[500] }]}>
            {Math.round(stats.avgCompletionTime)} jours
          </Text>
          <Text style={[styles.statLabel, { color: colors.neutral[500] }]}>
            Temps moyen
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderPrioritiesChart = () => (
    <Animated.View
      entering={FadeInDown.delay(100)}
      style={[styles.chartCard, { backgroundColor: colors.cardBackground }]}
    >
      <Text style={[styles.chartTitle, { color: colors.text }]}>
        Répartition des priorités
      </Text>
      <View style={styles.priorityChartContainer}>
        {['high', 'medium', 'low'].map((priority, index) => (
          <View key={priority} style={styles.priorityBar}>
            <Text 
              style={[
                styles.priorityLabel, 
                { 
                  color: priority === 'high' 
                    ? colors.error[500] 
                    : priority === 'medium' 
                      ? colors.warning[500] 
                      : colors.success[500] 
                }
              ]}
            >
              {priority === 'high' ? 'Haute' : priority === 'medium' ? 'Moyenne' : 'Basse'}
            </Text>
            <View 
              style={[
                styles.priorityBarContainer, 
                { backgroundColor: colors.neutral[200] }
              ]}
            >
              <View 
                style={[
                  styles.priorityBarFill, 
                  { 
                    width: `${stats.priorityCompletionRates[priority as keyof typeof stats.priorityCompletionRates]}%`,
                    backgroundColor: priority === 'high' 
                      ? colors.error[500] 
                      : priority === 'medium' 
                        ? colors.warning[500] 
                        : colors.success[500] 
                  }
                ]}
              />
            </View>
            <Text style={[styles.priorityValue, { color: colors.text }]}>
              {Math.round(stats.priorityCompletionRates[priority as keyof typeof stats.priorityCompletionRates])}%
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.priorityLegend}>
        <Text style={[styles.priorityLegendText, { color: colors.neutral[500] }]}>
          Pourcentage de tâches complétées par niveau de priorité
        </Text>
      </View>
    </Animated.View>
  );

  const renderStreakChart = () => (
    <Animated.View
      entering={FadeInDown.delay(100)}
      style={[styles.chartCard, { backgroundColor: colors.cardBackground }]}
    >
      <Text style={[styles.chartTitle, { color: colors.text }]}>
        Séries de productivité
      </Text>
      <View style={styles.streakContainer}>
        <View style={styles.streakCard}>
          <View 
            style={[
              styles.streakIconContainer, 
              { backgroundColor: colors.accent[100] }
            ]}
          >
            <Award size={30} color={colors.accent[500]} />
          </View>
          <Text style={[styles.streakValue, { color: colors.text }]}>
            {stats.currentStreak} jours
          </Text>
          <Text style={[styles.streakLabel, { color: colors.neutral[500] }]}>
            Série actuelle
          </Text>
        </View>
        <View style={styles.streakCard}>
          <View 
            style={[
              styles.streakIconContainer, 
              { backgroundColor: colors.success[100] }
            ]}
          >
            <Flag size={30} color={colors.success[500]} />
          </View>
          <Text style={[styles.streakValue, { color: colors.text }]}>
            {stats.maxStreak} jours
          </Text>
          <Text style={[styles.streakLabel, { color: colors.neutral[500] }]}>
            Record
          </Text>
        </View>
      </View>
      <View style={styles.streakInfo}>
        <Text style={[styles.streakInfoText, { color: colors.text }]}>
          {stats.currentStreak > 0 
            ? `Vous avez complété des tâches ${stats.currentStreak} jours d'affilée. Continuez comme ça !` 
            : "Complétez des tâches aujourd'hui pour commencer une série !"}
        </Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={
          isDarkMode
            ? [colors.background, colors.accent[50]]
            : [colors.accent[50], colors.background]
        }
        locations={[0, 0.3]}
        style={StyleSheet.absoluteFill}
      />

      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <BarChart2 size={28} color={colors.accent[500]} />
          <View style={styles.titleTextContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              Statistiques
            </Text>
            <Text style={[styles.subtitle, { color: colors.neutral[500] }]}>
              Analyse de votre productivité
            </Text>
          </View>
        </View>
      </View>

      {/* Filtres de période */}
      <View style={styles.periodFilter}>
        {(['7d', '30d', '90d', 'all'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && { 
                backgroundColor: colors.accent[500],
              },
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text
              style={[
                styles.periodButtonText,
                {
                  color: selectedPeriod === period ? '#fff' : colors.text,
                },
              ]}
            >
              {period === '7d'
                ? '7 jours'
                : period === '30d'
                ? '30 jours'
                : period === '90d'
                ? '3 mois'
                : 'Tout'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sélecteur de graphique */}
      <View style={styles.chartSelector}>
        <TouchableOpacity
          style={[
            styles.chartButton,
            selectedChart === 'completion' && { 
              backgroundColor: colors.accent[100],
              borderColor: colors.accent[300],
            },
            selectedChart !== 'completion' && { 
              borderColor: colors.neutral[300],
            },
          ]}
          onPress={() => setSelectedChart('completion')}
        >
          <CheckSquare 
            size={16} 
            color={selectedChart === 'completion' ? colors.accent[500] : colors.neutral[500]} 
          />
          <Text
            style={[
              styles.chartButtonText,
              {
                color: selectedChart === 'completion' ? colors.accent[500] : colors.neutral[500],
              },
            ]}
          >
            Complétion
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chartButton,
            selectedChart === 'priorities' && { 
              backgroundColor: colors.accent[100],
              borderColor: colors.accent[300],
            },
            selectedChart !== 'priorities' && { 
              borderColor: colors.neutral[300],
            },
          ]}
          onPress={() => setSelectedChart('priorities')}
        >
          <Filter 
            size={16} 
            color={selectedChart === 'priorities' ? colors.accent[500] : colors.neutral[500]} 
          />
          <Text
            style={[
              styles.chartButtonText,
              {
                color: selectedChart === 'priorities' ? colors.accent[500] : colors.neutral[500],
              },
            ]}
          >
            Priorités
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chartButton,
            selectedChart === 'streak' && { 
              backgroundColor: colors.accent[100],
              borderColor: colors.accent[300],
            },
            selectedChart !== 'streak' && { 
              borderColor: colors.neutral[300],
            },
          ]}
          onPress={() => setSelectedChart('streak')}
        >
          <Award 
            size={16} 
            color={selectedChart === 'streak' ? colors.accent[500] : colors.neutral[500]} 
          />
          <Text
            style={[
              styles.chartButtonText,
              {
                color: selectedChart === 'streak' ? colors.accent[500] : colors.neutral[500],
              },
            ]}
          >
            Séries
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Statistiques générales */}
        <View style={styles.statsCards}>
          <View
            style={[styles.statsCard, { backgroundColor: colors.cardBackground }]}
          >
            <View style={styles.statsCardContent}>
              <Text style={[styles.statsValue, { color: colors.accent[500] }]}>
                {stats.total}
              </Text>
              <Text style={[styles.statsLabel, { color: colors.neutral[500] }]}>
                Tâches totales
              </Text>
            </View>
          </View>

          <View
            style={[styles.statsCard, { backgroundColor: colors.cardBackground }]}
          >
            <View style={styles.statsCardContent}>
              <Text style={[styles.statsValue, { color: colors.success[500] }]}>
                {stats.completed}
              </Text>
              <Text style={[styles.statsLabel, { color: colors.neutral[500] }]}>
                Complétées
              </Text>
            </View>
          </View>

          <View
            style={[styles.statsCard, { backgroundColor: colors.cardBackground }]}
          >
            <View style={styles.statsCardContent}>
              <Text style={[stats.overdue > 0 ? styles.statsValueAlert : styles.statsValue, { color: stats.overdue > 0 ? colors.error[500] : colors.neutral[500] }]}>
                {stats.overdue}
              </Text>
              <Text style={[styles.statsLabel, { color: colors.neutral[500] }]}>
                En retard
              </Text>
            </View>
          </View>
        </View>

        {/* Graphique de complétion */}
        {selectedChart === 'completion' && renderCompletionChart()}

        {/* Graphique de priorités */}
        {selectedChart === 'priorities' && renderPrioritiesChart()}

        {/* Graphique de séries */}
        {selectedChart === 'streak' && renderStreakChart()}

        {/* Aucune donnée */}
        {stats.total === 0 && (
          <Animated.View
            entering={FadeInDown}
            style={[
              styles.emptyState,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <CheckSquare size={48} color={colors.neutral[400]} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Aucune donnée disponible
            </Text>
            <Text style={[styles.emptyText, { color: colors.neutral[500] }]}>
              Créez et complétez des tâches pour voir apparaître des statistiques
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
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
  periodFilter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  periodButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  periodButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  chartSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  chartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  chartButtonText: {
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
  statsCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statsCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statsCardContent: {
    alignItems: 'center',
  },
  statsValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  statsValueAlert: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  statsLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  chartCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
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
  emptyState: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
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
  },
  priorityChartContainer: {
    marginVertical: 16,
  },
  priorityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  priorityLabel: {
    width: 70,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  priorityBarContainer: {
    flex: 1,
    height: 14,
    borderRadius: 7,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
priorityBarFill: {
    height: '100%',
    borderRadius: 7,
  },
  priorityValue: {
    width: 40,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'right',
  },
  priorityLegend: {
    marginTop: 8,
    alignItems: 'center',
  },
  priorityLegendText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  streakCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    margin: 4,
  },
  streakIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  streakValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  streakLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  streakInfo: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  streakInfoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});