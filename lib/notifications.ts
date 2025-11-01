/**
 * Notifications Service
 * Handles local notifications for task reminders
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Task } from '@/constants/types';
import { logAnalyticsEvent, logError } from './firebase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permission not granted');
      logAnalyticsEvent('notification_permission_denied');
      return false;
    }

    logAnalyticsEvent('notification_permission_granted');
    return true;
  } catch (error) {
    logError(error as Error, { context: 'requestNotificationPermissions' });
    return false;
  }
}

/**
 * Check if notifications are enabled
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    logError(error as Error, { context: 'areNotificationsEnabled' });
    return false;
  }
}

/**
 * Calculate trigger date from task
 * Schedules notification 5 minutes before task start time
 */
function calculateNotificationDate(task: Task): Date {
  const [year, month, day] = task.date.split('-').map(Number);
  const hours = Math.floor(task.startTime / 60);
  const minutes = task.startTime % 60;

  const taskDate = new Date(year, month - 1, day, hours, minutes);

  // Schedule 5 minutes before
  const notificationDate = new Date(taskDate.getTime() - 5 * 60 * 1000);

  // Don't schedule notifications in the past
  if (notificationDate < new Date()) {
    return new Date(Date.now() + 10 * 1000); // Schedule 10 seconds from now for testing
  }

  return notificationDate;
}

/**
 * Schedule a notification for a task
 */
export async function scheduleTaskNotification(task: Task): Promise<string | null> {
  try {
    const hasPermission = await areNotificationsEnabled();
    if (!hasPermission) {
      console.warn('Cannot schedule notification: permission not granted');
      return null;
    }

    const trigger = calculateNotificationDate(task);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📋 Task Reminder',
        body: `${task.title} starts in 5 minutes`,
        data: {
          taskId: task.id,
          taskTitle: task.title,
          category: task.category,
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger,
    });

    logAnalyticsEvent('notification_scheduled', {
      task_id: task.id,
      category: task.category,
      trigger_timestamp: trigger.getTime(),
    });

    return notificationId;
  } catch (error) {
    logError(error as Error, { context: 'scheduleTaskNotification', taskId: task.id });
    return null;
  }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelTaskNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    logAnalyticsEvent('notification_cancelled');
  } catch (error) {
    logError(error as Error, { context: 'cancelTaskNotification', notificationId });
  }
}

/**
 * Cancel all scheduled notifications for a task
 * (useful when deleting a task)
 */
export async function cancelAllTaskNotifications(taskId: string): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const taskNotifications = scheduled.filter(
      notification => notification.content.data?.taskId === taskId
    );

    await Promise.all(
      taskNotifications.map(notification =>
        Notifications.cancelScheduledNotificationAsync(notification.identifier)
      )
    );

    logAnalyticsEvent('notifications_cancelled_for_task', {
      task_id: taskId,
      count: taskNotifications.length,
    });
  } catch (error) {
    logError(error as Error, { context: 'cancelAllTaskNotifications', taskId });
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    logAnalyticsEvent('all_notifications_cancelled');
  } catch (error) {
    logError(error as Error, { context: 'cancelAllNotifications' });
  }
}

/**
 * Get all scheduled notifications
 */
export async function getAllScheduledNotifications(): Promise<
  Notifications.NotificationRequest[]
> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    logError(error as Error, { context: 'getAllScheduledNotifications' });
    return [];
  }
}

/**
 * Set up notification response listener
 * This handles what happens when user taps a notification
 */
export function setupNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
) {
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    const taskId = response.notification.request.content.data?.taskId;

    logAnalyticsEvent('notification_tapped', {
      task_id: taskId,
    });

    handler(response);
  });

  return () => {
    subscription.remove();
  };
}

/**
 * Set up notification received listener
 * This handles notifications received while app is foregrounded
 */
export function setupNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void
) {
  const subscription = Notifications.addNotificationReceivedListener(notification => {
    logAnalyticsEvent('notification_received', {
      task_id: notification.request.content.data?.taskId,
    });

    handler(notification);
  });

  return () => {
    subscription.remove();
  };
}

/**
 * Test notification (useful for debugging)
 */
export async function sendTestNotification(): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification',
        body: 'This is a test notification from Daily Planner Delight',
        data: { test: true },
      },
      trigger: {
        seconds: 2,
      },
    });

    logAnalyticsEvent('test_notification_sent');
  } catch (error) {
    logError(error as Error, { context: 'sendTestNotification' });
  }
}

/**
 * Configure iOS notification categories (optional advanced feature)
 */
export async function configureNotificationCategories(): Promise<void> {
  if (Platform.OS !== 'ios') return;

  try {
    await Notifications.setNotificationCategoryAsync('task-reminder', [
      {
        identifier: 'mark-complete',
        buttonTitle: 'Mark Complete',
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: 'snooze',
        buttonTitle: 'Snooze 10min',
        options: {
          opensAppToForeground: false,
        },
      },
    ]);
  } catch (error) {
    logError(error as Error, { context: 'configureNotificationCategories' });
  }
}
