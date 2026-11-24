/**
 * Premium AI model layer.
 *
 * Routes every generation through the Rork proxy's OpenAI-compatible endpoint
 * with a frontier reasoning model, falling back across providers so content
 * generation never hard-fails on one provider.
 *
 * Model choice: anthropic/claude-sonnet-4.6 (structured-output, reasoning,
 * strong curriculum knowledge) with google/gemini-3.1-pro-preview and
 * google/gemini-3.6-flash as language fallbacks.
 */

import { Platform } from 'react-native';

const TOOLKIT_URL = process.env.EXPO_PUBLIC_TOOLKIT_URL ?? 'https://toolkit.rork.com';
const CHAT_URL = `${TOOLKIT_URL}/v2/vercel/v1/chat/completions`;

export const PRIMARY_MODEL = 'anthropic/claude-sonnet-4.6';
export const FALLBACK_MODELS = ['google/gemini-3.1-pro-preview', 'google/gemini-3.6-flash'];

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

function authHeaders(): Record<string, string> {
  // Native and server calls include the project key. On web the Rork runtime
  // injects a short-lived delegated token, so no secret is exposed to the browser.
  if (Platform.OS === 'web') return {};
  const key = process.env.EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY;
  return key ? { Authorization: `Bearer ${key}` } : {};
}

async function callChat(model: string, messages: ChatMessage[], maxTokens: number, temperature: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);
  try {
    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`AI gateway ${response.status} for ${model}: ${await response.text().catch(() => '')}`);
    }
    const data = await response.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || content.length === 0) {
      throw new Error(`Empty completion from ${model}`);
    }
    return content;
  } finally {
    clearTimeout(timer);
  }
}

export async function generateWithModel(params: {
  system?: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const fullMessages: ChatMessage[] = params.system
    ? [{ role: 'system', content: params.system }, ...params.messages]
    : params.messages;
  const maxTokens = params.maxTokens ?? 4000;
  const temperature = params.temperature ?? 0.7;

  let lastError: unknown = null;
  for (const model of [PRIMARY_MODEL, ...FALLBACK_MODELS]) {
    try {
      return await callChat(model, fullMessages, maxTokens, temperature);
    } catch (error) {
      lastError = error;
      console.warn(`[AIModel] ${model} failed:`, error instanceof Error ? error.message : error);
    }
  }
  throw lastError instanceof Error ? lastError : new Error('All AI models failed');
}

/** Extract the first JSON object/array from a model response (handles code fences). */
export function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced ? fenced[1] : raw).trim();
  try {
    return JSON.parse(candidate);
  } catch {
    // Model may have wrapped prose around the JSON — take outermost braces.
    const start = candidate.search(/[[{]/);
    const end = Math.max(candidate.lastIndexOf('}'), candidate.lastIndexOf(']'));
    if (start >= 0 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new Error('Model returned unparseable JSON');
  }
}
