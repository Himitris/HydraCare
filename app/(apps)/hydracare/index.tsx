import WaterGlass from '@/components/hydracare/WaterGlass';
import ZenButton from '@/components/hydracare/ZenButton';
import Colors from '@/constants/Colors';
import { useAppContext } from '@/context/AppContext';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { CheckCircle, Minus } from 'lucide-react-native';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
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
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const { settings, dailyProgress, addWaterIntake, isDarkMode } =
    useAppContext();

  // Mémoriser les couleurs pour éviter des recalculs inutiles quand isDarkMode change
  const colors = useMemo(
    () => (isDarkMode ? Colors.dark : Colors.light),
    [isDarkMode]
  );

  const [correctionMode, setCorrectionMode] = useState(false);

  // Animations
  const backgroundOpacity = useSharedValue(0.8);
  const backgroundTranslateY = useSharedValue(0);
  const correctionModeOpacity = useSharedValue(0);
  const correctionModeScale = useSharedValue(0.95);

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
        ? `${settings.dailyGoal} ml`
        : `${Math.round(settings.dailyGoal * 0.033814)} oz`;

    const currentAmount = Math.round(dailyProgress * settings.dailyGoal);
    const formattedCurrent =
      settings.preferredUnit === 'ml'
        ? `${currentAmount}`
        : `${Math.round(currentAmount * 0.033814)}`;

    return { formattedGoal, formattedCurrent };
  }, [settings.preferredUnit, settings.dailyGoal, dailyProgress]);

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
        const currentTotal = dailyProgress * settings.dailyGoal;
        if (currentTotal - amount >= 0) {
          addWaterIntake(-amount);
        }
      } else {
        const currentTotal = dailyProgress * settings.dailyGoal;
        if (currentTotal + amount <= settings.dailyGoal * 1.1) {
          addWaterIntake(amount);
        }
      }
    },
    [correctionMode, dailyProgress, settings.dailyGoal, addWaterIntake]
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
});
