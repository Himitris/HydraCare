// app/(apps)/running/index.tsx
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
import Animated, { FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';
import {
  Activity,
  Plus,
  Calendar,
  X,
  Smile,
  Meh,
  Frown,
  ChevronRight,
} from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');
const STORAGE_KEY = '@hydracare/running_sessions';

interface RunningSession {
  id: string;
  date: Date;
  feeling: 'great' | 'good' | 'average' | 'bad';
  description: string;
}

export default function RunningScreen() {
  const { isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const [sessions, setSessions] = useState<RunningSession[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
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

    const session: RunningSession = {
      id: Date.now().toString(),
      date: newSession.date || new Date(),
      feeling: newSession.feeling || 'good',
      description: newSession.description.trim(),
    };

    const updatedSessions = [session, ...sessions];
    setSessions(updatedSessions);
    saveSessions(updatedSessions); // Save to AsyncStorage

    setShowAddModal(false);
    setNewSession({ date: new Date(), feeling: 'good', description: '' });

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
                  { backgroundColor: colors.secondary[100] },
                ]}
              >
                <Activity size={40} color={colors.secondary[500]} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Commencez votre journal
              </Text>
              <Text style={[styles.emptyText, { color: colors.neutral[500] }]}>
                Enregistrez vos sorties et suivez vos sensations au fil du temps
              </Text>
            </Animated.View>
          ) : (
            sessions.map((session, index) => (
              <Animated.View
                key={session.id}
                entering={FadeInDown.delay(index * 100)}
              >
                <TouchableOpacity
                  style={[
                    styles.sessionCard,
                    { backgroundColor: colors.cardBackground },
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionInfo}>
                      <View
                        style={[
                          styles.feelingIndicator,
                          {
                            backgroundColor:
                              getFeelingColor(session.feeling) + '20',
                          },
                        ]}
                      >
                        {getFeelingIcon(session.feeling)}
                      </View>
                      <View style={styles.sessionTextInfo}>
                        <Text
                          style={[
                            styles.sessionDateText,
                            { color: colors.text },
                          ]}
                        >
                          {format(new Date(session.date), 'EEEE d MMMM', {
                            locale: fr,
                          })}
                        </Text>
                        <Text
                          style={[
                            styles.feelingText,
                            { color: getFeelingColor(session.feeling) },
                          ]}
                        >
                          {getFeelingLabel(session.feeling)}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color={colors.neutral[400]} />
                  </View>
                  <Text
                    style={[styles.description, { color: colors.neutral[600] }]}
                    numberOfLines={2}
                  >
                    {session.description}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))
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
                  Nouvelle sortie
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
                              {
                                color:
                                  newSession.feeling === feeling
                                    ? getFeelingColor(feeling)
                                    : colors.neutral[500],
                              },
                            ]}
                          >
                            {getFeelingLabel(feeling)}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </View>

                {/* Description */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Description de vos sensations
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
                    multiline
                    numberOfLines={4}
                    placeholder="Comment vous êtes-vous senti(e) pendant cette sortie ?"
                    placeholderTextColor={colors.neutral[400]}
                    value={newSession.description}
                    onChangeText={(text) =>
                      setNewSession({ ...newSession, description: text })
                    }
                  />
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    { backgroundColor: colors.secondary[500] },
                  ]}
                  onPress={handleAddSession}
                >
                  <Text style={styles.saveButtonText}>Enregistrer</Text>
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={newSession.date || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            textColor={colors.text}
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyState: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
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
  sessionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feelingIndicator: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionTextInfo: {
    marginLeft: 12,
  },
  sessionDateText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  feelingText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
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
});
