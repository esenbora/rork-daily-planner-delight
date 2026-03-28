/**
 * AI-Powered Natural Language Task Parser
 * Uses Groq LLM to parse natural language input into structured task data
 */

import { jsonCompletion, isGroqConfigured, groqRateLimiter, GROQ_MODELS } from '@/lib/groq';
import { TaskCategory, TaskPriority } from '@/constants/types';
import { formatDate } from '@/utils/dateHelpers';

export interface ParsedTask {
  title: string;
  category: TaskCategory;
  duration: number;
  startTime?: number;
  date?: string;
  priority?: TaskPriority;
  notes?: string;
}

interface TaskParseResponse {
  title: string;
  category: TaskCategory;
  duration: number;
  startTime?: number;
  date?: string;
  priority?: TaskPriority;
  notes?: string;
  confidence: number;
}

const SYSTEM_PROMPT = `You are an expert task parser for a daily planner app. Parse natural language input into structured task data.

AVAILABLE CATEGORIES:
- meeting: Meetings, calls, video conferences
- working: Professional tasks, work projects, emails
- creative: Art, writing, design projects, creative work
- building: Development, construction, making things
- focus: Deep work, focused sessions, concentration work
- personal: Errands, shopping, personal tasks, daily activities

PRIORITY LEVELS:
- high: Urgent and important
- medium: Important but not urgent
- low: Nice to have

TIME PARSING RULES:
- "9am", "9:00", "9" → startTime: 540 (minutes from midnight)
- "2:30pm" → startTime: 870
- "tomorrow" → date: tomorrow's date
- "next monday" → date: next Monday's date
- Default duration: 60 minutes for most tasks, 30 for quick tasks, 120 for deep work

DURATION PARSING:
- "quick", "5 min", "short" → 15-30 minutes
- "1h", "1 hour", "an hour" → 60 minutes
- "2h", "2 hours" → 120 minutes
- "all day", "full day" → 480 minutes (8 hours)
- Default if not specified: 60 minutes

EXAMPLES:
Input: "team meeting tomorrow at 10am for 1 hour"
Output: { title: "Team meeting", category: "work", duration: 60, startTime: 600, date: "[tomorrow]", priority: "medium" }

Input: "gym session 30 min"
Output: { title: "Gym session", category: "health", duration: 30, priority: "medium" }

Input: "urgent: finish report by 2pm today"
Output: { title: "Finish report", category: "work", duration: 120, startTime: 840, priority: "high", notes: "Due by 2pm" }

Input: "call mom"
Output: { title: "Call mom", category: "personal", duration: 30, priority: "medium" }

CONFIDENCE SCORE:
- 0.9-1.0: All details clear
- 0.7-0.9: Most details clear, some assumptions
- 0.5-0.7: Partial information
- 0.0-0.5: Very vague input

Respond ONLY with valid JSON matching this structure:
{
  "title": string,
  "category": TaskCategory,
  "duration": number,
  "startTime": number | undefined,
  "date": string | undefined,
  "priority": TaskPriority,
  "notes": string | undefined,
  "confidence": number
}`;

/**
 * Parse natural language input into structured task data
 * @param input - Natural language task description
 * @param contextDate - Optional context date (defaults to today)
 * @returns Parsed task data
 */
export async function parseNaturalLanguageTask(
  input: string,
  contextDate?: Date
): Promise<ParsedTask> {
  // Validate input
  if (!input || input.trim().length === 0) {
    throw new Error('Task input cannot be empty');
  }

  // Check if Groq is configured
  if (!isGroqConfigured()) {
    throw new Error('Groq API key not configured. Please add EXPO_PUBLIC_GROQ_API_KEY to your .env file');
  }

  // Check rate limits
  if (!groqRateLimiter.canMakeRequest()) {
    const remaining = groqRateLimiter.getRemainingRequests();
    throw new Error(
      `Rate limit exceeded. Requests remaining: ${remaining.perMinute}/min, ${remaining.perDay}/day`
    );
  }

  // Prepare context
  const today = contextDate || new Date();
  const todayStr = formatDate(today);
  const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });

  const userPrompt = `Parse this task input: "${input}"

Context:
- Today is ${dayOfWeek}, ${todayStr}
- Current time: ${today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}

Remember: Use the date format YYYY-MM-DD. If no date mentioned, leave date undefined (task is for today).`;

  try {
    // Record request for rate limiting
    groqRateLimiter.recordRequest();

    // Call Groq API
    const response = await jsonCompletion<TaskParseResponse>(
      SYSTEM_PROMPT,
      userPrompt,
      {
        model: GROQ_MODELS.LLAMA_70B, // Use the most accurate model
        temperature: 0.3, // Low temperature for consistent parsing
      }
    );

    // Validate response
    if (!response.title || !response.category || !response.duration) {
      throw new Error('Invalid AI response: missing required fields');
    }

    // Return parsed task (excluding confidence score)
    const { confidence, ...parsedTask } = response;

    return parsedTask;
  } catch (error) {
    console.error('Task parsing error:', error);

    // Fallback to basic parsing
    console.warn('Falling back to basic task parsing');
    return fallbackParser(input, today);
  }
}

/**
 * Fallback parser for when AI fails
 * Provides basic task creation from input
 */
function fallbackParser(input: string, contextDate: Date): ParsedTask {
  const title = input.trim();

  // Detect category from keywords
  let category: TaskCategory = 'personal';
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes('meeting') || lowerInput.includes('call') || lowerInput.includes('conference')) {
    category = 'meeting';
  } else if (lowerInput.includes('work') || lowerInput.includes('email') || lowerInput.includes('project')) {
    category = 'working';
  } else if (lowerInput.includes('design') || lowerInput.includes('write') || lowerInput.includes('creative')) {
    category = 'creative';
  } else if (lowerInput.includes('build') || lowerInput.includes('develop') || lowerInput.includes('code')) {
    category = 'building';
  } else if (lowerInput.includes('focus') || lowerInput.includes('deep work') || lowerInput.includes('concentrate')) {
    category = 'focus';
  }

  // Detect duration from keywords
  let duration = 60; // Default 1 hour
  if (lowerInput.includes('quick') || lowerInput.includes('5 min') || lowerInput.includes('short')) {
    duration = 30;
  } else if (lowerInput.includes('2h') || lowerInput.includes('2 hour')) {
    duration = 120;
  } else if (lowerInput.includes('all day') || lowerInput.includes('full day')) {
    duration = 480;
  }

  // Detect priority
  let priority: TaskPriority = 'medium';
  if (lowerInput.includes('urgent') || lowerInput.includes('important') || lowerInput.includes('asap')) {
    priority = 'high';
  }

  return {
    title,
    category,
    duration,
    priority,
  };
}

/**
 * Batch parse multiple task inputs
 * Useful for importing tasks from text
 */
export async function parseBatchTasks(
  inputs: string[],
  contextDate?: Date
): Promise<ParsedTask[]> {
  const results: ParsedTask[] = [];

  for (const input of inputs) {
    try {
      const parsed = await parseNaturalLanguageTask(input, contextDate);
      results.push(parsed);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to parse task: "${input}"`, error);
      // Continue with next task
    }
  }

  return results;
}

/**
 * Check if AI task parsing is available
 */
export function isAIParsingAvailable(): boolean {
  return isGroqConfigured() && groqRateLimiter.canMakeRequest();
}

/**
 * Get remaining AI parsing requests
 */
export function getAIParsingLimits() {
  return groqRateLimiter.getRemainingRequests();
}
