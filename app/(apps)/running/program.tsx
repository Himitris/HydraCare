// app/(apps)/running/program.tsx
import Colors from '@/constants/Colors';
import { useAppContext } from '@/context/AppContext';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Calendar, Plus, Play, Award, Info, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Types pour les programmes d'entraînement
interface TrainingDay {
  id: string;
  title: string;
  description: string;
  distance?: number;
  duration?: number;
  completed: boolean;
}

interface TrainingProgram {
  id: string;
  name: string;
  description: string;
  duration: number; // en semaines
  days: TrainingDay[];
  active: boolean;
  progress: number; // pourcentage de complétion
}

export default function ProgramScreen() {
  const { isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  // Exemple de programmes prédéfinis
  const [programs, setPrograms] = useState<TrainingProgram[]>([
    {
      id: '1',
      name: 'Débutant 5km',
      description: 'Programme de 8 semaines pour courir un 5km',
      duration: 8,
      days: generateSampleDays(8, 3),
      active: true,
      progress: 25,
    },
    {
      id: '2',
      name: 'Préparation 10km',
      description: 'Programme de 12 semaines pour un 10km',
      duration: 12,
      days: generateSampleDays(12, 4),
      active: false,
      progress: 0,
    },
  ]);

  const [showNewProgramModal, setShowNewProgramModal] = useState(false);
  const [newProgram, setNewProgram] = useState({
    name: '',
    description: '',
    duration: '8',
  });
  const [activeProgram, setActiveProgram] = useState<TrainingProgram | null>(
    programs.find((p) => p.active) || null
  );
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Fonction pour générer des jours d'entraînement d'exemple
  function generateSampleDays(
    weeks: number,
    daysPerWeek: number
  ): TrainingDay[] {
    const days: TrainingDay[] = [];
    for (let week = 1; week <= weeks; week++) {
      for (let day = 1; day <= daysPerWeek; day++) {
        days.push({
          id: `w${week}d${day}`,
          title: `Semaine ${week} - Jour ${day}`,
          description: generateDescription(week, day),
          distance: Math.round((week * 0.5 + day * 0.3) * 10) / 10,
          duration: Math.round(week * 5 + day * 3 + 15),
          completed: week === 1 && day <= 3, // Exemple: premières sessions complétées
        });
      }
    }
    return days;
  }

  // Générer une description d'entraînement basée sur la semaine et le jour
  function generateDescription(week: number, day: number): string {
    const types = [
      'Endurance lente',
      'Fractionné',
      'Récupération active',
      'Course longue',
      'Fartlek',
    ];
    const type = types[(week + day) % types.length];

    if (type === 'Fractionné') {
      return `${type}: 5x400m avec 1min de récupération`;
    } else if (type === 'Fartlek') {
      return `${type}: Alternance de rythmes sur 20min`;
    } else {
      return `${type}: Course à allure confortable`;
    }
  }

  // Ajouter un nouveau programme
  const addNewProgram = () => {
    if (!newProgram.name.trim()) return;

    const program: TrainingProgram = {
      id: Date.now().toString(),
      name: newProgram.name,
      description: newProgram.description,
      duration: parseInt(newProgram.duration) || 8,
      days: generateSampleDays(parseInt(newProgram.duration) || 8, 3),
      active: false,
      progress: 0,
    };

    setPrograms([...programs, program]);
    setNewProgram({ name: '', description: '', duration: '8' });
    setShowNewProgramModal(false);
  };

  // Activer un programme
  const activateProgram = (programId: string) => {
    const updatedPrograms = programs.map((p) => ({
      ...p,
      active: p.id === programId,
    }));

    setPrograms(updatedPrograms);
    setActiveProgram(updatedPrograms.find((p) => p.id === programId) || null);
  };

  // Marquer un jour d'entraînement comme terminé
  const toggleTrainingDay = (dayId: string) => {
    if (!activeProgram) return;

    const updatedDays = activeProgram.days.map((day) =>
      day.id === dayId ? { ...day, completed: !day.completed } : day
    );

    const updatedProgram = {
      ...activeProgram,
      days: updatedDays,
      progress: Math.round(
        (updatedDays.filter((d) => d.completed).length / updatedDays.length) *
          100
      ),
    };

    setActiveProgram(updatedProgram);

    const updatedPrograms = programs.map((p) =>
      p.id === updatedProgram.id ? updatedProgram : p
    );

    setPrograms(updatedPrograms);
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

      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Calendar size={28} color={colors.secondary[500]} />
          <View style={styles.titleTextContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              Programmes
            </Text>
            <Text style={[styles.subtitle, { color: colors.neutral[500] }]}>
              Vos plans d'entraînement
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.infoButton,
            { backgroundColor: colors.secondary[100] },
          ]}
          onPress={() => setShowInfoModal(true)}
        >
          <Info size={20} color={colors.secondary[500]} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: "red" }]}>Ne fonctionne pas</Text>
        {/* Programme actif */}
        {activeProgram ? (
          <Animated.View entering={FadeInDown.delay(100)}>
            <View
              style={[
                styles.activeProgram,
                { backgroundColor: colors.cardBackground },
              ]}
            >
              <View style={styles.activeProgramHeader}>
                <View>
                  <Text
                    style={[styles.activeProgramTitle, { color: colors.text }]}
                  >
                    {activeProgram.name}
                  </Text>
                  <Text
                    style={[
                      styles.activeProgramDescription,
                      { color: colors.neutral[500] },
                    ]}
                  >
                    {activeProgram.description}
                  </Text>
                </View>
                <View style={styles.progressContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { backgroundColor: colors.neutral[200] },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: colors.secondary[500],
                          width: `${activeProgram.progress}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.progressText,
                      { color: colors.secondary[500] },
                    ]}
                  >
                    {activeProgram.progress}%
                  </Text>
                </View>
              </View>

              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Sessions d'entraînement à venir
              </Text>

              {/* Liste des jours d'entraînement */}
              {activeProgram.days
                .filter((day) => !day.completed)
                .slice(0, 5)
                .map((day, index) => (
                  <TouchableOpacity
                    key={day.id}
                    style={[
                      styles.trainingDay,
                      { backgroundColor: colors.background },
                    ]}
                    onPress={() => toggleTrainingDay(day.id)}
                  >
                    <View style={styles.trainingDayContent}>
                      <View style={styles.trainingDayInfo}>
                        <Text
                          style={[
                            styles.trainingDayTitle,
                            { color: colors.text },
                          ]}
                        >
                          {day.title}
                        </Text>
                        <Text
                          style={[
                            styles.trainingDayDescription,
                            { color: colors.neutral[500] },
                          ]}
                        >
                          {day.description}
                        </Text>
                        <View style={styles.trainingDayDetails}>
                          {day.distance && (
                            <Text
                              style={[
                                styles.detailText,
                                { color: colors.secondary[500] },
                              ]}
                            >
                              {day.distance} km
                            </Text>
                          )}
                          {day.duration && (
                            <Text
                              style={[
                                styles.detailText,
                                { color: colors.secondary[500] },
                              ]}
                            >
                              {day.duration} min
                            </Text>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.startButton,
                          { backgroundColor: colors.secondary[100] },
                        ]}
                        onPress={() => toggleTrainingDay(day.id)}
                      >
                        <Play size={20} color={colors.secondary[500]} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeInDown}
            style={[
              styles.emptyState,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Calendar size={48} color={colors.neutral[400]} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Aucun programme actif
            </Text>
            <Text style={[styles.emptyText, { color: colors.neutral[500] }]}>
              Activez un programme ci-dessous ou créez-en un nouveau
            </Text>
          </Animated.View>
        )}

        {/* Autres programmes */}
        <View style={styles.otherProgramsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Programmes disponibles
          </Text>

          {programs
            .filter((program) => !program.active)
            .map((program, index) => (
              <Animated.View
                key={program.id}
                entering={FadeInDown.delay(100 * (index + 1))}
              >
                <TouchableOpacity
                  style={[
                    styles.programCard,
                    { backgroundColor: colors.cardBackground },
                  ]}
                  onPress={() => activateProgram(program.id)}
                >
                  <View style={styles.programInfo}>
                    <Text style={[styles.programTitle, { color: colors.text }]}>
                      {program.name}
                    </Text>
                    <Text
                      style={[
                        styles.programDescription,
                        { color: colors.neutral[500] },
                      ]}
                    >
                      {program.description}
                    </Text>
                    <Text
                      style={[
                        styles.programDuration,
                        { color: colors.secondary[500] },
                      ]}
                    >
                      {program.duration} semaines
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.activateButton,
                      { backgroundColor: colors.secondary[500] },
                    ]}
                  >
                    <Play size={18} color="#fff" />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}

          {/* Ajouter un nouveau programme */}
          <TouchableOpacity
            style={[
              styles.addButton,
              { backgroundColor: colors.secondary[100] },
            ]}
            onPress={() => setShowNewProgramModal(true)}
          >
            <Plus size={24} color={colors.secondary[500]} />
            <Text
              style={[styles.addButtonText, { color: colors.secondary[500] }]}
            >
              Créer un programme personnalisé
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal pour créer un nouveau programme */}
      <Modal
        visible={showNewProgramModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNewProgramModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Nouveau programme
              </Text>
              <TouchableOpacity onPress={() => setShowNewProgramModal(false)}>
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
                placeholder="Ex: Préparation semi-marathon"
                placeholderTextColor={colors.neutral[400]}
                value={newProgram.name}
                onChangeText={(text) =>
                  setNewProgram({ ...newProgram, name: text })
                }
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Description
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.neutral[300],
                    height: 80,
                    textAlignVertical: 'top',
                  },
                ]}
                placeholder="Décrivez votre programme"
                placeholderTextColor={colors.neutral[400]}
                multiline
                value={newProgram.description}
                onChangeText={(text) =>
                  setNewProgram({ ...newProgram, description: text })
                }
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Durée (semaines)
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
                placeholder="8"
                placeholderTextColor={colors.neutral[400]}
                keyboardType="numeric"
                value={newProgram.duration}
                onChangeText={(text) =>
                  setNewProgram({ ...newProgram, duration: text })
                }
              />
            </View>

            <TouchableOpacity
              style={[
                styles.createButton,
                { backgroundColor: colors.secondary[500] },
              ]}
              onPress={addNewProgram}
            >
              <Text style={styles.createButtonText}>Créer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal d'information */}
      <Modal
        visible={showInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                À propos des programmes
              </Text>
              <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.infoScrollView}>
              <Text style={[styles.infoText, { color: colors.text }]}>
                Les programmes d'entraînement vous aident à structurer vos
                courses et à progresser vers un objectif précis.
              </Text>

              <Text style={[styles.infoHeader, { color: colors.text }]}>
                Comment utiliser un programme
              </Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                1. Activez un programme depuis la liste des programmes
                disponibles
              </Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                2. Suivez les séances d'entraînement programmées
              </Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                3. Marquez-les comme terminées après les avoir réalisées
              </Text>

              <Text style={[styles.infoHeader, { color: colors.text }]}>
                Programmes prédéfinis
              </Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                • Débutant 5km : idéal pour commencer la course à pied
              </Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                • Préparation 10km : pour progresser vers des distances plus
                longues
              </Text>

              <Text style={[styles.infoHeader, { color: colors.text }]}>
                Programmes personnalisés
              </Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                Vous pouvez créer vos propres programmes selon vos objectifs et
                votre niveau.
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: colors.secondary[500] },
              ]}
              onPress={() => setShowInfoModal(false)}
            >
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyState: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
  activeProgram: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  activeProgramHeader: {
    marginBottom: 16,
  },
  activeProgramTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  activeProgramDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    marginBottom: 8,
  },
  progressContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    flex: 1,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
    marginTop: 8,
  },
  trainingDay: {
    borderRadius: 12,
    marginBottom: 8,
    padding: 12,
  },
  trainingDayContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trainingDayInfo: {
    flex: 1,
  },
  trainingDayTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  trainingDayDescription: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  trainingDayDetails: {
    flexDirection: 'row',
    marginTop: 4,
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginRight: 12,
  },
  startButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otherProgramsSection: {
    marginTop: 10,
  },
  programCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  programInfo: {
    flex: 1,
  },
  programTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  programDescription: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  programDuration: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginTop: 6,
  },
  activateButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 6,
  },
  textInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  createButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  infoScrollView: {
    maxHeight: 300,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 12,
    lineHeight: 20,
  },
  infoHeader: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginTop: 8,
    marginBottom: 8,
  },
  closeButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});
