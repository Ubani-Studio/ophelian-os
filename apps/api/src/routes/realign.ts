import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../db.js';
import { callLlm, hasLlmProvider, LlmBudgetError } from '../lib/llm.js';
import { LINEAGES, lineageContext, listLineages } from '../lib/lineages.js';
import { isFieldLocked } from '../lib/identity-lock.js';
import { stripEmDashes } from '../lib/strip-em-dashes.js';

/**
 * Aligned character generator. The "sheaf theory" version.
 *
 * Takes a single anchor (lineage + Subtaste + brief) and generates
 * every requested field in one Claude call so they cohere as a
 * whole. Bio mentions a name; the name shows up in aliases;
 * persona tags and goals carry the lineage's register; backstory
 * deepens what the bio sketches.
 *
 * Replaces the old "Cormac MacCrae is a Celtic demon" mismatch
 * where each field was rolled independently against unaligned
 * tables.
 *
 * Endpoints:
 *   GET  /lineages                       — catalogue for the picker UI
 *   POST /characters/:id/realign         — regenerate aligned fields on an existing character
 */

const FIELD_OPTIONS = ['bio', 'backstory', 'aliases', 'personaTags', 'goals', 'tongue'] as const;
type RealignField = (typeof FIELD_OPTIONS)[number];

const SETTING_OPTIONS = ['modern', 'mystical', 'archaic', 'past_life', 'mythic', 'surreal', 'mixed'] as const;
type Setting = (typeof SETTING_OPTIONS)[number];

const RealignSchema = z.object({
  // Single string for back-compat with existing callers; array for
  // multi-lineage blends (Yoruba + Vodou). Either form accepted.
  lineage: z.union([z.string(), z.array(z.string())]).optional(),
  brief: z.string().optional(),
  subtasteCode: z.string().optional(),
  /** Setting register: modern / mystical / archaic / past_life /
   *  mythic / surreal / mixed (default). Biases the example pool
   *  drawn from in the sensibility block. */
  setting: z.enum(SETTING_OPTIONS).optional(),
  fields: z.array(z.enum(FIELD_OPTIONS)).default(['bio', 'backstory', 'aliases', 'personaTags', 'goals', 'tongue']),
  /** When true, write the generated fields onto the character.
   *  When false, just return the draft for review. Default false
   *  so the user can preview before committing. */
  apply: z.boolean().default(false),
  /** Skip locked fields silently rather than refusing. Default true.
   *  Locked fields (Ubani's bio after Starforge import) should not
   *  be auto-realigned. */
  respectLocks: z.boolean().default(true),
});

interface TongueShape {
  primaryLanguage?: string;
  dialect?: string;
  accent?: string;
  idioms?: string[];
  registerNotes?: string;
}

interface AlignedDraft {
  bio?: string;
  backstory?: string;
  aliases?: string[];
  personaTags?: string[];
  goals?: string[];
  tongue?: TongueShape;
}

function readSubtasteFromTimelineState(ts: unknown): { code?: string; glyph?: string; label?: string } | null {
  if (!ts || typeof ts !== 'object') return null;
  const oripheon = (ts as Record<string, unknown>).oripheon as Record<string, unknown> | undefined;
  const generated = oripheon?.generated as Record<string, unknown> | undefined;
  const subtaste = generated?.subtaste as Record<string, unknown> | undefined;
  if (!subtaste) return null;
  return {
    code: typeof subtaste.code === 'string' ? subtaste.code : undefined,
    glyph: typeof subtaste.glyph === 'string' ? subtaste.glyph : undefined,
    label: typeof subtaste.label === 'string' ? subtaste.label : undefined,
  };
}

const SUBTASTE_GLYPHS: Record<string, { glyph: string; label: string; essence: string }> = {
  'S-0': { glyph: 'KETH', label: 'Visionary', essence: 'The unmarked throne.' },
  'T-1': { glyph: 'STRATA', label: 'Architectural', essence: 'Hidden architecture.' },
  'V-2': { glyph: 'OMEN', label: 'Prophetic', essence: 'What arrives before itself.' },
  'L-3': { glyph: 'SILT', label: 'Developmental', essence: 'Patient sediment.' },
  'C-4': { glyph: 'CULL', label: 'Editorial', essence: 'The necessary cut.' },
  'N-5': { glyph: 'LIMN', label: 'Integrative', essence: 'To illuminate by edge.' },
  'H-6': { glyph: 'TOLL', label: 'Advocacy', essence: 'The bell that cannot be unheard.' },
  'P-7': { glyph: 'VAULT', label: 'Archival', essence: 'What is kept.' },
  'D-8': { glyph: 'WICK', label: 'Channelling', essence: 'Draws flame upward without burning.' },
  'F-9': { glyph: 'ANVIL', label: 'Manifestation', essence: 'Where pressure becomes form.' },
  'R-10': { glyph: 'SCHISM', label: 'Contrarian', essence: 'The productive fracture.' },
  'Ø': { glyph: 'VOID', label: 'Receptive', essence: 'The deliberate absence.' },
};

// Per-Subtaste sensibility. Multiple divergent example textures per
// designation, organised by setting register. The LLM picks one
// example pool and draws specifics from it; without this, generation
// collapses to the same Frieze / Brooklyn / altar-keeper register
// for every character.
//
// Each setting key contains 3-5 short worked examples in the
// sensibility's voice. Concrete places, specific refusals, real
// attitude. Mix UK + US + diasporic + mythic so the cohort doesn't
// homogenise.

interface SensibilityExamples {
  modern: string[];
  mystical: string[];
  archaic: string[];
  surreal: string[];
}

const SUBTASTE_EXAMPLES: Record<string, SensibilityExamples> = {
  'S-0': {
    modern: [
      'always at the head of the table at the Soho House she pretends to dislike, never explains the seating',
      'walks into the office in a black turtleneck on a Tuesday and the meeting reorganises around her',
      'has the same standing reservation at Lyle\'s, doesn\'t look at the menu',
    ],
    mystical: [
      'the elders rise without being told when she enters the courtyard',
      'her name is spoken before her own at oríkì, and she does not correct it',
    ],
    archaic: [
      'the duchess who arrived at court three days late and was forgiven',
      'the abbess whose order changed liturgy because she preferred matins shorter',
    ],
    surreal: [
      'arrives at every event already seated. Nobody asks how. Nobody asks anymore.',
    ],
  },
  'T-1': {
    modern: [
      'spreadsheet-mind. Colour-coded the entire RIBA practice into nine subgroups before they hired her',
      'has an Anki deck for every project she\'s ever touched, exports it twice a year',
      'reads the building regulations for fun. Knows which load-bearing wall the developer is lying about',
    ],
    mystical: [
      'maps the lineage three generations deep before she names the child',
      'reads ifa before booking flights, but only on Saturdays',
    ],
    archaic: [
      'the cartographer who corrected the maps the king was using and refused to apologise',
      'the architect who designed the cathedral nave to acoustic specifications nobody asked for',
    ],
    surreal: [
      'her flat has folders for folders. The folders have indices. The indices reference each other.',
    ],
  },
  'V-2': {
    modern: [
      'recommended Skepta in 2010, told you about Loyle Carner before the album, has already moved on from whoever you\'re excited about',
      'left the Mayfair gallery six months before it closed. Knew. Won\'t say how.',
      'told her sister to buy in Margate in 2014. Was right. Doesn\'t bring it up.',
    ],
    mystical: [
      'the dream came twice, three years apart, in the same Lagos house she has not visited',
      'reads the fall of the cards once and never again. The first read is the only true one.',
    ],
    archaic: [
      'the soothsayer who told the merchant not to sail. The merchant sailed. The town remembered.',
    ],
    surreal: [
      'mentions a bar that hasn\'t opened yet. By Tuesday it has opened. She\'s already left.',
    ],
  },
  'L-3': {
    modern: [
      'same three friends since Year 9. Still goes to the same Greggs in Croydon every Wednesday',
      'has tended the same fig tree on her Walthamstow balcony for twelve years. Refuses to repot.',
      'rides the 418 in Epsom on a leap year. The same conductor recognises her every four years',
    ],
    mystical: [
      'tends the bóveda altar for her grandmother\'s grandmother. Has not skipped a Thursday in nine years',
      'Sankofa: knows the Akan name of every fruit she eats and won\'t shorten it',
    ],
    archaic: [
      'the gardener who weeded the same monastery plot for forty-one years',
    ],
    surreal: [
      'has been waiting for the same kettle to boil since 2003. It is almost done.',
    ],
  },
  'C-4': {
    modern: [
      'curated the best gallery in the Lower East Side and walked out when they hung an Olafur. Now hangs at Frieze and throws truffles at the cube',
      'goes to Annabel\'s only on a leap year. Otherwise it\'s Brilliant Corners or nothing',
      'doesn\'t need a sugar daddy. Has rejected three',
      'will not eat at Sushi Samba. Will not explain why. Has typed the address into Citymapper twice this year and still walked the other direction',
    ],
    mystical: [
      'the priest who refused to bless the marriage. Was right',
      'the mae walks out of the terreiro when the wrong drum is used. Returns the next week',
    ],
    archaic: [
      'the chamberlain who returned the king\'s gift. Survived',
    ],
    surreal: [
      'has unsubscribed from every newsletter twice. The third time, they leave her alone',
    ],
  },
  'N-5': {
    modern: [
      'made the playlist that finally got her grime cousin and her jazz uncle on the same WhatsApp',
      'introduced the gallerist to the rapper at the wrong dinner. Now the album has the right cover',
      'drinks at the Fox in Dalston with Soho House regulars and Stoke Newington poets. Same night.',
    ],
    mystical: [
      'the babalawo who reads for both the imam\'s daughter and the church-girl. Neither knows about the other',
    ],
    archaic: [
      'the merchant who brought the silk routes and the tea routes into one ledger',
    ],
    surreal: [
      'every party she throws has at least one person from each of her past lives',
    ],
  },
  'H-6': {
    modern: [
      'has been talking about Octavia Butler at every dinner for eleven years. Has never been wrong about it',
      'sent you the same Saidiya Hartman essay three times. Will send it again',
      'still posting about the housing block they never let go to. Right twice on the council vote',
    ],
    mystical: [
      'the griot whose praise-line for the Keita lineage is too long for younger ears. Sings it anyway',
    ],
    archaic: [
      'the abolitionist who outlasted three congregations',
    ],
    surreal: [
      'has tweeted the same thing every Tuesday since 2018. The world has not yet caught up',
    ],
  },
  'P-7': {
    modern: [
      'three rooms of vinyl. Climate-controlled. Knows the catalogue number of the second pressing',
      'has every issue of i-D from before they redesigned the masthead',
      'still pays for The Wire in physical. Has the receipt from 2009',
    ],
    mystical: [
      'keeps her grandmother\'s saints. Lights the same candle on the same date',
    ],
    archaic: [
      'the librarian of Alexandria who copied the texts before the fire',
    ],
    surreal: [
      'owns a format that was invented twice and discontinued twice. Has the player in working order',
    ],
  },
  'D-8': {
    modern: [
      'recommends bars before they open. Has dreamed the menu',
      'picks the right book off her friend\'s shelf without scanning. Reads three lines and gives it back',
      'gets the call right before her phone rings. Doesn\'t mention it',
    ],
    mystical: [
      'the lwa rides her in the kitchen. She makes the soup the way the lwa wants. Nobody knows why it tastes like that',
    ],
    archaic: [
      'the oracle who answered the question the supplicant didn\'t know they were asking',
    ],
    surreal: [
      'her reflection sometimes arrives a half-second late. She has stopped checking.',
    ],
  },
  'F-9': {
    modern: [
      'opened the studio in Hackney Wick herself. Did the electrics. Has the calluses',
      'finished the album in three months while everyone else talked about it for years',
      'renovated the Margate flat alone. Plumbing included. Now hosts dinners',
    ],
    mystical: [
      'the smith of Ogun. Three months at the forge. Came out with the iron and the song',
    ],
    archaic: [
      'the cathedral mason who finished the south transept the year before the war started',
    ],
    surreal: [
      'has built a working clock out of objects from her last seven flats. It runs',
    ],
  },
  'R-10': {
    modern: [
      'walked out of the meeting at the agency. Said the unsayable at the dinner. Has been right twice and wrong once and will not apologise',
      'broke up the collective the year before they got the deal. Now everyone says it was the right call',
      'told the curator their Frieze stand was nostalgia. The curator did not invite her again. The next year she ran the off-site',
    ],
    mystical: [
      'the prophet who told the king the kingdom was over. Was right. The king\'s grandson listed her in the chronicles',
    ],
    archaic: [
      'the heretic monk who left the order. Translated the texts. Outlived the order',
    ],
    surreal: [
      'has refused twelve invitations she was never sent',
    ],
  },
  'Ø': {
    modern: [
      'she asks the one question that reframes the dinner. Doesn\'t post much. People ring her instead',
      'sat through the whole reading. Said one thing afterwards that the writer is still thinking about',
      'remembers what you said in 2019 and gives it back to you cleaner',
    ],
    mystical: [
      'the egungun priest who keeps the silence between songs. The silence is the song',
    ],
    archaic: [
      'the queen who listened. The court called her dull. The court was wrong',
    ],
    surreal: [
      'her presence in a room makes the room remember things the room did not know',
    ],
  },
};

const SETTING_LABELS: Record<string, string> = {
  modern: 'modern (present-day specifics: real shops, real bus routes, real venues, real refusals)',
  mystical: 'mystical (diasporic-ritual register: altars, ancestors, divinatory practice, lwa, oríkì)',
  archaic: 'archaic (pre-modern, historical: courts, monasteries, abolitionist work, lineage memory)',
  past_life: 'past_life (a present character whose specifics include archaic flashbacks woven in)',
  mythic: 'mythic (legendary, named only by archetype, out-of-time)',
  surreal: 'surreal (absurd, dream-logic, non-naturalistic but specific)',
  mixed: 'mixed (the generator picks 1-2 settings and blends, with cohort-internal variance)',
};

function pickExampleBuckets(setting: Setting | undefined): Array<keyof SensibilityExamples> {
  switch (setting) {
    case 'modern':
      return ['modern'];
    case 'mystical':
      return ['mystical'];
    case 'archaic':
      return ['archaic'];
    case 'past_life':
      return ['modern', 'archaic'];
    case 'mythic':
      return ['archaic', 'mystical'];
    case 'surreal':
      return ['surreal'];
    case 'mixed':
    default:
      // For 'mixed' or unset, randomly pick 2 buckets from all 4 so
      // sequential generations across the cohort get different
      // example pools rather than collapsing to one.
      const all: Array<keyof SensibilityExamples> = ['modern', 'mystical', 'archaic', 'surreal'];
      const shuffled = all.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 2);
  }
}

function subtasteSensibility(code: string | undefined, setting: Setting | undefined): string {
  if (!code) return '';
  const examples = SUBTASTE_EXAMPLES[code];
  if (!examples) return '';

  const buckets = pickExampleBuckets(setting);
  const lines: string[] = ['## Subtaste sensibility (the flavour to reach for)'];

  if (setting && SETTING_LABELS[setting]) {
    lines.push(`Setting register: ${SETTING_LABELS[setting]}.`);
  }
  lines.push('');
  lines.push('Concrete texture examples in this register (do not copy verbatim; pick the texture, swap the specifics):');

  for (const bucket of buckets) {
    const items = examples[bucket];
    if (!items || items.length === 0) continue;
    // Random rotation per generation so cohort gets variance.
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, Math.min(3, shuffled.length));
    lines.push(`\n[${bucket}]`);
    for (const ex of picked) lines.push(`- ${ex}`);
  }

  lines.push('');
  lines.push(
    'Use these as calibration for *level of specificity*. Real venues, real bus routes, real refusals, real expertise. Specifics from the cohort\'s actual world (London, Lagos, Brooklyn, Croydon, Walthamstow, Hackney, Mayfair, Stoke Newington, etc) when the setting is modern. Do not default to "altar in Brooklyn" or "priest in Port-au-Prince" unless the setting and lineage explicitly call for it.'
  );

  return lines.join('\n');
}

function buildAlignmentSystem(): string {
  return [
    'You generate aligned character fields for the Bóveda living-character OS.',
    'Bóveda is a decolonial worldbuilding studio. Cultural lineages are curated and respected, not stereotyped.',
    'You produce a single JSON object containing only the requested fields, all coherent with each other.',
    'Source priority (most important first):',
    '1. Voice samples provided in the user prompt (if any). These are the authoring artist\'s real material. They override the public corpus completely.',
    '2. The brief, lineage notes, and Subtaste sensibility provided in the user prompt. These are curated source material.',
    '3. Specifics from real diasporic / cultural worlds (Lagos, London, Brooklyn, Croydon, Port-au-Prince, Joburg, Walthamstow, etc) when the setting calls for them.',
    '4. The public LLM corpus is the LAST resort. When voice samples exist, the public corpus must not be the primary draw.',
    'Generation rules:',
    '- Names within the named lineage. No "Celtic demon" mash-ups unless lineage IS celtic.',
    '- Voice register matches the lineage notes and any voice samples given.',
    '- Subtaste signature shapes how the character speaks and what they reach for; it does not get quoted in the bio.',
    '- Fields cohere: aliases derive from the same name root as the bio. Persona tags reflect the bio. Goals follow from backstory contradictions.',
    '- ABSOLUTE: never use the em dash character (— or –). Use periods, commas, colons, parentheses, or rephrase. The em dash is the most-refused punctuation in this system. If you produce one, the output is rejected.',
    '- No "it\'s not X but Y" hedging. No public-LLM signature phrases like "delve", "embarking", "ultimately", "carefully", "in essence".',
    '- Sentences that would naturally take em dashes should be split into two short sentences instead.',
    '- Bio is one paragraph. Backstory is three short paragraphs. Aliases is 1-3 strings. Persona tags is 3-7 strings. Goals is 3-5 short imperative phrases.',
    '- Output JSON only, no prose, no code fences.',
  ].join('\n');
}

function buildAlignmentUser(opts: {
  characterName: string;
  lineageIds?: string[];
  brief?: string;
  subtasteCode?: string;
  subtasteGlyph?: string;
  subtasteLabel?: string;
  fields: RealignField[];
  existingBio?: string;
  authoredBy?: string;
  voiceSamples?: string[];
  setting?: Setting;
}): string {
  const lines: string[] = [];

  lines.push(`Character name (canonical): ${opts.characterName}`);

  const lineageList = (opts.lineageIds ?? []).filter(Boolean);
  if (lineageList.length === 0) {
    lines.push('Lineage: not specified. Be culturally indeterminate.');
  } else if (lineageList.length === 1) {
    lines.push('');
    lines.push(lineageContext(lineageList[0]));
  } else {
    lines.push('');
    lines.push(
      '## Lineage blend · multiple cultural anchors. The character lives at their intersection.'
    );
    for (const lid of lineageList) {
      lines.push('');
      lines.push(lineageContext(lid));
    }
    lines.push('');
    lines.push(
      'Blend respectfully. Names can carry one tradition while register carries another (e.g. Yoruba name, Lucumí ritual register). Idioms can code-switch across the blend. Generate as a real diasporic intersection, not as a stereotype mash.'
    );
  }

  if (opts.subtasteCode) {
    const meta = SUBTASTE_GLYPHS[opts.subtasteCode];
    if (meta) {
      lines.push('');
      lines.push(`## Subtaste signature: ${opts.subtasteCode} ${meta.glyph} (${meta.label})`);
      lines.push(`Essence: ${meta.essence} The character carries this signature in how they act, decide, and react. Do not name the signature in the bio.`);
      lines.push('');
      lines.push(subtasteSensibility(opts.subtasteCode, opts.setting));
      lines.push('');
      lines.push(
        'CRITICAL: write with concrete lifestyle specifics, not abstract description. Reference real-feeling places, refusals, habits, expertise. The bio should read like the worked example texture in the sensibility above. Avoid generic phrases like "they value depth" or "they refuse easy answers." Show the depth and the refusal through specific behaviour.'
      );
    }
  }

  if (opts.brief) {
    lines.push('');
    lines.push(`## Brief from the author`);
    lines.push(opts.brief);
  }

  if (opts.existingBio) {
    lines.push('');
    lines.push(`## Existing bio (refine, do not contradict)`);
    lines.push(opts.existingBio);
  }

  // Cohort-first directive. When the character has voice samples or
  // a named author, the LLM is told to draw vocabulary, cadence, and
  // references from THOSE rather than the public corpus. This is
  // the pre-LoRA bridge: until trained adapters ship, we pull the
  // authoring artist's actual material into context as few-shot.
  if ((opts.voiceSamples && opts.voiceSamples.length > 0) || opts.authoredBy) {
    lines.push('');
    lines.push('## Cohort-first source priority');
    if (opts.authoredBy) {
      lines.push(`This character is voiced by ${opts.authoredBy}. Speak in their register, not in a generic public-LLM register.`);
    }
    if (opts.voiceSamples && opts.voiceSamples.length > 0) {
      lines.push(
        'The following are real samples in the authoring artist\'s voice. Draw vocabulary, cadence, idiom, refusals, and reference frame from these. Do not pull from the generic English corpus when these exist.'
      );
      opts.voiceSamples.slice(0, 6).forEach((s, i) => {
        lines.push('');
        lines.push(`--- voice sample ${i + 1} ---`);
        lines.push(s);
      });
      lines.push('');
      lines.push(
        'Generate as if you were the artist who wrote those samples. Their phrasing patterns are the source. Do not summarise them. Do not quote them. Write something new in their actual cadence and reference world.'
      );
    }
  }

  lines.push('');
  lines.push('## Output schema');
  lines.push(
    'Return JSON with exactly the requested fields. Required fields:'
  );
  for (const f of opts.fields) {
    if (f === 'bio') lines.push('  bio: string (one short paragraph, 3-5 sentences. Concrete lifestyle specifics, real-feeling places, real refusals, real expertise. Match the Subtaste sensibility texture above. Do not name the Subtaste glyph or label in the bio.)');
    else if (f === 'backstory')
      lines.push(
        '  backstory: string (three short paragraphs. Resonate with the Subtaste sensibility: same flavour as the bio but deeper. Specific places, specific failures, specific expertise. The Editorial Subtaste should produce a backstory full of named exhibits, gallerists they outlasted, dinner refusals, the year they walked out. The Visionary should produce one full of rooms they entered first. Specific. Lived-in. Never abstract. Never quoted by the character.)'
      );
    else if (f === 'aliases') lines.push('  aliases: string[] (1-3 names within the lineage\'s naming pattern)');
    else if (f === 'personaTags')
      lines.push('  personaTags: string[] (3-7 lowercase tags, lineage-aware, no generic AI tags)');
    else if (f === 'goals') lines.push('  goals: string[] (3-5 short imperative phrases, what the character is reaching toward)');
    else if (f === 'tongue')
      lines.push(
        '  tongue: { primaryLanguage: string, dialect: string, accent: string, idioms: string[] (3-6 specific phrases this character uses), registerNotes: string (one sentence on cadence/refusals) } — anchored to lineage. NOT generic. Specific dialect (Lagos pidgin, AAVE, Kreyòl, Yoruba code-switch, south London, etc.) so the character does not converge on standard English.'
      );
  }
  lines.push('');
  lines.push('Output JSON only.');
  return lines.join('\n');
}

// (em-dash strip imported at top)

function parseDraft(text: string): AlignedDraft | null {
  if (!text) return null;
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    if (!parsed || typeof parsed !== 'object') return null;
    const draft: AlignedDraft = {};
    if (typeof parsed.bio === 'string') draft.bio = stripEmDashes(parsed.bio.trim());
    if (typeof parsed.backstory === 'string') draft.backstory = stripEmDashes(parsed.backstory.trim());
    if (Array.isArray(parsed.aliases))
      draft.aliases = parsed.aliases.filter((a: unknown) => typeof a === 'string').map((a: string) => a.trim()).filter(Boolean);
    if (Array.isArray(parsed.personaTags))
      draft.personaTags = parsed.personaTags
        .filter((a: unknown) => typeof a === 'string')
        .map((a: string) => a.trim().toLowerCase())
        .filter(Boolean);
    if (Array.isArray(parsed.goals))
      draft.goals = parsed.goals.filter((a: unknown) => typeof a === 'string').map((a: string) => a.trim()).filter(Boolean);
    if (parsed.tongue && typeof parsed.tongue === 'object') {
      const t = parsed.tongue as Record<string, unknown>;
      const tongue: TongueShape = {};
      if (typeof t.primaryLanguage === 'string') tongue.primaryLanguage = t.primaryLanguage.trim();
      if (typeof t.dialect === 'string') tongue.dialect = t.dialect.trim();
      if (typeof t.accent === 'string') tongue.accent = t.accent.trim();
      if (Array.isArray(t.idioms))
        tongue.idioms = (t.idioms as unknown[])
          .filter((i) => typeof i === 'string')
          .map((i) => (i as string).trim())
          .filter(Boolean);
      if (typeof t.registerNotes === 'string') tongue.registerNotes = t.registerNotes.trim();
      if (Object.keys(tongue).length > 0) draft.tongue = tongue;
    }
    return draft;
  } catch {
    return null;
  }
}

export async function realignRoutes(fastify: FastifyInstance): Promise<void> {
  // Lineage catalogue for the picker UI.
  fastify.get('/lineages', async (_request, reply) => {
    return reply.send({ lineages: listLineages() });
  });

  // Per-character realignment.
  fastify.post<{ Params: { id: string } }>(
    '/characters/:id/realign',
    async (request, reply) => {
      const { id } = request.params;
      const body = RealignSchema.parse(request.body ?? {});

      const character = await prisma.character.findUnique({ where: { id } });
      if (!character) return reply.code(404).send({ error: 'Character not found' });

      if (!hasLlmProvider()) {
        return reply.code(400).send({
          error: 'No ANTHROPIC_API_KEY set. Aligned generation requires a real LLM.',
        });
      }

      // Normalise lineage to array form. Validate every id.
      const lineageIds: string[] = Array.isArray(body.lineage)
        ? body.lineage
        : body.lineage
          ? [body.lineage]
          : [];
      const unknownLineages = lineageIds.filter((l) => !LINEAGES[l]);
      if (unknownLineages.length > 0) {
        return reply.code(400).send({
          error: `Unknown lineage(s): ${unknownLineages.join(', ')}. Get the list from GET /lineages.`,
        });
      }

      // Resolve subtaste: explicit > stored on character > none.
      let subtasteCode = body.subtasteCode;
      let subtasteGlyph: string | undefined;
      let subtasteLabel: string | undefined;
      if (!subtasteCode) {
        const stored = readSubtasteFromTimelineState(character.timelineState);
        subtasteCode = stored?.code;
      }
      if (subtasteCode) {
        const meta = SUBTASTE_GLYPHS[subtasteCode];
        if (meta) {
          subtasteGlyph = meta.glyph;
          subtasteLabel = meta.label;
        }
      }

      const system = buildAlignmentSystem();
      const user = buildAlignmentUser({
        characterName: character.name,
        lineageIds,
        brief: body.brief,
        subtasteCode,
        subtasteGlyph,
        subtasteLabel,
        fields: body.fields,
        existingBio: character.bio || undefined,
        authoredBy: character.authoredBy || undefined,
        voiceSamples: Array.isArray(character.voiceSamples)
          ? (character.voiceSamples as string[]).filter((s): s is string => typeof s === 'string')
          : undefined,
        setting: body.setting ?? (character.setting as Setting | undefined) ?? undefined,
      });

      let result;
      try {
        result = await callLlm({ system, user, maxTokens: 1200, cacheSystem: true });
      } catch (err) {
        if (err instanceof LlmBudgetError) {
          return reply.code(402).send({ error: err.message });
        }
        return reply.code(502).send({
          error: err instanceof Error ? err.message : 'Generation failed',
        });
      }

      const draft = parseDraft(result.text);
      if (!draft) {
        return reply.code(502).send({
          error: 'Generation succeeded but JSON parse failed.',
          rawText: result.text.slice(0, 500),
        });
      }

      // Filter to requested fields only (defensive).
      const filtered: AlignedDraft = {};
      for (const f of body.fields) {
        if (draft[f] !== undefined) (filtered as Record<string, unknown>)[f] = draft[f];
      }

      // If apply=true, write the draft to the character (respecting locks).
      if (body.apply) {
        const updates: Prisma.CharacterUpdateInput = {};
        const skipped: string[] = [];

        for (const f of body.fields) {
          if (filtered[f] === undefined) continue;
          if (body.respectLocks && isFieldLocked(character.identity, f as Parameters<typeof isFieldLocked>[1])) {
            skipped.push(f);
            continue;
          }
          if (f === 'bio' && filtered.bio !== undefined) updates.bio = filtered.bio;
          else if (f === 'backstory' && filtered.backstory !== undefined) updates.backstory = filtered.backstory;
          else if (f === 'aliases' && filtered.aliases !== undefined) updates.aliases = filtered.aliases;
          else if (f === 'personaTags' && filtered.personaTags !== undefined) updates.personaTags = filtered.personaTags;
          else if (f === 'goals' && filtered.goals !== undefined)
            updates.goals = filtered.goals as unknown as Prisma.InputJsonValue;
          else if (f === 'tongue' && filtered.tongue !== undefined)
            updates.tongue = filtered.tongue as unknown as Prisma.InputJsonValue;
        }

        if (Object.keys(updates).length > 0) {
          await prisma.character.update({ where: { id }, data: updates });
        }

        return reply.send({
          characterId: id,
          draft: filtered,
          applied: true,
          skipped,
          source: result.source,
          usage: result.usage,
        });
      }

      return reply.send({
        characterId: id,
        draft: filtered,
        applied: false,
        source: result.source,
        usage: result.usage,
      });
    }
  );
}
