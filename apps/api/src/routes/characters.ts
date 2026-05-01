import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import {
  filterLockedUpdates,
  isFieldLocked,
  type LockableField,
} from '../lib/identity-lock.js';

/**
 * Bóveda's legacy Oripheon bio template starts with `<name> is a `.
 * When a character is later renamed (e.g. bound to a Tizita persona
 * called Triarch but originally rolled as "Nnamdi Anyanwu"), the
 * baked name in the bio drifts from the canonical Character.name.
 * This helper reconciles by extracting the leading subject and
 * regex-replacing it (case-insensitive, whole occurrences) with
 * the canonical name. Operates on bio + systemPrompt.
 */
function reconcileBakedName(text: string, canonicalName: string): string {
  if (!text) return text;
  const match = text.match(/^([^\n]+?) is a /);
  if (!match) return text;
  const baked = match[1].trim();
  if (!baked || baked.toLowerCase() === canonicalName.toLowerCase()) return text;
  const escaped = baked.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(escaped, 'gi'), canonicalName);
}
import { CreateCharacterSchema } from '@lcos/shared';
import {
  generateCharacter,
  generateCharacterWithSeed,
  rerollCharacter,
  generateLCOSCharacter,
  deriveHexagramReading,
  getSubtasteDesignation,
  generateOroCulturalName,
  listOroCultures,
  type OroCultureId,
  type OroMode,
  type OroForm,
  type OroGender,
  type OroArchetype,
} from '@lcos/oripheon';

export async function characterRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /characters - Create a new character
  fastify.post('/characters', async (request, reply) => {
    try {
      const body = CreateCharacterSchema.parse(request.body);

      const character = await prisma.character.create({
        data: body as any,
      });

      return reply.code(201).send(character);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Validation error', details: error });
      }
      throw error;
    }
  });

  // GET /characters - List all characters. Enriches Tizita-bound
  // characters with their representative photo URL so list views
  // (e.g. operators cards) can render real faces without each card
  // fanning out to Tizita on its own.
  fastify.get('/characters', async (_request, reply) => {
    const characters = await prisma.character.findMany({
      orderBy: { createdAt: 'desc' },
      include: { position: true },
    });

    const tizitaBound = characters.filter((c) => c.tizitaPersonaId);
    let repByPersonaId: Map<string, string> | null = null;
    let tizitaBase = '';
    if (tizitaBound.length > 0) {
      const TIZITA_API_URL = (process.env.TIZITA_API_URL || 'http://localhost:8001/api/v1').replace(/\/$/, '');
      tizitaBase = TIZITA_API_URL.replace(/\/api\/v1$/, '');
      try {
        const res = await fetch(`${TIZITA_API_URL}/personas/`, {
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const json = await res.json() as { personas?: Array<{ id: string; representative_photo_url?: string | null }> };
          repByPersonaId = new Map();
          for (const p of json.personas ?? []) {
            if (p.representative_photo_url) {
              const fullUrl = p.representative_photo_url.startsWith('http')
                ? p.representative_photo_url
                : `${tizitaBase}${p.representative_photo_url}`;
              repByPersonaId.set(p.id, fullUrl);
            }
          }
        }
      } catch {
        // Tizita unreachable; characters render without representative photos
      }
    }

    const enriched = characters.map((c) => {
      if (c.tizitaPersonaId && repByPersonaId) {
        const repUrl = repByPersonaId.get(c.tizitaPersonaId);
        if (repUrl) {
          return { ...c, tizitaRepresentativeUrl: repUrl };
        }
      }
      return c;
    });

    return reply.send(enriched);
  });

  // GET /characters/:id - Get a character by ID
  fastify.get<{ Params: { id: string } }>('/characters/:id', async (request, reply) => {
    const { id } = request.params;

    const character = await prisma.character.findUnique({
      where: { id },
      include: { position: true },
    });

    if (!character) {
      return reply.code(404).send({ error: 'Character not found' });
    }

    // Enrich with Tizita representative URL when bound, mirroring the
    // list endpoint so the detail page's avatar fallback works without
    // a second round-trip.
    if (character.tizitaPersonaId) {
      const TIZITA_API_URL = (process.env.TIZITA_API_URL || 'http://localhost:8001/api/v1').replace(/\/$/, '');
      try {
        const res = await fetch(`${TIZITA_API_URL}/personas/${character.tizitaPersonaId}`, {
          signal: AbortSignal.timeout(4000),
        });
        if (res.ok) {
          const persona = await res.json() as { representative_photo_url?: string | null };
          const repUrl = persona.representative_photo_url;
          if (repUrl) {
            const tizitaBase = TIZITA_API_URL.replace(/\/api\/v1$/, '');
            const fullUrl = repUrl.startsWith('http') ? repUrl : `${tizitaBase}${repUrl}`;
            return reply.send({ ...character, tizitaRepresentativeUrl: fullUrl });
          }
        }
      } catch {
        // Tizita unreachable; fall through with the unenriched character
      }
    }

    return reply.send(character);
  });

  // PATCH /characters/:id - Update a character
  fastify.patch<{ Params: { id: string } }>('/characters/:id', async (request, reply) => {
    const { id } = request.params;
    const body = request.body as {
      name?: string;
      bio?: string;
      backstory?: string;
      avatarUrl?: string;
      avatarPosition?: string;
      aliases?: string[];
      personaTags?: string[];
      toneAllowed?: string[];
      toneForbidden?: string[];
      systemPrompt?: string;
      currentArc?: string | null;
      timelineState?: Record<string, unknown>;
      worldId?: string | null;
      authoredBy?: string | null;
      voiceSamples?: string[];
      compositionKind?: 'solo' | 'duo' | 'group' | 'collective';
      tongue?: {
        primaryLanguage?: string;
        dialect?: string;
        accent?: string;
        idioms?: string[];
        registerNotes?: string;
      } | null;
    };

    const character = await prisma.character.findUnique({
      where: { id },
    });

    if (!character) {
      return reply.code(404).send({ error: 'Character not found' });
    }

    const { timelineState, tongue, voiceSamples, ...rest } = body;
    const updated = await prisma.character.update({
      where: { id },
      data: {
        ...rest,
        ...(timelineState !== undefined && {
          timelineState: timelineState as Prisma.InputJsonValue,
        }),
        ...(tongue !== undefined && {
          tongue: (tongue ?? {}) as Prisma.InputJsonValue,
        }),
        ...(voiceSamples !== undefined && {
          voiceSamples: voiceSamples as unknown as Prisma.InputJsonValue,
        }),
      },
    });

    // Bidirectional sync to Tizita: bio → appearance_notes, name →
    // display_name. Fire-and-forget; failure here doesn't fail the
    // Bóveda update, and the next bulk-import will reconcile.
    if (updated.tizitaPersonaId && (typeof body.bio === 'string' || typeof body.name === 'string')) {
      const TIZITA_API_URL = (process.env.TIZITA_API_URL || 'http://localhost:8001/api/v1').replace(/\/$/, '');
      const tizitaPatch: Record<string, string> = {};
      if (typeof body.bio === 'string') tizitaPatch.appearance_notes = body.bio;
      if (typeof body.name === 'string') tizitaPatch.display_name = body.name;
      void fetch(`${TIZITA_API_URL}/personas/${updated.tizitaPersonaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tizitaPatch),
        signal: AbortSignal.timeout(5000),
      }).catch(() => {});
    }

    // Re-enrich with tizitaRepresentativeUrl so the studio doesn't
    // lose the rep photo on every PATCH (causing the avatar to
    // revert to the initial-letter placeholder while editing bio).
    if (updated.tizitaPersonaId) {
      const TIZITA_API_URL = (process.env.TIZITA_API_URL || 'http://localhost:8001/api/v1').replace(/\/$/, '');
      try {
        const res = await fetch(`${TIZITA_API_URL}/personas/${updated.tizitaPersonaId}`, {
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
          const persona = await res.json() as { representative_photo_url?: string | null };
          if (persona.representative_photo_url) {
            const tizitaBase = TIZITA_API_URL.replace(/\/api\/v1$/, '');
            const repUrl = persona.representative_photo_url.startsWith('http')
              ? persona.representative_photo_url
              : `${tizitaBase}${persona.representative_photo_url}`;
            return reply.send({ ...updated, tizitaRepresentativeUrl: repUrl });
          }
        }
      } catch {}
    }

    return reply.send(updated);
  });

  // DELETE /characters/:id - Delete a character
  fastify.delete<{ Params: { id: string } }>('/characters/:id', async (request, reply) => {
    const { id } = request.params;

    const character = await prisma.character.findUnique({
      where: { id },
    });

    if (!character) {
      return reply.code(404).send({ error: 'Character not found' });
    }

    // Delete associated content items first
    await prisma.contentItem.deleteMany({
      where: { characterId: id },
    });

    // Delete the character
    await prisma.character.delete({
      where: { id },
    });

    return reply.code(204).send();
  });

  // POST /characters/generate - Generate a random character using LCOS Oripheon
  fastify.post('/characters/generate', async (request, reply) => {
    const body = request.body as {
      seed?: number;
      heritage?: string;
      gender?: string;
      blendHeritage?: boolean;
      mononym?: boolean;
      mononymType?: 'squishe' | 'simple' | 'aminal-blend' | 'aminal-clear';
      relic?: boolean;
      relicEra?: 'archaic' | 'modern';
      lockedRelic?: { object: string; category: string; origin: string };
      core?: string;
      variance?: number;
      // Cultural mode: when true, the name is generated by the
      // diasporic / decolonial engine (@violet-sphinx/names) and
      // overrides the heritage-pool name. Bóveda still owns
      // backstory + arcana + relics; only the name surface changes.
      cultural?: boolean;
      culturalCultures?: string[];
      culturalMode?: 'real' | 'fictional' | 'mythic' | 'archetype' | 'internet';
      culturalForm?: 'mononym' | 'first' | 'surname' | 'first_surname' | 'full_with_epithet';
      culturalGender?: 'm' | 'f' | 'a';
      culturalArchetype?: string;
      culturalOrnament?: 0 | 0.5 | 1;
      culturalWithTitle?: boolean;
      culturalSurnameRegister?: 'auto' | 'colonial' | 'reclaimed' | 'compound';
      culturalSurnameCulture?: string;
    } | undefined;

    // Use the extended LCOS generator with multiple archetype systems
    const generated = generateLCOSCharacter({
      seed: body?.seed,
      heritage: body?.heritage,
      gender: body?.gender,
      blendHeritage: body?.blendHeritage,
      mononym: body?.mononym,
      mononymType: body?.mononymType,
      relic: body?.relic,
      relicEra: body?.relicEra,
      lockedRelic: body?.lockedRelic as any,
      core: body?.core as any,
      variance: body?.variance,
    });

    // Cultural override: replace the name with the Òrò engine's output
    // and attach cultural metadata. Backstory, arcana, personality,
    // appearance, relics still come from Bóveda's engine — that
    // division is the merger pattern (Òrò = name + lineage,
    // Bóveda = lore + relic + persona).
    if (body?.cultural) {
      const oro = generateOroCulturalName({
        cultures: body.culturalCultures as OroCultureId[] | undefined,
        mode: body.culturalMode as OroMode | undefined,
        form: body.culturalForm as OroForm | undefined,
        gender: body.culturalGender as OroGender | undefined,
        archetype: body.culturalArchetype as OroArchetype | undefined,
        ornament: body.culturalOrnament,
        withTitle: body.culturalWithTitle,
        surnameRegister: body.culturalSurnameRegister,
        surnameCulture: body.culturalSurnameCulture as OroCultureId | undefined,
      });
      if (oro) {
        generated.name = oro.fullName;
        const enriched = generated as unknown as Record<string, unknown>;
        enriched.cultural = {
          cultureId: oro.raw.cultureId,
          region: oro.raw.region,
          era: oro.raw.era,
          source: oro.raw.source,
          sacred: oro.raw.sacred,
          lineage: oro.raw.lineage,
          rationale: oro.raw.rationale,
        };
      }
    }

    return reply.send(generated);
  });

  // GET /characters/oro-cultures - List cultures available in the
  // diasporic naming engine. Used by the studio picker.
  fastify.get('/characters/oro-cultures', async (_request, reply) => {
    return reply.send({ cultures: listOroCultures() });
  });

  // POST /characters/names - Names-only surface: returns a batch of
  // generated names without creating characters. Used by the /names
  // exploration page in the studio (the Òrò surface absorbed into
  // Bóveda).
  fastify.post('/characters/names', async (request, reply) => {
    const body = request.body as {
      cultures?: string[];
      mode?: 'real' | 'fictional' | 'mythic' | 'archetype' | 'internet';
      form?: 'mononym' | 'first' | 'surname' | 'first_surname' | 'full_with_epithet';
      gender?: 'm' | 'f' | 'a';
      archetype?: string;
      ornament?: 0 | 0.5 | 1;
      withTitle?: boolean;
      surnameRegister?: 'auto' | 'colonial' | 'reclaimed' | 'compound';
      surnameCulture?: string;
      count?: number;
    } | undefined;
    const { generateOroBatch } = await import('@lcos/oripheon');
    const results = generateOroBatch({
      cultures: body?.cultures as OroCultureId[] | undefined,
      mode: body?.mode as OroMode | undefined,
      form: body?.form as OroForm | undefined,
      gender: body?.gender as OroGender | undefined,
      archetype: body?.archetype as OroArchetype | undefined,
      ornament: body?.ornament,
      withTitle: body?.withTitle,
      surnameRegister: body?.surnameRegister,
      surnameCulture: body?.surnameCulture as OroCultureId | undefined,
      count: body?.count,
    });
    return reply.send({ names: results });
  });

  // GET /characters/oro-lineages - Cross-culture name lineage threads
  // (Ogun → Ogou → Ogún, Kwasi → Quashie, etc.). Powers the /names/lineage
  // page in the studio.
  fastify.get('/characters/oro-lineages', async (_request, reply) => {
    const { LINEAGES } = await import('@violet-sphinx/names');
    return reply.send({ lineages: LINEAGES });
  });

  // POST /characters/bulk-import-tizita - Bulk import all named
  // (sorted) Tizita personas as Bóveda characters. Skips unsorted
  // (display_name = null/empty). Idempotent: existing
  // tizitaPersonaId-bound characters are reused, not duplicated.
  fastify.post('/characters/bulk-import-tizita', async (_request, reply) => {
    const TIZITA_API_URL = (process.env.TIZITA_API_URL || 'http://localhost:8001/api/v1').replace(/\/$/, '');

    let tizitaPayload: { personas: Array<{ id: string; display_name: string | null; photo_count: number; kind?: string; appearance_notes?: string | null; representative_photo_url?: string | null }>; total: number };
    try {
      // No kind filter: import both real (face-clustered) and
      // character (author-archetype) personas so the user gets every
      // sorted entry, e.g. Triarch (kind=character) alongside Ubani
      // (kind=real). Skipping by kind would silently drop characters.
      const res = await fetch(`${TIZITA_API_URL}/personas/`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        return reply.code(502).send({ error: `Tizita returned ${res.status}` });
      }
      tizitaPayload = await res.json() as typeof tizitaPayload;
    } catch (e) {
      return reply.code(503).send({
        error: 'Tizita is unreachable. Start Tizita on :8001.',
        detail: e instanceof Error ? e.message : String(e),
      });
    }

    const namedPersonas = tizitaPayload.personas.filter(
      (p) => p.display_name && p.display_name.trim().length > 0
    );

    const results = {
      total_in_tizita: tizitaPayload.total,
      named_in_tizita: namedPersonas.length,
      imported: 0,
      reused: 0,
      errors: [] as Array<{ personaId: string; error: string }>,
    };

    for (const persona of namedPersonas) {
      try {
        const existing = await prisma.character.findFirst({
          where: { tizitaPersonaId: persona.id },
        });
        // Tizita's appearance_notes is the writer's free-text brief.
        // Use it directly as the bio when present. When absent, leave
        // the bio empty so the user can enter their own brief in
        // Bóveda — better than a verbose dated stub that everyone has
        // to clear before writing.
        const tizitaBrief = persona.appearance_notes?.trim() || null;
        const bio = tizitaBrief ?? '';

        if (existing) {
          const canonicalName = persona.display_name!.trim();
          const looksLikeStub = !existing.bio || existing.bio.startsWith('Stubbed from Tizita') || existing.bio.startsWith('Imported from Tizita');

          const candidateUpdates: Partial<Record<LockableField, string>> = {};

          // Reconcile the canonical name. If the character was rolled
          // under an Oripheon ancestral name and is now bound to a
          // named Tizita persona, the persona name wins. The bio /
          // systemPrompt get the baked ancestral name swapped to match.
          if (existing.name !== canonicalName) {
            candidateUpdates.name = canonicalName;
            const reconciledBio = reconcileBakedName(existing.bio, canonicalName);
            if (reconciledBio !== existing.bio) candidateUpdates.bio = reconciledBio;
            const reconciledPrompt = reconcileBakedName(existing.systemPrompt, canonicalName);
            if (reconciledPrompt !== existing.systemPrompt) candidateUpdates.systemPrompt = reconciledPrompt;
          } else {
            // Name is already canonical, but the bio may still carry a
            // stale baked subject from a past roll. Reconcile against
            // the canonical name too.
            const reconciledBio = reconcileBakedName(existing.bio, canonicalName);
            if (reconciledBio !== existing.bio) candidateUpdates.bio = reconciledBio;
          }

          if (tizitaBrief && looksLikeStub) {
            candidateUpdates.bio = tizitaBrief;
          } else if (!tizitaBrief && looksLikeStub && existing.bio) {
            candidateUpdates.bio = '';
          }

          // Drop locked fields before writing. The user has marked
          // these as identity-defended (e.g. via Starforge import).
          // Auto-syncs leave them alone.
          const { updates: allowed } = filterLockedUpdates(
            existing.identity,
            candidateUpdates
          );

          if (Object.keys(allowed).length > 0) {
            await prisma.character.update({
              where: { id: existing.id },
              data: allowed as Prisma.CharacterUpdateInput,
            });
          }
          results.reused++;
          continue;
        }
        await prisma.character.create({
          data: {
            name: persona.display_name!.trim(),
            bio,
            tizitaPersonaId: persona.id,
            source: 'PERSONA',
          },
        });
        results.imported++;
      } catch (e) {
        results.errors.push({
          personaId: persona.id,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return reply.send(results);
  });

  // GET /characters/:id/tizita-photos - Federation endpoint: fetches
  // the best photos for the linked Tizita persona via Tizita's
  // /personas/:id/best. Returned URLs point at Tizita; the studio
  // renders them with crossOrigin or a proxy. Empty array if the
  // character has no tizitaPersonaId or Tizita is unreachable.
  fastify.get<{ Params: { id: string } }>('/characters/:id/tizita-photos', async (request, reply) => {
    const TIZITA_API_URL = (process.env.TIZITA_API_URL || 'http://localhost:8001/api/v1').replace(/\/$/, '');
    const char = await prisma.character.findUnique({ where: { id: request.params.id } });
    if (!char) return reply.code(404).send({ error: 'character not found' });
    if (!char.tizitaPersonaId) return reply.send({ photos: [], reason: 'no_tizita_persona' });

    try {
      const res = await fetch(`${TIZITA_API_URL}/personas/${char.tizitaPersonaId}/best?limit=24`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        return reply.send({ photos: [], reason: `tizita_${res.status}` });
      }
      const json = await res.json() as { photos?: Array<{ id: string; file_url?: string; url?: string; thumbnail_url?: string }> };
      return reply.send({
        photos: (json.photos ?? []).map((p) => ({
          id: p.id,
          url: p.file_url ?? p.url ?? null,
          thumbnailUrl: p.thumbnail_url ?? p.file_url ?? p.url ?? null,
        })),
        tizita_base: TIZITA_API_URL.replace(/\/api\/v1$/, ''),
      });
    } catch {
      return reply.send({ photos: [], reason: 'tizita_unreachable' });
    }
  });

  // PATCH /characters/:id/bio - Update the bio (brief) inline. Used
  // by the character detail page editable brief field. When the
  // character is bound to a Tizita persona, the brief is mirrored
  // into Tizita's appearance_notes so both sides stay in sync.
  fastify.patch<{ Params: { id: string } }>('/characters/:id/bio', async (request, reply) => {
    const body = request.body as { bio?: string };
    if (typeof body?.bio !== 'string') {
      return reply.code(400).send({ error: 'bio is required' });
    }
    const updated = await prisma.character.update({
      where: { id: request.params.id },
      data: { bio: body.bio },
    });
    if (updated.tizitaPersonaId) {
      const TIZITA_API_URL = (process.env.TIZITA_API_URL || 'http://localhost:8001/api/v1').replace(/\/$/, '');
      void fetch(`${TIZITA_API_URL}/personas/${updated.tizitaPersonaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appearance_notes: body.bio }),
        signal: AbortSignal.timeout(5000),
      }).catch(() => {});
    }
    return reply.send({ id: updated.id, bio: updated.bio });
  });

  // POST /characters/from-persona - Create a Bóveda character from a
  // Tizita persona. Idempotent: if a character already exists in
  // Bóveda bound to the same persona, return that instead. The
  // tizitaPersonaId field on Character is the persistent link, so
  // photo-library lookups and avatar fetches keep working.
  fastify.post('/characters/from-persona', async (request, reply) => {
    const body = request.body as {
      personaId?: string;
      nameOverride?: string;
      worldId?: string;
    } | undefined;
    if (!body?.personaId?.trim()) {
      return reply.code(400).send({ error: 'personaId is required' });
    }

    // Idempotence
    const existing = await prisma.character.findFirst({
      where: { tizitaPersonaId: body.personaId },
    });
    if (existing) {
      return reply.send({
        id: existing.id,
        character: existing,
        created: false,
        reused: true,
      });
    }

    // Optionally fetch persona details from Tizita
    const TIZITA_API_URL = (process.env.TIZITA_API_URL || 'http://localhost:8001/api/v1').replace(/\/$/, '');
    let displayName: string | null = null;
    let appearanceNotes: string | null = null;
    let photoCount = 0;
    let tizitaReachable = false;
    try {
      const res = await fetch(`${TIZITA_API_URL}/personas/${body.personaId}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const persona = await res.json() as { display_name?: string | null; photo_count?: number; appearance_notes?: string | null };
        displayName = persona.display_name?.trim() ?? null;
        appearanceNotes = persona.appearance_notes?.trim() ?? null;
        photoCount = persona.photo_count ?? 0;
        tizitaReachable = true;
      } else if (res.status === 404) {
        return reply.code(404).send({ error: `persona ${body.personaId} not found in Tizita` });
      }
    } catch {
      // Tizita unreachable; we can still proceed with nameOverride
    }

    const inferredName =
      body.nameOverride?.trim() ||
      displayName ||
      (tizitaReachable ? `Unnamed · ${body.personaId.slice(0, 8)}` : null);
    if (!inferredName) {
      return reply.code(503).send({
        error: 'Tizita is unreachable and no nameOverride was provided. Start Tizita on :8001 or pass nameOverride in the body.',
      });
    }

    // Prefer Tizita's appearance_notes (the writer's free-text brief).
    // When absent, leave bio empty so the user can write their own
    // in Bóveda rather than starting from a stub they have to clear.
    const bio = appearanceNotes ?? '';

    const character = await prisma.character.create({
      data: {
        name: inferredName,
        bio,
        tizitaPersonaId: body.personaId,
        source: 'PERSONA',
        ...(body.worldId ? { worldId: body.worldId } : {}),
      },
    });

    return reply.send({
      id: character.id,
      character,
      created: true,
      reused: false,
      persona: tizitaReachable
        ? { id: body.personaId, display_name: displayName, photo_count: photoCount }
        : null,
    });
  });

  // POST /characters/:id/loras - Attach a LoRA to a character. The
  // LoRA file lives elsewhere (Tizita / S3 / shared storage); this
  // attaches its identifier + metadata to the character so image-gen
  // surfaces (Genoma, ComfyUI, thumbnail compositor) can pick the
  // right adapter when rendering.
  fastify.post<{ Params: { id: string } }>('/characters/:id/loras', async (request, reply) => {
    const lora = request.body as {
      id: string;            // LoRA identifier (Tizita ref, civitai id, etc.)
      name?: string;         // Display name (e.g. "Ubani v3")
      source?: string;       // "tizita" | "civitai" | "local" | "starforge"
      trigger?: string;      // The trigger word(s) that activate it
      weight?: number;       // Default weight, 0.0-1.0
      baseModel?: string;    // "sdxl" | "sd15" | "flux" | etc.
      trainedFromPersonaId?: string; // Tizita persona this was trained from
      thumbnailUrl?: string;
      metadata?: Record<string, unknown>;
    };
    if (!lora?.id) return reply.code(400).send({ error: 'lora.id is required' });

    const char = await prisma.character.findUnique({ where: { id: request.params.id } });
    if (!char) return reply.code(404).send({ error: 'character not found' });

    const existing = Array.isArray(char.loras) ? (char.loras as unknown[]) : [];
    const filtered = existing.filter((x) => (x as { id?: string })?.id !== lora.id);
    const next = [...filtered, lora];

    const updated = await prisma.character.update({
      where: { id: request.params.id },
      data: { loras: next as never },
    });
    return reply.send({ id: updated.id, loras: updated.loras });
  });

  // POST /characters/migrate-from-oro - Read Òrò's SQLite at
  // /home/sphinxy/oro/prisma/oro.db, copy worlds and (optionally)
  // characters into Bóveda. Idempotent on world name + format
  // (won't duplicate Station 8 if run twice).
  //
  // For each Òrò character with a worldId:
  //   - If a Bóveda character with the same name already exists, just
  //     attach it to the migrated world.
  //   - Otherwise create a stub Bóveda character with the Òrò name +
  //     bio + role and attach to the world.
  fastify.post('/characters/migrate-from-oro', async (_request, reply) => {
    const Database = (await import('better-sqlite3')).default;
    const ORO_DB_PATH = process.env.ORO_DB_PATH || '/home/sphinxy/oro/prisma/oro.db';

    let db: import('better-sqlite3').Database;
    try {
      db = new Database(ORO_DB_PATH, { readonly: true, fileMustExist: true });
    } catch (e) {
      return reply.code(503).send({
        error: `Cannot read Òrò db at ${ORO_DB_PATH}`,
        detail: e instanceof Error ? e.message : String(e),
      });
    }

    interface OroWorld {
      id: string;
      userId: string;
      name: string;
      logline: string | null;
      format: string;
      status: string;
      culturalLineage: string | null;
    }
    interface OroCharacter {
      id: string;
      worldId: string;
      name: string;
      role: string | null;
      biography: string | null;
      culturalLineage: string | null;
    }

    const oroWorlds = db.prepare('SELECT id, userId, name, logline, format, status, culturalLineage FROM World').all() as OroWorld[];
    const oroChars = db.prepare("SELECT id, worldId, name, role, biography, culturalLineage FROM Character WHERE worldId IS NOT NULL AND worldId != ''").all() as OroCharacter[];
    db.close();

    const results = {
      oro_worlds: oroWorlds.length,
      oro_characters_with_world: oroChars.length,
      worlds_created: 0,
      worlds_reused: 0,
      characters_attached: 0,
      characters_created: 0,
      errors: [] as Array<{ kind: string; id: string; error: string }>,
      mapping: [] as Array<{ oro_world_id: string; bóveda_world_id: string; name: string }>,
    };

    // Worlds: name + format match makes a unique key. Òrò has two
    // 'Station 8's (one game, one mythos), each becomes its own
    // Bóveda World.
    const worldMap = new Map<string, string>();
    for (const w of oroWorlds) {
      try {
        const existing = await prisma.world.findFirst({
          where: { name: w.name, type: w.format },
        });
        let bovedaId: string;
        if (existing) {
          bovedaId = existing.id;
          results.worlds_reused++;
        } else {
          const created = await prisma.world.create({
            data: {
              name: w.name,
              description: w.logline ?? null,
              type: w.format,
              metadata: {
                source: 'oro-migration',
                oroWorldId: w.id,
                oroUserId: w.userId,
                oroStatus: w.status,
                culturalLineage: w.culturalLineage ?? null,
              },
            },
          });
          bovedaId = created.id;
          results.worlds_created++;
        }
        worldMap.set(w.id, bovedaId);
        results.mapping.push({ oro_world_id: w.id, bóveda_world_id: bovedaId, name: w.name });
      } catch (e) {
        results.errors.push({
          kind: 'world',
          id: w.id,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    // Characters: try to match by name first (so Òrò's 'Ubani' lands
    // on the existing Tizita-bound Bóveda Ubani, etc.). If no match,
    // create a stub.
    for (const c of oroChars) {
      try {
        const bovedaWorldId = worldMap.get(c.worldId);
        if (!bovedaWorldId) continue;
        const existing = await prisma.character.findFirst({
          where: { name: c.name },
        });
        if (existing) {
          await prisma.character.update({
            where: { id: existing.id },
            data: { worldId: bovedaWorldId },
          });
          results.characters_attached++;
        } else {
          await prisma.character.create({
            data: {
              name: c.name,
              bio: c.biography ?? '',
              worldId: bovedaWorldId,
              source: 'GENERATED',
              timelineState: {
                source: 'oro-migration',
                oroCharacterId: c.id,
                oroRole: c.role,
                culturalLineage: c.culturalLineage,
              },
            },
          });
          results.characters_created++;
        }
      } catch (e) {
        results.errors.push({
          kind: 'character',
          id: c.id,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return reply.send(results);
  });

  // POST /characters/import-lora-registry - Read the user's
  // ~/boveda/characters/*.json registry and attach the LoRAs to
  // matching Bóveda characters by display_name.
  //
  // Each character JSON file in that directory is the source of truth
  // for one trained LoRA: Replicate destination + version, local
  // ComfyUI path, trigger word, base model, type (character/style).
  // This endpoint walks them and idempotently attaches the matching
  // LoRA to the matching Bóveda character.
  fastify.post('/characters/import-lora-registry', async (_request, reply) => {
    const { promises: fs } = await import('node:fs');
    const path = await import('node:path');
    const REGISTRY_DIR = process.env.BOVEDA_CHARACTERS_DIR || '/home/sphinxy/boveda/characters';

    let entries: string[];
    try {
      entries = await fs.readdir(REGISTRY_DIR);
    } catch (e) {
      return reply.code(503).send({
        error: `Cannot read registry at ${REGISTRY_DIR}`,
        detail: e instanceof Error ? e.message : String(e),
      });
    }

    const jsonFiles = entries.filter((f) => f.endsWith('.json') && !f.startsWith('_'));

    interface RegistryRecord {
      name: string;
      trigger?: string;
      display_name?: string;
      type?: string;
      stack_with?: string[];
      lora?: {
        wsl_local?: string;
        local?: string;
        replicate_destination?: string;
        replicate_version?: string;
        trigger?: string;
        trained_on?: string;
        rank?: number;
        steps?: number;
      };
    }

    const results = {
      registry_count: jsonFiles.length,
      attached: 0,
      skipped: [] as Array<{ file: string; reason: string }>,
      errors: [] as Array<{ file: string; error: string }>,
    };

    for (const filename of jsonFiles) {
      try {
        const raw = await fs.readFile(path.join(REGISTRY_DIR, filename), 'utf-8');
        const record = JSON.parse(raw) as RegistryRecord;

        // Type maps to category. character/style/voice → visual /
        // style / voice categories. Default visual.
        const typeToCategory: Record<string, string> = {
          character: 'visual',
          style: 'style',
          voice: 'voice',
        };
        const category = typeToCategory[record.type ?? 'character'] ?? 'visual';

        // Find a target character. For character-type LoRAs, match by
        // display_name. For style-type LoRAs, attach to ALL characters
        // that list this LoRA in their stack_with (we'll handle this
        // in a second pass below).
        const targets: Array<{ id: string; name: string }> = [];

        if (record.type === 'style' || (record.type !== 'character' && record.stack_with === undefined)) {
          // Style LoRAs attach to every character that explicitly
          // stacks them in their JSON record's stack_with.
          for (const file of jsonFiles) {
            try {
              const raw2 = await fs.readFile(path.join(REGISTRY_DIR, file), 'utf-8');
              const r2 = JSON.parse(raw2) as RegistryRecord;
              if (r2.stack_with?.includes(record.name) && r2.display_name) {
                const char = await prisma.character.findFirst({ where: { name: r2.display_name } });
                if (char) targets.push({ id: char.id, name: char.name });
              }
            } catch {}
          }
        } else if (record.display_name) {
          // Character-type LoRA. Match by display_name.
          const char = await prisma.character.findFirst({ where: { name: record.display_name } });
          if (char) targets.push({ id: char.id, name: char.name });
          // Also attach to its base name without the version suffix
          // ("Ubani v2" should also attach to "Ubani"). Heuristic.
          const base = record.display_name.replace(/\s+v\d+(\s.*)?$/i, '').trim();
          if (base !== record.display_name) {
            const baseChar = await prisma.character.findFirst({ where: { name: base } });
            if (baseChar && !targets.find((t) => t.id === baseChar.id)) {
              targets.push({ id: baseChar.id, name: baseChar.name });
            }
          }
        }

        if (targets.length === 0) {
          results.skipped.push({ file: filename, reason: 'no_matching_character' });
          continue;
        }

        const lora = {
          id: record.name,
          name: record.display_name ?? record.name,
          category,
          source: record.lora?.replicate_version ? 'replicate' : 'local',
          trigger: record.trigger ?? record.lora?.trigger,
          weight: record.type === 'style' ? 0.6 : 0.8,
          baseModel: record.lora?.trained_on?.toLowerCase().includes('flux') ? 'flux' : 'sdxl',
          replicate_destination: record.lora?.replicate_destination,
          replicate_version: record.lora?.replicate_version,
          local_path: record.lora?.wsl_local ?? record.lora?.local,
        };

        for (const target of targets) {
          const char = await prisma.character.findUnique({ where: { id: target.id } });
          if (!char) continue;
          const existing = Array.isArray(char.loras) ? (char.loras as unknown[]) : [];
          const filtered = existing.filter((x) => (x as { id?: string })?.id !== lora.id);
          await prisma.character.update({
            where: { id: target.id },
            data: { loras: [...filtered, lora] as never },
          });
          results.attached++;
        }
      } catch (e) {
        results.errors.push({
          file: filename,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return reply.send(results);
  });

  // POST /characters/:id/group-members - Add a member to a group
  // character. Members are lightweight {name, role?, characterId?}
  // entries; full character records are not required.
  fastify.post<{ Params: { id: string } }>('/characters/:id/group-members', async (request, reply) => {
    const body = request.body as { name?: string; role?: string; characterId?: string };
    if (!body?.name?.trim()) return reply.code(400).send({ error: 'name is required' });
    const char = await prisma.character.findUnique({ where: { id: request.params.id } });
    if (!char) return reply.code(404).send({ error: 'character not found' });
    const existing = Array.isArray(char.groupMembers) ? (char.groupMembers as unknown[]) : [];
    const member = {
      name: body.name.trim(),
      role: body.role?.trim() || undefined,
      characterId: body.characterId || undefined,
    };
    const next = [...existing, member];
    const updated = await prisma.character.update({
      where: { id: request.params.id },
      data: { groupMembers: next as never },
    });
    return reply.send({ id: updated.id, groupMembers: updated.groupMembers });
  });

  // DELETE /characters/:id/group-members/:index - Remove a member by
  // its position in the array. The array is intentionally unkeyed
  // (members may share names) so index-based removal keeps it simple.
  fastify.delete<{ Params: { id: string; index: string } }>(
    '/characters/:id/group-members/:index',
    async (request, reply) => {
      const idx = parseInt(request.params.index, 10);
      if (Number.isNaN(idx) || idx < 0) {
        return reply.code(400).send({ error: 'invalid index' });
      }
      const char = await prisma.character.findUnique({ where: { id: request.params.id } });
      if (!char) return reply.code(404).send({ error: 'character not found' });
      const existing = Array.isArray(char.groupMembers) ? (char.groupMembers as unknown[]) : [];
      if (idx >= existing.length) return reply.code(404).send({ error: 'member not found' });
      const next = [...existing.slice(0, idx), ...existing.slice(idx + 1)];
      const updated = await prisma.character.update({
        where: { id: request.params.id },
        data: { groupMembers: next as never },
      });
      return reply.send({ id: updated.id, groupMembers: updated.groupMembers });
    },
  );

  // DELETE /characters/:id/loras/:loraId - Detach a LoRA from a character.
  fastify.delete<{ Params: { id: string; loraId: string } }>(
    '/characters/:id/loras/:loraId',
    async (request, reply) => {
      const char = await prisma.character.findUnique({ where: { id: request.params.id } });
      if (!char) return reply.code(404).send({ error: 'character not found' });
      const existing = Array.isArray(char.loras) ? (char.loras as unknown[]) : [];
      const next = existing.filter((x) => (x as { id?: string })?.id !== request.params.loraId);
      const updated = await prisma.character.update({
        where: { id: request.params.id },
        data: { loras: next as never },
      });
      return reply.send({ id: updated.id, loras: updated.loras });
    }
  );

  // POST /characters/generate/:seed - Generate a character with specific seed
  fastify.post<{ Params: { seed: string } }>('/characters/generate/:seed', async (request, reply) => {
    const seed = parseInt(request.params.seed, 10);

    if (isNaN(seed)) {
      return reply.code(400).send({ error: 'Invalid seed - must be a number' });
    }

    const generated = generateCharacterWithSeed(seed);
    return reply.send(generated);
  });

  // POST /characters/reroll/:seed - Reroll a character with optional overrides
  fastify.post<{ Params: { seed: string } }>('/characters/reroll/:seed', async (request, reply) => {
    const seed = parseInt(request.params.seed, 10);

    if (isNaN(seed)) {
      return reply.code(400).send({ error: 'Invalid seed - must be a number' });
    }

    const body = request.body as { heritage?: string; gender?: string } | undefined;
    const generated = rerollCharacter(seed, {
      heritage: body?.heritage as any,
      gender: body?.gender as any,
    });

    return reply.send(generated);
  });

  // Helper: sync oripheon data for a single character record.
  // Returns { updated, status } where status indicates what happened.
  // NEVER overwrites existing hexagram, subtaste, or core generated data.
  // Respects Character.identity.locked: if bio or subtasteCode is locked
  // (e.g. Ubani after Starforge import), this auto-sync skips those
  // fields and reports 'skipped_locked' for transparency.
  async function syncOripheonForCharacter(character: { id: string; name: string; bio: string | null; timelineState: any; identity: any }) {
    const ts = (character.timelineState as Record<string, any>) || {};
    const oripheon = ts.oripheon || {};
    const generated = oripheon.generated;

    const hasAxes = !!generated?.personality?.axes;
    const hasArcana = !!generated?.arcana;
    const hasHexagram = !!generated?.hexagram;
    const hasSubtaste = !!generated?.subtaste;

    // Fully complete — nothing to do
    if (hasAxes && hasArcana && hasHexagram && hasSubtaste) {
      return { updated: null, status: 'already_complete' as const };
    }

    const bioLocked = isFieldLocked(character.identity, 'bio');
    const subtasteLocked = isFieldLocked(character.identity, 'subtasteCode');
    const nameLocked = isFieldLocked(character.identity, 'name');

    // If everything material is locked AND the character has no
    // generated core, refuse the sync entirely. The user has marked
    // this character as identity-defended; auto-rolling them is the
    // exact thing locks exist to prevent.
    if (!hasAxes && !hasArcana && (bioLocked || nameLocked)) {
      return { updated: null, status: 'skipped_locked' as const };
    }

    let updatedGenerated: any;
    let extraUpdates: Record<string, any> = {};

    if (hasAxes && hasArcana) {
      // Core data present — only fill in missing derived fields, preserve everything else
      updatedGenerated = { ...generated };
      if (!hasHexagram) {
        updatedGenerated.hexagram = deriveHexagramReading(generated.personality.axes);
      }
      if (!hasSubtaste && !subtasteLocked) {
        updatedGenerated.subtaste = getSubtasteDesignation('tarot', generated.arcana.archetype);
      } else if (subtasteLocked && hasSubtaste) {
        // Preserve existing subtaste even if downstream tries to recompute
        updatedGenerated.subtaste = generated.subtaste;
      }
    } else {
      // No core data — full generation needed
      const fresh = generateLCOSCharacter();
      updatedGenerated = fresh;
      // Bio overwrite only if not locked. Locked bios stay as-is.
      if (!bioLocked) {
        extraUpdates = {
          bio: fresh.backstory?.substring(0, 500) || character.bio,
        };
      }
      // If subtaste is locked, keep the previous subtaste rather than
      // letting fresh generation supply a new one.
      if (subtasteLocked && generated?.subtaste) {
        updatedGenerated.subtaste = generated.subtaste;
      }
    }

    const updated = await prisma.character.update({
      where: { id: character.id },
      data: {
        ...extraUpdates,
        timelineState: {
          ...ts,
          oripheon: {
            ...oripheon,
            seed: oripheon.seed || updatedGenerated.seed,
            generated: updatedGenerated,
            subtaste: updatedGenerated.subtaste,
          },
        },
      },
    });

    const status = (hasAxes && hasArcana) ? 'enriched' as const : 'generated' as const;
    return { updated, status };
  }

  // POST /characters/:id/sync-oripheon - Sync/generate oripheon data for a character
  fastify.post<{ Params: { id: string } }>('/characters/:id/sync-oripheon', async (request, reply) => {
    const { id } = request.params;
    const character = await prisma.character.findUnique({ where: { id } });
    if (!character) return reply.code(404).send({ error: 'Character not found' });

    const { updated, status } = await syncOripheonForCharacter(character);

    if (status === 'already_complete') {
      return reply.send(character);
    }
    if (status === 'skipped_locked') {
      return reply.code(409).send({
        error: 'Character identity is locked. Auto-sync skipped to defend the canonical bio.',
        characterId: character.id,
        status,
      });
    }

    return reply.send(updated);
  });

  // PATCH /characters/:id/subtaste — manually pick primary +
  // optional secondary Subtaste designation. Refuses to overwrite
  // when isUser=true (Ubani's Subtaste comes from Starforge Nommo).
  // Stores in timelineState.oripheon.generated.subtaste alongside
  // a new secondaryCode field.
  fastify.patch<{
    Params: { id: string };
    Body: { primaryCode: string; secondaryCode?: string | null };
  }>('/characters/:id/subtaste', async (request, reply) => {
    const { id } = request.params;
    const { primaryCode, secondaryCode } = request.body;

    const character = await prisma.character.findUnique({ where: { id } });
    if (!character) return reply.code(404).send({ error: 'Character not found' });

    if (character.isUser) {
      return reply.code(409).send({
        error: 'Subtaste for the user character is inherited from Starforge Nommo. Use POST /characters/:id/import-from-starforge to refresh it.',
      });
    }

    const VALID = new Set(['S-0', 'T-1', 'V-2', 'L-3', 'C-4', 'N-5', 'H-6', 'P-7', 'D-8', 'F-9', 'R-10', 'Ø']);
    if (!VALID.has(primaryCode)) {
      return reply.code(400).send({ error: `Invalid primary code: ${primaryCode}` });
    }
    if (secondaryCode && !VALID.has(secondaryCode)) {
      return reply.code(400).send({ error: `Invalid secondary code: ${secondaryCode}` });
    }

    const ts = (character.timelineState as Record<string, unknown>) || {};
    const oripheon = (ts.oripheon as Record<string, unknown>) || {};
    const generated = (oripheon.generated as Record<string, unknown>) || {};
    const existingSubtaste = (generated.subtaste as Record<string, unknown>) || {};

    const GLYPHS: Record<string, { glyph: string; label: string }> = {
      'S-0': { glyph: 'KETH', label: 'Visionary' },
      'T-1': { glyph: 'STRATA', label: 'Architectural' },
      'V-2': { glyph: 'OMEN', label: 'Prophetic' },
      'L-3': { glyph: 'SILT', label: 'Developmental' },
      'C-4': { glyph: 'CULL', label: 'Editorial' },
      'N-5': { glyph: 'LIMN', label: 'Integrative' },
      'H-6': { glyph: 'TOLL', label: 'Advocacy' },
      'P-7': { glyph: 'VAULT', label: 'Archival' },
      'D-8': { glyph: 'WICK', label: 'Channelling' },
      'F-9': { glyph: 'ANVIL', label: 'Manifestation' },
      'R-10': { glyph: 'SCHISM', label: 'Contrarian' },
      'Ø': { glyph: 'VOID', label: 'Receptive' },
    };

    const newSubtaste = {
      ...existingSubtaste,
      code: primaryCode,
      glyph: GLYPHS[primaryCode].glyph,
      label: GLYPHS[primaryCode].label,
      ...(secondaryCode
        ? {
            secondaryCode,
            secondaryGlyph: GLYPHS[secondaryCode].glyph,
            secondaryLabel: GLYPHS[secondaryCode].label,
          }
        : { secondaryCode: null, secondaryGlyph: null, secondaryLabel: null }),
    };

    const newTimelineState = {
      ...ts,
      oripheon: {
        ...oripheon,
        generated: {
          ...generated,
          subtaste: newSubtaste,
        },
      },
    };

    const updated = await prisma.character.update({
      where: { id },
      data: { timelineState: newTimelineState as unknown as Prisma.InputJsonValue },
    });

    return reply.send({
      ok: true,
      characterId: updated.id,
      subtaste: newSubtaste,
    });
  });

  // POST /characters/:id/mirror-from/:sourceId — copy identity
  // fields from source character to :id. Used for twin creation
  // (Ai-8O mirroring Ubani). Copies bio, backstory, voiceSamples,
  // authoredBy, identity envelope, timelineState.subtaste,
  // toneForbidden, personaTags, aliases. Sets target.twinOf =
  // source.id and target.mode = 'twin' unless mode is already set
  // by the caller. Does NOT copy: name, avatarUrl, mode (unless
  // forced), worldId, lastSeenAt, isUser.
  //
  // When ECOSYSTEM_API_SECRET + IBIS_API_URL are set in env AND the
  // source has isUser=true, additionally pulls the user's writing
  // corpus from Ibis and seeds it as voiceSamples. Without those env
  // vars, just does the static field mirror.
  fastify.post<{ Params: { id: string; sourceId: string }; Body?: { mode?: string; forceMode?: boolean } }>(
    '/characters/:id/mirror-from/:sourceId',
    async (request, reply) => {
      const { id, sourceId } = request.params;
      if (id === sourceId) return reply.code(400).send({ error: 'Cannot mirror a character from itself' });

      const [target, source] = await Promise.all([
        prisma.character.findUnique({ where: { id } }),
        prisma.character.findUnique({ where: { id: sourceId } }),
      ]);
      if (!target) return reply.code(404).send({ error: 'Target character not found' });
      if (!source) return reply.code(404).send({ error: 'Source character not found' });

      const body = (request.body ?? {}) as { mode?: string; forceMode?: boolean };

      // Optional Ibis corpus pull when source is the user.
      let ibisVoiceSamples: string[] | null = null;
      let ibisStatus: 'fetched' | 'skipped' | 'failed' = 'skipped';
      const ibisUrl = process.env.IBIS_API_URL;
      const ecosystemSecret = process.env.ECOSYSTEM_API_SECRET;
      if (source.isUser && ibisUrl && ecosystemSecret) {
        try {
          const res = await fetch(`${ibisUrl.replace(/\/$/, '')}/api/corpus/export`, {
            headers: { 'X-Internal-API-Key': ecosystemSecret },
            signal: AbortSignal.timeout(10000),
          });
          if (res.ok) {
            const json = (await res.json()) as {
              ok: boolean;
              corpus?: { documents?: Array<{ plainText?: string }> };
            };
            const docs = json.corpus?.documents ?? [];
            // Pick up to 5 representative excerpts. Take the first
            // ~600 chars from each doc; trim to sentence boundary.
            ibisVoiceSamples = docs
              .slice(0, 5)
              .map((d) => {
                const text = (d.plainText || '').trim();
                if (text.length <= 600) return text;
                const truncated = text.slice(0, 600);
                const lastPeriod = truncated.lastIndexOf('.');
                return lastPeriod > 200 ? truncated.slice(0, lastPeriod + 1) : truncated;
              })
              .filter((t) => t.length > 100);
            ibisStatus = ibisVoiceSamples.length > 0 ? 'fetched' : 'skipped';
          }
        } catch {
          ibisStatus = 'failed';
        }
      }

      // Resolve voice samples: Ibis (if fetched) > source's existing > [].
      let voiceSamples: string[] = [];
      if (ibisVoiceSamples && ibisVoiceSamples.length > 0) {
        voiceSamples = ibisVoiceSamples;
      } else if (Array.isArray(source.voiceSamples) && source.voiceSamples.length > 0) {
        voiceSamples = source.voiceSamples as string[];
      }

      const updates: Prisma.CharacterUpdateInput = {
        bio: source.bio,
        backstory: source.backstory,
        personaTags: source.personaTags,
        aliases: source.aliases,
        toneForbidden: source.toneForbidden,
        toneAllowed: source.toneAllowed,
        authoredBy: source.authoredBy ?? source.name,
        voiceSamples: voiceSamples as unknown as Prisma.InputJsonValue,
        identity: source.identity as Prisma.InputJsonValue,
        timelineState: source.timelineState as Prisma.InputJsonValue,
        twinOf: source.id,
      };

      // Mode handling: default to 'twin' unless caller specifies
      // otherwise, or unless target is already in a clearly-different
      // mode the caller didn't ask to override.
      if (body.mode) {
        updates.mode = body.mode;
      } else if (body.forceMode || target.mode === source.mode || target.mode === 'espíritu') {
        updates.mode = 'twin';
      }

      const updated = await prisma.character.update({ where: { id }, data: updates });

      return reply.send({
        ok: true,
        targetId: updated.id,
        targetName: updated.name,
        sourceId: source.id,
        sourceName: source.name,
        mode: updated.mode,
        twinOf: updated.twinOf,
        voiceSamplesCount: voiceSamples.length,
        ibisStatus,
        ibisCorpusUsed: ibisStatus === 'fetched',
      });
    }
  );

  // POST /characters/reconcile-bio-names — one-shot pass that swaps
  // any baked Oripheon ancestral name in bio / systemPrompt for the
  // canonical Character.name. Run once after the rename helper lands;
  // safe to run repeatedly (no-op when already reconciled).
  fastify.post('/characters/reconcile-bio-names', async (_request, reply) => {
    const characters = await prisma.character.findMany({});
    let touched = 0;
    let skippedLocked = 0;
    const changes: Array<{ id: string; name: string; skipped?: LockableField[] }> = [];

    for (const c of characters) {
      const candidateUpdates: Partial<Record<LockableField, string>> = {};
      const newBio = reconcileBakedName(c.bio, c.name);
      if (newBio !== c.bio) candidateUpdates.bio = newBio;
      const newPrompt = reconcileBakedName(c.systemPrompt, c.name);
      if (newPrompt !== c.systemPrompt) candidateUpdates.systemPrompt = newPrompt;

      const { updates: allowed, skipped } = filterLockedUpdates(c.identity, candidateUpdates);

      if (skipped.length > 0) skippedLocked += 1;

      if (Object.keys(allowed).length > 0) {
        await prisma.character.update({
          where: { id: c.id },
          data: allowed as Prisma.CharacterUpdateInput,
        });
        touched += 1;
        changes.push({ id: c.id, name: c.name, skipped: skipped.length > 0 ? skipped : undefined });
      }
    }
    return reply.send({ touched, skippedLocked, changes });
  });

  // POST /characters/:id/generate-backstory — generate a draft
  // backstory using the character's bio + Subtaste + identity
  // envelope + voice samples + authoredBy. Returns the draft text;
  // does NOT save (the user reviews and edits before saving via
  // PATCH /characters/:id { backstory: ... }). Cheap (Haiku) +
  // throttled by the existing LLM budget.
  fastify.post<{ Params: { id: string } }>('/characters/:id/generate-backstory', async (request, reply) => {
    const { id } = request.params;
    const character = await prisma.character.findUnique({ where: { id } });
    if (!character) return reply.code(404).send({ error: 'Character not found' });

    // Lazy import so route file stays light.
    const { callLlm, hasLlmProvider, LlmBudgetError } = await import('../lib/llm.js');
    if (!hasLlmProvider()) {
      return reply.code(400).send({
        error: 'No LLM provider configured. Set ANTHROPIC_API_KEY in apps/api/.env.',
      });
    }

    const ts = (character.timelineState as Record<string, unknown>) || {};
    const oripheonGen = ((ts.oripheon as Record<string, unknown>)?.generated ?? {}) as Record<string, unknown>;
    const subtaste = oripheonGen.subtaste as { code?: string; glyph?: string; label?: string } | undefined;
    const voiceSamples = Array.isArray(character.voiceSamples)
      ? (character.voiceSamples as string[]).filter((s) => typeof s === 'string')
      : [];

    const samplesBlock =
      voiceSamples.length > 0
        ? `\n## Voice samples (match this register; do not quote)\n${voiceSamples
            .map((s, i) => `--- Sample ${i + 1} ---\n${s}`)
            .join('\n\n')}`
        : '';

    const subtasteLine = subtaste?.code
      ? `Their Subtaste signature: ${subtaste.code}${subtaste.glyph ? ' ' + subtaste.glyph : ''}${subtaste.label ? ' (' + subtaste.label + ')' : ''}.`
      : '';

    const authorLine = character.authoredBy
      ? `Authored by ${character.authoredBy}. Write in their register.`
      : '';

    const system = [
      'You write character backstories for the Bóveda living-character OS.',
      'A backstory is depth, history, and contradictions only the character carries. It is never displayed publicly and never quoted by the character. It is read by the tick LLM as background to inform behaviour.',
      'Three short paragraphs. Specific, sensory, contradictory. Avoid clichés. Avoid balanced both-sides hedging. Avoid em dashes. Write declaratively.',
      'Do not name yourself as the author. Do not narrate the character. Write the backstory as a frank document the character would not share, but that an oracle reading them might know.',
      authorLine,
    ]
      .filter(Boolean)
      .join('\n');

    const user = [
      `Character name: ${character.name}`,
      character.bio ? `Public bio (their voice anchor): ${character.bio}` : '',
      character.aliases.length > 0 ? `Aliases: ${character.aliases.join(', ')}` : '',
      subtasteLine,
      character.personaTags.length > 0 ? `Persona tags: ${character.personaTags.join(', ')}` : '',
      samplesBlock,
      '',
      `Now write three short paragraphs of backstory for ${character.name}. Specific, sensory, contradictory. Things they don't show on the surface.`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const result = await callLlm({ system, user, maxTokens: 600, cacheSystem: true });
      if (!result.text) {
        return reply.code(502).send({ error: 'Empty response from LLM' });
      }
      return reply.send({
        characterId: character.id,
        draft: result.text,
        source: result.source,
        usage: result.usage,
      });
    } catch (err) {
      if (err instanceof LlmBudgetError) {
        return reply.code(402).send({ error: err.message });
      }
      return reply.code(502).send({
        error: err instanceof Error ? err.message : 'Generation failed',
      });
    }
  });

  // POST /characters/sync-oripheon-all - Sync oripheon data for all characters
  fastify.post('/characters/sync-oripheon-all', async (_request, reply) => {
    const characters = await prisma.character.findMany();
    const results = [];

    for (const character of characters) {
      const { status } = await syncOripheonForCharacter(character);
      results.push({ id: character.id, name: character.name, status });
    }

    return reply.send({ synced: results.length, results });
  });
}
