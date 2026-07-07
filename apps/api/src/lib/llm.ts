/**
 * Minimal LLM helper. Direct fetch against Anthropic Messages API
 * when ANTHROPIC_API_KEY is set, stub otherwise. No SDK dependency
 * since we only need one shape of call (chat with system + user).
 *
 * Used by the espíritu tick (lib/tick.ts) and any future surfaces
 * that need a one-shot reasoning step.
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Default to Haiku 4.5 because tick decisions are short JSON
// payloads. Sonnet / Opus are overkill and ~5-15x the cost. Override
// with LLM_MODEL when you want better reasoning on a specific
// surface.
const DEFAULT_MODEL = process.env.LLM_MODEL || 'claude-haiku-4-5-20251001';

// Daily ceiling on real LLM calls across the whole API process.
// Cheap dev safety net — the process resets the counter at midnight
// local time. Set LLM_DAILY_BUDGET=0 to disable.
const DAILY_BUDGET = parseInt(process.env.LLM_DAILY_BUDGET || '200', 10);

let dailyCount = 0;
let dailyDate = new Date().toDateString();

function bumpDailyCounter(): { count: number; budget: number; over: boolean } {
  const today = new Date().toDateString();
  if (today !== dailyDate) {
    dailyDate = today;
    dailyCount = 0;
  }
  dailyCount += 1;
  const over = DAILY_BUDGET > 0 && dailyCount > DAILY_BUDGET;
  return { count: dailyCount, budget: DAILY_BUDGET, over };
}

export interface LlmCallOptions {
  /**
   * System prompt. Marked for Anthropic prompt caching by default
   * (the system block rarely changes between calls in the espíritu
   * tick, so caching it cuts ~80% of input cost on repeat calls).
   */
  system: string;
  /** Per-call user prompt. Not cached. */
  user: string;
  model?: string;
  maxTokens?: number;
  /** Disable caching of the system block when the system prompt is one-shot. */
  cacheSystem?: boolean;
}

export interface LlmResult {
  text: string;
  source: 'anthropic' | 'stub';
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
}

export class LlmBudgetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LlmBudgetError';
  }
}

export function hasLlmProvider(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export function getDailyCounters() {
  return { count: dailyCount, budget: DAILY_BUDGET, date: dailyDate };
}

export async function callLlm(options: LlmCallOptions): Promise<LlmResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return { text: '', source: 'stub' };
  }

  const status = bumpDailyCounter();
  if (status.over) {
    dailyCount -= 1; // do not consume budget for a refused call
    throw new LlmBudgetError(
      `Daily LLM call budget exceeded (${status.budget}). Increase LLM_DAILY_BUDGET or wait for tomorrow.`
    );
  }

  // Anthropic prompt caching: send system as a content block with
  // cache_control. After the first call, repeat calls with the same
  // system block read from cache at ~10% of full input price.
  const cacheSystem = options.cacheSystem !== false;
  const systemBlock = cacheSystem
    ? [{ type: 'text', text: options.system, cache_control: { type: 'ephemeral' } }]
    : options.system;

  const body = {
    model: options.model || DEFAULT_MODEL,
    max_tokens: options.maxTokens || 512,
    system: systemBlock,
    messages: [{ role: 'user', content: options.user }],
  };

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Anthropic API error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
    usage?: LlmResult['usage'];
  };
  const rawText = (json.content || [])
    .filter((c) => c.type === 'text' && typeof c.text === 'string')
    .map((c) => c.text)
    .join('\n')
    .trim();

  // Master rule: no em dashes in any Boveda generation, ever. Applied
  // here at the single LLM exit so every downstream caller (forge,
  // tick, spark, atmospheric event, nuance, cohort phrase extraction)
  // receives clean text without each having to remember to call the
  // stripper. Includes the en-dash and any LLM-output two-character
  // em-dash impersonators.
  const text = scrubEmDashes(rawText);

  return { text, source: 'anthropic', usage: json.usage };
}

/** Master em-dash scrub. Removes em dash (U+2014), en dash (U+2013),
 *  and the ASCII " -- " variant the LLM sometimes produces when told
 *  not to use em dashes. Single source of truth lives in
 *  strip-em-dashes.ts; this is a small inline copy to keep llm.ts
 *  self-contained at the API exit. */
function scrubEmDashes(input: string): string {
  if (!input) return input;
  return input
    .replace(/[\u2014\u2013]/g, ', ')
    .replace(/ -- /g, ', ')
    .replace(/ {2,}/g, ' ')
    .replace(/ ,/g, ',');
}
