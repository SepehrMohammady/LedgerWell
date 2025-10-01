import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '../types';
import StorageService from '../utils/storage';
import CurrencyService from '../utils/currency';
import AddTransactionModal from '../components/AddTransactionModal';
import { useTheme, Theme } from '../utils/theme';

const TransactionsScreen = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [addTransactionModalVisible, setAddTransactionModalVisible] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadTransactions();
    }, [])
  );

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchQuery]);

  const loadTransactions = async () => {
    try {
      const transactionsData = await StorageService.getTransactions();
      // Sort by date (newest first)
      const sortedTransactions = transactionsData.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setTransactions(sortedTransactions);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const filterTransactions = () => {
    if (searchQuery.trim() === '') {
      setFilteredTransactions(transactions);
    } else {
      const filtered = transactions.filter(transaction =>
        transaction.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTransactions(filtered);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  const getTypeColor = (type: string) => {
    return type === 'debt' ? '#F44336' : '#4CAF50';
  };

  const getTypeLabel = (type: string) => {
    return type === 'debt' ? t('debt') : t('credit');
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionDescription}>{item.description}</Text>
            <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.transactionAmount}>
            <Text style={[styles.typeLabel, { color: getTypeColor(item.type) }]}>
              {getTypeLabel(item.type)}
            </Text>
            <Text style={[styles.amountText, { color: getTypeColor(item.type) }]}>
              {CurrencyService.formatAmount(item.amount, item.currency)}
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
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransactionItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('noTransactions')}</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setAddTransactionModalVisible(true)}
            >
              <Text style={styles.addButtonText}>{t('addTransaction')}</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setAddTransactionModalVisible(true)}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>

      <AddTransactionModal
        visible={addTransactionModalVisible}
        onClose={() => setAddTransactionModalVisible(false)}
        onSave={() => loadTransactions()}
        onNavigateToAccounts={() => {
          setAddTransactionModalVisible(false);
          navigation.navigate('Accounts' as never);
        }}
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
  transactionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  transactionDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
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

export default TransactionsScreen;