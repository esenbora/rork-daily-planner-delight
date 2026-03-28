/**
 * Groq AI Service
 * Ultra-fast LLM inference using Groq's LPU technology
 */

import Groq from 'groq-sdk';
import { config } from '@/utils/env';

// Initialize Groq client
const groq = new Groq({
  apiKey: config.groqApiKey,
  dangerouslyAllowBrowser: true, // For React Native/Web
});

// Model selection
export const GROQ_MODELS = {
  LLAMA_70B: 'llama-3.3-70b-versatile', // Best quality, ~300 tokens/s
  LLAMA_8B: 'llama-3.1-8b-instant', // Fastest, ~800 tokens/s
  MIXTRAL: 'mixtral-8x7b-32768', // Alternative, good quality
} as const;

export type GroqModel = (typeof GROQ_MODELS)[keyof typeof GROQ_MODELS];

/**
 * Chat completion with Groq
 * @param messages - Chat messages array
 * @param options - Optional parameters
 */
export async function chatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: {
    model?: GroqModel;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  }
) {
  try {
    const response = await groq.chat.completions.create({
      messages,
      model: options?.model || GROQ_MODELS.LLAMA_70B,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
      stream: options?.stream ?? false,
    });

    return response;
  } catch (error) {
    console.error('Groq API Error:', error);
    throw new Error('Failed to get AI response');
  }
}

/**
 * Streaming chat completion
 * @param messages - Chat messages
 * @param onChunk - Callback for each chunk
 */
export async function streamChatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  onChunk: (text: string) => void,
  options?: {
    model?: GroqModel;
    temperature?: number;
  }
) {
  try {
    const stream = await groq.chat.completions.create({
      messages,
      model: options?.model || GROQ_MODELS.LLAMA_70B,
      temperature: options?.temperature ?? 0.7,
      max_tokens: 2048,
      stream: true,
    });

    let fullText = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullText += content;
      if (content) {
        onChunk(content);
      }
    }

    return fullText;
  } catch (error) {
    console.error('Groq Streaming Error:', error);
    throw new Error('Failed to stream AI response');
  }
}

/**
 * JSON mode - for structured output
 * @param prompt - User prompt
 * @param schema - Expected JSON schema description
 */
export async function jsonCompletion<T = any>(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    model?: GroqModel;
    temperature?: number;
  }
): Promise<T> {
  try {
    const response = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt + '\n\nRespond ONLY with valid JSON.' },
        { role: 'user', content: userPrompt },
      ],
      model: options?.model || GROQ_MODELS.LLAMA_70B,
      temperature: options?.temperature ?? 0.3, // Lower temp for structured output
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    return JSON.parse(content) as T;
  } catch (error) {
    console.error('Groq JSON Error:', error);
    throw new Error('Failed to parse AI JSON response');
  }
}

/**
 * Check if Groq is configured
 */
export function isGroqConfigured(): boolean {
  return !!config.groqApiKey && config.groqApiKey !== 'your-groq-api-key';
}

/**
 * Rate limiting helper
 * Free tier: 30 requests/minute, 14,400/day
 */
class RateLimiter {
  private requests: number[] = [];
  private readonly maxPerMinute = 30;
  private readonly maxPerDay = 14400;

  canMakeRequest(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Remove old requests
    this.requests = this.requests.filter(time => time > oneDayAgo);

    const recentRequests = this.requests.filter(time => time > oneMinuteAgo);

    return recentRequests.length < this.maxPerMinute && this.requests.length < this.maxPerDay;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getRemainingRequests(): { perMinute: number; perDay: number } {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    this.requests = this.requests.filter(time => time > oneDayAgo);
    const recentRequests = this.requests.filter(time => time > oneMinuteAgo);

    return {
      perMinute: this.maxPerMinute - recentRequests.length,
      perDay: this.maxPerDay - this.requests.length,
    };
  }
}

export const groqRateLimiter = new RateLimiter();
