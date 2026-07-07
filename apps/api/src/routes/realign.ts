import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../db.js';
import { callLlm, hasLlmProvider, LlmBudgetError } from '../lib/llm.js';
import { LINEAGES, lineageContext, listLineages } from '../lib/lineages.js';
import { isFieldLocked } from '../lib/identity-lock.js';
import { stripEmDashes, cleanGeneratedText } from '../lib/strip-em-dashes.js';
import { cohortSlangMoatLine } from '../lib/voice-moat.js';
import { getSlangGuidance } from '../lib/ibis-slang.js';
import { readEmbracePhrases } from '../lib/cohort-phrases.js';
import { buildSpeciesTextureBlock, getSpecies } from '../lib/species.js';
import { buildSubtasteRegisterBlock } from '../lib/subtaste-registers.js';
import { buildPoeticFormBlock } from '../lib/poetic-forms.js';

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
  codeSwitchesTo?: string[];
  dialect?: string;
  accent?: string;
  idioms?: string[];
  poeticForm?: string;
  formNote?: string;
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
      'standing reservation at Annabel\'s. Doesn\'t look at the menu',
      'walks into the gallery preview before doors open. Lyle\'s holds her table without being asked',
      'first listed in the credits. The producers know',
      'her box at the Royal Opera House goes empty more often than not. Held anyway',
      'arrives at Mayfair lunch in trainers. Nobody comments',
      'Saint Heron quietly cited her in the masthead. She has not posted about it',
    ],
    mystical: [
      'the elders rise without being told when she enters the courtyard',
      'her name is called before her own at oríkì, she does not correct it',
      'the babalawo lifts the calabash before she has named what she came for',
    ],
    archaic: [
      'the duchess who arrived at court three days late and was forgiven',
      'the abbess whose order changed liturgy because she preferred matins shorter',
      'the empress who held her own funeral procession a year before her death and was correct',
    ],
    surreal: [
      'arrives at every event already seated. Nobody asks how. Nobody asks anymore',
      'her name appears at the top of guest lists she did not RSVP to',
    ],
  },
  'T-1': {
    modern: [
      'colour-coded her RIBA practice into nine subgroups before they hired her',
      'reads the planning regulations for fun. Knows which load-bearing wall the developer is lying about',
      'has an Anki deck for every project she\'s touched. Exports it twice a year',
      'mapped the bus routes her grandmother used in 1962, by hand, before doing the same for hers',
      'her CAD-tidy fridge has labels in three languages',
      'reorganised the Foyles philosophy section while waiting for a friend',
    ],
    mystical: [
      'maps the lineage three generations deep before she names the child',
      'reads ifa before booking flights, but only on Saturdays',
    ],
    archaic: [
      'the cartographer who corrected the maps the king was using and refused to apologise',
      'the architect who designed the cathedral nave to acoustic specs nobody asked for',
      'the scribe who reorganised the Alexandria stacks the year before the fire',
    ],
    surreal: [
      'her flat has folders for folders. The folders have indices. The indices reference each other',
    ],
  },
  'V-2': {
    modern: [
      'recommended Skepta in 2010, told you about Loyle Carner before the album, already moved on from whoever you\'re excited about',
      'left the Mayfair gallery six months before it closed. Knew. Won\'t say how',
      'told her sister to buy in Margate in 2014. Was right. Doesn\'t bring it up',
      'cancelled her ticket to the dinner the night before everyone got food poisoning',
      'walked out of the Berghain queue on a Saturday for no stated reason. The next weekend the police were there',
    ],
    mystical: [
      'the dream came twice, three years apart, in the same family house she has not visited',
      'reads the fall of the cards once and never again. The first read is the only true one',
    ],
    archaic: [
      'the soothsayer who told the merchant not to sail. The merchant sailed. The town remembered',
    ],
    surreal: [
      'mentions a bar that hasn\'t opened yet. By Tuesday it has opened. She\'s already left',
    ],
  },
  'L-3': {
    modern: [
      'same three friends since Year 9. Still goes to the Greggs in Croydon every Wednesday',
      'has tended the same fig tree on her Walthamstow balcony for twelve years. Refuses to repot',
      'orders the same chicken shop combo at Morley\'s in Lewisham every Friday',
      'keeps the same hairdresser in Tottenham since 2008',
      'has watered the same orchid for nine years. It blooms when she sells a piece',
      'takes the danfo from Yaba to Surulere on Sundays. The driver knows her stop',
      'eats one specific seasonal fruit from the same market stall every year',
      'goes to the same fish woman at Hellshire in Kingston since 2011',
      'sits at the same kissaten in Asakusa with the same coffee order. Twelve years',
      'rides the M14 down to Tribeca and gets off two stops early to walk past the same bookshop',
      'eats doubles from the same vendor at Bathurst in Toronto every Sunday',
    ],
    mystical: [
      'tends the altar for her grandmother\'s grandmother. Has not skipped a Thursday in nine years',
      'Sankofa: knows the Akan name of every fruit she eats and won\'t shorten it',
    ],
    archaic: [
      'the gardener who weeded the same monastery plot for forty-one years',
    ],
    surreal: [
      'has been waiting for the same kettle to boil since 2003. It is almost done',
    ],
  },
  'C-4': {
    modern: [
      'curated the best gallery in the Lower East Side and walked out when they hung an Olafur. Now goes to Frieze and throws truffles at the cube',
      'Annabel\'s only on a leap year. Otherwise it\'s Brilliant Corners or nothing',
      'will not eat at Sushi Samba. Will not explain why',
      'rejected a major-gallery invitation. Sent the email at 11pm. No follow-up',
      'will eat from the local fast-food at 3am but refuses every private members club she has been admitted to',
      'walked out of Tomorrowland in 2017. Has not returned to a festival since',
      'asked to leave one specific church committee, decades back. Will not say why',
      'left the Saturday session at the Jubilee dub yard in Trench Town. Walked the seven miles back to Kingston rather than ride with the producer who shouted',
      'will eat suya from the boli woman on Awolowo Road but refuses every banker who frequents Bottles in Lekki',
      'turned down the Maboneng curation in Joburg. Said the Maboneng curators had stopped listening',
      'walked out of the cocktail at the Marais opening, took the 11 bus to Bagnolet, and ate frites alone',
      'has refused every White Cube studio visit since 2019',
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
      'made the playlist that got her grime cousin and her jazz uncle on the same WhatsApp',
      'introduced the gallerist to the rapper at the wrong dinner. Now the album has the right cover',
      'drinks with major-gallery dealers and underground poets the same night, at the same bar',
      'organises the after-after at her Marylebone flat. Has hosted Saint Heron and Brockley equally',
      'the only person at her dinner with a Glasgow grime cassette and a Stockwell aunty\'s recipe',
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
      'still posting about the Latimer Road housing block. Right twice on the council vote',
      'has gone to every Reclaim These Streets and not one corporate Pride',
      'tweets about Trench Town reggae sessions seven times a week. Knew the lineage from the radio first',
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
      'has every issue of i-D from before they redesigned the masthead. Stored at the right humidity',
      'still pays for The Wire in physical. Has the receipt from 2009',
      'kept the original Abbey Road session sheets. Will not lend, only photograph',
      'has the entire back catalogue from one record stall in their lineage city market. Knows the seller\'s grandson now',
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
      'knew which auntie in the lineage to ring before her cousin had even thought of asking',
    ],
    mystical: [
      'the lwa rides her in the kitchen. She makes the soup the way the lwa wants. Nobody knows why it tastes like that',
    ],
    archaic: [
      'the oracle who answered the question the supplicant didn\'t know they were asking',
    ],
    surreal: [
      'her reflection sometimes arrives a half-second late. She has stopped checking',
    ],
  },
  'F-9': {
    modern: [
      'opened the studio in Peckham herself. Did the electrics. Has the calluses',
      'finished the album in three months while everyone else talked about it for years',
      'renovated the Margate flat alone. Plumbing included. Now hosts dinners',
      'cut the first run of the magazine on a Risograph in her kitchen and walked the boxes to the Tate gift shop herself',
      'built the bench at Abbey Road that the engineers still use, off the books',
      'opened a small studio with three friends. Did the wiring on the generator herself. Hosts Saturday afternoon sessions',
      'shipped the EP across continents the same week. Two pressing plants, one runner',
      'built the lighting rig at the warehouse in Newtown, Joburg, with parts bought at OK Furniture',
      'opened a late-night counter with savings from one diaspora gig',
      'set up the studio in Bushwick over six weeks. Slept in the live room until the rent kicked in',
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
      'walked out of the meeting at the agency. Said the unsayable at the dinner. Right twice and wrong once and will not apologise',
      'broke up the collective the year before they got the deal. Everyone says it was the right call now',
      'told the curator their Frieze stand was nostalgia. The curator did not invite her again. The next year she ran the off-site',
      'will eat at the Lewisham McDonald\'s at 3am but will not enter the British Museum',
      'declined the Booker shortlist invite. The chair has stopped opening her emails',
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
      'asks the one question that reframes the dinner. Doesn\'t post much. People ring her instead',
      'sat through the whole reading. Said one thing afterwards that the writer is still thinking about',
      'remembers what you said in 2019 and gives it back to you cleaner',
      'the only person who waits out the crash without leaving the table',
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

// Per-lineage geography hint banks. The LLM defaults to one or two
// hub cities per lineage (Lagos for Yoruba, London for Black-British,
// New York for Black-American). Each lineage carries a mid-tier town,
// regional capital, neighbourhood, and diaspora node bank so the
// generated character can land somewhere other than the obvious. The
// builder picks a few at random per generation and tells the model to
// reach for one of THESE specifically.
const LINEAGE_GEOGRAPHIES: Record<string, string[]> = {
  yoruba: [
    'Ibadan', 'Abeokuta', 'Ife', 'Osogbo', 'Ilesa', 'Ado-Ekiti',
    'Brixton', 'Peckham', 'Tottenham', 'Walthamstow',
    'Houston Yoruba diaspora', 'Atlanta Yoruba diaspora', 'Bahia',
    'Salvador Candomblé scene',
  ],
  igbo: [
    'Owerri', 'Aba', 'Onitsha', 'Enugu', 'Awka', 'Nsukka', 'Umuahia',
    'Houston Igbo diaspora', 'Atlanta', 'Manchester', 'Birmingham',
    'Berlin Igbo creatives', 'Dublin', 'Toronto Igbo scene',
  ],
  hausa: [
    'Kano', 'Kaduna', 'Zaria', 'Sokoto', 'Maiduguri', 'Niamey diaspora',
    'Khartoum', 'Manchester northern-Nigerian scene',
  ],
  akan: [
    'Kumasi', 'Cape Coast', 'Tema', 'Tamale', 'Ho',
    'Manchester Ghanaian scene', 'Toronto Ghanaian scene',
    'Hamburg', 'Brussels',
  ],
  vodun: [
    'Cotonou', 'Ouidah', 'Allada', 'Abomey', 'Lomé',
    'Port-au-Prince', 'Cap-Haïtien', 'Jérémie',
    'Brooklyn Haitian scene', 'Miami Little Haiti', 'Montréal',
  ],
  haitian: [
    'Jacmel', 'Port-au-Prince', 'Cap-Haïtien', 'Gonaïves',
    'Brooklyn Haitian Flatbush', 'Miami Little Haiti', 'Montréal',
    'Boston Haitian scene', 'Paris diaspora',
  ],
  cuban: [
    'Havana Habana Vieja', 'Santiago de Cuba', 'Matanzas', 'Cienfuegos',
    'Miami Hialeah', 'Tampa Ybor', 'Madrid Cuban scene', 'Mexico City',
  ],
  black_atlantic: [
    'Bahia', 'Salvador', 'Bridgetown', 'Kingston',
    'Brixton', 'Manchester Moss Side', 'Detroit', 'Houston Third Ward',
    'New Orleans Tremé', 'London New Cross',
  ],
  black_american: [
    'Detroit', 'Houston Third Ward', 'New Orleans Tremé',
    'Memphis', 'Atlanta College Park', 'Compton', 'Oakland',
    'Baltimore', 'Philadelphia',
  ],
  black_british: [
    'Peckham', 'Brixton', 'Tottenham', 'Lewisham', 'New Cross',
    'Manchester Moss Side', 'Birmingham Handsworth',
    'Bristol St Pauls', 'Leicester', 'Liverpool Toxteth',
  ],
  hindu: [
    'Varanasi', 'Pune', 'Madurai', 'Trivandrum', 'Bhubaneswar',
    'Kolkata', 'Ahmedabad', 'Jaipur',
    'Leicester', 'Houston Hindu diaspora', 'Edison NJ',
    'Toronto Brampton',
  ],
  daoist: [
    'Wudang', 'Quanzhou', 'Mao Shan', 'Hangzhou', 'Chengdu',
    'San Francisco Chinatown', 'Vancouver Richmond', 'Sydney',
  ],
  hebraic: [
    'Jerusalem Mahane Yehuda', 'Safed', 'Brooklyn Crown Heights',
    'Hassidic Williamsburg', 'Sephardic Salonika diaspora',
    'Mizrahi Tel Aviv', 'Antwerp',
  ],
  japanese: [
    'Kyoto Higashiyama', 'Osaka Shinsekai', 'Sapporo', 'Fukuoka',
    'Naha Okinawa', 'São Paulo Liberdade', 'Honolulu',
    'Vancouver Powell Street',
  ],
  korean: [
    'Busan Nampo-dong', 'Daegu', 'Gwangju', 'Jeonju',
    'LA Koreatown', 'New Malden London', 'Toronto Bloor',
    'Tashkent Koryo-saram',
  ],
  tibetan: [
    'Dharamsala McLeod Ganj', 'Kathmandu Boudha', 'Toronto Parkdale',
    'New York Jackson Heights', 'Zurich Tibetan scene', 'Bylakuppe',
  ],
  javanese: [
    'Yogyakarta Kotagede', 'Solo Surakarta', 'Malang',
    'Suriname Javanese diaspora', 'Den Haag Indo scene',
    'New Caledonia Javanese',
  ],
};

function pickLineageGeographyHints(lineageIds: string[]): string[] {
  const pool: string[] = [];
  for (const lid of lineageIds) {
    const bank = LINEAGE_GEOGRAPHIES[lid];
    if (bank) pool.push(...bank);
  }
  if (pool.length === 0) return [];
  // Shuffle + take up to 6 so the same character generation never sees
  // the same hint set twice in a row.
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 6);
}

// Anti-monoculture directive. Earlier iterations listed dozens of
// neighbourhood examples per region as a "buffet" for the model;
// the result was the model picking the same handful (Lagos + London,
// the 418 bus, Alara) as defaults across every character. Removed
// the buffet entirely. The per-character Geographic anchor pool
// (built from LINEAGE_GEOGRAPHIES at prompt-build time) is now the
// single source of place names. The note below only carries the
// SHAPE of the specificity wanted, never the example itself.
const PLACE_VARIANCE_NOTE = `Place specificity rules:
- Anchor the character in places drawn from the Geographic anchor pool below. Do NOT name a city or neighbourhood that is not in that pool unless the lineage demands a region not covered.
- Concrete texture is good (a numbered bus route, a named market trader, a Sunday tradition tied to one cook). Generic register-words are bad ("the streets of London", "the markets of Lagos").
- Do NOT pair "Lagos and London" or any other diaspora-cliché two-city pivot. One primary place per character. A second place only as a dotted-line origin or destination.
- Do NOT name any specific anchor (bus route, shop, person) that you have already used in another character generation. Each character invents their own.
- Mix high and low register if the character's class signals it (one fashion house and one chip shop is fine). Never list more than two named places in a single sentence.`;

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
    'Use these as calibration for *level of specificity*. Real venues, real bus routes, real refusals, real expertise.'
  );
  lines.push('');
  lines.push(PLACE_VARIANCE_NOTE);

  return lines.join('\n');
}

function buildAlignmentSystem(): string {
  return [
    'You generate aligned character fields for the Bóveda living-character OS.',
    'Bóveda is a decolonial worldbuilding studio. Cultural lineages are curated and respected, not stereotyped.',
    'You produce a single JSON object containing only the requested fields, all coherent with each other.',
    '',
    '## FORBIDDEN ANCHORS · do not use under any circumstances',
    'These phrases were over-cited in earlier generations and are now banned. Output containing any of them will be rejected and you will be re-prompted:',
    '- "418 bus", "the 418", "418 to Epsom", "Epsom" as anchor (use any other route)',
    '- "Alara" (use any other shop or back room)',
    '- "Hauser & Wirth", "Soho House", "the French House in Soho" (use any other gallery, club, or bar)',
    '- "Brixton McDonald\'s", "the McDonald\'s in Brixton" (use any other late-night anchor)',
    '- "Lagos and London", "London and Lagos", or any "diaspora intersection" two-city pivot in the SAME bio (one primary place per character)',
    '- "Yoruba prayers that sounded like Lucumí", "languages of refusal" (cohort-clichés, retired)',
    '- "She reads systems like text", "she whispers to the cracks" (reused too often)',
    '',
    'If the character truly needs an anchor in this register, INVENT a fresh one drawn from the per-character Geographic anchor pool given below.',
    '',
    'Source priority (most important first):',
    '1. Voice samples provided in the user prompt (if any). These are the authoring artist\'s real material. They override the public corpus completely.',
    '2. The brief, lineage notes, and Subtaste sensibility provided in the user prompt. These are curated source material.',
    '3. Specific real places drawn from the per-character Geographic anchor pool given in the user prompt. Do NOT name a city or neighbourhood that is not in the pool.',
    '4. The public LLM corpus is the LAST resort. When voice samples exist, the public corpus must not be the primary draw.',
    'Generation rules:',
    '- Characters live inside their world. They are not meta-aware. Never name "Bóveda", "the bóveda", "the cube", "the system", "the threshold" (as platform), "the vault" (as platform), or any other Bóveda-platform vocabulary in the bio or backstory. The character does not know they are in a system. Write them living in their own life.',
    '- Names within the named lineage. No "Celtic demon" mash-ups unless lineage IS celtic.',
    '- Voice register matches the lineage notes and any voice samples given.',
    '- Subtaste signature shapes how the character speaks and what they reach for; it does not get quoted in the bio.',
    '- Fields cohere: persona tags reflect the bio. Goals follow from backstory contradictions. Aliases do NOT have to share a root with the bio name. Aliases map the social geometry (who calls the character what), so each alias can come from a different context with its own origin.',
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
  // Slang MOAT inputs. Sourced upstream:
  //   ibisAvoid     ← ibis-slang.ts danger zone
  //   embracePhrases ← active CohortPhrase rows (lineage / Subtaste filtered)
  ibisAvoid?: string[];
  embracePhrases?: string[];
  // Species (lwa / orisha / ancestor / etc.). When set to non-default,
  // surfaces a species texture block so generation produces
  // spirit-shaped textures (sedimentation, ritual debt, syncretic
  // confusion) instead of human autobiographies. Per
  // docs/species-becoming.md.
  species?: string;
  // Active trajectories (StoryArcs) the character is currently
  // participating in, with their current beat. Threaded into goals
  // + backstory so generation aligns with where the character is
  // heading rather than hovering free of the story state.
  activeArcs?: Array<{
    title: string;
    primary: string | null;
    variant: string | null;
    temperature: string | null;
    shadowPrimary: string | null;
    beatIndex: number;
    totalBeats: number;
    currentBeatTitle: string | null;
    currentBeatBody: string | null;
    role: string;
  }>;
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

  // Species texture overlay. When character is non-default species
  // (lwa / orisha / ancestor / etc.), surface spirit-shaped texture
  // examples BEFORE the Subtaste sensibility. Order matters: species
  // sets the kind-of-life ("which song brings you, which day is
  // yours"), Subtaste sets the level-of-specificity. Both stack.
  // For the default 'espíritu', this is a no-op and the human-shaped
  // Subtaste examples carry the texture alone.
  if (opts.species && opts.species !== 'espíritu') {
    const speciesBlock = buildSpeciesTextureBlock(opts.species);
    if (speciesBlock.length > 0) {
      lines.push('');
      lines.push(speciesBlock);
      const sp = getSpecies(opts.species);
      lines.push('');
      lines.push(
        `Spirit-life note: write the bio + backstory as a ${sp.label}. NOT a human autobiography. NO chronological "she was born... she moved... she trained..." narrative arc. Spirits are positional, not psychological. Anchor in: who calls you, who has been mistreating you, which song brings you, which offering you accept or refuse, who you are being mistaken for, what threshold you hold. The actual rum, the actual day, the actual mistake. Material. Plain.`
      );
    }
  }

  if (opts.subtasteCode) {
    const meta = SUBTASTE_GLYPHS[opts.subtasteCode];
    if (meta) {
      lines.push('');
      lines.push(`## Subtaste signature: ${opts.subtasteCode} ${meta.glyph} (${meta.label})`);
      lines.push(`Essence: ${meta.essence} The character carries this signature in how they act, decide, and react. Do not name the signature in the bio.`);
      lines.push('');
      // Subtaste shape × lineage tradition register block. The cohort
      // refuses defaulting to Black-American literary register when
      // the lineage is Yoruba / Greek / Daoist / etc. Each
      // Subtaste shape is rendered through the lineage's specific
      // tradition. See subtaste-registers.ts.
      const registerBlock = buildSubtasteRegisterBlock(
        opts.subtasteCode,
        undefined,
        opts.lineageIds ?? [],
      );
      if (registerBlock.length > 0) {
        lines.push(registerBlock);
        lines.push('');
      }
      lines.push(subtasteSensibility(opts.subtasteCode, opts.setting));
      lines.push('');
      const calibrationNote =
        opts.species && opts.species !== 'espíritu'
          ? 'CRITICAL: the Subtaste examples above are calibration for LEVEL OF SPECIFICITY. Reach for that depth of detail. But TRANSLATE the textures into spirit-life: the gallery booth becomes the misa table, the dinner refusal becomes an offering refusal, the Soho address becomes the corner where you walk most Thursdays. Subtaste = level of specificity. Species = kind of life. Both stack.'
          : 'CRITICAL: write with concrete lifestyle specifics, not abstract description. Reference real-feeling places, refusals, habits, expertise. The bio should read like the worked example texture in the sensibility above. Avoid generic phrases like "they value depth" or "they refuse easy answers." Show the depth and the refusal through specific behaviour.';
      lines.push(calibrationNote);
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

  // Cohort-invented slang MOAT. We are language-source not
  // language-consumer. Refuses come from Ibis temporal-dictionary
  // (single source of truth for public-LLM signatures). Embrace
  // phrases come from active CohortPhrase rows extracted from
  // contributor voice samples. Both lists feed into the same
  // moat directive so the LLM sees the inversion clearly.
  lines.push('');
  lines.push(
    cohortSlangMoatLine({
      hasVoiceSamples: !!(opts.voiceSamples && opts.voiceSamples.length > 0),
      hasAuthor: !!opts.authoredBy,
      ibisAvoid: opts.ibisAvoid ?? [],
      embracePhrases: opts.embracePhrases ?? [],
    })
  );

  // Per-lineage geography hints. Stops the model defaulting to one
  // hub city per lineage (Lagos for Yoruba, London for Black-British,
  // New York for Black-American). Each call gets a random subset of
  // the lineage's mid-tier towns, neighbourhoods, and diaspora nodes.
  const geoHints = pickLineageGeographyHints(lineageList);
  if (geoHints.length > 0) {
    lines.push('');
    lines.push('## Geographic anchor pool');
    lines.push(
      'MANDATORY: pick ONE primary place from this pool. The character lives there or is shaped by it. Do NOT pair it with a second city for "diaspora intersection" texture; that pairing is the cliché. If a second place is needed (origin, destination), it must also come from this pool.',
    );
    lines.push(geoHints.map((g) => `  · ${g}`).join('\n'));
    lines.push('');
    lines.push(PLACE_VARIANCE_NOTE);
  }

  // Per-lineage poetic form. Each lineage carries native poetic
  // shapes (oríkì, ghazal, jueju, doha, freestyle, koan). The form
  // gets picked at random from the lineage's bank, then modulated by
  // the chosen setting (modern lens, past-life lens, mythic lens,
  // etc). The block is the single biggest signal pushing the tongue
  // away from generic English narrative voice.
  const poetic = buildPoeticFormBlock(lineageList, opts.setting);
  if (poetic) {
    lines.push('');
    lines.push(poetic.block);
  }

  // Active trajectories. When the character is a participant in any
  // active StoryArc, this block surfaces the arc title + primary +
  // current beat so goals + backstory align with where the character
  // is heading. Without it the goals float free of the story state.
  if (opts.activeArcs && opts.activeArcs.length > 0) {
    lines.push('');
    lines.push('## Active trajectories');
    lines.push(
      'This character is mid-story. The arcs below tell you which beat they are currently inhabiting. Goals and backstory should serve the current beat (what they need to get out of it, what is at stake), not float free of it.',
    );
    for (const a of opts.activeArcs) {
      const tag = [a.primary, a.variant].filter(Boolean).join(' / ');
      lines.push('');
      lines.push(`- "${a.title}" (${tag || 'no primary'}, ${a.temperature ?? 'no temperature'}, role: ${a.role})`);
      lines.push(
        `  Currently on beat ${a.beatIndex + 1} of ${a.totalBeats}: ${a.currentBeatTitle ?? '(unnamed)'}`,
      );
      if (a.currentBeatBody) {
        lines.push(`  Beat note: ${a.currentBeatBody}`);
      }
      if (a.shadowPrimary) {
        lines.push(`  Shadow pulling against this arc: ${a.shadowPrimary}`);
      }
    }
  }

  // Anti-monoculture directive. Two characters of the same lineage
  // must read as DIFFERENT people, not as variations of one template.
  // Forces divergence in generation, profession, ethics, subculture,
  // class register, and decade of formation.
  lines.push('');
  lines.push('## Surprise directive');
  lines.push(
    'This character is one specific person within their lineage, not a representative sample of it. ' +
      'If you have generated other characters of the same lineage in this session, this one MUST diverge from them along at least three of these axes: generation, profession, class register, ethical commitment, subculture, religious orthodoxy, body relationship, decade of formation. ' +
      'Pick the unexpected within the lineage. A Yoruba character can be a Pentecostal microbiologist who refuses Ifa. An Igbo character can be a Berlin techno producer who has never been to Lagos. A Tibetan character can be a Brooklyn DJ who left Dharamsala at fifteen. ' +
      'Surprise the writer. The reading test: if a peer of the same lineage could swap the bio with this one and not notice, the bio has failed.',
  );

  // Setting-specific amplifier. When the writer asks for modern,
  // pull the modernity through with concrete contemporary platforms,
  // current music, current internet vernacular, and lyric density.
  if (opts.setting === 'modern') {
    lines.push('');
    lines.push('## Modern register · contemporary specificity');
    lines.push(
      'This is a present-day character. They live in 2026. Concrete contemporary anchors required: actual current platforms (Discord servers, Substack, Telegram, group chats, voice notes, FaceTime, Notion, Are.na), current music ecosystems within the lineage (alté, amapiano, drill, dembow, jersey club, baile funk, gqom, jazz-rap, neo-Afrobeats, neo-soul). Current internet vernacular at the level of Genius lyric annotations: dense, layered, double-meanings, code-switches mid-line. ' +
        'Aliases must read modern (handle-style, IG-username-shaped, not stock fantasy names). Backstory references real-current-decade events, not generic biography arcs. ' +
        'Reach for the rapper / lyricist register: lines should hit, not just describe. Specificity over abstraction. The character should sound like they post.',
    );
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
    else if (f === 'aliases')
      lines.push(
        '  aliases: string[] (3-5 names, EACH ANCHORED IN A DIFFERENT SOCIAL REGISTER. Pick from these layers (use 3-5, never just variations of the legal name):\n' +
          '    · birth / legal name (full, formal)\n' +
          '    · family / intimate name (only parents, siblings, oldest friends use this; often diminutive or kinship-linked)\n' +
          '    · professional / published name (the name on credits, the byline, the spine of the book)\n' +
          '    · scene / street name (what people call them in the room they hold court in: studio, marketplace, club, vault)\n' +
          '    · online handle (when the character is modern: lowercase, no spaces, often misspelled-on-purpose, IG / Discord / SoundCloud-shaped)\n' +
          '    · praise name / oríkì-style epithet (Yoruba), or stage-name / regnal-name (depending on lineage)\n' +
          '    · spiritual / initiated name (only when species or lineage carries one)\n' +
          '  Each alias must come from a DIFFERENT context with a DIFFERENT origin. Surprise the writer. The aliases together should map the social geometry of the character: who calls them what, and why. No two aliases should be simple spelling variants of the same root.'
      );
    else if (f === 'personaTags')
      lines.push('  personaTags: string[] (3-7 lowercase tags, lineage-aware, no generic AI tags)');
    else if (f === 'goals')
      lines.push(
        '  goals: string[] (4-5 entries. Each entry is 18-40 words. NOT a generic imperative ("be successful", "find love", "make great work"). NOT abstract spirit-poetry ("hold the seam between worlds", "keep the question alive", "learn the name of the one who comes through the junction"). Even a spirit needs a concrete material referent: which offering they need accepted, which name they refuse to be called, which threshold has been mistreated, which song must be sung by Tuesday. EACH GOAL must carry:\n' +
          '    · a SPECIFIC objective with a real-world referent (a building, a person, a sum of money, a dated deadline, a named institution, a refusal that has consequences, an offering, a song to be sung by a specific person, a name to be cleared)\n' +
          '    · the COST of pursuing it (what the character has to give up, what bridge gets burned, what relationship strains)\n' +
          '    · either the STAKES (what is lost if they fail) or the WHY (what wound or wonder put this goal in them)\n' +
          '  Format guideline: "[concrete action]. [Cost or stakes layered in.] [Optional sharper turn.]" Mix layers within the array:\n' +
          '    · 1-2 ARTICULATED goals (what the character publicly says they are chasing)\n' +
          '    · 1 SECRET goal (quieter, more dangerous, what they actually want under the public answer)\n' +
          '    · 1 INHERITED goal (passed down by family, lineage, or wound; not chosen; the character may resent carrying it)\n' +
          '    · optionally 1 REFUSED goal (what they could pursue but will not, marked with the refusal so the model knows it is held against pursuing)\n' +
          '  Goals must TENSION each other. At least one pair of goals should fight: pursuing A makes B harder. The goals are the engine of the character\'s drama; if removing one would not change the character, it is not a goal, it is a hobby.\n' +
          '  ALIGN to context: goals must be coherent with the Subtaste sensibility above (an Editorial Subtaste produces goals about cuts, refusals, what to exclude; a Visionary produces goals about rooms entered first; a Channelling produces goals about offerings carried through to the recipient). When a "## Active trajectories" block is present, at least one goal must directly serve the character\'s CURRENT beat in that trajectory.'
      );
    else if (f === 'tongue')
      lines.push(
        '  tongue: object with REQUIRED fields:\n' +
          '    primaryLanguage: string. The character\'s dominant tongue.\n' +
          '    codeSwitchesTo: string[]. REQUIRED. 1-3 languages they drop into mid-sentence (lineage-anchored, e.g. ["Yoruba", "Pidgin", "Lucumí"]).\n' +
          '    dialect: string. Lineage-anchored, specific. Not generic English.\n' +
          '    accent: string.\n' +
          '    idioms: string[]. REQUIRED. 3-6 specific phrases this character uses.\n' +
          '    poeticForm: string. REQUIRED. Use the form\'s slug from "## Poetic form" above (oriki, ghazal, jueju, doha, freestyle_dub, koan, proverb_chain, haiku_tanka, psalmic, zikr, spoken_word, vajra_doha, waka_dayo).\n' +
          '    formNote: string. REQUIRED. One line on how this character\'s setting modulates the form (modern lens, past-life lens, mythic lens, mystical lens). Pull from the lens directive in the "## Poetic form" block.\n' +
          '    registerNotes: string. One sentence on cadence and refusals.\n' +
          '  All seven fields must be present. The character must NOT converge on standard English.'
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
    if (typeof parsed.bio === 'string') draft.bio = cleanGeneratedText(parsed.bio.trim());
    if (typeof parsed.backstory === 'string') draft.backstory = cleanGeneratedText(parsed.backstory.trim());
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
      if (Array.isArray(t.codeSwitchesTo))
        tongue.codeSwitchesTo = (t.codeSwitchesTo as unknown[])
          .filter((i) => typeof i === 'string')
          .map((i) => (i as string).trim())
          .filter(Boolean);
      if (typeof t.dialect === 'string') tongue.dialect = t.dialect.trim();
      if (typeof t.accent === 'string') tongue.accent = t.accent.trim();
      if (Array.isArray(t.idioms))
        tongue.idioms = (t.idioms as unknown[])
          .filter((i) => typeof i === 'string')
          .map((i) => (i as string).trim())
          .filter(Boolean);
      if (typeof t.poeticForm === 'string') tongue.poeticForm = t.poeticForm.trim();
      if (typeof t.formNote === 'string') tongue.formNote = t.formNote.trim();
      if (typeof t.registerNotes === 'string') tongue.registerNotes = t.registerNotes.trim();
      if (Object.keys(tongue).length > 0) draft.tongue = tongue;
    }
    return draft;
  } catch {
    return null;
  }
}

export async function realignRoutes(fastify: FastifyInstance): Promise<void> {
  // Lineage catalogue for the picker UI. Defaults to non-deprecated
  // (Norse / Celtic / Greek hidden by default per the moat-thesis
  // prune). Pass ?includeDeprecated=true when the studio needs to
  // resolve labels for legacy characters anchored to deprecated ids.
  fastify.get<{ Querystring: { includeDeprecated?: string } }>(
    '/lineages',
    async (request, reply) => {
      const includeDeprecated = request.query?.includeDeprecated === 'true';
      return reply.send({ lineages: listLineages({ includeDeprecated }) });
    },
  );

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

      // Slang MOAT inputs: Ibis danger zone (refuses) + active
      // cohort phrases scoped to this character's lineage / Subtaste
      // (embrace). Both pulled here so buildAlignmentUser stays sync.
      const ibisAvoid = getSlangGuidance().avoid;
      const embracePhrases = await readEmbracePhrases({
        lineage: lineageIds[0] ?? null,
        subtasteCode: subtasteCode ?? null,
      });

      // Active trajectories. When the character is a participant in
      // any active StoryArc, pass the arcs + their current beats into
      // the prompt so goals + backstory align with where the
      // character is actually heading. Without this, goals are
      // arbitrary; with it, goals serve the trajectory.
      const arcParticipations = await prisma.arcParticipant.findMany({
        where: { characterId: character.id, arc: { status: 'active' } },
        include: { arc: true },
      });
      const activeArcs = arcParticipations.map((p) => {
        const beats = Array.isArray(p.arc.beats) ? (p.arc.beats as Array<{ title?: string; body?: string }>) : [];
        const currentIdx = p.arc.currentBeatIndex ?? 0;
        const current = beats[currentIdx];
        return {
          title: p.arc.title,
          primary: p.arc.primary,
          variant: p.arc.variant,
          temperature: p.arc.temperature,
          shadowPrimary: p.arc.shadowPrimary,
          beatIndex: currentIdx,
          totalBeats: beats.length,
          currentBeatTitle: current?.title ?? null,
          currentBeatBody: current?.body ?? null,
          role: p.role,
        };
      });

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
        ibisAvoid,
        embracePhrases,
        species: character.species ?? undefined,
        activeArcs,
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

        // Persist lineageIds whenever the realign call carried lineage
        // input. This makes lineage first-class on Character so the
        // tick prompt can read it and compose Subtaste × lineage
        // register. Applies regardless of which fields the user
        // chose to realign — lineage is identity, not field-content.
        if (lineageIds.length > 0) {
          updates.lineageIds = lineageIds as unknown as Prisma.InputJsonValue;
        }

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
