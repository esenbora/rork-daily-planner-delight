import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  ListRenderItemInfo,
} from 'react-native';
import { Clock, Edit2, Trash2, GripVertical } from 'lucide-react-native';
import { Task, CATEGORY_CONFIGS } from '@/constants/types';
import { formatTimeFromMinutes, formatDuration } from '@/utils/dateHelpers';
import { useTasks } from '@/contexts/TaskContext';

interface TaskListProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

const EmptyListComponent = () => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIconContainer}>
      <Clock size={64} color="#333" strokeWidth={1.5} />
    </View>
    <Text style={styles.emptyTitle}>No Tasks Yet</Text>
    <Text style={styles.emptyDescription}>
      Start organizing your day by adding your first task
    </Text>
  </View>
);

const keyExtractor = (item: Task) => item.id;

export const TaskList: React.FC<TaskListProps> = ({ tasks, onEditTask }) => {
  const { deleteTask } = useTasks();

  const renderItem = useCallback(({ item }: ListRenderItemInfo<Task>) => (
    <TaskCard
      task={item}
      onEdit={() => onEditTask(item)}
      onDelete={() => deleteTask(item.id)}
    />
  ), [onEditTask, deleteTask]);

  return (
    <FlatList
      data={tasks}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, tasks.length === 0 && styles.contentContainerEmpty]}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={EmptyListComponent}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={5}
      initialNumToRender={10}
    />
  );
};

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const config = CATEGORY_CONFIGS[task.category];
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.taskCard, { transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.taskAccent, { backgroundColor: config.color }]} />
      
      <View style={styles.taskContent}>
        <View style={styles.taskHeader}>
          <View style={styles.taskHeaderLeft}>
            <GripVertical size={16} color="#444" />
            <View style={[styles.categoryBadge, { backgroundColor: config.color + '30' }]}>
              <Text style={[styles.categoryBadgeText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
          </View>
          
          <View style={styles.taskActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onEdit}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Edit2 size={18} color="#888" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onDelete}
            >
              <Trash2 size={18} color="#C75B6E" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.taskTitle}>{task.title}</Text>

        <View style={styles.taskMeta}>
          <View style={styles.metaItem}>
            <Clock size={14} color="#666" />
            <Text style={styles.metaText}>{formatTimeFromMinutes(task.startTime)}</Text>
          </View>
          <View style={styles.metaDivider} />
          <Text style={styles.metaText}>{formatDuration(task.duration)}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 12,
  },
  contentContainerEmpty: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#121212',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#121212',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  taskAccent: {
    width: 4,
  },
  taskContent: {
    flex: 1,
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  taskHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
  },
  taskTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
    lineHeight: 24,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  metaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333',
  },
});
