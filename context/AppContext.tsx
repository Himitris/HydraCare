import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Defining types for our context
interface UserSettings {
  dailyGoal: number;
  preferredUnit: 'ml' | 'oz';
  darkMode: boolean;
  remindersEnabled: boolean;
  reminderFrequency: number; // in minutes
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
  remindersEnabled: true,
  reminderFrequency: 60, // minutes
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

  // Calculate daily progress
  const dailyProgress =
    todayIntake.reduce((total, item) => total + item.amount, 0) /
    settings.dailyGoal;

  // Check if we need to reset today's intake (new day)
  useEffect(() => {
    const checkAndResetDaily = () => {
      const storedTodayKey = AsyncStorage.getItem('hydracare-today-key');
      const currentKey = getTodayKey();

      storedTodayKey.then((savedKey) => {
        if (savedKey !== currentKey) {
          // It's a new day, save yesterday's data to history
          if (savedKey && todayIntake.length > 0) {
            const updatedHistory = { ...history, [savedKey]: todayIntake };
            setHistory(updatedHistory);
            AsyncStorage.setItem(
              'hydracare-history',
              JSON.stringify(updatedHistory)
            );
          }

          // Reset today's intake
          setTodayIntake([]);
          AsyncStorage.setItem('hydracare-today-key', currentKey);
        }
      });
    };

    // Check on mount and set up interval
    checkAndResetDaily();
    const interval = setInterval(checkAndResetDaily, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [todayIntake]);

  // Load data from storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load settings
        const savedSettings = await AsyncStorage.getItem('hydracare-settings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }

        // Load history
        const savedHistory = await AsyncStorage.getItem('hydracare-history');
        if (savedHistory) {
          setHistory(JSON.parse(savedHistory));
        }

        // Load today's intake
        const savedToday = await AsyncStorage.getItem('hydracare-today');
        const savedTodayKey = await AsyncStorage.getItem('hydracare-today-key');
        const currentKey = getTodayKey();

        if (savedToday && savedTodayKey === currentKey) {
          setTodayIntake(JSON.parse(savedToday));
        } else {
          // It's a new day or first launch
          setTodayIntake([]);
          AsyncStorage.setItem('hydracare-today-key', currentKey);
        }

        // Load theme preference
        const savedTheme = await AsyncStorage.getItem('hydracare-theme');
        if (savedTheme) {
          setIsDarkMode(JSON.parse(savedTheme).darkMode);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Save settings whenever they change
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem(
          'hydracare-settings',
          JSON.stringify(settings)
        );
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    };

    saveSettings();
  }, [settings]);

  // Save today's intake whenever it changes
  useEffect(() => {
    const saveTodayIntake = async () => {
      try {
        await AsyncStorage.setItem(
          'hydracare-today',
          JSON.stringify(todayIntake)
        );
      } catch (error) {
        console.error("Error saving today's intake:", error);
      }
    };

    saveTodayIntake();
  }, [todayIntake]);

  // Save theme preference
  useEffect(() => {
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem(
          'hydracare-theme',
          JSON.stringify({ darkMode: isDarkMode })
        );
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    };

    saveTheme();
  }, [isDarkMode]);

  // Function to update settings
  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Function to add water intake
  const addWaterIntake = (amount: number) => {
    const newIntake: WaterIntake = {
      id: Date.now().toString(),
      amount,
      timestamp: Date.now(),
      unit: settings.preferredUnit,
    };

    setTodayIntake((prev) => [...prev, newIntake]);

    // Also update history for today
    const today = getTodayKey();
    setHistory((prev) => ({
      ...prev,
      [today]: [...(prev[today] || []), newIntake],
    }));
  };

  // Function to remove water intake
  const removeWaterIntake = (id: string) => {
    setTodayIntake((prev) => prev.filter((item) => item.id !== id));

    // Also update history for today
    const today = getTodayKey();
    setHistory((prev) => ({
      ...prev,
      [today]: (prev[today] || []).filter((item) => item.id !== id),
    }));
  };

  // Function to reset today's intake
  const resetTodayIntake = () => {
    setTodayIntake([]);

    // Also clear today from history
    const today = getTodayKey();
    setHistory((prev) => {
      const { [today]: _, ...rest } = prev;
      return rest;
    });
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
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
    updateSettings({ darkMode: !isDarkMode });
  };

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
