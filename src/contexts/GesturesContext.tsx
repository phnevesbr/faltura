import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface GestureSettings {
  swipeEnabled: boolean;
  doubleTapEnabled: boolean;
  longPressEnabled: boolean;
  hapticFeedback: boolean;
  sensitivity: 'slow' | 'normal' | 'fast';
}

interface UndoAction {
  id: string;
  type: 'delete' | 'action';
  data: any;
  timeout: NodeJS.Timeout;
  onUndo: () => void;
}

interface GesturesContextType {
  settings: GestureSettings;
  updateSettings: (newSettings: Partial<GestureSettings>) => void;
  addUndoAction: (action: Omit<UndoAction, 'timeout'>) => void;
  removeUndoAction: (id: string) => void;
  undoActions: UndoAction[];
  executeUndo: (id: string) => void;
}

const defaultSettings: GestureSettings = {
  swipeEnabled: true,
  doubleTapEnabled: true,
  longPressEnabled: true,
  hapticFeedback: true,
  sensitivity: 'normal'
};

const GesturesContext = createContext<GesturesContextType | undefined>(undefined);

export const useGesturesContext = () => {
  const context = useContext(GesturesContext);
  if (!context) {
    throw new Error('useGesturesContext must be used within GesturesProvider');
  }
  return context;
};

interface GesturesProviderProps {
  children: ReactNode;
}

export const GesturesProvider: React.FC<GesturesProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<GestureSettings>(defaultSettings);
  const [undoActions, setUndoActions] = useState<UndoAction[]>([]);

  // Load settings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('gesture-settings');
    if (stored) {
      try {
        const parsedSettings = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsedSettings });
      } catch (error) {
        console.error('Error loading gesture settings:', error);
      }
    }
  }, []);

  const updateSettings = (newSettings: Partial<GestureSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('gesture-settings', JSON.stringify(updatedSettings));
  };

  const addUndoAction = (action: Omit<UndoAction, 'timeout'>) => {
    // Remove existing action with same id
    setUndoActions(prev => prev.filter(a => a.id !== action.id));

    // Add new action with timeout
    const timeout = setTimeout(() => {
      removeUndoAction(action.id);
    }, 5000); // 5 second timeout

    const newAction: UndoAction = {
      ...action,
      timeout
    };

    setUndoActions(prev => [...prev, newAction]);
  };

  const removeUndoAction = (id: string) => {
    setUndoActions(prev => {
      const action = prev.find(a => a.id === id);
      if (action) {
        clearTimeout(action.timeout);
      }
      return prev.filter(a => a.id !== id);
    });
  };

  const executeUndo = (id: string) => {
    const action = undoActions.find(a => a.id === id);
    if (action) {
      try {
        action.onUndo();
        removeUndoAction(id);
      } catch (error) {
        console.error('Error executing undo:', error);
        removeUndoAction(id);
      }
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      undoActions.forEach(action => {
        clearTimeout(action.timeout);
      });
    };
  }, []);

  return (
    <GesturesContext.Provider
      value={{
        settings,
        updateSettings,
        addUndoAction,
        removeUndoAction,
        undoActions,
        executeUndo
      }}
    >
      {children}
    </GesturesContext.Provider>
  );
};