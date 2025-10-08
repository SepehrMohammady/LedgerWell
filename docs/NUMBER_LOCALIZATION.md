# Localized Number Input Implementation

## Overview

The LedgerWell app now supports **localized number input and display** for Arabic and Farsi languages. This means:

- **Arabic**: Numbers are displayed and input using Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩)
- **Farsi**: Numbers are displayed and input using Persian numerals (۰۱۲۳۴۵۶۷۸۹)
- **Other languages**: Continue using Western Arabic numerals (0123456789)

## Features Implemented

### 1. Number Localization Utilities (`src/utils/numberLocalization.ts`)

- **`toLocalizedNumerals()`**: Converts Western numerals to localized ones
- **`fromLocalizedNumerals()`**: Converts localized numerals back to Western for processing
- **`formatLocalizedNumber()`**: Formats numbers with localized numerals
- **`parseLocalizedNumber()`**: Parses localized number strings to JavaScript numbers
- **`handleLocalizedNumberInput()`**: Handles TextInput with proper number conversion

### 2. Localized Number Input Component (`src/components/LocalizedNumberInput.tsx`)

A specialized TextInput component that:
- Automatically displays numbers in the appropriate numeral system
- Converts user input from localized numerals to Western numerals for processing
- Maintains proper keyboard type (`decimal-pad`)
- Handles validation and edge cases

### 3. Updated Currency Service (`src/utils/currency.ts`)

The `CurrencyService.formatAmount()` method now:
- Uses `formatLocalizedNumber()` to display amounts in the correct numeral system
- Maintains all existing functionality while supporting localization

### 4. Component Integration

Updated the following components to use localized number input:
- **`AddTransactionModal.tsx`**: Amount input field
- **`CustomCurrencyModal.tsx`**: Exchange rate input field

## How It Works

### Number Display
```typescript
// Input: 123.45 (internal storage)
// Arabic output: ١٢٣.٤٥
// Farsi output: ۱۲۳.۴۵
// English output: 123.45
```

### Number Input
```typescript
// User types: ١٢٣.٤٥ (Arabic)
// App stores: 123.45 (Western)
// Display shows: ١٢٣.٤٥ (Arabic)
```

### Currency Formatting
```typescript
// Amount: 1250.75
// Arabic: $١٢٥٠.٧٥
// Farsi: $۱۲۵۰.۷۵
// English: $1250.75
```

## Usage Examples

### Using LocalizedNumberInput Component

```tsx
import LocalizedNumberInput from './LocalizedNumberInput';

const MyComponent = () => {
  const [amount, setAmount] = useState('');
  
  return (
    <LocalizedNumberInput
      value={amount}
      onChangeText={setAmount}
      placeholder="Enter amount"
      style={styles.input}
    />
  );
};
```

### Using Number Localization Utilities

```tsx
import { 
  toLocalizedNumerals, 
  formatLocalizedNumber,
  parseLocalizedNumber 
} from '../utils/numberLocalization';

// Display a number in current locale
const displayValue = toLocalizedNumerals('123.45');

// Format currency amount
const formatted = formatLocalizedNumber(1250.75, undefined, 2);

// Parse user input
const userInput = '١٢٣.٤٥'; // Arabic input
const numericValue = parseLocalizedNumber(userInput); // Returns: 123.45
```

## Language Support

| Language | Code | Numeral System | Example |
|----------|------|----------------|---------|
| Arabic | ar | Arabic-Indic | ١٢٣.٤٥ |
| Farsi/Persian | fa | Persian | ۱۲۳.۴۵ |
| English | en | Western Arabic | 123.45 |
| German | de | Western Arabic | 123.45 |
| Spanish | es | Western Arabic | 123.45 |
| French | fr | Western Arabic | 123.45 |
| Italian | it | Western Arabic | 123.45 |
| Portuguese | pt | Western Arabic | 123.45 |
| Russian | ru | Western Arabic | 123.45 |
| Chinese | zh | Western Arabic | 123.45 |
| Japanese | ja | Western Arabic | 123.45 |
| Korean | ko | Western Arabic | 123.45 |
| Indonesian | id | Western Arabic | 123.45 |

## Technical Details

### Number Conversion Maps

```typescript
const ARABIC_NUMERALS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const PERSIAN_NUMERALS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const WESTERN_NUMERALS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
```

### Input Validation

The system validates input to ensure:
- Only numeric characters and decimal points are accepted
- Maximum one decimal point per number
- Empty string is allowed for clearing input
- Invalid characters are rejected

### Performance Considerations

- Number conversion is done in real-time as the user types
- Internal storage always uses Western numerals for consistent processing
- Display formatting is applied only when rendering to the user
- No performance impact on mathematical operations

## Testing

To test the localized number input:

1. **Change language to Arabic or Farsi** in Settings
2. **Add a new transaction** - the amount field should display Arabic/Persian numerals
3. **Create a custom currency** - the exchange rate field should use localized numerals
4. **Verify calculations** work correctly regardless of input numeral system

## Future Enhancements

Potential improvements could include:
- Support for additional numeral systems (Hindi, Thai, etc.)
- Localized decimal separators (comma vs period)
- Thousand separators based on locale
- Currency symbol positioning based on locale conventions

## Migration Notes

This implementation is **backward compatible**:
- Existing data remains unchanged (stored in Western numerals)
- No data migration required
- Users can switch languages without data loss
- All existing functionality preserved