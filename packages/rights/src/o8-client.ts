/**
 * o8 Protocol Client
 * Fetches voice licensing terms from o8 identity service
 * Used to validate voice usage before synthesis
 */

// o8 API configuration
const O8_API_URL = process.env.O8_API_URL || 'http://localhost:3002/api';

/**
 * Licensing terms from o8
 */
export interface O8LicensingTerms {
  training_rights: boolean;
  derivative_rights: boolean;
  commercial_rights: boolean;
  attribution_required: boolean;
  revenue_split: number;
  rate_per_second_cents?: number | null;
}

/**
 * Voice DNA from o8
 */
export interface O8VoiceDNA {
  source: 'chromox';
  embedding: number[];
  pitch: {
    range: 'bass' | 'baritone' | 'tenor' | 'alto' | 'soprano';
    average_hz: number;
    variance: number;
  };
  timbre: {
    qualities: string[];
    formant_signature: number[];
  };
  speech_patterns: string[];
  accent_category?: string;
  voice_type: 'speech' | 'singing' | 'mixed';
  provider_ids: {
    chromox: string;
    rvc?: string;
    elevenlabs?: string;
  };
}

/**
 * Full o8 identity response
 */
export interface O8Identity {
  identity_id: string;
  version: string;
  created_at: string;
  updated_at: string;
  creator: {
    name: string;
    wallet?: string;
    verification_level: 'none' | 'basic' | 'enhanced' | 'verified';
  };
  dna: {
    voice?: O8VoiceDNA;
    audio?: unknown;
    visual?: unknown;
  };
  licensing: O8LicensingTerms;
  provenance: {
    audio_fingerprint?: {
      sha256: string;
      duration_ms: number;
      format: string;
    };
    ipfs_cid?: string;
  };
  provider_refs?: {
    chromox_persona_id?: string;
    boveda_genome_id?: string;
  };
}

/**
 * Validation result for voice usage
 */
export interface VoiceUsageValidation {
  allowed: boolean;
  reason: string;
  licensing?: O8LicensingTerms;
}

/**
 * Fetches an identity from o8 by ID
 */
export async function getO8Identity(identityId: string): Promise<O8Identity | null> {
  try {
    const response = await fetch(`${O8_API_URL}/identity/${identityId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      console.warn(`[o8-client] Failed to fetch identity: ${response.status}`);
      return null;
    }

    return await response.json() as O8Identity;
  } catch (error) {
    console.warn('[o8-client] Error fetching identity:', error);
    return null;
  }
}

/**
 * Fetches licensing terms from o8 for a voice identity
 */
export async function getO8License(identityId: string): Promise<O8LicensingTerms | null> {
  const identity = await getO8Identity(identityId);
  return identity?.licensing || null;
}

/**
 * Validates that a voice can be used for a specific action
 */
export async function validateVoiceUsage(
  identityId: string,
  action: 'synthesize' | 'train' | 'create_hybrid'
): Promise<VoiceUsageValidation> {
  const identity = await getO8Identity(identityId);

  if (!identity) {
    return {
      allowed: false,
      reason: 'Voice identity not found in o8 registry',
    };
  }

  const { licensing } = identity;

  switch (action) {
    case 'synthesize':
      return {
        allowed: licensing.commercial_rights,
        reason: licensing.commercial_rights
          ? 'Voice synthesis permitted by license'
          : 'Commercial use not permitted by license',
        licensing,
      };

    case 'train':
      return {
        allowed: licensing.training_rights,
        reason: licensing.training_rights
          ? 'Voice training permitted by license'
          : 'Training not permitted by license',
        licensing,
      };

    case 'create_hybrid':
      return {
        allowed: licensing.derivative_rights,
        reason: licensing.derivative_rights
          ? 'Hybrid voice creation permitted by license'
          : 'Derivative works not permitted by license',
        licensing,
      };

    default:
      return {
        allowed: false,
        reason: `Unknown action: ${action}`,
      };
  }
}

/**
 * Gets the royalty rate for a voice (per second of synthesis)
 */
export async function getVoiceRoyaltyRate(identityId: string): Promise<{
  ratePerSecondCents: number;
  revenueSplit: number;
} | null> {
  const identity = await getO8Identity(identityId);

  if (!identity) {
    return null;
  }

  return {
    ratePerSecondCents: identity.licensing.rate_per_second_cents || 0,
    revenueSplit: identity.licensing.revenue_split,
  };
}

/**
 * Links a Boveda genome to an o8 identity
 */
export async function linkBovedaGenome(
  identityId: string,
  bovedaGenomeId: string
): Promise<boolean> {
  try {
    const response = await fetch(`${O8_API_URL}/identity/${identityId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider_refs: {
          boveda_genome_id: bovedaGenomeId,
        },
      }),
    });

    return response.ok;
  } catch (error) {
    console.warn('[o8-client] Error linking Boveda genome:', error);
    return false;
  }
}

/**
 * Fetches voice DNA for synthesis configuration
 */
export async function getVoiceDNA(identityId: string): Promise<O8VoiceDNA | null> {
  const identity = await getO8Identity(identityId);
  return identity?.dna?.voice || null;
}
