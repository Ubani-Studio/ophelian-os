# Third-party characters in Unreal

Stylised, non-MetaHuman pipelines for Tufiakwa. Parked for later. Use when MetaHuman is the wrong primitive (non-human characters, hero one-offs, art-driven look).

## When to reach for this

Reach for this pipeline if:

- The character is non-human (Triarch as 3-headed entity, Cracked Phone Screen, Bando Smoke Alarm, USB Stick: DO NOT OPEN, etc).
- The character is hero one-off where you want geometry nobody else can replicate.
- The aesthetic is far enough from photoreal that a MetaHuman + toon shader still feels wrong.

Stay on MetaHuman for everyday human characters (Bo Ubani, Claudine, AI-8O, Booe, LoRA). Re-shading a MetaHuman is cheaper than sculpting a new one.

## Primary path: Blender + Auto-Rig Pro into UE5

Free, open, full control. Right balance of speed and flexibility.

1. Sculpt or block out in Blender (or ZBrush retopo into Blender).
2. UV in Blender.
3. Auto-Rig Pro generates the rig (paid plugin, ~$40, worth it). Match UE5 Mannequin skeleton if you want to share animations across characters.
4. Bake textures with Substance Painter, Quixel Mixer, or stay in Blender.
5. Export to FBX with the UE5-compatible preset.
6. Import into Tufiakwa Content/Characters/ThirdParty/.

Time per character: 2 to 3 days for hero quality, half a day for stylised silhouette.

## ZBrush as the front of the pipe

ZBrush only enters when sculpt detail matters. For Boveda's object-characters (Cracked Phone Screen, Lanyard for CONFERENCE 2019), ZBrush is overkill. For Triarch or Vivienne-Frostfang, ZBrush is right.

Workflow: ZBrush sculpt at high subdivision, decimate, export OBJ, retopo in Blender, rig with Auto-Rig Pro, bake normal map from high-poly to low-poly. Same UE import as primary path.

## Reallusion Character Creator 4 (paid alternative)

Stylised options beyond Daz, mature UE pipeline via CC Auto Setup plugin. Locked to their topology. Good for stylised humans you want to iterate fast on. License sting but fastest path if you want a stylised humanoid in a day.

## Daz3D (deprioritised)

Mainstream choice 2018 to 2022. Heavier than alternatives in 2026. Mediocre rig in UE without paid Daz to Unreal bridge. Use only if you already own a Daz library.

## Unreal asset packs

Marketplace (Fab) has stylised character packs. Useful for crowd or background characters where you do not need the persona depth of a Boveda character. Do not use these for named characters in Boveda; you do not own the geometry, you cannot evolve them.

## Animation strategy

Whatever pipeline above, target the UE5 Mannequin skeleton. Mixamo retargeting works clean to the UE5 Mannequin. Custom skeletons fragment your animation library across characters.

For non-humanoid (Triarch with three heads, Cracked Phone Screen as a flat mesh that floats), use Control Rig in UE rather than fighting a humanoid rig.

## Audio2Face on non-MetaHumans

Audio2Face needs a face mesh with ARKit-compatible blendshapes (52 standard ARKit shapes). Blender can author blendshapes, but you need to name them to ARKit spec. For one-off non-MetaHuman heroes (Bo Ubani if MetaHuman ever fails), build the 52 shapes once and reuse the face. For object-characters with no face, skip Audio2Face entirely; use a procedural visual response (bloom, scale, color shift) driven by audio amplitude.

## Boveda integration

Whichever pipeline, the Boveda contract is the same:

- Character has a row in the DB.
- BovedaSubsystem.GetCharacterManifest returns the asset path (Content/Characters/ThirdParty/CharName/CharName_BP.uasset).
- BovedaSubsystem.PlayAudioUrl drives any facial rig the character has, MetaHuman or not.
- The plugin does not care what you used to make the body. Only that the BP exposes a USkeletalMeshComponent and a USoundBase for audio.

## Cost summary

| Pipeline | Per-character time | Money | Quality ceiling | Best for |
|---|---|---|---|---|
| MetaHuman (default) | 2 hr (Mesh from Mobile) | Free | Photoreal humans | Hero humans |
| MetaHuman + non-photoreal post | 4 hr | Free | Stylised humans | Hero humans, stylised look |
| Blender + ARP + ZBrush | 2 to 3 days | $40 ARP | Anything | Hero non-humans |
| Reallusion CC4 | 1 day | $300+ | Stylised humans | Fast stylised humanoids |
| Daz3D | 1 to 2 days | $200+ assets | Photoreal humans | Avoid in 2026 |
| Marketplace pack | 30 min | Variable | Pack-dependent | Crowd/background only |

## Decision now

MetaHuman path for everything human. Park this doc. Revisit when you build Triarch or other named non-human characters.

---

*Last updated: 2026-05-07. Written while v4 LoRA training of Bo Ubani is running.*
