/**
 * Subscription Screen with Real RevenueCat Integration
 * Handles premium subscription purchase flow
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Star } from 'lucide-react-native';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { PACKAGE_IDS } from '@/lib/revenuecat';
import { logAnalyticsEvent } from '@/lib/firebase';
import { ExitIntentModal } from '@/components/ExitIntentModal';

interface PricingTier {
  id: string;
  packageId: string;
  name: string;
  price: number;
  monthlyEquivalent: number;
  period: string;
  popular?: boolean;
  basePrice: string; // Fallback for display
}

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isFromOnboarding = params.source === 'onboarding';

  const {
    tier,
    isPremium,
    isLoading,
    isPurchasing,
    isRestoring,
    error,
    purchase,
    restore,
    getAvailablePackages,
    getPackageById,
  } = useSubscription();

  const [selectedTier, setSelectedTier] = useState<string>('yearly');
  const [actualPrices, setActualPrices] = useState<Record<string, string>>({});
  const [showExitIntent, setShowExitIntent] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Define tiers with base prices (fallback if RevenueCat fails)
  const tiers: PricingTier[] = [
    {
      id: 'yearly',
      packageId: PACKAGE_IDS.YEARLY,
      name: 'Yearly',
      price: 35.99,
      monthlyEquivalent: 2.99,
      period: 'year',
      basePrice: '$35.99',
      popular: true,
    },
    {
      id: 'monthly',
      packageId: PACKAGE_IDS.MONTHLY,
      name: 'Monthly',
      price: 4.99,
      monthlyEquivalent: 4.99,
      period: 'month',
      basePrice: '$4.99',
    },
  ];

  /**
   * Load actual prices from RevenueCat
   */
  useEffect(() => {
    loadPrices();
  }, []);

  const loadPrices = () => {
    const packages = getAvailablePackages();
    const prices: Record<string, string> = {};

    packages.forEach(pkg => {
      const tier = tiers.find(t => t.packageId === pkg.identifier);
      if (tier) {
        prices[tier.id] = pkg.product.priceString;
      }
    });

    setActualPrices(prices);
  };

  /**
   * Get display price for a tier (RevenueCat price or fallback)
   */
  const getPrice = (tierId: string, basePrice: string): string => {
    return actualPrices[tierId] || basePrice;
  };

  /**
   * Handle purchase button tap
   */
  const handlePurchase = async () => {
    try {
      // Animate button
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Get the selected tier's package
      const selectedTierData = tiers.find(t => t.id === selectedTier);
      if (!selectedTierData) {
        Alert.alert('Error', 'Please select a subscription tier');
        return;
      }

      const packageToPurchase = getPackageById(selectedTierData.packageId);
      if (!packageToPurchase) {
        Alert.alert(
          'Error',
          'Subscription packages are not available. Please try again later.'
        );
        logAnalyticsEvent('purchase_failed_no_package', {
          selected_tier: selectedTier,
        });
        return;
      }

      logAnalyticsEvent('purchase_button_tapped', {
        tier: selectedTier,
        package_id: selectedTierData.packageId,
      });

      // Perform purchase
      const status = await purchase(packageToPurchase);

      // Show success alert
      Alert.alert(
        'Success!',
        `You're now subscribed to ${selectedTierData.name}. Enjoy all premium features!`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );

      logAnalyticsEvent('purchase_success_alert_shown', {
        tier: status.tier,
      });
    } catch (error: any) {
      // Handle cancellation gracefully
      if (error.message === 'Purchase cancelled') {
        logAnalyticsEvent('purchase_user_cancelled', {
          tier: selectedTier,
        });
        return;
      }

      // Show error alert
      Alert.alert(
        'Purchase Failed',
        'Unable to complete your purchase. Please try again or contact support.',
        [{ text: 'OK' }]
      );

      logAnalyticsEvent('purchase_error_shown', {
        tier: selectedTier,
        error: error.message,
      });
    }
  };

  /**
   * Handle restore purchases button tap
   */
  const handleRestore = async () => {
    try {
      logAnalyticsEvent('restore_button_tapped');

      const status = await restore();

      if (status.isPremium) {
        Alert.alert(
          'Restored Successfully',
          `Your ${status.tier} subscription has been restored!`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
        logAnalyticsEvent('restore_success_alert_shown', {
          tier: status.tier,
        });
      } else {
        Alert.alert(
          'No Purchases Found',
          'We couldn\'t find any previous purchases to restore.',
          [{ text: 'OK' }]
        );
        logAnalyticsEvent('restore_no_purchases_found');
      }
    } catch (error) {
      Alert.alert(
        'Restore Failed',
        'Unable to restore purchases. Please try again.',
        [{ text: 'OK' }]
      );
      logAnalyticsEvent('restore_error_shown');
    }
  };

  const selectedTierData = tiers.find(t => t.id === selectedTier);

  // Show loading state while initializing
  if (isLoading && !actualPrices.monthly) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B7AC7" />
          <Text style={styles.loadingText}>Loading subscriptions...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + 20 }]}
      >
        {/* Close Button */}
        <TouchableOpacity
          onPress={() => {
            if (isFromOnboarding) {
              logAnalyticsEvent('exit_intent_triggered', { source: 'onboarding' });
              setShowExitIntent(true);
            } else {
              router.back();
            }
          }}
          style={styles.closeButtonTop}
        >
          <X color="#FFF" size={24} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Try Premium to be the{'\n'}person you want to be</Text>
          <View style={styles.trustBadge}>
            <View style={styles.starsRow}>
              <Star size={14} color="#FFD700" fill="#FFD700" />
              <Star size={14} color="#FFD700" fill="#FFD700" />
              <Star size={14} color="#FFD700" fill="#FFD700" />
              <Star size={14} color="#FFD700" fill="#FFD700" />
              <Star size={14} color="#FFD700" fill="#FFD700" />
              <Text style={styles.ratingText}>4.8</Text>
            </View>
            <Text style={styles.userCountText}>(12,000+ users)</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Unlock unlimited tasks, AI-powered insights, and analytics
          </Text>
        </View>

        {/* Discount Badge */}
        <View style={styles.discountBadge}>
          <Text style={styles.discountPercentage}>SAVE 50%</Text>
          <Text style={styles.discountSubtext}>Best value plan</Text>
        </View>

        {/* Simple Tier Cards */}
        <View style={styles.tiersContainer}>
          {tiers.map(tierItem => {
            const isSelected = selectedTier === tierItem.id;
            const monthlyPrice = actualPrices[tierItem.id]
              ? actualPrices[tierItem.id].replace(/[^0-9.]/g, '')
              : tierItem.monthlyEquivalent.toFixed(2);

            return (
              <TouchableOpacity
                key={tierItem.id}
                style={[
                  styles.simpleTierCard,
                  isSelected && styles.simpleTierCardSelected,
                ]}
                onPress={() => setSelectedTier(tierItem.id)}
                disabled={isPurchasing || isRestoring}
              >
                <View style={[
                  styles.radioButton,
                  isSelected && styles.radioButtonSelected,
                ]}>
                  {isSelected && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>

                <View style={styles.simpleTierInfo}>
                  <View style={styles.simpleTierHeader}>
                    <Text style={styles.simpleTierName}>{tierItem.name}</Text>
                    {tierItem.popular && (
                      <Text style={styles.popularLabel}>MOST POPULAR</Text>
                    )}
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.monthlyPrice}>
                      ${monthlyPrice}/month
                    </Text>
                    {tierItem.id === 'yearly' && (
                      <Text style={styles.billedText}>
                        Billed ${tierItem.price.toFixed(2)}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Error display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Restore purchases link */}
        <TouchableOpacity
          onPress={handleRestore}
          disabled={isRestoring || isPurchasing}
          style={styles.restoreLinkButton}
        >
          {isRestoring ? (
            <ActivityIndicator size="small" color="#8B7AC7" />
          ) : (
            <Text style={styles.restoreLinkText}>Restore Purchases</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              (isPurchasing || isRestoring) && styles.continueButtonDisabled,
            ]}
            onPress={handlePurchase}
            disabled={isPurchasing || isRestoring}
          >
            {isPurchasing ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.continueButtonText}>
                Continue with {selectedTierData?.name}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {isFromOnboarding && (
          <TouchableOpacity
            style={styles.freeTrialButton}
            onPress={() => {
              logAnalyticsEvent('continue_with_free_tapped', { source: 'onboarding' });
              router.replace('/');
            }}
            disabled={isPurchasing || isRestoring}
          >
            <Text style={styles.freeTrialText}>
              Continue with Free (3 tasks/day)
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.disclaimer}>
          Cancel anytime • Secure payment
          {'\n'}
          Payment charged to your account. Auto-renews unless cancelled.
        </Text>
      </View>

      {/* Exit Intent Modal */}
      <ExitIntentModal
        visible={showExitIntent}
        onContinueFree={() => {
          setShowExitIntent(false);
          logAnalyticsEvent('exit_intent_dismissed', { source: 'onboarding' });
          router.replace('/');
        }}
        onTryPremium={() => {
          setShowExitIntent(false);
          logAnalyticsEvent('exit_intent_accepted', { source: 'onboarding' });
          handlePurchase();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  closeButtonTop: {
    position: 'absolute' as const,
    top: 0,
    left: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  // Header Section
  headerSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 28,
  },
  trustBadge: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFD700',
    marginLeft: 6,
  },
  userCountText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Discount Badge
  discountBadge: {
    backgroundColor: '#00D9A3',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  discountPercentage: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 1,
  },
  discountSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
    opacity: 0.9,
    marginTop: 4,
  },
  // Simple Tier Cards
  tiersContainer: {
    gap: 12,
    marginBottom: 20,
  },
  simpleTierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: '#1A1A1A',
    height: 70,
  },
  simpleTierCardSelected: {
    borderColor: '#00D9A3',
    backgroundColor: '#00D9A310',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioButtonSelected: {
    borderColor: '#00D9A3',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00D9A3',
  },
  simpleTierInfo: {
    flex: 1,
  },
  simpleTierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  simpleTierName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  popularLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  monthlyPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  billedText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  // Error
  errorContainer: {
    marginTop: 12,
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#C75B6E20',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C75B6E',
  },
  errorText: {
    fontSize: 14,
    color: '#C75B6E',
    textAlign: 'center',
  },
  // Restore Link
  restoreLinkButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  restoreLinkText: {
    fontSize: 14,
    color: '#8B7AC7',
    fontWeight: '600',
  },
  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: '#0A0A0A',
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  continueButton: {
    backgroundColor: '#00D9A3',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  freeTrialButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#333',
  },
  freeTrialText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  disclaimer: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
});
