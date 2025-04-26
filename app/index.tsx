// app/index.tsx
import React from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Droplet,
  Activity,
  CheckSquare,
  TrendingUp,
  Calendar,
  Settings,
} from 'lucide-react-native';
import ProgressCircle from '@/components/hydracare/ProgressCircle';

export default function Dashboard() {
  const router = useRouter();
  const { isDarkMode, dailyProgress, settings, todayIntake } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  // Calculer les statistiques pour le dashboard
  const totalWater = Math.round(dailyProgress * settings.dailyGoal);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={
          isDarkMode
            ? [colors.background, colors.primary[50]]
            : [colors.primary[50], colors.background]
        }
        locations={[0, 0.3]}
        style={styles.headerGradient}
      />

      {/* Header avec titre et bouton paramètres */}
      <View style={styles.header}>
        <Text style={[styles.welcomeText, { color: colors.text }]}>
          Bienvenue dans votre espace bien-être
        </Text>

        <TouchableOpacity
          style={[
            styles.settingsButton,
            { backgroundColor: colors.cardBackground },
          ]}
          onPress={() => router.push('/settings')}
        >
          <Settings size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {/* Section Hydratation - Maintenant entièrement cliquable */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Droplet size={24} color={colors.primary[500]} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Hydratation
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.cardBackground }]}
            onPress={() => router.push('/(apps)/hydracare')}
            activeOpacity={0.7}
          >
            <View style={styles.hydrationCard}>
              <View style={styles.progressContainer}>
                <ProgressCircle size={100} strokeWidth={10} />
              </View>
              <View style={styles.hydrationStats}>
                <Text
                  style={[
                    styles.hydrationValue,
                    { color: colors.primary[500] },
                  ]}
                >
                  {totalWater} ml
                </Text>
                <Text
                  style={[
                    styles.hydrationLabel,
                    { color: colors.neutral[500] },
                  ]}
                >
                  Aujourd'hui
                </Text>
                <Text
                  style={[
                    styles.hydrationAction,
                    { color: colors.primary[500] },
                  ]}
                >
                  Voir HydraCare →
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Section Activité - Également entièrement cliquable */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Activity size={24} color={colors.secondary[500]} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Activité
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.cardBackground }]}
            onPress={() => router.push('/(apps)/running')}
            activeOpacity={0.7}
          >
            <View style={styles.runningPreview}>
              <View style={styles.runningStats}>
                <Text
                  style={[styles.runningLabel, { color: colors.neutral[500] }]}
                >
                  Dernière sortie
                </Text>
                <Text
                  style={[
                    styles.runningValue,
                    { color: colors.secondary[500] },
                  ]}
                >
                  Voir vos statistiques
                </Text>
                <Text
                  style={[
                    styles.hydrationAction,
                    { color: colors.secondary[500] },
                  ]}
                >
                  Voir Running →
                </Text>
              </View>
              <View
                style={[
                  styles.runningIconContainer,
                  { backgroundColor: colors.secondary[100] },
                ]}
              >
                <TrendingUp size={24} color={colors.secondary[500]} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Section Tâches - Également entièrement cliquable */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CheckSquare size={24} color={colors.accent[500]} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Tâches
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.cardBackground }]}
            onPress={() => router.push('/(apps)/todo')}
            activeOpacity={0.7}
          >
            <View style={styles.todoPreview}>
              <View style={styles.todoStats}>
                <Text
                  style={[styles.todoLabel, { color: colors.neutral[500] }]}
                >
                  Tâches en cours
                </Text>
                <Text style={[styles.todoValue, { color: colors.accent[500] }]}>
                  Voir votre liste
                </Text>
                <Text
                  style={[
                    styles.hydrationAction,
                    { color: colors.accent[500] },
                  ]}
                >
                  Voir Tâches →
                </Text>
              </View>
              <View
                style={[
                  styles.todoIconContainer,
                  { backgroundColor: colors.accent[100] },
                ]}
              >
                <Calendar size={24} color={colors.accent[500]} />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.cardBackground }]}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => router.push('/(apps)/hydracare')}
        >
          <Droplet size={24} color={colors.primary[500]} />
          <Text style={[styles.tabLabel, { color: colors.primary[500] }]}>
            Hydratation
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => router.push('/(apps)/running')}
        >
          <Activity size={24} color={colors.secondary[500]} />
          <Text style={[styles.tabLabel, { color: colors.secondary[500] }]}>
            Running
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => router.push('/(apps)/todo')}
        >
          <CheckSquare size={24} color={colors.accent[500]} />
          <Text style={[styles.tabLabel, { color: colors.accent[500] }]}>
            Tâches
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 50,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    flex: 1,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  hydrationAction: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginTop: 8,
  },
  container: {
    flex: 1,
    paddingTop: 60,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  hydrationCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressContainer: {
    marginRight: 20,
  },
  hydrationStats: {
    flex: 1,
  },
  hydrationValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  hydrationLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 12,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  runningPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  runningStats: {
    flex: 1,
  },
  runningLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  runningValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginTop: 4,
  },
  runningIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todoStats: {
    flex: 1,
  },
  todoLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  todoValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginTop: 4,
  },
  todoIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
});
