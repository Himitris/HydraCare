// components/common/HomeButton.tsx (version améliorée)
import React, { useState } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  Text,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Home } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';

interface HomeButtonProps {
  position?: 'topLeft' | 'topRight';
  size?: number;
}

export default function HomeButton({
  position = 'topLeft',
  size = 24,
}: HomeButtonProps) {
  const router = useRouter();
  const { isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const [showTooltip, setShowTooltip] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const navigateToHome = () => {
    // Animation d'appui
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Naviguer après l'animation
      router.push('/');
    });
  };

  const showTooltipHandler = () => {
    setShowTooltip(true);
    // Cacher automatiquement après 2 secondes
    setTimeout(() => {
      setShowTooltip(false);
    }, 2000);
  };

  return (
    <View style={position === 'topLeft' ? styles.topLeft : styles.topRight}>
      {showTooltip && (
        <View
          style={[
            styles.tooltip,
            { backgroundColor: colors.accent[500] },
            position === 'topLeft' ? styles.tooltipLeft : styles.tooltipRight,
          ]}
        >
          <Text style={styles.tooltipText}>Accueil</Text>
        </View>
      )}

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[styles.container, { backgroundColor: colors.cardBackground }]}
          onPress={navigateToHome}
          onLongPress={showTooltipHandler}
          activeOpacity={0.8}
        >
          <Home size={size} color={colors.accent[500]} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topLeft: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 100,
  },
  topRight: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 100,
  },
  tooltip: {
    position: 'absolute',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    bottom: -30,
    zIndex: 101,
  },
  tooltipLeft: {
    left: 0,
  },
  tooltipRight: {
    right: 0,
  },
  tooltipText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
});
