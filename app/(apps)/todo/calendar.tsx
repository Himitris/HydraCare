// app/(apps)/todo/calendar.tsx
import React from 'react';
import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';
import { Calendar } from 'lucide-react-native';

export default function TodoCalendarScreen() {
  const { isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Calendar size={48} color={colors.accent[500]} />
            <Text style={[styles.title, { color: colors.text }]}>
              Calendar View
            </Text>
          </View>

          <View
            style={[
              styles.placeholder,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Text
              style={[styles.placeholderText, { color: colors.neutral[500] }]}
            >
              Calendar view will appear here
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginTop: 16,
  },
  placeholder: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
});
