import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Check, X, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { CATEGORY_CONFIGS, type TaskCategory } from '@/constants/types';

interface OnboardingTaskFormProps {
  onTaskAdded: (task: {
    title: string;
    category: TaskCategory;
    startHour: number;
    startMinute: number;
    duration: number;
  }) => void;
}

export function OnboardingTaskForm({ onTaskAdded }: OnboardingTaskFormProps) {
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>('focus');
  const [startHour, setStartHour] = useState(9);
  const [startMinute, setStartMinute] = useState(0);
  const [duration, setDuration] = useState(60);
  const [showCustomDuration, setShowCustomDuration] = useState(false);
  const [customHours, setCustomHours] = useState('1');
  const [customMinutes, setCustomMinutes] = useState('0');

  const handleSubmit = () => {
    if (title.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onTaskAdded({
        title: title.trim(),
        category: selectedCategory,
        startHour,
        startMinute,
        duration,
      });
    }
  };

  const handleCustomDurationSave = () => {
    const hours = parseInt(customHours) || 0;
    const minutes = parseInt(customMinutes) || 0;
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes > 0 && totalMinutes <= 1440) {
      setDuration(totalMinutes);
      setShowCustomDuration(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const categories = Object.keys(CATEGORY_CONFIGS) as TaskCategory[];
  const isValid = title.trim().length > 0;
  const isCustomDuration = ![30, 60, 90, 120].includes(duration);

  return (
    <View style={styles.container}>
      <View style={styles.inputSection}>
        <Text style={styles.label}>What's your first task?</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Morning workout"
          placeholderTextColor="#555"
          value={title}
          onChangeText={setTitle}
          autoFocus
          returnKeyType="done"
        />
      </View>

      <View style={styles.categorySection}>
        <Text style={styles.label}>Choose a category</Text>
        <View style={styles.categoryGrid}>
          {categories.map((cat) => {
            const config = CATEGORY_CONFIGS[cat];
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  isSelected && {
                    backgroundColor: config.color + '20',
                    borderColor: config.color,
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedCategory(cat);
                }}
              >
                <View
                  style={[
                    styles.categoryDot,
                    { backgroundColor: config.color },
                  ]}
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    isSelected && { color: '#FFF' },
                  ]}
                >
                  {config.label}
                </Text>
                {isSelected && (
                  <Check size={16} color={config.color} strokeWidth={3} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.timeSection}>
        <Text style={styles.label}>Start time</Text>
        <View style={styles.timePickerContainer}>
          <DateTimePicker
            value={(() => {
              const date = new Date();
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

      <View style={styles.durationSection}>
        <Text style={styles.label}>Duration</Text>
        <View style={styles.durationButtons}>
          {[30, 60, 90, 120].map((minutes) => (
            <TouchableOpacity
              key={minutes}
              style={[
                styles.durationButton,
                duration === minutes && {
                  backgroundColor: CATEGORY_CONFIGS[selectedCategory].color + '30',
                  borderColor: CATEGORY_CONFIGS[selectedCategory].color,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDuration(minutes);
              }}
            >
              <Text
                style={[
                  styles.durationText,
                  duration === minutes && { color: '#FFF' },
                ]}
              >
                {minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[
              styles.durationButton,
              isCustomDuration && {
                backgroundColor: CATEGORY_CONFIGS[selectedCategory].color + '30',
                borderColor: CATEGORY_CONFIGS[selectedCategory].color,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCustomDuration(true);
            }}
          >
            <Text
              style={[
                styles.durationText,
                isCustomDuration && { color: '#FFF' },
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

      <TouchableOpacity
        style={[
          styles.addButton,
          {
            backgroundColor: isValid
              ? CATEGORY_CONFIGS[selectedCategory].color
              : '#333',
          },
        ]}
        onPress={handleSubmit}
        disabled={!isValid}
      >
        <Text
          style={[
            styles.addButtonText,
            !isValid && { color: '#666' },
          ]}
        >
          Add to My Day
        </Text>
      </TouchableOpacity>

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
              <Clock size={24} color="#00D9A3" />
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
              style={[styles.modalButton, { backgroundColor: CATEGORY_CONFIGS[selectedCategory].color }]}
              onPress={handleCustomDurationSave}
            >
              <Text style={styles.modalButtonText}>Set Duration</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 24,
  },
  inputSection: {
    gap: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: '#121212',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 17,
    fontWeight: '500',
    color: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categorySection: {
    gap: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  timeSection: {
    gap: 12,
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
    height: 140,
    width: '100%',
  },
  durationSection: {
    gap: 12,
  },
  durationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  durationButton: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999',
  },
  addButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
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
