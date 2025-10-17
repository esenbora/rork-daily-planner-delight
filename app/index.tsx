import React, { useState, useRef } from 'react';
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
import { ChevronLeft, ChevronRight, Plus, List, Crown, LayoutGrid, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTasks } from '@/contexts/TaskContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { TimeWheel } from '@/components/TimeWheel';
import { formatMonthDay, getDayName, addDays } from '@/utils/dateHelpers';
import { AddTaskModal } from '@/components/AddTaskModal';
import { TaskList } from '@/components/TaskList';
import { OnboardingFlow } from '@/components/OnboardingFlow';
import { Task } from '@/constants/types';

export default function PlannerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { selectedDate, setSelectedDate, selectedDateTasks, scheduledMinutes, isLoading, hasCompletedOnboarding, markOnboardingComplete } = useTasks();
  const { canAddMoreTasks, isPremium } = useSubscription();
  const [isAddModalVisible, setIsAddModalVisible] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'wheel' | 'list'>('wheel');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const viewModeAnim = useRef(new Animated.Value(0)).current;

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
  };

  const toggleViewMode = () => {
    const newMode = viewMode === 'wheel' ? 'list' : 'wheel';
    Animated.timing(viewModeAnim, {
      toValue: newMode === 'list' ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setViewMode(newMode);
  };

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
      router.push('/subscription');
      return;
    }

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
    setEditingTask(task);
    setIsAddModalVisible(true);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle="light-content" />
      </View>
    );
  }

  if (!hasCompletedOnboarding) {
    return <OnboardingFlow onComplete={markOnboardingComplete} />;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.backgroundHeader, { height: insets.top }]} />
      <StatusBar barStyle="light-content" />
      
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={toggleViewMode}
        >
          {viewMode === 'wheel' ? (
            <List color="#FFF" size={24} />
          ) : (
            <LayoutGrid color="#FFF" size={24} />
          )}
        </TouchableOpacity>
        
        <View style={styles.dateSelector}>
          <TouchableOpacity onPress={handlePreviousDay} style={styles.chevronButton}>
            <ChevronLeft color="#FFF" size={20} />
          </TouchableOpacity>
          
          <View style={styles.dateInfo}>
            <Text style={styles.dateText}>{formatMonthDay(selectedDate)}</Text>
          </View>
          
          <TouchableOpacity onPress={handleNextDay} style={styles.chevronButton}>
            <ChevronRight color="#FFF" size={20} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => router.push('/subscription')}
        >
          <View style={styles.premiumBadge}>
            <Crown color="#FFD700" size={20} fill={isPremium ? "#FFD700" : "none"} />
          </View>
        </TouchableOpacity>
      </View>

      {viewMode === 'wheel' ? (
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {selectedDateTasks.length === 0 ? (
            <Animated.View 
              style={[
                styles.emptyWheelState,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.emptyWheelIcon}>
                <Clock size={64} color="#333" strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyWheelTitle}>Your Day Awaits</Text>
              <Text style={styles.emptyWheelDescription}>
                Start planning by adding your first task
              </Text>
              <TouchableOpacity 
                style={styles.emptyWheelButton}
                onPress={handleAddButtonPress}
              >
                <Plus size={18} color="#FFF" strokeWidth={2.5} />
                <Text style={styles.emptyWheelButtonText}>Add Your First Task</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Animated.View 
              style={[
                styles.wheelContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <TimeWheel 
                tasks={selectedDateTasks} 
                scheduledMinutes={scheduledMinutes}
                dayName={getDayName(selectedDate)}
              />
            </Animated.View>
          )}

          {selectedDateTasks.length > 0 && (
            <Animated.View 
              style={[
                styles.statsContainer,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{selectedDateTasks.length}</Text>
              <Text style={styles.statLabel}>Tasks</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round(scheduledMinutes / 60)}h</Text>
              <Text style={styles.statLabel}>Scheduled</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round((1440 - scheduledMinutes) / 60)}h</Text>
              <Text style={styles.statLabel}>Free</Text>
            </View>
            </Animated.View>
          )}

          {!isPremium && selectedDateTasks.length >= 3 && (
            <TouchableOpacity 
              style={styles.upgradeCard}
              onPress={() => router.push('/subscription')}
            >
              <View style={styles.upgradeIconContainer}>
                <Crown size={32} color="#FFD700" fill="#FFD700" />
              </View>
              <View style={styles.upgradeContent}>
                <Text style={styles.upgradeTitle}>Unlock Premium</Text>
                <Text style={styles.upgradeDescription}>
                  Get unlimited tasks, templates, analytics & more
                </Text>
              </View>
              <ChevronRight color="#FFD700" size={24} />
            </TouchableOpacity>
          )}
        </ScrollView>
      ) : (
        <TaskList 
          tasks={selectedDateTasks}
          onEditTask={handleEditTask}
        />
      )}

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddButtonPress}
          >
            <Plus color="#0A0A0A" size={20} strokeWidth={2.5} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chevronButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
  },
  premiumBadge: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateInfo: {
    alignItems: 'center',
    minWidth: 80,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  wheelContainer: {
    marginBottom: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 32,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#1A1A1A',
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 24,
    borderWidth: 2,
    borderColor: '#FFD70040',
  },
  upgradeIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#FFD70020',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  upgradeContent: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  upgradeDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A0A0A',
    letterSpacing: 0.3,
  },
  viewContainer: {
    flex: 1,
  },
  emptyWheelState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyWheelIcon: {
    width: 140,
    height: 140,
    backgroundColor: '#121212',
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  emptyWheelTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyWheelDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyWheelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A9B9B',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyWheelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
});
