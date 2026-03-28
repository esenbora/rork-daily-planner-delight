import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Play, Pause, RotateCcw, Coffee } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTasks } from '@/contexts/TaskContext';
import { CATEGORY_CONFIGS } from '@/constants/types';
import { logAnalyticsEvent } from '@/lib/firebase';

export default function FocusScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const taskId = params.taskId as string;
  const { tasks } = useTasks();

  const task = tasks.find((t) => t.id === taskId);
  const [timeRemaining, setTimeRemaining] = useState<number>(
    task ? task.duration * 60 : 1500
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isBreak, setIsBreak] = useState<boolean>(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartTimeRef = useRef<number>(0);

  // Track screen view
  useEffect(() => {
    logAnalyticsEvent('screen_view', {
      screen_name: 'focus',
      screen_class: 'FocusScreen',
      task_id: taskId,
      task_category: task?.category,
    });
  }, [taskId, task?.category]);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRunning, pulseAnim]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);

            // Log focus session completion
            const sessionDuration = task ? task.duration * 60 - 1 : 1499;
            logAnalyticsEvent('focus_session_completed', {
              task_id: taskId,
              task_category: task?.category,
              duration_seconds: sessionDuration,
              was_break: isBreak,
            });

            if (!isBreak) {
              setIsBreak(true);
              return 300;
            } else {
              setIsBreak(false);
              return task ? task.duration * 60 : 1500;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isBreak, task, taskId]);

  const toggleTimer = () => {
    const newRunningState = !isRunning;
    setIsRunning(newRunningState);

    if (newRunningState) {
      sessionStartTimeRef.current = Date.now();
      logAnalyticsEvent('focus_session_started', {
        task_id: taskId,
        task_category: task?.category,
        is_break: isBreak,
      });
    } else {
      logAnalyticsEvent('focus_session_paused', {
        task_id: taskId,
        task_category: task?.category,
        time_elapsed: Date.now() - sessionStartTimeRef.current,
      });
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    logAnalyticsEvent('focus_timer_reset', {
      task_id: taskId,
      was_break: isBreak,
    });

    if (isBreak) {
      setTimeRemaining(300);
    } else {
      setTimeRemaining(task ? task.duration * 60 : 1500);
    }
  };

  const startBreak = () => {
    setIsBreak(true);
    setIsRunning(false);
    setTimeRemaining(300);
    logAnalyticsEvent('break_started', {
      task_id: taskId,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const progress = task
    ? isBreak
      ? 1 - timeRemaining / 300
      : 1 - timeRemaining / (task.duration * 60)
    : 0;

  const config = task ? CATEGORY_CONFIGS[task.category] : null;

  return (
    <View style={[styles.container, { backgroundColor: isBreak ? '#7AC79B' : '#1A1A2E' }]}>
      <StatusBar barStyle="light-content" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isBreak ? 'Break Time' : 'Focus Mode'}
        </Text>
        <View style={styles.closeButton} />
      </View>

      <View style={styles.content}>
        {task && !isBreak && (
          <View style={styles.taskInfo}>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: config!.color + '30' },
              ]}
            >
              <Text style={[styles.categoryText, { color: config!.color }]}>
                {config!.label}
              </Text>
            </View>
            <Text style={styles.taskTitle}>{task.title}</Text>
            {task.notes && <Text style={styles.taskNotes}>{task.notes}</Text>}
          </View>
        )}

        {isBreak && (
          <View style={styles.breakInfo}>
            <Coffee size={48} color="#FFF" strokeWidth={1.5} />
            <Text style={styles.breakTitle}>Take a Break</Text>
            <Text style={styles.breakSubtitle}>You&apos;ve earned it!</Text>
          </View>
        )}

        <Animated.View
          style={[
            styles.timerContainer,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <View style={styles.timerCircle}>
            <View
              style={[
                styles.progressRing,
                {
                  borderColor: isBreak ? '#FFF' : config?.color || '#8B7AC7',
                },
              ]}
            />
            <View
              style={[
                styles.progressRing,
                styles.progressRingFill,
                {
                  borderColor: isBreak ? '#FFF' : config?.color || '#8B7AC7',
                  transform: [{ rotate: `${progress * 360}deg` }],
                },
              ]}
            />
            <View style={styles.timerInner}>
              <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={resetTimer}>
            <RotateCcw size={28} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.playButton,
              {
                backgroundColor: isBreak
                  ? '#FFF'
                  : config?.color || '#8B7AC7',
              },
            ]}
            onPress={toggleTimer}
          >
            {isRunning ? (
              <Pause size={36} color={isBreak ? '#7AC79B' : '#FFF'} fill={isBreak ? '#7AC79B' : '#FFF'} />
            ) : (
              <Play size={36} color={isBreak ? '#7AC79B' : '#FFF'} fill={isBreak ? '#7AC79B' : '#FFF'} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={startBreak}
            disabled={isBreak}
          >
            <Coffee size={28} color={isBreak ? '#888' : '#FFF'} />
          </TouchableOpacity>
        </View>

        <View style={styles.tips}>
          <Text style={styles.tipTitle}>Focus Tips</Text>
          <Text style={styles.tipText}>• Silence notifications</Text>
          <Text style={styles.tipText}>• Find a quiet space</Text>
          <Text style={styles.tipText}>• Take breaks regularly</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 40,
  },
  taskInfo: {
    alignItems: 'center',
    gap: 12,
  },
  categoryBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
  },
  taskNotes: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  breakInfo: {
    alignItems: 'center',
    gap: 16,
  },
  breakTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
  },
  breakSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCircle: {
    width: 280,
    height: 280,
    position: 'relative' as const,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    position: 'absolute' as const,
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 8,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressRingFill: {
    borderColor: '#FFF',
    borderTopWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    transform: [{ rotate: '-90deg' }],
  },
  timerInner: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 56,
    fontWeight: '800',
    color: '#FFF',
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  tips: {
    alignItems: 'center',
    gap: 8,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 20,
  },
});
