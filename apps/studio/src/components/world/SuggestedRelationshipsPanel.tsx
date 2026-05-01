'use client';

import { useState, useMemo } from 'react';
import type { Character, CreateRelationshipInput, RelationshipType } from '@/lib/api';

// ============================================================================
// INLINE COMPATIBILITY ENGINE
// (Mirrors packages/oripheon/src/data — inlined to avoid cross-package dependency)
// ============================================================================

type WuXingElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
type PipelinePhase = 'genesis' | 'vision' | 'refinement' | 'manifestation' | 'flow';
type RelationalCycle = 'generating' | 'overcoming' | 'neutral';
type ComparisonPattern = 'mirror' | 'complement' | 'parallel' | 'friction' | 'neutral';
// Canonical Subtaste twelve. Designation key is the short code
// (e.g. 'R-10'); the public-facing GLYPH (SCHISM) and creativeMode
// label (Contrarian) are looked up via maps below. Mirrors
// @subtaste/core's pantheon and packages/oripheon/src/data/subtaste-data.ts.
type SubtasteDesignation =
  | 'S-0' | 'T-1' | 'V-2' | 'L-3' | 'C-4' | 'N-5'
  | 'H-6' | 'P-7' | 'D-8' | 'F-9' | 'R-10' | 'Ø';

// Public-facing glyph for each designation (e.g. R-10 → SCHISM).
const SUBTASTE_GLYPHS: Record<SubtasteDesignation, string> = {
  'S-0': 'KETH', 'T-1': 'STRATA', 'V-2': 'OMEN', 'L-3': 'SILT',
  'C-4': 'CULL', 'N-5': 'LIMN', 'H-6': 'TOLL', 'P-7': 'VAULT',
  'D-8': 'WICK', 'F-9': 'ANVIL', 'R-10': 'SCHISM', 'Ø': 'VOID',
};

interface Axes {
  orderChaos: number;
  mercyRuthlessness: number;
  introvertExtrovert: number;
  faithDoubt: number;
}

interface ProfileAnalysis {
  subtaste: SubtasteDesignation;
  phase: PipelinePhase;
  wuXingElement: WuXingElement;
  axes: Axes;
}

interface ContextualCompatibility {
  love: number;
  friendship: number;
  creativeTeam: number;
  storyTension: number;
}

interface ProfileComparison {
  pattern: ComparisonPattern;
  relationalCycle: RelationalCycle;
  overallDistance: number;
}

interface MentorDirection {
  mentorIsA: boolean;
}

interface RelationshipMatrix {
  base: ProfileComparison;
  contextual: ContextualCompatibility;
  suggestedRelationshipTypes: string[];
  mentorDirection: MentorDirection | null;
}

const PIPELINE: PipelinePhase[] = ['genesis', 'vision', 'refinement', 'manifestation', 'flow'];

const PHASE_MAP: Record<SubtasteDesignation, PipelinePhase> = {
  'S-0': 'vision', 'T-1': 'refinement', 'V-2': 'vision',
  'L-3': 'manifestation', 'C-4': 'refinement', 'N-5': 'flow',
  'H-6': 'manifestation', 'P-7': 'flow', 'D-8': 'flow',
  'F-9': 'genesis', 'R-10': 'genesis', 'Ø': 'flow',
};

const ELEMENT_MAP: Record<PipelinePhase, WuXingElement> = {
  genesis: 'fire', vision: 'wood', refinement: 'metal', manifestation: 'earth', flow: 'water',
};

const WU_XING_GEN: Record<WuXingElement, WuXingElement> = {
  wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood',
};
const WU_XING_KE: Record<WuXingElement, WuXingElement> = {
  wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood',
};

const GROWTH_ARROWS: Record<SubtasteDesignation, SubtasteDesignation> = {
  'S-0': 'D-8', 'T-1': 'N-5', 'V-2': 'L-3',
  'L-3': 'S-0', 'C-4': 'H-6', 'N-5': 'V-2',
  'H-6': 'T-1', 'P-7': 'C-4', 'D-8': 'F-9',
  'F-9': 'N-5', 'R-10': 'H-6', 'Ø': 'R-10',
};
const STRESS_ARROWS: Record<SubtasteDesignation, SubtasteDesignation> = {
  'S-0': 'R-10', 'T-1': 'P-7', 'V-2': 'C-4',
  'L-3': 'D-8', 'C-4': 'R-10', 'N-5': 'Ø',
  'H-6': 'F-9', 'P-7': 'L-3', 'D-8': 'N-5',
  'F-9': 'C-4', 'R-10': 'S-0', 'Ø': 'T-1',
};

// Canonical creativeMode label per designation (matches @subtaste/core
// pantheon and packages/oripheon/src/data/subtaste-data.ts).
const SUBTASTE_LABELS: Record<SubtasteDesignation, string> = {
  'S-0': 'Visionary', 'T-1': 'Architectural', 'V-2': 'Prophetic',
  'L-3': 'Developmental', 'C-4': 'Editorial', 'N-5': 'Integrative',
  'H-6': 'Advocacy', 'P-7': 'Archival', 'D-8': 'Channelling',
  'F-9': 'Manifestation', 'R-10': 'Contrarian', 'Ø': 'Receptive',
};

// Convenience: combined display string (e.g. "R-10 SCHISM").
function designationDisplay(d: SubtasteDesignation): string {
  return `${d} ${SUBTASTE_GLYPHS[d]}`;
}

function deriveSubtaste(axes: Axes): SubtasteDesignation {
  const { orderChaos, mercyRuthlessness, introvertExtrovert, faithDoubt } = axes;
  const authority = (orderChaos + (1 - mercyRuthlessness)) / 2;
  const intuition = (faithDoubt + (1 - introvertExtrovert)) / 2;
  const action = (orderChaos + introvertExtrovert) / 2;
  const reception = ((1 - orderChaos) + (1 - introvertExtrovert)) / 2;

  if (authority > 0.7 && orderChaos > 0.6) return 'S-0';
  if (introvertExtrovert < 0.35 && faithDoubt < 0.4) return 'T-1';
  if (faithDoubt > 0.7 && intuition > 0.6) return 'V-2';
  if (mercyRuthlessness < 0.4 && action < 0.4) return 'L-3';
  if (mercyRuthlessness > 0.65 && orderChaos > 0.4 && orderChaos < 0.7) return 'C-4';
  if (introvertExtrovert > 0.65 && faithDoubt > 0.5) return 'N-5';
  if (mercyRuthlessness < 0.35 && introvertExtrovert > 0.55) return 'H-6';
  if (introvertExtrovert < 0.4 && orderChaos > 0.6) return 'P-7';
  if (orderChaos < 0.35 && reception > 0.5) return 'D-8';
  if (action > 0.6 && mercyRuthlessness > 0.55) return 'F-9';
  if (orderChaos < 0.25) return 'R-10';
  return 'Ø';
}

function analyzeProfile(axes: Axes): ProfileAnalysis {
  const subtaste = deriveSubtaste(axes);
  const phase = PHASE_MAP[subtaste];
  return { subtaste, phase, wuXingElement: ELEMENT_MAP[phase], axes };
}

function getWuXingRelation(a: WuXingElement, b: WuXingElement): RelationalCycle {
  if (a === b) return 'neutral';
  if (WU_XING_GEN[a] === b || WU_XING_GEN[b] === a) return 'generating';
  if (WU_XING_KE[a] === b || WU_XING_KE[b] === a) return 'overcoming';
  return 'neutral';
}

function clamp01(v: number): number { return Math.max(0, Math.min(1, v)); }
function phaseIdx(p: PipelinePhase): number { return PIPELINE.indexOf(p); }

function adjacentPhases(pa: PipelinePhase, pb: PipelinePhase): boolean {
  const ia = phaseIdx(pa), ib = phaseIdx(pb);
  return Math.abs(ia - ib) <= 1 || (ia === 0 && ib === 4) || (ia === 4 && ib === 0);
}

function detectMentor(a: ProfileAnalysis, b: ProfileAnalysis): MentorDirection | null {
  let aMb = 0, bMa = 0;
  if (WU_XING_GEN[a.wuXingElement] === b.wuXingElement) aMb++;
  if (GROWTH_ARROWS[b.subtaste] === a.subtaste) aMb++;
  if (phaseIdx(a.phase) > phaseIdx(b.phase)) aMb++;
  if (WU_XING_GEN[b.wuXingElement] === a.wuXingElement) bMa++;
  if (GROWTH_ARROWS[a.subtaste] === b.subtaste) bMa++;
  if (phaseIdx(b.phase) > phaseIdx(a.phase)) bMa++;
  if (aMb >= 2 && aMb > bMa) return { mentorIsA: true };
  if (bMa >= 2 && bMa > aMb) return { mentorIsA: false };
  return null;
}

function isSiblingPattern(a: ProfileAnalysis, b: ProfileAnalysis): boolean {
  const originClose = Math.abs(a.axes.orderChaos - b.axes.orderChaos) < 0.2 &&
    Math.abs(a.axes.faithDoubt - b.axes.faithDoubt) < 0.2;
  const tempDiverge = Math.abs(a.axes.mercyRuthlessness - b.axes.mercyRuthlessness) > 0.3 ||
    Math.abs(a.axes.introvertExtrovert - b.axes.introvertExtrovert) > 0.3;
  return originClose && tempDiverge && adjacentPhases(a.phase, b.phase);
}

function classifyAntagonism(
  a: ProfileAnalysis, b: ProfileAnalysis, pattern: string, cycle: string,
): 'ENEMY' | 'RIVAL' {
  if (STRESS_ARROWS[a.subtaste] === b.subtaste && STRESS_ARROWS[b.subtaste] === a.subtaste) return 'ENEMY';
  if (cycle === 'overcoming' && pattern === 'friction') return 'ENEMY';
  return 'RIVAL';
}

function computeMatrix(a: ProfileAnalysis, b: ProfileAnalysis): RelationshipMatrix {
  const deltas = {
    orderChaos: Math.abs(a.axes.orderChaos - b.axes.orderChaos),
    mercyRuthlessness: Math.abs(a.axes.mercyRuthlessness - b.axes.mercyRuthlessness),
    introvertExtrovert: Math.abs(a.axes.introvertExtrovert - b.axes.introvertExtrovert),
    faithDoubt: Math.abs(a.axes.faithDoubt - b.axes.faithDoubt),
  };
  const dist = Math.sqrt(
    deltas.orderChaos ** 2 + deltas.mercyRuthlessness ** 2 +
    deltas.introvertExtrovert ** 2 + deltas.faithDoubt ** 2
  ) / 2;

  const cycle = getWuXingRelation(a.wuXingElement, b.wuXingElement);
  let pattern: ComparisonPattern;
  if (dist < 0.15) pattern = 'mirror';
  else if (dist < 0.35) pattern = 'parallel';
  else if (dist > 0.7) pattern = 'friction';
  else {
    const close = Object.values(deltas).filter(d => d < 0.2).length;
    const far = Object.values(deltas).filter(d => d > 0.5).length;
    pattern = close >= 2 && far >= 1 ? 'complement' : 'neutral';
  }

  const growthArrow = GROWTH_ARROWS[a.subtaste] === b.subtaste || GROWTH_ARROWS[b.subtaste] === a.subtaste;
  const stressArrow = STRESS_ARROWS[a.subtaste] === b.subtaste || STRESS_ARROWS[b.subtaste] === a.subtaste;
  const samePhase = a.phase === b.phase;
  const energyContrast = Math.abs(a.axes.introvertExtrovert - b.axes.introvertExtrovert);
  const sameEnergy = energyContrast < 0.2;

  const mentorDirection = detectMentor(a, b);
  const siblingPattern = isSiblingPattern(a, b);
  const antagonism = (pattern === 'friction' || cycle === 'overcoming' || stressArrow)
    ? classifyAntagonism(a, b, pattern, cycle) : null;

  let love = 0.4;
  if (pattern === 'complement') love += 0.25;
  if (pattern === 'mirror') love += 0.2;
  if (cycle === 'generating') love += 0.15;
  if (energyContrast > 0.3) love += 0.1;
  if (growthArrow) love += 0.1;
  if (pattern === 'friction') love -= 0.1;
  if (siblingPattern) love -= 0.15;

  let friendship = 0.4;
  if (pattern === 'parallel') friendship += 0.25;
  if (pattern === 'complement') friendship += 0.15;
  if (sameEnergy) friendship += 0.15;
  if (samePhase) friendship += 0.1;
  if (siblingPattern) friendship += 0.1;
  if (pattern === 'friction') friendship -= 0.15;

  let creativeTeam = 0.35;
  if (pattern === 'complement') creativeTeam += 0.25;
  if (!samePhase) creativeTeam += 0.1;
  if (cycle === 'generating') creativeTeam += 0.2;
  if (growthArrow) creativeTeam += 0.1;
  if (mentorDirection) creativeTeam += 0.1;

  let storyTension = 0.3;
  if (pattern === 'friction') storyTension += 0.3;
  if (cycle === 'overcoming') storyTension += 0.2;
  if (stressArrow) storyTension += 0.15;
  if (antagonism === 'ENEMY') storyTension += 0.1;
  if (dist > 0.5) storyTension += 0.1;

  const suggested: string[] = [];
  if (antagonism === 'ENEMY') suggested.push('ENEMY');
  else if (antagonism === 'RIVAL') suggested.push('RIVAL');
  if (mentorDirection) suggested.push('MENTOR');
  if (siblingPattern) suggested.push('FAMILY');
  if (pattern === 'mirror' && !siblingPattern) suggested.push('LOVER');
  if (pattern === 'complement') suggested.push('ALLY', 'FRIEND');
  if (pattern === 'parallel') suggested.push('FRIEND');
  if (growthArrow && !mentorDirection) suggested.push('ALLY');
  const unique = [...new Set(suggested)];
  if (unique.length === 0) unique.push('FRIEND');

  return {
    base: { pattern, relationalCycle: cycle, overallDistance: dist },
    contextual: {
      love: clamp01(love), friendship: clamp01(friendship),
      creativeTeam: clamp01(creativeTeam), storyTension: clamp01(storyTension),
    },
    suggestedRelationshipTypes: unique,
    mentorDirection,
  };
}

// ============================================================================
// EXPORTED: compute suggestion for two specific characters (used by modal)
// ============================================================================

export function computeSuggestionForPair(
  source: Character,
  target: Character,
): { suggestedType: string; score: number; mentorDirection: MentorDirection | null; narrative: string } | null {
  const axesA = extractAxes(source);
  const axesB = extractAxes(target);
  if (!axesA || !axesB) return null;

  const profileA = analyzeProfile(axesA);
  const profileB = analyzeProfile(axesB);
  const matrix = computeMatrix(profileA, profileB);

  const topCtx = Object.entries(matrix.contextual)
    .sort(([, a], [, b]) => b - a)[0]!;

  const ctxLabels: Record<string, string> = {
    love: 'romantic', friendship: 'friendship', creativeTeam: 'creative', storyTension: 'tension',
  };

  const suggestedType = matrix.suggestedRelationshipTypes[0] || 'FRIEND';
  const score = topCtx[1];
  const mentorLabel = matrix.mentorDirection
    ? (matrix.mentorDirection.mentorIsA ? `${source.name} mentors ${target.name}` : `${target.name} mentors ${source.name}`)
    : '';

  let narrative = `Suggested: ${suggestedType} (${Math.round(score * 100)}% ${ctxLabels[topCtx[0]]})`;
  if (mentorLabel) narrative += ` \u2014 ${mentorLabel}`;

  return { suggestedType, score, mentorDirection: matrix.mentorDirection, narrative };
}

// ============================================================================
// EXPORTED: get subtaste info for a character (used by detail panel)
// ============================================================================

export interface SubtasteInfo {
  subtaste: SubtasteDesignation;
  glyph: string;
  display: string;            // "R-10 SCHISM"
  label: string;
  growthGlyph: string;
  growthDisplay: string;
  stressGlyph: string;
  stressDisplay: string;
  phase: PipelinePhase;
  wuXingElement: WuXingElement;
  growth: SubtasteDesignation;
  growthLabel: string;
  stress: SubtasteDesignation;
  stressLabel: string;
  generates: WuXingElement;
  overcomeBy: WuXingElement;
}

export function getSubtasteInfo(character: Character): SubtasteInfo | null {
  // Prefer the explicitly stored designation when present. Set by the
  // Starforge import (Nommo quiz cache). Falls through to axes-derived
  // guess only when no explicit code exists. This is what makes Ubani
  // show R-10 SCHISM (his real Nommo) rather than V-2 OMEN (his
  // Oripheon-axes guess).
  const stored = readStoredSubtaste(character);
  let subtaste: SubtasteDesignation | null = null;
  let phase: PipelinePhase | null = null;

  if (stored) {
    subtaste = stored;
    phase = PHASE_MAP[stored];
  } else {
    const axes = extractAxes(character);
    if (!axes) return null;
    const profile = analyzeProfile(axes);
    subtaste = profile.subtaste;
    phase = profile.phase;
  }

  if (!subtaste || !phase) return null;
  const el = ELEMENT_MAP[phase];

  const growth = GROWTH_ARROWS[subtaste];
  const stress = STRESS_ARROWS[subtaste];
  return {
    subtaste,
    glyph: SUBTASTE_GLYPHS[subtaste],
    display: designationDisplay(subtaste),
    label: SUBTASTE_LABELS[subtaste],
    growthGlyph: SUBTASTE_GLYPHS[growth],
    growthDisplay: designationDisplay(growth),
    stressGlyph: SUBTASTE_GLYPHS[stress],
    stressDisplay: designationDisplay(stress),
    phase,
    wuXingElement: el,
    growth,
    growthLabel: SUBTASTE_LABELS[growth],
    stress,
    stressLabel: SUBTASTE_LABELS[stress],
    generates: WU_XING_GEN[el],
    overcomeBy: WU_XING_KE[el] === el ? el : (() => {
      for (const [k, v] of Object.entries(WU_XING_KE)) {
        if (v === el) return k as WuXingElement;
      }
      return el;
    })(),
  };
}

// Reads the canonical Subtaste code from timelineState, normalising
// any legacy string format ("S-0 KĔṮU") to the new key ("S-0").
function readStoredSubtaste(character: Character): SubtasteDesignation | null {
  const ts = character.timelineState as
    | { oripheon?: { generated?: { subtaste?: { code?: unknown } } } }
    | undefined;
  const raw = ts?.oripheon?.generated?.subtaste?.code;
  if (typeof raw !== 'string') return null;
  // Take the leading code chunk before any space (handles both "R-10"
  // and legacy "R-10 TΞχRA" formats).
  const code = raw.split(/\s+/)[0];
  // Map legacy 'NULL' to canonical 'Ø'.
  const normalised = code === 'NULL' ? 'Ø' : code;
  if (normalised in PHASE_MAP) return normalised as SubtasteDesignation;
  return null;
}

// ============================================================================
// COMPONENT TYPES
// ============================================================================

interface SuggestedRelationshipsPanelProps {
  selectedCharacter: Character;
  allCharacters: Character[];
  onCreateRelationship: (data: CreateRelationshipInput) => Promise<void>;
}

type ContextTab = 'love' | 'friendship' | 'creativeTeam' | 'storyTension';

interface ScoredCharacter {
  character: Character;
  matrix: RelationshipMatrix;
  score: number;
  profileB: ProfileAnalysis;
}

// ============================================================================
// HELPERS
// ============================================================================

function extractAxes(character: Character): Axes | null {
  const oripheon = character.timelineState?.oripheon as
    | { generated?: { personality?: { axes?: Record<string, number> } } }
    | undefined;

  const axes = oripheon?.generated?.personality?.axes;
  if (
    axes &&
    typeof axes.orderChaos === 'number' &&
    typeof axes.mercyRuthlessness === 'number' &&
    typeof axes.introvertExtrovert === 'number' &&
    typeof axes.faithDoubt === 'number'
  ) {
    return {
      orderChaos: axes.orderChaos,
      mercyRuthlessness: axes.mercyRuthlessness,
      introvertExtrovert: axes.introvertExtrovert,
      faithDoubt: axes.faithDoubt,
    };
  }
  return null;
}

const TAB_LABELS: Record<ContextTab, string> = {
  love: 'Love',
  friendship: 'Friend',
  creativeTeam: 'Creative',
  storyTension: 'Tension',
};

const WU_XING_SYMBOLS: Record<string, string> = {
  wood: '\u6728',   // 木
  fire: '\u706b',   // 火
  earth: '\u571f',  // 土
  metal: '\u91d1',  // 金
  water: '\u6c34',  // 水
};

const CYCLE_LABELS: Record<string, string> = {
  generating: 'Sheng',
  overcoming: 'Ke',
  neutral: '\u2014',
};

// ============================================================================
// COMPONENT
// ============================================================================

export function SuggestedRelationshipsPanel({
  selectedCharacter,
  allCharacters,
  onCreateRelationship,
}: SuggestedRelationshipsPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<ContextTab>('love');
  const [creating, setCreating] = useState<string | null>(null);

  const selectedAxes = extractAxes(selectedCharacter);
  const selectedProfile = useMemo(
    () => (selectedAxes ? analyzeProfile(selectedAxes) : null),
    [selectedAxes?.orderChaos, selectedAxes?.mercyRuthlessness, selectedAxes?.introvertExtrovert, selectedAxes?.faithDoubt],
  );

  const scored: ScoredCharacter[] = useMemo(() => {
    if (!selectedProfile) return [];

    return allCharacters
      .filter(c => c.id !== selectedCharacter.id)
      .map(c => {
        const axes = extractAxes(c);
        if (!axes) return null;
        const profileB = analyzeProfile(axes);
        const matrix = computeMatrix(selectedProfile, profileB);
        return { character: c, matrix, score: matrix.contextual[activeTab], profileB };
      })
      .filter((x): x is ScoredCharacter => x !== null)
      .sort((a, b) => b.score - a.score);
  }, [selectedProfile, allCharacters, selectedCharacter.id, activeTab]);

  if (!selectedProfile || scored.length === 0) return null;

  const handleCreate = async (targetId: string, suggestedType: RelationshipType) => {
    setCreating(targetId);
    try {
      await onCreateRelationship({
        sourceCharacterId: selectedCharacter.id,
        targetCharacterId: targetId,
        relationshipType: suggestedType,
      });
    } finally {
      setCreating(null);
    }
  };

  return (
    <div className="suggested-panel">
      <div
        className="suggested-panel-header"
        onClick={() => setCollapsed(!collapsed)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') setCollapsed(!collapsed); }}
      >
        <span className="suggested-panel-title">Suggested Relationships</span>
        <span className="suggested-panel-toggle">{collapsed ? '+' : '\u2212'}</span>
      </div>

      {!collapsed && (
        <>
          <div className="suggested-tabs">
            {(Object.keys(TAB_LABELS) as ContextTab[]).map(tab => (
              <button
                key={tab}
                className={`suggested-tab${activeTab === tab ? ' suggested-tab-active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>

          <div className="suggested-cards">
            {scored.slice(0, 6).map(({ character, matrix, score, profileB }) => {
              const pct = Math.round(score * 100);
              const topSuggested = matrix.suggestedRelationshipTypes[0] || 'ALLY';
              const mentorNote = matrix.mentorDirection
                ? (matrix.mentorDirection.mentorIsA ? 'mentors \u2192' : '\u2190 mentored by')
                : '';

              return (
                <div key={character.id} className="suggested-card">
                  <div className="suggested-card-top">
                    <span className="suggested-card-name">{character.name}</span>
                    <span className="suggested-card-pct">{pct}%</span>
                  </div>

                  <div className="suggested-bar-track">
                    <div className="suggested-bar-fill" style={{ width: `${pct}%` }} />
                  </div>

                  <div className="suggested-card-meta">
                    <span className="suggested-wu-xing">
                      {WU_XING_SYMBOLS[selectedProfile.wuXingElement] || '?'}
                      {' '}
                      {CYCLE_LABELS[matrix.base.relationalCycle]}
                      {' '}
                      {WU_XING_SYMBOLS[profileB.wuXingElement] || '?'}
                    </span>
                    <span className="suggested-types">
                      {matrix.suggestedRelationshipTypes.slice(0, 2).join(' / ')}
                    </span>
                  </div>

                  {mentorNote && (
                    <div className="suggested-mentor-note">{mentorNote}</div>
                  )}

                  <button
                    className="btn btn-sm suggested-create-btn"
                    disabled={creating === character.id}
                    onClick={() => handleCreate(character.id, topSuggested as RelationshipType)}
                  >
                    {creating === character.id ? '...' : `+ ${topSuggested}`}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
