import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Modal } from 'react-native';
import { X } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DatePickerModalProps {
  visible: boolean;
  date: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  colors: any;
}

const DatePickerModal = ({
  visible,
  date,
  onConfirm,
  onCancel,
  colors,
}: DatePickerModalProps) => {
  const [selectedDate, setSelectedDate] = React.useState(date);

  React.useEffect(() => {
    setSelectedDate(date);
  }, [date]);

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.modalContainer}>
        <View
          style={[
            styles.datePickerContainer,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          <View style={styles.datePickerHeader}>
            <Text style={[styles.datePickerTitle, { color: colors.text }]}>
              Sélectionner une date
            </Text>
            <TouchableOpacity onPress={onCancel}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="spinner"
            onChange={(_, date) => date && setSelectedDate(date)}
            style={{ width: '100%' }}
            locale="fr"
          />

          <TouchableOpacity
            style={[
              styles.datePickerButton,
              { backgroundColor: colors.secondary[500] },
            ]}
            onPress={() => onConfirm(selectedDate)}
          >
            <Text style={styles.datePickerButtonText}>Confirmer</Text>
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
  datePickerContainer: {
    width: '90%',
    borderRadius: 16,
    padding: 16,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  datePickerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
  },
  datePickerButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  datePickerButtonText: {
    color: '#fff',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
});

export default DatePickerModal;
