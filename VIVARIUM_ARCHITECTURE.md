# Vivarium

> Wired into the ecosystem graph: [[Boveda]] · [[Ikenga]] ·
> [[Resonate]] · [[Crucibla]] · [[PERI]] · [[Chromox]] · [[AI-8O]] ·
> [[Lukasa]] · [[Slayt]] · [[PLATS]] · [[Odugraphy]]

The cross-app discovery layer for **PLATS – Bioacoustic**: the
natural-world wing of the user's PLATS (latent cartography)
movement. The methodology is PLATS-Bioacoustic; the operational
layer that implements it is Vivarium. The methodology gets the
manifesto; the tool gets the door handle.

Writer's reference for the article: [[ARTICLE_NOTES_PLATS_BIOACOUSTIC]].

## Vivarium is a layer, not a destination

The Relic data model and ingest API live inside **Bóveda**, because
every Relic binds to Cubes / Zones / Spheres / Stelas / Ciphers /
Characters via its `refs[]`. The world-OS owns the world's
references. That includes Vivarium's catalogue.

The surfaces — the places a writer actually USES Vivarium — sit
inside the apps it feeds:

| Surface | App | What lives here |
|---------|-----|-----------------|
| Discovery side panel | **Ikenga** | Visual Relics, range maps, photogrammetry references bound to the current storyboard's Sphere / Zone. Drag a Relic image into a shot. |
| Vivarium browser | **Resonate** | Audio Relics, sonification scores, EcoScore renderer, raw + rendered playback. Pull a Relic stem into a Resonate session. |
| Listening Room | **Resonate** | Phase 6. The spatial scroll across every Relic bound to a Cube. Quiet, slow. |
| Field Notes seed | **Slayt** | One Relic → one Substack / Are.na post draft. Discovery becomes credentialing. |
| Sphere physics extension | **Bóveda** | A Sphere's `physics_json` references a Relic so the world's reality column gains depth. |
| Provenance receipt | **Lukasa** | Every Relic citation auto-recorded so downstream art has clear sources. |
| Latent traversal seed | **PERI** | Audio Relic → RAVE latent seed. Loaded via the existing nn~ patch. |
| Crucibla layer | **Crucibla** | Sonified WAV becomes a layer with inferred BPM + key. |
| Voice-pack augmentation | **AI-8O / Chromox** | Field-recorded animal calls condition the Mmuo register voice packs. |
| TouchDesigner patch | **TouchDesigner** | `.toe` template emitter pre-wires the Relic into a TD project. MCP bridge already exists. |
| Unreal asset | **Unreal** | Asset path + Blueprint for point clouds + species-range Niagara emitters. |

So when the user says "make a new Relic", the writing happens in
Bóveda. When they say "use this Relic in a storyboard", that's
Ikenga's Discovery panel. When they say "play this Relic", that's
Resonate.

This is the same pattern Imprint / StanVault uses across the
ecosystem: one data home, many surfaces. The data lives where the
graph already lives; the surfaces live where the work already
happens.

Vivarium can later split into its own deployment if the ingest
volume justifies it; the contract above (Relic + refs + EcoScore)
stays stable.

This is not a tab. This is a practice that braids five disciplines
into one operating surface:

```
ecoacoustics  +  biodiversity informatics  +  geospatial ecology
                          +
        data sonification  +  queer ecological media art
```

Architected as a six-layer stack. Each layer ships independently;
every project under the user's ecosystem becomes a signal discovery
engine that walks all six.

The cross-modal contract: every Relic that lands here is *also* a
parameter source for PERI, Crucibla, Resonate, Ikenga, and Bóveda's
Sphere physics. Discovery becomes input, not decoration.

Mood: Discovery Channel meets club system.

## The six-layer stack

```
1. Field signal       (forest, lake, reef, wetland, city, cave,
                       archive, animal, machine, body)
2. Scientific capture (hydrophones, contact mics, geophones,
                       ultrasonic mics, field recorders, eDNA,
                       LiDAR, satellite, thermal, drone photogrammetry)
3. Intelligence       (species ID, anomaly detection, acoustic
                       indices, ecological metadata, GIS location,
                       time, weather, migration patterns)
4. Sonification       (ecological variables → rhythm, harmony,
                       texture, modulation, spatial audio, feedback)
5. Visualisation      (GIS maps, spectral waterfalls, 3D
                       landscapes, point clouds, neural maps,
                       Unreal / TouchDesigner ecosystems)
6. Mythic / art       (queer ecology, African futurism, gothic
                       natural history, non-human ritual, the
                       club-system frame)
```

Each Relic carries fields for each layer. A new Relic is "thin" at
layer 6 and gets fattened as the writer iterates. Layer 6 is
non-optional — every Relic must declare its mythic posture so it
never reads as taxidermy.

## Seed catalogue (Layer 1 — Field signal)

The phenomena the user wants captured. These aren't random
examples; each is its own subfield with established capture
protocols. Vivarium ships with a small named registry so the
first hundred Relics have a shape to land into.

| Phenomenon | Capture (Layer 2) | Intelligence (Layer 3) | Why it matters |
|------------|-------------------|------------------------|----------------|
| Infrasonic elephant communication | Geophones + low-freq mics, 5-35 Hz band | Cornell ELP, Joyce Poole's catalog, ELOISE protocol | Long-range, ground-coupled, mostly inaudible to humans. The "rumble" carries 10+ km. |
| Seismic ground transmission (all species) | Geophones, 1-100 Hz | Karen Warkentin (frog egg vibration), Peggy Hill (insect substrate signalling) | Whole world of animal communication via dirt. Bias-busting alternative to acoustic-first ecology. |
| Whale calls | Hydrophones, 10 Hz – 24 kHz | Hal Whitehead (culture), Christopher Clark (NOAA), Cornell BRP | Cetacean dialect carries clan culture. Each sperm whale clan has its own coda. |
| Coral reef acoustic signatures | Hydrophones, omnidirectional + array | Steve Simpson (Exeter), Tim Lamont (Lancaster) | Reef chorus collapses with bleaching. Audio as health diagnostic. |
| Volcanic tremor | Broadband seismometers, 0.01-100 Hz | USGS HVO, IRIS | Tremor predicts eruption. Sonified at 100x speed it becomes a drone instrument. |
| Glacial cracking | Cryoseismometers, contact mics | EastGRIP, Drift+Noise pipeline | Climate evidence as music. Each crack is a calving event measured. |
| Bat echolocation | Ultrasonic mics, 20-200 kHz, BAR-LT etc. | BatDetective, Tadarida pipeline | Time-expansion brings ultrasound into the audible. Species-specific calls. |
| Soil microbiome data | eDNA + qPCR + metagenomic sequencing | EarthMicrobiome Project, MGnify, QIIME2 | Read soil as a community. Diversity → spectral richness mapping. |
| eDNA traces | Filter samplers + sequencer | Cornell eDNA Initiative, NatureMetrics | Detect species without seeing them. The "ghost census". |
| Astronomical data | NASA / ESA / radio telescope archives | Heliophysics, LIGO public data, NICER X-ray | Pulsar timing, gravitational chirps, solar wind, magnetosphere. Already a sonification tradition. |

Each phenomenon in the registry declares its band, its standard
units, its typical sample rate, and a default sonification mapping
so a Relic of that kind has a working sound on day one.

## Why the five disciplines

## Why the five disciplines

| Discipline | What it brings | Existing tools we read from |
|------------|---------------|------------------------------|
| **Ecoacoustics** | Listening as method. Biophony / geophony / anthrophony. Acoustic indices as fingerprints of habitat health. | `scikit-maad` (Python), Wildlife Acoustics SongMeter, Audiomoth, BirdNET |
| **Biodiversity informatics** | Names, distributions, IUCN status. The taxonomic and occurrence backbone. | GBIF, iNaturalist, eBird, OBIS, Map of Life, IUCN Red List API |
| **Geospatial ecology** | Where things live and why. Range maps, habitat suitability, climate envelopes. | Google Earth Engine, MapBiomas, Sentinel / Landsat, GBIF density grids |
| **Data sonification** | The translation. Mapping environmental data to audible parameters. Past the spectrogram. | SuperCollider, Pure Data, scikit-maad, sonic-pi, custom DSP |
| **Queer ecological media art** | The framing. Refuses the human / nature binary. Sympoiesis. The intrasonic elephants near the black hole void as serious epistemology, not gimmick. | Haraway, Tsing, Alaimo, Barad, Sandilands, Kimmerer, Whyte, Saro-Wiwa |

## Vocabulary

A **Relic** is the unit. Sharpened for the ecology lane, with one
field per layer of the stack so the data shape stays honest.

```
Relic {
  id                  cuid
  kind                location | species | phenomenon | tech | method | recording
  title               "Intrasonic elephant rumble near Mwenga shaft 12"

  // Layer 1 — Field signal
  phenomenon_key      one of the seed catalogue keys
                      (infrasonic_elephant | seismic_substrate | whale_call |
                       reef_chorus | volcanic_tremor | glacial_cracking |
                       bat_echolocation | soil_microbiome | edna_trace |
                       astro_sonification | custom)
  field_site          free text + lat/lng of the actual capture site

  // Layer 2 — Scientific capture
  capture_method      hydrophone | contact_mic | geophone | ultrasonic_mic |
                      field_recorder | edna_sampler | lidar | satellite |
                      thermal | drone_photogrammetry | archival
  capture_gear_notes  free text on rig: SongMeter Mini Bat, OPUS sampler,
                      QHY camera, etc.
  raw_sample_url?     immutable original (no destructive edits — same
                      moat-protection as STT raw)

  // Layer 3 — Intelligence
  taxon_path?         "Animalia > Chordata > Mammalia > Proboscidea > Elephantidae > Loxodonta africana"
  ncbi_taxid?         9785
  gbif_taxonkey?      2440447
  iucn_status?        VU | EN | CR | LC | DD | NT
  occurrences?        [{ lat, lng, date, observer, source, count }]
  habitat?            "Miombo woodland, seasonally inundated"
  range_geojson?      { type: "Feature", geometry: { ... } }
  weather_at_capture? { temp_c, wind_ms, precipitation_mm, lunar_phase }
  acoustic_indices?   { ACI, NDSI, BI, ADI, AEI, H }
  detected_species?   [{ name, confidence, model }]   BirdNET / batdetect2 etc.

  // Layer 4 — Sonification
  default_score_id?   EcoScore id wired in for the default sonification
  rendered_outputs?   [{ score_id, format, url, duration_s }]

  // Layer 5 — Visualisation
  spectrogram_url?    rendered + cached
  waterfall_url?      spectral waterfall PNG
  point_cloud_url?    LiDAR / photogrammetry .ply or .las
  gis_layer_url?      GeoJSON or Mapbox tile
  td_patch_ref?       TouchDesigner .toe with this Relic baked as input
  unreal_actor_ref?   Unreal asset path

  // Layer 6 — Mythic / art
  strangeness         0-1   how cutting-edge / queer / unique
  saro_index          0-1   environmental-justice salience (named for Ken Saro-Wiwa)
  mythic_posture      free text — the angle. "the elephant is grieving the
                      mine, not the season". Required.
  body_md             long-form notes

  refs {
    cube_ids[]        Bóveda Cubes this Relic colours
    zone_ids[]        Zones this Relic seeds
    sphere_ids[]      Spheres that ship with this Relic in their physics
    stela_ids[]       Stelas bound to this Relic
    cipher_ids[]      Ciphers / odu / ifa figures this Relic carries
    character_ids[]   Characters that wear / channel / inherit this Relic
  }
  source_provenance   GBIF | iNaturalist | xeno-canto | Macaulay | OBIS |
                      Earth Engine | arXiv | manual | field
  source_url
  ingested_at
}
```

Two indices worth naming because they steer everything:

- **strangeness** — keyed to the user's PLATs movement and to queer
  ecology's refusal of "normal". A common pigeon scores low; a slime
  mould solving the Tokyo subway scores high.
- **saro_index** — environmental justice salience, named for Ken
  Saro-Wiwa. Honours the user's Niger Delta lineage and frames
  ecology as politics. A Bonny mangrove kill site scores 1.0. A
  rare lake nobody is destroying scores low. This is not an excuse
  to ignore the lake; it is a frame so the writer always knows
  where each Relic sits on the harm / wonder axis.

## Real data sources (no vapor)

Every source below has a public API or CC-licensed bulk download.
None of this is "we'll figure it out".

### Biodiversity informatics

| Source | URL | What it gives | Auth |
|--------|-----|---------------|------|
| GBIF | `api.gbif.org/v1` | Species occurrence, taxonomy, distributions | Open |
| iNaturalist | `api.inaturalist.org/v1` | Citizen observations, photos, audio | Token (free) |
| eBird | `ebird.org/api` | Bird observations (Cornell) | Free key |
| OBIS | `api.obis.org` | Ocean biodiversity | Open |
| Map of Life | `mol.org/api` | Range maps, completeness scores | Open |
| IUCN Red List | `apiv3.iucnredlist.org` | Conservation status | Free token |
| NCBI Taxonomy | `eutils.ncbi.nlm.nih.gov` | Canonical taxon path | Open |
| GBIF Atlas of Living Australia mirror | `bie.ala.org.au` | Richer Aussie taxonomy | Open |

### Ecoacoustics

| Source | URL | What it gives | Auth |
|--------|-----|---------------|------|
| xeno-canto | `xeno-canto.org/api/2` | World's largest bird recording archive (CC) | Open |
| Macaulay Library | `macaulaylibrary.org/asset/` | Cornell archive, audio + video | Account |
| Tierstimmenarchiv | `tierstimmenarchiv.de` | Berlin museum animal sounds | Open |
| BBC Sound Effects | `sound-effects.bbcrewind.co.uk` | 33k CC BY-NC effects | Open |
| Freesound | `freesound.org/apiv2` | CC-licensed sound, tag-searchable | Token |
| Cornell ROBIN | (preprint pipeline) | Underwater + terrestrial passive monitoring | Open |
| ARBIMON / RFCx Arbimon | `arbimon.rfcx.org` | Acoustic monitoring datasets | Open |
| BirdNET-Analyzer | github | On-device passive acoustic ID | Open source |

### Geospatial ecology

| Source | URL | What it gives | Auth |
|--------|-----|---------------|------|
| Google Earth Engine | `earthengine.google.com` | Satellite + analysis | Free for research |
| Sentinel Hub | `sentinel-hub.com` | Sentinel-2 surface imagery | Free tier |
| MapBiomas | `mapbiomas.org` | Land cover, 30+ year time series | Open |
| OpenStreetMap Nominatim | `nominatim.openstreetmap.org` | Geocoding | Open |
| World Database on Protected Areas | `protectedplanet.net` | Park boundaries | Open |

### Capture rigs (Layer 2 — what we recommend)

| Rig | What it captures | Cost order |
|-----|------------------|------------|
| AudioMoth + SD card | Field passive audio, sub-£90, weeks of recording | low |
| Wildlife Acoustics SongMeter Mini Bat | Ultrasonic bat detection | mid |
| Aquarian H2a hydrophone | Underwater entry-level | low-mid |
| Geofón / Geospace GS-11D geophone | Substrate seismic | mid |
| LOM Geofón LMG | Compact geophone, art-world favourite | mid |
| Sennheiser MKH series + Sound Devices MixPre | Pro field recording chain | high |
| Aurelia eDNA filter sampler | Citizen-tier eDNA | mid |
| DJI L1 / L2 LiDAR | Site photogrammetry | high |
| Sentinel-2 satellite (free download) | 10 m surface imagery | free |
| Pulsar timing archive (PTA) | Astronomical sonification | free |

### Visualisation backends (Layer 5)

| Backend | Strength | Existing infra |
|---------|----------|----------------|
| TouchDesigner | Spectral waterfalls, GIS overlays, point-cloud playback, live driving from a Relic's audio | Already MCP-bridged in the user's environment (`touchdesigner-mcp-server`). Vivarium emits a `.toe` template pre-wired to a Relic's audio stem and spectrogram. |
| Unreal | 3D landscape from photogrammetry / LiDAR, MetaHuman binding, niagara particle from species density | Existing Unreal MCP. Vivarium emits an asset path + Blueprint that loads Relic point clouds + species range as Niagara emitters. |
| Mapbox GL JS | Web-side range maps, density grids, time-slider for migration | Frontend Library. Used in the Listening Room. |
| Pyo + matplotlib (server-side) | Render spectrograms, waterfalls, FFT GIFs for the Relic card | Cheapest; default render. |
| Web Audio + Three.js | The web Listening Room. Spatial relic playback. | Frontend. |

### Cutting-edge / queer / strange (the PLATs angle)

| Source | Why it matters |
|--------|----------------|
| `arXiv` q-bio, eess.SP, eess.AS | Preprints on novel acoustic monitoring, sonification, swarm intelligence |
| Glow-in-the-dark fungi (Mycena chlorophos etc.) | Bioluminescence as natural visualization |
| Slime mould computing (`Physarum polycephalum`) | Non-neural intelligence |
| Plant electrical signalling research (Mancuso lab) | The "plant action potential" |
| Whale culture / dialect papers (Hal Whitehead) | Species as culture-bearing |
| `Frontiers in Ecology and Evolution` open issues | Queer ecology adjacent work |
| BBC Earth Sounds + Smithsonian Folkways Animal Sounds | Public archives |

## Sonification engine

Past the spectrogram. The engine takes a Relic and emits audio that
*means* something. Mappings live in named "scores":

```
EcoScore.gbif_density_to_filter:
  - source: GBIF occurrence count grid for taxon X across a polygon
  - target: low-pass cutoff in Hz over time
  - rule:   density log-scaled, cutoff = 200 + 8000 * log(d + 1)

EcoScore.acoustic_complexity_to_tempo:
  - source: ACI from scikit-maad on the audio_sample
  - target: BPM
  - rule:   60 + 80 * normalise(ACI)

EcoScore.iucn_status_to_dissonance:
  - source: IUCN status (LC..CR)
  - target: harmonic ratio
  - rule:   LC=consonant, CR=tritone+

EcoScore.range_centroid_to_pan:
  - source: lat/lng centroid of range map
  - target: stereo pan + reverb tail
  - rule:   pan = lng/180, tail = abs(lat)/90 * 4s

EcoScore.strangeness_to_modulation_depth:
  - source: Relic.strangeness
  - target: FM modulation index on Resonate
  - rule:   depth = 0.5 + 4 * strangeness
```

Implementation: a small Python service `eco_sonifier` exposing
`POST /sonify { relic_id, score_id, output_format }` returning a
WAV or a Crucibla layer JSON or a Resonate preset.

DSP backend candidates (rank in order of fit):

1. `pyo` — Python audio DSP, fast prototyping
2. `scikit-maad` — for the acoustic-index computation specifically
3. SuperCollider OSC bridge — when the score needs synth depth
4. Tone.js — for a "Listening room" web preview

Caching: rendered WAVs land in `storage/sonifications/<relic_id>_<score_id>.wav`.

## Cross-modal cables

A Relic isn't a reference image. It is a parameter source. Concrete
pipes:

| Pipe | What flows |
|------|------------|
| Relic → **PERI** | Audio sample becomes a latent traversal seed. PERI's nn~ patch loads the WAV, encodes it into the trained RAVE latent space, navigates by EcoScore. The intrasonic elephant rumble drives PERI's voice through a corresponding region of the user's father's voice latent. |
| Relic → **Crucibla** | Sonified WAV registered as a new Crucibla project layer with BPM + key inferred. Bound to a track via `crucibla_track_id`. |
| Relic → **Resonate** | EcoScore output mapped onto Resonate FM-synth control parameters. Real-time mode: a passive AudioMoth feed mid-session becomes a slow modulation. |
| Relic → **AI-8O / Chromox** | Field-recorded animal calls become voice-pack training augmentation — Mmuo register conditioned by species. The "lion-mother" register fed by real lion roars. |
| Relic → **Ikenga** | Visual sample + range map land as references in a SeriesItem's `sankore_candidates_json`. Bound Relics surface in a "Discovery" side panel on SeriesDetail. |
| Relic → **TouchDesigner** | A `.toe` template is emitted per Relic with the audio + spectrogram + GIS layer pre-wired. Drop into the existing TD pipeline; the MCP bridge already lives. |
| Relic → **Unreal** | Asset path + Blueprint emitted for 3D capture (LiDAR / photogrammetry) and for species-range Niagara particle systems. MetaHumans can be re-coloured by `mythic_posture`. |
| Relic → **Bóveda Sphere** | Sphere's `physics_json` extends with `relic_id` + `strangeness` + `saro_index`. A `time_flow: "branched"` Sphere holding a fungal-network Relic uses the slime-mould route as the branching topology. |
| Relic → **Lukasa** | Source citation auto-recorded so any downstream art has provenance receipts. Honours the consent-and-credit posture. |
| Relic → **Slayt** | Discovery posts to the credentialing layer (Substack / Are.na) seeded by a Relic. Field Notes episodes write themselves around the strangeness + saro_index axes. |

## Queer ecological framing (not decoration)

The user's lineage already carries this. Vivarium names it
explicitly so collaborators reading the doc understand the posture:

- **Donna Haraway** — Chthulucene, "tentacular thinking", staying with the trouble.
- **Anna Tsing** — *The Mushroom at the End of the World*. Pericapitalist ecologies.
- **Stacy Alaimo** — *Bodily Natures*. Trans-corporeality.
- **Karen Barad** — Diffraction, agential realism, queer atoms.
- **Catriona Sandilands** — *Queer Ecologies*. The eponymous text.
- **Robin Wall Kimmerer** — *Braiding Sweetgrass*. Potawatomi, anti-colonial science.
- **Kyle Powys Whyte** — Indigenous environmental ethics, Anishinaabe.
- **Ken Saro-Wiwa** — Ogoni, Niger Delta. The hanged writer. The `saro_index` is named for him.
- **Edith Widder** — Deep-sea bioluminescence. The unrelenting strangeness of life at depth.
- **Octavia Butler / N.K. Jemisin / Ursula Le Guin** — Speculative grounding.

The user's own contributions sit alongside this lineage, not under
it: **PLATs** (latent cartography movement), **geomancy as method**,
**Niger Delta + Bonny + Opobo ecological knowledge**, **the
intrasonic-elephant-near-the-black-hole-void as a real epistemic
move**.

## Discovery Channel posture (the affect)

The user said "I'm thinking very much Discovery Channel". Translate:

- **Wonder without sanitising.** Show the fungus eating the carpenter ant.
- **Specificity over genre.** Not "rainforest" — "the Sundaland lowland forest of Kalimantan during the 1998 fire year".
- **Voice that holds knowledge without flexing it.** Attenborough's restraint, Saro-Wiwa's testimony, Kimmerer's reciprocity. Not National Geographic's exoticising gaze.
- **The strange and the political in one frame.** A radio-tagged bonobo IS the politics of bonobo conservation IS the queer ecology of female-coalition primates. Don't pick one.

## Build path

Six phases, one per layer of the stack. Each ships independently;
each adds depth to every existing Relic without forcing rework.

### Phase 1 — Manual intake + xeno-canto importer (Layer 1 + 2)

Smallest useful surface. Adds the `Relic` table to Bóveda. A `+ New
Relic` modal with the schema above. One auto-importer:

```
POST /relics/import_from_url
  body: { url: "https://xeno-canto.org/123456" }
```

Parses xeno-canto's recording id, fetches metadata via their public
API (sci name, recordist, location, license), downloads the audio,
fills the Relic. Same shape extensible to GBIF + iNaturalist URLs.

UI: a Discovery tab in Bóveda Studio listing Relics as cards with
the strangeness + saro_index pips, taxon path, source provenance.

### Phase 2 — GBIF + iNaturalist binding (Layer 3 — Intelligence)

Free-text taxon search box that hits GBIF, suggests scientific
names with ranks. Attach a GBIF taxonkey to a Relic so future
occurrence queries (range maps, density) work.

iNaturalist observation-id parser same as xeno-canto.

### Phase 3 — Sonifier service (Layer 4 — Sonification)

Python `eco_sonifier` microservice with the named EcoScores. POST a
relic_id + score_id, get a WAV. Surface a player on the Relic
detail page so the writer can audition every score for every Relic.

### Phase 4 — Visualisation emitters (Layer 5)

Pyo + matplotlib renders the spectrogram + waterfall server-side
at ingest. TouchDesigner `.toe` template emitter wires the Relic's
audio + spectrogram + GIS layer into a pre-built TD project that
runs through the existing MCP bridge. Unreal emitter produces an
asset path + Blueprint that loads the Relic's point cloud (when
present) and species-range Niagara emitters. Mapbox tiles for the
Listening Room.

### Phase 5 — Cross-modal cables (full ecosystem)

In this order:

1. **Relic → Ikenga.** A Discovery side panel on SeriesDetail
   listing Relics bound to the storyboard's Sphere / Zone. Drag a
   Relic image into a shot's `evolved_image_url`.
2. **Relic → Crucibla.** Sonified WAV becomes a Crucibla layer.
3. **Relic → Resonate.** EcoScore parameter output drives Resonate.
4. **Relic → PERI.** WAV becomes latent traversal seed.
5. **Relic → Bóveda Sphere.** Physics extension.

### Phase 6 — Listening room + Mythic editor (Layer 6 made daily)

A web UI that plays every Relic bound to a Cube as an evolving
soundscape. Geographic layout — Relics positioned by lat/lng,
panning follows pointer. Quiet, slow, scrollable.

## Recommendation for what I would scaffold today

Phase 1. Concretely:

- Prisma migration: `Relic` model on Bóveda with the schema above
  (minus the cross-modal cables — those land in Phase 4).
- Fastify route `/relics` CRUD.
- Fastify route `/relics/import_from_url` with xeno-canto parser.
- Studio API client + a `Discovery` page at `/discovery` in
  Bóveda Studio with the card grid and the New Relic modal.

One pass. Ships today. The `Relic.refs` array carries the binding
back to Cubes / Zones / Spheres / Stelas so once Phase 1 lands,
every later phase plugs into the same surface.

## Naming, locked

- **Methodology + article** — PLATS-Bioacoustic.
- **Operational layer** — Vivarium.
- **Where it lives** — Bóveda data + API, with surfaces in Ikenga
  (Discovery panel) and Resonate (browser + Listening Room).

Phase 1 is the Relic model + xeno-canto importer in Bóveda. The
Ikenga Discovery panel ships in Phase 5 (cross-modal cables);
Resonate UI lives in Resonate when Resonate ships.
