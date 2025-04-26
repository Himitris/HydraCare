// components/integration/WeeklyProgressWidget.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useIntegration } from '@/context/IntegrationContext';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';
import { Droplet, Activity, CheckSquare } from 'lucide-react-native';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

const { width } = Dimensions.get('window');
const DAY_SIZE = (width - 64) / 7;

export default function WeeklyProgressWidget() {
  const { isDarkMode } = useAppContext();
  const { dailyStats } = useIntegration();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  // Générer les jours de la semaine
  const today = new Date();
  const startDay = startOfWeek(today, { weekStartsOn: 1 }); // Commence le lundi
  const days = Array.from({ length: 7 }, (_, i) => addDays(startDay, i));

  // Simuler des données - dans un cas réel, cela viendrait du contexte
  const weekData = days.map((day) => ({
    date: day,
    isToday: isSameDay(day, today),
    water: Math.random(), // 0-1 pour le pourcentage d'hydratation
    running: Math.random() > 0.7, // Boolean pour indiquer s'il y a eu une course
    tasks: {
      total: Math.floor(Math.random() * 5),
      completed: Math.floor(Math.random() * 3),
    },
  }));

  return (
    <View
      style={[styles.container, { backgroundColor: colors.cardBackground }]}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        Progression hebdomadaire
      </Text>

      <View style={styles.calendar}>
        {/* En-têtes des jours */}
        <View style={styles.dayLabels}>
          {days.map((day, index) => (
            <View key={`label-${index}`} style={styles.dayLabelContainer}>
              <Text style={[styles.dayLabel, { color: colors.neutral[500] }]}>
                {format(day, 'EEE', { locale: fr }).charAt(0)}
              </Text>
            </View>
          ))}
        </View>

        {/* Grille des jours */}
        <View style={styles.daysGrid}>
          {weekData.map((day, index) => (
            <View
              key={`day-${index}`}
              style={[
                styles.dayCell,
                day.isToday && {
                  borderColor: colors.accent[500],
                  borderWidth: 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.dayNumber,
                  { color: day.isToday ? colors.accent[500] : colors.text },
                ]}
              >
                {day.date.getDate()}
              </Text>

              <View style={styles.indicators}>
                {/* Indicateur d'hydratation */}
                <View
                  style={[
                    styles.indicator,
                    {
                      backgroundColor: colors.primary[100],
                      height: day.water * 20 + 5,
                    },
                  ]}
                >
                  <Droplet
                    size={day.water > 0.5 ? 12 : 10}
                    color={colors.primary[500]}
                  />
                </View>

                {/* Indicateur de course */}
                {day.running && (
                  <View
                    style={[
                      styles.indicator,
                      { backgroundColor: colors.secondary[100] },
                    ]}
                  >
                    <Activity size={10} color={colors.secondary[500]} />
                  </View>
                )}

                {/* Indicateur de tâches */}
                {day.tasks.total > 0 && (
                  <View
                    style={[
                      styles.indicator,
                      { backgroundColor: colors.accent[100] },
                    ]}
                  >
                    <Text
                      style={[styles.taskCount, { color: colors.accent[500] }]}
                    >
                      {day.tasks.completed}/{day.tasks.total}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Légende */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <Droplet size={14} color={colors.primary[500]} />
          <Text style={[styles.legendText, { color: colors.neutral[500] }]}>
            Hydratation
          </Text>
        </View>

        <View style={styles.legendItem}>
          <Activity size={14} color={colors.secondary[500]} />
          <Text style={[styles.legendText, { color: colors.neutral[500] }]}>
            Course
          </Text>
        </View>

        <View style={styles.legendItem}>
          <CheckSquare size={14} color={colors.accent[500]} />
          <Text style={[styles.legendText, { color: colors.neutral[500] }]}>
            Tâches
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  calendar: {
    marginBottom: 12,
  },
  dayLabels: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayLabelContainer: {
    width: DAY_SIZE,
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  daysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: DAY_SIZE - 4,
    height: DAY_SIZE * 1.2,
    borderRadius: 8,
    alignItems: 'center',
    padding: 4,
    borderColor: 'transparent',
  },
  dayNumber: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  indicators: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
  },
  indicator: {
    minHeight: 20,
    width: '80%',
    borderRadius: 4,
    marginBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCount: {
    fontSize: 9,
    fontFamily: 'Inter-Bold',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginLeft: 4,
  },
});
