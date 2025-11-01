import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Clock, Edit2, Trash2, Check, GripVertical } from 'lucide-react-native';
import { Task, CATEGORY_CONFIGS } from '@/constants/types';
import { formatTimeFromMinutes, formatDuration } from '@/utils/dateHelpers';

interface TaskItemProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onToggleComplete: () => void;
  isDragging?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = React.memo(({
  task,
  onEdit,
  onDelete,
  onToggleComplete,
  isDragging = false,
}) => {
  const config = CATEGORY_CONFIGS[task.category];

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task.title}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDelete,
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.taskCard,
          isDragging && { opacity: 0.7 },
        ]}
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
              <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
                <Trash2 size={15} color="#EF4444" />
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
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.completed === nextProps.task.completed &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.startTime === nextProps.task.startTime &&
    prevProps.task.duration === nextProps.task.duration &&
    prevProps.task.category === nextProps.task.category &&
    prevProps.isDragging === nextProps.isDragging
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
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
