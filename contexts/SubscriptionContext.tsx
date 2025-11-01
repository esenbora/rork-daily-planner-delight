/**
 * Subscription Context with RevenueCat Integration
 * Manages subscription state and purchase flow
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import {
  initializeRevenueCat,
  getSubscriptionStatus,
  getOfferings,
  purchasePackage,
  restorePurchases,
  setupCustomerInfoUpdateListener,
  SubscriptionTier,
  SubscriptionStatus,
  getFeatureLimits,
  identifyUser,
  logoutUser as logoutRevenueCat,
} from '@/lib/revenuecat';
import { getCurrentUserId } from '@/lib/firestore-sync';
import { logAnalyticsEvent, logError } from '@/lib/firebase';

export type { SubscriptionTier, SubscriptionStatus };

export interface SubscriptionFeatures {
  maxTasksPerDay: number;
  maxTemplates: number;
  taskTemplates: boolean;
  analytics: boolean;
  customCategories: boolean;
  export: boolean;
  aiSuggestions: boolean;
  aiAssistant: boolean;
  prioritySupport: boolean;
}

const SUBSCRIPTION_CACHE_KEY = '@planner_subscription_cache';

export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    tier: 'free',
    isPremium: false,
    willRenew: false,
  });
  const [features, setFeatures] = useState<SubscriptionFeatures>(getFeatureLimits('free'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize RevenueCat SDK and load subscription status
   */
  const initialize = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user ID if authenticated
      const userId = getCurrentUserId();

      // Initialize RevenueCat
      await initializeRevenueCat(userId || undefined);
      setIsInitialized(true);

      // Load current subscription status
      const status = await getSubscriptionStatus();
      updateSubscriptionState(status);

      // Load available offerings
      const offerings = await getOfferings();
      setCurrentOffering(offerings);

      logAnalyticsEvent('subscription_context_initialized', {
        tier: status.tier,
        is_premium: status.isPremium,
        has_user_id: !!userId,
      });
    } catch (error) {
      console.error('Failed to initialize subscription context:', error);
      logError(error as Error, { context: 'SubscriptionContext.initialize' });
      setError('Failed to load subscription status');

      // Try to load from cache
      await loadFromCache();
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update subscription state and features
   */
  const updateSubscriptionState = useCallback((status: SubscriptionStatus) => {
    setSubscriptionStatus(status);
    setFeatures(getFeatureLimits(status.tier));

    // Cache the status
    saveToCache(status);
  }, []);

  /**
   * Save subscription status to cache
   */
  const saveToCache = async (status: SubscriptionStatus) => {
    try {
      await AsyncStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify(status));
    } catch (error) {
      console.error('Failed to cache subscription status:', error);
    }
  };

  /**
   * Load subscription status from cache (fallback)
   */
  const loadFromCache = async () => {
    try {
      const cached = await AsyncStorage.getItem(SUBSCRIPTION_CACHE_KEY);
      if (cached) {
        const status = JSON.parse(cached) as SubscriptionStatus;

        // Check if cached subscription is expired
        if (status.expiresAt && new Date(status.expiresAt) < new Date()) {
          // Expired, reset to free
          updateSubscriptionState({
            tier: 'free',
            isPremium: false,
            willRenew: false,
          });
        } else {
          updateSubscriptionState(status);
        }
      }
    } catch (error) {
      console.error('Failed to load cached subscription:', error);
    }
  };

  /**
   * Initialize on mount
   */
  useEffect(() => {
    initialize();
  }, [initialize]);

  /**
   * Set up real-time subscription update listener
   */
  useEffect(() => {
    if (!isInitialized) return;

    const unsubscribe = setupCustomerInfoUpdateListener(status => {
      console.log('Subscription status updated:', status);
      updateSubscriptionState(status);
    });

    return () => {
      unsubscribe();
    };
  }, [isInitialized, updateSubscriptionState]);

  /**
   * Identify user when they log in
   */
  const identifySubscriptionUser = useCallback(async (userId: string) => {
    try {
      await identifyUser(userId);

      // Reload subscription status
      const status = await getSubscriptionStatus();
      updateSubscriptionState(status);

      logAnalyticsEvent('subscription_user_identified', {
        user_id: userId,
        tier: status.tier,
      });
    } catch (error) {
      logError(error as Error, { context: 'identifySubscriptionUser', userId });
    }
  }, [updateSubscriptionState]);

  /**
   * Log out user from RevenueCat
   */
  const logoutSubscriptionUser = useCallback(async () => {
    try {
      await logoutRevenueCat();

      // Reset to free tier
      updateSubscriptionState({
        tier: 'free',
        isPremium: false,
        willRenew: false,
      });

      logAnalyticsEvent('subscription_user_logged_out');
    } catch (error) {
      logError(error as Error, { context: 'logoutSubscriptionUser' });
    }
  }, [updateSubscriptionState]);

  /**
   * Purchase a subscription package
   */
  const purchase = useCallback(async (packageToPurchase: PurchasesPackage) => {
    try {
      setIsPurchasing(true);
      setError(null);

      const status = await purchasePackage(packageToPurchase);
      updateSubscriptionState(status);

      logAnalyticsEvent('purchase_successful', {
        tier: status.tier,
        product_id: packageToPurchase.product.identifier,
      });

      return status;
    } catch (error: any) {
      const errorMessage = error.message || 'Purchase failed';
      setError(errorMessage);

      if (errorMessage !== 'Purchase cancelled') {
        logError(error as Error, {
          context: 'purchase',
          packageId: packageToPurchase.identifier,
        });
      }

      throw error;
    } finally {
      setIsPurchasing(false);
    }
  }, [updateSubscriptionState]);

  /**
   * Restore previous purchases
   */
  const restore = useCallback(async () => {
    try {
      setIsRestoring(true);
      setError(null);

      const status = await restorePurchases();
      updateSubscriptionState(status);

      logAnalyticsEvent('restore_successful', {
        tier: status.tier,
        is_premium: status.isPremium,
      });

      return status;
    } catch (error) {
      const errorMessage = 'Failed to restore purchases';
      setError(errorMessage);
      logError(error as Error, { context: 'restore' });
      throw error;
    } finally {
      setIsRestoring(false);
    }
  }, [updateSubscriptionState]);

  /**
   * Refresh subscription status from RevenueCat
   */
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const status = await getSubscriptionStatus();
      updateSubscriptionState(status);

      // Also refresh offerings
      const offerings = await getOfferings();
      setCurrentOffering(offerings);

      logAnalyticsEvent('subscription_refreshed', {
        tier: status.tier,
      });
    } catch (error) {
      logError(error as Error, { context: 'refresh' });
      setError('Failed to refresh subscription');
    } finally {
      setIsLoading(false);
    }
  }, [updateSubscriptionState]);

  /**
   * Check if user has a specific feature
   */
  const hasFeature = useCallback(
    (feature: keyof SubscriptionFeatures): boolean => {
      return features[feature] as boolean;
    },
    [features]
  );

  /**
   * Check if user can add more tasks
   */
  const canAddMoreTasks = useCallback(
    (currentCount: number): boolean => {
      return currentCount < features.maxTasksPerDay;
    },
    [features.maxTasksPerDay]
  );

  /**
   * Get available packages from current offering
   */
  const getAvailablePackages = useCallback((): PurchasesPackage[] => {
    return currentOffering?.availablePackages || [];
  }, [currentOffering]);

  /**
   * Get specific package by identifier
   */
  const getPackageById = useCallback(
    (identifier: string): PurchasesPackage | null => {
      const packages = getAvailablePackages();
      return packages.find(pkg => pkg.identifier === identifier) || null;
    },
    [getAvailablePackages]
  );

  /**
   * Check if subscription will renew
   */
  const willRenew = subscriptionStatus.willRenew;

  /**
   * Check if user is premium
   */
  const isPremium = subscriptionStatus.isPremium;

  /**
   * Get current tier
   */
  const tier = subscriptionStatus.tier;

  /**
   * Get subscription expiration date
   */
  const expiresAt = subscriptionStatus.expiresAt;

  return {
    // State
    subscriptionStatus,
    features,
    tier,
    isPremium,
    expiresAt,
    willRenew,
    isLoading,
    isInitialized,
    isPurchasing,
    isRestoring,
    error,
    currentOffering,

    // Actions
    purchase,
    restore,
    refresh,
    identifySubscriptionUser,
    logoutSubscriptionUser,

    // Helpers
    hasFeature,
    canAddMoreTasks,
    getAvailablePackages,
    getPackageById,
  };
});
