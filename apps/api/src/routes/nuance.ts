/**
 * Nuance routes — fill the surprise-mechanic fields for any character.
 *
 *   PATCH /characters/:id/nuance              save tongue/preoccupations/tensions/fixations/voiceSamples
 *   POST  /characters/:id/nuance/auto-generate  ask the LLM to seed nuance from the existing genome
 *
 * Without per-character nuance, every character speaks in the LLM's
 * substrate register. With it, characters diverge.
 */

import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { callLlm, hasLlmProvider } from '../lib/llm.js';

interface NuancePatchBody {
  tongue?: {
    primaryLanguage?: string;
    dialect?: string;
    accent?: string;
    idioms?: string[];
    registerNotes?: string;
  };
  voiceSamples?: string[];
  preoccupations?: string[];
  tensions?: Array<{ beliefA: string; beliefB: string; note?: string }>;
  fixations?: string[];
  authoredBy?: string | null;
  modernity?: {
    anchorEra?: string;
    contemporaryBleed?: number;
    contemporarySlang?: string[];
    contemporaryRefs?: string[];
    refusedSlang?: string[];
  };
  currentLocation?: string | null;
  homeBase?: string | null;
}

interface AutoGenerateBody {
  /** What aspect to generate. If omitted, generates all. */
  fields?: Array<'tongue' | 'voiceSamples' | 'preoccupations' | 'tensions' | 'fixations'>;
  /** Free-text creative direction the LLM uses to bias output. Optional. */
  creativeBrief?: string;
}

export async function nuanceRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.patch<{ Params: { id: string }; Body: NuancePatchBody }>(
    '/characters/:id/nuance',
    async (request, reply) => {
      const { id } = request.params;
      const body = request.body ?? {};
      const character = await prisma.character.findUnique({ where: { id } });
      if (!character) return reply.status(404).send({ error: 'character_not_found' });

      const data: Record<string, unknown> = {};
      if (body.tongue !== undefined) data.tongue = body.tongue;
      if (body.voiceSamples !== undefined) data.voiceSamples = body.voiceSamples;
      if (body.preoccupations !== undefined) data.preoccupations = body.preoccupations;
      if (body.tensions !== undefined) data.tensions = body.tensions;
      if (body.fixations !== undefined) data.fixations = body.fixations;
      if (body.authoredBy !== undefined) data.authoredBy = body.authoredBy;
      if (body.modernity !== undefined) data.modernity = body.modernity;
      if (body.currentLocation !== undefined) data.currentLocation = body.currentLocation;
      if (body.homeBase !== undefined) data.homeBase = body.homeBase;

      const updated = await prisma.character.update({ where: { id }, data });
      return {
        characterId: updated.id,
        tongue: updated.tongue,
        voiceSamples: updated.voiceSamples,
        preoccupations: updated.preoccupations,
        tensions: updated.tensions,
        fixations: updated.fixations,
        authoredBy: updated.authoredBy,
      };
    },
  );

  fastify.post<{ Params: { id: string }; Body: AutoGenerateBody }>(
    '/characters/:id/nuance/auto-generate',
    async (request, reply) => {
      const { id } = request.params;
      const body = request.body ?? {};
      if (!hasLlmProvider()) {
        return reply.status(503).send({
          error: 'llm_provider_not_configured',
          hint: 'set ANTHROPIC_API_KEY in .env so auto-generate can synthesize nuance',
        });
      }
      const character = await prisma.character.findUnique({
        where: { id },
        include: { genome: true },
      });
      if (!character) return reply.status(404).send({ error: 'character_not_found' });

      const fields = body.fields ?? ['tongue', 'voiceSamples', 'preoccupations', 'tensions', 'fixations'];

      const sys =
        'You generate nuance for AI characters in a Living Character OS. Output STRICT JSON only, no prose, no markdown fences.\n\n' +
        'Each character must have a distinct linguistic register, contradictions they hold, and obsessions. ' +
        'Avoid generic LLM register. Be specific, idiosyncratic, plausible. Match the character\'s genome / bio.\n\n' +
        'Output JSON shape (omit fields not requested):\n' +
        '{\n' +
        '  "tongue": { "primaryLanguage": str, "dialect": str, "accent": str, "idioms": [str (8-12)], "registerNotes": str },\n' +
        '  "voiceSamples": [str (3 items, each 60-120 words, in this character\'s actual register including code-switches)],\n' +
        '  "preoccupations": [str (5-7 items, things on the character\'s mind right now)],\n' +
        '  "tensions": [{"beliefA": str, "beliefB": str, "note": str (optional)} (2-3 items, contradictions held simultaneously)],\n' +
        '  "fixations": [str (5-7 items, persistent obsessions)]\n' +
        '}';

      const usr =
        `Character name: ${character.name}\n` +
        `Bio: ${character.bio || '(none)'}\n` +
        `Backstory: ${character.backstory || '(none)'}\n` +
        `Authored by: ${character.authoredBy || '(unset)'}\n` +
        `Existing tongue: ${JSON.stringify(character.tongue)}\n` +
        `Persona tags: ${(character.personaTags ?? []).join(', ') || '(none)'}\n` +
        (body.creativeBrief ? `\nCreative brief: ${body.creativeBrief}\n` : '') +
        `\nGenerate nuance for these fields ONLY: ${fields.join(', ')}. JSON only.`;

      let parsed: Record<string, unknown> = {};
      try {
        const result = await callLlm({ system: sys, user: usr, maxTokens: 2200, cacheSystem: false });
        const text = result.text.trim();
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) throw new Error('no JSON in LLM output');
        parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as Record<string, unknown>;
      } catch (e) {
        return reply.status(502).send({
          error: 'llm_parse_failed',
          detail: (e as Error).message,
        });
      }

      // Apply only the requested fields. Returns the suggestions WITHOUT
      // saving so the user can preview + edit before committing.
      const suggestion: Record<string, unknown> = {};
      for (const f of fields) {
        if (parsed[f] !== undefined) suggestion[f] = parsed[f];
      }
      return { characterId: id, suggestion };
    },
  );
}
