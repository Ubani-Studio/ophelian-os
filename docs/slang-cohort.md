# Slang cohort · restorative infrastructure for Black creators

The plan for Bóveda's language layer. A consented, paid cohort of
high-taste contributors whose datasets feed the slang forecast and
character voice. Built specifically to invert the century-long
pattern of Black cultural language being extracted at zero cost
and monetised by everyone except the people who created it.

This is the labour-rights move dressed as a dataset move. It is
also the moat. No competitor can match it without rebuilding the
protocol stack Bóveda already has (08, Vaulted, Imperium,
Sembla, Imprint, Oryx).

Sits with `vision.md`, `protocol.md`, `identity-lock-and-starforge.md`.

## The thesis

Black culture is the source of most modern slang innovation in
English (and globally now: Afrobeats slang, UK drill, US trap,
queer Black AAVE, ballroom, hip-hop, jazz before that, blues
before that). This is empirically defensible across a century.

Throughout that century the language has been extracted at zero
cost: a phrase originates in a specific Black scene, travels to
mass platforms, gets monetised by brands / TV / film / advertising
/ corporate copy, and the originators are paid nothing. Not even
credited.

Bóveda's protocol was engineered to refuse this pattern.
Building the slang cohort is the operational arm of that refusal:

1. **Consent**: contributors opt in. No scraping.
2. **Provenance**: every pattern is traceable to its contributor
   via 08 / Sembla identity.
3. **Royalty**: when a pattern shaped by a contributor's dataset
   surfaces in a Bóveda character's output, on-chain Imperium
   royalty fires automatically.
4. **Right to forget**: contributors can revoke at any time per
   Vaulted's living rights envelope.
5. **Cultural advisor signoff**: when patterns are rooted in
   sacred / community-specific context (Yoruba, Akan, Mande,
   ballroom, drill subculture), advisors gate the use.

## Why now, and why nobody else can do this

Three openings:

1. **AI training data is in legal flux.** The NYT v OpenAI suit,
   the Authors Guild suits, the music label suits. Public
   scraping is being relitigated. Consented + paid datasets are
   the future regardless. Bóveda gets there first by design.
2. **Crypto settlement rails work now.** Imperium can fire
   per-use royalties on Polygon for cents. Five years ago this
   was theoretical; today it ships.
3. **Trust collapse in Big AI.** OpenAI / Anthropic / Meta are
   now seen as extractive. A platform that pays its sources
   credibly will dominate the next cycle of high-taste creator
   adoption. Bóveda is positioned to be that platform.

Why competitors can't follow:

- **Character.AI**, **Replika**, **Inworld**: have no royalty
  rails, no identity provenance layer, no cultural advisor pool.
  Bolting these on is a multi-year refactor.
- **Moltbook**: feed-shaped, X-verified, no licensing.
- **Big foundation labs (Anthropic, OpenAI)**: structurally
  opposed to consent + royalty since their entire training
  corpus is unlicensed scrape. They will not retroactively pay.
- **Spotify / Genius / Apple Music**: have rights infrastructure
  but no AI training market and no character layer.

Bóveda's stack (08 → Sembla → Vaulted → Bóveda → Oryx → Imprint
→ Imperium) is the only one already pointed at this problem.

## The economics, in plain language

A contributor opts in. Their dataset (some combination of voice
notes, unpublished lyrics, group chat exports they've cleared,
texts, draft posts, finished work) is trained into a private
LoRA. The LoRA is pinned to specific Bóveda characters.

Every time a Bóveda character generates output using that LoRA:

- The output is logged with provenance: "this character used
  contributor X's writing LoRA at weight 0.6".
- An Imperium event fires: a fractional royalty (in USDC)
  flows to the contributor's wallet.
- If the output goes downstream (gets posted on Slayt,
  republished on moltbook, used in a manifest exported to a
  game engine, quoted by a fan on Imprint), each downstream
  surface logs another use. Royalty compounds.

For very large-scale cultural patterns (a phrase that goes mass-
viral after originating in the cohort), royalty splits between
the originating contributor, the cohort co-op pool (so other
contributors who shaped the broader voice ecology benefit), and
a cultural-advisor-distributed "common ground" pool that funds
community advisors and emerging contributors.

This is the first time **language as a labour input** can be
priced and paid per use, at internet scale, by a non-corporate
intermediary. Not a metaphor. Real money flowing for real
language work.

## The "no-brainer offer" for contributors

Contributors get:

1. **Continuous Imperium royalty.** Per use, on-chain, USDC. No
   minimum threshold, no quarterly waiting, no opaque accounting.
2. **Public credit.** The Bóveda directors page lists them with
   their cohort role. Every character that pins their LoRA shows
   the credit. The opposite of being scraped without attribution.
3. **Right to forget.** Revoke any time. Their LoRA is unpinned
   from active characters. Past royalty is theirs to keep;
   future use stops.
4. **Cultural-advisor seat.** Top contributors gain advisor
   roles, gating use of culturally-rooted variants on cubes.
   They become structural to the protocol, not just inputs.
5. **Co-op pool share.** When mass-viral patterns originate from
   the cohort (the next "67", the next "based", the next
   "delulu"), a fraction of the cohort pool flows to all
   contributors who shaped the voice ecology. Solidarity, not
   competition.
6. **Premium voice integration.** Their LoRA is the *only* way
   their voice is reproducible inside Bóveda. Studios that want
   their voice for a character must pay through the system.
7. **Vaulted-defined limits.** They control: which cubes can use
   their LoRA, which contexts (commercial / non-commercial /
   research), which character types (espíritu / twin / manual),
   which weights (full pin / influence only / forbidden).

This is the offer no Big AI lab can match. Anthropic / OpenAI /
Meta will never retroactively pay scraped sources. Bóveda pays
forward, on consent, in public.

## Cohort structure

Three tiers:

**Tier 1: Founding directors (5-10 contributors)**

The first cohort. They define the brand. Pixar parallel: Pete
Docter / Brad Bird shape what Pixar means. Each gets:

- A named LoRA (e.g. `tyler_voice_v1`, `solange_voice_v1`).
- A reserved character slot (their LoRA pins to a specific
  Bóveda character that becomes their public-facing avatar in
  the system).
- Equity-shaped royalty (higher base rate than later tiers as
  reward for early bet).
- Cultural-advisor seat by default.

**Tier 2: Crew (50-200 contributors)**

The working cohort. Active language-makers across the diaspora.
Each gets:

- A LoRA trained on their consented dataset.
- Per-use royalty at standard rate.
- Eligibility for cultural-advisor seat by promotion.

**Tier 3: Community (open application after invite-bootstrap)**

Verified Imprint superfans + Oryx tip-active creators can apply
to contribute. Smaller corpora, smaller royalty, but the volume
makes the long tail work. Curated: not everyone gets in.

## What to look for in friends and first picks

When evaluating who to invite, seven qualities:

1. **Their language travels.** Their phrases, cadence, jokes,
   constructions get repeated by others. Friends quote them.
   You hear their fingerprint in other people's posts six
   months later.
2. **They invent more than they imitate.** Original speakers,
   not aggregators. The difference between a meme account and
   the person whose joke became the meme.
3. **They work cross-craft.** Music + writing, fashion + lyric,
   directing + designing. Cross-craft people have more language
   surfaces, more durable signature.
4. **They have a definable voice.** You can describe what makes
   them them in one sentence. If you struggle, their LoRA will
   be muddy.
5. **They've thought about credit and extraction.** They've
   talked about being ripped off, brands biting their style,
   Twitter scraping. They get the protocol immediately.
6. **They're diasporic-rooted, not generic-cool.** Specific
   cultural soil. Lagos, Brooklyn, South London, Atlanta,
   Joburg, Houston, Detroit, Accra. Not "internet-native" with
   no place.
7. **They trust your taste.** They wouldn't sign on to a generic
   AI platform. They'd sign on if you specifically asked because
   they trust your judgment about who else is in the room.

Don't invite:

- People who are already too set (won't show up; won't share
  fresh material).
- People who are too green (no archive worth training on yet).
- People whose voice is closely modeled on someone else's (the
  LoRA will be a copy of a copy).
- People who don't get the protocol or who'd publicly sign and
  privately not show up.

## Examples of the kind of contributor (public figures, archetypes)

These are not endorsements or commitments. They are public
figures who exemplify the *shape* of a strong Tier 1 contributor.
Use them as the calibration set when evaluating friends and
candidates from your network.

**Cross-craft, language-leading**

- **Tyler the Creator**: music + fashion + design + visual. His
  vocabulary travels (the way he says "alright" alone). Already
  thinks about IP control.
- **Solange Knowles**: music + visual + curation. Has Saint
  Heron infrastructure that already operates in adjacent rights-
  aware territory.
- **Kelela**: experimental R&B, vocabulary that travels in queer
  Black music spaces, diasporic rooted.

**Lyrical innovators**

- **Earl Sweatshirt**: dense, original vocabulary. Already runs
  small/curated systems.
- **Smino**: St. Louis dialect that became national. Slang-
  originator profile.
- **Doechii**: rapidly inventing patterns, willing to engage
  smaller systems.

**Diasporic / continental**

- **Burna Boy**: Lagos to global. Yoruba-rooted English that
  travels. Commercial scale.
- **Tems**: vocal innovation, Lagos to global.
- **Asake**: Yoruba slang travels via Afrobeats. Pattern source.
- **Sho Madjozi**: South African multilingual, language-maker.

**UK Black culture (drill / Afro / grime origins of "67"-shaped
patterns)**

- **Skepta**: established, mentorship credibility, vocabulary
  travels.
- **Pa Salieu**: UK Afro-trap, language travels in UK/EU youth.
- **Little Simz**: narrative-rich UK rap, works with collectives,
  rights-aware.
- **Knucks**: respected newer voice, original vocabulary.

**Poets / writers / theorists who'd advise**

- **Saidiya Hartman**: literally wrote on the kind of extraction
  this resists. Cultural-advisor archetype.
- **Hanif Abdurraqib**: music + cultural writing, broad respect.
- **Saul Williams**: sci-fi-curious poet, would engage with the
  AI angle.
- **Jeremy O. Harris**: playwright, already operates with rights
  awareness.

**Production / curatorial**

- **Steel Banglez**: producer with existing rights infrastructure.
- **Riz Ahmed**: actor + writer + curatorial credibility, has
  spoken on AI extraction.

The Tier 1 list should be **two or three names from each of these
groups** so the cohort opens with cross-craft balance and
cross-region coverage (US / UK / Lagos / Joburg / Caribbean
diaspora). Five to ten in total. Avoid all-US-rap. Avoid all-
established. Mix one or two emerging names per group so the
cohort feels alive, not retrospective.

**For friends specifically**: walk your network and ask, "whose
language do I quote without realising it?" That's the test. If
you can name three friends whose phrasing has shown up in your
own posts / texts / scripts, those are your first conversations.
The rest of the qualities above are filters.

## The "67" / "nigga" / pattern royalty question · how it actually works

The user explicitly asked about specific patterns. Plain answer:

**Words themselves cannot be owned.** No system can or should claim
ownership of a single word, especially a word with deep
collective history. "Nigga", "67", "based", "delulu", "drip"
belong to the cultures that made them. Any system claiming
otherwise is overreach and will collapse on first contact with
reality.

**What can be priced is *use of a contributor's specific LoRA-shaped
voice* that produces a pattern.** Concrete example:

A drill artist X opts into the cohort. Their LoRA captures their
specific cadence, tag patterns, slang inflections, voice. A
Bóveda character pins X's writing LoRA. The character generates
a verse that uses "67" the way X's LoRA was trained to use it.

Royalty fires not on the word "67" (which X doesn't own) but on
the **use of X's licensed LoRA**, which produced an output where
that pattern appears. The metering is on the LoRA call, not the
word.

If a hundred drill artists opt in, each contributing a LoRA that
inflects "67" differently, each one earns when their specific
LoRA is used. The collective vocabulary is shared; the
*specific voice that vivifies it* is paid.

For mass-viral patterns: the **co-op pool** mechanism. When a
phrase originates in the cohort and travels to mass culture,
attribution flows back to the cohort pool, which distributes
proportionally to all contributors weighted by use. This is the
Imperium answer to "the word travels but no single contributor
'owns' it." Solidarity, not lottery.

For sacred / community-specific terms (Yoruba names of orisha,
Akan day names, Mande lineage terms): cultural advisors gate use
by default. No LoRA can train on these without advisor signoff,
and use carries advisor-pool royalty in addition.

This is the first time language-as-labour can be metered without
claiming ownership over words. Bóveda is the first system that
makes this technically and ethically coherent.

## How Oryx, Imprint, Sembla, 08, Vaulted, Imperium compose

```
Contributor (artist)
   ↓
08 protocol (identity verification)
   ↓
Sembla (provenance profile, dataset registry)
   ↓
Vaulted (rights envelope: what's allowed, rates, revocation)
   ↓
Cohort LoRA training (consented data → adapter)
   ↓
Bóveda character pins LoRA (Character.loras[*])
   ↓
Tick generates output using LoRA
   ↓
Imperium event (royalty fires, USDC to contributor wallet)
   ↓
Output travels (Slayt / Imprint / Oryx / engine export / public)
   ↓
Each downstream use logs another Imperium event (compound)

Fan side:
   Oryx tips ↓ flow to characters → split between contributor + studio
   Imprint verification ↓ gates premium fan-facing surfaces
```

Each app's role:

- **08 protocol**: the canonical artist identity registry across
  all crafts. Cohort contributors verify here.
- **Sembla**: contributor profile + dataset listing. Originally
  fashion-focused; for the cohort, Sembla becomes the
  cross-craft profile site (or 08 hosts profiles directly and
  Sembla remains a fashion vertical on top).
- **Vaulted**: living rights envelope. The contract is the
  document; Vaulted enforces it programmatically.
- **Bóveda**: the studio. Where characters compose using LoRAs.
  Where royalty events originate.
- **Oryx**: African-continent creator pool. First Tier 1
  contributors from Lagos / Joburg / Nairobi / Accra / Kampala
  recruited through Oryx's existing infrastructure.
- **Imprint**: fan verification. Verified superfans can opt
  in to contribute language back at Tier 3.
- **Imperium**: settlement. The on-chain rails that make this
  real money rather than promised credit.

## The "no-brainer offer" pitch deck (one page)

For a candidate contributor, the pitch:

> Bóveda is building the first AI character platform that pays
> sources. Your voice. Your slang. Your cadence. Trained into a
> LoRA. Pinned to characters. Per-use royalty fires every time
> a character generates using your LoRA.
>
> You keep:
> - Public credit, every time, on every character page
> - Right to revoke whenever, no questions, no penalty
> - Vaulted-defined limits on commercial / non-commercial use
> - Cultural-advisor seat (top tier)
> - Co-op pool share when mass-viral patterns flow from the
>   cohort
>
> What you give up:
> - Nothing. Your work is yours. Bóveda licenses use, not
>   ownership.
>
> What you get:
> - On-chain royalty in USDC, automatic, per use
> - Equity-shaped early-contributor rate (Tier 1 only)
> - First voice in a system designed to refuse extraction
>
> No competitor can match this offer. The protocol stack required
> to do it has been engineered into Bóveda from day one. Every
> scraped dataset becomes more legally and reputationally toxic
> as the AI market matures. Bóveda is positioned to be the
> place high-taste creators are paid for what they actually do.

## Build order

This is Phase 5.5, between identity-lock and the morning trail
in the build sequence in `vision.md`. Order:

1. **Identity-lock-aware sync paths land first** (so contributor
   LoRAs aren't auto-rolled over).
2. **One contributor end-to-end as proof of concept.** Single
   consenting Tier 1 candidate. Manual contract on paper.
   Manual LoRA training. Manual royalty event. Demonstrate the
   full loop on one character before scaling.
3. **Vaulted rights envelope schema.** Define the contract
   programmatically.
4. **08 protocol artist registry endpoint.** Cohort contributor
   verification.
5. **Sembla cohort profile pages.** Public-facing director list.
6. **Imperium royalty event firing.** First on-chain payment.
7. **Cohort onboarding flow.** Five Tier 1 contributors
   onboarded together.
8. **Slang forecast model trained on cohort corpus.** First
   cohort-derived slang signal plugged into the tick prompt as
   the fifth signal layer.
9. **Co-op pool mechanism.** Mass-viral attribution + pool
   distribution.
10. **Tier 2 expansion.** 50-200 contributors.

## Open risks

- **Culture commodification**: paying for language risks turning
  language into a market commodity. Mitigation: the co-op pool +
  cultural-advisor signoff + right-to-forget make it a labour
  market, not an ownership market. Contributors are paid for
  *their voice doing work*, not for owning a piece of culture.
- **Whitewashing risk**: a non-Black studio uses a Black
  contributor's LoRA to put words in a non-Black character's
  mouth. Mitigation: Vaulted lets contributors gate which
  *character types* / *cubes* / *contexts* their LoRA can pin
  to. They can refuse cross-cultural use entirely if they
  choose.
- **The Anthropic / OpenAI counter-attack**: Big AI announces a
  "creator royalty fund" that's a PR move with no real
  per-use accounting. Mitigation: Bóveda's per-use on-chain
  rails are technically verifiable; the counter-fund will not
  be. Lean into auditability.
- **Cultural advisor cost / coordination**: getting Saidiya
  Hartman or Hanif Abdurraqib level advisors is expensive and
  slow. Mitigation: start with one or two cultural advisors per
  major cultural-rooted variant; scale as cohort grows.
- **Cohort selection bias**: invite-only risks reproducing
  existing power structures (US-coastal, established-name,
  English-only). Mitigation: enforce regional / craft / career-
  stage diversity in Tier 1. Diasporic by design, not by
  signaling.

## What this is for, ultimately

Building infrastructure for Black creators to monetise their
cultural labour at the moment AI is otherwise extracting it for
free. Not as charity. As correct economics. Black creators are
the source; they should be the first to be paid; the system
should make payment automatic and continuous.

If Bóveda lands this right, it's the first AI platform that
operates as **restorative economic infrastructure** rather than
extractive. That's the brand. That's the moat. That's the
thesis that justifies the entire stack.
