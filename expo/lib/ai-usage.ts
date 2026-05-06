/**
 * Module-level AI usage tracker. Enforces daily AI generation limits.
 * Free users: 5/day, Premium users: 10/day.
 *
 * The app-context bridges its persisted state into this module via
 * `setAIUsageContext` so that `enforceAIQuota` can be called from
 * pure-function locations (like lib/ai-generate.ts) without needing
 * a React hook.
 */

export const FREE_DAILY_AI_LIMIT = 5;
export const PREMIUM_DAILY_AI_LIMIT = 10;

export class AILimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AILimitError';
  }
}

export interface AIUsageState {
  date: string;
  count: number;
}

interface AIUsageContext {
  isPremium: boolean;
  getUsage: () => AIUsageState;
  incrementUsage: () => void;
}

let ctx: AIUsageContext | null = null;

export function setAIUsageContext(next: AIUsageContext | null) {
  ctx = next;
}

export function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDailyLimit(isPremium: boolean): number {
  return isPremium ? PREMIUM_DAILY_AI_LIMIT : FREE_DAILY_AI_LIMIT;
}

/**
 * Throws AILimitError when the user is over the daily quota.
 * Increments usage on success.
 */
export function enforceAIQuota(): void {
  if (!ctx) {
    // No context bridged yet — allow but warn.
    console.log('[AIUsage] No context bridged, skipping quota check');
    return;
  }

  const limit = getDailyLimit(ctx.isPremium);
  const usage = ctx.getUsage();
  const today = todayString();
  const currentCount = usage.date === today ? usage.count : 0;

  if (currentCount >= limit) {
    const planLabel = ctx.isPremium ? 'Premium' : 'Free';
    throw new AILimitError(
      `Daily AI limit reached (${currentCount}/${limit} for ${planLabel}). ${
        ctx.isPremium ? 'Try again tomorrow.' : 'Upgrade to Premium for more.'
      }`
    );
  }

  ctx.incrementUsage();
}
