import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Platform,
  Dimensions,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';
import WaterGlass from '@/components/WaterGlass';
import ZenButton from '@/components/ZenButton';
import { Minus, CheckCircle } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const { settings, dailyProgress, addWaterIntake, isDarkMode } =
    useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const [correctionMode, setCorrectionMode] = useState(false);

  // Subtle background animation
  const backgroundOpacity = useSharedValue(0.8);

  useEffect(() => {
    backgroundOpacity.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  // Format amounts
  const formattedGoal =
    settings.preferredUnit === 'ml'
      ? `${settings.dailyGoal} ml`
      : `${Math.round(settings.dailyGoal * 0.033814)} oz`;

  const currentAmount = Math.round(dailyProgress * settings.dailyGoal);
  const formattedCurrent =
    settings.preferredUnit === 'ml'
      ? `${currentAmount}`
      : `${Math.round(currentAmount * 0.033814)}`;

  // Zen quotes that rotate daily
  const zenQuotes = [
    'Be like water, flowing effortlessly through life',
    'Still water runs deep',
    "Water is life's matter and matrix",
    'The softest thing overcomes the hardest',
    'When the water is calm, clarity comes',
  ];

  const quoteIndex = new Date().getDay() % zenQuotes.length;

  // Check if goal is reached
  const goalReached = dailyProgress >= 1;

  // Automatically disable correction mode when at 0
  useEffect(() => {
    if (dailyProgress <= 0 && correctionMode) {
      setCorrectionMode(false);
    }
  }, [dailyProgress]);

  const handleWaterChange = (amount: number) => {
    if (correctionMode) {
      // Prevent going below 0
      const currentTotal = dailyProgress * settings.dailyGoal;
      if (currentTotal - amount >= 0) {
        addWaterIntake(-amount);
      }
    } else {
      // Prevent going above goal (or show celebration if we do)
      const currentTotal = dailyProgress * settings.dailyGoal;
      if (currentTotal + amount <= settings.dailyGoal * 1.1) {
        // Allow 10% over
        addWaterIntake(amount);
      }
    }
  };

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
      />

      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />

        <View style={styles.content}>
          {/* Zen header */}
          <View style={styles.header}>
            <Text style={[styles.greeting, { color: colors.neutral[600] }]}>
              {new Date().getHours() < 12
                ? 'Good morning'
                : new Date().getHours() < 18
                ? 'Good afternoon'
                : 'Good evening'}
            </Text>
            <Text style={[styles.mainText, { color: colors.text }]}>
              {goalReached ? 'Goal Achieved! 🎉' : 'Stay hydrated'}
            </Text>
          </View>

          {/* Main glass animation */}
          <View style={styles.glassSection}>
            <WaterGlass progress={Math.min(dailyProgress, 1)} />

            {/* Amount display */}
            <View style={styles.amountContainer}>
              <Text
                style={[styles.currentAmount, { color: colors.primary[600] }]}
              >
                {formattedCurrent}
              </Text>
              <Text style={[styles.unit, { color: colors.primary[500] }]}>
                {settings.preferredUnit}
              </Text>
              <Text style={[styles.goalText, { color: colors.neutral[400] }]}>
                of {formattedGoal}
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
                  Well done! You've reached your daily hydration goal
                </Text>
              </View>
            )}
          </View>

          {/* Correction mode toggle - only show if progress > 0 */}
          {dailyProgress > 0 && (
            <View style={styles.correctionContainer}>
              <View style={styles.correctionContent}>
                <View style={styles.correctionTextContainer}>
                  <Minus
                    size={18}
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
                    Correction mode
                  </Text>
                </View>
                <Switch
                  value={correctionMode}
                  onValueChange={setCorrectionMode}
                  trackColor={{
                    false: colors.neutral[200],
                    true: colors.error[200],
                  }}
                  thumbColor={
                    correctionMode ? colors.error[500] : colors.neutral[50]
                  }
                />
              </View>
            </View>
          )}

          {/* Zen buttons */}
          <View style={styles.buttonSection}>
            <View style={styles.buttonRow}>
              <ZenButton
                amount={200}
                label="Cup"
                onPress={() => handleWaterChange(200)}
                correctionMode={correctionMode}
                compact={height < 700}
              />
              <ZenButton
                amount={300}
                label="Glass"
                onPress={() => handleWaterChange(300)}
                correctionMode={correctionMode}
                compact={height < 700}
              />
            </View>
            <View style={styles.buttonRow}>
              <ZenButton
                amount={500}
                label="Bottle"
                onPress={() => handleWaterChange(500)}
                correctionMode={correctionMode}
                compact={height < 700}
              />
              <ZenButton
                amount={1000}
                label="Large"
                onPress={() => handleWaterChange(1000)}
                correctionMode={correctionMode}
                compact={height < 700}
              />
            </View>
          </View>

          {/* Zen quote footer */}
          <View style={styles.footer}>
            <Text style={[styles.quote, { color: colors.neutral[500] }]}>
              "{zenQuotes[quoteIndex]}"
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.3,
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
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
    paddingTop: Platform.OS === 'ios' ? 10 : 30,
    marginBottom: 10,
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  mainText: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.5,
  },
  glassSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 16,
  },
  currentAmount: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    letterSpacing: -1,
  },
  unit: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
    marginRight: 12,
  },
  goalText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  celebrationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
  },
  celebrationText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
  },
  correctionContainer: {
    paddingHorizontal: 30,
    marginVertical: 12,
  },
  correctionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 12,
  },
  correctionTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  correctionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
  },
  buttonSection: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  footer: {
    paddingHorizontal: 40,
    paddingTop: 10,
    paddingBottom: 20,
    alignItems: 'center',
  },
  quote: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: 0.5,
    opacity: 0.8,
  },
});
