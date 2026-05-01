# Boveda Character Genome — Schema

Each character is a JSON record at `~/boveda/characters/<name>.json`. This is
the source of truth for character identity across the ecosystem. gen.py,
Slayt, and any future tool reads from here.

## Schema

```json
{
  "name": "ubani",
  "trigger": "ubani",
  "display_name": "Ubani",
  "description": "Primary artist persona. Trained on 25 Higgsfield reference photos.",

  "lora": {
    "local": "D:\\Visuals\\ComfyUI\\models\\loras\\ubani_v1.safetensors",
    "wsl_local": "/mnt/d/Visuals/ComfyUI/models/loras/ubani_v1.safetensors",
    "replicate_destination": "bomac1193/ubani-flux",
    "replicate_version": "<filled-after-training>",
    "trigger": "ubani",
    "trained_on": "FLUX-dev",
    "trained_at": "<ISO8601>",
    "rank": 16,
    "steps": 1500,
    "training_set_size": 25
  },

  "stack_with": ["alabo_eye"],

  "voice": {
    "elevenlabs_voice_id": "<id-from-elevenlabs-after-clone>",
    "model": "eleven_multilingual_v2",
    "stability": 0.5,
    "similarity_boost": 0.75
  },

  "brand": {
    "primary_color": "#1a1a1a",
    "accent_color": "#8b3a3a",
    "tagline": "",
    "rights": "owner: bomac1193, exclusive use",
    "license": "private"
  },

  "default_prompt_prefix": "alabo_eye, ubani,",
  "default_negative": "",
  "preferred_aspect": "9:16",
  "preferred_quality": "high"
}
```

## Fields

- **name / trigger**: lowercase, no spaces, used as the LoRA trigger token
- **lora**: paths + Replicate destination so any backend can resolve
- **stack_with**: other LoRAs that should be loaded alongside (style LoRAs like alabo_eye)
- **voice**: ElevenLabs voice clone ID + parameters; null if no voice clone yet
- **brand**: rights, color identity, license — used by Imprint/Imperium downstream
- **default_prompt_prefix**: auto-prepended to every prompt for this character
- **preferred_aspect / quality**: defaults for gen.py when --character is set

## Usage

```python
from boveda_registry import get_character
char = get_character("ubani")
# char.lora.wsl_local, char.trigger, char.voice.elevenlabs_voice_id, etc.
```

Or via gen.py:
```bash
python gen.py flux --character ubani --prompt "in a market"
# Auto-stacks alabo_eye + ubani LoRAs, prepends triggers, uses defaults
```
