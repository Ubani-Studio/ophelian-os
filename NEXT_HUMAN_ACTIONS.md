# What only you can do

> Everything I (the agent) can't do for you, in priority order. The
> system is wired and the docs exist. These actions unblock the
> remaining quality and capability gaps.

## Priority 0, this week

### 1. Open Tufiakwa, compile the BovedaBridge plugin

**Why**: The C++ runtime plugin exists on disk at
`Plugins/BovedaBridge/` but UE hasn't built it yet. Until built, the
`UBovedaSubsystem` Blueprint nodes don't exist in your editor.

**How**: Double-click `E:\Alabo\Unreal\Unreal Projects\Tufiakwa\Proj.uproject`.
UE will prompt: "the following modules are missing or built with a
different engine version: BovedaBridge, would you like to rebuild now?"
→ **Yes**. Wait 1-3 minutes.

If no prompt: right-click `Proj.uproject` → **Generate Visual Studio
project files** → open `Proj.sln` → Development Editor / Win64 →
Build.

**Verify**: open the Output Log, switch to Python:
```python
import boveda_bridge as bv
print(bv.dialogue("Ai-8O", "test")["line"])
```
You should get a line + audio_url.

**Time**: 5-15 minutes.

---

### 2. Treat your home studio

**Why**: U87 + Avedis MA5 is a top-shelf signal chain. Bottleneck is
the room. A treated home studio beats any one-shot pro studio session
because voice cloning rewards consistency across many sessions.

**How**: Per `MMUO_VOICE_CLONE_PIPELINE.md` Recording Setup section.

- 6-8 absorption panels around the mic position. GIK 242 (~$80 each)
  or DIY rockwool (~$30 each).
- Reflection filter behind the mic. sE Reflexion Filter Pro (~$200)
  or a U-shape of moving blankets (free).
- Heavy curtains over windows.
- Move the PC out of the room or behind a thick blanket.
- Test the noise floor: aim below -50 dB during silence. Record 30s
  of nothing in your DAW, look at the level.

**Time**: One weekend. **Cost**: $300-800 once.

---

### 3. Audit your existing Bo Ubani training audio

**Why**: You already have 2-3 hours of audio used to train ElevenLabs.
That's gold for fine-tuning GPT-SoVITS. **Don't re-record yet.**

**How**:

- Find the audio files. Probably in your DAW project folders.
- Verify format: 44.1 or 48 kHz, 24-bit ideally, **WAV not mp3**.
- Verify quality: low noise floor, consistent gain, no clipping.
- If everything is mp3 from ElevenLabs export, see if you can re-render
  WAV from the original sessions. mp3 source bakes compression
  artifacts into the clone.

**Time**: 30 minutes.

---

## Priority 1, next two weeks

### 4. Wire the GPT-SoVITS integration in Mmuo Modal

**Why**: Today the Modal app returns silence WAV. To get Bo Ubani
actually speaking text, the GPT-SoVITS layer needs to be connected.
This is the single highest-leverage move in the whole project.

**How**: Open `~/mmuo-modal/src/app.py`. The `# ── INTEGRATION POINT ──`
blocks have pseudocode showing the real call shape. You (or I, with
explicit go-ahead) fill those in. Steps:

1. Uncomment the GPT-SoVITS pip install in `gptsovits_image`.
2. Switch `@app.cls(image=gptsovits_image, gpu="A10G", ...)` back on.
3. Implement `GPTSoVITSService.setup` (load base + persona checkpoint).
4. Implement `GPTSoVITSService.synthesize` (call inference API).
5. In `synthesize` orchestrator: replace the inline silence with
   `GPTSoVITSService().synthesize.remote(...)`.
6. `modal deploy src/app.py`.

The upstream GPT-SoVITS repo gets cloned into the image. Reference
files inside the image:
- `/opt/GPT-SoVITS/api.py` — existing HTTP API to mirror.
- `/opt/GPT-SoVITS/inference_main.py` — inference entry point.

**Time**: half a day if comfortable with the code, full day with
debugging. Can ask me to do this when ready.

---

### 5. Train Bo Ubani GPT-SoVITS fine-tune

**Why**: Once GPT-SoVITS is wired, you fine-tune on your existing
audio (assuming it's clean WAV). Output: a per-persona `.pth` file
that lives in the Modal Volume and is loaded by the service.

**How**:

1. Upload audio to Modal Volume:
   ```bash
   modal volume put mmuo-models /local/path/to/bo_ubani_session.wav \
     /personas/d5ed82b8-98ae-4d8a-ad30-e4fea597d40a/training/session_01.wav
   ```
   Repeat for each session file.
2. Call the train endpoint (still scaffold, will work once wired):
   ```bash
   modal run src/app.py::train_gptsovits \
     --body '{"persona_id":"d5ed82b8-...", "sample_paths":["/personas/.../training/session_01.wav"], "epochs":15}'
   ```
3. Wait ~30-60 min on A100, ~$2-3 in compute.
4. Verify the new `.pth` is in the volume.

**Time**: 1-2 hours human, 30-60 min wall-clock for training.

---

### 6. Listen + iterate

**Why**: First fine-tune is rarely perfect. Need an ear pass to spot
artifacts and decide if it's "vocodery" (in which case adjust source
audio or settings) or genuinely good.

**How**:

```bash
bash ~/mmuo-modal/scripts/full_pipeline_check.sh
```

Generates a few test renders. Listen. Open the audio_url URLs in a
browser. If clean: ship. If artifacts: adjust per the "Why it sounded
vocodery before" section in our conversation history (RE-export source
as WAV, lower index_rate if RVC is involved, etc.).

**Time**: 30-60 min listening + iteration.

---

## Priority 2, when you have momentum

### 7. Apply to PRS Foundation Open Fund

**Why**: £5K grant, 6-week turnaround, fits "compositional research
for character world" framing perfectly. Easiest first source of real
project funding.

**How**: https://prsfoundation.com/funding-support/funding-music-creators/all-career-levels/the-open-fund-for-music-creators/.

Application asks for: project description (Boveda + Mmuo), budget
(~£5K covers Modal credits + studio treatment + collaborator session
fees), timeline.

**What to include in application**:
- Reference `MMUO_VOICE_CLONE_PIPELINE.md` (the strategic frame).
- Mention the Voice Royalty Protocol (the rights innovation).
- Multi-character world, real artist co-creators.
- Existing assets: Bo Ubani RVC model, Mmuo Modal infrastructure live.

**Time**: 2 hours to write, 6 weeks to turnaround.

---

### 8. Cast your first two friend collaborators

**Why**: The world is more interesting with real human voices behind
characters. Two trusted friends as co-creators is the right pace,
not 10 cold outreach.

**How**:

- Pick two characters. Easy starting points: Claudine (already at the
  Saltway with personality) and one other.
- Pick two friends whose natural cadence fits those characters'
  writing voices (look at their `voiceSamples` in the Boveda DB).
- Send each friend `MMUO_VOICE_COLLAB_ONE_PAGER.md` (print it or
  share as PDF).
- Have a casting conversation. Let them edit the terms.
- Schedule a recording session at your treated home studio.
- Run them through the recording protocol from
  `MMUO_VOICE_CLONE_PIPELINE.md` Recording Setup.
- Train per-character GPT-SoVITS clones on Modal. ~$2-3 each.
- Update the Boveda character JSONs with new `mmuo_persona_id`s.

**Time**: 2-4 weeks elapsed, ~6 hours active per friend.

---

## Priority 3, post-foundation

### 9. Capture face for MetaHuman (Phase B)

Per `UBANI_NPC_SETUP.md` Phase B section. iPhone with MetaHuman
Animator app, or 30-50 photo set uploaded to MetaHuman Mesh from
Mobile.

### 10. Build the Tufiakwa multi-character level

Once UE plugin compiles, Bo Ubani trained, voices alive: build a
level set at "The Saltway." Spawn one BP_BovedaNPC per character.
Press F → spark fires → characters speak in their own voices.

### 11. Build the testing UMG widget (`WBP_BovedaTestRoom`)

Per `UBANI_NPC_SETUP.md` Phase A2. The clickable studio for
iterating prompts and listening to per-character renders without
compiling Blueprint changes every time.

### 12. Apply for Pioneer Works / Ars Electronica residencies

When you have working evidence to demonstrate.

---

## Things I do for you

When you're ready, ask:

- "Wire GPT-SoVITS integration" → I fill the integration points,
  redeploy, run the smoke test.
- "Wire OpenVoice V2" → same for the style-transfer layer.
- "Wire RVC properly" → same for the morph layer.
- "Build the Boveda Studio collab page" → admin UI for managing
  collaborator voice profiles.
- "Wire the Ibis text LoRA inference" → swap Boveda's `callLlm` from
  Anthropic to a local vLLM serving your trained text adapter.

---

## Things that don't need doing yet

- ElevenLabs subscription upgrade. Stay free-tier. The fallback works
  for testing, the real renders go through Mmuo.
- Buying GPT-SoVITS credits / signups elsewhere. The Modal pipeline
  + your existing audio is the path.
- Training rig on your local hardware. Modal is cheaper for sporadic
  training and avoids GPU contention.

---

Last updated: 2026-05-07
