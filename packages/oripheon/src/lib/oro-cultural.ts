/**
 * Cultural-Òrò name generator adapter.
 *
 * Routes through @violet-sphinx/names — the shared diasporic naming
 * engine — to provide tradition-based cultural names with lineage
 * awareness, register-aware titles, surname-as-history, and the
 * single-word mythic vocabulary.
 *
 * This is the first integration point in the Bóveda + Òrò merger.
 * Existing Oripheon modes (standard, blended, aminal, squishe) stay
 * intact in name-generator.ts. The Cultural mode is additive: when
 * the Bóveda studio app picks "cultural", it calls this function
 * instead of the older Oripheon heritage path.
 *
 * Cultures available: yoruba, igbo, akan, egyptian, vodou, rastafari,
 * maroon, lucumi, taino, internet (future-mythic). See the package
 * for the full list and their tradition tags.
 */

import {
  generateNames,
  listCultures,
  type GenerateOptions,
  type GeneratedName,
} from '@violet-sphinx/names';

export type OroCultureId =
  | 'yoruba'
  | 'igbo'
  | 'akan'
  | 'egyptian'
  | 'vodou'
  | 'rastafari'
  | 'maroon'
  | 'lucumi'
  | 'taino'
  | 'internet';

export type OroMode = 'real' | 'fictional' | 'mythic' | 'archetype' | 'internet';
export type OroForm = 'mononym' | 'first' | 'surname' | 'first_surname' | 'full_with_epithet';
export type OroGender = 'm' | 'f' | 'a';
export type OroArchetype =
  | 'trickster' | 'sage' | 'mystic' | 'warrior' | 'rebel'
  | 'lover' | 'sovereign' | 'hermit' | 'healer' | 'magician';

export interface OroCulturalOptions {
  /** One or more culture IDs to pull from. Falls back to a balanced
   *  African + diasporic mix if none provided. */
  cultures?: OroCultureId[];
  /** Generation mode. Default: real. */
  mode?: OroMode;
  /** Composition form. Default: first_surname. */
  form?: OroForm;
  /** Gender bias. Default: a (any). */
  gender?: OroGender;
  /** Archetype bias for Markov + starter pool. */
  archetype?: OroArchetype;
  /** Ornamentation slider (0 ASCII / 0.5 cultural diacritics / 1 avant). */
  ornament?: 0 | 0.5 | 1;
  /** Whether to attach a register-aware title. */
  withTitle?: boolean;
  /** Surname register: colonial / reclaimed / compound / auto. */
  surnameRegister?: 'auto' | 'colonial' | 'reclaimed' | 'compound';
  /** Pull surname from a different culture (Igbo first + Maroon surname). */
  surnameCulture?: OroCultureId;
  /** Number of candidates to return. Default 1 for the Bóveda use case. */
  count?: number;
}

export interface OroCulturalResult {
  /** The composed display name (title + ornamented + surname per
   *  placement rules). For consumers that only need a string, this
   *  is the canonical form. */
  fullName: string;
  /** Raw structured result from the Òrò engine. Includes lineage
   *  thread, sacred flag, source, etc. Surface as much or as little
   *  of this as the consuming UI wants. */
  raw: GeneratedName;
}

function compose(n: GeneratedName): string {
  // Standalone title replaces the primary name entirely.
  if (n.title && n.titlePlacement === 'standalone') return n.title;
  if (n.epithet && n.epithetPlacement === 'standalone') return n.epithet;

  const base = n.primaryOrnamented ?? n.primary;
  const parts: string[] = [];
  if (n.title && n.titlePlacement === 'prefix') parts.push(n.title);
  if (n.epithet && n.epithetPlacement === 'prefix') parts.push(n.epithet);
  parts.push(base);
  if (n.surname) parts.push(n.surname);
  if (n.title && n.titlePlacement === 'suffix') parts.push(n.title);
  if (n.epithet && n.epithetPlacement === 'suffix') parts.push(n.epithet);
  return parts.join(' ');
}

/**
 * Single-result convenience wrapper. Returns one composed name plus
 * the raw structured payload. Most Bóveda character creation flows
 * want exactly one name; if you need a batch, call generateOroBatch.
 */
export function generateOroCulturalName(
  options: OroCulturalOptions = {},
): OroCulturalResult | null {
  const opts: GenerateOptions = {
    cultures: options.cultures ?? ['yoruba', 'igbo', 'akan'],
    mode: options.mode ?? 'real',
    form: options.form ?? 'first_surname',
    gender: options.gender ?? 'a',
    archetype: options.archetype,
    ornament: options.ornament ?? 0.5,
    withTitle: options.withTitle ?? false,
    personaPack: false,
    surnameRegister: options.surnameRegister,
    surnameCulture: options.surnameCulture,
    count: 1,
  };
  const names = generateNames(opts);
  if (names.length === 0) return null;
  const n = names[0];
  return { fullName: compose(n), raw: n };
}

/**
 * Batch wrapper. Returns an array; convenient for Bóveda surfaces
 * that show a candidate shortlist.
 */
export function generateOroBatch(
  options: OroCulturalOptions = {},
): OroCulturalResult[] {
  const opts: GenerateOptions = {
    cultures: options.cultures ?? ['yoruba', 'igbo', 'akan'],
    mode: options.mode ?? 'real',
    form: options.form ?? 'first_surname',
    gender: options.gender ?? 'a',
    archetype: options.archetype,
    ornament: options.ornament ?? 0.5,
    withTitle: options.withTitle ?? false,
    personaPack: false,
    surnameRegister: options.surnameRegister,
    surnameCulture: options.surnameCulture,
    count: Math.max(1, Math.min(48, options.count ?? 12)),
  };
  return generateNames(opts).map((raw: GeneratedName) => ({ fullName: compose(raw), raw }));
}

/**
 * List the cultures the Òrò engine ships with. Useful for picker UIs.
 */
export function listOroCultures(): Array<{ id: string; label: string; region: string }> {
  return listCultures();
}

export type { GeneratedName, GenerateOptions };
