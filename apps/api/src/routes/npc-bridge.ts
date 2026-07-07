/**
 * NPC bridge — Boveda → Unreal Engine.
 *
 *   GET  /characters/:idOrName/ue-manifest   one-shot fetch of everything an
 *                                            NPC Blueprint needs (face refs,
 *                                            LoRAs, voice surface, dialogue
 *                                            endpoint, MetaHuman uasset path
 *                                            when set).
 *   POST /characters/:idOrName/dialogue      turn-by-turn NPC reply. Thin
 *                                            wrapper around callLlm tuned
 *                                            for short interactive lines,
 *                                            not long-form posts.
 *
 * Why a separate file rather than tacking onto characters.ts: the manifest
 * fuses DB record + the legacy ~/boveda/characters/*.json registry (where
 * face reference photos and LoRA file paths actually live). Keeping that
 * fusion logic in one place makes the contract with Unreal explicit.
 */

import type { FastifyInstance } from 'fastify';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { prisma } from '../db.js';
import { callLlm, hasLlmProvider } from '../lib/llm.js';
import { ElevenLabsProvider } from '@lcos/voice';
import { runSpark } from '../lib/spark.js';

const REGISTRY_DIR = process.env.BOVEDA_CHARACTERS_DIR || '/home/sphinxy/boveda/characters';

const IBIS_API_URL = process.env.IBIS_API_URL || 'http://localhost:5140';
const SELF_API_URL = process.env.PUBLIC_API_URL || 'http://localhost:5130';
const UPLOAD_DIR = process.env.UPLOAD_DIR || './storage/uploads';
const VOICE_DIR = path.join(path.resolve(UPLOAD_DIR), 'voice');
const DEFAULT_TTS_VOICE_ID = process.env.BOVEDA_DEFAULT_ELEVENLABS_VOICE_ID || '';

// Mmuo (Modal app) is the proper voice rendering path. ElevenLabs becomes
// the fallback for characters that don't yet have a Mmuo persona uploaded.
// Set both env vars after deploying ~/mmuo-modal/src/app.py.
const MMUO_BASE_URL = process.env.MMUO_BASE_URL || '';
const MMUO_API_KEY = process.env.MMUO_API_KEY || '';

interface RegistryRecord {
  name: string;
  trigger?: string;
  display_name?: string;
  description?: string;
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
  primary_reference_image?: {
    wsl_path?: string;
    windows_path?: string;
    description?: string;
  };
  voice?: {
    // Mmuo Modal voice rendering (preferred when available)
    mmuo_persona_id?: string | null;
    style_transfer?: {
      openvoice_reference_path?: string | null;
      blend?: number;
    };
    morph?: {
      rvc_target_path?: string | null;
      blend_weight?: number;
    };
    post?: {
      filter?: 'rubberband' | 'none';
      pitch_semitones?: number;
      formant_preserve?: boolean;
      tape_saturation?: number;
      room_ir_path?: string | null;
    };
    style_controls?: {
      brightness?: number;
      breathiness?: number;
      energy?: number;
      formant?: number;
      vibrato_depth?: number;
      vibrato_rate?: number;
      roboticism?: number;
      glitch?: number;
      stereo_width?: number;
    };
    // ElevenLabs fallback path
    elevenlabs_voice_id?: string | null;
    fallback_elevenlabs_voice_id?: string | null;
    model?: string;
    stability?: number;
    similarity_boost?: number;
  } | null;
  brand?: {
    primary_color?: string;
    accent_color?: string;
    tagline?: string;
    rights?: string;
    license?: string;
  };
  metahuman?: {
    uasset_windows_path?: string;
    uasset_wsl_path?: string;
    rig_version?: string;
  } | null;
  default_prompt_prefix?: string;
}

async function readAllRegistryRecords(): Promise<RegistryRecord[]> {
  try {
    const entries = await fs.readdir(REGISTRY_DIR);
    const out: RegistryRecord[] = [];
    for (const f of entries) {
      if (!f.endsWith('.json') || f.startsWith('_')) continue;
      try {
        const raw = await fs.readFile(path.join(REGISTRY_DIR, f), 'utf-8');
        out.push(JSON.parse(raw) as RegistryRecord);
      } catch {}
    }
    return out;
  } catch {
    return [];
  }
}

function findRegistryFor(records: RegistryRecord[], dbName: string): RegistryRecord | undefined {
  const direct = records.find((r) => r.display_name?.toLowerCase() === dbName.toLowerCase());
  if (direct) return direct;
  return records.find((r) => r.name?.toLowerCase() === dbName.toLowerCase());
}

interface TtsResult {
  audioUrl: string | null;
  audioError: string | null;
  provider: 'mmuo' | 'elevenlabs' | null;
}

/**
 * Render a line through Mmuo (Modal app) when the character has a persona id,
 * else through ElevenLabs as fallback. Writes under /uploads/voice/{characterId}/
 * and returns the public URL.
 *
 * Mmuo is preferred because it's owned, royalty-tracked, and can apply the
 * full four-layer pipeline (GPT-SoVITS → OpenVoice V2 → RVC → ffmpeg post).
 * ElevenLabs is the fallback for characters that don't yet have a Mmuo
 * persona uploaded.
 */
async function renderTts(
  characterId: string,
  characterName: string,
  line: string,
  reg: RegistryRecord | undefined,
): Promise<TtsResult> {
  const personaId = reg?.voice?.mmuo_persona_id ?? null;
  if (MMUO_BASE_URL && MMUO_API_KEY && personaId) {
    const result = await renderViaMmuo(characterId, line, personaId, reg);
    if (result.audioUrl) return result;
    // Mmuo unreachable / persona not loaded yet; fall through to ElevenLabs.
  }
  return renderViaElevenLabs(characterId, characterName, line, reg);
}

async function renderViaMmuo(
  characterId: string,
  line: string,
  personaId: string,
  reg: RegistryRecord | undefined,
): Promise<TtsResult> {
  try {
    const body = {
      text: line,
      persona_id: personaId,
      style_controls: reg?.voice?.style_controls ?? {},
      style_transfer: reg?.voice?.style_transfer ?? { blend: 0 },
      morph: reg?.voice?.morph ?? { blend_weight: 0 },
      post: reg?.voice?.post ?? { filter: 'none' },
      return_format: 'mp3',
    };
    // MMUO_BASE_URL is already the full synthesize endpoint URL
    // (Modal collapses workspace + app + function into one URL).
    // Allow either form by stripping a trailing /synthesize if present.
    const url = MMUO_BASE_URL.replace(/\/synthesize$/, '');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': MMUO_API_KEY },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      return { audioUrl: null, audioError: `mmuo_http_${res.status}: ${t.slice(0, 200)}`, provider: 'mmuo' };
    }
    const json = (await res.json()) as { success?: boolean; audio_base64?: string; error?: string };
    if (!json.success || !json.audio_base64) {
      return { audioUrl: null, audioError: `mmuo_failed: ${json.error ?? 'no_audio'}`, provider: 'mmuo' };
    }
    const charDir = path.join(VOICE_DIR, characterId);
    await fs.mkdir(charDir, { recursive: true });
    const fileName = `mmuo_${Date.now()}.mp3`;
    const fullPath = path.join(charDir, fileName);
    await fs.writeFile(fullPath, Buffer.from(json.audio_base64, 'base64'));
    return {
      audioUrl: `${SELF_API_URL}/uploads/voice/${characterId}/${fileName}`,
      audioError: null,
      provider: 'mmuo',
    };
  } catch (e) {
    return {
      audioUrl: null,
      audioError: `mmuo_error: ${e instanceof Error ? e.message : String(e)}`,
      provider: 'mmuo',
    };
  }
}

async function renderViaElevenLabs(
  characterId: string,
  characterName: string,
  line: string,
  reg: RegistryRecord | undefined,
): Promise<TtsResult> {
  const characterVoiceId =
    reg?.voice?.fallback_elevenlabs_voice_id ?? reg?.voice?.elevenlabs_voice_id ?? null;
  const voiceId = characterVoiceId || DEFAULT_TTS_VOICE_ID;
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return { audioUrl: null, audioError: 'ELEVENLABS_API_KEY_missing', provider: 'elevenlabs' };
  }
  if (!voiceId) {
    return {
      audioUrl: null,
      audioError:
        'no_voice_id (set the registry voice.elevenlabs_voice_id or BOVEDA_DEFAULT_ELEVENLABS_VOICE_ID, or upload a Mmuo persona)',
      provider: 'elevenlabs',
    };
  }
  try {
    const charDir = path.join(VOICE_DIR, characterId);
    const provider = new ElevenLabsProvider({ apiKey, storagePath: charDir });
    const audio = await provider.generateAudioEnhanced({
      text: line,
      profile: {
        id: characterId,
        provider: 'elevenlabs' as never,
        providerVoiceId: voiceId,
        label: characterName,
        meta: {},
        source: 'cloned' as never,
        realIdentityId: null,
        biometricHash: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never,
      styleControls: {
        stability: reg?.voice?.stability ?? 0.5,
        similarityBoost: reg?.voice?.similarity_boost ?? 0.75,
      },
    });
    const fileName = path.basename(audio.filePath);
    return {
      audioUrl: `${SELF_API_URL}/uploads/voice/${characterId}/${fileName}`,
      audioError: null,
      provider: 'elevenlabs',
    };
  } catch (e) {
    return {
      audioUrl: null,
      audioError: e instanceof Error ? e.message : String(e),
      provider: 'elevenlabs',
    };
  }
}

export async function npcBridgeRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get<{ Params: { idOrName: string } }>(
    '/characters/:idOrName/ue-manifest',
    async (request, reply) => {
      const { idOrName } = request.params;

      let character = await prisma.character.findUnique({ where: { id: idOrName } });
      if (!character) {
        character = await prisma.character.findFirst({ where: { name: idOrName } });
      }
      if (!character) {
        return reply.code(404).send({ error: 'character_not_found', idOrName });
      }

      const registries = await readAllRegistryRecords();
      const reg = findRegistryFor(registries, character.name);

      const styleRegistries = registries.filter((r) =>
        Array.isArray(reg?.stack_with) && reg!.stack_with!.includes(r.name),
      );

      const dbLoras = Array.isArray(character.loras) ? (character.loras as unknown[]) : [];

      const visualLoras = dbLoras.filter(
        (l): l is { category?: string } => typeof l === 'object' && l !== null,
      );

      const manifest = {
        character: {
          id: character.id,
          name: character.name,
          aliases: character.aliases,
          bio: character.bio,
          systemPrompt: character.systemPrompt,
          mode: character.mode,
          species: character.species,
          gender: character.gender,
          pronouns: character.pronouns,
        },
        face: reg?.primary_reference_image
          ? {
              wsl_path: reg.primary_reference_image.wsl_path ?? null,
              windows_path: reg.primary_reference_image.windows_path ?? null,
              description: reg.primary_reference_image.description ?? null,
            }
          : null,
        face_lora:
          reg && reg.type === 'character'
            ? {
                trigger: reg.trigger ?? reg.lora?.trigger ?? null,
                wsl_path: reg.lora?.wsl_local ?? null,
                windows_path: reg.lora?.local ?? null,
                replicate_destination: reg.lora?.replicate_destination ?? null,
                replicate_version: reg.lora?.replicate_version ?? null,
                trained_on: reg.lora?.trained_on ?? null,
              }
            : null,
        style_loras: styleRegistries.map((r) => ({
          name: r.name,
          trigger: r.trigger ?? r.lora?.trigger ?? null,
          wsl_path: r.lora?.wsl_local ?? null,
          windows_path: r.lora?.local ?? null,
        })),
        loras: visualLoras,
        voice: reg?.voice?.elevenlabs_voice_id
          ? {
              provider: 'elevenlabs',
              voice_id: reg.voice.elevenlabs_voice_id,
              model: reg.voice.model ?? 'eleven_multilingual_v2',
              stability: reg.voice.stability ?? 0.5,
              similarity_boost: reg.voice.similarity_boost ?? 0.75,
            }
          : null,
        writing: {
          dialogue_endpoint: `${SELF_API_URL}/characters/${character.id}/dialogue`,
          ibis_corpus_endpoint: `${SELF_API_URL}/characters/${character.id}/corpus`,
          ibis_base: IBIS_API_URL,
          requires_header: 'x-api-key',
        },
        brand: reg?.brand ?? null,
        metahuman: reg?.metahuman ?? null,
        default_prompt_prefix: reg?.default_prompt_prefix ?? null,
        generated_at: new Date().toISOString(),
      };

      return reply.send(manifest);
    },
  );

  // Shared core: take a resolved character + raw user text, run the LLM
  // dialogue prompt, optionally synth TTS, return the structured reply.
  // Used by both text /dialogue and voice /dialogue/voice.
  async function runDialogueTurn(opts: {
    character: { id: string; name: string; voiceSamples: unknown; tongue: unknown; toneForbidden: string[] | null; bio: string | null; systemPrompt: string | null };
    userText: string;
    speakerName?: string;
    sceneContext?: string;
    maxTokens?: number;
    tts?: boolean;
  }) {
    const { character, userText } = opts;
    const voiceSamples = Array.isArray(character.voiceSamples)
      ? (character.voiceSamples as unknown[]).filter((s): s is string => typeof s === 'string')
      : [];
    const tongue = (character.tongue ?? {}) as Record<string, unknown>;
    const tongueLines: string[] = [];
    if (typeof tongue.cadence === 'string') tongueLines.push(`cadence: ${tongue.cadence}`);
    if (typeof tongue.register === 'string') tongueLines.push(`register: ${tongue.register}`);
    if (Array.isArray(tongue.signatures)) {
      const sigs = tongue.signatures.filter((s): s is string => typeof s === 'string').slice(0, 6);
      if (sigs.length) tongueLines.push(`signatures: ${sigs.join(' | ')}`);
    }
    const tonForbidden = character.toneForbidden?.join(', ') ?? '';

    const fewShot = voiceSamples
      .slice(-6)
      .map((s, i) => `Example ${i + 1}: ${s}`)
      .join('\n');

    const sceneBlock = opts.sceneContext ? `\n## Scene\n${opts.sceneContext}\n` : '';
    const speakerBlock = opts.speakerName ? `${opts.speakerName}: ` : '';

    const system = [
      `You are ${character.name}, speaking in your own voice as an NPC inside an Unreal Engine scene.`,
      `Reply with ONE short line of dialogue. No stage directions. No narrator. No quotes. No em dashes.`,
      character.bio ? `\n## Bio\n${character.bio}` : '',
      character.systemPrompt ? `\n## Base persona\n${character.systemPrompt}` : '',
      tongueLines.length ? `\n## Tongue\n${tongueLines.join('\n')}` : '',
      tonForbidden ? `\n## Forbidden tones\n${tonForbidden}` : '',
      fewShot ? `\n## Voice samples (your past writing, mimic the cadence)\n${fewShot}` : '',
      sceneBlock,
    ]
      .filter(Boolean)
      .join('\n');

    const user = `${speakerBlock}${userText}\n\n${character.name}:`;

    const result = await callLlm({
      system,
      user,
      maxTokens: Math.min(opts.maxTokens ?? 220, 512),
    });
    const line = result.text.replace(/^["']|["']$/g, '').trim();

    let audioUrl: string | null = null;
    let audioError: string | null = null;
    let audioProvider: 'mmuo' | 'elevenlabs' | null = null;
    if (opts.tts && line) {
      const registries = await readAllRegistryRecords();
      const reg = findRegistryFor(registries, character.name);
      const tts = await renderTts(character.id, character.name, line, reg);
      audioUrl = tts.audioUrl;
      audioError = tts.audioError;
      audioProvider = tts.provider;
    }

    return {
      line,
      source: result.source,
      usage: result.usage,
      character: { id: character.id, name: character.name },
      audio_url: audioUrl,
      audio_error: audioError,
      audio_provider: audioProvider,
    };
  }

  fastify.post<{
    Params: { idOrName: string };
    Body: {
      userText: string;
      speakerName?: string;
      sceneContext?: string;
      maxTokens?: number;
      tts?: boolean;
    };
  }>('/characters/:idOrName/dialogue', async (request, reply) => {
    const { idOrName } = request.params;
    const body = request.body || ({} as { userText?: string });
    const userText = (body.userText ?? '').trim();
    if (!userText) {
      return reply.code(400).send({ error: 'userText_required' });
    }

    let character = await prisma.character.findUnique({ where: { id: idOrName } });
    if (!character) {
      character = await prisma.character.findFirst({ where: { name: idOrName } });
    }
    if (!character) {
      return reply.code(404).send({ error: 'character_not_found', idOrName });
    }

    if (!hasLlmProvider()) {
      return reply.code(503).send({ error: 'no_llm_provider', hint: 'Set ANTHROPIC_API_KEY' });
    }

    try {
      const out = await runDialogueTurn({
        character,
        userText,
        speakerName: body.speakerName,
        sceneContext: body.sceneContext,
        maxTokens: body.maxTokens,
        tts: body.tts,
      });
      return reply.send(out);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return reply.code(500).send({ error: 'llm_call_failed', detail: msg });
    }
  });

  // -------------------------------------------------------------------
  // Voice-driven dialogue: player speaks → Whisper → LLM → TTS reply.
  // Multipart upload with field "audio" (wav/mp3/webm/m4a). Optional
  // form fields: speakerName, sceneContext, maxTokens, tts (default true).
  // Returns { transcript, line, audio_url, ... }.
  // Requires OPENAI_API_KEY for Whisper transcription.
  // -------------------------------------------------------------------
  fastify.post<{
    Params: { idOrName: string };
  }>('/characters/:idOrName/dialogue/voice', async (request, reply) => {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return reply.code(503).send({
        error: 'no_whisper_provider',
        hint: 'Set OPENAI_API_KEY in boveda/.env',
      });
    }

    const { idOrName } = request.params;
    let character = await prisma.character.findUnique({ where: { id: idOrName } });
    if (!character) {
      character = await prisma.character.findFirst({ where: { name: idOrName } });
    }
    if (!character) {
      return reply.code(404).send({ error: 'character_not_found', idOrName });
    }
    if (!hasLlmProvider()) {
      return reply.code(503).send({ error: 'no_llm_provider', hint: 'Set ANTHROPIC_API_KEY' });
    }

    let audioBuf: Buffer | null = null;
    let audioFilename = 'speech.wav';
    let audioMimetype = 'audio/wav';
    const formFields: Record<string, string> = {};

    try {
      const parts = request.parts();
      for await (const part of parts) {
        if (part.type === 'file' && part.fieldname === 'audio') {
          audioFilename = part.filename || audioFilename;
          audioMimetype = part.mimetype || audioMimetype;
          audioBuf = await part.toBuffer();
        } else if (part.type === 'field' && typeof part.value === 'string') {
          formFields[part.fieldname] = part.value;
        }
      }
    } catch (e) {
      return reply.code(400).send({
        error: 'multipart_parse_failed',
        detail: e instanceof Error ? e.message : String(e),
      });
    }

    if (!audioBuf || audioBuf.length === 0) {
      return reply.code(400).send({ error: 'audio_field_required' });
    }

    let transcript = '';
    try {
      const fd = new FormData();
      fd.append('file', new Blob([audioBuf], { type: audioMimetype }), audioFilename);
      fd.append('model', 'whisper-1');
      fd.append('language', 'en');
      const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${openaiKey}` },
        body: fd,
      });
      if (!resp.ok) {
        const text = await resp.text();
        return reply.code(502).send({
          error: 'whisper_failed',
          status: resp.status,
          detail: text.slice(0, 500),
        });
      }
      const data = (await resp.json()) as { text?: string };
      transcript = (data.text ?? '').trim();
    } catch (e) {
      return reply.code(502).send({
        error: 'whisper_request_failed',
        detail: e instanceof Error ? e.message : String(e),
      });
    }

    if (!transcript) {
      return reply.code(422).send({ error: 'empty_transcript', hint: 'silent or unintelligible audio' });
    }

    const ttsFlag = formFields.tts ? formFields.tts !== 'false' : true;
    const maxTokens = formFields.maxTokens ? parseInt(formFields.maxTokens, 10) : undefined;

    try {
      const out = await runDialogueTurn({
        character,
        userText: transcript,
        speakerName: formFields.speakerName,
        sceneContext: formFields.sceneContext,
        maxTokens: Number.isFinite(maxTokens) ? maxTokens : undefined,
        tts: ttsFlag,
      });
      return reply.send({ transcript, ...out });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return reply.code(500).send({ error: 'llm_call_failed', detail: msg, transcript });
    }
  });

  // -------------------------------------------------------------------
  // Playback events: UE reports back when audio plays / finishes.
  // Boveda persists the event so the character's memory + presence
  // updates, and broadcasts on the live WS for other listeners.
  // -------------------------------------------------------------------

  fastify.post<{
    Body: {
      characterId: string;
      status: 'started' | 'finished' | 'stopped' | 'errored';
      audioUrl?: string;
      durationMs?: number;
      location?: string;
      line?: string;
      metadata?: Record<string, unknown>;
    };
  }>('/playback/event', async (request, reply) => {
    const body = request.body || ({} as never);
    const { characterId, status } = body;
    if (!characterId || !status) {
      return reply.code(400).send({ error: 'characterId_and_status_required' });
    }

    const character = await prisma.character.findUnique({ where: { id: characterId } });
    if (!character) {
      return reply.code(404).send({ error: 'character_not_found', characterId });
    }

    if (status === 'started' || status === 'finished') {
      await prisma.character.update({
        where: { id: characterId },
        data: { lastSeenAt: new Date() },
      });
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const episode = await prisma.memoryEpisode.create({
      data: {
        characterId,
        kind: 'playback',
        content: body.line ?? `[playback ${status}]`,
        metadata: {
          status,
          audioUrl: body.audioUrl ?? null,
          durationMs: body.durationMs ?? null,
          location: body.location ?? null,
          ...body.metadata,
        },
        location: body.location ?? null,
        expiresAt,
      },
    });

    return reply.send({
      ok: true,
      character: { id: character.id, name: character.name },
      episode_id: episode.id,
      status,
    });
  });

  // -------------------------------------------------------------------
  // Multi-character scenes: places + sparks.
  //
  // The model that already exists in Boveda:
  //   - Place (Location)             a named space with vibe + cover image
  //   - Character.currentLocation    string referencing a place name
  //   - LocationEvent                per-place event log
  //   - Spark (lib/spark.ts)         one-line LLM exchange between two
  //                                  co-located characters; persists as
  //                                  MemoryEpisode + LocationEvent +
  //                                  publishes to /characters/:id/live WS
  //
  // The bridge surfaces a composite scene fetch and a one-call spark
  // trigger so an Unreal level Blueprint can:
  //   1. Read which characters are at this place (with their face + lora)
  //   2. Spawn an actor per character
  //   3. Fire a spark between any two and play the line audibly
  //   4. Subscribe to /characters/:id/live (WS) for streaming events
  // -------------------------------------------------------------------

  fastify.get<{ Params: { name: string } }>(
    '/places/:name/ue-scene',
    async (request, reply) => {
      const placeName = decodeURIComponent(request.params.name);
      const place = await prisma.location.findUnique({ where: { name: placeName } });

      const characters = await prisma.character.findMany({
        where: { currentLocation: { contains: placeName, mode: 'insensitive' } },
        select: {
          id: true,
          name: true,
          mode: true,
          avatarUrl: true,
          currentLocation: true,
        },
      });

      const registries = await readAllRegistryRecords();

      const charactersEnriched = characters.map((c) => {
        const reg = findRegistryFor(registries, c.name);
        return {
          id: c.id,
          name: c.name,
          mode: c.mode,
          avatar_url: c.avatarUrl,
          current_location: c.currentLocation,
          face: reg?.primary_reference_image
            ? {
                wsl_path: reg.primary_reference_image.wsl_path ?? null,
                windows_path: reg.primary_reference_image.windows_path ?? null,
              }
            : null,
          face_lora_trigger: reg?.trigger ?? reg?.lora?.trigger ?? null,
          metahuman_uasset_windows_path: reg?.metahuman?.uasset_windows_path ?? null,
          live_ws_url: `${SELF_API_URL.replace(/^http/, 'ws')}/characters/${c.id}/live`,
        };
      });

      const recentEvents = await prisma.locationEvent.findMany({
        where: {
          location: { contains: placeName, mode: 'insensitive' },
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });

      return reply.send({
        place: place ?? {
          name: placeName,
          description: '',
          kind: 'place',
          vibe: '',
          imageUrl: null,
        },
        characters: charactersEnriched,
        recent_events: recentEvents.map((e) => ({
          id: e.id,
          kind: e.kind,
          content: e.content,
          participants: e.participants,
          metadata: e.metadata,
          created_at: e.createdAt.toISOString(),
        })),
        spark_endpoint: `${SELF_API_URL}/sparks/fire`,
        generated_at: new Date().toISOString(),
      });
    },
  );

  fastify.post<{
    Body: {
      initiatorId: string;
      recipientId: string;
      brief?: string;
      forceLocation?: string;
      tts?: boolean;
    };
  }>('/sparks/fire', async (request, reply) => {
    const { initiatorId, recipientId, brief, forceLocation, tts } = request.body || ({} as never);
    if (!initiatorId || !recipientId) {
      return reply.code(400).send({ error: 'initiatorId_and_recipientId_required' });
    }
    if (initiatorId === recipientId) {
      return reply.code(400).send({ error: 'spark_requires_two_distinct_characters' });
    }
    if (!hasLlmProvider()) {
      return reply.code(503).send({ error: 'no_llm_provider', hint: 'Set ANTHROPIC_API_KEY' });
    }

    let result;
    try {
      result = await runSpark({
        initiatorId,
        recipientId,
        brief,
        forceLocation,
        source: 'unreal_manual',
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return reply.code(500).send({ error: 'spark_failed', detail: msg });
    }

    let audioUrl: string | null = null;
    let audioError: string | null = null;
    let audioProvider: 'mmuo' | 'elevenlabs' | null = null;
    if (tts && result.message) {
      const registries = await readAllRegistryRecords();
      const reg = findRegistryFor(registries, result.initiator.name);
      const ttsResult = await renderTts(
        result.initiator.id,
        result.initiator.name,
        result.message,
        reg,
      );
      audioUrl = ttsResult.audioUrl;
      audioError = ttsResult.audioError;
      audioProvider = ttsResult.provider;
    }

    return reply.send({
      initiator: result.initiator,
      recipient: result.recipient,
      message: result.message,
      location: result.location,
      location_event_id: result.locationEventId,
      previous_exchange_count: result.previousExchangeCount,
      audio_url: audioUrl,
      audio_error: audioError,
      audio_provider: audioProvider,
    });
  });
}
