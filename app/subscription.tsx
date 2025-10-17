import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Check, Crown, Sparkles, Zap } from 'lucide-react-native';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface PricingTier {
  id: string;
  name: string;
  price: string;
  period: string;
  savings?: string;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
  color: string;
}

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { subscription, upgradeToPro, upgradeToLifetime } = useSubscription();
  const [selectedTier, setSelectedTier] = useState<string>('monthly');
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const tiers: PricingTier[] = [
    {
      id: 'monthly',
      name: 'Pro Monthly',
      price: '$4.99',
      period: 'per month',
      features: [
        'Up to 50 tasks per day',
        'Task templates library',
        'Advanced analytics',
        'Custom categories',
        'Export your schedule',
        'AI suggestions',
      ],
      icon: <Sparkles size={28} color="#4A9B9B" />,
      color: '#4A9B9B',
    },
    {
      id: 'yearly',
      name: 'Pro Yearly',
      price: '$39.99',
      period: 'per year',
      savings: 'Save 33%',
      popular: true,
      features: [
        'Everything in Monthly',
        'Best value at $3.33/month',
        '2 months free',
        'Priority email support',
      ],
      icon: <Zap size={28} color="#FFD700" />,
      color: '#FFD700',
    },
    {
      id: 'lifetime',
      name: 'Lifetime Access',
      price: '$99.99',
      period: 'one-time',
      savings: 'Best Deal',
      features: [
        'Everything in Pro',
        'Unlimited forever',
        'All future updates',
        'Priority support',
        'Early access to features',
        'Lifetime updates',
      ],
      icon: <Crown size={28} color="#C75B6E" />,
      color: '#C75B6E',
    },
  ];

  const handlePurchase = () => {
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
    ]).start(() => {
      if (selectedTier === 'lifetime') {
        upgradeToLifetime();
      } else if (selectedTier === 'yearly') {
        upgradeToPro(12);
      } else {
        upgradeToPro(1);
      }
      router.back();
    });
  };

  const selectedTierData = tiers.find(t => t.id === selectedTier);

  return (
    <View style={styles.container}>
      <View style={[styles.backgroundHeader, { height: insets.top }]} />
      <StatusBar barStyle="light-content" />
      
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upgrade to Premium</Text>
        <View style={styles.closeButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.crownContainer}>
            <Crown size={64} color="#FFD700" fill="#FFD700" />
          </View>
          <Text style={styles.heroTitle}>Unlock Your Full Potential</Text>
          <Text style={styles.heroSubtitle}>
            Take control of your schedule with premium features designed for productivity
          </Text>
          
          {subscription.tier !== 'free' && (
            <View style={styles.currentPlanBadge}>
              <Text style={styles.currentPlanText}>
                Current Plan: {subscription.tier === 'pro' ? 'Pro' : 'Lifetime'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.tiersContainer}>
          {tiers.map((tier) => {
            const isSelected = selectedTier === tier.id;
            return (
              <TouchableOpacity
                key={tier.id}
                style={[
                  styles.tierCard,
                  isSelected && styles.tierCardSelected,
                  tier.popular && styles.tierCardPopular,
                ]}
                onPress={() => setSelectedTier(tier.id)}
              >
                {tier.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                  </View>
                )}
                
                <View style={styles.tierHeader}>
                  <View style={[styles.tierIcon, { backgroundColor: tier.color + '20' }]}>
                    {tier.icon}
                  </View>
                  <View style={styles.tierInfo}>
                    <Text style={styles.tierName}>{tier.name}</Text>
                    <View style={styles.tierPriceRow}>
                      <Text style={styles.tierPrice}>{tier.price}</Text>
                      <Text style={styles.tierPeriod}> {tier.period}</Text>
                    </View>
                    {tier.savings && (
                      <View style={[styles.savingsBadge, { backgroundColor: tier.color + '30' }]}>
                        <Text style={[styles.savingsText, { color: tier.color }]}>
                          {tier.savings}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={[
                    styles.radioButton,
                    isSelected && { borderColor: tier.color, backgroundColor: tier.color + '20' },
                  ]}>
                    {isSelected && (
                      <View style={[styles.radioButtonInner, { backgroundColor: tier.color }]} />
                    )}
                  </View>
                </View>

                <View style={styles.tierFeatures}>
                  {tier.features.map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <Check size={16} color={tier.color} strokeWidth={3} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.trustSection}>
          <Text style={styles.trustText}>✓ Cancel anytime</Text>
          <Text style={styles.trustText}>✓ Secure payment</Text>
          <Text style={styles.trustText}>✓ 7-day money-back guarantee</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[styles.purchaseButton, { backgroundColor: selectedTierData?.color }]}
            onPress={handlePurchase}
          >
            <Text style={styles.purchaseButtonText}>
              Get {selectedTierData?.name}
            </Text>
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.disclaimer}>
          Payment will be charged to your account. Subscription automatically renews unless cancelled.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  backgroundHeader: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0A0A0A',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  crownContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#FFD70020',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
  },
  currentPlanBadge: {
    backgroundColor: '#4A9B9B30',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
  },
  currentPlanText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A9B9B',
  },
  tiersContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  tierCard: {
    backgroundColor: '#121212',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  tierCardSelected: {
    borderColor: '#4A9B9B',
  },
  tierCardPopular: {
    borderColor: '#FFD700',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0A0A0A',
    letterSpacing: 0.5,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  tierIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 6,
  },
  tierPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  tierPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
  },
  tierPeriod: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  savingsBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '700',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  tierFeatures: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#CCC',
    fontWeight: '500',
    flex: 1,
  },
  trustSection: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  trustText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 18,
    marginBottom: 12,
  },
  purchaseButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  disclaimer: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
});
