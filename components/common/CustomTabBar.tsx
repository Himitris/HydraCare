import React, { useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Animated,
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

  // Animation pour le bouton d'accueil
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Effet pulsant pour le bouton d'accueil
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
    };
  }, []);

  // Diviser les tabs en deux groupes
  const leftTabs = tabs.slice(0, Math.ceil(tabs.length / 2));
  const rightTabs = tabs.slice(Math.ceil(tabs.length / 2));

  // Détecter si un tab est actif
  const isActive = (tabName: string) => {
    if (tabName === 'index') {
      return pathname === `${baseRoute}` || pathname === `${baseRoute}/index`;
    }
    return pathname.includes(`${baseRoute}/${tabName}`);
  };

  // Navigation vers un tab
  const navigateToTab = (tabName: string) => {
    const path = tabName === 'index' ? baseRoute : `${baseRoute}/${tabName}`;
    router.push(path as any); // Utilisez 'as any' pour contourner l'erreur de type
  };

  // Animation et navigation vers l'accueil
  const navigateToHome = () => {
    // Effet de pression
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
      // Naviguer vers l'accueil
      router.push('/' as any); // Utilisez 'as any' pour contourner l'erreur de type
    });
  };

  // Rendu d'un tab individuel avec indicateur d'onglet actif
  const renderTab = (tab: TabItem, isLeft: boolean) => {
    const active = isActive(tab.name);
    return (
      <TouchableOpacity
        key={`${isLeft ? 'left' : 'right'}-${tab.name}`}
        style={styles.tabItem}
        onPress={() => navigateToTab(tab.name)}
      >
        {/* Indicateur d'onglet actif */}
        {active && (
          <View
            style={[styles.activeIndicator, { backgroundColor: activeColor }]}
          />
        )}

        <View
          style={[
            styles.tabContent,
            active && {
              backgroundColor: `${activeColor}15`, // Fond légèrement coloré pour l'onglet actif
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
                fontFamily: active ? 'Inter-SemiBold' : 'Inter-Medium', // Police plus épaisse pour l'onglet actif
              },
            ]}
          >
            {tab.label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.tabBar, { backgroundColor: colors.cardBackground }]}>
      {/* Tabs de gauche */}
      {leftTabs.map((tab) => renderTab(tab, true))}

      {/* Bouton d'accueil central avec animation */}
      <View style={styles.homeButtonWrapper}>
        <Animated.View
          style={[
            styles.homeButtonGlow,
            {
              backgroundColor: colors.accent[300],
              transform: [{ scale: scaleAnim }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.homeButtonContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.homeButton, { backgroundColor: colors.accent[500] }]}
            onPress={navigateToHome}
          >
            <Home size={28} color="#FFF" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Tabs de droite */}
      {rightTabs.map((tab) => renderTab(tab, false))}
    </View>
  );
}

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
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: 3,
    borderRadius: 2,
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
