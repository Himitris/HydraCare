// components/running/SessionCard.tsx
import Colors from '@/constants/Colors';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Edit2, Frown, Meh, Smile, Trash2 } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface RunningSession {
  id: string;
  date: Date;
  feeling: 'great' | 'good' | 'average' | 'bad';
  description: string;
  distance?: number;
  duration?: number;
  pace?: number;
  calories?: number;
  elevationGain?: number;
  maxHeartRate?: number;
  avgHeartRate?: number;
}

interface SessionCardProps {
  session: RunningSession;
  index: number;
  onEdit: (session: RunningSession) => void;
  onDelete: (id: string) => void;
  onPress: (session: RunningSession) => void;
  colors: any;
}

export default function SessionCard({
  session,
  index,
  onEdit,
  onDelete,
  onPress,
  colors,
}: SessionCardProps) {
  const getFeelingIcon = (feeling: RunningSession['feeling']) => {
    switch (feeling) {
      case 'great':
        return <Smile size={24} color={colors.success[500]} />;
      case 'good':
        return <Smile size={24} color={colors.primary[500]} />;
      case 'average':
        return <Meh size={24} color={colors.warning[500]} />;
      case 'bad':
        return <Frown size={24} color={colors.error[500]} />;
    }
  };

  const getFeelingColor = (feeling: RunningSession['feeling']) => {
    switch (feeling) {
      case 'great':
        return colors.success[500];
      case 'good':
        return colors.primary[500];
      case 'average':
        return colors.warning[500];
      case 'bad':
        return colors.error[500];
    }
  };

  const getFeelingLabel = (feeling: RunningSession['feeling']) => {
    switch (feeling) {
      case 'great':
        return 'Excellent';
      case 'good':
        return 'Bien';
      case 'average':
        return 'Moyen';
      case 'bad':
        return 'Difficile';
    }
  };

  return (
    <Animated.View key={session.id} entering={FadeInDown.delay(index * 100)}>
      <TouchableOpacity
        style={[styles.sessionCard, { backgroundColor: colors.cardBackground }]}
        activeOpacity={0.8}
        onPress={() => onPress(session)}
      >
        <View style={styles.sessionHeader}>
          <View style={styles.sessionInfo}>
            <View
              style={[
                styles.feelingIndicator,
                {
                  backgroundColor: getFeelingColor(session.feeling) + '20',
                },
              ]}
            >
              {getFeelingIcon(session.feeling)}
            </View>
            <View style={styles.sessionTextInfo}>
              <Text style={[styles.sessionDateText, { color: colors.text }]}>
                {format(new Date(session.date), 'EEEE d MMMM', {
                  locale: fr,
                })}
              </Text>
              <Text
                style={[
                  styles.feelingText,
                  { color: getFeelingColor(session.feeling) },
                ]}
              >
                {getFeelingLabel(session.feeling)}
              </Text>
            </View>
          </View>
          <View style={styles.sessionActions}>
            <TouchableOpacity
              onPress={() => onEdit(session)}
              style={styles.actionButton}
            >
              <Edit2 size={18} color={colors.secondary[500]} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onDelete(session.id)}
              style={styles.actionButton}
            >
              <Trash2 size={18} color={colors.error[500]} />
            </TouchableOpacity>
          </View>
        </View>
        <Text
          style={[styles.description, { color: colors.neutral[600] }]}
          numberOfLines={2}
        >
          {session.description}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sessionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  feelingIndicator: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionTextInfo: {
    marginLeft: 12,
  },
  sessionDateText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  feelingText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
});

