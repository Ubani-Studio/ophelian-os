# Priority list

> Ordered by leverage. Top items unblock everything below.

## P0 — this week (blocking)

1. **Voice verdict moved to the Mmuo Stage 2 sweep (updated 2026-06-10).** `FULL_01_signature.wav` (GPT-SoVITS, May 7) is superseded. The voice stack now lives in ai-8o sound packs: CosyVoice 2 baseline wired, kNN-VC blend lane shipped, Higgs Audio v2 on disk, Qwen3-TTS queued as priority pull. Build `sandbox/ab_sweep.py` per `/home/sphinxy/ai-8o/STAGE_2_QUEUE.md`, pick the winner, then point Boveda voice routing at the winning pack route instead of the old mmuo-modal GPT-SoVITS app. Stage 3 LoRA on the winner gives the owned identity the rights rail requires. ElevenLabs fallback stays demo-only: losing voice IP kills the moat.

2. **Capture Bo Ubani face for MetaHuman.** iPhone via MetaHuman Animator, or 30-50 photo upload to MetaHuman Mesh from Mobile. Unblocks every "performable body" item. Half day, you-only.

3. **Verify UE plugin compiled with all latest C++ methods** (PlayAudioUrl, ReportPlaybackEvent, audio_provider, plus upcoming Cipher methods). If not, recompile in Tufiakwa.

## P1 — next 2 weeks (Phase 1 MVP pieces)

4. **Cipher HUD widget in UE.** Backend shipped; UE side needed. Glyph inventory, decrypt animation, present-to-character interaction. *2 days, mostly Blueprint with a thin C++ subsystem extension. Can start now.*

5. **Wire Audio2Face to PlayAudioUrl.** NPCs lipsync to Mmuo audio automatically. NVIDIA's UE plugin handles ~80% of work. *1 day.*

6. **Build Ikenga 2.5D Saltway scene.** Ikenga photo as parallax background, MetaHumans as foreground, atmospheric events drive lighting. The actual demo space. *3-5 days.*

7. **Voice-driven player input via Whisper API → /dialogue.** Player speaks, Mmuo responds. Closes the conversation loop. *Half day.*

8. **First polished scene: dusk at the Saltway with three voiced characters + 1 spark + 1 Cipher unlock.** Combines #4-7 into a 5-minute showable demo. *2-3 days after #4-7 ship.*

## P2 — next month (Phase 1 ship)

9. **Friend collab session #1 (Claudine or closest collaborator).** Record + train per-character voice via Mmuo. Validates the friend pipeline + adds another distinct voice. *Half day setup + 90 min recording + 2-3 hours training.*

10. **Atmospheric event → UE ambient sync.** Boveda's scheduler fires events; UE shifts lighting/sound/fog. Makes world feel autonomous. *1 day.*

11. **Grant stack (updated 2026-06-10).** PRS Foundation Open Fund (£5K, two 2026 deadlines, check prsfoundation.com/funding-support/deadlines). Epic MegaGrants 2026 window June 29 to Sept 4: the five-minute demo video doubles as the application asset, highest-fit fund on the list. Serpentine Future Art Ecosystems R&D Fellowship 2026 (£10K, theme Art x Convergence: AI reshaping cultural and legal realities, near-perfect rights-rail fit, launches September). Onassis ONX (NYC, XR/AI fellows, production facilities). Immersive Arts UK is CLOSED (second and final round complete).

12. **OpenVoice V2 wiring for emotional registers** (gender, age, scream pack). Drives one Bo Ubani clone into many character variations. Unblocks Ai-8O degraded twin properly. *Half day.*

13. **MORNING_STATUS auto-update via Boveda agent** (Trail summarizer agent — Tier 3 from agent options). Highest-leverage agentic build. *1-2 hours.*

## P3 — 2-3 months (Phase 2 stretch)

14. **Episode 1 of Boveda: 30-45 min experience, 3-5 scenes, 50-100 Ciphers.** Sells once, world is permanent. Maps to Kentucky Route Zero Act I structurally.

15. **Voice Royalty Protocol activation.** Mmuo → o8 → Boveda → Imperium pipeline. Activates legal/ethical framework for friend collabs at scale.

16. **Pioneer Works Tech residency application.** Stipend + studio + exhibition.

17. **Audience-as-character signup flow.** Ikenga Visual DNA → Boveda character per fan → NPC body in Tufiakwa. Unblocks bounded-parasocial layer.

18. **Audio QA agent.** Listens to fresh Mmuo synth, flags vocodery output. Catches regressions when training new voices.

19. **First commercial pilot pitch.** Luxury brand or indie game studio. $5-15K target.

## P4 — opportunistic / parallel

20. Fish Speech wiring (only if F5-TTS isn't enough)
21. RVC morph layer (only if OpenVoice V2 doesn't reach Ai-8O degraded)
22. Ibis text LoRA serving (after voice; text via Claude few-shot is fine)
23. Multi-user UE level (Phase 3 Living Concert Hall)
24. TouchDesigner real-time visuals (live performance era)
25. ComfyUI skydome auto-gen (Phase 2-3 nice-to-have)
26. Imperium on-chain settlement (when revenue exists)
27. OpenHands self-hosted agent (when single-operator iteration is the bottleneck)

## Critical 5 right now

**1, 2, 4, 5, 6.** Bo Ubani voice quality verdict + face capture + Cipher HUD + Audio2Face + Ikenga 2.5D scene = Phase 1 MVP.

Everything else is downstream of those five.

---

*Last updated: 2026-05-07. Bo Ubani full fine-tune complete; demos at `~/mmuo-modal/morning/FULL_*.wav`.*
