import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, Target, Sparkles, ArrowRight, TrendingUp } from 'lucide-react-native';
// import Slider from '@react-native-community/slider'; // TEMPORARILY DISABLED FOR BUILD
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { OnboardingTaskForm } from './OnboardingTaskForm';
import { OnboardingMiniWheel } from './OnboardingMiniWheel';
import { CATEGORY_CONFIGS, type TaskCategory } from '@/constants/types';

interface OnboardingFlowProps {
  onComplete: (firstTask?: OnboardingTask) => void;
}

interface OnboardingTask {
  title: string;
  category: TaskCategory;
  startHour: number;
  startMinute: number;
  duration: number;
}

const ONBOARDING_COMPLETE_KEY = '@planner_onboarding_complete';
const ONBOARDING_GOAL_KEY = '@planner_daily_goal';

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [firstTask, setFirstTask] = useState<OnboardingTask | undefined>();
  const [dailyGoalHours, setDailyGoalHours] = useState<number>(6);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fadeAnim.setValue(1);
    slideAnim.setValue(0);
    scaleAnim.setValue(1);
  }, [fadeAnim, slideAnim, scaleAnim]);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Don't allow continuing step 2 without adding a task
    if (currentStep === 1 && !firstTask) {
      return;
    }

    if (currentStep < 4) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(currentStep + 1);
        slideAnim.setValue(50);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      completeOnboarding();
    }
  };

  const handleTaskAdded = (task: OnboardingTask) => {
    setFirstTask(task);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Celebration animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-advance after a moment
    setTimeout(() => {
      handleNext();
    }, 800);
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.multiSet([
        [ONBOARDING_COMPLETE_KEY, 'true'],
        [ONBOARDING_GOAL_KEY, dailyGoalHours.toString()],
      ]);
      onComplete(firstTask);
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
      onComplete(firstTask);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.dotsContainer}>
          {[0, 1, 2, 3, 4].map((index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentStep && styles.dotActive,
                index < currentStep && styles.dotCompleted,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 0 && (
          <Animated.View
            style={[
              styles.stepContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.appIconContainer}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.appIcon}
                contentFit="contain"
              />
            </View>
            <Text style={styles.title}>Welcome to Chronos</Text>
            <Text style={styles.description}>
              Your personal time companion. Visualize your day on an elegant wheel and take control of your time.
            </Text>
            <View style={styles.featureList}>
              <FeatureItem text="Beautiful 24-hour time wheel" />
              <FeatureItem text="Smart task planning with AI" />
              <FeatureItem text="Track your productivity streaks" />
            </View>
          </Animated.View>
        )}

        {currentStep === 1 && (
          <Animated.View
            style={[
              styles.stepContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(0, 217, 163, 0.15)' }]}>
              <Target size={64} color="#00D9A3" strokeWidth={1.5} />
            </View>
            <Text style={styles.title}>Add Your First Task</Text>
            <Text style={styles.description}>
              Let's start with something you want to accomplish today.
            </Text>
            <OnboardingTaskForm onTaskAdded={handleTaskAdded} />
          </Animated.View>
        )}

        {currentStep === 2 && firstTask && (
          <Animated.View
            style={[
              styles.stepContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
              },
            ]}
          >
            <Text style={styles.title}>See It on the Wheel</Text>
            <Text style={styles.description}>
              Your task appears on the time wheel. This is how you'll visualize your entire day.
            </Text>
            <View style={styles.wheelPreview}>
              <OnboardingMiniWheel task={firstTask} />
            </View>
            <View style={styles.taskCard}>
              <View
                style={[
                  styles.taskDot,
                  { backgroundColor: CATEGORY_CONFIGS[firstTask.category].color },
                ]}
              />
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>{firstTask.title}</Text>
                <Text style={styles.taskTime}>
                  {String(firstTask.startHour).padStart(2, '0')}:
                  {String(firstTask.startMinute).padStart(2, '0')} • {firstTask.duration}min
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {currentStep === 3 && (
          <Animated.View
            style={[
              styles.stepContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(0, 217, 163, 0.15)' }]}>
              <Sparkles size={64} color="#00D9A3" strokeWidth={1.5} />
            </View>
            <Text style={styles.title}>Color-Coded Categories</Text>
            <Text style={styles.description}>
              Organize your tasks with beautiful categories. Unlock unlimited custom categories with Premium!
            </Text>
            <View style={styles.categoryGrid}>
              {(Object.keys(CATEGORY_CONFIGS) as TaskCategory[]).map((cat) => {
                const config = CATEGORY_CONFIGS[cat];
                return (
                  <View key={cat} style={styles.categoryCard}>
                    <View
                      style={[
                        styles.categoryCircle,
                        { backgroundColor: config.color },
                      ]}
                    />
                    <Text style={styles.categoryName}>{config.label}</Text>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {currentStep === 4 && (
          <Animated.View
            style={[
              styles.stepContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 215, 0, 0.15)' }]}>
              <TrendingUp size={64} color="#FFD700" strokeWidth={1.5} />
            </View>
            <Text style={styles.title}>Set Your Daily Goal</Text>
            <Text style={styles.description}>
              How many hours would you like to dedicate to productive tasks? Track your progress with Premium Analytics!
            </Text>
            <View style={styles.goalSection}>
              <Text style={styles.goalValue}>{dailyGoalHours} hours</Text>
              {/* TEMPORARILY DISABLED SLIDER FOR BUILD - Replace with alternative UI */}
              {/* <Slider
                style={styles.slider}
                minimumValue={2}
                maximumValue={12}
                step={1}
                value={dailyGoalHours}
                onValueChange={(value) => {
                  setDailyGoalHours(value);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                minimumTrackTintColor="#00D9A3"
                maximumTrackTintColor="#333"
                thumbTintColor="#00D9A3"
              /> */}
              {/* <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>2h</Text>
                <Text style={styles.sliderLabel}>12h</Text>
              </View> */}
            </View>
            <View style={styles.goalTip}>
              <Text style={styles.goalTipText}>
                💡 You can always adjust this later in settings
              </Text>
            </View>
          </Animated.View>
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
            (currentStep === 1 && !firstTask) && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={currentStep === 1 && !firstTask}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === 4 ? "Let's Begin" : 'Continue'}
          </Text>
          <ArrowRight size={20} color="#FFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureDot} />
      <Text style={styles.featureText}>{text}</Text>
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
  dotActive: {
    backgroundColor: '#FF8C42',
    width: 24,
  },
  dotCompleted: {
    backgroundColor: '#00D9A3',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  stepContainer: {
    width: '100%',
    alignItems: 'center',
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  appIconContainer: {
    width: 140,
    height: 140,
    marginTop: 20,
    marginBottom: 32,
  },
  appIcon: {
    width: 140,
    height: 140,
    borderRadius: 32,
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
    marginBottom: 32,
  },
  featureList: {
    width: '100%',
    gap: 16,
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingLeft: 8,
  },
  featureDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF8C42',
  },
  featureText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    lineHeight: 22,
  },
  wheelPreview: {
    marginVertical: 32,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
    marginTop: 24,
  },
  taskDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  taskTime: {
    fontSize: 14,
    color: '#999',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginTop: 8,
  },
  categoryCard: {
    alignItems: 'center',
    gap: 10,
    padding: 16,
    backgroundColor: '#121212',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '30%',
  },
  categoryCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  goalSection: {
    width: '100%',
    marginTop: 16,
  },
  goalValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#00D9A3',
    textAlign: 'center',
    marginBottom: 24,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  goalTip: {
    backgroundColor: '#121212',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 24,
    width: '100%',
  },
  goalTipText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
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
    backgroundColor: '#FF8C42',
  },
  nextButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
});
