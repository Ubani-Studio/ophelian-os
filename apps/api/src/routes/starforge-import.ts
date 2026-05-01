import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { z } from 'zod';
import { cleanGeneratedText } from '../lib/strip-em-dashes.js';

/**
 * POST /characters/:id/import-from-starforge
 *
 * Pulls Twin OS context from Starforge for the given user, writes a
 * Starforge-aware bio onto the Bóveda Character, sets the canonical
 * Subtaste twelve glyph from Starforge's classification, and locks
 * the identity fields so subsequent auto-rolls (sync-oripheon-all,
 * bulk-import-tizita) leave them alone.
 *
 * The smallest cut of the parked identity-lock-in work in
 * docs/identity-lock-and-starforge.md, scoped to one character.
 *
 * Body:
 *   { starforgeUserId: string, starforgeBaseUrl?: string,
 *     markAsUser?: boolean (default true), email?: string }
 *
 * Behaviour:
 *  - Starforge unreachable: 502, no DB write
 *  - Starforge response missing subtaste: warns but still writes bio
 *    from audio/visual DNA where available
 *  - Always preserves the canonical Character.name. Bio is rewritten
 *    in the character's voice using {name} as variable.
 */

const STARFORGE_DEFAULT_BASE = process.env.STARFORGE_API_URL || 'http://localhost:5000/api';

const ImportSchema = z.object({
  starforgeUserId: z.string().min(1),
  starforgeBaseUrl: z.string().url().optional(),
  markAsUser: z.boolean().default(true),
  email: z.string().email().optional(),
});

interface StarforgeContext {
  success: boolean;
  user_id: string;
  twin_os?: {
    audio_dna?: {
      primary_genre?: string;
      taste_coherence?: number;
      style_description?: string | null;
    };
    visual_dna?: {
      themes?: string[];
      warmth?: number;
      energy?: number;
      art_movements?: Array<string | { name?: string }>;
    };
    cross_modal_coherence?: number | null;
    archetype?: string;
    brand_keywords?: string[];
  };
  subtaste?: {
    archetype?: {
      primary?: {
        designation?: string;
        glyph?: string;
        creativeMode?: string;
        essence?: string;
        sigil?: string;
      };
      secondary?: { designation?: string; glyph?: string } | null;
    } | null;
  } | null;
  content_guidance?: {
    caption_voice?: string;
    preserve_terms?: string[];
  };
}

interface NommoArchetypeEntry {
  designation?: string;
  glyph?: string;
  confidence?: number;
}

interface NommoGenome {
  success?: boolean;
  source?: string;
  genome?: {
    archetype?: {
      primary?: NommoArchetypeEntry;
      secondary?: NommoArchetypeEntry | null;
      tertiary?: NommoArchetypeEntry | null;
      distribution?: Record<string, number>;
    };
    keywords?: Record<string, Record<string, { score?: number; count?: number }>>;
    confidence?: number;
    tasteTypicality?: number;
    signalCount?: number;
    stagesCompleted?: string[];
  };
  // Some endpoints flatten the genome onto the top level. Tolerate both.
  primary?: NommoArchetypeEntry;
  secondary?: NommoArchetypeEntry | null;
  signalCount?: number;
  psychometrics?: Record<string, unknown> | null;
  stagesCompleted?: string[];
}

const GLYPH_BY_DESIGNATION: Record<string, string> = {
  'S-0': 'KETH', 'T-1': 'STRATA', 'V-2': 'OMEN', 'L-3': 'SILT',
  'C-4': 'CULL', 'N-5': 'LIMN', 'H-6': 'TOLL', 'P-7': 'VAULT',
  'D-8': 'WICK', 'F-9': 'ANVIL', 'R-10': 'SCHISM', 'Ø': 'VOID',
};
const MODE_BY_DESIGNATION: Record<string, string> = {
  'S-0': 'Visionary', 'T-1': 'Architectural', 'V-2': 'Prophetic',
  'L-3': 'Developmental', 'C-4': 'Editorial', 'N-5': 'Integrative',
  'H-6': 'Advocacy', 'P-7': 'Archival', 'D-8': 'Channelling',
  'F-9': 'Manifestation', 'R-10': 'Contrarian', 'Ø': 'Receptive',
};
const ESSENCE_BY_DESIGNATION: Record<string, string> = {
  'S-0': 'The unmarked throne. First without announcement.',
  'T-1': 'The hidden architecture. Layers beneath surfaces.',
  'V-2': 'What arrives before itself. The shape of the unformed.',
  'L-3': 'Patient sediment. What accumulates in darkness.',
  'C-4': 'The necessary cut. What must be removed, removed.',
  'N-5': 'To illuminate by edge. The binding outline.',
  'H-6': 'The bell that cannot be unheard. The summons.',
  'P-7': 'What is kept. Writing over writing.',
  'D-8': 'Draws flame upward without burning. The hollow channel.',
  'F-9': 'Where pressure becomes form. The manifestation point.',
  'R-10': 'The productive fracture. What breaks to reveal grain.',
  'Ø': 'The deliberate absence. What receives by containing nothing.',
};

function glyphOf(designation: string | undefined): string {
  if (!designation) return '';
  return GLYPH_BY_DESIGNATION[designation] || designation;
}
function modeOf(designation: string | undefined): string {
  if (!designation) return '';
  return MODE_BY_DESIGNATION[designation] || '';
}
function essenceOf(designation: string | undefined): string {
  if (!designation) return '';
  return ESSENCE_BY_DESIGNATION[designation] || '';
}

interface NommoNormalised {
  primary: NommoArchetypeEntry | null;
  secondary: NommoArchetypeEntry | null;
  tertiary: NommoArchetypeEntry | null;
  shadow: { designation: string; weight: number } | null;
  distribution: Array<{ designation: string; weight: number }>;
  signalCount: number;
  confidence: number | null;
  tasteTypicality: number | null;
  stagesCompleted: string[];
}

function normaliseNommo(raw: NommoGenome | null): NommoNormalised | null {
  if (!raw) return null;
  const g = raw.genome ?? raw;
  const arch = (g as Record<string, unknown>).archetype as
    | { primary?: NommoArchetypeEntry; secondary?: NommoArchetypeEntry | null; tertiary?: NommoArchetypeEntry | null; distribution?: Record<string, number> }
    | undefined;

  const primary = arch?.primary || raw.primary || null;
  const secondary = arch?.secondary || raw.secondary || null;
  const tertiary = arch?.tertiary || null;
  const distribution: Array<{ designation: string; weight: number }> = arch?.distribution
    ? Object.entries(arch.distribution)
        .map(([designation, weight]) => ({ designation, weight: Number(weight) }))
        .sort((a, b) => b.weight - a.weight)
    : [];

  // Shadow = the lowest-weighted designation. Skip if distribution
  // is empty or the lowest weight is too close to primary (unstable).
  let shadow: NommoNormalised['shadow'] = null;
  if (distribution.length >= 4) {
    const lowest = distribution[distribution.length - 1];
    shadow = { designation: lowest.designation, weight: lowest.weight };
  }

  return {
    primary,
    secondary,
    tertiary,
    shadow,
    distribution,
    signalCount: (g as { signalCount?: number }).signalCount ?? raw.signalCount ?? 0,
    confidence: (g as { confidence?: number }).confidence ?? null,
    tasteTypicality: (g as { tasteTypicality?: number }).tasteTypicality ?? null,
    stagesCompleted: (g as { stagesCompleted?: string[] }).stagesCompleted ?? raw.stagesCompleted ?? [],
  };
}

function buildBio(
  name: string,
  ctx: StarforgeContext,
  nommo: NommoNormalised | null
): string {
  const audio = ctx.twin_os?.audio_dna;
  const visual = ctx.twin_os?.visual_dna;
  const keywords = (ctx.twin_os?.brand_keywords || []).slice(0, 3);

  const lines: string[] = [];

  // Prefer Nommo (real quiz) over twin-context auto-derivation.
  if (nommo?.primary?.designation) {
    const pGlyph = nommo.primary.glyph || glyphOf(nommo.primary.designation);
    const pMode = modeOf(nommo.primary.designation);
    const pEssence = essenceOf(nommo.primary.designation);
    lines.push(
      `${name} carries the ${pGlyph} signature${pMode ? ` (${pMode})` : ''}.${pEssence ? ' ' + pEssence : ''}`
    );

    if (nommo.secondary?.designation) {
      const sGlyph = nommo.secondary.glyph || glyphOf(nommo.secondary.designation);
      const sMode = modeOf(nommo.secondary.designation);
      lines.push(`Counterpoint: ${sGlyph}${sMode ? ` (${sMode})` : ''}.`);
    }

    if (nommo.shadow?.designation) {
      const shGlyph = glyphOf(nommo.shadow.designation);
      const shMode = modeOf(nommo.shadow.designation);
      lines.push(`Shadow: ${shGlyph}${shMode ? ` (${shMode})` : ''} — the register they reach for least.`);
    }
  } else {
    // Fallback to twin-context subtaste only when Nommo absent.
    const subtaste = ctx.subtaste?.archetype?.primary;
    if (subtaste?.glyph && subtaste?.creativeMode) {
      lines.push(
        `${name} carries the ${subtaste.glyph} signature (${subtaste.creativeMode}).${
          subtaste.essence ? ' ' + subtaste.essence : ''
        }`
      );
    } else if (subtaste?.glyph) {
      lines.push(`${name} carries the ${subtaste.glyph} signature.`);
    } else {
      lines.push(`${name} works as themself, on their own terms.`);
    }
  }

  const senseFragments: string[] = [];
  if (audio?.primary_genre && audio.primary_genre !== 'unknown') {
    senseFragments.push(`audio cohering around ${audio.primary_genre}`);
  }
  if (visual?.themes && visual.themes.length > 0) {
    senseFragments.push(`visual register of ${visual.themes.slice(0, 3).join(', ')}`);
  }
  if (senseFragments.length > 0) {
    lines.push(`Their taste reads as ${senseFragments.join(' and ')}.`);
  }

  if (keywords.length > 0) {
    lines.push(`Brand keywords: ${keywords.join(', ')}.`);
  }

  return lines.join(' ');
}

function readLockedArray(identity: unknown): string[] {
  if (!identity || typeof identity !== 'object') return [];
  const i = identity as Record<string, unknown>;
  return Array.isArray(i.locked) ? (i.locked as string[]) : [];
}

export async function starforgeImportRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post<{ Params: { id: string } }>(
    '/characters/:id/import-from-starforge',
    async (request, reply) => {
      const { id } = request.params;
      const body = ImportSchema.parse(request.body ?? {});
      const baseUrl = body.starforgeBaseUrl || STARFORGE_DEFAULT_BASE;

      const character = await prisma.character.findUnique({ where: { id } });
      if (!character) return reply.code(404).send({ error: 'Character not found' });

      let ctx: StarforgeContext;
      try {
        // Starforge mounts the twin context route under
        // /api/twin/visual-dna/, not /api/twin/. The file's docblock
        // says /api/twin/context but the actual server.js mount is
        // /api/twin/visual-dna. Use the real path.
        const url = `${baseUrl.replace(/\/$/, '')}/twin/visual-dna/context/${encodeURIComponent(body.starforgeUserId)}`;
        const res = await fetch(url, { method: 'GET' });
        if (!res.ok) {
          return reply
            .code(502)
            .send({ error: `Starforge ${res.status}: ${(await res.text()).slice(0, 200)}` });
        }
        ctx = (await res.json()) as StarforgeContext;
      } catch (err) {
        return reply.code(502).send({
          error: `Starforge unreachable at ${baseUrl}: ${err instanceof Error ? err.message : err}`,
        });
      }

      // Also pull the Nommo genome (cached Subtaste quiz). This is
      // the higher-fidelity identity signal when present — it's the
      // user's actual taste classification rather than auto-derived.
      // Best-effort: a 404 here is normal (user hasn't taken the
      // quiz yet), the twin context still gives us enough for a bio.
      let nommo: NommoGenome | null = null;
      try {
        const nommoUrl = `${baseUrl.replace(/\/$/, '')}/subtaste/genome/${encodeURIComponent(body.starforgeUserId)}`;
        const nRes = await fetch(nommoUrl, { method: 'GET' });
        if (nRes.ok) nommo = (await nRes.json()) as NommoGenome;
      } catch {
        // Starforge may not have the subtaste integration mounted; no-op.
      }

      // Normalise Nommo: handles both wrapped (genome.archetype.*) and
      // flat (top-level primary/secondary) shapes. Derives shadow from
      // the lowest-weighted designation in the distribution.
      const nommoNorm = normaliseNommo(nommo);

      // Promote Nommo's primary archetype over the twin-context
      // subtaste when present, since it reflects the actual quiz.
      if (nommoNorm?.primary?.designation) {
        ctx.subtaste = {
          archetype: {
            primary: {
              designation: nommoNorm.primary.designation,
              glyph: nommoNorm.primary.glyph || glyphOf(nommoNorm.primary.designation),
              creativeMode: modeOf(nommoNorm.primary.designation),
              essence: essenceOf(nommoNorm.primary.designation),
              ...(ctx.subtaste?.archetype?.primary || {}),
            },
            secondary: nommoNorm.secondary
              ? {
                  designation: nommoNorm.secondary.designation,
                  glyph: nommoNorm.secondary.glyph || glyphOf(nommoNorm.secondary.designation),
                }
              : ctx.subtaste?.archetype?.secondary || null,
          },
        };
      }

      const bio = cleanGeneratedText(buildBio(character.name, ctx, nommoNorm));
      const subtasteCode = ctx.subtaste?.archetype?.primary?.designation;
      const brandKeywords = ctx.twin_os?.brand_keywords || [];
      const personaTags =
        brandKeywords.length > 0
          ? brandKeywords.slice(0, 8)
          : character.personaTags;

      // Build identity envelope. Lock the fields we just wrote so
      // sync-oripheon-all and bulk-import-tizita leave them alone.
      const previousLocked = readLockedArray(character.identity);
      const lockedSet = new Set([
        ...previousLocked,
        'name',
        'bio',
        'personaTags',
        'subtasteCode',
      ]);
      const identity = {
        locked: Array.from(lockedSet),
        source: 'starforge_nommo' as const,
        realIdentityRef: {
          starforgeUserId: body.starforgeUserId,
          ...(body.email ? { email: body.email } : {}),
        },
      };

      // Push the canonical Subtaste designation into timelineState so
      // the SubtasteBadge picks it up.
      const ts = (character.timelineState as Record<string, unknown>) || {};
      const tsOripheon = (ts.oripheon as Record<string, unknown>) || {};
      const tsGenerated = (tsOripheon.generated as Record<string, unknown>) || {};
      const tsSubtaste = (tsGenerated.subtaste as Record<string, unknown>) || {};
      const newTimelineState = {
        ...ts,
        oripheon: {
          ...tsOripheon,
          generated: {
            ...tsGenerated,
            subtaste: subtasteCode
              ? { ...tsSubtaste, code: subtasteCode }
              : tsSubtaste,
          },
        },
        starforge: {
          imported_at: new Date().toISOString(),
          archetype: ctx.subtaste?.archetype?.primary || null,
          brand_keywords: brandKeywords,
          audio_primary_genre: ctx.twin_os?.audio_dna?.primary_genre || null,
          visual_themes: ctx.twin_os?.visual_dna?.themes || [],
          cross_modal_coherence: ctx.twin_os?.cross_modal_coherence ?? null,
          caption_voice: ctx.content_guidance?.caption_voice || null,
          preserve_terms: ctx.content_guidance?.preserve_terms || [],
          // Nommo genome carries the actual quiz signal counts +
          // psychometrics. Stored alongside so downstream surfaces
          // (relational dynamics, twin-pairing) can read from it.
          nommo: nommoNorm
            ? {
                primary: nommoNorm.primary,
                secondary: nommoNorm.secondary,
                tertiary: nommoNorm.tertiary,
                shadow: nommoNorm.shadow,
                distribution: nommoNorm.distribution,
                signal_count: nommoNorm.signalCount,
                confidence: nommoNorm.confidence,
                taste_typicality: nommoNorm.tasteTypicality,
                stages_completed: nommoNorm.stagesCompleted,
                source: nommo?.source || null,
              }
            : null,
        },
      };

      const updates: Prisma.CharacterUpdateInput = {
        bio,
        personaTags,
        identity: identity as unknown as Prisma.InputJsonValue,
        timelineState: newTimelineState as unknown as Prisma.InputJsonValue,
        ...(body.markAsUser ? { isUser: true, mode: 'manual' } : {}),
      };

      const updated = await prisma.character.update({
        where: { id },
        data: updates,
      });

      return reply.send({
        ok: true,
        characterId: updated.id,
        name: updated.name,
        isUser: updated.isUser,
        bio: updated.bio,
        subtasteCode,
        identity,
        starforge: newTimelineState.starforge,
      });
    }
  );
}
