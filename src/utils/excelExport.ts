import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Account, Transaction } from '../types';
import CurrencyService from './currency';
import { formatLocalizedNumber } from './numberLocalization';
import { getAppVersion } from './version';
import i18n from './i18n';

export interface ExportData {
  accounts: Account[];
  transactions: Transaction[];
}

export interface ExportOptions {
  includeLocalizedNumbers?: boolean;
  dateFormat?: 'iso' | 'localized';
  includeMetadata?: boolean;
}

/**
 * Excel Export Service for LedgerWell data
 * Creates an Excel workbook with separate sheets for each account
 */
export class ExcelExportService {
  
  /**
   * Export all app data to Excel file
   * @param data - Accounts and transactions data
   * @param options - Export formatting options
   * @returns Promise resolving to file URI or null if cancelled
   */
  static async exportToExcel(
    data: ExportData, 
    options: ExportOptions = {}
  ): Promise<string | null> {
    try {
      const {
        includeLocalizedNumbers = true,
        dateFormat = 'localized',
        includeMetadata = true
      } = options;

      // Create new workbook
      const workbook = XLSX.utils.book_new();

      // Add metadata sheet if requested
      if (includeMetadata) {
        this.addMetadataSheet(workbook);
      }

      // Add summary sheet
      this.addSummarySheet(workbook, data);

      // Add account sheets
      for (const account of data.accounts) {
        const accountTransactions = data.transactions.filter(
          t => t.accountId === account.id
        );
        this.addAccountSheet(
          workbook, 
          account, 
          accountTransactions, 
          { includeLocalizedNumbers, dateFormat }
        );
      }

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { 
        type: 'base64', 
        bookType: 'xlsx' 
      });

      // Save to device
      const fileName = this.generateFileName();
      const documentsDir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory || '';
      const fileUri = documentsDir + fileName;
      
      await (FileSystem as any).writeAsStringAsync(fileUri, excelBuffer, {
        encoding: 'base64',
      });

      // Share the file
      if (await (Sharing as any).isAvailableAsync()) {
        await (Sharing as any).shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: i18n.t('exportData'),
          UTI: 'com.microsoft.excel.xlsx'
        });
      }

      return fileUri;
    } catch (error) {
      console.error('Excel export failed:', error);
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add metadata sheet with app and export information
   */
  private static addMetadataSheet(workbook: XLSX.WorkBook): void {
    const metadata = [
      [i18n.t('exportMetadata'), ''],
      ['', ''],
      [i18n.t('appName'), 'LedgerWell'],
      [i18n.t('exportDate'), new Date().toLocaleString()],
      [i18n.t('language'), i18n.language],
      [i18n.t('version'), getAppVersion()],
      ['', ''],
      [i18n.t('exportDescription'), ''],
      [i18n.t('exportContent'), i18n.t('exportContentDescription')],
      [i18n.t('dataPrivacy'), i18n.t('dataPrivacyNote')],
      ['', ''],
      [i18n.t('sheetStructure'), ''],
      ['• ' + i18n.t('summarySheet'), i18n.t('summarySheetDescription')],
      ['• ' + i18n.t('accountSheets'), i18n.t('accountSheetsDescription')],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(metadata);
    
    // Style the metadata sheet
    worksheet['!cols'] = [
      { width: 25 },
      { width: 50 }
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, i18n.t('metadata'));
  }

  /**
   * Add summary sheet with overall account information
   */
  private static addSummarySheet(workbook: XLSX.WorkBook, data: ExportData): void {
    const headers = [
      i18n.t('accountName'),
      i18n.t('type'),
      i18n.t('currency'),
      i18n.t('totalTransactions'),
      i18n.t('totalAmount'),
      i18n.t('lastTransaction'),
      i18n.t('createdDate')
    ];

    const summaryData = data.accounts.map(account => {
      const accountTransactions = data.transactions.filter(t => t.accountId === account.id);
      const totalAmount = accountTransactions.reduce((sum, t) => {
        return sum + (t.type === 'credit' ? t.amount : -t.amount);
      }, 0);
      
      const lastTransaction = accountTransactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      return [
        account.name,
        totalAmount >= 0 ? i18n.t('credit') : i18n.t('debt'),
        `${account.currency.code} (${account.currency.symbol})`,
        accountTransactions.length,
        CurrencyService.formatAmount(Math.abs(totalAmount), account.currency),
        lastTransaction ? new Date(lastTransaction.date).toLocaleDateString() : i18n.t('noTransactions'),
        new Date(account.createdAt).toLocaleDateString()
      ];
    });

    const worksheetData = [headers, ...summaryData];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Auto-fit columns
    worksheet['!cols'] = [
      { width: 20 }, // Account Name
      { width: 10 }, // Type
      { width: 15 }, // Currency
      { width: 15 }, // Total Transactions
      { width: 15 }, // Total Amount
      { width: 15 }, // Last Transaction
      { width: 15 }, // Created Date
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, i18n.t('summary'));
  }

  /**
   * Add individual account sheet with its transactions
   */
  private static addAccountSheet(
    workbook: XLSX.WorkBook,
    account: Account,
    transactions: Transaction[],
    options: { includeLocalizedNumbers: boolean; dateFormat: string }
  ): void {
    // Account information header
    const accountInfo = [
      [i18n.t('accountInformation'), ''],
      ['', ''],
      [i18n.t('accountName'), account.name],
      [i18n.t('description'), account.description || i18n.t('noDescription')],
      [i18n.t('currency'), `${account.currency.code} - ${account.currency.name} (${account.currency.symbol})`],
      [i18n.t('createdDate'), new Date(account.createdAt).toLocaleDateString()],
      ['', ''],
    ];

    // Transaction headers
    const transactionHeaders = [
      i18n.t('date'),
      i18n.t('type'),
      i18n.t('amount'),
      i18n.t('name'),
      i18n.t('description'),
      i18n.t('runningBalance')
    ];

    // Transaction data
    let runningBalance = 0;
    const transactionData = transactions
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(transaction => {
        // Calculate running balance
        const transactionAmount = transaction.type === 'credit' ? transaction.amount : -transaction.amount;
        runningBalance += transactionAmount;

        return [
          options.dateFormat === 'iso' 
            ? transaction.date 
            : new Date(transaction.date).toLocaleDateString(),
          i18n.t(transaction.type),
          options.includeLocalizedNumbers 
            ? formatLocalizedNumber(transaction.amount)
            : transaction.amount.toFixed(2),
          transaction.name,
          transaction.description || i18n.t('noDescription'),
          options.includeLocalizedNumbers
            ? formatLocalizedNumber(Math.abs(runningBalance))
            : Math.abs(runningBalance).toFixed(2)
        ];
      });

    // Summary row
    const summaryRow = [
      '', '', '', '', 
      i18n.t('finalBalance') + ':',
      options.includeLocalizedNumbers
        ? formatLocalizedNumber(Math.abs(runningBalance))
        : Math.abs(runningBalance).toFixed(2)
    ];

    // Combine all data
    const worksheetData = [
      ...accountInfo,
      transactionHeaders,
      ...transactionData,
      [''], // Empty row
      summaryRow
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Style the worksheet
    worksheet['!cols'] = [
      { width: 12 }, // Date
      { width: 8 },  // Type
      { width: 12 }, // Amount
      { width: 20 }, // Person Name
      { width: 30 }, // Description
      { width: 15 }, // Running Balance
    ];

    // Freeze the header row
    worksheet['!freeze'] = { xSplit: 0, ySplit: accountInfo.length + 1 };

    // Clean account name for sheet name (Excel has restrictions)
    const sheetName = this.sanitizeSheetName(account.name);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  /**
   * Generate filename with timestamp
   */
  private static generateFileName(): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS format
    return `LedgerWell_Export_${dateStr}_${timeStr}.xlsx`;
  }

  /**
   * Sanitize sheet name to comply with Excel naming restrictions
   */
  private static sanitizeSheetName(name: string): string {
    // Excel sheet names cannot contain: / \ ? * [ ] : and cannot be longer than 31 characters
    const sanitized = name
      .replace(/[\/\\?*\[\]:]/g, '_')
      .substring(0, 31);
    
    // Cannot be empty
    return sanitized || 'Sheet';
  }

  /**
   * Get export statistics
   */
  static getExportStats(data: ExportData): {
    totalAccounts: number;
    totalTransactions: number;
    dateRange: { from: string; to: string } | null;
    currencies: string[];
  } {
    const stats = {
      totalAccounts: data.accounts.length,
      totalTransactions: data.transactions.length,
      dateRange: null as { from: string; to: string } | null,
      currencies: Array.from(new Set(data.accounts.map(a => a.currency.code)))
    };

    if (data.transactions.length > 0) {
      const dates = data.transactions
        .map(t => new Date(t.date))
        .sort((a, b) => a.getTime() - b.getTime());
      
      stats.dateRange = {
        from: dates[0].toLocaleDateString(),
        to: dates[dates.length - 1].toLocaleDateString()
      };
    }

    return stats;
  }
}

export default ExcelExportService;