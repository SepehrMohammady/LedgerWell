import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { Transaction, Account, AppSettings, Currency } from '../types';
import StorageService from '../utils/storage';
import CurrencyService from '../utils/currency';
import AddTransactionModal from '../components/AddTransactionModal';
import { useTheme, Theme } from '../utils/theme';

const screenWidth = Dimensions.get('window').width;

const TransactionsScreen = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [addTransactionModalVisible, setAddTransactionModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  // Selection mode state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  
  // Charts modal state
  const [chartsModalVisible, setChartsModalVisible] = useState(false);
  const [chartType, setChartType] = useState<'all' | 'account'>('all');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadTransactions();
      loadAccounts();
      loadSettings();
    }, [])
  );

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchQuery]);

  const loadTransactions = async () => {
    try {
      const transactionsData = await StorageService.getTransactions();
      const sortedTransactions = transactionsData.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setTransactions(sortedTransactions);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const loadAccounts = async () => {
    try {
      const accountsData = await StorageService.getAccounts();
      setAccounts(accountsData);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const settingsData = await StorageService.getSettings();
      setSettings(settingsData);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const getDefaultCurrency = (): Currency => {
    return settings?.defaultCurrency || CurrencyService.getDefaultCurrency();
  };

  const filterTransactions = () => {
    if (searchQuery.trim() === '') {
      setFilteredTransactions(transactions);
    } else {
      const filtered = transactions.filter(transaction =>
        transaction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (transaction.description && transaction.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredTransactions(filtered);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  const getTypeColor = (type: string) => {
    return type === 'debt' ? theme.colors.error : theme.colors.success;
  };

  const getTypeLabel = (type: string) => {
    return type === 'debt' ? t('debt') : t('credit');
  };

  // Selection mode functions
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedTransactions(new Set());
  };

  const toggleTransactionSelection = (transactionId: string) => {
    const newSelection = new Set(selectedTransactions);
    if (newSelection.has(transactionId)) {
      newSelection.delete(transactionId);
    } else {
      newSelection.add(transactionId);
    }
    setSelectedTransactions(newSelection);
  };

  const selectAll = () => {
    const allIds = new Set(filteredTransactions.map(t => t.id));
    setSelectedTransactions(allIds);
  };

  const deselectAll = () => {
    setSelectedTransactions(new Set());
  };

  const getSelectedSum = () => {
    let debtSum = 0;
    let creditSum = 0;
    
    selectedTransactions.forEach(id => {
      const transaction = transactions.find(t => t.id === id);
      if (transaction) {
        // Convert to default currency for summing
        const amountInDefault = CurrencyService.convertToDefault(
          transaction.amount,
          transaction.currency
        );
        if (transaction.type === 'debt') {
          debtSum += amountInDefault;
        } else {
          creditSum += amountInDefault;
        }
      }
    });
    
    return { debtSum, creditSum, netSum: creditSum - debtSum };
  };

  const handleDeleteSelected = () => {
    if (selectedTransactions.size === 0) return;
    
    Alert.alert(
      t('confirm'),
      t('deleteSelectedConfirm', { count: selectedTransactions.size }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              for (const id of selectedTransactions) {
                await StorageService.deleteTransaction(id);
              }
              setSelectedTransactions(new Set());
              setSelectionMode(false);
              loadTransactions();
              Alert.alert(t('success'), t('deleteSelectedSuccess'));
            } catch (error) {
              console.error('Failed to delete transactions:', error);
              Alert.alert(t('error'), t('deleteSelectedFailed'));
            }
          },
        },
      ]
    );
  };

  const handleMergeSelected = () => {
    if (selectedTransactions.size < 2) {
      Alert.alert(t('error'), t('mergeMinimum'));
      return;
    }

    const selectedList = Array.from(selectedTransactions).map(id => 
      transactions.find(t => t.id === id)!
    );

    // Check if all selected transactions have the same type
    const types = new Set(selectedList.map(t => t.type));
    if (types.size > 1) {
      Alert.alert(t('error'), t('mergeSameType'));
      return;
    }

    // Check if all selected transactions are for the same account
    const accountIds = new Set(selectedList.map(t => t.accountId));
    if (accountIds.size > 1) {
      Alert.alert(t('error'), t('mergeSameAccount'));
      return;
    }

    // Calculate merged amount (sum all amounts in same currency)
    const totalAmount = selectedList.reduce((sum, t) => sum + t.amount, 0);
    const firstTransaction = selectedList[0];
    const names = [...new Set(selectedList.map(t => t.name))].join(', ');
    const descriptions = selectedList
      .filter(t => t.description)
      .map(t => t.description)
      .join('; ');

    Alert.alert(
      t('mergeTransactions'),
      t('mergeConfirm', { 
        count: selectedTransactions.size, 
        amount: CurrencyService.formatAmount(totalAmount, firstTransaction.currency)
      }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('merge'),
          onPress: async () => {
            try {
              // Create merged transaction
              const mergedTransaction: Transaction = {
                id: Date.now().toString(),
                accountId: firstTransaction.accountId,
                type: firstTransaction.type,
                amount: totalAmount,
                currency: firstTransaction.currency,
                name: names,
                description: descriptions || undefined,
                date: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              // Delete old transactions
              for (const id of selectedTransactions) {
                await StorageService.deleteTransaction(id);
              }

              // Save merged transaction
              await StorageService.saveTransaction(mergedTransaction);

              setSelectedTransactions(new Set());
              setSelectionMode(false);
              loadTransactions();
              Alert.alert(t('success'), t('mergeSuccess'));
            } catch (error) {
              console.error('Failed to merge transactions:', error);
              Alert.alert(t('error'), t('mergeFailed'));
            }
          },
        },
      ]
    );
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setAddTransactionModalVisible(true);
  };

  const handleDeleteTransaction = (transaction: Transaction) => {
    Alert.alert(
      t('confirm'),
      t('confirmDelete'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.deleteTransaction(transaction.id);
              loadTransactions();
            } catch (error) {
              console.error('Failed to delete transaction:', error);
              Alert.alert('Error', 'Failed to delete transaction');
            }
          },
        },
      ]
    );
  };

  // Chart data preparation
  const getChartData = (accountId: string | null = null) => {
    const filteredData = accountId 
      ? transactions.filter(t => t.accountId === accountId)
      : transactions;

    // Group by month
    const monthlyData: { [key: string]: { debt: number; credit: number } } = {};
    
    filteredData.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { debt: 0, credit: 0 };
      }
      
      const amountInDefault = CurrencyService.convertToDefault(t.amount, t.currency);
      if (t.type === 'debt') {
        monthlyData[monthKey].debt += amountInDefault;
      } else {
        monthlyData[monthKey].credit += amountInDefault;
      }
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    const labels = sortedMonths.map(m => {
      const [year, month] = m.split('-');
      return `${month}/${year.slice(2)}`;
    });

    return {
      labels: labels.slice(-6), // Last 6 months
      datasets: [
        {
          data: sortedMonths.slice(-6).map(m => monthlyData[m]?.credit || 0),
          color: () => theme.colors.success,
          strokeWidth: 2,
        },
        {
          data: sortedMonths.slice(-6).map(m => monthlyData[m]?.debt || 0),
          color: () => theme.colors.error,
          strokeWidth: 2,
        },
      ],
      legend: [t('credit'), t('debt')],
    };
  };

  const getPieChartData = (accountId: string | null = null) => {
    const filteredData = accountId 
      ? transactions.filter(t => t.accountId === accountId)
      : transactions;

    let totalDebt = 0;
    let totalCredit = 0;

    filteredData.forEach(t => {
      const amountInDefault = CurrencyService.convertToDefault(t.amount, t.currency);
      if (t.type === 'debt') {
        totalDebt += amountInDefault;
      } else {
        totalCredit += amountInDefault;
      }
    });

    return [
      {
        name: t('creditShort'),
        amount: Math.round(totalCredit * 100) / 100,
        color: theme.colors.success,
        legendFontColor: theme.colors.text,
        legendFontSize: 12,
      },
      {
        name: t('debtShort'),
        amount: Math.round(totalDebt * 100) / 100,
        color: theme.colors.error,
        legendFontColor: theme.colors.text,
        legendFontSize: 12,
      },
    ];
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isSelected = selectedTransactions.has(item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.transactionCard,
          isSelected && styles.selectedCard,
        ]}
        onPress={() => {
          if (selectionMode) {
            toggleTransactionSelection(item.id);
          }
        }}
        onLongPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
            toggleTransactionSelection(item.id);
          }
        }}
      >
        {selectionMode && (
          <View style={styles.checkboxContainer}>
            <Ionicons 
              name={isSelected ? "checkbox" : "square-outline"} 
              size={24} 
              color={isSelected ? theme.colors.primary : theme.colors.textSecondary} 
            />
          </View>
        )}
        <View style={[styles.transactionHeader, selectionMode && { flex: 1 }]}>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionName}>{item.name}</Text>
            {item.description && (
              <Text style={styles.transactionDescription} numberOfLines={2}>{item.description}</Text>
            )}
            <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.transactionActions}>
            <View style={styles.transactionAmount}>
              <Text style={[styles.typeLabel, { color: getTypeColor(item.type) }]}>
                {getTypeLabel(item.type)}
              </Text>
              <Text style={[styles.amountText, { color: getTypeColor(item.type) }]}>
                {CurrencyService.formatAmount(item.amount, item.currency)}
              </Text>
            </View>
            {!selectionMode && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEditTransaction(item)}
                >
                  <Ionicons name="pencil" size={16} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteTransaction(item)}
                >
                  <Ionicons name="trash" size={16} color="white" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSelectionBar = () => {
    if (!selectionMode) return null;
    
    const { debtSum, creditSum, netSum } = getSelectedSum();
    const defaultCurrency = getDefaultCurrency();
    
    return (
      <View style={styles.selectionBar}>
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionCount}>
            {t('selected')}: {selectedTransactions.size}
          </Text>
          {selectedTransactions.size > 0 && (
            <View style={styles.selectionSums}>
              <Text style={[styles.sumText, { color: theme.colors.success }]}>
                +{CurrencyService.formatAmount(creditSum, defaultCurrency)}
              </Text>
              <Text style={[styles.sumText, { color: theme.colors.error }]}>
                -{CurrencyService.formatAmount(debtSum, defaultCurrency)}
              </Text>
              <Text style={[styles.sumText, styles.netText]}>
                {t('net')}: {CurrencyService.formatAmount(netSum, defaultCurrency)}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.selectionActions}>
          <TouchableOpacity style={styles.selectionButton} onPress={selectAll}>
            <Ionicons name="checkbox-outline" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.selectionButton} onPress={deselectAll}>
            <Ionicons name="close-circle-outline" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.selectionButton, selectedTransactions.size < 2 && styles.disabledButton]} 
            onPress={handleMergeSelected}
            disabled={selectedTransactions.size < 2}
          >
            <Ionicons name="git-merge-outline" size={20} color={selectedTransactions.size >= 2 ? theme.colors.warning : theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.selectionButton, selectedTransactions.size === 0 && styles.disabledButton]} 
            onPress={handleDeleteSelected}
            disabled={selectedTransactions.size === 0}
          >
            <Ionicons name="trash-outline" size={20} color={selectedTransactions.size > 0 ? theme.colors.error : theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.selectionButton} onPress={toggleSelectionMode}>
            <Ionicons name="close" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderChartsModal = () => {
    const chartConfig = {
      backgroundColor: theme.colors.surface,
      backgroundGradientFrom: theme.colors.surface,
      backgroundGradientTo: theme.colors.surface,
      decimalPlaces: 0,
      color: (opacity = 1) => theme.colors.primary,
      labelColor: () => theme.colors.text,
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: '4',
        strokeWidth: '2',
      },
    };

    const lineChartData = getChartData(chartType === 'account' ? selectedAccountId : null);
    const pieChartData = getPieChartData(chartType === 'account' ? selectedAccountId : null);

    return (
      <Modal
        visible={chartsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setChartsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.chartsModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('charts')}</Text>
              <TouchableOpacity onPress={() => setChartsModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.chartTypeSelector}>
              <TouchableOpacity
                style={[styles.chartTypeButton, chartType === 'all' && styles.chartTypeButtonActive]}
                onPress={() => setChartType('all')}
              >
                <Text style={[styles.chartTypeText, chartType === 'all' && styles.chartTypeTextActive]}>
                  {t('allTransactions')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chartTypeButton, chartType === 'account' && styles.chartTypeButtonActive]}
                onPress={() => setChartType('account')}
              >
                <Text style={[styles.chartTypeText, chartType === 'account' && styles.chartTypeTextActive]}>
                  {t('byAccount')}
                </Text>
              </TouchableOpacity>
            </View>

            {chartType === 'account' && (
              <ScrollView horizontal style={styles.accountSelector} showsHorizontalScrollIndicator={false}>
                {accounts.map(account => (
                  <TouchableOpacity
                    key={account.id}
                    style={[
                      styles.accountChip,
                      selectedAccountId === account.id && styles.accountChipActive
                    ]}
                    onPress={() => setSelectedAccountId(account.id)}
                  >
                    <Text style={[
                      styles.accountChipText,
                      selectedAccountId === account.id && styles.accountChipTextActive
                    ]}>
                      {account.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <ScrollView style={styles.chartsContainer}>
              <Text style={styles.chartTitle}>{t('monthlyTrend')}</Text>
              {lineChartData.labels.length > 0 ? (
                <LineChart
                  data={lineChartData}
                  width={screenWidth - 64}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              ) : (
                <Text style={styles.noDataText}>{t('noDataForChart')}</Text>
              )}

              <Text style={styles.chartTitle}>{t('debtVsCredit')}</Text>
              {pieChartData.some(d => d.amount > 0) ? (
                <PieChart
                  data={pieChartData}
                  width={screenWidth - 64}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="amount"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  style={styles.chart}
                />
              ) : (
                <Text style={styles.noDataText}>{t('noDataForChart')}</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setChartsModalVisible(true)}
          >
            <Ionicons name="bar-chart-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, selectionMode && styles.headerButtonActive]}
            onPress={toggleSelectionMode}
          >
            <Ionicons 
              name={selectionMode ? "checkbox" : "checkbox-outline"} 
              size={24} 
              color={selectionMode ? theme.colors.primary : theme.colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {renderSelectionBar()}

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
              <Ionicons name="add-circle" size={20} color="white" />
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
        onClose={() => {
          setAddTransactionModalVisible(false);
          setEditingTransaction(null);
        }}
        onSave={() => {
          loadTransactions();
          setEditingTransaction(null);
        }}
        onNavigateToAccounts={() => {
          setAddTransactionModalVisible(false);
          setEditingTransaction(null);
          navigation.navigate('Accounts' as never);
        }}
        editTransaction={editingTransaction}
      />

      {renderChartsModal()}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerButtonActive: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
  },
  selectionBar: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  selectionInfo: {
    marginBottom: 8,
  },
  selectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  selectionSums: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sumText: {
    fontSize: 12,
    fontWeight: '500',
  },
  netText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  selectionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  selectionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  disabledButton: {
    opacity: 0.5,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  transactionDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: theme.colors.primary,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  chartsModalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  chartTypeSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  chartTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  chartTypeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chartTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  chartTypeTextActive: {
    color: 'white',
  },
  accountSelector: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  accountChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 8,
  },
  accountChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  accountChipText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  accountChipTextActive: {
    color: 'white',
  },
  chartsContainer: {
    paddingHorizontal: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
    marginTop: 16,
  },
  chart: {
    borderRadius: 12,
  },
  noDataText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    paddingVertical: 40,
  },
});

export default TransactionsScreen;