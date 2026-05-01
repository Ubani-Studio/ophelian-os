/**
 * Subtaste Classification Module
 * 12 Subtaste designations, archetype-to-subtaste mapping, and creative pipeline phases.
 *
 * Pipeline phases encode *when* in a creative process each glyph is most potent,
 * inspired by Team Dimensions Profile but expressed in native Bóveda vocabulary.
 * See docs/analysis-external-profiling-frameworks.md for the full rationale.
 *
 * Ported from Slayt characterGenerator.js
 */

// ============================================================================
// SUBTASTE DESIGNATION TYPE
// ============================================================================

/**
 * Creative pipeline phase — when in a creative process this glyph is most potent.
 *
 * genesis       — ideation, destruction of old forms, raw creation
 * vision        — scouting, direction-setting, early pattern recognition
 * refinement    — structural analysis, editing, quality control
 * manifestation — patient execution, relentless driving
 * flow          — channeling, bridging, preserving, holding space
 */
export type CreativePhase = 'genesis' | 'vision' | 'refinement' | 'manifestation' | 'flow';

export interface SubtasteDesignation {
  code: string;
  glyph: string;
  label: string;
  description: string;
  phase: CreativePhase;
}

// ============================================================================
// 12 SUBTASTE DESIGNATIONS
// ============================================================================

// Glyphs, labels, and descriptions are the canonical Subtaste twelve
// from `@subtaste/core` (subtaste/packages/core/src/pantheon/definitions.ts).
// `label` mirrors the canonical `creativeMode`; `description` mirrors
// the canonical `essence`. The `phase` field is preserved for
// downstream compatibility (compatibility-data.ts). The Ø designation
// is the canonical name; 'NULL' is kept as a back-compat alias for any
// callers that still read it.
const VOID_DESIGNATION: SubtasteDesignation = {
  code: 'Ø',
  glyph: 'VOID',
  label: 'Receptive',
  description: 'The deliberate absence. What receives by containing nothing.',
  phase: 'flow',
};

export const SUBTASTE_DESIGNATIONS: Record<string, SubtasteDesignation> = {
  'S-0': {
    code: 'S-0',
    glyph: 'KETH',
    label: 'Visionary',
    description: 'The unmarked throne. First without announcement.',
    phase: 'vision',
  },
  'T-1': {
    code: 'T-1',
    glyph: 'STRATA',
    label: 'Architectural',
    description: 'The hidden architecture. Layers beneath surfaces.',
    phase: 'refinement',
  },
  'V-2': {
    code: 'V-2',
    glyph: 'OMEN',
    label: 'Prophetic',
    description: 'What arrives before itself. The shape of the unformed.',
    phase: 'vision',
  },
  'L-3': {
    code: 'L-3',
    glyph: 'SILT',
    label: 'Developmental',
    description: 'Patient sediment. What accumulates in darkness.',
    phase: 'manifestation',
  },
  'C-4': {
    code: 'C-4',
    glyph: 'CULL',
    label: 'Editorial',
    description: 'The necessary cut. What must be removed, removed.',
    phase: 'refinement',
  },
  'N-5': {
    code: 'N-5',
    glyph: 'LIMN',
    label: 'Integrative',
    description: 'To illuminate by edge. The binding outline.',
    phase: 'flow',
  },
  'H-6': {
    code: 'H-6',
    glyph: 'TOLL',
    label: 'Advocacy',
    description: 'The bell that cannot be unheard. The summons.',
    phase: 'manifestation',
  },
  'P-7': {
    code: 'P-7',
    glyph: 'VAULT',
    label: 'Archival',
    description: 'What is kept. Writing over writing.',
    phase: 'flow',
  },
  'D-8': {
    code: 'D-8',
    glyph: 'WICK',
    label: 'Channelling',
    description: 'Draws flame upward without burning. The hollow channel.',
    phase: 'flow',
  },
  'F-9': {
    code: 'F-9',
    glyph: 'ANVIL',
    label: 'Manifestation',
    description: 'Where pressure becomes form. The manifestation point.',
    phase: 'genesis',
  },
  'R-10': {
    code: 'R-10',
    glyph: 'SCHISM',
    label: 'Contrarian',
    description: 'The productive fracture. What breaks to reveal grain.',
    phase: 'genesis',
  },
  'Ø': VOID_DESIGNATION,
  // Back-compat alias: legacy code paths (and the
  // getSubtasteDesignation fallback below) reach for 'NULL'. Points
  // at the same record so callers see the canonical glyph + label.
  NULL: VOID_DESIGNATION,
};

// ============================================================================
// ARCHETYPE TO SUBTASTE MAPPING
// ============================================================================

export const ARCHETYPE_TO_SUBTASTE: Record<string, string> = {
  // === TAROT (22 archetypes) ===
  fool: 'V-2',           // wanderer sees what's coming
  magician: 'F-9',       // manifests will into reality
  high_priestess: 'D-8', // receives hidden knowledge
  empress: 'L-3',        // nurtures, patient growth
  emperor: 'S-0',        // sets the standard
  hierophant: 'P-7',     // preserves tradition
  lovers: 'N-5',         // illuminates the border between self and other
  chariot: 'H-6',        // pays the cost, drives forward
  strength: 'S-0',       // embodies standard through gentle force
  hermit: 'T-1',         // sees the systems beneath
  wheel_of_fortune: 'V-2', // witnesses the turning
  justice: 'C-4',        // cuts what is unjust
  hanged_man: 'D-8',     // empties self, suspends
  death: 'R-10',         // productive destruction
  temperance: 'N-5',     // traces the balance point
  devil: 'H-6',          // relentless about shadow truth
  tower: 'R-10',         // breaks so things can grow
  star: 'L-3',           // patient cultivation of hope
  moon: 'D-8',           // channels the unconscious
  sun: 'F-9',            // manifests joy and vitality
  judgement: 'C-4',      // essential editing, the call
  world: 'S-0',          // the completed standard

  // === JUNG (12 archetypes) ===
  innocent: 'L-3',       // patient trust
  sage: 'T-1',           // system seer
  explorer: 'V-2',       // early witness of new territory
  outlaw: 'R-10',        // productive fracture
  // magician already mapped above (tarot takes priority)
  hero: 'H-6',           // relentless advocate
  lover: 'N-5',          // border illuminator
  jester: 'V-2',         // sees truth early through humor
  everyman: 'P-7',       // living archive of the common
  caregiver: 'L-3',      // patient cultivation
  ruler: 'S-0',          // standard bearer
  creator: 'F-9',        // manifestor

  // === KABBALAH (20 archetypes) ===
  kether: 'S-0',         // divine standard
  chokmah: 'F-9',        // creative force manifests
  binah: 'T-1',          // understanding as system seeing
  chesed: 'L-3',         // abundant patience
  geburah: 'C-4',        // severity as essential editing
  tiphareth: 'N-5',      // beauty traces borders
  netzach: 'H-6',        // victory through advocacy
  hod: 'T-1',            // intellect reads systems
  yesod: 'D-8',          // foundation channels dreams
  malkuth: 'P-7',        // kingdom preserves manifestation
  // Qliphoth
  thaumiel: 'R-10',      // duality fractures
  ghagiel: 'R-10',       // chaos as productive break
  satariel: 'D-8',       // concealment channels
  gamchicoth: 'C-4',     // devouring as editing
  golachab: 'H-6',       // wrath as advocacy
  thagirion: 'V-2',      // disputer sees early
  harab_serapel: 'D-8',  // death ravens channel
  samael: 'C-4',         // poison edits
  gamaliel: 'D-8',       // unconscious channel
  lilith: 'R-10',        // autonomy through fracture

  // === ORISHA (12 archetypes) ===
  obatala: 'S-0',        // sky father sets standard
  ogun: 'F-9',           // iron forge manifests
  shango: 'H-6',         // thunder advocates justice
  yemoja: 'L-3',         // ocean mother cultivates
  oshun: 'N-5',          // river illuminates borders
  eshu: 'V-2',           // crossroads sees first
  oya: 'R-10',           // storm fractures productively
  orunmila: 'T-1',       // divination reads systems
  oshosi: 'C-4',         // hunter edits, tracks, removes excess
  osanyin: 'P-7',        // herbs preserved as archive
  babalu_aye: 'H-6',     // healing through toll
  olokun: 'D-8',         // deep ocean channels
  aganju: 'F-9',         // volcano manifests raw power

  // === NORSE (12 archetypes) ===
  odin: 'T-1',           // allfather reads systems (runes)
  thor: 'H-6',           // thunder advocates protection
  freya: 'N-5',          // love illuminates borders
  loki: 'R-10',          // trickster fractures productively
  tyr: 'C-4',            // sacrifice as essential editing
  heimdall: 'V-2',       // guardian witnesses early
  baldur: 'L-3',         // light cultivates patiently
  hel: 'D-8',            // death channels the threshold
  frigg: 'P-7',          // foresight as living archive
  njord: 'L-3',          // sea prosperity cultivates
  skadi: 'C-4',          // winter hunts, edits essentials
  idun: 'P-7',           // youth preserved as archive
};

// ============================================================================
// LOOKUP FUNCTION
// ============================================================================

/**
 * Get the Subtaste designation for a given archetype system and archetype name.
 * Returns NULL/VOID if no mapping is found.
 */
export function getSubtasteDesignation(system: string, archetype: string): SubtasteDesignation {
  const normalized = archetype.toLowerCase().replace(/ /g, '_');
  const code = ARCHETYPE_TO_SUBTASTE[normalized] || 'NULL';
  return SUBTASTE_DESIGNATIONS[code] || SUBTASTE_DESIGNATIONS['NULL']!;
}

// ============================================================================
// CREATIVE PIPELINE ANALYSIS
// ============================================================================

/**
 * Phase labels for display — native Bóveda vocabulary for Team Dimensions concepts.
 */
export const PHASE_LABELS: Record<CreativePhase, { label: string; description: string }> = {
  genesis: { label: 'Genesis', description: 'Breaks old forms and forges new ones' },
  vision: { label: 'Vision', description: 'Scouts ahead and sets direction' },
  refinement: { label: 'Refinement', description: 'Analyzes structure and edits excess' },
  manifestation: { label: 'Manifestation', description: 'Drives patiently toward completion' },
  flow: { label: 'Flow', description: 'Channels, bridges, preserves, and holds space' },
};

/** All five phases in pipeline order. */
export const PIPELINE_ORDER: CreativePhase[] = ['genesis', 'vision', 'refinement', 'manifestation', 'flow'];

/** Alias for compatibility-data module imports. */
export type PipelinePhase = CreativePhase;

// ============================================================================
// WU XING (FIVE ELEMENTS)
// ============================================================================

export type WuXingElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

/** Map each creative phase to its Wu Xing element. */
export const WU_XING_ELEMENTS: Record<CreativePhase, WuXingElement> = {
  genesis: 'fire',
  vision: 'wood',
  refinement: 'metal',
  manifestation: 'earth',
  flow: 'water',
};

/** Generating (shēng) and overcoming (kè) cycles. */
export const WU_XING_DATA: Record<WuXingElement, { generating: WuXingElement; overcoming: WuXingElement }> = {
  wood: { generating: 'fire', overcoming: 'earth' },
  fire: { generating: 'earth', overcoming: 'metal' },
  earth: { generating: 'metal', overcoming: 'water' },
  metal: { generating: 'water', overcoming: 'wood' },
  water: { generating: 'wood', overcoming: 'fire' },
};

export type RelationalCycle = 'generating' | 'overcoming' | 'neutral';

export function getWuXingRelation(a: WuXingElement, b: WuXingElement): RelationalCycle {
  if (WU_XING_DATA[a].generating === b || WU_XING_DATA[b].generating === a) return 'generating';
  if (WU_XING_DATA[a].overcoming === b || WU_XING_DATA[b].overcoming === a) return 'overcoming';
  return 'neutral';
}

// ============================================================================
// SUBTASTE GROWTH / STRESS ARROWS
// ============================================================================

export interface SubtasteArrow {
  growth: string;
  stress: string;
}

export const SUBTASTE_ARROWS: Record<string, SubtasteArrow> = {
  'S-0':  { growth: 'D-8',  stress: 'R-10' },
  'T-1':  { growth: 'N-5',  stress: 'P-7' },
  'V-2':  { growth: 'L-3',  stress: 'C-4' },
  'L-3':  { growth: 'S-0',  stress: 'D-8' },
  'C-4':  { growth: 'H-6',  stress: 'R-10' },
  'N-5':  { growth: 'V-2',  stress: 'NULL' },
  'H-6':  { growth: 'T-1',  stress: 'F-9' },
  'P-7':  { growth: 'C-4',  stress: 'L-3' },
  'D-8':  { growth: 'F-9',  stress: 'N-5' },
  'F-9':  { growth: 'N-5',  stress: 'C-4' },
  'R-10': { growth: 'H-6',  stress: 'S-0' },
  'NULL': { growth: 'R-10', stress: 'T-1' },
};

/**
 * Pipeline coverage report for a group of Subtaste designations.
 * Useful for team composition analysis — identifies which creative phases
 * are covered and which are gaps.
 */
export interface PipelineCoverage {
  /** Count of members in each phase */
  counts: Record<CreativePhase, number>;
  /** Phases with at least one member */
  covered: CreativePhase[];
  /** Phases with zero members — the gaps */
  gaps: CreativePhase[];
  /** 0-1 ratio of phases covered */
  coverageRatio: number;
}

/**
 * Analyze creative pipeline coverage for a group of Subtaste designations.
 *
 * @param subtastes - Array of SubtasteDesignation objects (e.g., from a team of characters)
 * @returns Pipeline coverage report with counts, covered phases, gaps, and ratio
 *
 * @example
 * ```ts
 * const team = [getSubtasteDesignation('tarot', 'magician'), getSubtasteDesignation('tarot', 'hermit')];
 * const coverage = analyzePipelineCoverage(team);
 * // coverage.gaps → ['vision', 'manifestation', 'flow'] — these phases need more members
 * ```
 */
export function analyzePipelineCoverage(subtastes: SubtasteDesignation[]): PipelineCoverage {
  const counts: Record<CreativePhase, number> = {
    genesis: 0,
    vision: 0,
    refinement: 0,
    manifestation: 0,
    flow: 0,
  };

  for (const s of subtastes) {
    if (s.phase && counts[s.phase] !== undefined) {
      counts[s.phase]++;
    }
  }

  const covered = PIPELINE_ORDER.filter(p => counts[p] > 0);
  const gaps = PIPELINE_ORDER.filter(p => counts[p] === 0);

  return {
    counts,
    covered,
    gaps,
    coverageRatio: covered.length / PIPELINE_ORDER.length,
  };
}

// ============================================================================
// MBTI DERIVATION (display-only convenience)
// ============================================================================

/**
 * Derive an approximate MBTI type from Bóveda's 4 personality axes.
 * This is a lossy projection — MBTI collapses continuous axes into binary switches.
 * Intended for display/legibility only; the native axes are always more precise.
 *
 * Mapping:
 *   introvertExtrovert (0-1) → I/E  (< 0.5 = Introvert)
 *   faithDoubt (0-1)         → S/N  (≥ 0.5 = Sensing, < 0.5 = iNtuition)
 *   mercyRuthlessness (0-1)  → F/T  (≥ 0.5 = Feeling, < 0.5 = Thinking)
 *   orderChaos (0-1)         → J/P  (≥ 0.5 = Judging, < 0.5 = Perceiving)
 */
export function deriveApproximateMBTI(axes: {
  orderChaos: number;
  mercyRuthlessness: number;
  introvertExtrovert: number;
  faithDoubt: number;
}): string {
  const ie = axes.introvertExtrovert >= 0.5 ? 'E' : 'I';
  const sn = axes.faithDoubt >= 0.5 ? 'S' : 'N';
  const ft = axes.mercyRuthlessness >= 0.5 ? 'F' : 'T';
  const jp = axes.orderChaos >= 0.5 ? 'J' : 'P';
  return `${ie}${sn}${ft}${jp}`;
}

// ============================================================================
// ENTITY PROFILE ANALYSIS
// ============================================================================

/**
 * Orisha energy classification — hot, cool, or crossroads.
 * Based on traditional Yoruba spiritual taxonomy.
 */
const ORISHA_ENERGY: Record<string, 'hot' | 'cool' | 'crossroads'> = {
  obatala: 'cool',
  ogun: 'hot',
  shango: 'hot',
  yemoja: 'cool',
  oshun: 'cool',
  eshu: 'crossroads',
  oya: 'hot',
  orunmila: 'cool',
  oshosi: 'hot',        // hunter energy
  osanyin: 'cool',
  babalu_aye: 'cool',
  olokun: 'cool',
  aganju: 'hot',
};

/**
 * Sephira energy classification based on pillar alignment.
 */
const SEPHIRA_ENERGY: Record<string, 'hot' | 'cool' | 'crossroads'> = {
  kether: 'crossroads',
  chokmah: 'hot',
  binah: 'cool',
  chesed: 'cool',
  geburah: 'hot',
  tiphareth: 'crossroads',
  netzach: 'hot',
  hod: 'cool',
  yesod: 'crossroads',
  malkuth: 'crossroads',
  daath: 'crossroads',
};

export interface EntityProfileInput {
  archetype: string;
  system?: string;
  axes: {
    orderChaos: number;
    mercyRuthlessness: number;
    introvertExtrovert: number;
    faithDoubt: number;
  };
  orisha?: string;
  sephira?: string;
}

export interface PolarityReading {
  label: string;
  lean: string;
  intensity: number;
}

export interface ProfileAnalysis {
  subtaste: SubtasteDesignation;
  phase: CreativePhase;
  polarities: {
    orderChaos: PolarityReading;
    mercyRuthlessness: PolarityReading;
    introvertExtrovert: PolarityReading;
    faithDoubt: PolarityReading;
  };
  dominantEnergy: 'hot' | 'cool' | 'crossroads';
  coherenceScore: number;
  summary: string;
  /** Wu Xing element derived from pipeline phase */
  wuXingElement: WuXingElement;
  /** Raw numeric axis values (0-1) for compatibility computations */
  axes: {
    orderChaos: number;
    mercyRuthlessness: number;
    introvertExtrovert: number;
    faithDoubt: number;
  };
}

function interpretAxis(value: number, lowLabel: string, highLabel: string): PolarityReading {
  const intensity = Math.abs(value - 0.5) * 2; // 0 at center, 1 at extremes
  const lean = value < 0.4 ? lowLabel : value > 0.6 ? highLabel : 'balanced';
  const label = intensity < 0.2 ? 'balanced' : intensity < 0.5 ? 'mild' : intensity < 0.8 ? 'strong' : 'extreme';
  return { label, lean, intensity };
}

/**
 * Analyze an entity's symbolic profile from archetype, axes, and optional Orisha/Sephira data.
 * Produces a unified profile with subtaste classification, phase, polarity readings,
 * dominant energy, and coherence score.
 */
export function analyzeEntityProfile(entity: EntityProfileInput): ProfileAnalysis {
  const system = entity.system || 'tarot';
  const subtaste = getSubtasteDesignation(system, entity.archetype);

  const polarities = {
    orderChaos: interpretAxis(entity.axes.orderChaos, 'order', 'chaos'),
    mercyRuthlessness: interpretAxis(entity.axes.mercyRuthlessness, 'mercy', 'ruthlessness'),
    introvertExtrovert: interpretAxis(entity.axes.introvertExtrovert, 'introvert', 'extrovert'),
    faithDoubt: interpretAxis(entity.axes.faithDoubt, 'faith', 'doubt'),
  };

  // Determine dominant energy from multiple signals
  const energySignals: Array<'hot' | 'cool' | 'crossroads'> = [];

  // Axis-derived energy: high chaos + high ruthlessness + high extrovert → hot
  const axisHeat =
    (entity.axes.orderChaos + entity.axes.mercyRuthlessness + entity.axes.introvertExtrovert) / 3;
  if (axisHeat > 0.6) energySignals.push('hot');
  else if (axisHeat < 0.4) energySignals.push('cool');
  else energySignals.push('crossroads');

  // Orisha energy
  if (entity.orisha) {
    const normalized = entity.orisha.toLowerCase().replace(/[^a-z_]/g, '');
    const orishaEnergy = ORISHA_ENERGY[normalized];
    if (orishaEnergy) energySignals.push(orishaEnergy);
  }

  // Sephira energy
  if (entity.sephira) {
    const normalized = entity.sephira.toLowerCase().replace(/[^a-z_]/g, '');
    const sephiraEnergy = SEPHIRA_ENERGY[normalized];
    if (sephiraEnergy) energySignals.push(sephiraEnergy);
  }

  // Tally energy signals
  const hotCount = energySignals.filter((e) => e === 'hot').length;
  const coolCount = energySignals.filter((e) => e === 'cool').length;
  const dominantEnergy: 'hot' | 'cool' | 'crossroads' =
    hotCount > coolCount ? 'hot' : coolCount > hotCount ? 'cool' : 'crossroads';

  // Coherence score — how well archetype/orisha/sephira align
  let coherenceScore = 0.5; // base
  if (entity.orisha && entity.sephira) {
    // If both present, check if their energies match
    const oNorm = entity.orisha.toLowerCase().replace(/[^a-z_]/g, '');
    const sNorm = entity.sephira.toLowerCase().replace(/[^a-z_]/g, '');
    const oE = ORISHA_ENERGY[oNorm];
    const sE = SEPHIRA_ENERGY[sNorm];
    if (oE && sE) {
      if (oE === sE) coherenceScore += 0.25;
      else if (oE === 'crossroads' || sE === 'crossroads') coherenceScore += 0.1;
      // else opposing — no bonus
    }
  }

  // Archetype energy alignment with dominant energy
  const archetypeEnergy = subtaste.phase === 'genesis' || subtaste.phase === 'manifestation' ? 'hot' :
    subtaste.phase === 'flow' ? 'cool' : 'crossroads';
  if (archetypeEnergy === dominantEnergy) coherenceScore += 0.15;
  else if (archetypeEnergy === 'crossroads' || dominantEnergy === 'crossroads') coherenceScore += 0.05;

  // Axis coherence — low variance across axes → higher coherence
  const axisValues = [
    entity.axes.orderChaos,
    entity.axes.mercyRuthlessness,
    entity.axes.introvertExtrovert,
    entity.axes.faithDoubt,
  ];
  const axisMean = axisValues.reduce((a, b) => a + b, 0) / axisValues.length;
  const axisVariance = axisValues.reduce((sum, v) => sum + (v - axisMean) ** 2, 0) / axisValues.length;
  // Low variance (< 0.04) adds up to 0.1
  coherenceScore += Math.max(0, 0.1 - axisVariance * 2.5);

  coherenceScore = Math.min(1, Math.max(0, coherenceScore));

  const coherenceLabel = coherenceScore >= 0.75 ? 'high' : coherenceScore >= 0.5 ? 'moderate' : 'low';
  const summary = `${subtaste.code} ${subtaste.glyph} · ${subtaste.phase} · ${dominantEnergy} · ${coherenceLabel} coherence`;

  return {
    subtaste,
    phase: subtaste.phase,
    polarities,
    dominantEnergy,
    coherenceScore,
    summary,
    wuXingElement: WU_XING_ELEMENTS[subtaste.phase],
    axes: entity.axes,
  };
}

// ============================================================================
// PROFILE COMPARISON
// ============================================================================

export interface ProfileComparison {
  compatibility: number;
  complementaryPhases: boolean;
  axisDeltas: {
    orderChaos: number;
    mercyRuthlessness: number;
    introvertExtrovert: number;
    faithDoubt: number;
  };
  dynamicType: 'mirror' | 'complement' | 'friction' | 'parallel';
  summary: string;
  /** Alias for dynamicType — used by compatibility matrix */
  pattern: 'mirror' | 'complement' | 'friction' | 'parallel';
  /** Wu Xing relational cycle between the two profiles */
  relationalCycle: RelationalCycle;
  /** Average axis distance (0-1) */
  overallDistance: number;
  /** Human-readable relationship narrative */
  narrative: string;
}

/**
 * Compare two ProfileAnalysis objects and return compatibility, axis deltas,
 * dynamic type (mirror/complement/friction/parallel), and a summary.
 */
export function compareProfiles(profileA: ProfileAnalysis, profileB: ProfileAnalysis): ProfileComparison {
  // Axis deltas (0-1 range, absolute difference)
  const axisDeltas = {
    orderChaos: Math.abs(
      (profileA.polarities.orderChaos.intensity * (profileA.polarities.orderChaos.lean === 'chaos' ? 1 : -1)) -
      (profileB.polarities.orderChaos.intensity * (profileB.polarities.orderChaos.lean === 'chaos' ? 1 : -1))
    ),
    mercyRuthlessness: Math.abs(
      (profileA.polarities.mercyRuthlessness.intensity * (profileA.polarities.mercyRuthlessness.lean === 'ruthlessness' ? 1 : -1)) -
      (profileB.polarities.mercyRuthlessness.intensity * (profileB.polarities.mercyRuthlessness.lean === 'ruthlessness' ? 1 : -1))
    ),
    introvertExtrovert: Math.abs(
      (profileA.polarities.introvertExtrovert.intensity * (profileA.polarities.introvertExtrovert.lean === 'extrovert' ? 1 : -1)) -
      (profileB.polarities.introvertExtrovert.intensity * (profileB.polarities.introvertExtrovert.lean === 'extrovert' ? 1 : -1))
    ),
    faithDoubt: Math.abs(
      (profileA.polarities.faithDoubt.intensity * (profileA.polarities.faithDoubt.lean === 'doubt' ? 1 : -1)) -
      (profileB.polarities.faithDoubt.intensity * (profileB.polarities.faithDoubt.lean === 'doubt' ? 1 : -1))
    ),
  };

  const avgDelta =
    (axisDeltas.orderChaos + axisDeltas.mercyRuthlessness + axisDeltas.introvertExtrovert + axisDeltas.faithDoubt) / 4;

  // Phase comparison
  const samePhase = profileA.phase === profileB.phase;
  const phasePairCovers = new Set([profileA.phase, profileB.phase]);
  const complementaryPhases = !samePhase && phasePairCovers.size === 2;

  // Same subtaste?
  const sameSubtaste = profileA.subtaste.code === profileB.subtaste.code;

  // Energy alignment
  const sameEnergy = profileA.dominantEnergy === profileB.dominantEnergy;

  // Determine dynamic type
  let dynamicType: 'mirror' | 'complement' | 'friction' | 'parallel';

  if (sameSubtaste && avgDelta < 0.3) {
    dynamicType = 'mirror';
  } else if (complementaryPhases && avgDelta < 0.5) {
    dynamicType = 'complement';
  } else if (!samePhase && avgDelta > 0.6) {
    dynamicType = 'friction';
  } else {
    dynamicType = 'parallel';
  }

  // Compatibility score
  let compatibility = 0.5;

  // Phase complementarity boosts compatibility
  if (complementaryPhases) compatibility += 0.2;
  else if (samePhase) compatibility += 0.05;

  // Energy alignment
  if (sameEnergy) compatibility += 0.1;
  else if (profileA.dominantEnergy === 'crossroads' || profileB.dominantEnergy === 'crossroads') {
    compatibility += 0.05;
  }

  // Moderate axis differences are ideal (not too same, not too far)
  if (avgDelta >= 0.2 && avgDelta <= 0.5) compatibility += 0.15;
  else if (avgDelta < 0.2) compatibility += 0.1; // very similar is OK
  // extreme difference reduces
  else if (avgDelta > 0.7) compatibility -= 0.1;

  // Coherence bonus — both profiles being internally coherent helps
  const avgCoherence = (profileA.coherenceScore + profileB.coherenceScore) / 2;
  compatibility += avgCoherence * 0.1;

  compatibility = Math.min(1, Math.max(0, compatibility));

  const dynamicLabels: Record<string, string> = {
    mirror: 'they reflect each other',
    complement: 'they complete each other',
    friction: 'creative tension',
    parallel: 'side-by-side energy',
  };

  const summary = `${(compatibility * 100).toFixed(0)}% compatible · ${dynamicType} — ${dynamicLabels[dynamicType]}`;

  // Wu Xing relational cycle
  const relationalCycle = getWuXingRelation(profileA.wuXingElement, profileB.wuXingElement);

  // Narrative
  let narrative = summary;
  if (relationalCycle === 'generating') {
    narrative += '. A generative Wu Xing cycle connects them — creative potential flows naturally.';
  } else if (relationalCycle === 'overcoming') {
    narrative += '. An overcoming Wu Xing cycle creates tension — one element challenges the other.';
  }

  return {
    compatibility,
    complementaryPhases,
    axisDeltas,
    dynamicType,
    summary,
    pattern: dynamicType,
    relationalCycle,
    overallDistance: avgDelta,
    narrative,
  };
}
