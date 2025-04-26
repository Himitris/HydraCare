// services/ImportExportService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform, Alert } from 'react-native';

// Clés de stockage utilisées dans l'application
const STORAGE_KEYS = {
  // HydraCare
  settings: 'hydracare-settings',
  todayIntake: 'hydracare-today',
  todayKey: 'hydracare-today-key',
  history: 'hydracare-history',
  theme: 'hydracare-theme',

  // Running
  runningSessions: '@hydracare/running_sessions',

  // Todo
  todos: '@hydracare/todos',

  // Integration
  integrationPrefs: '@hydracare/integration_prefs',
  achievements: '@hydracare/achievements',
};

interface ExportData {
  exportDate: string;
  appVersion: string;
  data: {
    [key: string]: any;
  };
}

export class ImportExportService {
  /**
   * Exporte toutes les données de l'application vers un fichier
   */
  static async exportAllData(): Promise<boolean> {
    try {
      // Récupérer toutes les données
      const allData: { [key: string]: any } = {};
      const allKeys = Object.values(STORAGE_KEYS);

      // Récupérer les données en une seule fois avec multiGet
      const results = await AsyncStorage.multiGet(allKeys);

      // Traiter les résultats
      for (const [key, value] of results) {
        if (value) {
          try {
            // Tenter de parser le JSON pour les objets
            allData[key] = JSON.parse(value);
          } catch {
            // Si ce n'est pas du JSON, stocker la valeur brute
            allData[key] = value;
          }
        }
      }

      // Créer l'objet d'export avec métadonnées
      const exportData: ExportData = {
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0', // À mettre à jour avec la version réelle
        data: allData,
      };

      // Convertir en JSON
      const jsonData = JSON.stringify(exportData, null, 2);

      // Générer un nom de fichier unique
      const now = new Date();
      const fileName = `hydracare_export_${now.getFullYear()}-${(
        now.getMonth() + 1
      )
        .toString()
        .padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now
        .getHours()
        .toString()
        .padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}.json`;

      // Gestion spécifique pour le web et les appareils mobiles
      if (Platform.OS === 'web') {
        // Pour le Web, télécharger directement
        const blob = new Blob([jsonData], {
          type: 'application/json;charset=utf-8;',
        });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Pour les appareils mobiles
        const fileUri = FileSystem.documentDirectory + fileName;

        // Écrire le fichier
        await FileSystem.writeAsStringAsync(fileUri, jsonData, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        // Vérifier si le partage est disponible
        const canShare = await Sharing.isAvailableAsync();

        if (canShare) {
          // Partager le fichier
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Exporter les données HydraCare',
            UTI: 'public.json',
          });
        } else {
          Alert.alert(
            'Partage non disponible',
            "Le partage de fichiers n'est pas disponible sur cet appareil."
          );
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Erreur lors de l'exportation des données:", error);
      return false;
    }
  }

  /**
   * Lit et valide un fichier d'import
   */
  static async readImportFile(): Promise<ExportData | null> {
    try {
      // Sélectionner un fichier
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      // Vérifier si l'utilisateur a annulé ou s'il y a une erreur
      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const fileUri = result.assets[0].uri;

      // Lire le contenu du fichier
      const fileContent = await FileSystem.readAsStringAsync(fileUri);

      // Parser le JSON
      const importData = JSON.parse(fileContent) as ExportData;

      // Vérifier que le fichier est bien un export HydraCare
      if (!importData.exportDate || !importData.data) {
        Alert.alert(
          'Format invalide',
          "Le fichier sélectionné n'est pas un export HydraCare valide."
        );
        return null;
      }

      return importData;
    } catch (error) {
      console.error("Erreur lors de la lecture du fichier d'import:", error);
      Alert.alert(
        'Erreur de lecture',
        "Impossible de lire le fichier sélectionné. Vérifiez qu'il s'agit bien d'un fichier d'export HydraCare valide."
      );
      return null;
    }
  }

  /**
   * Applique les données d'un fichier d'import
   */
  static async applyImportData(importData: ExportData): Promise<boolean> {
    try {
      const data = importData.data;
      const batchOperations: [string, string][] = [];

      // Préparer les opérations de stockage
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const value = JSON.stringify(data[key]);
          batchOperations.push([key, value]);
        }
      }

      // Effectuer toutes les opérations en une seule fois
      if (batchOperations.length > 0) {
        await AsyncStorage.multiSet(batchOperations);
      }

      Alert.alert(
        'Importation réussie',
        "Toutes les données ont été importées avec succès. L'application va redémarrer pour appliquer les changements."
      );

      return true;
    } catch (error) {
      console.error(
        "Erreur lors de l'application des données d'import:",
        error
      );
      Alert.alert(
        'Erreur',
        "Une erreur est survenue lors de l'importation des données."
      );
      return false;
    }
  }

  /**
   * Importe les données depuis un fichier
   * Cette méthode est un point d'entrée pour le processus d'importation
   * mais l'implémentation réelle utilise readImportFile et applyImportData
   */
  static async importFromFile(): Promise<boolean> {
    try {
      const importData = await this.readImportFile();
      if (!importData) {
        return false;
      }

      // La confirmation et l'application des données se font dans les composants UI
      // pour pouvoir utiliser les modals de confirmation au lieu des Alert
      return true;
    } catch (error) {
      console.error("Erreur lors de l'importation du fichier:", error);
      return false;
    }
  }
}
