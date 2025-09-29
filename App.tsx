import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/utils/i18n';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import AccountsScreen from './src/screens/AccountsScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: 'gray',
            headerStyle: {
              backgroundColor: '#f8f9fa',
            },
            headerTintColor: '#333',
          }}
        >
          <Tab.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{
              title: 'Dashboard',
              tabBarIcon: ({ color, size }) => (
                <TabIcon name="home" color={color} size={size} />
              ),
            }}
          />
          <Tab.Screen 
            name="Accounts" 
            component={AccountsScreen} 
            options={{
              title: 'Accounts',
              tabBarIcon: ({ color, size }) => (
                <TabIcon name="person" color={color} size={size} />
              ),
            }}
          />
          <Tab.Screen 
            name="Transactions" 
            component={TransactionsScreen} 
            options={{
              title: 'Transactions',
              tabBarIcon: ({ color, size }) => (
                <TabIcon name="list" color={color} size={size} />
              ),
            }}
          />
          <Tab.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{
              title: 'Settings',
              tabBarIcon: ({ color, size }) => (
                <TabIcon name="settings" color={color} size={size} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </I18nextProvider>
  );
}

// Simple icon component (placeholder for now)
const TabIcon = ({ name, color, size }: { name: string; color: string; size: number }) => {
  return <></>; // Will be replaced with actual icons
};