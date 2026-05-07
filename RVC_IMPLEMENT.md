# RVC implement

> The voice and writing pipeline plan for Boveda characters. Title kept as RVC_IMPLEMENT.md
> at the user's request, but the conclusion is broader than RVC alone.

## TL;DR

You don't need RVC alone, you need to point Boveda at the **Chromox** backend
you've already built. Chromox is a multi-provider voice orchestrator that
already wraps RVC, GPT-SoVITS, OpenVoice locally, plus ElevenLabs / Fish / MiniMax / CambAI / Suno
in the cloud. It even has Bo Ubani trained as a local RVC model
(`persona_d5ed82b8-...pth`) sitting on disk right now.

The work to do is one HTTP rewire from `npc-bridge.ts` to Chromox, plus
character JSON updates. Cost: a few hours. Outcome: Boveda speaks every
character with their own voice, on your hardware, no ElevenLabs subscription
gates, no per-line cost.

The text side (Ibis LoRA) is a parallel, separate change explained below.

## Is RVC the best for sound?

No, not in isolation, but it has a distinct lane that newer models don't replace.

| Model | Year | Strength | Weakness |
|---|---|---|---|
| RVC (Mangio fork) | 2023 | Source-audio → target-voice conversion. Mature. Tons of community-trained models. Sub-second inference. | Needs source audio. Doesn't synthesize from text on its own. |
| GPT-SoVITS | 2024 | End-to-end: text → cloned-voice audio. Few seconds of reference audio enough. State-of-the-art quality. | Heavier inference. Newer, less battle-tested. |
| F5-TTS | 2024 | Flow-matching, simple architecture, fast | Less mature ecosystem. |
| Fish Speech (Fish Audio) | 2024 | Strong cloning, fast | Smaller community than GPT-SoVITS. |
| CosyVoice (Alibaba) | 2024 | Enterprise-grade quality, multi-lingual | Heavier dep tree. |
| OpenVoice V2 (MyShell) | 2024 | Instant cloning, style transfer | Quality slightly behind GPT-SoVITS for long-form. |
| XTTS v2 (Coqui) | 2023 | Cross-language voice cloning | Project ownership uncertain since Coqui shutdown. |

**Practical answer**: GPT-SoVITS for new TTS clones, RVC for converting
existing audio (e.g. taking ElevenLabs output and morphing it into a target
timbre). Chromox already has services for both at `localhost:5012` (RVC) and
`localhost:5013` (GPT-SoVITS), so you don't have to commit. The hybrid
synthesis service blends them.

## What's already on disk

```
/home/sphinxy/chromox/backend/
├── rvc_install/Mangio-RVC-Fork/         # full RVC fork installed
│   └── pretrained_v2/{f0D48k.pth, f0G48k.pth}
├── rvc_models/
│   └── persona_d5ed82b8-98ae-4d8a-ad30-e4fea597d40a.pth + .index
├── gptsovits_service/                   # GPT-SoVITS local server
├── openvoice-service/                   # OpenVoice local server
└── src/
    ├── routes/voiceClone.ts             # /api/voice-clone/* endpoints
    └── services/hybridSynthesis.ts      # blends multiple voices, waterfalls
```

The persona id `d5ed82b8-98ae-4d8a-ad30-e4fea597d40a` matches the cloned
ElevenLabs voice `chromox_d5ed82b8-...` (`QuHnMl1KtNK5zsOwI94K`). Same
identity, two render paths. The local one needs no subscription.

## Recommended architecture

```
Boveda /dialogue                       (existing, keep prompt assembly here)
        │
        ▼  HTTP
Chromox /api/voice-clone/synthesize-hybrid   (existing endpoint)
        │
        ├── waterfall providers, local first:
        │     • GPT-SoVITS  :5013   (text → cloned voice, zero-shot)
        │     • RVC         :5012   (audio in, target voice out)
        │     • OpenVoice            (instant clone fallback)
        │
        └── cloud fallback only when local fails or is gated by license:
              ElevenLabs / Fish / MiniMax / CambAI / Suno
```

Boveda character JSON moves from `elevenlabs_voice_id` to a `chromox_persona_id`
field. Chromox owns provider selection. Style controls (stability, formant,
roboticism, glitch) become first-class.

## Character JSON, target shape

```json
"voice": {
  "chromox_persona_id": "d5ed82b8-98ae-4d8a-ad30-e4fea597d40a",
  "blend": [
    { "persona_id": "d5ed82b8-...", "weight": 1.0 }
  ],
  "style_controls": {
    "brightness": 0.5,
    "breathiness": 0.5,
    "energy": 0.6,
    "formant": 0,
    "vibratoDepth": 0.4,
    "vibratoRate": 0.5,
    "roboticism": 0,
    "glitch": 0,
    "stereoWidth": 0.5
  },
  "fallback_elevenlabs_voice_id": "nPczCjzI2devNBz1zQrb"
}
```

For Ai-8O the twin: same `chromox_persona_id` as Ubani, but
`style_controls.roboticism = 0.4` and `glitch = 0.2` to produce the degraded
copy without retraining a separate model. (Compare with the simple ElevenLabs
stability/similarity tweak we shipped today, which only nudges the timbre.
The Chromox style_controls actually shape the synthesis path.)

## Implementation steps

### 1. Verify Chromox can render

```bash
cd ~/chromox/backend
# start the local synthesis services first (RVC :5012, GPT-SoVITS :5013)
# scripts likely in chromox/backend/scripts or chromox/scripts
ls scripts 2>/dev/null
# then start the orchestrator
pnpm dev   # or npm run dev
# confirm it's up
curl http://localhost:<chromox_port>/health
```

### 2. Add a Chromox provider to Boveda

In `~/boveda/apps/api/src/routes/npc-bridge.ts`, replace the ElevenLabs-direct
`renderTts` helper with a Chromox-first version:

```typescript
async function renderTts(
  characterId: string,
  characterName: string,
  line: string,
  reg: RegistryRecord | undefined,
): Promise<ElevenLabsTtsResult> {
  const chromoxBase = process.env.CHROMOX_API_URL;
  const personaId = reg?.voice?.chromox_persona_id;

  // Path A: Chromox local synthesis
  if (chromoxBase && personaId) {
    try {
      const res = await fetch(`${chromoxBase}/api/voice-clone/synthesize-hybrid`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          text: line,
          components: [{ personaId, weight: 1 }],
          styleControls: reg.voice.style_controls,
          // chromox handles the waterfall internally
        }),
      });
      if (res.ok) {
        const json = await res.json();
        return { audioUrl: json.audioUrl, audioError: null };
      }
    } catch (e) {
      // fall through to ElevenLabs fallback
    }
  }

  // Path B: ElevenLabs fallback (current code, kept for premade voices)
  const fallbackVoiceId = reg?.voice?.fallback_elevenlabs_voice_id
    || reg?.voice?.elevenlabs_voice_id
    || DEFAULT_TTS_VOICE_ID;
  // ... existing ElevenLabsProvider call
}
```

Add to `.env`:
```
CHROMOX_API_URL=http://localhost:<chromox_port>
```

### 3. Migrate character JSONs

`ubani.json`, `ubani_v2.json`, `ai_8o.json` get the new shape. Style controls
become the playground for character-defining timbre, formant, roboticism.

### 4. Test, then drop ElevenLabs reliance

When confirmed stable, the only ElevenLabs role is the fallback for characters
with no Chromox persona. Eventually train one Chromox persona per Boveda
character and the cloud dependency goes away entirely.

## Parallel: text generation through your actual Ibis LoRA

This is a separate problem from voice. Surfacing it because the user is
right that the current dialogue isn't using their LoRA.

### Current state

`Boveda /dialogue` → `callLlm()` → Anthropic Claude Haiku 4.5, with
`Character.voiceSamples` (pulled from Ibis corpus by `pullCorpusFromIbis`)
inserted as few-shot examples in the system prompt.

This produces character-distinct output (you heard it: Ubani's "yeah no the
tide came up different", Ai-8O's "the actual signal worth tracking",
Claudine's "si lwa vle"). But it's Claude approximating the voice from
samples, not the trained LoRA weights doing the inference.

### What "actual Ibis LoRA" requires

Ibis (`/home/sphinxy/Ibis`) is a Next.js writing studio + corpus + LoRA
readiness scoring. It exposes:
- `POST /api/lora/dataset/export` (training data prep)
- `GET /api/lora/readiness` (score the corpus's training-readiness)
- `POST /api/lora/coach/save` (training guidance)

It does **not** serve inference. There is no trained model loaded.

To actually use a trained text LoRA:

1. **Train**. Take Ibis dataset export → run via `axolotl`, `unsloth`, or
   `llama-factory` on a base model (e.g. Llama 3.1 8B, Qwen 2.5 7B). Output
   is an adapter `.safetensors` file.
2. **Serve**. Run a local LLM server with PEFT adapter loading:
   - `llama.cpp` server with `--lora` flag
   - `vLLM` with `--enable-lora`
   - `ollama` with `Modelfile` referencing the adapter
3. **Wire**. In `~/boveda/apps/api/src/lib/llm.ts`, add a second branch:
   - If `LOCAL_LLM_URL` is set, POST to `${LOCAL_LLM_URL}/v1/chat/completions`
     instead of Anthropic. Same OpenAI-compatible shape.
   - Per-character routing: characters whose voice was trained get the local
     model with that character's adapter. Others stay on Claude.
4. **Em-dash scrubbing**. Already done at the `callLlm` exit, no change.

### Recommendation

Keep Claude few-shot as the default for now, it ships character-distinct
output and you have it working. Train a base text LoRA on the broader Ibis
corpus once, evaluate quality, then per-character LoRAs only if the broad
adapter doesn't carry the variation you need. The LLM swap is one branch in
`callLlm`, not an architecture rewrite.

## Phasing

| Phase | What ships | Cost |
|---|---|---|
| 1 (today) | Premade ElevenLabs male voices for Ubani + Ai-8O. Writing via Claude few-shot. | Working now. |
| 2 (1 day) | Boveda dialogue routes through Chromox `synthesize-hybrid` for any character with `chromox_persona_id`. Bo Ubani RVC model already trained, plays for Ubani + Ai-8O with different style_controls. | Wiring + testing. |
| 3 (ongoing) | Per-character Chromox personas. Train RVC or GPT-SoVITS for Claudine, Booe, etc. when reference audio exists. | One model per character. |
| 4 (later) | Replace ElevenLabs entirely. Use F5-TTS or local Coqui XTTS as the source synthesizer, RVC/GPT-SoVITS as identity layer. Fully local, no cloud TTS dependency. | Self-hosted voice stack. |
| 5 (parallel) | Train Ibis text LoRA, serve via vLLM, route Boveda `callLlm` to local for characters with adapter. | Per-character text LoRAs. |

## Questions still open

- Where should the Chromox port land? Look in `chromox/backend/.env` or
  `package.json` to find what `pnpm dev` binds to.
- Does Chromox's `synthesize-hybrid` accept `text` directly, or does it
  expect source audio (RVC pattern)? Read `services/hybridSynthesis.ts`
  before wiring.
- Are GPT-SoVITS / RVC services running standalone, or does Chromox spawn
  them? Read `chromox/backend/gptsovits_service/` for the entry point.
- Persona id `d5ed82b8-...` — is this Ubani's voice or someone else's?
  The naming suggests Ubani. Confirm by listening to the .pth model output
  before relying on it for Ubani's voice.
