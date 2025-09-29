import React, { useState, useEffect } from 'react';
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
import { Picker } from '@react-native-picker/picker';
import { Currency } from '../types';
import StorageService from '../utils/storage';

interface AddAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({ visible, onClose, onSave }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  useEffect(() => {
    if (visible) {
      loadCurrencies();
      resetForm();
    }
  }, [visible]);

  const loadCurrencies = async () => {
    try {
      const currenciesData = await StorageService.getCurrencies();
      setCurrencies(currenciesData);
      if (currenciesData.length > 0 && !selectedCurrency) {
        setSelectedCurrency(currenciesData[0]); // Default to first currency (USD)
      }
    } catch (error) {
      console.error('Failed to load currencies:', error);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setSelectedCurrency(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an account name');
      return;
    }

    if (!selectedCurrency) {
      Alert.alert('Error', 'Please select a currency');
      return;
    }

    try {
      const newAccount = {
        id: Date.now().toString(),
        name: name.trim(),
        description: description.trim(),
        currency: selectedCurrency,
        totalOwed: 0,
        totalOwedToMe: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await StorageService.saveAccount(newAccount);
      resetForm();
      onSave();
      onClose();
      Alert.alert('Success', 'Account created successfully');
    } catch (error) {
      console.error('Failed to save account:', error);
      Alert.alert('Error', 'Failed to create account');
    }
  };

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
          <Text style={styles.title}>{t('addAccount')}</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>{t('save')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('accountName')} *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter account name"
              maxLength={50}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('description')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Optional description"
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('currency')} *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedCurrency?.id}
                onValueChange={(value) => {
                  const currency = currencies.find(c => c.id === value);
                  setSelectedCurrency(currency || null);
                }}
                style={styles.picker}
              >
                {currencies.map((currency) => (
                  <Picker.Item
                    key={currency.id}
                    label={`${currency.code} - ${currency.name} (${currency.symbol})`}
                    value={currency.id}
                  />
                ))}
              </Picker>
            </View>
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  picker: {
    height: 50,
  },
});

export default AddAccountModal;