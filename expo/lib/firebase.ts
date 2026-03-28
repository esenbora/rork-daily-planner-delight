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

// Validate Firebase config before attempting initialization
const hasRequiredFirebaseConfig = () => {
  const required = [
    config.firebaseApiKey,
    config.firebaseProjectId,
    config.firebaseAppId,
  ];
  return required.every(val => val && val.length > 0);
};

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: config.firebaseApiKey || '',
  authDomain: config.firebaseAuthDomain || '',
  projectId: config.firebaseProjectId || '',
  storageBucket: config.firebaseStorageBucket || '',
  messagingSenderId: config.firebaseMessagingSenderId || '',
  appId: config.firebaseAppId || '',
  measurementId: config.firebaseMeasurementId || '',
};

// Initialize Firebase app (singleton pattern)
let firebaseApp: FirebaseApp | null = null;
let firestore: Firestore | null = null;
let auth: Auth | null = null;
let firebaseInitialized = false;

// Only attempt Firebase initialization if we have required config
if (hasRequiredFirebaseConfig()) {
  try {
    console.log('🔥 Attempting Firebase initialization...');

    // Check if already initialized
    const existingApps = getApps();
    if (existingApps.length === 0) {
      console.log('🔥 Initializing new Firebase app...');
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      console.log('🔥 Using existing Firebase app...');
      firebaseApp = getApp();
    }

    // Initialize Firestore with offline persistence
    try {
      console.log('🔥 Initializing Firestore...');
      firestore = initializeFirestore(firebaseApp, {
        experimentalForceLongPolling: true, // Required for some React Native environments
        cacheSizeBytes: 50 * 1024 * 1024, // 50MB cache
      });
      console.log('✅ Firestore initialized successfully');
    } catch (firestoreError) {
      console.error('❌ Firestore initialization failed, trying fallback:', firestoreError);
      try {
        firestore = getFirestore(firebaseApp);
        console.log('✅ Firestore initialized with fallback method');
      } catch (fallbackError) {
        console.error('❌ Firestore fallback also failed:', fallbackError);
        firestore = null;
      }
    }

    // Initialize Auth
    try {
      console.log('🔥 Initializing Auth...');
      auth = getAuth(firebaseApp);
      console.log('✅ Auth initialized successfully');
    } catch (authError) {
      console.error('❌ Auth initialization failed:', authError);
      auth = null;
    }

    firebaseInitialized = true;
    console.log('✅ Firebase initialization complete');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    console.error('⚠️  App will run in offline mode without cloud sync');
    console.error('Firebase config status:', {
      apiKey: config.firebaseApiKey ? '✓ present' : '✗ missing',
      authDomain: config.firebaseAuthDomain ? '✓ present' : '✗ missing',
      projectId: config.firebaseProjectId ? '✓ present' : '✗ missing',
      storageBucket: config.firebaseStorageBucket ? '✓ present' : '✗ missing',
      messagingSenderId: config.firebaseMessagingSenderId ? '✓ present' : '✗ missing',
      appId: config.firebaseAppId ? '✓ present' : '✗ missing',
      measurementId: config.firebaseMeasurementId ? '✓ present' : '✗ missing',
    });

    // Ensure all services are null on error
    firebaseApp = null;
    firestore = null;
    auth = null;
    firebaseInitialized = false;
  }
} else {
  console.warn('⚠️  Firebase configuration incomplete - skipping initialization');
  console.warn('Missing required config:', {
    apiKey: !config.firebaseApiKey,
    projectId: !config.firebaseProjectId,
    appId: !config.firebaseAppId,
  });
}

// Initialize Analytics (only on web or if supported)
let analytics: Analytics | null = null;

if (typeof window !== 'undefined' && firebaseApp) {
  isSupported()
    .then(supported => {
      if (supported && config.enableAnalytics && firebaseApp) {
        analytics = getAnalytics(firebaseApp);
      }
    })
    .catch(error => {
      console.warn('⚠️  Analytics initialization failed:', error);
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

// Helper to check if Firebase is available
export const isFirebaseAvailable = () => firebaseInitialized && firebaseApp !== null;
export const isFirestoreAvailable = () => firebaseInitialized && firestore !== null;
export const isAuthAvailable = () => firebaseInitialized && auth !== null;

// Export initialized services
export { firebaseApp, firestore, auth, analytics, firebaseInitialized };

// Export types
export type { FirebaseApp, Firestore, Auth, Analytics };
