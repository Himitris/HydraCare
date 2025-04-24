// app/(apps)/running/index.tsx
import Colors from '@/constants/Colors';
import { useAppContext } from '@/context/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import {
  Activity,
  Calendar,
  ChevronDown,
  Frown,
  Meh,
  Plus,
  Smile,
  Trash2,
  X,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

// Import des composants extraits
import SessionCard from '@/components/running/SessionCard';
import EmptyState from '@/components/running/EmptyState';

const { width, height } = Dimensions.get('window');
const STORAGE_KEY = '@hydracare/running_sessions';

interface RunningSession {
  id: string;
  date: Date;
  feeling: 'great' | 'good' | 'average' | 'bad';
  description: string;
  // Nouveaux champs optionnels pour les performances
  distance?: number; // Distance en kilomètres
  duration?: number; // Durée en minutes
  pace?: number; // Allure en minutes par kilomètre
  calories?: number; // Calories brûlées (estimation)
  elevationGain?: number; // Dénivelé positif en mètres
  maxHeartRate?: number; // Fréquence cardiaque maximale en bpm
  avgHeartRate?: number; // Fréquence cardiaque moyenne en bpm
}

export default function RunningScreen() {
  const { isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const [sessions, setSessions] = useState<RunningSession[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPerformanceFields, setShowPerformanceFields] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<RunningSession | null>(
    null
  );
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [newSession, setNewSession] = useState<Partial<RunningSession>>({
    date: new Date(),
    feeling: 'good',
    description: '',
  });

  // Load sessions from AsyncStorage when the component mounts
  useEffect(() => {
    loadSessions();
  }, []);

  // Load sessions from storage
  const loadSessions = async () => {
    try {
      const savedSessions = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedSessions) {
        const parsedSessions = JSON.parse(savedSessions).map(
          (session: any) => ({
            ...session,
            date: new Date(session.date),
          })
        );
        setSessions(parsedSessions);
      }
    } catch (error) {
      console.error('Error loading running sessions:', error);
    }
  };

  // Save sessions to storage
  const saveSessions = async (updatedSessions: RunningSession[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
    } catch (error) {
      console.error('Error saving running sessions:', error);
    }
  };

  const getFeelingIcon = (feeling: RunningSession['feeling']) => {
    switch (feeling) {
      case 'great':
        return <Smile size={24} color={colors.success[500]} />;
      case 'good':
        return <Smile size={24} color={colors.primary[500]} />;
      case 'average':
        return <Meh size={24} color={colors.warning[500]} />;
      case 'bad':
        return <Frown size={24} color={colors.error[500]} />;
    }
  };

  const getFeelingColor = (feeling: RunningSession['feeling']) => {
    switch (feeling) {
      case 'great':
        return colors.success[500];
      case 'good':
        return colors.primary[500];
      case 'average':
        return colors.warning[500];
      case 'bad':
        return colors.error[500];
    }
  };

  const getFeelingLabel = (feeling: RunningSession['feeling']) => {
    switch (feeling) {
      case 'great':
        return 'Excellent';
      case 'good':
        return 'Bien';
      case 'average':
        return 'Moyen';
      case 'bad':
        return 'Difficile';
    }
  };

  const handleAddSession = () => {
    if (!newSession.description?.trim()) {
      Alert.alert(
        'Erreur',
        'Veuillez ajouter une description pour votre sortie'
      );
      return;
    }

    // Calculer automatiquement l'allure si on a la distance et la durée
    let pace = newSession.pace;
    if (
      !pace &&
      newSession.distance &&
      newSession.duration &&
      newSession.distance > 0
    ) {
      pace = newSession.duration / newSession.distance;
    }

    // Si editingSessionId existe, on est en mode édition
    if (editingSessionId) {
      const updatedSessions = sessions.map((session) => {
        if (session.id === editingSessionId) {
          return {
            ...session,
            date: newSession.date || new Date(),
            feeling: newSession.feeling || 'good',
            description: newSession.description?.trim() || '',
            // Ajouter les champs de performance
            distance: newSession.distance,
            duration: newSession.duration,
            pace: pace,
            calories: newSession.calories,
            elevationGain: newSession.elevationGain,
            avgHeartRate: newSession.avgHeartRate,
            maxHeartRate: newSession.maxHeartRate,
          };
        }
        return session;
      });

      setSessions(updatedSessions);
      saveSessions(updatedSessions); // Sauvegarder les sessions mises à jour

      // Réinitialiser le mode édition
      setEditingSessionId(null);
    } else {
      // Mode création
      const session: RunningSession = {
        id: Date.now().toString(),
        date: newSession.date || new Date(),
        feeling: newSession.feeling || 'good',
        description: newSession.description.trim(),
        // Ajouter les champs de performance
        distance: newSession.distance,
        duration: newSession.duration,
        pace: pace,
        calories: newSession.calories,
        elevationGain: newSession.elevationGain,
        avgHeartRate: newSession.avgHeartRate,
        maxHeartRate: newSession.maxHeartRate,
      };

      const updatedSessions = [session, ...sessions];
      setSessions(updatedSessions);
      saveSessions(updatedSessions); // Sauvegarder les sessions mises à jour
    }

    // Fermer le modal et réinitialiser le formulaire
    setShowAddModal(false);
    setNewSession({ date: new Date(), feeling: 'good', description: '' });
    setShowPerformanceFields(false);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const openModal = () => {
    setShowAddModal(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setNewSession({ ...newSession, date: selectedDate });
    }
  };

  // Fonction pour calculer automatiquement l'allure en minutes par kilomètre
  const calculatePace = (): string => {
    if (newSession.distance && newSession.duration && newSession.distance > 0) {
      const pace = newSession.duration / newSession.distance;
      return pace.toFixed(2).replace('.', ','); // Remplace le point par une virgule pour le format français
    }
    return '';
  };

  // Handler pour l'édition d'une session
  const handleEdit = (session: RunningSession) => {
    // Préremplir le formulaire avec les données existantes, incluant les performances
    setNewSession({
      date: new Date(session.date),
      feeling: session.feeling,
      description: session.description,
      distance: session.distance,
      duration: session.duration,
      pace: session.pace,
      calories: session.calories,
      elevationGain: session.elevationGain,
      avgHeartRate: session.avgHeartRate,
      maxHeartRate: session.maxHeartRate,
    });

    // Si des détails de performance existent, afficher la section
    if (
      session.distance ||
      session.duration ||
      session.pace ||
      session.calories ||
      session.elevationGain ||
      session.avgHeartRate ||
      session.maxHeartRate
    ) {
      setShowPerformanceFields(true);
    }

    // Stocker l'ID de la session en cours d'édition
    setEditingSessionId(session.id);

    // Ouvrir le modal d'édition
    setShowAddModal(true);
  };

  // Handler pour la suppression d'une session
  const handleDelete = (id: string) => {
    setSelectedSession(sessions.find((s) => s.id === id) || null);
    setShowDeleteModal(true);
  };

  // Handler pour afficher les détails d'une session
  const handleShowDetails = (session: RunningSession) => {
    setSelectedSession(session);
    setShowDetailsModal(true);
  };

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

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Activity size={32} color={colors.secondary[500]} />
            <View style={styles.titleTextContainer}>
              <Text style={[styles.title, { color: colors.text }]}>
                Mes Sorties
              </Text>
              <Text style={[styles.subtitle, { color: colors.neutral[500] }]}>
                Suivez vos sensations
              </Text>
            </View>
          </View>
        </View>

        {/* Sessions List */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {sessions.length === 0 ? (
            <EmptyState colors={colors} />
          ) : (
            <>
              {/* Liste des sessions */}
              {sessions.map((session, index) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  index={index}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onPress={handleShowDetails}
                  colors={colors}
                />
              ))}
            </>
          )}
        </ScrollView>

        {/* Floating Add Button */}
        <TouchableOpacity
          onPress={openModal}
          style={[styles.addButton, { backgroundColor: colors.secondary[500] }]}
        >
          <Plus size={28} color="#fff" />
        </TouchableOpacity>

        {/* Add Session Modal - Centered Version */}
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
                  {editingSessionId ? 'Modifier la sortie' : 'Nouvelle sortie'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddModal(false);
                    setEditingSessionId(null); // Réinitialiser l'ID d'édition
                    setNewSession({
                      date: new Date(),
                      feeling: 'good',
                      description: '',
                    }); // Réinitialiser le formulaire
                  }}
                  style={styles.closeButton}
                >
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScroll}
                showsVerticalScrollIndicator={false}
              >
                {/* Date Picker */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Date
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
                      {format(newSession.date || new Date(), 'd MMMM yyyy', {
                        locale: fr,
                      })}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Feeling Selector */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Sensation
                  </Text>
                  <View style={styles.feelingContainer}>
                    {(['great', 'good', 'average', 'bad'] as const).map(
                      (feeling) => (
                        <TouchableOpacity
                          key={feeling}
                          style={[
                            styles.feelingButton,
                            newSession.feeling === feeling && {
                              backgroundColor: getFeelingColor(feeling) + '30',
                              borderColor: getFeelingColor(feeling),
                            },
                            { borderColor: colors.neutral[200] },
                          ]}
                          onPress={() =>
                            setNewSession({ ...newSession, feeling })
                          }
                        >
                          {getFeelingIcon(feeling)}
                          <Text
                            style={[
                              styles.feelingLabel,
                              { color: colors.text },
                            ]}
                          >
                            {getFeelingLabel(feeling)}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </View>

                {/* Description Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Description
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.neutral[200],
                        color: colors.text,
                      },
                    ]}
                    placeholder="Comment s'est passée votre sortie ?"
                    placeholderTextColor={colors.neutral[500]}
                    multiline
                    value={newSession.description}
                    onChangeText={(text) =>
                      setNewSession({ ...newSession, description: text })
                    }
                  />
                </View>

                {/* Performance Details Toggle */}
                <TouchableOpacity
                  style={styles.collapsibleHeader}
                  onPress={() =>
                    setShowPerformanceFields(!showPerformanceFields)
                  }
                >
                  <Text style={[styles.label, { color: colors.text }]}>
                    Détails de performance
                  </Text>
                  <ChevronDown
                    size={20}
                    color={colors.neutral[500]}
                    style={{
                      transform: showPerformanceFields
                        ? [{ rotate: '180deg' }]
                        : [{ rotate: '0deg' }],
                      marginLeft: 8,
                    }}
                  />
                </TouchableOpacity>

                {/* Collapsible Performance Fields Content */}
                {showPerformanceFields && (
                  <View style={styles.performanceFields}>
                    {/* Distance */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: colors.text }]}>
                        Distance (km)
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.neutral[200],
                            color: colors.text,
                          },
                        ]}
                        placeholder="0.00"
                        placeholderTextColor={colors.neutral[500]}
                        keyboardType="numeric"
                        value={
                          newSession.distance !== undefined
                            ? newSession.distance.toString().replace('.', ',')
                            : ''
                        }
                        onChangeText={(text) => {
                          const formattedText = text.replace(',', '.');
                          const parsed = parseFloat(formattedText);
                          setNewSession({
                            ...newSession,
                            distance: isNaN(parsed) ? undefined : parsed,
                          });
                        }}
                      />
                    </View>

                    {/* Duration */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: colors.text }]}>
                        Durée (min)
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.neutral[200],
                            color: colors.text,
                          },
                        ]}
                        placeholder="0"
                        placeholderTextColor={colors.neutral[500]}
                        keyboardType="numeric"
                        value={
                          newSession.duration !== undefined
                            ? newSession.duration.toString()
                            : ''
                        }
                        onChangeText={(text) => {
                          const parsed = parseInt(text, 10);
                          setNewSession({
                            ...newSession,
                            duration: isNaN(parsed) ? undefined : parsed,
                          });
                        }}
                      />
                    </View>

                    {/* Pace (Automatiquement calculé si distance et durée sont fournies) */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: colors.text }]}>
                        Allure (min/km)
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.neutral[200],
                            color: colors.text,
                          },
                        ]}
                        placeholder="Automatique"
                        placeholderTextColor={colors.neutral[500]}
                        value={calculatePace()}
                        editable={false} // Rendre non éditable car calculé
                      />
                    </View>

                    {/* Calories */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: colors.text }]}>
                        Calories (kcal)
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.neutral[200],
                            color: colors.text,
                          },
                        ]}
                        placeholder="0"
                        placeholderTextColor={colors.neutral[500]}
                        keyboardType="numeric"
                        value={
                          newSession.calories !== undefined
                            ? newSession.calories.toString()
                            : ''
                        }
                        onChangeText={(text) => {
                          const parsed = parseInt(text, 10);
                          setNewSession({
                            ...newSession,
                            calories: isNaN(parsed) ? undefined : parsed,
                          });
                        }}
                      />
                    </View>

                    {/* Elevation Gain */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: colors.text }]}>
                        Dénivelé (+) (m)
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.neutral[200],
                            color: colors.text,
                          },
                        ]}
                        placeholder="0"
                        placeholderTextColor={colors.neutral[500]}
                        keyboardType="numeric"
                        value={
                          newSession.elevationGain !== undefined
                            ? newSession.elevationGain.toString()
                            : ''
                        }
                        onChangeText={(text) => {
                          const parsed = parseInt(text, 10);
                          setNewSession({
                            ...newSession,
                            elevationGain: isNaN(parsed) ? undefined : parsed,
                          });
                        }}
                      />
                    </View>

                    {/* Average Heart Rate */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: colors.text }]}>
                        FC Moyenne (bpm)
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.neutral[200],
                            color: colors.text,
                          },
                        ]}
                        placeholder="0"
                        placeholderTextColor={colors.neutral[500]}
                        keyboardType="numeric"
                        value={
                          newSession.avgHeartRate !== undefined
                            ? newSession.avgHeartRate.toString()
                            : ''
                        }
                        onChangeText={(text) => {
                          const parsed = parseInt(text, 10);
                          setNewSession({
                            ...newSession,
                            avgHeartRate: isNaN(parsed) ? undefined : parsed,
                          });
                        }}
                      />
                    </View>

                    {/* Maximum Heart Rate */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: colors.text }]}>
                        FC Max (bpm)
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.neutral[200],
                            color: colors.text,
                          },
                        ]}
                        placeholder="0"
                        placeholderTextColor={colors.neutral[500]}
                        keyboardType="numeric"
                        value={
                          newSession.maxHeartRate !== undefined
                            ? newSession.maxHeartRate.toString()
                            : ''
                        }
                        onChangeText={(text) => {
                          const parsed = parseInt(text, 10);
                          setNewSession({
                            ...newSession,
                            maxHeartRate: isNaN(parsed) ? undefined : parsed,
                          });
                        }}
                      />
                    </View>
                  </View>
                )}

                {/* Save Button */}
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    { backgroundColor: colors.secondary[500] },
                  ]}
                  onPress={handleAddSession}
                >
                  <Text style={styles.saveButtonText}>
                    {editingSessionId
                      ? 'Enregistrer les modifications'
                      : 'Ajouter la sortie'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        {/* Date Picker Modal */}
        {Platform.OS !== 'ios' && showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={newSession.date || new Date()}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}

        {/* Session Details Modal */}
        <Modal
          visible={showDetailsModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDetailsModal(false)}
        >
          <View style={styles.centeredModalContainer}>
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowDetailsModal(false)}
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
                  Détails de la sortie
                </Text>
              </View>

              <ScrollView
                style={styles.modalScroll}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.detailsRow}>
                  <Text
                    style={[
                      styles.detailsLabel,
                      { color: colors.neutral[500] },
                    ]}
                  >
                    Date
                  </Text>
                  <Text style={[styles.detailsValue, { color: colors.text }]}>
                    {selectedSession &&
                      format(selectedSession.date, 'd MMMM yyyy', {
                        locale: fr,
                      })}
                  </Text>
                </View>

                <View style={styles.detailsRow}>
                  <Text
                    style={[
                      styles.detailsLabel,
                      { color: colors.neutral[500] },
                    ]}
                  >
                    Sensation
                  </Text>
                  <>
                    {selectedSession?.feeling &&
                      getFeelingIcon(selectedSession.feeling)}
                    <Text
                      style={[
                        styles.detailsFeeling,
                        {
                          color: selectedSession
                            ? getFeelingColor(selectedSession.feeling)
                            : colors.text,
                        },
                      ]}
                    >
                      {selectedSession
                        ? getFeelingLabel(selectedSession.feeling)
                        : ''}
                    </Text>
                  </>
                </View>

                <View
                  style={[
                    styles.descriptionContainer,
                    { borderColor: colors.neutral[200] },
                  ]}
                >
                  <Text
                    style={[
                      styles.descriptionLabel,
                      { color: colors.neutral[600] },
                    ]}
                  >
                    Description
                  </Text>
                  <Text
                    style={[styles.detailsDescription, { color: colors.text }]}
                  >
                    {selectedSession?.description}
                  </Text>
                </View>

                {/* Performance Details Section - Only shown if any performance data exists */}
                {selectedSession &&
                  (selectedSession.distance ||
                    selectedSession.duration ||
                    selectedSession.pace ||
                    selectedSession.calories ||
                    selectedSession.elevationGain ||
                    selectedSession.avgHeartRate ||
                    selectedSession.maxHeartRate) && (
                    <View
                      style={[
                        styles.performanceDetailsContainer,
                        { borderColor: colors.neutral[200] },
                      ]}
                    >
                      <Text
                        style={[
                          styles.performanceDetailsTitle,
                          { color: colors.text },
                        ]}
                      >
                        Détails de performance
                      </Text>

                      <View style={styles.performanceDetailsGrid}>
                        {/* Distance */}
                        {selectedSession.distance && (
                          <View style={styles.performanceDetailItem}>
                            <Text
                              style={[
                                styles.detailItemLabel,
                                { color: colors.neutral[500] },
                              ]}
                            >
                              Distance
                            </Text>
                            <Text
                              style={[
                                styles.detailItemValue,
                                { color: colors.text },
                              ]}
                            >
                              {selectedSession.distance} km
                            </Text>
                          </View>
                        )}

                        {/* Duration */}
                        {selectedSession.duration && (
                          <View style={styles.performanceDetailItem}>
                            <Text
                              style={[
                                styles.detailItemLabel,
                                { color: colors.neutral[500] },
                              ]}
                            >
                              Durée
                            </Text>
                            <Text
                              style={[
                                styles.detailItemValue,
                                { color: colors.text },
                              ]}
                            >
                              {Math.floor(selectedSession.duration / 60)}h{' '}
                              {selectedSession.duration % 60}min
                            </Text>
                          </View>
                        )}

                        {/* Pace */}
                        {(selectedSession.pace ||
                          (selectedSession.distance &&
                            selectedSession.duration)) && (
                          <View style={styles.performanceDetailItem}>
                            <Text
                              style={[
                                styles.detailItemLabel,
                                { color: colors.neutral[500] },
                              ]}
                            >
                              Allure
                            </Text>
                            <Text
                              style={[
                                styles.detailItemValue,
                                { color: colors.text },
                              ]}
                            >
                              {selectedSession.pace
                                ? selectedSession.pace
                                    .toFixed(2)
                                    .replace('.', ',')
                                : selectedSession.duration &&
                                  selectedSession.distance
                                ? (
                                    selectedSession.duration /
                                    selectedSession.distance
                                  )
                                    .toFixed(2)
                                    .replace('.', ',')
                                : ''}{' '}
                              min/km
                            </Text>
                          </View>
                        )}

                        {/* Calories */}
                        {selectedSession.calories && (
                          <View style={styles.performanceDetailItem}>
                            <Text
                              style={[
                                styles.detailItemLabel,
                                { color: colors.neutral[500] },
                              ]}
                            >
                              Calories
                            </Text>
                            <Text
                              style={[
                                styles.detailItemValue,
                                { color: colors.text },
                              ]}
                            >
                              {selectedSession.calories} kcal
                            </Text>
                          </View>
                        )}

                        {/* Elevation */}
                        {selectedSession.elevationGain && (
                          <View style={styles.performanceDetailItem}>
                            <Text
                              style={[
                                styles.detailItemLabel,
                                { color: colors.neutral[500] },
                              ]}
                            >
                              Dénivelé
                            </Text>
                            <Text
                              style={[
                                styles.detailItemValue,
                                { color: colors.text },
                              ]}
                            >
                              {selectedSession.elevationGain} m
                            </Text>
                          </View>
                        )}

                        {/* Heart Rate */}
                        {(selectedSession.avgHeartRate ||
                          selectedSession.maxHeartRate) && (
                          <View style={styles.performanceDetailItem}>
                            <Text
                              style={[
                                styles.detailItemLabel,
                                { color: colors.neutral[500] },
                              ]}
                            >
                              Fréq. cardiaque
                            </Text>
                            <Text
                              style={[
                                styles.detailItemValue,
                                { color: colors.text },
                              ]}
                            >
                              {selectedSession.avgHeartRate
                                ? `${selectedSession.avgHeartRate} `
                                : ''}
                              {selectedSession.avgHeartRate &&
                              selectedSession.maxHeartRate
                                ? '- '
                                : ''}
                              {selectedSession.maxHeartRate
                                ? `${selectedSession.maxHeartRate}`
                                : ''}{' '}
                              bpm
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                <TouchableOpacity
                  style={[
                    styles.closeDetailsButton,
                    { backgroundColor: colors.secondary[500] },
                  ]}
                  onPress={() => setShowDetailsModal(false)}
                >
                  <Text style={styles.closeDetailsButtonText}>Fermer</Text>
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <View style={styles.centeredModalContainer}>
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowDeleteModal(false)}
            />

            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              style={[
                styles.centeredModalContent, // Utilisez le même style que les autres modals
                { backgroundColor: colors.cardBackground },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Confirmation de suppression
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDeleteModal(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.deleteConfirmContent}>
                <View
                  style={[
                    styles.deleteIconContainer,
                    { backgroundColor: colors.error[100] },
                  ]}
                >
                  <Trash2 size={32} color={colors.error[500]} />
                </View>

                <Text
                  style={[
                    styles.deleteMessage,
                    {
                      color: colors.neutral[600],
                      textAlign: 'center',
                      marginVertical: 20,
                    },
                  ]}
                >
                  Êtes-vous sûr de vouloir supprimer cette sortie ? Cette action
                  est irréversible.
                </Text>

                <View style={styles.deleteButtonsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.deleteButtonCancel,
                      { backgroundColor: colors.neutral[200] },
                    ]}
                    onPress={() => setShowDeleteModal(false)}
                  >
                    <Text
                      style={[styles.deleteButtonText, { color: colors.text }]}
                    >
                      Annuler
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.deleteButtonConfirm,
                      { backgroundColor: colors.error[500] },
                    ]}
                    onPress={async () => {
                      if (selectedSession) {
                        // Filtrer la session à supprimer
                        const updatedSessions = sessions.filter(
                          (s) => s.id !== selectedSession.id
                        );
                        setSessions(updatedSessions);

                        // Sauvegarder les sessions mises à jour
                        await saveSessions(updatedSessions);

                        if (Platform.OS !== 'web') {
                          Haptics.notificationAsync(
                            Haptics.NotificationFeedbackType.Success
                          );
                        }
                      }

                      setShowDeleteModal(false);
                      setSelectedSession(null);
                    }}
                  >
                    <Text style={styles.deleteButtonConfirmText}>
                      Supprimer
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </View>
        </Modal>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
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
  // Modal Styles - Centered Version
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
  feelingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  feelingButton: {
    width: (width - 120) / 4,
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  feelingLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginTop: 8,
  },
  textInput: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 120,
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
  // Collapsible Performance Fields
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 8,
  },
  performanceFields: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  // Session Details Modal Styles
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailsLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  detailsValue: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  detailsFeeling: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginLeft: 8,
  },
  descriptionContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  descriptionLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  detailsDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  closeDetailsButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  closeDetailsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  // Performance Details Styles
  performanceDetailsContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  performanceDetailsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  performanceDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  performanceDetailItem: {
    width: '48%',
    marginBottom: 12,
  },
  detailItemLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  detailItemValue: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  // Delete Confirmation Modal Styles
  deleteConfirmContent: {
    padding: 20,
    alignItems: 'center',
  },
  deleteIconContainer: {
    backgroundColor: '#fee2e2',
    borderRadius: 30,
    padding: 12,
    marginBottom: 16,
  },
  deleteMessage: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 24,
  },
  deleteButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  deleteButtonCancel: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  deleteButtonConfirm: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  deleteButtonConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});
