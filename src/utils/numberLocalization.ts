// Number localization utilities for different locales
import i18n from './i18n';

// Number mappings for different locales
const ARABIC_NUMERALS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const PERSIAN_NUMERALS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const WESTERN_NUMERALS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

// Languages that use non-Western numerals
const LOCALIZED_NUMERAL_LANGUAGES = {
  ar: ARABIC_NUMERALS,
  fa: PERSIAN_NUMERALS,
};

/**
 * Convert Western numerals to localized numerals based on current language
 * @param input - String containing numbers to convert
 * @param locale - Optional locale override, defaults to current language
 * @returns String with localized numerals
 */
export const toLocalizedNumerals = (input: string, locale?: string): string => {
  const currentLocale = locale || i18n.language;
  const numerals = LOCALIZED_NUMERAL_LANGUAGES[currentLocale as keyof typeof LOCALIZED_NUMERAL_LANGUAGES];
  
  if (!numerals) {
    return input; // Return as-is for languages that use Western numerals
  }
  
  return input.replace(/[0-9]/g, (digit) => numerals[parseInt(digit, 10)]);
};

/**
 * Convert localized numerals to Western numerals for processing
 * @param input - String containing localized numbers
 * @param locale - Optional locale override, defaults to current language
 * @returns String with Western numerals
 */
export const fromLocalizedNumerals = (input: string, locale?: string): string => {
  const currentLocale = locale || i18n.language;
  const numerals = LOCALIZED_NUMERAL_LANGUAGES[currentLocale as keyof typeof LOCALIZED_NUMERAL_LANGUAGES];
  
  if (!numerals) {
    return input; // Return as-is for languages that use Western numerals
  }
  
  let result = input;
  numerals.forEach((localizedDigit, index) => {
    const westernDigit = WESTERN_NUMERALS[index];
    result = result.replace(new RegExp(localizedDigit, 'g'), westernDigit);
  });
  
  return result;
};

/**
 * Format a number for display in the current locale
 * @param value - Number to format
 * @param locale - Optional locale override, defaults to current language
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string with localized numerals
 */
export const formatLocalizedNumber = (
  value: number, 
  locale?: string, 
  decimals: number = 2
): string => {
  const formattedNumber = value.toFixed(decimals);
  return toLocalizedNumerals(formattedNumber, locale);
};

/**
 * Parse a localized number string to a JavaScript number
 * @param input - Localized number string
 * @param locale - Optional locale override, defaults to current language
 * @returns Parsed number or NaN if invalid
 */
export const parseLocalizedNumber = (input: string, locale?: string): number => {
  const westernNumeral = fromLocalizedNumerals(input, locale);
  return parseFloat(westernNumeral);
};

/**
 * Check if current language uses localized numerals
 * @param locale - Optional locale override, defaults to current language
 * @returns Boolean indicating if locale uses non-Western numerals
 */
export const usesLocalizedNumerals = (locale?: string): boolean => {
  const currentLocale = locale || i18n.language;
  return currentLocale in LOCALIZED_NUMERAL_LANGUAGES;
};

/**
 * Custom TextInput handler for localized number input
 * @param input - Raw input from TextInput
 * @param setValue - Setter function for the state
 * @param locale - Optional locale override
 */
export const handleLocalizedNumberInput = (
  input: string,
  setValue: (value: string) => void,
  locale?: string
) => {
  // Convert localized numerals to Western for internal storage
  const westernInput = fromLocalizedNumerals(input, locale);
  
  // Allow empty string and valid decimal numbers
  if (westernInput === '' || /^[0-9]*\.?[0-9]*$/.test(westernInput)) {
    // Prevent multiple decimal points
    const decimalCount = (westernInput.match(/\./g) || []).length;
    if (decimalCount <= 1) {
      setValue(westernInput);
    }
  }
};

/**
 * Get display value for TextInput with localized numerals
 * @param value - Internal value (Western numerals)
 * @param locale - Optional locale override
 * @returns Display value with localized numerals
 */
export const getLocalizedDisplayValue = (value: string, locale?: string): string => {
  return toLocalizedNumerals(value, locale);
};