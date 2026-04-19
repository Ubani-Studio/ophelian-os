/**
 * Bóveda Studio - Imprint API Client
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5130';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'ophelian-dev-key-2026';

// Types matching the imprint system
export interface OrishaConfiguration {
  headOrisha: string;
  camino?: string;
  secondaryInfluences: {
    orisha: string;
    strength: number;
  }[];
  shadowForm?: string;
}

export interface KabbalisticPosition {
  primarySephira: string;
  pillar: 'Mercy' | 'Severity' | 'Balance';
  qliphothicShadow: string;
  activePath?: number;
  daathRelationship: 'seeking' | 'touched' | 'integrated' | 'avoiding';
}

export interface PsychologicalState {
  individuationLevel: number;
  hotCoolAxis: number;
  dominantComplex: string;
  shadowIntegration: number;
  activeArchetypes: string[];
  trajectory: 'emergence' | 'ascent' | 'crisis' | 'descent' | 'integration' | 'transcendence';
}

export interface VisualSignature {
  primaryColors: string[];
  secondaryColors: string[];
  patterns: string[];
  textures: string[];
  lightQuality: string;
  aestheticStyle: string;
  symbolMotifs: string[];
}

export interface VoiceSignature {
  pitchRange: string;
  timbre: string[];
  speechPatterns: string[];
  rhythmicQuality: string;
  emotionalResonance: string;
  accentInfluences: string[];
}

export interface MusicSignature {
  keySignature: string;
  mode: string;
  tempoRange: { min: number; max: number };
  primaryInstruments: string[];
  rhythmicPatterns: string[];
  harmonicComplexity: string;
  genreInfluences: string[];
}

export interface MovementSignature {
  qualityOfMotion: string;
  tempoPreference: string;
  spatialOrientation: string;
  gestureVocabulary: string[];
  danceInfluences: string[];
  postureCharacteristics: string[];
}

export interface MultiModalSignature {
  visual: VisualSignature;
  voice: VoiceSignature;
  music: MusicSignature;
  movement: MovementSignature;
}

export interface NarrativeIdentity {
  coreValues: string[];
  centralConflicts: string[];
  relationalPatterns: { archetype: string; nature: string }[];
  originMythElements: string[];
  recurringThemes: string[];
  telos: string;
}

export interface InvariantMarkers {
  identityAnchors: string[];
  absoluteTaboos: string[];
  signaturePhrases: string[];
  sacredValues: string[];
  immutableTraits: string[];
}

export interface EvolutionRules {
  permittedChanges: {
    aspect: string;
    maxDrift: number;
    conditions: string[];
  }[];
  protectedCore: string[];
  evolutionTriggers: { trigger: string; effect: string }[];
  changeVelocity: 'glacial' | 'slow' | 'moderate' | 'rapid';
}

export interface CharacterImprint {
  id: string;
  name: string;
  schemaVersion: string;
  createdAt: string;
  updatedAt: string;
  orishaConfiguration: OrishaConfiguration;
  kabbalisticPosition: KabbalisticPosition;
  psychologicalState: PsychologicalState;
  multiModalSignature: MultiModalSignature;
  narrativeIdentity: NarrativeIdentity;
  invariantMarkers: InvariantMarkers;
  evolutionRules: EvolutionRules;
  characterId?: string;
  seed?: number;
  tags?: string[];
}

/** @deprecated Use CharacterImprint instead */
export type CharacterGenome = CharacterImprint;

export interface ImprintGenerationOptions {
  name?: string;
  seed?: number;
  forceOrisha?: string;
  forceSephira?: string;
  hotCoolBias?: number;
  preferredTrajectory?: string;
  tags?: string[];
}

/** @deprecated Use ImprintGenerationOptions instead */
export type GenomeGenerationOptions = ImprintGenerationOptions;

export interface ImprintSystemPrompt {
  prompt: string;
  characterName: string;
  traitSummary: string[];
  guidelines: string[];
  constraints: string[];
}

/** @deprecated Use ImprintSystemPrompt instead */
export type GenomeSystemPrompt = ImprintSystemPrompt;

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
    throw new Error(error.message || error.error || `API error: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// CRUD Operations

export async function createImprint(options?: ImprintGenerationOptions): Promise<CharacterImprint> {
  return apiFetch<CharacterImprint>('/genomes', {
    method: 'POST',
    body: JSON.stringify(options || {}),
  });
}

/** @deprecated Use createImprint instead */
export const createGenome = createImprint;

export async function getImprints(filters?: {
  orisha?: string;
  sephira?: string;
  trajectory?: string;
  tag?: string;
}): Promise<CharacterImprint[]> {
  const params = new URLSearchParams();
  if (filters?.orisha) params.set('orisha', filters.orisha);
  if (filters?.sephira) params.set('sephira', filters.sephira);
  if (filters?.trajectory) params.set('trajectory', filters.trajectory);
  if (filters?.tag) params.set('tag', filters.tag);

  const queryString = params.toString();
  const endpoint = queryString ? `/genomes?${queryString}` : '/genomes';

  return apiFetch<CharacterImprint[]>(endpoint);
}

/** @deprecated Use getImprints instead */
export const getGenomes = getImprints;

export async function getImprint(id: string): Promise<CharacterImprint> {
  return apiFetch<CharacterImprint>(`/genomes/${id}`);
}

/** @deprecated Use getImprint instead */
export const getGenome = getImprint;

export async function updateImprint(id: string, data: Partial<CharacterImprint>): Promise<CharacterImprint> {
  return apiFetch<CharacterImprint>(`/genomes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/** @deprecated Use updateImprint instead */
export const updateGenome = updateImprint;

export async function deleteImprint(id: string): Promise<void> {
  await apiFetch<void>(`/genomes/${id}`, {
    method: 'DELETE',
  });
}

/** @deprecated Use deleteImprint instead */
export const deleteGenome = deleteImprint;

// Generation (without saving)

export async function generateImprint(options?: ImprintGenerationOptions): Promise<CharacterImprint> {
  return apiFetch<CharacterImprint>('/genomes/generate', {
    method: 'POST',
    body: JSON.stringify(options || {}),
  });
}

/** @deprecated Use generateImprint instead */
export const generateGenome = generateImprint;

export async function generateImprintForOrisha(
  orisha: string,
  options?: Omit<ImprintGenerationOptions, 'forceOrisha'>
): Promise<CharacterImprint> {
  return apiFetch<CharacterImprint>(`/genomes/generate/orisha/${orisha}`, {
    method: 'POST',
    body: JSON.stringify(options || {}),
  });
}

/** @deprecated Use generateImprintForOrisha instead */
export const generateGenomeForOrisha = generateImprintForOrisha;

export async function generateImprintForSephira(
  sephira: string,
  options?: Omit<ImprintGenerationOptions, 'forceSephira'>
): Promise<CharacterImprint> {
  return apiFetch<CharacterImprint>(`/genomes/generate/sephira/${sephira}`, {
    method: 'POST',
    body: JSON.stringify(options || {}),
  });
}

/** @deprecated Use generateImprintForSephira instead */
export const generateGenomeForSephira = generateImprintForSephira;

export async function rerollImprint(
  seed: number,
  options?: Partial<ImprintGenerationOptions>
): Promise<CharacterImprint> {
  return apiFetch<CharacterImprint>(`/genomes/reroll/${seed}`, {
    method: 'POST',
    body: JSON.stringify(options || {}),
  });
}

/** @deprecated Use rerollImprint instead */
export const rerollGenome = rerollImprint;

// Prompt Generation

export async function generatePrompt(
  imprintId: string,
  style: 'concise' | 'detailed' | 'poetic' = 'detailed'
): Promise<ImprintSystemPrompt> {
  return apiFetch<ImprintSystemPrompt>(`/genomes/${imprintId}/generate-prompt`, {
    method: 'POST',
    body: JSON.stringify({ style }),
  });
}

// Export

export async function exportImprint(
  imprintId: string,
  format: 'json' | 'markdown' | 'system-prompt',
  promptStyle?: 'concise' | 'detailed' | 'poetic'
): Promise<string> {
  const response = await fetch(`${API_URL}/genomes/${imprintId}/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({ format, promptStyle }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || error.error || `API error: ${response.status}`);
  }

  return response.text();
}

/** @deprecated Use exportImprint instead */
export const exportGenome = exportImprint;

// Character Linking

export async function linkImprintToCharacter(imprintId: string, characterId: string): Promise<CharacterImprint> {
  return apiFetch<CharacterImprint>(`/genomes/${imprintId}/link/${characterId}`, {
    method: 'POST',
  });
}

/** @deprecated Use linkImprintToCharacter instead */
export const linkGenomeToCharacter = linkImprintToCharacter;

export async function unlinkImprint(imprintId: string): Promise<CharacterImprint> {
  return apiFetch<CharacterImprint>(`/genomes/${imprintId}/link`, {
    method: 'DELETE',
  });
}

/** @deprecated Use unlinkImprint instead */
export const unlinkGenome = unlinkImprint;
