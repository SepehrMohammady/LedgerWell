import React, { createContext, useContext, useState, useEffect } from 'react';
import StorageService from './storage';

export interface Theme {
  colors: {
    primary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    error: string;
    warning: string;
    tabBarBackground: string;
    tabBarActiveTint: string;
    tabBarInactiveTint: string;
  };
}

const lightTheme: Theme = {
  colors: {
    primary: '#007AFF',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#333333',
    textSecondary: '#666666',
    border: '#e0e0e0',
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    tabBarBackground: '#ffffff',
    tabBarActiveTint: '#007AFF',
    tabBarInactiveTint: '#8E8E93',
  },
};

const darkTheme: Theme = {
  colors: {
    primary: '#0A84FF',
    background: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#38383A',
    success: '#30D158',
    error: '#FF453A',
    warning: '#FF9F0A',
    tabBarBackground: '#1C1C1E',
    tabBarActiveTint: '#0A84FF',
    tabBarInactiveTint: '#8E8E93',
  },
};

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const settings = await StorageService.getSettings();
      setIsDark(settings.theme === 'dark');
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newIsDark = !isDark;
      setIsDark(newIsDark);
      
      const settings = await StorageService.getSettings();
      const updatedSettings = {
        ...settings,
        theme: newIsDark ? ('dark' as const) : ('light' as const),
      };
      await StorageService.saveSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  const providerValue = { theme, isDark, toggleTheme };

  return React.createElement(
    ThemeContext.Provider,
    { value: providerValue },
    children
  );
};

export { lightTheme, darkTheme };