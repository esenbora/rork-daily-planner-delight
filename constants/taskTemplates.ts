import { TaskCategory } from './types';

export interface TaskTemplate {
  id: string;
  name: string;
  category: TaskCategory;
  duration: number;
  description: string;
  isPremium: boolean;
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'morning-routine',
    name: 'Morning Routine',
    category: 'personal',
    duration: 60,
    description: 'Start your day right',
    isPremium: false,
  },
  {
    id: 'deep-work',
    name: 'Deep Work Session',
    category: 'focus',
    duration: 120,
    description: 'Focused work without distractions',
    isPremium: true,
  },
  {
    id: 'team-standup',
    name: 'Team Standup',
    category: 'meeting',
    duration: 15,
    description: 'Daily sync with the team',
    isPremium: false,
  },
  {
    id: 'lunch-break',
    name: 'Lunch Break',
    category: 'personal',
    duration: 60,
    description: 'Time to recharge',
    isPremium: false,
  },
  {
    id: 'creative-brainstorm',
    name: 'Creative Brainstorm',
    category: 'creative',
    duration: 90,
    description: 'Generate new ideas',
    isPremium: true,
  },
  {
    id: 'project-planning',
    name: 'Project Planning',
    category: 'working',
    duration: 120,
    description: 'Plan and organize project tasks',
    isPremium: true,
  },
  {
    id: 'code-review',
    name: 'Code Review',
    category: 'building',
    duration: 60,
    description: 'Review and provide feedback',
    isPremium: true,
  },
  {
    id: 'workout',
    name: 'Workout',
    category: 'personal',
    duration: 45,
    description: 'Exercise and stay healthy',
    isPremium: true,
  },
  {
    id: 'client-meeting',
    name: 'Client Meeting',
    category: 'meeting',
    duration: 60,
    description: 'Discuss project updates',
    isPremium: true,
  },
  {
    id: 'learning-time',
    name: 'Learning Time',
    category: 'focus',
    duration: 60,
    description: 'Learn something new',
    isPremium: true,
  },
];
