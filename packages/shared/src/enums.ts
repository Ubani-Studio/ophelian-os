export const Platform = {
  X: 'X',
  TIKTOK: 'TIKTOK',
  INSTAGRAM: 'INSTAGRAM',
} as const;
export type Platform = (typeof Platform)[keyof typeof Platform];

export const ContentStatus = {
  DRAFT: 'DRAFT',
  APPROVED: 'APPROVED',
  PUBLISHED: 'PUBLISHED',
  FAILED: 'FAILED',
} as const;
export type ContentStatus = (typeof ContentStatus)[keyof typeof ContentStatus];

export const ContentType = {
  POST: 'POST',
  SCRIPT: 'SCRIPT',
} as const;
export type ContentType = (typeof ContentType)[keyof typeof ContentType];

export const VoiceProvider = {
  ELEVENLABS: 'ELEVENLABS',
  CHROMOX: 'CHROMOX',
  NONE: 'NONE',
} as const;
export type VoiceProvider = (typeof VoiceProvider)[keyof typeof VoiceProvider];

export const SubjectType = {
  VOICE: 'VOICE',
  CHARACTER: 'CHARACTER',
} as const;
export type SubjectType = (typeof SubjectType)[keyof typeof SubjectType];

export const LicenseType = {
  EXCLUSIVE: 'EXCLUSIVE',
  NON_EXCLUSIVE: 'NON_EXCLUSIVE',
  REVSHARE: 'REVSHARE',
} as const;
export type LicenseType = (typeof LicenseType)[keyof typeof LicenseType];

export const EventType = {
  VOICE_SYNTHESIS: 'VOICE_SYNTHESIS',
  PUBLISH: 'PUBLISH',
} as const;
export type EventType = (typeof EventType)[keyof typeof EventType];

export const LicenseAction = {
  SYNTHESIZE_VOICE: 'SYNTHESIZE_VOICE',
  TRAIN_VOICE: 'TRAIN_VOICE',
  PUBLISH_CONTENT: 'PUBLISH_CONTENT',
} as const;
export type LicenseAction = (typeof LicenseAction)[keyof typeof LicenseAction];

// Character source - where the identity came from
export const CharacterSource = {
  GENERATED: 'GENERATED',   // Created by Oripheon generator (fictional)
  PERSONA: 'PERSONA',       // Real person's public identity (from Sembla/o8)
  TWIN: 'TWIN',             // Imported from Starforge Twin OS
} as const;
export type CharacterSource = (typeof CharacterSource)[keyof typeof CharacterSource];

// Voice source - how the voice was created
export const VoiceSource = {
  UPLOADED: 'UPLOADED',       // User uploaded voice sample
  PERSONA: 'PERSONA',         // Imported from real identity (Sembla/o8)
  CLONED: 'CLONED',           // Voice cloned via provider
  SYNTHESIZED: 'SYNTHESIZED', // Pure AI synthesis
} as const;
export type VoiceSource = (typeof VoiceSource)[keyof typeof VoiceSource];

// Consent record types for audit trail
export const ConsentRecordType = {
  CREATION: 'CREATION',             // Character/genome created with consent
  SYNTHESIS: 'SYNTHESIS',           // Voice/visual synthesis consent
  TRAINING: 'TRAINING',             // AI training consent
  COMMERCIAL_USE: 'COMMERCIAL_USE', // Commercial licensing consent
  MODIFICATION: 'MODIFICATION',     // Character modified
  PERSONA_IMPORT: 'PERSONA_IMPORT', // Imported from real identity
  REVOCATION: 'REVOCATION',         // Consent revoked
} as const;
export type ConsentRecordType = (typeof ConsentRecordType)[keyof typeof ConsentRecordType];

// Consent source - where the consent came from
export const ConsentSource = {
  USER: 'user',           // Direct user consent
  O8: 'o8',               // o8 Protocol identity
  STARFORGE: 'starforge', // Starforge Twin OS
  SEMBLA: 'sembla',       // Sembla face registration
  API: 'api',             // Programmatic API consent
} as const;
export type ConsentSource = (typeof ConsentSource)[keyof typeof ConsentSource];
