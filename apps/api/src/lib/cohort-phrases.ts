/**
 * Cohort-phrase service.
 *
 * The in-Bóveda half of the slang MOAT (docs/slang-cohort.md). The
 * Ibis temporal-dictionary covers PUBLIC phrases (danger / timeless
 * / frontier / lineage zones). CohortPhrase covers PRIVATE
 * cohort-rooted phrasings extracted from voice samples and
 * authored material with provenance back to a contributor.
 *
 * Pipeline:
 *
 *   voice samples + authoredBy
 *     ↓
 *   extractCohortPhrases()  — LLM identifies phrasings unlikely to
 *                             appear in any public LLM output
 *     ↓
 *   CohortPhrase rows persisted (status = "proposed")
 *     ↓
 *   review (manual for v1; cultural-advisor for sacred terms)
 *     ↓
 *   activate → surfaces as embrace candidates in tick + realign
 *     ↓
 *   (future) promote → write-back to Ibis frontier zone +
 *                       Imperium royalty hooks
 */

import { prisma } from '../db.js';
import { callLlm, hasLlmProvider } from './llm.js';
import { cleanGeneratedText } from './strip-em-dashes.js';
import { getSlangGuidance } from './ibis-slang.js';

export interface ExtractedPhrase {
  phrase: string;
  sourceQuote?: string;
  gloss?: string;
}

export interface ExtractInput {
  characterId: string;
  voiceSamples: string[];
  authoredBy?: string | null;
  lineage?: string | null;
  subtasteCode?: string | null;
}

const EXTRACT_SYSTEM = `You are a language-archive curator for a closed cohort that generates language for the diaspora.

Your job: read voice samples from a single contributor and identify phrasings unlikely to appear in the public LLM corpus. Cohort-rooted, lineage-specific, often invented or compressed in ways no foundation model has documented.

WHAT QUALIFIES:
- Compressed constructions that are not standard English ("she don swear say...", "carry go", "the way the road dey turn for me")
- Lineage-rooted idioms specific to a place / scene / craft (Lagos pidgin, AAVE, patois, south London, drill, ballroom, jazz-standard slang reframed)
- Refusal cadences (a way of saying no that lands as a single phrase)
- Reference frames that are inside-cohort (a venue, a producer, a scene, a tradition specific enough that a public LLM would not surface it)
- Original metaphors / images that read as the contributor's signature

WHAT DOES NOT QUALIFY:
- Standard English even if expressive
- Public-LLM slang already in any catalogue (delulu, based, no cap, rizz, lowkey, mother, slay, etc.) — these are the OPPOSITE of what you are looking for
- Stock phrases from any major published work
- Generic "nice writing" without lineage anchor

Return JSON only. Schema:
{
  "phrases": [
    {
      "phrase": "the actual phrase, lowercase if natural",
      "sourceQuote": "the exact substring from the sample where it appears (≤80 chars)",
      "gloss": "one short sentence on what it means and why it qualifies as cohort-rooted"
    }
  ]
}

Maximum 8 phrases per call. Quality over quantity. If the samples carry only generic English, return { "phrases": [] }.`;

function parseExtraction(text: string): ExtractedPhrase[] {
  if (!text) return [];
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) return [];
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    if (!parsed || !Array.isArray(parsed.phrases)) return [];
    return parsed.phrases
      .map((p: unknown): ExtractedPhrase | null => {
        if (!p || typeof p !== 'object') return null;
        const obj = p as Record<string, unknown>;
        const phrase = typeof obj.phrase === 'string' ? obj.phrase.trim() : '';
        if (!phrase) return null;
        const sourceQuote = typeof obj.sourceQuote === 'string' ? obj.sourceQuote : undefined;
        const gloss = typeof obj.gloss === 'string' ? obj.gloss : undefined;
        return { phrase, sourceQuote, gloss };
      })
      .filter((p: ExtractedPhrase | null): p is ExtractedPhrase => p !== null);
  } catch {
    return [];
  }
}

/**
 * Extract candidate cohort phrases from a character's voice samples.
 * Persists each as a CohortPhrase with status = "proposed".
 * Returns the persisted rows.
 */
export async function extractCohortPhrases(input: ExtractInput) {
  if (!hasLlmProvider()) {
    return { extracted: 0, phrases: [], reason: 'llm-unavailable' as const };
  }
  if (input.voiceSamples.length === 0) {
    return { extracted: 0, phrases: [], reason: 'no-samples' as const };
  }

  // Pull Ibis danger zone so the LLM can be told explicitly what NOT to
  // surface (these are public-LLM signatures we already refuse).
  const ibis = getSlangGuidance();
  const dangerHint = ibis.avoid.length > 0
    ? `\n\nFor reference, here are some PUBLIC-LLM signatures we already refuse (Ibis danger zone). Do NOT surface phrases like these; these are the failure mode you are filtering against: ${ibis.avoid
        .slice(0, 25)
        .map((p) => `"${p}"`)
        .join(', ')}.`
    : '';

  const userPrompt = [
    input.authoredBy ? `## Authored by\n${input.authoredBy}` : '',
    input.lineage ? `## Lineage\n${input.lineage}` : '',
    input.subtasteCode ? `## Subtaste signature\n${input.subtasteCode}` : '',
    '## Voice samples',
    ...input.voiceSamples.slice(0, 8).map((s, i) => `--- sample ${i + 1} ---\n${s}`),
  ]
    .filter((s) => s.length > 0)
    .join('\n\n');

  const result = await callLlm({
    system: EXTRACT_SYSTEM + dangerHint,
    user: userPrompt,
    maxTokens: 1200,
    cacheSystem: false,
  });

  const cleaned = cleanGeneratedText(result.text);
  const candidates = parseExtraction(cleaned);
  if (candidates.length === 0) {
    return { extracted: 0, phrases: [], reason: 'none-found' as const };
  }

  // Persist. unique([phrase, sourceCharacterId]) means re-extraction
  // is idempotent; we upsert.
  const persisted = [];
  for (const c of candidates) {
    try {
      const row = await prisma.cohortPhrase.upsert({
        where: {
          phrase_sourceCharacterId: {
            phrase: c.phrase,
            sourceCharacterId: input.characterId,
          },
        },
        update: {
          sourceQuote: c.sourceQuote ?? null,
          gloss: c.gloss ?? null,
          lineage: input.lineage ?? null,
          subtasteCode: input.subtasteCode ?? null,
        },
        create: {
          phrase: c.phrase,
          sourceCharacterId: input.characterId,
          sourceQuote: c.sourceQuote ?? null,
          gloss: c.gloss ?? null,
          lineage: input.lineage ?? null,
          subtasteCode: input.subtasteCode ?? null,
          status: 'proposed',
        },
      });
      persisted.push(row);
    } catch {
      // Skip individual write failures; continue with the rest.
    }
  }

  return { extracted: persisted.length, phrases: persisted, reason: 'ok' as const };
}

/**
 * Read active cohort phrases for embrace surfacing in tick + realign.
 * Filters by lineage / Subtaste when provided; falls back to "active
 * regardless" when those aren't set on the character. Caps to a small
 * number so prompt size stays predictable.
 */
export async function readEmbracePhrases(opts: {
  lineage?: string | null;
  subtasteCode?: string | null;
  limit?: number;
} = {}): Promise<string[]> {
  const limit = opts.limit ?? 12;
  try {
    // Prefer lineage / Subtaste matches; fall back to any active row.
    const where: Record<string, unknown> = { status: 'active' };
    const matched = await prisma.cohortPhrase.findMany({
      where: {
        ...where,
        OR: [
          opts.lineage ? { lineage: opts.lineage } : {},
          opts.subtasteCode ? { subtasteCode: opts.subtasteCode } : {},
          // Always include lineage-agnostic active phrases too.
          { lineage: null, subtasteCode: null },
        ].filter((c) => Object.keys(c).length > 0),
      },
      orderBy: [{ useCount: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
    return matched.map((m) => m.phrase);
  } catch {
    return [];
  }
}

/**
 * Bump useCount on a set of phrases when they appear in generated
 * output. Caller can pass the generated text and let us scan; for v1
 * we accept an explicit list to avoid coupling to a tokeniser.
 */
export async function recordCohortPhraseUses(phrases: string[]): Promise<void> {
  if (phrases.length === 0) return;
  try {
    await prisma.cohortPhrase.updateMany({
      where: { phrase: { in: phrases }, status: 'active' },
      data: { useCount: { increment: 1 } },
    });
  } catch {
    // non-fatal
  }
}

/**
 * Scan generated text for active cohort phrases and bump useCount on
 * each match. Wraps the substring scan + DB write so callers (the
 * tick persist path, the realign apply path) can fire-and-forget.
 *
 * Substring match is case-insensitive. Word boundaries are not
 * enforced for v1; phrases are usually distinctive enough that
 * fragments rarely collide. If false positives become a problem
 * later, swap for a tokeniser-aware matcher.
 */
export async function scanAndRecordUses(text: string): Promise<{ matched: string[] }> {
  if (!text || text.trim().length === 0) return { matched: [] };
  let active: { phrase: string }[] = [];
  try {
    active = await prisma.cohortPhrase.findMany({
      where: { status: 'active' },
      select: { phrase: true },
    });
  } catch {
    return { matched: [] };
  }
  if (active.length === 0) return { matched: [] };
  const haystack = text.toLowerCase();
  const matched = active
    .map((a) => a.phrase)
    .filter((p) => p.length > 0 && haystack.includes(p.toLowerCase()));
  if (matched.length > 0) {
    await recordCohortPhraseUses(matched);
  }
  return { matched };
}
