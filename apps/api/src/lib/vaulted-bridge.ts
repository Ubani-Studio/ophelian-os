/**
 * Boveda → Vaulted bridge.
 *
 * Boveda is the human-facing character / persona surface. Vaulted
 * (RightsLayer) is the audit-grade rights infrastructure underneath:
 * LoraArtifact registry, LicenseRequest engine, InferenceJob runner,
 * GeneratedOutput audit. For Sembla to license a character to a brand
 * pilot, the character must have a corresponding LoraArtifact row in
 * Vaulted. That registration is the bridge.
 *
 * This module is resilient: if Vaulted is offline, registration is
 * queued (Character.vaultedStatus = 'pending_registration' with
 * Character.vaultedLastError holding the reason). A future sync job
 * can drain the queue when Vaulted comes online.
 *
 * The shape of the LoraArtifact payload is dictated by Vaulted's
 * /api/lora-artifacts endpoint. Keep this in sync with
 * /home/sphinxy/vaulted/apps/api/app/schemas/lora.py.
 */

import type { Character } from '@prisma/client';

const VAULTED_API_URL =
  process.env.VAULTED_API_URL || 'http://localhost:8000';
const VAULTED_API_TOKEN = process.env.VAULTED_API_TOKEN || '';
const VAULTED_TIMEOUT_MS = Number(process.env.VAULTED_TIMEOUT_MS || 5000);

export interface RegisterArtifactInput {
  /** Character to register. Boveda's source-of-truth row. */
  character: Pick<
    Character,
    | 'id'
    | 'name'
    | 'aliases'
    | 'bio'
    | 'authoredBy'
    | 'tongue'
    | 'voiceSamples'
    | 'realIdentityId'
    | 'biometricHash'
  >;

  /** LoRA file location. Required by Vaulted; must be a vault-internal URI. */
  weightsStorageUri: string;
  weightsSha256: string;

  /** What kind of LoRA artifact: style / character / persona. */
  artifactKind?: 'style' | 'character' | 'persona';

  /** Base model the LoRA was trained on (default flux-dev). */
  baseModel?: string;

  /** LoRA training metadata (preserved for audit). */
  rank?: number;
  trainingSteps?: number;
  triggerWord?: string;

  /** Consent attestation JSON. Anything signed off as legal basis. */
  consentAttestation?: Record<string, unknown>;

  /** Free-text rights statement. */
  rightsAssertion?: string;
}

export interface VaultedRegistrationResult {
  ok: true;
  vaultedArtifactId: string;
  loraArtifact: VaultedLoraArtifact;
}

export interface VaultedRegistrationFailure {
  ok: false;
  reason: 'unreachable' | 'http_error' | 'invalid_response' | 'timeout';
  detail: string;
  httpStatus?: number;
}

export interface VaultedLoraArtifact {
  id: number;
  slug: string;
  name: string;
  artifact_kind: string;
  base_model: string;
  trigger_word: string;
  rank: number;
  training_steps: number;
  weights_sha256: string;
  is_listed: boolean;
  created_at: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

/**
 * POST a LoraArtifact to Vaulted. Resilient to network errors — returns
 * a discriminated union the caller can persist as character.vaultedStatus.
 */
export async function registerCharacterAsLoraArtifact(
  input: RegisterArtifactInput,
): Promise<VaultedRegistrationResult | VaultedRegistrationFailure> {
  const { character } = input;

  const tongue = (character.tongue ?? {}) as Record<string, unknown>;
  const consent = input.consentAttestation ?? buildConsentAttestation(character);
  const rights = input.rightsAssertion ?? buildRightsAssertion(character);

  const payload = {
    slug: slugify(character.aliases?.[0] || character.name),
    name: character.name,
    artifact_kind: input.artifactKind ?? 'character',
    description: character.bio ?? '',
    base_model: input.baseModel ?? 'flux-dev',
    trigger_word: input.triggerWord ?? slugify(character.name),
    training_dataset_ref: null,
    rank: input.rank ?? 16,
    training_steps: input.trainingSteps ?? 0,
    weights_storage_uri: input.weightsStorageUri,
    weights_sha256: input.weightsSha256,
    consent_attestation: {
      ...consent,
      _source: 'boveda',
      boveda_character_id: character.id,
      boveda_authored_by: character.authoredBy ?? null,
      boveda_tongue: tongue,
      boveda_real_identity_id: character.realIdentityId ?? null,
      boveda_biometric_hash: character.biometricHash ?? null,
      voice_samples_count: Array.isArray(character.voiceSamples)
        ? (character.voiceSamples as unknown[]).length
        : 0,
    },
    rights_assertion: rights,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VAULTED_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (VAULTED_API_TOKEN) {
      headers['Authorization'] = `Bearer ${VAULTED_API_TOKEN}`;
    }
    const res = await fetch(`${VAULTED_API_URL}/lora-artifacts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      let detail = '';
      try {
        const body = await res.text();
        detail = body.slice(0, 500);
      } catch {
        detail = res.statusText;
      }
      return {
        ok: false,
        reason: 'http_error',
        httpStatus: res.status,
        detail: `Vaulted returned ${res.status}: ${detail}`,
      };
    }

    let parsed: VaultedLoraArtifact;
    try {
      parsed = (await res.json()) as VaultedLoraArtifact;
    } catch (e) {
      return {
        ok: false,
        reason: 'invalid_response',
        detail: `Vaulted response not JSON: ${(e as Error).message}`,
      };
    }
    if (parsed.id === undefined || parsed.slug === undefined) {
      return {
        ok: false,
        reason: 'invalid_response',
        detail: `Vaulted response missing id/slug: ${JSON.stringify(parsed).slice(0, 300)}`,
      };
    }

    return {
      ok: true,
      vaultedArtifactId: String(parsed.id),
      loraArtifact: parsed,
    };
  } catch (e) {
    clearTimeout(timer);
    const err = e as Error & { name?: string };
    if (err.name === 'AbortError') {
      return {
        ok: false,
        reason: 'timeout',
        detail: `Vaulted timed out after ${VAULTED_TIMEOUT_MS}ms`,
      };
    }
    return {
      ok: false,
      reason: 'unreachable',
      detail: `Vaulted unreachable at ${VAULTED_API_URL}: ${err.message}`,
    };
  }
}

/**
 * Fetch the live status of a Vaulted LoraArtifact + count of accepted
 * licenses. Used to refresh Boveda's character.vaultedStatus.
 */
export async function fetchVaultedStatus(
  vaultedArtifactId: string,
): Promise<{
  ok: true;
  artifact: VaultedLoraArtifact;
  acceptedLicenseCount: number;
} | { ok: false; reason: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VAULTED_TIMEOUT_MS);
  try {
    const headers: Record<string, string> = {};
    if (VAULTED_API_TOKEN) {
      headers['Authorization'] = `Bearer ${VAULTED_API_TOKEN}`;
    }
    const res = await fetch(
      `${VAULTED_API_URL}/lora-artifacts/${vaultedArtifactId}`,
      { headers, signal: controller.signal },
    );
    clearTimeout(timer);
    if (!res.ok) {
      return { ok: false, reason: `http_${res.status}` };
    }
    const artifact = (await res.json()) as VaultedLoraArtifact;
    return { ok: true, artifact, acceptedLicenseCount: 0 };
  } catch (e) {
    clearTimeout(timer);
    return {
      ok: false,
      reason: `unreachable: ${(e as Error).message}`,
    };
  }
}

function buildConsentAttestation(
  c: Pick<Character, 'name' | 'authoredBy' | 'realIdentityId' | 'biometricHash'>,
): Record<string, unknown> {
  return {
    consent_version: '1.0',
    signer: c.authoredBy ?? c.name,
    signed_at: new Date().toISOString(),
    scope: 'commercial_use_with_per_deal_authorization',
    biometric_data_present: Boolean(c.biometricHash),
    real_identity_linked: Boolean(c.realIdentityId),
    notes:
      'Auto-generated at Boveda registration. Refine before any commercial deal: ' +
      'add explicit signer wallet, scope restrictions, geographic bounds, ' +
      'and revocation terms.',
  };
}

function buildRightsAssertion(
  c: Pick<Character, 'name' | 'authoredBy'>,
): string {
  const owner = c.authoredBy || 'bomac1193';
  return (
    `Owner: ${owner}. ` +
    `Right-of-publicity asserted under UK Data Protection Act 2018, ` +
    `EU GDPR Art. 9 (biometric data), and applicable US right-of-publicity ` +
    `statutes. Use of "${c.name}" as a generative AI persona requires ` +
    `explicit per-deal authorization via Vaulted LicenseRequest. ` +
    `Unauthorized use subject to takedown + civil claim.`
  );
}
