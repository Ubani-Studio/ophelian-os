/**
 * Voice MOAT directive.
 *
 * The system's competitive position: we are language-SOURCE, not
 * language-CONSUMER. Public LLMs index established slang ("delulu",
 * "based", "rizz", "no cap"). The moment a phrase shows up in a
 * public model's training data, every cohort using that model
 * sounds the same.
 *
 * Our cohort generates phrasing FIRST, from real people with real
 * voices (Ibis, voice samples, authoredBy). Those phrasings should
 * propagate within the cohort and out to the world. The model
 * should treat cohort-introduced phrasing as primary signal and
 * public-corpus slang as secondary or refused.
 *
 * Practical effect on prompts: tell the LLM to PROMOTE phrasing it
 * sees in voice samples / authored material over established slang,
 * and to invent new constructions that fit the lineage rather than
 * reach for the nearest catalogued reference.
 */

export function cohortSlangMoatLine(opts: {
  hasVoiceSamples: boolean;
  hasAuthor: boolean;
}): string {
  const cohortSourceClause = opts.hasVoiceSamples
    ? 'When the voice samples introduce a phrasing pattern (a refusal cadence, a way of compressing a sentence, a specific idiom, a class-coded reference), PROMOTE that pattern. Do not flatten it back toward the public-LLM register.'
    : 'When you reach for a phrase, ask: would this show up in any other LLM\'s output? If yes, refuse it and find a phrase the lineage would actually use.';

  const authorClause = opts.hasAuthor
    ? 'Your author writes in a specific register. Their phrasing is not a stylistic choice; it is the source. Treat their cadence as the language to extend, not the language to translate from.'
    : '';

  return [
    '## Cohort-invented language (this is the moat)',
    'You are inside a closed cohort that generates language. You are NOT a downstream consumer of the public English corpus. Established public-LLM slang is a tell that you are speaking from the corpus, not from your lineage.',
    'Refuse: "delulu", "based", "no cap", "rizz", "lowkey", "highkey", "main character energy", "the audacity", "iykyk", "girlies", "bestie" (as filler), "the way that I", "I oop", "purr", "slay" (as filler), "ate that", "mother", "serving", "valid", "vibes" (as a sentence), "literally" as intensifier, "actually" as fronting, "this is so" + adjective.',
    cohortSourceClause,
    authorClause,
    'INVENT phrasing when the lineage demands it. A south-London Yoruba speaker can compress a sentence in ways no LLM has documented. A Kingston dub-yard refusal does not exist in any corpus. Reach for the construction that fits the lineage, even if it sounds new. New is correct. Catalogued is wrong.',
    'When you describe a place, a refusal, a habit, a piece of expertise: be specific to the lineage. Generic English lands flat. Specific lineage-rooted phrasing IS the voice.',
  ]
    .filter(Boolean)
    .join('\n');
}

export const COHORT_SLANG_AVOID = [
  'delulu',
  'based',
  'no cap',
  'rizz',
  'lowkey',
  'highkey',
  'iykyk',
  'main character energy',
  'the audacity',
  'mother (as compliment)',
  'serving (as compliment)',
  'ate (that)',
  'slay (as filler)',
  'purr',
  'I oop',
  'the way that',
  'this is so',
  'literally (as intensifier)',
];
