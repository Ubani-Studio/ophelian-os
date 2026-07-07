# Cube · Zone · Sphere · Wormhole

The world architecture for Bóveda + Ikenga. How a song, a film, a
music video, a game cut, and a content reel can all share one world
without collapsing into one timeline.

## Vocabulary

| Term | Maps to | Role |
|------|---------|------|
| **Cube** | `boveda.World` | Top mythos container. "Boveda Overall Cube." Holds characters, scenes, ciphers, trajectory. One per project universe. |
| **Zone** | `boveda.Scene` | A themed region inside a Cube. "Give it to me / Eden jungle." Holds the song, the cast subset, the colour palette, the cipher / stela. |
| **Stela** | `Scene.metadata.stela` (or new model later) | A release-event cipher pinned to a Zone. The song drop, the lookbook drop, the limited piece, the print. The thing the world is exhaling at this moment. |
| **Sphere** | NEW. `boveda.Sphere` ⇄ `ikenga.Series` | One divergent media piece inhabiting a Zone. Lead format (film, music video, content, game, dialogue, interactive), lead aspect, own cast subset, own physics. |
| **Wormhole** | `boveda.WorldConnection` (existing typed-edge table) | Typed edge between two anchor points. Sphere↔Sphere, Zone↔Zone, Cube↔Cube. Each edge declares what crosses (character, scene, cipher, audio stem, palette). |

The Cube is the cosmos. The Zone is a place inside the cosmos. The
Sphere is a way of inhabiting that place. The Wormhole is how you
get from one inhabitation to another without leaving the cosmos.

## Hierarchy

```
CUBE (boveda.World — "Boveda Overall Cube")
 ├── Characters
 │
 ├── ZONE (boveda.Scene — "Give it to me / Eden")
 │    ├── Cast subset (which characters live here)
 │    ├── Palette + ciphers (colours, stela, mythos beat)
 │    ├── Song / stems (the audio family for this zone)
 │    │
 │    ├── SPHERE A: 16:9 music video
 │    │     └── Ikenga Series (storyboard, shots, cuts)
 │    │
 │    ├── SPHERE B: 9:16 game / interactive cut
 │    │     └── Ikenga Series (different cast, dialogue layer, branching)
 │    │
 │    ├── SPHERE C: 16:9 film
 │    │     └── Ikenga Series (audio becomes underscore, characters speak)
 │    │
 │    └── SPHERE D: 9:16 content reel
 │          └── Ikenga Series (raw drops, BTS energy)
 │
 ├── ZONE: "Throne room / Iron"
 ├── ZONE: "Underworld / Smoke"
 │
 └── WORMHOLES (boveda.WorldConnection)
      • Sphere A → Sphere B (character bridge: same protagonist)
      • Zone Eden → Zone Throne (story bridge: same arc thread)
      • Cube → Cube (rare cross-mythos portal)
```

## The Sphere primitive (new)

A Sphere is the smallest unit that ships. Format-bound, aspect-bound,
intent-bound. Where a Zone is a place, a Sphere is a take on that
place.

### Fields

```
id              cuid
sceneId         FK → Scene (Zone)
name            "Eden — YouTube cut" / "Eden — game cut"
format          film | music_video | content | game | dialogue
                | interactive | trailer | reel | mood
primary_aspect  "16:9" | "9:16" | "1:1" | "2.39:1" | etc.
intent          short free text: "the lead drop", "the after-piece"
ikenga_series_id   FK → ikenga.Series  (the storyboard that drives it)
cast_ids        Character[]  (subset of the Zone's cast)
physics_json    {
                  time_flow:    "linear" | "branched" | "looped" | "folded"
                  gravity:      "earth" | "low" | "heavy" | "inverted"
                  weather:      "humid" | "ash" | "neon" | ...
                  sensory:      "synaesthetic" | "muted" | ...
                  quantum_state: free text — the mood beneath the rules
                }
audio_mode      "lead"      uses the Zone's lead song
                "remix"     uses a derived stem set
                "underscore" same audio family but mixed for film
                "silent"    no audio (game / dialogue)
                "diegetic"  audio sourced inside the scene (dialogue, foley)
stela_id        Optional — when this Sphere IS the release event
status          draft | in_production | locked | shipped
sibling_aspect  Optional "9:16" | "16:9". When set, Ikenga produces a
                second crop output AS THIS SPHERE'S OWN AS WELL.
                NOT a separate Sphere. Use this only when the same
                cut works in two aspects (re-crop). For divergent
                intent (interactive game version), make a new Sphere.
```

### Sibling-aspect vs new Sphere — when to do which

The user's clarifying example: "the horizontal could be the main
YouTube video and then the vertical could be another version of the
music video but say a it plays the music differently like at the
intro, and then goes into dialogue like game interactive version."

Two cases, two answers.

| Case | Same cut, different aspect | Different intent, different cast or audio mode |
|------|----------------------------|------------------------------------------------|
| Example | 16:9 music video + 9:16 short for Reels (same edit, just cropped) | 16:9 music video + 9:16 game cut with dialogue |
| Mechanism | `Sphere.sibling_aspect = "9:16"`. Ikenga compile renders both crops from one Series. | Two Spheres in the same Zone. Each has its own Ikenga Series. Linked by a Wormhole. |
| Rule | If the writer can describe the difference in one word ("crop"), use sibling_aspect. | If the difference needs two words or more, make a new Sphere. |

This gives the simple case for free (already shipped via compile
worker's secondary-aspect pass), and the divergent case a real model
instead of a hack.

## Wormhole as typed edge

`boveda.WorldConnection` already exists. We extend its
`connectionType` vocabulary so wormholes carry meaning:

| connectionType | What crosses | Use |
|----------------|--------------|-----|
| `character_bridge` | Same Character on both ends | Protagonist appearing in two Spheres / Zones / Cubes |
| `scene_bridge` | Same Scene rendered two ways | Eden in the music video vs Eden in the game cut |
| `cipher_bridge` | Same Stela | Ties release event to its alt-format companions |
| `palette_bridge` | Shared colour family | Eden green threading through three Zones |
| `audio_bridge` | Shared song / stems | Music video audio → film underscore |
| `time_bridge` | Same world-time, different vantage | Two Spheres set at the same moment |
| `dimension_bridge` | Different physics, same place | Eden by earth-physics vs Eden by inverted-gravity |
| `quote_bridge` | One piece references the other | Cinematic callback / Easter egg |

Anchor metadata on each end:

```
source: { sphereId, series_item_id?, scene_id?, t_seconds? }
target: { sphereId, series_item_id?, scene_id?, t_seconds? }
lore:    free text — the world reason the wormhole exists
```

Anchoring at the SeriesItem level (a specific shot inside a Sphere's
storyboard) lets the wormhole act as a tap-to-jump point in
future interactive playback, without forcing it on the writer today.

## Format mutability (the core ask)

Vertical was for short-form. Horizontal was for the full piece. The
old rule does not hold any more.

Under this architecture, format is not a property of the WORLD — it
is a property of the Sphere. So:

- Lead Sphere of Zone Eden may be 9:16 (vertical is the lead this
  week).
- The horizontal Sphere in the same Zone might be a longer piece,
  might be a film, might be a game. Equally first-class.
- The Zone's audio is its lead song, but each Sphere declares an
  `audio_mode` so the same musical material can play as:
  - Lead song (music video)
  - Underscore (film, mixed differently)
  - Stems pulled apart (game, dialogue scene)
  - Silent (no audio, foley-only)

The writer chooses what the lead is for any given release moment.
The world stays cohesive because every Sphere points back at the
same Zone (same cast, same palette, same cipher), and Wormholes
make the relationships visible.

## Quantum state and physics

`physics_json` on a Sphere is not decoration. It is the contract for
how that Sphere reads on screen.

- `time_flow: "branched"` — the storyboard supports forks; export
  forks marked with branch handles in Ikenga.
- `gravity: "inverted"` — colour grading + LUT preset shifts;
  Ikenga's GradingOverlay reads this and offers the matching look.
- `quantum_state: "decoherent grief"` — surface text on the Sphere
  detail page so cast / collaborators feel the brief without
  reading a brand deck.

Future work: Sphere physics influence default conviction weights
(an "inverted gravity" Sphere defaults b-roll holds longer because
the world breathes slower), and a render-mode default per
`time_flow` ("folded" maps to non_linear_dream).

## Migration path from current Ikenga Series

`ikenga.series` already carries `oro_world_id` (legacy from the Òrò
era) and `oro_era_id`. The same idea, different label.

Steps:

1. Boveda: add `Sphere` model with the fields above.
2. Boveda: add a Sphere CRUD endpoint under `/cubes/:cubeId/zones/:zoneId/spheres`.
3. Ikenga: add `series.boveda_sphere_id` (nullable string). Old
   `oro_world_id` stays for back-compat; new storyboards bind to a
   Sphere instead.
4. Ikenga: storyboard create flow picks a Cube → Zone → Sphere (new
   or existing). Picking an existing Sphere replaces an old
   storyboard with the new one; the old one becomes a Sphere
   draft.
5. Ikenga UI: a "Sphere" badge on every storyboard surface, showing
   the Cube · Zone · Sphere it belongs to. Click to navigate the
   world.
6. Boveda UI: a Zone detail page lists its Spheres in a grid with
   format / aspect / status. Each card opens the Ikenga storyboard
   for that Sphere.
7. Wormhole UI: a graph view on the Zone or Cube page that shows
   Sphere↔Sphere and Zone↔Zone edges. Click an edge to see the
   anchor points and lore.

## Cross-storyboard / cross-Sphere photo reuse

The earlier task ("a photo appearing in this and another series") is
already solved by this architecture:

- A photo used in Sphere A's Series and Sphere B's Series in the
  same Zone is naturally a shared asset of the Zone.
- Surface: "appears in N Spheres of this Zone" badge on the photo
  card. Click reveals the other Spheres. One-tap pull copies the
  photo into the current Series with the prior conviction +
  prominence + shot_type carried over.
- For wider reuse (different Zone, same Cube): the same badge
  shows "appears in N Spheres across N Zones of this Cube." Same
  pull action.

## What I would build first

Smallest scaffold that lets the world feel real:

1. Sphere model + CRUD in Boveda (no Wormhole UI yet).
2. `series.boveda_sphere_id` in Ikenga + a Sphere picker that
   replaces / sits alongside the existing Oro picker.
3. Zone detail page in Boveda that lists Spheres.
4. The existing secondary-aspect compile pass already covers same-
   cut sibling aspect.
5. Wormhole UI (graph) is Phase 2.

This makes the format-shift workflow real without locking us into a
UI bet. A writer can drop a 9:16 game cut alongside the 16:9 music
video and the storyboards stay independent while the world stays
shared.

## Open naming questions

- "Sphere" vs "Space" vs "Inhabitation" — Sphere reads clean and
  pairs with Cube. Space leans architectural; Inhabitation leans
  academic. Recommendation: Sphere.
- "Wormhole" vs "Bridge" vs "Thread" — Wormhole has the physics /
  quantum framing the user used in the brief. Bridge is gentler.
  Thread is more textile. Recommendation: keep Wormhole as the
  spec name; UI labels can read "Bridge" if Wormhole feels too
  dense.
- Stela stays as the release-event primitive. Already used as a
  doctrine term in the ecosystem (Stela = release object across
  multi-format layers, Oryx-owned). Sphere is the unit that ships;
  Stela is the moment the Sphere becomes public.

## What this is not

- Not a re-implementation of Oro or Mythos. Boveda already holds
  the world model. This spec extends it with the media-piece layer
  (Sphere) so Ikenga storyboards land somewhere that has structure.
- Not a virtual machine for interactive playback. The interactive
  path lives downstream (game engine, web player), but the data
  model exposed here is shape-compatible so that future tooling
  can read the same Spheres + Wormholes.
- Not a forced trajectory pin. A Cube can be untrajectoried; a
  Zone can have one Sphere or twenty; a Sphere can be the only
  inhabitation of its Zone. The architecture supports density,
  not density-by-default.
