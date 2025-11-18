import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../utils/theme';
import {
  verifyPassword,
  isBiometricEnabled,
  isBiometricAvailable,
  authenticateWithBiometric,
  getBiometricType,
} from '../utils/auth';

interface LockScreenProps {
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const available = await isBiometricAvailable();
    const enabled = await isBiometricEnabled();
    const types = await getBiometricType();
    
    setBiometricAvailable(available);
    setBiometricEnabled(enabled);
    setBiometricType(types);

    // Auto-trigger biometric if available and enabled
    if (available && enabled) {
      handleBiometricAuth();
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      Alert.alert(t('error'), t('pleaseEnterPassword'));
      return;
    }

    setLoading(true);
    const isValid = await verifyPassword(password);
    setLoading(false);

    if (isValid) {
      setPassword('');
      onUnlock();
    } else {
      Alert.alert(t('error'), t('incorrectPassword'));
      setPassword('');
    }
  };

  const handleBiometricAuth = async () => {
    setLoading(true);
    const result = await authenticateWithBiometric();
    setLoading(false);

    if (result.success) {
      onUnlock();
    } else if (result.error) {
      Alert.alert(t('error'), t('biometricAuthFailed'));
    }
  };

  const getBiometricIcon = () => {
    if (biometricType.includes('face')) {
      return 'scan';
    } else if (biometricType.includes('fingerprint')) {
      return 'finger-print';
    }
    return 'lock-closed';
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={80} color={theme.colors.primary} />
        </View>

        <Text style={styles.title}>{t('unlockApp')}</Text>
        <Text style={styles.subtitle}>{t('enterPasswordToAccess')}</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={t('password')}
            placeholderTextColor={theme.colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handlePasswordSubmit}
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

        <TouchableOpacity
          style={[styles.unlockButton, loading && styles.buttonDisabled]}
          onPress={handlePasswordSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="lock-open" size={20} color="white" />
              <Text style={styles.unlockButtonText}>{t('unlock')}</Text>
            </>
          )}
        </TouchableOpacity>

        {biometricAvailable && biometricEnabled && (
          <>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricAuth}
              disabled={loading}
            >
              <Ionicons
                name={getBiometricIcon()}
                size={32}
                color={theme.colors.primary}
              />
              <Text style={styles.biometricText}>
                {biometricType.includes('face')
                  ? t('useFaceID')
                  : t('useFingerprint')}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      width: '100%',
      maxWidth: 400,
      paddingHorizontal: 24,
      alignItems: 'center',
    },
    iconContainer: {
      marginBottom: 32,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: 32,
      textAlign: 'center',
    },
    inputContainer: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
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
    unlockButton: {
      width: '100%',
      flexDirection: 'row',
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    unlockButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: '600',
    },
    divider: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 24,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.border,
    },
    dividerText: {
      marginHorizontal: 16,
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
    biometricButton: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    biometricText: {
      marginTop: 8,
      fontSize: 16,
      color: theme.colors.primary,
      fontWeight: '600',
    },
  });
