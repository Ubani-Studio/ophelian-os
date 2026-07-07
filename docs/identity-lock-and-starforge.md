# Identity lock-in + Starforge Nommo import · parking note

Two related pieces of work, parked together because they share the
same architecture: distinguishing *intentional* characters (locked,
identity-defended, real-person backed) from *sandbox* characters
(generated, mutable, ready to be re-rolled).

The current generator-driven flow is great for new sandbox cubes
and for storymaking. It's bad for locking in an existing character
like Ubani (who is a real person) or Triarch (who has authored
identity). They keep getting random Oripheon orisha bios pasted
over them on sync. We need an opt-in lock surface.

## Problem statement

Today every character is treated as re-rollable. `sync-oripheon-all`
overwrites bio + classification when run. Bulk-import from Ikenga
swaps in `appearance_notes` when it looks like a stub. Random bio
generation produces "Nnamdi Anyanwu is a Igbo fae thorn prince"
and pastes it onto a character whose actual name is Triarch.

Result: characters with intentional identity get muddled by repeat
generation passes. The character system can't tell the difference
between "this is a sketch" and "this is the canonical Ubani."

## Architectural proposal

### A. Lock fields on Character

Add to schema:

```prisma
model Character {
  // ...existing fields
  identity Json @default("{}")
}
```

Shape:

```ts
interface CharacterIdentity {
  /**
   * List of field names that must not be overwritten by automated
   * processes (sync-oripheon-all, bulk-import-ikenga, generator
   * re-rolls). Manual edits via PATCH /characters/:id always
   * win because the user is the one acting.
   */
  locked: Array<
    | 'name'
    | 'bio'
    | 'systemPrompt'
    | 'avatarUrl'
    | 'heritage'
    | 'order'
    | 'tarot'
    | 'subtasteCode'
    | 'goals'
  >;
  /**
   * Pinned generator parameters. When the character is re-rolled
   * (only allowed for unlocked fields), these constrain the rerole.
   * Lets you say "this character is Yoruba, fae order, the Magician
   * tarot — generate everything else."
   */
  pinned: {
    heritage?: string;       // 'yoruba' | 'igbo' | ...
    order?: string;          // 'fae' | 'human' | ...
    tarot?: string;          // 'magician' | ...
    subtasteCode?: string;   // 'S-0' | 'T-1' | ...
    coreStyle?: string;      // 'drowned_mall' | ...
    nameMode?: string;       // 'standard' | 'mononym-squishe' | ...
  };
  /**
   * Provenance: where this identity came from. Affects how
   * automated systems treat the character.
   */
  source: 'sandbox' | 'starforge_nommo' | 'tizita_persona' | 'authored';
  /**
   * For real-person backed characters (Ubani <- bomac1193@gmail.com).
   * Used to gate Starforge re-syncs and consent.
   */
  realIdentityRef?: {
    starforgeUserId?: string;
    email?: string;
  };
}
```

### B. Generator UI for intentional identity

Reuse the existing `NewCharacterModal` UI but add:

1. A "lock" toggle next to each generator parameter (heritage,
   order, tarot, subtaste, name mode, core style). Locked params
   land in `identity.pinned` and `identity.locked`.
2. A "lock this character" toggle at the bottom that sets
   `identity.source = 'authored'` and adds all editable fields to
   `identity.locked`.
3. After generation, on the character detail page, show a small
   lock indicator next to each locked field with an unlock action.

For the existing-character flow (Ubani, Triarch), add a
"Configure identity" panel on `/characters/[id]` that opens the
same picker, lets you set pins, and lets you toggle locks
field-by-field.

### C. Sync paths must respect locks

Every automated write to `Character` checks `identity.locked`
before overwriting:

- `POST /characters/sync-oripheon-all` — skips locked fields per
  character.
- `POST /characters/bulk-import-ikenga` — only updates
  `appearance_notes` → bio if `bio` not in locked. Always updates
  `tizitaPersonaId` (binding is metadata, not identity).
- `POST /characters/reconcile-bio-names` — already idempotent and
  only swaps the leading subject, so safe; should still skip when
  `bio` is locked to be conservative.
- `POST /characters/:id/sync-oripheon` — refuses with 409 if any
  identity-shaping field is locked, unless `?force=true`.

## Starforge Nommo import for Ubani

Starforge calls the user "Nommo." Their genome is cached in
`backend/services/subtasteGenomeCache.js` and reachable via
the existing Subtaste integration routes.

### Endpoints already available

- `GET /api/twin/context/{user_id}` (per CLAUDE.md): returns
  `audio_dna`, `visual_dna`, `cross_modal_coherence`, `archetype`
  (Subtaste designation), `brand_keywords`.
- Starforge `subtasteGenomeCache` exposes the cached genome with
  `primary.designation` (Subtaste twelve glyph), `primary.glyph`,
  `signal_count`.

### Import flow

1. Add a new endpoint to Bóveda:
   `POST /characters/import-from-starforge`
   Body: `{ characterId: string, starforgeUserId: string }`.
2. Bóveda fetches the Twin OS context for that user via
   `STARFORGE_API_URL/api/twin/context/{user_id}`.
3. Maps the response onto Character fields:
   - `archetype` (Subtaste designation) → `timelineState.oripheon.generated.subtaste.code`
   - `brand_keywords` → `personaTags`
   - `audio_dna.influence_genealogy.primary_genre` → an alias
   - `visual_dna.color_palette` → `timelineState.starforge.palette`
   - `visual_dna.warmth` + `audio_dna.taste_coherence` → tone hints
4. Generates a Starforge-aware bio. Bio template:
   > "{name} works at the intersection of {primary_genre} and
   > {visual_themes}. Their taste cohereres around
   > {brand_keywords[0..2]}. The {archetype.designation} archetype
   > shapes how they {archetype.description_short}."
   Then sets `identity.source = 'starforge_nommo'` and locks
   `name`, `bio`, `subtasteCode`, `personaTags`. The character is
   now defended.
5. Stores `identity.realIdentityRef = { starforgeUserId, email }`.

### One-shot for Ubani

Easiest first run:

```bash
curl -X POST $BOVEDA_API/characters/import-from-starforge \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"characterId": "<ubani-id>", "starforgeUserId": "default"}'
```

Locked fields persist; subsequent generator passes leave Ubani
alone.

## Build order when unparking

1. Schema: add `Character.identity` JSON field, default `{}`.
   `prisma db push`.
2. API: helper `isFieldLocked(character, field)` and apply across
   all sync routes.
3. Studio: lock indicators on character detail page next to
   editable fields. Lock-aware "Configure identity" panel.
4. Generator UI: pin + lock toggles in `NewCharacterModal`.
5. Starforge endpoint: `POST /characters/import-from-starforge`.
   Test against Ubani first.
6. Migrate: backfill `identity.source = 'sandbox'` for existing
   characters; `'tizita_persona'` for those with `tizitaPersonaId`.

## Why parked, not shipped now

The shape of `Character.identity` is the right design but it
touches every sync path in the API. That's a real refactor, not a
patch. Worth doing once, deliberately, after Phase 4 (inbox)
settles. The reconcile + Subtaste badge fixes already shipped
buy us breathing room — Triarch's bio reads correctly, the
classification surfaces as a glyph badge, and `sync-oripheon-all`
is something the user can simply not run on locked characters
until lock-aware sync lands.

## Open questions

- **Lock granularity.** Field-level (current proposal) vs whole-
  character lock vs three tiers (open / pinned / authored). Field-
  level is most flexible; whole-character is simpler. Decision
  deferred.
- **Should `goals` be lockable?** They are espíritu intent, not
  identity. Probably not. Argue both ways.
- **Real-identity consent chain.** Importing Starforge data for
  Ubani is fine because Ubani is the user. For other people
  (collaborators), the consent chain (already in Bóveda's
  ConsentRecord table) must produce a token before Starforge data
  can be imported. Wire when needed.
- **Name lock vs name editing.** A locked name should still be
  editable by the user manually (PATCH wins) but not by automated
  rerolls. Make sure the lock check only fires on automated paths.
