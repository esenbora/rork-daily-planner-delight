import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Clock, Edit2, Trash2, Check, GripVertical } from 'lucide-react-native';
import { Task, CATEGORY_CONFIGS } from '@/constants/types';
import { formatTimeFromMinutes, formatDuration } from '@/utils/dateHelpers';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 80;

interface TaskItemProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onToggleComplete: () => void;
  isDragging?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onEdit,
  onDelete,
  onToggleComplete,
  isDragging = false,
}) => {
  const config = CATEGORY_CONFIGS[task.category];
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderGrant: () => {
        Animated.spring(scale, {
          toValue: 0.98,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();

        if (gestureState.dx < -SWIPE_THRESHOLD) {
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            onDelete();
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <View style={styles.deleteBackground}>
        <Trash2 size={24} color="#FFF" />
        <Text style={styles.deleteText}>Delete</Text>
      </View>

      <Animated.View
        style={[
          styles.taskCard,
          {
            transform: [{ translateX }, { scale }],
            opacity: isDragging ? 0.7 : opacity,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={[styles.taskColorBar, { backgroundColor: config.color }]} />

        <TouchableOpacity
          style={styles.dragHandle}
          activeOpacity={0.8}
        >
          <GripVertical size={18} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={onToggleComplete}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.checkbox,
              task.completed && {
                backgroundColor: config.color,
                borderColor: config.color,
              },
            ]}
          >
            {task.completed && <Check size={14} color="#FFF" strokeWidth={3} />}
          </View>
        </TouchableOpacity>

        <View style={styles.taskContent}>
          <View style={styles.taskHeader}>
            <View
              style={[styles.categoryBadge, { backgroundColor: config.color + '25' }]}
            >
              <Text style={[styles.categoryText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>

            <View style={styles.taskActions}>
              <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
                <Edit2 size={15} color="#888" />
              </TouchableOpacity>
            </View>
          </View>

          <Text
            style={[
              styles.taskTitle,
              task.completed && styles.taskTitleCompleted,
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>

          {task.notes && (
            <Text style={styles.taskNotes} numberOfLines={1}>
              {task.notes}
            </Text>
          )}

          <View style={styles.taskMeta}>
            <View style={styles.metaItem}>
              <Clock size={12} color="#666" />
              <Text style={styles.metaText}>
                {formatTimeFromMinutes(task.startTime)}
              </Text>
            </View>
            <View style={styles.metaDot} />
            <Text style={styles.metaText}>{formatDuration(task.duration)}</Text>
            {task.repeatType !== 'none' && (
              <>
                <View style={styles.metaDot} />
                <Text style={styles.repeatBadge}>{task.repeatType}</Text>
              </>
            )}
            {task.priority && (
              <>
                <View style={styles.metaDot} />
                <View
                  style={[
                    styles.priorityBadge,
                    {
                      backgroundColor:
                        task.priority === 'high'
                          ? '#C75B6E20'
                          : task.priority === 'medium'
                          ? '#A88E4F20'
                          : '#7AC79B20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      {
                        color:
                          task.priority === 'high'
                            ? '#C75B6E'
                            : task.priority === 'medium'
                            ? '#A88E4F'
                            : '#7AC79B',
                      },
                    ]}
                  >
                    {task.priority}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    position: 'relative' as const,
  },
  deleteBackground: {
    position: 'absolute' as const,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#C75B6E',
    justifyContent: 'center',
    alignItems: 'center',
    width: 120,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
  },
  deleteText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  taskColorBar: {
    width: 4,
  },
  dragHandle: {
    paddingLeft: 8,
    paddingRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxContainer: {
    paddingLeft: 8,
    paddingTop: 14,
    paddingRight: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskContent: {
    flex: 1,
    padding: 14,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 7,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 6,
    lineHeight: 21,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  taskNotes: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#444',
  },
  repeatBadge: {
    fontSize: 11,
    color: '#8B7AC7',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  priorityBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
