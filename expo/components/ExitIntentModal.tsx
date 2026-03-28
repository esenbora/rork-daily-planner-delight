import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Check } from 'lucide-react-native';

interface ExitIntentModalProps {
  visible: boolean;
  onContinueFree: () => void;
  onTryPremium: () => void;
}

const benefits = [
  "Unlimited tasks and categories",
  "AI-powered smart scheduling",
  "Detailed productivity analytics",
  "Weekly insights & reports",
  "Custom themes & widgets",
];

export function ExitIntentModal({ visible, onContinueFree, onTryPremium }: ExitIntentModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible]);

  const handleTryPremium = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onTryPremium();
  };

  const handleContinueFree = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onContinueFree();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onContinueFree}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#FF8C42', '#C75B6E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          />

          <Text style={styles.title}>🙏 Give us a chance</Text>
          <Text style={styles.subtitle}>
            Let us help you become more productive and achieve your goals.
          </Text>

          {/* Benefits List */}
          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsTitle}>What you'll get:</Text>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <View style={styles.checkCircle}>
                  <Check size={16} color="#00D9A3" strokeWidth={3} />
                </View>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          {/* Emotional Appeal */}
          <View style={styles.appealCard}>
            <Text style={styles.appealText}>
              Join thousands of users who transformed their productivity with our app.
              Start your 3-day free trial and see the difference.
            </Text>
          </View>

          {/* Primary CTA */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleTryPremium}
          >
            <Text style={styles.primaryButtonText}>
              Give Us a Try - 3 Days Free
            </Text>
          </TouchableOpacity>

          {/* Secondary CTA */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleContinueFree}
          >
            <Text style={styles.secondaryButtonText}>
              Maybe Later
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#121212',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.3)',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    opacity: 0.15,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  benefitsSection: {
    backgroundColor: '#0A0A0A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 163, 0.2)',
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00D9A3',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 217, 163, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '500',
    flex: 1,
  },
  appealCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.2)',
  },
  appealText: {
    fontSize: 15,
    color: '#CCC',
    lineHeight: 22,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#FF8C42',
    borderRadius: 16,
    paddingVertical: 18,
    marginBottom: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#888',
  },
});
