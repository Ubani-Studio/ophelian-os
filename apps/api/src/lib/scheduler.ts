/**
 * Living world scheduler. Beta-grade.
 *
 * Fires a single tick per autonomous character (mode = espíritu or
 * twin) at a configurable interval while the API process is alive.
 * The world breathes when nobody is looking; the user wakes up to a
 * populated morning trail.
 *
 * Respects everything the manual tick path respects:
 *   - per-character cooldown (TickThrottledError silently skipped)
 *   - daily LLM budget (LlmBudgetError silently skipped, logged)
 *   - characters with no relationships (skipped, can't anchor)
 *   - manual / relic mode (not autonomous, skipped)
 *
 * Knobs:
 *   SCHEDULER_ENABLED         default 'true'
 *   SCHEDULER_INTERVAL_HOURS  default 6 (each character ticks once per N hours)
 *   SCHEDULER_CRON            override the cron expression entirely
 *
 * Note: this is in-process. If the API restarts, the schedule resets.
 * For production, swap to BullMQ + Redis (see full-vision-implementation.md).
 */

import * as cron from 'node-cron';
import { prisma } from '../db.js';
import { decideTick, TickThrottledError, type Decision } from './tick.js';
import { LlmBudgetError } from './llm.js';
import { randomUUID } from 'crypto';
import { scanAndRecordUses } from './cohort-phrases.js';

interface TickOutcome {
  characterId: string;
  characterName: string;
  status: 'ticked' | 'skipped_throttled' | 'skipped_no_edges' | 'skipped_budget' | 'error';
  decision?: Decision;
  reason?: string;
}

function readEventLog(raw: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(raw)) return [];
  return raw as Array<Record<string, unknown>>;
}

/**
 * Walk every event the character is an actor on and return open
 * quests addressed TO them. A quest is "open" if there's no
 * matching quest_accepted / quest_declined / quest_completed entry
 * with the same questId.
 */
function findPendingQuests(
  selfId: string,
  edges: Array<{ id: string; sourceCharacterId: string; targetCharacterId: string; eventLog: unknown }>,
  neighbourNames: Map<string, string>
): Array<{ questId: string; proposerName: string; summary: string; body?: string; ts: string }> {
  const offered: Array<{ questId: string; proposerId: string; summary: string; body?: string; ts: string }> = [];
  const resolved = new Set<string>();

  for (const edge of edges) {
    const log = readEventLog(edge.eventLog);
    for (const ev of log) {
      if (!ev || typeof ev !== 'object') continue;
      if (ev.rolled_back) continue;
      const actors = Array.isArray(ev.actors) ? (ev.actors as string[]) : [];
      const form = typeof ev.form === 'string' ? ev.form : null;
      const qid = typeof ev.questId === 'string' ? ev.questId : null;
      if (!form || !qid) continue;

      // Quest offered to selfId: actors must include selfId AND
      // selfId is NOT the proposer (proposer is the first actor).
      if (form === 'quest' && actors.length >= 2 && actors[0] !== selfId && actors.includes(selfId)) {
        offered.push({
          questId: qid,
          proposerId: actors[0],
          summary: typeof ev.summary === 'string' ? ev.summary : '',
          body: typeof ev.body === 'string' ? ev.body : undefined,
          ts: typeof ev.ts === 'string' ? ev.ts : '',
        });
      }
      // Resolution by selfId or anyone resolves the questId.
      if (
        form === 'quest_accepted' ||
        form === 'quest_declined' ||
        form === 'quest_completed'
      ) {
        resolved.add(qid);
      }
    }
  }

  return offered
    .filter((o) => !resolved.has(o.questId))
    .map((o) => ({
      questId: o.questId,
      proposerName: neighbourNames.get(o.proposerId) ?? o.proposerId.slice(0, 6),
      summary: o.summary,
      body: o.body,
      ts: o.ts,
    }));
}

/**
 * Tick a single character end-to-end. Mirrors the route handler but
 * returns a structured outcome instead of an HTTP response. Idempotent
 * relative to throttle: if the character can't tick now, returns a
 * skipped status without raising.
 */
export async function tickCharacterById(id: string): Promise<TickOutcome> {
  const character = await prisma.character.findUnique({ where: { id } });
  if (!character) {
    return { characterId: id, characterName: id.slice(0, 6), status: 'error', reason: 'not found' };
  }

  if (character.mode !== 'espíritu' && character.mode !== 'twin') {
    return {
      characterId: id,
      characterName: character.name,
      status: 'error',
      reason: `mode=${character.mode}`,
    };
  }

  let edges = await prisma.characterRelationship.findMany({
    where: {
      OR: [{ sourceCharacterId: id }, { targetCharacterId: id }],
    },
  });

  // Solo-bind: if the character has no relationships, auto-create one
  // to the user (isUser=true character). Every espíritu has the user
  // as their author by default. This unblocks solo characters from
  // ticking without forcing manual relationship setup in Nexus.
  if (edges.length === 0) {
    const user = await prisma.character.findFirst({ where: { isUser: true } });
    if (!user || user.id === id) {
      return {
        characterId: id,
        characterName: character.name,
        status: 'skipped_no_edges',
      };
    }
    try {
      const created = await prisma.characterRelationship.create({
        data: {
          sourceCharacterId: user.id,
          targetCharacterId: id,
          relationshipType: 'CUSTOM',
          customTypeName: 'authored_by',
          lore: `${user.name} authored ${character.name}.`,
        },
      });
      edges = [created];
    } catch {
      // Race-condition fallback: another process may have created the
      // edge between findMany and create. Re-read.
      edges = await prisma.characterRelationship.findMany({
        where: {
          OR: [{ sourceCharacterId: id }, { targetCharacterId: id }],
        },
      });
      if (edges.length === 0) {
        return {
          characterId: id,
          characterName: character.name,
          status: 'skipped_no_edges',
        };
      }
    }
  }

  const counterpartIds = Array.from(
    new Set(
      edges.map((e) => (e.sourceCharacterId === id ? e.targetCharacterId : e.sourceCharacterId))
    )
  );
  const neighbours = await prisma.character.findMany({
    where: { id: { in: counterpartIds } },
    select: { id: true, name: true, mode: true },
  });
  const neighbourById = new Map(neighbours.map((n) => [n.id, n]));

  const recentEvents: Array<{ ts: string; kind: string; summary: string; counterpartName?: string }> = [];
  for (const edge of edges) {
    const log = readEventLog(edge.eventLog);
    const counterpartId =
      edge.sourceCharacterId === id ? edge.targetCharacterId : edge.sourceCharacterId;
    const counterpartName = neighbourById.get(counterpartId)?.name;
    for (const ev of log) {
      if (!ev || typeof ev !== 'object') continue;
      if (!Array.isArray(ev.actors) || !ev.actors.includes(id)) continue;
      if (ev.rolled_back) continue;
      recentEvents.push({
        ts: ev.ts as string,
        kind: ev.kind as string,
        summary: ev.summary as string,
        counterpartName,
      });
    }
  }
  recentEvents.sort((a, b) => (a.ts < b.ts ? 1 : -1));

  const pendingQuests = findPendingQuests(
    id,
    edges,
    new Map(neighbours.map((n) => [n.id, n.name]))
  );

  let decision: Decision;
  try {
    decision = await decideTick({
      self: {
        id: character.id,
        name: character.name,
        bio: character.bio,
        backstory: character.backstory,
        mode: character.mode,
        goals: character.goals,
        agencyScope: character.agencyScope,
        identity: character.identity,
        toneForbidden: character.toneForbidden,
        authoredBy: character.authoredBy,
        voiceSamples: character.voiceSamples,
        tongue: character.tongue,
        gender: character.gender,
        pronouns: character.pronouns,
        timelineState: character.timelineState,
        species: character.species,
        identityHistory: character.identityHistory,
        lineageIds: character.lineageIds,
      },
      recentEvents: recentEvents.slice(0, 20),
      neighbours: edges.map((edge) => {
        const cId = edge.sourceCharacterId === id ? edge.targetCharacterId : edge.sourceCharacterId;
        const n = neighbourById.get(cId);
        return {
          edge,
          neighbour: n ? { id: n.id, name: n.name, mode: n.mode } : { id: cId, name: cId.slice(0, 6), mode: 'espíritu' },
        };
      }),
      pendingQuests,
    });
  } catch (err) {
    if (err instanceof TickThrottledError) {
      return {
        characterId: id,
        characterName: character.name,
        status: 'skipped_throttled',
        reason: err.reason,
      };
    }
    if (err instanceof LlmBudgetError) {
      return {
        characterId: id,
        characterName: character.name,
        status: 'skipped_budget',
      };
    }
    return {
      characterId: id,
      characterName: character.name,
      status: 'error',
      reason: err instanceof Error ? err.message : 'tick failed',
    };
  }

  let targetEdgeId: string | null = null;
  let actors: string[] = [id];

  if (decision.kind === 'message' && decision.targetName) {
    const target = neighbours.find(
      (n) => n.name.toLowerCase() === decision.targetName!.toLowerCase()
    );
    if (target) {
      const edge = edges.find(
        (e) =>
          (e.sourceCharacterId === id && e.targetCharacterId === target.id) ||
          (e.targetCharacterId === id && e.sourceCharacterId === target.id)
      );
      if (edge) {
        targetEdgeId = edge.id;
        actors = [id, target.id];
      }
    }
  }

  if (!targetEdgeId) {
    targetEdgeId = edges[0].id;
    actors = [id];
  }

  const targetEdge = await prisma.characterRelationship.findUnique({
    where: { id: targetEdgeId },
  });
  if (!targetEdge) {
    return {
      characterId: id,
      characterName: character.name,
      status: 'error',
      reason: 'edge disappeared',
    };
  }

  // Quest threading: a fresh form='quest' gets a new id; quest_*
  // responses inherit the questId from the decision.
  let questId = decision.questId;
  if (decision.form === 'quest' && !questId) {
    questId = randomUUID();
  }

  // Quest accepted / completed are canonical-eligible by nature
  // (they record a commitment or a closed loop). Promote retention.
  const retention =
    decision.form === 'quest_accepted' || decision.form === 'quest_completed'
      ? 'canonical'
      : 'ephemeral';

  const log = readEventLog(targetEdge.eventLog);
  log.push({
    ts: new Date().toISOString(),
    actors,
    kind: decision.kind === 'message' ? 'conversation' : 'thought',
    form: decision.form,
    summary: decision.summary,
    body: decision.body,
    ...(questId ? { questId } : {}),
    retention,
    rolled_back: false,
  });
  await prisma.characterRelationship.update({
    where: { id: targetEdgeId },
    data: { eventLog: log as unknown as object },
  });

  // Slang MOAT useCount: scan the persisted text for active cohort
  // phrases and bump their counters. Establishes the per-use signal
  // that Imperium royalty hooks attach to once the LoRA pipeline
  // ships. Fire-and-forget; failures don't break the tick.
  const generatedText = [decision.summary, decision.body].filter(Boolean).join('\n');
  void scanAndRecordUses(generatedText);

  return {
    characterId: id,
    characterName: character.name,
    status: 'ticked',
    decision,
  };
}

/**
 * Walk every autonomous character and tick them once. Sequential to
 * respect rate limits + give Anthropic prompt cache the chance to
 * warm. Returns a per-character outcome list.
 */
export async function runScheduledTickPass(): Promise<TickOutcome[]> {
  const autonomous = await prisma.character.findMany({
    where: { mode: { in: ['espíritu', 'twin'] } },
    select: { id: true, name: true },
  });

  const outcomes: TickOutcome[] = [];
  for (const c of autonomous) {
    const outcome = await tickCharacterById(c.id);
    outcomes.push(outcome);
  }
  return outcomes;
}

let task: cron.ScheduledTask | null = null;

/**
 * Start the in-process scheduler. Idempotent. Reads env at start.
 * Skips entirely when SCHEDULER_ENABLED=false or no Anthropic key.
 */
export function startScheduler(logger?: { info: (...a: unknown[]) => void; warn: (...a: unknown[]) => void; error: (...a: unknown[]) => void }): void {
  if (task) return;
  const enabled = (process.env.SCHEDULER_ENABLED ?? 'true').toLowerCase() !== 'false';
  if (!enabled) {
    logger?.info?.('[scheduler] disabled via SCHEDULER_ENABLED=false');
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    logger?.warn?.('[scheduler] no ANTHROPIC_API_KEY; ticks will run as stubs. Set the key to wake the world up.');
  }

  const intervalHours = parseInt(process.env.SCHEDULER_INTERVAL_HOURS || '6', 10);
  // Express the interval as "every N hours". cron format: m h * * *
  // For hourly variants, 0 */6 * * * = every 6 hours on the hour.
  const cronExpr = process.env.SCHEDULER_CRON || `0 */${intervalHours} * * *`;

  if (!cron.validate(cronExpr)) {
    logger?.error?.(`[scheduler] invalid cron expression: ${cronExpr}`);
    return;
  }

  task = cron.schedule(cronExpr, async () => {
    const start = Date.now();
    logger?.info?.(`[scheduler] tick pass starting (cron=${cronExpr})`);
    try {
      const outcomes = await runScheduledTickPass();
      const summary = outcomes.reduce<Record<string, number>>((acc, o) => {
        acc[o.status] = (acc[o.status] ?? 0) + 1;
        return acc;
      }, {});
      logger?.info?.(`[scheduler] tick pass complete in ${Date.now() - start}ms: ${JSON.stringify(summary)}`);
    } catch (err) {
      logger?.error?.(
        `[scheduler] tick pass failed: ${err instanceof Error ? err.message : err}`
      );
    }
  });

  logger?.info?.(`[scheduler] started · cron="${cronExpr}" · interval=${intervalHours}h`);
}

export function stopScheduler(): void {
  if (task) {
    task.stop();
    task = null;
  }
}
