# Burn the Square implementation plan

Architectural decision deferred to here so the Bóveda + Òrò + Ikenga + LoRA + manifest work can land first. Not building yet. This doc is the spec for when we do.

## What Burn the Square is

Adaptive game-audio runtime. Listens for game-state events (scene transitions, character beats, combat phases, dialog cues) and renders layered adaptive music in response. Same conceptual lane as Wwise or FMOD, but native to the violet-sphinx ecosystem. Lives at `/home/sphinxy/burn-the-square`.

## What Swanblade is

Prompt-to-rendered-audio sound generator (SonaGen). Authoring tool that produces audio assets from a brief: character leitmotifs, signature sounds, foley, atmospheric beds. Lives at `/home/sphinxy/swanblade`.

## The split

The earlier conversation arrived at this division. Hold to it:

**Per-character (operator-level):**
- Voice → Mmuo
- Visual → Ikenga
- Writing → Ibis
- Music signatures → Swanblade (leitmotif, foley, signature sounds)
- Style overlays
- Motion adapters

**Per-scene (game / story state level):**
- Adaptive music runtime → Burn the Square
- Lighting state
- Camera behaviour
- Environmental audio bed

Burn the Square does not attach to a character. A scene plays adaptive music *in response to* character actions, but the score belongs to the scene. Pinning Burn the Square to a character would be a category error.

## Architecture for game-engine portability

The connector pattern is a manifest, not a service call.

### 1. Character manifest (per Bóveda character)

Exported as JSON, consumed by engines (Unreal, Unity, web canvas, etc.):

```json
{
  "id": "<bóveda-character-id>",
  "name": "Ubani",
  "tizitaPersonaId": "<persona-uuid>",
  "voice": {
    "provider": "mmuo",
    "elevenlabs_voice_id": "<id>",
    "model": "eleven_multilingual_v2"
  },
  "visual": {
    "provider": "ikenga",
    "loras": [
      { "id": "ubani_v2", "trigger": "ubani", "weight": 0.8, "baseModel": "flux", "source": "replicate" }
    ]
  },
  "writing": {
    "provider": "ibis",
    "loras": [...]
  },
  "music_signatures": {
    "provider": "swanblade",
    "leitmotif_id": "<asset-uri>",
    "foley_pack_id": "<asset-uri>",
    "trigger_cues": [
      { "event": "enter", "asset": "<uri>" },
      { "event": "combat", "asset": "<uri>" }
    ]
  },
  "rights": { "owner": "bomac1193", "license": "private" }
}
```

### 2. Scene manifest (per Bóveda scene / world)

Separate document, consumed by Burn the Square at runtime:

```json
{
  "id": "<scene-id>",
  "characters": ["<character-id>", ...],
  "adaptive_music": {
    "provider": "burn-the-square",
    "score_id": "<bts-score-uri>",
    "layers": [
      { "name": "tension", "trigger": "combat_state", "fade_ms": 800 },
      { "name": "calm", "trigger": "default" }
    ]
  },
  "ambient": { "<asset-uri>" }
}
```

### 3. Engine integration

Unreal and Unity each load the character manifest as a data asset. The runtime layer:

- Spawns the character with name, voice, visual texture (or LoRA-rendered runtime mesh),
- Subscribes to game-state events the scene defines,
- Hands those events to **Burn the Square's runtime** (a small client lib in C++ for Unreal / C# for Unity),
- BTS resolves the right adaptive layers and streams audio,
- BTS *references* `character.music_signatures.trigger_cues` when the character is on stage to layer signature sounds atop the scene score.

Two layers, one consumer. The character carries its own audio identity; the scene carries the adaptive runtime.

## What to build, in order

1. **Manifest export endpoint** — `GET /characters/:id/manifest` returns the JSON above. Used by engine importers and by Burn the Square at scene-prep time.
2. **Music signatures attached on character** — extend the Music LoRA slot to support sub-types: `leitmotif`, `foley`, `signature_sound`. Or add a separate `music_signatures` field on Character. Either works; lean toward the existing LoRA slot pattern for consistency.
3. **Scene manifest schema** — add `Scene.adaptive_music: Json` field on the Bóveda scene model. Same shape as above.
4. **Burn the Square SDK** — a thin client lib (C++ + C# wrappers) that reads the scene manifest, subscribes to engine events, streams audio. This is most of the engineering work. Until the SDK exists, manifests are exportable but unconsumed by engines.
5. **Swanblade publish pipeline** — when a creator authors a leitmotif or foley pack in Swanblade, "publish to character" stores the asset URI in the character's `music_signatures`. Closes the loop: author in Swanblade, attach to character, scene plays it through Burn the Square.

## What not to build

- Character-attached Burn the Square. Wrong scope.
- Bidirectional state sync between BTS and the character record. The character is the source of truth for `music_signatures`; BTS is a runtime consumer. One direction.
- Real-time editing of BTS scores from the character page. That belongs in the scene editor, not the operator surface.

## When to start

After the current Bóveda + Ikenga + LoRA + Òrò federation work stabilises. The manifest export endpoint (item 1) is the cheapest first step and unblocks Unreal / Unity bundling experiments. The SDK (item 4) is the heaviest piece and waits until there is a real game project consuming it.
