// context/IntegrationContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAppContext } from './AppContext';
import { useRunningContext } from './RunningContext';
import { useTodoContext } from './TodoContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface IntegrationContextType {
  // Stats globales
  dailyStats: {
    waterGoalAchieved: boolean;
    waterPercentage: number;
    completedTasks: number;
    pendingTasks: number;
    runningDistance: number;
    lastRunDate: Date | null;
  };
  // Intégration des objectifs
  addRunningTaskOnCompletion: boolean;
  setAddRunningTaskOnCompletion: (value: boolean) => void;
  reminderForWaterAfterRun: boolean;
  setReminderForWaterAfterRun: (value: boolean) => void;
  // Badges & récompenses
  achievements: {
    id: string;
    title: string;
    description: string;
    unlocked: boolean;
    icon: string;
    date?: Date;
  }[];
}

const defaultContext: IntegrationContextType = {
  dailyStats: {
    waterGoalAchieved: false,
    waterPercentage: 0,
    completedTasks: 0,
    pendingTasks: 0,
    runningDistance: 0,
    lastRunDate: null,
  },
  addRunningTaskOnCompletion: true,
  setAddRunningTaskOnCompletion: () => {},
  reminderForWaterAfterRun: true,
  setReminderForWaterAfterRun: () => {},
  achievements: [],
};

const IntegrationContext =
  createContext<IntegrationContextType>(defaultContext);

export const IntegrationContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  // Get data from other contexts
  const { dailyProgress, todayIntake, settings } = useAppContext();
  const { sessions } = useRunningContext();
  const { todos } = useTodoContext();

  // Integration preferences
  const [addRunningTaskOnCompletion, setAddRunningTaskOnCompletion] =
    useState(true);
  const [reminderForWaterAfterRun, setReminderForWaterAfterRun] =
    useState(true);

  // Achievements and badges
  const [achievements, setAchievements] = useState<
    IntegrationContextType['achievements']
  >([]);

  // Calculate daily stats
  const dailyStats = {
    waterGoalAchieved: dailyProgress >= 1,
    waterPercentage: dailyProgress * 100,
    completedTasks: todos.filter((t) => t.completed).length,
    pendingTasks: todos.filter((t) => !t.completed).length,
    runningDistance:
      sessions.length > 0
        ? sessions.reduce(
            (total, session) => total + (session.distance || 0),
            0
          )
        : 0,
    lastRunDate: sessions.length > 0 ? new Date(sessions[0].date) : null,
  };

  // Load integration preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefsData = await AsyncStorage.getItem(
          '@hydracare/integration_prefs'
        );
        if (prefsData) {
          const prefs = JSON.parse(prefsData);
          setAddRunningTaskOnCompletion(
            prefs.addRunningTaskOnCompletion ?? true
          );
          setReminderForWaterAfterRun(prefs.reminderForWaterAfterRun ?? true);
        }
      } catch (error) {
        console.error('Error loading integration preferences:', error);
      }
    };

    loadPreferences();
  }, []);

  // Save integration preferences when changed
  useEffect(() => {
    const savePreferences = async () => {
      try {
        await AsyncStorage.setItem(
          '@hydracare/integration_prefs',
          JSON.stringify({
            addRunningTaskOnCompletion,
            reminderForWaterAfterRun,
          })
        );
      } catch (error) {
        console.error('Error saving integration preferences:', error);
      }
    };

    savePreferences();
  }, [addRunningTaskOnCompletion, reminderForWaterAfterRun]);

  // Load achievements
  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const achievementsData = await AsyncStorage.getItem(
          '@hydracare/achievements'
        );
        if (achievementsData) {
          const loadedAchievements = JSON.parse(achievementsData);
          setAchievements(loadedAchievements);
        } else {
          // Default achievements
          const defaultAchievements = [
            {
              id: 'water_first',
              title: 'Premier verre',
              description: "Buvez votre premier verre d'eau avec HydraCare",
              unlocked: todayIntake.length > 0,
              icon: 'droplet',
            },
            {
              id: 'run_first',
              title: 'Premier pas',
              description: 'Enregistrez votre première course',
              unlocked: sessions.length > 0,
              icon: 'activity',
            },
            {
              id: 'todo_first',
              title: 'Premier objectif',
              description: 'Créez votre première tâche',
              unlocked: todos.length > 0,
              icon: 'check-square',
            },
            // Ajoutez d'autres badges...
          ];

          setAchievements(defaultAchievements);
          await AsyncStorage.setItem(
            '@hydracare/achievements',
            JSON.stringify(defaultAchievements)
          );
        }
      } catch (error) {
        console.error('Error loading achievements:', error);
      }
    };

    loadAchievements();
  }, [sessions.length, todos.length, todayIntake.length]);

  return (
    <IntegrationContext.Provider
      value={{
        dailyStats,
        addRunningTaskOnCompletion,
        setAddRunningTaskOnCompletion,
        reminderForWaterAfterRun,
        setReminderForWaterAfterRun,
        achievements,
      }}
    >
      {children}
    </IntegrationContext.Provider>
  );
};

export const useIntegration = () => useContext(IntegrationContext);
