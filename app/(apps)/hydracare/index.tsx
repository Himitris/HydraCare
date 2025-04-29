import WaterGlass from '@/components/hydracare/WaterGlass';
import ZenButton from '@/components/hydracare/ZenButton';
import Colors from '@/constants/Colors';
import { useAppContext } from '@/context/AppContext';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { CheckCircle, Minus, ThermometerIcon } from 'lucide-react-native';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const { 
    settings, 
    dailyProgress, 
    addWaterIntake, 
    isDarkMode, 
    updateSettings, 
    currentDailyGoal 
  } = useAppContext();

  // Mémoriser les couleurs pour éviter des recalculs inutiles quand isDarkMode change
  const colors = useMemo(
    () => (isDarkMode ? Colors.dark : Colors.light),
    [isDarkMode]
  );

  const [correctionMode, setCorrectionMode] = useState(false);
  
  // Ajustement climatique
  const [showClimateAdjuster, setShowClimateAdjuster] = useState(false);
  const [temperatureLevel, setTemperatureLevel] = useState(0); // 0: normal, 1: >25°C, 2: >30°C, 3: >35°C
  const [physicalActivity, setPhysicalActivity] = useState(false); // true: activité physique intense

  // Animations
  const backgroundOpacity = useSharedValue(0.8);
  const backgroundTranslateY = useSharedValue(0);
  const correctionModeOpacity = useSharedValue(0);
  const correctionModeScale = useSharedValue(0.95);

  // Calcul de l'ajustement total
  const calculatedAdjustment = useMemo(() => {
    let adjustment = 0;
    
    // Ajustement basé sur la température
    if (temperatureLevel === 1) adjustment = 500; // +0,5L si >25°C
    else if (temperatureLevel === 2) adjustment = 1000; // +1L si >30°C
    else if (temperatureLevel === 3) adjustment = 1500; // +1,5L si >35°C
    
    // Ajustement supplémentaire pour l'activité physique
    if (physicalActivity) adjustment += 2000; // +2L pour activité physique intense
    
    return adjustment;
  }, [temperatureLevel, physicalActivity]);

  // Appliquer l'ajustement climatique
  const applyClimateAdjustment = useCallback(() => {
    if (calculatedAdjustment > 0) {
      // Appliquer via le context
      updateSettings({ temporaryGoalAdjustment: calculatedAdjustment });
      
      // Fermer le panneau d'ajustement
      setShowClimateAdjuster(false);
      
      // Afficher une confirmation
      Alert.alert(
        "Ajustement appliqué",
        `Votre objectif d'aujourd'hui a été ajusté à ${settings.dailyGoal + calculatedAdjustment} ml en raison des conditions climatiques.`,
        [{ text: "OK" }]
      );
    } else {
      // Si aucun ajustement n'est appliqué, simplement réinitialiser
      updateSettings({ temporaryGoalAdjustment: 0 });
      setShowClimateAdjuster(false);
      
      Alert.alert(
        "Ajustement réinitialisé",
        "Votre objectif d'hydratation est revenu à sa valeur de base.",
        [{ text: "OK" }]
      );
    }
  }, [calculatedAdjustment, settings.dailyGoal, updateSettings]);

  // Setup background animations only once
  useEffect(() => {
    // Background wave animation
    backgroundOpacity.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    backgroundTranslateY.value = withRepeat(
      withTiming(30, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  // Animation styles for background
  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
    transform: [{ translateY: backgroundTranslateY.value }],
  }));

  // Format amounts - useMemo pour éviter de recalculer les valeurs à chaque rendu
  const formattedValues = useMemo(() => {
    const formattedGoal =
      settings.preferredUnit === 'ml'
        ? `${currentDailyGoal} ml`
        : `${Math.round(currentDailyGoal * 0.033814)} oz`;

    const currentAmount = Math.round(dailyProgress * currentDailyGoal);
    const formattedCurrent =
      settings.preferredUnit === 'ml'
        ? `${currentAmount}`
        : `${Math.round(currentAmount * 0.033814)}`;

    return { formattedGoal, formattedCurrent };
  }, [settings.preferredUnit, currentDailyGoal, dailyProgress]);

  // Zen quotes that rotate daily - useMemo pour éviter de recalculer à chaque rendu
  const zenQuote = useMemo(() => {
    const zenQuotes = [
      "Soyez comme l'eau, fluide dans votre parcours à travers la vie",
      "L'eau calme coule profondément",
      "L'eau est la matière et la matrice de la vie",
      'La chose la plus douce surmonte la plus dure',
      "Quand l'eau est calme, la clarté vient",
    ];
    const quoteIndex = new Date().getDay() % zenQuotes.length;
    return zenQuotes[quoteIndex];
  }, []); // Plus besoin de dépendre de la fonction de traduction

  // Check if goal is reached - useMemo pour éviter de recalculer à chaque rendu
  const goalReached = useMemo(() => dailyProgress >= 1, [dailyProgress]);

  // Automatically disable correction mode when at 0
  useEffect(() => {
    if (dailyProgress <= 0 && correctionMode) {
      setCorrectionMode(false);
    }
  }, [dailyProgress, correctionMode]);

  // Animate correction mode toggle
  useEffect(() => {
    if (dailyProgress > 0) {
      correctionModeOpacity.value = withTiming(1, { duration: 300 });
      correctionModeScale.value = withSpring(1, { damping: 12 });
    } else {
      correctionModeOpacity.value = withTiming(0, { duration: 300 });
      correctionModeScale.value = withSpring(0.95, { damping: 12 });
    }
  }, [dailyProgress]);

  const correctionModeStyle = useAnimatedStyle(() => ({
    opacity: correctionModeOpacity.value,
    transform: [{ scale: correctionModeScale.value }],
  }));

  // handleWaterChange optimisé avec useCallback pour éviter de recréer la fonction à chaque render
  const handleWaterChange = useCallback(
    (amount: number) => {
      if (correctionMode) {
        const currentTotal = dailyProgress * currentDailyGoal;
        if (currentTotal - amount >= 0) {
          addWaterIntake(-amount);
        }
      } else {
        const currentTotal = dailyProgress * currentDailyGoal;
        if (currentTotal + amount <= currentDailyGoal * 1.1) {
          addWaterIntake(amount);
        }
      }
    },
    [correctionMode, dailyProgress, currentDailyGoal, addWaterIntake]
  );

  // Toggle correction mode avec useCallback
  const toggleCorrectionMode = useCallback(() => {
    if (dailyProgress > 0) {
      setCorrectionMode((prev) => !prev);
    }
  }, [dailyProgress]);

  return (
    <View style={styles.container}>
      {/* Gradient background */}
      <LinearGradient
        colors={
          isDarkMode
            ? [colors.background, colors.primary[50]]
            : [colors.primary[50], colors.background]
        }
        locations={[0, 0.8]}
        style={StyleSheet.absoluteFill}
      />

      {/* Animated background layer */}
      <Animated.View
        style={[
          styles.backgroundPattern,
          backgroundStyle,
          { backgroundColor: colors.primary[100] + '10' },
        ]}
      >
        <Svg width={width} height={height * 0.25} viewBox="0 0 400 200">
          <Path
            d={`M0,100
               C100,${80 + Math.sin(Date.now() / 1000) * 10}
               300,${120 + Math.sin(Date.now() / 2000) * 10}
               400,100
               L400,200 L0,200 Z`}
            fill={colors.primary[100] + '30'}
          />
        </Svg>
      </Animated.View>

      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />

        <View style={styles.content}>
          {/* Logo instead of text header */}
          <View style={styles.header}>
            <Image
              source={require('../../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Main glass animation */}
          <View style={styles.glassSection}>
            <WaterGlass progress={Math.min(dailyProgress, 1)} />

            {/* Amount display */}
            <View style={styles.amountContainer}>
              <Text
                style={[styles.currentAmount, { color: colors.primary[600] }]}
              >
                {formattedValues.formattedCurrent}
              </Text>
              <Text style={[styles.unit, { color: colors.primary[500] }]}>
                {settings.preferredUnit}
              </Text>
              <Text style={[styles.goalText, { color: colors.neutral[400] }]}>
                sur {formattedValues.formattedGoal}
              </Text>
            </View>

            {goalReached && (
              <View style={styles.celebrationContainer}>
                <CheckCircle size={24} color={colors.success[500]} />
                <Text
                  style={[
                    styles.celebrationText,
                    { color: colors.success[600] },
                  ]}
                >
                  Bravo ! Vous avez atteint votre objectif quotidien
                  d'hydratation
                </Text>
              </View>
            )}
          </View>

          {/* Bouton d'ajustement climatique */}
          <TouchableOpacity
            style={[
              styles.climateButton,
              { backgroundColor: colors.primary[100] + 'CC' }
            ]}
            onPress={() => setShowClimateAdjuster(!showClimateAdjuster)}
          >
            <ThermometerIcon size={22} color={colors.primary[500]} />
            <Text style={[styles.climateButtonText, { color: colors.primary[600] }]}>
              {settings.temporaryGoalAdjustment > 0 
                ? "Ajustement actif" 
                : "Ajuster pour aujourd'hui"}
            </Text>
          </TouchableOpacity>

          {/* Panneau d'ajustement climatique */}
          {showClimateAdjuster && (
            <Animated.View
              entering={FadeInDown}
              style={[
                styles.climatePanel,
                { backgroundColor: colors.cardBackground }
              ]}
            >
              <Text style={[styles.climatePanelTitle, { color: colors.text }]}>
                Conditions du jour
              </Text>
              
              <View style={styles.temperatureSelector}>
                <Text style={[styles.temperatureLabel, { color: colors.neutral[600] }]}>
                  Température
                </Text>
                <View style={styles.temperatureOptions}>
                  <TouchableOpacity
                    style={[
                      styles.temperatureOption,
                      temperatureLevel === 0 && { backgroundColor: colors.primary[100] }
                    ]}
                    onPress={() => setTemperatureLevel(0)}
                  >
                    <Text style={[
                      styles.temperatureOptionText,
                      { color: temperatureLevel === 0 ? colors.primary[600] : colors.neutral[500] }
                    ]}>
                      Normal
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.temperatureOption,
                      temperatureLevel === 1 && { backgroundColor: colors.warning[100] }
                    ]}
                    onPress={() => setTemperatureLevel(1)}
                  >
                    <Text style={[
                      styles.temperatureOptionText,
                      { color: temperatureLevel === 1 ? colors.warning[600] : colors.neutral[500] }
                    ]}>
                      >25°C
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.temperatureOption,
                      temperatureLevel === 2 && { backgroundColor: colors.warning[200] }
                    ]}
                    onPress={() => setTemperatureLevel(2)}
                  >
                    <Text style={[
                      styles.temperatureOptionText,
                      { color: temperatureLevel === 2 ? colors.warning[700] : colors.neutral[500] }
                    ]}>
                      >30°C
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.temperatureOption,
                      temperatureLevel === 3 && { backgroundColor: colors.error[100] }
                    ]}
                    onPress={() => setTemperatureLevel(3)}
                  >
                    <Text style={[
                      styles.temperatureOptionText,
                      { color: temperatureLevel === 3 ? colors.error[600] : colors.neutral[500] }
                    ]}>
                      >35°C
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.activitySelector}>
                <Text style={[styles.activityLabel, { color: colors.neutral[600] }]}>
                  Activité physique intense (>1h)
                </Text>
                <Switch
                  value={physicalActivity}
                  onValueChange={setPhysicalActivity}
                  trackColor={{
                    false: colors.neutral[200],
                    true: colors.success[200],
                  }}
                  thumbColor={
                    physicalActivity ? colors.success[500] : colors.neutral[50]
                  }
                />
              </View>
              
              <View style={styles.adjustmentSummary}>
                <Text style={[styles.adjustmentLabel, { color: colors.neutral[600] }]}>
                  Ajustement total:
                </Text>
                <Text style={[styles.adjustmentValue, { color: colors.primary[600] }]}>
                  {(temperatureLevel === 1 ? "+0.5L" : temperatureLevel === 2 ? "+1.0L" : temperatureLevel === 3 ? "+1.5L" : "+0.0L")}
                  {physicalActivity ? " +2.0L" : ""}
                </Text>
              </View>
              
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: colors.primary[500] }]}
                onPress={applyClimateAdjustment}
              >
                <Text style={styles.applyButtonText}>
                  {calculatedAdjustment > 0 ? "Appliquer l'ajustement" : "Réinitialiser l'ajustement"}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Correction mode toggle - animated */}
          <Animated.View
            style={[styles.correctionContainer, correctionModeStyle]}
          >
            <TouchableOpacity
              style={[
                styles.correctionContent,
                {
                  backgroundColor: correctionMode
                    ? colors.error[50] + 'CC'
                    : 'rgba(255, 255, 255, 0.8)',
                },
              ]}
              onPress={toggleCorrectionMode}
              activeOpacity={0.8}
            >
              <View style={styles.correctionTextContainer}>
                <Minus
                  size={16}
                  color={
                    correctionMode ? colors.error[500] : colors.neutral[400]
                  }
                />
                <Text
                  style={[
                    styles.correctionText,
                    {
                      color: correctionMode
                        ? colors.error[500]
                        : colors.neutral[600],
                    },
                  ]}
                >
                  Correction
                </Text>
              </View>
              <Switch
                value={correctionMode}
                onValueChange={(value) => {
                  if (dailyProgress > 0) {
                    setCorrectionMode(value);
                  }
                }}
                trackColor={{
                  false: colors.neutral[200],
                  true: colors.error[200],
                }}
                thumbColor={
                  correctionMode ? colors.error[500] : colors.neutral[50]
                }
                disabled={dailyProgress <= 0}
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Zen buttons */}
          <View style={styles.buttonSection}>
            <View style={styles.buttonRow}>
              <ZenButton
                amount={200}
                label="Tasse"
                onPress={() => handleWaterChange(200)}
                correctionMode={correctionMode}
                compact={true}
              />
              <ZenButton
                amount={300}
                label="Verre"
                onPress={() => handleWaterChange(300)}
                correctionMode={correctionMode}
                compact={true}
              />
              <ZenButton
                amount={500}
                label="Bouteille"
                onPress={() => handleWaterChange(500)}
                correctionMode={correctionMode}
                compact={true}
              />
              <ZenButton
                amount={1000}
                label="Grand"
                onPress={() => handleWaterChange(1000)}
                correctionMode={correctionMode}
                compact={true}
              />
            </View>
          </View>

          {/* Zen quote footer */}
          <View style={styles.footer}>
            <Text style={[styles.quote, { color: colors.neutral[500] }]}>
              "{zenQuote}"
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// Styles extraits en dehors du composant pour éviter de les recréer à chaque rendu
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.25,
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    paddingHorizontal: 30,
    paddingTop: Platform.OS === 'ios' ? 8 : 20,
    marginBottom: 5,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  mainText: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.5,
  },
  glassSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginTop: -10,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12,
  },
  currentAmount: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    letterSpacing: -1,
  },
  unit: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginLeft: 6,
    marginRight: 10,
  },
  goalText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  celebrationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
  },
  celebrationText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    marginLeft: 6,
  },
  correctionContainer: {
    paddingHorizontal: 30,
    marginTop: 8,
    marginBottom: 0,
  },
  correctionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    padding: 10,
  },
  correctionTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    marginTop: 30,
    height: 110,
  },
  correctionText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    marginLeft: 6,
  },
  buttonSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 40,
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'center',
  },
  quote: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  
  // Styles pour l'ajustement climatique
  climateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 16,
  },
  climateButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
  },
  climatePanel: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  climatePanelTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
    textAlign: 'center',
  },
  temperatureSelector: {
    marginBottom: 16,
  },
  temperatureLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  temperatureOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  temperatureOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  temperatureOptionText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  activitySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  adjustmentSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  adjustmentLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  adjustmentValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  applyButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});