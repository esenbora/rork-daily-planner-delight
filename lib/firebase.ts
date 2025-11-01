/**
 * Firebase Configuration and Initialization
 *
 * This file initializes Firebase services for the app including:
 * - Authentication
 * - Firestore (Cloud Database)
 * - Analytics
 * - Crashlytics
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore } from 'firebase/firestore';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';
import { config, env } from '@/utils/env';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: config.firebaseApiKey,
  authDomain: config.firebaseAuthDomain,
  projectId: config.firebaseProjectId,
  storageBucket: config.firebaseStorageBucket,
  messagingSenderId: config.firebaseMessagingSenderId,
  appId: config.firebaseAppId,
  measurementId: config.firebaseMeasurementId,
};

// Initialize Firebase app (singleton pattern)
let firebaseApp: FirebaseApp | null = null;
let firestore: Firestore | null = null;
let auth: Auth | null = null;

try {
  if (getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }

  // Initialize Firestore with offline persistence
  firestore = initializeFirestore(firebaseApp, {
    experimentalForceLongPolling: true, // Required for some React Native environments
    cacheSizeBytes: 50 * 1024 * 1024, // 50MB cache
  });

  // Initialize Auth
  auth = getAuth(firebaseApp);
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  console.error('⚠️  App will run in offline mode without cloud sync');
}

// Initialize Analytics (only on web or if supported)
let analytics: Analytics | null = null;

if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported && config.enableAnalytics) {
      analytics = getAnalytics(firebaseApp);
    }
  });
}

/**
 * Log analytics event
 * Safe to call on all platforms - will only log if analytics is enabled and supported
 */
export const logAnalyticsEvent = (eventName: string, params?: Record<string, any>) => {
  if (analytics && config.enableAnalytics) {
    try {
      import('firebase/analytics').then(({ logEvent }) => {
        logEvent(analytics!, eventName, params);
      });
    } catch (error) {
      console.warn('Analytics event logging failed:', error);
    }
  }
};

/**
 * Log custom error to Crashlytics
 * In production, this will send to Firebase Crashlytics
 */
export const logError = (error: Error, context?: Record<string, any>) => {
  if (env.shouldReportCrashes()) {
    // TODO: Integrate with React Native Firebase Crashlytics
    console.error('Error logged:', error, context);
  } else {
    console.error('Error (dev):', error, context);
  }
};

/**
 * Set user ID for analytics and crashlytics
 */
export const setUserId = (userId: string) => {
  if (analytics && config.enableAnalytics) {
    try {
      import('firebase/analytics').then(({ setUserId: setAnalyticsUserId }) => {
        setAnalyticsUserId(analytics!, userId);
      });
    } catch (error) {
      console.warn('Failed to set user ID:', error);
    }
  }
};

/**
 * Set user properties for analytics
 */
export const setUserProperties = (properties: Record<string, string>) => {
  if (analytics && config.enableAnalytics) {
    try {
      import('firebase/analytics').then(({ setUserProperties: setAnalyticsUserProperties }) => {
        setAnalyticsUserProperties(analytics!, properties);
      });
    } catch (error) {
      console.warn('Failed to set user properties:', error);
    }
  }
};

// Export initialized services
export { firebaseApp, firestore, auth, analytics };

// Export types
export type { FirebaseApp, Firestore, Auth, Analytics };
