// context/AppContext.tsx
import { NotificationService } from '@/services/NotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { AppState, Platform, NativeModules } from 'react-native';

// Fonction de debounce pour limiter la fréquence des appels de sauvegarde
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// Defining types for our context
interface UserSettings {
  dailyGoal: number;
  preferredUnit: 'ml' | 'oz';
  darkMode: boolean;
  remindersEnabled: boolean;
  reminderFrequency: number; // in minutes
  temporaryGoalAdjustment: number; // NOUVEAU: ajustement temporaire pour aujourd'hui
}

interface WaterIntake {
  id: string;
  amount: number;
  timestamp: number;
  unit: 'ml' | 'oz';
}

interface AppContextType {
  // User settings
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;

  // Water intake tracking
  todayIntake: WaterIntake[];
  addWaterIntake: (amount: number) => void;
  removeWaterIntake: (id: string) => void;
  resetTodayIntake: () => void;

  // History
  history: Record<string, WaterIntake[]>;
  clearHistory: () => void;

  // Progress
  dailyProgress: number; // 0 to 1

  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Ajout des méthodes pour l'ajustement temporaire
  applyTemporaryAdjustment: (adjustment: number) => void;
  clearTemporaryAdjustment: () => void;

  // Ajout d'un getter pour l'objectif du jour (base + ajustement)
  currentDailyGoal: number;
}

// Default settings
const defaultSettings: UserSettings = {
  dailyGoal: 2000, // ml
  preferredUnit: 'ml',
  darkMode: false,
  remindersEnabled: false, // Start with notifications disabled
  reminderFrequency: 60, // minutes
  temporaryGoalAdjustment: 0, // NOUVEAU: par défaut aucun ajustement
};

// Create context with default values
const AppContext = createContext<AppContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
  todayIntake: [],
  addWaterIntake: () => {},
  removeWaterIntake: () => {},
  resetTodayIntake: () => {},
  history: {},
  clearHistory: () => {},
  dailyProgress: 0,
  isDarkMode: false,
  toggleDarkMode: () => {},
  applyTemporaryAdjustment: () => {},
  clearTemporaryAdjustment: () => {},
  currentDailyGoal: 0,
});

// Helper to get today's date as a string key - memoized
const getTodayKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

// Cache en mémoire pour éviter des lectures AsyncStorage répétées
const memoryCache: Record<string, any> = {};

// Provider component
export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [todayIntake, setTodayIntake] = useState<WaterIntake[]>([]);
  const [history, setHistory] = useState<Record<string, WaterIntake[]>>({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Utilisation de refs pour les données qui ne doivent pas provoquer de re-rendus
  const notificationSubscriptionsRef = useRef<any>(null);
  const notificationUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const notificationInitializedRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  const saveInProgressRef = useRef(false);

  // Calcul du dailyGoal actuel incluant l'ajustement temporaire
  const currentDailyGoal = useMemo(() => {
    return settings.dailyGoal + settings.temporaryGoalAdjustment;
  }, [settings.dailyGoal, settings.temporaryGoalAdjustment]);

  // Memoize dailyProgress pour éviter les recalculs
  const dailyProgress = useMemo(() => {
    return (
      todayIntake.reduce((total, item) => total + item.amount, 0) /
      currentDailyGoal
    );
  }, [todayIntake, currentDailyGoal]);

  // Debounced save pour éviter trop d'opérations AsyncStorage
  const debouncedSaveData = useCallback(
    debounce(async (operations: [string, string][]) => {
      if (saveInProgressRef.current) return;

      try {
        saveInProgressRef.current = true;
        await AsyncStorage.multiSet(operations);

        // Mettre à jour le cache mémoire
        operations.forEach(([key, value]) => {
          try {
            memoryCache[key] = JSON.parse(value);
          } catch {
            memoryCache[key] = value;
          }
        });
      } catch (error) {
        console.error('Error in debouncedSaveData:', error);
      } finally {
        saveInProgressRef.current = false;
      }
    }, 500),
    []
  );

  // Clean up notification subscriptions on unmount
  useEffect(() => {
    return () => {
      if (notificationSubscriptionsRef.current) {
        notificationSubscriptionsRef.current.subscription?.remove();
        notificationSubscriptionsRef.current.interactionSubscription?.remove();
      }
      if (notificationUpdateTimeoutRef.current) {
        clearTimeout(notificationUpdateTimeoutRef.current);
      }
    };
  }, []);

  // Initialize notifications once after app loads
  useEffect(() => {
    const initializeNotifications = async () => {
      if (
        !isLoading &&
        !notificationInitializedRef.current &&
        settings.remindersEnabled
      ) {
        const totalIntake = todayIntake.reduce(
          (total, item) => total + item.amount,
          0
        );

        const subscriptions = await NotificationService.initialize(
          settings,
          totalIntake
        );
        if (subscriptions) {
          notificationSubscriptionsRef.current = subscriptions;
          notificationInitializedRef.current = true;
        }
      }
    };

    initializeNotifications();
  }, [isLoading, settings.remindersEnabled, todayIntake]);

  // Update notifications when water intake changes (only if notifications are enabled)
  useEffect(() => {
    if (
      isLoading ||
      !settings.remindersEnabled ||
      !notificationInitializedRef.current
    )
      return;

    // Clear any pending timeout
    if (notificationUpdateTimeoutRef.current) {
      clearTimeout(notificationUpdateTimeoutRef.current);
    }

    // Debounce the notification update to avoid multiple calls
    notificationUpdateTimeoutRef.current = setTimeout(() => {
      const totalIntake = todayIntake.reduce(
        (total, item) => total + item.amount,
        0
      );
      NotificationService.checkAndUpdateNotifications(settings, totalIntake);
    }, 5000); // Increased debounce time to 5 seconds

    return () => {
      if (notificationUpdateTimeoutRef.current) {
        clearTimeout(notificationUpdateTimeoutRef.current);
      }
    };
  }, [todayIntake, settings.remindersEnabled, settings.dailyGoal, isLoading]);

  // Fonction optimisée pour sauvegarder toutes les données
  const saveAllData = useCallback(async () => {
    if (saveInProgressRef.current) return;

    try {
      saveInProgressRef.current = true;
      const today = getTodayKey();

      // Update history with current day's data
      const updatedHistory = { ...history, [today]: todayIntake };

      const operations: [string, string][] = [
        ['hydracare-settings', JSON.stringify(settings)],
        ['hydracare-today', JSON.stringify(todayIntake)],
        ['hydracare-today-key', today],
        ['hydracare-history', JSON.stringify(updatedHistory)],
        ['hydracare-theme', JSON.stringify({ darkMode: isDarkMode })],
      ];

      await AsyncStorage.multiSet(operations);

      // Mise à jour du cache mémoire
      operations.forEach(([key, value]) => {
        try {
          memoryCache[key] = JSON.parse(value);
        } catch {
          memoryCache[key] = value;
        }
      });
    } catch (error) {
      console.error('Error saving data:', error);
    } finally {
      saveInProgressRef.current = false;
    }
  }, [settings, todayIntake, history, isDarkMode]);

  // Écouteur optimisé pour les changements d'état de l'application
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // Sauvegarder uniquement lors des transitions vers l'arrière-plan
      if (
        appStateRef.current.match(/active|foreground/) &&
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        saveAllData();
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [saveAllData]);

  // Check if we need to reset today's intake (new day)
  useEffect(() => {
    const checkAndResetDaily = async () => {
      const currentKey = getTodayKey();

      try {
        // Utiliser le cache mémoire si disponible
        let savedTodayKey = memoryCache['hydracare-today-key'];
        if (savedTodayKey === undefined) {
          savedTodayKey = await AsyncStorage.getItem('hydracare-today-key');
          if (savedTodayKey) {
            memoryCache['hydracare-today-key'] = savedTodayKey;
          }
        }

        if (savedTodayKey !== currentKey) {
          // It's a new day, save yesterday's data to history
          if (savedTodayKey && todayIntake.length > 0) {
            const updatedHistory = { ...history, [savedTodayKey]: todayIntake };
            setHistory(updatedHistory);

            await AsyncStorage.setItem(
              'hydracare-history',
              JSON.stringify(updatedHistory)
            );
            memoryCache['hydracare-history'] = updatedHistory;
          }

          // Reset today's intake
          setTodayIntake([]);

          // C'est un nouveau jour, donc on réinitialise aussi l'ajustement temporaire
          if (settings.temporaryGoalAdjustment !== 0) {
            const updatedSettings = { ...settings, temporaryGoalAdjustment: 0 };
            setSettings(updatedSettings);
            await AsyncStorage.setItem(
              'hydracare-settings',
              JSON.stringify(updatedSettings)
            );
            memoryCache['hydracare-settings'] = updatedSettings;
          }

          await AsyncStorage.setItem('hydracare-today-key', currentKey);
          await AsyncStorage.setItem('hydracare-today', JSON.stringify([]));
          memoryCache['hydracare-today-key'] = currentKey;
          memoryCache['hydracare-today'] = [];

          // Reset notifications for the new day (only if enabled)
          if (settings.remindersEnabled && notificationInitializedRef.current) {
            await NotificationService.updateNotificationSchedule(settings, 0);
          }
        }
      } catch (error) {
        console.error('Error in checkAndResetDaily:', error);
      }
    };

    // Check on mount and set up interval - reduced frequency to save resources
    checkAndResetDaily();
    const interval = setInterval(checkAndResetDaily, 300000); // Check every 5 minutes instead of every minute

    return () => clearInterval(interval);
  }, [todayIntake, history, settings]);

  // Load data from storage on mount - optimisé avec le modèle de cache
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Load all data at once
        const keys = [
          'hydracare-settings',
          'hydracare-today',
          'hydracare-today-key',
          'hydracare-history',
          'hydracare-theme',
        ];

        const values = await AsyncStorage.multiGet(keys);

        const [
          savedSettingsRaw,
          savedTodayRaw,
          savedTodayKey,
          savedHistoryRaw,
          savedThemeRaw,
        ] = values.map(([key, value]) => {
          // Mettre à jour le cache
          if (value) {
            try {
              memoryCache[key] = JSON.parse(value);
            } catch {
              memoryCache[key] = value;
            }
          }
          return value;
        });

        const currentKey = getTodayKey();

        // Parse settings with error handling
        if (savedSettingsRaw) {
          try {
            const parsedSettings = JSON.parse(savedSettingsRaw);
            // Make sure remindersEnabled is false by default if not set
            // Assurer que temporaryGoalAdjustment est initialisé
            if (parsedSettings.temporaryGoalAdjustment === undefined) {
              parsedSettings.temporaryGoalAdjustment = 0;
            }
            setSettings({ ...defaultSettings, ...parsedSettings });
          } catch (e) {
            console.error('Error parsing settings:', e);
            setSettings(defaultSettings);
          }
        }

        // Parse history with error handling
        if (savedHistoryRaw) {
          try {
            const parsedHistory = JSON.parse(savedHistoryRaw);
            setHistory(parsedHistory);
          } catch (e) {
            console.error('Error parsing history:', e);
            setHistory({});
          }
        }

        // Parse today's intake with error handling
        if (savedTodayRaw) {
          try {
            // S'assurer que savedTodayRaw contient des données valides
            const parsedToday = JSON.parse(savedTodayRaw);

            if (Array.isArray(parsedToday)) {
              // Vérifier si le jour actuel correspond au savedTodayKey
              if (savedTodayKey === currentKey) {
                setTodayIntake(parsedToday);
                console.log(
                  'Today intake loaded successfully:',
                  parsedToday.length,
                  'items'
                );
              } else {
                console.log('New day detected, resetting today intake');
                // C'est un nouveau jour
                setTodayIntake([]);

                // Sauvegarder la journée précédente dans l'historique
                if (savedTodayKey && parsedToday.length > 0) {
                  const updatedHistory = {
                    ...history,
                    [savedTodayKey]: parsedToday,
                  };
                  setHistory(updatedHistory);
                  await AsyncStorage.setItem(
                    'hydracare-history',
                    JSON.stringify(updatedHistory)
                  );
                  memoryCache['hydracare-history'] = updatedHistory;
                }

                // Réinitialiser l'ajustement temporaire pour le nouveau jour
                if (settings.temporaryGoalAdjustment !== 0) {
                  const updatedSettings = {
                    ...settings,
                    temporaryGoalAdjustment: 0,
                  };
                  setSettings(updatedSettings);
                  await AsyncStorage.setItem(
                    'hydracare-settings',
                    JSON.stringify(updatedSettings)
                  );
                  memoryCache['hydracare-settings'] = updatedSettings;
                }

                // Mettre à jour le jour actuel
                await AsyncStorage.setItem('hydracare-today-key', currentKey);
                await AsyncStorage.setItem(
                  'hydracare-today',
                  JSON.stringify([])
                );
                memoryCache['hydracare-today-key'] = currentKey;
                memoryCache['hydracare-today'] = [];
              }
            } else {
              console.log('Invalid today intake format, resetting');
              setTodayIntake([]);

              // Réinitialiser les données du jour
              await AsyncStorage.setItem('hydracare-today-key', currentKey);
              await AsyncStorage.setItem('hydracare-today', JSON.stringify([]));
              memoryCache['hydracare-today-key'] = currentKey;
              memoryCache['hydracare-today'] = [];
            }
          } catch (e) {
            console.error('Error parsing today intake:', e);
            setTodayIntake([]);

            // En cas d'erreur, réinitialiser les données
            await AsyncStorage.setItem('hydracare-today-key', currentKey);
            await AsyncStorage.setItem('hydracare-today', JSON.stringify([]));
            memoryCache['hydracare-today-key'] = currentKey;
            memoryCache['hydracare-today'] = [];
          }
        } else {
          // Pas de données pour aujourd'hui
          console.log('No today intake data, initializing');
          setTodayIntake([]);
          await AsyncStorage.setItem('hydracare-today-key', currentKey);
          await AsyncStorage.setItem('hydracare-today', JSON.stringify([]));
          memoryCache['hydracare-today-key'] = currentKey;
          memoryCache['hydracare-today'] = [];
        }

        // Parse theme preference with error handling
        if (savedThemeRaw) {
          try {
            const parsedTheme = JSON.parse(savedThemeRaw);
            setIsDarkMode(parsedTheme.darkMode);
          } catch (e) {
            console.error('Error parsing theme:', e);
            setIsDarkMode(false);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Function to update settings - optimized with debounce
  const updateSettings = useCallback(
    async (newSettings: Partial<UserSettings>) => {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);

      // Save with debounce
      debouncedSaveData([
        ['hydracare-settings', JSON.stringify(updatedSettings)],
      ]);

      // Update notifications if reminder setting changed - not debounced as it's critical
      if ('remindersEnabled' in newSettings) {
        const totalIntake = todayIntake.reduce(
          (total, item) => total + item.amount,
          0
        );

        if (newSettings.remindersEnabled) {
          // Request permissions and initialize notifications
          const hasPermission = await NotificationService.requestPermissions();
          if (hasPermission) {
            const subscriptions = await NotificationService.initialize(
              updatedSettings,
              totalIntake
            );
            if (subscriptions) {
              notificationSubscriptionsRef.current = subscriptions;
              notificationInitializedRef.current = true;
            }
          }
        } else {
          // Cancel all notifications if disabled
          await NotificationService.cancelAllScheduledNotificationsAsync();
          if (notificationSubscriptionsRef.current) {
            notificationSubscriptionsRef.current.subscription?.remove();
            notificationSubscriptionsRef.current.interactionSubscription?.remove();
            notificationSubscriptionsRef.current = null;
          }
          notificationInitializedRef.current = false;
        }
      }
    },
    [settings, todayIntake, debouncedSaveData]
  );

  // Fonction pour appliquer un ajustement temporaire
  const applyTemporaryAdjustment = useCallback(
    async (adjustment: number) => {
      const updatedSettings = {
        ...settings,
        temporaryGoalAdjustment: adjustment,
      };
      setSettings(updatedSettings);

      // Sauvegarder le nouvel ajustement
      await AsyncStorage.setItem(
        'hydracare-settings',
        JSON.stringify(updatedSettings)
      );
      memoryCache['hydracare-settings'] = updatedSettings;
    },
    [settings]
  );

  // Fonction pour effacer l'ajustement temporaire
  const clearTemporaryAdjustment = useCallback(async () => {
    const updatedSettings = {
      ...settings,
      temporaryGoalAdjustment: 0,
    };
    setSettings(updatedSettings);

    // Sauvegarder avec l'ajustement remis à zéro
    await AsyncStorage.setItem(
      'hydracare-settings',
      JSON.stringify(updatedSettings)
    );
    memoryCache['hydracare-settings'] = updatedSettings;
  }, [settings]);

  // Function to add water intake - optimized with debounce
  const addWaterIntake = useCallback(
    async (amount: number) => {
      const newIntake: WaterIntake = {
        id: Date.now().toString(),
        amount,
        timestamp: Date.now(),
        unit: settings.preferredUnit,
      };

      const updatedTodayIntake = [...todayIntake, newIntake];
      setTodayIntake(updatedTodayIntake);

      // Update history for today
      const today = getTodayKey();
      const updatedHistory = {
        ...history,
        [today]: updatedTodayIntake,
      };
      setHistory(updatedHistory);

      // Update Android widget immediately - this should not be debounced
      if (Platform.OS === 'android') {
        try {
          const currentAmount =
            Math.round(dailyProgress * currentDailyGoal) + amount;

          // Utilisation de SharedPreferences pour le widget
          const { SharedStorage } = NativeModules;
          if (SharedStorage) {
            await SharedStorage.setItem(
              'dailyGoal',
              currentDailyGoal.toString()
            );
            await SharedStorage.setItem(
              'currentIntake',
              currentAmount.toString()
            );
          }
        } catch (error) {
          console.error('Error syncing widget data:', error);
        }
      }

      // Save with debounce to reduce disk operations
      debouncedSaveData([
        ['hydracare-today', JSON.stringify(updatedTodayIntake)],
        ['hydracare-history', JSON.stringify(updatedHistory)],
      ]);
    },
    [
      todayIntake,
      history,
      settings,
      dailyProgress,
      currentDailyGoal,
      debouncedSaveData,
    ]
  );

  // Function to remove water intake - optimized with debounce
  const removeWaterIntake = useCallback(
    async (id: string) => {
      // Remove from today's intake
      const updatedTodayIntake = todayIntake.filter((item) => item.id !== id);
      setTodayIntake(updatedTodayIntake);

      // Update history for today
      const today = getTodayKey();
      const updatedHistory = {
        ...history,
        [today]: updatedTodayIntake,
      };
      setHistory(updatedHistory);

      // Save with debounce
      debouncedSaveData([
        ['hydracare-today', JSON.stringify(updatedTodayIntake)],
        ['hydracare-history', JSON.stringify(updatedHistory)],
      ]);
    },
    [todayIntake, history, debouncedSaveData]
  );

  // Function to reset today's intake - not debounced as it's infrequent
  const resetTodayIntake = useCallback(async () => {
    setTodayIntake([]);

    // Also clear today from history
    const today = getTodayKey();
    const updatedHistory = { ...history };
    delete updatedHistory[today];
    setHistory(updatedHistory);

    // Save immediately - no need for debounce as this is an infrequent operation
    try {
      await AsyncStorage.multiSet([
        ['hydracare-today', JSON.stringify([])],
        ['hydracare-history', JSON.stringify(updatedHistory)],
      ]);

      // Mettre à jour le cache
      memoryCache['hydracare-today'] = [];
      memoryCache['hydracare-history'] = updatedHistory;
    } catch (error) {
      console.error("Error resetting today's intake:", error);
    }
  }, [history]);

  // Function to clear all history - not debounced as it's infrequent
  const clearHistory = useCallback(async () => {
    setHistory({});
    try {
      await AsyncStorage.removeItem('hydracare-history');
      memoryCache['hydracare-history'] = {};
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }, []);

  // Function to toggle dark mode - not debounced as it's infrequent
  const toggleDarkMode = useCallback(async () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    // Update settings immediately
    const updatedSettings = { ...settings, darkMode: newDarkMode };
    setSettings(updatedSettings);

    await AsyncStorage.multiSet([
      ['hydracare-settings', JSON.stringify(updatedSettings)],
      ['hydracare-theme', JSON.stringify({ darkMode: newDarkMode })],
    ]);

    // Mettre à jour le cache
    memoryCache['hydracare-settings'] = updatedSettings;
    memoryCache['hydracare-theme'] = { darkMode: newDarkMode };
  }, [isDarkMode, settings]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      settings,
      updateSettings,
      todayIntake,
      addWaterIntake,
      removeWaterIntake,
      resetTodayIntake,
      history,
      clearHistory,
      dailyProgress,
      isDarkMode,
      toggleDarkMode,
      applyTemporaryAdjustment,
      clearTemporaryAdjustment,
      currentDailyGoal,
    }),
    [
      settings,
      updateSettings,
      todayIntake,
      addWaterIntake,
      removeWaterIntake,
      resetTodayIntake,
      history,
      clearHistory,
      dailyProgress,
      isDarkMode,
      toggleDarkMode,
      applyTemporaryAdjustment,
      clearTemporaryAdjustment,
      currentDailyGoal,
    ]
  );

  // Don't render children until data is loaded
  if (isLoading) {
    return null;
  }

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = () => useContext(AppContext);
