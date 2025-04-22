// app/(apps)/todo/calendar.tsx
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
  Calendar as CalendarIcon,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
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

export default function TodoCalendarScreen() {
  const { isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  const saveTasks = async (updatedTasks: Task[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  };

  const toggleTask = (taskId: string) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          completed: !task.completed,
          completedAt: !task.completed ? new Date() : undefined,
        };
      }
      return task;
    });

    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      if (task.dueDate && isSameDay(task.dueDate, date)) return true;
      if (task.completedAt && isSameDay(task.completedAt, date)) return true;
      return false;
    });
  };

  const navigateToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const navigateToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

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

  const days = getDaysInMonth();
  const firstDayWeekday = days[0].getDay();
  const paddingDays = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;

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
            onPress={navigateToPreviousMonth}
            style={styles.navButton}
          >
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: colors.text }]}>
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </Text>
          <TouchableOpacity
            onPress={navigateToNextMonth}
            style={styles.navButton}
          >
            <ChevronRight size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View
          style={[
            styles.calendarContainer,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          {/* Weekday headers */}
          <View style={styles.weekdayHeader}>
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(
              (day, index) => (
                <View key={index} style={styles.weekdayCell}>
                  <Text
                    style={[styles.weekdayText, { color: colors.neutral[500] }]}
                  >
                    {day}
                  </Text>
                </View>
              )
            )}
          </View>

          {/* Calendar days */}
          <View style={styles.calendarGrid}>
            {/* Empty cells for padding */}
            {Array.from({ length: paddingDays }).map((_, index) => (
              <View key={`padding-${index}`} style={styles.dayCell} />
            ))}

            {/* Actual days */}
            {days.map((date, index) => {
              const dayTasks = getTasksForDate(date);
              const isSelected = isSameDay(date, selectedDate);
              const isCurrentDay = isToday(date);

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    isSelected && { backgroundColor: colors.accent[100] },
                    isCurrentDay && styles.todayCell,
                  ]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: colors.text },
                      isSelected && { color: colors.accent[600] },
                      isCurrentDay && {
                        color: colors.accent[500],
                        fontFamily: 'Inter-Bold',
                      },
                    ]}
                  >
                    {format(date, 'd')}
                  </Text>
                  {dayTasks.length > 0 && (
                    <View style={styles.taskIndicators}>
                      {dayTasks.slice(0, 3).map((task, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.taskDot,
                            {
                              backgroundColor: getPriorityColor(task.priority),
                            },
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
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
                  onPress={() => toggleTask(task.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.taskHeader}>
                    <TouchableOpacity
                      onPress={() => toggleTask(task.id)}
                      style={styles.checkbox}
                    >
                      {task.completed ? (
                        <CheckSquare size={24} color={colors.accent[500]} />
                      ) : (
                        <Square size={24} color={colors.neutral[400]} />
                      )}
                    </TouchableOpacity>
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
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    maxHeight: height * 0.35, // Limite la hauteur à 35% de l'écran
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: (width - 72) / 7,
    height: 45,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  todayCell: {
    borderWidth: 1,
    borderColor: Colors.light.accent[500],
  },
  dayText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  taskIndicators: {
    flexDirection: 'row',
    marginTop: 4,
  },
  taskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 1,
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
