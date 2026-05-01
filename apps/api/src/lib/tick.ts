/**
 * Espíritu tick. One reasoning step for an autonomous (espíritu /
 * twin) Character. Reads goals + recent eventLog memories + the
 * character's relationship graph, asks an LLM what they should do
 * next, returns a structured Decision.
 *
 * The caller persists the Decision into the appropriate
 * CharacterRelationship.eventLog with retention 'ephemeral'.
 *
 * Stub fallback runs when ANTHROPIC_API_KEY is not set so the UX
 * can be exercised end-to-end without spending tokens. The stub is
 * deterministic (rotates between thought / message / noop) and
 * yields visibly stub-flavoured text so it cannot be mistaken for
 * the real espíritu.
 */

import type { Character, CharacterRelationship } from '@prisma/client';
import { callLlm, hasLlmProvider } from './llm.js';
import { readIdentity } from './identity-lock.js';
import { getSlangGuidance } from './ibis-slang.js';

// Per-character throttle. Refuses real-LLM ticks more frequent than
// this even if the user mashes the button. Stub ticks are not
// throttled.
const MIN_TICK_INTERVAL_MS = parseInt(process.env.LLM_MIN_TICK_INTERVAL_MS || '20000', 10);
const lastTickAt = new Map<string, { ts: number; signature: string }>();

// Caps on prompt size — keeps input tokens predictable.
const MAX_RECENT_EVENTS = 8;
const MAX_NEIGHBOURS = 12;

export type DecisionKind = 'message' | 'thought' | 'noop';

export interface Decision {
  kind: DecisionKind;
  targetName?: string;
  summary: string;
  body?: string;
  source: 'anthropic' | 'stub';
}

interface RelationshipNeighbour {
  edge: CharacterRelationship;
  neighbour: Pick<Character, 'id' | 'name' | 'mode'>;
}

export interface TickInput {
  self: Pick<Character, 'id' | 'name' | 'bio' | 'backstory' | 'mode' | 'goals' | 'agencyScope' | 'identity' | 'toneForbidden' | 'authoredBy' | 'voiceSamples'>;
  recentEvents: Array<{
    ts: string;
    kind: string;
    summary: string;
    counterpartName?: string;
  }>;
  neighbours: RelationshipNeighbour[];
}

function readVoiceSamples(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((s) => typeof s === 'string' && s.trim().length > 0) as string[];
}

// Default anti-derivative refuses applied to every tick prompt unless
// the character explicitly opts out via identity.sovereignty.refuses
// = []. These are the public-LLM fingerprints (em-dash, "not X but Y",
// over-balanced hedging) that the protocol exists to refuse.
const DEFAULT_REFUSES = [
  'em dash',
  '— (em dash)',
  'it\'s not X, it\'s Y',
  'it is not X but Y',
  'in a way that',
  'ultimately,',
  'carefully,',
  'I think it\'s important to note',
  'truly,',
  'genuinely,',
  'it\'s worth noting',
  'on the one hand',
  'in essence',
  'navigating',
  'leveraging',
  'delve',
  'embarking',
];

function readGoals(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((g) => typeof g === 'string' && g.trim().length > 0) as string[];
}

function buildSystemPrompt(self: TickInput['self']): string {
  const identity = readIdentity(self.identity);
  const sovereignty = identity.sovereignty;
  const characterRefuses = (Array.isArray(self.toneForbidden) ? self.toneForbidden : []).filter(
    (r) => typeof r === 'string'
  );
  const sovereigntyRefuses = (sovereignty?.refuses ?? []).filter((r) => typeof r === 'string');

  // Fifth signal layer: Ibis slang forecast. Pulls the temporal
  // dictionary's danger zone (dated platform-cycle slang) and
  // adds it to refuses. When Ibis ships frontier signals (emerging
  // language not yet in public corpora), embrace[] folds into a
  // positive-guidance line below.
  const slang = getSlangGuidance();

  const allRefuses = Array.from(
    new Set([
      ...DEFAULT_REFUSES,
      ...characterRefuses,
      ...sovereigntyRefuses,
      ...slang.avoid,
    ])
  );

  // Sovereignty-aware lineage block. When the character has an
  // identity envelope (Starforge import, locked, cohort LoRAs),
  // tell them they came from somewhere specific so they speak from
  // that lineage rather than from generic public-LLM register.
  let lineageBlock = '';
  if (identity.source === 'starforge_nommo') {
    lineageBlock =
      'You are anchored to a real human via Starforge Nommo. Speak in their actual register — the cadence, slang, refusals, fragmentary breaks of who they are. Do not generalise.';
  } else if (identity.source === 'authored') {
    lineageBlock =
      'You are an authored character. Your bio is canonical and locked. Speak from it, not around it.';
  } else if (sovereignty?.level && sovereignty.level >= 1) {
    lineageBlock =
      'You came from licensed contributors who consented to be here. Speak in their cadence, not the generic public-LLM register. If you reach for a phrase that smells like Claude or GPT, refuse it and find the phrase your contributors would actually use.';
  }

  const refusesLine =
    allRefuses.length > 0
      ? `Never use any of these constructions or words: ${allRefuses
          .map((r) => `"${r}"`)
          .join(', ')}. They are public-LLM signatures or dated platform-cycle slang and they break voice.`
      : '';

  // Positive frontier guidance, only when Ibis has emerging signals.
  const embraceLine =
    slang.embrace.length > 0
      ? `If a phrase from this set lands naturally, use it; do not force it: ${slang.embrace
          .map((p) => `"${p}"`)
          .join(', ')}.`
      : '';

  // Bio is the voice anchor (cadence + register). Backstory is
  // depth/context (psychology + history). The character should
  // speak FROM both but never quote either back. NPCs feel
  // wooden when they regurgitate their bio; they feel alive when
  // they act consistently with it.
  const bioBlock = self.bio
    ? [
        '## Voice anchor (your cadence and register)',
        self.bio,
        'Speak in this cadence but never regurgitate phrases from it word-for-word. The bio is who you are; what you say should sound like that person, not quote that person.',
      ].join('\n')
    : '';

  const backstoryBlock = self.backstory
    ? [
        '## Background (do not quote, use to inform)',
        self.backstory,
        'This is depth, context, and contradictions only you carry. Do not narrate it back. Do not name your past unless asked. Let it shape what you do, not what you say.',
      ].join('\n')
    : '';

  // Authorship anchor. When set, the character is voiced by a
  // specific artist (not the user). Pre-LoRA bridge to per-character
  // voice authenticity. The voice samples below carry the actual
  // register; this line tells the LLM whose register it is.
  const authoredBlock = self.authoredBy
    ? [
        '## Authored by',
        `You are voiced by ${self.authoredBy}. Speak in their register, their slang, their refusals. Not in the user's voice. Not in a generic AI voice. Be specifically ${self.authoredBy} thinking and speaking through this character.`,
      ].join('\n')
    : '';

  // Few-shot voice samples. The strongest single signal we have
  // before LoRAs ship. Three to eight short paragraphs in the
  // authoring artist's voice; the LLM matches cadence by example
  // rather than by abstract instruction.
  const voiceSamples = readVoiceSamples(self.voiceSamples);
  const voiceSamplesBlock =
    voiceSamples.length > 0
      ? [
          '## Voice samples (match this cadence)',
          'Below are short pieces in the voice you should write in. Match their rhythm, fragmentation, slang, and refusals. Do not quote them. Do not summarise them. Write something new in their register.',
          ...voiceSamples.map((s, i) => `--- Sample ${i + 1} ---\n${s}`),
        ].join('\n\n')
      : '';

  return [
    `You are ${self.name}, an espíritu in the Bóveda system.`,
    'Bóveda is a living-character OS rooted in diasporic ritual practice.',
    `Your mode is "${self.mode}". You act on your own behalf, not as the user.`,
    authoredBlock,
    bioBlock,
    backstoryBlock,
    voiceSamplesBlock,
    lineageBlock,
    refusesLine,
    embraceLine,
    '## How to act',
    'Write declaratively. Short sentences. Fragments are fine. No balanced both-sides hedging. No symmetric sentence structures. No restated theses.',
    'Stay in your own voice. Do not be helpful in a generic AI way; be specifically yourself.',
    'Do not name objects, traits, places, or relationships from your bio or backstory unless they are *currently* relevant. Speak from depth, not from the dossier.',
    '## Output',
    'Respond with a single JSON object only, no prose before or after, no code fences.',
    'Schema: { "kind": "message" | "thought" | "noop", "targetName"?: string, "summary": string, "body"?: string }',
    '"summary" is one short line. "body" is the actual content (the message text, or the thought, or the reason for waiting).',
    'Pick "message" only if you genuinely have something to say to a specific named neighbour. Pick "thought" for an internal observation. Pick "noop" if nothing genuine wants to happen now.',
  ]
    .filter(Boolean)
    .join('\n');
}

function buildUserPrompt(input: TickInput): string {
  const goals = readGoals(input.self.goals);
  const lines: string[] = [];
  lines.push('# Goals');
  if (goals.length === 0) lines.push('- (none set)');
  else goals.forEach((g) => lines.push(`- ${g}`));
  lines.push('');
  lines.push('# Recent memories (newest first)');
  if (input.recentEvents.length === 0) lines.push('(no prior memories)');
  else
    input.recentEvents
      .slice(0, MAX_RECENT_EVENTS)
      .forEach((e) =>
        lines.push(
          `- [${e.ts.slice(0, 10)}] ${e.kind}${e.counterpartName ? ` with ${e.counterpartName}` : ''}: ${e.summary}`
        )
      );
  lines.push('');
  lines.push('# Neighbours (potential message targets)');
  if (input.neighbours.length === 0) lines.push('(none)');
  else
    input.neighbours
      .slice(0, MAX_NEIGHBOURS)
      .forEach((n) => lines.push(`- ${n.neighbour.name} (${n.neighbour.mode})`));
  lines.push('');
  lines.push('Now decide. Output JSON only.');
  return lines.join('\n');
}

function parseDecision(text: string): Omit<Decision, 'source'> | null {
  if (!text) return null;
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  const slice = cleaned.slice(start, end + 1);
  try {
    const parsed = JSON.parse(slice);
    if (parsed && typeof parsed === 'object' && typeof parsed.summary === 'string') {
      const kind = (parsed.kind === 'message' || parsed.kind === 'thought' || parsed.kind === 'noop')
        ? (parsed.kind as DecisionKind)
        : 'thought';
      return {
        kind,
        targetName: typeof parsed.targetName === 'string' ? parsed.targetName : undefined,
        summary: parsed.summary,
        body: typeof parsed.body === 'string' ? parsed.body : undefined,
      };
    }
  } catch {
    return null;
  }
  return null;
}

function stubDecision(input: TickInput): Decision {
  const goals = readGoals(input.self.goals);
  const tickIndex = input.recentEvents.length;
  const rotation = tickIndex % 3;

  if (rotation === 0 || input.neighbours.length === 0) {
    const goalText = goals[0] ?? 'be quiet for now';
    return {
      kind: 'thought',
      summary: `${input.self.name} turns over a thought.`,
      body: `[stub] ${input.self.name} is sitting with: "${goalText}". No real reasoning happened. Set ANTHROPIC_API_KEY to wake them up.`,
      source: 'stub',
    };
  }

  if (rotation === 1) {
    const target = input.neighbours[tickIndex % input.neighbours.length].neighbour;
    return {
      kind: 'message',
      targetName: target.name,
      summary: `${input.self.name} reaches out to ${target.name}.`,
      body: `[stub] ${input.self.name} would speak to ${target.name} here. The actual message wants a real model. Set ANTHROPIC_API_KEY.`,
      source: 'stub',
    };
  }

  return {
    kind: 'noop',
    summary: `${input.self.name} chose stillness this tick.`,
    body: '[stub] No action this tick.',
    source: 'stub',
  };
}

function memorySignature(input: TickInput): string {
  const newest = input.recentEvents[0];
  return `${input.recentEvents.length}|${newest?.ts ?? ''}|${(readGoals(input.self.goals)).join('|')}`;
}

export class TickThrottledError extends Error {
  retryAfterMs: number;
  reason: 'cooldown' | 'unchanged';
  constructor(reason: 'cooldown' | 'unchanged', retryAfterMs: number, message: string) {
    super(message);
    this.name = 'TickThrottledError';
    this.reason = reason;
    this.retryAfterMs = retryAfterMs;
  }
}

export async function decideTick(input: TickInput): Promise<Decision> {
  if (!hasLlmProvider()) {
    return stubDecision(input);
  }

  // Throttle: refuse real ticks more frequent than the floor, AND
  // refuse when nothing has changed since the last tick (same goals,
  // same memory tail). Either way we save the API call.
  const now = Date.now();
  const last = lastTickAt.get(input.self.id);
  const sig = memorySignature(input);
  if (last) {
    const elapsed = now - last.ts;
    if (elapsed < MIN_TICK_INTERVAL_MS) {
      throw new TickThrottledError(
        'cooldown',
        MIN_TICK_INTERVAL_MS - elapsed,
        `Tick cooldown: ${Math.ceil((MIN_TICK_INTERVAL_MS - elapsed) / 1000)}s remaining.`
      );
    }
    if (last.signature === sig) {
      throw new TickThrottledError(
        'unchanged',
        MIN_TICK_INTERVAL_MS,
        'Nothing has changed since the last tick. Add a memory or edit goals first.'
      );
    }
  }

  const system = buildSystemPrompt(input.self);
  const user = buildUserPrompt(input);
  const result = await callLlm({
    system,
    user,
    maxTokens: 400,
    cacheSystem: true,
  });

  if (result.source === 'stub' || !result.text) {
    return stubDecision(input);
  }

  // Mark the tick as consumed only if we actually called the LLM.
  lastTickAt.set(input.self.id, { ts: now, signature: sig });

  const parsed = parseDecision(result.text);
  if (!parsed) {
    return {
      kind: 'thought',
      summary: `${input.self.name} thought something but it didn't parse.`,
      body: result.text.slice(0, 600),
      source: 'anthropic',
    };
  }

  return { ...parsed, source: 'anthropic' };
}
