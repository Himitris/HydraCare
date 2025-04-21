import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Moon, Sun, Bell, BellOff, Scale } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';

export default function SettingsScreen() {
  const { settings, updateSettings, toggleDarkMode, isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <TouchableOpacity
            style={styles.setting}
            onPress={toggleDarkMode}
          >
            <View style={styles.settingInfo}>
              {isDarkMode ? (
                <Moon color={colors.text} size={24} />
              ) : (
                <Sun color={colors.text} size={24} />
              )}
              <Text style={[styles.settingText, { color: colors.text }]}>
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.setting}
            onPress={() => updateSettings({ remindersEnabled: !settings.remindersEnabled })}
          >
            <View style={styles.settingInfo}>
              {settings.remindersEnabled ? (
                <Bell color={colors.text} size={24} />
              ) : (
                <BellOff color={colors.text} size={24} />
              )}
              <Text style={[styles.settingText, { color: colors.text }]}>
                Reminders {settings.remindersEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.setting}
            onPress={() => updateSettings({ 
              preferredUnit: settings.preferredUnit === 'ml' ? 'oz' : 'ml' 
            })}
          >
            <View style={styles.settingInfo}>
              <Scale color={colors.text} size={24} />
              <Text style={[styles.settingText, { color: colors.text }]}>
                Unit: {settings.preferredUnit.toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginTop: 40,
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  setting: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginLeft: 12,
  },
});