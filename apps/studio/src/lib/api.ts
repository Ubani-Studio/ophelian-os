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
    dialect?: string;
    accent?: string;
    idioms?: string[];
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
  /** Tizita persona link (Ikenga). When set, the character is bound
   *  to a real-life face cluster in Tizita and federates photos +
   *  brief from there. */
  tizitaPersonaId?: string | null;
  /** Representative photo URL fetched from Tizita on list responses
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

export async function updateCharacter(id: string, data: Partial<Character>): Promise<Character> {
  return apiFetch<Character>(`/characters/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/** Manually set Subtaste primary (and optional secondary) for a
 *  non-user character. Refused for isUser=true (use the Starforge
 *  import to update Ubani's Subtaste from Nommo). */
export async function setSubtaste(
  characterId: string,
  primaryCode: string,
  secondaryCode?: string | null
): Promise<{ ok: boolean; subtaste: Record<string, unknown> }> {
  return apiFetch(`/characters/${characterId}/subtaste`, {
    method: 'PATCH',
    body: JSON.stringify({ primaryCode, secondaryCode: secondaryCode ?? null }),
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
// Aligned generator (lineage + Subtaste + brief → coherent fields)
// =============================================================================

export interface LineageOption {
  id: string;
  label: string;
  region: string;
  advisorGated: boolean;
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

export async function realignCharacter(
  characterId: string,
  options: {
    /** Single lineage id or array of ids (multi-blend). */
    lineage?: string | string[];
    brief?: string;
    subtasteCode?: string;
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
