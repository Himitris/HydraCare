// app/settings.tsx (mise à jour)
import ImportConfirmationModal from '@/components/common/ImportConfirmationModal';
import Colors from '@/constants/Colors';
import { useAppContext } from '@/context/AppContext';
import { useIntegration } from '@/context/IntegrationContext';
import { ImportExportService } from '@/services/ImportExportService';
import { useRouter } from 'expo-router';
import {
  Activity,
  Bell,
  CheckSquare,
  ChevronLeft,
  Download,
  Droplet,
  Moon,
  RefreshCw,
  Upload,
  Zap,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode, settings, updateSettings } =
    useAppContext();
  const {
    addRunningTaskOnCompletion,
    setAddRunningTaskOnCompletion,
    reminderForWaterAfterRun,
    setReminderForWaterAfterRun,
  } = useIntegration();

  const colors = isDarkMode ? Colors.dark : Colors.light;
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [importData, setImportData] = useState<any>(null);

  // Fonction pour gérer l'export des données
  const handleExportData = async (directSave: boolean) => {
    setIsExporting(true);
    try {
      const success = await ImportExportService.exportAllData(directSave);
      if (!success) {
        Alert.alert(
          "Échec de l'exportation",
          "Une erreur est survenue lors de l'exportation des données."
        );
      }
    } catch (error) {
      console.error("Erreur lors de l'exportation:", error);
      Alert.alert(
        'Erreur',
        "Une erreur inattendue est survenue lors de l'exportation des données."
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Fonction pour gérer l'import des données
  const handleImportData = async () => {
    setIsImporting(true);
    try {
      // Lire et valider le fichier d'import
      const data = await ImportExportService.readImportFile();
      if (data) {
        // Stocker les données pour une utilisation ultérieure
        setImportData(data);
        // Afficher la modale de confirmation
        setIsConfirmModalVisible(true);
      }
    } catch (error) {
      console.error("Erreur lors de l'importation:", error);
      Alert.alert(
        'Erreur',
        "Une erreur inattendue est survenue lors de l'importation des données."
      );
    } finally {
      setIsImporting(false);
    }
  };

  // Fonction pour confirmer l'import
  const confirmImport = async () => {
    if (!importData) return;

    setIsImporting(true);
    try {
      const success = await ImportExportService.applyImportData(importData);
      if (success) {
        // La modale de réussite est affichée dans applyImportData
        setIsConfirmModalVisible(false);
      }
    } catch (error) {
      console.error("Erreur lors de l'application des données:", error);
      Alert.alert(
        'Erreur',
        "Une erreur inattendue est survenue lors de l'application des données importées."
      );
    } finally {
      setIsImporting(false);
      setIsConfirmModalVisible(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* En-tête avec bouton de retour */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Paramètres
        </Text>

        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Apparence */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Apparence
          </Text>
          <View
            style={[
              styles.settingCard,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <TouchableOpacity
              style={styles.settingItem}
              onPress={toggleDarkMode}
            >
              <View style={styles.settingLeft}>
                <Moon size={20} color={colors.text} />
                <Text style={[styles.settingText, { color: colors.text }]}>
                  {isDarkMode ? 'Mode sombre' : 'Mode clair'}
                </Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{
                  false: colors.neutral[300],
                  true: colors.primary[300],
                }}
                thumbColor={
                  isDarkMode ? colors.primary[500] : colors.neutral[100]
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* HydraCare Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Droplet size={20} color={colors.primary[500]} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              HydraCare
            </Text>
          </View>

          <View
            style={[
              styles.settingCard,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={[styles.settingText, { color: colors.text }]}>
                  Objectif quotidien
                </Text>
              </View>
              <Text
                style={[styles.settingValue, { color: colors.primary[500] }]}
              >
                {settings.dailyGoal} ml
              </Text>
            </View>

            <View style={styles.separator} />

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Bell size={20} color={colors.text} />
                <Text style={[styles.settingText, { color: colors.text }]}>
                  {settings.remindersEnabled
                    ? 'Rappels activés'
                    : 'Rappels désactivés'}
                </Text>
              </View>
              <Switch
                value={settings.remindersEnabled}
                onValueChange={(value) =>
                  updateSettings({ remindersEnabled: value })
                }
                trackColor={{
                  false: colors.neutral[300],
                  true: colors.primary[300],
                }}
                thumbColor={
                  settings.remindersEnabled
                    ? colors.primary[500]
                    : colors.neutral[100]
                }
              />
            </View>

            <View style={styles.separator} />

            <TouchableOpacity
              style={styles.settingLink}
              onPress={() => router.push('/(apps)/hydracare/settings')}
            >
              <Text
                style={[styles.settingText, { color: colors.primary[500] }]}
              >
                Plus de paramètres HydraCare →
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Running Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Activity size={20} color={colors.secondary[500]} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Running
            </Text>
          </View>

          <View
            style={[
              styles.settingCard,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <TouchableOpacity
              style={styles.settingLink}
              onPress={() => router.push('/(apps)/running/filters')}
            >
              <Text
                style={[styles.settingText, { color: colors.secondary[500] }]}
              >
                Filtres de course →
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Todo Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CheckSquare size={20} color={colors.accent[500]} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Tâches
            </Text>
          </View>

          <View
            style={[
              styles.settingCard,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <TouchableOpacity
              style={styles.settingLink}
              onPress={() => router.push('/(apps)/todo/tags')}
            >
              <Text style={[styles.settingText, { color: colors.accent[500] }]}>
                Gérer les tags →
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Integration Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Intégration
          </Text>

          <View
            style={[
              styles.settingCard,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Activity size={20} color={colors.secondary[500]} />
                <Text style={[styles.settingText, { color: colors.text }]}>
                  Ajouter une tâche après une course
                </Text>
              </View>
              <Switch
                value={addRunningTaskOnCompletion}
                onValueChange={setAddRunningTaskOnCompletion}
                trackColor={{
                  false: colors.neutral[300],
                  true: colors.secondary[300],
                }}
                thumbColor={
                  addRunningTaskOnCompletion
                    ? colors.secondary[500]
                    : colors.neutral[100]
                }
              />
            </View>

            <View style={styles.separator} />

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Droplet size={20} color={colors.primary[500]} />
                <Text style={[styles.settingText, { color: colors.text }]}>
                  Rappel d'hydratation après une course
                </Text>
              </View>
              <Switch
                value={reminderForWaterAfterRun}
                onValueChange={setReminderForWaterAfterRun}
                trackColor={{
                  false: colors.neutral[300],
                  true: colors.primary[300],
                }}
                thumbColor={
                  reminderForWaterAfterRun
                    ? colors.primary[500]
                    : colors.neutral[100]
                }
              />
            </View>
          </View>
        </View>

        {/* Données et Export */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Données de l'application
          </Text>

          <View
            style={[
              styles.settingCard,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            {/* Bouton d'exportation avec partage */}
            <TouchableOpacity
              style={styles.dataButton}
              onPress={() => handleExportData(false)}
              disabled={isExporting}
            >
              <View style={styles.dataButtonInner}>
                <Upload size={20} color={colors.accent[500]} />
                <Text
                  style={[styles.dataButtonText, { color: colors.accent[500] }]}
                >
                  Partager les données
                </Text>
              </View>
              {isExporting && (
                <ActivityIndicator size="small" color={colors.accent[500]} />
              )}
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* Nouveau bouton pour l'exportation directe */}
            <TouchableOpacity
              style={styles.dataButton}
              onPress={() => handleExportData(true)}
              disabled={isExporting}
            >
              <View style={styles.dataButtonInner}>
                <Download size={20} color={colors.accent[500]} />
                <Text
                  style={[styles.dataButtonText, { color: colors.accent[500] }]}
                >
                  Enregistrer sur l'appareil
                </Text>
              </View>
              {isExporting && (
                <ActivityIndicator size="small" color={colors.accent[500]} />
              )}
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* Bouton d'importation */}
            <TouchableOpacity
              style={styles.dataButton}
              onPress={handleImportData}
              disabled={isImporting}
            >
              <View style={styles.dataButtonInner}>
                <Upload size={20} color={colors.accent[500]} />
                <Text
                  style={[styles.dataButtonText, { color: colors.accent[500] }]}
                >
                  Importer des données
                </Text>
              </View>
              {isImporting && (
                <ActivityIndicator size="small" color={colors.accent[500]} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* About & Reset */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Application
          </Text>

          <View
            style={[
              styles.settingCard,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Zap size={20} color={colors.text} />
                <Text style={[styles.settingText, { color: colors.text }]}>
                  Version de l'application
                </Text>
              </View>
              <Text
                style={[styles.settingValue, { color: colors.neutral[500] }]}
              >
                1.0.0
              </Text>
            </View>

            <View style={styles.separator} />

            <TouchableOpacity
              style={styles.dangerButton}
              onPress={() => {
                // Logique de réinitialisation...
                Alert.alert(
                  'Réinitialiser toutes les données',
                  'Êtes-vous sûr de vouloir réinitialiser toutes les données ? Cette action ne peut pas être annulée.',
                  [
                    {
                      text: 'Annuler',
                      style: 'cancel',
                    },
                    {
                      text: 'Réinitialiser',
                      style: 'destructive',
                      onPress: () => {
                        // Logique de réinitialisation ici
                      },
                    },
                  ]
                );
              }}
            >
              <RefreshCw size={20} color={colors.error[500]} />
              <Text
                style={[styles.dangerButtonText, { color: colors.error[500] }]}
              >
                Réinitialiser toutes les données
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modale de confirmation d'importation */}
      <ImportConfirmationModal
        visible={isConfirmModalVisible}
        onCancel={() => setIsConfirmModalVisible(false)}
        onConfirm={confirmImport}
        isProcessing={isImporting}
        colors={colors}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
    marginLeft: 8,
  },
  settingCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginLeft: 12,
  },
  settingValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  settingLink: {
    padding: 16,
    alignItems: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 16,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  dangerButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
  },
  dataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  dataButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginLeft: 12,
  },
});
