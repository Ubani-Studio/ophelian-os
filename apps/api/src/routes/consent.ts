import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import {
  CreateConsentRecordSchema,
  ConsentRecordType,
  ConsentSource,
  CharacterSource,
} from '@lcos/shared';
import {
  buildConsentRecord,
  verifyConsentChain,
  checkConsentForPermission,
  generateLicenseToken,
  generateBiometricHash,
} from '@lcos/rights';
import type { ConsentRecord } from '@prisma/client';

export async function consentRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /consent/records - Create a new consent record
  fastify.post('/consent/records', async (request, reply) => {
    try {
      const body = CreateConsentRecordSchema.parse(request.body);

      // Get the last record for this subject to build the chain
      let previousHash: string | null = null;
      if (body.characterId) {
        const lastRecord = await prisma.consentRecord.findFirst({
          where: { characterId: body.characterId },
          orderBy: { timestamp: 'desc' },
        });
        previousHash = lastRecord?.hash ?? null;
      } else if (body.voiceProfileId) {
        const lastRecord = await prisma.consentRecord.findFirst({
          where: { voiceProfileId: body.voiceProfileId },
          orderBy: { timestamp: 'desc' },
        });
        previousHash = lastRecord?.hash ?? null;
      } else if (body.licenseId) {
        const lastRecord = await prisma.consentRecord.findFirst({
          where: { licenseId: body.licenseId },
          orderBy: { timestamp: 'desc' },
        });
        previousHash = lastRecord?.hash ?? null;
      } else if (body.genomeId) {
        const lastRecord = await prisma.consentRecord.findFirst({
          where: { genomeId: body.genomeId },
          orderBy: { timestamp: 'desc' },
        });
        previousHash = lastRecord?.hash ?? null;
      }

      // Build the consent record with hash chain
      const recordData = buildConsentRecord({
        type: body.type as any,
        source: body.source as any,
        sourceId: body.sourceId,
        grantedBy: body.grantedBy,
        permissions: body.permissions,
        terms: body.terms,
        metadata: body.metadata as Record<string, unknown>,
        previousHash,
        characterId: body.characterId,
        voiceProfileId: body.voiceProfileId,
        licenseId: body.licenseId,
        genomeId: body.genomeId,
      });

      const record = await prisma.consentRecord.create({
        data: {
          type: recordData.type,
          timestamp: recordData.timestamp,
          previousHash: recordData.previousHash,
          hash: recordData.hash,
          source: recordData.source,
          sourceId: recordData.sourceId,
          grantedBy: recordData.grantedBy,
          permissions: recordData.permissions as any,
          terms: recordData.terms,
          metadata: recordData.metadata as any,
          characterId: recordData.characterId,
          voiceProfileId: recordData.voiceProfileId,
          licenseId: recordData.licenseId,
          genomeId: recordData.genomeId,
        },
      });

      return reply.code(201).send(record);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Validation error', details: error });
      }
      throw error;
    }
  });

  // GET /consent/characters/:id - Get consent chain for a character
  fastify.get<{ Params: { id: string } }>('/consent/characters/:id', async (request, reply) => {
    const { id } = request.params;

    const records = await prisma.consentRecord.findMany({
      where: { characterId: id },
      orderBy: { timestamp: 'asc' },
    });

    // Convert to the format expected by verifyConsentChain
    const typedRecords = records.map((r) => ({
      ...r,
      timestamp: r.timestamp,
      permissions: r.permissions as any,
      metadata: r.metadata as Record<string, unknown>,
    }));

    const verification = verifyConsentChain(typedRecords as any);

    return reply.send({
      records,
      verification,
    });
  });

  // GET /consent/characters/:id/verify - Verify consent chain integrity
  fastify.get<{ Params: { id: string } }>('/consent/characters/:id/verify', async (request, reply) => {
    const { id } = request.params;

    const records = await prisma.consentRecord.findMany({
      where: { characterId: id },
      orderBy: { timestamp: 'asc' },
    });

    const typedRecords = records.map((r) => ({
      ...r,
      timestamp: r.timestamp,
      permissions: r.permissions as any,
      metadata: r.metadata as Record<string, unknown>,
    }));

    const verification = verifyConsentChain(typedRecords as any);

    return reply.send(verification);
  });

  // GET /consent/characters/:id/check/:permission - Check if consent exists for a permission
  fastify.get<{ Params: { id: string; permission: string } }>(
    '/consent/characters/:id/check/:permission',
    async (request, reply) => {
      const { id, permission } = request.params;

      const validPermissions = ['synthesis', 'training', 'commercial', 'modification', 'attribution', 'derivativeWorks'];
      if (!validPermissions.includes(permission)) {
        return reply.code(400).send({ error: `Invalid permission. Must be one of: ${validPermissions.join(', ')}` });
      }

      const records = await prisma.consentRecord.findMany({
        where: { characterId: id },
        orderBy: { timestamp: 'asc' },
      });

      const typedRecords = records.map((r) => ({
        ...r,
        timestamp: r.timestamp,
        permissions: r.permissions as any,
        metadata: r.metadata as Record<string, unknown>,
      }));

      const result = checkConsentForPermission(typedRecords as any, permission as any);

      return reply.send(result);
    }
  );

  // POST /consent/characters/:id/revoke - Revoke consent for a character
  fastify.post<{ Params: { id: string } }>('/consent/characters/:id/revoke', async (request, reply) => {
    const { id } = request.params;
    const body = request.body as { grantedBy?: string; reason?: string };

    const character = await prisma.character.findUnique({ where: { id } });
    if (!character) {
      return reply.code(404).send({ error: 'Character not found' });
    }

    // Get the last record for the chain
    const lastRecord = await prisma.consentRecord.findFirst({
      where: { characterId: id },
      orderBy: { timestamp: 'desc' },
    });

    const recordData = buildConsentRecord({
      type: ConsentRecordType.REVOCATION as any,
      source: ConsentSource.USER as any,
      grantedBy: body.grantedBy,
      permissions: {
        synthesis: false,
        training: false,
        commercial: false,
        modification: false,
        attribution: true,
        derivativeWorks: false,
      },
      metadata: { reason: body.reason },
      previousHash: lastRecord?.hash ?? null,
      characterId: id,
    });

    const record = await prisma.consentRecord.create({
      data: {
        type: recordData.type,
        timestamp: recordData.timestamp,
        previousHash: recordData.previousHash,
        hash: recordData.hash,
        source: recordData.source,
        sourceId: recordData.sourceId,
        grantedBy: recordData.grantedBy,
        permissions: recordData.permissions as any,
        terms: recordData.terms,
        metadata: recordData.metadata as any,
        characterId: recordData.characterId,
      },
    });

    return reply.code(201).send(record);
  });

  // POST /characters/:id/set-source - Set character source and identity link
  fastify.post<{ Params: { id: string } }>('/characters/:id/set-source', async (request, reply) => {
    const { id } = request.params;
    const body = request.body as {
      source: 'GENERATED' | 'PERSONA' | 'TWIN';
      realIdentityId?: string;
      biometricHash?: string;
    };

    const character = await prisma.character.findUnique({ where: { id } });
    if (!character) {
      return reply.code(404).send({ error: 'Character not found' });
    }

    const updated = await prisma.character.update({
      where: { id },
      data: {
        source: body.source,
        realIdentityId: body.realIdentityId ?? null,
        biometricHash: body.biometricHash ?? null,
      },
    });

    // Create a consent record for this change
    const lastRecord = await prisma.consentRecord.findFirst({
      where: { characterId: id },
      orderBy: { timestamp: 'desc' },
    });

    const recordType = body.source === 'GENERATED'
      ? ConsentRecordType.CREATION
      : ConsentRecordType.PERSONA_IMPORT;

    const recordData = buildConsentRecord({
      type: recordType as any,
      source: ConsentSource.API as any,
      sourceId: body.realIdentityId,
      permissions: {
        synthesis: true,
        training: false,
        commercial: false,
        modification: true,
        attribution: true,
        derivativeWorks: false,
      },
      metadata: { source: body.source },
      previousHash: lastRecord?.hash ?? null,
      characterId: id,
    });

    await prisma.consentRecord.create({
      data: {
        type: recordData.type,
        timestamp: recordData.timestamp,
        previousHash: recordData.previousHash,
        hash: recordData.hash,
        source: recordData.source,
        sourceId: recordData.sourceId,
        grantedBy: recordData.grantedBy,
        permissions: recordData.permissions as any,
        terms: recordData.terms,
        metadata: recordData.metadata as any,
        characterId: recordData.characterId,
      },
    });

    return reply.send(updated);
  });

  // POST /characters/import-persona - Import a character from a real identity (Sembla-style)
  fastify.post('/characters/import-persona', async (request, reply) => {
    const body = request.body as {
      name: string;
      email: string;
      realIdentityId: string;
      biometricData?: string; // Raw biometric data to hash
      avatarUrl?: string;
      consent: {
        synthesis: boolean;
        training: boolean;
        commercial: boolean;
        terms?: string;
      };
    };

    // Generate biometric hash if data provided
    const biometricHash = body.biometricData
      ? generateBiometricHash(body.biometricData)
      : null;

    // Create the character with PERSONA source
    const character = await prisma.character.create({
      data: {
        name: body.name,
        source: 'PERSONA',
        realIdentityId: body.realIdentityId,
        biometricHash,
        avatarUrl: body.avatarUrl ?? null,
        bio: `Imported persona for ${body.email}`,
        aliases: [],
        personaTags: ['persona', 'imported'],
        toneAllowed: [],
        toneForbidden: [],
        systemPrompt: '',
        timelineState: {},
      },
    });

    // Create the initial consent record
    const recordData = buildConsentRecord({
      type: ConsentRecordType.PERSONA_IMPORT as any,
      source: ConsentSource.SEMBLA as any,
      sourceId: body.realIdentityId,
      grantedBy: body.email,
      permissions: {
        synthesis: body.consent.synthesis,
        training: body.consent.training,
        commercial: body.consent.commercial,
        modification: false,
        attribution: true,
        derivativeWorks: false,
      },
      terms: body.consent.terms,
      previousHash: null,
      characterId: character.id,
    });

    const consentRecord = await prisma.consentRecord.create({
      data: {
        type: recordData.type,
        timestamp: recordData.timestamp,
        previousHash: recordData.previousHash,
        hash: recordData.hash,
        source: recordData.source,
        sourceId: recordData.sourceId,
        grantedBy: recordData.grantedBy,
        permissions: recordData.permissions as any,
        terms: recordData.terms,
        metadata: recordData.metadata as any,
        characterId: recordData.characterId,
      },
    });

    // Generate a public license token
    const publicToken = generateLicenseToken();

    // Create a license for this persona
    const license = await prisma.license.create({
      data: {
        ownerId: body.email,
        subjectType: 'CHARACTER',
        subjectId: character.id,
        consentSynthesis: body.consent.synthesis,
        consentTraining: body.consent.training,
        commercialUse: body.consent.commercial,
        licenseType: 'NON_EXCLUSIVE',
        royaltySplits: { voiceActor: 70, creator: 20, platform: 10 },
        terms: body.consent.terms,
        publicToken,
      },
    });

    return reply.code(201).send({
      character,
      consentRecord,
      license,
      publicToken,
    });
  });

  // GET /licenses/token/:token - Get license by public token
  fastify.get<{ Params: { token: string } }>('/licenses/token/:token', async (request, reply) => {
    const { token } = request.params;

    const license = await prisma.license.findFirst({
      where: { publicToken: token },
    });

    if (!license) {
      return reply.code(404).send({ error: 'License not found' });
    }

    return reply.send(license);
  });

  // POST /licenses/:id/generate-token - Generate a public token for a license
  fastify.post<{ Params: { id: string } }>('/licenses/:id/generate-token', async (request, reply) => {
    const { id } = request.params;

    const license = await prisma.license.findUnique({ where: { id } });
    if (!license) {
      return reply.code(404).send({ error: 'License not found' });
    }

    if (license.publicToken) {
      return reply.send({ publicToken: license.publicToken, message: 'Token already exists' });
    }

    const publicToken = generateLicenseToken();
    const updated = await prisma.license.update({
      where: { id },
      data: { publicToken },
    });

    return reply.send({ publicToken, license: updated });
  });
}
