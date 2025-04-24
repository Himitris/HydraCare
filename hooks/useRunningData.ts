// hooks/useRunningData.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, isAfter, isBefore, subMonths } from 'date-fns';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';

const STORAGE_KEY = '@hydracare/running_sessions';

export interface RunningSession {
  id: string;
  date: Date;
  feeling: 'Excellent' | 'Bien' | 'Moyen' | 'Difficile';
  description: string;
  distance?: number;
  duration?: number;
  pace?: number;
  calories?: number;
  elevationGain?: number;
  maxHeartRate?: number;
  avgHeartRate?: number;
}

export interface Session {
  distance?: number;
  duration?: number;
  feeling?: string;
}

export interface RunningData {
  filteredSessions: Session[];
  isLoading: boolean;
  isExporting: boolean;
  filterOptions: FilterOptions;
  setFilterOptions: (options: FilterOptions) => void;
  resetFilters: () => void;
  exportToCSV: () => void;
  getFeelingLabel: (
    feeling: 'Excellent' | 'Bien' | 'Moyen' | 'Difficile'
  ) => string;
}

export interface FilterOptions {
  dateRange: {
    enabled: boolean;
    startDate: Date;
    endDate: Date;
  };
  distance: {
    enabled: boolean;
    min: number | null;
    max: number | null;
  };
  duration: {
    enabled: boolean;
    min: number | null;
    max: number | null;
  };
  pace: {
    enabled: boolean;
    min: number | null;
    max: number | null;
  };
  elevation: {
    enabled: boolean;
    min: number | null;
    max: number | null;
  };
  heartRate: {
    enabled: boolean;
    min: number | null;
    max: number | null;
  };
  feeling: {
    enabled: boolean;
    values: ('Excellent' | 'Bien' | 'Moyen' | 'Difficile')[];
  };
}

export function useRunningData() {
  const [sessions, setSessions] = useState<RunningSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<RunningSession[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Date par défaut à 3 mois en arrière
  const defaultStartDate = subMonths(new Date(), 3);

  // État par défaut pour les options de filtre
  const defaultFilterOptions: FilterOptions = {
    dateRange: {
      enabled: false,
      startDate: defaultStartDate,
      endDate: new Date(),
    },
    distance: {
      enabled: false,
      min: null,
      max: null,
    },
    duration: {
      enabled: false,
      min: null,
      max: null,
    },
    pace: {
      enabled: false,
      min: null,
      max: null,
    },
    elevation: {
      enabled: false,
      min: null,
      max: null,
    },
    heartRate: {
      enabled: false,
      min: null,
      max: null,
    },
    feeling: {
      enabled: false,
      values: ['Excellent', 'Bien', 'Moyen', 'Difficile'],
    },
  };

  const [filterOptions, setFilterOptions] =
    useState<FilterOptions>(defaultFilterOptions);

  // Charger les sessions depuis le stockage
  useEffect(() => {
    loadSessions();
  }, []);

  // Appliquer les filtres lorsque les options changent
  useEffect(() => {
    applyFilters();
  }, [filterOptions, sessions]);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const savedSessions = await AsyncStorage.getItem(STORAGE_KEY);

      if (savedSessions) {
        const parsedSessions = JSON.parse(savedSessions).map(
          (session: any) => ({
            ...session,
            date: new Date(session.date),
          })
        );
        setSessions(parsedSessions);
      }
    } catch (error) {
      console.error('Error loading running sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...sessions];

    // Filtre par plage de dates
    if (filterOptions.dateRange.enabled) {
      result = result.filter((session) => {
        const sessionDate = new Date(session.date);
        return (
          isAfter(sessionDate, filterOptions.dateRange.startDate) &&
          isBefore(sessionDate, filterOptions.dateRange.endDate)
        );
      });
    }

    // Filtre par distance
    if (filterOptions.distance.enabled) {
      result = result.filter((session) => {
        if (session.distance === undefined) return false;

        const { min, max } = filterOptions.distance;
        if (min !== null && session.distance < min) return false;
        if (max !== null && session.distance > max) return false;
        return true;
      });
    }

    // Filtre par durée
    if (filterOptions.duration.enabled) {
      result = result.filter((session) => {
        if (session.duration === undefined) return false;

        const { min, max } = filterOptions.duration;
        if (min !== null && session.duration < min) return false;
        if (max !== null && session.duration > max) return false;
        return true;
      });
    }

    // Filtre par allure
    if (filterOptions.pace.enabled) {
      result = result.filter((session) => {
        if (session.pace === undefined) return false;

        const { min, max } = filterOptions.pace;
        if (min !== null && session.pace < min) return false;
        if (max !== null && session.pace > max) return false;
        return true;
      });
    }

    // Filtre par dénivelé
    if (filterOptions.elevation.enabled) {
      result = result.filter((session) => {
        if (session.elevationGain === undefined) return false;

        const { min, max } = filterOptions.elevation;
        if (min !== null && session.elevationGain < min) return false;
        if (max !== null && session.elevationGain > max) return false;
        return true;
      });
    }

    // Filtre par fréquence cardiaque
    if (filterOptions.heartRate.enabled) {
      result = result.filter((session) => {
        if (session.avgHeartRate === undefined) return false;

        const { min, max } = filterOptions.heartRate;
        if (min !== null && session.avgHeartRate < min) return false;
        if (max !== null && session.avgHeartRate > max) return false;
        return true;
      });
    }

    // Filtre par ressenti
    if (filterOptions.feeling.enabled) {
      result = result.filter((session) =>
        filterOptions.feeling.values.includes(session.feeling)
      );
    }

    // Trier par date (plus récent en premier)
    result.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setFilteredSessions(result);
  };

  const resetFilters = () => {
    setFilterOptions(defaultFilterOptions);
  };

  const getFeelingLabel = (
    feeling: 'Excellent' | 'Bien' | 'Moyen' | 'Difficile'
  ) => {
    return feeling
  };

  const generateCSV = () => {
    if (filteredSessions.length === 0) {
      return null;
    }

    // Entêtes CSV
    const headers = [
      'Date',
      'Ressenti',
      'Description',
      'Distance (km)',
      'Durée (min)',
      'Allure (min/km)',
      'Calories',
      'Dénivelé (m)',
      'FC Moy (bpm)',
      'FC Max (bpm)',
    ];

    // Préparer les lignes de données
    const rows = filteredSessions.map((session) => [
      format(new Date(session.date), 'dd/MM/yyyy'),
      getFeelingLabel(session.feeling),
      `"${session.description.replace(/"/g, '""')}"`, // Échapper les guillemets pour le CSV
      session.distance !== undefined ? session.distance.toString() : '',
      session.duration !== undefined ? session.duration.toString() : '',
      session.pace !== undefined
        ? session.pace.toString().replace('.', ',')
        : '',
      session.calories !== undefined ? session.calories.toString() : '',
      session.elevationGain !== undefined
        ? session.elevationGain.toString()
        : '',
      session.avgHeartRate !== undefined ? session.avgHeartRate.toString() : '',
      session.maxHeartRate !== undefined ? session.maxHeartRate.toString() : '',
    ]);

    // Combiner entêtes et lignes
    const csvContent = [
      headers.join(';'),
      ...rows.map((row) => row.join(';')),
    ].join('\n');

    return csvContent;
  };

  const exportToCSV = async () => {
    try {
      setIsExporting(true);

      const csvContent = generateCSV();
      if (!csvContent) {
        Alert.alert(
          'Aucune donnée',
          'Aucune session ne correspond aux critères de filtre'
        );
        setIsExporting(false);
        return;
      }

      // Générer un nom de fichier avec la date
      const fileName = `running_data_${format(
        new Date(),
        'yyyyMMdd_HHmmss'
      )}.csv`;

      if (Platform.OS === 'web') {
        // Pour le Web, télécharger directement
        const blob = new Blob([csvContent], {
          type: 'text/csv;charset=utf-8;',
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
        await FileSystem.writeAsStringAsync(fileUri, csvContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        // Vérifier si le partage est disponible
        const canShare = await Sharing.isAvailableAsync();

        if (canShare) {
          // Partager le fichier
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Exporter les données de course',
            UTI: 'public.comma-separated-values-text',
          });
        } else {
          Alert.alert(
            'Partage non disponible',
            "Le partage de fichiers n'est pas disponible sur cet appareil."
          );
        }
      }

      Alert.alert(
        'Exportation réussie',
        `${filteredSessions.length} sessions ont été exportées au format CSV.`
      );
    } catch (error) {
      console.error("Erreur lors de l'exportation :", error);
      Alert.alert(
        'Erreur',
        "Une erreur est survenue lors de l'exportation des données"
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Statistiques générales
  const getRunningStats = () => {
    if (sessions.length === 0) return null;

    const totalDistance = sessions.reduce(
      (sum, session) => sum + (session.distance || 0),
      0
    );
    const totalDuration = sessions.reduce(
      (sum, session) => sum + (session.duration || 0),
      0
    );
    const totalSessions = sessions.length;
    const positiveFeeling = sessions.filter(
      (s) => s.feeling === 'Excellent' || s.feeling === 'Bien'
    ).length;
    const positivePercentage = Math.round(
      (positiveFeeling / totalSessions) * 100
    );

    // Trouver la course la plus longue
    const longestRun = [...sessions].sort(
      (a, b) => (b.distance || 0) - (a.distance || 0)
    )[0];

    // Trouver la course la plus rapide (avec la plus basse allure)
    const fastestRun = [...sessions]
      .filter((s) => s.pace && s.distance && s.distance > 2) // Au moins 2km pour être significatif
      .sort((a, b) => (a.pace || Infinity) - (b.pace || Infinity))[0];

    return {
      totalDistance,
      totalDuration,
      totalSessions,
      positivePercentage,
      longestRun,
      fastestRun,
      avgPace: totalDistance > 0 ? totalDuration / totalDistance : 0,
      avgDistance: totalDistance / totalSessions,
      avgDuration: totalDuration / totalSessions,
    };
  };

  return {
    sessions,
    filteredSessions,
    isLoading,
    isExporting,
    filterOptions,
    setFilterOptions,
    loadSessions,
    applyFilters,
    resetFilters,
    exportToCSV,
    getRunningStats,
    getFeelingLabel,
  };
}
