'use client';

import { useRef, useState, useEffect } from 'react';
import { createCharacter } from '@/lib/api';
import {
  ORIPHEON_API_URL,
  ORIPHEON_GENDERS,
  ORIPHEON_ORDERS,
  ORIPHEON_TITLES,
  formatOripheonName,
  generateOripheonAvatar,
  oripheonAvatarToCreateCharacterInput,
  generateLCOSCharacter,
  lcosGeneratedToCreateCharacterInput,
  type OripheonAvatar,
  type OripheonAvatarGenerationParams,
  type OripheonGender,
  type OripheonOrderType,
  type OripheonNameMode,
  type OripheonTarotArchetype,
  type LCOSGeneratedCharacter,
  type Relic,
} from '@/lib/oripheon';
import { ImageUpload } from './ImageUpload';
import {
  generateCharenomePreview,
  generateSampleTweet,
  type CharenomePreview,
} from '@/lib/charenome';
import { SUBTASTE_DESIGNATIONS } from '@lcos/oripheon';

// ============================================================================
// OPTION CONSTANTS (matching Slayt's GeneratorPanel format)
// ============================================================================

const HERITAGE_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'yoruba', label: 'Yoruba' },
  { value: 'igbo', label: 'Igbo' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'european', label: 'European' },
  { value: 'celtic', label: 'Celtic' },
  { value: 'norse', label: 'Norse' },
  { value: 'blend', label: 'Blend' },
];

const GENDER_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'masculine', label: 'Masculine' },
  { value: 'feminine', label: 'Feminine' },
  { value: 'neutral', label: 'Neutral' },
];

const NAME_MODES = [
  { value: 'standard', label: 'Standard' },
  { value: 'mononym-squishe', label: 'Squishe' },
  { value: 'mononym-simple', label: 'Simple' },
  { value: 'aminal-blend', label: 'Aminal Blend' },
  { value: 'aminal-clear', label: 'Aminal Clear' },
];

const CORE_STYLES = [
  { value: '', label: 'None' },
  { value: 'drowned_mall', label: 'Drowned Mall' },
  { value: 'hex_garden', label: 'Hex Garden' },
  { value: 'sugar_rot', label: 'Sugar Rot' },
  { value: 'dead_channel', label: 'Dead Channel' },
  { value: 'spore_drift', label: 'Spore Drift' },
  { value: 'wrong_room', label: 'Wrong Room' },
  { value: 'bone_clean', label: 'Bone Clean' },
  { value: 'lambda', label: 'Lambda' },
];

// ============================================================================
// SUB-COMPONENTS (ported from Slayt's GeneratorPanel)
// ============================================================================

function PillSelector({ label, options, value, onChange }: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{
      padding: '0.5rem 0.625rem',
      backgroundColor: 'rgba(0,0,0,0.25)',
      borderRadius: '0.375rem',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <label style={{
        display: 'block',
        fontSize: '0.65rem',
        color: 'rgba(255,255,255,0.4)',
        marginBottom: '0.375rem',
        textTransform: 'none',
        letterSpacing: '0.12em',
        fontWeight: 500,
        fontFamily: 'monospace',
      }}>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '0.25rem',
              fontSize: '0.7rem',
              fontWeight: 500,
              fontFamily: 'monospace',
              transition: 'all 0.15s ease',
              cursor: 'pointer',
              ...(value === opt.value
                ? {
                    background: 'rgba(255,255,255,0.1)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.3)',
                  }
                : {
                    background: 'rgba(255,255,255,0.03)',
                    color: 'rgba(255,255,255,0.45)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }),
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function GenBadge({ children, variant = 'default' }: {
  children: React.ReactNode;
  variant?: 'default' | 'purple' | 'blue' | 'amber';
}) {
  const variants: Record<string, React.CSSProperties> = {
    default: { background: 'var(--muted)', color: 'var(--muted-foreground)' },
    purple: {
      background: 'rgba(168, 85, 247, 0.1)',
      color: '#c4b5fd',
      border: '1px solid rgba(168, 85, 247, 0.2)',
    },
    blue: {
      background: 'rgba(99, 102, 241, 0.08)',
      color: 'var(--muted-foreground)',
      border: '1px solid rgba(99, 102, 241, 0.2)',
    },
    amber: {
      background: 'rgba(139, 92, 246, 0.08)',
      color: '#c4b5fd',
      border: '1px solid rgba(139, 92, 246, 0.15)',
    },
  };
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.125rem 0.5rem',
      borderRadius: '0.25rem',
      fontSize: '0.75rem',
      fontWeight: 500,
      ...variants[variant],
    }}>
      {children}
    </span>
  );
}

function AxisBar({ value, leftLabel, rightLabel }: {
  label?: string;
  value: number;
  leftLabel: string;
  rightLabel: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
      <span style={{ color: 'var(--muted-foreground)', width: '4rem', textAlign: 'right', flexShrink: 0 }}>{leftLabel}</span>
      <div style={{
        flex: 1,
        height: '0.375rem',
        background: 'var(--muted)',
        borderRadius: '9999px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${value * 100}%`,
          background: 'rgba(255,255,255,0.35)',
          borderRadius: '9999px',
          transition: 'width 0.3s ease',
        }} />
      </div>
      <span style={{ color: 'var(--muted-foreground)', width: '4rem', flexShrink: 0 }}>{rightLabel}</span>
    </div>
  );
}

function CollapsibleSection({ title, expanded, onToggle, summary, children, borderColor }: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  summary?: React.ReactNode;
  children: React.ReactNode;
  borderColor?: string;
}) {
  return (
    <div style={{
      background: 'var(--muted)',
      borderRadius: '0.375rem',
      border: `1px solid ${borderColor || 'var(--border)'}`,
      marginBottom: '0.5rem',
      overflow: 'hidden',
    }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '0.5rem 0.75rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--foreground)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{
            fontSize: '0.5rem',
            display: 'inline-block',
            transition: 'transform 0.15s ease',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            color: borderColor || 'var(--muted-foreground)',
          }}>▶</span>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 500,
            textTransform: 'none',
            letterSpacing: '0.1em',
            color: borderColor || 'var(--muted-foreground)',
          }}>{title}</span>
        </div>
        {!expanded && summary && (
          <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', opacity: 0.7 }}>
            {summary}
          </div>
        )}
      </button>
      {expanded && (
        <div style={{ padding: '0 0.75rem 0.625rem' }}>
          {children}
        </div>
      )}
    </div>
  );
}

type PromptSuggestions = { traits: string[]; skills: string[] };

const BASE_PROMPT_SUGGESTIONS: PromptSuggestions = {
  traits: [
    'Stoic',
    'Cunning',
    'Visionary',
    'Merciful',
    'Ruthless',
    'Devout',
    'Rebellious',
    'Curious',
    'Elegant',
    'Haunted',
    'Radiant',
    'Playful',
  ],
  skills: [
    'Storm weaving',
    'Oath keeping',
    'Ciphercraft',
    'Ritual healing',
    'Blade work',
    'Archive diving',
    'Bounty hunting',
    'Forge craft',
    'Dream reading',
    'Negotiation',
    'Songbinding',
    'Cartography',
  ],
};

const ORDER_PROMPT_SUGGESTIONS: Partial<Record<OripheonOrderType, PromptSuggestions>> = {
  angel: {
    traits: ['Oathbound', 'Vigilant', 'Radiant', 'Compassionate'],
    skills: ['Sanctuary rites', 'Hymncraft', 'Judgement', 'Shield-bearing'],
  },
  demon: {
    traits: ['Ambitious', 'Clever', 'Unforgiving', 'Tempting'],
    skills: ['Pactwriting', 'Shadow bargaining', 'Bloodforging', 'Fearcraft'],
  },
  jinn: {
    traits: ['Restless', 'Wry', 'Elusive', 'Proud'],
    skills: ['Mirage craft', 'Windbinding', 'Ember couriering', 'Secret trading'],
  },
  human: {
    traits: ['Stubborn', 'Pragmatic', 'Brave', 'Inventive'],
    skills: ['Wayfinding', 'Tinkering', 'Field medicine', 'Diplomacy'],
  },
  titan: {
    traits: ['Immovable', 'Ancient', 'Protective', 'Severe'],
    skills: ['World-shaping', 'Oathstone carving', 'Mountainkeeping', 'Siege lore'],
  },
  fae: {
    traits: ['Capricious', 'Graceful', 'Secretive', 'Charming'],
    skills: ['Glamour', 'Moonweaving', 'Bargaining', 'Wild hunt riding'],
  },
  yokai: {
    traits: ['Tricksy', 'Observant', 'Feral', 'Honorable'],
    skills: ['Shapeshifting', 'Boundary warding', 'Spirit bargaining', 'Storm calling'],
  },
  elemental: {
    traits: ['Unyielding', 'Volatile', 'Serene', 'Wild'],
    skills: ['Flame warding', 'Tide calling', 'Wind whispering', 'Stone singing'],
  },
  nephilim: {
    traits: ['Fierce', 'Burdened', 'Resolute', 'Protective'],
    skills: ['Sky dueling', 'Giant-lore', 'Oath bearing', 'Mercy trials'],
  },
  archon: {
    traits: ['Austere', 'Precise', 'Principled', 'Cold'],
    skills: ['Lawweaving', 'Reality auditing', 'Sigil adjudication', 'Cosmic calculus'],
  },
  dragonkin: {
    traits: ['Proud', 'Patient', 'Dominant', 'Wise'],
    skills: ['Skyfire tactics', 'Hoard divination', 'Oathfire', 'Scale rites'],
  },
  construct: {
    traits: ['Methodical', 'Loyal', 'Quiet', 'Unblinking'],
    skills: ['Circuit hymn', 'Gearcraft', 'Memory warding', 'Axiom engraving'],
  },
  eldritch: {
    traits: ['Uncanny', 'Detached', 'Intense', 'Prophetic'],
    skills: ['Void listening', 'Dream walking', 'Horizon scrying', 'Sigil fracture'],
  },
  trickster: {
    traits: ['Playful', 'Chaotic', 'Ironic', 'Unpredictable'],
    skills: ['Prankcraft', 'Satire', 'Misdirection', 'Chaos rites'],
  },
};

const PATH_PROMPT_SUGGESTIONS: Partial<Record<OripheonTarotArchetype, PromptSuggestions>> = {
  magician: {
    traits: ['Inventive', 'Precise', 'Bold'],
    skills: ['Sigil calculus', 'Illusion weaving', 'Ritual engineering'],
  },
  high_priestess: {
    traits: ['Oracular', 'Serene', 'Veil-touched'],
    skills: ['Prophecy', 'Dream reading', 'Silent rites'],
  },
  hermit: {
    traits: ['Patient', 'Quiet', 'Observant'],
    skills: ['Pilgrimage', 'Hidden lore', 'Lantern rites'],
  },
  chariot: {
    traits: ['Driven', 'Disciplined', 'Brave'],
    skills: ['Command', 'Escort tactics', 'Ward riding'],
  },
  star: {
    traits: ['Hopeful', 'Gentle', 'Bright'],
    skills: ['Healing', 'Guidance', 'Omen reading'],
  },
  devil: {
    traits: ['Tempting', 'Ambitious', 'Unflinching'],
    skills: ['Pactbinding', 'Desirecraft', 'Chain lore'],
  },
};

const ORIPHEON_PATH_OPTIONS: Array<{ id: OripheonTarotArchetype; label: string }> = [
  { id: 'magician', label: 'Magician' },
  { id: 'high_priestess', label: 'High Priestess' },
  { id: 'empress', label: 'Empress' },
  { id: 'emperor', label: 'Emperor' },
  { id: 'hierophant', label: 'Hierophant' },
  { id: 'lovers', label: 'Lovers' },
  { id: 'chariot', label: 'Chariot' },
  { id: 'strength', label: 'Strength' },
  { id: 'hermit', label: 'Hermit' },
  { id: 'wheel_of_fortune', label: 'Wheel of Fortune' },
  { id: 'justice', label: 'Justice' },
  { id: 'hanged_man', label: 'Hanged Man' },
  { id: 'death', label: 'Death' },
  { id: 'temperance', label: 'Temperance' },
  { id: 'devil', label: 'Devil' },
  { id: 'tower', label: 'Tower' },
  { id: 'star', label: 'Star' },
  { id: 'moon', label: 'Moon' },
  { id: 'sun', label: 'Sun' },
  { id: 'judgement', label: 'Judgement' },
  { id: 'world', label: 'World' },
  { id: 'fool', label: 'Fool' },
];

interface NewCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function NewCharacterModal({ isOpen, onClose, onCreated }: NewCharacterModalProps) {
  const [mode, setMode] = useState<'quick' | 'oripheon' | 'manual'>('quick');
  const oripheonAbortRef = useRef<AbortController | null>(null);
  const lcosAbortRef = useRef<AbortController | null>(null);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [aliases, setAliases] = useState('');
  const [personaTags, setPersonaTags] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Quick mode (built-in LCOS generator)
  const [lcosGenerated, setLcosGenerated] = useState<LCOSGeneratedCharacter | null>(null);
  const [lcosGenerating, setLcosGenerating] = useState(false);
  const [charenomePreview, setCharenomePreview] = useState<CharenomePreview | null>(null);
  const [creatingCharenome, setCreatingCharenome] = useState(false);
  const [lcosHeritage, setLcosHeritage] = useState<string>('');
  const [lcosGender, setLcosGender] = useState<string>('');
  const [lcosSeed, setLcosSeed] = useState<string>('');
  const [lcosAvatarUrl, setLcosAvatarUrl] = useState<string | null>(null);
  const [creatingFromLcos, setCreatingFromLcos] = useState(false);
  const [lcosRelicEra, setLcosRelicEra] = useState<'archaic' | 'modern' | 'timeless'>('modern');
  const [lcosLockedRelic, setLcosLockedRelic] = useState<Relic | null>(null);
  const [lcosCore, setLcosCore] = useState<string>('');
  const [lcosVariance, setLcosVariance] = useState<number>(0);
  const [lcosNameMode, setLcosNameMode] = useState<string>('standard');
  const [_lcosShowDetails, setLcosShowDetails] = useState(false);
  const [lcosAdminMode, setLcosAdminMode] = useState(false);
  const [lcosMode, setLcosMode] = useState<'character' | 'relic'>('character');
  // Òrò cultural-mode state. When enabled, the name comes from the
  // diasporic naming engine (@violet-sphinx/names) and replaces the
  // heritage-pool name. Backstory + arcana + relics still come from
  // Bóveda's engine.
  const [oroCulturalEnabled, setOroCulturalEnabled] = useState(false);
  const [oroCultures, setOroCultures] = useState<string[]>(['yoruba', 'igbo', 'akan', 'vodou']);
  const [oroForm, setOroForm] = useState<'first' | 'first_surname' | 'mononym' | 'full_with_epithet'>('first_surname');
  const [oroOrnament, setOroOrnament] = useState<0 | 0.5 | 1>(0.5);
  const [oroWithTitle, setOroWithTitle] = useState(false);
  const [oroSurnameRegister, setOroSurnameRegister] = useState<'auto' | 'colonial' | 'reclaimed' | 'compound'>('auto');
  const [imprintExpanded, setGenomeExpanded] = useState(false);
  const [lcosSettingsExpanded, setLcosSettingsExpanded] = useState(true);
  const [lcosClassExpanded, setLcosClassExpanded] = useState(false);
  const [lcosBackstoryExpanded, setLcosBackstoryExpanded] = useState(false);
  const [primaryDetailExpanded, setPrimaryDetailExpanded] = useState(false);
  const [subDetailExpanded, setSubDetailExpanded] = useState<Record<number, boolean>>({});

  // Advanced Oripheon mode (external API)
  const [oripheonSeed, setOripheonSeed] = useState<string>('');
  const [oripheonOrder, setOripheonOrder] = useState<OripheonOrderType | ''>('');
  const [oripheonGender, setOripheonGender] = useState<OripheonGender | ''>('');
  const [oripheonPath, setOripheonPath] = useState<OripheonTarotArchetype | ''>('');
  const [oripheonLengthPreference, setOripheonLengthPreference] = useState<'' | 'short' | 'long'>(
    ''
  );
  const [oripheonNameMode, setOripheonNameMode] = useState<OripheonNameMode | ''>('');
  const [oripheonIncludeTitle, setOripheonIncludeTitle] = useState(false);
  const [oripheonSelectedTitle, setOripheonSelectedTitle] = useState<string>('');
  const [oripheonResolvedTitle, setOripheonResolvedTitle] = useState<string | null>(null);
  const [personaDescription, setPersonaDescription] = useState('');
  const [desiredTraits, setDesiredTraits] = useState('');
  const [desiredSkills, setDesiredSkills] = useState('');
  const [preferredNames, setPreferredNames] = useState('');
  const [sigilBloomEnabled, setSigilBloomEnabled] = useState(false);
  const [sigilBloomIntensity, setSigilBloomIntensity] = useState(35);
  const [generatedAvatar, setGeneratedAvatar] = useState<OripheonAvatar | null>(null);
  const [oripheonAvatarUrl, setOripheonAvatarUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [creatingFromOripheon, setCreatingFromOripheon] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Auto-generate when modal opens in quick mode
  useEffect(() => {
    if (isOpen && mode === 'quick' && !lcosGenerated && !lcosGenerating) {
      // Delay to avoid setState during render
      const timeoutId = setTimeout(() => {
        handleGenerateLCOS();
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, mode, lcosGenerated, lcosGenerating]);

  if (!isOpen) return null;

  const resetState = () => {
    oripheonAbortRef.current?.abort();
    oripheonAbortRef.current = null;
    lcosAbortRef.current?.abort();
    lcosAbortRef.current = null;

    setMode('quick');
    setError(null);
    setLoading(false);
    setGenerating(false);
    setCreatingFromOripheon(false);

    setName('');
    setBio('');
    setAliases('');
    setPersonaTags('');
    setAvatarUrl(null);

    // Quick mode state
    setLcosGenerated(null);
    setLcosGenerating(false);
    setCharenomePreview(null);
    setCreatingCharenome(false);
    setLcosHeritage('');
    setLcosGender('');
    setLcosSeed('');
    setLcosAvatarUrl(null);
    setCreatingFromLcos(false);
    setLcosRelicEra('modern');
    setLcosLockedRelic(null);
    setLcosCore('');
    setLcosVariance(0);
    setLcosNameMode('standard');
    setLcosShowDetails(false);
    setLcosAdminMode(false);
    setLcosMode('character');
    setGenomeExpanded(false);
    setLcosSettingsExpanded(true);
    setLcosClassExpanded(false);
    setLcosBackstoryExpanded(false);
    setPrimaryDetailExpanded(false);
    setSubDetailExpanded({});

    // Advanced Oripheon state
    setOripheonSeed('');
    setOripheonOrder('');
    setOripheonGender('');
    setOripheonPath('');
    setOripheonLengthPreference('');
    setOripheonNameMode('');
    setOripheonIncludeTitle(false);
    setOripheonSelectedTitle('');
    setOripheonResolvedTitle(null);
    setPersonaDescription('');
    setDesiredTraits('');
    setDesiredSkills('');
    setPreferredNames('');
    setSigilBloomEnabled(false);
    setSigilBloomIntensity(35);
    setGeneratedAvatar(null);
    setOripheonAvatarUrl(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // LCOS Quick Generate handler
  const handleGenerateLCOS = async () => {
    lcosAbortRef.current?.abort();
    const controller = new AbortController();
    lcosAbortRef.current = controller;

    setLcosGenerating(true);
    setError(null);

    try {
      const seedNumber = Number(lcosSeed);
      const isBlend = lcosHeritage === 'blend';
      const isMononym = lcosNameMode !== 'standard';
      let mononymType: string | undefined;
      if (lcosNameMode === 'mononym-squishe') mononymType = 'squishe';
      else if (lcosNameMode === 'mononym-simple') mononymType = 'simple';
      else if (lcosNameMode === 'aminal-blend') mononymType = 'aminal-blend';
      else if (lcosNameMode === 'aminal-clear') mononymType = 'aminal-clear';

      const isRelic = lcosMode === 'relic';

      const generated = await generateLCOSCharacter(
        {
          seed: Number.isFinite(seedNumber) && seedNumber > 0 ? seedNumber : undefined,
          heritage: isBlend ? undefined : (lcosHeritage || undefined),
          gender: lcosGender || undefined,
          blendHeritage: isBlend,
          mononym: isMononym,
          mononymType: mononymType as 'squishe' | 'simple' | 'aminal-blend' | 'aminal-clear' | undefined,
          relic: isRelic,
          relicEra: isRelic ? (lcosRelicEra || undefined) : undefined,
          lockedRelic: lcosLockedRelic || undefined,
          core: lcosCore || undefined,
          variance: lcosVariance > 0 ? lcosVariance : undefined,
          // Cultural mode: Òrò engine takes the name surface, Bóveda
          // keeps backstory / arcana / relics.
          cultural: oroCulturalEnabled || undefined,
          culturalCultures: oroCulturalEnabled ? oroCultures : undefined,
          culturalForm: oroCulturalEnabled ? oroForm : undefined,
          culturalOrnament: oroCulturalEnabled ? oroOrnament : undefined,
          culturalWithTitle: oroCulturalEnabled && oroWithTitle ? true : undefined,
          culturalSurnameRegister:
            oroCulturalEnabled && oroSurnameRegister !== 'auto'
              ? oroSurnameRegister
              : undefined,
          culturalGender:
            oroCulturalEnabled && lcosGender
              ? lcosGender === 'feminine'
                ? 'f'
                : lcosGender === 'masculine'
                  ? 'm'
                  : 'a'
              : undefined,
        },
        { signal: controller.signal }
      );
      setLcosGenerated(generated);
      // Generate charenome preview
      const preview = generateCharenomePreview(generated);
      setCharenomePreview(preview);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to generate character');
    } finally {
      if (lcosAbortRef.current === controller) {
        lcosAbortRef.current = null;
      }
      setLcosGenerating(false);
    }
  };

  const handleCreateFromLCOS = async () => {
    if (!lcosGenerated) return;
    setCreatingFromLcos(true);
    setError(null);

    try {
      const characterData = lcosGeneratedToCreateCharacterInput(lcosGenerated);
      // Add avatar URL if uploaded
      if (lcosAvatarUrl) {
        (characterData as any).avatarUrl = lcosAvatarUrl;
      }
      await createCharacter(characterData);
      onCreated();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create character');
    } finally {
      setCreatingFromLcos(false);
    }
  };

  // Create Charenome - synced character + genome
  const handleCreateCharenome = async () => {
    if (!lcosGenerated || !charenomePreview) return;
    setCreatingCharenome(true);
    setError(null);

    try {
      // First create the character
      const characterData = lcosGeneratedToCreateCharacterInput(lcosGenerated);
      if (lcosAvatarUrl) {
        (characterData as any).avatarUrl = lcosAvatarUrl;
      }
      // Add voice type to persona tags
      characterData.personaTags = [
        ...(characterData.personaTags || []),
        charenomePreview.voice.type,
        charenomePreview.orisha.toLowerCase().replace(/[^a-z]/g, ''),
      ];
      const character = await createCharacter(characterData);

      // Then create the genome and link it
      const genomeData = {
        name: `${lcosGenerated.name} Imprint`,
        characterId: character.id,
        orishaConfiguration: {
          headOrisha: charenomePreview.orisha,
          camino: charenomePreview.camino,
          secondaryInfluences: charenomePreview.secondaryInfluences,
        },
        kabbalisticPosition: {
          primarySephira: charenomePreview.sephira,
          pillar: getPillarFromSephira(charenomePreview.sephira),
          daathRelationship: charenomePreview.sephira === 'Daath' ? 'touched' : 'seeking',
        },
        psychologicalState: {
          hotCoolAxis: charenomePreview.hotCoolAxis,
          trajectory: charenomePreview.trajectory,
          individuationLevel: 30 + Math.floor(Math.random() * 40),
          shadowIntegration: 20 + Math.floor(Math.random() * 30),
          activeArchetypes: [lcosGenerated.arcana?.archetype || 'seeker'],
        },
        multiModalSignature: {
          voice: {
            type: charenomePreview.voice.type,
            quality: charenomePreview.voice.quality,
            pattern: charenomePreview.voice.pattern,
          },
        },
        narrativeIdentity: {
          coreValues: [lcosGenerated.personality?.coreDesire || 'self-discovery'],
          centralConflicts: lcosGenerated.arcana?.shadowThemes || ['inner conflict'],
          narrativeThemes: [lcosGenerated.order?.name || 'human', charenomePreview.trajectory],
          telos: lcosGenerated.personality?.coreDesire || 'to discover true self',
        },
      };

      // Create genome via API
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'default-dev-key';

      await fetch(`${API_URL}/genomes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify(genomeData),
      });

      onCreated();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create charenome');
    } finally {
      setCreatingCharenome(false);
    }
  };

  function getPillarFromSephira(sephira: string): 'mercy' | 'severity' | 'balance' {
    const pillarMap: Record<string, 'mercy' | 'severity' | 'balance'> = {
      'Chokmah': 'mercy', 'Chesed': 'mercy', 'Netzach': 'mercy',
      'Binah': 'severity', 'Geburah': 'severity', 'Hod': 'severity',
      'Kether': 'balance', 'Tiphareth': 'balance', 'Yesod': 'balance', 'Malkuth': 'balance', 'Daath': 'balance',
    };
    return pillarMap[sephira] || 'balance';
  }

  const parseCsv = (value: string): string[] =>
    value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

  const normalizeCsvValue = (value: string): string => value.trim().toLowerCase();

  const appendCsvValue = (current: string, value: string): string => {
    const cleaned = value.trim();
    if (!cleaned) return current;
    const existing = parseCsv(current);
    const targetKey = normalizeCsvValue(cleaned);
    if (existing.some((v) => normalizeCsvValue(v) === targetKey)) return current;
    return [...existing, cleaned].join(', ');
  };

  const dedupeSuggestions = (values: string[]): string[] => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const value of values) {
      const key = normalizeCsvValue(value);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push(value);
    }
    return result;
  };

  const getSuggestedPromptValues = (): PromptSuggestions => {
    const orderSuggestions = oripheonOrder ? ORDER_PROMPT_SUGGESTIONS[oripheonOrder] : undefined;
    const pathSuggestions = oripheonPath ? PATH_PROMPT_SUGGESTIONS[oripheonPath] : undefined;

    return {
      traits: dedupeSuggestions([
        ...(pathSuggestions?.traits ?? []),
        ...(orderSuggestions?.traits ?? []),
        ...BASE_PROMPT_SUGGESTIONS.traits,
      ]),
      skills: dedupeSuggestions([
        ...(pathSuggestions?.skills ?? []),
        ...(orderSuggestions?.skills ?? []),
        ...BASE_PROMPT_SUGGESTIONS.skills,
      ]),
    };
  };

  const suggestedPromptValues = getSuggestedPromptValues();
  const selectedTraitKeys = new Set(parseCsv(desiredTraits).map(normalizeCsvValue));
  const selectedSkillKeys = new Set(parseCsv(desiredSkills).map(normalizeCsvValue));
  const traitSuggestions = suggestedPromptValues.traits
    .filter((value) => !selectedTraitKeys.has(normalizeCsvValue(value)))
    .slice(0, 12);
  const skillSuggestions = suggestedPromptValues.skills
    .filter((value) => !selectedSkillKeys.has(normalizeCsvValue(value)))
    .slice(0, 12);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createCharacter({
        name,
        bio,
        avatarUrl: avatarUrl || undefined,
        aliases: aliases
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
        personaTags: personaTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
      onCreated();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create character');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateOripheon = async () => {
    oripheonAbortRef.current?.abort();
    const controller = new AbortController();
    oripheonAbortRef.current = controller;

    setGenerating(true);
    setError(null);

    try {
      const seedNumber = Number(oripheonSeed);

      const resolvedTitle: string | null =
        !oripheonIncludeTitle
          ? null
          : oripheonSelectedTitle ||
            ORIPHEON_TITLES[Math.floor(Math.random() * ORIPHEON_TITLES.length)] ||
            null;
      setOripheonResolvedTitle(resolvedTitle);

      // Build identity params
      const identityParams: OripheonAvatarGenerationParams['identity'] = {};
      if (oripheonGender) identityParams.gender = oripheonGender;
      if (oripheonLengthPreference) identityParams.lengthPreference = oripheonLengthPreference;
      if (oripheonNameMode) identityParams.nameMode = oripheonNameMode;

      // Title handling:
      // - `null` explicitly disables titles in Oripheon.
      // - For fused mononyms, we keep the title client-side to avoid fusing it into the mononym.
      if (!oripheonIncludeTitle) {
        identityParams.title = null;
      } else if (oripheonNameMode === 'fused_mononym') {
        identityParams.title = null;
      } else if (resolvedTitle) {
        identityParams.title = resolvedTitle;
      }

      const rawPreferredNames = preferredNames.trim() ? parseCsv(preferredNames) : [];
      const preparedPreferredNames =
        oripheonNameMode === 'fused_mononym' && rawPreferredNames.length >= 2
          ? [`${rawPreferredNames[0]} ${rawPreferredNames[1]}`, ...rawPreferredNames.slice(2)]
          : rawPreferredNames;

      const params: OripheonAvatarGenerationParams = {
        ...(Number.isFinite(seedNumber) && seedNumber > 0 ? { seed: seedNumber } : {}),
        ...(oripheonOrder || oripheonPath
          ? {
              being: {
                ...(oripheonOrder ? { order: oripheonOrder } : {}),
                ...(oripheonPath ? { tarotArchetype: oripheonPath } : {}),
              },
            }
          : {}),
        ...(Object.keys(identityParams).length > 0 ? { identity: identityParams } : {}),
        prompt: {
          ...(personaDescription.trim() ? { personaDescription: personaDescription.trim() } : {}),
          ...(desiredTraits.trim() ? { desiredTraits: parseCsv(desiredTraits) } : {}),
          ...(desiredSkills.trim() ? { desiredSkills: parseCsv(desiredSkills) } : {}),
          ...(preparedPreferredNames.length > 0 ? { preferredNames: preparedPreferredNames } : {}),
          sigilBloom: { enabled: sigilBloomEnabled, intensity: sigilBloomIntensity },
        },
      };

      const avatar = await generateOripheonAvatar(params, { signal: controller.signal });
      setGeneratedAvatar(avatar);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      const message =
        err instanceof Error
          ? err.message
          : `Failed to generate avatar via Oripheon (${ORIPHEON_API_URL})`;
      setError(
        `${message}. Make sure Oripheon is running (in your \`oripheon/\` folder: \`npm run dev\`).`
      );
    } finally {
      if (oripheonAbortRef.current === controller) {
        oripheonAbortRef.current = null;
      }
      setGenerating(false);
    }
  };

  const getOripheonDisplayName = (avatar: OripheonAvatar): string => {
    const base = formatOripheonName(avatar.identity.primaryName) || 'Unnamed';
    if (
      oripheonIncludeTitle &&
      oripheonResolvedTitle &&
      avatar.identity.primaryName.nameMode === 'fused_mononym'
    ) {
      return `${oripheonResolvedTitle} ${avatar.identity.primaryName.mononym || base}`.trim();
    }
    return base;
  };

  const handleCreateFromOripheon = async () => {
    if (!generatedAvatar) return;
    setCreatingFromOripheon(true);
    setError(null);

    try {
      const characterData = oripheonAvatarToCreateCharacterInput(generatedAvatar);
      const displayName = getOripheonDisplayName(generatedAvatar);
      characterData.name = displayName;
      if (characterData.systemPrompt) {
        const lines = characterData.systemPrompt.split('\n');
        if (lines.length > 0) {
          lines[0] = `You are ${displayName}.`;
          characterData.systemPrompt = lines.join('\n');
        }
      }
      // Add avatar URL if uploaded
      if (oripheonAvatarUrl) {
        (characterData as any).avatarUrl = oripheonAvatarUrl;
      }
      await createCharacter(characterData);
      onCreated();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create character');
    } finally {
      setCreatingFromOripheon(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
        <div className="modal-header">
          <h2 className="modal-title">New Character</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => {
                const next = !lcosAdminMode;
                setLcosAdminMode(next);
                if (!next && mode !== 'quick') setMode('quick');
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.375rem',
                borderRadius: '0.5rem',
                color: lcosAdminMode ? 'var(--foreground)' : 'var(--muted-foreground)',
                transition: 'color 0.15s ease',
                fontSize: '0.85rem',
                opacity: lcosAdminMode ? 1 : 0.4,
              }}
              title={lcosAdminMode ? 'Hide admin controls' : 'Show admin controls'}
            >
              {lcosAdminMode ? '◉' : '◎'}
            </button>
            <button className="modal-close" onClick={handleClose}>
              X
            </button>
          </div>
        </div>

        {lcosAdminMode && (
          <div className="flex gap-2" style={{ marginBottom: '1rem' }}>
            <button
              type="button"
              className={mode === 'quick' ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => setMode('quick')}
            >
              Quick Generate
            </button>
            <button
              type="button"
              className={mode === 'oripheon' ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => setMode('oripheon')}
            >
              Advanced (External)
            </button>
            <button
              type="button"
              className={mode === 'manual' ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => setMode('manual')}
            >
              Manual
            </button>
          </div>
        )}

        {mode === 'quick' && (
          <div>
            {/* Mode Tabs: Character / Relic — compact */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '0.5rem' }}>
              {[
                { value: 'character' as const, label: 'Character' },
                { value: 'relic' as const, label: 'Relic' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => { setLcosMode(tab.value); setLcosLockedRelic(null); }}
                  style={{
                    padding: '0.375rem 1rem',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    background: 'none',
                    border: 'none',
                    borderBottom: `2px solid ${lcosMode === tab.value ? 'rgba(255,255,255,0.5)' : 'transparent'}`,
                    marginBottom: '-1px',
                    color: lcosMode === tab.value ? 'var(--foreground)' : 'var(--muted-foreground)',
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Settings — collapsible */}
            <CollapsibleSection
              title="Settings"
              expanded={lcosSettingsExpanded}
              onToggle={() => setLcosSettingsExpanded(!lcosSettingsExpanded)}
              summary={(() => {
                const parts: string[] = [];
                if (lcosHeritage && lcosHeritage !== 'blend') parts.push(lcosHeritage);
                if (lcosHeritage === 'blend') parts.push('Blend');
                if (lcosGender) parts.push(lcosGender);
                if (lcosCore) parts.push(lcosCore.replace(/_/g, ' '));
                if (lcosVariance > 0) parts.push(`${lcosVariance}%`);
                return parts.length > 0 ? parts.join(' · ') : 'defaults';
              })()}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {lcosMode === 'character' && (
                  <>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div style={{ flex: '1 1 50%', minWidth: 0 }}>
                        <PillSelector label="Heritage" options={HERITAGE_OPTIONS} value={lcosHeritage} onChange={(v) => setLcosHeritage(v)} />
                      </div>
                      <div style={{ flex: '1 1 50%', minWidth: 0 }}>
                        <PillSelector label="Gender" options={GENDER_OPTIONS} value={lcosGender} onChange={(v) => setLcosGender(v)} />
                      </div>
                    </div>
                  </>
                )}
                {/* Name Mode / Era + Aesthetic side by side */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {lcosMode === 'character' && (
                    <div style={{ flex: '1 1 50%', minWidth: 0 }}>
                      <PillSelector label="Name Mode" options={NAME_MODES} value={lcosNameMode} onChange={(v) => setLcosNameMode(v)} />
                    </div>
                  )}
                  {lcosMode === 'relic' && (
                    <div style={{ flex: '1 1 50%', minWidth: 0 }}>
                      <PillSelector label="Era" options={[{ value: 'modern', label: 'Modern' }, { value: 'archaic', label: 'Archaic' }, { value: 'timeless', label: 'Timeless' }]} value={lcosRelicEra} onChange={(v) => { setLcosRelicEra(v as 'archaic' | 'modern' | 'timeless'); setLcosLockedRelic(null); }} />
                    </div>
                  )}
                  <div style={{ flex: '1 1 50%', minWidth: 0 }}>
                    <PillSelector label="Aesthetic" options={CORE_STYLES} value={lcosCore} onChange={(v) => setLcosCore(v)} />
                  </div>
                </div>
                {/* Variance — compact, matching container style */}
                <div style={{ maxWidth: '50%', padding: '0.5rem 0.625rem', backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <label style={{ display: 'block', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.3rem', textTransform: 'none', letterSpacing: '0.12em', fontWeight: 500, fontFamily: 'monospace' }}>
                    Variance <span style={{ textTransform: 'none', letterSpacing: 'normal', color: 'rgba(255,255,255,0.6)' }}>{lcosVariance}%</span>
                  </label>
                  <input type="range" min={0} max={100} step={1} value={lcosVariance} onChange={(e) => setLcosVariance(Number(e.target.value))} style={{ width: '100%', WebkitAppearance: 'none', appearance: 'none', height: '4px', borderRadius: '2px', background: `linear-gradient(to right, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.5) ${lcosVariance}%, rgba(255,255,255,0.08) ${lcosVariance}%)`, outline: 'none', cursor: 'pointer' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', marginTop: '0.15rem' }}><span>Clean</span><span>Corrupted</span></div>
                </div>
              </div>
            </CollapsibleSection>

            {/* Òrò cultural mode toggle. When on, the name comes from the
                diasporic naming engine; backstory + arcana + relics still
                from Bóveda's engine. */}
            {lcosMode === 'character' && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.625rem 0.75rem',
                background: oroCulturalEnabled ? 'rgba(255,200,140,0.06)' : 'rgba(0,0,0,0.25)',
                borderRadius: '0.375rem',
                border: oroCulturalEnabled ? '1px solid rgba(255,200,140,0.2)' : '1px solid rgba(255,255,255,0.06)',
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={oroCulturalEnabled}
                    onChange={(e) => setOroCulturalEnabled(e.target.checked)}
                    style={{ accentColor: 'rgba(255,200,140,0.9)' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--foreground)', fontWeight: 500 }}>
                    Òrò cultural names
                  </span>
                  <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginLeft: '0.25rem' }}>
                    diasporic / decolonial · lineage-aware
                  </span>
                </label>

                {oroCulturalEnabled && (
                  <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.25rem', textTransform: 'none', letterSpacing: '0.18em', fontFamily: 'monospace' }}>
                        Cultures
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {(['yoruba', 'igbo', 'akan', 'egyptian', 'vodou', 'rastafari', 'maroon', 'lucumi', 'taino'] as const).map((c) => {
                          const active = oroCultures.includes(c);
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() =>
                                setOroCultures((prev) =>
                                  prev.includes(c)
                                    ? prev.filter((x) => x !== c)
                                    : [...prev, c]
                                )
                              }
                              style={{
                                padding: '0.2rem 0.55rem',
                                fontSize: '0.65rem',
                                borderRadius: '0.2rem',
                                border: active ? '1px solid rgba(255,200,140,0.5)' : '1px solid rgba(255,255,255,0.12)',
                                background: active ? 'rgba(255,200,140,0.1)' : 'transparent',
                                color: active ? 'rgba(255,220,180,0.95)' : 'rgba(255,255,255,0.55)',
                                cursor: 'pointer',
                                textTransform: 'capitalize',
                              }}
                            >
                              {c}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.25rem', textTransform: 'none', letterSpacing: '0.18em', fontFamily: 'monospace' }}>
                          Form
                        </div>
                        <select
                          value={oroForm}
                          onChange={(e) => setOroForm(e.target.value as typeof oroForm)}
                          style={{ width: '100%', padding: '0.3rem 0.4rem', fontSize: '0.7rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.2rem', color: 'var(--foreground)' }}
                        >
                          <option value="first">First only</option>
                          <option value="first_surname">First + surname</option>
                          <option value="mononym">Mononym</option>
                          <option value="full_with_epithet">Full + epithet</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.25rem', textTransform: 'none', letterSpacing: '0.18em', fontFamily: 'monospace' }}>
                          Surname register
                        </div>
                        <select
                          value={oroSurnameRegister}
                          onChange={(e) => setOroSurnameRegister(e.target.value as typeof oroSurnameRegister)}
                          style={{ width: '100%', padding: '0.3rem 0.4rem', fontSize: '0.7rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.2rem', color: 'var(--foreground)' }}
                        >
                          <option value="auto">Auto</option>
                          <option value="colonial">Colonial</option>
                          <option value="reclaimed">Reclaimed</option>
                          <option value="compound">Compound</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.25rem', textTransform: 'none', letterSpacing: '0.18em', fontFamily: 'monospace' }}>
                          Ornament
                        </div>
                        <select
                          value={oroOrnament}
                          onChange={(e) => setOroOrnament(Number(e.target.value) as 0 | 0.5 | 1)}
                          style={{ width: '100%', padding: '0.3rem 0.4rem', fontSize: '0.7rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.2rem', color: 'var(--foreground)' }}
                        >
                          <option value="0">Clean ASCII</option>
                          <option value="0.5">Diacritics</option>
                          <option value="1">Avant-garde</option>
                        </select>
                      </div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={oroWithTitle}
                        onChange={(e) => setOroWithTitle(e.target.checked)}
                      />
                      Attach title (Eze, Mmuo, Ras, the Quiet Door)
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Loading state */}
            {lcosGenerating && !lcosGenerated && (
              <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--muted)', borderRadius: '0.375rem', border: '1px solid var(--border)', marginBottom: '0.5rem', color: 'var(--muted-foreground)', fontSize: '0.8rem' }}>
                Generating...
              </div>
            )}

            {/* Result — always visible when generated */}
            {lcosGenerated && (
              <>
                {/* Name + badges — always shown */}
                <div style={{ padding: '0.625rem 0.75rem', background: 'var(--muted)', borderRadius: '0.375rem', border: '1px solid var(--border)', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)', fontFamily: 'Futura, "Century Gothic", "Trebuchet MS", sans-serif', letterSpacing: '0.02em' }}>
                      {lcosGenerated.name}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {lcosAdminMode ? (
                        <>
                          <GenBadge variant="purple">{lcosGenerated.heritage}</GenBadge>
                          <GenBadge variant="blue">{lcosGenerated.order?.name}</GenBadge>
                          <GenBadge variant="amber">{lcosGenerated.arcana?.system}: {lcosGenerated.arcana?.archetype}</GenBadge>
                        </>
                      ) : lcosGenerated.subtaste ? (
                        <>
                          <GenBadge variant="purple">{lcosGenerated.subtaste.code}</GenBadge>
                          <GenBadge variant="amber">{SUBTASTE_DESIGNATIONS[lcosGenerated.subtaste.code]?.glyph || lcosGenerated.subtaste.glyph}</GenBadge>
                          <GenBadge>{SUBTASTE_DESIGNATIONS[lcosGenerated.subtaste.code]?.label || lcosGenerated.subtaste.label}</GenBadge>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {/* Compact inline details */}
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginTop: '0.375rem', lineHeight: 1.5 }}>
                    {lcosMode === 'relic' ? (
                      <>
                        {lcosGenerated.relics?.[0] && <span style={{ fontStyle: 'italic' }}>{lcosGenerated.relics[0].object}</span>}
                        {lcosGenerated.pseudonym && <span> — aka {lcosGenerated.pseudonym}</span>}
                        {lcosGenerated.sacredNumber !== undefined && <span> · No. {lcosGenerated.sacredNumber}</span>}
                      </>
                    ) : (
                      <>
                        <span>{lcosGenerated.appearance?.build}, {lcosGenerated.appearance?.distinctiveTrait}</span>
                        <span> · {lcosGenerated.appearance?.styleAesthetic}</span>
                        <span> · {lcosGenerated.personality?.voiceTone}</span>
                      </>
                    )}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', opacity: 0.5, marginTop: '0.25rem' }}>
                    Seed: {lcosGenerated.seed}
                  </div>
                </div>

                {/* Backstory — collapsible */}
                <CollapsibleSection
                  title={lcosMode === 'relic' ? 'Story' : 'Backstory'}
                  expanded={lcosBackstoryExpanded}
                  onToggle={() => setLcosBackstoryExpanded(!lcosBackstoryExpanded)}
                  summary={lcosGenerated.backstory.slice(0, 60) + '...'}
                >
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
                    {lcosGenerated.backstory}
                  </div>
                  {lcosMode === 'relic' && lcosGenerated.samplePost && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--foreground)', fontStyle: 'italic', marginTop: '0.5rem', opacity: 0.8 }}>
                      &ldquo;{lcosGenerated.samplePost}&rdquo;
                    </div>
                  )}
                  {lcosMode === 'relic' && lcosGenerated.relics && lcosGenerated.relics.length > 0 && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button type="button" onClick={() => { if (lcosLockedRelic) { setLcosLockedRelic(null); } else if (lcosGenerated.relics?.[0]) { setLcosLockedRelic(lcosGenerated.relics[0]); } }} style={{ padding: '0.125rem 0.5rem', fontSize: '0.65rem', borderRadius: '0.25rem', border: lcosLockedRelic ? '1px solid rgba(255,255,255,0.25)' : '1px solid var(--border)', background: lcosLockedRelic ? 'rgba(255,255,255,0.08)' : 'transparent', color: 'var(--foreground)', cursor: 'pointer' }}>
                        {lcosLockedRelic ? 'Unlock Relic' : 'Lock Relic'}
                      </button>
                    </div>
                  )}
                </CollapsibleSection>

                {/* Classifications — collapsible */}
                <CollapsibleSection
                  title="Classifications"
                  expanded={lcosClassExpanded}
                  onToggle={() => setLcosClassExpanded(!lcosClassExpanded)}
                  borderColor="rgba(255,255,255,0.1)"
                  summary={(() => {
                    const parts: string[] = [];
                    if (lcosGenerated.subtaste) parts.push(`${lcosGenerated.subtaste.code} ${SUBTASTE_DESIGNATIONS[lcosGenerated.subtaste.code]?.glyph || lcosGenerated.subtaste.glyph}`);
                    if (lcosGenerated.subdominantArcana?.[0]?.subtaste) parts.push(lcosGenerated.subdominantArcana[0].subtaste.code);
                    if (lcosGenerated.subdominantArcana?.[1]?.subtaste) parts.push(lcosGenerated.subdominantArcana[1].subtaste.code);
                    return parts.join(' · ');
                  })()}
                >
                  {/* Primary + Subdominant side by side */}
                  <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.375rem' }}>
                    {/* Primary — takes more space, expandable */}
                    {lcosGenerated.arcana && (
                      <div style={{ flex: '1.4 1 0', minWidth: 0, padding: '0.375rem 0.5rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '0.25rem', borderLeft: '2px solid rgba(255,255,255,0.15)' }}>
                        <button
                          type="button"
                          onClick={() => setPrimaryDetailExpanded(!primaryDetailExpanded)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '100%', marginBottom: '0.2rem' }}
                        >
                          <span style={{ fontSize: '0.45rem', display: 'inline-block', transition: 'transform 0.15s ease', transform: primaryDetailExpanded ? 'rotate(90deg)' : 'rotate(0deg)', color: 'rgba(255,255,255,0.3)' }}>▶</span>
                          <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', letterSpacing: '0.08em' }}>PRIMARY</span>
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '0.15rem' }}>
                          {lcosGenerated.subtaste && (
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontFamily: 'monospace', letterSpacing: '0.02em' }}>
                              {lcosGenerated.subtaste.code}
                            </span>
                          )}
                          {lcosGenerated.subtaste && (
                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{SUBTASTE_DESIGNATIONS[lcosGenerated.subtaste.code]?.glyph || lcosGenerated.subtaste.glyph}</span>
                          )}
                          {lcosGenerated.subtaste && (
                            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.55)', fontFamily: 'monospace' }}>
                              — {SUBTASTE_DESIGNATIONS[lcosGenerated.subtaste.code]?.label || lcosGenerated.subtaste.label}
                            </span>
                          )}
                        </div>
                        {lcosGenerated.subtaste?.phase && (
                          <span style={{ padding: '0.075rem 0.3rem', borderRadius: '0.2rem', fontSize: '0.55rem', fontWeight: 500, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)', textTransform: 'capitalize', fontFamily: 'monospace' }}>{lcosGenerated.subtaste.phase}</span>
                        )}
                        {primaryDetailExpanded && (
                          <div style={{ marginTop: '0.375rem', paddingTop: '0.375rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            {lcosGenerated.subtaste?.description && (
                              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.4, marginBottom: '0.25rem' }}>
                                {lcosGenerated.subtaste.description}
                              </div>
                            )}
                            {lcosAdminMode && (
                              <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                                <GenBadge variant="purple">{lcosGenerated.arcana.system}</GenBadge>
                                <GenBadge variant="amber">{lcosGenerated.arcana.archetype}</GenBadge>
                              </div>
                            )}
                            {lcosAdminMode && (
                              <div style={{ fontSize: '0.6rem', color: 'var(--muted-foreground)', lineHeight: 1.3, marginTop: '0.15rem' }}>
                                {lcosGenerated.arcana.meaning}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Subdominant — compact column, each expandable */}
                    {lcosGenerated.subdominantArcana && lcosGenerated.subdominantArcana.length > 0 && (
                      <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {lcosGenerated.subdominantArcana.map((sub, idx) => {
                          const isSubExpanded = subDetailExpanded[idx] || false;
                          return (
                            <div key={idx} style={{ padding: '0.3rem 0.4rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '0.25rem', borderLeft: '2px solid rgba(255,255,255,0.08)' }}>
                              <button
                                type="button"
                                onClick={() => setSubDetailExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '100%', marginBottom: '0.1rem' }}
                              >
                                <span style={{ fontSize: '0.4rem', display: 'inline-block', transition: 'transform 0.15s ease', transform: isSubExpanded ? 'rotate(90deg)' : 'rotate(0deg)', color: 'rgba(255,255,255,0.25)' }}>▶</span>
                                <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', letterSpacing: '0.08em' }}>SUB {idx + 1}</span>
                              </button>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)', fontFamily: 'monospace' }}>
                                  {sub.subtaste.code}
                                </span>
                                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>{SUBTASTE_DESIGNATIONS[sub.subtaste.code]?.glyph || sub.subtaste.glyph}</span>
                                <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>
                                  — {SUBTASTE_DESIGNATIONS[sub.subtaste.code]?.label || sub.subtaste.label}
                                </span>
                              </div>
                              {isSubExpanded && (
                                <div style={{ marginTop: '0.25rem', paddingTop: '0.25rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                  {sub.subtaste.phase && (
                                    <span style={{ padding: '0.05rem 0.25rem', borderRadius: '0.15rem', fontSize: '0.5rem', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.06)', textTransform: 'capitalize', fontFamily: 'monospace' }}>{sub.subtaste.phase}</span>
                                  )}
                                  {sub.subtaste.description && (
                                    <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, marginTop: '0.2rem' }}>
                                      {sub.subtaste.description}
                                    </div>
                                  )}
                                  {lcosAdminMode && (
                                    <>
                                      <div style={{ display: 'flex', gap: '0.15rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                                        <GenBadge variant="purple">{sub.arcana.system}</GenBadge>
                                        <GenBadge variant="amber">{sub.arcana.archetype}</GenBadge>
                                      </div>
                                      <div style={{ fontSize: '0.55rem', color: 'var(--muted-foreground)', opacity: 0.6, marginTop: '0.1rem', lineHeight: 1.2 }}>
                                        {sub.arcana.meaning}
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Personality axes — half width */}
                  {lcosGenerated.personality && (
                    <div style={{ maxWidth: '50%' }}>
                      <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>AXES</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        <AxisBar value={lcosGenerated.personality.axes.orderChaos} leftLabel="Order" rightLabel="Chaos" />
                        <AxisBar value={lcosGenerated.personality.axes.mercyRuthlessness} leftLabel="Mercy" rightLabel="Ruthless" />
                        <AxisBar value={lcosGenerated.personality.axes.introvertExtrovert} leftLabel="Intro" rightLabel="Extro" />
                        <AxisBar value={lcosGenerated.personality.axes.faithDoubt} leftLabel="Faith" rightLabel="Doubt" />
                      </div>
                    </div>
                  )}
                </CollapsibleSection>
              </>
            )}

            {/* Imprint Preview (collapsible) */}
            {lcosGenerated && charenomePreview && (
              <CollapsibleSection
                title="Imprint Preview"
                expanded={imprintExpanded}
                onToggle={() => setGenomeExpanded(!imprintExpanded)}
                borderColor="rgba(255,255,255,0.1)"
                summary={(() => {
                  const parts: string[] = [];
                  parts.push(charenomePreview.voice.type);
                  parts.push(charenomePreview.hotCoolAxis > 0 ? 'hot' : charenomePreview.hotCoolAxis < 0 ? 'cool' : 'crossroads');
                  if (lcosAdminMode) {
                    parts.push(charenomePreview.orisha);
                    parts.push(charenomePreview.sephira);
                  }
                  return parts.join(' · ');
                })()}
              >
                {/* Admin only: Alignment Sources */}
                {lcosAdminMode && charenomePreview.alignment && (
                  <div style={{
                    display: 'flex',
                    gap: '0.375rem',
                    flexWrap: 'wrap',
                    marginBottom: '0.5rem',
                    padding: '0.375rem 0.5rem',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderRadius: '0.25rem',
                  }}>
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>ALIGNED FROM</span>
                    <span style={{ padding: '0.1rem 0.35rem', borderRadius: '0.2rem', backgroundColor: 'rgba(255,255,255,0.06)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {charenomePreview.alignment.heritage}
                    </span>
                    <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)', alignSelf: 'center' }}>+</span>
                    <span style={{ padding: '0.1rem 0.35rem', borderRadius: '0.2rem', backgroundColor: 'rgba(255,255,255,0.06)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {charenomePreview.alignment.order}
                    </span>
                    <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)', alignSelf: 'center' }}>+</span>
                    <span style={{ padding: '0.1rem 0.35rem', borderRadius: '0.2rem', backgroundColor: 'rgba(255,255,255,0.06)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {charenomePreview.alignment.archetype?.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}

                {/* Admin only: Orisha & Sephira */}
                {lcosAdminMode && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', marginBottom: '0.5rem' }}>
                    <div style={{ padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '0.25rem', borderLeft: '2px solid rgba(255,255,255,0.15)' }}>
                      <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', letterSpacing: '0.05em', marginBottom: '0.125rem' }}>HEAD ORISHA</div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>{charenomePreview.orisha}</div>
                      {charenomePreview.camino && (
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.125rem' }}>{charenomePreview.camino}</div>
                      )}
                    </div>
                    <div style={{ padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '0.25rem', borderLeft: '2px solid rgba(255,255,255,0.15)' }}>
                      <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', letterSpacing: '0.05em', marginBottom: '0.125rem' }}>SEPHIRA</div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>{charenomePreview.sephira}</div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.125rem' }}>{charenomePreview.trajectory}</div>
                    </div>
                  </div>
                )}

                {/* Admin only: Secondary Influences */}
                {lcosAdminMode && charenomePreview.secondaryInfluences.length > 0 && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>SECONDARY</div>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {charenomePreview.secondaryInfluences.map((inf, idx) => (
                        <span key={idx} style={{ padding: '0.125rem 0.375rem', borderRadius: '0.2rem', backgroundColor: 'rgba(255,255,255,0.06)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          {inf.orisha} ({Math.round(inf.strength * 100)}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Voice Profile — always visible */}
                <div style={{
                  padding: '0.5rem',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: '0.25rem',
                  marginBottom: '0.375rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>VOICE</div>
                    <span style={{
                      padding: '0.1rem 0.35rem',
                      borderRadius: '0.2rem',
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      fontSize: '0.6rem',
                      color: 'rgba(255,255,255,0.7)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      textTransform: 'none',
                      fontFamily: 'monospace',
                    }}>
                      {charenomePreview.voice.type}
                    </span>
                    <span style={{
                      padding: '0.1rem 0.35rem',
                      borderRadius: '0.2rem',
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      fontSize: '0.6rem',
                      color: 'rgba(255,255,255,0.5)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      fontFamily: 'monospace',
                    }}>
                      {charenomePreview.hotCoolAxis > 0 ? 'hot' : charenomePreview.hotCoolAxis < 0 ? 'cool' : 'crossroads'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
                    {charenomePreview.voice.quality}
                  </div>
                </div>

                {/* Sample Voice — always visible */}
                <div style={{
                  padding: '0.5rem',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: '0.25rem',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>SAMPLE VOICE</div>
                    <button
                      type="button"
                      onClick={() => {
                        if (charenomePreview) {
                          const newTweet = generateSampleTweet(charenomePreview.orisha);
                          setCharenomePreview({ ...charenomePreview, sampleTweet: newTweet });
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255,255,255,0.3)',
                        cursor: 'pointer',
                        fontSize: '0.6rem',
                        fontFamily: 'monospace',
                        padding: '0.125rem 0.375rem',
                      }}
                    >
                      refresh
                    </button>
                  </div>
                  <div style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'rgba(255,255,255,0.85)', fontStyle: 'italic' }}>
                    &ldquo;{charenomePreview.sampleTweet}&rdquo;
                  </div>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                    — {lcosGenerated.pseudonym || lcosGenerated.name}
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {lcosGenerated && (
              <ImageUpload
                value={lcosAvatarUrl}
                onChange={setLcosAvatarUrl}
                disabled={lcosGenerating || creatingFromLcos}
              />
            )}

            {error && (
              <div style={{ color: 'var(--error)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '0.5rem',
              gap: '0.5rem',
              flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleGenerateLCOS}
                  disabled={lcosGenerating || creatingFromLcos || creatingCharenome}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'var(--muted)',
                    color: 'var(--foreground)',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'all 0.15s ease',
                    opacity: (lcosGenerating || creatingFromLcos || creatingCharenome) ? 0.5 : 1,
                  }}
                >
                  ↻ {lcosGenerating ? 'Generating...' : 'Reroll'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClose}
                >
                  Cancel
                </button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {lcosAdminMode && (
                  <button
                    type="button"
                    onClick={handleCreateFromLCOS}
                    disabled={!lcosGenerated || lcosGenerating || creatingFromLcos || creatingCharenome}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'var(--muted)',
                      color: 'var(--foreground)',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(255,255,255,0.25)',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      transition: 'all 0.15s ease',
                      opacity: (!lcosGenerated || lcosGenerating || creatingFromLcos || creatingCharenome) ? 0.5 : 1,
                    }}
                  >
                    {creatingFromLcos ? 'Creating...' : 'Accept & Create'}
                  </button>
                )}
                {lcosGenerated && charenomePreview && (
                  <button
                    type="button"
                    onClick={handleCreateCharenome}
                    disabled={lcosGenerating || creatingFromLcos || creatingCharenome}
                    title="Create synced character + imprint together"
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(167, 139, 250, 0.22)',
                      color: '#cbbef5',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(167, 139, 250, 0.35)',
                      cursor: (lcosGenerating || creatingFromLcos || creatingCharenome) ? 'not-allowed' : 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      fontFamily: 'monospace',
                      letterSpacing: '0.08em',
                      transition: 'all 0.2s ease',
                      opacity: (lcosGenerating || creatingFromLcos || creatingCharenome) ? 0.4 : 1,
                      boxShadow: '0 0 20px rgba(167, 139, 250, 0.35), 0 0 40px rgba(167, 139, 250, 0.15)',
                    }}
                    onMouseEnter={(e) => {
                      if (!(lcosGenerating || creatingFromLcos || creatingCharenome)) {
                        e.currentTarget.style.background = 'rgba(167, 139, 250, 0.28)';
                        e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.6)';
                        e.currentTarget.style.boxShadow = '0 0 30px rgba(167, 139, 250, 0.5), 0 0 60px rgba(167, 139, 250, 0.25)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(167, 139, 250, 0.18)';
                      e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.35)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(167, 139, 250, 0.35), 0 0 40px rgba(167, 139, 250, 0.15)';
                    }}
                  >
                    {creatingCharenome ? 'Forging...' : 'Forge Imprint'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {mode === 'oripheon' && (
          <div>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
              Advanced generation using external Oripheon API (requires running Oripheon server at {ORIPHEON_API_URL}).
            </p>
            <div className="form-group">
              <label className="label">Persona Description</label>
              <textarea
                className="input"
                value={personaDescription}
                onChange={(e) => setPersonaDescription(e.target.value)}
                rows={2}
                placeholder="e.g., Solar tactician guarding nomad convoys"
              />
            </div>

	            <div className="grid grid-cols-2 gap-4">
	              <div className="form-group" style={{ marginBottom: 0 }}>
	                <label className="label">Order</label>
	                <select
	                  className="input"
	                  value={oripheonOrder}
	                  onChange={(e) => setOripheonOrder(e.target.value as OripheonOrderType | '')}
	                >
	                  <option value="">Any</option>
	                  {ORIPHEON_ORDERS.map((order) => (
	                    <option key={order} value={order}>
	                      {order}
	                    </option>
	                  ))}
	                </select>
	              </div>

	              <div className="form-group" style={{ marginBottom: 0 }}>
	                <label className="label">Gender</label>
	                <select
	                  className="input"
	                  value={oripheonGender}
	                  onChange={(e) => setOripheonGender(e.target.value as OripheonGender | '')}
	                >
	                  <option value="">Any</option>
	                  {ORIPHEON_GENDERS.map((gender) => (
	                    <option key={gender} value={gender}>
	                      {gender}
	                    </option>
	                  ))}
	                </select>
	              </div>
	            </div>

	            <div className="form-group">
	              <label className="label">Path</label>
	              <select
	                className="input"
	                value={oripheonPath}
	                onChange={(e) => setOripheonPath(e.target.value as OripheonTarotArchetype | '')}
	              >
	                <option value="">Any</option>
	                {ORIPHEON_PATH_OPTIONS.map((option) => (
	                  <option key={option.id} value={option.id}>
	                    {option.label}
	                  </option>
	                ))}
	              </select>
	            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Name Length</label>
                <select
                  className="input"
                  value={oripheonLengthPreference}
                  onChange={(e) =>
                    setOripheonLengthPreference(e.target.value as 'short' | 'long' | '')
                  }
                >
                  <option value="">Any</option>
                  <option value="short">Short</option>
                  <option value="long">Long</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Name Style</label>
                <select
                  className="input"
                  value={oripheonNameMode}
                  onChange={(e) => setOripheonNameMode(e.target.value as OripheonNameMode | '')}
                >
                  <option value="">Any</option>
                  <option value="mononym">Mononym (single name)</option>
                  <option value="first_last">First + Last</option>
                  <option value="first_middle_last">First + Middle + Last</option>
                  <option value="fused_mononym">Fused (blend two names)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Seed (optional)</label>
                <input
                  type="number"
                  className="input"
                  value={oripheonSeed}
                  onChange={(e) => setOripheonSeed(e.target.value)}
                  placeholder="e.g., 42"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <div className="flex gap-2" style={{ alignItems: 'center', marginBottom: '0.25rem' }}>
                  <input
                    id="oripheonIncludeTitle"
                    type="checkbox"
                    checked={oripheonIncludeTitle}
                    onChange={(e) => setOripheonIncludeTitle(e.target.checked)}
                  />
                  <label className="label" htmlFor="oripheonIncludeTitle" style={{ marginBottom: 0 }}>
                    Include Title
                  </label>
                </div>
                <select
                  className="input"
                  value={oripheonSelectedTitle}
                  onChange={(e) => setOripheonSelectedTitle(e.target.value)}
                  disabled={!oripheonIncludeTitle}
                >
                  <option value="">Random Title</option>
                  {ORIPHEON_TITLES.map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

	            <div className="form-group">
	              <label className="label">Desired Traits (comma-separated)</label>
	              <input
	                type="text"
	                className="input"
	                value={desiredTraits}
	                onChange={(e) => setDesiredTraits(e.target.value)}
	                placeholder="e.g., Stoic, Strategic"
	              />
	              {traitSuggestions.length > 0 && (
	                <div className="mt-4 flex gap-2" style={{ flexWrap: 'wrap', marginTop: '0.5rem' }}>
	                  {traitSuggestions.map((value) => (
	                    <button
	                      key={value}
	                      type="button"
	                      className="btn btn-secondary btn-sm"
	                      onClick={() => setDesiredTraits((current) => appendCsvValue(current, value))}
	                    >
	                      {value}
	                    </button>
	                  ))}
	                </div>
	              )}
	            </div>

	            <div className="form-group">
	              <label className="label">Desired Skills (comma-separated)</label>
	              <input
	                type="text"
	                className="input"
	                value={desiredSkills}
	                onChange={(e) => setDesiredSkills(e.target.value)}
	                placeholder="e.g., Storm weaving, Battlefield medicine"
	              />
	              {skillSuggestions.length > 0 && (
	                <div className="mt-4 flex gap-2" style={{ flexWrap: 'wrap', marginTop: '0.5rem' }}>
	                  {skillSuggestions.map((value) => (
	                    <button
	                      key={value}
	                      type="button"
	                      className="btn btn-secondary btn-sm"
	                      onClick={() => setDesiredSkills((current) => appendCsvValue(current, value))}
	                    >
	                      {value}
	                    </button>
	                  ))}
	                </div>
	              )}
	            </div>

            <div className="form-group">
              <label className="label">Preferred Names (comma-separated)</label>
              <input
                type="text"
                className="input"
                value={preferredNames}
                onChange={(e) => setPreferredNames(e.target.value)}
                placeholder="e.g., Astra, Kael"
              />
            </div>

            <div className="form-group">
              <div className="flex gap-2" style={{ alignItems: 'center' }}>
                <input
                  id="sigilBloomEnabled"
                  type="checkbox"
                  checked={sigilBloomEnabled}
                  onChange={(e) => setSigilBloomEnabled(e.target.checked)}
                />
                <label className="label" htmlFor="sigilBloomEnabled" style={{ marginBottom: 0 }}>
                  Sigil Bloom
                </label>
                <div style={{ flex: 1 }} />
                <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  {sigilBloomIntensity}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={sigilBloomIntensity}
                onChange={(e) => setSigilBloomIntensity(Number(e.target.value))}
                disabled={!sigilBloomEnabled}
                style={{ width: '100%' }}
              />
            </div>

            {generatedAvatar && (
              <div className="card" style={{ marginBottom: '1rem' }}>
                <h3 className="card-title">{getOripheonDisplayName(generatedAvatar)}</h3>
                <p className="card-description" style={{ whiteSpace: 'pre-wrap' }}>
                  {generatedAvatar.mythos.shortTitle}
                </p>
                <div className="mt-4 flex gap-2" style={{ flexWrap: 'wrap' }}>
                  <span className="badge badge-draft">{generatedAvatar.being.order}</span>
                  <span className="badge badge-draft">{generatedAvatar.being.office}</span>
                  <span className="badge badge-draft">
                    {generatedAvatar.being.tarotArchetype.replace(/_/g, ' ')}
                  </span>
                  <span className="badge badge-draft">{generatedAvatar.identity.gender}</span>
                </div>
                <p className="mt-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  {generatedAvatar.personality.summary}
                </p>
              </div>
            )}

            <ImageUpload
              value={oripheonAvatarUrl}
              onChange={setOripheonAvatarUrl}
              disabled={generating || creatingFromOripheon}
            />

            {error && (
              <div style={{ color: 'var(--error)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={handleClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleGenerateOripheon}
                disabled={generating || creatingFromOripheon}
              >
                {generating ? 'Generating...' : generatedAvatar ? 'Reroll' : 'Generate'}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCreateFromOripheon}
                disabled={!generatedAvatar || generating || creatingFromOripheon}
              >
                {creatingFromOripheon ? 'Creating...' : 'Create Character'}
              </button>
            </div>
          </div>
        )}

        {mode === 'manual' && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Name *</label>
              <input
                type="text"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Character name"
              />
            </div>

            <div className="form-group">
              <label className="label">Bio</label>
              <textarea
                className="input"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Character biography and background"
              />
            </div>

            <div className="form-group">
              <label className="label">Aliases (comma-separated)</label>
              <input
                type="text"
                className="input"
                value={aliases}
                onChange={(e) => setAliases(e.target.value)}
                placeholder="e.g., Nova, The Digital Dreamer"
              />
            </div>

            <div className="form-group">
              <label className="label">Persona Tags (comma-separated)</label>
              <input
                type="text"
                className="input"
                value={personaTags}
                onChange={(e) => setPersonaTags(e.target.value)}
                placeholder="e.g., creative, curious, optimistic"
              />
            </div>

            <ImageUpload
              value={avatarUrl}
              onChange={setAvatarUrl}
              disabled={loading}
            />

            {error && (
              <div style={{ color: 'var(--error)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={handleClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading || !name}>
                {loading ? 'Creating...' : 'Create Character'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
