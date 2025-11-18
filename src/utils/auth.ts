import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const PASSWORD_KEY = 'user_password_hash';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

/**
 * Hash a password using SHA-256
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
};

/**
 * Check if a password is set
 */
export const isPasswordSet = async (): Promise<boolean> => {
  const hash = await SecureStore.getItemAsync(PASSWORD_KEY);
  return hash !== null;
};

/**
 * Set up a new password
 */
export const setPassword = async (password: string): Promise<void> => {
  const hash = await hashPassword(password);
  await SecureStore.setItemAsync(PASSWORD_KEY, hash);
};

/**
 * Verify a password
 */
export const verifyPassword = async (password: string): Promise<boolean> => {
  const storedHash = await SecureStore.getItemAsync(PASSWORD_KEY);
  if (!storedHash) return false;
  
  const inputHash = await hashPassword(password);
  return inputHash === storedHash;
};

/**
 * Check if device supports biometric authentication
 */
export const isBiometricSupported = async (): Promise<boolean> => {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  return compatible;
};

/**
 * Check if biometric is enrolled (fingerprint/face registered)
 */
export const isBiometricEnrolled = async (): Promise<boolean> => {
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
};

/**
 * Check if biometric is available (supported and enrolled)
 */
export const isBiometricAvailable = async (): Promise<boolean> => {
  const supported = await isBiometricSupported();
  const enrolled = await isBiometricEnrolled();
  return supported && enrolled;
};

/**
 * Get the type of biometric authentication available
 */
export const getBiometricType = async (): Promise<string[]> => {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  const typeNames: string[] = [];
  
  types.forEach((type) => {
    if (type === LocalAuthentication.AuthenticationType.FINGERPRINT) {
      typeNames.push('fingerprint');
    } else if (type === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) {
      typeNames.push('face');
    } else if (type === LocalAuthentication.AuthenticationType.IRIS) {
      typeNames.push('iris');
    }
  });
  
  return typeNames;
};

/**
 * Check if biometric authentication is enabled by user
 */
export const isBiometricEnabled = async (): Promise<boolean> => {
  const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
  return enabled === 'true';
};

/**
 * Enable or disable biometric authentication
 */
export const setBiometricEnabled = async (enabled: boolean): Promise<void> => {
  await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled.toString());
};

/**
 * Authenticate using biometrics
 */
export const authenticateWithBiometric = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access LedgerWell',
      fallbackLabel: 'Use Password',
      disableDeviceFallback: false,
    });

    if (result.success) {
      return { success: true };
    } else {
      return {
        success: false,
        error: 'Authentication failed',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: 'Biometric authentication failed',
    };
  }
};

/**
 * Change password
 */
export const changePassword = async (
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  const isValid = await verifyPassword(oldPassword);
  
  if (!isValid) {
    return {
      success: false,
      error: 'Current password is incorrect',
    };
  }
  
  await setPassword(newPassword);
  return { success: true };
};

/**
 * Reset password (use with caution - requires confirmation)
 */
export const resetPassword = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(PASSWORD_KEY);
  await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
};
