import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, X, Clock, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTasks } from '@/contexts/TaskContext';
import { getWeekStart, getWeekDays, getShortDayName, formatMonthDay, addDays, formatTimeFromMinutes, formatDate } from '@/utils/dateHelpers';
import { CATEGORY_CONFIGS } from '@/constants/types';

export default function WeeklyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tasks, toggleTaskCompletion } = useTasks();
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(getWeekStart(new Date()));

  const weekDays = useMemo(() => getWeekDays(selectedWeekStart), [selectedWeekStart]);

  const weekTasks = useMemo(() => {
    return weekDays.map(day => {
      const dateStr = formatDate(day);
      const dayTasks = tasks
        .filter(task => task.date === dateStr)
        .sort((a, b) => a.startTime - b.startTime);
      return { day, tasks: dayTasks };
    });
  }, [tasks, weekDays]);

  const handlePreviousWeek = () => {
    setSelectedWeekStart(addDays(selectedWeekStart, -7));
  };

  const handleNextWeek = () => {
    setSelectedWeekStart(addDays(selectedWeekStart, 7));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X color="#FFF" size={24} />
        </TouchableOpacity>
        
        <View style={styles.weekSelector}>
          <TouchableOpacity onPress={handlePreviousWeek} style={styles.chevronButton}>
            <ChevronLeft color="#FFF" size={20} />
          </TouchableOpacity>
          
          <Text style={styles.weekText}>
            {formatMonthDay(weekDays[0])} - {formatMonthDay(weekDays[6])}
          </Text>
          
          <TouchableOpacity onPress={handleNextWeek} style={styles.chevronButton}>
            <ChevronRight color="#FFF" size={20} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.closeButton} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {weekTasks.map(({ day, tasks: dayTasks }) => (
          <View key={day.toISOString()} style={styles.daySection}>
            <View style={styles.daySectionHeader}>
              <View>
                <Text style={styles.dayName}>{getShortDayName(day)}</Text>
                <Text style={styles.dayDate}>{formatMonthDay(day)}</Text>
              </View>
              <View style={styles.dayStats}>
                <Text style={styles.dayStatsText}>
                  {dayTasks.filter(t => t.completed).length}/{dayTasks.length}
                </Text>
              </View>
            </View>

            {dayTasks.length === 0 ? (
              <View style={styles.emptyDay}>
                <Clock size={20} color="#444" />
                <Text style={styles.emptyDayText}>No tasks</Text>
              </View>
            ) : (
              <View style={styles.tasksList}>
                {dayTasks.map(task => {
                  const config = CATEGORY_CONFIGS[task.category];
                  return (
                    <TouchableOpacity
                      key={task.id}
                      style={styles.taskItem}
                      onPress={() => toggleTaskCompletion(task.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.taskColorDot, { backgroundColor: config.color }]} />
                      <View style={styles.taskInfo}>
                        <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                          {task.title}
                        </Text>
                        <Text style={styles.taskTime}>{formatTimeFromMinutes(task.startTime)}</Text>
                      </View>
                      <View style={[styles.taskCheckbox, task.completed && { backgroundColor: config.color, borderColor: config.color }]}>
                        {task.completed && <Check size={14} color="#FFF" strokeWidth={3} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#1A1A2E',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekSelector: {
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
  weekText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    minWidth: 180,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 16,
  },
  daySection: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  daySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dayName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  dayDate: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  dayStats: {
    backgroundColor: '#8B7AC720',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  dayStatsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B7AC7',
  },
  emptyDay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyDayText: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
  },
  tasksList: {
    gap: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#0A0A0A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  taskColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  taskTime: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  taskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
