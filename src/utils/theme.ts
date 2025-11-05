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
    primary: '#5F758E',        // Muted blue-gray
    background: '#F0F0F0',     // Light neutral gray
    surface: '#FFFFFF',        // Pure white
    text: '#2C2C2C',          // Dark gray
    textSecondary: '#758793',  // Muted blue-gray
    border: '#E7E7E7',        // Very light gray
    success: '#A2A9A3',       // Muted sage green
    error: '#CD9C8B',         // Muted terracotta
    warning: '#CB936A',       // Muted amber
    tabBarBackground: '#FFFFFF',
    tabBarActiveTint: '#5F758E',
    tabBarInactiveTint: '#B6BCBE',
  },
};

const darkTheme: Theme = {
  colors: {
    primary: '#A6B4B2',       // Light muted teal-gray
    background: '#1A1A1A',    // Very dark gray
    surface: '#2C2C2E',       // Dark gray surface
    text: '#E8C9B5',          // Warm light beige
    textSecondary: '#A17F66', // Muted tan
    border: '#3A3A3C',        // Dark border
    success: '#A2A9A3',       // Muted sage green
    error: '#D6AD9D',         // Muted rose
    warning: '#CD9E7A',       // Muted caramel
    tabBarBackground: '#2C2C2E',
    tabBarActiveTint: '#A6B4B2',
    tabBarInactiveTint: '#758793',
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