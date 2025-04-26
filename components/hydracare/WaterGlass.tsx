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
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';
import Svg, {
  Path,
  Defs,
  RadialGradient,
  Stop,
  ClipPath,
  Rect
} from 'react-native-svg';

interface WaterGlassProps {
  progress: number;
}

const { width, height } = Dimensions.get('window');
const GLASS_HEIGHT = height * 0.28;
const GLASS_WIDTH = width * 0.5;
const GLASS_BORDER_RADIUS = 40; // Radius for bottom corners

export default function WaterGlass({ progress }: WaterGlassProps) {
  const { isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  // Animation values
  const waterLevel = useSharedValue(0);
  const waveOffset1 = useSharedValue(0);
  const waveOffset2 = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const bubbleY1 = useSharedValue(0);
  const bubbleY2 = useSharedValue(0);
  const bubbleY3 = useSharedValue(0);
  const splashEffect = useSharedValue(0);
  const initialAnimation = useSharedValue(0);

  // Initialiser l'animation au premier rendu
  useEffect(() => {
    // Initialiser le niveau d'eau immédiatement avec la valeur de progress
    waterLevel.value = 0; // Partir de 0 pour créer une animation initiale

    // Animation d'initialisation avec un léger délai pour être visible
    setTimeout(() => {
      initialAnimation.value = withTiming(1, { duration: 1000 });
      waterLevel.value = withSpring(progress, {
        damping: 12,
        stiffness: 90,
        mass: 0.8,
        overshootClamping: false,
      });

      // Ajouter un petit effet de splash à l'initialisation
      if (progress > 0) {
        splashEffect.value = withSequence(
          withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) })
        );
      }
    }, 300);

    // Démarrer l'animation de shimmer (reflet)
    shimmer.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []); // Dépendance vide pour s'exécuter uniquement au montage

  // Mise à jour lors des changements de progress
  useEffect(() => {
    // Animation conditionelle quand progress change
    const progressDiff = Math.abs(progress - waterLevel.value);

    // Animation plus visible pour les gros changements
    if (progressDiff > 0.02) {
      waterLevel.value = withSpring(progress, {
        damping: 12,
        stiffness: 90,
        mass: 0.8,
        overshootClamping: false,
      });

      splashEffect.value = withSequence(
        withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) })
      );
    } else if (progressDiff > 0) {
      // Mise à jour légère sans animation complexe
      waterLevel.value = withTiming(progress, { duration: 300 });
    }
  }, [progress]);

  // Optimisation des animations de vagues
  useEffect(() => {
    // Animation plus naturelle des vagues
    waveOffset1.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    waveOffset2.value = withRepeat(
      withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // Animation des bulles
    const animateBubble = (
      bubbleValue: Animated.SharedValue<number>,
      delay: number,
      duration: number
    ) => {
      setTimeout(() => {
        bubbleValue.value = withRepeat(
          withSequence(
            withTiming(0, { duration: 0 }),
            withTiming(1, {
              duration: duration,
              easing: Easing.bezier(0.22, 1, 0.36, 1),
            })
          ),
          -1,
          false
        );
      }, delay);
    };

    animateBubble(bubbleY1, 0, 2500);
    animateBubble(bubbleY2, 900, 3100);
    animateBubble(bubbleY3, 1800, 2800);

    return () => {
      // Nettoyage explicite des animations
      waveOffset1.value = 0;
      waveOffset2.value = 0;
      bubbleY1.value = 0;
      bubbleY2.value = 0;
      bubbleY3.value = 0;
    };
  }, []);

  // Animated styles for water
  const waterStyle = useAnimatedStyle(() => ({
    height: `${waterLevel.value * 100}%`,
    opacity: interpolate(initialAnimation.value, [0, 1], [0.7, 1]),
  }));

  // Improved wave animations
  const waveStyle1 = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(waveOffset1.value, [0, 1], [-2, -6]),
      },
      {
        translateX: interpolate(waveOffset1.value, [0, 1], [-8, 8]),
      },
      {
        skewX: `${interpolate(waveOffset1.value, [0, 0.5, 1], [0, 6, 0])}deg`,
      },
    ],
    opacity: interpolate(waveOffset1.value, [0, 0.5, 1], [0.7, 1, 0.7]),
  }));

  const waveStyle2 = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(waveOffset2.value, [0, 1], [-4, -8]),
      },
      {
        translateX: interpolate(waveOffset2.value, [0, 1], [6, -6]),
      },
      {
        skewX: `${interpolate(waveOffset2.value, [0, 0.5, 1], [0, -5, 0])}deg`,
      },
    ],
    opacity: interpolate(waveOffset2.value, [0, 0.5, 1], [0.8, 0.6, 0.8]),
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.2, 0.5, 0.2]),
    transform: [
      {
        translateX: interpolate(shimmer.value, [0, 1], [-15, 15]),
      },
      {
        rotate: `${interpolate(shimmer.value, [0, 1], [-5, 5])}deg`,
      },
    ],
  }));

  const splashStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(splashEffect.value, [0, 1], [1, 1.2]) }],
    opacity: interpolate(splashEffect.value, [0, 0.3, 1], [0, 0.4, 0]),
  }));

  // Améliorations des animations de bulles
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
            [0, 0.3, 0.7, 1],
            [0, offsetX * 0.7, offsetX * 0.3, 0]
          ),
        },
        {
          scale: interpolate(
            bubbleValue.value,
            [0, 0.2, 0.8, 1],
            [0.3, 0.8, 0.8, 0.3]
          ),
        },
      ],
      opacity: interpolate(bubbleValue.value, [0, 0.1, 0.8, 1], [0, 1, 1, 0]),
    }));
  };

  const bubble1Style = createBubbleStyle(bubbleY1, 8);
  const bubble2Style = createBubbleStyle(bubbleY2, -10);
  const bubble3Style = createBubbleStyle(bubbleY3, 6);

  // Animation du verre entier
  const glassStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(initialAnimation.value, [0, 1], [0.97, 1]),
      },
    ],
    opacity: interpolate(initialAnimation.value, [0, 1], [0.8, 1]),
  }));

  return (
    <Animated.View style={[styles.container, glassStyle]}>
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

      {/* Glass shape with better masking for tilting */}
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

          {/* Clip path for water to stay inside glass */}
          <ClipPath id="glassClip">
            <Path d="M30 50 Q 20 80, 20 180 Q 20 240, 100 240 Q 180 240, 180 180 Q 180 80, 170 50 Q 160 40, 100 35 Q 40 40, 30 50 Z" />
          </ClipPath>
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

      {/* Water container with improved clipping */}
      <View style={styles.waterContainer}>
        <Animated.View style={[styles.waterMask, waterStyle]}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                overflow: 'hidden',
                borderBottomLeftRadius: GLASS_BORDER_RADIUS,
                borderBottomRightRadius: GLASS_BORDER_RADIUS,
              },
            ]}
          >
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

              {/* Improved waves */}
              <Animated.View style={[styles.wave1, waveStyle1]}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.6)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.waveGradient}
                />
              </Animated.View>

              <Animated.View style={[styles.wave2, waveStyle2]}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.4)', 'transparent']}
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

              {/* Improved shimmer */}
              <Animated.View style={[styles.shimmer, shimmerStyle]} />
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </View>

      {/* Enhanced reflection */}
      <View style={styles.reflectionContainer}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.25)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.7, y: 1 }}
          style={styles.reflection}
        />
      </View>
    </Animated.View>
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
    borderBottomLeftRadius: GLASS_BORDER_RADIUS,
    borderBottomRightRadius: GLASS_BORDER_RADIUS,
  },
  waterMask: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    overflow: 'hidden',
    borderBottomLeftRadius: GLASS_BORDER_RADIUS,
    borderBottomRightRadius: GLASS_BORDER_RADIUS,
  },
  water: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: GLASS_BORDER_RADIUS,
    borderBottomRightRadius: GLASS_BORDER_RADIUS,
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
  wave1: {
    position: 'absolute',
    top: -12,
    left: -20,
    right: -20,
    height: 30,
    borderRadius: 15,
  },
  wave2: {
    position: 'absolute',
    top: -6,
    left: -20,
    right: -20,
    height: 20,
    borderRadius: 15,
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
    bottom: 10,
  },
  shimmer: {
    position: 'absolute',
    top: 15,
    left: '10%',
    width: '80%',
    height: 80,
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
