import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFromStorage, saveToStorage } from '../utils/helpers';
import { getSettings, updateSettings as apiUpdateSettings } from '../services/userService';
import { useAuth } from './AuthContext';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState(() => {
    return getFromStorage('settings', {
      language: 'bn',
      theme: 'dark',
      calculationMethod: 4,
      notifications: {
        prayer: true,
        quran: true,
        events: true,
        sound: true,
        vibration: true
      },
      adhanSound: 'makkah',
      reminderTime: 15,
      autoDetectLocation: true
    });
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadSettings();
    }
  }, [isAuthenticated]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      setSettings(data);
      saveToStorage('settings', data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveToStorage('settings', updated);
    
    if (isAuthenticated) {
      try {
        await apiUpdateSettings(updated);
      } catch (error) {
        console.error('Error updating settings:', error);
      }
    }
  };

  const toggleNotification = (key) => {
    updateSettings({
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key]
      }
    });
  };

  const value = {
    settings,
    loading,
    updateSettings,
    toggleNotification
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};