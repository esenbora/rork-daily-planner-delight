/**
 * Firestore Sync Service
 * Handles real-time synchronization of tasks between local state and Firestore
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  getDocs,
  writeBatch,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { firestore, auth } from './firebase';
import { Task } from '@/constants/types';
import { logAnalyticsEvent, logError } from './firebase';

/**
 * Convert Firestore document to Task object
 */
function firestoreToTask(doc: QueryDocumentSnapshot<DocumentData>): Task {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    category: data.category,
    startTime: data.startTime,
    duration: data.duration,
    date: data.date,
    completed: data.completed ?? false,
    repeatType: data.repeatType ?? 'none',
    repeatEndDate: data.repeatEndDate,
    notes: data.notes,
    priority: data.priority,
    order: data.order ?? 0,
  };
}

/**
 * Convert Task object to Firestore document data
 */
function taskToFirestore(task: Omit<Task, 'id'>) {
  return {
    ...task,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
}

/**
 * Subscribe to real-time task updates from Firestore
 */
export function subscribeToTasks(
  userId: string,
  onUpdate: (tasks: Task[]) => void,
  onError?: (error: Error) => void
) {
  if (!userId) {
    console.warn('Cannot subscribe to tasks: no user ID provided');
    return () => {};
  }

  // Check if Firestore is initialized
  if (!firestore) {
    console.error('Firestore is not initialized - cannot subscribe to tasks');
    const error = new Error('Firestore unavailable');
    onError?.(error);
    return () => {};
  }

  const tasksRef = collection(firestore, 'users', userId, 'tasks');
  const q = query(tasksRef, orderBy('date', 'asc'), orderBy('order', 'asc'));

  const unsubscribe = onSnapshot(
    q,
    snapshot => {
      const tasks = snapshot.docs.map(firestoreToTask);
      onUpdate(tasks);

      logAnalyticsEvent('tasks_synced', {
        count: tasks.length,
        source: 'firestore',
      });
    },
    error => {
      console.error('Firestore subscription error:', error);
      logError(error, { context: 'subscribeToTasks' });
      onError?.(error);
    }
  );

  return unsubscribe;
}

/**
 * Add a new task to Firestore
 */
export async function addTaskToFirestore(
  userId: string,
  task: Omit<Task, 'id'>
): Promise<string> {
  if (!firestore) {
    throw new Error('Firestore is not initialized');
  }

  try {
    const tasksRef = collection(firestore, 'users', userId, 'tasks');
    const docRef = await addDoc(tasksRef, taskToFirestore(task));

    logAnalyticsEvent('task_created', {
      category: task.category,
      duration: task.duration,
      has_notes: !!task.notes,
      priority: task.priority,
    });

    return docRef.id;
  } catch (error) {
    logError(error as Error, { context: 'addTaskToFirestore', userId });
    throw error;
  }
}

/**
 * Update an existing task in Firestore
 */
export async function updateTaskInFirestore(
  userId: string,
  taskId: string,
  updates: Partial<Task>
): Promise<void> {
  if (!firestore) {
    throw new Error('Firestore is not initialized');
  }

  try {
    const taskRef = doc(firestore, 'users', userId, 'tasks', taskId);
    await updateDoc(taskRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });

    logAnalyticsEvent('task_updated', {
      task_id: taskId,
      fields_updated: Object.keys(updates).length,
    });
  } catch (error) {
    logError(error as Error, { context: 'updateTaskInFirestore', userId, taskId });
    throw error;
  }
}

/**
 * Delete a task from Firestore
 */
export async function deleteTaskFromFirestore(
  userId: string,
  taskId: string
): Promise<void> {
  if (!firestore) {
    throw new Error('Firestore is not initialized');
  }

  try {
    const taskRef = doc(firestore, 'users', userId, 'tasks', taskId);
    await deleteDoc(taskRef);

    logAnalyticsEvent('task_deleted', { task_id: taskId });
  } catch (error) {
    logError(error as Error, { context: 'deleteTaskFromFirestore', userId, taskId });
    throw error;
  }
}

/**
 * Toggle task completion status
 */
export async function toggleTaskCompletion(
  userId: string,
  taskId: string,
  completed: boolean
): Promise<void> {
  try {
    await updateTaskInFirestore(userId, taskId, { completed });

    logAnalyticsEvent('task_toggled', {
      task_id: taskId,
      completed,
    });
  } catch (error) {
    logError(error as Error, { context: 'toggleTaskCompletion', userId, taskId });
    throw error;
  }
}

/**
 * Batch update task order (for drag-and-drop reordering)
 */
export async function reorderTasksInFirestore(
  userId: string,
  taskUpdates: Array<{ id: string; order: number }>
): Promise<void> {
  try {
    const batch = writeBatch(firestore);

    taskUpdates.forEach(({ id, order }) => {
      const taskRef = doc(firestore, 'users', userId, 'tasks', id);
      batch.update(taskRef, {
        order,
        updatedAt: Timestamp.now(),
      });
    });

    await batch.commit();

    logAnalyticsEvent('tasks_reordered', {
      count: taskUpdates.length,
    });
  } catch (error) {
    logError(error as Error, { context: 'reorderTasksInFirestore', userId });
    throw error;
  }
}

/**
 * Migrate tasks from AsyncStorage to Firestore
 * This should be called once when user first logs in
 */
export async function migrateTasksToFirestore(
  userId: string,
  localTasks: Task[]
): Promise<void> {
  try {
    if (localTasks.length === 0) {
      return;
    }

    // Check if user already has tasks in Firestore
    const tasksRef = collection(firestore, 'users', userId, 'tasks');
    const snapshot = await getDocs(tasksRef);

    if (snapshot.size > 0) {
      console.log('User already has tasks in Firestore, skipping migration');
      return;
    }

    // Batch upload local tasks
    const batch = writeBatch(firestore);

    localTasks.forEach(task => {
      const { id, ...taskData } = task;
      const newTaskRef = doc(tasksRef);
      batch.set(newTaskRef, taskToFirestore(taskData));
    });

    await batch.commit();

    logAnalyticsEvent('tasks_migrated', {
      count: localTasks.length,
      source: 'async_storage',
    });

    console.log(`Migrated ${localTasks.length} tasks to Firestore`);
  } catch (error) {
    logError(error as Error, { context: 'migrateTasksToFirestore', userId });
    throw error;
  }
}

/**
 * Get tasks for a specific date range
 */
export async function getTasksByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<Task[]> {
  try {
    const tasksRef = collection(firestore, 'users', userId, 'tasks');
    const q = query(
      tasksRef,
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc'),
      orderBy('startTime', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(firestoreToTask);
  } catch (error) {
    logError(error as Error, { context: 'getTasksByDateRange', userId, startDate, endDate });
    throw error;
  }
}

/**
 * Check if user is authenticated
 */
export function isUserAuthenticated(): boolean {
  return !!auth.currentUser;
}

/**
 * Get current user ID
 */
export function getCurrentUserId(): string | null {
  return auth.currentUser?.uid || null;
}
