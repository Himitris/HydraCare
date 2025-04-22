import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Platform,
  Dimensions,
  Switch,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withSpring,
} from 'react-native-reanimated';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';
import WaterGlass from '@/components/WaterGlass';
import ZenButton from '@/components/ZenButton';
import { Minus, CheckCircle } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from '@/i18n/hooks/useTranslation';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const { settings, dailyProgress, addWaterIntake, isDarkMode } =
    useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const [correctionMode, setCorrectionMode] = useState(false);
  const { t } = useTranslation();

  // Animations
  const backgroundOpacity = useSharedValue(0.8);
  const backgroundTranslateY = useSharedValue(0);
  const correctionModeOpacity = useSharedValue(0);
  const correctionModeScale = useSharedValue(0.95);

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

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
    transform: [{ translateY: backgroundTranslateY.value }],
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
    t('quotes.q1'),
    t('quotes.q2'),
    t('quotes.q3'),
    t('quotes.q4'),
    t('quotes.q5'),
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

  const handleWaterChange = (amount: number) => {
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
                {formattedCurrent}
              </Text>
              <Text style={[styles.unit, { color: colors.primary[500] }]}>
                {settings.preferredUnit}
              </Text>
              <Text style={[styles.goalText, { color: colors.neutral[400] }]}>
                {t('home.of')} {formattedGoal}
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
                  {t('home.wellDone')}
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
              onPress={() =>
                dailyProgress > 0 && setCorrectionMode(!correctionMode)
              }
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
                  {t('home.correction')}
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
                label={t('home.cup')}
                onPress={() => handleWaterChange(200)}
                correctionMode={correctionMode}
                compact={true}
              />
              <ZenButton
                amount={300}
                label={t('home.glass')}
                onPress={() => handleWaterChange(300)}
                correctionMode={correctionMode}
                compact={true}
              />
              <ZenButton
                amount={500}
                label={t('home.bottle')}
                onPress={() => handleWaterChange(500)}
                correctionMode={correctionMode}
                compact={true}
              />
              <ZenButton
                amount={1000}
                label={t('home.large')}
                onPress={() => handleWaterChange(1000)}
                correctionMode={correctionMode}
                compact={true}
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
    height: 160,
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
