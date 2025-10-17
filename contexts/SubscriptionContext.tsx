import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

export type SubscriptionTier = 'free' | 'pro' | 'lifetime';

export interface SubscriptionFeatures {
  maxTasksPerDay: number;
  taskTemplates: boolean;
  analytics: boolean;
  customCategories: boolean;
  export: boolean;
  aiSuggestions: boolean;
  prioritySupport: boolean;
}

export interface Subscription {
  tier: SubscriptionTier;
  expiresAt?: Date;
  features: SubscriptionFeatures;
}

const SUBSCRIPTION_KEY = '@planner_subscription';

const FEATURES_BY_TIER: Record<SubscriptionTier, SubscriptionFeatures> = {
  free: {
    maxTasksPerDay: 3,
    taskTemplates: false,
    analytics: false,
    customCategories: false,
    export: false,
    aiSuggestions: false,
    prioritySupport: false,
  },
  pro: {
    maxTasksPerDay: 50,
    taskTemplates: true,
    analytics: true,
    customCategories: true,
    export: true,
    aiSuggestions: true,
    prioritySupport: false,
  },
  lifetime: {
    maxTasksPerDay: Infinity,
    taskTemplates: true,
    analytics: true,
    customCategories: true,
    export: true,
    aiSuggestions: true,
    prioritySupport: true,
  },
};

export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const [subscription, setSubscription] = useState<Subscription>({
    tier: 'free',
    features: FEATURES_BY_TIER.free,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadSubscription = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(SUBSCRIPTION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { tier: SubscriptionTier; expiresAt?: string };
        const expiresAt = parsed.expiresAt ? new Date(parsed.expiresAt) : undefined;
        
        if (expiresAt && expiresAt < new Date()) {
          setSubscription({
            tier: 'free',
            features: FEATURES_BY_TIER.free,
          });
        } else {
          const tier = parsed.tier;
          setSubscription({
            tier,
            expiresAt,
            features: FEATURES_BY_TIER[tier],
          });
        }
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSubscription = useCallback(async (sub: Subscription) => {
    try {
      await AsyncStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(sub));
    } catch (error) {
      console.error('Failed to save subscription:', error);
    }
  }, []);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const upgradeToPro = useCallback((months: number = 1) => {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);
    
    const newSubscription: Subscription = {
      tier: 'pro',
      expiresAt,
      features: FEATURES_BY_TIER.pro,
    };
    
    setSubscription(newSubscription);
    saveSubscription(newSubscription);
  }, [saveSubscription]);

  const upgradeToLifetime = useCallback(() => {
    const newSubscription: Subscription = {
      tier: 'lifetime',
      features: FEATURES_BY_TIER.lifetime,
    };
    
    setSubscription(newSubscription);
    saveSubscription(newSubscription);
  }, [saveSubscription]);

  const cancelSubscription = useCallback(() => {
    const newSubscription: Subscription = {
      tier: 'free',
      features: FEATURES_BY_TIER.free,
    };
    
    setSubscription(newSubscription);
    saveSubscription(newSubscription);
  }, [saveSubscription]);

  const hasFeature = useCallback((feature: keyof SubscriptionFeatures): boolean => {
    return subscription.features[feature] as boolean;
  }, [subscription.features]);

  const canAddMoreTasks = useCallback((currentCount: number): boolean => {
    return currentCount < subscription.features.maxTasksPerDay;
  }, [subscription.features.maxTasksPerDay]);

  const isPremium = subscription.tier !== 'free';

  return {
    subscription,
    isLoading,
    isPremium,
    upgradeToPro,
    upgradeToLifetime,
    cancelSubscription,
    hasFeature,
    canAddMoreTasks,
  };
});
