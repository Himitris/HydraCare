import Colors from '@/constants/Colors';
import { useAppContext } from '@/context/AppContext';
import {
  AlertCircle,
  Bell,
  BellOff,
  Calculator,
  HelpCircle,
  Moon,
  Scale,
  Sun,
  User,
} from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Switch,
} from 'react-native';
import { Slider } from '@miblanchard/react-native-slider';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function WaterCalculator() {
  const { settings, updateSettings, isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  // Paramètres pour le calcul - uniquement le poids maintenant
  const [weight, setWeight] = useState('70');
  const [calculatedWaterNeeds, setCalculatedWaterNeeds] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [helpContent, setHelpContent] = useState('');
  const [helpTitle, setHelpTitle] = useState('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Paramètres d'App Context à garder
  const [remindersEnabled, setRemindersEnabled] = useState(
    settings.remindersEnabled
  );
  const [preferredUnit, setPreferredUnit] = useState(settings.preferredUnit);

  useEffect(() => {
    // Calculer les besoins en eau lors du chargement et à chaque modification du poids
    calculateWaterNeeds();
  }, [weight]);

  const calculateWaterNeeds = () => {
    // Formule simplifiée basée uniquement sur le poids: 30ml/kg
    const weightNum = parseFloat(weight);

    if (isNaN(weightNum) || weightNum <= 0) {
      setCalculatedWaterNeeds(0);
      return;
    }

    // Formule de base: 30ml par kg de poids corporel
    let baseNeeds = weightNum * 30;

    // Plus d'ajustement pour le climat - sera fait dans la page d'accueil
    const result = Math.round(baseNeeds);

    setCalculatedWaterNeeds(result);
  };

  const applyCalculation = () => {
    if (calculatedWaterNeeds > 0) {
      // Arrondir à la centaine de millilitres la plus proche
      const roundedWaterNeeds = Math.round(calculatedWaterNeeds / 100) * 100;
      updateSettings({ dailyGoal: roundedWaterNeeds });
      Alert.alert(
        'Objectif mis à jour',
        `Votre objectif d'hydratation a été défini à ${roundedWaterNeeds} ml par jour.`,
        [{ text: 'OK' }]
      );
    }
  };

  const showHelpModal = (title: React.SetStateAction<string>, content: React.SetStateAction<string>) => {
    setHelpTitle(title);
    setHelpContent(content);
    setShowHelp(true);
  };

  const toggleReminders = () => {
    const newValue = !remindersEnabled;
    setRemindersEnabled(newValue);
    updateSettings({ remindersEnabled: newValue });
  };

  const toggleUnit = () => {
    const newUnit = preferredUnit === 'ml' ? 'oz' : 'ml';
    setPreferredUnit(newUnit);
    updateSettings({ preferredUnit: newUnit });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Calculator size={32} color={colors.primary[500]} />
            <View style={styles.titleTextContainer}>
              <Text style={[styles.title, { color: colors.text }]}>
                Calculateur d'hydratation
              </Text>
              <Text style={[styles.subtitle, { color: colors.neutral[500] }]}>
                Personnalisez votre objectif quotidien
              </Text>
            </View>
          </View>
        </View>

        <Animated.View
          entering={FadeInDown.delay(100)}
          style={[styles.card, { backgroundColor: colors.cardBackground }]}
        >
          {/* Paramètres physiques - Simplifié à seulement le poids */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Calcul basé sur votre poids
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Poids (kg)
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.background,
                    borderColor: colors.primary[200],
                  },
                ]}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                maxLength={3}
                placeholder="kg"
                placeholderTextColor={colors.neutral[400]}
              />
              <TouchableOpacity
                style={[
                  styles.helpButton,
                  { backgroundColor: colors.primary[100] },
                ]}
                onPress={() =>
                  showHelpModal(
                    'Poids corporel',
                    "La formule nutritionnelle recommande environ 30 ml d'eau par kilogramme de poids corporel par jour. C'est la base du calcul de vos besoins en hydratation."
                  )
                }
              >
                <HelpCircle size={16} color={colors.primary[600]} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formulaContainer}>
            <Text style={[styles.formulaText, { color: colors.primary[700] }]}>
              Formule: 30 ml × poids (kg)
            </Text>
          </View>

          <View style={styles.infoBox}>
            <AlertCircle
              size={16}
              color={colors.primary[400]}
              style={styles.infoIcon}
            />
            <Text style={[styles.infoText, { color: colors.neutral[700] }]}>
              Les ajustements pour la température et l'activité physique peuvent
              être faits sur l'écran d'accueil.
            </Text>
          </View>
        </Animated.View>

        {/* Suppression de la section Climat - sera implémentée sur l'écran d'accueil */}

        <Animated.View
          entering={FadeInDown.delay(300)}
          style={[styles.resultCard, { backgroundColor: colors.primary[50] }]}
        >
          <Text style={[styles.resultTitle, { color: colors.text }]}>
            Besoin quotidien estimé
          </Text>

          <Text style={[styles.resultValue, { color: colors.primary[600] }]}>
            {calculatedWaterNeeds > 0
              ? `${calculatedWaterNeeds} ml`
              : 'Remplissez votre poids'}
          </Text>

          {calculatedWaterNeeds > 0 && (
            <Text
              style={[styles.resultSubtext, { color: colors.neutral[600] }]}
            >
              Sera arrondi à {Math.round(calculatedWaterNeeds / 100) * 100} ml
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.applyButton,
              { backgroundColor: colors.primary[500] },
              calculatedWaterNeeds <= 0 && { opacity: 0.5 },
            ]}
            onPress={applyCalculation}
            disabled={calculatedWaterNeeds <= 0}
          >
            <Text style={styles.applyButtonText}>
              Définir comme objectif quotidien
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Bouton Paramètres avancés */}
        <TouchableOpacity
          style={[
            styles.advancedSettingsButton,
            { borderColor: colors.neutral[300] },
          ]}
          onPress={() => setShowAdvancedSettings(!showAdvancedSettings)}
        >
          <Text style={[styles.advancedSettingsText, { color: colors.text }]}>
            {showAdvancedSettings
              ? 'Masquer les paramètres avancés'
              : 'Afficher les paramètres avancés'}
          </Text>
        </TouchableOpacity>

        {/* Paramètres avancés */}
        {showAdvancedSettings && (
          <Animated.View
            entering={FadeInDown}
            style={[styles.card, { backgroundColor: colors.cardBackground }]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Paramètres avancés
            </Text>

            {/* Rappels */}
            <TouchableOpacity style={styles.setting} onPress={toggleReminders}>
              <View style={styles.settingInfo}>
                {remindersEnabled ? (
                  <Bell color={colors.text} size={24} />
                ) : (
                  <BellOff color={colors.text} size={24} />
                )}
                <Text style={[styles.settingText, { color: colors.text }]}>
                  {remindersEnabled ? 'Rappels activés' : 'Rappels désactivés'}
                </Text>
              </View>
              <Switch
                value={remindersEnabled}
                onValueChange={toggleReminders}
                trackColor={{
                  false: colors.neutral[200],
                  true: colors.primary[200],
                }}
                thumbColor={
                  remindersEnabled ? colors.primary[500] : colors.neutral[50]
                }
              />
            </TouchableOpacity>

            {/* Unité préférée */}
            <TouchableOpacity style={styles.setting} onPress={toggleUnit}>
              <View style={styles.settingInfo}>
                <Scale color={colors.text} size={24} />
                <Text style={[styles.settingText, { color: colors.text }]}>
                  Unité: {preferredUnit.toUpperCase()}
                </Text>
              </View>
              <Switch
                value={preferredUnit === 'ml'}
                onValueChange={toggleUnit}
                trackColor={{
                  false: colors.neutral[200],
                  true: colors.primary[200],
                }}
                thumbColor={
                  preferredUnit === 'ml'
                    ? colors.primary[500]
                    : colors.neutral[50]
                }
              />
            </TouchableOpacity>

            {/* Mode sombre - garder la fonctionnalité */}
            <TouchableOpacity style={styles.setting} onPress={() => {}}>
              <View style={styles.settingInfo}>
                {isDarkMode ? (
                  <Moon color={colors.text} size={24} />
                ) : (
                  <Sun color={colors.text} size={24} />
                )}
                <Text style={[styles.settingText, { color: colors.text }]}>
                  {isDarkMode ? 'Mode sombre activé' : 'Mode clair activé'}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      {/* Modal d'aide */}
      <Modal
        visible={showHelp}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHelp(false)}
      >
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {helpTitle}
            </Text>

            <Text style={[styles.modalText, { color: colors.text }]}>
              {helpContent}
            </Text>

            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: colors.primary[500] },
              ]}
              onPress={() => setShowHelp(false)}
            >
              <Text style={styles.modalButtonText}>Compris</Text>
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
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 200,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  helpButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  genderButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  sliderValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginTop: 12,
  },
  resultCard: {
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    marginBottom: 12,
  },
  resultValue: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  resultSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  formulaContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  formulaText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  climateTip: {
    marginTop: 16,
    alignItems: 'center',
  },
  climateTipText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
  applyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  applyButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  advancedSettingsButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 16,
  },
  advancedSettingsText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
    marginBottom: 20,
  },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  // Additional settings styles
  setting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginLeft: 12,
  },
  infoBox: {
    backgroundColor: 'rgba(66, 153, 225, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
});
