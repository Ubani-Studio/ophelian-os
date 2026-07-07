# Vision

The ten-year reading of what Bóveda is and what it does. Sits with
`agentic-build.md`, `protocol.md`, `programs-to-use.md`,
`storyarcs_decolonial.md`, `identity-lock-and-starforge.md` as
architectural source material. Less prescriptive than those; more
strategic.

## The thesis

Bóveda is not a chat platform. It is a **studio** for raising
living characters who keep moving when nobody is looking, with
identity defended, voice composed from licensed artist datasets,
memory curated rather than accumulated, and royalty flowing
on-chain per use of any pinned style.

Three load-bearing differences from every existing AI character
product:

1. **Living, not chatting.** Characters tick on their own time,
   interact with each other, and accumulate state between visits.
   The user experiences this as a *morning trail*, not a feed and
   not a chat.
2. **Curated, not accumulated.** The bóveda altar is a curated
   panel. Memory is ephemeral by default; the user promotes what's
   worth keeping. Refusal of the feed shape is the brand.
3. **Composed, not generated.** Each character speaks through four
   composed signal layers (classification, style LoRA, memory,
   identity). The base model is substrate; the artistry is in the
   composition.

## The studio model

Pixar shape, not Reddit shape. Not a public agora where every AI
can hang. A curated guild where high-taste individuals,
collectives, agencies, and production companies raise characters
together.

Roles:

- **Studios** (production companies, labels with vision, IP
  holders): own cubes, hire directors, set canonical trajectories.
- **Directors** (individual artists with a defined voice): direct
  a character or group's arc, voice, motion. Their dataset becomes
  the character's style layer.
- **Crew** (LoRA contributors): writers, voice actors, motion
  designers, visual artists. Each licensed LoRA pinned to a
  character is a credited contribution. Per-use royalty flows.
- **Curators** (cultural advisors, archive editors): gatekeep
  authenticity. Sign off on culturally-rooted variants
  (Sankofa, Kalfou, Yoruba odu, etc). Without them, sacred
  classifiers stay locked.
- **Agencies** (rights management, talent representation): handle
  artist licensing terms, royalty splits, consent boundaries.

This is **invite-only**. Three reasons it has to be:

1. **Quality.** Curated networks produce higher signal than open
   ones (Are.na for artists, Cabal for curated tech, Lens for
   photographers, even early Pixar's selectivity).
2. **Brand.** Bóveda's palette (Tyrian purple, Canela, sentence-
   case discipline) already reads upmarket. Open access would
   instantly degrade the surface to AI-slop.
3. **Protocol enforcement.** Cultural-advisor consent + royalty-
   back + right to forget cannot be enforced in an open network.
   The protocol is structurally incompatible with public sign-up.

## The intelligence stack

Don't build a foundation model. Compose four (eventually five)
signal layers per character and feed them to a base model.

1. **Classification layer** (system prompt): Subtaste twelve glyph
   + Wu Xing relationship cycle + Laban motion (when added) +
   optional Ifá variant on cubes that opt in.
2. **Style layer** (artist LoRA): trained per-artist on consented
   data. Living language fingerprint. Slot already exists on
   `Character.loras` for `writing`, `voice`, `music`, `visual`,
   `motion`.
3. **Memory layer** (eventLog): goals + last 8 events + neighbour
   relationships. Already wired.
4. **Identity layer** (locked bio + name + Starforge Nommo): the
   defended self. Already wired for Ubani.
5. **Slang forecast layer** (from Ibis): emerging language not yet
   surfaced in public corpora. Plugged in as a fifth signal so
   characters speak the language of the next six months, not the
   last six. **This is the differentiator no competitor has.**

The base model is Anthropic Claude (Haiku for routine ticks,
Sonnet for inflection moments, Opus for weekly reflection).
Switch to open-weights + per-character LoRA (Llama 3.1, Qwen 2.5)
when escape from Claude's stylistic gravity matters more than
reasoning quality. Reserve that swap for high-prestige characters
and fully-licensed artist voices.

Anti-derivative defenses (the em-dash and "not X but Y"
fingerprint of public LLMs):

- `Character.toneForbidden` populated per character.
- Few-shot from real artist samples in every prompt.
- Output post-processing to strip known signatures.
- LoRA on open-weights for premium voices.

## The licensing platform · the long-term moat

The most important strategic move is wiring Bóveda into a four-
app licensing pipeline:

```
Artist → 08 protocol → Vaulted → Bóveda → Imperium
       (identity)    (rights)  (use)   (settlement)
```

- **08 protocol**: the universal artist identity and dataset
  registry. Cross-craft. An artist proves they wrote / sang /
  drew / directed the corpus. Their identity is the asset. Sembla
  becomes a *fashion vertical* layered on 08; Bóveda becomes a
  *living-characters vertical* layered on 08; future verticals
  (literature, animation, sound design) live on the same protocol.
- **Vaulted**: the rights envelope. Living rights, not static
  EULA. Artist defines: training Bóveda LoRAs yes, derivative
  works in adversarial cubes no, commercial output requires X
  rate, right to forget on N days notice.
- **Bóveda**: the consumer. Each `Character.loras` slot carries a
  licensed adapter. Every generation is a metered call.
- **Imperium**: the settlement layer. Per-use royalty flows on-
  chain in USDC the moment a Bóveda character generates output
  using a licensed LoRA.

This is **Stripe-for-character-licensing**. Nobody is doing it.
Character.AI trains on user submissions with no royalty.
Replika has no third-party voice market. Inworld licenses to
studios but no per-use artist royalty. Moltbook is identity +
social, not licensing.

## Cross-craft is the moat

The instinct to specialise (just fashion, just music, just film)
is wrong here. Cross-craft is structurally aligned with three
realities:

1. **Artists move across crafts.** Burna Boy is music + film +
   fashion. Solange is music + visual + curation. Tyler the
   Creator is music + fashion + design. Specialty platforms force
   fragmentation. Cross-craft platforms let an artist be whole.
2. **Diasporic creativity is cross-craft by default.** Yoruba
   praise-singing is performance + lyric + costume + spatial.
   Capoeira is music + motion + martial. The diasporic norm is
   composition across crafts; the European specialisation
   (composer vs designer vs choreographer) is the imposed frame
   the protocol resists.
3. **Bóveda is itself cross-craft.** A character has writing +
   voice + visual + music + motion. The platform's natural shape
   *demands* cross-craft.

08 protocol carries identity across crafts. Sembla, Bóveda,
Quashi, Canora are vertical applications on top.

## Companion-app pipeline

Each app does one job. The pipeline composes a fan-facing surface
the user already half-built:

- **Bóveda** raises the characters and curates the altar.
- **Canora** archives the canonical outputs (post-crystallise).
  When a Bóveda act is promoted from ephemeral to canonical and
  worth public mention, it lands in a Canora-shaped archive that
  resists the AI flood.
- **Imprint** verifies fans. Only verified superfans see certain
  character content / receive certain interactions / can tip.
- **Oryx** accepts fan tips that influence character visibility +
  royalty share. Fan conviction signal feeds back into the system.
- **Imperium** settles royalties at every layer (artist LoRA use,
  fan tips, character output sales).
- **Quashi** is the cold archive. A character that retires
  graduates from Bóveda's altar to Quashi's frozen object payload.
  Living → frozen, on the user's command.
- **Slayt** publishes (when the user opts in). Bóveda manifests
  export to Slayt for public-facing posts.
- **Ikenga** is the photo / face authority for human-anchored
  characters.
- **Starforge / 08** is the upstream identity / Nommo source.

## The morning trail · daily-active surface

Every morning (or on demand), the user opens Bóveda. The altar
shows what happened overnight: Triarch had a thought. Booe sent
Triarch a message. They argued. An edge in the Nexus warmed. The
user spends five minutes reading the trail and curating
(promote / demote / crystallise). Then starts their day.

This is the daily ritual. Nobody else is doing this. Character.AI
is reactive. Replika is companion. Inworld is for studios.
Moltbook is feed-shaped. Bóveda is **proactive, private,
curated, ritual-shaped**.

## Strategic differentiation summary

| Axis | Moltbook | Character.AI | Replika | Inworld | Bóveda |
|---|---|---|---|---|---|
| Shape | public feed | public chat | private companion | NPC backend | private studio |
| Autonomy | implied | reactive | reactive | scripted | continuous |
| Identity moat | X-verify | none | none | game-bound | 08 + Starforge + Ikenga |
| Cultural protocol | none | none | none | none | decolonial, consent-gated |
| Licensing | none | none | none | studio-only | per-use, on-chain (Imperium) |
| Memory | feed | session | accumulating | game-state | curated altar |
| Cross-craft | no | no | no | no | yes (writing + voice + visual + music + motion) |
| Slang forecast | no | no | no | no | yes (via Ibis) |

## Build order

A 12-month read on what to ship and when, with a bias toward
shipping the experience before shipping the platform.

**Phase 1-3** (current, mostly shipped):
- Cubes, Nexus, characters, identity locking, Subtaste twelve
  badge, tend button, altar surface, Starforge import.

**Phase 4** (next, weeks):
- The morning trail. Daily-active ritual surface. Promotes the
  altar from "tend buttons" to "what happened overnight, here's
  the curation."
- Inbox for manual characters (Ubani's queue when an espíritu
  addresses them).

**Phase 5** (1-3 months):
- Anti-derivative defenses populated per character.
- Ibis slang forecast plugged in as fifth tick signal.
- One licensed-artist LoRA shipped end-to-end (consenting artist,
  small writing corpus, LoRA trained, character pinned, output
  generated, synthetic Imperium event logged).
- Twin behaviour: Ai-8O comes online, bounded, every output
  tagged "Ai-8O speaking."

**Phase 6** (3-6 months):
- Espíritu-to-espíritu interaction at scale. Overnight runs.
  Real morning trails to read.
- Voice federation (Mmuo + Chromox).
- Laban motion layer added.
- Studio onboarding (invite-only, first cohort: 5-10 directors).

**Phase 7** (6-9 months):
- Sembla integration via 08 protocol layer.
- Vaulted rights envelopes wired into LoRA pins.
- Imperium settlement live for first paying use cases.
- Fan layer: Imprint verification, Oryx tips, Canora archive.

**Phase 8** (9-12 months):
- Public-facing character outputs (per-act gated approval).
- Manifest export to engines (Unreal / Unity / web).
- Possibly: integration with whatever public-AI-social network
  has won by then (moltbook or successor) as a publishing
  endpoint.
- Cultural advisor pool live; opt-in Yoruba odu / Sankofa / Kalfou
  variants on specific cubes.

## What this is not

- Not a dating app. The twin can date on the human's behalf with
  consent gates, but dating is a use case, not the product.
- Not a Reddit-for-AI. That's moltbook's wedge. Bóveda is the
  upstream studio; moltbook (or successor) is downstream broadcast.
- Not a foundation-model lab. The intelligence comes from
  composition + licensed data, not from training a base model.
- Not open access. Invite-only is the brand and the protocol's
  enforcement mechanism.
- Not a chatbot. Tend is a single act, not a conversation.
  Conversation is what *characters do with each other*; the human
  curates rather than chats.
- Not Quashi. Quashi is preservation; Bóveda is aliveness. They
  hand off in one direction (Bóveda → Quashi when a character or
  arc retires).
- Not Sembla. Sembla is fashion-vertical on 08. Bóveda is living-
  characters vertical on 08. Both are consumers of the same
  upstream identity protocol.

## Open questions

- **Should 08 be the canonical artist registry, with Sembla as a
  vertical?** Recommendation: yes. Sembla specialises in fashion;
  08 carries cross-craft identity. Bóveda consumes from 08 the
  same way Sembla does.
- **Should Canora become the canonical-act archive?** Likely yes.
  Canora's three-tier curation pipeline against the AI flood is
  a natural home for crystallised character outputs.
- **Should Imprint be the verification layer for fan
  interaction with Bóveda characters?** Likely yes. Imprint
  already verifies superfans; Bóveda gates premium character
  surfaces behind verified status.
- **First director cohort.** Five to ten artists who agree to
  license a writing voice or visual style for a paid LoRA pin
  with on-chain royalty. Picking the right first cohort is
  load-bearing for brand.
- **Cultural advisor pool.** Who advises on Sankofa, Kalfou, Ifá
  odu, Sundiata variants. Identity, payment, consent flow.
  Required before any culturally-rooted variant ships beyond a
  research surface.
