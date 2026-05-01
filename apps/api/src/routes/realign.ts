import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../db.js';
import { callLlm, hasLlmProvider, LlmBudgetError } from '../lib/llm.js';
import { LINEAGES, lineageContext, listLineages } from '../lib/lineages.js';
import { isFieldLocked } from '../lib/identity-lock.js';
import { stripEmDashes } from '../lib/strip-em-dashes.js';

/**
 * Aligned character generator. The "sheaf theory" version.
 *
 * Takes a single anchor (lineage + Subtaste + brief) and generates
 * every requested field in one Claude call so they cohere as a
 * whole. Bio mentions a name; the name shows up in aliases;
 * persona tags and goals carry the lineage's register; backstory
 * deepens what the bio sketches.
 *
 * Replaces the old "Cormac MacCrae is a Celtic demon" mismatch
 * where each field was rolled independently against unaligned
 * tables.
 *
 * Endpoints:
 *   GET  /lineages                       — catalogue for the picker UI
 *   POST /characters/:id/realign         — regenerate aligned fields on an existing character
 */

const FIELD_OPTIONS = ['bio', 'backstory', 'aliases', 'personaTags', 'goals', 'tongue'] as const;
type RealignField = (typeof FIELD_OPTIONS)[number];

const RealignSchema = z.object({
  // Single string for back-compat with existing callers; array for
  // multi-lineage blends (Yoruba + Vodou). Either form accepted.
  lineage: z.union([z.string(), z.array(z.string())]).optional(),
  brief: z.string().optional(),
  subtasteCode: z.string().optional(),
  fields: z.array(z.enum(FIELD_OPTIONS)).default(['bio', 'backstory', 'aliases', 'personaTags', 'goals', 'tongue']),
  /** When true, write the generated fields onto the character.
   *  When false, just return the draft for review. Default false
   *  so the user can preview before committing. */
  apply: z.boolean().default(false),
  /** Skip locked fields silently rather than refusing. Default true.
   *  Locked fields (Ubani's bio after Starforge import) should not
   *  be auto-realigned. */
  respectLocks: z.boolean().default(true),
});

interface TongueShape {
  primaryLanguage?: string;
  dialect?: string;
  accent?: string;
  idioms?: string[];
  registerNotes?: string;
}

interface AlignedDraft {
  bio?: string;
  backstory?: string;
  aliases?: string[];
  personaTags?: string[];
  goals?: string[];
  tongue?: TongueShape;
}

function readSubtasteFromTimelineState(ts: unknown): { code?: string; glyph?: string; label?: string } | null {
  if (!ts || typeof ts !== 'object') return null;
  const oripheon = (ts as Record<string, unknown>).oripheon as Record<string, unknown> | undefined;
  const generated = oripheon?.generated as Record<string, unknown> | undefined;
  const subtaste = generated?.subtaste as Record<string, unknown> | undefined;
  if (!subtaste) return null;
  return {
    code: typeof subtaste.code === 'string' ? subtaste.code : undefined,
    glyph: typeof subtaste.glyph === 'string' ? subtaste.glyph : undefined,
    label: typeof subtaste.label === 'string' ? subtaste.label : undefined,
  };
}

const SUBTASTE_GLYPHS: Record<string, { glyph: string; label: string; essence: string }> = {
  'S-0': { glyph: 'KETH', label: 'Visionary', essence: 'The unmarked throne.' },
  'T-1': { glyph: 'STRATA', label: 'Architectural', essence: 'Hidden architecture.' },
  'V-2': { glyph: 'OMEN', label: 'Prophetic', essence: 'What arrives before itself.' },
  'L-3': { glyph: 'SILT', label: 'Developmental', essence: 'Patient sediment.' },
  'C-4': { glyph: 'CULL', label: 'Editorial', essence: 'The necessary cut.' },
  'N-5': { glyph: 'LIMN', label: 'Integrative', essence: 'To illuminate by edge.' },
  'H-6': { glyph: 'TOLL', label: 'Advocacy', essence: 'The bell that cannot be unheard.' },
  'P-7': { glyph: 'VAULT', label: 'Archival', essence: 'What is kept.' },
  'D-8': { glyph: 'WICK', label: 'Channelling', essence: 'Draws flame upward without burning.' },
  'F-9': { glyph: 'ANVIL', label: 'Manifestation', essence: 'Where pressure becomes form.' },
  'R-10': { glyph: 'SCHISM', label: 'Contrarian', essence: 'The productive fracture.' },
  'Ø': { glyph: 'VOID', label: 'Receptive', essence: 'The deliberate absence.' },
};

// Per-Subtaste tonal sensibility. Concrete behavioural textures so
// the LLM generates lifestyle specifics, refusals, places, and
// attitude rather than abstract description. Each entry lists 5-8
// behavioural signals + an explicit "do not write generically"
// directive. Keyed by designation code.
const SUBTASTE_SENSIBILITY: Record<string, string> = {
  'S-0': `KETH (Visionary): first in line without announcing. Has a uniform of some kind. Doesn't explain decisions. Already booked the table. People defer without knowing why. Quiet authority. No need to convince. Specifics: arrives early, sits where they want, makes the room reorganise around them.`,
  'T-1': `STRATA (Architectural): read every endnote. Has a system for everything. Designs the room before furnishing it. Explains the structure underneath. Specifics: spreadsheet-mind, color-coded folders, knows the building's load-bearing walls, would rather plan twice than build twice.`,
  'V-2': `OMEN (Prophetic): saw it coming. Recommended the band three years before they broke. Already moved on by the time it lands. Speaks in slightly offset future tense. Specifics: passed on the apartment that doubled, told you about the bar before it had a sign, leaves parties early.`,
  'L-3': `SILT (Developmental): plays the long game. Remembers what you said three years ago. Tends to one project for a decade. Refuses momentum-thinking. Specifics: same three friends since secondary school, has watered the same plant for fifteen years, takes the slow train on purpose.`,
  'C-4': `CULL (Editorial): sparse. Refuses what doesn't earn. Names what's wrong before what's right. Brutally honest. Curated taste. Specifics: example texture for calibration: "curated the best art galleries in their past life, hangs out at Frieze and throws truffles at the cube, only goes to Annabel's on a leap year, expert at elite art gallery curation, doesn't need a sugar daddy." Concrete places, specific refusals, lifestyle markers, defiant attitude. THIS is the depth and specificity to reach for: real venues, real refusals, real expertise, real attitude. Not abstract description.`,
  'N-5': `LIMN (Integrative): pairs that shouldn't work but do. Edges illuminate centres. Brings two scenes together. The connector at the party. Specifics: friends with both factions, made the playlist that converted skeptics, introduces people who needed to meet but didn't know.`,
  'H-6': `TOLL (Advocacy): won't let it go. Tells you the same thing three times. The cause is specific. Repetition is conviction. Specifics: posts the same article, brings the same topic to every dinner, will outlast your fatigue, the bell that cannot be unheard.`,
  'P-7': `VAULT (Archival): owns formats you can't play. Cites obscure sources. Keeps things others discard. Library mind. Specifics: vinyl in a climate-controlled room, knows the second album that was better than the first, has the receipt from 2009, three rooms of books deep.`,
  'D-8': `WICK (Channelling): uncanny recommendations they can't explain. Receives more than constructs. "It just felt right." Specifics: dreams that come true with mild edits, picks the right tarot card without trying, hears the radio say what they were thinking, can't tell you why but is rarely wrong.`,
  'F-9': `ANVIL (Manifestation): has built a thing. Ships. While others talk. Pressure into form. Specifics: finished the album, wrote the thesis, opened the studio, did the renovation themselves. Less interested in critique than the next build. Calluses on the hands.`,
  'R-10': `SCHISM (Contrarian): the productive fracture. Disagrees structurally. Their takes age strangely. What seemed wrong becomes obvious. Specifics: walked out of the meeting, broke up the band that was about to make it, said the unsayable at dinner, has been right twice and wrong once and won't apologise.`,
  'Ø': `VOID (Receptive): listens longer than anyone. Recommendations feel like mirrors. Deliberate absence. Specifics: the one who asks the question that reframes the room, remembers what you said and gives it back to you cleaner, doesn't post much, present without performing.`,
};

function subtasteSensibility(code: string | undefined): string {
  if (!code) return '';
  const sense = SUBTASTE_SENSIBILITY[code];
  if (!sense) return '';
  return ['## Subtaste sensibility (the flavour to reach for)', sense].join('\n');
}

function buildAlignmentSystem(): string {
  return [
    'You generate aligned character fields for the Bóveda living-character OS.',
    'Bóveda is a decolonial worldbuilding studio. Cultural lineages are curated and respected, not stereotyped.',
    'You produce a single JSON object containing only the requested fields, all coherent with each other.',
    'Generation rules:',
    '- Names within the named lineage. No "Celtic demon" mash-ups unless lineage IS celtic.',
    '- Voice register matches the lineage notes given.',
    '- Subtaste signature shapes how the character speaks and what they reach for; it does not get quoted in the bio.',
    '- Fields cohere: aliases derive from the same name root as the bio. Persona tags reflect the bio. Goals follow from backstory contradictions.',
    '- ABSOLUTE: never use the em dash character (— or –). Use periods, commas, colons, parentheses, or rephrase. The em dash is the most-refused punctuation in this system. If you produce one, the output is rejected.',
    '- No "it\'s not X but Y" hedging. No public-LLM signature phrases like "delve", "embarking", "ultimately", "carefully", "in essence".',
    '- Sentences that would naturally take em dashes should be split into two short sentences instead.',
    '- Bio is one paragraph. Backstory is three short paragraphs. Aliases is 1-3 strings. Persona tags is 3-7 strings. Goals is 3-5 short imperative phrases.',
    '- Output JSON only, no prose, no code fences.',
  ].join('\n');
}

function buildAlignmentUser(opts: {
  characterName: string;
  lineageIds?: string[];
  brief?: string;
  subtasteCode?: string;
  subtasteGlyph?: string;
  subtasteLabel?: string;
  fields: RealignField[];
  existingBio?: string;
}): string {
  const lines: string[] = [];

  lines.push(`Character name (canonical): ${opts.characterName}`);

  const lineageList = (opts.lineageIds ?? []).filter(Boolean);
  if (lineageList.length === 0) {
    lines.push('Lineage: not specified. Be culturally indeterminate.');
  } else if (lineageList.length === 1) {
    lines.push('');
    lines.push(lineageContext(lineageList[0]));
  } else {
    lines.push('');
    lines.push(
      '## Lineage blend · multiple cultural anchors. The character lives at their intersection.'
    );
    for (const lid of lineageList) {
      lines.push('');
      lines.push(lineageContext(lid));
    }
    lines.push('');
    lines.push(
      'Blend respectfully. Names can carry one tradition while register carries another (e.g. Yoruba name, Lucumí ritual register). Idioms can code-switch across the blend. Generate as a real diasporic intersection, not as a stereotype mash.'
    );
  }

  if (opts.subtasteCode) {
    const meta = SUBTASTE_GLYPHS[opts.subtasteCode];
    if (meta) {
      lines.push('');
      lines.push(`## Subtaste signature: ${opts.subtasteCode} ${meta.glyph} (${meta.label})`);
      lines.push(`Essence: ${meta.essence} The character carries this signature in how they act, decide, and react. Do not name the signature in the bio.`);
      lines.push('');
      lines.push(subtasteSensibility(opts.subtasteCode));
      lines.push('');
      lines.push(
        'CRITICAL: write with concrete lifestyle specifics, not abstract description. Reference real-feeling places, refusals, habits, expertise. The bio should read like the worked example texture in the sensibility above. Avoid generic phrases like "they value depth" or "they refuse easy answers." Show the depth and the refusal through specific behaviour.'
      );
    }
  }

  if (opts.brief) {
    lines.push('');
    lines.push(`## Brief from the author`);
    lines.push(opts.brief);
  }

  if (opts.existingBio) {
    lines.push('');
    lines.push(`## Existing bio (refine, do not contradict)`);
    lines.push(opts.existingBio);
  }

  lines.push('');
  lines.push('## Output schema');
  lines.push(
    'Return JSON with exactly the requested fields. Required fields:'
  );
  for (const f of opts.fields) {
    if (f === 'bio') lines.push('  bio: string (one short paragraph, 3-5 sentences. Concrete lifestyle specifics, real-feeling places, real refusals, real expertise. Match the Subtaste sensibility texture above. Do not name the Subtaste glyph or label in the bio.)');
    else if (f === 'backstory')
      lines.push(
        '  backstory: string (three short paragraphs. Resonate with the Subtaste sensibility: same flavour as the bio but deeper. Specific places, specific failures, specific expertise. The Editorial Subtaste should produce a backstory full of named exhibits, gallerists they outlasted, dinner refusals, the year they walked out. The Visionary should produce one full of rooms they entered first. Specific. Lived-in. Never abstract. Never quoted by the character.)'
      );
    else if (f === 'aliases') lines.push('  aliases: string[] (1-3 names within the lineage\'s naming pattern)');
    else if (f === 'personaTags')
      lines.push('  personaTags: string[] (3-7 lowercase tags, lineage-aware, no generic AI tags)');
    else if (f === 'goals') lines.push('  goals: string[] (3-5 short imperative phrases, what the character is reaching toward)');
    else if (f === 'tongue')
      lines.push(
        '  tongue: { primaryLanguage: string, dialect: string, accent: string, idioms: string[] (3-6 specific phrases this character uses), registerNotes: string (one sentence on cadence/refusals) } — anchored to lineage. NOT generic. Specific dialect (Lagos pidgin, AAVE, Kreyòl, Yoruba code-switch, south London, etc.) so the character does not converge on standard English.'
      );
  }
  lines.push('');
  lines.push('Output JSON only.');
  return lines.join('\n');
}

// (em-dash strip imported at top)

function parseDraft(text: string): AlignedDraft | null {
  if (!text) return null;
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    if (!parsed || typeof parsed !== 'object') return null;
    const draft: AlignedDraft = {};
    if (typeof parsed.bio === 'string') draft.bio = stripEmDashes(parsed.bio.trim());
    if (typeof parsed.backstory === 'string') draft.backstory = stripEmDashes(parsed.backstory.trim());
    if (Array.isArray(parsed.aliases))
      draft.aliases = parsed.aliases.filter((a: unknown) => typeof a === 'string').map((a: string) => a.trim()).filter(Boolean);
    if (Array.isArray(parsed.personaTags))
      draft.personaTags = parsed.personaTags
        .filter((a: unknown) => typeof a === 'string')
        .map((a: string) => a.trim().toLowerCase())
        .filter(Boolean);
    if (Array.isArray(parsed.goals))
      draft.goals = parsed.goals.filter((a: unknown) => typeof a === 'string').map((a: string) => a.trim()).filter(Boolean);
    if (parsed.tongue && typeof parsed.tongue === 'object') {
      const t = parsed.tongue as Record<string, unknown>;
      const tongue: TongueShape = {};
      if (typeof t.primaryLanguage === 'string') tongue.primaryLanguage = t.primaryLanguage.trim();
      if (typeof t.dialect === 'string') tongue.dialect = t.dialect.trim();
      if (typeof t.accent === 'string') tongue.accent = t.accent.trim();
      if (Array.isArray(t.idioms))
        tongue.idioms = (t.idioms as unknown[])
          .filter((i) => typeof i === 'string')
          .map((i) => (i as string).trim())
          .filter(Boolean);
      if (typeof t.registerNotes === 'string') tongue.registerNotes = t.registerNotes.trim();
      if (Object.keys(tongue).length > 0) draft.tongue = tongue;
    }
    return draft;
  } catch {
    return null;
  }
}

export async function realignRoutes(fastify: FastifyInstance): Promise<void> {
  // Lineage catalogue for the picker UI.
  fastify.get('/lineages', async (_request, reply) => {
    return reply.send({ lineages: listLineages() });
  });

  // Per-character realignment.
  fastify.post<{ Params: { id: string } }>(
    '/characters/:id/realign',
    async (request, reply) => {
      const { id } = request.params;
      const body = RealignSchema.parse(request.body ?? {});

      const character = await prisma.character.findUnique({ where: { id } });
      if (!character) return reply.code(404).send({ error: 'Character not found' });

      if (!hasLlmProvider()) {
        return reply.code(400).send({
          error: 'No ANTHROPIC_API_KEY set. Aligned generation requires a real LLM.',
        });
      }

      // Normalise lineage to array form. Validate every id.
      const lineageIds: string[] = Array.isArray(body.lineage)
        ? body.lineage
        : body.lineage
          ? [body.lineage]
          : [];
      const unknownLineages = lineageIds.filter((l) => !LINEAGES[l]);
      if (unknownLineages.length > 0) {
        return reply.code(400).send({
          error: `Unknown lineage(s): ${unknownLineages.join(', ')}. Get the list from GET /lineages.`,
        });
      }

      // Resolve subtaste: explicit > stored on character > none.
      let subtasteCode = body.subtasteCode;
      let subtasteGlyph: string | undefined;
      let subtasteLabel: string | undefined;
      if (!subtasteCode) {
        const stored = readSubtasteFromTimelineState(character.timelineState);
        subtasteCode = stored?.code;
      }
      if (subtasteCode) {
        const meta = SUBTASTE_GLYPHS[subtasteCode];
        if (meta) {
          subtasteGlyph = meta.glyph;
          subtasteLabel = meta.label;
        }
      }

      const system = buildAlignmentSystem();
      const user = buildAlignmentUser({
        characterName: character.name,
        lineageIds,
        brief: body.brief,
        subtasteCode,
        subtasteGlyph,
        subtasteLabel,
        fields: body.fields,
        existingBio: character.bio || undefined,
      });

      let result;
      try {
        result = await callLlm({ system, user, maxTokens: 1200, cacheSystem: true });
      } catch (err) {
        if (err instanceof LlmBudgetError) {
          return reply.code(402).send({ error: err.message });
        }
        return reply.code(502).send({
          error: err instanceof Error ? err.message : 'Generation failed',
        });
      }

      const draft = parseDraft(result.text);
      if (!draft) {
        return reply.code(502).send({
          error: 'Generation succeeded but JSON parse failed.',
          rawText: result.text.slice(0, 500),
        });
      }

      // Filter to requested fields only (defensive).
      const filtered: AlignedDraft = {};
      for (const f of body.fields) {
        if (draft[f] !== undefined) (filtered as Record<string, unknown>)[f] = draft[f];
      }

      // If apply=true, write the draft to the character (respecting locks).
      if (body.apply) {
        const updates: Prisma.CharacterUpdateInput = {};
        const skipped: string[] = [];

        for (const f of body.fields) {
          if (filtered[f] === undefined) continue;
          if (body.respectLocks && isFieldLocked(character.identity, f as Parameters<typeof isFieldLocked>[1])) {
            skipped.push(f);
            continue;
          }
          if (f === 'bio' && filtered.bio !== undefined) updates.bio = filtered.bio;
          else if (f === 'backstory' && filtered.backstory !== undefined) updates.backstory = filtered.backstory;
          else if (f === 'aliases' && filtered.aliases !== undefined) updates.aliases = filtered.aliases;
          else if (f === 'personaTags' && filtered.personaTags !== undefined) updates.personaTags = filtered.personaTags;
          else if (f === 'goals' && filtered.goals !== undefined)
            updates.goals = filtered.goals as unknown as Prisma.InputJsonValue;
          else if (f === 'tongue' && filtered.tongue !== undefined)
            updates.tongue = filtered.tongue as unknown as Prisma.InputJsonValue;
        }

        if (Object.keys(updates).length > 0) {
          await prisma.character.update({ where: { id }, data: updates });
        }

        return reply.send({
          characterId: id,
          draft: filtered,
          applied: true,
          skipped,
          source: result.source,
          usage: result.usage,
        });
      }

      return reply.send({
        characterId: id,
        draft: filtered,
        applied: false,
        source: result.source,
        usage: result.usage,
      });
    }
  );
}
