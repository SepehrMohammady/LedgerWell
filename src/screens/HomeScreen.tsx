import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Modal,
  Switch,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import { Account, Currency, HomeSectionConfig } from '../types';
import StorageService from '../utils/storage';
import CurrencyService from '../utils/currency';
import AddAccountModal from '../components/AddAccountModal';
import AddTransactionModal from '../components/AddTransactionModal';
import { useTheme, Theme } from '../utils/theme';

const screenWidth = Dimensions.get('window').width;

const DEFAULT_HOME_SECTIONS: HomeSectionConfig[] = [
  { id: 'summary', visible: true, order: 0 },
  { id: 'recentAccounts', visible: true, order: 1 },
  { id: 'debtVsCredit', visible: true, order: 2 },
  { id: 'accountBalances', visible: true, order: 3 },
  { id: 'quickActions', visible: true, order: 4 },
];

const HomeScreen = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [defaultCurrency, setDefaultCurrency] = useState<Currency | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [addAccountModalVisible, setAddAccountModalVisible] = useState(false);
  const [addTransactionModalVisible, setAddTransactionModalVisible] = useState(false);
  const [customizeModalVisible, setCustomizeModalVisible] = useState(false);
  const [homeSections, setHomeSections] = useState<HomeSectionConfig[]>(DEFAULT_HOME_SECTIONS);
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
      
      // Merge saved sections with defaults (handles new sections added in updates)
      const saved = settings.homeSections || [];
      const merged = DEFAULT_HOME_SECTIONS.map(def => {
        const existing = saved.find(s => s.id === def.id);
        return existing || def;
      });
      // Normalize orders to avoid conflicts from migration
      merged.sort((a, b) => a.order - b.order);
      const normalized = merged.map((s, i) => ({ ...s, order: i }));
      setHomeSections(normalized);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const calculateSummary = (accountsData: Account[], currency: Currency) => {
    let totalOwed = 0;
    let totalOwedToMe = 0;

    accountsData.forEach(account => {
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
    if (balance > 0) return theme.colors.success;
    if (balance < 0) return theme.colors.error;
    return theme.colors.textSecondary;
  };

  const saveSections = async (sections: HomeSectionConfig[]) => {
    setHomeSections(sections);
    try {
      const settings = await StorageService.getSettings();
      await StorageService.saveSettings({ ...settings, homeSections: sections });
    } catch (error) {
      console.error('Failed to save home sections:', error);
    }
  };

  const toggleSectionVisibility = (id: string) => {
    const updated = homeSections.map(s => s.id === id ? { ...s, visible: !s.visible } : s);
    saveSections(updated);
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const sorted = [...homeSections].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(s => s.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];
    const reordered = sorted.map((s, i) => ({ ...s, order: i }));
    saveSections(reordered);
  };

  const getSectionLabel = (id: string) => {
    switch (id) {
      case 'summary': return t('summarySection');
      case 'recentAccounts': return t('recentAccountsSection');
      case 'quickActions': return t('quickActionsSection');
      case 'debtVsCredit': return t('debtVsCreditSection');
      case 'accountBalances': return t('accountBalancesSection');
      default: return id;
    }
  };

  const renderSection = (section: HomeSectionConfig) => {
    if (!section.visible) return null;
    switch (section.id) {
      case 'summary': return renderSummary();
      case 'recentAccounts': return renderRecentAccounts();
      case 'quickActions': return renderQuickActions();
      case 'debtVsCredit': return renderDebtVsCredit();
      case 'accountBalances': return renderAccountBalances();
      default: return null;
    }
  };

  const renderSummary = () => (
    <View key="summary" style={styles.summaryContainer}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>{t('totalOwed')}</Text>
        <Text style={[styles.summaryAmount, { color: theme.colors.error }]}>
          {defaultCurrency ? CurrencyService.formatAmount(summary.totalOwed, defaultCurrency) : '$0.00'}
        </Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>{t('totalOwedToMe')}</Text>
        <Text style={[styles.summaryAmount, { color: theme.colors.success }]}>
          {defaultCurrency ? CurrencyService.formatAmount(summary.totalOwedToMe, defaultCurrency) : '$0.00'}
        </Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>{t('netBalance')}</Text>
        <Text style={[styles.summaryAmount, { color: getBalanceColor(summary.netBalance) }]}>
          {defaultCurrency ? CurrencyService.formatAmount(summary.netBalance, defaultCurrency) : '$0.00'}
        </Text>
      </View>
    </View>
  );

  const renderRecentAccounts = () => (
    <View key="recentAccounts" style={styles.recentAccountsContainer}>
      <Text style={styles.sectionTitle}>{t('recentAccounts')}</Text>
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
                {account.description || t('noDescription')}
              </Text>
            </View>
            <View style={styles.accountBalance}>
              <Text style={styles.balanceLabel}>{t('net')}:</Text>
              <Text style={[styles.balanceAmount, { color: getBalanceColor(account.totalOwedToMe - account.totalOwed) }]}>
                {CurrencyService.formatAmount(account.totalOwedToMe - account.totalOwed, account.currency)}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderQuickActions = () => (
    <View key="quickActions" style={styles.quickActions}>
      <TouchableOpacity style={styles.actionButton} onPress={() => setAddAccountModalVisible(true)}>
        <Text style={styles.actionButtonText}>{t('addAccount')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={() => setAddTransactionModalVisible(true)}>
        <Text style={styles.actionButtonText}>{t('addTransaction')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDebtVsCredit = () => {
    if (!defaultCurrency || accounts.length === 0) return null;
    const pieData = [];
    if (summary.totalOwedToMe > 0) {
      pieData.push({
        name: t('creditShort'),
        amount: summary.totalOwedToMe,
        color: theme.colors.success,
        legendFontColor: theme.colors.text,
        legendFontSize: 14,
      });
    }
    if (summary.totalOwed > 0) {
      pieData.push({
        name: t('debtShort'),
        amount: summary.totalOwed,
        color: theme.colors.error,
        legendFontColor: theme.colors.text,
        legendFontSize: 14,
      });
    }
    if (pieData.length === 0) return null;
    const total = summary.totalOwedToMe + summary.totalOwed;
    const creditPct = total > 0 ? Math.round((summary.totalOwedToMe / total) * 100) : 0;
    const debtPct = total > 0 ? Math.round((summary.totalOwed / total) * 100) : 0;
    return (
      <View key="debtVsCredit" style={styles.chartSection}>
        <Text style={styles.sectionTitle}>{t('debtVsCreditSection')}</Text>
        <View style={styles.pieContainer}>
          <PieChart
            data={pieData}
            width={160}
            height={160}
            chartConfig={{
              color: () => theme.colors.text,
              labelColor: () => 'transparent',
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="0"
            center={[40, 0]}
            absolute={true}
            hasLegend={false}
          />
          <View style={styles.pieLegend}>
            {summary.totalOwedToMe > 0 && (
              <View style={styles.pieLegendItem}>
                <View style={[styles.pieLegendDot, { backgroundColor: theme.colors.success }]} />
                <Text style={styles.pieLegendText}>{creditPct}% {t('creditShort')}</Text>
                <Text style={[styles.pieLegendAmount, { color: theme.colors.success }]}>
                  {CurrencyService.formatAmount(summary.totalOwedToMe, defaultCurrency)}
                </Text>
              </View>
            )}
            {summary.totalOwed > 0 && (
              <View style={styles.pieLegendItem}>
                <View style={[styles.pieLegendDot, { backgroundColor: theme.colors.error }]} />
                <Text style={styles.pieLegendText}>{debtPct}% {t('debtShort')}</Text>
                <Text style={[styles.pieLegendAmount, { color: theme.colors.error }]}>
                  {CurrencyService.formatAmount(summary.totalOwed, defaultCurrency)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderAccountBalances = () => {
    if (!defaultCurrency || accounts.length === 0) return null;
    const balances = accounts.map(a => ({
      name: a.name,
      net: CurrencyService.convertAmount(
        a.totalOwedToMe - a.totalOwed,
        a.currency,
        defaultCurrency
      ),
    }));
    return (
      <View key="accountBalances" style={styles.chartSection}>
        <Text style={styles.sectionTitle}>{t('accountBalancesSection')}</Text>
        <View style={styles.balanceBarsContainer}>
          {balances.map((item, idx) => {
            const maxAbs = Math.max(...balances.map(b => Math.abs(b.net)), 1);
            const pct = Math.abs(item.net) / maxAbs;
            const barColor = item.net >= 0 ? theme.colors.success : theme.colors.error;
            return (
              <View key={idx} style={styles.balanceBarRow}>
                <Text style={styles.balanceBarName} numberOfLines={1}>
                  {item.name.length > 10 ? item.name.slice(0, 10) + '..' : item.name}
                </Text>
                <View style={styles.balanceBarTrack}>
                  <View style={[styles.balanceBarFill, { width: `${Math.max(pct * 100, 4)}%`, backgroundColor: barColor }]} />
                </View>
                <Text style={[styles.balanceBarValue, { color: barColor }]}>
                  {defaultCurrency.symbol}{Math.abs(Math.round(item.net)).toLocaleString()}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderCustomizeModal = () => {
    const sorted = [...homeSections].sort((a, b) => a.order - b.order);
    return (
      <Modal visible={customizeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('customizeHome')}</Text>
            {sorted.map((section, idx) => (
              <View key={section.id} style={styles.customizeRow}>
                <Switch
                  value={section.visible}
                  onValueChange={() => toggleSectionVisibility(section.id)}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                />
                <Text style={styles.customizeLabel}>{getSectionLabel(section.id)}</Text>
                <View style={styles.customizeArrows}>
                  <TouchableOpacity
                    disabled={idx === 0}
                    onPress={() => moveSection(section.id, 'up')}
                    style={[styles.arrowButton, idx === 0 && styles.arrowDisabled]}
                  >
                    <Ionicons name="arrow-up" size={20} color={idx === 0 ? theme.colors.border : theme.colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={idx === sorted.length - 1}
                    onPress={() => moveSection(section.id, 'down')}
                    style={[styles.arrowButton, idx === sorted.length - 1 && styles.arrowDisabled]}
                  >
                    <Ionicons name="arrow-down" size={20} color={idx === sorted.length - 1 ? theme.colors.border : theme.colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.doneButton} onPress={() => setCustomizeModalVisible(false)}>
              <Text style={styles.doneButtonText}>{t('done')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const styles = createStyles(theme);
  const sortedSections = [...homeSections].sort((a, b) => a.order - b.order);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.headerLogo} />
        <Text style={styles.welcomeText}>{t('welcome')}</Text>
        <TouchableOpacity style={styles.customizeButton} onPress={() => setCustomizeModalVisible(true)}>
          <Ionicons name="grid-outline" size={22} color="white" />
        </TouchableOpacity>
      </View>

      {sortedSections.map(section => renderSection(section))}

      {renderCustomizeModal()}

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: 4,
    resizeMode: 'contain' as const,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  customizeButton: {
    padding: 4,
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
  chartSection: {
    margin: 16,
    alignItems: 'center',
  },
  pieContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pieLegend: {
    flex: 1,
    gap: 8,
    marginLeft: 8,
  },
  pieLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pieLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pieLegendText: {
    fontSize: 15,
    color: theme.colors.text,
    flex: 1,
  },
  pieLegendAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  balanceBarsContainer: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  balanceBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceBarName: {
    width: 80,
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '500',
  },
  balanceBarTrack: {
    flex: 1,
    height: 20,
    backgroundColor: theme.colors.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  balanceBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  balanceBarValue: {
    width: 80,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  customizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  customizeLabel: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 12,
  },
  customizeArrows: {
    flexDirection: 'row',
    gap: 4,
  },
  arrowButton: {
    padding: 6,
  },
  arrowDisabled: {
    opacity: 0.3,
  },
  doneButton: {
    backgroundColor: theme.colors.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;