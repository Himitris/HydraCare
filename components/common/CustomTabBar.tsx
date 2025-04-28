// components/common/CustomTabBar.tsx
import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Home } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';

interface TabItem {
  name: string;
  label: string;
  icon: (props: { color: string; size: number }) => React.ReactNode;
}

interface CustomTabBarProps {
  tabs: TabItem[];
  baseRoute: string;
  activeColor: string;
  inactiveColor: string;
}

const { width } = Dimensions.get('window');

export default function CustomTabBar({
  tabs,
  baseRoute,
  activeColor,
  inactiveColor,
}: CustomTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  // Références aux animations pour éviter les recréations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const activeTabIndicatorWidth = useRef(new Animated.Value(0)).current;
  const activeTabIndicatorPosition = useRef(new Animated.Value(0)).current;

  // Mémoriser la division des onglets pour éviter les recalculs
  const { leftTabs, rightTabs } = useMemo(() => {
    const leftSide = tabs.slice(0, Math.ceil(tabs.length / 2));
    const rightSide = tabs.slice(Math.ceil(tabs.length / 2));
    return { leftTabs: leftSide, rightTabs: rightSide };
  }, [tabs]);

  // Mémoriser la largeur d'un onglet pour éviter les recalculs
  const tabWidth = useMemo(() => {
    return (width - 70) / tabs.length;
  }, [width, tabs.length]);

  // Fonction optimisée pour vérifier si un onglet est actif
  const isActive = useCallback(
    (tabName: string) => {
      if (tabName === 'index') {
        return pathname === baseRoute || pathname === `${baseRoute}/index`;
      }

      return (
        pathname === `${baseRoute}/${tabName}` ||
        pathname.endsWith(`/${tabName}`) ||
        pathname === `/${tabName}`
      );
    },
    [pathname, baseRoute]
  );

  // Trouver l'index de l'onglet actif (mémorisé pour éviter les recalculs)
  const { activeTabIndex, isLeftSide } = useMemo(() => {
    let foundIndex = -1;
    let onLeftSide = true;

    // Vérifier les onglets de gauche
    for (let i = 0; i < leftTabs.length; i++) {
      if (isActive(leftTabs[i].name)) {
        foundIndex = i;
        onLeftSide = true;
        break;
      }
    }

    // Si aucun onglet trouvé à gauche, vérifier à droite
    if (foundIndex === -1) {
      for (let i = 0; i < rightTabs.length; i++) {
        if (isActive(rightTabs[i].name)) {
          foundIndex = i;
          onLeftSide = false;
          break;
        }
      }
    }

    // Cas par défaut si nous sommes sur running
    if (foundIndex === -1 && pathname.includes('running')) {
      foundIndex = 0;
      onLeftSide = true;
    }

    return { activeTabIndex: foundIndex, isLeftSide: onLeftSide };
  }, [leftTabs, rightTabs, isActive, pathname]);

  // Effet pulsant pour le bouton d'accueil (optimisé avec moins de recréations)
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
      scaleAnim.setValue(1);
    };
  }, []); // Pas besoin de dépendance ici, car scaleAnim est une référence stable

  // Animation de l'indicateur d'onglet actif
  useEffect(() => {
    if (activeTabIndex !== -1) {
      // Calculer la position de l'indicateur
      const position = isLeftSide
        ? activeTabIndex * tabWidth
        : (leftTabs.length + activeTabIndex) * tabWidth + 70;

      // Animer l'indicateur avec des configurations optimisées
      Animated.parallel([
        Animated.spring(activeTabIndicatorWidth, {
          toValue: tabWidth * 0.6,
          friction: 8,
          useNativeDriver: false,
          // Réduire les calculs intermédiaires
          restDisplacementThreshold: 0.01,
          restSpeedThreshold: 0.01,
        }),
        Animated.spring(activeTabIndicatorPosition, {
          toValue: position + tabWidth * 0.2,
          friction: 8,
          useNativeDriver: false,
          // Réduire les calculs intermédiaires
          restDisplacementThreshold: 0.01,
          restSpeedThreshold: 0.01,
        }),
      ]).start();
    } else {
      // Masquer l'indicateur si aucun onglet n'est actif
      Animated.parallel([
        Animated.timing(activeTabIndicatorWidth, {
          toValue: 0,
          duration: 150,
          useNativeDriver: false,
        }),
        Animated.timing(activeTabIndicatorPosition, {
          toValue: 0,
          duration: 150,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [activeTabIndex, isLeftSide, tabWidth, leftTabs.length]);

  // Navigation optimisée vers un onglet
  const navigateToTab = useCallback(
    (tabName: string) => {
      const path = tabName === 'index' ? baseRoute : `${baseRoute}/${tabName}`;
      router.push(path as any);
    },
    [baseRoute, router]
  );

  // Navigation vers l'accueil
  const navigateToHome = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push('/' as any);
    });
  }, [router, scaleAnim]);

  // Mémoriser le rendu des onglets pour éviter les recréations
  const renderTab = useCallback(
    (tab: TabItem, isLeft: boolean) => {
      const active = isActive(tab.name);
      return (
        <TouchableOpacity
          key={`${isLeft ? 'left' : 'right'}-${tab.name}`}
          style={styles.tabItem}
          onPress={() => navigateToTab(tab.name)}
        >
          <View
            style={[
              styles.tabContent,
              active && {
                backgroundColor: `${activeColor}15`,
              },
            ]}
          >
            {tab.icon({
              color: active ? activeColor : inactiveColor,
              size: 24,
            })}
            <Text
              style={[
                styles.tabLabel,
                {
                  color: active ? activeColor : inactiveColor,
                  fontFamily: active ? 'Inter-SemiBold' : 'Inter-Medium',
                },
              ]}
            >
              {tab.label}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [isActive, navigateToTab, activeColor, inactiveColor]
  );

  // Style mémorisé de l'indicateur pour éviter les recréations
  const indicatorStyle = useMemo(
    () => ({
      position: 'absolute',
      top: 4,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: activeColor,
      width: activeTabIndicatorWidth,
      left: activeTabIndicatorPosition,
    }),
    [activeColor, activeTabIndicatorWidth, activeTabIndicatorPosition]
  );

  // Style mémorisé du conteneur pour éviter les recréations
  const tabBarStyle = useMemo(
    () => [styles.tabBar, { backgroundColor: colors.cardBackground }],
    [colors.cardBackground]
  );

  // Styles d'animation mémorisés
  const homeButtonGlowStyle = useMemo(
    () => [
      styles.homeButtonGlow,
      {
        backgroundColor: colors.accent[300],
        transform: [{ scale: scaleAnim }],
      },
    ],
    [colors.accent, scaleAnim]
  );

  const homeButtonContainerStyle = useMemo(
    () => [
      styles.homeButtonContainer,
      {
        transform: [{ scale: scaleAnim }],
      },
    ],
    [scaleAnim]
  );

  const homeButtonStyle = useMemo(
    () => [styles.homeButton, { backgroundColor: colors.accent[500] }],
    [colors.accent]
  );

  // Mémoriser les onglets rendus pour éviter les recréations
  const leftTabComponents = useMemo(
    () => leftTabs.map((tab) => renderTab(tab, true)),
    [leftTabs, renderTab]
  );

  const rightTabComponents = useMemo(
    () => rightTabs.map((tab) => renderTab(tab, false)),
    [rightTabs, renderTab]
  );

  return (
    <View style={tabBarStyle}>
      {/* Indicateur d'onglet actif */}
      <Animated.View style={indicatorStyle as any} />

      {/* Tabs de gauche */}
      {leftTabComponents}

      {/* Bouton d'accueil central avec animation */}
      <View style={styles.homeButtonWrapper}>
        <Animated.View style={homeButtonGlowStyle} />
        <Animated.View style={homeButtonContainerStyle}>
          <TouchableOpacity style={homeButtonStyle} onPress={navigateToHome}>
            <Home size={28} color="#FFF" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Tabs de droite */}
      {rightTabComponents}
    </View>
  );
}

// Styles extraits en dehors du composant pour éviter les recréations
const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: Platform.OS === 'ios' ? 88 : 60,
    paddingBottom: Platform.OS === 'ios' ? 24 : 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingTop: 8,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  homeButtonWrapper: {
    position: 'relative',
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButtonGlow: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    opacity: 0.4,
  },
  homeButtonContainer: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
