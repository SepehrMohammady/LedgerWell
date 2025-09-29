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
import { useTranslation } from 'react-i18next';
import { Currency } from '../types';
import StorageService from '../utils/storage';
import CurrencyService from '../utils/currency';

interface CustomCurrencyModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

const CustomCurrencyModal: React.FC<CustomCurrencyModalProps> = ({ visible, onClose, onSave }) => {
  const { t } = useTranslation();
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
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const upperCode = code.trim().toUpperCase();
    if (!CurrencyService.validateCurrencyCode(upperCode)) {
      Alert.alert('Error', 'Currency code must be exactly 3 letters (e.g., USD, EUR)');
      return;
    }

    const numRate = parseFloat(rate.trim());
    if (!CurrencyService.validateExchangeRate(numRate)) {
      Alert.alert('Error', 'Please enter a valid exchange rate (positive number)');
      return;
    }

    try {
      // Check if currency already exists
      const existingCurrencies = await StorageService.getCurrencies();
      const duplicate = existingCurrencies.find(c => c.code === upperCode);
      
      if (duplicate) {
        Alert.alert('Error', `Currency ${upperCode} already exists`);
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
      Alert.alert('Success', `Custom currency ${upperCode} added successfully`);
    } catch (error) {
      console.error('Failed to save custom currency:', error);
      Alert.alert('Error', 'Failed to add custom currency');
    }
  };

  React.useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>{t('cancel')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('customCurrency')}</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>{t('save')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Create a custom currency by providing the currency code, name, symbol, and exchange rate to USD.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('currencyCode')} *</Text>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder="e.g., BTC, ETH"
              maxLength={3}
              autoCapitalize="characters"
            />
            <Text style={styles.helperText}>3 letter currency code</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('currencyName')} *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Bitcoin, Ethereum"
              maxLength={50}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('currencySymbol')} *</Text>
            <TextInput
              style={styles.input}
              value={symbol}
              onChangeText={setSymbol}
              placeholder="e.g., ₿, Ξ, ₹"
              maxLength={5}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('exchangeRate')} *</Text>
            <TextInput
              style={styles.input}
              value={rate}
              onChangeText={setRate}
              placeholder="e.g., 45000.00"
              keyboardType="decimal-pad"
            />
            <Text style={styles.helperText}>
              How much 1 USD equals in your currency
            </Text>
          </View>

          <View style={styles.exampleBox}>
            <Text style={styles.exampleTitle}>Example:</Text>
            <Text style={styles.exampleText}>
              Code: BTC{'\n'}
              Name: Bitcoin{'\n'}
              Symbol: ₿{'\n'}
              Rate: 0.000025 (if 1 USD = 0.000025 BTC)
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cancelButton: {
    color: '#FF3B30',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  exampleBox: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});

export default CustomCurrencyModal;