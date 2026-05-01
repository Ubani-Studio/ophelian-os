import { createHash } from 'crypto';
import type { Character, CharacterGenome, License } from '@prisma/client';

/**
 * BovedaPersona — wire shape consumed by sister apps (Slayt) when activating
 * a character as a posting identity. Bundles voice, visual, lore, rights, and
 * provenance into one immutable payload.
 */
export interface BovedaPersona {
  persona_id: string;
  handler_user_id: string;
  display_name: string;
  avatars: {
    primary: string | null;
    by_platform?: Record<string, string>;
  };
  genome: {
    voice: {
      tone: string[];
      forbidden_phrases: string[];
      cadence: 'short' | 'long' | 'fragmented';
      reading_level?: number;
    };
    visual: {
      palette: string[];
      warmth: number;
      energy: number;
      themes: string[];
      taste_vector?: number[];
    };
    lore: {
      world_id: string | null;
      trail_id?: string | null;
      canonical_facts: string[];
      contradicts: string[];
    };
  };
  rights: {
    consent_type: 'human_clone' | 'original_ai' | 'hybrid';
    likeness_owner: string;
    expires_at?: string;
    allowed_platforms: Array<'instagram' | 'tiktok' | 'twitter' | 'youtube'>;
    requires_ai_disclosure: boolean;
    nsfw_allowed: boolean;
    political_speech: 'blocked' | 'allowed' | 'review';
    revocation_webhook: string;
  };
  provenance: {
    boveda_signature: string;
    imprint_handler_token?: string;
    issued_at: string;
  };
}

const ALL_PLATFORMS: BovedaPersona['rights']['allowed_platforms'] = [
  'instagram',
  'tiktok',
  'twitter',
  'youtube',
];

function consentTypeFromSource(source: string): BovedaPersona['rights']['consent_type'] {
  if (source === 'PERSONA') return 'human_clone';
  if (source === 'TWIN') return 'hybrid';
  return 'original_ai';
}

function cadenceFromTongue(tongue: unknown): 'short' | 'long' | 'fragmented' {
  if (tongue && typeof tongue === 'object') {
    const t = tongue as Record<string, unknown>;
    const c = typeof t.cadence === 'string' ? t.cadence.toLowerCase() : '';
    if (c === 'long' || c === 'fragmented' || c === 'short') return c;
  }
  return 'short';
}

function deriveCanonicalFacts(character: Character): string[] {
  const facts: string[] = [];
  if (character.bio) facts.push(character.bio);
  if (character.backstory) facts.push(character.backstory);
  if (character.currentArc) facts.push(`Current arc: ${character.currentArc}`);
  return facts;
}

function deriveVisualFromGenome(genome: CharacterGenome | null): BovedaPersona['genome']['visual'] {
  const sig = (genome?.multiModalSignature ?? {}) as Record<string, unknown>;
  const visual = (sig.visual ?? {}) as Record<string, unknown>;
  const palette = Array.isArray(visual.palette) ? (visual.palette as string[]) : [];
  const themes = Array.isArray(visual.themes) ? (visual.themes as string[]) : [];
  const warmth = typeof visual.warmth === 'number' ? visual.warmth : 0.5;
  const energy = typeof visual.energy === 'number' ? visual.energy : 0.5;
  const tasteVector = Array.isArray(visual.taste_vector)
    ? (visual.taste_vector as number[])
    : undefined;
  return { palette, warmth, energy, themes, taste_vector: tasteVector };
}

function pickActiveLicense(licenses: License[]): License | null {
  const now = Date.now();
  const valid = licenses.filter((l) => {
    const e = (l as unknown as { expiresAt?: Date | null }).expiresAt;
    return !e || new Date(e).getTime() > now;
  });
  if (valid.length === 0) return null;
  return valid.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
}

interface BuildPayloadInput {
  character: Character;
  genome: CharacterGenome | null;
  licenses: License[];
  revocationWebhook: string;
  imprintHandlerToken?: string;
}

export function buildBovedaPersonaPayload(input: BuildPayloadInput): BovedaPersona {
  const { character, genome, licenses, revocationWebhook, imprintHandlerToken } = input;

  const identity = (character.identity ?? {}) as Record<string, unknown>;
  const allowedFromIdentity = Array.isArray(identity.allowed_platforms)
    ? (identity.allowed_platforms as string[]).filter((p) =>
        ALL_PLATFORMS.includes(p as (typeof ALL_PLATFORMS)[number]),
      )
    : null;

  const activeLicense = pickActiveLicense(licenses);
  const requiresDisclosure =
    typeof identity.requires_ai_disclosure === 'boolean'
      ? (identity.requires_ai_disclosure as boolean)
      : character.source !== 'PERSONA';

  const payload: BovedaPersona = {
    persona_id: character.id,
    handler_user_id: character.realIdentityId ?? character.authoredBy ?? '',
    display_name: character.name,
    avatars: {
      primary: character.avatarUrl ?? null,
    },
    genome: {
      voice: {
        tone: character.toneAllowed ?? [],
        forbidden_phrases: character.toneForbidden ?? [],
        cadence: cadenceFromTongue(character.tongue),
      },
      visual: deriveVisualFromGenome(genome),
      lore: {
        world_id: character.worldId ?? null,
        trail_id: typeof identity.trail_id === 'string' ? (identity.trail_id as string) : null,
        canonical_facts: deriveCanonicalFacts(character),
        contradicts: character.toneForbidden ?? [],
      },
    },
    rights: {
      consent_type: consentTypeFromSource(character.source),
      likeness_owner: character.realIdentityId ?? character.authoredBy ?? character.id,
      expires_at: (activeLicense as unknown as { expiresAt?: Date | null })?.expiresAt
        ? new Date(
            (activeLicense as unknown as { expiresAt: Date }).expiresAt,
          ).toISOString()
        : undefined,
      allowed_platforms: (allowedFromIdentity as BovedaPersona['rights']['allowed_platforms']) ?? ALL_PLATFORMS,
      requires_ai_disclosure: requiresDisclosure,
      nsfw_allowed: identity.nsfw_allowed === true,
      political_speech:
        identity.political_speech === 'allowed' || identity.political_speech === 'review'
          ? (identity.political_speech as 'allowed' | 'review')
          : 'blocked',
      revocation_webhook: revocationWebhook,
    },
    provenance: {
      boveda_signature: '',
      imprint_handler_token: imprintHandlerToken,
      issued_at: new Date().toISOString(),
    },
  };

  // Sign the payload (excluding the signature field itself)
  const { provenance, ...rest } = payload;
  const { boveda_signature: _omit, ...provenanceWithoutSig } = provenance;
  const canonical = JSON.stringify({ ...rest, provenance: provenanceWithoutSig });
  payload.provenance.boveda_signature = createHash('sha256').update(canonical).digest('hex');

  return payload;
}
