import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppState, AppStateStatus } from 'react-native';
import i18n from './src/utils/i18n';
import { ThemeProvider, useTheme } from './src/utils/theme';
import StorageService from './src/utils/storage';
import { setRTL } from './src/utils/i18n';
import { isPasswordSet, isSetupCompleted } from './src/utils/auth';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import AccountsScreen from './src/screens/AccountsScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { LockScreen } from './src/screens/LockScreen';
import { SetupPasswordScreen } from './src/screens/SetupPasswordScreen';

const Tab = createBottomTabNavigator();

const AppContent = () => {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const [isLocked, setIsLocked] = useState(true);
  const [isPasswordConfigured, setIsPasswordConfigured] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showSetupScreen, setShowSetupScreen] = useState(false);

  useEffect(() => {
    // Initialize language and authentication on app startup
    const initializeApp = async () => {
      try {
        // Initialize language
        const settings = await StorageService.getSettings();
        if (settings && settings.language && settings.language !== i18n.language) {
          await i18n.changeLanguage(settings.language);
          setRTL(settings.language);
        }

        // Check if user has completed setup
        const setupCompleted = await isSetupCompleted();
        
        // Check if password is configured
        const passwordConfigured = await isPasswordSet();
        setIsPasswordConfigured(passwordConfigured);
        setIsLocked(passwordConfigured);
        
        // Show setup screen only if not completed and no password set
        setShowSetupScreen(!setupCompleted && !passwordConfigured);
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    initializeApp();
  }, []);

  // Lock app when it goes to background
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        const passwordConfigured = await isPasswordSet();
        if (passwordConfigured) {
          setIsLocked(true);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const handleUnlock = () => {
    setIsLocked(false);
  };

  const handlePasswordSetup = async () => {
    const passwordConfigured = await isPasswordSet();
    setIsPasswordConfigured(passwordConfigured);
    setIsLocked(false);
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return null; // Or a loading screen
  }

  // Show setup screen only on first launch (if user hasn't completed setup)
  if (showSetupScreen) {
    return <SetupPasswordScreen onComplete={handlePasswordSetup} />;
  }

  // Show lock screen if app is locked and password is configured
  if (isLocked && isPasswordConfigured) {
    return <LockScreen onUnlock={handleUnlock} />;
  }

  return (
    <NavigationContainer>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Tab.Navigator
        key={i18n.language}
        screenOptions={{
          tabBarActiveTintColor: theme.colors.tabBarActiveTint,
          tabBarInactiveTintColor: theme.colors.tabBarInactiveTint,
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.text,
          tabBarStyle: {
            backgroundColor: theme.colors.tabBarBackground,
            borderTopColor: theme.colors.border,
          },
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{
            title: t('dashboard'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen 
          name="Accounts" 
          component={AccountsScreen} 
          options={{
            title: t('accounts'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen 
          name="Transactions" 
          component={TransactionsScreen} 
          options={{
            title: t('transactions'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{
            title: t('settings'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <I18nextProvider i18n={i18n}>
          <AppContent />
        </I18nextProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

