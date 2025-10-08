import axios from 'axios';
import { Currency, ConversionRate } from '../types';
import { formatLocalizedNumber } from './numberLocalization';

// Predefined currencies
export const DEFAULT_CURRENCIES: Currency[] = [
  { id: 'usd', code: 'USD', name: 'US Dollar', symbol: '$', rate: 1, isCustom: false },
  { id: 'eur', code: 'EUR', name: 'Euro', symbol: '€', rate: 0.85, isCustom: false },
  { id: 'gbp', code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.73, isCustom: false },
  { id: 'jpy', code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 110, isCustom: false },
  { id: 'cad', code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rate: 1.25, isCustom: false },
  { id: 'aud', code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate: 1.35, isCustom: false },
  { id: 'chf', code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', rate: 0.92, isCustom: false },
  { id: 'cny', code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rate: 6.45, isCustom: false },
  { id: 'inr', code: 'INR', name: 'Indian Rupee', symbol: '₹', rate: 74.5, isCustom: false },
  { id: 'krw', code: 'KRW', name: 'South Korean Won', symbol: '₩', rate: 1180, isCustom: false },
  // Additional popular currencies
  { id: 'brl', code: 'BRL', name: 'Brazilian Real', symbol: 'R$', rate: 5.2, isCustom: false },
  { id: 'mxn', code: 'MXN', name: 'Mexican Peso', symbol: '$', rate: 20.1, isCustom: false },
  { id: 'rub', code: 'RUB', name: 'Russian Ruble', symbol: '₽', rate: 75.8, isCustom: false },
  { id: 'try', code: 'TRY', name: 'Turkish Lira', symbol: '₺', rate: 18.5, isCustom: false },
  { id: 'aed', code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', rate: 3.67, isCustom: false },
  { id: 'sar', code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', rate: 3.75, isCustom: false },
  { id: 'sgd', code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', rate: 1.36, isCustom: false },
  { id: 'hkd', code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', rate: 7.8, isCustom: false },
  { id: 'nzd', code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', rate: 1.42, isCustom: false },
  { id: 'sek', code: 'SEK', name: 'Swedish Krona', symbol: 'kr', rate: 8.9, isCustom: false },
  { id: 'nok', code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', rate: 8.7, isCustom: false },
  { id: 'dkk', code: 'DKK', name: 'Danish Krone', symbol: 'kr', rate: 6.3, isCustom: false },
  { id: 'pln', code: 'PLN', name: 'Polish Zloty', symbol: 'zł', rate: 3.9, isCustom: false },
  { id: 'czk', code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', rate: 21.8, isCustom: false },
  { id: 'huf', code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', rate: 315, isCustom: false },
  { id: 'ils', code: 'ILS', name: 'Israeli Shekel', symbol: '₪', rate: 3.25, isCustom: false },
  { id: 'zar', code: 'ZAR', name: 'South African Rand', symbol: 'R', rate: 14.8, isCustom: false },
  { id: 'thb', code: 'THB', name: 'Thai Baht', symbol: '฿', rate: 33.2, isCustom: false },
  { id: 'php', code: 'PHP', name: 'Philippine Peso', symbol: '₱', rate: 55.5, isCustom: false },
  { id: 'myr', code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', rate: 4.2, isCustom: false },
  { id: 'idr', code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', rate: 14300, isCustom: false },
  { id: 'vnd', code: 'VND', name: 'Vietnamese Dong', symbol: '₫', rate: 23500, isCustom: false },
  { id: 'egp', code: 'EGP', name: 'Egyptian Pound', symbol: 'ج.م', rate: 30.9, isCustom: false },
  { id: 'ngn', code: 'NGN', name: 'Nigerian Naira', symbol: '₦', rate: 410, isCustom: false },
  { id: 'kes', code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', rate: 110, isCustom: false },
  { id: 'cop', code: 'COP', name: 'Colombian Peso', symbol: '$', rate: 3900, isCustom: false },
  { id: 'ars', code: 'ARS', name: 'Argentine Peso', symbol: '$', rate: 350, isCustom: false },
  { id: 'clp', code: 'CLP', name: 'Chilean Peso', symbol: '$', rate: 790, isCustom: false },
  { id: 'pen', code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', rate: 3.65, isCustom: false },
];

// Exchange rate API service
export class CurrencyService {
  private static readonly API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';
  
  static async fetchExchangeRates(): Promise<{ [key: string]: number }> {
    try {
      const response = await axios.get(this.API_URL);
      return response.data.rates;
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      throw new Error('Unable to fetch current exchange rates');
    }
  }

  static async updateCurrencyRates(currencies: Currency[]): Promise<Currency[]> {
    try {
      const rates = await this.fetchExchangeRates();
      
      return currencies.map(currency => {
        if (!currency.isCustom && rates[currency.code]) {
          return {
            ...currency,
            rate: rates[currency.code],
          };
        }
        return currency;
      });
    } catch (error) {
      console.error('Failed to update currency rates:', error);
      return currencies; // Return original currencies if update fails
    }
  }

  static convertAmount(
    amount: number,
    fromCurrency: Currency,
    toCurrency: Currency
  ): number {
    if (fromCurrency.code === toCurrency.code) {
      return amount;
    }
    
    // Convert to USD first, then to target currency
    const usdAmount = amount / fromCurrency.rate;
    return usdAmount * toCurrency.rate;
  }

  static formatAmount(amount: number, currency: Currency): string {
    const formattedAmount = formatLocalizedNumber(amount, undefined, 2);
    return `${currency.symbol}${formattedAmount}`;
  }

  static createCustomCurrency(
    code: string,
    name: string,
    symbol: string,
    rate: number
  ): Currency {
    return {
      id: `custom_${code.toLowerCase()}`,
      code: code.toUpperCase(),
      name,
      symbol,
      rate,
      isCustom: true,
    };
  }

  static validateCurrencyCode(code: string): boolean {
    return /^[A-Z]{3}$/.test(code);
  }

  static validateExchangeRate(rate: number): boolean {
    return rate > 0 && isFinite(rate);
  }
}

export default CurrencyService;