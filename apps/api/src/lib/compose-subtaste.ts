/**
 * Compose Subtaste from members.
 *
 * For a duo / group / collective Character, derive a group-level
 * Subtaste from its members'. Sheaf-theory shape: locally each
 * member carries their own signature, globally the group exposes
 * a coherent dominant + subdominant pair that the tick prompt
 * uses for the group's collective voice.
 *
 * Algorithm:
 *
 *   1. Gather member dominants (and subdominants where present)
 *      via groupMembers[*].characterId → Character.timelineState.
 *      Members without characterId are skipped (stub members).
 *
 *   2. Group DOMINANT = most-frequent dominant across members.
 *      Tiebreak by alphabetic code order (deterministic).
 *
 *   3. Group SUBDOMINANT = most-frequent NON-dominant code across
 *      member dominants + subdominants combined. Tiebreak by
 *      alphabetic code order. If only one unique code exists,
 *      subdominant is omitted.
 *
 *   4. Group SHADOW = Wu Xing overcoming-cycle of group dominant.
 *
 * The "tension hold" case: when no code appears more than once,
 * we pick the two most diverging codes by Wu Xing distance. This
 * gives groups with truly heterogeneous members a dominant /
 * subdominant pair held as productive tension rather than a
 * collapsed average that erases each member.
 *
 * Returns null when no member carries a Subtaste (group has nothing
 * to compose from).
 */

import { prisma } from '../db.js';

export interface ComposedSubtaste {
  code: string;
  glyph: string;
  label: string;
  secondaryCode?: string;
  secondaryGlyph?: string;
  secondaryLabel?: string;
  shadowCode?: string;
  shadowGlyph?: string;
  shadowLabel?: string;
  composedFrom: Array<{ characterId: string; name: string; code: string; secondaryCode?: string }>;
  reason: 'majority' | 'tension' | 'singleton';
}

const GLYPHS: Record<string, { glyph: string; label: string }> = {
  'S-0': { glyph: 'KETH', label: 'Visionary' },
  'T-1': { glyph: 'STRATA', label: 'Empirical' },
  'V-2': { glyph: 'OMEN', label: 'Symbolic' },
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

const SHADOW_OF: Record<string, string> = {
  'S-0': 'R-10', 'T-1': 'P-7', 'V-2': 'C-4', 'L-3': 'D-8',
  'C-4': 'R-10', 'N-5': 'Ø',  'H-6': 'F-9', 'P-7': 'L-3',
  'D-8': 'N-5', 'F-9': 'C-4', 'R-10': 'S-0', 'Ø': 'T-1',
};

// Wu Xing five-phase indices for distance calculation. Earth /
// Metal / Water / Wood / Fire = 0..4. The opposing element is
// distance 2 in the cycle.
const PHASE_OF: Record<string, number> = {
  'S-0': 0, 'T-1': 0,             // Earth (rooted, structural)
  'V-2': 1, 'C-4': 1,             // Metal (cutting, distilling)
  'L-3': 2, 'P-7': 2,             // Water (sediment, archive)
  'N-5': 3, 'H-6': 3,             // Wood (advocacy, growth)
  'D-8': 4, 'F-9': 4,             // Fire (channel, manifest)
  'R-10': 1, 'Ø': 2,              // R-10 = Metal-shadow, Ø = Water-receptive
};

function readSubtasteCode(timelineState: unknown): { code?: string; secondary?: string } {
  if (!timelineState || typeof timelineState !== 'object') return {};
  const ts = timelineState as Record<string, unknown>;
  const oripheon = ts.oripheon as Record<string, unknown> | undefined;
  if (!oripheon || typeof oripheon !== 'object') return {};
  const generated = oripheon.generated as Record<string, unknown> | undefined;
  if (!generated || typeof generated !== 'object') return {};
  const subtaste = generated.subtaste as { code?: string; secondaryCode?: string } | undefined;
  return {
    code: typeof subtaste?.code === 'string' ? subtaste.code : undefined,
    secondary: typeof subtaste?.secondaryCode === 'string' ? subtaste.secondaryCode : undefined,
  };
}

function pickMostFrequent(codes: string[], excludeCode?: string): string | null {
  const filtered = excludeCode ? codes.filter((c) => c !== excludeCode) : codes;
  if (filtered.length === 0) return null;
  const counts = new Map<string, number>();
  for (const c of filtered) counts.set(c, (counts.get(c) ?? 0) + 1);
  let best: { code: string; count: number } | null = null;
  for (const [code, count] of counts) {
    if (!best || count > best.count || (count === best.count && code < best.code)) {
      best = { code, count };
    }
  }
  return best?.code ?? null;
}

function pickByMaxDistance(codes: string[]): { primary: string; secondary: string } | null {
  // Used in the "tension" case: no clear majority, pick two codes
  // that sit furthest apart in Wu Xing phase space so the group
  // signature reads as held-tension rather than averaged-mush.
  if (codes.length < 2) return null;
  const unique = Array.from(new Set(codes));
  if (unique.length < 2) return null;
  let bestPair: { a: string; b: string; dist: number } | null = null;
  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      const a = unique[i];
      const b = unique[j];
      const pa = PHASE_OF[a] ?? 0;
      const pb = PHASE_OF[b] ?? 0;
      const raw = Math.abs(pa - pb);
      const dist = Math.min(raw, 5 - raw);
      if (!bestPair || dist > bestPair.dist) {
        bestPair = { a, b, dist };
      }
    }
  }
  if (!bestPair) return null;
  // Deterministic ordering: alpha-first as primary so re-runs are
  // stable across composition calls.
  const [primary, secondary] = bestPair.a < bestPair.b
    ? [bestPair.a, bestPair.b]
    : [bestPair.b, bestPair.a];
  return { primary, secondary };
}

export async function composeSubtasteFromMembers(groupId: string): Promise<ComposedSubtaste | null> {
  const group = await prisma.character.findUnique({ where: { id: groupId } });
  if (!group) return null;

  const members = Array.isArray(group.groupMembers) ? (group.groupMembers as Array<{ characterId?: string; name?: string }>) : [];
  const linkedIds = members.map((m) => m.characterId).filter((id): id is string => typeof id === 'string' && id.length > 0);
  if (linkedIds.length === 0) return null;

  const linked = await prisma.character.findMany({
    where: { id: { in: linkedIds } },
    select: { id: true, name: true, timelineState: true },
  });

  const composedFrom: ComposedSubtaste['composedFrom'] = [];
  const dominants: string[] = [];
  const allCodes: string[] = [];
  for (const m of linked) {
    const { code, secondary } = readSubtasteCode(m.timelineState);
    if (!code) continue;
    composedFrom.push({ characterId: m.id, name: m.name, code, secondaryCode: secondary });
    dominants.push(code);
    allCodes.push(code);
    if (secondary) allCodes.push(secondary);
  }

  if (composedFrom.length === 0) return null;

  // Singleton case: only one member has a Subtaste, use it directly.
  if (composedFrom.length === 1) {
    const c = composedFrom[0].code;
    const meta = GLYPHS[c];
    if (!meta) return null;
    const shadow = SHADOW_OF[c];
    return {
      code: c,
      glyph: meta.glyph,
      label: meta.label,
      shadowCode: shadow,
      shadowGlyph: shadow ? GLYPHS[shadow]?.glyph : undefined,
      shadowLabel: shadow ? GLYPHS[shadow]?.label : undefined,
      composedFrom,
      reason: 'singleton',
    };
  }

  // Majority case: a code appears more than once across dominants.
  const dominantCounts = new Map<string, number>();
  for (const c of dominants) dominantCounts.set(c, (dominantCounts.get(c) ?? 0) + 1);
  const hasMajority = Array.from(dominantCounts.values()).some((n) => n >= 2);

  let primary: string;
  let secondary: string | undefined;
  let reason: ComposedSubtaste['reason'];

  if (hasMajority) {
    primary = pickMostFrequent(dominants) as string;
    secondary = pickMostFrequent(allCodes, primary) ?? undefined;
    reason = 'majority';
  } else {
    // Tension: every dominant is unique. Hold the two most-diverging
    // codes as primary + secondary.
    const tension = pickByMaxDistance(allCodes);
    if (!tension) {
      // Fallback when distance picking fails (shouldn't happen given
      // the !hasMajority + composedFrom.length >= 2 guard, but keep
      // the type system happy).
      primary = dominants[0];
      reason = 'singleton';
    } else {
      primary = tension.primary;
      secondary = tension.secondary;
      reason = 'tension';
    }
  }

  const primaryMeta = GLYPHS[primary];
  if (!primaryMeta) return null;
  const secondaryMeta = secondary ? GLYPHS[secondary] : undefined;
  const shadow = SHADOW_OF[primary];
  const shadowMeta = shadow ? GLYPHS[shadow] : undefined;

  return {
    code: primary,
    glyph: primaryMeta.glyph,
    label: primaryMeta.label,
    secondaryCode: secondary,
    secondaryGlyph: secondaryMeta?.glyph,
    secondaryLabel: secondaryMeta?.label,
    shadowCode: shadow,
    shadowGlyph: shadowMeta?.glyph,
    shadowLabel: shadowMeta?.label,
    composedFrom,
    reason,
  };
}

/**
 * Persist a composed Subtaste onto a group character's
 * timelineState.oripheon.generated.subtaste, preserving the source
 * shape used everywhere else (SubtastePicker, realign, tick).
 */
export async function applyComposedSubtaste(groupId: string, composed: ComposedSubtaste): Promise<void> {
  const group = await prisma.character.findUnique({ where: { id: groupId } });
  if (!group) return;
  const ts = (group.timelineState as Record<string, unknown>) ?? {};
  const oripheon = (ts.oripheon as Record<string, unknown>) ?? {};
  const generated = (oripheon.generated as Record<string, unknown>) ?? {};
  const newSubtaste: Record<string, unknown> = {
    code: composed.code,
    glyph: composed.glyph,
    label: composed.label,
  };
  if (composed.secondaryCode) {
    newSubtaste.secondaryCode = composed.secondaryCode;
    newSubtaste.secondaryGlyph = composed.secondaryGlyph;
    newSubtaste.secondaryLabel = composed.secondaryLabel;
  }
  if (composed.shadowCode) {
    newSubtaste.shadowCode = composed.shadowCode;
    newSubtaste.shadowGlyph = composed.shadowGlyph;
    newSubtaste.shadowLabel = composed.shadowLabel;
  }
  newSubtaste.composedFromMembers = composed.composedFrom;
  newSubtaste.composedReason = composed.reason;
  await prisma.character.update({
    where: { id: groupId },
    data: {
      timelineState: {
        ...ts,
        oripheon: {
          ...oripheon,
          generated: {
            ...generated,
            subtaste: newSubtaste,
          },
        },
      } as never,
    },
  });
}
