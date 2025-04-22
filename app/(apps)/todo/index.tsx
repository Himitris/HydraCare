// app/(apps)/todo/index.tsx
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeIn,
  FadeOut,
  withSpring,
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import {
  CheckSquare,
  Plus,
  Calendar,
  X,
  Square,
  Clock,
  AlertCircle,
  Trash2,
  Edit2,
  Tag as TagIcon,
  Bell,
} from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';
import {
  format,
  isBefore,
  isToday,
  isTomorrow,
  isPast,
  differenceInDays,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';

const { width, height } = Dimensions.get('window');
const STORAGE_KEY = '@hydracare/todo_tasks';
const TAGS_STORAGE_KEY = '@hydracare/todo_tags';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  tags?: string[];
  notificationId?: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function TodoScreen() {
  const { isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: undefined,
    tags: [],
  });
  const [filter, setFilter] = useState<'active' | 'completed'>('active');
  const [newTag, setNewTag] = useState({ name: '', color: '' });

  useEffect(() => {
    loadTasks();
    loadTags();
    requestNotificationPermissions();
    setupNotificationListeners();
  }, []);

  useEffect(() => {
    const checkOverdueTasks = () => {
      tasks.forEach((task) => {
        if (
          !task.completed &&
          task.dueDate &&
          isPast(task.dueDate) &&
          !isToday(task.dueDate)
        ) {
          scheduleOverdueNotification(task);
        }
      });
    };

    const interval = setInterval(checkOverdueTasks, 3600000); // Check every hour
    return () => clearInterval(interval);
  }, [tasks]);

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        'Les notifications sont nécessaires pour les rappels de tâches.'
      );
    }
  };

  const setupNotificationListeners = () => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const taskId = response.notification.request.content.data?.taskId;
        if (taskId) {
          console.log('Task notification tapped:', taskId);
        }
      }
    );

    return () => subscription.remove();
  };

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

  const loadTags = async () => {
    try {
      const savedTags = await AsyncStorage.getItem(TAGS_STORAGE_KEY);
      if (savedTags) {
        setTags(JSON.parse(savedTags));
      } else {
        const defaultTags = [
          { id: '1', name: 'Personnel', color: colors.primary[500] },
          { id: '2', name: 'Travail', color: colors.secondary[500] },
          { id: '3', name: 'Urgent', color: colors.error[500] },
        ];
        setTags(defaultTags);
        await AsyncStorage.setItem(
          TAGS_STORAGE_KEY,
          JSON.stringify(defaultTags)
        );
      }
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const saveTasks = async (updatedTasks: Task[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  };

  const saveTags = async (updatedTags: Tag[]) => {
    try {
      await AsyncStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(updatedTags));
    } catch (error) {
      console.error('Error saving tags:', error);
    }
  };

  const scheduleTaskNotification = async (task: Task) => {
    if (!task.dueDate) return null;

    const reminderDate = new Date(task.dueDate);
    reminderDate.setDate(reminderDate.getDate() - 1);

    if (reminderDate > new Date()) {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Rappel de tâche',
          body: `"${task.title}" est due demain`,
          data: { taskId: task.id },
        },
        trigger: reminderDate,
      });
      return notificationId;
    }
    return null;
  };

  const scheduleOverdueNotification = async (task: Task) => {
    if (task.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(task.notificationId);
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Tâche en retard !',
        body: `"${task.title}" est en retard de ${differenceInDays(
          new Date(),
          task.dueDate!
        )} jour(s)`,
        data: { taskId: task.id },
      },
      trigger: {
        seconds: 1,
      },
    });

    return notificationId;
  };

  const addTask = async () => {
    if (!newTask.title?.trim()) {
      Alert.alert('Erreur', 'Veuillez ajouter un titre pour votre tâche');
      return;
    }

    const notificationId = await scheduleTaskNotification(newTask as Task);

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title.trim(),
      description: newTask.description?.trim(),
      completed: false,
      createdAt: new Date(),
      priority: newTask.priority || 'medium',
      dueDate: newTask.dueDate,
      tags: newTask.tags || [],
      notificationId: notificationId || undefined,
    };

    const updatedTasks = [task, ...tasks];
    setTasks(updatedTasks);
    saveTasks(updatedTasks);

    setShowAddModal(false);
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: undefined,
      tags: [],
    });

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const updateTask = async () => {
    if (!editingTask) return;

    if (editingTask.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(
        editingTask.notificationId
      );
    }

    const notificationId = await scheduleTaskNotification(editingTask);

    const updatedTasks = tasks.map((task) => {
      if (task.id === editingTask.id) {
        return {
          ...editingTask,
          notificationId: notificationId || undefined,
        };
      }
      return task;
    });

    setTasks(updatedTasks);
    saveTasks(updatedTasks);
    setShowEditModal(false);
    setEditingTask(null);
  };

  const toggleTask = async (taskId: string) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        const updatedTask = {
          ...task,
          completed: !task.completed,
          completedAt: !task.completed ? new Date() : undefined,
        };

        if (!task.completed && task.notificationId) {
          Notifications.cancelScheduledNotificationAsync(task.notificationId);
        }

        return updatedTask;
      }
      return task;
    });

    setTasks(updatedTasks);
    saveTasks(updatedTasks);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const deleteTask = async (taskId: string) => {
    Alert.alert(
      'Supprimer la tâche',
      'Êtes-vous sûr de vouloir supprimer cette tâche ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const task = tasks.find((t) => t.id === taskId);
            if (task?.notificationId) {
              await Notifications.cancelScheduledNotificationAsync(
                task.notificationId
              );
            }

            const updatedTasks = tasks.filter((task) => task.id !== taskId);
            setTasks(updatedTasks);
            saveTasks(updatedTasks);
          },
        },
      ]
    );
  };

  const addTag = () => {
    if (!newTag.name.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour le tag');
      return;
    }

    const tag: Tag = {
      id: Date.now().toString(),
      name: newTag.name.trim(),
      color: newTag.color || colors.accent[500],
    };

    const updatedTags = [...tags, tag];
    setTags(updatedTags);
    saveTags(updatedTags);
    setNewTag({ name: '', color: '' });
    setShowTagModal(false);
  };

  const toggleTaskTag = (tagId: string) => {
    if (showAddModal) {
      const currentTags = newTask.tags || [];
      const updatedTags = currentTags.includes(tagId)
        ? currentTags.filter((id) => id !== tagId)
        : [...currentTags, tagId];
      setNewTask({ ...newTask, tags: updatedTags });
    } else if (showEditModal && editingTask) {
      const currentTags = editingTask.tags || [];
      const updatedTags = currentTags.includes(tagId)
        ? currentTags.filter((id) => id !== tagId)
        : [...currentTags, tagId];
      setEditingTask({ ...editingTask, tags: updatedTags });
    }
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

  const getDueDateText = (date?: Date) => {
    if (!date) return '';
    if (isToday(date)) return "Aujourd'hui";
    if (isTomorrow(date)) return 'Demain';
    if (isPast(date)) return 'En retard';
    return format(date, 'd MMM', { locale: fr });
  };

  const getDueDateColor = (date?: Date) => {
    if (!date) return colors.neutral[500];
    if (isPast(date) && !isToday(date)) return colors.error[500];
    if (isToday(date)) return colors.warning[500];
    return colors.neutral[500];
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      if (showAddModal) {
        setNewTask({ ...newTask, dueDate: selectedDate });
      } else if (showEditModal && editingTask) {
        setEditingTask({ ...editingTask, dueDate: selectedDate });
      }
    }
  };

  const filteredTasks = tasks.filter((task) =>
    filter === 'active' ? !task.completed : task.completed
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

        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <CheckSquare size={32} color={colors.accent[500]} />
            <View style={styles.titleTextContainer}>
              <Text style={[styles.title, { color: colors.text }]}>
                Mes Tâches
              </Text>
              <Text style={[styles.subtitle, { color: colors.neutral[500] }]}>
                {tasks.filter((t) => !t.completed).length} tâches en cours
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === 'active' && { backgroundColor: colors.accent[500] },
            ]}
            onPress={() => setFilter('active')}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === 'active' ? '#fff' : colors.text },
              ]}
            >
              En cours
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === 'completed' && { backgroundColor: colors.accent[500] },
            ]}
            onPress={() => setFilter('completed')}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === 'completed' ? '#fff' : colors.text },
              ]}
            >
              Terminées
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredTasks.length === 0 ? (
            <Animated.View
              entering={FadeInDown}
              style={[
                styles.emptyState,
                { backgroundColor: colors.cardBackground },
              ]}
            >
              <View
                style={[
                  styles.emptyIcon,
                  { backgroundColor: colors.accent[100] },
                ]}
              >
                <CheckSquare size={40} color={colors.accent[500]} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {filter === 'active'
                  ? 'Aucune tâche en cours'
                  : 'Aucune tâche terminée'}
              </Text>
              <Text style={[styles.emptyText, { color: colors.neutral[500] }]}>
                {filter === 'active'
                  ? 'Ajoutez des tâches pour commencer à organiser votre journée'
                  : 'Les tâches terminées apparaîtront ici'}
              </Text>
            </Animated.View>
          ) : (
            filteredTasks.map((task, index) => (
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
                      <View style={styles.taskMetadata}>
                        {task.dueDate && (
                          <View style={styles.metadataItem}>
                            <Clock
                              size={14}
                              color={getDueDateColor(task.dueDate)}
                            />
                            <Text
                              style={[
                                styles.metadataText,
                                { color: getDueDateColor(task.dueDate) },
                              ]}
                            >
                              {getDueDateText(task.dueDate)}
                            </Text>
                          </View>
                        )}
                        <View style={styles.metadataItem}>
                          <View
                            style={[
                              styles.priorityDot,
                              {
                                backgroundColor: getPriorityColor(
                                  task.priority
                                ),
                              },
                            ]}
                          />
                          <Text
                            style={[
                              styles.metadataText,
                              { color: colors.neutral[500] },
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
                      {task.tags && task.tags.length > 0 && (
                        <View style={styles.tagsContainer}>
                          {task.tags.map((tagId) => {
                            const tag = tags.find((t) => t.id === tagId);
                            if (!tag) return null;
                            return (
                              <View
                                key={tag.id}
                                style={[
                                  styles.tagBadge,
                                  { backgroundColor: tag.color + '20' },
                                ]}
                              >
                                <View
                                  style={[
                                    styles.tagDot,
                                    { backgroundColor: tag.color },
                                  ]}
                                />
                                <Text
                                  style={[styles.tagText, { color: tag.color }]}
                                >
                                  {tag.name}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                    <View style={styles.taskActions}>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingTask(task);
                          setShowEditModal(true);
                        }}
                        style={styles.actionButton}
                      >
                        <Edit2 size={18} color={colors.primary[500]} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => deleteTask(task.id)}
                        style={styles.actionButton}
                      >
                        <Trash2 size={18} color={colors.error[500]} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
        </ScrollView>

        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={[styles.addButton, { backgroundColor: colors.accent[500] }]}
        >
          <Plus size={28} color="#fff" />
        </TouchableOpacity>

        <Modal
          visible={showAddModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.centeredModalContainer}>
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowAddModal(false)}
            />

            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              style={[
                styles.centeredModalContent,
                { backgroundColor: colors.cardBackground },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Nouvelle tâche
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAddModal(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScroll}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Titre
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderColor: colors.neutral[300],
                      },
                    ]}
                    placeholder="Ex: Faire les courses"
                    placeholderTextColor={colors.neutral[400]}
                    value={newTask.title}
                    onChangeText={(text) =>
                      setNewTask({ ...newTask, title: text })
                    }
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Description (optionnelle)
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      styles.textArea,
                      {
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderColor: colors.neutral[300],
                      },
                    ]}
                    multiline
                    numberOfLines={3}
                    placeholder="Ajoutez des détails..."
                    placeholderTextColor={colors.neutral[400]}
                    value={newTask.description}
                    onChangeText={(text) =>
                      setNewTask({ ...newTask, description: text })
                    }
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Date limite
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.dateInput,
                      { backgroundColor: colors.background },
                    ]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Calendar size={20} color={colors.neutral[500]} />
                    <Text style={[styles.dateText, { color: colors.text }]}>
                      {newTask.dueDate
                        ? format(newTask.dueDate, 'd MMMM yyyy', { locale: fr })
                        : 'Sélectionner une date'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Priorité
                  </Text>
                  <View style={styles.priorityContainer}>
                    {(['low', 'medium', 'high'] as const).map((priority) => (
                      <TouchableOpacity
                        key={priority}
                        style={[
                          styles.priorityButton,
                          newTask.priority === priority && {
                            backgroundColor: getPriorityColor(priority) + '30',
                            borderColor: getPriorityColor(priority),
                          },
                          { borderColor: colors.neutral[200] },
                        ]}
                        onPress={() => setNewTask({ ...newTask, priority })}
                      >
                        <View
                          style={[
                            styles.priorityIndicator,
                            { backgroundColor: getPriorityColor(priority) },
                          ]}
                        />
                        <Text
                          style={[
                            styles.priorityText,
                            {
                              color:
                                newTask.priority === priority
                                  ? getPriorityColor(priority)
                                  : colors.neutral[500],
                            },
                          ]}
                        >
                          {priority === 'high'
                            ? 'Haute'
                            : priority === 'medium'
                            ? 'Moyenne'
                            : 'Basse'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Tags
                  </Text>
                  <View style={styles.tagsGrid}>
                    {tags.map((tag) => (
                      <TouchableOpacity
                        key={tag.id}
                        style={[
                          styles.tagSelectItem,
                          newTask.tags?.includes(tag.id) && {
                            backgroundColor: tag.color + '30',
                            borderColor: tag.color,
                          },
                          { borderColor: colors.neutral[200] },
                        ]}
                        onPress={() => toggleTaskTag(tag.id)}
                      >
                        <View
                          style={[
                            styles.tagDot,
                            { backgroundColor: tag.color },
                          ]}
                        />
                        <Text
                          style={[
                            styles.tagSelectText,
                            {
                              color: newTask.tags?.includes(tag.id)
                                ? tag.color
                                : colors.neutral[500],
                            },
                          ]}
                        >
                          {tag.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    { backgroundColor: colors.accent[500] },
                  ]}
                  onPress={addTask}
                >
                  <Text style={styles.saveButtonText}>Ajouter</Text>
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        <Modal
          visible={showEditModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowEditModal(false)}
        >
          <View style={styles.centeredModalContainer}>
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowEditModal(false)}
            />

            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              style={[
                styles.centeredModalContent,
                { backgroundColor: colors.cardBackground },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Modifier la tâche
                </Text>
                <TouchableOpacity
                  onPress={() => setShowEditModal(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScroll}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Titre
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderColor: colors.neutral[300],
                      },
                    ]}
                    placeholder="Ex: Faire les courses"
                    placeholderTextColor={colors.neutral[400]}
                    value={editingTask?.title}
                    onChangeText={(text) =>
                      setEditingTask((prev) =>
                        prev ? { ...prev, title: text } : null
                      )
                    }
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Description (optionnelle)
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      styles.textArea,
                      {
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderColor: colors.neutral[300],
                      },
                    ]}
                    multiline
                    numberOfLines={3}
                    placeholder="Ajoutez des détails..."
                    placeholderTextColor={colors.neutral[400]}
                    value={editingTask?.description}
                    onChangeText={(text) =>
                      setEditingTask((prev) =>
                        prev ? { ...prev, description: text } : null
                      )
                    }
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Date limite
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.dateInput,
                      { backgroundColor: colors.background },
                    ]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Calendar size={20} color={colors.neutral[500]} />
                    <Text style={[styles.dateText, { color: colors.text }]}>
                      {editingTask?.dueDate
                        ? format(editingTask.dueDate, 'd MMMM yyyy', {
                            locale: fr,
                          })
                        : 'Sélectionner une date'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Priorité
                  </Text>
                  <View style={styles.priorityContainer}>
                    {(['low', 'medium', 'high'] as const).map((priority) => (
                      <TouchableOpacity
                        key={priority}
                        style={[
                          styles.priorityButton,
                          editingTask?.priority === priority && {
                            backgroundColor: getPriorityColor(priority) + '30',
                            borderColor: getPriorityColor(priority),
                          },
                          { borderColor: colors.neutral[200] },
                        ]}
                        onPress={() =>
                          setEditingTask((prev) =>
                            prev ? { ...prev, priority } : null
                          )
                        }
                      >
                        <View
                          style={[
                            styles.priorityIndicator,
                            { backgroundColor: getPriorityColor(priority) },
                          ]}
                        />
                        <Text
                          style={[
                            styles.priorityText,
                            {
                              color:
                                editingTask?.priority === priority
                                  ? getPriorityColor(priority)
                                  : colors.neutral[500],
                            },
                          ]}
                        >
                          {priority === 'high'
                            ? 'Haute'
                            : priority === 'medium'
                            ? 'Moyenne'
                            : 'Basse'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Tags
                  </Text>
                  <View style={styles.tagsGrid}>
                    {tags.map((tag) => (
                      <TouchableOpacity
                        key={tag.id}
                        style={[
                          styles.tagSelectItem,
                          editingTask?.tags?.includes(tag.id) && {
                            backgroundColor: tag.color + '30',
                            borderColor: tag.color,
                          },
                          { borderColor: colors.neutral[200] },
                        ]}
                        onPress={() => toggleTaskTag(tag.id)}
                      >
                        <View
                          style={[
                            styles.tagDot,
                            { backgroundColor: tag.color },
                          ]}
                        />
                        <Text
                          style={[
                            styles.tagSelectText,
                            {
                              color: editingTask?.tags?.includes(tag.id)
                                ? tag.color
                                : colors.neutral[500],
                            },
                          ]}
                        >
                          {tag.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    { backgroundColor: colors.accent[500] },
                  ]}
                  onPress={updateTask}
                >
                  <Text style={styles.saveButtonText}>Mettre à jour</Text>
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        <Modal
          visible={showTagModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowTagModal(false)}
        >
          <View style={styles.centeredModalContainer}>
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowTagModal(false)}
            />

            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              style={[
                styles.tagModalContent,
                { backgroundColor: colors.cardBackground },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Nouveau tag
                </Text>
                <TouchableOpacity
                  onPress={() => setShowTagModal(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Nom</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: colors.neutral[300],
                    },
                  ]}
                  placeholder="Ex: Important"
                  placeholderTextColor={colors.neutral[400]}
                  value={newTag.name}
                  onChangeText={(text) => setNewTag({ ...newTag, name: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Couleur
                </Text>
                <View style={styles.colorPickerContainer}>
                  {[
                    colors.primary[500],
                    colors.secondary[500],
                    colors.accent[500],
                    colors.success[500],
                    colors.warning[500],
                    colors.error[500],
                  ].map((color, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        newTag.color === color && styles.selectedColor,
                      ]}
                      onPress={() => setNewTag({ ...newTag, color })}
                    />
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { backgroundColor: colors.accent[500] },
                ]}
                onPress={addTag}
              >
                <Text style={styles.saveButtonText}>Créer</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>

        {showDatePicker && (
          <DateTimePicker
            value={
              showAddModal
                ? newTask.dueDate || new Date()
                : editingTask?.dueDate || new Date()
            }
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            minimumDate={new Date()}
            locale="fr"
          />
        )}
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
    flexGrow: 0,
  },
  emptyState: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
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
  taskMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 4,
  },
  metadataText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginLeft: 4,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  taskActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  centeredModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  centeredModalContent: {
    width: width - 40,
    maxHeight: height * 0.8,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  tagModalContent: {
    width: width - 80,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalScroll: {
    maxHeight: height * 0.6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  closeButton: {
    padding: 4,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 100,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginLeft: 12,
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginHorizontal: 4,
  },
  priorityIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  priorityText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  tagSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    margin: 4,
  },
  tagSelectText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 4,
  },
  colorPickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#fff',
  },
  saveButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});
