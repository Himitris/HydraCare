// app/(apps)/todo/calendar.tsx
import Colors from '@/constants/Colors';
import { useAppContext } from '@/context/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isToday,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import {
  Calendar as CalendarIcon,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const STORAGE_KEY = '@hydracare/todo_tasks';

// Calcul des dimensions des cellules du calendrier
const AVAILABLE_WIDTH = width - 48; // Réduction des marges pour s'adapter
const CELL_SIZE = AVAILABLE_WIDTH / 7; // 7 colonnes (lun-dim)
const CELL_MARGIN = 1;
const ACTUAL_CELL_SIZE = CELL_SIZE - CELL_MARGIN * 2;

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

export default function TodoCalendarScreen() {
  const { isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  // État qui contrôle l'animation des cellules
  const [isFirstRender, setIsFirstRender] = useState(true);
  const monthAnimValue = useSharedValue(1);

  // Load tasks from storage
  useEffect(() => {
    loadTasks();
  }, []);

  // Effect to detect first render
  useEffect(() => {
    if (isFirstRender) {
      // After first render completes
      setTimeout(() => {
        setIsFirstRender(false);
      }, 1000);
    }
  }, [isFirstRender]);

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

  // Animation when changing months
  const changeMonth = (delta: number) => {
    // Reset to first render state to enable animations for new month
    setIsFirstRender(true);

    // Start animation - scale down
    monthAnimValue.value = withSequence(
      withTiming(0.9, { duration: 150 }),
      withTiming(1, { duration: 150 })
    );

    // Update month while animating
    setTimeout(() => {
      if (delta > 0) {
        setCurrentMonth(addMonths(currentMonth, 1));
      } else {
        setCurrentMonth(subMonths(currentMonth, 1));
      }

      // After month changes, set first render to false after animations complete
      setTimeout(() => {
        setIsFirstRender(false);
      }, 800);
    }, 100);
  };

  // Generate calendar data with memoization
  const calendarData = useMemo(() => {
    // Get all days in current month
    const firstDay = startOfMonth(currentMonth);
    const lastDay = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: firstDay, end: lastDay });

    // Calculate first day of week (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = getDay(firstDay);

    // Adjust for Monday as first day of week (European calendar)
    const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    // Create calendar grid with null for empty cells
    const calendar: any[] = [];
    let week = Array(7).fill(null);

    // Add empty days at start
    for (let i = 0; i < adjustedFirstDay; i++) {
      week[i] = null;
    }

    // Fill with actual days
    daysInMonth.forEach((day, index) => {
      const dayOfWeek = getDay(day);
      // Convert to 0 = Monday, ..., 6 = Sunday
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      week[adjustedDay] = day;

      // End of week or month
      if (adjustedDay === 6 || index === daysInMonth.length - 1) {
        calendar.push([...week]);
        week = Array(7).fill(null);
      }
    });

    return calendar;
  }, [currentMonth]);

  // Get tasks for a date
  const getTasksForDate = (date: Date | null) => {
    if (!date) return [];
    return tasks.filter((task) => {
      if (task.dueDate && isSameDay(task.dueDate, date)) return true;
      if (task.completedAt && isSameDay(task.completedAt, date)) return true;
      return false;
    });
  };

  // Get color intensity based on number of tasks and priorities
  const getTaskIntensity = (
    date: Date | null
  ): { color: string; level: number } => {
    if (!date) return { color: 'transparent', level: -1 };

    const dateTasks = getTasksForDate(date);
    if (dateTasks.length === 0) return { color: colors.neutral[200], level: 0 };

    // Check priorities
    const highPriority = dateTasks.some((task) => task.priority === 'high');
    const mediumPriority = dateTasks.some((task) => task.priority === 'medium');
    const lowPriority = dateTasks.some(
      (task) => task.priority === 'low' && !highPriority && !mediumPriority
    );

    // Calculate completion percentage
    const completedCount = dateTasks.filter((task) => task.completed).length;
    const completionRate =
      dateTasks.length > 0 ? completedCount / dateTasks.length : 0;

    // Determine color based on priority and completion
    if (completionRate === 1) {
      return { color: colors.success[500], level: 4 }; // All completed
    } else if (highPriority) {
      return { color: colors.error[500], level: 1 }; // High priority tasks
    } else if (mediumPriority) {
      return { color: colors.warning[500], level: 2 }; // Medium priority tasks
    } else if (lowPriority) {
      return { color: colors.accent[500], level: 3 }; // Low priority tasks
    } else {
      return { color: colors.neutral[400], level: 0 }; // Default
    }
  };

  // Render animated cell that fades in with sequence
  const AnimatedCell = ({
    date,
    index,
    weekIndex,
  }: {
    date: Date | null;
    index: number;
    weekIndex: number;
  }) => {
    const cellOpacity = useSharedValue(0);
    const { color, level } = getTaskIntensity(date);
    const tasksCount = date ? getTasksForDate(date).length : 0;

    // Only run animation on first render or month change, not on date selection
    React.useEffect(() => {
      // Only animate if it's the first render or month change
      if (isFirstRender) {
        // Stagger animation based on position
        const delay = (weekIndex * 7 + index) * 30;
        cellOpacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
      } else {
        // Immediately set to visible without animation for date selection
        cellOpacity.value = 1;
      }
    }, [currentMonth, isFirstRender, index, weekIndex]);

    // If not first render, ensure cells are fully visible
    React.useEffect(() => {
      if (!isFirstRender) {
        cellOpacity.value = 1;
      }
    }, [isFirstRender, cellOpacity]);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: cellOpacity.value,
    }));

    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          style={[
            styles.dayCell,
            date && level > 0 && { backgroundColor: color + '40' }, // Ajout de transparence pour l'effet
            date &&
              isToday(date) && {
                borderWidth: 2,
                borderColor: colors.accent[500],
              },
            date &&
              isSameDay(date, selectedDate) && {
                backgroundColor: colors.accent[100],
              },
          ]}
          onPress={() => date && setSelectedDate(date)}
          disabled={!date}
        >
          <Text
            style={[
              styles.dayText,
              { color: colors.text },
              date &&
                isToday(date) && {
                  fontFamily: 'Inter-Bold',
                  color: colors.accent[600],
                },
              date &&
                isSameDay(date, selectedDate) && {
                  fontFamily: 'Inter-SemiBold',
                  color: colors.accent[600],
                },
            ]}
          >
            {date ? format(date, 'd') : ''}
          </Text>

          {tasksCount > 0 && (
            <View style={[styles.taskIndicator, { backgroundColor: color }]}>
              <Text style={styles.taskCount}>{tasksCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Weekday headers
  const weekdayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  // Priority color helper
  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return colors.error[500];
      case 'medium':
        return colors.warning[500];
      case 'low':
        return colors.success[500];
    }
  };

  // Legend component for task indicators
  const Legend = () => (
    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <View
          style={[styles.legendDot, { backgroundColor: colors.error[500] }]}
        />
        <Text style={[styles.legendText, { color: colors.neutral[600] }]}>
          Priorité haute
        </Text>
      </View>
      <View style={styles.legendItem}>
        <View
          style={[styles.legendDot, { backgroundColor: colors.warning[500] }]}
        />
        <Text style={[styles.legendText, { color: colors.neutral[600] }]}>
          Priorité moyenne
        </Text>
      </View>
      <View style={styles.legendItem}>
        <View
          style={[styles.legendDot, { backgroundColor: colors.accent[500] }]}
        />
        <Text style={[styles.legendText, { color: colors.neutral[600] }]}>
          Priorité basse
        </Text>
      </View>
      <View style={styles.legendItem}>
        <View
          style={[styles.legendDot, { backgroundColor: colors.success[500] }]}
        />
        <Text style={[styles.legendText, { color: colors.neutral[600] }]}>
          Terminées
        </Text>
      </View>
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
            <CalendarIcon size={32} color={colors.accent[500]} />
            <View style={styles.titleTextContainer}>
              <Text style={[styles.title, { color: colors.text }]}>
                Calendrier
              </Text>
              <Text style={[styles.subtitle, { color: colors.neutral[500] }]}>
                Vue mensuelle des tâches
              </Text>
            </View>
          </View>
        </View>

        {/* Calendar Navigation */}
        <View style={styles.calendarNav}>
          <TouchableOpacity
            onPress={() => changeMonth(-1)}
            style={styles.navButton}
          >
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: colors.text }]}>
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </Text>
          <TouchableOpacity
            onPress={() => changeMonth(1)}
            style={styles.navButton}
          >
            <ChevronRight size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Improved Calendar with Heatmap-style rendering */}
        <View
          style={[
            styles.calendarContainer,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          {/* Weekday headers */}
          <View style={styles.weekdayHeader}>
            {weekdayLabels.map((day, index) => (
              <View key={index} style={styles.weekdayCell}>
                <Text
                  style={[styles.weekdayText, { color: colors.neutral[500] }]}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <Animated.View style={[styles.calendarGrid]}>
            {calendarData.map((week, weekIndex) => (
              <View key={`week-${weekIndex}`} style={styles.calendarRow}>
                {week.map((day: Date | null, dayIndex: number) => (
                  <AnimatedCell
                    key={`day-${weekIndex}-${dayIndex}`}
                    date={day}
                    index={dayIndex}
                    weekIndex={weekIndex}
                  />
                ))}
              </View>
            ))}
          </Animated.View>
        </View>

        {/* Legend */}
        <Legend />

        {/* Monthly Stats */}
        <View
          style={[styles.statsCard, { backgroundColor: colors.cardBackground }]}
        >
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.accent[500] }]}>
                {
                  tasks.filter(
                    (t) =>
                      t.dueDate &&
                      t.dueDate.getMonth() === currentMonth.getMonth() &&
                      t.dueDate.getFullYear() === currentMonth.getFullYear()
                  ).length
                }
              </Text>
              <Text style={[styles.statLabel, { color: colors.neutral[500] }]}>
                Tâches du mois
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success[500] }]}>
                {
                  tasks.filter(
                    (t) =>
                      t.completedAt &&
                      t.completedAt.getMonth() === currentMonth.getMonth() &&
                      t.completedAt.getFullYear() === currentMonth.getFullYear()
                  ).length
                }
              </Text>
              <Text style={[styles.statLabel, { color: colors.neutral[500] }]}>
                Terminées
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.error[500] }]}>
                {
                  tasks.filter(
                    (t) =>
                      !t.completed &&
                      t.dueDate &&
                      t.dueDate.getMonth() === currentMonth.getMonth() &&
                      t.dueDate.getFullYear() === currentMonth.getFullYear() &&
                      t.dueDate < new Date()
                  ).length
                }
              </Text>
              <Text style={[styles.statLabel, { color: colors.neutral[500] }]}>
                En retard
              </Text>
            </View>
          </View>
        </View>

        {/* Selected Date Tasks */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.dateHeader, { color: colors.text }]}>
            {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
          </Text>

          {getTasksForDate(selectedDate).length === 0 ? (
            <Animated.View
              entering={FadeInDown}
              style={[
                styles.emptyState,
                { backgroundColor: colors.cardBackground },
              ]}
            >
              <Text style={[styles.emptyText, { color: colors.neutral[500] }]}>
                Aucune tâche pour cette date
              </Text>
            </Animated.View>
          ) : (
            getTasksForDate(selectedDate).map((task, index) => (
              <Animated.View
                key={task.id}
                entering={FadeInDown.delay(index * 100)}
              >
                <TouchableOpacity
                  style={[
                    styles.taskCard,
                    { backgroundColor: colors.cardBackground },
                    task.completed && styles.completedTaskCard,
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={styles.taskHeader}>
                    <View style={styles.checkbox}>
                      {task.completed ? (
                        <CheckSquare size={24} color={colors.accent[500]} />
                      ) : (
                        <View
                          style={[
                            styles.uncheckedBox,
                            { borderColor: colors.neutral[400] },
                          ]}
                        />
                      )}
                    </View>
                    <View style={styles.taskInfo}>
                      <Text
                        style={[
                          styles.taskTitle,
                          { color: colors.text },
                          task.completed && styles.completedTaskTitle,
                        ]}
                      >
                        {task.title}
                      </Text>
                      {task.description && (
                        <Text
                          style={[
                            styles.taskDescription,
                            { color: colors.neutral[500] },
                            task.completed && styles.completedTaskDescription,
                          ]}
                          numberOfLines={2}
                        >
                          {task.description}
                        </Text>
                      )}
                      <View
                        style={[
                          styles.priorityBadge,
                          {
                            backgroundColor:
                              getPriorityColor(task.priority) + '20',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.priorityText,
                            { color: getPriorityColor(task.priority) },
                          ]}
                        >
                          {task.priority === 'high'
                            ? 'Haute'
                            : task.priority === 'medium'
                            ? 'Moyenne'
                            : 'Basse'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
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
  calendarNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'capitalize',
  },
  calendarContainer: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  calendarGrid: {
    marginBottom: 8,
  },
  calendarRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    width: CELL_SIZE,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  dayCell: {
    width: ACTUAL_CELL_SIZE,
    height: ACTUAL_CELL_SIZE,
    margin: CELL_MARGIN,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  taskIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCount: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  statsCard: {
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    width: '45%',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
  },
  dateHeader: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  emptyState: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  taskCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  completedTaskCard: {
    opacity: 0.7,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
  },
  uncheckedBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  taskDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  completedTaskDescription: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
});
