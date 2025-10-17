import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { X, Sparkles, Lock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTasks } from '@/contexts/TaskContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { TaskCategory, CATEGORY_CONFIGS } from '@/constants/types';
import { TASK_TEMPLATES } from '@/constants/taskTemplates';
import { formatDate } from '@/utils/dateHelpers';

interface AddTaskModalProps {
  selectedDate: Date;
  onClose: () => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ selectedDate, onClose }) => {
  const router = useRouter();
  const { addTask } = useTasks();
  const { hasFeature } = useSubscription();
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<TaskCategory>('meeting');
  const [startHour, setStartHour] = useState<number>(9);
  const [startMinute, setStartMinute] = useState<number>(0);
  const [duration, setDuration] = useState<number>(60);

  const handleSave = () => {
    if (!title.trim()) {
      return;
    }

    const startTime = startHour * 60 + startMinute;

    addTask({
      title: title.trim(),
      category,
      startTime,
      duration,
      date: formatDate(selectedDate),
    });

    onClose();
  };

  const categories: TaskCategory[] = ['meeting', 'working', 'creative', 'building', 'focus', 'personal'];
  const durationOptions = [15, 30, 45, 60, 90, 120, 180, 240];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Task</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {hasFeature('taskTemplates') && (
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Quick Templates</Text>
              <Sparkles size={14} color="#4A9B9B" />
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.templatesScroll}
            >
              {TASK_TEMPLATES.map(template => {
                const config = CATEGORY_CONFIGS[template.category];
                return (
                  <TouchableOpacity
                    key={template.id}
                    style={[
                      styles.templateCard,
                      { borderColor: config.color + '40' },
                    ]}
                    onPress={() => {
                      setTitle(template.name);
                      setCategory(template.category);
                      setDuration(template.duration);
                    }}
                  >
                    {template.isPremium && (
                      <View style={styles.premiumTemplateBadge}>
                        <Sparkles size={10} color="#FFD700" />
                      </View>
                    )}
                    <Text style={styles.templateName}>{template.name}</Text>
                    <Text style={styles.templateDescription}>{template.description}</Text>
                    <View style={[styles.templateCategory, { backgroundColor: config.color + '30' }]}>
                      <Text style={[styles.templateCategoryText, { color: config.color }]}>
                        {config.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {!hasFeature('taskTemplates') && (
          <TouchableOpacity 
            style={styles.section}
            onPress={() => {
              onClose();
              router.push('/subscription');
            }}
          >
            <View style={styles.premiumFeatureBanner}>
              <View style={styles.premiumFeatureIcon}>
                <Lock size={24} color="#FFD700" />
              </View>
              <View style={styles.premiumFeatureContent}>
                <Text style={styles.premiumFeatureTitle}>Unlock Task Templates</Text>
                <Text style={styles.premiumFeatureDescription}>
                  Save time with pre-made templates
                </Text>
              </View>
              <Sparkles size={20} color="#FFD700" />
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Task Name</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter task name"
            placeholderTextColor="#444"
            autoFocus
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map(cat => {
              const config = CATEGORY_CONFIGS[cat];
              const isSelected = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    isSelected && { backgroundColor: config.color, borderColor: config.color },
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      isSelected && styles.categoryTextSelected,
                    ]}
                  >
                    {config.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Start Time</Text>
          <View style={styles.timePickerRow}>
            <View style={styles.timePicker}>
              <TouchableOpacity
                onPress={() => setStartHour(Math.max(0, startHour - 1))}
                style={styles.timeButton}
              >
                <Text style={styles.timeButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.timeValue}>{startHour.toString().padStart(2, '0')}</Text>
              <TouchableOpacity
                onPress={() => setStartHour(Math.min(23, startHour + 1))}
                style={styles.timeButton}
              >
                <Text style={styles.timeButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.timeSeparator}>:</Text>
            
            <View style={styles.timePicker}>
              <TouchableOpacity
                onPress={() => setStartMinute(startMinute === 0 ? 45 : startMinute - 15)}
                style={styles.timeButton}
              >
                <Text style={styles.timeButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.timeValue}>{startMinute.toString().padStart(2, '0')}</Text>
              <TouchableOpacity
                onPress={() => setStartMinute(startMinute === 45 ? 0 : startMinute + 15)}
                style={styles.timeButton}
              >
                <Text style={styles.timeButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Duration</Text>
          <View style={styles.durationGrid}>
            {durationOptions.map(dur => {
              const isSelected = duration === dur;
              const hours = Math.floor(dur / 60);
              const mins = dur % 60;
              const label = hours > 0 && mins > 0 
                ? `${hours}h ${mins}m` 
                : hours > 0 
                  ? `${hours}h` 
                  : `${mins}m`;
              
              return (
                <TouchableOpacity
                  key={dur}
                  style={[
                    styles.durationButton,
                    isSelected && styles.durationButtonSelected,
                  ]}
                  onPress={() => setDuration(dur)}
                >
                  <Text
                    style={[
                      styles.durationText,
                      isSelected && styles.durationTextSelected,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A9B9B',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  templatesScroll: {
    gap: 12,
    paddingRight: 20,
  },
  templateCard: {
    width: 160,
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    position: 'relative',
  },
  premiumTemplateBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    backgroundColor: '#FFD70030',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 6,
  },
  templateDescription: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
    lineHeight: 16,
  },
  templateCategory: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  templateCategoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  premiumFeatureBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FFD70040',
  },
  premiumFeatureIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#FFD70020',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  premiumFeatureContent: {
    flex: 1,
  },
  premiumFeatureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  premiumFeatureDescription: {
    fontSize: 13,
    color: '#888',
  },
  input: {
    backgroundColor: '#121212',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#121212',
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryTextSelected: {
    color: '#FFF',
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  timeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
  },
  timeButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
  },
  timeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    minWidth: 40,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: '700',
    color: '#444',
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  durationButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#121212',
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  durationButtonSelected: {
    backgroundColor: '#4A9B9B',
    borderColor: '#4A9B9B',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  durationTextSelected: {
    color: '#FFF',
  },
});
