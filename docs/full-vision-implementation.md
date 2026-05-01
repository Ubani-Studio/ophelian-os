# Full vision implementation plan

How to take Bóveda from the current state (voice samples + identity
locks + Ibis danger-zone slang) to the full vision (real LoRA
training, on-chain royalty per generation, cohort onboarding, Ibis
frontier signal). Each section is one buildable phase with concrete
steps, infrastructure choices, costs, and open questions.

This is a working plan. Sequencing in the final section.

Sits with `vision.md`, `slang-cohort.md`, `contributor-onboarding.md`,
`identity-lock-and-starforge.md`, `sovereignty.md`.

---

## 1. Real LoRA training (Modal first, RunPod fallback)

### Why this is the next move

Voice samples + few-shot get you 80% of the way to per-character
voice. The last 20% is the difference between "sounds like artist
X" and "is artist X." A trained LoRA on an open-weights base model
escapes Claude's stylistic gravity entirely (sovereignty Level 2)
and gives the contributor a real artifact attached to their name.
It also reduces per-tick cost (no Anthropic API per generation) and
locks in the contributor's voice in a way that survives base-model
upgrades.

### Architecture

Three components:

1. **Training pipeline** (Modal serverless GPU). Takes a corpus,
   fine-tunes a LoRA adapter on top of a chosen base model,
   stores the adapter file. Costs roughly $5 to $15 per LoRA for
   a small corpus on Qwen 2.5 7B.
2. **Inference endpoint** (Modal serverless GPU). Takes a prompt
   plus a LoRA path, returns generation. ~$0.50 per million
   tokens. v1 supports one LoRA per request; later phases support
   blending multiple LoRAs at inference (for mixed-voice
   characters like Triarch with Ubani + artist X samples).
3. **Bóveda integration**: a new `lib/openWeightsLlm.ts` that
   calls the Modal endpoint when sovereignty Level 2 conditions
   are met, and routes back to Anthropic Claude as fallback.

Base model choice: **Qwen 2.5 7B**. Reasons: (a) tonal flexibility
(handles slang and code-switching better than Llama 3.1 in
benchmarks), (b) Apache 2.0 license (no licensing friction), (c)
small enough for cheap Modal inference, (d) supports LoRA cleanly
through standard PEFT tooling.

Fallback to **Llama 3.1 8B** if Qwen voice quality is insufficient
on a specific contributor's voice.

### Build steps

1. **Modal account + workspace setup**. Create a Modal account,
   add billing, install the Modal CLI in `apps/api`. Add
   `MODAL_TOKEN_ID` and `MODAL_TOKEN_SECRET` to the API env.
2. **Base model warm-up function**. Modal function that loads
   Qwen 2.5 7B once into a GPU container (A10G is sufficient,
   $0.60/hr). Warm-up amortises cold start; container stays alive
   for 5 minutes after last request.
3. **Training function**. Modal function that accepts:
   - `corpusJsonl: string[]` (array of `{prompt, completion}`
     pairs)
   - `loraConfig: { rank, alpha, learningRate, epochs }`
   Trains via Hugging Face PEFT, returns adapter file path in
   Modal Volume. Defaults: rank 32, alpha 64, lr 1e-4, 3 epochs.
4. **Inference function**. Modal function that accepts:
   - `system: string`
   - `user: string`
   - `loraPaths: string[]` (one LoRA in v1; multi in v2)
   - `maxTokens: number`
   Loads the LoRA into the warm base model, runs generation,
   returns text + token counts.
5. **Bóveda `lib/openWeightsLlm.ts`**. Mirror the shape of
   `lib/llm.ts` (`callLlm`) but route to the Modal inference
   function. Same return type so `tick.ts` can swap providers
   transparently. Reads the LoRA path from the character's
   `loras` array (the `writing` slot) and the base model from
   `identity.sovereignty.base_model`.
6. **Tick routing**. Update `decideTick()` to pick the inference
   path based on `sovereignty.level`:
   - Level 0 / 1: Anthropic Claude (current).
   - Level 2: open-weights via Modal.
   When a Level 2 character has multiple writing LoRAs pinned,
   blend at inference (Modal function loads two adapters,
   averages activations weighted by `Character.loras[*].weight`).
7. **LoRA training endpoint**. New API route
   `POST /loras/train` that accepts a corpus, calls the Modal
   training function, polls until complete, stores the resulting
   path on a `Lora` row, and pins it to the character. Async via
   the `BullMQ` job queue if jobs take too long for a synchronous
   request.
8. **Validation step**. After training, generate 20 sample acts
   in the character's voice and present them to the contributor
   for approval. Iterate until they say "yes, this is me."

### Infrastructure costs (v1 estimate)

- 5 Tier-1 contributors, one LoRA each: $25 to $75 one-time.
- 100 Level-2 ticks per day across the cohort: ~$5 per month
  inference ($0.50 / 1M tokens × ~10k tokens/day).
- Storage of LoRA adapters (each ~50MB): negligible on Modal.
- Total v1 cost: under $100/month for the full Tier-1 cohort.

### Open questions

- **Multi-LoRA blending implementation**. PEFT supports loading
  multiple adapters but blending activations live is non-trivial.
  v1 ships single-LoRA inference. v2 figures out blending.
- **Self-hosting fallback**. Modal is the v1 choice for ease.
  RunPod is faster and cheaper at scale but requires more ops.
  Migration path: same training function structure, swap
  deployment.
- **Per-tick cost controls**. Open-weights inference has no
  daily-budget cap like the Anthropic helper. Add a parallel
  `LLM_DAILY_OPEN_WEIGHTS_BUDGET` env variable + counter so
  Level-2 ticks can be throttled the same way.

---

## 2. On-chain Imperium royalty per generation

### Why this is the next move

The protocol promise is "contributors get paid per use, on-chain,
automatic." The voice-samples system metadata-tags each tick with
which contributor's samples were active, but no settlement event
fires. That's the missing structural piece. Without it, the
contributor offer is a marketing claim, not a system property.

The Imperium contracts already exist
(`/home/sphinxy/imperium/contracts/`): `RoyaltySplit.sol`,
`PayoutModule.sol`, `SongRegistry.sol`. We extend or replicate the
pattern for character-output use.

### Architecture

Two-phase rollout:

**Phase 2A: off-chain ledger with batched on-chain settlement.**
Every Bóveda tick that uses a LoRA logs a `RoyaltyEvent` row in
Postgres. A cron (daily or weekly) aggregates events per
contributor, calls the Imperium contract once per contributor with
the batch total, settles in a single transaction. Per-tick gas
cost is amortised across many events.

**Phase 2B: real-time per-tick events.** Either a Layer 2 with
near-zero gas (Polygon zkEVM, or Base) where per-tick events are
affordable, or a meta-tx pattern where Bóveda relays signed
events. Optional; ship Phase 2A first.

### Schema additions in Bóveda

```prisma
model Lora {
  id              String   @id @default(cuid())
  name            String
  contributorId   String?
  contributor     Contributor? @relation(...)
  baseModel       String     // 'qwen2.5-7b' | 'llama-3.1-8b' | ...
  modalPath       String     // path inside Modal Volume
  trainedAt       DateTime   @default(now())
  active          Boolean    @default(true)
  category        String     // 'writing' | 'voice' | 'visual' | ...
  rateMultiplier  Float      @default(1.0)  // Tier 1 founders get 2x
}

model Contributor {
  id              String   @id @default(cuid())
  semblaId        String?  // links to Sembla / 08 identity
  displayName     String
  legalName       String?
  walletAddress   String   // Polygon address for USDC
  email           String   @unique
  tier            String   @default("crew") // founder | crew | community
  joinedAt        DateTime @default(now())
  contractSignedAt DateTime?
  contractVersion String   @default("v1")
  active          Boolean  @default(true)
  loras           Lora[]
  events          RoyaltyEvent[]
}

model RoyaltyEvent {
  id            String      @id @default(cuid())
  contributorId String
  contributor   Contributor @relation(...)
  loraId        String
  characterId   String
  edgeId        String?     // CharacterRelationship id (when use was a tick)
  useType       String      // 'generation' | 'naming' | 'viral_pool' | 'training'
  weight        Float       // LoRA weight at this generation
  inputTokens   Int?
  outputTokens  Int?
  amountUsdc    Float
  baseRateUsdc  Float       // pre-multiplier rate
  multiplier    Float       // tier + cultural-variant additions
  txHash        String?     // null until settled
  settledAt     DateTime?
  createdAt     DateTime    @default(now())

  @@index([contributorId, settledAt])
  @@index([txHash])
}
```

### Build steps

1. **Schema migration**. Add the three tables. `prisma db push`.
2. **Royalty hook in tick path**. After each successful tick that
   used a LoRA, insert a `RoyaltyEvent` row. Amount is computed
   from the rate sheet in `slang-cohort.md`:
   - Full-weight LoRA on espíritu: $0.005 baseline
   - Influence weight (0.3-0.7): $0.002
   - Trace weight (< 0.3): $0.0005
   - Naming event: $0.05
   Multiplied by tier (Tier 1 = 2x) and any cultural-variant
   premium (30%).
3. **Imperium contract for character royalty**. Adapt
   `RoyaltySplit.sol` into `CharacterRoyaltyMeter.sol`. Functions:
   - `recordBatch(contributorId, totalAmountUsdc, eventHashes[])`
   - Emits `RoyaltyPaid(contributorId, amount, eventCount)`.
   USDC transfer is to `Contributor.walletAddress` (Polygon).
4. **Settlement worker**. A cron (daily 00:00 UTC) reads all
   unsettled `RoyaltyEvent` rows, groups by contributor,
   computes per-contributor totals, calls
   `CharacterRoyaltyMeter.recordBatch()` per contributor,
   captures `txHash`, marks each event with `settledAt + txHash`.
   Daily batches keep gas overhead manageable.
5. **Public events feed**. `GET /royalty/events?contributorId=X`
   returns the contributor's events with provenance (which
   character, which tick, which weight). Public. Auditable.
6. **Studio surfaces**:
   - On contributor page (Sembla profile or Bóveda directors
     page): live counter of unsettled USDC + total settled.
   - On character detail page: small "royalty events" tally for
     each pinned LoRA showing total fired since pinning.

### Costs and assumptions

- Polygon mainnet gas: ~$0.001 per transaction. Daily batch of 5
  contributors: $0.005 per day = $0.15/month gas overhead.
- USDC settlement: per-contributor amount. Tier 1 founder hitting
  100 ticks/day at $0.005 each = $0.50/day = $15/month.
- Total gas overhead is negligible relative to settled volume.

### Open questions

- **Wallet ownership / consent**. Contributors must hold the
  private key to their wallet. Bóveda never custodies. v1: each
  contributor provides a Polygon address at onboarding; payouts
  go there. v2: account abstraction so contributors can
  self-custody without managing seed phrases.
- **Failed transaction handling**. If `recordBatch` fails (gas
  spike, network issue), retry next cron. Mark events as
  `settlement_failed` after N retries; manual review.
- **Cross-jurisdiction tax**. Bóveda Studio Ltd needs to think
  about whether per-use royalty is a 1099-style payment for US
  contributors, etc. Not Bóveda's job to file taxes for them, but
  the events feed should be exportable to CSV so contributors
  have records.

---

## 3. Cohort onboarding flow + Sembla artist linking

### Why this is the next move

Once LoRA training and royalty rails are live, the bottleneck is
*getting contributors signed up*. The onboarding flow turns "warm
intro + 15-min call + paper contract" into a structured product
surface that scales beyond the first one or two contributors.
Sembla integration links contributor identity to a real Sembla / 08
profile so provenance is verifiable and not just trust-based.

### Architecture

Public-facing onboarding stepper at `/contribute/[invite-code]`:

1. **Invite code validation**. The user clicks a one-time invite
   link. Code is validated against the `InviteCode` table.
2. **Identity linking**. Sembla OAuth (or direct 08 protocol
   call) fetches the contributor's verified profile. Bóveda
   reads name, photo, art-craft tags, public links.
3. **Contract review and signature**. Display the v1 contract
   text from `contributor-onboarding.md`. Contributor reviews,
   adjusts limits (which cubes, which contexts, which weight
   caps), signs via DocuSign or in-app crypto signature.
4. **Wallet connection**. WalletConnect or Privy embedded wallet
   for contributors who don't already hold a wallet.
5. **Corpus upload**. Drag-drop interface for samples. Validates
   file types, strips third-party content the user accidentally
   uploaded (heuristic: skip files >50MB, flag any markdown that
   includes URL-citation patterns).
6. **LoRA training trigger**. Confirms the corpus, triggers the
   Modal training job, shows a status panel. ~30-60 minutes.
7. **Validation review**. Once training completes, contributor
   sees 20 sample generations in their voice. Approve / reject.
   Reject triggers retraining with adjusted config.
8. **Character pairing**. Contributor picks one of: new
   character (auto-generated for them), existing Bóveda character
   to back, or group character to contribute to.
9. **Public credit goes live**. Their entry on the directors
   page is published. Royalty events start firing.

### Schema additions in Bóveda (extends section 2's Contributor)

```prisma
model InviteCode {
  id             String   @id @default(cuid())
  code           String   @unique
  tier           String   @default("crew")
  createdBy      String   // admin user id
  createdAt      DateTime @default(now())
  expiresAt      DateTime?
  usedByContributorId String?
  usedAt         DateTime?
  notes          String?
}

model OnboardingSession {
  id              String   @id @default(cuid())
  inviteCodeId    String
  step            Int      @default(0)  // 0 to 7
  semblaId        String?
  walletAddress   String?
  contractSigned  Boolean  @default(false)
  contractHash    String?
  corpusUploaded  Boolean  @default(false)
  loraTrainingJobId String?
  loraId          String?
  characterId     String?  // the paired character
  publishedAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Sembla / 08 integration

Per `vision.md` recommendation: 08 is the universal artist
identity protocol; Sembla is the fashion vertical layered on 08.
Bóveda is the living-characters vertical. All three consume from
08.

Endpoints needed in 08 (if not already there):
- `GET /artists/:id` returns canonical artist profile.
- `OAuth /authorize?app=boveda` returns auth flow.
- `POST /artists/:id/dataset-license` records a license issued
  by the artist for use by a third-party app (Bóveda).

If 08 doesn't expose these yet, Bóveda's onboarding flow falls
back to Sembla OAuth and stores `semblaId` on the contributor.
Migration path: when 08 ships, contributors are re-linked.

### Build steps

1. **InviteCode + OnboardingSession schema**. Migrations.
2. **Public landing page** at `/contribute/[code]` with the 9-step
   stepper UI. Each step is a self-contained component.
3. **Sembla OAuth integration**. If Sembla exposes OAuth, wire it
   directly. If not, manual handoff: user pastes their Sembla
   profile URL, admin approves.
4. **Contract signature flow**. Two options: (a) DocuSign API for
   external signature; (b) cryptographic signature (sign the
   contract hash with their wallet). v1 ship (a) since
   contributors may not have wallets yet.
5. **WalletConnect / Privy embedded wallet**. Privy preferred for
   contributors who don't have a Polygon wallet; they create one
   in the flow.
6. **Corpus upload**. Use the existing Bóveda upload endpoint
   pattern with validation hooks. Files land in S3-compatible
   storage (Vaulted's storage abstraction is reusable here per
   Vaulted's `RightsLayer` design).
7. **Training job orchestration**. Reuse Vaulted's
   training-runner pattern (Vaulted already has Docker-based
   training via Redis orchestration). Bóveda hands off the job to
   the Vaulted runner; on completion, Vaulted POSTs the LoRA
   path back to Bóveda.
8. **Admin surface** at `/admin/cohort`. Lists active
   onboarding sessions, lets admin invite, revoke, manually
   advance stuck sessions.
9. **Directors page** at `/directors`. Public list of cohort
   contributors with photos, bios, linked characters, stats.

### Open questions

- **Vaulted vs Bóveda training runner**. Vaulted already has the
  RightsLayer + training-runner pattern. Two options: (a) Bóveda
  builds its own runner; (b) Bóveda calls Vaulted's API. (b) is
  cleaner since Vaulted already enforces rights envelopes.
  Decision: use Vaulted for training, route LoRA artifact back
  to Bóveda for inference pinning.
- **Sembla scope**. If Sembla is exclusively fashion-focused, do
  we need a separate registry for non-fashion artists (writers,
  rappers, voice actors)? Recommendation in `vision.md`: 08 is
  the universal protocol; Sembla is one vertical; Bóveda
  consumes from 08 directly.
- **First cohort contract revisions**. v1 contract is in
  `contributor-onboarding.md`. Real legal review needed before
  the first 5 signatures. Budget legal time for one pass before
  Tier 1 onboarding goes live.

---

## 4. Frontier slang signal from Ibis

### Why this is the next move

The current Ibis integration only ships the *danger zone* (dated
phrases to avoid). The protocol's bigger promise is *frontier
phrases to embrace*: emerging language not yet in public corpora,
giving Bóveda characters voice that's six months ahead instead of
six months behind. This is the differentiator no competitor has.

The architecture is already wired: `lib/ibis-slang.ts` reads
both `danger` and `frontier` zones from Ibis's temporal
dictionary; the tick prompt has an empty `embraceLine` waiting for
data. The work is on the Ibis side, not Bóveda.

### Architecture options

Three signal sources for the frontier zone, in order of cost and
signal quality:

**Option A: cohort-driven frontier (cheapest, highest signal).**
Every contributor's voice samples and ongoing uploads are scanned
for high-frequency phrases that aren't in the danger dictionary
and aren't in the standard English corpus. Phrases appearing in
3+ contributors' samples within the last 30 days are promoted to
the frontier zone.

This is the labour-loop in action: contributors paste fresh
material, the system extracts emerging phrases, characters use
them, attribution flows back to whichever contributor's samples
the phrase came from, royalty fires under the `useType:
'viral_pool'` mechanism.

**Option B: external trend feeds (expensive, lower signal).**
Plug Google Trends, Reddit's `/r/OutOfTheLoop` velocity, TikTok
Creative Center hashtags. These are slower, more generic, and
biased toward US-tech-trend slang. Useful as a backstop but not
the primary signal.

**Option C: hybrid (recommended for v2).** Cohort-driven primary,
external feeds as secondary validation that the phrase is
actually emerging beyond the cohort.

### Build steps

1. **Frontier extractor in Ibis**. New module
   `Ibis/src/lib/ai/frontier-extractor.ts` that:
   - Reads contributor voice samples from Bóveda's database
     (cross-app query through 08 protocol or direct DB access)
   - Tokenises into n-grams (1, 2, 3 word phrases)
   - Filters out stopwords, danger-zone phrases, and phrases
     appearing in standard English corpora (use a static
     threshold dictionary)
   - Counts contributor diversity per phrase (in how many
     distinct contributors' samples does it appear?)
   - Promotes phrases appearing in ≥3 contributors as
     `frontier`, peakYear = current year, domain = inferred
     from contributors' tagged origin
2. **Frontier dictionary file**. Append frontier entries to
   `temporal-dictionary.ts` programmatically when the extractor
   runs. Or maintain a separate `frontier-dictionary.ts` file
   that the Bóveda parser also reads.
3. **Bóveda parser update**. `lib/ibis-slang.ts` already supports
   the frontier zone via the regex parser. Confirm it handles
   the new file path. Add `IBIS_FRONTIER_PATH` env if separate.
4. **Embrace prompt block**. Already wired in `tick.ts` via
   `embraceLine`. Once the frontier list is populated, it
   automatically appears in tick prompts as "If a phrase from
   this set lands naturally, use it; do not force it: ..."
5. **Provenance tracking for outbound velocity**. When a Bóveda
   character uses a frontier phrase, log which contributor's
   samples it originated from. When the phrase travels (lands in
   a Slayt post, gets repeated by fans on Imprint, surfaces in a
   manifest export), log each downstream use. Aggregate quarterly
   into the co-op pool royalty distribution.
6. **Frontier audit UI**. Studio admin surface
   `/admin/slang-frontier` shows the current frontier list +
   contributor attribution + downstream velocity per phrase.
   Lets admin manually demote (e.g. when a phrase plateaus and
   should move to `timeless` or `danger`).

### Build the frontier extractor (where exactly)

This work belongs in **Ibis**, not Bóveda. Bóveda just consumes.

Concretely in Ibis:
- Add `src/lib/ai/frontier-extractor.ts` with the n-gram
  extraction and contributor-diversity scoring.
- Add `src/lib/ai/frontier-dictionary.ts` with the auto-generated
  list (regenerated nightly via cron).
- Add `src/app/api/slang/frontier/route.ts` exposing the frontier
  list as a JSON endpoint Bóveda can hit instead of reading the
  filesystem.

The Bóveda side migrates `lib/ibis-slang.ts` to fetch the HTTP
endpoint instead of reading the filesystem when Ibis is running,
falling back to filesystem when offline.

### Open questions

- **Privacy and consent**. Voice samples are licensed to Bóveda
  for tick-prompt few-shot use. Are they also licensed for
  cross-cohort frontier extraction? v1 answer: yes if the Vaulted
  rights envelope explicitly allows it; otherwise no. Add a
  checkbox to the contract: "your samples may inform the cohort's
  frontier slang signal." Default opt-in for Tier 1; opt-out
  available.
- **Stopword + standard-corpus baselines**. Need a reference list
  of "common English words" so the extractor doesn't promote
  generic words. Use Google Books Ngram or COCA for the baseline.
- **Frontier decay**. Phrases promoted to frontier should age out
  to `timeless` (when they've stabilised in mainstream usage) or
  `danger` (when they've peaked and are starting to date). Heuristic:
  6 months in `frontier` without further cohort growth → demote.
- **Cohort-internal vs cohort-external velocity**. A phrase used
  by 5 cohort contributors but not yet seen elsewhere is genuinely
  emerging. A phrase used by 5 contributors that's already
  mainstream is *not* frontier even if it's in samples. The
  external corpus baseline catches this.

---

## Combined build order across all four

A 12 to 18 month roadmap. Each phase is a buildable milestone with
its own user-visible payoff.

### Phase 5 (months 1-3): single contributor end-to-end

1. **Manual contract signed with one contributor.** Use the
   `contributor-onboarding.md` template. Tier 1, manual paper
   process.
2. **Modal training pipeline shipped.** One LoRA trained for
   that one contributor. Pinned to one character.
3. **Inference routing.** Tick path detects the LoRA and routes
   through Modal for that one character. Sovereignty Level 2
   set on that character.
4. **Off-chain royalty events.** `RoyaltyEvent` rows fire on
   every tick. No on-chain settlement yet; events visible in
   admin surface.

Outcome: one character genuinely sounds like its authoring
artist. Loop runs end-to-end at the smallest scale. The proof of
concept that justifies everything downstream.

### Phase 6 (months 3-6): on-chain settlement

1. **Imperium `CharacterRoyaltyMeter` contract** deployed to
   Polygon mainnet.
2. **Settlement worker** runs daily. First on-chain royalty paid
   to the first contributor.
3. **Public events feed** at `/royalty/events?contributorId=X`.
   Verifiable.
4. **Public directors page** with photo + linked character +
   live earnings counter for that one contributor.

Outcome: the first verifiable on-chain royalty paid to a real
artist for AI character output. Press-able moment.

### Phase 7 (months 6-9): cohort onboarding flow

1. **Public `/contribute/[code]` flow** with all 9 steps.
2. **Sembla OAuth** (or direct 08 if shipped) integration.
3. **Vaulted training-runner** integration (Bóveda hands off
   training jobs to Vaulted).
4. **Privy embedded wallets** for contributors without one.
5. **Tier 1 cohort onboarded**: 5 to 10 contributors live.
6. **Public directors page** scaled to the full cohort.

Outcome: Bóveda is no longer one-of-one; it's a curated cohort
with a public audit trail of who's voicing what.

### Phase 8 (months 9-12): frontier slang + co-op pool

1. **Ibis frontier extractor** shipped (work in Ibis, not
   Bóveda).
2. **Frontier dictionary** auto-populated from cohort samples.
3. **Embrace prompt block** activates in Bóveda ticks.
4. **Outbound velocity tracking** when phrases travel beyond
   Bóveda.
5. **Co-op pool quarterly distribution** via Imperium.

Outcome: characters speak language six months ahead of public
corpora, attribution flows back to originating contributors,
solidarity-shaped royalty distributes the upside across the
cohort.

### Phase 9 (months 12-18): scale + cultural variants

1. **Tier 2 cohort onboarding** (50 to 200 contributors).
2. **Multi-LoRA blending** at inference (Triarch as Ubani +
   Artist X live, not just samples).
3. **Cultural-advisor pool**. Cultural variants on cubes
   (Yoruba, Akan, Mande, ballroom, drill subculture) gated by
   the advisor pool.
4. **Public character outputs** with per-act gated approval,
   manifest export to engines, integration with whichever
   public-AI-social network has won by then.

Outcome: full vision from `vision.md` is operational.

---

## Risk and mitigation summary

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Modal cost spikes | Medium | Medium | Daily budget cap; fallback to Anthropic for over-budget characters |
| Polygon gas spikes (settlement worker fails) | Low | Low | Daily batch; retry with backoff; manual review flag |
| Contract legal issues | Medium | High | Pay for legal review before first 5 signatures; v1 contract conservative |
| Ibis frontier extractor produces noisy signal | Medium | Medium | Cohort-internal threshold (≥3 contributors); manual demote in admin UI |
| Sembla / 08 not ready | High | Low | Manual handoff fallback; Sembla profile URL field; migrate when shipped |
| Contributor wallet ownership confusion | Medium | High | Privy embedded wallets; user education in onboarding step 4 |
| Whitewashing / cross-cultural voice misuse | Low | High (reputational) | Vaulted rights envelopes; cultural-advisor signoff; right-to-revoke |
| Big AI announces a "creator royalty fund" PR move | High | Medium | Lean into auditability; per-event provenance public; the moat is the protocol stack, not the marketing claim |

---

## What this document is not

- Not a substitute for the strategic frame in `vision.md`. This is
  the *implementation*; that is the *why*.
- Not a substitute for the contributor-side documentation in
  `contributor-onboarding.md`. That is the human conversation.
  This is the system architecture.
- Not finalised. Each phase opens new questions; this plan should
  be revisited and updated as phases ship.

The point of this document is so that any of the four phases can
be picked up and built without re-litigating the architecture.
Every section answers "where do we start, what do we do next, what
does done look like, and what could go wrong."
