# Boveda → MetaHuman Export Pipeline

> Status: **planning stage**. Not yet built. Activates after music video pipeline ships.

## What this is

The bridge that takes a Boveda character (face/identity/voice/brand) and makes it
addressable inside Unreal Engine as a MetaHuman. Once active, you can:

- Perform live as Ubani in VR (Live Link Face)
- Render Ubani in Unreal scenes with full lighting/physics
- Use MetaHuman in interactive music videos / VR concerts
- Stream realtime CGI Ubani while ComfyUI generates the world around them

## Architectural sketch

```
Boveda character JSON
   ├── face reference photos        ──┐
   ├── trained LoRA (FLUX)            │
   ├── voice clone (ElevenLabs ID)   │      MetaHuman Creator
   └── brand identity                 │      (cloud / Quixel)
                                      │
                                      ▼
                          MetaHuman Mesh-from-Photo
                          (face scan → skeletal mesh)
                                      │
                                      ▼
                          .uasset (face mesh + rig + materials)
                                      │
                                      ▼
                          Unreal Engine project
                                      ├── Live Link Face (iPhone-driven facial)
                                      ├── ComfyUI texture stream (background gen)
                                      ├── ElevenLabs realtime voice synth
                                      └── Replicate API for dynamic shots
```

## Phases

### Phase 0: face scan
- Capture 50-100 photos of the artist (varied angles, lighting, expressions)
- OR use a phone-based face scan app (3DScannerApp, etc.)
- Result: a clean point cloud of the face

### Phase 1: MetaHuman Creator
- Upload to MetaHuman Mesh from Mobile (Unreal's web tool)
- Tweak rig in MetaHuman Creator
- Export as .uasset

### Phase 2: Unreal project scaffolding
- Create UE 5.x project with MetaHuman plugin
- Import the .uasset
- Set up Live Link Face for iPhone-driven facial animation
- Wire materials and lighting

### Phase 3: ComfyUI background streaming
- Plugin or HTTP bridge: gen.py outputs feed Unreal as runtime textures
- Audio-reactive material parameters
- Replicate API calls for one-off scene shots

### Phase 4: Live performance
- VR concert via Quest 3 / Vision Pro
- Streaming via OBS + Unreal scene
- Audience interactive elements

## Triggers to start (don't start yet)

- Music video pipeline has shipped at least one finished video
- 1000+ engaged superfans (validated audience)
- Revenue justifies $5-10k of VR + Unreal infra
- Or commercial use case (brand partnership, live tour booking)

## Estimated cost when starting

- Time: 4-8 weeks (learning curve + scaffolding + first show)
- Infrastructure: ~$3-5k (Quest 3 Pro, capture cards, lighting for face scans)
- Software: free (Unreal, MetaHuman, Live Link)
- Cloud rendering for live shows: ~$50-200 per show

## Useful resources (cache for later)

- [MetaHuman Creator](https://metahuman.unrealengine.com/)
- [MetaHuman Mesh from Mobile](https://www.unrealengine.com/en-US/blog/metahuman-mesh-from-mobile)
- [Live Link Face (iOS)](https://apps.apple.com/us/app/live-link-face/id1495370836)
- [Unreal Engine + ComfyUI texture streaming patterns](TBD when researched)

## Boveda export shape (when built)

`exports/metahuman/<character>/` will contain:
- `face_scan/` — raw photos used for mesh generation
- `mesh/<character>.uasset` — Unreal asset
- `rig/` — MetaHuman rig data
- `materials/` — PBR textures
- `voice/` — symlink/reference to character's ElevenLabs voice
- `manifest.json` — version + build info

`registry.py` will gain a `get_metahuman(name)` function returning the Unreal-ready paths.
