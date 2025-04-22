// context/RunningContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RunningSession {
  id: string;
  date: Date;
  feeling: 'great' | 'good' | 'average' | 'bad';
  description: string;
  distance?: number;
  duration?: number;
}

interface RunningContextType {
  sessions: RunningSession[];
  addSession: (session: RunningSession) => void;
  removeSession: (id: string) => void;
  updateSession: (id: string, updates: Partial<RunningSession>) => void;
}

const RunningContext = createContext<RunningContextType>({
  sessions: [],
  addSession: () => {},
  removeSession: () => {},
  updateSession: () => {},
});

const STORAGE_KEY = '@hydracare/running_sessions';

export const RunningContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [sessions, setSessions] = useState<RunningSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load sessions from storage
  useEffect(() => {
    const loadSessions = async () => {
      try {
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

    loadSessions();
  }, []);

  // Save sessions to storage
  const saveSessions = async (newSessions: RunningSession[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
    } catch (error) {
      console.error('Error saving running sessions:', error);
    }
  };

  // Add a new session
  const addSession = (session: RunningSession) => {
    const updatedSessions = [session, ...sessions];
    setSessions(updatedSessions);
    saveSessions(updatedSessions);
  };

  // Remove a session
  const removeSession = (id: string) => {
    const updatedSessions = sessions.filter((session) => session.id !== id);
    setSessions(updatedSessions);
    saveSessions(updatedSessions);
  };

  // Update a session
  const updateSession = (id: string, updates: Partial<RunningSession>) => {
    const updatedSessions = sessions.map((session) =>
      session.id === id ? { ...session, ...updates } : session
    );
    setSessions(updatedSessions);
    saveSessions(updatedSessions);
  };

  if (isLoading) {
    return null;
  }

  return (
    <RunningContext.Provider
      value={{
        sessions,
        addSession,
        removeSession,
        updateSession,
      }}
    >
      {children}
    </RunningContext.Provider>
  );
};

export const useRunningContext = () => useContext(RunningContext);
