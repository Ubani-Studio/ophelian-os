import { z } from 'zod';
import {
  Platform,
  ContentStatus,
  ContentType,
  VoiceProvider,
  SubjectType,
  LicenseType,
  EventType,
  CharacterSource,
  VoiceSource,
  ConsentRecordType,
  ConsentSource,
} from './enums.js';

// Character schemas
export const CreateCharacterSchema = z.object({
  name: z.string().min(1).max(255),
  aliases: z.array(z.string()).default([]),
  bio: z.string().default(''),
  avatarUrl: z.string().nullable().default(null),
  avatarPosition: z.string().default('50% 50%'),
  personaTags: z.array(z.string()).default([]),
  toneAllowed: z.array(z.string()).default([]),
  toneForbidden: z.array(z.string()).default([]),
  systemPrompt: z.string().default(''),
  currentArc: z.string().nullable().default(null),
  timelineState: z.record(z.unknown()).default({}),
  // Identity & source tracking
  source: z.enum([CharacterSource.GENERATED, CharacterSource.PERSONA, CharacterSource.TWIN]).default(CharacterSource.GENERATED),
  realIdentityId: z.string().nullable().default(null),
  biometricHash: z.string().nullable().default(null),
});
export type CreateCharacterInput = z.infer<typeof CreateCharacterSchema>;

export const CharacterSchema = CreateCharacterSchema.extend({
  id: z.string().cuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Character = z.infer<typeof CharacterSchema>;

// VoiceProfile schemas
export const CreateVoiceProfileSchema = z.object({
  provider: z.enum([VoiceProvider.ELEVENLABS, VoiceProvider.CHROMOX, VoiceProvider.NONE]),
  providerVoiceId: z.string().nullable().default(null),
  label: z.string().min(1).max(255),
  meta: z.record(z.unknown()).default({}),
  // Identity & source tracking
  source: z.enum([VoiceSource.UPLOADED, VoiceSource.PERSONA, VoiceSource.CLONED, VoiceSource.SYNTHESIZED]).default(VoiceSource.SYNTHESIZED),
  realIdentityId: z.string().nullable().default(null),
  biometricHash: z.string().nullable().default(null),
});
export type CreateVoiceProfileInput = z.infer<typeof CreateVoiceProfileSchema>;

export const VoiceProfileSchema = CreateVoiceProfileSchema.extend({
  id: z.string().cuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  // o8 Provenance integration (deprecated - use realIdentityId)
  o8IdentityId: z.string().nullable().optional(),
  voiceFingerprint: z.string().nullable().optional(),
});
export type VoiceProfile = z.infer<typeof VoiceProfileSchema>;

// Royalty splits schema
export const RoyaltySplitsSchema = z.object({
  voiceActor: z.number().min(0).max(100),
  creator: z.number().min(0).max(100),
  platform: z.number().min(0).max(100),
});
export type RoyaltySplits = z.infer<typeof RoyaltySplitsSchema>;

// License schemas
export const CreateLicenseSchema = z.object({
  ownerId: z.string().min(1),
  subjectType: z.enum([SubjectType.VOICE, SubjectType.CHARACTER]),
  subjectId: z.string().min(1),
  consentSynthesis: z.boolean().default(false),
  consentTraining: z.boolean().default(false),
  commercialUse: z.boolean().default(false),
  licenseType: z.enum([LicenseType.EXCLUSIVE, LicenseType.NON_EXCLUSIVE, LicenseType.REVSHARE]),
  royaltySplits: RoyaltySplitsSchema.default({ voiceActor: 50, creator: 30, platform: 20 }),
  terms: z.string().nullable().default(null),
  // Public-facing token (short, memorable - e.g., "FX-91A")
  publicToken: z.string().nullable().default(null),
});
export type CreateLicenseInput = z.infer<typeof CreateLicenseSchema>;

export const LicenseSchema = CreateLicenseSchema.extend({
  id: z.string().cuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type License = z.infer<typeof LicenseSchema>;

// Consent permissions - what was consented to
export const ConsentPermissionsSchema = z.object({
  synthesis: z.boolean().default(false),      // Allow voice/visual synthesis
  training: z.boolean().default(false),       // Allow AI training on data
  commercial: z.boolean().default(false),     // Allow commercial use
  modification: z.boolean().default(false),   // Allow modifications
  attribution: z.boolean().default(true),     // Require attribution
  derivativeWorks: z.boolean().default(false), // Allow derivative works
});
export type ConsentPermissions = z.infer<typeof ConsentPermissionsSchema>;

// Consent record - immutable audit trail entry
export const CreateConsentRecordSchema = z.object({
  type: z.enum([
    ConsentRecordType.CREATION,
    ConsentRecordType.SYNTHESIS,
    ConsentRecordType.TRAINING,
    ConsentRecordType.COMMERCIAL_USE,
    ConsentRecordType.MODIFICATION,
    ConsentRecordType.PERSONA_IMPORT,
    ConsentRecordType.REVOCATION,
  ]),
  source: z.enum([
    ConsentSource.USER,
    ConsentSource.O8,
    ConsentSource.STARFORGE,
    ConsentSource.SEMBLA,
    ConsentSource.API,
  ]),
  sourceId: z.string().nullable().default(null),    // ID from external system
  grantedBy: z.string().nullable().default(null),   // Email or user ID
  permissions: ConsentPermissionsSchema,
  terms: z.string().nullable().default(null),       // Link to terms accepted
  metadata: z.record(z.unknown()).default({}),
  // Link to subject (one of these should be set)
  characterId: z.string().nullable().default(null),
  voiceProfileId: z.string().nullable().default(null),
  licenseId: z.string().nullable().default(null),
  genomeId: z.string().nullable().default(null),
});
export type CreateConsentRecordInput = z.infer<typeof CreateConsentRecordSchema>;

export const ConsentRecordSchema = CreateConsentRecordSchema.extend({
  id: z.string().cuid(),
  timestamp: z.date(),
  previousHash: z.string().nullable(),  // SHA256 of previous record
  hash: z.string(),                     // SHA256 of this record
});
export type ConsentRecord = z.infer<typeof ConsentRecordSchema>;

// ContentItem schemas
export const CreateContentItemSchema = z.object({
  characterId: z.string().min(1),
  platform: z.enum([Platform.X, Platform.TIKTOK, Platform.INSTAGRAM]),
  contentType: z.enum([ContentType.POST, ContentType.SCRIPT]).default(ContentType.POST),
  text: z.string().default(''),
  status: z
    .enum([ContentStatus.DRAFT, ContentStatus.APPROVED, ContentStatus.PUBLISHED, ContentStatus.FAILED])
    .default(ContentStatus.DRAFT),
  scheduledFor: z.date().nullable().default(null),
  publishedUrl: z.string().nullable().default(null),
  meta: z.record(z.unknown()).default({}),
});
export type CreateContentItemInput = z.infer<typeof CreateContentItemSchema>;

export const ContentItemSchema = CreateContentItemSchema.extend({
  id: z.string().cuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type ContentItem = z.infer<typeof ContentItemSchema>;

// UsageEvent schemas
export const CreateUsageEventSchema = z.object({
  eventType: z.enum([EventType.VOICE_SYNTHESIS, EventType.PUBLISH]),
  characterId: z.string().nullable().default(null),
  voiceProfileId: z.string().nullable().default(null),
  contentItemId: z.string().nullable().default(null),
  platform: z.enum([Platform.X, Platform.TIKTOK, Platform.INSTAGRAM]).nullable().default(null),
  seconds: z.number().nullable().default(null),
  revenueCents: z.number().int().default(0),
  meta: z.record(z.unknown()).default({}),
});
export type CreateUsageEventInput = z.infer<typeof CreateUsageEventSchema>;

export const UsageEventSchema = CreateUsageEventSchema.extend({
  id: z.string().cuid(),
  createdAt: z.date(),
});
export type UsageEvent = z.infer<typeof UsageEventSchema>;

// Relationship schemas
export const RelationshipTypeEnum = z.enum([
  'FRIEND',
  'RIVAL',
  'MENTOR',
  'STUDENT',
  'FAMILY',
  'ROMANTIC',
  'ENEMY',
  'ALLY',
  'NEUTRAL',
]);
export type RelationshipType = z.infer<typeof RelationshipTypeEnum>;

export const CreateRelationshipSchema = z.object({
  characterAId: z.string().min(1),
  characterBId: z.string().min(1),
  relationshipType: RelationshipTypeEnum,
  strength: z.number().min(0).max(100).default(50),
  isPublic: z.boolean().default(true),
  description: z.string().nullable().default(null),
  history: z.array(z.object({
    timestamp: z.date(),
    event: z.string(),
    impactOnStrength: z.number(),
  })).default([]),
  meta: z.record(z.unknown()).default({}),
});
export type CreateRelationshipInput = z.infer<typeof CreateRelationshipSchema>;

export const RelationshipSchema = CreateRelationshipSchema.extend({
  id: z.string().cuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Relationship = z.infer<typeof RelationshipSchema>;

// API request schemas
export const GenerateContentRequestSchema = z.object({
  characterId: z.string().min(1),
  platform: z.enum([Platform.X, Platform.TIKTOK, Platform.INSTAGRAM]),
  intent: z.string().min(1),
  genomeData: z
    .object({
      orisha: z.string(),
      sephira: z.string(),
      lClass: z.string(),
    })
    .optional(),
});
export type GenerateContentRequest = z.infer<typeof GenerateContentRequestSchema>;

export const SettlementQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
});
export type SettlementQuery = z.infer<typeof SettlementQuerySchema>;

// Transmedia Story Engine schemas
export const StoryBeatTypeEnum = z.enum([
  'INTRODUCTION',
  'INCITING_INCIDENT',
  'RISING_ACTION',
  'CLIMAX',
  'FALLING_ACTION',
  'RESOLUTION',
  'CLIFFHANGER',
  'REVELATION',
  'REFLECTION',
  'TRANSFORMATION',
]);
export type StoryBeatType = z.infer<typeof StoryBeatTypeEnum>;

export const MediaTypeEnum = z.enum([
  'TEXT',
  'AUDIO',
  'VISUAL',
  'VIDEO',
  'INTERACTIVE',
]);
export type MediaType = z.infer<typeof MediaTypeEnum>;

export const PlatformTargetEnum = z.enum([
  'TWITTER',
  'INSTAGRAM',
  'TIKTOK',
  'PODCAST',
  'BLOG',
  'NEWSLETTER',
  'YOUTUBE',
]);
export type PlatformTarget = z.infer<typeof PlatformTargetEnum>;

export const StoryArcSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  theme: z.string(),
  targetAudience: z.string(),
  estimatedDuration: z.string(), // e.g., "3 episodes", "10 posts", "5 minutes"
});
export type StoryArc = z.infer<typeof StoryArcSchema>;

export const MediaAdaptationSchema = z.object({
  mediaType: MediaTypeEnum,
  platform: PlatformTargetEnum.optional(),
  content: z.string(),
  metadata: z.record(z.unknown()).default({}),
  duration: z.number().optional(), // seconds for audio/video
  wordCount: z.number().optional(), // for text
  imagePrompt: z.string().optional(), // for visual generation
});
export type MediaAdaptation = z.infer<typeof MediaAdaptationSchema>;

export const StoryBeatSchema = z.object({
  beatType: StoryBeatTypeEnum,
  coreNarrative: z.string().min(1), // Platform-agnostic story content
  emotionalTone: z.string(),
  characterIds: z.array(z.string()),
  relationshipDynamics: z.array(z.object({
    relationshipId: z.string(),
    evolutionNote: z.string(), // How this beat affects the relationship
  })).optional(),
  adaptations: z.array(MediaAdaptationSchema),
  sequenceOrder: z.number(),
  metadata: z.record(z.unknown()).default({}),
});
export type StoryBeat = z.infer<typeof StoryBeatSchema>;

export const CreateTransmediaStorySchema = z.object({
  title: z.string().min(1),
  arc: StoryArcSchema,
  primaryCharacterId: z.string().min(1),
  supportingCharacterIds: z.array(z.string()).default([]),
  targetMediaTypes: z.array(MediaTypeEnum),
  targetPlatforms: z.array(PlatformTargetEnum),
  genre: z.string(),
  tags: z.array(z.string()).default([]),
});
export type CreateTransmediaStoryInput = z.infer<typeof CreateTransmediaStorySchema>;

export const TransmediaStorySchema = CreateTransmediaStorySchema.extend({
  id: z.string(),
  beats: z.array(StoryBeatSchema),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'PUBLISHED', 'COMPLETED']),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type TransmediaStory = z.infer<typeof TransmediaStorySchema>;

// Collaborative Universe schemas
export const CharacterPermissionSchema = z.object({
  characterId: z.string(),
  ownerId: z.string(),
  permissions: z.object({
    canRead: z.boolean().default(true),
    canUseInStories: z.boolean().default(false),
    canModifyRelationships: z.boolean().default(false),
    canAdaptPersonality: z.boolean().default(false),
  }),
  licenseTerms: z.string().optional(),
  royaltyShare: z.number().min(0).max(100).optional(), // Percentage for revenue sharing
});
export type CharacterPermission = z.infer<typeof CharacterPermissionSchema>;

export const UniverseMemberSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  role: z.enum(['CREATOR', 'CONTRIBUTOR', 'VIEWER']),
  joinedAt: z.date(),
  contributionCount: z.number().default(0),
});
export type UniverseMember = z.infer<typeof UniverseMemberSchema>;

export const CanonEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  timestamp: z.string(), // In-universe timeline
  affectedCharacters: z.array(z.string()),
  createdBy: z.string(), // userId
  isCanon: z.boolean().default(true),
  votes: z.object({
    approve: z.number().default(0),
    reject: z.number().default(0),
  }),
});
export type CanonEvent = z.infer<typeof CanonEventSchema>;

export const CreateUniverseSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  genre: z.string(),
  setting: z.string(), // e.g., "Modern Earth", "Fantasy Realm", "Sci-Fi Future"
  rules: z.array(z.string()).default([]), // World-building rules
  isPublic: z.boolean().default(false),
  allowContributions: z.boolean().default(true),
  requiresApproval: z.boolean().default(true), // New contributions need approval
  tags: z.array(z.string()).default([]),
});
export type CreateUniverseInput = z.infer<typeof CreateUniverseSchema>;

export const UniverseSchema = CreateUniverseSchema.extend({
  id: z.string(),
  creatorId: z.string(),
  creatorName: z.string(),
  members: z.array(UniverseMemberSchema),
  characterPermissions: z.array(CharacterPermissionSchema),
  canonEvents: z.array(CanonEventSchema),
  storyIds: z.array(z.string()).default([]), // TransmediaStory IDs in this universe
  characterIds: z.array(z.string()).default([]), // Character IDs in this universe
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Universe = z.infer<typeof UniverseSchema>;

export const UniverseInvitationSchema = z.object({
  id: z.string(),
  universeId: z.string(),
  universeName: z.string(),
  fromUserId: z.string(),
  fromUserName: z.string(),
  toUserId: z.string(),
  toUserName: z.string(),
  role: z.enum(['CONTRIBUTOR', 'VIEWER']),
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED']),
  message: z.string().optional(),
  createdAt: z.date(),
  respondedAt: z.date().optional(),
});
export type UniverseInvitation = z.infer<typeof UniverseInvitationSchema>;

// Character Merchandise schemas
export const MerchProductTypeEnum = z.enum([
  'T_SHIRT',
  'HOODIE',
  'MUG',
  'POSTER',
  'STICKER',
  'PHONE_CASE',
  'TOTE_BAG',
  'NOTEBOOK',
  'PILLOW',
  'CANVAS_PRINT',
]);
export type MerchProductType = z.infer<typeof MerchProductTypeEnum>;

export const MerchDesignSchema = z.object({
  id: z.string(),
  characterId: z.string(),
  designName: z.string(),
  imageUrl: z.string(),
  imagePrompt: z.string(), // AI prompt used to generate the design
  genomeInspired: z.boolean().default(true), // Generated from character genome
  colors: z.array(z.string()), // Hex color codes from character visual signature
  style: z.string(), // e.g., "minimalist", "detailed", "abstract"
  consentToken: z.string().optional(), // Consent tracking for design usage
  createdAt: z.date(),
});
export type MerchDesign = z.infer<typeof MerchDesignSchema>;

export const MerchProductVariantSchema = z.object({
  size: z.string(), // "S", "M", "L", "XL", etc.
  color: z.string(),
  price: z.number(), // In cents
  printfulVariantId: z.string().optional(), // Printful variant ID
});
export type MerchProductVariant = z.infer<typeof MerchProductVariantSchema>;

export const CreateMerchProductSchema = z.object({
  characterId: z.string().min(1),
  designId: z.string().min(1),
  productType: MerchProductTypeEnum,
  title: z.string().min(1),
  description: z.string(),
  basePrice: z.number().min(0), // In cents
  variants: z.array(MerchProductVariantSchema),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});
export type CreateMerchProductInput = z.infer<typeof CreateMerchProductSchema>;

export const MerchProductSchema = CreateMerchProductSchema.extend({
  id: z.string(),
  creatorId: z.string(),
  creatorName: z.string(),
  salesCount: z.number().default(0),
  revenue: z.number().default(0), // Total revenue in cents
  revenueShare: z.object({
    creator: z.number(), // Percentage
    platform: z.number(), // Percentage
    printProvider: z.number(), // Percentage (cost)
  }),
  printfulProductId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type MerchProduct = z.infer<typeof MerchProductSchema>;

export const MerchOrderSchema = z.object({
  id: z.string(),
  productId: z.string(),
  characterId: z.string(),
  buyerEmail: z.string().email(),
  variantSize: z.string(),
  variantColor: z.string(),
  quantity: z.number().min(1),
  totalPrice: z.number(), // In cents
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  printfulOrderId: z.string().optional(),
  trackingNumber: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type MerchOrder = z.infer<typeof MerchOrderSchema>;
