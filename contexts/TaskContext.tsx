import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Task } from '@/constants/types';
import { formatDate } from '@/utils/dateHelpers';

const STORAGE_KEY = '@planner_tasks';

export const [TaskProvider, useTasks] = createContextHook(() => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadTasks = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTasks(JSON.parse(stored));
      }
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

  const addTask = useCallback((task: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
    };
    setTasks(prev => [...prev, newTask]);
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => task.id === id ? { ...task, ...updates } : task));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  }, []);

  const getTasksForDate = useCallback((date: Date): Task[] => {
    const dateStr = formatDate(date);
    return tasks.filter(task => task.date === dateStr).sort((a, b) => a.startTime - b.startTime);
  }, [tasks]);

  const selectedDateTasks = useMemo(() => {
    return getTasksForDate(selectedDate);
  }, [getTasksForDate, selectedDate]);

  const scheduledMinutes = useMemo(() => {
    return selectedDateTasks.reduce((total, task) => total + task.duration, 0);
  }, [selectedDateTasks]);

  return useMemo(() => ({
    tasks,
    selectedDate,
    setSelectedDate,
    selectedDateTasks,
    scheduledMinutes,
    isLoading,
    addTask,
    updateTask,
    deleteTask,
    getTasksForDate,
  }), [tasks, selectedDate, selectedDateTasks, scheduledMinutes, isLoading, addTask, updateTask, deleteTask, getTasksForDate]);
});
