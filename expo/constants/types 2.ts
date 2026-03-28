export type TaskCategory = 'meeting' | 'working' | 'creative' | 'building' | 'focus' | 'personal';

export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  startTime: number;
  duration: number;
  date: string;
  completed: boolean;
  repeatType: RepeatType;
  repeatEndDate?: string;
  notes?: string;
  priority?: TaskPriority;
  order: number;
}

export interface TaskTemplate {
  id: string;
  name: string;
  title: string;
  category: TaskCategory;
  duration: number;
  notes?: string;
  priority?: TaskPriority;
  defaultStartTime?: number; // Optional default start time
  createdAt: string;
  usageCount: number;
}

export interface CategoryConfig {
  color: string;
  gradient: [string, string];
  label: string;
}

export const CATEGORY_CONFIGS: Record<TaskCategory, CategoryConfig> = {
  meeting: {
    color: '#00D9A3', // Bright Green
    gradient: ['#00D9A3', '#33E3B8'],
    label: 'Meeting',
  },
  working: {
    color: '#D946A6', // Magenta/Pink
    gradient: ['#D946A6', '#E879C0'],
    label: 'Working',
  },
  creative: {
    color: '#8B5CF6', // Purple
    gradient: ['#8B5CF6', '#A78BFA'],
    label: 'Creative',
  },
  building: {
    color: '#F59E0B', // Amber/Gold
    gradient: ['#F59E0B', '#FBB042'],
    label: 'Building',
  },
  focus: {
    color: '#3B82F6', // Blue
    gradient: ['#3B82F6', '#60A5FA'],
    label: 'Focus',
  },
  personal: {
    color: '#EF4444', // Red
    gradient: ['#EF4444', '#F87171'],
    label: 'Personal',
  },
};

// Default task templates (Premium feature)
export const DEFAULT_TEMPLATES: TaskTemplate[] = [
  {
    id: 'template-1',
    name: '☕ Morning Coffee',
    title: 'Morning Coffee & Planning',
    category: 'personal',
    duration: 30,
    notes: 'Review daily goals and prepare for the day',
    priority: 'medium',
    defaultStartTime: 480, // 8:00 AM
    createdAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: 'template-2',
    name: '💻 Deep Work Session',
    title: 'Deep Work - Focus Time',
    category: 'focus',
    duration: 120,
    notes: 'Uninterrupted work on important tasks',
    priority: 'high',
    defaultStartTime: 540, // 9:00 AM
    createdAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: 'template-3',
    name: '📧 Email Processing',
    title: 'Check & Respond to Emails',
    category: 'working',
    duration: 30,
    notes: 'Clear inbox and respond to urgent messages',
    priority: 'medium',
    createdAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: 'template-4',
    name: '🤝 Team Standup',
    title: 'Daily Team Standup',
    category: 'meeting',
    duration: 15,
    notes: 'Quick sync with the team',
    priority: 'high',
    defaultStartTime: 600, // 10:00 AM
    createdAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: 'template-5',
    name: '🍽️ Lunch Break',
    title: 'Lunch & Rest',
    category: 'personal',
    duration: 60,
    notes: 'Take a proper break and recharge',
    priority: 'medium',
    defaultStartTime: 720, // 12:00 PM
    createdAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: 'template-6',
    name: '🏃 Exercise',
    title: 'Workout / Exercise',
    category: 'personal',
    duration: 45,
    notes: 'Physical activity for health',
    priority: 'high',
    defaultStartTime: 1020, // 5:00 PM
    createdAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: 'template-7',
    name: '🎨 Creative Project',
    title: 'Creative Work',
    category: 'creative',
    duration: 90,
    notes: 'Time for creative thinking and ideation',
    priority: 'medium',
    createdAt: new Date().toISOString(),
    usageCount: 0,
  },
  {
    id: 'template-8',
    name: '📚 Learning Time',
    title: 'Study / Learning',
    category: 'focus',
    duration: 60,
    notes: 'Dedicated time for learning new skills',
    priority: 'medium',
    createdAt: new Date().toISOString(),
    usageCount: 0,
  },
];
