import React, { useState, useEffect } from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { 
  handleLocalizedNumberInput, 
  getLocalizedDisplayValue, 
  usesLocalizedNumerals,
  parseLocalizedNumber 
} from '../utils/numberLocalization';

interface LocalizedNumberInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value: string;
  onChangeText: (text: string) => void;
  locale?: string;
}

/**
 * A TextInput component that handles localized number input
 * - Displays numbers in the appropriate numeral system (Arabic/Persian/Western)
 * - Converts localized input to Western numerals for processing
 * - Maintains consistent number formatting across different locales
 */
export const LocalizedNumberInput: React.FC<LocalizedNumberInputProps> = ({
  value,
  onChangeText,
  locale,
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState('');
  
  // Update display value when the internal value changes
  useEffect(() => {
    const localizedValue = getLocalizedDisplayValue(value, locale);
    setDisplayValue(localizedValue);
  }, [value, locale]);

  const handleTextChange = (input: string) => {
    // Handle the localized number input
    handleLocalizedNumberInput(input, onChangeText, locale);
  };

  return (
    <TextInput
      {...props}
      value={displayValue}
      onChangeText={handleTextChange}
      keyboardType="decimal-pad"
    />
  );
};

export default LocalizedNumberInput;