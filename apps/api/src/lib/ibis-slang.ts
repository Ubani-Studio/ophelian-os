/**
 * Ibis slang forecast plug-in. The fifth signal layer per
 * docs/vision.md and docs/slang-cohort.md.
 *
 * Ibis maintains a temporal dictionary classifying phrases into
 * four zones: lineage / timeless / frontier / danger. v1 of Ibis
 * only populates the "danger" zone (dated platform-cycle slang
 * that ages badly). Frontier (emerging) and lineage (culturally
 * rooted) zones are deferred to Ibis phase 2 (live trend feed).
 *
 * For Bóveda's tick prompt this means:
 *
 *  - avoid: phrases from Ibis's danger zone get added to refuses.
 *    Strongly negative signal: characters won't say "based",
 *    "midwit", "skill issue", "delulu", etc.
 *  - embrace: emerging (frontier) phrases. Empty until Ibis
 *    ships the frontier signal. The architecture is ready.
 *
 * Runtime: parses the Ibis temporal-dictionary.ts file via regex
 * once at startup. Caches in memory. If Ibis isn't reachable
 * (filesystem path missing), falls back to a small mirror list
 * so the tick still benefits from the protection.
 */

import { readFileSync } from 'fs';

const IBIS_DICT_PATH =
  process.env.IBIS_DICT_PATH ||
  '/home/sphinxy/Ibis/src/lib/ai/temporal-dictionary.ts';

export interface SlangGuidance {
  /** Phrases to avoid (Ibis danger zone + extensions). */
  avoid: string[];
  /** Phrases to embrace (Ibis frontier zone). Empty until Ibis ships v2. */
  embrace: string[];
  /** Where the avoid list came from, for telemetry / debugging. */
  source: 'ibis_filesystem' | 'fallback_mirror';
}

// Small fallback list mirrored from Ibis v1. Used only if the
// filesystem read fails. Keep this short — the real list is the
// 115-entry Ibis dictionary.
const FALLBACK_AVOID = [
  'based',
  'midwit',
  'skill issue',
  'vibes are off',
  'main character energy',
  'we are so back',
  'it\'s so over',
  'touch grass',
  'no cap',
  'bussin',
  'rizz',
  'delulu',
  'iykyk',
  'understood the assignment',
  'on fleek',
  'yas queen',
  'amazeballs',
  'i can\'t even',
  'yolo',
  'swag',
  'salty',
];

let cached: SlangGuidance | null = null;

function parseIbisDictionary(text: string): { avoid: string[]; embrace: string[] } {
  // Each entry looks like:
  //   { phrase: "X", zone: "danger", peakYear: 2022, ... },
  // We pull (phrase, zone) pairs via regex.
  const entryRe = /phrase:\s*"([^"\\]+)"[^}]*?zone:\s*"(lineage|timeless|frontier|danger)"/g;
  const avoid: string[] = [];
  const embrace: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = entryRe.exec(text)) !== null) {
    const phrase = match[1];
    const zone = match[2];
    if (zone === 'danger') avoid.push(phrase);
    else if (zone === 'frontier') embrace.push(phrase);
  }
  return { avoid, embrace };
}

export function getSlangGuidance(): SlangGuidance {
  if (cached) return cached;

  try {
    const text = readFileSync(IBIS_DICT_PATH, 'utf-8');
    const { avoid, embrace } = parseIbisDictionary(text);
    if (avoid.length === 0 && embrace.length === 0) {
      // Empty parse — fall through to mirror.
      throw new Error('ibis dictionary parsed empty');
    }
    cached = { avoid, embrace, source: 'ibis_filesystem' };
    return cached;
  } catch {
    cached = { avoid: FALLBACK_AVOID, embrace: [], source: 'fallback_mirror' };
    return cached;
  }
}

/** Force a re-read at next call. Useful for Ibis-side updates. */
export function invalidateSlangCache(): void {
  cached = null;
}
