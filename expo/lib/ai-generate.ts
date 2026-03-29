import { generateText, generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';

const MAX_RETRIES = 3;
const BASE_DELAY = 2000;
const REQUEST_TIMEOUT = 120000;

let activeRequests = 0;
const MAX_CONCURRENT = 2;
const requestQueue: Array<() => void> = [];

function waitForSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT) {
    activeRequests++;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    requestQueue.push(() => {
      activeRequests++;
      resolve();
    });
  });
}

function releaseSlot() {
  activeRequests--;
  if (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT) {
    const next = requestQueue.shift();
    next?.();
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Request timed out. Please try again.'));
    }, ms);
    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('timeout') ||
      msg.includes('network') ||
      msg.includes('fetch') ||
      msg.includes('429') ||
      msg.includes('rate limit') ||
      msg.includes('too many') ||
      msg.includes('503') ||
      msg.includes('502') ||
      msg.includes('500') ||
      msg.includes('overloaded') ||
      msg.includes('busy') ||
      msg.includes('unavailable')
    );
  }
  return false;
}

type UserMessage = { role: 'user'; content: string | Array<{ type: 'text'; text: string } | { type: 'image'; image: string }> };
type AssistantMessage = { role: 'assistant'; content: string | Array<{ type: 'text'; text: string }> };
type Message = UserMessage | AssistantMessage;

export async function robustGenerateText(params: { messages: Message[] }): Promise<string> {
  await waitForSlot();
  let lastError: Error | null = null;

  try {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          const backoff = BASE_DELAY * Math.pow(2, attempt - 1) + Math.random() * 1000;
          console.log(`[AI] Retry attempt ${attempt + 1}/${MAX_RETRIES} after ${Math.round(backoff)}ms`);
          await delay(backoff);
        }

        console.log(`[AI] generateText attempt ${attempt + 1}/${MAX_RETRIES}`);
        const result = await withTimeout(
          generateText({ messages: params.messages }),
          REQUEST_TIMEOUT
        );
        console.log(`[AI] generateText succeeded on attempt ${attempt + 1}`);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`[AI] generateText attempt ${attempt + 1} failed:`, lastError.message);

        if (!isRetryableError(error) && attempt > 0) {
          break;
        }
      }
    }
  } finally {
    releaseSlot();
  }

  throw lastError ?? new Error('AI generation failed after multiple attempts. Please try again.');
}

export async function robustGenerateObject<T extends z.ZodType>(params: {
  messages: Message[];
  schema: T;
}): Promise<z.infer<T>> {
  await waitForSlot();
  let lastError: Error | null = null;

  try {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          const backoff = BASE_DELAY * Math.pow(2, attempt - 1) + Math.random() * 1000;
          console.log(`[AI] Retry attempt ${attempt + 1}/${MAX_RETRIES} after ${Math.round(backoff)}ms`);
          await delay(backoff);
        }

        console.log(`[AI] generateObject attempt ${attempt + 1}/${MAX_RETRIES}`);
        const result = await withTimeout(
          generateObject({ messages: params.messages, schema: params.schema }),
          REQUEST_TIMEOUT
        );
        console.log(`[AI] generateObject succeeded on attempt ${attempt + 1}`);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`[AI] generateObject attempt ${attempt + 1} failed:`, lastError.message);

        if (!isRetryableError(error) && attempt > 0) {
          break;
        }
      }
    }
  } finally {
    releaseSlot();
  }

  throw lastError ?? new Error('AI generation failed after multiple attempts. Please try again.');
}
