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
import { ChevronLeft, ChevronRight, Plus, Crown, Clock, Calendar, CalendarDays, BarChart3, Target } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTasks } from '@/contexts/TaskContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { TimeWheel } from '@/components/TimeWheel';
import { formatMonthDay, getDayName, addDays } from '@/utils/dateHelpers';
import { AddTaskModal } from '@/components/AddTaskModal';
import { OnboardingFlow } from '@/components/OnboardingFlow';
import { Task } from '@/constants/types';
import { TaskItem } from '@/components/TaskItem';
import { TaskFilters, FilterState } from '@/components/TaskFilters';

export default function PlannerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { selectedDate, setSelectedDate, selectedDateTasks, scheduledMinutes, isLoading, hasCompletedOnboarding, markOnboardingComplete, deleteTask, toggleTaskCompletion } = useTasks();
  const { canAddMoreTasks, isPremium } = useSubscription();
  const [isAddModalVisible, setIsAddModalVisible] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
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
      <View style={[styles.backgroundGradient, { height: insets.top + 200 }]} />
      <StatusBar barStyle="light-content" />
      
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => router.push('/subscription')}
        >
          <View style={styles.premiumBadge}>
            <Crown color="#FFD700" size={20} fill={isPremium ? "#FFD700" : "none"} />
          </View>
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
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => router.push('/weekly')}
          >
            <CalendarDays color="#FFF" size={20} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => router.push('/statistics')}
          >
            <BarChart3 color="#FFF" size={20} />
          </TouchableOpacity>
        </View>
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
              <Clock size={64} color="#8B7AC7" strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>Your Day Awaits</Text>
            <Text style={styles.emptyDescription}>
              Start planning by adding your first task
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={handleAddButtonPress}
            >
              <Plus size={18} color="#FFF" strokeWidth={2.5} />
              <Text style={styles.emptyButtonText}>Add Your First Task</Text>
            </TouchableOpacity>
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
                  <Calendar size={18} color="#8B7AC7" />
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
                  <View style={[styles.statIcon, { backgroundColor: '#4A9B9B20' }]}>
                    <Clock size={20} color="#4A9B9B" />
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={styles.statValue}>{Math.round(scheduledMinutes / 60)}h</Text>
                    <Text style={styles.statLabel}>Scheduled</Text>
                  </View>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: '#7AC79B20' }]}>
                    <Clock size={20} color="#7AC79B" />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
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
    backgroundColor: '#1A1A2E',
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
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
  premiumBadge: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: 'rgba(139, 122, 199, 0.1)',
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: 'rgba(139, 122, 199, 0.2)',
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
    backgroundColor: '#8B7AC7',
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
    color: '#8B7AC7',
    backgroundColor: '#8B7AC720',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },

  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1A2E',
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
    backgroundColor: '#1A1A2E',
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
    backgroundColor: '#6B8ACF',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    marginTop: 12,
    shadowColor: '#6B8ACF',
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
    backgroundColor: '#8B7AC7',
    borderRadius: 16,
    paddingVertical: 18,
    gap: 8,
    shadowColor: '#8B7AC7',
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
});
