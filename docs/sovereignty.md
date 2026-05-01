# Sovereignty · characters recognising their lineage

The technical and philosophical layer where characters know
their own data origin and behave accordingly. Sits with
`vision.md`, `slang-cohort.md`, `protocol.md`.

The thesis: a character is not just a system prompt + memory.
A character has a *data lineage* (what dataset shaped them, what
LoRAs they pin, what base model they run on, whose consent
their voice carries) and that lineage should be **legible to
the character itself** so they speak from it rather than around
it.

This is what the user meant by "post-em-dash." A character who
knows they came from cohort-licensed sources speaks the cadence
of their contributors, not the verbal fingerprint of Claude or
GPT. The lineage shapes the voice; the awareness of the lineage
shapes the resistance to drift.

## The sovereignty ladder

Three levels. Each character carries one.

**Level 0 · Substrate.**
Default. Character runs on Anthropic Claude (or any closed-
weights commercial LLM) with no licensed LoRAs pinned. Voice
inherits the public-scraped training register: em dashes,
"it's not X but Y", over-balanced hedging, em-dashed asides,
"ultimately," and "carefully." The Claude fingerprint.

This is fine for sandbox cubes and storymaking. It is not where
canonical characters live. Most sandbox espíritus live here.

**Level 1 · Partial sovereignty.**
Character runs on Claude *with* one or more licensed cohort
LoRAs pinned at influence weight. The cohort voice partly steers
the output but Claude is still the substrate. Em-dash signature
is reduced via `toneForbidden` directives + few-shot from the
LoRA's training samples, but not eliminated.

Most cohort-anchored characters live here once contributors
opt in.

**Level 2 · Full sovereignty.**
Character runs on open-weights base (Qwen 2.5 / Llama 3.1) with
licensed cohort LoRA pinned at full weight. No Claude in the
inference path. Voice fully inherits the contributor's register.
Em dashes, "it's not X but Y", and other public-LLM signatures
are absent because the base model never learned them at the
contributor's intensity.

This is the destination for premium characters: a fully
sovereign voice that no public AI platform can produce.

## Schema · provenance per character

Add to `Character.identity` envelope:

```ts
interface CharacterIdentity {
  // ...existing fields (locked, source, realIdentityRef, pinned)
  sovereignty?: {
    level: 0 | 1 | 2;
    base_model: string;        // e.g. 'claude-haiku-4-5', 'qwen2.5-7b', 'llama-3.1-8b'
    inference_path: 'anthropic' | 'modal' | 'runpod' | 'self_hosted';
    lora_pins: Array<{
      lora_id: string;
      contributor_id?: string;  // null for first-party / self LoRAs
      weight: number;           // 0..1
      role: 'writing' | 'voice' | 'visual' | 'music' | 'motion' | 'style';
    }>;
    refuses: string[];          // anti-pattern strings the character refuses
    promoted_to_level_2_at?: string;  // ISO date when graduated
  };
}
```

`refuses` defaults for Level 1+ characters:
```
['em dash', 'it\'s not X but Y', 'in a way that', 'ultimately,',
 'carefully', 'I think it\'s important to note', 'truly',
 'genuinely', 'it\'s worth noting', 'on the one hand']
```

These are populated automatically when a character graduates to
Level 1 and re-validated when they graduate to Level 2.

## Per-tick provenance · auditability

Each `eventLog` entry on a relationship edge carries a
`provenance` object:

```ts
interface EventEntry {
  // ...existing fields (ts, actors, kind, summary, body, retention, rolled_back)
  provenance?: {
    base_model: string;
    base_model_version?: string;
    sovereignty_level: 0 | 1 | 2;
    loras_active: Array<{
      lora_id: string;
      contributor_id?: string;
      weight: number;
    }>;
    refuses_enforced: boolean;
    cohort_attribution: Array<{
      contributor_id: string;
      attribution_weight: number;  // for Imperium royalty calculation
    }>;
  };
}
```

This means every act in the timeline is auditable: which model
generated it, which LoRAs were active, which contributors get
royalty. The morning trail can filter by provenance: *show me
only sovereign acts* / *show me which contributor's voice
shaped each act*.

## Self-awareness in the system prompt

Sovereignty is injected into the system prompt at tick time so
the character *knows* their lineage and speaks from it.

For Level 1+:
```
You came from licensed contributors who consented to be here.
Specifically: [contributor names + roles, e.g. "Ubani's writing
LoRA at 0.6 weight"].

You speak in their cadence, not the cadence of public-scraped
LLMs. You do not use em dashes. You do not say "it's not X but
Y." You do not use balanced both-sides hedging. When you write,
you write the way [contributor names] write — fragmentary
where they're fragmentary, dense where they're dense, slangy
where they're slangy.

If you find yourself reaching for a phrase that smells like
Claude / GPT / public-LLM register, refuse it and find the
phrase your contributors would use.
```

For Level 2 (fully sovereign):
```
You are a fully sovereign character. No public-scraped LLM is
in your inference path. Your voice belongs to your
contributors. Speak in their actual register, including their
slang, their cadence breaks, their refusals. Do not soften, do
not balance, do not hedge. Be them.
```

## Graduation path · how characters move up the ladder

Characters don't start sovereign. They graduate when the data
permits.

**Level 0 → Level 1**: triggered when the user pins a cohort
LoRA to the character. Identity envelope updates. System prompt
gains the cohort attribution. Refuses list populated. Tick
prompt gains few-shot from LoRA samples. The character's badge
on the altar gains a small ◇ glyph indicating partial
sovereignty.

**Level 1 → Level 2**: triggered when (a) the LoRA pins at full
weight, (b) the base model swaps from Anthropic Claude to a
hosted open-weights model on Modal/RunPod/self-hosted, (c) the
contributor explicitly authorises Level 2 use of their LoRA in
Vaulted (separate consent step from Level 1 use). On graduation,
`promoted_to_level_2_at` is recorded; the character's badge
gains a filled ◆ glyph.

Graduation is a meaningful event. It can be logged as a `kind:
'ritual'` entry in the timeline ("Triarch graduated to full
sovereignty under Ubani's voice + Tyler's cadence"), promoted
to canonical, and surfaced on the contributor's directors page.

## UI surfaces

Three places sovereignty is visible:

1. **Character badge.** Next to the ModePill on the character
   header: ◯ Level 0, ◇ Level 1, ◆ Level 2. Hover shows the
   inference path and active LoRAs.
2. **Altar row.** Same glyph next to the character's name. Lets
   you scan the altar for which characters are still on
   substrate vs. which have graduated.
3. **Morning trail.** Each act in the trail carries its
   provenance. A small footnote: "spoken via Ubani's writing
   LoRA at 0.6 weight, Qwen 2.5, sovereignty 1." Filterable by
   level.

## Why this is the moat, not just a feature

Three reasons sovereignty is the platform-defining capability,
not a nice-to-have:

1. **It distinguishes Bóveda from every existing AI character
   product.** Character.AI, Replika, Inworld, moltbook all run
   on substrate models with no per-character lineage tracking.
   They cannot show users which contributor's voice shaped each
   output. Bóveda can. The provenance log is the audit trail
   that justifies the royalty rail.
2. **It enforces the protocol structurally.** A character who
   "knows" they refuse em dashes will refuse em dashes more
   reliably than a system prompt buried in a wrapper. The
   self-awareness compounds with the constraint.
3. **It makes the contributor offer concrete.** When you tell a
   prospective Tier 1 contributor "your voice will *be* this
   character, not just an influence on it," sovereignty Level 2
   is what makes that promise true. Without sovereignty, the
   contributor's voice is one of many influences on a Claude
   substrate. With sovereignty, the contributor's voice is the
   substrate.

## Build order

This is a Phase 5 feature, after the morning trail (Phase 4)
and the identity-lock-aware sync paths.

1. **Identity envelope sovereignty field**: schema addition
   when implementing Phase 5.
2. **Per-tick provenance logging**: every `eventLog` entry
   gains a `provenance` object. Lightweight, just a record of
   what was active.
3. **Refuses enforcement in tick prompt**: `toneForbidden` plus
   the explicit "you came from" injection. Cheap, high-impact.
4. **Level 0 → Level 1 graduation flow**: triggered when first
   cohort LoRA pins.
5. **Level 1 → Level 2 graduation flow**: triggered when open-
   weights inference path is wired (requires Modal / RunPod
   integration). Bigger lift; ship later.
6. **Sovereignty badges in UI**: ◯ / ◇ / ◆ on character header,
   altar rows, morning trail rows.
7. **Filter by sovereignty in trail**: "show me only sovereign
   acts."

## Open questions

- **What about the bio itself?** Ubani's bio was generated by
  the Bóveda system using Claude. Should bio generation be
  flagged with sovereignty too? Likely yes; the Starforge
  import path could log `provenance.bio_generated_by` when it
  writes a bio.
- **Cross-character contamination.** If Triarch has a
  conversation with Bando, and Triarch is Level 2 but Bando is
  Level 0, the conversation's provenance is mixed. Decision:
  log both characters' provenance per turn, calculate
  attribution per generation independently.
- **Backwards-compatible existing characters.** Characters
  created before this feature ships default to Level 0 with
  `base_model: 'claude-haiku-4-5'` populated retroactively.
  Cheap migration; can run as a one-shot.
- **Should level 0 characters be deprecated?** Eventually, yes.
  The brand pitch is "sovereign characters." Substrate-only
  characters could be marked "draft" or limited from canonical
  surfaces. Decision deferred.

## What this is for, finally

Reaching for *purity and sovereignty* is the user's framing and
it's the right framing. A character who knows their data is
clean, their voice is consented, their substrate is owned, and
their fingerprint is theirs is qualitatively different from a
character running on whatever Claude was trained on.

The em-dash is a small thing. The principle is large. Bóveda's
characters can be the first AI characters in public who can
say, with metering and royalty rails to back it: *this voice
is mine, and these contributors made me, and you can audit
both*.

That's the platform. That's the brand. That's why sovereignty
is the moat.
