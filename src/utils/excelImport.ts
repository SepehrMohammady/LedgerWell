import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { Account, Transaction, Currency } from '../types';
import { DEFAULT_CURRENCIES } from './currency';
import { parseLocalizedNumber, fromLocalizedNumerals } from './numberLocalization';
import i18n from './i18n';

export interface ImportData {
  accounts: Account[];
  transactions: Transaction[];
  summary: ImportSummary;
}

export interface ImportSummary {
  totalAccounts: number;
  totalTransactions: number;
  currencies: string[];
  dateRange: { from: string; to: string } | null;
  duplicateAccounts: number;
  duplicateTransactions: number;
}

export interface ImportOptions {
  replaceExistingData?: boolean;
  skipDuplicates?: boolean;
  validateCurrencies?: boolean;
}

/**
 * Excel Import Service for LedgerWell data
 * Parses Excel files exported by the app and restores data
 */
export class ExcelImportService {

  /**
   * Import data from Excel file
   * @param options - Import configuration options
   * @returns Promise resolving to import data or null if cancelled
   */
  static async importFromExcel(options: ImportOptions = {}): Promise<ImportData | null> {
    try {
      // Let user pick Excel file
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel'
        ],
        copyToCacheDirectory: true,
        multiple: false
      });

      if (result.canceled) {
        return null;
      }

      const fileUri = result.assets[0].uri;
      
      // Read the Excel file
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Parse Excel workbook
      const workbook = XLSX.read(fileContent, { type: 'base64' });
      
      // Extract data from workbook
      const importData = await this.parseWorkbook(workbook, options);
      
      return importData;
    } catch (error) {
      console.error('Excel import failed:', error);
      throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse Excel workbook and extract account/transaction data
   */
  private static async parseWorkbook(
    workbook: XLSX.WorkBook, 
    options: ImportOptions
  ): Promise<ImportData> {
    const accounts: Account[] = [];
    const transactions: Transaction[] = [];
    let duplicateAccounts = 0;
    let duplicateTransactions = 0;

    // Skip metadata and summary sheets, process account sheets
    const accountSheets = workbook.SheetNames.filter(
      name => name !== i18n.t('metadata') && name !== i18n.t('summary')
    );

    for (const sheetName of accountSheets) {
      try {
        const sheetData = this.parseAccountSheet(workbook.Sheets[sheetName], sheetName);
        if (sheetData) {
          accounts.push(sheetData.account);
          transactions.push(...sheetData.transactions);
        }
      } catch (error) {
        console.warn(`Failed to parse sheet "${sheetName}":`, error);
        // Continue with other sheets
      }
    }

    // Check for duplicates if not replacing data
    if (!options.replaceExistingData) {
      const existingAccounts = await this.getExistingAccounts();
      const existingTransactions = await this.getExistingTransactions();
      
      // Count duplicate accounts (by name and currency)
      duplicateAccounts = accounts.filter(newAccount => 
        existingAccounts.some(existing => 
          existing.name.toLowerCase() === newAccount.name.toLowerCase() &&
          existing.currency.code === newAccount.currency.code
        )
      ).length;

      // Count duplicate transactions (by account, name, amount, date, type)
      duplicateTransactions = transactions.filter(newTransaction => 
        existingTransactions.some(existing => 
          this.areTransactionsSimilar(existing, newTransaction)
        )
      ).length;
    }

    // Get currency information
    const currencies = [...new Set(accounts.map(a => a.currency.code))];
    
    // Calculate date range
    let dateRange: { from: string; to: string } | null = null;
    if (transactions.length > 0) {
      const dates = transactions
        .map(t => new Date(t.date))
        .sort((a, b) => a.getTime() - b.getTime());
      
      dateRange = {
        from: dates[0].toLocaleDateString(),
        to: dates[dates.length - 1].toLocaleDateString()
      };
    }

    const summary: ImportSummary = {
      totalAccounts: accounts.length,
      totalTransactions: transactions.length,
      currencies,
      dateRange,
      duplicateAccounts,
      duplicateTransactions
    };

    return {
      accounts,
      transactions,
      summary
    };
  }

  /**
   * Parse individual account sheet
   */
  private static parseAccountSheet(
    worksheet: XLSX.WorkSheet, 
    sheetName: string
  ): { account: Account; transactions: Transaction[] } | null {
    try {
      // Convert sheet to array of arrays
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (data.length < 8) {
        throw new Error('Invalid sheet format - insufficient data');
      }

      // Parse account information (first 8 rows contain account info)
      const accountName = this.findValueInRows(data, i18n.t('accountName')) || sheetName;
      const description = this.findValueInRows(data, i18n.t('description')) || '';
      const currencyText = this.findValueInRows(data, i18n.t('currency')) || '';
      const createdDateText = this.findValueInRows(data, i18n.t('createdDate')) || '';

      console.log(`Parsing account: ${accountName}, currency text: "${currencyText}"`);

      // Parse currency from text like "USD - US Dollar ($)"
      const currency = this.parseCurrencyFromText(currencyText);
      console.log(`Parsed currency:`, currency);
      
      // Create account object
      const account: Account = {
        id: this.generateId(),
        name: accountName,
        description: description || undefined,
        totalOwed: 0,
        totalOwedToMe: 0,
        currency,
        createdAt: new Date(createdDateText || Date.now()),
        updatedAt: new Date()
      };

      // Find transaction data start (look for headers)
      // We need to find a row with multiple transaction-related columns
      let transactionStartRow = -1;
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 4) continue;
        
        // Check if this row contains transaction headers
        // Must have Date, Type, Amount, and Name columns
        const rowStr = row.map((cell: any) => String(cell || '').toLowerCase()).join('|');
        const hasDate = row.some((cell: any) => String(cell).toLowerCase() === 'date' || cell === i18n.t('date'));
        const hasType = row.some((cell: any) => String(cell).toLowerCase() === 'type' || cell === i18n.t('type'));
        const hasAmount = row.some((cell: any) => String(cell).toLowerCase() === 'amount' || cell === i18n.t('amount'));
        const hasName = row.some((cell: any) => String(cell).toLowerCase() === 'name' || cell === i18n.t('name'));
        
        if (hasDate && hasType && hasAmount && hasName) {
          transactionStartRow = i;
          break;
        }
      }

      const transactions: Transaction[] = [];
      
      if (transactionStartRow >= 0 && transactionStartRow < data.length - 1) {
        // Parse transaction headers
        const headers = data[transactionStartRow];
        const dateCol = this.findColumnIndex(headers, [i18n.t('date'), 'Date']);
        const typeCol = this.findColumnIndex(headers, [i18n.t('type'), 'Type']);
        const amountCol = this.findColumnIndex(headers, [i18n.t('amount'), 'Amount']);
        const nameCol = this.findColumnIndex(headers, [i18n.t('name'), 'Name', 'Person']);
        const descCol = this.findColumnIndex(headers, [i18n.t('description'), 'Description']);

        console.log('Transaction headers found:', { dateCol, typeCol, amountCol, nameCol, descCol });
        console.log('Headers:', headers);

        // Parse transaction rows
        for (let i = transactionStartRow + 1; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0) continue;
          
          // Skip summary rows
          if (row.some((cell: any) => 
            String(cell).includes(i18n.t('finalBalance')) ||
            String(cell).includes('Final Balance')
          )) {
            break;
          }

          try {
            console.log(`Parsing row ${i}:`, row);
            const transaction = this.parseTransactionRow(
              row, 
              { dateCol, typeCol, amountCol, nameCol, descCol },
              account
            );
            
            if (transaction) {
              console.log('Transaction parsed successfully:', transaction);
              transactions.push(transaction);
            } else {
              console.warn(`Row ${i} returned null transaction`);
            }
          } catch (error) {
            console.error(`Failed to parse transaction row ${i}:`, error);
            // Continue with other rows
          }
        }
      }
      
      console.log(`Total transactions parsed for account "${account.name}": ${transactions.length}`);

      // Calculate account totals based on transactions
      let totalOwed = 0;
      let totalOwedToMe = 0;
      
      transactions.forEach(t => {
        if (t.type === 'debt') {
          totalOwed += t.amount;
        } else {
          totalOwedToMe += t.amount;
        }
      });

      account.totalOwed = totalOwed;
      account.totalOwedToMe = totalOwedToMe;

      return { account, transactions };
    } catch (error) {
      console.error(`Failed to parse account sheet "${sheetName}":`, error);
      return null;
    }
  }

  /**
   * Parse transaction row data
   */
  private static parseTransactionRow(
    row: any[],
    columns: { dateCol: number; typeCol: number; amountCol: number; nameCol: number; descCol: number },
    account: Account
  ): Transaction | null {
    try {
      const { dateCol, typeCol, amountCol, nameCol, descCol } = columns;

      // Extract values
      const dateValue = dateCol >= 0 ? row[dateCol] : null;
      const typeValue = typeCol >= 0 ? row[typeCol] : null;
      const amountValue = amountCol >= 0 ? row[amountCol] : null;
      const nameValue = nameCol >= 0 ? row[nameCol] : null;
      const descValue = descCol >= 0 ? row[descCol] : null;

      console.log('Extracted values:', { dateValue, typeValue, amountValue, nameValue, descValue });

      if (!dateValue || !typeValue || !amountValue || !nameValue) {
        console.warn('Missing required values:', { dateValue, typeValue, amountValue, nameValue });
        return null;
      }

      // Parse date
      let date: Date;
      if (dateValue instanceof Date) {
        date = dateValue;
      } else if (typeof dateValue === 'number') {
        // Excel serial date
        date = new Date((dateValue - 25569) * 86400 * 1000);
      } else {
        // String date - try different formats
        const dateStr = String(dateValue);
        
        // Try parsing as M/D/YYYY or D/M/YYYY
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          // Assume M/D/YYYY format (US format) since Excel typically exports in this format
          const month = parseInt(parts[0], 10);
          const day = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          date = new Date(year, month - 1, day);
        } else {
          // Fallback to standard parsing
          date = new Date(dateStr);
        }
      }

      if (isNaN(date.getTime())) {
        console.error(`Invalid date value: ${dateValue}, parsed as: ${date}`);
        throw new Error(`Invalid date: ${dateValue}`);
      }

      // Parse type
      const typeStr = String(typeValue).toLowerCase();
      let type: 'debt' | 'credit';
      
      console.log(`Parsing type: "${typeValue}" (lowercase: "${typeStr}")`);
      
      // Check against all possible translations
      // IMPORTANT: Check credit translations first because "Someone Owes Me" contains "owe"
      const creditTranslations = ['someone', 'owed', 'qualcuno', 'alguien', 'quelqu', 'crédito', 'кредит', 'quelqu\'un', 'credit'];
      const debtTranslations = ['i owe', 'debt', 'devo', 'deber', 'schuld', 'dette', 'débito', 'должен'];
      
      if (creditTranslations.some(term => typeStr.includes(term))) {
        type = 'credit';
        console.log(`Matched as CREDIT`);
      } else if (debtTranslations.some(term => typeStr.includes(term))) {
        type = 'debt';
        console.log(`Matched as DEBT`);
      } else {
        console.error(`No match found for type: "${typeValue}"`);
        throw new Error(`Invalid transaction type: ${typeValue}`);
      }

      // Parse amount (handle localized numbers)
      let amount: number;
      if (typeof amountValue === 'number') {
        amount = amountValue;
      } else {
        const amountStr = String(amountValue);
        // Try parsing localized number first
        amount = parseLocalizedNumber(amountStr);
        if (isNaN(amount)) {
          // Fallback to regular parsing
          amount = parseFloat(fromLocalizedNumerals(amountStr));
        }
      }

      if (isNaN(amount) || amount <= 0) {
        throw new Error(`Invalid amount: ${amountValue}`);
      }

      return {
        id: this.generateId(),
        accountId: account.id,
        type,
        amount,
        currency: account.currency,
        name: String(nameValue),
        description: descValue ? String(descValue) : undefined,
        date,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Failed to parse transaction row:', error);
      return null;
    }
  }

  /**
   * Find a value in the account information rows
   */
  private static findValueInRows(data: any[][], searchKey: string): string | null {
    for (let i = 0; i < Math.min(data.length, 10); i++) {
      const row = data[i];
      if (!row) continue;
      
      for (let j = 0; j < row.length - 1; j++) {
        if (row[j] && String(row[j]).includes(searchKey)) {
          return String(row[j + 1] || '').trim();
        }
      }
    }
    return null;
  }

  /**
   * Parse currency information from text
   */
  private static parseCurrencyFromText(currencyText: string): Currency {
    if (!currencyText) {
      return DEFAULT_CURRENCIES[0]; // Default to USD
    }

    // Extract currency code (looks for 3-letter code)
    const codeMatch = currencyText.match(/\b([A-Z]{3})\b/);
    const currencyCode = codeMatch ? codeMatch[1] : 'USD';

    // Find matching currency in defaults
    const foundCurrency = DEFAULT_CURRENCIES.find(c => c.code === currencyCode);
    if (foundCurrency) {
      return foundCurrency;
    }

    // Create custom currency if not found
    const symbolMatch = currencyText.match(/\(([^)]+)\)$/);
    const symbol = symbolMatch ? symbolMatch[1] : currencyCode;

    return {
      id: `imported_${currencyCode.toLowerCase()}`,
      code: currencyCode,
      name: currencyCode,
      symbol,
      rate: 1,
      isCustom: true
    };
  }

  /**
   * Find column index for header
   */
  private static findColumnIndex(headers: any[], searchTerms: string[]): number {
    for (let i = 0; i < headers.length; i++) {
      const header = String(headers[i] || '').toLowerCase().trim();
      if (searchTerms.some(term => header.includes(term.toLowerCase()))) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Generate unique ID
   */
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Get existing accounts from storage
   */
  private static async getExistingAccounts(): Promise<Account[]> {
    try {
      const { default: StorageService } = await import('./storage');
      return await StorageService.getAccounts();
    } catch (error) {
      console.warn('Failed to load existing accounts:', error);
      return [];
    }
  }

  /**
   * Get existing transactions from storage
   */
  private static async getExistingTransactions(): Promise<Transaction[]> {
    try {
      const { default: StorageService } = await import('./storage');
      return await StorageService.getTransactions();
    } catch (error) {
      console.warn('Failed to load existing transactions:', error);
      return [];
    }
  }

  /**
   * Check if two transactions are similar (potential duplicates)
   */
  private static areTransactionsSimilar(existing: Transaction, imported: Transaction): boolean {
    // Compare key fields to detect duplicates
    const existingDate = new Date(existing.date);
    const importedDate = new Date(imported.date);
    const dateDiff = Math.abs(existingDate.getTime() - importedDate.getTime());
    const isDateClose = dateDiff < 24 * 60 * 60 * 1000; // Within 1 day
    
    return (
      existing.name.toLowerCase().trim() === imported.name.toLowerCase().trim() &&
      existing.type === imported.type &&
      Math.abs(existing.amount - imported.amount) < 0.01 && // Allow small rounding differences
      isDateClose
    );
  }

  /**
   * Validate imported data
   */
  static validateImportData(data: ImportData): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate accounts
    if (data.accounts.length === 0) {
      errors.push(i18n.t('noAccountsToImport'));
    }

    data.accounts.forEach((account, index) => {
      if (!account.name?.trim()) {
        errors.push(i18n.t('invalidAccountName', { index: index + 1 }));
      }
      if (!account.currency?.code) {
        errors.push(i18n.t('invalidAccountCurrency', { index: index + 1 }));
      }
    });

    // Validate transactions
    data.transactions.forEach((transaction, index) => {
      if (!transaction.name?.trim()) {
        warnings.push(i18n.t('emptyTransactionName', { index: index + 1 }));
      }
      if (transaction.amount <= 0) {
        errors.push(i18n.t('invalidTransactionAmount', { index: index + 1 }));
      }
      if (!['debt', 'credit'].includes(transaction.type)) {
        errors.push(i18n.t('invalidTransactionType', { index: index + 1 }));
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get preview of import data for user confirmation
   */
  static getImportPreview(data: ImportData): {
    summary: string;
    accountsList: string[];
    currenciesList: string[];
    dateRange: string;
  } {
    const accountsList = data.accounts.map(a => 
      `${a.name} (${a.currency.symbol})`
    );

    const currenciesList = [...new Set(data.accounts.map(a => 
      `${a.currency.code} - ${a.currency.name}`
    ))];

    const dateRange = data.summary.dateRange 
      ? `${data.summary.dateRange.from} - ${data.summary.dateRange.to}`
      : i18n.t('noTransactionsInRange');

    const summary = i18n.t('importPreviewSummary', {
      accounts: data.summary.totalAccounts,
      transactions: data.summary.totalTransactions,
      currencies: data.summary.currencies.length
    });

    return {
      summary,
      accountsList,
      currenciesList,
      dateRange
    };
  }
}

export default ExcelImportService;