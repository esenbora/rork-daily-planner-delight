import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Modal,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Plus, Crown, Clock, Calendar, CalendarDays, BarChart3, Target, Settings, Menu, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTasks } from '@/contexts/TaskContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { TimeWheel } from '@/components/TimeWheel';
import { formatMonthDay, getDayName, addDays, formatDate } from '@/utils/dateHelpers';
import { AddTaskModal } from '@/components/AddTaskModal';
import { OnboardingFlow } from '@/components/OnboardingFlow';
import { Task } from '@/constants/types';
import { TaskItem } from '@/components/TaskItem';
import { TaskFilters, FilterState } from '@/components/TaskFilters';
import { logAnalyticsEvent } from '@/lib/firebase';

export default function PlannerScreen() {
  // Debug: Track component mount
  console.log('🔍 PlannerScreen: Component rendering');

  const [debugInfo, setDebugInfo] = useState<string>('Initializing...');

  let insets;
  let router;
  let taskContext;
  let subscriptionContext;

  try {
    console.log('🔍 PlannerScreen: Getting insets');
    insets = useSafeAreaInsets();
    setDebugInfo('SafeArea OK');
  } catch (error) {
    console.error('❌ SafeAreaInsets failed:', error);
    setDebugInfo('SafeArea FAILED: ' + (error as Error).message);
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: '#ff0000', fontSize: 18, fontWeight: 'bold' }}>SafeAreaInsets Error</Text>
        <Text style={{ color: '#fff', marginTop: 10, textAlign: 'center' }}>{(error as Error).message}</Text>
      </View>
    );
  }

  try {
    console.log('🔍 PlannerScreen: Getting router');
    router = useRouter();
    setDebugInfo('Router OK');
  } catch (error) {
    console.error('❌ Router failed:', error);
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: '#ff0000', fontSize: 18, fontWeight: 'bold' }}>Router Error</Text>
        <Text style={{ color: '#fff', marginTop: 10, textAlign: 'center' }}>{(error as Error).message}</Text>
      </View>
    );
  }

  try {
    console.log('🔍 PlannerScreen: Getting task context');
    taskContext = useTasks();
    setDebugInfo('TaskContext OK');
  } catch (error) {
    console.error('❌ TaskContext failed:', error);
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: '#ff0000', fontSize: 18, fontWeight: 'bold' }}>TaskContext Error</Text>
        <Text style={{ color: '#fff', marginTop: 10, textAlign: 'center' }}>{(error as Error).message}</Text>
      </View>
    );
  }

  try {
    console.log('🔍 PlannerScreen: Getting subscription context');
    subscriptionContext = useSubscription();
    setDebugInfo('SubscriptionContext OK');
  } catch (error) {
    console.error('❌ SubscriptionContext failed:', error);
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: '#ff0000', fontSize: 18, fontWeight: 'bold' }}>SubscriptionContext Error</Text>
        <Text style={{ color: '#fff', marginTop: 10, textAlign: 'center' }}>{(error as Error).message}</Text>
      </View>
    );
  }

  const { selectedDate, setSelectedDate, selectedDateTasks, scheduledMinutes, isLoading, hasCompletedOnboarding, markOnboardingComplete, deleteTask, toggleTaskCompletion, addTask } = taskContext;
  const { canAddMoreTasks, isPremium } = subscriptionContext;

  console.log('🔍 PlannerScreen: Context values -', {
    isLoading,
    hasCompletedOnboarding,
    tasksCount: selectedDateTasks?.length,
    isPremium,
  });

  const [isAddModalVisible, setIsAddModalVisible] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isMenuVisible, setIsMenuVisible] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    categories: [],
    priorities: [],
    showCompleted: true,
  });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const handlePreviousDay = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    setSelectedDate(addDays(selectedDate, -1));
    logAnalyticsEvent('date_navigation', {
      direction: 'previous',
      date: addDays(selectedDate, -1).toISOString(),
    });
  };

  const handleNextDay = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    setSelectedDate(addDays(selectedDate, 1));
    logAnalyticsEvent('date_navigation', {
      direction: 'next',
      date: addDays(selectedDate, 1).toISOString(),
    });
  };

  // Track screen view
  useEffect(() => {
    if (!isLoading && hasCompletedOnboarding) {
      logAnalyticsEvent('screen_view', {
        screen_name: 'planner',
        screen_class: 'PlannerScreen',
      });
    }
  }, [isLoading, hasCompletedOnboarding]);

  React.useEffect(() => {
    if (!isLoading && hasCompletedOnboarding) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading, hasCompletedOnboarding, fadeAnim, scaleAnim]);

  const handleAddButtonPress = () => {
    if (!canAddMoreTasks(selectedDateTasks.length)) {
      logAnalyticsEvent('task_limit_reached', {
        current_count: selectedDateTasks.length,
        is_premium: isPremium,
      });
      router.push('/subscription');
      return;
    }

    logAnalyticsEvent('add_task_button_tapped', {
      task_count: selectedDateTasks.length,
    });

    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setEditingTask(null);
      setIsAddModalVisible(true);
    });
  };

  const handleEditTask = (task: Task) => {
    logAnalyticsEvent('edit_task_tapped', {
      task_id: task.id,
      category: task.category,
    });
    setEditingTask(task);
    setIsAddModalVisible(true);
  };

  const filteredTasks = React.useMemo(() => {
    return selectedDateTasks.filter(task => {
      if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.categories.length > 0 && !filters.categories.includes(task.category)) {
        return false;
      }
      if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority || 'low')) {
        return false;
      }
      if (!filters.showCompleted && task.completed) {
        return false;
      }
      return true;
    });
  }, [selectedDateTasks, filters]);

  if (isLoading) {
    console.log('🔍 PlannerScreen: Showing loading screen');
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle="light-content" />
        <View style={{ position: 'absolute', top: 50, left: 0, right: 0, backgroundColor: '#ff0000', padding: 10 }}>
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>DEBUG: Loading...</Text>
        </View>
      </View>
    );
  }

  const handleOnboardingComplete = async (firstTask?: {
    title: string;
    category: string;
    startHour: number;
    startMinute: number;
    duration: number;
  }) => {
    if (firstTask) {
      try {
        const startTime = firstTask.startHour * 60 + firstTask.startMinute;
        await addTask({
          title: firstTask.title,
          category: firstTask.category as any,
          startTime: startTime,
          duration: firstTask.duration,
          date: formatDate(new Date()),
          completed: false,
          priority: 'medium',
          repeatType: 'none',
        });
      } catch (error) {
        console.error('Failed to add first task:', error);
      }
    }
    markOnboardingComplete();

    // Redirect to paywall after onboarding
    router.push('/subscription?source=onboarding');
  };

  if (!hasCompletedOnboarding) {
    console.log('🔍 PlannerScreen: Showing onboarding flow');
    return (
      <View style={{ flex: 1 }}>
        <View style={{ position: 'absolute', top: 50, left: 0, right: 0, backgroundColor: '#0000ff', padding: 10, zIndex: 9999 }}>
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>DEBUG: Onboarding</Text>
        </View>
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      </View>
    );
  }

  console.log('🔍 PlannerScreen: Rendering main UI');
  return (
    <View style={styles.container}>
      <View style={{ position: 'absolute', top: 50, left: 0, right: 0, backgroundColor: '#00ff00', padding: 10, zIndex: 9999 }}>
        <Text style={{ color: '#000', textAlign: 'center', fontWeight: 'bold' }}>DEBUG: Main UI Rendering - {isPremium ? 'Premium' : 'Free'}</Text>
      </View>
      <View style={[styles.backgroundGradient, { height: insets.top + 200 }]} />
      <StatusBar barStyle="light-content" />
      
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setIsMenuVisible(true)}
        >
          <Menu color="#FFF" size={24} />
        </TouchableOpacity>

        <View style={styles.dateSelector}>
          <TouchableOpacity onPress={handlePreviousDay} style={styles.chevronButton}>
            <ChevronLeft color="#FFF" size={20} />
          </TouchableOpacity>

          <View style={styles.dateInfo}>
            <Text style={styles.dateText}>{formatMonthDay(selectedDate)}</Text>
            <Text style={styles.dayText}>{getDayName(selectedDate)}</Text>
          </View>

          <TouchableOpacity onPress={handleNextDay} style={styles.chevronButton}>
            <ChevronRight color="#FFF" size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {selectedDateTasks.length === 0 ? (
          <Animated.View 
            style={[
              styles.emptyState,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.emptyIcon}>
              <Clock size={64} color="#FF8C42" strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>Your Day Awaits</Text>
            <Text style={styles.emptyDescription}>
              Start planning by adding your first task. Tap "New Task" below to begin.
            </Text>
          </Animated.View>
        ) : (
          <Animated.View 
            style={[
              styles.mainContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.wheelSection}>
              <TimeWheel 
                tasks={selectedDateTasks} 
                scheduledMinutes={scheduledMinutes}
                dayName={getDayName(selectedDate)}
              />
            </View>

            <View style={styles.tasksSection}>
              <View style={styles.tasksSectionHeader}>
                <View style={styles.tasksSectionTitleContainer}>
                  <Calendar size={18} color="#FF8C42" />
                  <Text style={styles.tasksSectionTitle}>Today&apos;s Tasks</Text>
                </View>
                <Text style={styles.taskCount}>{selectedDateTasks.length}</Text>
              </View>

              <TaskFilters filters={filters} onFiltersChange={setFilters} />

              {filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onEdit={() => handleEditTask(task)}
                  onDelete={() => deleteTask(task.id)}
                  onToggleComplete={() => toggleTaskCompletion(task.id)}
                />
              ))}

              {filteredTasks.length > 0 && (
                <TouchableOpacity 
                  style={styles.focusModeButton}
                  onPress={() => router.push(`/focus?taskId=${filteredTasks[0].id}`)}
                >
                  <Target size={20} color="#FFF" />
                  <Text style={styles.focusModeText}>Start Focus Mode</Text>
                </TouchableOpacity>
              )}

              <View style={styles.statsCard}>
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: 'rgba(255, 140, 66, 0.15)' }]}>
                    <Clock size={20} color="#FF8C42" />
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={styles.statValue}>{Math.round(scheduledMinutes / 60)}h</Text>
                    <Text style={styles.statLabel}>Scheduled</Text>
                  </View>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: 'rgba(0, 217, 163, 0.15)' }]}>
                    <Clock size={20} color="#00D9A3" />
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={styles.statValue}>{Math.round((1440 - scheduledMinutes) / 60)}h</Text>
                    <Text style={styles.statLabel}>Free Time</Text>
                  </View>
                </View>
              </View>
            </View>

            {!isPremium && selectedDateTasks.length >= 3 && (
              <TouchableOpacity 
                style={styles.upgradeCard}
                onPress={() => router.push('/subscription')}
              >
                <View style={styles.upgradeIconContainer}>
                  <Crown size={28} color="#FFD700" fill="#FFD700" />
                </View>
                <View style={styles.upgradeContent}>
                  <Text style={styles.upgradeTitle}>Unlock Premium</Text>
                  <Text style={styles.upgradeDescription}>
                    Get unlimited tasks, templates & more
                  </Text>
                </View>
                <ChevronRight color="#FFD700" size={24} />
              </TouchableOpacity>
            )}
          </Animated.View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddButtonPress}
          >
            <Plus color="#FFF" size={20} strokeWidth={2.5} />
            <Text style={styles.addButtonText}>New Task</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setIsAddModalVisible(false);
          setEditingTask(null);
        }}
      >
        <AddTaskModal
          selectedDate={selectedDate}
          editingTask={editingTask}
          onClose={() => {
            setIsAddModalVisible(false);
            setEditingTask(null);
          }}
        />
      </Modal>

      <Modal
        visible={isMenuVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <View style={styles.menuOverlay}>
          <TouchableOpacity
            style={styles.menuBackdrop}
            activeOpacity={1}
            onPress={() => setIsMenuVisible(false)}
          />
          <View style={[styles.menuContainer, { paddingTop: insets.top }]}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Menu</Text>
              <TouchableOpacity
                style={styles.menuCloseButton}
                onPress={() => setIsMenuVisible(false)}
              >
                <X color="#FFF" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.menuItems}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setIsMenuVisible(false);
                  router.push('/subscription');
                }}
              >
                <View style={[styles.menuItemIcon, { backgroundColor: 'rgba(255, 215, 0, 0.15)' }]}>
                  <Crown color="#FFD700" size={24} fill={isPremium ? "#FFD700" : "none"} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>
                    {isPremium ? 'Premium Account' : 'Upgrade to Premium'}
                  </Text>
                  <Text style={styles.menuItemDescription}>
                    {isPremium ? 'Manage your subscription' : 'Unlock unlimited tasks & features'}
                  </Text>
                </View>
                <ChevronRight color="#888" size={20} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setIsMenuVisible(false);
                  router.push('/weekly');
                }}
              >
                <View style={[styles.menuItemIcon, { backgroundColor: 'rgba(255, 140, 66, 0.15)' }]}>
                  <CalendarDays color="#FF8C42" size={24} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>Weekly View</Text>
                  <Text style={styles.menuItemDescription}>See your week at a glance</Text>
                </View>
                <ChevronRight color="#888" size={20} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setIsMenuVisible(false);
                  router.push('/statistics');
                }}
              >
                <View style={[styles.menuItemIcon, { backgroundColor: 'rgba(0, 217, 163, 0.15)' }]}>
                  <BarChart3 color="#00D9A3" size={24} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>Statistics</Text>
                  <Text style={styles.menuItemDescription}>Track your productivity</Text>
                </View>
                <ChevronRight color="#888" size={20} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setIsMenuVisible(false);
                  router.push('/settings');
                }}
              >
                <View style={[styles.menuItemIcon, { backgroundColor: 'rgba(255, 140, 66, 0.15)' }]}>
                  <Settings color="#FF8C42" size={24} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>Settings</Text>
                  <Text style={styles.menuItemDescription}>Customize your experience</Text>
                </View>
                <ChevronRight color="#888" size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundGradient: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    zIndex: 10,
    position: 'relative' as const,
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chevronButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
  },

  dateInfo: {
    alignItems: 'center',
    minWidth: 120,
  },
  dateText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 140,
    height: 140,
    backgroundColor: 'rgba(255, 140, 66, 0.1)',
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: 'rgba(255, 140, 66, 0.2)',
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8C42',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  mainContent: {
    paddingHorizontal: 20,
  },
  wheelSection: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 8,
  },
  tasksSection: {
    gap: 12,
  },
  tasksSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tasksSectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tasksSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  taskCount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00D9A3',
    backgroundColor: 'rgba(0, 217, 163, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },

  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#0A0A0A',
    borderRadius: 18,
    padding: 20,
    marginTop: 12,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  upgradeIconContainer: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  upgradeContent: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  upgradeDescription: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  focusModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00D9A3',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    marginTop: 12,
    shadowColor: '#00D9A3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  focusModeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#0A0A0A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8C42',
    borderRadius: 16,
    paddingVertical: 18,
    gap: 8,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  menuOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  menuContainer: {
    backgroundColor: '#0A0A0A',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 24,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  menuCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  menuItems: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
});
