// components/common/CustomTabBar.tsx
import Colors from '@/constants/Colors';
import { useAppContext } from '@/context/AppContext';
import { usePathname, useRouter } from 'expo-router';
import { Home } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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

    // Vérifier les onglets de droite
    if (foundIndex === -1) {
      for (let i = 0; i < rightTabs.length; i++) {
        if (isActive(rightTabs[i].name)) {
          foundIndex = i;
          onLeftSide = false;
          break;
        }
      }
    }

    // ✅ Correction ici : si rien trouvé, on revient au premier onglet
    if (foundIndex === -1) {
      foundIndex = 0;
      onLeftSide = true;
    }

    return { activeTabIndex: foundIndex, isLeftSide: onLeftSide };
  }, [leftTabs, rightTabs, isActive, pathname]);

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

  const navigateToHome = useCallback(() => {
    router.push('/' as any);
  }, [router]);

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
        <TouchableOpacity
          style={[styles.homeButton, { backgroundColor: colors.accent[500] }]}
          onPress={navigateToHome}
        >
          <Home size={28} color="#FFF" />
        </TouchableOpacity>
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
  homeButtonWrapper: {
    width: 70,
    height: 70,
    marginTop: -20,
    borderRadius: 35,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },

  homeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
