import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Account } from '../types';
import StorageService from '../utils/storage';
import CurrencyService from '../utils/currency';
import AddAccountModal from '../components/AddAccountModal';
import { useTheme, Theme } from '../utils/theme';

const AccountsScreen = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [addAccountModalVisible, setAddAccountModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadAccounts();
    }, [])
  );

  useEffect(() => {
    filterAccounts();
  }, [accounts, searchQuery]);

  const loadAccounts = async () => {
    try {
      const accountsData = await StorageService.getAccounts();
      setAccounts(accountsData);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const filterAccounts = () => {
    if (searchQuery.trim() === '') {
      setFilteredAccounts(accounts);
    } else {
      const filtered = accounts.filter(account =>
        account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (account.description && account.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredAccounts(filtered);
    }
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setAddAccountModalVisible(true);
  };

  const handleDeleteAccount = (account: Account) => {
    Alert.alert(
      t('confirm'),
      t('confirmDelete'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => deleteAccount(account.id),
        },
      ]
    );
  };

  const deleteAccount = async (accountId: string) => {
    try {
      await StorageService.deleteAccount(accountId);
      loadAccounts();
    } catch (error) {
      console.error('Failed to delete account:', error);
      Alert.alert('Error', 'Failed to delete account');
    }
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return '#4CAF50';
    if (balance < 0) return '#F44336';
    return '#9E9E9E';
  };

  const renderAccountItem = ({ item }: { item: Account }) => {
    const netBalance = item.totalOwedToMe - item.totalOwed;
    
    return (
      <View style={styles.accountCard}>
        <View style={styles.accountHeader}>
          <View style={styles.accountInfo}>
            <Text style={styles.accountName}>{item.name}</Text>
            {item.description && (
              <Text style={styles.accountDescription}>{item.description}</Text>
            )}
          </View>
          <View style={styles.accountActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleEditAccount(item)}
            >
              <Ionicons name="pencil" size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteAccount(item)}
            >
              <Ionicons name="trash" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.balanceContainer}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>{t('totalOwed')}</Text>
            <Text style={[styles.balanceAmount, { color: '#F44336' }]}>
              {CurrencyService.formatAmount(item.totalOwed, item.currency)}
            </Text>
          </View>
          
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>{t('totalOwedToMe')}</Text>
            <Text style={[styles.balanceAmount, { color: '#4CAF50' }]}>
              {CurrencyService.formatAmount(item.totalOwedToMe, item.currency)}
            </Text>
          </View>
          
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>{t('netBalance')}</Text>
            <Text style={[styles.balanceAmount, { color: getBalanceColor(netBalance) }]}>
              {CurrencyService.formatAmount(netBalance, item.currency)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredAccounts}
        keyExtractor={(item) => item.id}
        renderItem={renderAccountItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('noAccounts')}</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setAddAccountModalVisible(true)}
            >
              <Text style={styles.addButtonText}>{t('addAccount')}</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setAddAccountModalVisible(true)}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>

      <AddAccountModal
        visible={addAccountModalVisible}
        onClose={() => {
          setAddAccountModalVisible(false);
          setEditingAccount(null);
        }}
        onSave={() => {
          loadAccounts();
          setEditingAccount(null);
        }}
        editAccount={editingAccount}
      />
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: theme.colors.surface,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
  },
  listContainer: {
    padding: 16,
  },
  accountCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  accountDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  accountActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: 'white',
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default AccountsScreen;