import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';

interface FilterHelpModalProps {
  visible: boolean;
  onClose: () => void;
  colors: any;
}

const FilterHelpModal = ({
  visible,
  onClose,
  colors,
}: FilterHelpModalProps) => {
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
            styles.helpModalContent,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          <View style={styles.helpModalHeader}>
            <Text style={[styles.helpModalTitle, { color: colors.text }]}>
              Comment utiliser les filtres
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.helpScrollView}>
            <View style={styles.helpSection}>
              <Text
                style={[
                  styles.helpSectionTitle,
                  { color: colors.secondary[500] },
                ]}
              >
                Filtres disponibles
              </Text>
              <Text style={[styles.helpText, { color: colors.text }]}>
                Vous pouvez combiner plusieurs filtres pour affiner votre
                recherche. Activez ou désactivez chaque filtre avec les
                interrupteurs.
              </Text>
            </View>

            <View style={styles.helpSection}>
              <Text
                style={[
                  styles.helpSectionTitle,
                  { color: colors.secondary[500] },
                ]}
              >
                Plage de dates
              </Text>
              <Text style={[styles.helpText, { color: colors.text }]}>
                Filtrez vos séances entre deux dates spécifiques. Par défaut,
                les 3 derniers mois sont affichés.
              </Text>
            </View>

            <View style={styles.helpSection}>
              <Text
                style={[
                  styles.helpSectionTitle,
                  { color: colors.secondary[500] },
                ]}
              >
                Distance, durée et allure
              </Text>
              <Text style={[styles.helpText, { color: colors.text }]}>
                Définissez des valeurs minimales et/ou maximales pour chaque
                critère. Laissez un champ vide pour ne pas avoir de limite.
              </Text>
            </View>

            <View style={styles.helpSection}>
              <Text
                style={[
                  styles.helpSectionTitle,
                  { color: colors.secondary[500] },
                ]}
              >
                Ressenti
              </Text>
              <Text style={[styles.helpText, { color: colors.text }]}>
                Sélectionnez un ou plusieurs ressentis pour filtrer vos séances.
              </Text>
            </View>

            <View style={styles.helpSection}>
              <Text
                style={[
                  styles.helpSectionTitle,
                  { color: colors.secondary[500] },
                ]}
              >
                Exportation CSV
              </Text>
              <Text style={[styles.helpText, { color: colors.text }]}>
                Le bouton d'exportation CSV vous permet de télécharger toutes
                les données des séances filtrées. Ce fichier peut être ouvert
                dans Excel ou tout autre tableur.
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.helpModalButton,
              { backgroundColor: colors.secondary[500] },
            ]}
            onPress={onClose}
          >
            <Text style={styles.helpModalButtonText}>J'ai compris</Text>
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
  helpModalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
  },
  helpModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  helpModalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
  },
  helpScrollView: {
    maxHeight: 400,
  },
  helpSection: {
    marginBottom: 16,
  },
  helpSectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  helpText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  helpModalButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  helpModalButtonText: {
    color: '#fff',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
});

export default FilterHelpModal;
