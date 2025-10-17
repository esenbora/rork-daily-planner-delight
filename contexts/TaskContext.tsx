import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Task } from '@/constants/types';
import { formatDate } from '@/utils/dateHelpers';

const STORAGE_KEY = '@planner_tasks';
const ONBOARDING_COMPLETE_KEY = '@planner_onboarding_complete';

export const [TaskProvider, useTasks] = createContextHook(() => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);

  const loadTasks = useCallback(async () => {
    try {
      const [storedTasks, onboardingStatus] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY),
      ]);
      
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
      
      setHasCompletedOnboarding(onboardingStatus === 'true');
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveTasks = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Failed to save tasks:', error);
    }
  }, [tasks]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (!isLoading) {
      saveTasks();
    }
  }, [tasks, isLoading, saveTasks]);

  const addTask = useCallback((task: Omit<Task, 'id' | 'order'>) => {
    setTasks(prev => {
      const maxOrder = prev.length > 0 ? Math.max(...prev.map(t => t.order || 0)) : 0;
      const newTask: Task = {
        ...task,
        id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
        completed: task.completed ?? false,
        repeatType: task.repeatType ?? 'none',
        order: maxOrder + 1,
      };
      return [...prev, newTask];
    });
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => task.id === id ? { ...task, ...updates } : task));
  }, []);

  const toggleTaskCompletion = useCallback((id: string) => {
    setTasks(prev => prev.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  }, []);

  const getTasksForDate = useCallback((date: Date): Task[] => {
    const dateStr = formatDate(date);
    return tasks
      .filter(task => task.date === dateStr)
      .sort((a, b) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        if (orderA !== orderB) return orderA - orderB;
        return a.startTime - b.startTime;
      });
  }, [tasks]);

  const selectedDateTasks = useMemo(() => {
    return getTasksForDate(selectedDate);
  }, [getTasksForDate, selectedDate]);

  const scheduledMinutes = useMemo(() => {
    return selectedDateTasks.reduce((total, task) => total + task.duration, 0);
  }, [selectedDateTasks]);

  const markOnboardingComplete = useCallback(() => {
    setHasCompletedOnboarding(true);
    AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
  }, []);

  const reorderTasks = useCallback((taskIds: string[]) => {
    setTasks(prev => {
      const updated = [...prev];
      taskIds.forEach((id, index) => {
        const taskIndex = updated.findIndex(t => t.id === id);
        if (taskIndex !== -1) {
          updated[taskIndex] = { ...updated[taskIndex], order: index };
        }
      });
      return updated;
    });
  }, []);

  return {
    tasks,
    selectedDate,
    setSelectedDate,
    selectedDateTasks,
    scheduledMinutes,
    isLoading,
    hasCompletedOnboarding,
    addTask,
    updateTask,
    deleteTask,
    getTasksForDate,
    markOnboardingComplete,
    toggleTaskCompletion,
    reorderTasks,
  };
});
