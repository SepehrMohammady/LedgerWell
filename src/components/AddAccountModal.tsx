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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import { Account, Currency } from '../types';
import StorageService from '../utils/storage';
import { useTheme, Theme } from '../utils/theme';

interface AddAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  editAccount?: Account | null;
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({ visible, onClose, onSave, editAccount }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
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

  // Populate fields when editing
  React.useEffect(() => {
    if (visible && editAccount) {
      setName(editAccount.name);
      setDescription(editAccount.description || '');
      setSelectedCurrency(editAccount.currency);
    } else if (visible && !editAccount) {
      resetForm();
    }
  }, [visible, editAccount]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('error'), t('pleaseEnterAccountName'));
      return;
    }

    if (!selectedCurrency) {
      Alert.alert(t('error'), t('pleaseSelectCurrency'));
      return;
    }

    try {
      if (editAccount) {
        // Update existing account
        const updatedAccount = {
          ...editAccount,
          name: name.trim(),
          description: description.trim(),
          currency: selectedCurrency,
          updatedAt: new Date(),
        };
        await StorageService.saveAccount(updatedAccount);
        Alert.alert(t('success'), t('accountUpdated'));
      } else {
        // Create new account
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
        Alert.alert(t('success'), t('accountCreated'));
      }

      resetForm();
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save account:', error);
      Alert.alert(t('error'), t('accountActionFailed', { action: editAccount ? t('update') : t('create') }));
    }
  };

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
          <Text style={styles.title}>{editAccount ? t('edit') + ' ' + t('accounts').slice(0, -1) : t('addAccount')}</Text>
          <TouchableOpacity onPress={handleSave}>
            <Ionicons name="checkmark" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('accountName')} *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t('enterAccountName')}
              placeholderTextColor={theme.colors.textSecondary}
              maxLength={50}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('description')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder={t('optionalDescription')}
              placeholderTextColor={theme.colors.textSecondary}
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  picker: {
    height: 50,
    color: theme.colors.text,
  },
});

export default AddAccountModal;