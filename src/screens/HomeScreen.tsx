import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Account, Currency } from '../types';
import StorageService from '../utils/storage';
import CurrencyService from '../utils/currency';
import AddAccountModal from '../components/AddAccountModal';
import AddTransactionModal from '../components/AddTransactionModal';
import { useTheme, Theme } from '../utils/theme';

const HomeScreen = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [defaultCurrency, setDefaultCurrency] = useState<Currency | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [addAccountModalVisible, setAddAccountModalVisible] = useState(false);
  const [addTransactionModalVisible, setAddTransactionModalVisible] = useState(false);
  const [summary, setSummary] = useState({
    totalOwed: 0,
    totalOwedToMe: 0,
    netBalance: 0,
  });

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [accountsData, settings] = await Promise.all([
        StorageService.getAccounts(),
        StorageService.getSettings(),
      ]);
      
      setAccounts(accountsData);
      setDefaultCurrency(settings.defaultCurrency);
      calculateSummary(accountsData, settings.defaultCurrency);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const calculateSummary = (accountsData: Account[], currency: Currency) => {
    let totalOwed = 0;
    let totalOwedToMe = 0;

    accountsData.forEach(account => {
      // Convert amounts to default currency
      const owedInDefaultCurrency = CurrencyService.convertAmount(
        account.totalOwed,
        account.currency,
        currency
      );
      const owedToMeInDefaultCurrency = CurrencyService.convertAmount(
        account.totalOwedToMe,
        account.currency,
        currency
      );

      totalOwed += owedInDefaultCurrency;
      totalOwedToMe += owedToMeInDefaultCurrency;
    });

    setSummary({
      totalOwed,
      totalOwedToMe,
      netBalance: totalOwedToMe - totalOwed,
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return '#4CAF50'; // Green for positive
    if (balance < 0) return '#F44336'; // Red for negative
    return '#9E9E9E'; // Gray for zero
  };

  const styles = createStyles(theme);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>{t('welcome')}</Text>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('totalOwed')}</Text>
          <Text style={[styles.summaryAmount, { color: '#F44336' }]}>
            {defaultCurrency
              ? CurrencyService.formatAmount(summary.totalOwed, defaultCurrency)
              : '$0.00'}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('totalOwedToMe')}</Text>
          <Text style={[styles.summaryAmount, { color: '#4CAF50' }]}>
            {defaultCurrency
              ? CurrencyService.formatAmount(summary.totalOwedToMe, defaultCurrency)
              : '$0.00'}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('netBalance')}</Text>
          <Text
            style={[
              styles.summaryAmount,
              { color: getBalanceColor(summary.netBalance) },
            ]}
          >
            {defaultCurrency
              ? CurrencyService.formatAmount(summary.netBalance, defaultCurrency)
              : '$0.00'}
          </Text>
        </View>
      </View>

      <View style={styles.recentAccountsContainer}>
        <Text style={styles.sectionTitle}>Recent Accounts</Text>
        {accounts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('noAccounts')}</Text>
          </View>
        ) : (
          accounts.slice(0, 5).map(account => (
            <View key={account.id} style={styles.accountCard}>
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{account.name}</Text>
                <Text style={styles.accountDescription}>
                  {account.description || 'No description'}
                </Text>
              </View>
              <View style={styles.accountBalance}>
                <Text style={styles.balanceLabel}>Net:</Text>
                <Text
                  style={[
                    styles.balanceAmount,
                    {
                      color: getBalanceColor(
                        account.totalOwedToMe - account.totalOwed
                      ),
                    },
                  ]}
                >
                  {CurrencyService.formatAmount(
                    account.totalOwedToMe - account.totalOwed,
                    account.currency
                  )}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setAddAccountModalVisible(true)}
        >
          <Text style={styles.actionButtonText}>{t('addAccount')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setAddTransactionModalVisible(true)}
        >
          <Text style={styles.actionButtonText}>{t('addTransaction')}</Text>
        </TouchableOpacity>
      </View>

      <AddAccountModal
        visible={addAccountModalVisible}
        onClose={() => setAddAccountModalVisible(false)}
        onSave={() => loadData()}
      />

      <AddTransactionModal
        visible={addTransactionModalVisible}
        onClose={() => setAddTransactionModalVisible(false)}
        onSave={() => loadData()}
        onNavigateToAccounts={() => {
          setAddTransactionModalVisible(false);
          navigation.navigate('Accounts' as never);
        }}
      />
    </ScrollView>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: theme.colors.primary,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  summaryContainer: {
    padding: 16,
    backgroundColor: theme.colors.surface,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  summaryLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  recentAccountsContainer: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: theme.colors.surface,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  accountCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  accountDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  accountBalance: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;