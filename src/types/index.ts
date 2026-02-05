export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  rate: number; // Rate relative to USD
  isCustom: boolean;
}

export interface Contact {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  id: string;
  name: string;
  description?: string;
  totalOwed: number; // Money I owe to this account
  totalOwedToMe: number; // Money this account owes to me
  currency: Currency;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  accountId: string;
  contactId?: string; // Reference to contact (new field)
  type: 'debt' | 'credit'; // debt = I owe money, credit = someone owes me
  amount: number;
  currency: Currency;
  name: string; // Person/Company name who owes or is owed (kept for backward compatibility)
  description?: string; // Additional details/notes (optional)
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversionRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: Date;
  isManual: boolean;
}

export interface AppSettings {
  defaultCurrency: Currency;
  language: string;
  theme: 'light' | 'dark';
  autoUpdateRates: boolean;
}

export type RootTabParamList = {
  Home: undefined;
  Accounts: undefined;
  Transactions: undefined;
  Settings: undefined;
};

export type AccountStackParamList = {
  AccountsList: undefined;
  AccountDetails: { accountId: string };
  AddAccount: undefined;
  EditAccount: { accountId: string };
};

export type TransactionStackParamList = {
  TransactionsList: undefined;
  AddTransaction: { accountId?: string };
  TransactionDetails: { transactionId: string };
};