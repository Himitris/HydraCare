import React, { useEffect } from 'react';
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
const GLASS_HEIGHT = height * 0.28;
const GLASS_WIDTH = width * 0.5;

export default function WaterGlass({ progress }: WaterGlassProps) {
  const { isDarkMode } = useAppContext();
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

  // Gentle wave animations
  useEffect(() => {
    waveOffset.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    waveOffset2.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    shimmer.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.ease }),
      -1,
      true
    );

    // Bubble animations
    const animateBubble = (
      bubbleValue: Animated.SharedValue<number>,
      delay: number
    ) => {
      bubbleValue.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(1, {
            duration: 2000,
            easing: Easing.linear,
            delay,
          })
        ),
        -1
      );
    };

    animateBubble(bubbleY1, 0);
    animateBubble(bubbleY2, 700);
    animateBubble(bubbleY3, 1400);
  }, []);

  // Animated styles
  const waterStyle = useAnimatedStyle(() => ({
    height: `${waterLevel.value * 100}%`,
  }));

  const waveStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(waveOffset.value, [0, 1], [0, -4]),
      },
      {
        translateX: interpolate(waveOffset.value, [0, 1], [-5, 5]),
      },
    ],
  }));

  const waveStyle2 = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(waveOffset2.value, [0, 1], [0, -3]),
      },
      {
        translateX: interpolate(waveOffset2.value, [0, 1], [5, -5]),
      },
    ],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.2, 0.4, 0.2]),
  }));

  const splashStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(splashEffect.value, [0, 1], [1, 1.2]) }],
    opacity: interpolate(splashEffect.value, [0, 1], [0, 0.3]),
  }));

  // Bubble animation styles
  const createBubbleStyle = (bubbleValue: Animated.SharedValue<number>) => {
    return useAnimatedStyle(() => ({
      transform: [
        {
          translateY: interpolate(
            bubbleValue.value,
            [0, 1],
            [0, -GLASS_HEIGHT * 0.7]
          ),
        },
        { scale: interpolate(bubbleValue.value, [0, 0.5, 1], [0.4, 1, 0.4]) },
      ],
      opacity: interpolate(bubbleValue.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
    }));
  };

  const bubble1Style = createBubbleStyle(bubbleY1);
  const bubble2Style = createBubbleStyle(bubbleY2);
  const bubble3Style = createBubbleStyle(bubbleY3);

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
              stopOpacity="0.3"
            />
            <Stop
              offset="100%"
              stopColor={colors.primary[200]}
              stopOpacity="0.1"
            />
          </RadialGradient>
        </Defs>

        {/* Glass body with rounded bottom */}
        <Path
          d="M30 50 Q 20 80, 20 180 Q 20 240, 100 240 Q 180 240, 180 180 Q 180 80, 170 50 Q 160 40, 100 35 Q 40 40, 30 50 Z"
          fill="url(#glassGradient)"
          stroke={colors.primary[200]}
          strokeWidth="1"
          strokeOpacity="0.5"
        />

        {/* Glass rim */}
        <Path
          d="M30 50 Q 100 40, 170 50"
          fill="none"
          stroke={colors.primary[300]}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </Svg>

      {/* Water container with mask */}
      <View style={styles.waterContainer}>
        <Animated.View style={[styles.waterMask, waterStyle]}>
          <LinearGradient
            colors={[
              colors.primary[300],
              colors.primary[400],
              colors.primary[500],
            ]}
            locations={[0, 0.6, 1]}
            style={styles.water}
          >
            {/* Splash effect */}
            <Animated.View style={[styles.splash, splashStyle]} />

            {/* Gentle waves */}
            <Animated.View style={[styles.wave, waveStyle]}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.3)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.waveGradient}
              />
            </Animated.View>

            <Animated.View style={[styles.wave2, waveStyle2]}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.2)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.waveGradient}
              />
            </Animated.View>

            {/* Bubbles */}
            <Animated.View
              style={[styles.bubble, { left: '25%' }, bubble1Style]}
            />
            <Animated.View
              style={[styles.bubble, { left: '50%' }, bubble2Style]}
            />
            <Animated.View
              style={[styles.bubble, { left: '75%' }, bubble3Style]}
            />

            {/* Subtle shimmer */}
            <Animated.View style={[styles.shimmer, shimmerStyle]} />
          </LinearGradient>
        </Animated.View>
      </View>

      {/* Subtle reflection */}
      <View style={styles.reflectionContainer}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.15)', 'transparent']}
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
    width: GLASS_WIDTH * 1.2,
    height: GLASS_HEIGHT * 1.2,
    borderRadius: GLASS_WIDTH * 0.5,
    opacity: 0.7,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
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
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
  },
  wave: {
    position: 'absolute',
    top: -8,
    left: 0,
    right: 0,
    height: 25,
  },
  wave2: {
    position: 'absolute',
    top: -4,
    left: 0,
    right: 0,
    height: 15,
  },
  waveGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  bubble: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    bottom: 0,
  },
  shimmer: {
    position: 'absolute',
    top: 10,
    left: '20%',
    width: '60%',
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 40,
    transform: [{ rotate: '15deg' }],
  },
  reflectionContainer: {
    position: 'absolute',
    top: '15%',
    left: '10%',
    width: '25%',
    height: '30%',
    overflow: 'hidden',
  },
  reflection: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
    transform: [{ rotate: '20deg' }, { skewY: '15deg' }],
  },
});
