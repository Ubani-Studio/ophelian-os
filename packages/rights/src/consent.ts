import { createHash, randomBytes } from 'crypto';
import {
  ConsentRecordType,
  ConsentSource,
  type ConsentPermissions,
  type CreateConsentRecordInput,
  type ConsentRecord,
} from '@lcos/shared';

/**
 * Generate a short, memorable public license token
 * Format: XX-NNNA (e.g., "FX-91A", "VT-23B")
 */
export function generateLicenseToken(): string {
  const prefixes = ['FX', 'VT', 'LX', 'SB', 'BV', 'TW', 'PN', 'GN'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  const suffix = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
  return `${prefix}-${num}${suffix}`;
}

/**
 * Compute SHA256 hash of a consent record for chain verification
 */
export function computeConsentHash(
  record: Omit<ConsentRecord, 'id' | 'hash'>
): string {
  const payload = JSON.stringify({
    type: record.type,
    timestamp: record.timestamp.toISOString(),
    previousHash: record.previousHash,
    source: record.source,
    sourceId: record.sourceId,
    grantedBy: record.grantedBy,
    permissions: record.permissions,
    terms: record.terms,
    characterId: record.characterId,
    voiceProfileId: record.voiceProfileId,
    licenseId: record.licenseId,
    genomeId: record.genomeId,
  });
  return createHash('sha256').update(payload).digest('hex');
}

/**
 * Build a new consent record with proper hash chain linking
 */
export interface BuildConsentRecordOptions {
  type: ConsentRecordType;
  source: ConsentSource;
  sourceId?: string | null;
  grantedBy?: string | null;
  permissions: ConsentPermissions;
  terms?: string | null;
  metadata?: Record<string, unknown>;
  previousHash?: string | null;
  // Subject (one of these should be set)
  characterId?: string | null;
  voiceProfileId?: string | null;
  licenseId?: string | null;
  genomeId?: string | null;
}

export function buildConsentRecord(
  options: BuildConsentRecordOptions
): Omit<ConsentRecord, 'id'> {
  const timestamp = new Date();

  const recordWithoutHash = {
    type: options.type,
    timestamp,
    previousHash: options.previousHash ?? null,
    source: options.source,
    sourceId: options.sourceId ?? null,
    grantedBy: options.grantedBy ?? null,
    permissions: options.permissions,
    terms: options.terms ?? null,
    metadata: options.metadata ?? {},
    characterId: options.characterId ?? null,
    voiceProfileId: options.voiceProfileId ?? null,
    licenseId: options.licenseId ?? null,
    genomeId: options.genomeId ?? null,
  };

  const hash = computeConsentHash(recordWithoutHash);

  return {
    ...recordWithoutHash,
    hash,
  };
}

/**
 * Verify the integrity of a consent chain
 */
export interface ChainVerificationResult {
  valid: boolean;
  chainLength: number;
  lastHash: string | null;
  errors: string[];
}

export function verifyConsentChain(
  records: ConsentRecord[]
): ChainVerificationResult {
  const errors: string[] = [];

  if (records.length === 0) {
    return {
      valid: true,
      chainLength: 0,
      lastHash: null,
      errors: [],
    };
  }

  // Sort by timestamp ascending
  const sorted = [...records].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  // Verify each record's hash and chain linkage
  for (let i = 0; i < sorted.length; i++) {
    const record = sorted[i];

    // Compute expected hash
    const expectedHash = computeConsentHash({
      type: record.type,
      timestamp: record.timestamp,
      previousHash: record.previousHash,
      source: record.source,
      sourceId: record.sourceId,
      grantedBy: record.grantedBy,
      permissions: record.permissions,
      terms: record.terms,
      metadata: record.metadata,
      characterId: record.characterId,
      voiceProfileId: record.voiceProfileId,
      licenseId: record.licenseId,
      genomeId: record.genomeId,
    });

    // Check hash matches
    if (record.hash !== expectedHash) {
      errors.push(`Record ${record.id}: hash mismatch (tampering detected)`);
    }

    // Check chain linkage (first record should have null previousHash)
    if (i === 0) {
      if (record.previousHash !== null) {
        errors.push(`Record ${record.id}: first record should have null previousHash`);
      }
    } else {
      const previousRecord = sorted[i - 1];
      if (record.previousHash !== previousRecord.hash) {
        errors.push(`Record ${record.id}: previousHash doesn't match previous record's hash`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    chainLength: sorted.length,
    lastHash: sorted[sorted.length - 1]?.hash ?? null,
    errors,
  };
}

/**
 * Check if a consent chain has active consent for a specific permission
 */
export interface ConsentCheckResult {
  hasConsent: boolean;
  grantedAt?: Date;
  grantedBy?: string;
  revokedAt?: Date;
  currentPermissions: ConsentPermissions;
}

export function checkConsentForPermission(
  records: ConsentRecord[],
  permission: keyof ConsentPermissions
): ConsentCheckResult {
  // Sort by timestamp ascending
  const sorted = [...records].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  // Default permissions (all false except attribution)
  let currentPermissions: ConsentPermissions = {
    synthesis: false,
    training: false,
    commercial: false,
    modification: false,
    attribution: true,
    derivativeWorks: false,
  };

  let lastGrant: { timestamp: Date; grantedBy: string | null } | null = null;
  let lastRevocation: Date | null = null;

  for (const record of sorted) {
    // Update permissions based on record
    if (record.type === ConsentRecordType.REVOCATION) {
      // Revocation clears all permissions
      currentPermissions = {
        synthesis: false,
        training: false,
        commercial: false,
        modification: false,
        attribution: true,
        derivativeWorks: false,
      };
      lastRevocation = record.timestamp;
    } else {
      // Merge permissions
      currentPermissions = {
        ...currentPermissions,
        ...record.permissions,
      };

      if (record.permissions[permission]) {
        lastGrant = {
          timestamp: record.timestamp,
          grantedBy: record.grantedBy,
        };
      }
    }
  }

  return {
    hasConsent: currentPermissions[permission],
    grantedAt: lastGrant?.timestamp,
    grantedBy: lastGrant?.grantedBy ?? undefined,
    revokedAt: lastRevocation ?? undefined,
    currentPermissions,
  };
}

/**
 * Generate a biometric hash from raw biometric data
 * Uses SHA256 with salt for privacy
 */
export function generateBiometricHash(
  biometricData: string | Buffer,
  salt?: string
): string {
  const effectiveSalt = salt ?? randomBytes(16).toString('hex');
  const hash = createHash('sha256')
    .update(effectiveSalt)
    .update(biometricData)
    .digest('hex');
  return `${effectiveSalt}:${hash}`;
}

/**
 * Verify a biometric hash against raw data
 */
export function verifyBiometricHash(
  storedHash: string,
  biometricData: string | Buffer
): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;

  const computed = createHash('sha256')
    .update(salt)
    .update(biometricData)
    .digest('hex');

  return computed === hash;
}
