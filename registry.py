"""
Boveda character registry — source of truth for character identity across the
Violet Sphinx ecosystem.

Each character is a JSON record at characters/<name>.json. This module provides
a thin Python interface so gen.py, Slayt, and any other tool can resolve a
character's LoRA paths, voice IDs, brand assets, etc.

Usage:
    from boveda.registry import get_character, list_characters

    char = get_character("ubani")
    # char.trigger, char.lora_path_wsl, char.voice_id, char.stack_with, ...

    chars = list_characters()  # ['alabo_eye', 'ubani', ...]
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

CHARACTERS_DIR = Path("/home/sphinxy/boveda/characters")


@dataclass
class Character:
    name: str
    trigger: str
    display_name: str
    description: str
    type: str  # 'character' or 'style'
    lora: dict
    stack_with: list[str]
    voice: Optional[dict]
    brand: dict
    default_prompt_prefix: str
    default_negative: str
    preferred_aspect: str
    preferred_quality: str
    _raw: dict = field(default_factory=dict, repr=False)

    @property
    def lora_path_wsl(self) -> str:
        return self.lora.get("wsl_local", "")

    @property
    def lora_path_windows(self) -> str:
        return self.lora.get("local", "")

    @property
    def replicate_ref(self) -> Optional[str]:
        dest = self.lora.get("replicate_destination")
        ver = self.lora.get("replicate_version")
        if dest and ver:
            return f"{dest}:{ver}"
        return dest

    @property
    def voice_id(self) -> Optional[str]:
        if not self.voice:
            return None
        return self.voice.get("elevenlabs_voice_id")

    @property
    def trained(self) -> bool:
        return self.lora.get("replicate_version") is not None or self.lora.get("trained_at") is not None


def get_character(name: str) -> Character:
    path = CHARACTERS_DIR / f"{name}.json"
    if not path.exists():
        raise FileNotFoundError(f"No Boveda character record at {path}")
    raw = json.loads(path.read_text())
    return Character(
        name=raw["name"],
        trigger=raw["trigger"],
        display_name=raw["display_name"],
        description=raw.get("description", ""),
        type=raw.get("type", "character"),
        lora=raw.get("lora", {}),
        stack_with=raw.get("stack_with", []),
        voice=raw.get("voice"),
        brand=raw.get("brand", {}),
        default_prompt_prefix=raw.get("default_prompt_prefix", ""),
        default_negative=raw.get("default_negative", ""),
        preferred_aspect=raw.get("preferred_aspect", "1:1"),
        preferred_quality=raw.get("preferred_quality", "high"),
        _raw=raw,
    )


def list_characters() -> list[str]:
    if not CHARACTERS_DIR.exists():
        return []
    return sorted(p.stem for p in CHARACTERS_DIR.glob("*.json") if not p.stem.startswith("_"))


def resolve_stack(name: str) -> list[Character]:
    """Return the full LoRA stack: stack_with characters + this one (in order)."""
    char = get_character(name)
    stack = [get_character(s) for s in char.stack_with]
    stack.append(char)
    return stack


def update_character(name: str, updates: dict) -> None:
    """Patch a character record. Pass nested keys with dots: e.g.
    {'lora.replicate_version': 'abc123'} or {'voice.elevenlabs_voice_id': 'xyz'}."""
    path = CHARACTERS_DIR / f"{name}.json"
    raw = json.loads(path.read_text())
    for key, value in updates.items():
        parts = key.split(".")
        d = raw
        for p in parts[:-1]:
            d = d.setdefault(p, {})
        d[parts[-1]] = value
    path.write_text(json.dumps(raw, indent=2))


if __name__ == "__main__":
    print("Characters in registry:", list_characters())
    for n in list_characters():
        c = get_character(n)
        status = "trained" if c.trained else "NOT yet trained"
        print(f"  {c.name:15} ({c.type:9}) trigger='{c.trigger}' stack_with={c.stack_with} [{status}]")
