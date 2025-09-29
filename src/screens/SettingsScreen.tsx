import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import { AppSettings, Currency } from '../types';
import StorageService from '../utils/storage';
import CurrencyService, { DEFAULT_CURRENCIES } from '../utils/currency';
import CustomCurrencyModal from '../components/CustomCurrencyModal';
import { useTheme, Theme } from '../utils/theme';

const SettingsScreen = () => {
  const { t, i18n } = useTranslation();
  const { theme, isDark, toggleTheme } = useTheme();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [customCurrencyModalVisible, setCustomCurrencyModalVisible] = useState(false);

  useEffect(() => {
    loadSettings();
    loadCurrencies();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsData = await StorageService.getSettings();
      setSettings(settingsData);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadCurrencies = async () => {
    try {
      const currenciesData = await StorageService.getCurrencies();
      setCurrencies(currenciesData);
    } catch (error) {
      console.error('Failed to load currencies:', error);
    }
  };

  const updateSettings = async (newSettings: AppSettings) => {
    try {
      await StorageService.saveSettings(newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    if (settings) {
      updateSettings({ ...settings, language });
    }
  };

  const changeDefaultCurrency = (currencyId: string) => {
    const currency = currencies.find(c => c.id === currencyId);
    if (currency && settings) {
      updateSettings({ ...settings, defaultCurrency: currency });
    }
  };

  const toggleAutoUpdateRates = (value: boolean) => {
    if (settings) {
      updateSettings({ ...settings, autoUpdateRates: value });
    }
  };

  const updateExchangeRates = async () => {
    try {
      Alert.alert('Updating...', 'Fetching latest exchange rates');
      const updatedCurrencies = await CurrencyService.updateCurrencyRates(currencies);
      await StorageService.saveCurrencies(updatedCurrencies);
      setCurrencies(updatedCurrencies);
      Alert.alert('Success', 'Exchange rates updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update exchange rates');
    }
  };

  const resetAllData = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all accounts, transactions, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.clearAllData();
              Alert.alert('Success', 'All data has been reset');
              loadSettings();
              loadCurrencies();
            } catch (error) {
              Alert.alert('Error', 'Failed to reset data');
            }
          },
        },
      ]
    );
  };

  if (!settings) {
    const styles = createStyles(theme);
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Loading...</Text>
      </View>
    );
  }

  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('language')}</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={settings.language}
            onValueChange={changeLanguage}
            style={styles.picker}
          >
            <Picker.Item label="English" value="en" />
            <Picker.Item label="Español" value="es" />
            <Picker.Item label="Français" value="fr" />
            <Picker.Item label="Deutsch" value="de" />
            <Picker.Item label="العربية" value="ar" />
          </Picker>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('defaultCurrency')}</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={settings.defaultCurrency?.id}
            onValueChange={changeDefaultCurrency}
            style={styles.picker}
          >
            {currencies.map((currency) => (
              <Picker.Item
                key={currency.id}
                label={`${currency.code} - ${currency.name}`}
                value={currency.id}
              />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>{t('autoUpdateRates')}</Text>
          <Switch
            value={settings.autoUpdateRates}
            onValueChange={toggleAutoUpdateRates}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>{t('darkMode')}</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Exchange Rates</Text>
        <TouchableOpacity style={styles.button} onPress={updateExchangeRates}>
          <Text style={styles.buttonText}>{t('updateRates')}</Text>
        </TouchableOpacity>
        <Text style={styles.lastUpdatedText}>
          {t('lastUpdated')}: {new Date().toLocaleString()}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom Currency</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => setCustomCurrencyModalVisible(true)}
        >
          <Text style={styles.buttonText}>{t('customCurrency')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={resetAllData}>
          <Text style={[styles.buttonText, styles.dangerButtonText]}>Reset All Data</Text>
        </TouchableOpacity>
      </View>

      <CustomCurrencyModal
        visible={customCurrencyModalVisible}
        onClose={() => setCustomCurrencyModalVisible(false)}
        onSave={() => {
          loadCurrencies();
        }}
      />
    </ScrollView>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  section: {
    backgroundColor: theme.colors.surface,
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
  },
  picker: {
    height: 50,
    color: theme.colors.text,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: theme.colors.error,
  },
  dangerButtonText: {
    color: 'white',
  },
  lastUpdatedText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default SettingsScreen;