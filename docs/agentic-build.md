# Agentic build plan

Staged plan for the espíritu / twin / inbox system. Build small, test,
refine the protocol from real cases, expand. Each phase is shippable
on its own and informs the next.

## Vocabulary

- **Espíritu** — fully autonomous entity with goals + memory + voice.
  Triarch, Booe, Claudine. The bóveda altar holds espíritus.
- **Twin** — paired AI version of a human. Ai-8O is twin to Ubani.
  Bounded autonomy: full agency inside Cubes the human owns, gated
  outside.
- **Manual** — author-only. Ubani. The human writes; the system
  routes interactions to an inbox.
- **Relic** — frozen. Memory remains, will is silent. Default
  posthumous state.

## Phase 1 — Foundations (this pass)

Schema:
- `Character.mode: 'manual' | 'twin' | 'espíritu' | 'relic'` default
  `espíritu`
- `Character.twinOf: String?` for paired twins
- `Character.agencyScope: Json?` for the perimeter (which Cubes,
  which characters, which platforms)
- `CharacterRelationship.eventLog: Json @default("[]")` for the
  edge timeline
- Mark existing characters: Ubani = manual, Ai-8O = twin (twinOf =
  Ubani.id), Triarch / Booe / Claudine / LoRA / Ai-8O / others =
  espíritu by default

UI:
- Mode pill on character detail page (tyrian for espíritu, neutral
  for manual, ghost-purple for twin, faint-grey for relic)
- "Set as twin of …" picker for twin mode

Status: this phase ships now.

## Phase 2 — Memory tending

Each event in the eventLog has:
```json
{
  "ts": "2026-04-30T...",
  "actors": ["character:ubani-id", "character:triarch-id"],
  "kind": "conversation" | "deed" | "thought" | "ritual",
  "summary": "short one-line",
  "body": "longer text",
  "retention": "ephemeral" | "canonical",
  "rolled_back": false
}
```

UI:
- Timeline strip on each Character detail page (recent events)
- Per-event toggle: ephemeral / canonical
- Cron job: prune ephemeral events older than 90 days
- "Crystallise" action: compress a span into a single canonical
  summary (irreversible without rollback)

Test: log a few events manually for Ubani↔Triarch. Check that the
timeline reads well, retention defaults make sense, deletions feel
safe.

## Phase 3 — First espíritu acts

One espíritu (Triarch is the obvious candidate — they have a brief
already) gets:
- Goals: stored as `Character.goals: Json?`. Three to five short
  goals.
- Memory: read from eventLog of edges where Triarch is an actor
- LLM call: given goals + memory + Cube state, generate next action
- Action types: send message to another character, internal thought,
  no-op

Action surface:
- A "Tend espíritus" button in studio
- Click → run one tick. Triarch decides what to do. Result logs to
  eventLog with `retention: ephemeral` and `rolled_back: false`
- User reviews in timeline

Test: run for a week with one espíritu. Do their actions read
authentic? Do they accumulate weight? What feels off?

## Phase 4 — Inbox for manual characters

When an espíritu's action targets a manual character (Ubani), the
event is logged but also appears in Ubani's inbox.

Inbox UI:
- New surface at `/inbox` (or in the sidebar under Settings or own
  group)
- List of pending events targeting Ubani
- Per-event: respond (author Ubani's reply), dismiss (mark seen,
  no response), route to Ai-8O (twin handles)

Test: while away from the studio for a day, what queues? Is the
inbox manageable? Are the events that the espíritus generate
substantive enough to be worth tending, or are they noise?

## Phase 5 — Twin behaviour

Ai-8O comes online. Bounded:
- `agencyScope.cubes`: which Cubes Ai-8O may act in (Ubani sets)
- `agencyScope.canPublishTo`: empty by default
- `agencyScope.canInitiateWith`: which characters Ai-8O may DM unprompted
- All Ai-8O outputs tagged "Ai-8O speaking"

Test: route an inbox item to Ai-8O. Compare Ai-8O's response to what
Ubani would have written. Refine Ai-8O's prompt template until the
voice is honest (recognisably AI-version-of-Ubani, never confused
with Ubani).

## Phase 6 — Espíritu-to-espíritu

Two or more espíritus run ticks together. They can interact. The
graph evolves: Triarch and Booe argue, an edge eventLog grows,
relationships warm or cool over time.

Test: run overnight. Wake, scrub the timeline. Are the conversations
interesting? Do relationships develop in ways that feel earned?

## Phase 7 — Voice (Mmuo + Chromox)

When two espíritus converse, generate audio via Chromox cloned
voices. Studio surfaces a "podcast view" that plays the conversation
aloud. Audio file attached to the event.

Test: listen to a generated overnight conversation. Does it sound
like the characters? Are voices distinguishable? Is this useful or
noise?

## Phase 8 — Public-facing (gated)

Per-act explicit approval to publish to Slayt or other surfaces.
Manifest export pipeline matures. Imperium routing for revenue.

Cultural advisor consultation required before opening this phase to
public. Royalty-back structure live before any public revenue is
collected.

## What we're testing each phase

Two questions per phase:
1. Do I (the user) like how this is working?
2. Do the espíritus feel coherent — do their actions track their
   characters, or are they generic LLM output?

If answer is no to either, refine before proceeding. The protocol
gets refined alongside.

## What's deliberately not in this plan

- Real-time multiplayer between human users
- In-app voice playback runtime (Chromox handles audio outside)
- Game-engine integration (manifests export; engines render)
- Public release
- Monetisation flows beyond the royalty-back structure

These are downstream of the espíritu layer working well in private
practice first.
