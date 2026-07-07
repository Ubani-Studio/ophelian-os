/**
 * Spark interaction core. Extracted from routes/interactions.ts so the
 * scheduler can fire random co-located meetups without HTTP round-trip.
 *
 * One spark = one short LLM-generated exchange between a pair, persisted
 * as a MemoryEpisode on each side and (when both share a location) a
 * single LocationEvent any third character at that place can pick up.
 *
 * The exchange flows from initiator to recipient. It uses the
 * initiator's tongue, preoccupations, fixations, voice samples and any
 * recent shared exchange between the pair as conditioning.
 */

import { prisma } from '../db.js';
import { callLlm } from './llm.js';
import { stripEmDashes } from './strip-em-dashes.js';
import { publishLive } from './live-bus.js';

const RETENTION_DAYS = 30;

interface CharacterSlim {
  id: string;
  name: string;
  bio: string;
  authoredBy: string | null;
  tongue: unknown;
  voiceSamples: unknown;
  preoccupations: unknown;
  fixations: unknown;
  tensions: unknown;
  currentLocation: string | null;
}

function readArray<T = string>(raw: unknown): T[] {
  return Array.isArray(raw) ? (raw as T[]) : [];
}

function pickRandom<T>(arr: T[]): T | null {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildPrompt(
  initiator: CharacterSlim,
  recipient: CharacterSlim,
  prevExchange: { speaker: string; text: string }[],
  brief?: string,
): { system: string; user: string } {
  const tongue = initiator.tongue as Record<string, unknown> | null;
  const idioms = readArray<string>(tongue?.idioms);
  const preoc = readArray<string>(initiator.preoccupations);
  const fix = readArray<string>(initiator.fixations);
  const voice = readArray<string>(initiator.voiceSamples).slice(0, 2);
  const livePreoc = pickRandom(preoc) ?? pickRandom(fix);

  const system = [
    `You are ${initiator.name}. You are NOT writing a generic AI response. ` +
      `You are writing a SHORT spontaneous message to ${recipient.name}. ` +
      `Speak in YOUR voice, your tongue, your contradictions. Not theirs.`,
    initiator.bio ? `## Bio\n${initiator.bio}` : '',
    tongue
      ? `## Tongue\n${JSON.stringify(tongue)}\n\nCODE-SWITCH RULE: drop into your dialect mid-sentence. Mix registers. Failure = sounding generic.`
      : '',
    idioms.length > 0
      ? `## Idioms YOU MUST USE (drop ONE or TWO naturally, never all): ${idioms.map((i) => `"${i}"`).join(', ')}`
      : '',
    livePreoc ? `## What is on your mind right now\n${livePreoc}\n\nLet it bleed through obliquely. Don't restate it.` : '',
    voice.length > 0
      ? `## Voice samples (match cadence, do not quote)\n${voice.map((s, i) => `--- Sample ${i + 1} ---\n${s}`).join('\n\n')}`
      : '',
    `## Recipient context\n${recipient.name}: ${recipient.bio || '(no bio)'}`,
    prevExchange.length > 0
      ? `## Recent exchange\n${prevExchange.map((m) => `${m.speaker}: ${m.text}`).join('\n')}\n\nThis informs what to say. Do not repeat. Move the conversation.`
      : '',
    `## Output rules`,
    `- 1-3 sentences. Spontaneous. As if dropping into ${recipient.name}'s DMs.`,
    `- No greeting. No sign-off. Start mid-thought.`,
    `- No therapist-speak. No balanced both-sides. No em-dashes.`,
    `- If you sound like Claude or ChatGPT, you have failed.`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const user = brief
    ? `Brief: ${brief}\n\nWrite the message now. Output JUST the message text. No quotes, no preamble.`
    : `Write the message now. Output JUST the message text. No quotes, no preamble.`;

  return { system, user };
}

export interface SparkResult {
  initiator: { id: string; name: string };
  recipient: { id: string; name: string };
  message: string;
  episodeIds: { initiator: string; recipient: string };
  previousExchangeCount: number;
  location: string | null;
  locationEventId: string | null;
}

export interface SparkOpts {
  initiatorId: string;
  recipientId: string;
  /** Free-text creative direction. Optional. */
  brief?: string;
  /** Override location written into the metadata. Defaults to whichever
   *  side has currentLocation set. Used by the scheduler so co-located
   *  meetups always log the meeting place. */
  forceLocation?: string;
  /** Tag the source so the trail can distinguish manual sparks from
   *  scheduled meetups. Defaults to 'random_interaction'. */
  source?: string;
}

/**
 * Run one spark exchange. Throws on LLM failure or empty output.
 * The caller is responsible for choosing the pair.
 */
export async function runSpark(opts: SparkOpts): Promise<SparkResult> {
  const [initiator, recipient] = await Promise.all([
    prisma.character.findUnique({
      where: { id: opts.initiatorId },
      select: {
        id: true,
        name: true,
        bio: true,
        authoredBy: true,
        tongue: true,
        voiceSamples: true,
        preoccupations: true,
        fixations: true,
        tensions: true,
        currentLocation: true,
      },
    }),
    prisma.character.findUnique({
      where: { id: opts.recipientId },
      select: {
        id: true,
        name: true,
        bio: true,
        authoredBy: true,
        tongue: true,
        voiceSamples: true,
        preoccupations: true,
        fixations: true,
        tensions: true,
        currentLocation: true,
      },
    }),
  ]);
  if (!initiator || !recipient) throw new Error('character_not_found');

  const prev = await prisma.memoryEpisode.findMany({
    where: {
      OR: [
        { characterId: initiator.id, kind: 'interaction', metadata: { path: ['counterpartId'], equals: recipient.id } },
        { characterId: recipient.id, kind: 'interaction', metadata: { path: ['counterpartId'], equals: initiator.id } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });
  const prevExchange = prev
    .reverse()
    .map((e) => {
      const meta = e.metadata as Record<string, unknown> | null;
      const speaker = (meta?.speakerName as string) ?? '';
      return { speaker, text: e.content };
    })
    .filter((m) => m.speaker);

  const { system, user } = buildPrompt(initiator as CharacterSlim, recipient as CharacterSlim, prevExchange, opts.brief);

  const result = await callLlm({ system, user, maxTokens: 220, cacheSystem: false });
  const messageText = stripEmDashes(result.text.trim().replace(/^["']|["']$/g, ''));
  if (!messageText) throw new Error('empty_llm_output');

  const expiresAt = new Date(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const sharedLocation = opts.forceLocation || initiator.currentLocation || recipient.currentLocation || null;
  const sharedMeta = {
    speakerName: initiator.name,
    speakerId: initiator.id,
    counterpartId: recipient.id,
    counterpartName: recipient.name,
    sparkSource: opts.source ?? 'random_interaction',
    location: sharedLocation,
  };

  const [epForInitiator, epForRecipient, locEvent] = await Promise.all([
    prisma.memoryEpisode.create({
      data: {
        characterId: initiator.id,
        kind: 'interaction',
        content: messageText,
        metadata: { ...sharedMeta, role: 'spoken_by_self' },
        location: sharedLocation,
        expiresAt,
      },
    }),
    prisma.memoryEpisode.create({
      data: {
        characterId: recipient.id,
        kind: 'interaction',
        content: messageText,
        metadata: { ...sharedMeta, role: 'addressed_to_self' },
        location: sharedLocation,
        expiresAt,
      },
    }),
    sharedLocation
      ? prisma.locationEvent.create({
          data: {
            location: sharedLocation,
            kind: 'shared_interaction',
            content: `${initiator.name} > ${recipient.name}: ${messageText}`,
            participants: [initiator.id, recipient.id],
            metadata: sharedMeta,
            expiresAt,
          },
        })
      : Promise.resolve(null),
  ]);

  // Live bus: stream the exchange to both participants' subscribers.
  // The same payload goes to each side so an Unreal plugin bound to
  // either character will lipsync the line and dispatch a "spoken to"
  // animation cue on the recipient.
  const livePayload = {
    initiatorId: initiator.id,
    initiatorName: initiator.name,
    recipientId: recipient.id,
    recipientName: recipient.name,
    message: messageText,
    location: sharedLocation,
    source: opts.source ?? 'random_interaction',
    role: undefined as 'spoken_by_self' | 'addressed_to_self' | undefined,
  };
  publishLive({
    type: 'interaction',
    characterId: initiator.id,
    payload: { ...livePayload, role: 'spoken_by_self' },
  });
  publishLive({
    type: 'interaction',
    characterId: recipient.id,
    payload: { ...livePayload, role: 'addressed_to_self' },
  });

  return {
    initiator: { id: initiator.id, name: initiator.name },
    recipient: { id: recipient.id, name: recipient.name },
    message: messageText,
    episodeIds: { initiator: epForInitiator.id, recipient: epForRecipient.id },
    previousExchangeCount: prevExchange.length,
    location: sharedLocation,
    locationEventId: locEvent?.id ?? null,
  };
}

/**
 * Has this pair already exchanged in the last `withinHours` hours?
 * Used by the meetup scheduler to back off rapid re-firing on the
 * same two characters at the same place.
 */
export async function pairHadRecentExchange(
  aId: string,
  bId: string,
  withinHours: number,
): Promise<boolean> {
  const since = new Date(Date.now() - withinHours * 60 * 60 * 1000);
  const found = await prisma.memoryEpisode.findFirst({
    where: {
      kind: 'interaction',
      createdAt: { gte: since },
      characterId: aId,
      metadata: { path: ['counterpartId'], equals: bId },
    },
    select: { id: true },
  });
  return !!found;
}
