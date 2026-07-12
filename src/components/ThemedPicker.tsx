import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Theme } from '../utils/theme';

export interface ThemedPickerOption {
  label: string;
  value: string;
}

interface ThemedPickerProps {
  selectedValue?: string;
  onValueChange: (value: string) => void;
  options: ThemedPickerOption[];
  /** Text shown on the field when no option is selected. */
  placeholder?: string;
  /** Title shown at the top of the selection sheet. */
  title?: string;
  enabled?: boolean;
}

/**
 * In-app themed replacement for the native @react-native-picker/picker.
 * Renders a bordered field that opens a themed modal list, so every selector
 * matches the app UI instead of showing an Android-native dropdown.
 */
const ThemedPicker: React.FC<ThemedPickerProps> = ({
  selectedValue,
  onValueChange,
  options,
  placeholder,
  title,
  enabled = true,
}) => {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const styles = createStyles(theme);

  const selectedOption = options.find(o => o.value === selectedValue);
  const displayText = selectedOption ? selectedOption.label : (placeholder || '');

  const handleSelect = (value: string) => {
    setOpen(false);
    if (value !== selectedValue) {
      onValueChange(value);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.field}
        activeOpacity={0.7}
        disabled={!enabled}
        onPress={() => setOpen(true)}
      >
        <Text
          style={[styles.fieldText, !selectedOption && styles.placeholderText]}
          numberOfLines={1}
        >
          {displayText}
        </Text>
        <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <TouchableOpacity style={styles.sheet} activeOpacity={1}>
            {title ? <Text style={styles.sheetTitle}>{title}</Text> : null}
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={true}
            >
              {options.map(option => {
                const isSelected = option.value === selectedValue;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    activeOpacity={0.7}
                    onPress={() => handleSelect(option.value)}
                  >
                    <Text
                      style={[styles.optionText, isSelected && styles.optionTextSelected]}
                      numberOfLines={1}
                    >
                      {option.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const { height } = Dimensions.get('window');

const createStyles = (theme: Theme) => StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 12,
    minHeight: 50,
  },
  fieldText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    marginRight: 8,
  },
  placeholderText: {
    color: theme.colors.textSecondary,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 400,
    maxHeight: height * 0.7,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    paddingVertical: 8,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingVertical: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  optionSelected: {
    backgroundColor: theme.colors.primary + '20',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    marginRight: 8,
  },
  optionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default ThemedPicker;
