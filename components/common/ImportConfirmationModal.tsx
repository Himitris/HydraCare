// components/common/ImportConfirmationModal.tsx
import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { AlertTriangle, Check, X } from 'lucide-react-native';

interface ImportConfirmationModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
  colors: any;
}

const ImportConfirmationModal = ({
  visible,
  onCancel,
  onConfirm,
  isProcessing,
  colors,
}: ImportConfirmationModalProps) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          <View style={styles.warningContainer}>
            <View
              style={[
                styles.warningIconContainer,
                { backgroundColor: colors.warning[100] },
              ]}
            >
              <AlertTriangle size={32} color={colors.warning[500]} />
            </View>
            <Text style={[styles.warningTitle, { color: colors.text }]}>
              Attention
            </Text>
            <Text
              style={[styles.warningMessage, { color: colors.neutral[600] }]}
            >
              Cette action remplacera toutes vos données actuelles par celles du
              fichier importé. Cette opération est irréversible.
            </Text>
          </View>

          <Text style={[styles.confirmText, { color: colors.text }]}>
            Êtes-vous sûr de vouloir continuer?
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                { backgroundColor: colors.neutral[200] },
              ]}
              onPress={onCancel}
              disabled={isProcessing}
            >
              <X size={20} color={colors.neutral[700]} />
              <Text style={[styles.buttonText, { color: colors.neutral[700] }]}>
                Annuler
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: colors.accent[500] },
              ]}
              onPress={onConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Check size={20} color="#fff" />
                  <Text style={[styles.buttonText, { color: '#fff' }]}>
                    Confirmer
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  warningContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  warningIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  warningMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  confirmText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 8,
  },
  cancelButton: {
    marginRight: 4,
  },
  confirmButton: {
    marginLeft: 4,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
});

export default ImportConfirmationModal;
