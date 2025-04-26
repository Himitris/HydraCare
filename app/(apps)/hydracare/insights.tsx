// app/(apps)/hydracare/insights.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart2, TrendingUp } from 'lucide-react-native';
import MonthlyHeatmap from '@/components/hydracare/MonthlyHeatMap';
import ProgressIndicators from '@/components/hydracare/ProgressIndicators';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function InsightsScreen() {
  const { isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>(
    'week'
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Gradient background */}
      <LinearGradient
        colors={
          isDarkMode
            ? [colors.background, colors.primary[50]]
            : [colors.primary[50], colors.background]
        }
        locations={[0, 0.3]}
        style={styles.gradient}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <TrendingUp size={32} color={colors.primary[500]} />
              <View style={styles.titleTextContainer}>
                <Text style={[styles.title, { color: colors.text }]}>
                  Tendances
                </Text>
                <Text style={[styles.subtitle, { color: colors.neutral[500] }]}>
                  Vos statistiques d'hydratation
                </Text>
              </View>
            </View>
          </View>

          {/* Progress Indicators */}
          <Animated.View entering={FadeInDown.delay(100)}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Vos performances
            </Text>
            <View style={styles.periodToggle}>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === 'week' && {
                    backgroundColor: colors.primary[500],
                  },
                ]}
                onPress={() => setSelectedPeriod('week')}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    {
                      color:
                        selectedPeriod === 'week'
                          ? '#fff'
                          : colors.neutral[600],
                    },
                  ]}
                >
                  Cette semaine
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === 'month' && {
                    backgroundColor: colors.primary[500],
                  },
                ]}
                onPress={() => setSelectedPeriod('month')}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    {
                      color:
                        selectedPeriod === 'month'
                          ? '#fff'
                          : colors.neutral[600],
                    },
                  ]}
                >
                  Ce mois
                </Text>
              </TouchableOpacity>
            </View>
            <ProgressIndicators period={selectedPeriod} />
          </Animated.View>

          {/* Monthly Heatmap */}
          <Animated.View
            entering={FadeInDown.delay(300)}
            style={[
              styles.heatmapCard,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Calendrier d'hydratation
            </Text>
            <MonthlyHeatmap />
          </Animated.View>

          {/* Tips Card */}
          <Animated.View
            entering={FadeInDown.delay(500)}
            style={[
              styles.tipsCard,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <View style={styles.tipsHeader}>
              <View
                style={[
                  styles.tipsIcon,
                  { backgroundColor: colors.primary[100] },
                ]}
              >
                <BarChart2 size={24} color={colors.primary[500]} />
              </View>
              <Text style={[styles.tipsTitle, { color: colors.text }]}>
                Conseils pour améliorer votre hydratation
              </Text>
            </View>

            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <View
                  style={[
                    styles.tipBullet,
                    { backgroundColor: colors.primary[500] },
                  ]}
                />
                <Text style={[styles.tipText, { color: colors.text }]}>
                  Commencez votre journée avec un verre d'eau dès le réveil
                </Text>
              </View>

              <View style={styles.tipItem}>
                <View
                  style={[
                    styles.tipBullet,
                    { backgroundColor: colors.primary[500] },
                  ]}
                />
                <Text style={[styles.tipText, { color: colors.text }]}>
                  Gardez une bouteille d'eau à portée de main pendant votre
                  travail
                </Text>
              </View>

              <View style={styles.tipItem}>
                <View
                  style={[
                    styles.tipBullet,
                    { backgroundColor: colors.primary[500] },
                  ]}
                />
                <Text style={[styles.tipText, { color: colors.text }]}>
                  Buvez avant, pendant et après l'exercice physique
                </Text>
              </View>

              <View style={styles.tipItem}>
                <View
                  style={[
                    styles.tipBullet,
                    { backgroundColor: colors.primary[500] },
                  ]}
                />
                <Text style={[styles.tipText, { color: colors.text }]}>
                  Consommez des aliments riches en eau comme les fruits et
                  légumes
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 200,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginTop: 40,
    marginBottom: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleTextContainer: {
    marginLeft: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  periodToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  periodButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  heatmapCard: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipsCard: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  tipsList: {
    marginTop: 8,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tipBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  tipText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    flex: 1,
    lineHeight: 20,
  },
});
