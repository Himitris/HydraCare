// app/(apps)/running/index.tsx
import React from 'react';
import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';
import { Activity } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function RunningScreen() {
  const { isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={
          isDarkMode
            ? [colors.background, colors.secondary[50]]
            : [colors.secondary[50], colors.background]
        }
        locations={[0, 0.8]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Activity size={48} color={colors.secondary[500]} />
            <Text style={[styles.title, { color: colors.text }]}>
              Running App
            </Text>
            <Text style={[styles.subtitle, { color: colors.neutral[500] }]}>
              Coming Soon
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
              Your running dashboard will appear here
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
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
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
