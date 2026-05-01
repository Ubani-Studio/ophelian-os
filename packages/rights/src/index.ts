import { LicenseAction, SubjectType } from '@lcos/shared';
import type { License } from '@lcos/shared';

export interface ValidationResult {
  allowed: boolean;
  reason: string;
}

export function validateLicenseForAction(
  action: LicenseAction,
  license: License | null
): ValidationResult {
  if (!license) {
    return {
      allowed: false,
      reason: 'No license found for this subject',
    };
  }

  switch (action) {
    case LicenseAction.SYNTHESIZE_VOICE:
      return validateSynthesizeVoice(license);

    case LicenseAction.TRAIN_VOICE:
      return validateTrainVoice(license);

    case LicenseAction.PUBLISH_CONTENT:
      return validatePublishContent(license);

    default:
      return {
        allowed: false,
        reason: `Unknown action: ${action}`,
      };
  }
}

function validateSynthesizeVoice(license: License): ValidationResult {
  if (license.subjectType !== SubjectType.VOICE) {
    return {
      allowed: false,
      reason: 'License is not for a voice subject',
    };
  }

  if (!license.consentSynthesis) {
    return {
      allowed: false,
      reason: 'Voice synthesis consent not granted',
    };
  }

  return {
    allowed: true,
    reason: 'Voice synthesis permitted by license',
  };
}

function validateTrainVoice(license: License): ValidationResult {
  if (license.subjectType !== SubjectType.VOICE) {
    return {
      allowed: false,
      reason: 'License is not for a voice subject',
    };
  }

  if (!license.consentTraining) {
    return {
      allowed: false,
      reason: 'Voice training consent not granted',
    };
  }

  return {
    allowed: true,
    reason: 'Voice training permitted by license',
  };
}

function validatePublishContent(license: License): ValidationResult {
  if (!license.commercialUse) {
    return {
      allowed: false,
      reason: 'Commercial use not permitted by license',
    };
  }

  return {
    allowed: true,
    reason: 'Content publishing permitted by license',
  };
}

export function calculateRoyaltySplit(
  revenueCents: number,
  royaltySplits: { voiceActor: number; creator: number; platform: number }
): { voiceActor: number; creator: number; platform: number } {
  const total = royaltySplits.voiceActor + royaltySplits.creator + royaltySplits.platform;
  if (total === 0) {
    return { voiceActor: 0, creator: 0, platform: 0 };
  }

  return {
    voiceActor: Math.floor((revenueCents * royaltySplits.voiceActor) / total),
    creator: Math.floor((revenueCents * royaltySplits.creator) / total),
    platform: revenueCents - Math.floor((revenueCents * royaltySplits.voiceActor) / total) - Math.floor((revenueCents * royaltySplits.creator) / total),
  };
}

export function isLicenseActive(_license: License): boolean {
  // For MVP, all licenses are considered active
  // Future: check expiration dates, revocation status, etc.
  return true;
}

export { LicenseAction, SubjectType } from '@lcos/shared';

// o8 Protocol integration
export {
  getO8Identity,
  getO8License,
  validateVoiceUsage,
  getVoiceRoyaltyRate,
  linkBovedaGenome,
  getVoiceDNA,
  type O8Identity,
  type O8LicensingTerms,
  type O8VoiceDNA,
  type VoiceUsageValidation,
} from './o8-client.js';

// Consent chain utilities
export {
  generateLicenseToken,
  computeConsentHash,
  buildConsentRecord,
  verifyConsentChain,
  checkConsentForPermission,
  generateBiometricHash,
  verifyBiometricHash,
  type BuildConsentRecordOptions,
  type ChainVerificationResult,
  type ConsentCheckResult,
} from './consent.js';

// Re-export consent types from shared
export {
  ConsentRecordType,
  ConsentSource,
  CharacterSource,
  VoiceSource,
} from '@lcos/shared';
