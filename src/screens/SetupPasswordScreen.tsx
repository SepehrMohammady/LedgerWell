import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../utils/theme';
import {
  setPassword,
  isBiometricAvailable,
  setBiometricEnabled,
} from '../utils/auth';

interface SetupPasswordScreenProps {
  onComplete: () => void;
}

export const SetupPasswordScreen: React.FC<SetupPasswordScreenProps> = ({
  onComplete,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [password, setPasswordValue] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [enableBiometric, setEnableBiometric] = useState(false);

  React.useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const available = await isBiometricAvailable();
    setBiometricAvailable(available);
    if (available) {
      setEnableBiometric(true);
    }
  };

  const validatePassword = (): boolean => {
    if (!password.trim()) {
      Alert.alert(t('error'), t('pleaseEnterPassword'));
      return false;
    }

    if (password.length < 4) {
      Alert.alert(t('error'), t('passwordTooShort'));
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('error'), t('passwordsDoNotMatch'));
      return false;
    }

    return true;
  };

  const handleSetup = async () => {
    if (!validatePassword()) {
      return;
    }

    setLoading(true);

    try {
      await setPassword(password);
      
      if (biometricAvailable) {
        await setBiometricEnabled(enableBiometric);
      }

      Alert.alert(
        t('success'),
        t('passwordSetSuccessfully'),
        [{ text: t('ok'), onPress: onComplete }]
      );
    } catch (error) {
      Alert.alert(t('error'), t('failedToSetPassword'));
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(theme);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={80} color={theme.colors.primary} />
          </View>

          <Text style={styles.title}>{t('setupPassword')}</Text>
          <Text style={styles.subtitle}>{t('setupPasswordDescription')}</Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed"
              size={20}
              color={theme.colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder={t('enterPassword')}
              placeholderTextColor={theme.colors.textSecondary}
              value={password}
              onChangeText={setPasswordValue}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={24}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed"
              size={20}
              color={theme.colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder={t('confirmPassword')}
              placeholderTextColor={theme.colors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off' : 'eye'}
                size={24}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.hintContainer}>
            <Ionicons
              name="information-circle"
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.hintText}>{t('passwordHint')}</Text>
          </View>

          {biometricAvailable && (
            <TouchableOpacity
              style={styles.biometricOption}
              onPress={() => setEnableBiometric(!enableBiometric)}
              disabled={loading}
            >
              <View style={styles.biometricLeft}>
                <Ionicons
                  name="finger-print"
                  size={24}
                  color={theme.colors.primary}
                />
                <Text style={styles.biometricText}>
                  {t('enableBiometricAuth')}
                </Text>
              </View>
              <View
                style={[
                  styles.checkbox,
                  enableBiometric && styles.checkboxChecked,
                ]}
              >
                {enableBiometric && (
                  <Ionicons name="checkmark" size={18} color="white" />
                )}
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.setupButton, loading && styles.buttonDisabled]}
            onPress={handleSetup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.setupButtonText}>{t('setupPassword')}</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={onComplete}
            disabled={loading}
          >
            <Text style={styles.skipButtonText}>{t('skipForNow')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
    },
    content: {
      width: '100%',
      maxWidth: 400,
      alignSelf: 'center',
    },
    iconContainer: {
      alignSelf: 'center',
      marginBottom: 32,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: 32,
      textAlign: 'center',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      height: 56,
      fontSize: 16,
      color: theme.colors.text,
    },
    eyeButton: {
      padding: 8,
    },
    hintContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      marginBottom: 24,
      gap: 8,
    },
    hintText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    biometricOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    biometricLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    biometricText: {
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: '500',
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    setupButton: {
      flexDirection: 'row',
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 16,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    setupButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: '600',
    },
    skipButton: {
      paddingVertical: 12,
      alignItems: 'center',
    },
    skipButtonText: {
      color: theme.colors.textSecondary,
      fontSize: 16,
    },
  });
