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
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import { Account, Currency } from '../types';
import StorageService from '../utils/storage';
import { useTheme, Theme } from '../utils/theme';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  onNavigateToAccounts?: () => void;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ visible, onClose, onSave, onNavigateToAccounts }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [type, setType] = useState<'debt' | 'credit'>('debt');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    if (visible) {
      loadAccounts();
      resetForm();
    }
  }, [visible]);

  const loadAccounts = async () => {
    try {
      const accountsData = await StorageService.getAccounts();
      setAccounts(accountsData);
      if (accountsData.length > 0 && !selectedAccount) {
        setSelectedAccount(accountsData[0]);
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const resetForm = () => {
    setSelectedAccount(null);
    setType('debt');
    setAmount('');
    setDescription('');
  };

  const handleSave = async () => {
    if (!selectedAccount) {
      Alert.alert('Error', 'Please select an account');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      const newTransaction = {
        id: Date.now().toString(),
        accountId: selectedAccount.id,
        type,
        amount: numAmount,
        currency: selectedAccount.currency,
        description: description.trim(),
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await StorageService.saveTransaction(newTransaction);
      resetForm();
      onSave();
      onClose();
      Alert.alert('Success', 'Transaction added successfully');
    } catch (error) {
      console.error('Failed to save transaction:', error);
      Alert.alert('Error', 'Failed to add transaction');
    }
  };

  const styles = createStyles(theme);

  if (accounts.length === 0 && visible) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelButton}>{t('cancel')}</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{t('addTransaction')}</Text>
            <View />
          </View>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              You need to create an account first before adding transactions.
            </Text>
            <TouchableOpacity 
              style={styles.addAccountButton} 
              onPress={() => {
                onClose();
                onNavigateToAccounts?.();
              }}
            >
              <Text style={styles.addAccountButtonText}>Create Account First</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>{t('cancel')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('addTransaction')}</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>{t('save')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedAccount?.id}
                onValueChange={(value) => {
                  const account = accounts.find(a => a.id === value);
                  setSelectedAccount(account || null);
                }}
                style={styles.picker}
              >
                {accounts.map((account) => (
                  <Picker.Item
                    key={account.id}
                    label={`${account.name} (${account.currency.code})`}
                    value={account.id}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('type')} *</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[styles.typeButton, type === 'debt' && styles.typeButtonActive]}
                onPress={() => setType('debt')}
              >
                <Text style={[styles.typeButtonText, type === 'debt' && styles.typeButtonTextActive]}>
                  {t('debt')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === 'credit' && styles.typeButtonActive]}
                onPress={() => setType('credit')}
              >
                <Text style={[styles.typeButtonText, type === 'credit' && styles.typeButtonTextActive]}>
                  {t('credit')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t('amount')} {selectedAccount ? `(${selectedAccount.currency.symbol})` : ''} *
            </Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('description')} *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="What is this transaction for?"
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
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
  cancelButton: {
    color: theme.colors.error,
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  saveButton: {
    color: theme.colors.primary,
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
  typeContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  typeButtonText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  typeButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  addAccountButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addAccountButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddTransactionModal;