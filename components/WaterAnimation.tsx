import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';

interface WaterAnimationProps {
  size?: number;
  containerStyle?: any;
}

export default function WaterAnimation({ 
  size = 300, 
  containerStyle 
}: WaterAnimationProps) {
  const { dailyProgress, isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  
  // Animation values
  const waveOffset1 = useSharedValue(0);
  const waveOffset2 = useSharedValue(0);
  const fillLevel = useSharedValue(0);
  const bubbleY1 = useSharedValue(0);
  const bubbleY2 = useSharedValue(0);
  const bubbleY3 = useSharedValue(0);
  
  // Start animations
  useEffect(() => {
    // Wave animations
    waveOffset1.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    
    waveOffset2.value = withRepeat(
      withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    
    // Fill level animation
    fillLevel.value = withTiming(dailyProgress, {
      duration: 1000,
      easing: Easing.ease,
    });
    
    // Bubble animations
    const animateBubble = (bubbleY: Animated.SharedValue<number>) => {
      bubbleY.value = 0;
      bubbleY.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration: 2000 + Math.random() * 1000,
            easing: Easing.ease,
          }),
          withTiming(0, { duration: 0 })
        ),
        -1
      );
    };
    
    animateBubble(bubbleY1);
    setTimeout(() => animateBubble(bubbleY2), 700);
    setTimeout(() => animateBubble(bubbleY3), 1400);
  }, [dailyProgress]);
  
  // Animated styles
  const wave1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(waveOffset1.value, [0, 1], [0, -50]) }],
  }));
  
  const wave2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(waveOffset2.value, [0, 1], [0, -50]) }],
  }));
  
  const fillStyle = useAnimatedStyle(() => ({
    height: `${fillLevel.value * 100}%`,
  }));
  
  const createBubbleStyle = (bubbleY: Animated.SharedValue<number>) =>
    useAnimatedStyle(() => ({
      transform: [
        { translateY: interpolate(bubbleY.value, [0, 1], [0, -size * 0.8]) },
        { scale: interpolate(bubbleY.value, [0, 0.5, 1], [0.3, 1, 0.3]) },
      ],
      opacity: interpolate(bubbleY.value, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
    }));
  
  const bubble1Style = createBubbleStyle(bubbleY1);
  const bubble2Style = createBubbleStyle(bubbleY2);
  const bubble3Style = createBubbleStyle(bubbleY3);
  
  const waterColors = [
    colors.primary[300],
    colors.primary[500],
    colors.primary[400],
  ];
  
  return (
    <View 
      style={[
        styles.container, 
        { width: size, height: size }, 
        containerStyle
      ]}
    >
      <View style={[styles.drop, { width: size, height: size }]}>
        {/* Empty container for reference */}
        <View style={styles.emptyContainer} />
        
        {/* Animated water fill */}
        <Animated.View style={[styles.fillContainer, fillStyle]}>
          <LinearGradient
            colors={waterColors}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Wave layers */}
            <Animated.View style={[styles.wave, wave1Style]} />
            <Animated.View style={[styles.wave, styles.wave2, wave2Style]} />
            
            {/* Bubbles */}
            <Animated.View style={[styles.bubble, { left: '30%' }, bubble1Style]} />
            <Animated.View style={[styles.bubble, { left: '50%' }, bubble2Style]} />
            <Animated.View style={[styles.bubble, { left: '70%' }, bubble3Style]} />
          </LinearGradient>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  drop: {
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(0, 150, 255, 0.3)',
    backgroundColor: 'rgba(0, 150, 255, 0.1)',
    transform: [{ scaleY: 1.05 }],
  },
  emptyContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  fillContainer: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    overflow: 'hidden',
  },
  gradient: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  wave: {
    height: 20,
    width: '200%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 999,
    position: 'absolute',
    top: -10,
  },
  wave2: {
    top: -5,
    opacity: 0.5,
  },
  bubble: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    bottom: '10%',
  },
});