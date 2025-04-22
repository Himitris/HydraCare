import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, AppState } from 'react-native';
import { changeLanguage } from '@/i18n';
import { NotificationService } from '@/services/NotificationService';

// Defining types for our context
interface UserSettings {
  dailyGoal: number;
  preferredUnit: 'ml' | 'oz';
  darkMode: boolean;
  remindersEnabled: boolean;
  reminderFrequency: number; // in minutes
  language: 'fr' | 'en'; // Added language property
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
}

// Default settings
const defaultSettings: UserSettings = {
  dailyGoal: 2000, // ml
  preferredUnit: 'ml',
  darkMode: false,
  remindersEnabled: false, // Start with notifications disabled
  reminderFrequency: 60, // minutes
  language: 'fr', // Default to French
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
});

// Helper to get today's date as a string key
const getTodayKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

// Provider component
export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [todayIntake, setTodayIntake] = useState<WaterIntake[]>([]);
  const [history, setHistory] = useState<Record<string, WaterIntake[]>>({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const notificationSubscriptionsRef = useRef<any>(null);
  const notificationUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const notificationInitializedRef = useRef(false);

  // Calculate daily progress
  const dailyProgress =
    todayIntake.reduce((total, item) => total + item.amount, 0) /
    settings.dailyGoal;

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
  }, [isLoading, settings.remindersEnabled]);

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

  // Save all data when app state changes (going to background)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      async (nextAppState) => {
        if (nextAppState === 'background' || nextAppState === 'inactive') {
          await saveAllData();
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, [settings, todayIntake, history, isDarkMode]);

  // Function to save all data
  const saveAllData = async () => {
    try {
      const today = getTodayKey();

      // Update history with current day's data
      const updatedHistory = { ...history, [today]: todayIntake };

      await AsyncStorage.multiSet([
        ['hydracare-settings', JSON.stringify(settings)],
        ['hydracare-today', JSON.stringify(todayIntake)],
        ['hydracare-today-key', today],
        ['hydracare-history', JSON.stringify(updatedHistory)],
        ['hydracare-theme', JSON.stringify({ darkMode: isDarkMode })],
      ]);

      console.log('All data saved successfully');
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  // Check if we need to reset today's intake (new day)
  useEffect(() => {
    const checkAndResetDaily = async () => {
      const currentKey = getTodayKey();

      try {
        const savedTodayKey = await AsyncStorage.getItem('hydracare-today-key');

        if (savedTodayKey !== currentKey) {
          // It's a new day, save yesterday's data to history
          if (savedTodayKey && todayIntake.length > 0) {
            const updatedHistory = { ...history, [savedTodayKey]: todayIntake };
            setHistory(updatedHistory);
            await AsyncStorage.setItem(
              'hydracare-history',
              JSON.stringify(updatedHistory)
            );
          }

          // Reset today's intake
          setTodayIntake([]);
          await AsyncStorage.setItem('hydracare-today-key', currentKey);
          await AsyncStorage.setItem('hydracare-today', JSON.stringify([]));

          // Reset notifications for the new day (only if enabled)
          if (settings.remindersEnabled && notificationInitializedRef.current) {
            await NotificationService.updateNotificationSchedule(settings, 0);
          }
        }
      } catch (error) {
        console.error('Error in checkAndResetDaily:', error);
      }
    };

    // Check on mount and set up interval
    checkAndResetDaily();
    const interval = setInterval(checkAndResetDaily, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [todayIntake, history, settings]);

  // Load data from storage on mount
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
        ] = values.map(([_, value]) => value);

        const currentKey = getTodayKey();

        // Parse settings with error handling
        if (savedSettingsRaw) {
          try {
            const parsedSettings = JSON.parse(savedSettingsRaw);
            // Make sure remindersEnabled is false by default if not set
            setSettings({ ...defaultSettings, ...parsedSettings });
            if (parsedSettings.language) {
              await changeLanguage(parsedSettings.language);
            }
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
        if (savedTodayRaw && savedTodayKey === currentKey) {
          try {
            const parsedToday = JSON.parse(savedTodayRaw);
            setTodayIntake(parsedToday);
          } catch (e) {
            console.error('Error parsing today intake:', e);
            setTodayIntake([]);
          }
        } else {
          // It's a new day or first launch
          setTodayIntake([]);
          await AsyncStorage.setItem('hydracare-today-key', currentKey);
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

  // Function to update settings
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    // Save immediately
    try {
      await AsyncStorage.setItem(
        'hydracare-settings',
        JSON.stringify(updatedSettings)
      );

      // Update notifications if reminder setting changed
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
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  // Function to add water intake
  const addWaterIntake = async (amount: number) => {
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

    // Save immediately
    try {
      await AsyncStorage.multiSet([
        ['hydracare-today', JSON.stringify(updatedTodayIntake)],
        ['hydracare-history', JSON.stringify(updatedHistory)],
      ]);
    } catch (error) {
      console.error('Error saving water intake:', error);
    }
  };

  // Function to remove water intake
  const removeWaterIntake = async (id: string) => {
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

    // Save immediately
    try {
      await AsyncStorage.multiSet([
        ['hydracare-today', JSON.stringify(updatedTodayIntake)],
        ['hydracare-history', JSON.stringify(updatedHistory)],
      ]);
    } catch (error) {
      console.error('Error removing water intake:', error);
    }
  };

  // Function to reset today's intake
  const resetTodayIntake = async () => {
    setTodayIntake([]);

    // Also clear today from history
    const today = getTodayKey();
    const updatedHistory = { ...history };
    delete updatedHistory[today];
    setHistory(updatedHistory);

    // Save immediately
    try {
      await AsyncStorage.multiSet([
        ['hydracare-today', JSON.stringify([])],
        ['hydracare-history', JSON.stringify(updatedHistory)],
      ]);
    } catch (error) {
      console.error("Error resetting today's intake:", error);
    }
  };

  // Function to clear all history
  const clearHistory = async () => {
    setHistory({});
    try {
      await AsyncStorage.removeItem('hydracare-history');
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  // Function to toggle dark mode
  const toggleDarkMode = async () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    await updateSettings({ darkMode: newDarkMode });
  };

  // Don't render children until data is loaded
  if (isLoading) {
    return null;
  }

  return (
    <AppContext.Provider
      value={{
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = () => useContext(AppContext);
