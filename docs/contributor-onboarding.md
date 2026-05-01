# Contributor onboarding · the playbook

The operational doc for bringing a slang-cohort contributor into
Bóveda end-to-end. Builds on the strategic frame in
`slang-cohort.md`. This is what to actually do when a candidate
says yes.

The first contributor is a one-person proof of concept. Manual
contract on paper, manual LoRA training, manual royalty event,
full loop demonstrated before scaling. Lower risk than a cohort
launch; higher learning rate. Pick someone who trusts you and
will tolerate a rough first version.

## Outreach · the cold approach

Cold outreach is unlikely to land a Tier 1 contributor. Warm
intros land Tier 1. For warm intro, the script is:

> Hi [name], I'm building Bóveda. It's a studio for AI characters
> that pays sources per use, on-chain, when their voice is used.
> I'm choosing the first five to ten contributors and you're the
> one I keep coming back to. Your [specific phrase / cadence /
> piece of work] is the kind of voice the system is built to
> credit.
>
> The deal: your writing trains a private adapter pinned to one
> Bóveda character. You get continuous USDC royalty per use.
> Public credit. Right to revoke any time. You define the limits.
> No exclusivity, no equity dilution, no ownership claim on your
> work.
>
> Fifteen minutes to walk through it on a call. If you say no, I
> drop it cleanly. If you say yes, you're the first person inside
> a system designed to refuse the way Big AI extracts.

Three things to avoid:

1. **Don't lead with the protocol.** The pitch is "you get paid
   for what you already do," not "we have a four-app stack."
   Architecture is a closing detail, not an opener.
2. **Don't use AI-buzzwords.** "LoRA" is fine; "agentic," "RAG,"
   "embedding," "foundation model" are not. The vocabulary they
   already use about their own voice is the right register.
3. **Don't promise volume.** Promise the rate and the right to
   leave. Volume is unproven on day one. The first contributor
   may earn $50 in month one. They're not signing up for the
   money; they're signing up because nobody else has offered the
   credit + consent shape before.

## The 15-minute call · agenda

1. **Your work, briefly** (2 min). Why I came to you specifically.
   Cite their work. Show I've actually read / listened.
2. **What it is** (3 min). One Bóveda character pins your
   writing LoRA. The character ticks. Sometimes the character
   speaks in your voice. Each generation is metered.
3. **What you get** (3 min). Per-use USDC royalty. Public credit.
   Vaulted-defined limits. Right to forget.
4. **What I need** (3 min). 100-1000 sample writings (any form:
   tweets, lyrics, voice notes transcribed, drafts). One photo
   for the credit page. One signed paper agreement. One wallet
   address.
5. **The honest caveat** (2 min). I have no idea what month one
   royalty looks like. Could be tens of dollars. Could grow.
   What's certain: every use is logged, every payment fires,
   you can leave any time.
6. **Open questions** (2 min). They ask; I answer. Don't oversell.

If they say yes on the call, ship the contract within 24 hours.
Don't lose the energy.

## The contract · plain-language template

The full programmatic version lives in Vaulted. The human-
readable version is one page, plain English, signed in physical
or DocuSign. Drafted now so it's ready when the first call
happens.

```
BÓVEDA CONTRIBUTOR AGREEMENT v1
[Date]

Between:
  [Contributor full legal name and address]
  ("Contributor")

  Bóveda Studio Ltd / [legal entity once incorporated]
  ("Bóveda")

1. WHAT YOU CONTRIBUTE
You give Bóveda a non-exclusive licence to train a single LoRA
adapter ("Your LoRA") on the writing samples you submit. The
samples remain yours; the licence covers training and inference
use only.

2. WHAT BÓVEDA DOES WITH IT
Your LoRA can be pinned to specific Bóveda characters within
specific cubes that you approve. Every time a character
generates output using Your LoRA, the use is logged and a
royalty event fires per Section 3.

3. ROYALTY
Bóveda pays you USDC per logged use of Your LoRA, on-chain via
Imperium, to the wallet address you provide. The current rate
is [TBD per use, e.g. $0.001-0.01 per generation depending on
weight], paid automatically with no minimum threshold and no
quarterly delay. Rate may be increased at Bóveda's discretion;
will not be decreased without your written consent.

For mass-viral patterns originating in the cohort, an additional
co-op pool share is paid quarterly. Your share is calculated
based on the contribution your LoRA made to the patterns that
travelled.

4. LIMITS YOU SET
You define, and may update at any time, which:
  - cubes Your LoRA can pin to (any / named / none),
  - character types Your LoRA can pin to (espíritu / twin /
    manual / relic),
  - contexts Your LoRA can be used in (commercial / non-
    commercial / research / public / private),
  - weights Your LoRA can be applied at (full pin / influence
    only / forbidden above N).
These limits live in Vaulted and are enforced programmatically.
Bóveda cannot bypass them.

5. CREDIT
Your name + photo + cohort tier appear on:
  - the Bóveda directors page (public),
  - every character page that pins Your LoRA (public),
  - every generation provenance log (private, available to you).
You can request a different display name; you cannot opt out of
credit while remaining active in the cohort.

6. RIGHT TO REVOKE
You can revoke this agreement at any time, for any reason, by
written notice. On revocation:
  - Your LoRA is unpinned from all characters within 7 days,
  - Bóveda stops generating using Your LoRA from the moment of
    notice,
  - Past royalty earned is yours to keep,
  - Future royalty stops on the effective date of revocation,
  - Provenance logs of past use remain (immutable).

7. WHAT YOU KEEP
You retain full ownership of your writing samples, your voice,
your style, your name, your likeness. This agreement licences
LoRA training and inference use only. Bóveda makes no claim of
ownership over you, your work, or your culture.

8. WHAT BÓVEDA KEEPS
Bóveda owns the trained LoRA file (as a derivative work of
your samples + Bóveda's training pipeline) but cannot use it
outside the limits you set in Section 4. On revocation Bóveda
deletes the LoRA from active inference; immutable archive
copies may be retained for provenance audits.

9. NO EXCLUSIVITY
You can license your voice elsewhere, take other contracts,
build your own systems. Bóveda does not claim exclusivity over
your style, your slang, your work, or any pattern you originate.

10. NO MERGER, NO ARBITRATION CLAUSE TRAP
This is a one-page agreement. There is no merger clause; verbal
promises matter. There is no forced arbitration. Disputes go to
[Contributor's home jurisdiction] courts. Lawyer fees in good-
faith disputes are split.

11. CULTURAL VARIANT GATING
If your writing is rooted in a specific cultural tradition that
the Bóveda protocol gates (Yoruba odu, Akan day names, Mande
griot lineage, ballroom subculture, drill subculture, etc.),
Bóveda commits not to use Your LoRA inside cultural variant
contexts without:
  - explicit written approval from you, AND
  - cultural-advisor signoff from the relevant advisor pool.

12. DATA HANDLING
Your writing samples are stored encrypted, accessible only to
the LoRA training pipeline + you. Not used for any purpose
beyond training Your LoRA. Not shared with third parties. Not
used as training data for other models or other contributors'
LoRAs.

13. THIS IS V1
Bóveda is early. The system will change. This agreement may be
updated; updates apply only to future use, not retroactively.
You can decline any update by revoking per Section 6.

Signed:
  [Contributor]                       [Date]
  [Bóveda authorised signatory]       [Date]
```

The contract is deliberately short. Long contracts read
extractive. Short contracts read like a co-op deal.

## Rate sheet · v1 numbers

The actual numbers will tune over time. v1 starting rates,
chosen to be defensible and easy to audit:

| Use type | Rate per generation |
|---|---|
| LoRA pinned at full weight (≥ 0.7) on espíritu | $0.005 |
| LoRA pinned at influence weight (0.3-0.7) | $0.002 |
| LoRA pinned at trace weight (< 0.3) | $0.0005 |
| Naming event (character coins a phrase using LoRA) | $0.05 |
| Mass-viral pattern attribution (quarterly co-op pool share) | calculated |

Tier 1 founders get a 2x multiplier on all rates for the first
12 months as the equity-shaped early-bet reward.

For cultural variant uses gated by advisors, an additional 30%
per-use is added that flows half to the contributor, half to
the advisor pool.

## What you collect from the contributor

A v1 onboarding kit:

1. **Sample corpus**: 100-1000 examples of their writing. Form
   doesn't matter — tweets, lyric drafts, voice notes
   transcribed, blog posts, captions, scripts, book excerpts.
   Anything they consider their voice. Stored as a single
   uploaded folder via Bóveda's existing upload flow.
2. **One photo**: for the directors page. Their choice of
   image. Right-of-likeness implicit in supplying it.
3. **Display name + bio paragraph**: what they want to be
   credited as. The bio paragraph is theirs to write.
4. **Wallet address**: Polygon address for USDC royalty.
5. **Limits sheet**: completed Section 4 of the contract,
   defining what's allowed and what isn't.
6. **One signed copy of the contract**: physical or DocuSign.
7. **Optional: a short video** (30-60 sec, phone vertical)
   introducing themselves for the public directors page. Not
   required.

## LoRA training pipeline · v1 manual workflow

For the first contributor, do this manually so you understand
every step. Automate later.

1. **Receive corpus**. Validate it's their work (cross-reference
   public attributions). Strip any third-party content they
   accidentally included.
2. **Format for training**. Each sample becomes a {prompt:
   "Write something in [contributor name]'s voice on [topic]",
   completion: "[the actual sample]"}. The "topic" tag is
   inferred or left blank.
3. **Train LoRA**. Use a small open-weights base (Qwen 2.5 7B
   recommended over Llama for tonal flexibility). LoRA rank 32
   is enough for v1. Train on Modal or RunPod, ~$5-15 of compute
   for a small corpus.
4. **Validate**. Generate 20 samples in their voice. Show them
   the samples. They approve / reject. If rejected, identify
   gap (style not captured, slang missing, register wrong),
   tune training, re-validate. Iterate until they say "yes,
   that sounds like me."
5. **Pin to first character**. The LoRA goes into one Bóveda
   character's `loras` field at full weight. That character is
   the contributor's public-facing avatar in the system. They
   approve the character + its bio + its name.
6. **First generation + first royalty event**. Tick the
   character once. Output generates using the LoRA. A synthetic
   Imperium event fires (real on-chain even if v1 amount is
   tiny). Show the contributor: "this is what just happened.
   This is the log. This is the wallet credit."

The point of the manual v1 is the contributor *sees the loop
close*. Demo over deck. Once they trust the loop, the rest
follows.

## The first character · the avatar choice

Each cohort contributor is paired with one Bóveda character
that becomes their public-facing avatar in the system. Three
options for that pairing:

1. **A new character generated for them**. Default. The
   character is created in Bóveda, given a name they like,
   pinned with their LoRA. Their voice lives in this character.
   The character may be theirs to write more bio for over time.
2. **An existing Bóveda character they sponsor**. Less common.
   If a contributor specifically wants to back a character that
   already exists (Triarch, Booe, etc.), their LoRA pins to
   that character at influence weight (not full pin, since the
   character already has identity).
3. **A group / collective character**. For collaborative
   cohort contributions (e.g. three writers contribute to a
   single character whose voice is the blend), the LoRA is
   blended at training time and the credit / royalty splits
   per Section 3.

For the first contributor, recommend option 1: a clean new
character. Simplest, clearest. Reduces ambiguity.

## What to track in Bóveda for v1

Schema additions (parking note for when this build phase opens):

```prisma
model Contributor {
  id                String   @id @default(cuid())
  legalName         String
  displayName       String
  bio               String   @default("")
  photoUrl          String?
  walletAddress     String   // Polygon
  email             String   @unique
  tier              String   @default("crew")  // founder | crew | community
  joinedAt          DateTime @default(now())
  contractSignedAt  DateTime?
  contractVersion   String   @default("v1")
  active            Boolean  @default(true)
  revokedAt         DateTime?

  // Vaulted-defined limits, JSON
  limits            Json     @default("{}")

  // Reverse links
  loras             ContributorLora[]
  royaltyEvents     RoyaltyEvent[]
}

model ContributorLora {
  id            String   @id @default(cuid())
  contributorId String
  contributor   Contributor @relation(fields: [contributorId], references: [id])
  loraName      String
  loraPath      String   // Storage path of LoRA file
  baseModel     String   // e.g. "qwen2.5-7b"
  trainedAt     DateTime @default(now())
  sampleCount   Int
  trainingNotes String?
  active        Boolean  @default(true)
}

model RoyaltyEvent {
  id            String   @id @default(cuid())
  contributorId String
  contributor   Contributor @relation(fields: [contributorId], references: [id])
  characterId   String
  loraId        String
  weight        Float
  useType       String   // 'generation' | 'naming' | 'viral_pool'
  amountUsdc    Float
  txHash        String?  // Imperium transaction hash, null if pending
  generatedAt   DateTime @default(now())
  settledAt     DateTime?
}
```

## Outreach script · warm intro template

For when you're asking a mutual friend to introduce you to a
candidate:

> Hey [intro name], could you introduce me to [candidate]? I'm
> building a small, curated AI character system that pays
> contributors per use of their voice — on-chain, automatic, no
> minimum threshold. I'm choosing the first five to ten people
> and [candidate]'s [specific work / quality] is exactly what
> the system is built to credit.
>
> Quick paragraph for forwarding if that helps:
>
> "Bóveda is a small AI character studio that pays its sources.
> Writers / rappers / artists license their voice as a private
> LoRA pinned to one character. They get continuous USDC
> royalty per use, public credit, right to revoke any time.
> First-cohort contributors get an equity-shaped early rate.
> I'm building it because I'm tired of watching Black creators'
> language get scraped at zero cost and used to build models
> they'll never see a dollar from. Fifteen minutes to walk
> through it if you're curious."
>
> Thanks for any opening you can do. If [candidate] passes I'll
> drop it cleanly.

## Friend test · final practical filter

Walk your network with this single question:

> Whose phrasing has shown up in my own posts, texts, scripts,
> or speech in the last six months without me noticing?

Write down every name you can think of. Discard any you can
fully describe in less than 10 seconds — those are influences,
not language-makers. Keep the ones you have to think about.
That's your shortlist.

Filter by:

- They invent more than they imitate.
- They work cross-craft (2+ disciplines, even if one is a
  hobby).
- They're diasporic-rooted (specific cultural soil, not generic-
  cool).
- They've thought about credit / extraction publicly.
- They'd say yes because *you* asked specifically.

Pick three. Rank them by how much you'd hate it if you couldn't
get them. The top of that ranking is contributor #1.

## Zero-to-one timeline

A realistic schedule for the one-contributor proof of concept:

- **Day 0**: pick contributor, send warm intro request.
- **Day 7**: 15-minute call.
- **Day 8**: contract sent.
- **Day 14**: contract signed, corpus + photo + wallet
  delivered.
- **Day 21**: LoRA trained, first 20 validation samples
  delivered to contributor.
- **Day 28**: contributor approves LoRA, character paired,
  first tick fires, first synthetic royalty event logs.
- **Day 30**: public directors page launches with their
  credit. They post about it. The cohort begins, in public,
  with one name and one character and one verifiable royalty
  event.

If this works for one, the second is faster. By month three
five contributors are live. By month six the slang forecast
model is trained on the cohort corpus and plugged into ticks.
By month nine Tier 2 expansion. The Tier 1 cohort is the
proof; the rest scales.

## What this proves

If the first contributor stays active for 90 days and earns at
least one verifiable on-chain royalty event in that window,
then **a paid AI character platform is technically possible
and ethically credible**. That's the claim Bóveda exists to
demonstrate. Everything else is infrastructure to scale that
demonstration. The first contributor is the load-bearing
proof. Everything else compounds from there.
