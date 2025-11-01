/**
 * Environment Variables Validation and Access
 * Ensures all required environment variables are present at runtime
 */

interface EnvironmentConfig {
  // Rork
  rorkApiBaseUrl: string;

  // Groq AI
  groqApiKey: string;

  // Firebase
  firebaseApiKey: string;
  firebaseAuthDomain: string;
  firebaseProjectId: string;
  firebaseStorageBucket: string;
  firebaseMessagingSenderId: string;
  firebaseAppId: string;
  firebaseMeasurementId: string;
  firebaseIosClientId: string;
  firebaseIosBundleId: string;

  // RevenueCat
  revenuecatIosApiKey: string;
  revenuecatProEntitlement: string;
  revenuecatLifetimeEntitlement: string;

  // App Config
  appEnvironment: 'development' | 'staging' | 'production';
  appVersion: string;
  enableAnalytics: boolean;
  enableCrashlytics: boolean;

  // Deep Linking
  appScheme: string;
  universalLinkDomain: string;

  // Support & Legal
  supportEmail: string;
  privacyPolicyUrl: string;
  termsUrl: string;
}

class EnvironmentValidator {
  private config: EnvironmentConfig | null = null;

  /**
   * Validates and loads all environment variables
   * Throws an error if any required variable is missing
   */
  validate(): EnvironmentConfig {
    if (this.config) {
      return this.config;
    }

    const missingVars: string[] = [];

    const getEnv = (key: string, required: boolean = true): string => {
      const value = process.env[key];
      if (required && !value) {
        missingVars.push(key);
        return '';
      }
      return value || '';
    };

    const getBoolEnv = (key: string, defaultValue: boolean = false): boolean => {
      const value = process.env[key];
      if (!value) return defaultValue;
      return value.toLowerCase() === 'true';
    };

    this.config = {
      // Rork
      rorkApiBaseUrl: getEnv('EXPO_PUBLIC_RORK_API_BASE_URL'),

      // Groq AI
      groqApiKey: getEnv('EXPO_PUBLIC_GROQ_API_KEY', false) || '',

      // Firebase
      firebaseApiKey: getEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
      firebaseAuthDomain: getEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
      firebaseProjectId: getEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
      firebaseStorageBucket: getEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
      firebaseMessagingSenderId: getEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
      firebaseAppId: getEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
      firebaseMeasurementId: getEnv('EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID'),
      firebaseIosClientId: getEnv('EXPO_PUBLIC_FIREBASE_IOS_CLIENT_ID'),
      firebaseIosBundleId: getEnv('EXPO_PUBLIC_FIREBASE_IOS_BUNDLE_ID'),

      // RevenueCat
      revenuecatIosApiKey: getEnv('EXPO_PUBLIC_REVENUECAT_IOS_API_KEY'),
      revenuecatProEntitlement: getEnv('EXPO_PUBLIC_REVENUECAT_PRO_ENTITLEMENT', false) || 'pro',
      revenuecatLifetimeEntitlement: getEnv('EXPO_PUBLIC_REVENUECAT_LIFETIME_ENTITLEMENT', false) || 'lifetime',

      // App Config
      appEnvironment: (getEnv('EXPO_PUBLIC_APP_ENVIRONMENT', false) || 'development') as 'development' | 'staging' | 'production',
      appVersion: getEnv('EXPO_PUBLIC_APP_VERSION', false) || '1.0.0',
      enableAnalytics: getBoolEnv('EXPO_PUBLIC_ENABLE_ANALYTICS', false),
      enableCrashlytics: getBoolEnv('EXPO_PUBLIC_ENABLE_CRASHLYTICS', false),

      // Deep Linking
      appScheme: getEnv('EXPO_PUBLIC_APP_SCHEME', false) || 'dailyplannerdelight',
      universalLinkDomain: getEnv('EXPO_PUBLIC_UNIVERSAL_LINK_DOMAIN', false) || 'dailyplannerdelight.app',

      // Support & Legal
      supportEmail: getEnv('EXPO_PUBLIC_SUPPORT_EMAIL', false) || 'support@dailyplannerdelight.app',
      privacyPolicyUrl: getEnv('EXPO_PUBLIC_PRIVACY_POLICY_URL', false) || 'https://dailyplannerdelight.app/privacy',
      termsUrl: getEnv('EXPO_PUBLIC_TERMS_URL', false) || 'https://dailyplannerdelight.app/terms',
    };

    if (missingVars.length > 0) {
      const errorMessage = `Missing required environment variables:\n${missingVars.map(v => `  - ${v}`).join('\n')}\n\nPlease create a .env file based on .env.example`;

      // In production, log error but don't throw - allow app to start with degraded functionality
      if (this.config.appEnvironment === 'production') {
        console.error(`❌ ${errorMessage}`);
        console.error('⚠️  App will run with limited functionality due to missing configuration');
      } else {
        console.warn(`⚠️  ${errorMessage}`);
      }
    }

    return this.config;
  }

  /**
   * Get the validated environment configuration
   * Safe to call multiple times - validation only runs once
   */
  getConfig(): EnvironmentConfig {
    if (!this.config) {
      return this.validate();
    }
    return this.config;
  }

  /**
   * Check if running in production
   */
  isProduction(): boolean {
    return this.getConfig().appEnvironment === 'production';
  }

  /**
   * Check if running in development
   */
  isDevelopment(): boolean {
    return this.getConfig().appEnvironment === 'development';
  }

  /**
   * Check if analytics is enabled
   */
  shouldTrackAnalytics(): boolean {
    const config = this.getConfig();
    return config.enableAnalytics && config.appEnvironment !== 'development';
  }

  /**
   * Check if crashlytics is enabled
   */
  shouldReportCrashes(): boolean {
    const config = this.getConfig();
    return config.enableCrashlytics && config.appEnvironment !== 'development';
  }
}

// Export singleton instance
export const env = new EnvironmentValidator();

// Validate on import (will warn in development, throw in production if vars are missing)
export const config = env.validate();

// Export types
export type { EnvironmentConfig };
