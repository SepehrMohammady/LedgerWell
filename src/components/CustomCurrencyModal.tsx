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
import StorageService from '../utils/storage';
import CurrencyService from '../utils/currency';
import { useTheme, Theme } from '../utils/theme';

interface CustomCurrencyModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

const CustomCurrencyModal: React.FC<CustomCurrencyModalProps> = ({ visible, onClose, onSave }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [rate, setRate] = useState('');

  const resetForm = () => {
    setCode('');
    setName('');
    setSymbol('');
    setRate('');
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
      // Check if currency already exists
      const existingCurrencies = await StorageService.getCurrencies();
      const duplicate = existingCurrencies.find(c => c.code === upperCode);
      
      if (duplicate) {
        Alert.alert(t('error'), t('currencyExists', { code: upperCode }));
        return;
      }

      // Create new custom currency
      const newCurrency = CurrencyService.createCustomCurrency(
        upperCode,
        name.trim(),
        symbol.trim(),
        numRate
      );

      // Save to storage
      const updatedCurrencies = [...existingCurrencies, newCurrency];
      await StorageService.saveCurrencies(updatedCurrencies);

      resetForm();
      onSave();
      onClose();
      Alert.alert(t('success'), t('customCurrencyAdded', { code: upperCode }));
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
          <Text style={styles.title}>{t('customCurrency')}</Text>
          <TouchableOpacity onPress={handleSave}>
            <Ionicons name="checkmark" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              {t('createCustomCurrency')}
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
            <TextInput
              style={styles.input}
              value={rate}
              onChangeText={setRate}
              placeholder={t('rateExample')}
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="decimal-pad"
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