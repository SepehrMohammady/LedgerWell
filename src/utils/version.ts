import Constants from 'expo-constants';

/**
 * Get the current app version from Expo configuration
 * Supports multiple Expo SDK versions and fallback methods
 * @returns The current app version string or 'Unknown' if not available
 */
export const getAppVersion = (): string => {
  // Try multiple sources for version info (different Expo SDK versions)
  return (
    Constants.expoConfig?.version ||           // Expo SDK 46+
    Constants.manifest?.version ||             // Expo SDK < 46
    Constants.manifest2?.extra?.expoClient?.version || // Alternative fallback
    'Unknown'
  );
};

/**
 * Get the current build number/version code (primarily for Android)
 * @returns The build number as string or 'Unknown' if not available
 */
export const getBuildNumber = (): string => {
  return Constants.expoConfig?.android?.versionCode?.toString() || 
         Constants.expoConfig?.ios?.buildNumber?.toString() || 
         'Unknown';
};

/**
 * Get full version info including version and build number
 * @returns Object containing version and build information
 */
export const getVersionInfo = () => {
  return {
    version: getAppVersion(),
    buildNumber: getBuildNumber(),
    platform: Constants.platform?.ios ? 'iOS' : 'Android',
    displayVersion: `${getAppVersion()} (${getBuildNumber()})`,
  };
};

/**
 * Check if the app is running in development mode
 * @returns Boolean indicating if in development mode
 */
export const isDevelopment = (): boolean => {
  return __DEV__ || Constants.expoConfig?.extra?.environment === 'development';
};

export default {
  getAppVersion,
  getBuildNumber,
  getVersionInfo,
  isDevelopment,
};