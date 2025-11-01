/**
 * RevenueCat Service
 * Handles in-app purchase logic and subscription management
 */

import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  LOG_LEVEL,
  PurchasesStoreProduct,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { config } from '@/utils/env';
import { logAnalyticsEvent, logError } from './firebase';

// Product/Entitlement identifiers
export const ENTITLEMENT_ID = 'premium';
export const OFFERING_ID = 'default';

// Package identifiers (match RevenueCat dashboard)
export const PACKAGE_IDS = {
  MONTHLY: '$rc_monthly',
  YEARLY: '$rc_annual',
} as const;

export type SubscriptionTier = 'free' | 'monthly' | 'yearly';

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  isPremium: boolean;
  expiresAt?: Date;
  willRenew: boolean;
  productIdentifier?: string;
}

/**
 * Initialize RevenueCat SDK
 * Should be called once at app startup
 */
export async function initializeRevenueCat(userId?: string): Promise<void> {
  try {
    if (Platform.OS === 'ios') {
      // Configure SDK
      Purchases.setLogLevel(LOG_LEVEL.DEBUG); // Use DEBUG in development, INFO in production

      // Initialize with API key
      Purchases.configure({
        apiKey: config.revenuecatIosApiKey,
        appUserID: userId, // Optional: link purchases to your user ID
      });

      logAnalyticsEvent('revenuecat_initialized', {
        has_user_id: !!userId,
      });

      console.log('RevenueCat initialized successfully');
    } else {
      console.warn('RevenueCat only configured for iOS');
    }
  } catch (error) {
    logError(error as Error, { context: 'initializeRevenueCat' });
    console.error('❌ RevenueCat initialization failed:', error);
    console.error('⚠️  Subscription features will be unavailable.');
    console.error('RevenueCat config status:', {
      iosApiKey: config.revenuecatIosApiKey ? '✓ present' : '✗ missing',
      platform: Platform.OS,
    });
    // Don't throw - allow app to continue without subscription features
  }
}

/**
 * Set user ID for RevenueCat
 * Call this when user logs in
 */
export async function identifyUser(userId: string): Promise<void> {
  try {
    await Purchases.logIn(userId);
    logAnalyticsEvent('revenuecat_user_identified', { user_id: userId });
  } catch (error) {
    logError(error as Error, { context: 'identifyUser', userId });
    throw error;
  }
}

/**
 * Log out user from RevenueCat
 * Call this when user logs out
 */
export async function logoutUser(): Promise<void> {
  try {
    await Purchases.logOut();
    logAnalyticsEvent('revenuecat_user_logged_out');
  } catch (error) {
    logError(error as Error, { context: 'logoutUser' });
    throw error;
  }
}

/**
 * Get current customer info and subscription status
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return parseCustomerInfo(customerInfo);
  } catch (error) {
    logError(error as Error, { context: 'getSubscriptionStatus' });
    // Return free tier on error
    return {
      tier: 'free',
      isPremium: false,
      willRenew: false,
    };
  }
}

/**
 * Parse CustomerInfo to our SubscriptionStatus format
 */
function parseCustomerInfo(customerInfo: CustomerInfo): SubscriptionStatus {
  const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];

  if (!entitlement) {
    // No active premium subscription
    return {
      tier: 'free',
      isPremium: false,
      willRenew: false,
    };
  }

  // Determine tier based on product identifier
  let tier: SubscriptionTier = 'monthly';
  const productId = entitlement.productIdentifier;

  if (productId.includes('annual') || productId.includes('yearly')) {
    tier = 'yearly';
  } else if (productId.includes('monthly')) {
    tier = 'monthly';
  }

  return {
    tier,
    isPremium: true,
    expiresAt: entitlement.expirationDate ? new Date(entitlement.expirationDate) : undefined,
    willRenew: entitlement.willRenew,
    productIdentifier: entitlement.productIdentifier,
  };
}

/**
 * Get available offerings (subscription packages)
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();

    if (!offerings.current) {
      console.warn('No current offering available');
      logAnalyticsEvent('revenuecat_no_offerings');
      return null;
    }

    logAnalyticsEvent('revenuecat_offerings_fetched', {
      offering_id: offerings.current.identifier,
      package_count: offerings.current.availablePackages.length,
    });

    return offerings.current;
  } catch (error) {
    logError(error as Error, { context: 'getOfferings' });
    return null;
  }
}

/**
 * Purchase a package
 */
export async function purchasePackage(
  packageToPurchase: PurchasesPackage
): Promise<SubscriptionStatus> {
  try {
    logAnalyticsEvent('purchase_initiated', {
      package_id: packageToPurchase.identifier,
      product_id: packageToPurchase.product.identifier,
    });

    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);

    const status = parseCustomerInfo(customerInfo);

    logAnalyticsEvent('purchase_completed', {
      tier: status.tier,
      product_id: status.productIdentifier,
      is_premium: status.isPremium,
    });

    return status;
  } catch (error: any) {
    // Handle user cancellation
    if (error.userCancelled) {
      logAnalyticsEvent('purchase_cancelled', {
        package_id: packageToPurchase.identifier,
      });
      throw new Error('Purchase cancelled');
    }

    logError(error as Error, {
      context: 'purchasePackage',
      packageId: packageToPurchase.identifier,
    });

    throw error;
  }
}

/**
 * Restore previous purchases
 * Call this when user taps "Restore Purchases"
 */
export async function restorePurchases(): Promise<SubscriptionStatus> {
  try {
    logAnalyticsEvent('restore_purchases_initiated');

    const customerInfo = await Purchases.restorePurchases();
    const status = parseCustomerInfo(customerInfo);

    logAnalyticsEvent('restore_purchases_completed', {
      tier: status.tier,
      is_premium: status.isPremium,
    });

    return status;
  } catch (error) {
    logError(error as Error, { context: 'restorePurchases' });
    throw error;
  }
}

/**
 * Check if user has active premium subscription
 */
export async function isPremiumUser(): Promise<boolean> {
  try {
    const status = await getSubscriptionStatus();
    return status.isPremium;
  } catch (error) {
    logError(error as Error, { context: 'isPremiumUser' });
    return false;
  }
}

/**
 * Get product pricing information
 * Useful for displaying prices in UI
 */
export async function getProductPricing(): Promise<{
  monthly?: string;
  yearly?: string;
} | null> {
  try {
    const offering = await getOfferings();
    if (!offering) return null;

    const pricing: { monthly?: string; yearly?: string } = {};

    offering.availablePackages.forEach(pkg => {
      const priceString = pkg.product.priceString;

      if (pkg.identifier === PACKAGE_IDS.MONTHLY) {
        pricing.monthly = priceString;
      } else if (pkg.identifier === PACKAGE_IDS.YEARLY) {
        pricing.yearly = priceString;
      }
    });

    return pricing;
  } catch (error) {
    logError(error as Error, { context: 'getProductPricing' });
    return null;
  }
}

/**
 * Set up customer info update listener
 * This fires whenever the subscription status changes
 */
export function setupCustomerInfoUpdateListener(
  callback: (status: SubscriptionStatus) => void
): () => void {
  const remove = Purchases.addCustomerInfoUpdateListener(customerInfo => {
    const status = parseCustomerInfo(customerInfo);

    logAnalyticsEvent('subscription_status_changed', {
      tier: status.tier,
      is_premium: status.isPremium,
    });

    callback(status);
  });

  // Return cleanup function
  return () => {
    remove();
  };
}

/**
 * Check if subscription is set to renew
 */
export async function willSubscriptionRenew(): Promise<boolean> {
  try {
    const status = await getSubscriptionStatus();
    return status.willRenew;
  } catch (error) {
    logError(error as Error, { context: 'willSubscriptionRenew' });
    return false;
  }
}

/**
 * Get subscription expiration date
 */
export async function getSubscriptionExpirationDate(): Promise<Date | null> {
  try {
    const status = await getSubscriptionStatus();
    return status.expiresAt || null;
  } catch (error) {
    logError(error as Error, { context: 'getSubscriptionExpirationDate' });
    return null;
  }
}

/**
 * Format tier for display
 */
export function formatTierName(tier: SubscriptionTier): string {
  const names: Record<SubscriptionTier, string> = {
    free: 'Free',
    monthly: 'Monthly Pro',
    yearly: 'Yearly Pro',
  };
  return names[tier];
}

/**
 * Get feature limits based on tier
 */
export function getFeatureLimits(tier: SubscriptionTier) {
  const limits = {
    free: {
      maxTasksPerDay: 3,
      maxTemplates: 0,
      taskTemplates: false,
      analytics: false,
      customCategories: false,
      export: false,
      aiSuggestions: false,
      aiAssistant: false,
      prioritySupport: false,
    },
    monthly: {
      maxTasksPerDay: 50,
      maxTemplates: 10,
      taskTemplates: true,
      analytics: true,
      customCategories: true,
      export: true,
      aiSuggestions: true,
      aiAssistant: true,
      prioritySupport: false,
    },
    yearly: {
      maxTasksPerDay: 50,
      maxTemplates: 25,
      taskTemplates: true,
      analytics: true,
      customCategories: true,
      export: true,
      aiSuggestions: true,
      aiAssistant: true,
      prioritySupport: true,
    },
  };

  return limits[tier];
}
