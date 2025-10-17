import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, Target, Sparkles, ArrowRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingFlowProps {
  onComplete: () => void;
}

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  accentColor: string;
}

const ONBOARDING_COMPLETE_KEY = '@planner_onboarding_complete';

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState<number>(0);

  const steps: OnboardingStep[] = [
    {
      icon: <Clock size={64} color="#4A9B9B" strokeWidth={1.5} />,
      title: "Take Control of Your Time",
      description: "Feeling overwhelmed? Your day doesn't have to be chaotic. Let's build a routine that actually works for you.",
      accentColor: '#4A9B9B',
    },
    {
      icon: <Target size={64} color="#C75B6E" strokeWidth={1.5} />,
      title: "Visualize Your Day",
      description: "See your entire day at a glance with our beautiful time wheel. Know exactly where your time goes and find balance.",
      accentColor: '#C75B6E',
    },
    {
      icon: <Sparkles size={64} color="#8B7AC7" strokeWidth={1.5} />,
      title: "Start Small, Build Big",
      description: "You don't need to plan everything at once. Start with your most important tasks and grow from there.",
      accentColor: '#8B7AC7',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
      onComplete();
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
      onComplete();
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.dotsContainer}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentStep && {
                  backgroundColor: currentStepData.accentColor,
                  width: 24,
                },
              ]}
            />
          ))}
        </View>
        {currentStep < steps.length - 1 && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: currentStepData.accentColor + '15' },
            ]}
          >
            {currentStepData.icon}
          </View>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{currentStepData.title}</Text>
          <Text style={styles.description}>{currentStepData.description}</Text>
        </View>

        {currentStep === 0 && (
          <View style={styles.painPoints}>
            <PainPoint
              emoji="😰"
              text="Feeling like there's never enough time?"
              color={currentStepData.accentColor}
            />
            <PainPoint
              emoji="🔄"
              text="Stuck in an endless cycle of chaos?"
              color={currentStepData.accentColor}
            />
            <PainPoint
              emoji="💪"
              text="Ready to take back control?"
              color={currentStepData.accentColor}
            />
          </View>
        )}

        {currentStep === 1 && (
          <View style={styles.features}>
            <FeatureItem
              text="24-hour visual time wheel"
              color={currentStepData.accentColor}
            />
            <FeatureItem
              text="Color-coded task categories"
              color={currentStepData.accentColor}
            />
            <FeatureItem
              text="Real-time schedule tracking"
              color={currentStepData.accentColor}
            />
          </View>
        )}

        {currentStep === 2 && (
          <View style={styles.tipsContainer}>
            <TipCard
              number="1"
              text="Add your morning routine first"
              color={currentStepData.accentColor}
            />
            <TipCard
              number="2"
              text="Block time for your priorities"
              color={currentStepData.accentColor}
            />
            <TipCard
              number="3"
              text="Leave buffer time for flexibility"
              color={currentStepData.accentColor}
            />
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.nextButton,
            { backgroundColor: currentStepData.accentColor },
          ]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === steps.length - 1 ? "Let's Begin" : 'Continue'}
          </Text>
          <ArrowRight size={20} color="#FFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PainPoint({ emoji, text, color }: { emoji: string; text: string; color: string }) {
  return (
    <View style={styles.painPoint}>
      <View style={[styles.painPointEmoji, { backgroundColor: color + '15' }]}>
        <Text style={styles.painPointEmojiText}>{emoji}</Text>
      </View>
      <Text style={styles.painPointText}>{text}</Text>
    </View>
  );
}

function FeatureItem({ text, color }: { text: string; color: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureDot, { backgroundColor: color }]} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

function TipCard({ number, text, color }: { number: string; text: string; color: string }) {
  return (
    <View style={styles.tipCard}>
      <View style={[styles.tipNumber, { backgroundColor: color }]}>
        <Text style={styles.tipNumberText}>{number}</Text>
      </View>
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 40,
    marginBottom: 32,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    width: '100%',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
  },
  description: {
    fontSize: 17,
    color: '#999',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 8,
  },
  painPoints: {
    width: '100%',
    gap: 16,
  },
  painPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  painPointEmoji: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  painPointEmojiText: {
    fontSize: 24,
  },
  painPointText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    lineHeight: 22,
  },
  features: {
    width: '100%',
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingLeft: 8,
  },
  featureDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  featureText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    lineHeight: 24,
  },
  tipsContainer: {
    width: '100%',
    gap: 16,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  tipNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipNumberText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  tipText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 18,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
});
