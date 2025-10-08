// Test script to create sample data and export it for import testing
import StorageService from '../src/utils/storage';
import ExcelExportService from '../src/utils/excelExport';
import { Account, Transaction, Currency } from '../src/types';

const testCurrency: Currency = {
  id: 'usd',
  code: 'USD',
  name: 'US Dollar',
  symbol: '$',
  rate: 1,
  isCustom: false
};

const testAccount: Account = {
  id: 'test_account_1',
  name: 'Test Account',
  description: 'Sample account for import testing',
  totalOwed: 150,
  totalOwedToMe: 200,
  currency: testCurrency,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date()
};

const testTransactions: Transaction[] = [
  {
    id: 'test_transaction_1',
    accountId: 'test_account_1',
    type: 'debt',
    amount: 100,
    currency: testCurrency,
    name: 'John Doe',
    description: 'Lunch money',
    date: new Date('2024-01-15'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'test_transaction_2',
    accountId: 'test_account_1',
    type: 'debt',
    amount: 50,
    currency: testCurrency,
    name: 'Jane Smith',
    description: 'Coffee payment',
    date: new Date('2024-01-20'),
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: 'test_transaction_3',
    accountId: 'test_account_1',
    type: 'credit',
    amount: 200,
    currency: testCurrency,
    name: 'Mike Johnson',
    description: 'Payment for services',
    date: new Date('2024-01-25'),
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25')
  }
];

console.log('Test data ready for import testing:');
console.log('- 1 account:', testAccount.name);  
console.log('- 3 transactions:', testTransactions.length);
console.log('- Date range:', testTransactions[0].date.toLocaleDateString(), 'to', testTransactions[2].date.toLocaleDateString());
console.log('\nTo test import:');
console.log('1. Add this data to the app via UI');
console.log('2. Export to Excel using the export button');
console.log('3. Clear data using reset button');
console.log('4. Import the Excel file using import button');
console.log('5. Verify all data is restored correctly');