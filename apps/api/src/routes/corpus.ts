/**
 * Training corpus routes — Layer 1 (Ibis author corpus) bridge.
 *
 * Lets a Boveda character pull voice samples from Ibis on demand.
 * The pulled samples populate Character.voiceSamples, which the tick
 * prompt already few-shots into the LLM (see lib/tick.ts).
 *
 * This is the smallest valuable slice of the three-layer corpus model:
 *   Layer 1: primary author (this route)
 *   Layer 2: collaborators with consent (future)
 *   Layer 3: character-specific corpus from approved posts (future)
 *
 * Future endpoints to add when Layers 2-3 ship:
 *   POST  /characters/:id/corpus/collaborators           add a consenting collab
 *   DELETE /characters/:id/corpus/collaborators/:userId  revoke a collab
 *   POST  /characters/:id/corpus/post                    auto-collect approved post
 */

import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { pullCorpusFromIbis } from '../lib/ibis-corpus.js';

export async function corpusRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /characters/:id/corpus -- show current corpus state for the character
  fastify.get<{ Params: { id: string } }>(
    '/characters/:id/corpus',
    async (request, reply) => {
      const { id } = request.params;
      const character = await prisma.character.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          authoredBy: true,
          voiceSamples: true,
          tongue: true,
          updatedAt: true,
        },
      });
      if (!character) {
        return reply.status(404).send({ error: 'character_not_found' });
      }

      const samples = Array.isArray(character.voiceSamples)
        ? (character.voiceSamples as unknown[])
        : [];
      return {
        characterId: character.id,
        name: character.name,
        authoredBy: character.authoredBy,
        layer1: {
          source: 'voiceSamples_field',
          sampleCount: samples.length,
          lastUpdated: character.updatedAt,
        },
        layer2_collaborators: { sampleCount: 0, status: 'not_implemented' },
        layer3_character_corpus: { sampleCount: 0, status: 'not_implemented' },
      };
    },
  );

  // POST /characters/:id/corpus/refresh -- pull fresh samples from Ibis
  fastify.post<{
    Params: { id: string };
    Body?: {
      authorIbisUserId?: string;
      tagIds?: string[];
      titleContains?: string;
      maxSamples?: number;
      minWordCount?: number;
      replace?: boolean; // if true, overwrite voiceSamples; else append + dedupe
      dryRun?: boolean;  // if true, return what WOULD be set without writing
    };
  }>('/characters/:id/corpus/refresh', async (request, reply) => {
    const { id } = request.params;
    const body = request.body ?? {};

    const character = await prisma.character.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        authoredBy: true,
        voiceSamples: true,
      },
    });
    if (!character) {
      return reply.status(404).send({ error: 'character_not_found' });
    }

    const result = pullCorpusFromIbis({
      authorIbisUserId: body.authorIbisUserId,
      tagIds: body.tagIds,
      titleContains: body.titleContains ?? character.name,
      maxSamples: body.maxSamples ?? 8,
      minWordCount: body.minWordCount ?? 30,
    });

    // Existing voiceSamples are an array of strings (Boveda's current shape).
    // We store the new corpus as the SAME shape (array of strings) so
    // tick.ts works with no changes. Provenance is preserved on the route
    // response (sample metadata returned), not in the field itself.
    const newSamplesAsStrings = result.samplesReturned.map((s) => s.text);

    let merged: string[];
    if (body.replace) {
      merged = newSamplesAsStrings;
    } else {
      const existing = Array.isArray(character.voiceSamples)
        ? (character.voiceSamples as unknown[]).filter(
            (v): v is string => typeof v === 'string',
          )
        : [];
      const dedupe = new Set([...existing, ...newSamplesAsStrings]);
      merged = Array.from(dedupe).slice(0, 12);
    }

    if (body.dryRun) {
      return {
        characterId: character.id,
        dryRun: true,
        wouldWrite: merged.length,
        ibisResult: result,
      };
    }

    await prisma.character.update({
      where: { id },
      data: { voiceSamples: merged },
    });

    return {
      characterId: character.id,
      written: merged.length,
      ibisResult: result,
    };
  });
}
