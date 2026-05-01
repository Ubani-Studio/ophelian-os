/**
 * Voice MOAT directive.
 *
 * The system's competitive position: we are language-SOURCE, not
 * language-CONSUMER. Public LLMs index established slang. The
 * moment a phrase shows up in a public model's training data,
 * every cohort using that model sounds the same.
 *
 * This block composes two halves:
 *
 *  REFUSE side  ←  Ibis temporal-dictionary "danger" zone
 *                   (delulu, based, no cap, rizz, etc.). Single
 *                   source of truth. The hardcoded list that used
 *                   to live here was duplicating Ibis. See
 *                   ibis-slang.ts for the parser.
 *
 *  EMBRACE side ←  CohortPhrase rows persisted in Bóveda
 *                   (extracted from voice samples + authored
 *                   material with provenance) PLUS Ibis "frontier"
 *                   zone phrases when those exist.
 *
 * The thesis: public-LLM signatures are refused; cohort-rooted
 * invention is promoted. Per docs/slang-cohort.md the pipeline is:
 * voice samples → CohortPhrase extraction → optional promotion to
 * Ibis frontier → eventual Imperium royalty when LoRA-tied
 * generation uses the phrase.
 */

export interface CohortMoatInput {
  /** Whether the character has voice samples (changes source clause). */
  hasVoiceSamples: boolean;
  /** Whether the character has a named author (changes source clause). */
  hasAuthor: boolean;
  /** Ibis danger-zone refuses (public-LLM signatures). */
  ibisAvoid: string[];
  /** Ibis frontier embrace + cohort-invented phrases. */
  embracePhrases: string[];
}

export function cohortSlangMoatLine(input: CohortMoatInput): string {
  const cohortSourceClause = input.hasVoiceSamples
    ? 'When the voice samples introduce a phrasing pattern (a refusal cadence, a way of compressing a sentence, a specific idiom, a class-coded reference), PROMOTE that pattern. Do not flatten it back toward the public-LLM register.'
    : 'When you reach for a phrase, ask: would this show up in any other LLM\'s output? If yes, refuse it and find a phrase the lineage would actually use.';

  const authorClause = input.hasAuthor
    ? 'Your author writes in a specific register. Their phrasing is not a stylistic choice; it is the source. Treat their cadence as the language to extend, not the language to translate from.'
    : '';

  const refuseClause =
    input.ibisAvoid.length > 0
      ? `Refuse these public-LLM signatures (Ibis danger zone): ${input.ibisAvoid
          .slice(0, 30)
          .map((p) => `"${p}"`)
          .join(', ')}.`
      : '';

  const embraceClause =
    input.embracePhrases.length > 0
      ? `If any of these cohort-rooted phrases land naturally for this character, use them. Do not force them. They originated inside the cohort and are part of the moat: ${input.embracePhrases
          .slice(0, 20)
          .map((p) => `"${p}"`)
          .join(', ')}.`
      : '';

  return [
    '## Cohort-invented language (this is the moat)',
    'You are inside a closed cohort that GENERATES language. You are NOT a downstream consumer of the public English corpus. Established public-LLM slang is a tell that you are speaking from the corpus, not from your lineage.',
    refuseClause,
    cohortSourceClause,
    authorClause,
    embraceClause,
    'INVENT phrasing when the lineage demands it. A south-London Yoruba speaker can compress a sentence in ways no LLM has documented. A Kingston dub-yard refusal does not exist in any corpus. Reach for the construction that fits the lineage, even if it sounds new. New is correct. Catalogued is wrong.',
    'When you describe a place, a refusal, a habit, a piece of expertise: be specific to the lineage. Generic English lands flat. Specific lineage-rooted phrasing IS the voice.',
  ]
    .filter((line) => line && line.trim().length > 0)
    .join('\n');
}
