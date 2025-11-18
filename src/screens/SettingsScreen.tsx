import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import { AppSettings, Currency } from '../types';
import StorageService from '../utils/storage';
import CurrencyService, { DEFAULT_CURRENCIES } from '../utils/currency';
import CustomCurrencyModal from '../components/CustomCurrencyModal';
import { useTheme, Theme } from '../utils/theme';
import { setRTL } from '../utils/i18n';
import { getAppVersion } from '../utils/version';
import ExcelExportService from '../utils/excelExport';
import ExcelImportService, { ImportData, ImportOptions } from '../utils/excelImport';
import {
  isPasswordSet,
  isBiometricAvailable,
  isBiometricEnabled,
  setBiometricEnabled,
  changePassword,
  resetPassword,
  setPassword,
} from '../utils/auth';

// SettingItem component for reusable settings list items
interface SettingItemProps {
  title: string;
  description: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  isLast?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({ 
  title, 
  description, 
  onPress, 
  rightElement, 
  isLast = false 
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const content = (
    <View style={[styles.settingItem, isLast && styles.settingItemLast]}>
      <View style={styles.settingItemContent}>
        <Text style={styles.settingItemTitle}>{title}</Text>
        <Text style={styles.settingItemDescription}>{description}</Text>
      </View>
      {rightElement && <View style={styles.settingItemRight}>{rightElement}</View>}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

// SectionHeader component for section titles
interface SectionHeaderProps {
  title: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  return <Text style={styles.sectionTitle}>{title}</Text>;
};

const SettingsScreen = () => {
  const { t, i18n } = useTranslation();
  const { theme, isDark, toggleTheme } = useTheme();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [customCurrencyModalVisible, setCustomCurrencyModalVisible] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  
  // Security states
  const [hasPassword, setHasPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  useEffect(() => {
    loadSettings();
    loadCurrencies();
    loadSecuritySettings();
  }, []);

  const loadSecuritySettings = async () => {
    try {
      const passwordSet = await isPasswordSet();
      setHasPassword(passwordSet);
      
      const bioAvailable = await isBiometricAvailable();
      setBiometricAvailable(bioAvailable);
      
      if (bioAvailable) {
        const bioEnabled = await isBiometricEnabled();
        setBiometricEnabledState(bioEnabled);
      }
    } catch (error) {
      console.error('Failed to load security settings:', error);
    }
  };

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
    setEditingCurrency(currency);
    setCustomCurrencyModalVisible(true);
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

  const handleOpenWebsite = () => {
    Linking.openURL('https://sepehrmohammady.ir/');
  };

  const handleOpenGitHub = () => {
    Linking.openURL('https://github.com/SepehrMohammady/LedgerWell');
  };

  const exportToExcel = async () => {
    try {
      Alert.alert(t('exportData'), t('preparingExport'));
      
      // Load all data
      const [accounts, transactions] = await Promise.all([
        StorageService.getAccounts(),
        StorageService.getTransactions()
      ]);

      if (accounts.length === 0) {
        Alert.alert(t('noData'), t('noDataToExport'));
        return;
      }

      // Get export statistics
      const stats = ExcelExportService.getExportStats({ accounts, transactions });
      
      // Show export confirmation with statistics
      Alert.alert(
        t('exportData'),
        t('exportConfirmation', {
          accounts: stats.totalAccounts,
          transactions: stats.totalTransactions,
          currencies: stats.currencies.join(', ')
        }),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('export'),
            onPress: async () => {
              try {
                await ExcelExportService.exportToExcel(
                  { accounts, transactions },
                  {
                    includeLocalizedNumbers: true,
                    dateFormat: 'localized',
                    includeMetadata: true
                  }
                );
                Alert.alert(t('success'), t('exportSuccess'));
              } catch (error) {
                console.error('Export failed:', error);
                Alert.alert(t('error'), t('exportFailed'));
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Failed to prepare export:', error);
      Alert.alert(t('error'), t('exportPreparationFailed'));
    }
  };

  const importFromExcel = async () => {
    try {
      Alert.alert(t('importData'), t('selectExcelFile'));
      
      // Import data from Excel file
      const importData = await ExcelImportService.importFromExcel({
        validateCurrencies: true,
        skipDuplicates: false
      });

      if (!importData) {
        // User cancelled file selection
        return;
      }

      // Validate import data
      const validation = ExcelImportService.validateImportData(importData);
      
      if (!validation.isValid) {
        Alert.alert(
          t('importValidationFailed'), 
          validation.errors.join('\n')
        );
        return;
      }

      // Show import preview and confirmation
      const preview = ExcelImportService.getImportPreview(importData);
      
      const duplicateInfo = importData.summary.duplicateAccounts > 0 || importData.summary.duplicateTransactions > 0
        ? [
            '',
            '⚠️ ' + t('duplicatesDetected'),
            t('duplicateAccountsFound', { count: importData.summary.duplicateAccounts }),
            t('duplicateTransactionsFound', { count: importData.summary.duplicateTransactions }),
            ''
          ]
        : [''];
      
      const confirmationMessage = [
        preview.summary,
        '',
        t('importPreviewAccounts') + ':',
        ...preview.accountsList.slice(0, 5).map(acc => `• ${acc}`),
        preview.accountsList.length > 5 ? `... ${t('andMoreAccounts', { count: preview.accountsList.length - 5 })}` : '',
        '',
        t('importPreviewDateRange') + ': ' + preview.dateRange,
        ...duplicateInfo,
        t('importWarning')
      ].filter(Boolean).join('\n');

      Alert.alert(
        t('importData'),
        confirmationMessage,
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('replaceData'),
            style: 'destructive',
            onPress: () => executeImport(importData, { replaceExistingData: true })
          },
          {
            text: t('mergeData'),
            onPress: () => executeImport(importData, { replaceExistingData: false })
          }
        ]
      );
    } catch (error) {
      console.error('Import failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(t('error'), t('importFailed', { error: errorMessage }));
    }
  };

  // Security handlers
  const handleToggleBiometric = async (value: boolean) => {
    try {
      await setBiometricEnabled(value);
      setBiometricEnabledState(value);
      Alert.alert(
        t('success'),
        value ? t('biometricEnabled') : t('biometricDisabled')
      );
    } catch (error) {
      Alert.alert(t('error'), t('failedToUpdateBiometric'));
    }
  };

  const handleChangePassword = async () => {
    // If no password is set, allow setting one without old password
    if (!hasPassword) {
      if (!newPassword || !confirmNewPassword) {
        Alert.alert(t('error'), t('pleaseEnterPassword'));
        return;
      }

      if (newPassword.length < 4) {
        Alert.alert(t('error'), t('passwordTooShort'));
        return;
      }

      if (newPassword !== confirmNewPassword) {
        Alert.alert(t('error'), t('passwordsDoNotMatch'));
        return;
      }

      try {
        await setPassword(newPassword);
        await loadSecuritySettings();
        Alert.alert(t('success'), t('passwordSetSuccessfully'));
        setChangePasswordModalVisible(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } catch (error) {
        Alert.alert(t('error'), t('failedToSetPassword'));
      }
      return;
    }

    // If password exists, require old password to change
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      Alert.alert(t('error'), t('pleaseEnterPassword'));
      return;
    }

    if (newPassword.length < 4) {
      Alert.alert(t('error'), t('passwordTooShort'));
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert(t('error'), t('passwordsDoNotMatch'));
      return;
    }

    const result = await changePassword(oldPassword, newPassword);
    
    if (result.success) {
      Alert.alert(t('success'), t('passwordChangedSuccessfully'));
      setChangePasswordModalVisible(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      Alert.alert(t('error'), result.error || t('failedToChangePassword'));
    }
  };

  const handleRemovePassword = () => {
    Alert.alert(
      t('removePassword'),
      t('removePasswordWarning'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              await resetPassword();
              await loadSecuritySettings();
              Alert.alert(t('success'), t('passwordRemovedSuccessfully'));
            } catch (error) {
              Alert.alert(t('error'), t('failedToRemovePassword'));
            }
          },
        },
      ]
    );
  };

  const executeImport = async (importData: ImportData, options: ImportOptions) => {
    try {
      Alert.alert(t('importData'), t('processingImport'));
      
      // Extract and save custom currencies first
      const customCurrencies = importData.accounts
        .map(account => account.currency)
        .filter(currency => currency.isCustom);
      
      if (customCurrencies.length > 0) {
        const existingCurrencies = await StorageService.getCurrencies();
        const currenciesMap = new Map(existingCurrencies.map(c => [c.code, c]));
        
        // Add custom currencies that don't exist yet
        customCurrencies.forEach(currency => {
          if (!currenciesMap.has(currency.code)) {
            currenciesMap.set(currency.code, currency);
          }
        });
        
        await StorageService.saveCurrencies(Array.from(currenciesMap.values()));
      }
      
      if (options.replaceExistingData) {
        // Clear existing data
        await StorageService.clearAllData();
        
        // Re-save custom currencies after clearing (since clearAllData removes them)
        if (customCurrencies.length > 0) {
          const defaultCurrencies = await StorageService.getCurrencies();
          const currenciesMap = new Map(defaultCurrencies.map(c => [c.code, c]));
          customCurrencies.forEach(currency => {
            currenciesMap.set(currency.code, currency);
          });
          await StorageService.saveCurrencies(Array.from(currenciesMap.values()));
        }
        
        // Create a map of old account IDs to new account IDs
        const accountIdMap = new Map<string, string>();
        
        // Save all imported accounts and build ID map
        for (const account of importData.accounts) {
          const oldId = account.id;
          await StorageService.saveAccount(account);
          accountIdMap.set(oldId, account.id);
        }
        
        // Save all imported transactions with updated account IDs
        for (const transaction of importData.transactions) {
          const newAccountId = accountIdMap.get(transaction.accountId);
          if (newAccountId) {
            transaction.accountId = newAccountId;
          }
          await StorageService.saveTransaction(transaction);
        }
      } else {
        // Merge mode - handle duplicates
        const existingAccounts = await StorageService.getAccounts();
        const existingTransactions = await StorageService.getTransactions();
        
        let addedAccounts = 0;
        let addedTransactions = 0;
        
        // Create a map of old account IDs to new account IDs
        const accountIdMap = new Map<string, string>();
        
        // Add non-duplicate accounts
        for (const account of importData.accounts) {
          const oldId = account.id;
          const isDuplicate = existingAccounts.some(existing => 
            existing.name.toLowerCase() === account.name.toLowerCase() &&
            existing.currency.code === account.currency.code
          );
          
          if (!isDuplicate || !options.skipDuplicates) {
            if (isDuplicate) {
              // Generate new ID for duplicate account
              account.id = `${account.id}_imported_${Date.now()}`;
              account.name = `${account.name} (Imported)`;
            }
            await StorageService.saveAccount(account);
            accountIdMap.set(oldId, account.id);
            addedAccounts++;
          } else {
            // Account was skipped, but we still need to map its ID for transactions
            const existingAccount = existingAccounts.find(existing => 
              existing.name.toLowerCase() === account.name.toLowerCase() &&
              existing.currency.code === account.currency.code
            );
            if (existingAccount) {
              accountIdMap.set(oldId, existingAccount.id);
            }
          }
        }
        
        // Add non-duplicate transactions with updated account IDs
        for (const transaction of importData.transactions) {
          // Update transaction's account ID to match the imported/existing account
          const newAccountId = accountIdMap.get(transaction.accountId);
          if (newAccountId) {
            transaction.accountId = newAccountId;
          }
          
          const isDuplicate = existingTransactions.some(existing => {
            const dateDiff = Math.abs(existing.date.getTime() - transaction.date.getTime());
            const isDateClose = dateDiff < 24 * 60 * 60 * 1000;
            
            return (
              existing.name.toLowerCase().trim() === transaction.name.toLowerCase().trim() &&
              existing.type === transaction.type &&
              Math.abs(existing.amount - transaction.amount) < 0.01 &&
              isDateClose
            );
          });
          
          if (!isDuplicate || !options.skipDuplicates) {
            await StorageService.saveTransaction(transaction);
            addedTransactions++;
          }
        }
        
        // Update success message for merge mode
        Alert.alert(
          t('importSuccess'),
          t('importMergeSuccess', {
            accounts: addedAccounts,
            transactions: addedTransactions,
            skippedAccounts: importData.summary.duplicateAccounts,
            skippedTransactions: importData.summary.duplicateTransactions
          })
        );
        
        // Reload settings to reflect any changes
        loadSettings();
        return;
      }

      // Show success message with statistics
      Alert.alert(
        t('importSuccess'),
        t('importSuccessMessage', {
          accounts: importData.summary.totalAccounts,
          transactions: importData.summary.totalTransactions
        })
      );

      // Reload settings to reflect any changes
      loadSettings();
    } catch (error) {
      console.error('Import execution failed:', error);
      Alert.alert(t('error'), t('importExecutionFailed'));
    }
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
            <Picker.Item label="العربية" value="ar" />
            <Picker.Item label="Bahasa Indonesia" value="id" />
            <Picker.Item label="Deutsch" value="de" />
            <Picker.Item label="English" value="en" />
            <Picker.Item label="Español" value="es" />
            <Picker.Item label="فارسی" value="fa" />
            <Picker.Item label="Français" value="fr" />
            <Picker.Item label="Italiano" value="it" />
            <Picker.Item label="日本語" value="ja" />
            <Picker.Item label="한국어" value="ko" />
            <Picker.Item label="Português" value="pt" />
            <Picker.Item label="Русский" value="ru" />
            <Picker.Item label="中文" value="zh" />
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
                  <Ionicons name="pencil" size={16} color="white" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => deleteCustomCurrency(currency.id)}
                >
                  <Ionicons name="trash" size={16} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Security Section */}
      <View style={styles.section}>
        <SectionHeader title={t('security')} />
        
        {hasPassword ? (
          <>
            <SettingItem
              title={t('changePassword')}
              description={t('changePasswordDescription')}
              onPress={() => setChangePasswordModalVisible(true)}
              rightElement={<Ionicons name="key" size={20} color={theme.colors.primary} />}
            />
            
            {biometricAvailable && (
              <SettingItem
                title={t('biometricAuth')}
                description={t('biometricAuthDescription')}
                rightElement={
                  <Switch
                    value={biometricEnabled}
                    onValueChange={handleToggleBiometric}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    thumbColor="white"
                  />
                }
              />
            )}
            
            <SettingItem
              title={t('removePassword')}
              description={t('removePasswordDescription')}
              onPress={handleRemovePassword}
              rightElement={<Ionicons name="trash" size={20} color={theme.colors.error} />}
              isLast={true}
            />
          </>
        ) : (
          <SettingItem
            title={t('setupPassword')}
            description={t('setupPasswordDescription')}
            onPress={() => setChangePasswordModalVisible(true)}
            rightElement={<Ionicons name="key" size={20} color={theme.colors.primary} />}
            isLast={true}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('dataManagement')}</Text>
        <TouchableOpacity style={styles.button} onPress={exportToExcel}>
          <Text style={styles.buttonText}>{t('exportToExcel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.importButton]} onPress={importFromExcel}>
          <Text style={[styles.buttonText, styles.importButtonText]}>{t('importFromExcel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={resetAllData}>
          <Text style={[styles.buttonText, styles.dangerButtonText]}>{t('resetAllData')}</Text>
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <SectionHeader title={t('about')} />
        <SettingItem
          title="LedgerWell"
          description={t('appDescription')}
        />
        <SettingItem
          title={t('version')}
          description={getAppVersion()}
        />
        <SettingItem
          title={t('developer')}
          description="Sepehr Mohammady"
          onPress={handleOpenWebsite}
          rightElement={<Ionicons name="open-outline" size={20} color={theme.colors.primary} />}
        />
        <SettingItem
          title={t('sourceCode')}
          description="github.com/SepehrMohammady/LedgerWell"
          onPress={handleOpenGitHub}
          rightElement={<Ionicons name="logo-github" size={20} color={theme.colors.primary} />}
        />
        <SettingItem
          title={t('privacy')}
          description={t('privacyDescription')}
          isLast={true}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {t('footerDescription')}
        </Text>
        <Text style={styles.copyrightText}>
          {t('copyrightText')}
        </Text>
      </View>

      <CustomCurrencyModal
        visible={customCurrencyModalVisible}
        editingCurrency={editingCurrency}
        onClose={() => {
          setCustomCurrencyModalVisible(false);
          setEditingCurrency(null);
        }}
        onSave={() => {
          loadCurrencies();
        }}
      />

      {/* Change Password Modal */}
      <Modal
        visible={changePasswordModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setChangePasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('changePassword')}</Text>
              <TouchableOpacity onPress={() => setChangePasswordModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {hasPassword && (
                <>
                  <Text style={styles.inputLabel}>{t('currentPassword')}</Text>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder={t('enterCurrentPassword')}
                    placeholderTextColor={theme.colors.textSecondary}
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </>
              )}

              <Text style={styles.inputLabel}>{hasPassword ? t('newPassword') : t('password')}</Text>
              <TextInput
                style={styles.passwordInput}
                placeholder={t('enterNewPassword')}
                placeholderTextColor={theme.colors.textSecondary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>{t('confirmNewPassword')}</Text>
              <TextInput
                style={styles.passwordInput}
                placeholder={t('confirmNewPassword')}
                placeholderTextColor={theme.colors.textSecondary}
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => {
                    setChangePasswordModalVisible(false);
                    setOldPassword('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                  }}
                >
                  <Text style={styles.modalCancelButtonText}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalConfirmButton]}
                  onPress={handleChangePassword}
                >
                  <Text style={styles.modalConfirmButtonText}>{t('change')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  importButton: {
    backgroundColor: theme.colors.success,
  },
  importButtonText: {
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
    backgroundColor: theme.colors.error,
  },
  // SettingItem styles
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingItemContent: {
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  settingItemDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  settingItemRight: {
    marginLeft: 12,
  },
  // Footer styles
  footer: {
    margin: 16,
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  copyrightText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    opacity: 0.7,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  passwordInput: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalCancelButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    backgroundColor: theme.colors.primary,
  },
  modalConfirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;