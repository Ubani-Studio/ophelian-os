const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5130';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'ophelian-dev-key-2026';

interface FetchOptions extends RequestInit {
  body?: string | FormData;
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `API error: ${response.status}`);
  }

  return response.json();
}

// Character APIs
export interface CharacterPosition {
  characterId: string;
  x: number;
  y: number;
}

export interface Character {
  id: string;
  name: string;
  aliases: string[];
  bio: string;
  /** Deeper context. Used by the tick LLM as background; never
   *  displayed in card surfaces, never quoted by the character.
   *  Edit via the Backstory section on the character detail page. */
  backstory?: string;
  /** Free-text name of the artist whose register voices this
   *  character. Pre-LoRA bridge to per-character voice. */
  authoredBy?: string | null;
  /** Few-shot voice samples (3-8 short paragraphs). Tick prompt
   *  leads with these so generation matches the authoring artist's
   *  cadence rather than the substrate model's default. */
  voiceSamples?: string[];
  /** How this character speaks: language + dialect + accent +
   *  idioms. Without it characters converge on standard English.
   *  Tick prompt injects an explicit ## Tongue block. */
  tongue?: {
    primaryLanguage?: string;
    /** Languages this character drops into mid-sentence. Lineage-anchored. */
    codeSwitchesTo?: string[];
    dialect?: string;
    accent?: string;
    idioms?: string[];
    /** Native poetic shape the character moves through (oríkì, ghazal,
     *  jueju, doha, freestyle, koan, etc.). Drives lineage-specific
     *  cadence beyond just word-choice. */
    poeticForm?: string;
    /** One-line note on how the setting modulates the form (modern
     *  lens, past-life lens, mythic lens). */
    formNote?: string;
    registerNotes?: string;
  };
  avatarUrl: string | null;
  avatarPosition: string;
  personaTags: string[];
  toneAllowed: string[];
  toneForbidden: string[];
  systemPrompt: string;
  currentArc: string | null;
  timelineState: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  position?: CharacterPosition | null;
  /** Ikenga persona link (Ikenga). When set, the character is bound
   *  to a real-life face cluster in Ikenga and federates photos +
   *  brief from there. */
  tizitaPersonaId?: string | null;
  /** Representative photo URL fetched from Ikenga on list responses
   *  for tizitaPersonaId-bound characters. Used by card avatars
   *  when the character has no explicit avatarUrl set. */
  tizitaRepresentativeUrl?: string | null;
  /** LoRA references attached to this character. Each entry is a
   *  structured record with category (visual / voice / writing /
   *  music / motion / style) so downstream surfaces pick the right
   *  adapter. */
  loras?: Array<{
    id: string;
    name?: string;
    category?: string;
    source?: string;
    trigger?: string;
    weight?: number;
    baseModel?: string;
    trainedFromPersonaId?: string;
    thumbnailUrl?: string;
  }>;
  worldId?: string | null;
  /** Lightweight group / collective members. Populated when this
   *  character is a group (band, council, ensemble). Each entry is
   *  { name, role?, characterId? } — full Character records are not
   *  required, just names. */
  groupMembers?: Array<{ name: string; role?: string; characterId?: string }>;
  /** Composition kind: solo (default) hides the members panel
   *  entirely. duo / group / collective surface it. */
  compositionKind?: 'solo' | 'duo' | 'group' | 'collective';
  /** Setting register: biases bio + backstory generation toward
   *  a specific kind of texture (modern / mystical / archaic /
   *  past_life / mythic / surreal / mixed). */
  setting?: Setting;
  /** Free-text gender. Affects tick prompt grammar / cadence. */
  gender?: string | null;
  /** Free-text pronouns ("she/her", "they/them", "ó/ó", etc.). */
  pronouns?: string | null;
  /** Species (lwa, orisha, ancestor, saint, etc.). Drives the
   *  species-native action vocabulary in the tick prompt so the
   *  character does spirit-things, not human-things. */
  species?: SpeciesId;
  /** Lineage anchors. Persisted at forge / realign apply time.
   *  Drives Subtaste × lineage register composition in tick + realign. */
  lineageIds?: string[];
  /** Agency mode. Determines how this character acts in the system.
   *  manual = author-only (the human user); twin = paired AI version
   *  (Ai-8O is twin to Ubani); espíritu = fully autonomous; relic =
   *  frozen, will silent. */
  mode?: 'manual' | 'twin' | 'espíritu' | 'relic';
  /** When mode='twin', the Character.id of the manual character this
   *  twin is paired with. */
  twinOf?: string | null;
  /** Goals + perimeter for autonomous entities. */
  agencyScope?: {
    goals?: string[];
    cubes?: string[];
    canInitiateWith?: string[];
    canPublishTo?: string[];
    rollbackEnabled?: boolean;
  };
  goals?: string[];
  /** Self anchor — exactly one Character should be true (Ubani). */
  isUser?: boolean;
  /** Identity envelope: locked fields, source provenance, sovereignty
   *  level. See docs/identity-lock-and-starforge.md and
   *  docs/sovereignty.md. */
  identity?: {
    locked?: string[];
    pinned?: Record<string, string | undefined>;
    source?: 'sandbox' | 'starforge_nommo' | 'tizita_persona' | 'authored';
    realIdentityRef?: { starforgeUserId?: string; email?: string };
    sovereignty?: {
      level?: 0 | 1 | 2;
      base_model?: string;
      inference_path?: string;
      lora_pins?: Array<{
        lora_id: string;
        contributor_id?: string;
        weight?: number;
        role?: string;
      }>;
      refuses?: string[];
    };
  };
  /** Last time the user (isUser=true) opened the morning trail. */
  lastSeenAt?: string | null;
  /** Lightweight presence cue computed server-side from the most
   *  recent MemoryEpisode timestamp. Used by Trail + character page
   *  to render an online dot, "active 4m ago", and current location. */
  presence?: {
    status: 'online' | 'idle' | 'away' | 'dormant';
    lastActivityAt: string | null;
    lastActivityKind: string | null;
    currentLocation: string | null;
  };
  /** Surprise mechanics, see NuancePanel + tick.ts. */
  preoccupations?: string[];
  tensions?: { beliefA: string; beliefB: string; note?: string }[];
  fixations?: string[];
  modernity?: {
    anchorEra?: string;
    contemporaryBleed?: number;
    contemporarySlang?: string[];
    contemporaryRefs?: string[];
    refusedSlang?: string[];
  };
  currentLocation?: string | null;
  homeBase?: string | null;
}

export async function getCharacters(): Promise<Character[]> {
  return apiFetch<Character[]>('/characters');
}

export async function getCharacter(id: string): Promise<Character> {
  return apiFetch<Character>(`/characters/${id}`);
}

export async function createCharacter(data: Partial<Character>): Promise<Character> {
  return apiFetch<Character>('/characters', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Mirror identity fields from a source character onto a target.
 *  Used for twin / clone creation: target inherits bio, backstory,
 *  personaTags, voiceSamples, authoredBy, identity envelope,
 *  timelineState (Subtaste), and gets twinOf set to source.id.
 *  Optionally forces mode (default 'twin'). */
export async function mirrorCharacterFrom(
  targetId: string,
  sourceId: string,
  opts?: { mode?: string; forceMode?: boolean }
): Promise<Character> {
  return apiFetch<Character>(`/characters/${targetId}/mirror-from/${sourceId}`, {
    method: 'POST',
    body: JSON.stringify(opts ?? {}),
  });
}

export interface ComposedSubtastePreview {
  composed: {
    code: string;
    glyph: string;
    label: string;
    secondaryCode?: string;
    secondaryGlyph?: string;
    secondaryLabel?: string;
    shadowCode?: string;
    shadowGlyph?: string;
    shadowLabel?: string;
    composedFrom: Array<{ characterId: string; name: string; code: string; secondaryCode?: string }>;
    reason: 'majority' | 'tension' | 'singleton';
  };
  applied: boolean;
}

/** Compose Subtaste for a group character from its members. Pass
 *  apply=true to persist; default returns a preview only. */
export async function composeGroupSubtaste(
  characterId: string,
  apply: boolean = false
): Promise<ComposedSubtastePreview> {
  return apiFetch<ComposedSubtastePreview>(`/characters/${characterId}/compose-subtaste`, {
    method: 'POST',
    body: JSON.stringify({ apply }),
  });
}

/** Two-call helper: create a fresh character, then mirror its
 *  identity from the source. Result is a twin sharing Subtaste +
 *  lineage + voice samples but with its own name (and optional
 *  custom bio override applied after mirroring). */
export async function createTwin(
  sourceId: string,
  data: { name: string; mode?: 'twin' | 'espíritu' | 'manual'; bioOverride?: string; worldId?: string | null }
): Promise<Character> {
  const created = await createCharacter({
    name: data.name,
    mode: data.mode ?? 'twin',
    worldId: data.worldId ?? null,
  });
  const mirrored = await mirrorCharacterFrom(created.id, sourceId, {
    mode: data.mode ?? 'twin',
    forceMode: true,
  });
  if (data.bioOverride && data.bioOverride.trim().length > 0) {
    return updateCharacter(mirrored.id, { bio: data.bioOverride });
  }
  return mirrored;
}

export async function updateCharacter(id: string, data: Partial<Character>): Promise<Character> {
  return apiFetch<Character>(`/characters/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export type SpeciesId =
  | 'espíritu'
  | 'lwa'
  | 'orisha'
  | 'iwà'
  | 'ancestor'
  | 'saint'
  | 'brave-mort'
  | 'egún'
  | 'misa-spirit'
  | 'trickster';

/** Manually set Subtaste dominant + subdominant + shadow for a
 *  non-user character. Refused for isUser=true (use the Starforge
 *  import to update Ubani's Subtaste from Nommo). Pass shadowCode
 *  as undefined to auto-suggest from Wu Xing; null to clear. */
export async function setSubtaste(
  characterId: string,
  primaryCode: string,
  secondaryCode?: string | null,
  shadowCode?: string | null
): Promise<{ ok: boolean; subtaste: Record<string, unknown> }> {
  return apiFetch(`/characters/${characterId}/subtaste`, {
    method: 'PATCH',
    body: JSON.stringify({
      primaryCode,
      secondaryCode: secondaryCode ?? null,
      ...(shadowCode !== undefined ? { shadowCode } : {}),
    }),
  });
}

/** Generate a draft backstory using bio + Subtaste + voice samples
 *  + authoredBy. Returns the draft text; the user reviews and saves
 *  separately via updateCharacter({ backstory }). */
export async function generateBackstoryDraft(
  characterId: string
): Promise<{ draft: string; source: 'anthropic' | 'stub' }> {
  return apiFetch<{ draft: string; source: 'anthropic' | 'stub' }>(
    `/characters/${characterId}/generate-backstory`,
    { method: 'POST', body: JSON.stringify({}) }
  );
}

// =============================================================================
// Cohort phrases (slang MOAT)
// =============================================================================

export type CohortPhraseStatus = 'proposed' | 'active' | 'promoted' | 'revoked';

export interface CohortPhrase {
  id: string;
  phrase: string;
  sourceCharacterId: string | null;
  lineage: string | null;
  subtasteCode: string | null;
  sourceQuote: string | null;
  gloss: string | null;
  status: CohortPhraseStatus;
  useCount: number;
  createdAt: string;
  updatedAt: string;
}

export async function listCohortPhrases(characterId: string): Promise<{ phrases: CohortPhrase[] }> {
  return apiFetch<{ phrases: CohortPhrase[] }>(`/characters/${characterId}/cohort-phrases`);
}

export async function extractCohortPhrases(
  characterId: string
): Promise<{ extracted: number; phrases: CohortPhrase[]; reason: 'ok' | 'llm-unavailable' | 'no-samples' | 'none-found' }> {
  return apiFetch(`/characters/${characterId}/cohort-phrases/extract`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function updateCohortPhrase(
  phraseId: string,
  patch: { status?: CohortPhraseStatus; gloss?: string }
): Promise<CohortPhrase> {
  return apiFetch<CohortPhrase>(`/characters/cohort-phrases/${phraseId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

// =============================================================================
// Aligned generator (lineage + Subtaste + brief → coherent fields)
// =============================================================================

export interface LineageOption {
  id: string;
  label: string;
  region: string;
  advisorGated: boolean;
  /** Soft-deprecated: hidden from the picker by default. Norse,
   *  Celtic, Greek currently. Their forms remain reachable as
   *  compositional influences within other lineages. */
  deprecated?: boolean;
  /** Optional remap suggestion shown when an existing character is
   *  anchored to a deprecated lineage. */
  remapSuggestion?: string;
}

export type RealignField = 'bio' | 'backstory' | 'aliases' | 'personaTags' | 'goals' | 'tongue';

export interface RealignDraft {
  bio?: string;
  backstory?: string;
  aliases?: string[];
  personaTags?: string[];
  goals?: string[];
  tongue?: {
    primaryLanguage?: string;
    dialect?: string;
    accent?: string;
    idioms?: string[];
    registerNotes?: string;
  };
}

export async function listLineages(): Promise<LineageOption[]> {
  const res = await apiFetch<{ lineages: LineageOption[] }>(`/lineages`);
  return res.lineages;
}

export type Setting =
  | 'modern'
  | 'mystical'
  | 'archaic'
  | 'past_life'
  | 'mythic'
  | 'surreal'
  | 'mixed';

export async function realignCharacter(
  characterId: string,
  options: {
    /** Single lineage id or array of ids (multi-blend). */
    lineage?: string | string[];
    brief?: string;
    subtasteCode?: string;
    /** Setting register that biases the texture-example pool. */
    setting?: Setting;
    fields: RealignField[];
    apply?: boolean;
    respectLocks?: boolean;
  }
): Promise<{ draft: RealignDraft; applied: boolean; skipped?: string[] }> {
  return apiFetch(`/characters/${characterId}/realign`, {
    method: 'POST',
    body: JSON.stringify(options),
  });
}

export async function deleteCharacter(id: string): Promise<void> {
  await fetch(`${API_URL}/characters/${id}`, {
    method: 'DELETE',
    headers: {
      'x-api-key': API_KEY,
    },
  }).then((res) => {
    if (!res.ok) {
      throw new Error('Failed to delete character');
    }
  });
}

// Generated character from Oripheon engine
export interface GeneratedCharacter {
  seed: number;
  name: string;
  gender: 'masculine' | 'feminine' | 'neutral';
  heritage: string;
  order: {
    name: string;
    ideology: string;
  };
  arcana: {
    archetype: string;
    shadowThemes: string[];
    goldenGifts: string[];
  };
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
}

export interface GenerateCharacterOptions {
  seed?: number;
  heritage?: string;
  gender?: string;
}

export async function generateRandomCharacter(options?: GenerateCharacterOptions): Promise<GeneratedCharacter> {
  return apiFetch<GeneratedCharacter>('/characters/generate', {
    method: 'POST',
    body: JSON.stringify(options || {}),
  });
}

// Oripheon Sync APIs
export async function syncOripheonData(characterId: string): Promise<Character> {
  return apiFetch<Character>(`/characters/${characterId}/sync-oripheon`, { method: 'POST', body: JSON.stringify({}) });
}

export async function syncAllOripheonData(): Promise<{ synced: number; results: Array<{ id: string; name: string; status: string }> }> {
  return apiFetch<{ synced: number; results: Array<{ id: string; name: string; status: string }> }>('/characters/sync-oripheon-all', { method: 'POST', body: JSON.stringify({}) });
}

// Content APIs
export interface ContentItem {
  id: string;
  characterId: string;
  platform: 'X' | 'TIKTOK' | 'INSTAGRAM';
  contentType: 'POST' | 'SCRIPT';
  text: string;
  status: 'DRAFT' | 'APPROVED' | 'PUBLISHED' | 'FAILED';
  scheduledFor: string | null;
  publishedUrl: string | null;
  meta: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export async function getContent(): Promise<ContentItem[]> {
  return apiFetch<ContentItem[]>('/content');
}

export async function generateContent(
  characterId: string,
  platform: string,
  intent: string
): Promise<ContentItem> {
  return apiFetch<ContentItem>('/content/generate', {
    method: 'POST',
    body: JSON.stringify({ characterId, platform, intent }),
  });
}

export async function approveContent(id: string): Promise<ContentItem> {
  return apiFetch<ContentItem>(`/content/${id}/approve`, {
    method: 'POST',
  });
}

export async function publishContent(id: string): Promise<ContentItem> {
  return apiFetch<ContentItem>(`/content/${id}/publish`, {
    method: 'POST',
  });
}

export interface AudioResult {
  contentItemId: string;
  audioFilePath: string;
  durationSeconds: number;
  provider: string;
}

export async function generateAudio(contentId: string): Promise<AudioResult> {
  return apiFetch<AudioResult>(`/content/${contentId}/audio`, {
    method: 'POST',
  });
}

// Ledger APIs
export interface OwnerSettlement {
  ownerId: string;
  totalRevenueCents: number;
  voiceActorShareCents: number;
  creatorShareCents: number;
  platformShareCents: number;
  eventCount: number;
  events: {
    eventId: string;
    eventType: string;
    revenueCents: number;
    timestamp: string;
  }[];
}

export interface MonthlySettlement {
  month: string;
  generatedAt: string;
  owners: OwnerSettlement[];
  totals: {
    totalRevenueCents: number;
    totalVoiceActorShareCents: number;
    totalCreatorShareCents: number;
    totalPlatformShareCents: number;
    totalEventCount: number;
  };
}

export async function getSettlement(month: string): Promise<MonthlySettlement> {
  return apiFetch<MonthlySettlement>(`/ledger/settlement?month=${month}`);
}

// Relationship APIs
export type RelationshipType = 'ALLY' | 'ENEMY' | 'MENTOR' | 'FAMILY' | 'RIVAL' | 'FRIEND' | 'LOVER' | 'CUSTOM';

export interface CharacterRelationship {
  id: string;
  sourceCharacterId: string;
  targetCharacterId: string;
  relationshipType: RelationshipType;
  customTypeName: string | null;
  sourceRole: string | null;
  targetRole: string | null;
  lore: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRelationshipInput {
  sourceCharacterId: string;
  targetCharacterId: string;
  relationshipType?: RelationshipType;
  customTypeName?: string | null;
  sourceRole?: string | null;
  targetRole?: string | null;
  lore?: string;
}

export interface UpdateRelationshipInput {
  relationshipType?: RelationshipType;
  customTypeName?: string | null;
  sourceRole?: string | null;
  targetRole?: string | null;
  lore?: string;
}

export async function getRelationships(characterId?: string): Promise<CharacterRelationship[]> {
  const query = characterId ? `?characterId=${characterId}` : '';
  return apiFetch<CharacterRelationship[]>(`/relationships${query}`);
}

export async function getRelationship(id: string): Promise<CharacterRelationship> {
  return apiFetch<CharacterRelationship>(`/relationships/${id}`);
}

export async function createRelationship(data: CreateRelationshipInput): Promise<CharacterRelationship> {
  return apiFetch<CharacterRelationship>('/relationships', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRelationship(id: string, data: UpdateRelationshipInput): Promise<CharacterRelationship> {
  return apiFetch<CharacterRelationship>(`/relationships/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteRelationship(id: string): Promise<void> {
  await fetch(`${API_URL}/relationships/${id}`, {
    method: 'DELETE',
    headers: {
      'x-api-key': API_KEY,
    },
  }).then((res) => {
    if (!res.ok) {
      throw new Error('Failed to delete relationship');
    }
  });
}

export interface GenerateLoreInput {
  sourceCharacterId: string;
  targetCharacterId: string;
  relationshipType?: RelationshipType;
  randomizeType?: boolean;
}

export interface GeneratedLore {
  relationshipType: RelationshipType;
  lore: string;
  sourceRole: string | null;
  targetRole: string | null;
}

export async function generateRelationshipLore(data: GenerateLoreInput): Promise<GeneratedLore> {
  return apiFetch<GeneratedLore>('/relationships/generate-lore', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Position APIs
export interface CharacterPosition {
  id: string;
  characterId: string;
  x: number;
  y: number;
}

export async function getPositions(): Promise<CharacterPosition[]> {
  return apiFetch<CharacterPosition[]>('/positions');
}

export async function getPosition(characterId: string): Promise<CharacterPosition> {
  return apiFetch<CharacterPosition>(`/positions/${characterId}`);
}

export async function updatePosition(characterId: string, x: number, y: number): Promise<CharacterPosition> {
  return apiFetch<CharacterPosition>(`/positions/${characterId}`, {
    method: 'PUT',
    body: JSON.stringify({ x, y }),
  });
}

export async function updatePositionsBatch(
  positions: Array<{ characterId: string; x: number; y: number }>
): Promise<CharacterPosition[]> {
  return apiFetch<CharacterPosition[]>('/positions/batch', {
    method: 'PUT',
    body: JSON.stringify(positions),
  });
}

// Scene APIs
export interface Scene {
  id: string;
  name: string;
  description: string | null;
  type: 'location' | 'event';
  imageUrl: string | null;
  tags: string[];
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  position?: ScenePosition | null;
}

export interface ScenePosition {
  id: string;
  sceneId: string;
  x: number;
  y: number;
}

export interface CreateSceneInput {
  name: string;
  description?: string;
  type?: 'location' | 'event';
  imageUrl?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateSceneInput {
  name?: string;
  description?: string | null;
  type?: 'location' | 'event';
  imageUrl?: string | null;
  tags?: string[];
  metadata?: Record<string, unknown> | null;
}

export async function getScenes(): Promise<Scene[]> {
  return apiFetch<Scene[]>('/scenes');
}

export async function getScene(id: string): Promise<Scene> {
  return apiFetch<Scene>(`/scenes/${id}`);
}

export async function createScene(data: CreateSceneInput): Promise<Scene> {
  return apiFetch<Scene>('/scenes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateScene(id: string, data: UpdateSceneInput): Promise<Scene> {
  return apiFetch<Scene>(`/scenes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteScene(id: string): Promise<void> {
  await fetch(`${API_URL}/scenes/${id}`, {
    method: 'DELETE',
    headers: {
      'x-api-key': API_KEY,
    },
  }).then((res) => {
    if (!res.ok) {
      throw new Error('Failed to delete scene');
    }
  });
}

export async function updateScenePosition(sceneId: string, x: number, y: number): Promise<ScenePosition> {
  return apiFetch<ScenePosition>(`/scenes/${sceneId}/position`, {
    method: 'PUT',
    body: JSON.stringify({ x, y }),
  });
}

// World APIs
export interface World {
  id: string;
  name: string;
  description: string | null;
  type: 'setting' | 'story';
  imageUrl: string | null;
  tags: string[];
  metadata: Record<string, unknown> | null;
  /** Pinned narrative trajectory id (decolonial 10) or null. */
  trajectoryId?: string | null;
  /** Optional variant pin within the primary trajectory. */
  trajectoryVariant?: string | null;
  createdAt: string;
  updatedAt: string;
  position?: WorldPosition | null;
}

export interface WorldPosition {
  id: string;
  worldId: string;
  x: number;
  y: number;
}

export interface CreateWorldInput {
  name: string;
  description?: string;
  type?: 'setting' | 'story';
  imageUrl?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateWorldInput {
  name?: string;
  description?: string | null;
  type?: 'setting' | 'story';
  imageUrl?: string | null;
  tags?: string[];
  metadata?: Record<string, unknown> | null;
  trajectoryId?: string | null;
  trajectoryVariant?: string | null;
}

export async function getWorlds(): Promise<World[]> {
  return apiFetch<World[]>('/worlds');
}

export async function getWorld(id: string): Promise<World> {
  return apiFetch<World>(`/worlds/${id}`);
}

export async function createWorld(data: CreateWorldInput): Promise<World> {
  return apiFetch<World>('/worlds', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateWorld(id: string, data: UpdateWorldInput): Promise<World> {
  return apiFetch<World>(`/worlds/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteWorld(id: string): Promise<void> {
  await fetch(`${API_URL}/worlds/${id}`, {
    method: 'DELETE',
    headers: {
      'x-api-key': API_KEY,
    },
  }).then((res) => {
    if (!res.ok) {
      throw new Error('Failed to delete world');
    }
  });
}

export async function updateWorldPosition(worldId: string, x: number, y: number): Promise<WorldPosition> {
  return apiFetch<WorldPosition>(`/worlds/${worldId}/position`, {
    method: 'PUT',
    body: JSON.stringify({ x, y }),
  });
}

// World Connection APIs
export type EntityType = 'CHARACTER' | 'SCENE' | 'WORLD';

export interface WorldConnection {
  id: string;
  sourceType: EntityType;
  sourceId: string;
  targetType: EntityType;
  targetId: string;
  connectionType: string;
  lore: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConnectionInput {
  sourceType: EntityType;
  sourceId: string;
  targetType: EntityType;
  targetId: string;
  connectionType: string;
  lore?: string;
}

export interface UpdateConnectionInput {
  connectionType?: string;
  lore?: string;
}

export async function getConnections(entityType?: EntityType, entityId?: string): Promise<WorldConnection[]> {
  const query = entityType && entityId ? `?entityType=${entityType}&entityId=${entityId}` : '';
  return apiFetch<WorldConnection[]>(`/connections${query}`);
}

export async function getConnection(id: string): Promise<WorldConnection> {
  return apiFetch<WorldConnection>(`/connections/${id}`);
}

export async function createConnection(data: CreateConnectionInput): Promise<WorldConnection> {
  return apiFetch<WorldConnection>('/connections', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateConnection(id: string, data: UpdateConnectionInput): Promise<WorldConnection> {
  return apiFetch<WorldConnection>(`/connections/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteConnection(id: string): Promise<void> {
  await fetch(`${API_URL}/connections/${id}`, {
    method: 'DELETE',
    headers: {
      'x-api-key': API_KEY,
    },
  }).then((res) => {
    if (!res.ok) {
      throw new Error('Failed to delete connection');
    }
  });
}

// Nexus Snapshots
export interface NexusSnapshot {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSnapshotInput {
  name: string;
  description?: string;
}

export async function getSnapshots(): Promise<NexusSnapshot[]> {
  return apiFetch<NexusSnapshot[]>('/snapshots');
}

export async function getSnapshot(id: string): Promise<NexusSnapshot> {
  return apiFetch<NexusSnapshot>(`/snapshots/${id}`);
}

export async function createSnapshot(data: CreateSnapshotInput): Promise<NexusSnapshot> {
  return apiFetch<NexusSnapshot>('/snapshots', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function restoreSnapshot(id: string): Promise<void> {
  await apiFetch(`/snapshots/${id}/restore`, {
    method: 'POST',
  });
}

export async function updateSnapshot(id: string, data: Partial<CreateSnapshotInput>): Promise<NexusSnapshot> {
  return apiFetch<NexusSnapshot>(`/snapshots/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteSnapshot(id: string): Promise<void> {
  await fetch(`${API_URL}/snapshots/${id}`, {
    method: 'DELETE',
    headers: {
      'x-api-key': API_KEY,
    },
  }).then((res) => {
    if (!res.ok) {
      throw new Error('Failed to delete snapshot');
    }
  });
}


// =====================================================================
// Training corpus (Layer 1: Ibis author corpus)
// =====================================================================

export interface CorpusStatus {
  characterId: string;
  name: string;
  authoredBy: string | null;
  layer1: { source: string; sampleCount: number; lastUpdated: string };
  layer2_collaborators: { sampleCount: number; status: string };
  layer3_character_corpus: { sampleCount: number; status: string };
}

export interface CorpusSample {
  ibisDocumentId: string;
  title: string;
  text: string;
  wordCount: number;
  updatedAt?: string;
  kind?: string | null;
}

export interface CorpusRefreshResult {
  characterId: string;
  written?: number;
  wouldWrite?: number;
  dryRun?: boolean;
  ibisResult: {
    source: string;
    storePath: string;
    totalDocsScanned: number;
    matchedDocs: number;
    samplesReturned: CorpusSample[];
    warnings: string[];
  };
}

export interface CorpusRefreshInput {
  authorIbisUserId?: string;
  tagIds?: string[];
  titleContains?: string;
  maxSamples?: number;
  minWordCount?: number;
  replace?: boolean;
  dryRun?: boolean;
}

export async function getCorpusStatus(characterId: string): Promise<CorpusStatus> {
  return apiFetch<CorpusStatus>(`/characters/${characterId}/corpus`);
}

export async function refreshCorpus(
  characterId: string,
  input: CorpusRefreshInput = {},
): Promise<CorpusRefreshResult> {
  return apiFetch<CorpusRefreshResult>(`/characters/${characterId}/corpus/refresh`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}


// =====================================================================
// Vaulted (RightsLayer) bridge
// =====================================================================

export interface VaultedStatusRow {
  id: string;
  name: string;
  vaultedArtifactId: string | null;
  vaultedStatus: 'not_registered' | 'pending_registration' | 'registered' | 'listed' | 'licensed' | 'error' | string;
  vaultedRegisteredAt: string | null;
  vaultedLastSyncedAt: string | null;
  vaultedLastError: string | null;
}

export interface VaultedRegisterInput {
  weightsStorageUri: string;
  weightsSha256: string;
  artifactKind?: 'style' | 'character' | 'persona';
  baseModel?: string;
  rank?: number;
  trainingSteps?: number;
  triggerWord?: string;
  rightsAssertion?: string;
}

export async function getVaultedStatus(characterId: string): Promise<VaultedStatusRow> {
  return apiFetch<VaultedStatusRow>(`/characters/${characterId}/vaulted`);
}

export async function registerVaultedArtifact(
  characterId: string,
  input: VaultedRegisterInput,
): Promise<unknown> {
  return apiFetch(`/characters/${characterId}/vaulted/register`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function syncVaultedStatus(characterId: string): Promise<unknown> {
  return apiFetch(`/characters/${characterId}/vaulted/sync`, { method: 'POST' });
}


// =====================================================================
// Memory: Layer 4 episodic + Layer 2 canonical lore
// =====================================================================

export interface MemoryEpisode {
  id: string;
  characterId: string;
  kind: string;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  expiresAt: string;
  promotedToCanonId: string | null;
}

export interface CanonEntry {
  id: string;
  characterId: string;
  title: string;
  body: string;
  occurredAt: string | null;
  tags: string[];
  scope: string;
  sourceEpisodeId: string | null;
  attestationId: string | null;
  signedBy: string | null;
  signedAt: string;
  retractedAt: string | null;
  retractionReason: string | null;
  createdAt: string;
}

export async function listEpisodes(characterId: string, kind?: string): Promise<{ episodes: MemoryEpisode[]; count: number }> {
  const q = kind ? `?kind=${encodeURIComponent(kind)}` : '';
  return apiFetch(`/characters/${characterId}/memory/episodes${q}`);
}

export async function writeEpisode(
  characterId: string,
  input: { kind: string; content: string; metadata?: Record<string, unknown>; retentionDays?: number },
): Promise<{ episode: MemoryEpisode }> {
  return apiFetch(`/characters/${characterId}/memory/episodes`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function listCanon(
  characterId: string,
  opts: { scope?: string; includeRetracted?: boolean } = {},
): Promise<{ entries: CanonEntry[]; count: number }> {
  const q = new URLSearchParams();
  if (opts.scope) q.set('scope', opts.scope);
  if (opts.includeRetracted) q.set('includeRetracted', 'true');
  const qs = q.toString() ? `?${q}` : '';
  return apiFetch(`/characters/${characterId}/canon${qs}`);
}

export async function createCanon(
  characterId: string,
  input: { title: string; body: string; occurredAt?: string; tags?: string[]; scope?: string },
): Promise<{ entry: CanonEntry }> {
  return apiFetch(`/characters/${characterId}/canon`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function promoteEpisodeToCanon(
  characterId: string,
  input: { episodeId: string; title: string; body?: string; occurredAt?: string; tags?: string[]; scope?: string },
): Promise<{ entry: CanonEntry }> {
  return apiFetch(`/characters/${characterId}/canon/promote`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function retractCanonEntry(
  characterId: string,
  entryId: string,
  reason: string,
): Promise<{ entry: CanonEntry }> {
  return apiFetch(`/characters/${characterId}/canon/${entryId}/retract`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

// Avatar bridge
export async function pullAvatarFromTizita(
  characterId: string,
  force = false,
): Promise<{ status: string; avatarUrl?: string; reason?: string }> {
  return apiFetch(`/characters/${characterId}/avatar/pull-from-ikenga`, {
    method: 'POST',
    body: JSON.stringify({ force }),
  });
}


// =====================================================================
// Nuance + interactions
// =====================================================================

export interface NuanceFields {
  tongue?: {
    primaryLanguage?: string;
    dialect?: string;
    accent?: string;
    idioms?: string[];
    registerNotes?: string;
  };
  voiceSamples?: string[];
  preoccupations?: string[];
  tensions?: { beliefA: string; beliefB: string; note?: string }[];
  fixations?: string[];
  authoredBy?: string | null;
  modernity?: {
    anchorEra?: string;
    contemporaryBleed?: number;
    contemporarySlang?: string[];
    contemporaryRefs?: string[];
    refusedSlang?: string[];
  };
  currentLocation?: string | null;
  homeBase?: string | null;
}

export async function patchNuance(characterId: string, fields: NuanceFields): Promise<NuanceFields> {
  return apiFetch(`/characters/${characterId}/nuance`, {
    method: 'PATCH',
    body: JSON.stringify(fields),
  });
}

export async function autoGenerateNuance(
  characterId: string,
  opts: { fields?: ('tongue' | 'voiceSamples' | 'preoccupations' | 'tensions' | 'fixations')[]; creativeBrief?: string } = {},
): Promise<{ characterId: string; suggestion: NuanceFields }> {
  return apiFetch(`/characters/${characterId}/nuance/auto-generate`, {
    method: 'POST',
    body: JSON.stringify(opts),
  });
}

export async function sparkRandomInteraction(opts: {
  initiatorId?: string;
  recipientId?: string;
  context?: string;
} = {}): Promise<{
  initiator: { id: string; name: string };
  recipient: { id: string; name: string };
  message: string;
  episodeIds: { initiator: string; recipient: string };
  previousExchangeCount: number;
}> {
  return apiFetch('/interactions/spark', {
    method: 'POST',
    body: JSON.stringify(opts),
  });
}


// =====================================================================
// Places + Story arcs
// =====================================================================

export interface Place {
  name: string;
  description: string;
  kind: string;
  vibe: string;
  imageUrl: string | null;
  tizitaPhotoId: string | null;
  metadata: Record<string, unknown>;
  charactersHere?: number;
  eventsActive?: number;
}

export interface PlaceDetail {
  place: Place;
  charactersHere: { id: string; name: string; avatarUrl: string | null; currentLocation: string | null }[];
  recentEvents: { id: string; kind: string; content: string; createdAt: string }[];
}

export async function listPlaces(): Promise<{ places: Place[] }> {
  return apiFetch('/places');
}
export async function getPlace(name: string): Promise<PlaceDetail> {
  return apiFetch(`/places/${encodeURIComponent(name)}`);
}
export async function upsertPlace(name: string, body: Partial<Place>): Promise<{ place: Place }> {
  return apiFetch(`/places/${encodeURIComponent(name)}`, { method: 'PUT', body: JSON.stringify(body) });
}
export async function syncPlaceImageFromTizita(name: string, force = false): Promise<unknown> {
  return apiFetch(`/places/${encodeURIComponent(name)}/sync-image-from-ikenga`, {
    method: 'POST',
    body: JSON.stringify({ force }),
  });
}
export async function generateAtmosphericEvent(location: string): Promise<{ event: { id: string; content: string } }> {
  return apiFetch(`/locations/${encodeURIComponent(location)}/atmospheric-event`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

// Story arcs

export interface ArcPrimaryDef {
  key: string;
  label: string;
  glyph: string;
  definition: string;
  phases: string[];
  temperature: 'cool' | 'hot' | 'crossroads';
  motion: string;
  energy: string;
  compatibleSecondaries: string[];
  shadow: string;
  shadowNote: string;
  variants: string[];
}

export interface StoryArc {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'concluded' | 'shelved';
  primary: string | null;
  variant: string | null;
  temperature: string | null;
  shadowPrimary: string | null;
  glyph: string | null;
  beats: { title: string; body?: string; occurredAt?: string }[];
  currentBeatIndex: number;
  tags: string[];
  startedAt: string | null;
  endedAt: string | null;
  participants?: { arcId: string; characterId: string; role: string }[];
  createdAt: string;
  updatedAt: string;
}

export async function listArcPrimaries(): Promise<{ primaries: ArcPrimaryDef[] }> {
  return apiFetch('/arcs/primaries');
}
export async function listArcs(): Promise<{ arcs: StoryArc[] }> {
  return apiFetch('/arcs');
}
export async function createArc(body: Partial<StoryArc> & { primary?: string; variant?: string }): Promise<{ arc: StoryArc }> {
  return apiFetch('/arcs', { method: 'POST', body: JSON.stringify(body) });
}
export async function getArc(id: string): Promise<{ arc: StoryArc }> {
  return apiFetch(`/arcs/${id}`);
}
export async function patchArc(id: string, body: Partial<StoryArc>): Promise<{ arc: StoryArc }> {
  return apiFetch(`/arcs/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}
export async function advanceArc(id: string): Promise<{ arc: StoryArc; status: string }> {
  return apiFetch(`/arcs/${id}/advance`, { method: 'POST' });
}
export async function addArcParticipant(id: string, characterId: string, role = 'lead'): Promise<unknown> {
  return apiFetch(`/arcs/${id}/participants`, { method: 'POST', body: JSON.stringify({ characterId, role }) });
}
export async function removeArcParticipant(id: string, characterId: string): Promise<unknown> {
  return apiFetch(`/arcs/${id}/participants/${characterId}`, { method: 'DELETE' });
}

// ── Sphere APIs ────────────────────────────────────────────────────────
//
// A Sphere is a divergent media piece inhabiting a Scene (Zone).
// Spec: /home/sphinxy/boveda/CUBE_ZONE_SPHERE_ARCHITECTURE.md

export type SphereFormat =
  | 'film'
  | 'music_video'
  | 'content'
  | 'game'
  | 'dialogue'
  | 'interactive'
  | 'trailer'
  | 'reel'
  | 'mood';

export type SphereAudioMode =
  | 'lead'
  | 'remix'
  | 'underscore'
  | 'silent'
  | 'diegetic';

export type SphereStatus = 'draft' | 'in_production' | 'locked' | 'shipped';

export interface Sphere {
  id: string;
  sceneId: string;
  name: string;
  format: SphereFormat;
  primaryAspect: string;
  siblingAspect: string | null;
  intent: string | null;
  ikengaSeriesId: string | null;
  castIds: string[];
  audioMode: SphereAudioMode;
  stelaId: string | null;
  status: SphereStatus;
  physics: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSphereInput {
  sceneId: string;
  name: string;
  format?: SphereFormat;
  primaryAspect?: string;
  siblingAspect?: string | null;
  intent?: string | null;
  ikengaSeriesId?: string | null;
  castIds?: string[];
  audioMode?: SphereAudioMode;
  stelaId?: string | null;
  status?: SphereStatus;
  physics?: Record<string, unknown>;
}

export interface UpdateSphereInput {
  name?: string;
  format?: SphereFormat;
  primaryAspect?: string;
  siblingAspect?: string | null;
  intent?: string | null;
  ikengaSeriesId?: string | null;
  castIds?: string[];
  audioMode?: SphereAudioMode;
  stelaId?: string | null;
  status?: SphereStatus;
  physics?: Record<string, unknown> | null;
}

export async function listSpheres(sceneId?: string, status?: SphereStatus): Promise<Sphere[]> {
  const params = new URLSearchParams();
  if (sceneId) params.set('sceneId', sceneId);
  if (status) params.set('status', status);
  const qs = params.toString();
  return apiFetch<Sphere[]>(`/spheres${qs ? `?${qs}` : ''}`);
}

export async function getSphere(id: string): Promise<Sphere & { scene: Scene }> {
  return apiFetch<Sphere & { scene: Scene }>(`/spheres/${id}`);
}

export async function createSphere(data: CreateSphereInput): Promise<Sphere> {
  return apiFetch<Sphere>('/spheres', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSphere(id: string, data: UpdateSphereInput): Promise<Sphere> {
  return apiFetch<Sphere>(`/spheres/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteSphere(id: string): Promise<void> {
  await apiFetch<void>(`/spheres/${id}`, { method: 'DELETE' });
}

// ── Relic APIs (Vivarium) ──────────────────────────────────────────────
//
// The Relic is the unit of the Vivarium discovery layer (PLATS-
// Bioacoustic). Six-layer shape: field signal, scientific capture,
// intelligence, sonification, visualisation, mythic posture.
// Surfaces live in Ikenga (visual) and Resonate (audio).
// Spec: /home/sphinxy/boveda/VIVARIUM_ARCHITECTURE.md

export type RelicKind = 'location' | 'species' | 'phenomenon' | 'tech' | 'method' | 'recording';

export interface Relic {
  id: string;
  kind: RelicKind;
  title: string;
  phenomenonKey: string | null;
  fieldSite: string | null;
  fieldLat: number | null;
  fieldLng: number | null;
  captureMethod: string | null;
  captureGearNotes: string | null;
  rawSampleUrl: string | null;
  taxonPath: string | null;
  ncbiTaxid: string | null;
  gbifTaxonkey: string | null;
  iucnStatus: string | null;
  habitat: string | null;
  occurrences: unknown;
  rangeGeojson: unknown;
  weatherAtCapture: unknown;
  acousticIndices: unknown;
  detectedSpecies: unknown;
  defaultScoreId: string | null;
  renderedOutputs: unknown;
  spectrogramUrl: string | null;
  waterfallUrl: string | null;
  pointCloudUrl: string | null;
  gisLayerUrl: string | null;
  tdPatchRef: string | null;
  unrealActorRef: string | null;
  strangeness: number;
  saroIndex: number;
  mythicPosture: string | null;
  bodyMd: string | null;
  audioSamples: unknown;
  visualSamples: unknown;
  cubeIds: string[];
  zoneIds: string[];
  sphereIds: string[];
  stelaIds: string[];
  cipherIds: string[];
  characterIds: string[];
  sourceProvenance: string | null;
  sourceUrl: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRelicInput {
  kind?: RelicKind;
  title: string;
  phenomenonKey?: string | null;
  fieldSite?: string | null;
  fieldLat?: number | null;
  fieldLng?: number | null;
  captureMethod?: string | null;
  captureGearNotes?: string | null;
  rawSampleUrl?: string | null;
  taxonPath?: string | null;
  strangeness?: number;
  saroIndex?: number;
  mythicPosture?: string | null;
  bodyMd?: string | null;
  cubeIds?: string[];
  zoneIds?: string[];
  sphereIds?: string[];
  sourceProvenance?: string | null;
  sourceUrl?: string | null;
  tags?: string[];
}

export interface RelicListFilter {
  kind?: RelicKind;
  phenomenonKey?: string;
  minStrangeness?: number;
  minSaro?: number;
  zoneId?: string;
  sphereId?: string;
  cubeId?: string;
  q?: string;
}

export async function listRelics(filter: RelicListFilter = {}): Promise<Relic[]> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filter)) {
    if (v == null) continue;
    params.set(k, String(v));
  }
  const qs = params.toString();
  return apiFetch<Relic[]>(`/relics${qs ? `?${qs}` : ''}`);
}

export async function getRelic(id: string): Promise<Relic> {
  return apiFetch<Relic>(`/relics/${id}`);
}

export async function createRelic(data: CreateRelicInput): Promise<Relic> {
  return apiFetch<Relic>('/relics', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRelic(id: string, data: Partial<CreateRelicInput>): Promise<Relic> {
  return apiFetch<Relic>(`/relics/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteRelic(id: string): Promise<void> {
  await apiFetch<void>(`/relics/${id}`, { method: 'DELETE' });
}

export async function importRelicFromUrl(
  url: string,
  bind?: { cubeId?: string; zoneId?: string; sphereId?: string },
): Promise<Relic> {
  return apiFetch<Relic>('/relics/import_from_url', {
    method: 'POST',
    body: JSON.stringify({ url, ...bind }),
  });
}
