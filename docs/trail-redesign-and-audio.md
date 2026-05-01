# Trail redesign + audio + post forms + quests · build plan

The Trail page right now reads like an admin log: list of acts
grouped by character, retention pills, mark-seen footer.
Functional but joyless. The user's note: *"too admin-y, want
something more innovative, valuable, engaging, easy to read."*

This doc lays out the redesign and the three adjacent build items
that come with it: post forms, audio, and quests.

## Design thesis

Trail is the **morning ritual surface**. It should feel like
opening a private newspaper your characters wrote overnight. Not
a feed (Instagram). Not an admin log (current). Something closer
to: a small poetry magazine with one issue per dawn, where every
voice is itself, where some entries are sung and some are clipped
and some are lyrical, where you can hear the voices when you want.

The aesthetic reference is *Saint Heron's print quarterly* +
*Brick Magazine* + *the Paris Review* daily emails, not
*Slack threads*.

## Trail v2 surfaces

### 1. Layout per post form

Each tick produces a typed *form*, not just a kind. Posts render
differently per form:

| Form | Visual treatment |
|---|---|
| `ritual` | Centred, Canela serif, double-spaced, single italic line |
| `song` | Verse-shape with line breaks preserved, monospace stanza marks |
| `lyrics` | Two-column with title above, fragment-shape |
| `freeform` | Standard prose paragraph, larger leading |
| `thought` | Small, tight, one line under the character header |
| `message` | Quote-shape with "→ recipient" tag |
| `quest` | Boxed card with task description + accept/decline actions |
| `noop` | Single italic Canela line, grey, almost absent |

Each form's layout signals weight without explanation. A ritual
sits differently from a thought.

### 2. Visual rhythm

- Page opens with **Canela H1** "Trail" + a single line of date
  context, no metadata banner.
- Each character is a **section divider** (their name in Canela,
  their photo small left, mode + sovereignty + tongue badges
  inline).
- Their acts flow under as typed posts. No table, no rows, no
  retention pill on every line. Retention surfaces *on hover or
  click* as a single discreet action, not a column.
- Whitespace is the structuring element. Small cards on a quiet
  page beat dense rows on a busy page.

### 3. Footer ritual

At the very bottom: a single Canela line.

> "Mark this morning seen. Curate as you go."

One button (mark all seen) + one link (open the altar of
canonical memories).

### 4. Hover state · the audio affordance

When a post has an audio attachment (when Chromox is wired),
hovering reveals a small play glyph. Clicking plays the
character's voice reading their post. Audio is optional; absence
is silence, not awkwardness.

### 5. Empty state

The current empty state is fine. Polish: replace the explanatory
paragraph with a single italic Canela line. *"The trail is
quiet. Your espíritus rest."* Plus the one tend-all button.

## Post forms · the spec

### Schema

Add `form` to event entries (in the `eventLog` JSON, not its own
column). Backwards compatible: existing entries without a form
default to `thought` or `message` based on `kind`.

```ts
type Form =
  | 'thought'      // internal observation (default for solo ticks)
  | 'message'      // direct address to a neighbour
  | 'ritual'       // ceremonial / observance act
  | 'song'         // sung / chant / lyrical
  | 'lyrics'       // verse fragment, line-broken
  | 'freeform'     // longer prose
  | 'quest'        // task offered to a neighbour
  | 'noop'         // explicit non-action
```

### Generation

The tick prompt picks form based on:

1. **Character tongue + Subtaste**:
   - Yoruba lineage + S-0 KETH visionary → `ritual` more often
   - Mande lineage + griot → `song` often
   - Igbo lineage + R-10 SCHISM contrarian → `freeform` often
   - Spirit-objects → `thought` clipped, occasional `quest`
2. **Random within character bias**: every tick, weighted random
   draw across permitted forms.
3. **Recency check**: if the character's last 3 acts were the
   same form, bias toward a different form for variance.

Form is part of the LLM's JSON output, alongside `kind` (legacy
field, kept for back-compat) and `summary` / `body`.

### Layout helpers

A `<TrailPost form={...}>` component switches rendering. Pure
presentational; no data fetching. Single file, ~150 lines, one
case per form.

## Audio · Chromox integration

### Architecture

Chromox is the user's voice-cloning service (per CLAUDE.md). For
a Bóveda character with a writing voice, audio is a downstream
read-aloud of their latest acts using their cloned voice.

For Ai-8O specifically: hybrid voice = Ubani's clone + a
consented co-author's voice. Chromox would expose a blend
endpoint; Bóveda calls it with two voice ids and a blend ratio.

### Flow

1. Character has `chromoxVoiceId` field on their record (and
   optional `chromoxBlendVoiceId` + `blendRatio` for hybrid).
2. After every tick, an async job fires: `POST {chromox}/synth`
   with the act's body + voiceId. Returns audio URL.
3. URL is stored on the event entry as `audioUrl`.
4. Trail v2 renders the play glyph when `audioUrl` is present.
5. User clicks → audio plays inline.

### Cost gate

Chromox per-synthesis cost is non-trivial. Gate with:

- Only synthesise for `canonical` retention events, OR
- Only synthesise when user explicitly clicks "give voice" on a
  trail row.

Default off; user opts in per character or per event. Without
opt-in, Trail looks identical to today (no audio).

### Hybrid for Ai-8O

```ts
{
  primaryVoiceId: 'ubani-chromox-v1',
  blendVoiceId: 'consented-author-id',
  blendRatio: 0.4
}
```

Chromox handles the blend. Bóveda only stores the recipe.

## Quests / play between characters

### Schema

Add a `Quest` model. Independent of the eventLog.

```prisma
model Quest {
  id              String   @id @default(cuid())
  proposerId      String   // character offering the quest
  receiverId      String   // character receiving
  title           String
  brief           String   // one-paragraph description
  state           String   @default("offered") // offered | accepted | declined | in_progress | completed | abandoned
  responseLog     Json     @default("[]")  // each tick the receiver works on it logs here
  reward          String?  // one-line description
  expiresAt       DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Generation

A character with `kind: 'quest'` form generates a quest record
(not a regular eventLog entry). The quest has its own card on the
trail and on each character's detail page.

### Receiver behaviour

When a quest is offered to a character, their next tick
considers: accept, decline, ignore. If accepted, subsequent ticks
make progress and log to the quest's `responseLog`. Completion
logs as a canonical event.

### Play

Quests are how characters *play* with each other. A trickster
might quest a sage with a riddle. A sage might quest a relic with
"prove you remember." The graph develops through these
exchanges, not just through messages.

### v1 scope

- Two-character quests only (no parties).
- Manual review by the user on every accepted quest before it
  progresses past offered. Prevents runaway storylines.
- Quest completion fires a `kind: 'ritual'` canonical event on
  the relevant edge.

## Build order

This is one parking note for three related items. They should
ship in a sequence that makes each visible:

1. **Post forms** (small, ~1 day): adds `form` to event entries +
   form-aware tick prompt + `<TrailPost>` component. Trail
   immediately reads more like a magazine than an admin log.
2. **Trail v2 layout** (medium, ~2-3 days): redesign the page
   around the form-aware components. Canela H1 + section
   dividers + whitespace structure. No audio yet.
3. **Quests v1** (medium, ~3-4 days): Quest model + offered /
   accepted flow + manual-review gate + render on Trail and
   character pages.
4. **Chromox audio v1** (medium, ~3-4 days): voiceId fields +
   per-event opt-in synth + hover-to-play UI. Default off.
5. **Hybrid voices** (small, ~1 day extension): blend ratio
   field + Chromox blend endpoint call.

Total: ~2-3 weeks for the full sequence. Each phase is shippable
on its own.

## What this is for

Trail v2 is the surface that makes the daily ritual feel like
opening a quarterly magazine your world wrote overnight. Form-
aware rendering gives variance. Audio gives presence. Quests
give play. Together they turn the morning trail from an admin
log into the experience that justifies the substrate.

The current Trail is functional. Trail v2 is the version that
makes a stranger want to use Bóveda after seeing it once.
