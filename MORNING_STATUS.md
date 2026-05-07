# Morning status, Mmuo voice pipeline

Generated: 2026-05-07T13:00 BST

## Verdict

**YELLOW. Zero-shot synthesis works. Fine-tune wiring made real progress
overnight but didn't complete. Next session is one focused hour from
finishing.**

## What's working

- Modal `mmuo` app deployed with full GPT-SoVITS v2 image
- 720MB raw mono training audio uploaded to volume
- 3 reference clips uploaded + transcribed (transcripts in volume)
- Zero-shot synthesis returns real audio per call (proven, ~1-3s warm)
- 11 demo audio files saved at:
  `~/mmuo-modal/morning/` and  
  `http://localhost:5130/uploads/voice/cmokybgyx0001vbjqaauy88qo/morning/`

## Honest assessment of the audio

User listened to zero-shot demos and said: **"sounds American and
generic, not like a clone of my voice."**

Verified the reference clip itself is your voice (you confirmed `ref_check.wav`
is you reading academic text). So the input is good. The model's
zero-shot is just genuinely mid for non-American English voices from
8-second references.

The honest fix is fine-tune training on the full 90-min audio, NOT
parameter tweaking on zero-shot. No prompt_text or reference clip swap
will close that accent gap meaningfully.

## What was attempted overnight (fine-tune)

Wrote `train_gptsovits_real` Modal function that orchestrates:
1. Audio slicing (silence-detection chunks)
2. Whisper transcription per slice
3. Upstream `prepare_datasets/` scripts (1-get-text, 2-get-hubert, 3-get-semantic)
4. SoVITS fine-tune (s2_train.py)
5. GPT fine-tune (s1_train.py)
6. Save trained checkpoints to volume

8 deploy/test iterations got it through:
- Audio slicing ✓ (rewrote inline using slicer2 module after upstream
  wrapper script had unfixable PYTHONPATH issues in Modal subprocess)
- Whisper transcription ✓ (~30 slices from 5-min audio subset)
- Prep step 1-get-text: **STUCK at FileNotFoundError on
  `chinese-roberta-wwm-ext-large` pretrained models**

The pretrained models ARE in the volume at
`/models/gptsovits/pretrained_models/chinese-roberta-wwm-ext-large/`.
The synthesis container symlinks them into
`/opt/GPT-SoVITS/GPT_SoVITS/pretrained_models/` via @modal.enter().
The training container needs the same symlink.

I added the symlink to `train_gptsovits_real` but the test that fired
right after the deploy may have hit a stale container.

## The exact next move (1 fix away from full pipeline)

In `~/mmuo-modal/src/app.py`, the `train_gptsovits_real` function now
has the symlink-pretrained-models block at the top. To verify:

```bash
modal app stop mmuo
sleep 3
cd ~/mmuo-modal && modal deploy src/app.py
```

Then run:

```bash
OPENAI_KEY=$(grep "^OPENAI_API_KEY=" ~/chromox/backend/.env | cut -d= -f2)
~/chromox/backend/venv/bin/python -c "
import modal
train = modal.Function.from_name('mmuo', 'train_gptsovits_real')
result = train.remote(
    persona_id='d5ed82b8-98ae-4d8a-ad30-e4fea597d40a',
    audio_path='/personas/d5ed82b8-98ae-4d8a-ad30-e4fea597d40a/training/bo_ubani_session_01_mono.wav',
    openai_api_key='$OPENAI_KEY',
    epochs_s1=5, epochs_s2=3,
    sample_minutes=5,
)
print(result)
"
```

If that succeeds, run again with `sample_minutes=0` to train on the
full 90 min. ~2-3 hours wall-clock on A10G, ~$3 in compute.

If prep-step-1 still fails: the symlink might be racing with the
training script setup. Hard-set the env var `bert_pretrained_dir` in
the function to point directly at `/models/gptsovits/pretrained_models/chinese-roberta-wwm-ext-large`
instead of via the symlink. Same for `cnhubert_base_dir` and `pretrained_s2G`.

If prep-step-2 fails next: similar pattern, point env vars at volume
paths directly. There may be 2-3 more such fixes before the prep
phase is green.

## After fine-tune works

Once the test 5-min run completes:
1. Listen to a quick synth from the fine-tuned checkpoint
2. If sounds vocodery: investigate before running full 90 min
3. If sounds promising: kick full 90 min run (~3 hours, ~$3)
4. After full run: update `synthesize` method to use the fine-tuned
   `gptsovits.s1.ckpt` and `gptsovits.s2.pth` paths in volume (need
   to plumb that into the api_v2 spawn via `set_gpt_weights` and
   `set_sovits_weights` endpoints)
5. Demo Bo Ubani in his actual voice

## Why this took longer than expected

GPT-SoVITS upstream's training pipeline is a Gradio-orchestrated set of
scripts that assume specific cwd, sys.path, and env-var patterns that
the upstream's `webui.py` sets up from a desktop context. Replicating
that for headless Modal subprocesses surfaces one upstream-assumption
issue per iteration. Each fix takes ~30s deploy + ~30s test.

A potentially cleaner approach for next session: use the upstream's
`config.py` global state machinery and import the training functions
in-process rather than via subprocess. Slower iteration but fewer
subprocess-environment issues.

## Costs so far

Modal compute total: <$3. Within $30/mo free tier.

## Bug log (chronological)

1. Modal free-tier 8 web endpoint cap → trimmed to 1
2. Pydantic+fastapi import crash in containers → pinned versions
3. Missing GPT-SoVITS deps (peft, funasr) → full requirements install
4. NLTK data missing → baked into image
5. Bad readiness probe (no /health on api_v2) → probe `/` instead
6. slice_audio.py PYTHONPATH unresolvable in subprocess → inlined slicer2
7. prep scripts can't import upstream modules → exec wrapper
8. pretrained_models path missing in training container → symlink at
   function start (current blocker, may be one more deploy away)

## To listen to existing zero-shot now

```
http://localhost:5130/uploads/voice/cmokybgyx0001vbjqaauy88qo/morning/00_first_real_synth.wav
http://localhost:5130/uploads/voice/cmokybgyx0001vbjqaauy88qo/morning/01_declarative.wav
http://localhost:5130/uploads/voice/cmokybgyx0001vbjqaauy88qo/morning/02_intimate.wav
http://localhost:5130/uploads/voice/cmokybgyx0001vbjqaauy88qo/morning/03_aphoristic.wav
http://localhost:5130/uploads/voice/cmokybgyx0001vbjqaauy88qo/morning/05_question.wav
http://localhost:5130/uploads/voice/cmokybgyx0001vbjqaauy88qo/morning/14_with_prompt_signature.wav
```

These don't sound like you. Fine-tune is the fix.
