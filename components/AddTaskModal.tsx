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
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { X, Sparkles, Lock, Repeat, Bookmark, Zap, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTasks } from '@/contexts/TaskContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Task, TaskCategory, CATEGORY_CONFIGS, RepeatType, TaskPriority } from '@/constants/types';
import { formatDate } from '@/utils/dateHelpers';
import { parseNaturalLanguageTask, isAIParsingAvailable } from '@/lib/ai/task-parser';

interface AddTaskModalProps {
  selectedDate: Date;
  editingTask?: Task | null;
  onClose: () => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ selectedDate, editingTask, onClose }) => {
  const router = useRouter();
  const { addTask, updateTask, templates, popularTemplates } = useTasks();
  const { hasFeature, features } = useSubscription();
  const now = new Date();
  const [title, setTitle] = useState<string>(editingTask?.title || '');
  const [category, setCategory] = useState<TaskCategory>(editingTask?.category || 'meeting');
  const [startHour, setStartHour] = useState<number>(editingTask ? Math.floor(editingTask.startTime / 60) : now.getHours());
  const [startMinute, setStartMinute] = useState<number>(editingTask ? editingTask.startTime % 60 : now.getMinutes());
  const [duration, setDuration] = useState<number>(editingTask?.duration || 60);
  const [repeatType, setRepeatType] = useState<RepeatType>(editingTask?.repeatType || 'none');
  const [notes, setNotes] = useState<string>(editingTask?.notes || '');
  const [priority, setPriority] = useState<TaskPriority | undefined>(editingTask?.priority);

  // AI Quick Add state
  const [aiInput, setAiInput] = useState<string>('');
  const [isAIParsing, setIsAIParsing] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Custom Duration state
  const [showCustomDuration, setShowCustomDuration] = useState(false);
  const [customHours, setCustomHours] = useState('1');
  const [customMinutes, setCustomMinutes] = useState('0');

  const handleAIParse = async () => {
    if (!aiInput.trim()) return;

    setIsAIParsing(true);
    setAiError(null);

    try {
      const parsed = await parseNaturalLanguageTask(aiInput, selectedDate);

      // Fill form with parsed data
      setTitle(parsed.title);
      setCategory(parsed.category);
      setDuration(parsed.duration);

      if (parsed.startTime !== undefined) {
        setStartHour(Math.floor(parsed.startTime / 60));
        setStartMinute(parsed.startTime % 60);
      }

      if (parsed.notes) {
        setNotes(parsed.notes);
      }

      if (parsed.priority) {
        setPriority(parsed.priority);
      }

      // Clear AI input after successful parse
      setAiInput('');
    } catch (error) {
      console.error('AI parsing failed:', error);
      setAiError(error instanceof Error ? error.message : 'Failed to parse task');
    } finally {
      setIsAIParsing(false);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      return;
    }

    const startTime = startHour * 60 + startMinute;

    if (editingTask) {
      updateTask(editingTask.id, {
        title: title.trim(),
        category,
        startTime,
        duration,
        repeatType,
        notes: notes.trim() || undefined,
        priority,
      });
    } else {
      addTask({
        title: title.trim(),
        category,
        startTime,
        duration,
        date: formatDate(selectedDate),
        completed: false,
        repeatType,
        notes: notes.trim() || undefined,
        priority,
      });
    }

    onClose();
  };

  const handleCustomDurationSave = () => {
    const hours = parseInt(customHours) || 0;
    const minutes = parseInt(customMinutes) || 0;
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes > 0 && totalMinutes <= 1440) {
      setDuration(totalMinutes);
      setShowCustomDuration(false);
    }
  };

  const categories: TaskCategory[] = ['meeting', 'working', 'creative', 'building', 'focus', 'personal'];
  const durationOptions = [15, 30, 45, 60, 90, 120, 180, 240];
  const isCustomDuration = !durationOptions.includes(duration);
  const repeatOptions: { value: RepeatType; label: string }[] = [
    { value: 'none', label: 'No Repeat' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editingTask ? 'Edit Task' : 'New Task'}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* AI Quick Add - Premium Feature */}
        {hasFeature('aiAssistant') && !editingTask && isAIParsingAvailable() && (
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Zap size={14} color="#FFD700" />
              <Text style={styles.label}>AI Quick Add</Text>
              <Sparkles size={14} color="#FFD700" />
            </View>
            <View style={styles.aiQuickAddContainer}>
              <TextInput
                style={styles.aiInput}
                value={aiInput}
                onChangeText={setAiInput}
                placeholder="e.g., 'team meeting tomorrow at 10am for 1 hour'"
                placeholderTextColor="#666"
                multiline
                numberOfLines={2}
                onSubmitEditing={handleAIParse}
                editable={!isAIParsing}
              />
              <TouchableOpacity
                style={[
                  styles.aiParseButton,
                  (isAIParsing || !aiInput.trim()) && styles.aiParseButtonDisabled,
                ]}
                onPress={handleAIParse}
                disabled={isAIParsing || !aiInput.trim()}
              >
                {isAIParsing ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Sparkles size={18} color="#FFF" />
                    <Text style={styles.aiParseButtonText}>Parse</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            {aiError && (
              <Text style={styles.aiErrorText}>{aiError}</Text>
            )}
            <Text style={styles.aiHint}>
              💡 Describe your task naturally and AI will fill the form below
            </Text>
          </View>
        )}

        {/* AI Feature Locked - Show Upgrade Banner */}
        {!hasFeature('aiAssistant') && !editingTask && (
          <TouchableOpacity
            style={styles.section}
            onPress={() => {
              onClose();
              router.push('/subscription');
            }}
          >
            <View style={styles.aiLockedBanner}>
              <View style={styles.aiLockedIcon}>
                <Zap size={28} color="#FFD700" />
              </View>
              <View style={styles.aiLockedContent}>
                <View style={styles.aiLockedTitleRow}>
                  <Text style={styles.aiLockedTitle}>AI Quick Add</Text>
                  <Sparkles size={16} color="#FFD700" />
                </View>
                <Text style={styles.aiLockedDescription}>
                  Create tasks instantly with natural language
                </Text>
                <Text style={styles.aiLockedExample}>
                  "team meeting tomorrow at 10am for 1 hour" ✨
                </Text>
              </View>
              <Lock size={20} color="#FFD700" />
            </View>
          </TouchableOpacity>
        )}

        {hasFeature('taskTemplates') && !editingTask && templates.length > 0 && (
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Bookmark size={14} color="#4A9B9B" />
              <Text style={styles.label}>Task Templates</Text>
              <Sparkles size={14} color="#FFD700" />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.templatesScroll}
            >
              {templates.slice(0, 8).map(template => {
                const config = CATEGORY_CONFIGS[template.category];
                return (
                  <TouchableOpacity
                    key={template.id}
                    style={[
                      styles.templateCard,
                      { borderColor: config.color + '40' },
                    ]}
                    onPress={() => {
                      setTitle(template.title);
                      setCategory(template.category);
                      setDuration(template.duration);
                      if (template.notes) setNotes(template.notes);
                      if (template.priority) setPriority(template.priority);
                      if (template.defaultStartTime) {
                        setStartHour(Math.floor(template.defaultStartTime / 60));
                        setStartMinute(template.defaultStartTime % 60);
                      }
                    }}
                  >
                    {template.usageCount > 0 && (
                      <View style={styles.usageCountBadge}>
                        <Text style={styles.usageCountText}>{template.usageCount}</Text>
                      </View>
                    )}
                    <Text style={styles.templateName}>{template.name}</Text>
                    <View style={[styles.templateCategory, { backgroundColor: config.color + '30' }]}>
                      <Text style={[styles.templateCategoryText, { color: config.color }]}>
                        {config.label} • {template.duration}m
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Text style={styles.templateHint}>
              {features.maxTemplates === Infinity
                ? '∞ templates available'
                : `${templates.length}/${features.maxTemplates} templates used`}
            </Text>
          </View>
        )}

        {!hasFeature('taskTemplates') && !editingTask && (
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
          <View style={styles.timePickerContainer}>
            <DateTimePicker
              value={(() => {
                const date = new Date(selectedDate);
                date.setHours(startHour);
                date.setMinutes(startMinute);
                return date;
              })()}
              mode="time"
              display="spinner"
              onChange={(event, date) => {
                if (date) {
                  setStartHour(date.getHours());
                  setStartMinute(date.getMinutes());
                }
              }}
              minuteInterval={1}
              textColor="#FFFFFF"
              themeVariant="dark"
              style={styles.iosTimePicker}
            />
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
            <TouchableOpacity
              style={[
                styles.durationButton,
                isCustomDuration && styles.durationButtonSelected,
              ]}
              onPress={() => setShowCustomDuration(true)}
            >
              <Text
                style={[
                  styles.durationText,
                  isCustomDuration && styles.durationTextSelected,
                ]}
              >
                {isCustomDuration
                  ? duration >= 60
                    ? `${Math.floor(duration / 60)}h${duration % 60 > 0 ? ` ${duration % 60}m` : ''}`
                    : `${duration}m`
                  : 'Custom'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Repeat</Text>
            <Repeat size={14} color="#8B7AC7" />
          </View>
          <View style={styles.repeatGrid}>
            {repeatOptions.map(opt => {
              const isSelected = repeatType === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.repeatButton,
                    isSelected && styles.repeatButtonSelected,
                  ]}
                  onPress={() => setRepeatType(opt.value)}
                >
                  <Text
                    style={[
                      styles.repeatText,
                      isSelected && styles.repeatTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.repeatGrid}>
            {(['high', 'medium', 'low'] as TaskPriority[]).map(p => {
              const isSelected = priority === p;
              const color = p === 'high' ? '#C75B6E' : p === 'medium' ? '#A88E4F' : '#7AC79B';
              return (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.repeatButton,
                    isSelected && { backgroundColor: color, borderColor: color },
                  ]}
                  onPress={() => setPriority(isSelected ? undefined : p)}
                >
                  <Text
                    style={[
                      styles.repeatText,
                      isSelected && styles.repeatTextSelected,
                    ]}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes or description..."
            placeholderTextColor="#444"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Custom Duration Modal */}
      <Modal
        visible={showCustomDuration}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomDuration(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Clock size={24} color="#8B7AC7" />
              <Text style={styles.modalTitle}>Custom Duration</Text>
              <TouchableOpacity onPress={() => setShowCustomDuration(false)}>
                <X size={24} color="#999" />
              </TouchableOpacity>
            </View>

            <View style={styles.customDurationInputs}>
              <View style={styles.customDurationInput}>
                <TextInput
                  style={styles.customInput}
                  value={customHours}
                  onChangeText={setCustomHours}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="0"
                  placeholderTextColor="#555"
                />
                <Text style={styles.customInputLabel}>hours</Text>
              </View>

              <Text style={styles.customInputSeparator}>:</Text>

              <View style={styles.customDurationInput}>
                <TextInput
                  style={styles.customInput}
                  value={customMinutes}
                  onChangeText={setCustomMinutes}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="0"
                  placeholderTextColor="#555"
                />
                <Text style={styles.customInputLabel}>minutes</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#8B7AC7' }]}
              onPress={handleCustomDurationSave}
            >
              <Text style={styles.modalButtonText}>Set Duration</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#0A0A0A',
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
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    position: 'relative' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  usageCountBadge: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    minWidth: 24,
    height: 24,
    backgroundColor: '#4A9B9B',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  usageCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  templateHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
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
    borderRadius: 18,
    padding: 22,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
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
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 18,
    fontSize: 17,
    color: '#FFF',
    borderWidth: 2,
    borderColor: 'rgba(139, 122, 199, 0.2)',
    fontWeight: '500',
  },
  notesInput: {
    minHeight: 100,
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
  timePickerContainer: {
    backgroundColor: '#121212',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  iosTimePicker: {
    height: 180,
    width: '100%',
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
  repeatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  repeatButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#121212',
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  repeatButtonSelected: {
    backgroundColor: '#8B7AC7',
    borderColor: '#8B7AC7',
  },
  repeatText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  repeatTextSelected: {
    color: '#FFF',
  },
  // AI Quick Add Styles
  aiQuickAddContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  aiInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFF',
    paddingVertical: 8,
    minHeight: 44,
  },
  aiParseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  aiParseButtonDisabled: {
    backgroundColor: '#444',
    opacity: 0.5,
  },
  aiParseButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  aiErrorText: {
    fontSize: 13,
    color: '#C75B6E',
    marginTop: 8,
  },
  aiHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  aiLockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 18,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  aiLockedIcon: {
    width: 56,
    height: 56,
    backgroundColor: '#FFD70020',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  aiLockedContent: {
    flex: 1,
  },
  aiLockedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  aiLockedTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
  aiLockedDescription: {
    fontSize: 14,
    color: '#AAA',
    marginBottom: 6,
  },
  aiLockedExample: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#121212',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
  },
  customDurationInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  customDurationInput: {
    alignItems: 'center',
    gap: 8,
  },
  customInput: {
    backgroundColor: '#0A0A0A',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  customInputLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  customInputSeparator: {
    fontSize: 32,
    fontWeight: '700',
    color: '#666',
    marginBottom: 20,
  },
  modalButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
});
