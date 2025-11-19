import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Currency } from '../types';
import i18n from '../utils/i18n';
import StorageService from '../utils/storage';
import CurrencyService from '../utils/currency';
import { useTheme, Theme } from '../utils/theme';
import LocalizedNumberInput from './LocalizedNumberInput';

interface CustomCurrencyModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  editingCurrency?: Currency | null;
}

const CustomCurrencyModal: React.FC<CustomCurrencyModalProps> = ({ visible, onClose, onSave, editingCurrency }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [rate, setRate] = useState('');
  const isEditing = !!editingCurrency;

  const resetForm = () => {
    if (editingCurrency) {
      setCode(editingCurrency.code);
      setName(editingCurrency.name);
      setSymbol(editingCurrency.symbol);
      setRate(editingCurrency.rate.toString());
    } else {
      setCode('');
      setName('');
      setSymbol('');
      setRate('');
    }
  };

  const handleSave = async () => {
    // Validate inputs
    if (!code.trim() || !name.trim() || !symbol.trim() || !rate.trim()) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }

    const upperCode = code.trim().toUpperCase();
    if (!CurrencyService.validateCurrencyCode(upperCode)) {
      Alert.alert(t('error'), t('currencyCodeInvalid'));
      return;
    }

    const numRate = parseFloat(rate.trim());
    if (!CurrencyService.validateExchangeRate(numRate)) {
      Alert.alert(t('error'), t('validExchangeRate'));
      return;
    }

    try {
      const existingCurrencies = await StorageService.getCurrencies();
      
      if (isEditing && editingCurrency) {
        // Edit existing currency
        const duplicate = existingCurrencies.find(c => c.code === upperCode && c.id !== editingCurrency.id);
        
        if (duplicate) {
          let errorMessage = i18n.t('currencyExists', { code: upperCode });
          if (errorMessage.includes('{code}')) {
            errorMessage = errorMessage.replace(/{code}/g, upperCode);
          }
          Alert.alert(t('error'), errorMessage);
          return;
        }

        const updatedCurrencies = existingCurrencies.map(currency => {
          if (currency.id === editingCurrency.id) {
            return {
              ...currency,
              code: upperCode,
              name: name.trim(),
              symbol: symbol.trim(),
              rate: numRate,
            };
          }
          return currency;
        });

        await StorageService.saveCurrencies(updatedCurrencies);
        resetForm();
        onSave();
        onClose();
        // Try direct i18n.t() call instead of useTranslation hook  
        let message = i18n.t('customCurrencyUpdated', { code: upperCode });
        // Fallback: if interpolation failed, manually replace the placeholder
        if (message.includes('{code}')) {
          message = message.replace(/{code}/g, upperCode);
        }
        Alert.alert(t('success'), message);
      } else {
        // Create new currency
        const duplicate = existingCurrencies.find(c => c.code === upperCode);
        
        if (duplicate) {
          let errorMessage = i18n.t('currencyExists', { code: upperCode });
          if (errorMessage.includes('{code}')) {
            errorMessage = errorMessage.replace(/{code}/g, upperCode);
          }
          Alert.alert(t('error'), errorMessage);
          return;
        }

        const newCurrency = CurrencyService.createCustomCurrency(
          upperCode,
          name.trim(),
          symbol.trim(),
          numRate
        );

        const updatedCurrencies = [...existingCurrencies, newCurrency];
        await StorageService.saveCurrencies(updatedCurrencies);

        resetForm();
        onSave();
        onClose();
        // Try direct i18n.t() call instead of useTranslation hook
        let message = i18n.t('customCurrencyAdded', { code: upperCode });
        // Fallback: if interpolation failed, manually replace the placeholder
        if (message.includes('{code}')) {
          message = message.replace(/{code}/g, upperCode);
        }
        Alert.alert(t('success'), message);
      }
    } catch (error) {
      console.error('Failed to save custom currency:', error);
      Alert.alert(t('error'), t('customCurrencyFailed'));
    }
  };

  React.useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible]);

  const styles = createStyles(theme);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{isEditing ? t('editCustomCurrency') : t('customCurrency')}</Text>
          <TouchableOpacity onPress={handleSave}>
            <Ionicons name="checkmark" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              {isEditing ? t('editCustomCurrencyInfo') : t('createCustomCurrency')}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('currencyCode')} *</Text>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder={t('currencyCodePlaceholder')}
              placeholderTextColor={theme.colors.textSecondary}
              maxLength={3}
              autoCapitalize="characters"
            />
            <Text style={styles.helperText}>{t('currencyCodeHelper')}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('currencyName')} *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t('currencyNamePlaceholder')}
              placeholderTextColor={theme.colors.textSecondary}
              maxLength={50}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('currencySymbol')} *</Text>
            <TextInput
              style={styles.input}
              value={symbol}
              onChangeText={setSymbol}
              placeholder={t('symbolExample')}
              placeholderTextColor={theme.colors.textSecondary}
              maxLength={5}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('exchangeRate')} *</Text>
            <LocalizedNumberInput
              style={styles.input}
              value={rate}
              onChangeText={setRate}
              placeholder={t('rateExample')}
              placeholderTextColor={theme.colors.textSecondary}
            />
            <Text style={styles.helperText}>
              {t('rateHelper')}
            </Text>
          </View>

          <View style={styles.exampleBox}>
            <Text style={styles.exampleTitle}>{t('exampleTitle')}</Text>
            <Text style={styles.exampleText}>
              {t('exampleText')}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoBox: {
    backgroundColor: theme.colors.primary + '20',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.primary,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  exampleBox: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});

export default CustomCurrencyModal;