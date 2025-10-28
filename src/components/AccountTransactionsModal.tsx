import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Account, Transaction } from '../types';
import StorageService from '../utils/storage';
import CurrencyService from '../utils/currency';
import { useTheme, Theme } from '../utils/theme';
import { toLocalizedNumerals } from '../utils/numberLocalization';

interface AccountTransactionsModalProps {
  visible: boolean;
  account: Account | null;
  onClose: () => void;
}

const AccountTransactionsModal: React.FC<AccountTransactionsModalProps> = ({
  visible,
  account,
  onClose,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && account) {
      loadTransactions();
    }
  }, [visible, account]);

  const loadTransactions = async () => {
    if (!account) return;
    
    setLoading(true);
    try {
      const accountTransactions = await StorageService.getTransactionsByAccount(account.id);
      // Sort transactions by date (newest first)
      const sortedTransactions = accountTransactions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setTransactions(sortedTransactions);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString();
  };

  const getTransactionIcon = (type: 'debt' | 'credit') => {
    return type === 'debt' ? 'arrow-down' : 'arrow-up';
  };

  const getTransactionColor = (type: 'debt' | 'credit') => {
    return type === 'debt' ? '#F44336' : '#4CAF50';
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    return (
      <View style={[styles.transactionCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.transactionHeader}>
          <View style={styles.transactionInfo}>
            <View style={styles.transactionTitleRow}>
              <Ionicons 
                name={getTransactionIcon(item.type)} 
                size={16} 
                color={getTransactionColor(item.type)} 
                style={styles.transactionIcon}
              />
              <Text style={[styles.transactionName, { color: theme.colors.text }]}>{item.name}</Text>
            </View>
            {item.description && (
              <Text style={[styles.transactionDescription, { color: theme.colors.textSecondary }]}>
                {item.description}
              </Text>
            )}
            <Text style={[styles.transactionDate, { color: theme.colors.textSecondary }]}>
              {formatDate(item.date)}
            </Text>
          </View>
          <View style={styles.transactionAmount}>
            <Text style={[styles.amountText, { color: getTransactionColor(item.type) }]}>
              {item.type === 'debt' ? '-' : '+'}{CurrencyService.formatAmount(item.amount, item.currency)}
            </Text>
            <Text style={[styles.transactionType, { color: theme.colors.textSecondary }]}>
              {t(item.type)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        {t('noTransactions')}
      </Text>
      <Text style={[styles.emptyDescription, { color: theme.colors.textSecondary }]}>
        {t('addTransaction')}
      </Text>
    </View>
  );

  if (!account) return null;

  const netBalance = account.totalOwedToMe - account.totalOwed;
  const getBalanceColor = (balance: number) => {
    if (balance > 0) return '#4CAF50';
    if (balance < 0) return '#F44336';
    return '#9E9E9E';
  };

  const styles = createStyles(theme);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerInfo}>
              <Text style={[styles.accountTitle, { color: theme.colors.text }]}>{account.name}</Text>
              {account.description && (
                <Text style={[styles.accountSubtitle, { color: theme.colors.textSecondary }]}>
                  {account.description}
                </Text>
              )}
            </View>
            <TouchableOpacity 
              style={[styles.closeButton, { backgroundColor: theme.colors.primary }]}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Balance Summary */}
          <View style={styles.balanceSummary}>
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <Text style={[styles.balanceLabel, { color: theme.colors.textSecondary }]}>
                  {t('totalOwed')}
                </Text>
                <Text style={[styles.balanceAmount, { color: theme.colors.error }]}>
                  {CurrencyService.formatAmount(account.totalOwed, account.currency)}
                </Text>
              </View>
              
              <View style={styles.balanceItem}>
                <Text style={[styles.balanceLabel, { color: theme.colors.textSecondary }]}>
                  {t('totalOwedToMe')}
                </Text>
                <Text style={[styles.balanceAmount, { color: theme.colors.success }]}>
                  {CurrencyService.formatAmount(account.totalOwedToMe, account.currency)}
                </Text>
              </View>
            </View>
            
            <View style={[styles.netBalanceContainer, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.balanceLabel, { color: theme.colors.textSecondary }]}>
                {t('netBalance')}
              </Text>
              <Text style={[styles.netBalanceAmount, { color: getBalanceColor(netBalance) }]}>
                {CurrencyService.formatAmount(netBalance, account.currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Transactions List */}
        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('transactions')} ({toLocalizedNumerals(transactions.length.toString())})
            </Text>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                {t('updating')}
              </Text>
            </View>
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={(item) => item.id}
              renderItem={renderTransactionItem}
              ListEmptyComponent={renderEmptyState}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.listContainer,
                transactions.length === 0 && styles.emptyListContainer
              ]}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerInfo: {
    flex: 1,
    marginRight: 15,
  },
  accountTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  accountSubtitle: {
    fontSize: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceSummary: {
    gap: 15,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  netBalanceContainer: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  netBalanceAmount: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  listContainer: {
    flexGrow: 1,
  },
  emptyListContainer: {
    justifyContent: 'center',
  },
  transactionCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionInfo: {
    flex: 1,
    marginRight: 15,
  },
  transactionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  transactionIcon: {
    marginRight: 8,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    marginBottom: 5,
    lineHeight: 20,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  transactionType: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
});

export default AccountTransactionsModal;