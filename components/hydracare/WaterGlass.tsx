import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
  withSpring,
  useAnimatedSensor,
  SensorType,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';
import Svg, {
  Path,
  Defs,
  RadialGradient,
  Stop,
  Circle,
} from 'react-native-svg';

interface WaterGlassProps {
  progress: number;
}

const { width, height } = Dimensions.get('window');
// Defining constants outside of component (not using hooks here)
const GLASS_HEIGHT = height * 0.28;
const GLASS_WIDTH = width * 0.5;

export default function WaterGlass({ progress }: WaterGlassProps) {
  const { isDarkMode } = useAppContext();
  // Mémorise le thème de couleurs pour éviter des recalculs inutiles quand isDarkMode change
  const colors = isDarkMode ? Colors.dark : Colors.light;

  // Animation values
  const waterLevel = useSharedValue(0);
  const waveOffset = useSharedValue(0);
  const waveOffset2 = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const bubbleY1 = useSharedValue(0);
  const bubbleY2 = useSharedValue(0);
  const bubbleY3 = useSharedValue(0);
  const splashEffect = useSharedValue(0);

  // Gyroscope sensor for fluid dynamics
  const gyroscope = useAnimatedSensor(SensorType.GYROSCOPE, { interval: 100 });

  // Handle water level changes with splash effect
  useEffect(() => {
    const previousLevel = waterLevel.value;

    // Animate water level
    waterLevel.value = withSpring(progress, {
      damping: 12,
      stiffness: 100,
      mass: 0.5,
    });

    // Trigger splash if water level changed significantly
    if (Math.abs(progress - previousLevel) > 0.02) {
      splashEffect.value = withSequence(
        withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) })
      );
    }
  }, [progress]);

  // Gentle wave animations - séparées dans un effet pour mieux isoler les dépendances
  useEffect(() => {
    waveOffset.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    waveOffset2.value = withRepeat(
      withTiming(1, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    shimmer.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.ease }),
      -1,
      true
    );
  }, []);

  // Bubble animations dans un effet séparé
  useEffect(() => {
    // Factorisation de la fonction d'animation pour éviter la duplication
    const animateBubble = (
      bubbleValue: Animated.SharedValue<number>,
      delay: number,
      duration: number
    ) => {
      bubbleValue.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(1, {
            duration: duration,
            easing: Easing.linear,
          })
        ),
        -1
      );
    };

    animateBubble(bubbleY1, 0, 2500);
    animateBubble(bubbleY2, 900, 2800);
    animateBubble(bubbleY3, 1800, 3200);
  }, []);

  // Animated styles for water
  const waterStyle = useAnimatedStyle(() => ({
    height: `${waterLevel.value * 100}%`,
  }));

  // Gyroscope-based water tilt animation
  const waterTiltStyle = useAnimatedStyle(() => {
    const tiltX = interpolate(gyroscope.sensor.value.y, [-0.5, 0.5], [-10, 10]);
    const tiltY = interpolate(gyroscope.sensor.value.x, [-0.5, 0.5], [5, -5]);

    return {
      transform: [
        { translateX: withSpring(tiltX, { damping: 20, stiffness: 90 }) },
        { rotateZ: `${tiltY}deg` },
      ],
    };
  });

  // Wave animation styles
  const waveStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(waveOffset.value, [0, 1], [0, -8]),
      },
      {
        translateX: interpolate(waveOffset.value, [0, 1], [-10, 10]),
      },
      {
        skewX: `${interpolate(waveOffset.value, [0, 0.5, 1], [0, 10, 0])}deg`,
      },
    ],
  }));

  const waveStyle2 = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(waveOffset2.value, [0, 1], [0, -6]),
      },
      {
        translateX: interpolate(waveOffset2.value, [0, 1], [10, -10]),
      },
      {
        skewX: `${interpolate(waveOffset2.value, [0, 0.5, 1], [0, -8, 0])}deg`,
      },
    ],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
    transform: [
      {
        translateX: interpolate(shimmer.value, [0, 1], [-20, 20]),
      },
    ],
  }));

  const splashStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(splashEffect.value, [0, 1], [1, 1.3]) }],
    opacity: interpolate(splashEffect.value, [0, 1], [0, 0.4]),
  }));

  // Factorisation de la création du style des bulles
  const createBubbleStyle = (
    bubbleValue: Animated.SharedValue<number>,
    offsetX: number
  ) => {
    return useAnimatedStyle(() => ({
      transform: [
        {
          translateY: interpolate(
            bubbleValue.value,
            [0, 1],
            [0, -GLASS_HEIGHT * 0.7]
          ),
        },
        {
          translateX: interpolate(
            bubbleValue.value,
            [0, 0.5, 1],
            [0, offsetX, 0]
          ),
        },
        { scale: interpolate(bubbleValue.value, [0, 0.5, 1], [0.3, 1, 0.3]) },
      ],
      opacity: interpolate(bubbleValue.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
    }));
  };

  const bubble1Style = createBubbleStyle(bubbleY1, 8);
  const bubble2Style = createBubbleStyle(bubbleY2, -10);
  const bubble3Style = createBubbleStyle(bubbleY3, 6);

  return (
    <View style={styles.container}>
      {/* Background glow */}
      <View
        style={[
          styles.glowBackground,
          {
            backgroundColor: colors.primary[50],
            shadowColor: colors.primary[300],
          },
        ]}
      />

      {/* Organic glass shape */}
      <Svg width={GLASS_WIDTH} height={GLASS_HEIGHT} viewBox="0 0 200 260">
        <Defs>
          <RadialGradient id="glassGradient" cx="50%" cy="30%" r="70%">
            <Stop
              offset="0%"
              stopColor={colors.primary[100]}
              stopOpacity="0.4"
            />
            <Stop
              offset="100%"
              stopColor={colors.primary[200]}
              stopOpacity="0.15"
            />
          </RadialGradient>
        </Defs>

        {/* Glass body with rounded bottom */}
        <Path
          d="M30 50 Q 20 80, 20 180 Q 20 240, 100 240 Q 180 240, 180 180 Q 180 80, 170 50 Q 160 40, 100 35 Q 40 40, 30 50 Z"
          fill="url(#glassGradient)"
          stroke={colors.primary[200]}
          strokeWidth="1.5"
          strokeOpacity="0.6"
        />

        {/* Glass rim */}
        <Path
          d="M30 50 Q 100 40, 170 50"
          fill="none"
          stroke={colors.primary[300]}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </Svg>

      {/* Water container with mask */}
      <View style={styles.waterContainer}>
        <Animated.View style={[styles.waterMask, waterStyle]}>
          <Animated.View style={[StyleSheet.absoluteFill, waterTiltStyle]}>
            <LinearGradient
              colors={[
                colors.primary[300],
                colors.primary[400],
                colors.primary[500],
              ]}
              locations={[0, 0.5, 1]}
              style={styles.water}
            >
              {/* Splash effect */}
              <Animated.View style={[styles.splash, splashStyle]} />

              {/* Dynamic waves */}
              <Animated.View style={[styles.wave, waveStyle]}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.4)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.waveGradient}
                />
              </Animated.View>

              <Animated.View style={[styles.wave2, waveStyle2]}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.3)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.waveGradient}
                />
              </Animated.View>

              {/* Bubbles */}
              <Animated.View
                style={[styles.bubble, { left: '20%' }, bubble1Style]}
              />
              <Animated.View
                style={[styles.bubble, { left: '50%' }, bubble2Style]}
              />
              <Animated.View
                style={[styles.bubble, { left: '80%' }, bubble3Style]}
              />

              {/* Dynamic shimmer */}
              <Animated.View style={[styles.shimmer, shimmerStyle]} />
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </View>

      {/* Enhanced reflection */}
      <View style={styles.reflectionContainer}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.2)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.7, y: 1 }}
          style={styles.reflection}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: GLASS_WIDTH,
    height: GLASS_HEIGHT,
    position: 'relative',
  },
  glowBackground: {
    position: 'absolute',
    width: GLASS_WIDTH * 1.3,
    height: GLASS_HEIGHT * 1.3,
    borderRadius: GLASS_WIDTH * 0.6,
    opacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
  },
  waterContainer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    height: GLASS_HEIGHT - 70,
    overflow: 'hidden',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  waterMask: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    overflow: 'hidden',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  water: {
    width: '100%',
    height: '100%',
  },
  splash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 30,
  },
  wave: {
    position: 'absolute',
    top: -12,
    left: -20,
    right: -20,
    height: 30,
  },
  wave2: {
    position: 'absolute',
    top: -6,
    left: -20,
    right: -20,
    height: 20,
  },
  waveGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  bubble: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    bottom: 0,
  },
  shimmer: {
    position: 'absolute',
    top: 10,
    left: '10%',
    width: '80%',
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 50,
    transform: [{ rotate: '15deg' }],
  },
  reflectionContainer: {
    position: 'absolute',
    top: '12%',
    left: '8%',
    width: '30%',
    height: '35%',
    overflow: 'hidden',
  },
  reflection: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
    transform: [{ rotate: '25deg' }, { skewY: '15deg' }],
  },
});
