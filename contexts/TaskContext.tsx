import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Task, TaskTemplate, DEFAULT_TEMPLATES, CustomCategory, CATEGORY_CONFIGS } from '@/constants/types';
import { formatDate } from '@/utils/dateHelpers';
import {
  subscribeToTasks,
  addTaskToFirestore,
  updateTaskInFirestore,
  deleteTaskFromFirestore,
  toggleTaskCompletion as toggleTaskInFirestore,
  reorderTasksInFirestore,
  migrateTasksToFirestore,
  getCurrentUserId,
  isUserAuthenticated,
} from '@/lib/firestore-sync';
import { logAnalyticsEvent, logError } from '@/lib/firebase';
import {
  scheduleTaskNotification,
  cancelAllTaskNotifications,
} from '@/lib/notifications';

const STORAGE_KEY = '@planner_tasks';
const TEMPLATES_STORAGE_KEY = '@planner_templates';
const CUSTOM_CATEGORIES_KEY = '@planner_custom_categories';
const ONBOARDING_COMPLETE_KEY = '@planner_onboarding_complete';
const MIGRATION_COMPLETE_KEY = '@planner_migration_complete';

// Default categories (always available)
const DEFAULT_CATEGORIES: CustomCategory[] = Object.keys(CATEGORY_CONFIGS).map(key => ({
  id: key,
  name: CATEGORY_CONFIGS[key as keyof typeof CATEGORY_CONFIGS].label,
  color: CATEGORY_CONFIGS[key as keyof typeof CATEGORY_CONFIGS].color,
  gradient: CATEGORY_CONFIGS[key as keyof typeof CATEGORY_CONFIGS].gradient,
  createdAt: new Date().toISOString(),
  isDefault: true,
}));

export const [TaskProvider, useTasks] = createContextHook(() => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([...DEFAULT_TEMPLATES]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(DEFAULT_CATEGORIES);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [useFirestore, setUseFirestore] = useState<boolean>(false);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const migrationAttemptedRef = useRef<boolean>(false);
  const savingRef = useRef<boolean>(false); // Prevents race condition between manual save and auto-save

  // Load tasks from AsyncStorage (fallback/offline mode)
  const loadFromAsyncStorage = useCallback(async () => {
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
      logError(error as Error, { context: 'loadFromAsyncStorage' });
      console.error('Failed to load tasks from AsyncStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save tasks to AsyncStorage (as cache/fallback)
  const saveToAsyncStorage = useCallback(async (tasksToSave: Task[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasksToSave));
    } catch (error) {
      logError(error as Error, { context: 'saveToAsyncStorage' });
      console.error('Failed to save tasks to AsyncStorage:', error);
    }
  }, []);

  // Migrate local tasks to Firestore (one-time operation)
  const attemptMigration = useCallback(async (userId: string) => {
    if (migrationAttemptedRef.current) return;

    try {
      migrationAttemptedRef.current = true;

      const migrationComplete = await AsyncStorage.getItem(MIGRATION_COMPLETE_KEY);
      if (migrationComplete === 'true') {
        console.log('Migration already completed, skipping');
        return;
      }

      const storedTasks = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedTasks) {
        const localTasks: Task[] = JSON.parse(storedTasks);
        if (localTasks.length > 0) {
          console.log(`Migrating ${localTasks.length} tasks to Firestore...`);
          await migrateTasksToFirestore(userId, localTasks);
          await AsyncStorage.setItem(MIGRATION_COMPLETE_KEY, 'true');
          console.log('Migration completed successfully');
        }
      }
    } catch (error) {
      logError(error as Error, { context: 'attemptMigration', userId });
      console.error('Migration failed:', error);
    }
  }, []);

  // Initialize: Check auth and set up appropriate data source
  useEffect(() => {
    const initialize = async () => {
      console.log('📋 TaskContext: Starting initialization...');

      try {
        let authenticated = false;
        let userId: string | null = null;

        try {
          authenticated = isUserAuthenticated();
          userId = getCurrentUserId();
          console.log('📋 Authentication:', { authenticated, hasUserId: !!userId });
        } catch (authError) {
          console.warn('⚠️  Could not check authentication:', authError);
        }

        if (authenticated && userId) {
          console.log('📋 User authenticated, using Firestore');
          setUseFirestore(true);
          setIsSyncing(true);

          try {
            await attemptMigration(userId);

            const unsubscribe = subscribeToTasks(
              userId,
              (firestoreTasks) => {
                setTasks(firestoreTasks);
                setIsLoading(false);
                setIsSyncing(false);
                setSyncError(null);
                saveToAsyncStorage(firestoreTasks);
              },
              (error) => {
                logError(error, { context: 'firestoreSubscription' });
                console.error('❌ Firestore subscription error:', error);
                setSyncError('Failed to sync. Using offline mode.');
                setIsSyncing(false);
                loadFromAsyncStorage();
              }
            );

            unsubscribeRef.current = unsubscribe;
          } catch (error) {
            logError(error as Error, { context: 'firestoreInitialization' });
            console.error('❌ Failed to initialize Firestore:', error);
            setSyncError('Sync unavailable. Using offline mode.');
            setUseFirestore(false);
            await loadFromAsyncStorage();
          }
        } else {
          console.log('📋 No user authentication, using AsyncStorage');
          setUseFirestore(false);
          await loadFromAsyncStorage();
        }

        console.log('✅ TaskContext initialization complete');
      } catch (error) {
        console.error('❌ Fatal TaskContext error:', error);
        logError(error as Error, { context: 'TaskContext.initialize' });
        setUseFirestore(false);
        setIsSyncing(false);
        try {
          await loadFromAsyncStorage();
        } catch {
          setTasks([]);
          setIsLoading(false);
        }
      }
    };

    initialize().catch(() => {
      setTasks([]);
      setIsLoading(false);
    });

    return () => {
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
        } catch (error) {
          console.error('❌ Error unsubscribing:', error);
        }
      }
    };
  }, [attemptMigration, loadFromAsyncStorage, saveToAsyncStorage]);

  // Save to AsyncStorage when tasks change (offline mode only)
  // NOTE: We removed tasks.length > 0 check to allow saving even empty task list (first task scenario)
  // NOTE: savingRef prevents race condition between manual saves (addTask/updateTask/deleteTask) and auto-save
  useEffect(() => {
    if (!useFirestore && !isLoading && !savingRef.current) {
      console.log('💾 Auto-save triggered, tasks count:', tasks.length);
      saveToAsyncStorage(tasks);
    }
  }, [tasks, useFirestore, isLoading, saveToAsyncStorage]);

  // Add task (works with both Firestore and AsyncStorage)
  const addTask = useCallback(
    async (task: Omit<Task, 'id' | 'order'>) => {
      const userId = getCurrentUserId();

      if (useFirestore && userId) {
        // Add to Firestore
        try {
          console.log('📋 Adding task to Firestore...');
          const maxOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.order || 0)) : 0;
          const taskWithOrder = { ...task, order: maxOrder + 1 };

          await addTaskToFirestore(userId, taskWithOrder);

          // Schedule notification
          const fullTask = { ...taskWithOrder, id: 'temp', completed: false, repeatType: 'none' as const };
          await scheduleTaskNotification(fullTask);

          console.log('✅ Task added to Firestore successfully');
          // Real-time listener will update state automatically
        } catch (error) {
          logError(error as Error, { context: 'addTask', userId });
          console.error('❌ Failed to add task to Firestore:', error);
          throw error;
        }
      } else {
        // Add to AsyncStorage (offline mode)
        console.log('📋 Adding task to AsyncStorage (offline mode)...');

        try {
          // Set saving flag to prevent auto-save race condition
          savingRef.current = true;

          // Create the new task synchronously to capture it
          const maxOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.order || 0)) : 0;
          const newTask: Task = {
            ...task,
            id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
            completed: task.completed ?? false,
            repeatType: task.repeatType ?? 'none',
            order: maxOrder + 1,
          };

          console.log('📋 New task created:', newTask.title);

          // Update state
          const updatedTasks = [...tasks, newTask];
          setTasks(updatedTasks);

          // Schedule notification
          await scheduleTaskNotification(newTask);

          // CRITICAL: Save to AsyncStorage immediately
          console.log('💾 Saving to AsyncStorage...');
          await saveToAsyncStorage(updatedTasks);
          console.log('✅ Task saved to AsyncStorage successfully');

          return newTask;
        } catch (error) {
          console.error('❌ Failed to add task to AsyncStorage:', error);
          logError(error as Error, { context: 'addTask_AsyncStorage' });
          throw error;
        } finally {
          // Always clear the saving flag
          savingRef.current = false;
        }
      }
    },
    [useFirestore, tasks, saveToAsyncStorage]
  );

  // Update task
  const updateTask = useCallback(
    async (id: string, updates: Partial<Task>) => {
      const userId = getCurrentUserId();

      if (useFirestore && userId) {
        try {
          await updateTaskInFirestore(userId, id, updates);
          // Real-time listener will update state
        } catch (error) {
          logError(error as Error, { context: 'updateTask', userId, taskId: id });
          console.error('Failed to update task in Firestore:', error);
          throw error;
        }
      } else {
        // AsyncStorage mode - prevent race condition with auto-save
        try {
          savingRef.current = true;
          const updatedTasks = tasks.map(task => (task.id === id ? { ...task, ...updates } : task));
          setTasks(updatedTasks);
          await saveToAsyncStorage(updatedTasks);
        } finally {
          savingRef.current = false;
        }
      }
    },
    [useFirestore, tasks, saveToAsyncStorage]
  );

  // Toggle task completion
  const toggleTaskCompletion = useCallback(
    async (id: string) => {
      const userId = getCurrentUserId();
      const task = tasks.find(t => t.id === id);

      if (!task) return;

      const newCompletedState = !task.completed;

      if (useFirestore && userId) {
        try {
          await toggleTaskInFirestore(userId, id, newCompletedState);
          // Real-time listener will update state
        } catch (error) {
          logError(error as Error, { context: 'toggleTaskCompletion', userId, taskId: id });
          console.error('Failed to toggle task completion:', error);
          throw error;
        }
      } else {
        // AsyncStorage mode - prevent race condition with auto-save
        try {
          savingRef.current = true;
          const updatedTasks = tasks.map(task => (task.id === id ? { ...task, completed: newCompletedState } : task));
          setTasks(updatedTasks);
          await saveToAsyncStorage(updatedTasks);
        } finally {
          savingRef.current = false;
        }
      }
    },
    [useFirestore, tasks, saveToAsyncStorage]
  );

  // Delete task
  const deleteTask = useCallback(
    async (id: string) => {
      const userId = getCurrentUserId();

      // Cancel notifications for this task
      await cancelAllTaskNotifications(id);

      if (useFirestore && userId) {
        try {
          await deleteTaskFromFirestore(userId, id);
          // Real-time listener will update state
        } catch (error) {
          logError(error as Error, { context: 'deleteTask', userId, taskId: id });
          console.error('Failed to delete task from Firestore:', error);
          throw error;
        }
      } else {
        // AsyncStorage mode - prevent race condition with auto-save
        try {
          savingRef.current = true;
          const updatedTasks = tasks.filter(task => task.id !== id);
          setTasks(updatedTasks);
          await saveToAsyncStorage(updatedTasks);
        } finally {
          savingRef.current = false;
        }
      }
    },
    [useFirestore, tasks, saveToAsyncStorage]
  );

  // Reorder tasks
  const reorderTasks = useCallback(
    async (taskIds: string[]) => {
      const userId = getCurrentUserId();

      if (useFirestore && userId) {
        try {
          const updates = taskIds.map((id, index) => ({ id, order: index }));
          await reorderTasksInFirestore(userId, updates);
          // Real-time listener will update state
        } catch (error) {
          logError(error as Error, { context: 'reorderTasks', userId });
          console.error('Failed to reorder tasks in Firestore:', error);
          throw error;
        }
      } else {
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
      }
    },
    [useFirestore]
  );

  // Get tasks for specific date
  const getTasksForDate = useCallback(
    (date: Date): Task[] => {
      const dateStr = formatDate(date);
      return tasks
        .filter(task => task.date === dateStr)
        .sort((a, b) => {
          const orderA = a.order ?? 0;
          const orderB = b.order ?? 0;
          if (orderA !== orderB) return orderA - orderB;
          return a.startTime - b.startTime;
        });
    },
    [tasks]
  );

  // Selected date tasks
  const selectedDateTasks = useMemo(() => {
    return getTasksForDate(selectedDate);
  }, [getTasksForDate, selectedDate]);

  // Scheduled minutes for selected date
  const scheduledMinutes = useMemo(() => {
    return selectedDateTasks.reduce((total, task) => total + task.duration, 0);
  }, [selectedDateTasks]);

  // Mark onboarding complete
  const markOnboardingComplete = useCallback(async () => {
    setHasCompletedOnboarding(true);
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    logAnalyticsEvent('onboarding_completed');
  }, []);

  // ============ TEMPLATE MANAGEMENT ============

  // Load templates from AsyncStorage
  const loadTemplatesFromStorage = useCallback(async () => {
    try {
      const storedTemplates = await AsyncStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (storedTemplates) {
        const customTemplates: TaskTemplate[] = JSON.parse(storedTemplates);
        setTemplates([...DEFAULT_TEMPLATES, ...customTemplates]);
      } else {
        setTemplates([...DEFAULT_TEMPLATES]);
      }
    } catch (error) {
      logError(error as Error, { context: 'loadTemplatesFromStorage' });
      console.error('Failed to load templates:', error);
    }
  }, []);

  // Save custom templates to AsyncStorage
  const saveTemplatesToStorage = useCallback(async (customTemplates: TaskTemplate[]) => {
    try {
      await AsyncStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(customTemplates));
    } catch (error) {
      logError(error as Error, { context: 'saveTemplatesToStorage' });
      console.error('Failed to save templates:', error);
    }
  }, []);

  // Load templates on mount
  useEffect(() => {
    loadTemplatesFromStorage();
  }, [loadTemplatesFromStorage]);

  // Add new template
  const addTemplate = useCallback(
    async (templateData: Omit<TaskTemplate, 'id' | 'createdAt' | 'usageCount'>) => {
      const newTemplate: TaskTemplate = {
        ...templateData,
        id: `template-custom-${Date.now()}`,
        createdAt: new Date().toISOString(),
        usageCount: 0,
      };

      setTemplates(prev => {
        const updated = [...prev, newTemplate];
        const customOnly = updated.filter(t => t.id.startsWith('template-custom'));
        saveTemplatesToStorage(customOnly);
        return updated;
      });

      logAnalyticsEvent('template_created', {
        template_name: templateData.name,
        category: templateData.category,
      });

      return newTemplate;
    },
    [saveTemplatesToStorage]
  );

  // Update existing template
  const updateTemplate = useCallback(
    async (id: string, updates: Partial<TaskTemplate>) => {
      setTemplates(prev => {
        const updated = prev.map(template =>
          template.id === id ? { ...template, ...updates } : template
        );
        const customOnly = updated.filter(t => t.id.startsWith('template-custom'));
        saveTemplatesToStorage(customOnly);
        return updated;
      });

      logAnalyticsEvent('template_updated', { template_id: id });
    },
    [saveTemplatesToStorage]
  );

  // Delete template (only custom templates)
  const deleteTemplate = useCallback(
    async (id: string) => {
      if (!id.startsWith('template-custom')) {
        throw new Error('Cannot delete default templates');
      }

      setTemplates(prev => {
        const updated = prev.filter(template => template.id !== id);
        const customOnly = updated.filter(t => t.id.startsWith('template-custom'));
        saveTemplatesToStorage(customOnly);
        return updated;
      });

      logAnalyticsEvent('template_deleted', { template_id: id });
    },
    [saveTemplatesToStorage]
  );

  // Increment template usage count
  const incrementTemplateUsage = useCallback(
    async (id: string) => {
      setTemplates(prev => {
        const updated = prev.map(template =>
          template.id === id
            ? { ...template, usageCount: template.usageCount + 1 }
            : template
        );
        const customOnly = updated.filter(t => t.id.startsWith('template-custom'));
        saveTemplatesToStorage(customOnly);
        return updated;
      });

      logAnalyticsEvent('template_used', { template_id: id });
    },
    [saveTemplatesToStorage]
  );

  // Create task from template
  const createTaskFromTemplate = useCallback(
    async (templateId: string, date: Date, startTime?: number) => {
      const template = templates.find(t => t.id === templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      const taskData = {
        title: template.title,
        category: template.category,
        duration: template.duration,
        notes: template.notes,
        priority: template.priority,
        startTime: startTime ?? template.defaultStartTime ?? 540, // Default 9:00 AM
        date: formatDate(date),
        repeatType: 'none' as const,
        completed: false,
      };

      await addTask(taskData);
      await incrementTemplateUsage(templateId);

      logAnalyticsEvent('task_created_from_template', {
        template_id: templateId,
        template_name: template.name,
      });
    },
    [templates, addTask, incrementTemplateUsage]
  );

  // Get custom templates only
  const customTemplates = useMemo(() => {
    return templates.filter(t => t.id.startsWith('template-custom'));
  }, [templates]);

  // Get most used templates
  const popularTemplates = useMemo(() => {
    return [...templates].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5);
  }, [templates]);

  // Load custom categories from storage
  const loadCustomCategories = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(CUSTOM_CATEGORIES_KEY);
      if (stored) {
        const parsed: CustomCategory[] = JSON.parse(stored);
        setCustomCategories([...DEFAULT_CATEGORIES, ...parsed]);
      }
    } catch (error) {
      logError(error as Error, { context: 'loadCustomCategories' });
      console.error('Failed to load custom categories:', error);
    }
  }, []);

  // Save custom categories to storage
  const saveCustomCategories = useCallback(async (categories: CustomCategory[]) => {
    try {
      const customOnly = categories.filter(c => !c.isDefault);
      await AsyncStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(customOnly));
    } catch (error) {
      logError(error as Error, { context: 'saveCustomCategories' });
      console.error('Failed to save custom categories:', error);
    }
  }, []);

  // Add custom category
  const addCustomCategory = useCallback(
    async (name: string, color: string) => {
      const newCategory: CustomCategory = {
        id: `custom-${Date.now()}`,
        name,
        color,
        gradient: [color, color],
        createdAt: new Date().toISOString(),
        isDefault: false,
      };

      const updated = [...customCategories, newCategory];
      setCustomCategories(updated);
      await saveCustomCategories(updated);

      logAnalyticsEvent('custom_category_created', {
        category_name: name,
        color,
      });

      return newCategory.id;
    },
    [customCategories, saveCustomCategories]
  );

  // Update custom category
  const updateCustomCategory = useCallback(
    async (id: string, updates: Partial<Pick<CustomCategory, 'name' | 'color'>>) => {
      const updated = customCategories.map(cat =>
        cat.id === id && !cat.isDefault
          ? { ...cat, ...updates, gradient: [updates.color || cat.color, updates.color || cat.color] }
          : cat
      );
      setCustomCategories(updated);
      await saveCustomCategories(updated);

      logAnalyticsEvent('custom_category_updated', {
        category_id: id,
      });
    },
    [customCategories, saveCustomCategories]
  );

  // Delete custom category
  const deleteCustomCategory = useCallback(
    async (id: string) => {
      const category = customCategories.find(c => c.id === id);
      if (!category || category.isDefault) {
        throw new Error('Cannot delete default category');
      }

      const updated = customCategories.filter(c => c.id !== id);
      setCustomCategories(updated);
      await saveCustomCategories(updated);

      logAnalyticsEvent('custom_category_deleted', {
        category_id: id,
      });
    },
    [customCategories, saveCustomCategories]
  );

  // Get category config (works for both default and custom)
  const getCategoryConfig = useCallback(
    (categoryId: string) => {
      // Try default categories first
      if (categoryId in CATEGORY_CONFIGS) {
        return CATEGORY_CONFIGS[categoryId as keyof typeof CATEGORY_CONFIGS];
      }

      // Try custom categories
      const custom = customCategories.find(c => c.id === categoryId);
      if (custom) {
        return {
          color: custom.color,
          gradient: custom.gradient,
          label: custom.name,
        };
      }

      // Fallback to meeting
      return CATEGORY_CONFIGS.meeting;
    },
    [customCategories]
  );

  // Only custom categories (for management UI)
  const userCustomCategories = useMemo(() => {
    return customCategories.filter(c => !c.isDefault);
  }, [customCategories]);

  // Load custom categories on mount
  useEffect(() => {
    loadCustomCategories();
  }, [loadCustomCategories]);

  return {
    // Tasks
    tasks,
    selectedDate,
    setSelectedDate,
    selectedDateTasks,
    scheduledMinutes,
    isLoading,
    isSyncing,
    syncError,
    useFirestore,
    hasCompletedOnboarding,
    addTask,
    updateTask,
    deleteTask,
    getTasksForDate,
    markOnboardingComplete,
    toggleTaskCompletion,
    reorderTasks,

    // Templates
    templates,
    customTemplates,
    popularTemplates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    createTaskFromTemplate,

    // Custom Categories
    customCategories,
    userCustomCategories,
    addCustomCategory,
    updateCustomCategory,
    deleteCustomCategory,
    getCategoryConfig,
  };
});
