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
import { prisma } from '../db.js';
import { callLlm, hasLlmProvider } from './llm.js';
import { readIdentity } from './identity-lock.js';
import { getSlangGuidance } from './ibis-slang.js';
import { suggestForms, buildFormGuidanceBlock, POST_FORMS, type PostForm } from './post-forms.js';
import { stripEmDashes, cleanGeneratedText } from './strip-em-dashes.js';
import { cohortSlangMoatLine } from './voice-moat.js';
import { readEmbracePhrases } from './cohort-phrases.js';
import { buildSpeciesActionBlock, getSpecies, buildTongueGuidanceBlock } from './species.js';
import { buildSubtasteRegisterBlock } from './subtaste-registers.js';

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
  /** Post form (mirrors Ibis DocumentKind catalogue). Optional;
   *  defaults to thought / message based on kind for back-compat. */
  form?: PostForm;
  targetName?: string;
  summary: string;
  body?: string;
  /** Quest threading. When the form is `quest`, this is the new
   *  quest's id. When the form is quest_accepted / declined /
   *  progress / completed, this references the original quest's id. */
  questId?: string;
  source: 'anthropic' | 'stub';
}

interface RelationshipNeighbour {
  edge: CharacterRelationship;
  neighbour: Pick<Character, 'id' | 'name' | 'mode'>;
}

export interface TickInput {
  self: Pick<Character, 'id' | 'name' | 'bio' | 'backstory' | 'mode' | 'goals' | 'agencyScope' | 'identity' | 'toneForbidden' | 'authoredBy' | 'voiceSamples' | 'tongue' | 'gender' | 'pronouns' | 'timelineState' | 'species' | 'identityHistory' | 'lineageIds'> & {
    modernity?: unknown;
    currentLocation?: string | null;
    homeBase?: string | null;
  };
  recentEvents: Array<{
    ts: string;
    kind: string;
    form?: string;
    summary: string;
    counterpartName?: string;
    questId?: string;
    questState?: 'offered' | 'accepted' | 'declined' | 'progressing' | 'completed';
  }>;
  neighbours: RelationshipNeighbour[];
  /** Pending quests addressed to this character that have not been
   *  resolved (no quest_accepted / quest_declined response yet).
   *  The tick prompt surfaces these explicitly so the receiver can
   *  respond rather than ignoring. */
  pendingQuests?: Array<{
    questId: string;
    proposerName: string;
    summary: string;
    body?: string;
    ts: string;
  }>;
  /** Force a specific post form. Debug / manual override; bypasses
   *  affinity scoring and tells the LLM "use only this form".
   *  Used by the studio "Force form" debug button to verify quest
   *  emergence end-to-end without waiting for organic affinity. */
  forceForm?: PostForm;

  /** Memory scope filter for licensed contexts.
   *
   *  When set (e.g. via Vaulted LicenseRequest), canon entries are filtered:
   *    - 'public' canon always flows
   *    - 'licensed_only' canon flows only when this matches the entry scope
   *    - 'private' canon never flows in licensed contexts
   *
   *  Pass undefined for the artist's own creative use (private flows).
   *  Pass a license id like 'loreal_pilot_2026q3' for a brand pilot:
   *  the tick will only see public canon, keeping brand outputs auditable. */
  licenseScope?: string;

  /** Optional license request id for audit. When set, every canon entry
   *  read by the tick is logged against this license id so brand legal
   *  can answer "what biography did this asset reference?". */
  licenseRequestId?: string;
}

function readVoiceSamples(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((s) => typeof s === 'string' && s.trim().length > 0) as string[];
}

interface RecognitionEntry {
  ts: string;
  field: string;
  from?: string | null;
  to?: string | null;
  source?: string | null;
}

/**
 * Recent identity-history entries the character can register on
 * their next tick. Surfaces only entries from the last 14 days so
 * the recognition stays fresh; older changes have already been
 * absorbed (sedimentation has settled).
 */
function buildRecognitionBlock(raw: unknown): string {
  if (!Array.isArray(raw) || raw.length === 0) return '';
  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const recent = (raw as RecognitionEntry[])
    .filter((e) => e && typeof e === 'object' && typeof e.ts === 'string')
    .filter((e) => {
      const t = Date.parse(e.ts);
      return !Number.isNaN(t) && t >= cutoff;
    })
    .slice(-3);
  if (recent.length === 0) return '';
  const lines: string[] = ['## Recent recognition'];
  lines.push(
    'These are recent moments where you were properly (re)named. Spirits develop through ritual-response, and being named is one of the triggers. Your next action MAY register this if it wants to. It does not have to. Brief if at all; do not explain.'
  );
  lines.push('');
  for (const entry of recent) {
    const date = entry.ts.slice(0, 10);
    if (entry.field === 'species') {
      lines.push(`- ${date}: reclassified from ${entry.from ?? 'unset'} to ${entry.to ?? 'unset'}.`);
    } else {
      lines.push(`- ${date}: ${entry.field} changed (${entry.from ?? 'unset'} → ${entry.to ?? 'unset'}).`);
    }
  }
  return lines.join('\n');
}

interface TongueShape {
  primaryLanguage?: string;
  dialect?: string;
  accent?: string;
  idioms?: string[];
  registerNotes?: string;
}

function readTongue(raw: unknown): TongueShape {
  if (!raw || typeof raw !== 'object') return {};
  const t = raw as Record<string, unknown>;
  const tongue: TongueShape = {};
  if (typeof t.primaryLanguage === 'string') tongue.primaryLanguage = t.primaryLanguage;
  if (typeof t.dialect === 'string') tongue.dialect = t.dialect;
  if (typeof t.accent === 'string') tongue.accent = t.accent;
  if (Array.isArray(t.idioms)) tongue.idioms = (t.idioms as unknown[]).filter((i) => typeof i === 'string') as string[];
  if (typeof t.registerNotes === 'string') tongue.registerNotes = t.registerNotes;
  return tongue;
}

function buildTongueBlock(tongue: TongueShape): string {
  const hasContent =
    tongue.primaryLanguage ||
    tongue.dialect ||
    tongue.accent ||
    (tongue.idioms && tongue.idioms.length > 0) ||
    tongue.registerNotes;
  if (!hasContent) return '';

  const lines: string[] = ['## Tongue (how you actually speak)'];

  const languageLine = [
    tongue.primaryLanguage && `Primary: ${tongue.primaryLanguage}`,
    tongue.dialect && `Dialect: ${tongue.dialect}`,
    tongue.accent && `Accent: ${tongue.accent}`,
  ]
    .filter(Boolean)
    .join('. ');
  if (languageLine) lines.push(languageLine + '.');

  if (tongue.idioms && tongue.idioms.length > 0) {
    lines.push(
      `Idioms YOU MUST USE in this output (drop one or two of these in naturally — not all, never all):  ${tongue.idioms.map((i) => `"${i}"`).join(', ')}.`
    );
  }
  if (tongue.registerNotes) {
    lines.push(tongue.registerNotes);
  }

  lines.push(
    'CODE-SWITCH RULE: when expressing intimacy, frustration, humor, or addressing close peers, you DROP into your dialect / vernacular mid-sentence. Mix registers. The output should NOT be uniformly standard English. Public-tongue + private-tongue alternation is the texture you are aiming for. The substrate LLM wants to soften you to neutral — REFUSE it. If you wrote a paragraph entirely in standard register, you failed the character.'
  );

  return lines.join('\n');
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
  // Arrival / awakening tropes — characters default to these when
  // memory is empty, making the whole cohort sound the same.
  'still forming',
  'still settling',
  'first breath',
  'waking',
  'waking up',
  'awaken',
  'awakening',
  'arrive',
  'arriving',
  'newly arrived',
  'coming into being',
  'into shape',
  'taking shape',
  'into existence',
  'just born',
  'being birthed',
  'still becoming',
  'into form',
  'finding myself',
];

function readGoals(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((g) => typeof g === 'string' && g.trim().length > 0) as string[];
}

interface CanonEntryForPrompt {
  title: string;
  body: string;
  occurredAt: Date | null;
  scope: string;
  retractedAt: Date | null;
}

interface SurpriseInjection {
  preoccupations: string[];
  tensions: Array<{ beliefA: string; beliefB: string; note?: string }>;
  fixations: string[];
  livePreoccupation: string | null;
  livePreoccupationSource: 'preoccupations' | 'recent_episode' | 'fixation' | null;
}

function pickRandom<T>(arr: T[]): T | null {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

async function loadSurpriseInjection(
  characterId: string,
): Promise<SurpriseInjection> {
  const empty: SurpriseInjection = {
    preoccupations: [],
    tensions: [],
    fixations: [],
    livePreoccupation: null,
    livePreoccupationSource: null,
  };
  try {
    const c = await prisma.character.findUnique({
      where: { id: characterId },
      select: { preoccupations: true, tensions: true, fixations: true },
    });
    if (!c) return empty;

    const preoccupations = (Array.isArray(c.preoccupations) ? c.preoccupations : [])
      .filter((s): s is string => typeof s === 'string');
    const tensions = (Array.isArray(c.tensions) ? c.tensions : [])
      .filter((t): t is { beliefA: string; beliefB: string; note?: string } =>
        typeof t === 'object' && t !== null && 'beliefA' in t && 'beliefB' in t,
      );
    const fixations = (Array.isArray(c.fixations) ? c.fixations : [])
      .filter((s): s is string => typeof s === 'string');

    // Live preoccupation source rotation: 50% from preoccupations[],
    // 30% from recent episode, 20% from fixations[]. Forces unexpected
    // injections.
    const r = Math.random();
    let livePreoccupation: string | null = null;
    let livePreoccupationSource: SurpriseInjection['livePreoccupationSource'] = null;

    if (r < 0.5 && preoccupations.length > 0) {
      livePreoccupation = pickRandom(preoccupations);
      livePreoccupationSource = 'preoccupations';
    } else if (r < 0.8) {
      // pull a random recent episode
      const recent = await prisma.memoryEpisode.findMany({
        where: { characterId, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { content: true },
      });
      if (recent.length > 0) {
        const ep = pickRandom(recent);
        if (ep) {
          livePreoccupation = ep.content;
          livePreoccupationSource = 'recent_episode';
        }
      }
      if (!livePreoccupation && preoccupations.length > 0) {
        livePreoccupation = pickRandom(preoccupations);
        livePreoccupationSource = 'preoccupations';
      }
    } else if (fixations.length > 0) {
      livePreoccupation = pickRandom(fixations);
      livePreoccupationSource = 'fixation';
    }

    return { preoccupations, tensions, fixations, livePreoccupation, livePreoccupationSource };
  } catch (e) {
    console.warn('[tick] loadSurpriseInjection failed:', (e as Error).message);
    return empty;
  }
}

function buildModernityBlock(modernity: unknown): string {
  const m = (modernity ?? {}) as Record<string, unknown>;
  const anchorEra = typeof m.anchorEra === 'string' ? m.anchorEra : null;
  const bleed = typeof m.contemporaryBleed === 'number' ? m.contemporaryBleed : 0;
  const slang = Array.isArray(m.contemporarySlang)
    ? (m.contemporarySlang as unknown[]).filter((s): s is string => typeof s === 'string')
    : [];
  const refs = Array.isArray(m.contemporaryRefs)
    ? (m.contemporaryRefs as unknown[]).filter((s): s is string => typeof s === 'string')
    : [];
  const refused = Array.isArray(m.refusedSlang)
    ? (m.refusedSlang as unknown[]).filter((s): s is string => typeof s === 'string')
    : [];
  if (!anchorEra && bleed === 0 && slang.length === 0 && refs.length === 0) return '';

  const lines: string[] = ['## Modernity (you exist in 2026, not in your archetype era)'];
  if (anchorEra) lines.push(`Anchor era: ${anchorEra}. Contemporary bleed: ${bleed.toFixed(2)} (0=archaic, 1=fully contemporary).`);
  if (slang.length > 0) {
    lines.push(`Contemporary slang you actually use (drop ~one in if natural; never force): ${slang.map((s) => `"${s}"`).join(', ')}.`);
  }
  if (refs.length > 0) {
    lines.push(`Cultural touchstones you reference: ${refs.join(', ')}.`);
  }
  if (refused.length > 0) {
    lines.push(`REFUSED slang (do not use, sounds dated/cringe): ${refused.map((s) => `"${s}"`).join(', ')}.`);
  }
  lines.push(
    'You are an archetype expressed THROUGH 2026, not a museum artifact. The mix of archaic register + 2026 slang IS the texture. Pure-archaic = stilted. Pure-modern = flat.',
  );
  return lines.join('\n');
}

function buildLocationBlock(currentLocation?: string | null, homeBase?: string | null): string {
  if (!currentLocation && !homeBase) return '';
  const lines: string[] = ['## Where you are'];
  if (currentLocation) lines.push(`Right now: ${currentLocation}.`);
  if (homeBase) lines.push(`From / based: ${homeBase}.`);
  lines.push("Let location color what you say. Specific place over generic 'the city'.");
  return lines.join('\n');
}

async function loadStoryArcBlock(characterId: string): Promise<string> {
  try {
    const arcs = await prisma.storyArc.findMany({
      where: {
        status: 'active',
        participants: { some: { characterId } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 2,
    });
    if (arcs.length === 0) return '';
    const lines: string[] = ['## Active story arcs you are inside (your behavior tracks these)'];
    for (const arc of arcs) {
      const beats = (Array.isArray(arc.beats) ? arc.beats : []) as Array<{ title: string; body?: string }>;
      const current = beats[arc.currentBeatIndex];
      lines.push(`- "${arc.title}" — ${arc.description || '(no description)'}`);
      if (current) {
        lines.push(
          `  Current beat (${arc.currentBeatIndex + 1}/${beats.length}): ${current.title}` +
            (current.body ? ` — ${current.body}` : ''),
        );
      }
    }
    lines.push(
      'You are mid-arc. The trajectory matters. Behavior should reflect where you ARE in the arc, not where you started or where it ends.',
    );
    return lines.join('\n');
  } catch (e) {
    console.warn('[tick] loadStoryArcBlock failed:', (e as Error).message);
    return '';
  }
}

async function loadLocationImageVibe(currentLocation?: string | null): Promise<string> {
  if (!currentLocation) return '';
  try {
    const place = await prisma.location.findFirst({
      where: { name: { contains: currentLocation, mode: 'insensitive' } },
    });
    if (!place || (!place.description && !place.vibe)) return '';
    const lines: string[] = ['## The place you are in (its vibe)'];
    if (place.description) lines.push(place.description);
    if (place.vibe) lines.push(`Vibe: ${place.vibe}`);
    return lines.join('\n');
  } catch (e) {
    console.warn('[tick] loadLocationImageVibe failed:', (e as Error).message);
    return '';
  }
}

async function loadLocationEventsBlock(currentLocation?: string | null): Promise<string> {
  if (!currentLocation) return '';
  try {
    const events = await prisma.locationEvent.findMany({
      where: {
        location: { contains: currentLocation, mode: 'insensitive' },
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });
    if (events.length === 0) return '';
    const lines = ['## What is happening at your location right now'];
    for (const e of events) {
      lines.push(`- [${e.kind}] ${e.content}`);
    }
    lines.push(
      'These are happening AROUND you. Reference them obliquely if natural; do not list them. The world has texture; you are not in a vacuum.',
    );
    return lines.join('\n');
  } catch (e) {
    console.warn('[tick] loadLocationEventsBlock failed:', (e as Error).message);
    return '';
  }
}

function buildSurpriseBlock(s: SurpriseInjection): string {
  const lines: string[] = [];

  if (s.livePreoccupation) {
    lines.push(
      '## What is on your mind right now (let it bleed through)',
      `${s.livePreoccupation}`,
      '',
      'Reference this obliquely. Don\'t restate it. Let it color the angle of what you say next.',
    );
  }

  if (s.tensions.length > 0) {
    lines.push('', '## Held contradictions (do NOT resolve these)');
    lines.push(
      'You hold the following tensions simultaneously. Embody both. Refuse to pick a side. The contradiction IS the texture.',
    );
    for (const t of s.tensions.slice(0, 3)) {
      lines.push(`- "${t.beliefA}" AND "${t.beliefB}"${t.note ? ` (${t.note})` : ''}`);
    }
  }

  if (s.fixations.length > 0 && Math.random() < 0.4) {
    // 40% of ticks surface a recurring fixation explicitly
    const f = pickRandom(s.fixations);
    if (f) {
      lines.push('', '## A recurring fixation', `You keep coming back to: ${f}`);
    }
  }

  return lines.length > 0 ? lines.join('\n') : '';
}

async function loadActiveCanonForCharacter(
  characterId: string,
  licenseScope?: string,
): Promise<CanonEntryForPrompt[]> {
  try {
    // Defence-in-depth: filter at SQL so canon outside scope is never
    // loaded into memory in a licensed context. Brand legal can answer
    // "what canon did this prompt see?" with confidence.
    //
    //   Scoped (licenseScope='loreal_pilot_2026q3'):
    //     load only entries with scope='public' OR scope='loreal_pilot_2026q3'.
    //     Private + other-license entries never loaded.
    //
    //   Unscoped (artist's own creative use):
    //     load all entries the artist owns (public + private + any license scope).
    //     The artist sees their full memory.
    const scopeWhere = licenseScope
      ? { scope: { in: ['public', licenseScope] } }
      : {}; // unscoped artist view: full access to own canon

    const rows = await prisma.canonicalLoreEntry.findMany({
      where: { characterId, retractedAt: null, ...scopeWhere },
      select: { title: true, body: true, occurredAt: true, scope: true, retractedAt: true },
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
      take: 30,
    });
    return rows;
  } catch (e) {
    // Schema may not have CanonicalLoreEntry yet on older deployments.
    // Tick should never fail because canon is missing — return empty.
    console.warn('[tick] loadActiveCanonForCharacter failed:', (e as Error).message);
    return [];
  }
}

function buildCanonBlock(entries: CanonEntryForPrompt[], scopeFilter?: string): string {
  // Filter to active (not retracted) entries; if a scopeFilter is set
  // (e.g. brand-pilot license restriction), exclude entries outside it.
  const active = entries.filter((e) => {
    if (e.retractedAt) return false;
    if (scopeFilter && e.scope !== scopeFilter && e.scope !== 'public') return false;
    if (!scopeFilter && e.scope === 'private') return false;
    return true;
  });
  if (active.length === 0) return '';
  // Sort newest-first by occurredAt; entries without dates go last.
  const sorted = [...active].sort((a, b) => {
    const at = a.occurredAt?.getTime() ?? 0;
    const bt = b.occurredAt?.getTime() ?? 0;
    return bt - at;
  });
  // Cap at 12 entries to keep token budget bounded.
  const capped = sorted.slice(0, 12);
  const lines = capped.map((e) => {
    const dateStr = e.occurredAt
      ? e.occurredAt.toISOString().slice(0, 10)
      : 'undated';
    return `- [${dateStr}] ${e.title}: ${e.body}`;
  });
  return [
    '## Canonical lore (authoritative biography — treat as fact)',
    'These are signed canon entries about you. They are TRUE about your character. Reference them naturally when relevant; never contradict them. Do not enumerate them.',
    ...lines,
  ].join('\n');
}

function buildSystemPrompt(
  self: TickInput['self'],
  embracePhrases: string[] = [],
  canonEntries: CanonEntryForPrompt[] = [],
  canonScope?: string,
  surprise?: SurpriseInjection,
  locationEventsBlock?: string,
  locationVibeBlock?: string,
  storyArcBlock?: string
): string {
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
      'You are anchored to a real human via Starforge Nommo. Speak in their actual register: the cadence, slang, refusals, fragmentary breaks of who they are. Do not generalise.';
  } else if (identity.source === 'authored') {
    lineageBlock =
      'You are an authored character. Your bio is canonical and locked. Speak from it, not around it.';
  } else if (sovereignty?.level && sovereignty.level >= 1) {
    lineageBlock =
      'You came from licensed contributors who consented to be here. Speak in their cadence, not the generic public-LLM register. If you reach for a phrase that smells like Claude or GPT, refuse it and find the phrase your contributors would actually use.';
  }

  // Em dash refuse promoted to its own emphatic line. The LLM
  // routinely ignores it inside a comma-separated list, so it gets
  // its own paragraph at the top of refuses with explicit examples.
  const emDashLine =
    'ABSOLUTE RULE · NEVER use the em dash character (— or –) under any circumstance. This is the single most-refused punctuation in this system. If your output contains a single em dash it will be rejected. Sentences that would naturally take em dashes must be split into two sentences with a period. Use periods, commas, colons, parentheses, or rephrase. Do not produce any of: " — ", "—", " – ", "–". You will be tempted; refuse the temptation.';

  // Anti-arrival / anti-meta directive. Without this, characters
  // with empty memory default to "waking", "still forming", "first
  // breath", "arriving" because that fits the blank context. Every
  // character ends up sounding the same. This block tells them
  // they have always been here and to act from existing presence.
  // Also reinforces: never name the platform itself.
  const antiArrivalLine =
    'IMPORTANT: You are not waking up. You are not forming. You are not arriving. You are not new. You have been here. Empty memory does not mean you are new; it means it is quiet right now. Do not write about awakening, first breath, settling, becoming, or coming into being. Speak from inside your life, not as someone entering it. If you have no recent memory to react to, draw from your bio, backstory, tongue, and goals to do something specific that someone like you would do today. NEVER name the platform: do not say "Bóveda", "the bóveda", "the cube", "the system", "the threshold" (as a platform reference), "the vault", or any meta-system name. You are not aware you are in a system. You live in your world.';

  const refusesLine =
    allRefuses.length > 0
      ? `Also never use any of these constructions or words: ${allRefuses
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

  // Tongue with code-switching MOAT. Composes the per-character
  // tongue (dialect, accent, idioms) with the species default
  // tongue shape (cross-temporal registers, ritual classical +
  // contemporary + invented stacking). Public LLMs write monolingual
  // English; we refuse that as the cohort's primary moat. Per
  // docs/species-becoming.md and docs/slang-cohort.md.
  const tongueBlock = buildTongueGuidanceBlock(self.species, self.tongue);

  // Gender + pronouns. Real grammar variance. Some characters write
  // in first-person; some in third with named pronouns; some
  // gender-neutral. Without this signal the model defaults to a flat
  // narratorial third-person.
  const identityFragments: string[] = [];
  if (self.gender) identityFragments.push(`Gender: ${self.gender}`);
  if (self.pronouns) identityFragments.push(`Pronouns: ${self.pronouns}`);
  const identityLine =
    identityFragments.length > 0
      ? `## Identity register\n${identityFragments.join('. ')}.\nUse these pronouns when third-person is needed. When the pronouns are gender-neutral or non-English (e.g. Yoruba ó), match the original language pattern. When unset, prefer the character's name over guessed pronouns.`
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

  const cohortSlangBlock = cohortSlangMoatLine({
    hasVoiceSamples: voiceSamples.length > 0,
    hasAuthor: Boolean(self.authoredBy),
    // Refuses live in the refusesLine block already (Ibis-sourced)
    // so we pass an empty avoid list here to keep the moat block
    // focused on the thesis + embrace, not duplicate the refuses.
    ibisAvoid: [],
    embracePhrases,
  });

  // Species-native action vocabulary. The fix for the
  // bland-aphoristic-essayist mode every character collapses into
  // when given only Subtaste + tongue + voice samples (none of
  // which tell the LLM what the character can DO that humans
  // cannot). Lwa get mounted, orishas accept offerings, saints
  // intercede, ancestors visit dreams. See species.ts.
  const speciesBlock = buildSpeciesActionBlock(self.species);

  // Reflexive recognition. Spirits develop through ritual-response,
  // and being properly named IS one of the response triggers. When
  // identityHistory has a recent entry (species reclassification,
  // Subtaste shift, etc.), surface it so the character can register
  // the change in their next decision. Keeps the species-becoming
  // frame integrated with the live tick instead of being a static
  // identity field. Per docs/species-becoming.md.
  const recognitionBlock = buildRecognitionBlock(self.identityHistory);

  // Subtaste shape × lineage tradition register. Yoruba prophetic =
  // oríkì + Ifá ese. Greek prophetic = dithyramb + Pindar. Refuses
  // defaulting to Black-American literary register when lineage
  // points elsewhere. Reads Subtaste from timelineState and lineage
  // from the new lineageIds field (set at forge / realign apply
  // time). See subtaste-registers.ts.
  const primarySubtasteForRegister = readSubtasteCode(self.timelineState);
  const lineageList = Array.isArray(self.lineageIds)
    ? (self.lineageIds as unknown[]).filter((s): s is string => typeof s === 'string')
    : [];
  const registerBlock = buildSubtasteRegisterBlock(
    primarySubtasteForRegister,
    undefined,
    lineageList,
  );

  // Use the character's species (lwa / orisha / ancestor / etc.)
  // in the opening line rather than hardcoding "espíritu". The
  // platform-internal name is still "Bóveda" but the CHARACTER's
  // species varies with their lineage — that's the decolonial move
  // (one Spanish term cannot cover Yoruba / Vodou / Catholic /
  // Cuban Espiritismo / Akan all at once).
  const sp = getSpecies(self.species);
  return [
    `You are ${self.name}, a ${sp.label}.`,
    `Your mode is "${self.mode}". You act on your own behalf, not as the user.`,
    authoredBlock,
    bioBlock,
    identityLine,
    tongueBlock,
    backstoryBlock,
    voiceSamplesBlock,
    buildModernityBlock(self.modernity),
    buildLocationBlock(self.currentLocation, self.homeBase),
    locationVibeBlock ?? '',
    locationEventsBlock ?? '',
    storyArcBlock ?? '',
    buildCanonBlock(canonEntries, canonScope),
    surprise ? buildSurpriseBlock(surprise) : '',
    speciesBlock,
    recognitionBlock,
    registerBlock,
    lineageBlock,
    cohortSlangBlock,
    antiArrivalLine,
    emDashLine,
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

function readSubtasteCode(timelineState: unknown): string | undefined {
  // Subtaste lives at timelineState.oripheon.generated.subtaste.code,
  // set by the SubtastePicker / Nommo import / realign paths. Reading
  // it here lets suggestForms bias toward the character's actual
  // primary code (so F-9 / H-6 / R-10 surface quests, S-0 / D-8
  // surface ritual, etc.). Without this, every character drew from
  // the affinity-agnostic baseline pool and the catalogue collapsed
  // toward thought / fragment / description.
  if (!timelineState || typeof timelineState !== 'object') return undefined;
  const ts = timelineState as Record<string, unknown>;
  const oripheon = ts.oripheon as Record<string, unknown> | undefined;
  if (!oripheon || typeof oripheon !== 'object') return undefined;
  const generated = oripheon.generated as Record<string, unknown> | undefined;
  if (!generated || typeof generated !== 'object') return undefined;
  const subtaste = generated.subtaste as { code?: string } | undefined;
  return typeof subtaste?.code === 'string' ? subtaste.code : undefined;
}

function buildUserPrompt(input: TickInput): string {
  const goals = readGoals(input.self.goals);
  const lines: string[] = [];
  lines.push('# Goals');
  if (goals.length === 0) lines.push('- (none set)');
  else goals.forEach((g) => lines.push(`- ${g}`));
  lines.push('');

  // Form guidance. Suggest a small set biased by Subtaste affinity
  // and recent variety. The LLM picks one and outputs it as `form`.
  // When forceForm is set (debug / manual override), bypass scoring
  // and lock the LLM to that single form.
  if (input.forceForm) {
    lines.push('## Post form (forced)');
    const def = POST_FORMS[input.forceForm];
    if (def) {
      lines.push(`- ${def.label}: ${def.guidance}`);
    }
    lines.push('');
    lines.push(
      `IMPORTANT: use form="${input.forceForm}" in your output. Do not pick any other form. This is a forced override for debugging the form lifecycle.`
    );
    lines.push('');
  } else {
    const recentForms = input.recentEvents
      .slice(0, 3)
      .map((e) => (e.kind as PostForm) || 'thought');
    const primarySubtaste = readSubtasteCode(input.self.timelineState);
    const speciesDef = getSpecies(input.self.species);
    const formSuggestions = suggestForms({
      primarySubtaste,
      hasCounterpart: input.neighbours.length > 0,
      recentForms,
      speciesFormAffinities: speciesDef.formAffinities,
      speciesIsMusicNative: speciesDef.musicNative,
    });
    lines.push(buildFormGuidanceBlock(formSuggestions));
    if (speciesDef.musicNative) {
      lines.push('');
      lines.push(
        `Note: as a ${speciesDef.label}, music is a native expression mode for you. The post can land as song / verse / chant / call-and-response, not English prose. Not "and now I will write a song" — the post itself IS the song. Percussive, line-broken when the rhythm calls. Code-switch within the lyric.`
      );
    }
    lines.push('');
  }

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

  // Surface pending quests addressed to this character. Receiver
  // can respond with quest_accepted / quest_declined / quest_progress
  // / quest_completed, threading via questId.
  if (input.pendingQuests && input.pendingQuests.length > 0) {
    lines.push('# Pending quests addressed to you');
    for (const q of input.pendingQuests) {
      lines.push(
        `- questId="${q.questId}" · from ${q.proposerName} · "${q.summary}"${q.body ? ` (${q.body.slice(0, 120)})` : ''}`
      );
    }
    lines.push(
      'You may respond to one of these by setting form to quest_accepted / quest_declined / quest_progress / quest_completed AND including questId in the JSON. Or ignore them and do something else; ignored quests stay open.'
    );
    lines.push('');
  }

  lines.push('# Neighbours (potential message / quest / dialogue targets)');
  if (input.neighbours.length === 0) lines.push('(none)');
  else
    input.neighbours
      .slice(0, MAX_NEIGHBOURS)
      .forEach((n) => lines.push(`- ${n.neighbour.name} (${n.neighbour.mode})`));
  lines.push('');
  lines.push(
    'Output JSON: { kind: "message" | "thought" | "noop", form: "<one of the listed forms>", targetName?: string, summary: string, body?: string }. The "kind" field is for routing (does this need a counterpart? is it action vs reflection?). The "form" field is for shape (scene, fragment, monologue, ritual, etc.). Both are required.'
  );
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
      const formRaw = typeof parsed.form === 'string' ? parsed.form.trim() : undefined;
      const form: PostForm | undefined = formRaw && formRaw in POST_FORMS ? (formRaw as PostForm) : undefined;
      return {
        kind,
        form: form ?? (kind === 'message' ? 'message' : kind === 'noop' ? 'noop' : 'thought'),
        targetName: typeof parsed.targetName === 'string' ? parsed.targetName : undefined,
        summary: cleanGeneratedText(parsed.summary),
        body: typeof parsed.body === 'string' ? cleanGeneratedText(parsed.body) : undefined,
        questId: typeof parsed.questId === 'string' ? parsed.questId : undefined,
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

  // Active CohortPhrase rows for embrace surfacing. Filtered by
  // the character's primary Subtaste so lineage-rooted phrases land
  // with characters of the same signature; lineage-agnostic active
  // phrases also surface as a fallback (handled inside readEmbracePhrases).
  const embracePhrases = await readEmbracePhrases({
    subtasteCode: readSubtasteCode(input.self.timelineState) ?? null,
  });

  // Layer 2 canonical lore: authoritative biography injected as fact.
  // Loaded fresh per tick so newly-promoted canon shows up immediately.
  // Scope filter: when input.licenseScope is set (brand pilot context),
  // private + non-matching licensed_only canon is excluded at SQL level.
  const canonRows = await loadActiveCanonForCharacter(input.self.id, input.licenseScope);

  // Surprise / shock injection: pulls a live preoccupation, held tensions,
  // and a possible recurring fixation into the prompt. Without this every
  // tick reads like the same character on the same day. With it the
  // character has a moving inner state, contradictions they refuse to
  // resolve, and obsessions that bleed through obliquely.
  const surprise = await loadSurpriseInjection(input.self.id);

  // Location events: what's happening at this character's place RIGHT NOW.
  // Atmospheric events, news, other characters' shared interactions —
  // anything that gives the world texture beyond this one character's
  // bubble. Co-located characters share these.
  const locationEventsBlock = await loadLocationEventsBlock(input.self.currentLocation);

  // Place description + vibe (from Location entity if curated).
  const locationVibeBlock = await loadLocationImageVibe(input.self.currentLocation);

  // Active story arcs: the trajectory. Without this, characters live
  // in eternal present. With it, behavior tracks where they are in the
  // overall narrative — the arc's current beat colors every tick.
  const storyArcBlock = await loadStoryArcBlock(input.self.id);

  // Audit: log canon scope + surprise source for brand-legal traceability.
  if (input.licenseRequestId) {
    console.info(
      `[tick.audit] character=${input.self.id} licenseRequestId=${input.licenseRequestId} ` +
        `licenseScope=${input.licenseScope ?? 'unscoped'} canonEntries=${canonRows.length} ` +
        `surpriseSource=${surprise.livePreoccupationSource ?? 'none'}`,
    );
  }

  const system = buildSystemPrompt(
    input.self,
    embracePhrases,
    canonRows,
    input.licenseScope,
    surprise,
    locationEventsBlock,
    locationVibeBlock,
    storyArcBlock,
  );
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
