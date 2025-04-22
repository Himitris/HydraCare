import React from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar } from 'react-native';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';
import DailyHistoryChart from '@/components/DailyHistoryChart';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart, Clock, Target } from 'lucide-react-native';
import { useTranslation } from '@/i18n/hooks/useTranslation';

export default function HistoryScreen() {
  const { history, settings, dailyProgress, isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const { t } = useTranslation();

  // Calculate statistics
  const calculateStats = () => {
    const today = new Date();
    const last7Days: { date: Date; amount: number }[] = [];
    const last30Days: { date: Date; amount: number }[] = [];

    // Generate data for last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateKey = `${date.getFullYear()}-${
        date.getMonth() + 1
      }-${date.getDate()}`;

      const dayIntake = history[dateKey] || [];
      const totalAmount = dayIntake.reduce((sum, item) => sum + item.amount, 0);

      last30Days.push({ date, amount: totalAmount });

      if (i < 7) {
        last7Days.push({ date, amount: totalAmount });
      }
    }

    // Calculate averages
    const weeklyAverage =
      last7Days.reduce((sum, day) => sum + day.amount, 0) / 7;
    const monthlyAverage =
      last30Days.reduce((sum, day) => sum + day.amount, 0) / 30;

    // Calculate streak
    let currentStreak = 0;
    for (let i = 0; i < last30Days.length; i++) {
      if (last30Days[i].amount >= settings.dailyGoal) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate days goal met
    const daysGoalMet = last30Days.filter(
      (day) => day.amount >= settings.dailyGoal
    ).length;

    return {
      weeklyAverage,
      monthlyAverage,
      currentStreak,
      daysGoalMet,
      totalDays: 30,
    };
  };

  const stats = calculateStats();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Gradient background */}
      <LinearGradient
        colors={
          isDarkMode
            ? [colors.background, colors.primary[50]]
            : [colors.primary[50], colors.background]
        }
        locations={[0, 0.3]}
        style={styles.gradient}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('history.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.neutral[500] }]}>
            {t('history.subtitle')}
          </Text>
        </View>

        {/* Stats cards */}
        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.primary[100] },
              ]}
            >
              <BarChart size={24} color={colors.primary[500]} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {Math.round(stats.weeklyAverage)}ml
            </Text>
            <Text style={[styles.statLabel, { color: colors.neutral[500] }]}>
              {t('history.weeklyAverage')}
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.success[100] },
              ]}
            >
              <Target size={24} color={colors.success[500]} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats.daysGoalMet}/{stats.totalDays}
            </Text>
            <Text style={[styles.statLabel, { color: colors.neutral[500] }]}>
              {t('history.goalsMetTitle')}
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.warning[100] },
              ]}
            >
              <Clock size={24} color={colors.warning[500]} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats.currentStreak}
            </Text>
            <Text style={[styles.statLabel, { color: colors.neutral[500] }]}>
              {t('history.dayStreak')}
            </Text>
          </View>
        </View>

        {/* Enhanced chart */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <DailyHistoryChart />
        </View>

        {/* Monthly insights */}
        <View
          style={[
            styles.insightsCard,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          <Text style={[styles.insightsTitle, { color: colors.text }]}>
            {t('history.monthlyInsights')}
          </Text>
          <View style={styles.insightItem}>
            <Text style={[styles.insightLabel, { color: colors.neutral[600] }]}>
              {t('history.averageDailyIntake')}
            </Text>
            <Text style={[styles.insightValue, { color: colors.primary[500] }]}>
              {Math.round(stats.monthlyAverage)}ml
            </Text>
          </View>
          <View style={styles.insightItem}>
            <Text style={[styles.insightLabel, { color: colors.neutral[600] }]}>
              {t('history.goalAchievementRate')}
            </Text>
            <Text style={[styles.insightValue, { color: colors.success[500] }]}>
              {Math.round((stats.daysGoalMet / stats.totalDays) * 100)}%
            </Text>
          </View>
          <View style={styles.insightItem}>
            <Text style={[styles.insightLabel, { color: colors.neutral[600] }]}>
              {t('history.bestStreak')}
            </Text>
            <Text style={[styles.insightValue, { color: colors.warning[500] }]}>
              {stats.currentStreak} {t('history.days')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 200,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginTop: 40,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    margin: 6,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  insightsCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  insightsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  insightLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  insightValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});
