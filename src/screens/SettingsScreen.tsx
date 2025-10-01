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
import { setRTL } from '../utils/i18n';

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
      Alert.alert('Error', t('settingsSaveFailed'));
    }
  };

  const changeLanguage = async (language: string) => {
    try {
      // Update settings state immediately to reflect in UI
      if (settings) {
        const newSettings = { ...settings, language };
        setSettings(newSettings);
        await StorageService.saveSettings(newSettings);
      }
      
      // Change language and apply RTL setting
      await i18n.changeLanguage(language);
      setRTL(language);
      
      // Show simple success notification
      setTimeout(() => {
        Alert.alert(
          t('languageChanged'),
          '',
          [{ text: t('confirm') }]
        );
      }, 100);
    } catch (error) {
      console.error('Failed to change language:', error);
      Alert.alert('Error', t('settingsSaveFailed'));
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
      Alert.alert(t('updating'), t('fetchingRates'));
      const updatedCurrencies = await CurrencyService.updateCurrencyRates(currencies);
      await StorageService.saveCurrencies(updatedCurrencies);
      setCurrencies(updatedCurrencies);
      Alert.alert('Success', t('ratesUpdated'));
    } catch (error) {
      Alert.alert('Error', t('updateFailed'));
    }
  };

  const resetAllData = () => {
    Alert.alert(
      t('resetAllData'),
      t('resetConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('reset'),
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.clearAllData();
              Alert.alert(t('success'), t('allDataReset'));
              loadSettings();
              loadCurrencies();
            } catch (error) {
              Alert.alert('Error', t('resetFailed'));
            }
          },
        },
      ]
    );
  };

  const editCustomCurrency = (currency: Currency) => {
    // TODO: Implement edit functionality - for now, show info
    Alert.alert(
      t('edit') + ' ' + currency.code,
      `${t('currencyCode')}: ${currency.code}\n${t('currencyName')}: ${currency.name}\n${t('currencySymbol')}: ${currency.symbol}\n${t('exchangeRate')}: ${currency.rate.toFixed(4)}`,
      [
        { text: t('cancel') },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: () => deleteCustomCurrency(currency.id)
        }
      ]
    );
  };

  const deleteCustomCurrency = (currencyId: string) => {
    Alert.alert(
      t('delete'),
      t('confirmDelete'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedCurrencies = currencies.filter(c => c.id !== currencyId);
              await StorageService.saveCurrencies(updatedCurrencies);
              setCurrencies(updatedCurrencies);
              
              // If the deleted currency was the default, reset to USD
              if (settings?.defaultCurrency?.id === currencyId) {
                const usdCurrency = updatedCurrencies.find(c => c.code === 'USD');
                if (usdCurrency) {
                  await updateSettings({ ...settings, defaultCurrency: usdCurrency });
                }
              }
              
              Alert.alert(t('success'), t('customCurrencyDeleted'));
            } catch (error) {
              Alert.alert('Error', t('customCurrencyFailed'));
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
            key={`language-picker-${settings.language}`}
            selectedValue={settings.language}
            onValueChange={changeLanguage}
            style={styles.picker}
          >
            <Picker.Item label="English" value="en" />
            <Picker.Item label="Español" value="es" />
            <Picker.Item label="Français" value="fr" />
            <Picker.Item label="Deutsch" value="de" />
            <Picker.Item label="العربية" value="ar" />
            <Picker.Item label="فارسی" value="fa" />
            <Picker.Item label="Italiano" value="it" />
            <Picker.Item label="Português" value="pt" />
            <Picker.Item label="Русский" value="ru" />
            <Picker.Item label="中文" value="zh" />
            <Picker.Item label="日本語" value="ja" />
            <Picker.Item label="한국어" value="ko" />
            <Picker.Item label="Bahasa Indonesia" value="id" />
          </Picker>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('defaultCurrency')}</Text>
        <View style={styles.pickerContainer}>
          <Picker
            key={`currency-picker-${settings.defaultCurrency?.id || 'none'}`}
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
        <Text style={styles.sectionTitle}>{t('exchangeRates')}</Text>
        <TouchableOpacity style={styles.button} onPress={updateExchangeRates}>
          <Text style={styles.buttonText}>{t('updateRates')}</Text>
        </TouchableOpacity>
        <Text style={styles.lastUpdatedText}>
          {t('lastUpdated')}: {new Date().toLocaleString()}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('customCurrency')}</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => setCustomCurrencyModalVisible(true)}
        >
          <Text style={styles.buttonText}>{t('createCustomCurrencyButton')}</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Currency Management */}
      {currencies.filter(c => c.isCustom).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('manageCustomCurrencies')}</Text>
          {currencies.filter(c => c.isCustom).map((currency) => (
            <View key={currency.id} style={styles.currencyItem}>
              <View style={styles.currencyInfo}>
                <Text style={styles.currencyTitle}>
                  {currency.code} - {currency.name}
                </Text>
                <Text style={styles.currencySubtitle}>
                  {currency.symbol} | {t('exchangeRate')}: {currency.rate.toFixed(4)}
                </Text>
              </View>
              <View style={styles.currencyActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => editCustomCurrency(currency)}
                >
                  <Text style={styles.actionButtonText}>{t('edit')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => deleteCustomCurrency(currency.id)}
                >
                  <Text style={styles.actionButtonText}>{t('delete')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('dataManagement')}</Text>
        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={resetAllData}>
          <Text style={[styles.buttonText, styles.dangerButtonText]}>{t('resetAllData')}</Text>
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
    overflow: 'hidden',
    paddingHorizontal: 4,
  },
  picker: {
    height: 56,
    color: theme.colors.text,
    backgroundColor: 'transparent',
    width: '100%',
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
  currencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  currencyInfo: {
    flex: 1,
    marginRight: 12,
  },
  currencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  currencySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  currencyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  editButton: {
    backgroundColor: theme.colors.primary,
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
});

export default SettingsScreen;