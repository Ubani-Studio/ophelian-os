# Locations — Mythological Accretion

> Wired: [[Boveda]] · [[Vivarium]] · [[Lukasa]] · [[Ikenga]] ·
> [[THEMES_FRACTAL_LINEAGE]] · [[REFERENCE_HUB_ARCHITECTURE]] ·
> [[CULTURAL_REFERENCE_CASCADE_PEDAGOGICAL]] ·
> [[ARCHETYPAL_LINEAGE_DIEPIRI_BALANCED]] · [[PLATS]]

A first-class **Location** entity. The writer multi-selects
References that share a place, tags them all as one Location
("Violet Lake"), and that Location accretes mythological layers
over time ("Lady of the Lake", "Grain mythology", "Oshun
water-deity", "Niger Delta mami wata") to form a deep cohesive
mythology that re-surfaces across every Sphere in the Cube.

The writer's example: multiple images of a violet-toned lake →
tag as "Violet Lake" → bind Cube ("Eden") → attach mythologies →
the lake becomes a richly-layered place that future storyboards
can pull from with full pedagogical context.

## Why this layer exists

The writer has Reference Hub (the visual library), Themes (motifs
that recur), Cultural Reference Cascade (named specific
ancestors), Archetypal Lineage (abstract archetypes), and Bóveda
Cube/Zone/Sphere (the world model). What's missing: a way to
declare *this is a specific place* with mythological weight that
binds across all of those layers.

A Location is what happens when:

- Multiple References cluster around a single geographic / spatial
  feature
- The writer attaches mythological traditions to that feature
- The feature becomes a node in the world's geography that future
  work can revisit

Without Locations, every Sphere has to re-discover the
mythology of its place. With Locations, the place compounds —
"Violet Lake" in Cube 1 carries every layer the writer has ever
attached, ready to seed future work in the same Cube.

## Location vs Vivarium Relic — unification

Vivarium already has `Relic` with `kind=location`. We unify:

- A Vivarium Relic with `kind=location` IS a Location.
- The Location-specific fields (mythological_layers,
  cultural_references) become optional fields on Relic, populated
  only when the Relic is a place.
- Existing Vivarium fields (strangeness, saro_index, field_site,
  fieldLat/Lng, taxonPath if applicable) all still apply.

This keeps the data model coherent. A Location is just a Relic
with more myth.

The writer's example "Violet Lake" would live as:

```
Relic {
  kind: "location",
  title: "Violet Lake",
  cube_ids: ["eden"],
  zone_ids: ["eden-bondage"],

  // Vivarium fields
  fieldSite: "Northern Welsh marches" (or wherever)
  fieldLat / fieldLng: optional
  strangeness: 0.6
  saroIndex: 0.2
  mythicPosture: "the lake where the witnesses meet"

  // Location-specific fields (NEW)
  location_type: "lake"
  visual_signature_embedding: <CLIP centroid>
  reference_ids: [128 References that depict this lake]
  mythological_layers: [
    {
      name: "Lady of the Lake (Arthurian)",
      tradition: "Arthurian / Welsh",
      figures: ["Vivian", "Nimue"],
      rationale: "Excalibur-giver; Merlin's lover and prison-keeper",
      wikidata_qid: "Q443694",
      diepiri_axis: "west",
      sources: ["Malory, Le Morte d'Arthur", "Welsh Triads"]
    },
    {
      name: "Grain mythology (the agricultural water cycle)",
      tradition: "Slavic / European agrarian",
      figures: ["Mokosh", "Demeter-Persephone analogues"],
      rationale: "Lake as the underworld water that grain seeds drink",
      diepiri_axis: "west"
    },
    {
      name: "Oshun (Yoruba water-deity)",
      tradition: "Yoruba / diaspora",
      figures: ["Oshun"],
      rationale: "Sweet water; gold; love; the river that becomes the lake",
      wikidata_qid: "Q1010294",
      diepiri_axis: "africa"
    },
    {
      name: "Mami Wata (Niger Delta + pan-African)",
      tradition: "Niger Delta / pan-African Atlantic diaspora",
      figures: ["Mami Wata"],
      rationale: "The water-mother of the Atlantic; mirror; comb; serpent",
      wikidata_qid: "Q3293218",
      diepiri_axis: "africa"
    },
    {
      name: "Llyn Llydaw + Llyn Tegid (Welsh lake-mythos)",
      tradition: "Welsh",
      figures: ["Tegid Foel", "Ceridwen"],
      rationale: "Lakes as sites of transformation and rebirth",
      diepiri_axis: "west"
    },
    {
      name: "Lake Biwa (Japanese)",
      tradition: "Japanese",
      figures: ["the goddess Benzaiten"],
      rationale: "Lake as biwa-shaped, koto music, longevity",
      wikidata_qid: "Q207524",
      diepiri_axis: "asia"
    },
    {
      name: "Yamdrok Tso (Tibetan)",
      tradition: "Tibetan Buddhist",
      figures: ["the wrathful deity Dorje Geltrim Ma"],
      rationale: "Sacred turquoise lake; if it dries, life ends in Tibet",
      diepiri_axis: "asia"
    },
    {
      name: "Mímisbrunnr (Norse, Mímir's well)",
      tradition: "Norse",
      figures: ["Mímir"],
      rationale: "Odin gave his eye to drink from it; wisdom-water",
      wikidata_qid: "Q1196418",
      diepiri_axis: "ancient"
    }
  ],

  // Cultural references (specific named works)
  cultural_references: [
    "Tennyson, 'The Lady of Shalott' (1832/1842)",
    "Monet, water-lilies series (1899-1926)",
    "Beyoncé Lemonade, swamp/marshes sequences",
    "Whale Rider (Caro, 2002) — water as ancestral",
    "Tarkovsky, Stalker (1979) — the Zone's water-puddles"
  ],

  // Theme bindings
  theme_ids: ["women-hanging-on-trees", "water-as-mirror",
              "wisdom-from-drowning"]
}
```

That whole stack is one Location. The writer accretes it over
months as their understanding deepens.

## The tagging flow

### From Reference Hub

1. Writer multi-selects References (Ctrl+click; or sweep-select).
2. Click "Tag as Location".
3. Picker modal:
   - **Existing**: list of Locations in current Cube, sorted by
     visual-signature similarity to selected References (so the
     writer's "Violet Lake" pops to the top when the new
     References are visually-similar).
   - **+ New Location**: form for name + Cube + type +
     optional initial mythological layer.
4. On save, all selected References get `location_id` set;
   visual signature recomputed; Location's `reference_ids`
   appended.

### From storyboard slot

Right-click any shot → "Tag location" → same picker. Useful
when the writer is storyboarding and realises a shot belongs to
an existing Location.

### From Vivarium / Ikenga

When the writer imports a new Reference via any path (bookmarklet,
folder, F-modal), if its CLIP embedding is within a similarity
threshold of an existing Location's signature, the Inbox surfaces
a one-click "Add to Violet Lake?" suggestion.

## Mythological accretion — the curation pattern

A Location is never finished. The writer revisits and adds
layers as their reading + practice deepens.

### Diepiri balance enforced

The Location's `mythological_layers` are scored by
`diepiri_axis`. The UI surfaces a balance pip:

```
Mythology balance
  africa:        ●●●○○  3/5
  asia:          ●○○○○  1/5
  west:          ●●●●●  5/5  (over-weighted; consider Asia / Africa next)
  ancient:       ●●○○○  2/5
  contemporary:  ●○○○○  1/5
```

When the writer adds a 6th Western layer to a Location, the UI
suggests African / Asian / Ancient alternatives. Not a forced
rule — a deliberate slow-down. Diepiri balance is the
surfacing default, not a censor.

### Guarded Locations

Some Locations carry weight: mass graves, slave-ship wreck sites,
massacre grounds, environmental-justice sacrifice zones (the
Niger Delta gas-flare sites the writer's lineage knows). These
get `guarded: true` and the read-first treatment from the
Themes architecture:

- A momentary pause-pane on first open, surfacing the historical
  weight before the visual material.
- Mythological layers pre-sorted to surface witness-side first
  (Hartman / Saro-Wiwa) before formal-aesthetic side.
- Confirmation step on first use in a new Sphere.

## What Locations enable

### Re-surfacing across Spheres

A Cube has a collection of Locations: Violet Lake, Iron Throne,
The Mangrove, The Switchback Road. When the writer creates a new
Sphere in that Cube, the Location panel surfaces:

```
"This world's Locations"
  ┌─────────────────┐ ┌────────────────┐ ┌──────────────┐
  │ ◐ Violet Lake   │ │ Iron Throne    │ │ The Mangrove │
  │ 128 references  │ │ 64 references  │ │ 92 refs       │
  │ 8 mythos layers │ │ 3 mythos       │ │ 6 mythos     │
  │ ★ Balanced 4/5  │ │ ★ Balanced 3/5 │ │ guarded ⚠    │
  └─────────────────┘ └────────────────┘ └──────────────┘
```

Click a Location card → expand → see all References, all
mythological layers, all cultural references, all Themes. Drag
any Reference into the new Sphere's rough cluster. The new
Sphere inherits the Location's mythological weight automatically.

### Storyboard shot binding

A SeriesItem can declare `location_id`. When set:

- The compile worker writes the Location name into the
  Provenance Receipt.
- The Lukasa receipt cites every mythological_layer + cultural
  reference as ambient lineage even when no specific Reference
  from the Location is used.
- The slot card on the storyboard rail shows a tiny pin glyph
  with the Location's name on hover.

### Provenance + LRC integration

When a Sphere releases, every Location it touches contributes:

- The Location's mythological layer scholars get cited (Saidiya
  Hartman, Robin Wall Kimmerer, etc., when their work is in the
  Location's sources).
- The Location's cultural reference creators flow into LRC
  distribution (the Monet estate, the Beyoncé production crew,
  the Tarkovsky estate).
- The Location's own historical sources (where applicable —
  e.g. the Niger Delta gas-flare sites might cite UNEP reports,
  Saro-Wiwa's family) get attribution.

The Location becomes a named *bundle of debts the writer pays
through the work*. Cultural credit, ancestral credit, payment.

### Theme + Location compounding

A Theme can be bound to a Location ("women hanging on trees" is
strongly bound to specific tree-Locations the writer collects).
A Location can be tagged with multiple Themes (Violet Lake is in
dialogue with "water as mirror" AND "wisdom from drowning" AND
"the lake-as-portal" Themes).

The writer's atlas grows: Locations × Themes × References ×
Cultural Refs × Archetypes = the cultural geography of their
practice, queryable as one graph.

## Connection to the writer's existing methodology

| | How Locations plug in |
|--|-----------------------|
| **PLATs** | Each Location is a named region in the writer's latent space — same as Themes but place-anchored. |
| **Odugraphy** | A Location can carry an `odu` binding. Violet Lake under Òfún Méjì (the odu of purity / clarity). The cipher meets the place. |
| **Geomancy** | Geomancy reads patterns in the ground. Locations name the specific places where the writer reads such patterns. |
| **Diepiri-balanced canon** | Location mythological layers enforce the 5-axis balance by default. |
| **African fractal accretion** | A Location can contain sub-Locations (Violet Lake → "the mossy edge" → "the rusted boat"). Fractal nesting per Eglash. |
| **Lukasa / LRC** | Location mythological layers + cultural references cite scholars and creators at release. |
| **Bóveda Cube / Zone / Sphere** | Locations live in Cubes, optionally pin to Zones. Spheres inherit a Cube's Locations. |
| **Vivarium / PLATS-Bioacoustic** | A Location IS a Relic with kind=location. Ecological + mythological readings co-habit one record. The Niger Delta gas-flare site is a Vivarium Relic AND a mythological Location. |
| **Themes** | Locations bind to Themes. Same Theme can recur at multiple Locations. |
| **Slayt** | A Location's mythological body can become a Field Notes essay. The writer's article on Violet Lake is one Location's accumulated readings rendered as prose. |

## Concrete UI

### Location detail page (in Bóveda Studio)

```
┌────────────────────────────────────────────────────────────────┐
│ Violet Lake                                       [Edit]       │
│ in Cube: Eden  · Zone: Bondage · type: lake                    │
│ 128 references · 8 mythos layers · ⚠ guarded                   │
│                                                                │
│ [hero image — CLIP centroid render or selected reference]      │
│                                                                │
│ Mythology balance   ●●●○○ africa · ●○○○○ asia · ●●●●● west     │
│                     ●●○○○ ancient · ●○○○○ contemporary         │
│                                                                │
│ MYTHOLOGICAL LAYERS                                            │
│   ◐ Lady of the Lake (Arthurian)            west / ancient    │
│   ◐ Grain mythology                          west             │
│   ◐ Oshun (Yoruba water-deity)               africa           │
│   ◐ Mami Wata                                africa           │
│   ◐ Mímisbrunnr (Norse)                      west / ancient   │
│   ◐ Lake Biwa (Japanese Benzaiten)           asia / ancient   │
│   ◐ Yamdrok Tso (Tibetan)                    asia / ancient   │
│   ◐ Llyn Llydaw + Llyn Tegid (Welsh)         west / ancient   │
│   [+ Add layer]                                                │
│                                                                │
│ CULTURAL REFERENCES                                            │
│   Tennyson, 'The Lady of Shalott' (1832)                       │
│   Monet, water-lilies series (1899-1926)                       │
│   Beyoncé Lemonade, swamp/marshes sequences                    │
│   Whale Rider (Caro, 2002)                                     │
│   Tarkovsky, Stalker (1979) — the Zone's water-puddles         │
│   [+ Add reference]                                            │
│                                                                │
│ THEMES BOUND                                                   │
│   ◐ women hanging on trees                                     │
│   ◐ water as mirror                                            │
│   ◐ wisdom from drowning                                       │
│                                                                │
│ REFERENCES (128)                                               │
│   [grid of all tagged References]                              │
│                                                                │
│ DESCRIPTION                                                    │
│   [writer's free-text body_md]                                 │
└────────────────────────────────────────────────────────────────┘
```

### Tagging modal (in Reference Hub / storyboard)

```
┌────────────────────────────────────────────────┐
│  Tag 7 selected References as a Location       │
│                                                │
│  ( ) Existing Locations in Cube "Eden":        │
│      ◐ Violet Lake (128 refs · 8 mythos)       │
│      ◐ Iron Throne (64 refs · 3 mythos)        │
│      ◐ The Mangrove (92 refs · 6 mythos · ⚠)   │
│      ...                                       │
│                                                │
│  (•) New Location                              │
│      Name:        [Violet Lake          ]      │
│      Cube:        [Eden ▼]                     │
│      Type:        [lake ▼]                     │
│      Initial mythology (optional):             │
│        Tradition:  [Welsh ▼]                   │
│        Layer name: [Lady of the Lake     ]     │
│        Rationale:  [Excalibur-giver…    ]      │
│                                                │
│  [Cancel]   [Tag and Create]                   │
└────────────────────────────────────────────────┘
```

## Schema (extension to the existing Vivarium Relic)

```
Relic additions (only populated when kind=location):
  location_type             "lake" | "mountain" | "river" | "sea"
                          | "marsh" | "forest" | "ruin" | "island"
                          | "sky" | "cave" | "underworld"
                          | "settlement" | "road" | "field" | "other"
  visual_signature          vector (CLIP centroid of tagged References)
  mythological_layers       [ MythologicalLayer ]
  cultural_references       [ CulturalRef ]  (same shape as elsewhere)
  theme_ids                 [ Theme IDs ]
  reference_ids             [ Reference IDs that ARE this location ]
  guarded                   bool

MythologicalLayer {
  name                      "Lady of the Lake (Arthurian)"
  tradition                 free text — "Welsh", "Yoruba", "Japanese"
  figures                   [ named figures: "Vivian", "Nimue" ]
  rationale                 writer's free text on why this layer is in
  wikidata_qid              when applicable
  diepiri_axis              africa | asia | west | ancient | contemporary
  sources                   [ scholarly / primary citations ]
  added_at                  timestamp (chronicles accretion over time)
}
```

## Build order

### Phase 1 — Schema + create / edit + tag flow

Extend Relic with the location_type + mythological_layers +
cultural_references + theme_ids + visual_signature + guarded
fields. Location detail page in Bóveda Studio. Multi-select →
Tag-as-Location in Reference Hub (when Reference Hub Phase 1
ships).

Half-week.

### Phase 2 — Diepiri-balance pip + suggestion engine

UI shows the 5-axis balance. When the writer adds a layer that
unbalances it, the system suggests under-represented axes' canon
("you have 5 Western layers; consider one from the Yoruba water-
deity canon: Oshun, Yemoja, Olokun").

Half-week.

### Phase 3 — Visual-signature auto-suggestion

CLIP centroid + nearest-neighbour on every new Reference. The
Inbox surfaces "Add to Violet Lake?" suggestions when a new
Reference is within similarity threshold.

Half-week.

### Phase 4 — Sphere inheritance + storyboard binding

When a Sphere is created in a Cube, the Cube's Locations
auto-surface in the Sphere's moodboard panel. SeriesItems can
declare `location_id`; compile worker writes the Location name
to the receipt; slot card shows the pin glyph.

Half-week.

### Phase 5 — Theme + Location cross-binding

Mutual bindings between Themes and Locations. UI: from a Theme,
list its bound Locations. From a Location, list its bound
Themes.

Half-week.

### Phase 6 — Provenance + LRC integration

At Sphere release time, Location mythological layers' scholars +
cultural references' creators get cited in the Provenance
Receipt and flow into LRC distribution.

Half-week.

### Phase 7 — Guarded Location treatment

Read-first pane, sort-witness-first, confirmation on first use
in a new Sphere. Same pattern as Themes.

Quarter-day (mostly UI work).

## Smallest first ship — Phase 1 only

1. Prisma migration extending Relic with the new optional
   fields (location_type, visual_signature, mythological_layers
   as JSON, cultural_references as JSON, theme_ids as String[],
   reference_ids as String[], guarded).
2. Studio page at `/cubes/[id]/locations` showing a list +
   New Location form.
3. Location detail page with the layout sketched above.
4. Multi-select → "Tag as Location" picker in Reference Hub
   (when Reference Hub Phase 1 ships) and in the storyboard
   slot right-click menu.

Half-week. Validates the schema. The writer can hand-encode
Violet Lake with the 8 mythological layers above as the first
canonical example. Future phases compose on top.

## TL;DR for the writer

- A Location is a first-class place in a Cube. Named, typed,
  shared across References.
- Multi-select References → "Tag as Location" → all tagged at
  once. New Location forms inherit the visual signature
  immediately.
- Mythology accretes over time. "Violet Lake" can carry Lady of
  the Lake + Grain mythology + Oshun + Mami Wata + Mímisbrunnr +
  Benzaiten + Yamdrok Tso + Llyn Tegid as separate named layers,
  each with its tradition + figures + rationale + Diepiri axis.
- Diepiri balance pip enforces 5-axis canon at the Location
  level; the UI suggests under-represented axes when you accrete.
- Sphere inheritance: every new Sphere in a Cube auto-surfaces
  the Cube's Locations as available material.
- Guarded Locations (mass graves, sacrifice zones, EJ harm
  sites) get read-first treatment to insist that witness
  precedes aesthetic.
- Lukasa Provenance Receipts cite Location mythological scholars
  + cultural references at release time. LRC distributes credit.
- Vivarium Relics with kind=location ARE Locations; one schema,
  ecological + mythological readings co-habit.

Tell me to ship Phase 1.
