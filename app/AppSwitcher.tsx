import Colors from '@/constants/Colors';
import { useAppContext } from '@/context/AppContext';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Activity,
  CheckSquare,
  Droplet,
  LayoutGrid,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Dimensions,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUTTON_SIZE = 60;
const EXPANDED_BUTTON_SIZE = 56;
const EXPANDED_RADIUS = 100;
const EDGE_PADDING = 5;

interface AppItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  path: string;
  color: string;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const AppSwitcher = () => {
  const router = useRouter();
  const { isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const [isExpanded, setIsExpanded] = useState(false);

  // Start position at right edge, middle of screen
  const translateX = useSharedValue(SCREEN_WIDTH - BUTTON_SIZE - EDGE_PADDING);
  const translateY = useSharedValue(SCREEN_HEIGHT / 2 - BUTTON_SIZE / 2);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const optionsScale = useSharedValue(0);
  const contextX = useSharedValue(0);
  const contextY = useSharedValue(0);
  const lastEdge = useSharedValue('right');

  // Apps available
  const apps: AppItem[] = [
    {
      id: 'hydracare',
      icon: <Droplet size={28} color="#fff" />,
      label: 'HydraCare',
      path: '/(apps)/hydracare',
      color: colors.primary[500],
    },
    {
      id: 'running',
      icon: <Activity size={28} color="#fff" />,
      label: 'Running',
      path: '/(apps)/running',
      color: colors.secondary[500],
    },
    {
      id: 'todo',
      icon: <CheckSquare size={28} color="#fff" />,
      label: 'Todo',
      path: '/(apps)/todo',
      color: colors.accent[500],
    },
  ];

  const toggleExpanded = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (isExpanded) {
      // Close animation
      rotation.value = withSpring(0, { damping: 15 });
      optionsScale.value = withSpring(0, { damping: 15 });
      setTimeout(() => setIsExpanded(false), 200);
    } else {
      // Open animation
      setIsExpanded(true);
      rotation.value = withSpring(45, { damping: 15 });
      optionsScale.value = withSpring(1, { damping: 15 });
    }
  };

  const navigateToApp = (path: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    toggleExpanded();
    router.push(path);
  };

  // Determine which edge the button is closest to
  const findClosestEdge = (x: number, y: number) => {
    'worklet';
    const centerX = x + BUTTON_SIZE / 2;
    const centerY = y + BUTTON_SIZE / 2;

    // Calculate distances to each edge
    const distanceToLeft = centerX;
    const distanceToRight = SCREEN_WIDTH - centerX;
    const distanceToTop = centerY;
    const distanceToBottom = SCREEN_HEIGHT - centerY;

    const minHorizontal = Math.min(distanceToLeft, distanceToRight);
    const minVertical = Math.min(distanceToTop, distanceToBottom);

    if (minHorizontal < minVertical) {
      return distanceToLeft < distanceToRight ? 'left' : 'right';
    } else {
      return distanceToTop < distanceToBottom ? 'top' : 'bottom';
    }
  };

  // Pan gesture
  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextX.value = translateX.value;
      contextY.value = translateY.value;
    })
    .onUpdate((event) => {
      // Follow finger exactly during drag
      translateX.value = contextX.value + event.translationX;
      translateY.value = contextY.value + event.translationY;
    })
    .onEnd(() => {
      const edge = findClosestEdge(translateX.value, translateY.value);
      lastEdge.value = edge;

      // Snap to closest edge
      switch (edge) {
        case 'left':
          translateX.value = withSpring(EDGE_PADDING);
          translateY.value = withSpring(
            Math.max(
              EDGE_PADDING,
              Math.min(
                SCREEN_HEIGHT - BUTTON_SIZE - EDGE_PADDING,
                translateY.value
              )
            )
          );
          break;
        case 'right':
          translateX.value = withSpring(
            SCREEN_WIDTH - BUTTON_SIZE - EDGE_PADDING
          );
          translateY.value = withSpring(
            Math.max(
              EDGE_PADDING,
              Math.min(
                SCREEN_HEIGHT - BUTTON_SIZE - EDGE_PADDING,
                translateY.value
              )
            )
          );
          break;
        case 'top':
          translateY.value = withSpring(EDGE_PADDING);
          translateX.value = withSpring(
            Math.max(
              EDGE_PADDING,
              Math.min(
                SCREEN_WIDTH - BUTTON_SIZE - EDGE_PADDING,
                translateX.value
              )
            )
          );
          break;
        case 'bottom':
          translateY.value = withSpring(
            SCREEN_HEIGHT - BUTTON_SIZE - EDGE_PADDING
          );
          translateX.value = withSpring(
            Math.max(
              EDGE_PADDING,
              Math.min(
                SCREEN_WIDTH - BUTTON_SIZE - EDGE_PADDING,
                translateX.value
              )
            )
          );
          break;
      }
    });

  // Container style
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  // Main button animation
  const mainButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  // Options container animation
  const optionsContainerStyle = useAnimatedStyle(() => ({
    opacity: optionsScale.value,
    transform: [{ scale: optionsScale.value }],
  }));

  // Individual option animations with edge awareness
  const optionStyles = apps.map((_, index) => {
    return useAnimatedStyle(() => {
      const edge = lastEdge.value;
      let angle = (Math.PI * index) / (apps.length - 1);

      // Adjust angle based on edge position
      switch (edge) {
        case 'left':
          angle = angle * 0.5 - Math.PI / 4; // Quarter circle right
          break;
        case 'right':
          angle = angle * 0.5 + (Math.PI * 3) / 4; // Quarter circle left
          break;
        case 'top':
          angle = angle * 0.5 - Math.PI / 2; // Quarter circle down
          break;
        case 'bottom':
          angle = angle * 0.5; // Quarter circle up
          break;
      }

      const x = Math.cos(angle) * EXPANDED_RADIUS;
      const y = Math.sin(angle) * EXPANDED_RADIUS;

      return {
        transform: [
          { translateX: optionsScale.value * x },
          { translateY: optionsScale.value * y },
          { scale: optionsScale.value },
        ],
      };
    });
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, containerStyle]}>
        {/* Expanded options */}
        {isExpanded && (
          <Animated.View
            style={[styles.optionsContainer, optionsContainerStyle]}
          >
            {apps.map((app, index) => (
              <Animated.View
                key={app.id}
                style={[styles.optionWrapper, optionStyles[index]]}
              >
                <TouchableOpacity
                  onPress={() => navigateToApp(app.path)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[app.color, app.color + 'CC']}
                    style={styles.optionButton}
                  >
                    {app.icon}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {/* Main floating button */}
        <AnimatedTouchable
          style={[styles.mainButton, mainButtonStyle]}
          onPress={toggleExpanded}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary[500], colors.primary[600]]}
            style={styles.buttonGradient}
          >
            <LayoutGrid size={30} color="#fff" />
          </LinearGradient>
        </AnimatedTouchable>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9999,
  },
  mainButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: BUTTON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsContainer: {
    position: 'absolute',
    width: EXPANDED_RADIUS * 2,
    height: EXPANDED_RADIUS * 2,
    alignItems: 'center',
    justifyContent: 'center',
    left: -EXPANDED_RADIUS + BUTTON_SIZE / 2,
    top: -EXPANDED_RADIUS + BUTTON_SIZE / 2,
  },
  optionWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  optionButton: {
    width: EXPANDED_BUTTON_SIZE,
    height: EXPANDED_BUTTON_SIZE,
    borderRadius: EXPANDED_BUTTON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  optionLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginTop: 6,
    textAlign: 'center',
  },
});

export default AppSwitcher;
