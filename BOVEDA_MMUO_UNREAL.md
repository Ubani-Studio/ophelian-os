# Boveda + Mmuo + Unreal

> The integration spine. How character genome (Boveda), voice synthesis
> (Mmuo), and embodied performance (Unreal Tufiakwa) compose into one
> living world. Index of the relevant docs, the data flow, and the build
> phasing.

## The three layers

```
┌───────────────────────────────────────────────────────────────────────────┐
│  BOVEDA              the brain                                             │
│  /home/sphinxy/boveda                                                       │
│  ─ Character genome (bio, tongue, voiceSamples, identity)                   │
│  ─ Place / Trail / Spark mechanics                                          │
│  ─ Tick scheduler + autonomous meetups                                      │
│  ─ npc-bridge HTTP routes for Unreal                                        │
└───────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼  HTTP, server-side
┌───────────────────────────────────────────────────────────────────────────┐
│  MMUO  (Chromox-rebrand)        the voice                                   │
│  /home/sphinxy/chromox + Modal app                                          │
│  ─ GPT-SoVITS fine-tuned per character (text → cloned voice)               │
│  ─ OpenVoice V2 style transfer (gender, age, mood)                         │
│  ─ RVC + Seed-VC voice morph                                               │
│  ─ ffmpeg post (room tone, tape, vinyl)                                    │
│  ─ Voice Royalty Protocol → o8 provenance → Imperium settlement            │
└───────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼  HTTP, audio_url
┌───────────────────────────────────────────────────────────────────────────┐
│  UNREAL TUFIAKWA              the body                                      │
│  E:\Alabo\Unreal\Unreal Projects\Tufiakwa                                   │
│  ─ BovedaBridge plugin (UBovedaSubsystem)                                   │
│  ─ MetaHuman face per character (Phase B)                                   │
│  ─ Live Link Face for live performance                                      │
│  ─ Multi-character scenes at Boveda places                                  │
│  ─ Sparks render as audible NPC dialogue                                    │
└───────────────────────────────────────────────────────────────────────────┘
```

Boveda calls Mmuo for voice rendering. Boveda exposes the Unreal-facing
HTTP API. Unreal pulls scene + dialogue + audio URLs from Boveda, knows
nothing about Mmuo directly. The seams are clean.

## Source-of-truth docs

This file is the index, not the source. Each subsystem has its own
strategic + operational doc:

| Concern | Doc | Path |
|---|---|---|
| Voice cloning pipeline (the four-layer stack) | MMUO_VOICE_CLONE_PIPELINE.md | `~/chromox/MMUO_VOICE_CLONE_PIPELINE.md` |
| RVC / Modal / Ibis-LoRA technical wiring | RVC_IMPLEMENT.md | `~/boveda/RVC_IMPLEMENT.md` |
| Mmuo brand + naming logic | MMUO.md | `~/chromox/MMUO.md` |
| Voice Royalty Protocol (Mmuo → o8 → Boveda → Imperium) | VOICE_PROTOCOL_INTEGRATION.md | `~/chromox/docs/VOICE_PROTOCOL_INTEGRATION.md` |
| Unreal NPC + plugin setup | UBANI_NPC_SETUP.md | `E:\Alabo\Unreal\Unreal Projects\Tufiakwa\UBANI_NPC_SETUP.md` |
| Existing Mmuo voice cloning quickstart | QUICKSTART_VOICE_CLONING.md | `~/chromox/QUICKSTART_VOICE_CLONING.md` |
| Boveda → Unreal MetaHuman export plan | exports/metahuman/README.md | `~/boveda/exports/metahuman/README.md` |
| Friend collab one-pager (handout) | MMUO_VOICE_COLLAB_ONE_PAGER.md | `~/boveda/MMUO_VOICE_COLLAB_ONE_PAGER.md` |
| User-action punchlist (what only you can do) | NEXT_HUMAN_ACTIONS.md | `~/boveda/NEXT_HUMAN_ACTIONS.md` |
| Modal app deploy + persona upload | mmuo-modal/README.md | `~/mmuo-modal/README.md` |

## Operational tools

| Tool | Path | Purpose |
|---|---|---|
| Pipeline health check | `~/mmuo-modal/scripts/full_pipeline_check.sh` | Run anytime to validate Boveda → Mmuo → Modal end to end. Reports per-layer status. |
| Persona uploader | `~/mmuo-modal/scripts/upload_persona.py` | Push a trained voice model into the Modal Volume. |
| Smoke test (single line) | `~/mmuo-modal/scripts/smoke_test.py` | Single-line render check against deployed Mmuo. |
| Modal deploy | `~/mmuo-modal/scripts/deploy.sh` | One command to redeploy after any app.py change. |

## Data flow, end to end

When the player asks Ubani's twin a question in a Tufiakwa level:

```
1. Player types into the UE testing widget, or proximity-triggers an NPC
2. UMG widget calls UBovedaSubsystem.AskDialogue(
     "Ai-8O", userText, "Ubani", scene, bWithVoice=true, OnReply
   )
3. Plugin POSTs to Boveda http://localhost:5130/characters/Ai-8O/dialogue
   { userText, speakerName, sceneContext, tts: true }
4. Boveda npc-bridge:
   a. Resolves character from Postgres + ai_8o.json registry
   b. Builds prompt: bio + tongue + voiceSamples (Ibis few-shot) + scene
   c. Calls Anthropic Claude Haiku 4.5 (callLlm in lib/llm.ts)
   d. Em-dash scrub at LLM exit
   e. If tts=true:
       i.   Read voice config: chromox_persona_id, style_controls
       ii.  POST to Mmuo Modal endpoint
            https://<modal-app>.modal.run/synthesize
            { text: line, persona_id, style_controls, post: { ... } }
       iii. Modal: GPT-SoVITS → OpenVoice V2 → RVC → ffmpeg post
       iv.  Modal returns audio (mp3 bytes or signed URL)
       v.   Boveda saves to /uploads/voice/<characterId>/<hash>.mp3
       vi.  Boveda logs usage event for Voice Royalty Protocol
   f. Returns { line, audio_url, character }
5. Plugin parses response in BovedaSubsystem JSON handler
6. UE BP:
   a. Sets text widget = line
   b. Opens MediaPlayer at audio_url
   c. NPC actor speaks
   d. Optional: send blendshapes to MetaHuman face for lipsync (Phase B)
7. Memory: Ai-8O's MemoryEpisode written, scene event logged
```

Same flow for sparks (NPC ↔ NPC), for autonomous meetups (Boveda
scheduler runs sparks, publishes to /characters/:id/live WebSocket, UE
subscribes per actor and renders incoming lines).

## Per-character configuration shape

Final form of a Boveda character JSON, post-Modal-wire:

```json
{
  "name": "ai_8o",
  "trigger": "ai_8o",
  "display_name": "Ai-8O",
  "type": "character",
  "lora": null,

  "voice": {
    "mmuo_persona_id": "d5ed82b8-98ae-4d8a-ad30-e4fea597d40a",
    "model_path": "/models/persona_d5ed82b8.pth",
    "style_transfer": {
      "openvoice_reference_path": "/refs/ai_8o_degraded_male.wav",
      "blend": 0.7
    },
    "morph": {
      "rvc_target_path": null,
      "blend_weight": 0.0
    },
    "post": {
      "filter": "rubberband",
      "pitch_semitones": -1,
      "formant_preserve": true,
      "tape_saturation": 0.15,
      "room_ir": "saltway_estuary.wav",
      "noise_floor_db": -45
    },
    "fallback_elevenlabs_voice_id": "pNInz6obpgDQGcFmaJgB",
    "license_terms_id": "boveda_internal_v1"
  },

  "primary_reference_image": null,
  "metahuman": {
    "uasset_windows_path": null
  },
  "brand": { ... },
  "default_prompt_prefix": ""
}
```

Each character is one row in a system that has three identity adapters:
- **Visual** (FLUX LoRA on Replicate, lora field)
- **Writing** (Ibis text LoRA, future, served via vLLM on Modal)
- **Voice** (Mmuo voice on Modal, voice field above)

Same architectural pattern across all three. Adapters trained on the
artist or collaborator. Owned by Mmuo / Boveda. Royalty-tracked.

## Phasing

The integration is built in four phases, each shippable:

### Phase A1 (done) — UE wired to Boveda, audio works

- BovedaBridge UE plugin compiles, calls /dialogue, /sparks/fire, /ue-scene.
- Boveda npc-bridge endpoints live, route through ElevenLabs premade voices.
- Multi-character scene at "The Saltway" works with Ubani, Ai-8O, Claudine, Booe.
- Audio plays via MediaPlayer in UMG widget.

### Phase A2 (next) — Mmuo Modal app deployed

- Modal app hosting GPT-SoVITS, OpenVoice V2, RVC endpoints.
- Persistent Modal Volume for character voice models.
- Boveda npc-bridge updated: Mmuo provider primary, ElevenLabs fallback.
- Bo Ubani recorded + fine-tuned + uploaded → playable end to end.
- Scaffold the friend collab flow: register-provenance, training endpoint, license terms.

### Phase B (after Mmuo works) — MetaHuman face per character

- Capture face for Ubani via iPhone or photo set + MetaHuman Mesh from Mobile.
- Import .uasset into Tufiakwa, attach to BP_BovedaNPC.
- Live Link Face for live performance.
- Update ubani_v2.json metahuman field with uasset_windows_path.
- BovedaBridge spawns the MetaHuman from manifest path.

### Phase C — Casting friends, recording per-character clones

- Treat home studio.
- Record Bo Ubani foundation session.
- Cast first two friend collaborators, run through registration + recording + training.
- Each Boveda character with a contributor: that contributor's GPT-SoVITS clone on Modal.
- Voice Royalty Protocol live per character.

### Phase D — Live world, autonomous

- Boveda scheduler tick + meetup pass running 24/7.
- Tufiakwa hosts open-world Saltway level.
- Characters move between places, fire sparks autonomously.
- WebSocket bridge per spawned NPC streams events in real time.
- Player roams, witnesses, occasionally talks.

### Phase E — Commercial / public

- Mmuo opens to other artist collectives as B2B platform.
- Voice Royalty Protocol settles via Imperium on-chain.
- Tufiakwa shipped as a playable / streamable artifact.
- First grant or commercial pilot pays for the next wave of friends and infrastructure.

## What's open right now

- **Modal app**: not yet scaffolded. Next deliverable.
- **Bo Ubani foundation recording**: not yet done. Required for Mmuo Phase A2 to be useful.
- **UE plugin compilation**: user has not yet opened Tufiakwa to compile BovedaBridge.
- **MetaHuman face**: planning-stage, no captures yet.
- **Friend collabs**: not yet started.
- **Grant applications**: not yet written.
- **Ibis text LoRA inference**: discussed, not yet scoped (parallel to voice).

## Where to look when something breaks

| Symptom | Likely surface | First file to read |
|---|---|---|
| UE plugin won't compile | C++ build errors in UE | `Plugins/BovedaBridge/Source/BovedaBridge/BovedaBridge.Build.cs` |
| /dialogue returns 401 | Boveda auth middleware | `~/boveda/apps/api/src/middleware/auth.ts` |
| /dialogue returns 503 no_llm_provider | Anthropic key missing | `~/boveda/.env` ANTHROPIC_API_KEY |
| /dialogue returns audio_error subscription | ElevenLabs tier issue | switch to premade or Mmuo Modal |
| Mmuo Modal returns 5xx | model not loaded or volume not mounted | Modal logs, check Volume mount |
| audio_url plays silence | ffmpeg post mangled the file | check Boveda /uploads/voice/<id>/ for raw file before post |
| UE NPC has no face texture | character has no registry JSON or face is null | `~/boveda/characters/<name>.json` |
| UE multi-character scene empty | Character.currentLocation doesn't match | PATCH currentLocation via studio |

## The thesis, restated

Boveda is the brain (who is this character, what do they know, where are
they). Mmuo is the voice (how do they sound, owned by us, royalty-tracked).
Unreal is the body (what does this character look like, how do they move,
what world do they walk through). Each has its own discipline, its own doc,
its own deployment surface. They communicate over HTTP. None of them is
the bottleneck for the others.

The integration spine, this doc, just keeps the seams clean.
