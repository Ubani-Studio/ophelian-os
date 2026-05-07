# Morning status, Mmuo voice pipeline

Generated: 2026-05-07T11:30 BST

## Verdict

**YELLOW. Zero-shot synthesis working, accent fidelity is poor, fine-tune is the fix.**

The Mmuo Modal pipeline produces real GPT-SoVITS audio from your
8-second reference clip. But user listened and confirmed: it sounds
American and generic, not like a clone. This is a known limitation
of GPT-SoVITS v2 zero-shot for non-American English voices.

The reference clip is verifiably your voice (you confirmed listening
to `ref_check.wav`). The input is good. The model's zero-shot
accent fidelity is just genuinely mid. **No tweak fixes this. Only
fine-tuning on your full 90-min audio does.**

## What's confirmed working

- Modal app `mmuo` deployed, A10G GPU container, GPT-SoVITS v2
- 720MB mono training audio uploaded to volume
- 3 reference clips uploaded
- NLTK data baked into image
- Pydantic + fastapi pinned cleanly
- Real synth audio: ~150-260 KB per 2-4s clip, 1-3s render time when warm
- 5 demo prompts rendered (`01-05_*.wav`)
- 5 with-prompt-text re-renders (`10-14_*.wav`)
- All 11 audio files browser-accessible at:
  `http://localhost:5130/uploads/voice/cmokybgyx0001vbjqaauy88qo/morning/`

## What's NOT working

- The voice clone doesn't sound like Bo Ubani. Sounds American,
  generic. Fine-tune on the full 90 min audio is the fix.

## What's needed next

**Wire fine-tune training in Modal.** The `train_gptsovits` function
is currently a placeholder. To make Bo Ubani audible at proper
quality requires:

1. **Audio slicing**: split 90-min file into 3-10s chunks at silence
   boundaries. Upstream has `tools/slice_audio.py`.
2. **Transcription**: each chunk needs text. Whisper API works
   (proven; chromox OpenAI key has access).
3. **Format dataset**: write `list` file in upstream format
   `vocal_path|speaker|lang|text` per line.
4. **Run upstream prep scripts** via subprocess:
   - `prepare_datasets/1-get-text.py` (env-var-driven)
   - `prepare_datasets/2-get-hubert-wav32k.py`
   - `prepare_datasets/3-get-semantic.py`
5. **Train SoVITS**: `s2_train.py --config <yaml>`. Audio decoder.
6. **Train GPT**: `s1_train.py --config <yaml>`. Text-to-token.
7. **Save checkpoints to volume**, update synth code to use them.

Estimate: 4-8 hours of engineering + debug + 2-3 hours of actual
training compute. Single A10G run, ~$3-5 in compute.

## What you'll wake to

Zero-shot demos are listenable but not your voice. Fine-tune wire-up
is the next session's main work. The path is clear, just hasn't been
executed.

## Audio files generated

| File | What | Render time |
|---|---|---|
| 00_first_real_synth.wav | "hello bo ubani" | 42s cold |
| 01_declarative.wav | "the seam holds..." | 2.6s warm |
| 02_intimate.wav | "you hear it now..." | 1.4s warm |
| 03_aphoristic.wav | "contradiction is structure..." | 1.5s warm |
| 04_audio_eng.wav | "the loop wants to break..." | 1.2s warm |
| 05_question.wav | "what does the saltway feel like..." | 1.3s warm |
| 10-14_with_prompt_*.wav | same prompts but with reference's transcript as prompt_text | 1-50s |
| ref_check.wav | the 8-sec reference clip itself (your voice reading academic text) | n/a |

## Costs so far

Total Modal compute: <$2. Within $30/mo free tier easily.

## Bugs fixed during the build

1. Modal free-tier 8 web endpoint cap → trimmed to 1
2. pydantic_core import crash inside containers → pinned versions
3. Missing GPT-SoVITS deps (peft, funasr, etc.) → full requirements install
4. NLTK data missing → baked into image
5. Bad readiness probe (no /health on api_v2) → probe `/` instead

## Useful commands

```bash
# Listen to first real synth
xdg-open http://localhost:5130/uploads/voice/cmokybgyx0001vbjqaauy88qo/morning/00_first_real_synth.wav

# Try a different reference clip (ref_2 is from min 30, ref_3 from min 60)
cd ~/mmuo-modal && python3 -c "
import modal
GPTSoVITSService = modal.Cls.from_name('mmuo', 'GPTSoVITSService')
wav = GPTSoVITSService().synthesize.remote(
    text='your text here',
    persona_id='d5ed82b8-98ae-4d8a-ad30-e4fea597d40a',
    ref_audio_path='/personas/d5ed82b8-98ae-4d8a-ad30-e4fea597d40a/refs/ref_2_minute30_neutral.wav',
)
open('/tmp/test.wav','wb').write(wav)
print(f'wrote /tmp/test.wav ({len(wav)} bytes)')
"

# Check Modal logs
modal app logs mmuo

# Run pipeline check
bash ~/mmuo-modal/scripts/full_pipeline_check.sh
```

## To continue from here

Next session: wire fine-tune training. The skeleton plan above is the
full work needed. The upstream's `webui.py` has a working orchestration
to mirror (see lines 780-900 for `open1a`, `open1b`, `open1c`).
