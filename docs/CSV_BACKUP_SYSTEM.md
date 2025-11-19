# CSV Backup System - Technical Documentation

## Overview

Version 0.8.0 introduces a new **language-independent CSV-based backup system** that replaces the previous Excel-based export/import functionality. This new system is more reliable, universal, and includes complete app state backup including settings and custom currencies.

## Key Improvements

### 1. **Language Independence**
- **Problem**: The old Excel system relied on translated column headers and sheet names, making backups only work in the language they were created in
- **Solution**: CSV backup uses fixed English keywords for structure (section headers like `[ACCOUNTS]`, `[TRANSACTIONS]`) while preserving user data in any language

### 2. **Complete State Backup**
The CSV backup now includes:
- All accounts with full details
- All transactions with complete metadata
- **App settings** (language, theme, default currency, auto-update preferences)
- **Custom currencies** (previously not backed up separately)
- Metadata (backup version, export date)

### 3. **CSV Format Benefits**
- **More universal**: CSV can be opened in any spreadsheet app, text editor, or programmatically
- **Easier to inspect**: Plain text format makes it easy to verify backup contents
- **Smaller file size**: CSV files are typically smaller than Excel files
- **Better compatibility**: Works across different platforms and tools
- **Version control friendly**: Plain text format can be diff'd and tracked in version control

## CSV Backup Structure

The backup file uses a section-based format:

```csv
[METADATA]
version,0.8.0
exportDate,2025-11-19T12:30:45.123Z

[SETTINGS]
language,en
theme,dark
defaultCurrency_id,usd
defaultCurrency_code,USD
defaultCurrency_name,US Dollar
defaultCurrency_symbol,$
defaultCurrency_rate,1
defaultCurrency_isCustom,false
autoUpdateRates,true

[CUSTOM_CURRENCIES]
id,code,name,symbol,rate,isCustom
irt,IRT,Iranian Toman,†,0.000024,true

[ACCOUNTS]
id,name,description,totalOwed,totalOwedToMe,currency_id,currency_code,currency_name,currency_symbol,currency_rate,currency_isCustom,createdAt,updatedAt
acc_123,Groceries,Monthly shopping,150.50,0,usd,USD,US Dollar,$,1,false,2025-01-15T10:00:00.000Z,2025-11-19T12:00:00.000Z

[TRANSACTIONS]
id,accountId,type,amount,currency_id,currency_code,currency_name,currency_symbol,currency_rate,currency_isCustom,name,description,date,createdAt,updatedAt
txn_456,acc_123,debt,50.00,usd,USD,US Dollar,$,1,false,John Doe,Lunch money,2025-11-15T14:30:00.000Z,2025-11-15T14:30:00.000Z,2025-11-15T14:30:00.000Z
```

## Features

### Export Backup
- Creates a comprehensive CSV backup with timestamp in filename
- Format: `LedgerWell_Backup_YYYY-MM-DDTHH-MM-SS.csv`
- Includes validation before export
- Shows statistics preview (accounts, transactions, custom currencies, date range)
- Automatically handles special characters in CSV (quotes, commas, newlines)

### Import Backup
- Two restore modes:
  1. **Replace All Data**: Clears existing data and restores backup completely (including settings)
  2. **Merge with Existing**: Adds non-duplicate data to existing accounts/transactions
- Comprehensive validation:
  - Checks for required fields
  - Validates data types and formats
  - Verifies currency codes
  - Ensures transaction types are valid
- Duplicate detection:
  - Accounts: Matched by name + currency code
  - Transactions: Matched by name, type, amount, and date (within 24 hours)
- Progress reporting during restore

### CSV Handling
- **Proper escaping**: Handles commas, quotes, and newlines in data
- **Unicode support**: Full UTF-8 encoding for international characters
- **Robust parsing**: Handles quoted fields and escaped quotes correctly
- **Error recovery**: Continues processing even if individual rows fail

## API Reference

### CSVBackupService Class

#### Main Methods

```typescript
// Export backup
static async exportBackup(
  accounts: Account[],
  transactions: Transaction[],
  settings: AppSettings,
  customCurrencies: Currency[]
): Promise<string | null>

// Import backup
static async importBackup(): Promise<BackupData | null>

// Get backup statistics
static getBackupStats(data: BackupData): BackupStats

// Validate backup data
static validateBackup(data: BackupData): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
```

#### Data Types

```typescript
interface BackupData {
  version: string;
  exportDate: string;
  accounts: Account[];
  transactions: Transaction[];
  settings: AppSettings;
  customCurrencies: Currency[];
}

interface BackupStats {
  totalAccounts: number;
  totalTransactions: number;
  totalCustomCurrencies: number;
  dateRange: { from: string; to: string } | null;
}
```

## Translation Keys

New translation keys added in v0.8.0:

- `exportBackup`: "Export Backup (CSV)"
- `importBackup`: "Import Backup (CSV)"
- `selectBackupFile`: "Please select a CSV backup file to restore data from"
- `customCurrencies`: "Custom Currencies"
- `dateRange`: "Date Range"
- `backupVersion`: "Backup Version"
- `restored`: "Restored"
- `added`: "Added"
- `restoreFailed`: "Failed to restore backup data"

All translations available in 13 languages: English, Arabic, German, Spanish, Persian, French, Indonesian, Italian, Japanese, Korean, Portuguese, Russian, Chinese.

## Migration from Excel

### For Users
- **No action required**: Backup system is automatically updated
- Old Excel exports will no longer work (incompatible format)
- Users should create new CSV backups after updating
- CSV backups can be created and restored in any language

### For Developers
- Excel export/import code preserved in `src/utils/excelExport.ts` and `src/utils/excelImport.ts` (can be removed if no longer needed)
- SettingsScreen updated to use new CSV backup methods
- All language files updated with new translation keys

## Usage Example

### Exporting a Backup

```typescript
import CSVBackupService from '../utils/csvBackup';

// Load all data
const accounts = await StorageService.getAccounts();
const transactions = await StorageService.getTransactions();
const settings = await StorageService.getSettings();
const customCurrencies = (await StorageService.getCurrencies())
  .filter(c => c.isCustom);

// Export backup
const fileUri = await CSVBackupService.exportBackup(
  accounts,
  transactions,
  settings,
  customCurrencies
);
```

### Importing a Backup

```typescript
// Import backup (shows file picker)
const backupData = await CSVBackupService.importBackup();

if (backupData) {
  // Validate
  const validation = CSVBackupService.validateBackup(backupData);
  
  if (validation.isValid) {
    // Restore data (replace mode)
    await StorageService.clearAllData();
    
    // Restore currencies
    await StorageService.saveCurrencies([
      ...defaultCurrencies,
      ...backupData.customCurrencies
    ]);
    
    // Restore settings
    await StorageService.saveSettings(backupData.settings);
    
    // Restore accounts and transactions
    for (const account of backupData.accounts) {
      await StorageService.saveAccount(account);
    }
    for (const transaction of backupData.transactions) {
      await StorageService.saveTransaction(transaction);
    }
  }
}
```

## Error Handling

The CSV backup system includes comprehensive error handling:

1. **Export Errors**:
   - No data to export
   - File system write failures
   - Sharing not available

2. **Import Errors**:
   - File not selected
   - Invalid CSV format
   - Missing required sections
   - Invalid data types
   - Corrupted data

3. **Validation Errors**:
   - Missing required fields
   - Invalid currency codes
   - Invalid transaction types
   - Negative amounts
   - Malformed dates

All errors are reported to the user with clear, translated messages.

## Testing

To test the CSV backup system:

1. **Create test data**:
   - Add accounts with different currencies
   - Add transactions with various types
   - Create custom currencies
   - Change settings (language, theme)

2. **Export backup**:
   - Verify CSV file is created
   - Open in text editor to inspect format
   - Check that all data is present

3. **Test restore - Replace mode**:
   - Create new test data
   - Restore backup with "Replace All Data"
   - Verify old data is completely replaced
   - Check settings and custom currencies restored

4. **Test restore - Merge mode**:
   - Keep some existing data
   - Restore backup with "Merge with Existing"
   - Verify duplicates are skipped
   - Verify new items are added

5. **Test validation**:
   - Manually corrupt CSV file
   - Attempt import
   - Verify appropriate error messages

## Performance

- **Export**: ~100-500ms for typical datasets (10-100 accounts, 100-1000 transactions)
- **Import**: ~500-2000ms depending on dataset size
- **File size**: Typically 10-50 KB for average usage
- **Memory**: Processes data in chunks, memory-efficient for large datasets

## Future Enhancements

Possible improvements for future versions:

1. **Compression**: Add optional gzip compression for large backups
2. **Encryption**: Add password protection option for sensitive data
3. **Incremental backups**: Support for backing up only changed data
4. **Cloud sync**: Optional backup to cloud storage services
5. **Automated backups**: Schedule regular automatic backups
6. **Backup history**: Keep multiple backup versions with rollback support
7. **Selective restore**: Choose which sections to restore (accounts only, transactions only, etc.)

## Version History

- **v0.8.0** (2025-11-19): Initial CSV backup system implementation
- **v0.7.0** (2025-11-19): Bug fixes for import system
- **v0.6.x** (2025-11-18): Excel-based import/export (deprecated)

---

**Last Updated**: November 19, 2025
**Author**: LedgerWell Development Team
