// components/running/StatsCard.tsx
import Colors from '@/constants/Colors';
import {
  Activity,
  Award,
  BarChart,
  Clock,
  Download,
  Target,
} from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Link } from 'expo-router';

interface StatsCardProps {
  sessions: any[];
  colors: any;
  isLoading?: boolean;
  onExport?: () => void;
}

export default function StatsCard({
  sessions,
  colors,
  isLoading = false,
  onExport,
}: StatsCardProps) {
  if (isLoading) {
    return (
      <View
        style={[styles.statsCard, { backgroundColor: colors.cardBackground }]}
      >
        <ActivityIndicator size="large" color={colors.secondary[500]} />
        <Text style={[styles.noStatsText, { color: colors.neutral[500] }]}>
          Chargement des données...
        </Text>
      </View>
    );
  }

  return (
    <Animated.View
      entering={FadeInDown}
      style={[styles.statsCard, { backgroundColor: colors.cardBackground }]}
    >
      <View style={styles.statsHeader}>
        <View style={styles.statsHeaderLeft}>
          <BarChart size={24} color={colors.secondary[500]} />
          <Text style={[styles.statsTitle, { color: colors.text }]}>
            Statistiques
          </Text>
        </View>
        <Link href="/running/filters" asChild>
          <TouchableOpacity style={styles.filterButton}>
            <Text
              style={[
                styles.filterButtonText,
                { color: colors.secondary[500] },
              ]}
            >
              Filtrer
            </Text>
          </TouchableOpacity>
        </Link>
      </View>

      {sessions.length > 0 ? (
        <>
          <View style={styles.statsSummary}>
            <View style={styles.statItem}>
              <View
                style={[
                  styles.statIconBox,
                  { backgroundColor: colors.secondary[100] },
                ]}
              >
                <Activity size={16} color={colors.secondary[500]} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {sessions.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.neutral[500] }]}>
                Sessions
              </Text>
            </View>

            <View style={styles.statItem}>
              <View
                style={[
                  styles.statIconBox,
                  { backgroundColor: colors.success[100] },
                ]}
              >
                <Target size={16} color={colors.success[500]} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {sessions
                  .reduce((sum, session) => sum + (session.distance || 0), 0)
                  .toFixed(1)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.neutral[500] }]}>
                Km totaux
              </Text>
            </View>

            <View style={styles.statItem}>
              <View
                style={[
                  styles.statIconBox,
                  { backgroundColor: colors.warning[100] },
                ]}
              >
                <Clock size={16} color={colors.warning[500]} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {Math.round(
                  sessions.reduce(
                    (sum, session) => sum + (session.duration || 0),
                    0
                  ) / 60
                )}
              </Text>
              <Text style={[styles.statLabel, { color: colors.neutral[500] }]}>
                Heures
              </Text>
            </View>

            <View style={styles.statItem}>
              <View
                style={[
                  styles.statIconBox,
                  { backgroundColor: colors.primary[100] },
                ]}
              >
                <Award size={16} color={colors.primary[500]} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {(
                  (sessions.filter(
                    (s) => s.feeling === 'great' || s.feeling === 'good'
                  ).length /
                    sessions.length) *
                  100
                ).toFixed(0)}
                %
              </Text>
              <Text style={[styles.statLabel, { color: colors.neutral[500] }]}>
                Positif
              </Text>
            </View>
          </View>

          <Link href="/running/filters" asChild>
            <TouchableOpacity
              style={[
                styles.exportButton,
                { backgroundColor: colors.secondary[500] },
              ]}
            >
              <Download size={18} color="#fff" />
              <Text style={styles.exportButtonText}>
                Filtrer et exporter les données
              </Text>
            </TouchableOpacity>
          </Link>
        </>
      ) : (
        <View style={styles.noStatsContainer}>
          <Text style={[styles.noStatsText, { color: colors.neutral[500] }]}>
            Ajoutez des sessions de course pour voir vos statistiques
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  statsCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  statsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    width: '22%',
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  exportButtonText: {
    color: '#fff',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  noStatsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noStatsText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});
