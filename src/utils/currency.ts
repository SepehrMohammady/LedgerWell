import axios from 'axios';
import { Currency, ConversionRate } from '../types';

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
    return `${currency.symbol}${amount.toFixed(2)}`;
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