export type TaskCategory = 'meeting' | 'working' | 'creative' | 'building' | 'focus' | 'personal';

export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly';

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
}

export interface CategoryConfig {
  color: string;
  gradient: [string, string];
  label: string;
}

export const CATEGORY_CONFIGS: Record<TaskCategory, CategoryConfig> = {
  meeting: {
    color: '#4A9B9B',
    gradient: ['#4A9B9B', '#5BBABA'],
    label: 'Meeting',
  },
  working: {
    color: '#C75B6E',
    gradient: ['#C75B6E', '#D86B7E'],
    label: 'Working',
  },
  creative: {
    color: '#8B7AC7',
    gradient: ['#8B7AC7', '#9B8AD7'],
    label: 'Creative',
  },
  building: {
    color: '#A88E4F',
    gradient: ['#A88E4F', '#B89E5F'],
    label: 'Building',
  },
  focus: {
    color: '#6B8ACF',
    gradient: ['#6B8ACF', '#7B9ADF'],
    label: 'Focus',
  },
  personal: {
    color: '#7AC79B',
    gradient: ['#7AC79B', '#8AD7AB'],
    label: 'Personal',
  },
};
