import AsyncStorage from '@react-native-async-storage/async-storage';
import { Account, Transaction, Currency, AppSettings } from '../types';
import { DEFAULT_CURRENCIES } from './currency';

// Storage keys
const STORAGE_KEYS = {
  ACCOUNTS: 'accounts',
  TRANSACTIONS: 'transactions',
  CURRENCIES: 'currencies',
  SETTINGS: 'settings',
};

export class StorageService {
  // Account operations
  static async getAccounts(): Promise<Account[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get accounts:', error);
      return [];
    }
  }

  static async saveAccount(account: Account): Promise<void> {
    try {
      const accounts = await this.getAccounts();
      const existingIndex = accounts.findIndex(a => a.id === account.id);
      
      if (existingIndex >= 0) {
        accounts[existingIndex] = account;
      } else {
        accounts.push(account);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    } catch (error) {
      console.error('Failed to save account:', error);
      throw error;
    }
  }

  static async deleteAccount(accountId: string): Promise<void> {
    try {
      const accounts = await this.getAccounts();
      const filteredAccounts = accounts.filter(a => a.id !== accountId);
      await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(filteredAccounts));
      
      // Also delete associated transactions
      const transactions = await this.getTransactions();
      const filteredTransactions = transactions.filter(t => t.accountId !== accountId);
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filteredTransactions));
    } catch (error) {
      console.error('Failed to delete account:', error);
      throw error;
    }
  }

  // Transaction operations
  static async getTransactions(): Promise<Transaction[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      const transactions = data ? JSON.parse(data) : [];
      
      // Migration: Convert old transactions with only description to new format
      let needsSaving = false;
      const migratedTransactions = transactions.map((transaction: any) => {
        if (!transaction.name && transaction.description) {
          needsSaving = true;
          return {
            ...transaction,
            name: transaction.description,
            description: undefined,
          };
        }
        return transaction;
      });
      
      // Save migrated data if needed
      if (needsSaving) {
        await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(migratedTransactions));
        console.log('Migrated transactions to new name/description format');
      }
      
      return migratedTransactions;
    } catch (error) {
      console.error('Failed to get transactions:', error);
      return [];
    }
  }

  static async getTransactionsByAccount(accountId: string): Promise<Transaction[]> {
    const transactions = await this.getTransactions();
    return transactions.filter(t => t.accountId === accountId);
  }

  static async saveTransaction(transaction: Transaction): Promise<void> {
    try {
      const transactions = await this.getTransactions();
      const existingIndex = transactions.findIndex(t => t.id === transaction.id);
      
      if (existingIndex >= 0) {
        transactions[existingIndex] = transaction;
      } else {
        transactions.push(transaction);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      
      // Update account balance
      await this.updateAccountBalance(transaction.accountId);
    } catch (error) {
      console.error('Failed to save transaction:', error);
      throw error;
    }
  }

  static async deleteTransaction(transactionId: string): Promise<void> {
    try {
      const transactions = await this.getTransactions();
      const transaction = transactions.find(t => t.id === transactionId);
      
      if (!transaction) return;
      
      const filteredTransactions = transactions.filter(t => t.id !== transactionId);
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filteredTransactions));
      
      // Update account balance
      await this.updateAccountBalance(transaction.accountId);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      throw error;
    }
  }

  // Currency operations
  static async getCurrencies(): Promise<Currency[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CURRENCIES);
      const storedCurrencies = data ? JSON.parse(data) : [];
      
      // Always ensure all default currencies are available
      // Merge stored currencies with defaults, preserving custom currencies and updated rates
      const currencyMap = new Map<string, Currency>();
      
      // First, add all default currencies
      DEFAULT_CURRENCIES.forEach(currency => {
        currencyMap.set(currency.id, currency);
      });
      
      // Then, overlay any stored currencies (this preserves custom currencies and updated rates)
      storedCurrencies.forEach((currency: Currency) => {
        currencyMap.set(currency.id, currency);
      });
      
      const mergedCurrencies = Array.from(currencyMap.values());
      
      // If we had to merge, save the updated list
      if (storedCurrencies.length !== mergedCurrencies.length) {
        await this.saveCurrencies(mergedCurrencies);
      }
      
      return mergedCurrencies;
    } catch (error) {
      console.error('Failed to get currencies:', error);
      return DEFAULT_CURRENCIES;
    }
  }

  static async saveCurrencies(currencies: Currency[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENCIES, JSON.stringify(currencies));
    } catch (error) {
      console.error('Failed to save currencies:', error);
      throw error;
    }
  }

  // Settings operations
  static async getSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      const defaultSettings: AppSettings = {
        defaultCurrency: DEFAULT_CURRENCIES[0], // USD
        language: 'en',
        theme: 'light',
        autoUpdateRates: true,
      };
      
      return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
    } catch (error) {
      console.error('Failed to get settings:', error);
      return {
        defaultCurrency: DEFAULT_CURRENCIES[0],
        language: 'en',
        theme: 'light',
        autoUpdateRates: true,
      };
    }
  }

  static async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  // Helper method to update account balance
  private static async updateAccountBalance(accountId: string): Promise<void> {
    try {
      const accounts = await this.getAccounts();
      const account = accounts.find(a => a.id === accountId);
      
      if (!account) return;
      
      const transactions = await this.getTransactionsByAccount(accountId);
      
      let totalOwed = 0;
      let totalOwedToMe = 0;
      
      transactions.forEach(transaction => {
        if (transaction.type === 'debt') {
          totalOwed += transaction.amount;
        } else {
          totalOwedToMe += transaction.amount;
        }
      });
      
      const updatedAccount: Account = {
        ...account,
        totalOwed,
        totalOwedToMe,
        updatedAt: new Date(),
      };
      
      await this.saveAccount(updatedAccount);
    } catch (error) {
      console.error('Failed to update account balance:', error);
    }
  }

  // Clear all data (for testing/reset)
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw error;
    }
  }
}

export default StorageService;