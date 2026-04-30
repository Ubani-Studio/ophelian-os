// External Oripheon API (optional - for full avatar generation)
export const ORIPHEON_API_URL =
  process.env.NEXT_PUBLIC_ORIPHEON_API_URL || 'http://localhost:3333';

// Internal LCOS API (always available - built-in character generation)
const LCOS_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5130';
const LCOS_API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'ophelian-dev-key-2026';

export type CreateCharacterPayload = {
  name: string;
  aliases?: string[];
  bio?: string;
  personaTags?: string[];
  toneAllowed?: string[];
  toneForbidden?: string[];
  systemPrompt?: string;
  currentArc?: string | null;
  timelineState?: Record<string, unknown>;
};

export const ORIPHEON_ORDERS = [
  'angel',
  'demon',
  'jinn',
  'human',
  'titan',
  'fae',
  'yokai',
  'elemental',
  'nephilim',
  'archon',
  'dragonkin',
  'construct',
  'eldritch',
  'trickster',
] as const;
export type OripheonOrderType = (typeof ORIPHEON_ORDERS)[number];

export const ORIPHEON_GENDERS = ['male', 'female', 'androgynous'] as const;
export type OripheonGender = (typeof ORIPHEON_GENDERS)[number];

export const ORIPHEON_NAME_MODES = [
  'mononym',
  'first_last',
  'first_middle_last',
  'fused_mononym',
] as const;
export type OripheonNameMode = (typeof ORIPHEON_NAME_MODES)[number];

export const ORIPHEON_TITLES = [
  // None/Abbrev
  'St.',
  // Traditional
  'Lord',
  'Lady',
  'Sir',
  'Dame',
  'Baron',
  'Baroness',
  'Count',
  'Countess',
  'Marquis',
  'Marchioness',
  'Duke',
  'Duchess',
  'Prince',
  'Princess',
  'King',
  'Queen',
  // Academic/Professional
  'Dr.',
  'Professor',
  'Magister',
  'Master',
  'Maestro',
  // Religious/Spiritual
  'Pope',
  'Seraph',
  'Cardinal',
  'Archbishop',
  'Bishop',
  'Father',
  'Mother',
  'Patriarch',
  'Matriarch',
  'Saint',
  'Reverend',
  'Prophet',
  'Sage',
  'Oracle',
  'High Priest',
  'High Priestess',
  // Military/Noble
  'Knight',
  'General',
  'Admiral',
  'Commander',
  'Captain',
  'Colonel',
  'Marshal',
  'Warden',
  // Mystical/Fantasy
  'Archon',
  'Arcanist',
  'Chronomancer',
  'Spellwright',
  'Sovereign',
  'Harbinger',
  'Phantom',
  'Shadow',
  'Voidwalker',
  'Void',
  'Starborn',
  'Lightbringer',
  'Elder',
  'Ancient',
  'Eternal',
  'Grand',
  'Supreme',
  'Prime',
  // Creative/Unique
  'The Magnificent',
  'The Terrible',
  'The Wise',
  'The Bold',
  'The Silent',
  'The Radiant',
  'The Forsaken',
  'The Undying',
  'The Starforged',
  'The Stormborn',
  'The Ashen',
  'The Unbroken',
  'The Dreamweaver',
  'The Timeworn',
  'The Nameless',
  'The Wanderer',
  'The Emberbound',
  'The Moonlit',
  'The Sun-Touched',
  'The Midnight',
  'The Hollow',
  'The Architect',
  'The Archivist',
] as const;
export type OripheonTitle = (typeof ORIPHEON_TITLES)[number];

export type OripheonHeritageCulture =
  | 'african_yoruba'
  | 'african_igbo'
  | 'arabic'
  | 'caucasian_european'
  | 'celtic'
  | 'norse_viking';

export type OripheonTarotArchetype =
  | 'fool'
  | 'magician'
  | 'high_priestess'
  | 'empress'
  | 'emperor'
  | 'hierophant'
  | 'lovers'
  | 'chariot'
  | 'strength'
  | 'hermit'
  | 'wheel_of_fortune'
  | 'justice'
  | 'hanged_man'
  | 'death'
  | 'temperance'
  | 'devil'
  | 'tower'
  | 'star'
  | 'moon'
  | 'sun'
  | 'judgement'
  | 'world';

export interface OripheonPrimaryName {
  title: string | null;
  nameMode: OripheonNameMode;
  first: string | null;
  middle: string | null;
  last: string | null;
  mononym: string | null;
}

export interface OripheonIdentity {
  primaryName: OripheonPrimaryName;
  pseudonyms: { lightSide?: string | null; darkSide?: string | null };
  gender: OripheonGender;
  nameMeaning: string;
}

export interface OripheonHeritage {
  mode: 'single' | 'mixed';
  components: Array<{ culture: OripheonHeritageCulture; weight: number }>;
}

export interface OripheonBeing {
  order: OripheonOrderType;
  office: string;
  tarotArchetype: OripheonTarotArchetype;
}

export interface OripheonAppearance {
  ageAppearance: string;
  presentation: string;
  keyFeatures: string[];
}

export interface OripheonPersonalityAxes {
  orderVsChaos: number;
  mercyVsRuthlessness: number;
  introvertVsExtrovert: number;
  faithVsDoubt: number;
}

export interface OripheonPersonality {
  summary: string;
  axes: OripheonPersonalityAxes;
  coreValues: string[];
}

export interface OripheonMythos {
  shortTitle: string;
  originStory: string;
  faction: string;
  prophecyOrCurse: string;
  signatureRitual: string;
}

export interface OripheonTasteProfile {
  music: string[];
  fashion: string[];
  indulgences: string[];
  likes: string[];
  dislikes: string[];
}

export interface OripheonAvatar {
  id: string;
  seed: number;
  identity: OripheonIdentity;
  heritage: OripheonHeritage;
  being: OripheonBeing;
  appearance: OripheonAppearance;
  personality: OripheonPersonality;
  mythos: OripheonMythos;
  tasteProfile: OripheonTasteProfile;
  createdAt: string;
}

export interface OripheonAvatarGenerationParams {
  seed?: number;
  identity?: {
    title?: string | null;
    nameMode?: OripheonNameMode;
    gender?: OripheonGender;
    lengthPreference?: 'short' | 'long';
    clashNames?: boolean;
  };
  heritage?: OripheonHeritage;
  being?: Partial<OripheonBeing>;
  needPseudonyms?: boolean;
  locks?: string[];
  prompt?: {
    personaDescription?: string;
    desiredTraits?: string[];
    desiredSkills?: string[];
    preferredNames?: string[];
    sigilBloom?: { enabled: boolean; intensity: number };
  };
}

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : `Request failed: ${response.status}`;
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function generateOripheonAvatar(
  params: OripheonAvatarGenerationParams,
  options?: { signal?: AbortSignal }
): Promise<OripheonAvatar> {
  return fetchJson<OripheonAvatar>(`${ORIPHEON_API_URL}/avatars/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal: options?.signal,
  });
}

const CULTURE_LABELS: Record<OripheonHeritageCulture, string> = {
  african_yoruba: 'Yoruba',
  african_igbo: 'Igbo',
  arabic: 'Arabic',
  caucasian_european: 'Continental European',
  celtic: 'Celtic',
  norse_viking: 'Norse',
};

function formatList(values: string[]): string {
  const cleaned = values.map((v) => v.trim()).filter(Boolean);
  if (cleaned.length === 0) return '';
  if (cleaned.length === 1) return cleaned[0]!;
  if (cleaned.length === 2) return `${cleaned[0]} and ${cleaned[1]}`;
  return `${cleaned.slice(0, -1).join(', ')}, and ${cleaned[cleaned.length - 1]}`;
}

export function formatOripheonName(primaryName: OripheonPrimaryName): string {
  if (primaryName.mononym) {
    if (primaryName.nameMode === 'fused_mononym') return primaryName.mononym.trim();
    const title = primaryName.title ? `${primaryName.title} ` : '';
    return `${title}${primaryName.mononym}`.trim();
  }
  return [
    primaryName.title,
    primaryName.first,
    primaryName.middle,
    primaryName.last,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
}

function formatHeritage(heritage: OripheonHeritage): string {
  const parts = heritage.components
    .map((c) => `${CULTURE_LABELS[c.culture] ?? c.culture}${heritage.mode === 'mixed' ? ` (${Math.round(c.weight * 100)}%)` : ''}`)
    .join(', ');
  return heritage.mode === 'mixed' ? `Mixed: ${parts}` : parts;
}

function formatTarot(archetype: OripheonTarotArchetype): string {
  return archetype.replace(/_/g, ' ');
}

export function oripheonAvatarToCreateCharacterInput(
  avatar: OripheonAvatar
): CreateCharacterPayload {
  const name = formatOripheonName(avatar.identity.primaryName) || 'Unnamed';
  const aliases = [avatar.identity.pseudonyms.lightSide, avatar.identity.pseudonyms.darkSide]
    .filter((v): v is string => Boolean(v && v.trim()))
    .map((v) => v.trim());

  const personaTags = [
    'oripheon',
    avatar.being.order,
    avatar.being.office,
    formatTarot(avatar.being.tarotArchetype),
    ...avatar.personality.coreValues,
    ...avatar.appearance.keyFeatures,
  ]
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 24);

  const heritage = formatHeritage(avatar.heritage);
  const bio = [
    avatar.mythos.shortTitle ? `${avatar.mythos.shortTitle}.` : null,
    avatar.mythos.originStory || null,
    avatar.mythos.prophecyOrCurse || null,
    avatar.mythos.signatureRitual || null,
  ]
    .filter(Boolean)
    .join('\n\n');

  const systemPrompt = [
    `You are ${name}.`,
    `Order: ${avatar.being.order} — ${avatar.being.office}. Tarot archetype: ${formatTarot(avatar.being.tarotArchetype)}.`,
    `Heritage: ${heritage}.`,
    avatar.identity.nameMeaning ? `Name meaning: ${avatar.identity.nameMeaning}` : null,
    `Appearance: ${avatar.appearance.presentation}; appears ${avatar.appearance.ageAppearance}; signature features: ${formatList(avatar.appearance.keyFeatures)}.`,
    `Personality: ${avatar.personality.summary}. Core values: ${formatList(avatar.personality.coreValues)}.`,
    `Faction: ${avatar.mythos.faction}.`,
    `Preferences: music (${formatList(avatar.tasteProfile.music)}), fashion (${formatList(avatar.tasteProfile.fashion)}), indulgences (${formatList(avatar.tasteProfile.indulgences)}).`,
    `Stay in character. Be vivid, mythic, and consistent.`,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    name,
    aliases,
    bio,
    personaTags,
    systemPrompt,
    timelineState: {
      oripheon: {
        avatarId: avatar.id,
        seed: avatar.seed,
        createdAt: avatar.createdAt,
        avatar,
      },
    },
  };
}

// ============================================================================
// Internal LCOS Oripheon Generator (built-in, always available)
// ============================================================================

export type ArchetypeSystem = 'tarot' | 'jung' | 'kabbalah' | 'orisha' | 'norse';

export interface ArchetypeInfo {
  system: ArchetypeSystem;
  archetype: string;
  meaning: string;
  coreDesire: string;
  shadowThemes: string[];
  goldenGifts: string[];
}

export interface LCOSGeneratedCharacter {
  seed: number;
  name: string;
  gender: 'masculine' | 'feminine' | 'neutral';
  heritage: string;
  /** Present when cultural mode was used. Carries the Òrò engine
   *  metadata (sacred flag, lineage thread, source, rationale). */
  cultural?: CulturalMeta;
  order: {
    name: string;
    ideology: string;
  };
  arcana: ArchetypeInfo;
  appearance: {
    build: string;
    distinctiveTrait: string;
    styleAesthetic: string;
  };
  personality: {
    axes: {
      orderChaos: number;
      mercyRuthlessness: number;
      introvertExtrovert: number;
      faithDoubt: number;
    };
    coreDesire: string;
    deepFear: string;
    voiceTone: string;
  };
  backstory: string;
  relics?: Relic[];  // Strange objects bound to the character (relic mode)
  pseudonym?: string;  // Short evocative name for relic objects
  samplePost?: string;  // Sample social media post (modern relics only)
  sacredNumber?: number;  // Archetype-specific symbolic number
  subtaste?: SubtasteDesignation;  // Subtaste classification
  subdominantArcana?: Array<{
    arcana: ArchetypeInfo;
    subtaste: SubtasteDesignation;
  }>;
  approximateMBTI?: string;  // Display-only MBTI derivation from personality axes
}

export type CreativePhase = 'genesis' | 'vision' | 'refinement' | 'manifestation' | 'flow';

export interface SubtasteDesignation {
  code: string;
  glyph: string;
  label: string;
  description: string;
  phase: CreativePhase;
}

export interface Relic {
  object: string;
  category: 'natural' | 'furniture' | 'fashion' | 'strange' | 'mundane_twisted' | 'symbolic' | 'stolen_from_beings' | 'tools' | 'vessels';
  origin: string;
}

export type RelicEra = 'archaic' | 'modern' | 'timeless';

export interface LCOSGenerateOptions {
  seed?: number;
  heritage?: string;
  gender?: string;
  blendHeritage?: boolean;  // When true, blends multiple heritages without showing explicit heritage label
  mononym?: boolean;        // When true, generates only a single name (first name or blended name)
  mononymType?: 'squishe' | 'simple' | 'aminal-blend' | 'aminal-clear';  // squishe = blended name, simple = first name only, aminal = with animal/beast
  relic?: boolean;          // When true, generates strange relic objects bound to the character
  relicEra?: RelicEra;      // 'archaic' for ancient objects, 'modern' for contemporary
  lockedRelic?: Relic;      // When provided, keeps this relic but regenerates the pseudonym
  core?: string;  // Aesthetic symbol adornments (drowned_mall, hex_garden, sugar_rot, dead_channel, spore_drift, wrong_room, bone_clean, lambda, or legacy names)
  variance?: number;  // 0-100 glitch distortion percentage

  // Cultural mode: routes the name through @violet-sphinx/names — the
  // diasporic / decolonial engine. Bóveda still owns backstory,
  // arcana, relics, personality. Only the name surface changes.
  cultural?: boolean;
  culturalCultures?: string[];  // ['yoruba', 'vodou', 'akan', ...]
  culturalMode?: 'real' | 'fictional' | 'mythic' | 'archetype' | 'internet';
  culturalForm?: 'mononym' | 'first' | 'surname' | 'first_surname' | 'full_with_epithet';
  culturalGender?: 'm' | 'f' | 'a';
  culturalArchetype?: string;
  culturalOrnament?: 0 | 0.5 | 1;
  culturalWithTitle?: boolean;
  culturalSurnameRegister?: 'auto' | 'colonial' | 'reclaimed' | 'compound';
  culturalSurnameCulture?: string;
}

// Cultural metadata returned alongside the LCOS character when
// cultural mode is on. Mirrors the @violet-sphinx/names result shape.
export interface CulturalMeta {
  cultureId: string;
  region: string;
  era: string;
  source: 'real' | 'markov' | 'starter_pool' | 'internet' | 'mythic';
  sacred?: boolean;
  lineage?: {
    threadId: string;
    rootMeaning: string;
    otherShores: Array<{ culture: string; name: string }>;
  };
  rationale?: string;
}

export interface OroCultureSummary {
  id: string;
  label: string;
  region: string;
}

export async function listOroCultures(
  fetchOptions?: { signal?: AbortSignal }
): Promise<{ cultures: OroCultureSummary[] }> {
  return fetchJson<{ cultures: OroCultureSummary[] }>(
    `${LCOS_API_URL}/characters/oro-cultures`,
    {
      headers: { 'x-api-key': LCOS_API_KEY },
      signal: fetchOptions?.signal,
    }
  );
}

export async function generateLCOSCharacter(
  options?: LCOSGenerateOptions,
  fetchOptions?: { signal?: AbortSignal }
): Promise<LCOSGeneratedCharacter> {
  return fetchJson<LCOSGeneratedCharacter>(`${LCOS_API_URL}/characters/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': LCOS_API_KEY,
    },
    body: JSON.stringify({
      seed: options?.seed,
      heritage: options?.heritage,
      gender: options?.gender,
      blendHeritage: options?.blendHeritage,
      mononym: options?.mononym,
      mononymType: options?.mononymType,
      relic: options?.relic,
      relicEra: options?.relicEra,
      lockedRelic: options?.lockedRelic,
      core: options?.core,
      variance: options?.variance,
      cultural: options?.cultural,
      culturalCultures: options?.culturalCultures,
      culturalMode: options?.culturalMode,
      culturalForm: options?.culturalForm,
      culturalGender: options?.culturalGender,
      culturalArchetype: options?.culturalArchetype,
      culturalOrnament: options?.culturalOrnament,
      culturalWithTitle: options?.culturalWithTitle,
      culturalSurnameRegister: options?.culturalSurnameRegister,
      culturalSurnameCulture: options?.culturalSurnameCulture,
    }),
    signal: fetchOptions?.signal,
  });
}

export function lcosGeneratedToCreateCharacterInput(
  generated: LCOSGeneratedCharacter
): CreateCharacterPayload {
  const aliases = generated.arcana.goldenGifts.slice(0, 2);

  const personaTags = [
    'oripheon',
    generated.heritage,
    generated.order.name,
    generated.arcana.archetype,
    generated.personality.voiceTone,
    generated.appearance.styleAesthetic,
  ]
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12);

  const bio = [
    generated.backstory,
    `\n\n**Order**: ${generated.order.name} — ${generated.order.ideology}`,
    `**Arcana**: ${generated.arcana.archetype}`,
    `**Shadow Themes**: ${generated.arcana.shadowThemes.join(', ')}`,
    `**Golden Gifts**: ${generated.arcana.goldenGifts.join(', ')}`,
  ].join('\n');

  const systemPrompt = [
    `You are ${generated.name}.`,
    `Gender: ${generated.gender}. Heritage: ${generated.heritage}.`,
    `Order: ${generated.order.name} — ${generated.order.ideology}.`,
    `Tarot Archetype: ${generated.arcana.archetype}.`,
    `Appearance: ${generated.appearance.build}, with ${generated.appearance.distinctiveTrait}. Style: ${generated.appearance.styleAesthetic}.`,
    `Voice Tone: ${generated.personality.voiceTone}.`,
    `Core Desire: ${generated.personality.coreDesire}.`,
    `Deep Fear: ${generated.personality.deepFear}.`,
    `Shadow Themes: ${generated.arcana.shadowThemes.join(', ')}.`,
    `Golden Gifts: ${generated.arcana.goldenGifts.join(', ')}.`,
    `Stay in character. Be vivid, mythic, and consistent.`,
  ].join('\n');

  return {
    name: generated.name,
    aliases,
    bio,
    personaTags,
    systemPrompt,
    timelineState: {
      oripheon: {
        seed: generated.seed,
        generated,
        ...(generated.subtaste ? { subtaste: generated.subtaste } : {}),
      },
    },
  };
}
