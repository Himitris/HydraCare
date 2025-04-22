import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Moon, Sun, Bell, BellOff, Scale, Target } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';

export default function SettingsScreen() {
  const { settings, updateSettings, toggleDarkMode, isDarkMode } =
    useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState(settings.dailyGoal.toString());

  const handleSaveGoal = () => {
    const newGoal = parseInt(goalInput);
    if (!isNaN(newGoal) && newGoal > 0 && newGoal <= 10000) {
      updateSettings({ dailyGoal: newGoal });
      setShowGoalModal(false);
    }
  };

  const formatGoal = () => {
    return settings.preferredUnit === 'ml'
      ? `${settings.dailyGoal} ml`
      : `${Math.round(settings.dailyGoal * 0.033814)} oz`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

        <View
          style={[styles.section, { backgroundColor: colors.cardBackground }]}
        >
          {/* Dark mode toggle */}
          <TouchableOpacity style={styles.setting} onPress={toggleDarkMode}>
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

          {/* Daily goal setting */}
          <TouchableOpacity
            style={styles.setting}
            onPress={() => {
              setGoalInput(settings.dailyGoal.toString());
              setShowGoalModal(true);
            }}
          >
            <View style={styles.settingInfo}>
              <Target color={colors.text} size={24} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingText, { color: colors.text }]}>
                  Daily Goal
                </Text>
                <Text
                  style={[styles.settingValue, { color: colors.primary[500] }]}
                >
                  {formatGoal()}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Reminders toggle */}
          <TouchableOpacity
            style={styles.setting}
            onPress={() =>
              updateSettings({ remindersEnabled: !settings.remindersEnabled })
            }
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

          {/* Unit preference */}
          <TouchableOpacity
            style={styles.setting}
            onPress={() =>
              updateSettings({
                preferredUnit: settings.preferredUnit === 'ml' ? 'oz' : 'ml',
              })
            }
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

      {/* Goal setting modal */}
      <Modal
        visible={showGoalModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGoalModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Set Daily Goal
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.background,
                    borderColor: colors.primary[500],
                  },
                ]}
                value={goalInput}
                onChangeText={setGoalInput}
                keyboardType="numeric"
                placeholder="Enter amount"
                placeholderTextColor={colors.neutral[400]}
                maxLength={5}
              />
              <Text style={[styles.unitLabel, { color: colors.text }]}>
                {settings.preferredUnit}
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                  { backgroundColor: colors.neutral[200] },
                ]}
                onPress={() => setShowGoalModal(false)}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.saveButton,
                  { backgroundColor: colors.primary[500] },
                ]}
                onPress={handleSaveGoal}
              >
                <Text style={[styles.buttonText, { color: 'white' }]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  settingTextContainer: {
    marginLeft: 12,
  },
  settingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginLeft: 12,
  },
  settingValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginLeft: 12,
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  input: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    width: 150,
    textAlign: 'center',
  },
  unitLabel: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    marginLeft: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    marginRight: 4,
  },
  saveButton: {
    marginLeft: 4,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});
