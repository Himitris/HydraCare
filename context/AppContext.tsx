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
export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [todayIntake, setTodayIntake] = useState<WaterIntake[]>([]);
  const [history, setHistory] = useState<Record<string, WaterIntake[]>>({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Calculate daily progress
  const dailyProgress = todayIntake.reduce(
    (total, item) => total + item.amount, 
    0
  ) / settings.dailyGoal;
  
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
          
          // Extract today's data
          const today = getTodayKey();
          if (JSON.parse(savedHistory)[today]) {
            setTodayIntake(JSON.parse(savedHistory)[today]);
          }
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
        await AsyncStorage.setItem('hydracare-settings', JSON.stringify(settings));
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    };
    
    saveSettings();
  }, [settings]);
  
  // Save history whenever today's intake changes
  useEffect(() => {
    const saveHistory = async () => {
      try {
        const today = getTodayKey();
        const updatedHistory = { ...history, [today]: todayIntake };
        setHistory(updatedHistory);
        await AsyncStorage.setItem('hydracare-history', JSON.stringify(updatedHistory));
      } catch (error) {
        console.error('Error saving history:', error);
      }
    };
    
    saveHistory();
  }, [todayIntake]);
  
  // Save theme preference
  useEffect(() => {
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem('hydracare-theme', JSON.stringify({ darkMode: isDarkMode }));
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    };
    
    saveTheme();
  }, [isDarkMode]);
  
  // Function to update settings
  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };
  
  // Function to add water intake
  const addWaterIntake = (amount: number) => {
    const newIntake: WaterIntake = {
      id: Date.now().toString(),
      amount,
      timestamp: Date.now(),
      unit: settings.preferredUnit,
    };
    
    setTodayIntake(prev => [...prev, newIntake]);
  };
  
  // Function to remove water intake
  const removeWaterIntake = (id: string) => {
    setTodayIntake(prev => prev.filter(item => item.id !== id));
  };
  
  // Function to reset today's intake
  const resetTodayIntake = () => {
    setTodayIntake([]);
  };
  
  // Function to toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
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