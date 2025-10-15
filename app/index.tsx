import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Plus, List, Download } from 'lucide-react-native';
import { useTasks } from '@/contexts/TaskContext';
import { TimeWheel } from '@/components/TimeWheel';
import { formatMonthDay, getDayName, addDays } from '@/utils/dateHelpers';
import { AddTaskModal } from '@/components/AddTaskModal';

export default function PlannerScreen() {
  const insets = useSafeAreaInsets();
  const { selectedDate, setSelectedDate, selectedDateTasks, scheduledMinutes } = useTasks();
  const [isAddModalVisible, setIsAddModalVisible] = useState<boolean>(false);

  const handlePreviousDay = () => {
    setSelectedDate(addDays(selectedDate, -1));
  };

  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  return (
    <View style={styles.container}>
      <View style={[styles.backgroundHeader, { height: insets.top }]} />
      <StatusBar barStyle="light-content" />
      
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.iconButton}>
          <List color="#FFF" size={24} />
        </TouchableOpacity>
        
        <View style={styles.dateSelector}>
          <TouchableOpacity onPress={handlePreviousDay} style={styles.chevronButton}>
            <ChevronLeft color="#FFF" size={20} />
          </TouchableOpacity>
          
          <View style={styles.dateInfo}>
            <Text style={styles.dateText}>{formatMonthDay(selectedDate)}</Text>
          </View>
          
          <TouchableOpacity onPress={handleNextDay} style={styles.chevronButton}>
            <ChevronRight color="#FFF" size={20} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.iconButton}>
          <Download color="#FFF" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.wheelContainer}>
          <TimeWheel 
            tasks={selectedDateTasks} 
            scheduledMinutes={scheduledMinutes}
            dayName={getDayName(selectedDate)}
          />
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{selectedDateTasks.length}</Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.round(scheduledMinutes / 60)}h</Text>
            <Text style={styles.statLabel}>Scheduled</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.round((1440 - scheduledMinutes) / 60)}h</Text>
            <Text style={styles.statLabel}>Free</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setIsAddModalVisible(true)}
        >
          <Plus color="#0A0A0A" size={20} strokeWidth={2.5} />
          <Text style={styles.addButtonText}>New Task</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <AddTaskModal
          selectedDate={selectedDate}
          onClose={() => setIsAddModalVisible(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  backgroundHeader: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0A0A0A',
    zIndex: 1,
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
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chevronButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
  },
  dateInfo: {
    alignItems: 'center',
    minWidth: 80,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  wheelContainer: {
    marginBottom: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 32,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#1A1A1A',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A0A0A',
    letterSpacing: 0.3,
  },
});
