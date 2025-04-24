// components/running/EmptyState.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Activity } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface EmptyStateProps {
  colors: any;
}

export default function EmptyState({ colors }: EmptyStateProps) {
  return (
    <Animated.View
      entering={FadeInDown}
      style={[styles.emptyState, { backgroundColor: colors.cardBackground }]}
    >
      <View
        style={[styles.emptyIcon, { backgroundColor: colors.secondary[100] }]}
      >
        <Activity size={40} color={colors.secondary[500]} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        Commencez votre journal
      </Text>
      <Text style={[styles.emptyText, { color: colors.neutral[500] }]}>
        Enregistrez vos sorties et suivez vos sensations au fil du temps
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
});
