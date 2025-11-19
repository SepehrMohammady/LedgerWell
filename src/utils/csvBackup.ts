import { Paths, File } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { Account, Transaction, Currency, AppSettings } from '../types';
import { getAppVersion } from './version';

export interface BackupData {
  version: string;
  exportDate: string;
  accounts: Account[];
  transactions: Transaction[];
  settings: AppSettings;
  customCurrencies: Currency[];
}

export interface BackupStats {
  totalAccounts: number;
  totalTransactions: number;
  totalCustomCurrencies: number;
  dateRange: { from: string; to: string } | null;
}

/**
 * CSV Backup Service for LedgerWell
 * Language-independent backup/restore system using CSV format
 */
export class CSVBackupService {

  /**
   * Export all app data to CSV backup file
   */
  static async exportBackup(
    accounts: Account[],
    transactions: Transaction[],
    settings: AppSettings,
    customCurrencies: Currency[]
  ): Promise<string | null> {
    try {
      const backupData: BackupData = {
        version: await getAppVersion(),
        exportDate: new Date().toISOString(),
        accounts,
        transactions,
        settings,
        customCurrencies
      };

      // Create CSV content with multiple sections
      const csvContent = this.createCSVContent(backupData);

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const fileName = `LedgerWell_Backup_${timestamp}.csv`;
      
      console.log('[CSV Backup] Creating file:', fileName);
      
      // Create file in cache directory
      const file = new File(Paths.cache, fileName);
      
      try {
        // Create file (synchronous) - use overwrite option to avoid conflicts
        file.create({ overwrite: true });
        console.log('[CSV Backup] File created:', file.uri);
      } catch (createError) {
        console.error('[CSV Backup] Create failed:', createError);
        throw new Error(`Failed to create file: ${createError instanceof Error ? createError.message : 'Unknown error'}`);
      }

      try {
        // Write content (synchronous)
        file.write(csvContent, { encoding: 'utf8' });
        console.log('[CSV Backup] Content written, size:', csvContent.length, 'bytes');
      } catch (writeError) {
        console.error('[CSV Backup] Write failed:', writeError);
        throw new Error(`Failed to write content: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`);
      }

      // Share the file
      try {
        const isAvailable = await Sharing.isAvailableAsync();
        console.log('[CSV Backup] Sharing available:', isAvailable);
        
        if (isAvailable) {
          await Sharing.shareAsync(file.uri, {
            mimeType: 'text/csv',
            dialogTitle: 'Export Backup',
            UTI: 'public.comma-separated-values-text'
          });
          console.log('[CSV Backup] File shared successfully');
        } else {
          throw new Error('Sharing is not available on this device');
        }
      } catch (shareError) {
        console.error('[CSV Backup] Share failed:', shareError);
        throw new Error(`Failed to share file: ${shareError instanceof Error ? shareError.message : 'Unknown error'}`);
      }

      return file.uri;
    } catch (error) {
      console.error('[CSV Backup] Export failed:', error);
      if (error instanceof Error) {
        console.error('[CSV Backup] Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      throw error;
    }
  }

  /**
   * Import backup data from CSV file
   */
  static async importBackup(): Promise<BackupData | null> {
    try {
      // Let user pick CSV file
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv'],
        copyToCacheDirectory: true,
        multiple: false
      });

      if (result.canceled) {
        return null;
      }

      const fileUri = result.assets[0].uri;
      
      // Read the CSV file using File class
      const file = new File(fileUri);
      const fileContent = await file.text();

      // Parse CSV content
      const backupData = this.parseCSVContent(fileContent);
      
      return backupData;
    } catch (error) {
      console.error('CSV backup import failed:', error);
      throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Helper to safely convert date to ISO string
   */
  private static toISOString(date: Date | string | null | undefined): string {
    if (!date) {
      return new Date().toISOString(); // Fallback to current date if null/undefined
    }
    if (typeof date === 'string') {
      return date;
    }
    return date.toISOString();
  }

  /**
   * Create CSV content with all backup data
   */
  private static createCSVContent(data: BackupData): string {
    const lines: string[] = [];

    // Metadata section
    lines.push('[METADATA]');
    lines.push(`version,${this.escapeCSV(data.version)}`);
    lines.push(`exportDate,${this.escapeCSV(data.exportDate)}`);
    lines.push('');

    // Settings section
    lines.push('[SETTINGS]');
    lines.push(`language,${this.escapeCSV(data.settings.language)}`);
    lines.push(`theme,${this.escapeCSV(data.settings.theme)}`);
    lines.push(`defaultCurrency_id,${this.escapeCSV(data.settings.defaultCurrency.id)}`);
    lines.push(`defaultCurrency_code,${this.escapeCSV(data.settings.defaultCurrency.code)}`);
    lines.push(`defaultCurrency_name,${this.escapeCSV(data.settings.defaultCurrency.name)}`);
    lines.push(`defaultCurrency_symbol,${this.escapeCSV(data.settings.defaultCurrency.symbol)}`);
    lines.push(`defaultCurrency_rate,${data.settings.defaultCurrency.rate}`);
    lines.push(`defaultCurrency_isCustom,${data.settings.defaultCurrency.isCustom}`);
    lines.push(`autoUpdateRates,${data.settings.autoUpdateRates}`);
    lines.push('');

    // Custom Currencies section
    lines.push('[CUSTOM_CURRENCIES]');
    lines.push('id,code,name,symbol,rate,isCustom');
    for (const currency of data.customCurrencies) {
      lines.push([
        this.escapeCSV(currency.id),
        this.escapeCSV(currency.code),
        this.escapeCSV(currency.name),
        this.escapeCSV(currency.symbol),
        currency.rate,
        currency.isCustom
      ].join(','));
    }
    lines.push('');

    // Accounts section
    lines.push('[ACCOUNTS]');
    lines.push('id,name,description,totalOwed,totalOwedToMe,currency_id,currency_code,currency_name,currency_symbol,currency_rate,currency_isCustom,createdAt,updatedAt');
    for (const account of data.accounts) {
      lines.push([
        this.escapeCSV(account.id),
        this.escapeCSV(account.name),
        this.escapeCSV(account.description || ''),
        account.totalOwed,
        account.totalOwedToMe,
        this.escapeCSV(account.currency.id),
        this.escapeCSV(account.currency.code),
        this.escapeCSV(account.currency.name),
        this.escapeCSV(account.currency.symbol),
        account.currency.rate,
        account.currency.isCustom,
        this.toISOString(account.createdAt),
        this.toISOString(account.updatedAt)
      ].join(','));
    }
    lines.push('');

    // Transactions section
    lines.push('[TRANSACTIONS]');
    lines.push('id,accountId,type,amount,currency_id,currency_code,currency_name,currency_symbol,currency_rate,currency_isCustom,name,description,date,createdAt,updatedAt');
    for (const transaction of data.transactions) {
      lines.push([
        this.escapeCSV(transaction.id),
        this.escapeCSV(transaction.accountId),
        this.escapeCSV(transaction.type),
        transaction.amount,
        this.escapeCSV(transaction.currency.id),
        this.escapeCSV(transaction.currency.code),
        this.escapeCSV(transaction.currency.name),
        this.escapeCSV(transaction.currency.symbol),
        transaction.currency.rate,
        transaction.currency.isCustom,
        this.escapeCSV(transaction.name),
        this.escapeCSV(transaction.description || ''),
        this.toISOString(transaction.date),
        this.toISOString(transaction.createdAt),
        this.toISOString(transaction.updatedAt)
      ].join(','));
    }

    return lines.join('\n');
  }

  /**
   * Parse CSV content and extract backup data
   */
  private static parseCSVContent(content: string): BackupData {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    let currentSection = '';
    const sections: { [key: string]: string[] } = {
      METADATA: [],
      SETTINGS: [],
      CUSTOM_CURRENCIES: [],
      ACCOUNTS: [],
      TRANSACTIONS: []
    };

    // Separate content into sections
    for (const line of lines) {
      if (line.startsWith('[') && line.endsWith(']')) {
        currentSection = line.slice(1, -1);
      } else if (currentSection && sections[currentSection]) {
        sections[currentSection].push(line);
      }
    }

    // Parse metadata
    const metadataMap = this.parseKeyValueSection(sections.METADATA);
    const version = metadataMap.version || '0.0.0';
    const exportDate = metadataMap.exportDate || new Date().toISOString();

    // Parse settings
    const settingsMap = this.parseKeyValueSection(sections.SETTINGS);
    const settings: AppSettings = {
      language: settingsMap.language || 'en',
      theme: (settingsMap.theme as 'light' | 'dark') || 'light',
      defaultCurrency: {
        id: settingsMap.defaultCurrency_id || 'usd',
        code: settingsMap.defaultCurrency_code || 'USD',
        name: settingsMap.defaultCurrency_name || 'US Dollar',
        symbol: settingsMap.defaultCurrency_symbol || '$',
        rate: parseFloat(settingsMap.defaultCurrency_rate || '1'),
        isCustom: settingsMap.defaultCurrency_isCustom === 'true'
      },
      autoUpdateRates: settingsMap.autoUpdateRates === 'true'
    };

    // Parse custom currencies
    const customCurrencies = this.parseTableSection(
      sections.CUSTOM_CURRENCIES,
      (row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        symbol: row.symbol,
        rate: parseFloat(row.rate),
        isCustom: row.isCustom === 'true'
      })
    );

    // Parse accounts
    const accounts = this.parseTableSection(
      sections.ACCOUNTS,
      (row) => ({
        id: row.id,
        name: row.name,
        description: row.description || undefined,
        totalOwed: parseFloat(row.totalOwed),
        totalOwedToMe: parseFloat(row.totalOwedToMe),
        currency: {
          id: row.currency_id,
          code: row.currency_code,
          name: row.currency_name,
          symbol: row.currency_symbol,
          rate: parseFloat(row.currency_rate),
          isCustom: row.currency_isCustom === 'true'
        },
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      })
    );

    // Parse transactions
    const transactions = this.parseTableSection(
      sections.TRANSACTIONS,
      (row) => {
        const type = row.type?.trim().toLowerCase();
        return {
          id: row.id,
          accountId: row.accountId,
          type: (type === 'debt' || type === 'credit' ? type : 'debt') as 'debt' | 'credit',
          amount: parseFloat(row.amount),
          currency: {
            id: row.currency_id,
            code: row.currency_code,
            name: row.currency_name,
            symbol: row.currency_symbol,
            rate: parseFloat(row.currency_rate),
            isCustom: row.currency_isCustom === 'true'
          },
          name: row.name,
          description: row.description || undefined,
          date: new Date(row.date),
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt)
        };
      }
    );

    return {
      version,
      exportDate,
      accounts,
      transactions,
      settings,
      customCurrencies
    };
  }

  /**
   * Parse key-value section (METADATA, SETTINGS)
   */
  private static parseKeyValueSection(lines: string[]): { [key: string]: string } {
    const result: { [key: string]: string } = {};
    for (const line of lines) {
      const commaIndex = line.indexOf(',');
      if (commaIndex > 0) {
        const key = line.slice(0, commaIndex).trim();
        const value = this.unescapeCSV(line.slice(commaIndex + 1));
        result[key] = value;
      }
    }
    return result;
  }

  /**
   * Parse table section (ACCOUNTS, TRANSACTIONS, CUSTOM_CURRENCIES)
   */
  private static parseTableSection<T>(
    lines: string[],
    mapper: (row: any) => T
  ): T[] {
    if (lines.length === 0) return [];

    const headers = this.parseCSVLine(lines[0]);
    const results: T[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const row: any = {};
      
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[j] || '';
      }
      
      try {
        results.push(mapper(row));
      } catch (error) {
        console.warn(`Failed to parse row ${i}:`, error);
      }
    }

    return results;
  }

  /**
   * Parse a single CSV line (handles quoted values with commas)
   */
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(this.unescapeCSV(current));
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(this.unescapeCSV(current));
    return result;
  }

  /**
   * Escape value for CSV (wrap in quotes if contains comma, quote, or newline)
   */
  private static escapeCSV(value: string): string {
    if (!value) return '';
    
    const needsQuotes = value.includes(',') || value.includes('"') || value.includes('\n');
    
    if (needsQuotes) {
      // Escape quotes by doubling them
      const escaped = value.replace(/"/g, '""');
      return `"${escaped}"`;
    }
    
    return value;
  }

  /**
   * Unescape CSV value (remove quotes and unescape doubled quotes)
   */
  private static unescapeCSV(value: string): string {
    if (!value) return '';
    
    let result = value.trim();
    
    // Remove surrounding quotes if present
    if (result.startsWith('"') && result.endsWith('"')) {
      result = result.slice(1, -1);
      // Unescape doubled quotes
      result = result.replace(/""/g, '"');
    }
    
    return result;
  }

  /**
   * Get backup statistics
   */
  static getBackupStats(data: BackupData): BackupStats {
    let dateRange: { from: string; to: string } | null = null;
    
    if (data.transactions.length > 0) {
      const dates = data.transactions
        .map(t => new Date(t.date))
        .sort((a, b) => a.getTime() - b.getTime());
      
      dateRange = {
        from: dates[0].toLocaleDateString(),
        to: dates[dates.length - 1].toLocaleDateString()
      };
    }

    return {
      totalAccounts: data.accounts.length,
      totalTransactions: data.transactions.length,
      totalCustomCurrencies: data.customCurrencies.length,
      dateRange
    };
  }

  /**
   * Validate backup data
   */
  static validateBackup(data: BackupData): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate version
    if (!data.version) {
      warnings.push('Backup version information missing');
    }

    // Validate accounts
    if (data.accounts.length === 0) {
      warnings.push('No accounts found in backup');
    }

    data.accounts.forEach((account, index) => {
      if (!account.id || !account.name) {
        errors.push(`Invalid account at position ${index + 1}`);
      }
      if (!account.currency || !account.currency.code) {
        errors.push(`Account "${account.name}" has invalid currency`);
      }
    });

    // Validate transactions
    data.transactions.forEach((transaction, index) => {
      if (!transaction.id || !transaction.accountId) {
        errors.push(`Invalid transaction at position ${index + 1}`);
      }
      if (!['debt', 'credit'].includes(transaction.type)) {
        console.error(`[CSV Backup] Transaction ${index + 1} validation failed:`, {
          type: transaction.type,
          typeOf: typeof transaction.type,
          name: transaction.name
        });
        errors.push(`Transaction ${index + 1} has invalid type: "${transaction.type}"`);
      }
      if (transaction.amount <= 0 || isNaN(transaction.amount)) {
        errors.push(`Transaction ${index + 1} has invalid amount: ${transaction.amount}`);
      }
    });

    // Validate settings
    if (!data.settings.language) {
      warnings.push('Settings missing language preference');
    }
    if (!data.settings.defaultCurrency) {
      errors.push('Settings missing default currency');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export default CSVBackupService;
