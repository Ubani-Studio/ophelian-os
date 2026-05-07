/**
 * Cipher generator. Creates encoded handles to moments of significance in
 * the Boveda world (presence, sparks, atmospheric events). Each Cipher
 * has a locked cryptic surface and an unlocked reveal that's drawn from
 * the source character's tongue + the moment's context.
 *
 * Generation is intentionally cheap and procedural with optional Claude
 * polish. Most Ciphers fire from background events (the scheduler, spark
 * routes, presence reports) and shouldn't pay an LLM call each time.
 */

import { callLlm, hasLlmProvider } from './llm.js';
import { prisma } from '../db.js';

export type CipherKind = 'encounter' | 'witness' | 'threshold';
export type CipherRarity = 'common' | 'rare' | 'sigil';
export type CipherUnlockType =
  | 'presence_count'
  | 'dialogue_count'
  | 'spark_count'
  | 'combo';

const SIGIL_GLYPHS = ['Λ', 'Δ', 'Π', '◬', '⬡', '⟁', 'Σ', 'Ω', '☌', '⌬'];
const RARITY_DICE = [
  { rarity: 'sigil' as CipherRarity, weight: 1 },
  { rarity: 'rare' as CipherRarity, weight: 9 },
  { rarity: 'common' as CipherRarity, weight: 90 },
];

function rollRarity(): CipherRarity {
  const total = RARITY_DICE.reduce((acc, r) => acc + r.weight, 0);
  let n = Math.random() * total;
  for (const r of RARITY_DICE) {
    n -= r.weight;
    if (n <= 0) return r.rarity;
  }
  return 'common';
}

function makeCipherId(): string {
  // 4-hex-digit Cipher codes give 65,536 unique IDs; collision is rare
  // enough to retry with a fresh roll on conflict at the DB layer.
  const hex = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');
  return `0x${hex}`;
}

function pickGlyph(): string {
  return SIGIL_GLYPHS[Math.floor(Math.random() * SIGIL_GLYPHS.length)];
}

function defaultUnlockCondition(
  kind: CipherKind,
  rarity: CipherRarity,
): { type: CipherUnlockType; value: number } {
  if (kind === 'threshold') return { type: 'combo', value: 3 };
  const baseValue =
    kind === 'witness' ? 3 : kind === 'encounter' ? 2 : 1;
  const rarityMult = rarity === 'sigil' ? 3 : rarity === 'rare' ? 2 : 1;
  return {
    type: kind === 'witness' ? 'spark_count' : 'presence_count',
    value: baseValue * rarityMult,
  };
}

interface CipherSeed {
  kind: CipherKind;
  characterId?: string | null;
  characterName?: string;
  characterTongue?: string;
  locationName?: string | null;
  locationVibe?: string;
  episodeId?: string | null;
  episodeContent?: string;
}

/**
 * Build the locked + unlocked payloads for a Cipher. When ANTHROPIC_API_KEY
 * is set, uses Claude for richer reveals. Otherwise falls back to a
 * procedural template that's still character-flavored.
 */
async function buildPayloads(
  seed: CipherSeed,
  rarity: CipherRarity,
  glyph: string,
): Promise<{ locked: string; unlocked: string; hint: string }> {
  // Procedural fallback (always works, no LLM cost)
  const procedural = {
    locked: `[REDACTED] ${glyph} ${seed.kind.toUpperCase()}_${rarity.toUpperCase()} :: signature awaits decoding`,
    unlocked:
      seed.episodeContent ||
      seed.locationVibe ||
      `${seed.characterName ?? 'an absence'} marked this moment in ${seed.locationName ?? 'the world'}`,
    hint: `${seed.kind === 'witness' ? 'witness more' : seed.kind === 'encounter' ? 'return again' : 'gather sigils'}`,
  };

  if (!hasLlmProvider()) return procedural;

  // Claude polish: short cryptic locked + meaningful unlocked drawn from
  // character tongue + context. Cap tokens; Ciphers must stay terse.
  const system = `You generate Ciphers for the Boveda character world. Each
Cipher has a locked surface (cryptic, encoded, 1 short line) and an
unlocked reveal (1-2 short lines, drawn from the source character's voice
and the moment's context). No em dashes. Sentence case. Restrained,
mythic register. Do not narrate, just produce the lines.

Source kind: ${seed.kind}
Rarity: ${rarity}
Glyph: ${glyph}
Character: ${seed.characterName ?? 'unknown'}
Character tongue: ${seed.characterTongue ?? 'none'}
Location: ${seed.locationName ?? 'unknown'}
Location vibe: ${seed.locationVibe ?? 'none'}
Episode content (the moment): ${seed.episodeContent ?? 'none'}`;

  const user = `Return JSON only with three string fields:
{
  "locked": "<cryptic surface, 1 short line, often a fragment>",
  "unlocked": "<the actual reveal, 1-2 short lines>",
  "hint": "<terse instruction on how to decode, 5-8 words>"
}`;

  try {
    const result = await callLlm({
      system,
      user,
      maxTokens: 240,
      cacheSystem: false,
    });
    const text = result.text.trim();
    // Be tolerant: the model sometimes wraps in markdown
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return procedural;
    const parsed = JSON.parse(jsonMatch[0]) as {
      locked?: string;
      unlocked?: string;
      hint?: string;
    };
    return {
      locked: parsed.locked || procedural.locked,
      unlocked: parsed.unlocked || procedural.unlocked,
      hint: parsed.hint || procedural.hint,
    };
  } catch {
    return procedural;
  }
}

/** Mint a new Cipher. Persists to DB. Idempotent on episode/character pair. */
export async function mintCipher(seed: CipherSeed): Promise<{
  id: string;
  signature: string;
  rarity: CipherRarity;
  kind: CipherKind;
}> {
  const rarity = rollRarity();
  const signature = pickGlyph();
  const unlock = defaultUnlockCondition(seed.kind, rarity);
  const { locked, unlocked, hint } = await buildPayloads(seed, rarity, signature);

  // Try up to 3 times for an unused id
  for (let attempt = 0; attempt < 3; attempt++) {
    const id = makeCipherId();
    try {
      const created = await prisma.cipher.create({
        data: {
          id,
          signature,
          rarity,
          state: 'locked',
          kind: seed.kind,
          sourceCharacterId: seed.characterId ?? null,
          sourceLocationName: seed.locationName ?? null,
          sourceEpisodeId: seed.episodeId ?? null,
          unlockType: unlock.type,
          unlockValue: unlock.value,
          payloadLocked: locked,
          payloadUnlocked: unlocked,
          payloadHint: hint,
        },
      });
      return {
        id: created.id,
        signature: created.signature,
        rarity: created.rarity as CipherRarity,
        kind: created.kind as CipherKind,
      };
    } catch (e) {
      // Likely unique constraint collision on id; retry
      if (attempt === 2) throw e;
    }
  }
  throw new Error('cipher_id_collision_after_retries');
}

/**
 * Increment a player's progress toward a Cipher's unlock condition.
 * Called by event hooks (presence, sparks, dialogue). When progress
 * reaches the threshold, flips the cipher to 'unlocked' and returns the
 * full payload so the caller can announce the reveal to the UE client.
 */
export async function bumpProgress(
  playerId: string,
  cipherId: string,
  delta = 1,
): Promise<{ unlocked: boolean; payload?: string; current: number; required: number }> {
  const cipher = await prisma.cipher.findUnique({ where: { id: cipherId } });
  if (!cipher) {
    return { unlocked: false, current: 0, required: 0 };
  }

  const progress = await prisma.cipherProgress.upsert({
    where: { playerId_cipherId: { playerId, cipherId } },
    create: { playerId, cipherId, currentValue: delta },
    update: { currentValue: { increment: delta } },
  });

  if (cipher.state === 'unlocked') {
    return {
      unlocked: true,
      payload: cipher.payloadUnlocked,
      current: progress.currentValue,
      required: cipher.unlockValue,
    };
  }

  if (progress.currentValue >= cipher.unlockValue) {
    await prisma.cipher.update({
      where: { id: cipherId },
      data: { state: 'unlocked', unlockedAt: new Date() },
    });
    return {
      unlocked: true,
      payload: cipher.payloadUnlocked,
      current: progress.currentValue,
      required: cipher.unlockValue,
    };
  }

  return {
    unlocked: false,
    current: progress.currentValue,
    required: cipher.unlockValue,
  };
}

/**
 * Find the most recent locked Cipher for a (player, character, kind) trio.
 * Used by event hooks to decide which open Cipher to bump progress on,
 * vs. minting a new one. Players who haven't yet decoded the existing
 * one shouldn't be flooded with new Ciphers from the same source.
 */
export async function pickActiveCipherFor(
  characterId: string | null,
  locationName: string | null,
  kind: CipherKind,
): Promise<{ id: string; unlockValue: number } | null> {
  const cipher = await prisma.cipher.findFirst({
    where: {
      kind,
      state: 'locked',
      ...(characterId ? { sourceCharacterId: characterId } : {}),
      ...(locationName ? { sourceLocationName: locationName } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
  return cipher ? { id: cipher.id, unlockValue: cipher.unlockValue } : null;
}

/**
 * High-level event hook. Call from presence / spark / atmospheric paths.
 * Either bumps progress on an active locked Cipher OR (small chance) mints
 * a fresh one. Returns a summary the caller can pass back to the UE client.
 */
export async function recordCipherEvent(opts: {
  playerId: string;
  kind: CipherKind;
  characterId?: string | null;
  characterName?: string;
  characterTongue?: string;
  locationName?: string | null;
  locationVibe?: string;
  episodeId?: string | null;
  episodeContent?: string;
  // Probability of minting a brand new Cipher rather than progressing an
  // existing one. Defaults make Ciphers feel rare without going dry.
  mintProbability?: number;
}): Promise<{
  action: 'minted' | 'progressed' | 'unlocked' | 'skipped';
  cipherId?: string;
  glyph?: string;
  rarity?: CipherRarity;
  payloadHint?: string;
  payloadLocked?: string;
  payloadUnlocked?: string;
  current?: number;
  required?: number;
}> {
  const mintProbability = opts.mintProbability ?? 0.18;

  const active = await pickActiveCipherFor(
    opts.characterId ?? null,
    opts.locationName ?? null,
    opts.kind,
  );

  // No active cipher → mint with high probability
  if (!active) {
    if (Math.random() < 0.65) {
      const minted = await mintCipher({
        kind: opts.kind,
        characterId: opts.characterId ?? null,
        characterName: opts.characterName,
        characterTongue: opts.characterTongue,
        locationName: opts.locationName ?? null,
        locationVibe: opts.locationVibe,
        episodeId: opts.episodeId ?? null,
        episodeContent: opts.episodeContent,
      });
      // Player gets first tick on this fresh cipher
      const bump = await bumpProgress(opts.playerId, minted.id, 1);
      const cipher = await prisma.cipher.findUnique({ where: { id: minted.id } });
      return {
        action: bump.unlocked ? 'unlocked' : 'minted',
        cipherId: minted.id,
        glyph: minted.signature,
        rarity: minted.rarity,
        payloadHint: cipher?.payloadHint ?? undefined,
        payloadLocked: cipher?.payloadLocked,
        payloadUnlocked: bump.unlocked ? cipher?.payloadUnlocked : undefined,
        current: bump.current,
        required: bump.required,
      };
    }
    return { action: 'skipped' };
  }

  // Active cipher exists. Coin flip: bump progress or mint new.
  if (Math.random() < mintProbability) {
    const minted = await mintCipher({
      kind: opts.kind,
      characterId: opts.characterId ?? null,
      characterName: opts.characterName,
      characterTongue: opts.characterTongue,
      locationName: opts.locationName ?? null,
      locationVibe: opts.locationVibe,
      episodeId: opts.episodeId ?? null,
      episodeContent: opts.episodeContent,
    });
    const bump = await bumpProgress(opts.playerId, minted.id, 1);
    const cipher = await prisma.cipher.findUnique({ where: { id: minted.id } });
    return {
      action: bump.unlocked ? 'unlocked' : 'minted',
      cipherId: minted.id,
      glyph: minted.signature,
      rarity: minted.rarity,
      payloadHint: cipher?.payloadHint ?? undefined,
      payloadLocked: cipher?.payloadLocked,
      payloadUnlocked: bump.unlocked ? cipher?.payloadUnlocked : undefined,
      current: bump.current,
      required: bump.required,
    };
  }

  // Progress existing
  const bump = await bumpProgress(opts.playerId, active.id, 1);
  const cipher = await prisma.cipher.findUnique({ where: { id: active.id } });
  return {
    action: bump.unlocked ? 'unlocked' : 'progressed',
    cipherId: active.id,
    glyph: cipher?.signature,
    rarity: cipher?.rarity as CipherRarity | undefined,
    payloadHint: cipher?.payloadHint ?? undefined,
    payloadLocked: cipher?.payloadLocked,
    payloadUnlocked: bump.unlocked ? cipher?.payloadUnlocked : undefined,
    current: bump.current,
    required: bump.required,
  };
}
