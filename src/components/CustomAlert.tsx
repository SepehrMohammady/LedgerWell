import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTheme } from '../utils/theme';

interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
}

interface AlertContextType {
  showAlert: (title: string, message: string, buttons?: AlertButton[]) => void;
}

const AlertContext = createContext<AlertContextType>({
  showAlert: () => {},
});

export const useAlert = () => useContext(AlertContext);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = useCallback((title: string, message: string, buttons?: AlertButton[]) => {
    setAlert({
      visible: true,
      title,
      message,
      buttons: buttons || [{ text: 'OK', style: 'default' }],
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert(prev => ({ ...prev, visible: false }));
  }, []);

  const handleButtonPress = useCallback((button: AlertButton) => {
    hideAlert();
    if (button.onPress) {
      // Delay onPress slightly to allow modal to close
      setTimeout(() => button.onPress!(), 100);
    }
  }, [hideAlert]);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <CustomAlertModal
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        buttons={alert.buttons}
        onButtonPress={handleButtonPress}
        onDismiss={hideAlert}
      />
    </AlertContext.Provider>
  );
};

interface CustomAlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
  onButtonPress: (button: AlertButton) => void;
  onDismiss: () => void;
}

const CustomAlertModal: React.FC<CustomAlertModalProps> = ({
  visible,
  title,
  message,
  buttons,
  onButtonPress,
  onDismiss,
}) => {
  const { theme } = useTheme();

  const getButtonTextColor = (style?: string) => {
    switch (style) {
      case 'destructive':
        return theme.colors.error;
      case 'cancel':
        return theme.colors.textSecondary;
      default:
        return theme.colors.primary;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>
          <View style={[
            styles.buttonRow,
            { borderTopColor: theme.colors.border },
            buttons.length > 2 && styles.buttonColumn,
          ]}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  buttons.length <= 2 && index > 0 && { borderLeftWidth: 1, borderLeftColor: theme.colors.border },
                  buttons.length > 2 && index > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.border },
                ]}
                onPress={() => onButtonPress(button)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.buttonText,
                    { color: getButtonTextColor(button.style) },
                    button.style === 'destructive' && styles.destructiveText,
                    button.style === 'cancel' && styles.cancelText,
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.8,
    maxWidth: 340,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  buttonColumn: {
    flexDirection: 'column',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  destructiveText: {
    fontWeight: '700',
  },
  cancelText: {
    fontWeight: '400',
  },
});
