// app/(apps)/todo/tags.tsx
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Tag,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, subDays, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';

const { width } = Dimensions.get('window');
const STORAGE_KEY = '@hydracare/todo_tasks';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
}

export default function TodoTagsScreen() {
  const { isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const [tasks, setTasks] = useState<Task[]>([]);

  // Load tasks from storage
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const savedTasks = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks).map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          completedAt: task.completedAt
            ? new Date(task.completedAt)
            : undefined,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        }));
        setTasks(parsedTasks);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  // Calculate statistics
  const getStats = () => {
    const completedTasks = tasks.filter((task) => task.completed);
    const activeTasks = tasks.filter((task) => !task.completed);
    const overdueTasks = activeTasks.filter(
      (task) => task.dueDate && task.dueDate < new Date()
    );

    // Calculate productivity (tasks completed in the last 7 days)
    const sevenDaysAgo = subDays(new Date(), 7);
    const recentlyCompleted = completedTasks.filter(
      (task) => task.completedAt && isAfter(task.completedAt, sevenDaysAgo)
    );

    // Priority breakdown
    const priorityBreakdown = {
      high: tasks.filter((task) => task.priority === 'high').length,
      medium: tasks.filter((task) => task.priority === 'medium').length,
      low: tasks.filter((task) => task.priority === 'low').length,
    };

    return {
      total: tasks.length,
      completed: completedTasks.length,
      active: activeTasks.length,
      overdue: overdueTasks.length,
      recentlyCompleted: recentlyCompleted.length,
      completionRate:
        tasks.length > 0
          ? Math.round((completedTasks.length / tasks.length) * 100)
          : 0,
      priorityBreakdown,
    };
  };

  const stats = getStats();

  const StatCard = ({
    icon: Icon,
    iconColor,
    title,
    value,
    subtitle,
  }: {
    icon: any;
    iconColor: string;
    title: string;
    value: number;
    subtitle?: string;
  }) => (
    <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
      <View
        style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}
      >
        <Icon size={24} color={iconColor} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: colors.neutral[500] }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.statSubtitle, { color: colors.neutral[400] }]}>
          {subtitle}
        </Text>
      )}
    </View>
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

      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Tag size={32} color={colors.accent[500]} />
            <View style={styles.titleTextContainer}>
              <Text style={[styles.title, { color: colors.text }]}>
                Vue d'ensemble
              </Text>
              <Text style={[styles.subtitle, { color: colors.neutral[500] }]}>
                Statistiques et catégories
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <StatCard
              icon={CheckCircle}
              iconColor={colors.success[500]}
              title="Complétées"
              value={stats.completed}
              subtitle={`${stats.completionRate}% du total`}
            />
            <StatCard
              icon={Clock}
              iconColor={colors.warning[500]}
              title="En cours"
              value={stats.active}
            />
            <StatCard
              icon={AlertCircle}
              iconColor={colors.error[500]}
              title="En retard"
              value={stats.overdue}
            />
            <StatCard
              icon={TrendingUp}
              iconColor={colors.accent[500]}
              title="Cette semaine"
              value={stats.recentlyCompleted}
              subtitle="tâches terminées"
            />
          </View>

          {/* Priority Distribution */}
          <View
            style={[styles.section, { backgroundColor: colors.cardBackground }]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Répartition par priorité
            </Text>
            <View style={styles.priorityContainer}>
              {Object.entries(stats.priorityBreakdown).map(
                ([priority, count]) => (
                  <View key={priority} style={styles.priorityItem}>
                    <View style={styles.priorityHeader}>
                      <View
                        style={[
                          styles.priorityDot,
                          {
                            backgroundColor:
                              priority === 'high'
                                ? colors.error[500]
                                : priority === 'medium'
                                ? colors.warning[500]
                                : colors.success[500],
                          },
                        ]}
                      />
                      <Text
                        style={[styles.priorityLabel, { color: colors.text }]}
                      >
                        {priority === 'high'
                          ? 'Haute'
                          : priority === 'medium'
                          ? 'Moyenne'
                          : 'Basse'}
                      </Text>
                    </View>
                    <Text
                      style={[styles.priorityValue, { color: colors.text }]}
                    >
                      {count}
                    </Text>
                  </View>
                )
              )}
            </View>
          </View>

          {/* Recent Activity */}
          <View
            style={[styles.section, { backgroundColor: colors.cardBackground }]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Activité récente
            </Text>
            {tasks
              .filter((task) => task.completedAt)
              .sort(
                (a, b) =>
                  (b.completedAt?.getTime() || 0) -
                  (a.completedAt?.getTime() || 0)
              )
              .slice(0, 5)
              .map((task, index) => (
                <Animated.View
                  key={task.id}
                  entering={FadeInDown.delay(index * 100)}
                  style={styles.activityItem}
                >
                  <CheckCircle size={20} color={colors.success[500]} />
                  <View style={styles.activityInfo}>
                    <Text
                      style={[styles.activityTitle, { color: colors.text }]}
                    >
                      {task.title}
                    </Text>
                    <Text
                      style={[
                        styles.activityDate,
                        { color: colors.neutral[500] },
                      ]}
                    >
                      {task.completedAt &&
                        format(task.completedAt, 'd MMMM à HH:mm', {
                          locale: fr,
                        })}
                    </Text>
                  </View>
                </Animated.View>
              ))}
            {tasks.filter((task) => task.completedAt).length === 0 && (
              <Text style={[styles.emptyText, { color: colors.neutral[500] }]}>
                Aucune activité récente
              </Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 20,
  },
  statCard: {
    width: (width - 56) / 2,
    margin: 8,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  statSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  priorityContainer: {
    gap: 12,
  },
  priorityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  priorityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  priorityLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  priorityValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  activityInfo: {
    marginLeft: 12,
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  activityDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginVertical: 16,
  },
});
