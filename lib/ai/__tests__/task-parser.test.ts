/**
 * Task Parser Tests
 * Test natural language parsing with common phrases
 */

import { parseNaturalLanguageTask } from '../task-parser';

// Note: These tests require EXPO_PUBLIC_GROQ_API_KEY to be set
// Run with: npm test

describe('Task Parser - Natural Language Processing', () => {
  const testDate = new Date('2025-10-19T09:00:00');

  test('should parse simple task', async () => {
    const result = await parseNaturalLanguageTask('team meeting', testDate);

    expect(result.title).toContain('team meeting');
    expect(result.category).toBe('work');
    expect(result.duration).toBeGreaterThan(0);
  }, 10000); // 10s timeout for API call

  test('should parse task with time', async () => {
    const result = await parseNaturalLanguageTask('team meeting at 10am', testDate);

    expect(result.title).toContain('team meeting');
    expect(result.startTime).toBe(600); // 10:00 AM = 600 minutes
  }, 10000);

  test('should parse task with duration', async () => {
    const result = await parseNaturalLanguageTask('gym session 30 min', testDate);

    expect(result.title).toContain('gym');
    expect(result.category).toBe('health');
    expect(result.duration).toBe(30);
  }, 10000);

  test('should parse urgent task with priority', async () => {
    const result = await parseNaturalLanguageTask('urgent: finish report by 2pm', testDate);

    expect(result.title).toContain('report');
    expect(result.priority).toBe('high');
    expect(result.category).toBe('work');
  }, 10000);

  test('should parse task with date', async () => {
    const result = await parseNaturalLanguageTask('team meeting tomorrow at 10am', testDate);

    expect(result.title).toContain('team meeting');
    expect(result.date).toBeDefined();
    expect(result.startTime).toBe(600);
  }, 10000);

  test('should handle quick tasks', async () => {
    const result = await parseNaturalLanguageTask('quick call with mom', testDate);

    expect(result.title).toContain('call');
    expect(result.category).toBe('personal');
    expect(result.duration).toBeLessThanOrEqual(30);
  }, 10000);

  test('should parse deep work session', async () => {
    const result = await parseNaturalLanguageTask('deep work on project for 2 hours', testDate);

    expect(result.title).toContain('deep work');
    expect(result.duration).toBe(120);
    expect(['work', 'creative', 'focus']).toContain(result.category);
  }, 10000);

  test('should parse social event', async () => {
    const result = await parseNaturalLanguageTask('dinner with friends at 7pm', testDate);

    expect(result.title).toContain('dinner');
    expect(result.category).toBe('social');
    expect(result.startTime).toBe(1140); // 7:00 PM = 1140 minutes
  }, 10000);

  test('should parse learning activity', async () => {
    const result = await parseNaturalLanguageTask('study react native for 1 hour', testDate);

    expect(result.title).toContain('study');
    expect(result.category).toBe('learning');
    expect(result.duration).toBe(60);
  }, 10000);

  test('should parse exercise task', async () => {
    const result = await parseNaturalLanguageTask('morning run 45 minutes', testDate);

    expect(result.title).toContain('run');
    expect(result.category).toBe('health');
    expect(result.duration).toBe(45);
  }, 10000);
});

describe('Task Parser - Edge Cases', () => {
  const testDate = new Date('2025-10-19T09:00:00');

  test('should handle empty input gracefully', async () => {
    await expect(parseNaturalLanguageTask('', testDate)).rejects.toThrow('cannot be empty');
  });

  test('should handle whitespace-only input', async () => {
    await expect(parseNaturalLanguageTask('   ', testDate)).rejects.toThrow('cannot be empty');
  });

  test('should handle very short input', async () => {
    const result = await parseNaturalLanguageTask('meeting', testDate);

    expect(result.title).toBeDefined();
    expect(result.category).toBe('work');
  }, 10000);

  test('should handle very long input', async () => {
    const longInput = 'I need to schedule a comprehensive team meeting to discuss the quarterly planning session and review all the project milestones for the next sprint starting tomorrow at 10am for approximately 2 hours';

    const result = await parseNaturalLanguageTask(longInput, testDate);

    expect(result.title).toBeDefined();
    expect(result.category).toBe('work');
    expect(result.duration).toBeGreaterThan(0);
  }, 10000);
});

describe('Task Parser - Fallback Mode', () => {
  test('should use fallback parser when API fails', async () => {
    // This would test the fallback parser by mocking API failure
    // For now, we can manually test by providing invalid API key
  });
});

// Manual test examples (run these in the app UI)
export const MANUAL_TEST_CASES = [
  'team meeting tomorrow at 10am for 1 hour',
  'gym session 30 min',
  'urgent: finish report by 2pm today',
  'call mom',
  'quick coffee break',
  'deep work session 2h',
  'lunch with team at noon',
  'study typescript 1 hour',
  'morning meditation 15 minutes',
  'project review next monday at 3pm',
  'all day workshop tomorrow',
  'dentist appointment at 2:30pm',
  'weekly planning every monday at 9am',
  'buy groceries this evening',
  'write blog post for 90 minutes',
];
