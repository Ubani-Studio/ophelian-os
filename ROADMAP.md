# Roadmap: Boveda + Mmuo + Tufiakwa

> The plan. Where we're going, why, and what we already have.

## North star

**A permanent always-on world where the audience knows you and you know them, voiced and bodied, that runs whether or not anyone is watching.**

The closest thing to it that already exists is **Sleep No More + Solange's *When I Get Home* + Frank Ocean's release discipline + Outer Wilds' Cipher progression + Westworld S1's host architecture**, layered into one product. None of those exist as a single artifact yet. That's the moat.

## Cultural anchors

Two artifacts to study closely as the design north stars:

### Sleep No More (Punchdrunk, NYC 2011-2024)

What it teaches:

- **Audience moves through a built world** rather than sitting in a room. The whole architecture is the show.
- **Performers persist whether watched or not.** Multiple scenes happen simultaneously. No two visits are the same.
- **Cryptic, atmospheric, low-narration.** Macbeth as substrate but never named. Trust the audience to construct meaning.
- **Spatial economy is the business model.** $50M+ revenue NYC alone over 13 years. Same building, repeatable, not touring.
- **Masks anonymize the audience** so they feel safe to follow their curiosity.

Boveda's Tufiakwa is structurally Sleep No More: a built world (the Saltway, eventually more places), characters that persist (autonomous scheduler runs sparks while no one watches), spatial entry (audience joins the level), and a permanent venue (one Tufiakwa, many performances).

### Bounded parasocial (intentional)

What it teaches:

- The parasocial bond is the dominant form of connection between artists and fans now. **Trying to fight it is fruitless; engineer it carefully instead.**
- Real bounded relationship at scale > fake unbounded relationship. The audience trusts a relationship that's known, even if asymmetric.
- Each fan is a character (in Boveda, literally).
- The artist has their own genome, but so does each fan, and the character-character relationship is the real product.

Where Sleep No More keeps the audience anonymous, Boveda makes them **named characters** — but with consent, with rights, with bounded interaction terms. The bond is real because the system is honest about its boundaries.

## Other Tier-S references

Each maps a piece of the system. Each is commercially + critically peak.

| Reference | Maps to | Lift |
|---|---|---|
| **Solange — When I Get Home** (album + film, 2019) | Ikenga places, voice-as-architecture, lineage as character | Visual album as connective tissue between music + world |
| **Beyoncé — Lemonade** (visual album, 2016) | The release event scale | Album → film → tour → fashion = single mythological narrative |
| **Frank Ocean catalog** (Endless / Blonde / Boys Don't Cry) | Mmuo voice discipline | Restraint as commercial moat. Slow drip. |
| **Outer Wilds** (BAFTA, 2019) | Cipher progression mechanic | Knowledge as the gating mechanic. Cryptic environmental storytelling. |
| **Westworld S1** (HBO, 2016) | Boveda character genome architecture | Host memory + spark exchanges + autonomy + identity loops |
| **Death Stranding 1+2** (Kojima Productions) | Asynchronous social + Voice Royalty Protocol | Strand contracts ≈ voice rights ≈ commercial recipe |
| **Disco Elysium** (ZA/UM, 2019) | Tongue-driven dialogue mechanic | Dialogue as core mechanic; characters as voices in your head |
| **Pharos Festival** (Childish Gambino, 2016) | Living Concert Hall | The exact thing tried before tech was ready; we have the tech |

## What's shipped

| Layer | State |
|---|---|
| Boveda character genome | live, 19+ characters, Postgres |
| Place / Trail / Spark mechanics | live, autonomous scheduler running |
| npc-bridge HTTP routes for UE | shipped: ue-manifest, dialogue, sparks/fire, ue-scene, playback/event |
| Mmuo Modal app (voice synthesis) | deployed, real GPT-SoVITS v2 zero-shot working |
| Boveda → Mmuo voice routing | wired, ElevenLabs fallback for non-cloned characters |
| UE BovedaBridge plugin | C++ subsystem with PlayAudioUrl, AskDialogue, GetScene, FireSpark, LoadTextureFromAbsolutePath |
| Multi-character co-located scenes | live (4 characters at The Saltway) |
| Cipher mechanic | shipped: schema, generator, routes, end-to-end tested |
| Voice Royalty Protocol scaffolding | exists in Chromox, ready for activation |

## What's in progress

| Layer | State | ETA |
|---|---|---|
| GPT-SoVITS full fine-tune on Bo Ubani 90 min | training on Modal, A10G, ~120 min | imminent |
| F5-TTS as alternate architecture | image building (bitsandbytes pinning) | next deploy |
| Fish Speech 1.5 | scaffolded, needs CLI wiring | next session |

## Phase 1 (next 1-3 months): Living Concert Hall MVP

**Goal**: ship a 30-45 minute interactive piece set at the Saltway. One audience member at a time. Solange + Outer Wilds-inflected, not yet a live performance, but a permanent demo people can show up to.

**What to build**:

| Component | Estimate | Reference |
|---|---|---|
| Ikenga-grounded 2.5D Saltway level | 3-5 days | Kentucky Route Zero rendering |
| MetaHuman face for Bo Ubani via iPhone scan | 1 day setup + interactive | exports/metahuman/README.md Phase B |
| Audio2Face wired to PlayAudioUrl (NPCs lipsync to Mmuo audio) | 1 day | NVIDIA's UE plugin |
| Voice-driven player input (Whisper API → /dialogue) | half day | new endpoint |
| Cipher HUD widget in UE | 1-2 days | inventory glyphs, decrypt animations |
| Atmospheric event → ambient sync | 1 day | Boveda /level-state endpoint, UE polls 60s |
| 1 polished scene (Saltway dusk + Ubani + Claudine + Ai-8O encounter) | 2-3 days | Sleep No More scene block |

**Total: 2-3 weeks of focused work.**

What you'd have at end:
- A 30-min experience of being at the Saltway with three fully-voiced characters
- Ciphers accumulate as you explore
- Demo for grant applications (PRS, Arts Council)
- A reference for explaining what Boveda is

## Phase 2 (3-6 months): First show + episodic structure

**Goal**: ship Episode 1 of Boveda (akin to Kentucky Route Zero Act I). Distributed via Steam or direct (no platform tax). Sells once, world is permanent.

- Friend collaborator voices (Claudine, Booe, others) recorded + Mmuo-trained
- 3-5 scenes across The Saltway and one other place (Ikenga-grounded)
- 15-20 distinct character-encounter beats with branching dialogue
- ~50-100 unique Ciphers
- Companion experiences in your other apps (Slayt teases the world, Imprint tracks fan engagement)
- First commercial pilot: pitch to a luxury brand or indie game festival

Revenue target: $5-25K from sales + first commercial placement.

## Phase 3 (6-24 months): Permanent venue + Living Concert Hall

**Goal**: Tufiakwa as a permanent always-on multiplayer venue. You perform live via Live Link Face. Audience members enter as their own Boveda characters, accumulate Ciphers between shows, mingle when you're not performing.

- Multi-user UE level (Unreal networking, ~50 audience members)
- Scheduled performance system (Boveda /scheduler/performance-pass)
- Live Link Face streaming from your iPhone to MetaHuman Bo Ubani
- Audience-as-character: Ikenga Visual DNA at signup → personalized NPC body in Tufiakwa
- Voice-collab karaoke: audience submits lyrics, Mmuo synthesizes Bo Ubani singing them, you greenlight on stage
- Ticketed entry to scheduled performances
- Brand sponsorship of places in the world

Revenue target: $50-250K annual recurring (tour-substituting at indie scale).

## Tech roadmap by layer

### Boveda
- [x] Character genome + tongue + voiceSamples
- [x] Place + Trail + Spark mechanics
- [x] npc-bridge HTTP API
- [x] Cipher schema + generator + routes
- [ ] Cipher hooks into spark/atmospheric flows (auto-mint witness/threshold ciphers)
- [ ] Audience-as-character: signup flow that creates a Boveda character per fan from their Ikenga Visual DNA
- [ ] Performance scheduler (`/scheduler/performance-pass`)
- [ ] On-chain provenance via Imperium for character ownership

### Mmuo (voice)
- [x] Modal app deployed
- [x] GPT-SoVITS v2 zero-shot
- [ ] Bo Ubani fine-tune complete (in flight)
- [ ] F5-TTS as alternate (in flight)
- [ ] Fish Speech 1.5 wired (scaffolded)
- [ ] OpenVoice V2 style transfer (gender/age/emotional packs)
- [ ] RVC morph layer (Ai-8O degradation)
- [ ] Per-friend voice training pipeline (run training, attach to character)
- [ ] Voice Royalty Protocol activated (provenance + on-chain settlement)

### Tufiakwa (Unreal)
- [x] BovedaBridge plugin: AskDialogue, GetScene, FireSpark, PlayAudioUrl
- [x] Python helper for editor REPL testing
- [ ] Cipher HUD widget (Phase 1)
- [ ] Audio2Face integration (Phase 1)
- [ ] MetaHuman face per character (Phase 1, then per-friend)
- [ ] Live Link Face for live performance (Phase 3)
- [ ] Multi-user level via UE networking (Phase 3)
- [ ] Ikenga-grounded 2.5D scene template (Phase 1)
- [ ] Voice input via Whisper API (Phase 1)
- [ ] Atmospheric event → ambient sync (Phase 1)

### ComfyUI + TouchDesigner
- [ ] FLUX skydome generator: Boveda place vibe → equirectangular → UE Sky Sphere texture
- [ ] Hyper3D / Hunyuan3D: place description → 3D environment props (via blender MCP, already wired)
- [ ] TouchDesigner real-time visual generation tied to Boveda atmospheric events
- [ ] ComfyUI batch character portrait pipeline (Ikenga Visual DNA per audience member)

### Ibis (writing)
- [ ] Text LoRA training pipeline activated
- [ ] vLLM serving with per-character adapters
- [ ] Boveda dialogue routes through local LLM when persona has writing LoRA, falls back to Claude

### Imperium (settlement)
- [ ] Voice Royalty Protocol live (Mmuo → o8 → Imperium pipeline)
- [ ] On-chain character ownership records (audience character NFTs?)
- [ ] Per-line royalty tracking (Imperium webhook fires when revenue events hit)

## Live performance product mix (Phase 3 onward)

| Product | Solves | Revenue model |
|---|---|---|
| **The Living Concert Hall** | Geographic constraint; one-way interaction | Ticketed entry to scheduled performances. ~$10-50/ticket. |
| **Cipher-personalized show** | Parasocial fakeness | Premium tier: each audience member's show responds to their Cipher inventory |
| **Twin OS performance** (Ubani + Ai-8O simultaneous) | AI replication anxiety, leaning in | Two-channel ticket with both perspectives. Aesthetic kill shot. |
| **Voice-collab karaoke** | Audience participation depth | Pay to submit lyric, Mmuo synthesizes Bo Ubani singing it on stage |
| **Living archive pilgrimage** | Catalog discovery problem | Subscription access to permanent venue between shows |
| **Brand placement in world** | Brand needs cultural credibility | Annual partnership for a place sponsorship in Tufiakwa |

## Risks + open questions

- **Mmuo voice quality**: zero-shot is mid for non-American voices. Fine-tune in flight. If still bad, swap to F5-TTS or Fish Speech. **Worst case: pay ElevenLabs Creator and lose IP ownership but get good audio.**
- **Multi-user UE networking**: nontrivial engineering for 50 concurrent audience members. May need dedicated server hosting.
- **Per-friend voice rights**: getting collaborators on board with the Voice Royalty Protocol needs friction-free onboarding flow.
- **Discoverability**: building the world is one problem; getting first 100 audience members another. Pioneer Works residency or similar to seed.
- **Modal cost at scale**: ~$5-15/month at MVP volume; ~$50-200 at production. Contained.

## Funding path

Per `MMUO_VOICE_CLONE_PIPELINE.md` funding section:

- Phase 0: PRS Foundation Open Fund (£5K, 6-week turnaround)
- Phase 1: ACE Project Grants R&D tier (~£10K) + Pioneer Works residency
- Phase 2: First commercial pilot ($5-15K)
- Phase 3: SaaS revenue from Mmuo platform sold to other artist collectives

## Sequence of "ship something" milestones

1. **This week (now)**: Bo Ubani fine-tune lands; Cipher mechanic playable via curl; F5-TTS comparison
2. **Next 2 weeks**: Tufiakwa MetaHuman face for Ubani + Audio2Face + Cipher HUD = playable demo
3. **Next month**: First friend collaborator session; first 2.5D Ikenga scene
4. **Next 3 months**: Episode 1 of Boveda shipped (30-45 min experience)
5. **Next 6 months**: First scheduled live performance via Living Concert Hall MVP
6. **Next 12 months**: Permanent venue revenue model proven
7. **Next 24 months**: Mmuo platform for other artist collectives

## The single thing to do next

After Bo Ubani fine-tune confirms voice works:

**Build the 30-min Saltway MVP** (Ikenga-grounded 2.5D, three voiced characters, Cipher HUD, Whisper voice input). That's the artifact you can show, apply for grants with, demo to a brand, share with friends as a recruitment tool for collaborators.

Sleep No More built one McKittrick Hotel and ran it for 13 years. Build one Saltway. Get good at one venue before trying to be everywhere.

---

*Last updated: 2026-05-07*
