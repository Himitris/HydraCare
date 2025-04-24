import { Picker } from '@react-native-picker/picker';
import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (hours: number, minutes: number, seconds: number) => void;
  initialHours?: number;
  initialMinutes?: number;
  initialSeconds?: number;
  colors: any;
}

const TimePickerModal = ({
  visible,
  onClose,
  onConfirm,
  initialHours = 0,
  initialMinutes = 30,
  initialSeconds = 0,
  colors,
}: TimePickerModalProps) => {
  const [hours, setHours] = useState(initialHours);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(initialSeconds);

  // Générer les options pour heures (0-23), minutes et secondes (0-59)
  const hoursOptions = Array.from({ length: 24 }, (_, i) => i);
  const minutesOptions = Array.from({ length: 60 }, (_, i) => i);
  const secondsOptions = Array.from({ length: 60 }, (_, i) => i);

  const handleConfirm = () => {
    onConfirm(hours, minutes, seconds);
    onClose();
  };

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View
          style={[
            styles.timePickerContainer,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          <View style={styles.timePickerHeader}>
            <Text style={[styles.timePickerTitle, { color: colors.text }]}>
              Durée de la sortie
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.pickerRow}>
            <View style={styles.pickerColumn}>
              <Text
                style={[styles.pickerLabel, { color: colors.neutral[500] }]}
              >
                Heures
              </Text>
              <View
                style={[
                  styles.pickerWrapper,
                  { backgroundColor: colors.background },
                ]}
              >
                <Picker
                  selectedValue={hours}
                  onValueChange={(itemValue) => setHours(Number(itemValue))}
                  style={[styles.picker, { color: colors.text }]}
                  dropdownIconColor={colors.neutral[500]}
                >
                  {hoursOptions.map((value) => (
                    <Picker.Item
                      key={`hours-${value}`}
                      label={value.toString().padStart(2, '0')}
                      value={value}
                      color={
                        Platform.OS === 'android' ? colors.text : undefined
                      }
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.pickerColumn}>
              <Text
                style={[styles.pickerLabel, { color: colors.neutral[500] }]}
              >
                Minutes
              </Text>
              <View
                style={[
                  styles.pickerWrapper,
                  { backgroundColor: colors.background },
                ]}
              >
                <Picker
                  selectedValue={minutes}
                  onValueChange={(itemValue) => setMinutes(Number(itemValue))}
                  style={[styles.picker, { color: colors.text }]}
                  dropdownIconColor={colors.neutral[500]}
                >
                  {minutesOptions.map((value) => (
                    <Picker.Item
                      key={`minutes-${value}`}
                      label={value.toString().padStart(2, '0')}
                      value={value}
                      color={
                        Platform.OS === 'android' ? colors.text : undefined
                      }
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.pickerColumn}>
              <Text
                style={[styles.pickerLabel, { color: colors.neutral[500] }]}
              >
                Secondes
              </Text>
              <View
                style={[
                  styles.pickerWrapper,
                  { backgroundColor: colors.background },
                ]}
              >
                <Picker
                  selectedValue={seconds}
                  onValueChange={(itemValue) => setSeconds(Number(itemValue))}
                  style={[styles.picker, { color: colors.text }]}
                  dropdownIconColor={colors.neutral[500]}
                >
                  {secondsOptions.map((value) => (
                    <Picker.Item
                      key={`seconds-${value}`}
                      label={value.toString().padStart(2, '0')}
                      value={value}
                      color={
                        Platform.OS === 'android' ? colors.text : undefined
                      }
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.timeDisplay}>
            <Text style={[styles.timeDisplayText, { color: colors.text }]}>
              {hours.toString().padStart(2, '0')}h{' '}
              {minutes.toString().padStart(2, '0')}m{' '}
              {seconds.toString().padStart(2, '0')}s
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              { backgroundColor: colors.secondary[500] },
            ]}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>Confirmer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  timePickerContainer: {
    width: '90%',
    borderRadius: 16,
    padding: 16,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timePickerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
    width: '90%',
  },
  picker: {
    height: 120,
    width: '100%',
  },
  timeDisplay: {
    marginTop: 20,
    alignItems: 'center',
    padding: 12,
  },
  timeDisplayText: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
  },
  confirmButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});

export default TimePickerModal;
