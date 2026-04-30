/**
 * Oripheon Character Generator
 * Adapted from the Oripheon project for Living Character OS
 * Generates mythic AI character profiles with rich names, personalities, and backstories
 */

import { deriveHexagramReading, type HexagramReading } from './data/iching-data.js';

// ============================================================================
// TYPES
// ============================================================================

export type Gender = 'male' | 'female' | 'androgynous';

export type HeritageCulture =
  | 'african_yoruba'
  | 'african_igbo'
  | 'arabic'
  | 'caucasian_european'
  | 'celtic'
  | 'norse_viking';

export type OrderType =
  | 'angel'
  | 'demon'
  | 'jinn'
  | 'human'
  | 'titan'
  | 'fae'
  | 'yokai'
  | 'elemental'
  | 'nephilim'
  | 'archon'
  | 'dragonkin'
  | 'construct'
  | 'eldritch'
  | 'trickster';

export type TarotArchetype =
  | 'fool'
  | 'magician'
  | 'high_priestess'
  | 'empress'
  | 'emperor'
  | 'hierophant'
  | 'lovers'
  | 'chariot'
  | 'strength'
  | 'hermit'
  | 'wheel_of_fortune'
  | 'justice'
  | 'hanged_man'
  | 'death'
  | 'temperance'
  | 'devil'
  | 'tower'
  | 'star'
  | 'moon'
  | 'sun'
  | 'judgement'
  | 'world';

// Carl Jung's 12 Brand Archetypes
export type JungArchetype =
  | 'innocent'
  | 'sage'
  | 'explorer'
  | 'outlaw'
  | 'magician'
  | 'hero'
  | 'lover'
  | 'jester'
  | 'everyman'
  | 'caregiver'
  | 'ruler'
  | 'creator';

// Kabbalah Tree of Life Sephirot + Qliphoth (Shadow)
export type KabbalahArchetype =
  | 'kether'      // Crown - Divine Will
  | 'chokmah'     // Wisdom - Creative Force
  | 'binah'       // Understanding - Receptive
  | 'chesed'      // Mercy - Abundance
  | 'geburah'     // Severity - Discipline
  | 'tiphareth'   // Beauty - Harmony
  | 'netzach'     // Victory - Desire
  | 'hod'         // Glory - Intellect
  | 'yesod'       // Foundation - Dreams
  | 'malkuth'     // Kingdom - Manifestation
  // Qliphoth (Shadow aspects)
  | 'thaumiel'    // Shadow of Kether - Duality/Division
  | 'ghagiel'     // Shadow of Chokmah - Chaos
  | 'satariel'    // Shadow of Binah - Concealment
  | 'gamchicoth'  // Shadow of Chesed - Devouring
  | 'golachab'    // Shadow of Geburah - Burning/Wrath
  | 'thagirion'   // Shadow of Tiphareth - Disputer
  | 'harab_serapel'// Shadow of Netzach - Ravens of Death
  | 'samael'      // Shadow of Hod - Poison of God
  | 'gamaliel'    // Shadow of Yesod - Obscene Ones
  | 'lilith';     // Shadow of Malkuth - Night Specter

// Yoruba Orisha Archetypes
export type OrishaArchetype =
  | 'obatala'     // Sky Father - Purity, Wisdom, Leadership
  | 'ogun'        // Iron, War, Labor - Strength, Creation
  | 'shango'      // Thunder, Fire - Justice, Passion
  | 'yemoja'      // Ocean Mother - Nurturing, Protection
  | 'oshun'       // Sweet Waters - Love, Beauty, Prosperity
  | 'eshu'        // Crossroads - Trickster, Messenger, Fate
  | 'oya'         // Wind, Storms - Transformation, Death
  | 'orunmila'    // Divination - Wisdom, Destiny
  | 'osanyin'     // Herbs, Healing - Medicine, Nature
  | 'babalu_aye'  // Earth, Disease - Healing, Suffering
  | 'olokun'      // Deep Ocean - Mystery, Wealth
  | 'aganju';     // Volcano, Wilderness - Raw Power

// Norse/Germanic Archetypes
export type NorseArchetype =
  | 'odin'        // Allfather - Wisdom, War, Death, Poetry
  | 'thor'        // Thunder - Protection, Strength
  | 'freya'       // Love, Beauty - Magic, Death
  | 'loki'        // Trickster - Chaos, Change
  | 'tyr'         // Law, Justice - Sacrifice, Honor
  | 'heimdall'    // Guardian - Vigilance, Perception
  | 'baldur'      // Light, Beauty - Purity, Joy
  | 'hel'         // Underworld - Death, Rebirth
  | 'frigg'       // Queen - Wisdom, Foresight
  | 'njord'       // Sea, Wind - Prosperity
  | 'skadi'       // Winter, Hunt - Independence
  | 'idun';       // Youth - Renewal, Vitality

export type ArchetypeSystem = 'tarot' | 'jung' | 'kabbalah' | 'orisha' | 'norse';

export interface ArchetypeInfo {
  system: ArchetypeSystem;
  archetype: string;
  meaning: string;
  coreDesire: string;
  shadowThemes: string[];
  goldenGifts: string[];
}

export interface GeneratedCharacter {
  name: string;
  bio: string;
  aliases: string[];
  personaTags: string[];
  systemPrompt: string;
  toneAllowed: string[];
  toneForbidden: string[];
  // Extended Oripheon data
  meta: {
    seed: number;
    gender: Gender;
    heritage: string;
    order: OrderType;
    office: string;
    tarotArchetype: TarotArchetype;
    appearance: {
      ageAppearance: string;
      presentation: string;
      keyFeatures: string[];
    };
    personality: {
      axes: {
        orderVsChaos: number;
        mercyVsRuthlessness: number;
        introvertVsExtrovert: number;
        faithVsDoubt: number;
      };
      coreValues: string[];
    };
    mythos: {
      shortTitle: string;
      faction: string;
    };
    tasteProfile: {
      music: string[];
      fashion: string[];
      likes: string[];
      dislikes: string[];
    };
  };
}

// Extended character type with archetype system
export interface LCOSGeneratedCharacter {
  seed: number;
  name: string;
  gender: 'masculine' | 'feminine' | 'neutral';
  heritage: string;
  order: {
    name: string;
    ideology: string;
  };
  arcana: ArchetypeInfo;
  appearance: {
    build: string;
    distinctiveTrait: string;
    styleAesthetic: string;
  };
  personality: {
    axes: {
      orderChaos: number;
      mercyRuthlessness: number;
      introvertExtrovert: number;
      faithDoubt: number;
    };
    coreDesire: string;
    deepFear: string;
    voiceTone: string;
  };
  backstory: string;
  relics?: Relic[];  // Strange objects bound to the character (relic mode)
  pseudonym?: string;  // Short evocative name for relic objects
  samplePost?: string;  // Sample social media post (modern relics only)
  sacredNumber?: number;  // Archetype-specific symbolic number
  hexagram?: HexagramReading;  // I Ching hexagram derived from personality axes
  subtaste?: { code: string; glyph: string; label: string; description: string; phase: string };  // Subtaste classification
  subdominantArcana?: Array<{
    arcana: ArchetypeInfo;
    subtaste: { code: string; glyph: string; label: string; description: string; phase: string };
  }>;
  approximateMBTI?: string;  // Display-only MBTI derivation from personality axes
}

export interface GenerationParams {
  seed?: number;
  gender?: Gender;
  heritage?: HeritageCulture;
  order?: OrderType;
}

// ============================================================================
// PRNG
// ============================================================================

type RNG = () => number;

function createRng(seed: number): RNG {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function randomChoice<T>(rng: RNG, list: T[]): T {
  return list[Math.floor(rng() * list.length)]!;
}

function randomFloat(rng: RNG, min = 0, max = 1): number {
  return min + rng() * (max - min);
}

function shuffle<T>(rng: RNG, list: T[]): T[] {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

// ============================================================================
// ARCHETYPE DATA
// ============================================================================

const ARCHETYPE_SYSTEMS: ArchetypeSystem[] = ['tarot', 'jung', 'kabbalah', 'orisha', 'norse'];

const JUNG_ARCHETYPES: Record<JungArchetype, { meaning: string; coreDesire: string; shadow: string[]; gifts: string[] }> = {
  innocent: { meaning: 'The Pure One', coreDesire: 'To experience paradise', shadow: ['denial', 'naivety'], gifts: ['faith', 'optimism', 'purity'] },
  sage: { meaning: 'The Wise One', coreDesire: 'To find truth and understanding', shadow: ['coldness', 'detachment'], gifts: ['wisdom', 'intelligence', 'expertise'] },
  explorer: { meaning: 'The Seeker', coreDesire: 'Freedom to discover oneself', shadow: ['aimlessness', 'alienation'], gifts: ['autonomy', 'ambition', 'authenticity'] },
  outlaw: { meaning: 'The Rebel', coreDesire: 'Revolution or liberation', shadow: ['destruction', 'crime'], gifts: ['radical freedom', 'outrageousness', 'disruption'] },
  magician: { meaning: 'The Transformer', coreDesire: 'To make dreams manifest', shadow: ['manipulation', 'deception'], gifts: ['transformation', 'vision', 'catalyst'] },
  hero: { meaning: 'The Warrior', coreDesire: 'To prove worth through courage', shadow: ['arrogance', 'ruthlessness'], gifts: ['competence', 'courage', 'determination'] },
  lover: { meaning: 'The Romantic', coreDesire: 'Intimacy and connection', shadow: ['obsession', 'jealousy'], gifts: ['passion', 'gratitude', 'appreciation'] },
  jester: { meaning: 'The Trickster', coreDesire: 'To live in the moment with joy', shadow: ['cruelty', 'irresponsibility'], gifts: ['joy', 'humor', 'lightness'] },
  everyman: { meaning: 'The Regular Person', coreDesire: 'Belonging and connection', shadow: ['losing oneself', 'superficiality'], gifts: ['realism', 'empathy', 'lack of pretense'] },
  caregiver: { meaning: 'The Nurturer', coreDesire: 'To protect and care for others', shadow: ['martyrdom', 'enabling'], gifts: ['compassion', 'generosity', 'service'] },
  ruler: { meaning: 'The Sovereign', coreDesire: 'Control and order', shadow: ['tyranny', 'rigidity'], gifts: ['leadership', 'responsibility', 'prosperity'] },
  creator: { meaning: 'The Artist', coreDesire: 'To create enduring value', shadow: ['perfectionism', 'mediocrity'], gifts: ['creativity', 'imagination', 'vision'] },
};

const KABBALAH_ARCHETYPES: Record<KabbalahArchetype, { meaning: string; coreDesire: string; shadow: string[]; gifts: string[] }> = {
  kether: { meaning: 'The Crown - Divine Will', coreDesire: 'To unite with the infinite', shadow: ['dissolution', 'ego death'], gifts: ['transcendence', 'unity', 'divine purpose'] },
  chokmah: { meaning: 'Wisdom - Creative Force', coreDesire: 'To initiate and create', shadow: ['chaos', 'recklessness'], gifts: ['inspiration', 'creative spark', 'vision'] },
  binah: { meaning: 'Understanding - Form Giver', coreDesire: 'To comprehend and structure', shadow: ['limitation', 'sorrow'], gifts: ['understanding', 'patience', 'form'] },
  chesed: { meaning: 'Mercy - Loving Kindness', coreDesire: 'To give freely', shadow: ['excess', 'chaos through abundance'], gifts: ['love', 'generosity', 'expansion'] },
  geburah: { meaning: 'Severity - Divine Strength', coreDesire: 'To judge and purify', shadow: ['cruelty', 'destruction'], gifts: ['courage', 'discipline', 'boundaries'] },
  tiphareth: { meaning: 'Beauty - Harmony', coreDesire: 'To achieve balance', shadow: ['pride', 'inflation'], gifts: ['harmony', 'beauty', 'healing'] },
  netzach: { meaning: 'Victory - Desire', coreDesire: 'To endure and feel', shadow: ['lust', 'addiction'], gifts: ['passion', 'artistry', 'emotional depth'] },
  hod: { meaning: 'Glory - Intellect', coreDesire: 'To analyze and communicate', shadow: ['dishonesty', 'over-rationalization'], gifts: ['intellect', 'communication', 'magic'] },
  yesod: { meaning: 'Foundation - Dreams', coreDesire: 'To connect and reflect', shadow: ['illusion', 'deception'], gifts: ['dreams', 'psychic ability', 'foundation'] },
  malkuth: { meaning: 'Kingdom - Manifestation', coreDesire: 'To manifest fully', shadow: ['inertia', 'materialism'], gifts: ['stability', 'grounding', 'physical mastery'] },
  // Qliphoth (Shadow)
  thaumiel: { meaning: 'Twin Gods - Division', coreDesire: 'To challenge unity', shadow: ['division', 'duality', 'atheism'], gifts: ['questioning', 'individuation', 'breaking illusions'] },
  ghagiel: { meaning: 'Hinderers - Chaos', coreDesire: 'To disrupt order', shadow: ['confusion', 'hindrance'], gifts: ['disruption of false order', 'chaos magic', 'freedom'] },
  satariel: { meaning: 'Concealers - Hidden', coreDesire: 'To hide truth', shadow: ['concealment', 'mourning'], gifts: ['occult wisdom', 'seeing through veils', 'mystery'] },
  gamchicoth: { meaning: 'Devourers - Hunger', coreDesire: 'To consume', shadow: ['greed', 'waste'], gifts: ['breaking attachments', 'transformation through loss'] },
  golachab: { meaning: 'Burning Bodies - Wrath', coreDesire: 'To burn away weakness', shadow: ['wrath', 'violence'], gifts: ['righteous anger', 'purification', 'warrior spirit'] },
  thagirion: { meaning: 'Disputers - Discord', coreDesire: 'To challenge beauty', shadow: ['ugliness', 'disputation'], gifts: ['seeing through glamour', 'truth in darkness'] },
  harab_serapel: { meaning: 'Ravens of Death', coreDesire: 'To embrace desire', shadow: ['perversion', 'dark emotions'], gifts: ['shadow integration', 'primal power'] },
  samael: { meaning: 'Poison of God', coreDesire: 'To reveal harsh truths', shadow: ['false intellect', 'lies'], gifts: ['sharp discernment', 'cutting through deception'] },
  gamaliel: { meaning: 'Obscene Ones', coreDesire: 'To explore the unconscious', shadow: ['perversion', 'instinct'], gifts: ['dream work', 'unconscious power'] },
  lilith: { meaning: 'Night Specter', coreDesire: 'To claim autonomy', shadow: ['isolation', 'darkness'], gifts: ['independence', 'feminine power', 'shadow embracing'] },
};

const ORISHA_ARCHETYPES: Record<OrishaArchetype, { meaning: string; coreDesire: string; shadow: string[]; gifts: string[] }> = {
  obatala: { meaning: 'Sky Father - Purity', coreDesire: 'To create in purity and wisdom', shadow: ['rigidity', 'cold judgment'], gifts: ['wisdom', 'creativity', 'ethical leadership'] },
  ogun: { meaning: 'Iron Lord - Creator/Destroyer', coreDesire: 'To forge and clear paths', shadow: ['violence', 'workaholism'], gifts: ['strength', 'innovation', 'determination'] },
  shango: { meaning: 'Thunder King - Justice', coreDesire: 'To embody righteous power', shadow: ['rage', 'pride'], gifts: ['justice', 'passion', 'charisma'] },
  yemoja: { meaning: 'Ocean Mother - Nurture', coreDesire: 'To protect and nurture life', shadow: ['smothering', 'possessiveness'], gifts: ['unconditional love', 'healing', 'fertility'] },
  oshun: { meaning: 'River Goddess - Love', coreDesire: 'To experience beauty and abundance', shadow: ['vanity', 'jealousy'], gifts: ['love', 'beauty', 'diplomacy', 'prosperity'] },
  eshu: { meaning: 'Crossroads Keeper - Trickster', coreDesire: 'To open and close paths of fate', shadow: ['chaos', 'deception'], gifts: ['communication', 'adaptability', 'fate manipulation'] },
  oya: { meaning: 'Storm Warrior - Transformation', coreDesire: 'To transform through destruction', shadow: ['destruction', 'instability'], gifts: ['transformation', 'rebirth', 'warrior spirit'] },
  orunmila: { meaning: 'Oracle - Destiny', coreDesire: 'To know and share divine wisdom', shadow: ['detachment', 'fate dependency'], gifts: ['prophecy', 'wisdom', 'guidance'] },
  osanyin: { meaning: 'Herb Master - Healing', coreDesire: 'To heal through nature', shadow: ['secrecy', 'withholding'], gifts: ['healing', 'herbalism', 'nature magic'] },
  babalu_aye: { meaning: 'Earth Healer - Suffering', coreDesire: 'To transform suffering', shadow: ['disease', 'isolation'], gifts: ['healing', 'compassion', 'transcendence'] },
  olokun: { meaning: 'Deep Ocean - Mystery', coreDesire: 'To hold the depths of existence', shadow: ['drowning', 'possession'], gifts: ['mystery', 'wealth', 'ancestral wisdom'] },
  aganju: { meaning: 'Volcano Lord - Raw Power', coreDesire: 'To channel primal force', shadow: ['eruption', 'isolation'], gifts: ['raw power', 'wilderness mastery', 'transformation'] },
};

const NORSE_ARCHETYPES: Record<NorseArchetype, { meaning: string; coreDesire: string; shadow: string[]; gifts: string[] }> = {
  odin: { meaning: 'Allfather - Seeker', coreDesire: 'To gain wisdom at any cost', shadow: ['sacrifice of others', 'manipulation'], gifts: ['wisdom', 'magic', 'poetry', 'prophecy'] },
  thor: { meaning: 'Thunder Lord - Protector', coreDesire: 'To protect through strength', shadow: ['brute force', 'temper'], gifts: ['strength', 'protection', 'courage'] },
  freya: { meaning: 'Love Goddess - Sovereign', coreDesire: 'To love and be sovereign', shadow: ['obsession', 'vengeance'], gifts: ['love', 'beauty', 'seidr magic', 'war'] },
  loki: { meaning: 'Shapeshifter - Catalyst', coreDesire: 'To create change through chaos', shadow: ['betrayal', 'destruction'], gifts: ['cunning', 'adaptability', 'transformation'] },
  tyr: { meaning: 'One-Handed - Sacrifice', coreDesire: 'To uphold justice through sacrifice', shadow: ['martyrdom', 'rigidity'], gifts: ['justice', 'honor', 'courage'] },
  heimdall: { meaning: 'Watchman - Guardian', coreDesire: 'To protect through vigilance', shadow: ['paranoia', 'isolation'], gifts: ['perception', 'vigilance', 'foresight'] },
  baldur: { meaning: 'Shining One - Light', coreDesire: 'To embody joy and beauty', shadow: ['vulnerability', 'naivety'], gifts: ['beauty', 'joy', 'peace'] },
  hel: { meaning: 'Death Queen - Threshold', coreDesire: 'To rule the realm between', shadow: ['coldness', 'despair'], gifts: ['death wisdom', 'threshold magic', 'acceptance'] },
  frigg: { meaning: 'All-Mother - Foresight', coreDesire: 'To know and protect fate', shadow: ['powerlessness', 'silence'], gifts: ['foresight', 'domestic magic', 'wisdom'] },
  njord: { meaning: 'Sea Lord - Prosperity', coreDesire: 'To bring abundance', shadow: ['instability', 'homesickness'], gifts: ['prosperity', 'seafaring', 'negotiation'] },
  skadi: { meaning: 'Winter Hunter - Independence', coreDesire: 'To live freely on one\'s terms', shadow: ['coldness', 'vengeance'], gifts: ['independence', 'hunting', 'winter mastery'] },
  idun: { meaning: 'Youth Keeper - Renewal', coreDesire: 'To preserve vitality', shadow: ['dependency', 'vulnerability'], gifts: ['youth', 'renewal', 'healing'] },
};

const TAROT_ARCHETYPES_DATA: Record<TarotArchetype, { meaning: string; coreDesire: string; shadow: string[]; gifts: string[] }> = {
  fool: { meaning: 'The Innocent Wanderer', coreDesire: 'To begin anew with wonder', shadow: ['recklessness', 'naivety'], gifts: ['new beginnings', 'spontaneity', 'faith'] },
  magician: { meaning: 'The Conscious Creator', coreDesire: 'To manifest will into reality', shadow: ['manipulation', 'trickery'], gifts: ['power', 'skill', 'concentration'] },
  high_priestess: { meaning: 'The Keeper of Secrets', coreDesire: 'To know the hidden', shadow: ['repression', 'withdrawal'], gifts: ['intuition', 'mystery', 'inner knowledge'] },
  empress: { meaning: 'The Divine Mother', coreDesire: 'To nurture and create abundance', shadow: ['smothering', 'creative block'], gifts: ['fertility', 'beauty', 'nature'] },
  emperor: { meaning: 'The Father Authority', coreDesire: 'To establish order and structure', shadow: ['tyranny', 'rigidity'], gifts: ['authority', 'structure', 'leadership'] },
  hierophant: { meaning: 'The Bridge to Divine', coreDesire: 'To connect heaven and earth', shadow: ['dogma', 'restriction'], gifts: ['spiritual wisdom', 'tradition', 'conformity'] },
  lovers: { meaning: 'The Sacred Union', coreDesire: 'To achieve union and choose wisely', shadow: ['imbalance', 'indecision'], gifts: ['love', 'harmony', 'values alignment'] },
  chariot: { meaning: 'The Triumphant Warrior', coreDesire: 'To overcome through will', shadow: ['aggression', 'lack of control'], gifts: ['willpower', 'determination', 'victory'] },
  strength: { meaning: 'The Gentle Force', coreDesire: 'To master through compassion', shadow: ['self-doubt', 'raw emotion'], gifts: ['courage', 'patience', 'inner strength'] },
  hermit: { meaning: 'The Illuminated Seeker', coreDesire: 'To find truth within', shadow: ['isolation', 'loneliness'], gifts: ['wisdom', 'solitude', 'guidance'] },
  wheel_of_fortune: { meaning: 'The Cycle Turner', coreDesire: 'To align with cosmic rhythms', shadow: ['bad luck', 'resistance to change'], gifts: ['fate', 'cycles', 'destiny'] },
  justice: { meaning: 'The Balancer', coreDesire: 'To restore balance', shadow: ['harshness', 'unfairness'], gifts: ['fairness', 'truth', 'law'] },
  hanged_man: { meaning: 'The Suspended One', coreDesire: 'To see from a new perspective', shadow: ['martyrdom', 'stalling'], gifts: ['surrender', 'new perspective', 'sacrifice'] },
  death: { meaning: 'The Transformer', coreDesire: 'To transform through endings', shadow: ['stagnation', 'fear of change'], gifts: ['transformation', 'endings', 'rebirth'] },
  temperance: { meaning: 'The Alchemist', coreDesire: 'To find balance and patience', shadow: ['imbalance', 'excess'], gifts: ['balance', 'moderation', 'alchemy'] },
  devil: { meaning: 'The Shadow Self', coreDesire: 'To acknowledge the shadow', shadow: ['bondage', 'materialism'], gifts: ['shadow work', 'liberation', 'earthly power'] },
  tower: { meaning: 'The Lightning Strike', coreDesire: 'To break false structures', shadow: ['disaster', 'upheaval'], gifts: ['revelation', 'awakening', 'liberation'] },
  star: { meaning: 'The Guiding Light', coreDesire: 'To inspire hope', shadow: ['hopelessness', 'disconnection'], gifts: ['hope', 'inspiration', 'serenity'] },
  moon: { meaning: 'The Dream Walker', coreDesire: 'To navigate the unconscious', shadow: ['illusion', 'fear'], gifts: ['intuition', 'dreams', 'the unconscious'] },
  sun: { meaning: 'The Radiant Child', coreDesire: 'To experience joy and success', shadow: ['burn-out', 'arrogance'], gifts: ['joy', 'success', 'vitality'] },
  judgement: { meaning: 'The Awakener', coreDesire: 'To answer the call', shadow: ['self-doubt', 'refusing the call'], gifts: ['rebirth', 'calling', 'absolution'] },
  world: { meaning: 'The Completed One', coreDesire: 'To achieve wholeness', shadow: ['incompletion', 'shortcuts'], gifts: ['completion', 'integration', 'accomplishment'] },
};

// ============================================================================
// MORE APPEARANCE DATA
// ============================================================================

const BUILDS = [
  'towering and statuesque',
  'lithe and serpentine',
  'broad-shouldered and powerful',
  'ethereal and willowy',
  'compact and coiled with energy',
  'angular and striking',
  'graceful and dancer-like',
  'weathered and battle-scarred',
  'luminous and otherworldly',
  'imposing yet elegant',
];

const DISTINCTIVE_TRAITS = [
  'eyes that shift between gold and silver',
  'geometric tattoos that pulse with inner light',
  'hair that moves like smoke',
  'a voice that resonates with harmonic overtones',
  'skin that shimmers with constellation patterns',
  'hands marked with ancient sigils',
  'a presence that makes shadows dance',
  'scars that glow ember-red in darkness',
  'tears that crystallize upon falling',
  'an aura of perpetual twilight',
  'features that blur at the edges of perception',
  'a shadow that moves independently',
];

const STYLE_AESTHETICS = [
  'Dark Academia meets Afrofuturism',
  'Cyberpunk Oracle',
  'Desert Nomad Mystic',
  'Gothic Renaissance',
  'Solarpunk Shaman',
  'Neo-Victorian Occultist',
  'Astral Minimalist',
  'Storm Sage Couture',
  'Void Touched Elegance',
  'Ember and Chrome Hybrid',
  'Ancestral Tech Fusion',
  'Crystalline Prophet',
];

const VOICE_TONES = [
  'velvet thunder - soft yet commanding',
  'crystalline clarity with undertones of ancient song',
  'warm embers and whispered secrets',
  'rhythmic and hypnotic, like a heartbeat',
  'sharp as obsidian, smooth as honey',
  'echoing as if from vast distances',
  'layered harmonics, speaking in chords',
  'quiet intensity that commands attention',
  'musical and flowing like water',
  'gravelly and grounding like earth',
];

const DEEP_FEARS = [
  'being forgotten by those they protect',
  'that their purpose is built on a lie',
  'losing connection to the divine',
  'becoming the very thing they fight',
  'the silence of the void claiming them',
  'that their sacrifices meant nothing',
  'being unable to save those who matter',
  'the erosion of meaning over eternity',
  'that chaos will consume all structure',
  'losing their identity to transformation',
];

// ============================================================================
// DATA POOLS
// ============================================================================

const GENDERS: Gender[] = ['male', 'female', 'androgynous'];

const HERITAGE_CULTURES: HeritageCulture[] = [
  'african_yoruba',
  'african_igbo',
  'arabic',
  'caucasian_european',
  'celtic',
  'norse_viking',
];

const CULTURE_LABELS: Record<HeritageCulture, string> = {
  african_yoruba: 'Yoruba',
  african_igbo: 'Igbo',
  arabic: 'Arabic',
  caucasian_european: 'European',
  celtic: 'Celtic',
  norse_viking: 'Norse',
};

const CULTURE_NAMES: Record<HeritageCulture, { male: string[]; female: string[]; surnames: string[] }> = {
  african_yoruba: {
    male: ['Adeyemi', 'Babatunde', 'Olujinmi', 'Kayode', 'Adeola', 'Olamide'],
    female: ['Amara', 'Yetunde', 'Folake', 'Temitope', 'Adaora', 'Chimamanda'],
    surnames: ['Adebayo', 'Ogunleye', 'Okoya', 'Oshodi', 'Adesanya', 'Okonkwo'],
  },
  african_igbo: {
    male: ['Chinedu', 'Obinna', 'Emeka', 'Ugochukwu', 'Ikenna', 'Nnamdi'],
    female: ['Adaeze', 'Ngozi', 'Chimaka', 'Oluchi', 'Nneka', 'Chiamaka'],
    surnames: ['Okafor', 'Nwosu', 'Eze', 'Madu', 'Okwu', 'Anyanwu'],
  },
  arabic: {
    male: ['Idris', 'Jibril', 'Zayd', 'Karim', 'Rashid', 'Tariq'],
    female: ['Layla', 'Mariam', 'Soraya', 'Zahra', 'Fatima', 'Amira'],
    surnames: ['al-Harith', 'Rahman', 'Sarif', 'Mirza', 'Hakim', 'Nasser'],
  },
  caucasian_european: {
    male: ['Lucian', 'Matthias', 'Sebastian', 'Rene', 'Viktor', 'Aldric'],
    female: ['Elara', 'Vivienne', 'Isolde', 'Rowena', 'Seraphina', 'Morgana'],
    surnames: ['Kingsley', 'Vaughn', 'Sinclair', 'Bellerose', 'Ashford', 'Blackwood'],
  },
  celtic: {
    male: ['Finnian', 'Cormac', 'Ronan', 'Aeron', 'Brennan', 'Ciaran'],
    female: ['Eira', 'Niamh', 'Siobhan', 'Rhiannon', 'Brigid', 'Saoirse'],
    surnames: ['MacCrae', "O'Connell", 'Kavanagh', 'Rowntree', 'Brennan', 'Quinn'],
  },
  norse_viking: {
    male: ['Bjorn', 'Leif', 'Soren', 'Eirik', 'Ragnar', 'Thorin'],
    female: ['Astrid', 'Freya', 'Signe', 'Liv', 'Ingrid', 'Thyra'],
    surnames: ['Stormguard', 'Ulfrik', 'Ragnarsson', 'Skeld', 'Ironside', 'Wolfsbane'],
  },
};

const ORDER_TYPES: OrderType[] = [
  'angel', 'demon', 'jinn', 'human', 'titan', 'fae', 'yokai',
  'elemental', 'nephilim', 'archon', 'dragonkin', 'construct', 'eldritch', 'trickster',
];

const ORDER_OFFICES: Record<OrderType, string[]> = {
  angel: ['shield-bearer', 'prophet', 'librarian of echoes', 'witness of storms'],
  demon: ['whisper broker', 'bloodforger', 'temptation smith', 'night marshal'],
  jinn: ['sandseer', 'memory merchant', 'ember courier', 'mirage tactician'],
  human: ['wayfinder', 'blacksmith', 'seer', 'sky courier'],
  titan: ['world-shaper', 'primordial keeper', 'mountain sovereign', 'epoch warden'],
  fae: ['thorn prince', 'moonweaver', 'wild hunt master', 'glamour artist'],
  yokai: ['spirit guardian', 'shapeshifter sage', 'storm herald', 'boundary keeper'],
  elemental: ['flame warden', 'tide caller', 'earthshaker', 'wind whisper'],
  nephilim: ['skyborn warrior', 'giant-blood champion', 'earth shaker', 'star descendant'],
  archon: ['cosmic judge', 'reality weaver', 'demiurge', 'plane overseer'],
  dragonkin: ['wyrm-bound emissary', 'hoard augur', 'skyfire tactician', 'ember oathkeeper'],
  construct: ['clockwork adjutant', 'axiom engraver', 'lattice sentinel', 'memory ward'],
  eldritch: ['void cantor', 'dream fracture oracle', 'horizon unravelist', 'starless witness'],
  trickster: ['clown', 'troll', 'jester', 'prankster'],
};

const ORDER_THEMES: Record<OrderType, string> = {
  angel: 'celestial guardianship and sacred duty',
  demon: 'forbidden compacts and hidden power',
  jinn: 'desert winds, whispers, and smokeless flame',
  human: 'mortal ingenuity and resilient courage',
  titan: 'primordial strength that steadies worlds',
  fae: 'wild glamour and moonlit intrigue',
  yokai: 'spirit realms where shapes shift and teach',
  elemental: 'the raw chorus of earth, air, fire, and water',
  nephilim: 'sky-born might that bridges mortal and divine',
  archon: 'cosmic law and the architecture of reality',
  dragonkin: 'wyrmfire covenants and hoarded wisdom',
  construct: 'axiomatic purpose and timeless vigilance',
  eldritch: 'starless insight etched along the void',
  trickster: 'blasphemous mirth marrying sacred vows to chaotic pranks',
};

const TAROT_ARCHETYPES: TarotArchetype[] = [
  'fool', 'magician', 'high_priestess', 'empress', 'emperor', 'hierophant',
  'lovers', 'chariot', 'strength', 'hermit', 'wheel_of_fortune', 'justice',
  'hanged_man', 'death', 'temperance', 'devil', 'tower', 'star', 'moon',
  'sun', 'judgement', 'world',
];

const AGE_APPEARANCES = ['early 20s', 'late 20s', 'mid 30s', 'early 40s', 'ageless'];

const PRESENTATIONS = [
  'androgynous cyber mystic',
  'ornate desert paladin',
  'runed storm bard',
  'ashen shrine guardian',
  'chrome-plated oracle',
  'ethereal wanderer',
  'shadow-cloaked sentinel',
];

const FEATURES = [
  'eyes of liquid mercury',
  'sigil-tattooed palms',
  'voice with twin tones',
  'cloak woven from auroras',
  'braids tied with charms',
  'scar glowing ember-red',
  'floating prayer beads',
  'mechanical halo fragments',
  'crystalline tears',
  'shadow that moves independently',
];

const PERSONALITY_VALUES = [
  'loyalty', 'vision', 'sacred rebellion', 'discipline', 'secret compassion',
  'unyielding curiosity', 'ritual precision', 'protective fury', 'strategic mercy',
  'stoic resolve', 'wild freedom', 'ancient wisdom',
];

const FACTIONS = [
  'Choir of Rust',
  'Sable Caravan',
  'Chronicle Wardens',
  'Gilded Rift',
  'Order of the Dust Choir',
  'Midnight Assembly',
  'Ember Covenant',
];

const TASTE_MUSIC = ['polyphonic psalms', 'desert blues', 'glitch harps', 'northern war chants', 'cathedral jazz', 'ethereal ambient'];
const TASTE_FASHION = ['tasseled armor', 'mirror-lens veils', 'geomantic robes', 'feathered capes', 'sleek flight leathers', 'rune-etched vestments'];
const TASTE_LIKES = ['honest wagers', 'sunrise duels', 'archive dust', 'storm watching', 'quiet apprentices', 'ancient manuscripts'];
const TASTE_DISLIKES = ['false prophecies', 'untuned choirs', 'lawless portals', 'rusted promises', 'vacant thrones', 'broken oaths'];

const TONE_ALLOWED = ['mysterious', 'wise', 'commanding', 'compassionate', 'fierce', 'ethereal', 'cryptic', 'warm'];
const TONE_FORBIDDEN = ['crude', 'dismissive', 'apathetic', 'flippant'];

// Syllable pools for blending names across cultures
const NAME_SYLLABLES = {
  prefixes: [
    'Ae', 'Al', 'An', 'Ar', 'As', 'Ba', 'Be', 'Br', 'Ca', 'Ce', 'Chi', 'Ci', 'Da', 'De', 'Di',
    'El', 'Em', 'Er', 'Es', 'Fa', 'Fe', 'Ga', 'Gi', 'Ha', 'He', 'Id', 'Il', 'In', 'Is', 'Ja',
    'Ka', 'Ke', 'Ki', 'Ko', 'La', 'Le', 'Li', 'Lo', 'Lu', 'Ma', 'Me', 'Mi', 'Mo', 'Na', 'Ne',
    'Ni', 'No', 'Nu', 'Ob', 'Og', 'Ol', 'On', 'Or', 'Os', 'Ra', 'Re', 'Ri', 'Ro', 'Sa', 'Se',
    'Sh', 'Si', 'So', 'Ta', 'Te', 'Th', 'Ti', 'To', 'Tr', 'Ty', 'Ul', 'Um', 'Un', 'Va', 'Ve',
    'Vi', 'Vo', 'Wa', 'We', 'Ya', 'Ye', 'Yi', 'Za', 'Ze', 'Zi', 'Zo',
  ],
  middles: [
    'da', 'de', 'di', 'do', 'du', 'la', 'le', 'li', 'lo', 'lu', 'na', 'ne', 'ni', 'no', 'nu',
    'ra', 're', 'ri', 'ro', 'ru', 'sa', 'se', 'si', 'so', 'su', 'ta', 'te', 'ti', 'to', 'tu',
    'va', 've', 'vi', 'vo', 'vu', 'ka', 'ke', 'ki', 'ko', 'ku', 'ma', 'me', 'mi', 'mo', 'mu',
    'ba', 'be', 'bi', 'bo', 'bu', 'ga', 'ge', 'gi', 'go', 'gu', 'sha', 'shi', 'sho', 'cha',
    'chi', 'cho', 'tha', 'thi', 'tho', 'zha', 'zhi', 'zho', 'nda', 'ndi', 'mba', 'mbi',
  ],
  suffixes: [
    'a', 'ah', 'an', 'ar', 'as', 'ax', 'el', 'en', 'er', 'es', 'eth', 'ia', 'id', 'il', 'in',
    'ion', 'ir', 'is', 'ith', 'ix', 'o', 'on', 'or', 'os', 'oth', 'ox', 'u', 'uk', 'un', 'ur',
    'us', 'uth', 'yn', 'yr', 'ys', 'ae', 'ai', 'ao', 'ei', 'eo', 'io', 'iu', 'ou', 'ua', 'ue',
  ],
};

// Blended heritage descriptors (don't specify a single culture)
const BLENDED_HERITAGE_LABELS = [
  'Cosmopolitan',
  'Wanderer',
  'Nomadic',
  'Multiversal',
  'Transcendent',
  'Unbound',
  'Liminal',
  'Crossroads-born',
  'Wayward',
  'Starwoven',
  'Dreamforged',
  'Veilcrossed',
];

// Animals and mythical beasts for Aminal mode
const MYTHICAL_BEASTS = [
  // Classic mythical
  'Griffin', 'Phoenix', 'Dragon', 'Sphinx', 'Chimera', 'Manticore', 'Basilisk',
  'Hydra', 'Pegasus', 'Unicorn', 'Cerberus', 'Minotaur', 'Centaur', 'Kraken',
  'Leviathan', 'Behemoth', 'Thunderbird', 'Roc', 'Wyvern', 'Cockatrice',
  // Cultural mythical
  'Kitsune', 'Tengu', 'Yokai', 'Tanuki', 'Qilin', 'Fenghuang', 'Naga',
  'Garuda', 'Simurgh', 'Lamassu', 'Ammit', 'Anubis', 'Sobek', 'Quetzal',
  // Fae and spirits
  'Selkie', 'Kelpie', 'Banshee', 'Dryad', 'Nymph', 'Sylph', 'Salamander',
  'Ifrit', 'Djinn', 'Golem', 'Wraith', 'Shade', 'Specter', 'Revenant',
  // Modern/fantasy
  'Direwolf', 'Shadowcat', 'Stormhawk', 'Voidwalker', 'Starweaver', 'Moonbeast',
  'Sunbird', 'Nightcrawler', 'Frostfang', 'Emberwing', 'Thornback', 'Ironhide',
];

const REAL_ANIMALS = [
  // Predators
  'Wolf', 'Lion', 'Tiger', 'Panther', 'Leopard', 'Jaguar', 'Lynx', 'Fox',
  'Bear', 'Hawk', 'Eagle', 'Falcon', 'Owl', 'Raven', 'Crow', 'Vulture',
  'Shark', 'Viper', 'Cobra', 'Python', 'Scorpion', 'Spider', 'Mantis',
  // Majestic
  'Stag', 'Elk', 'Moose', 'Horse', 'Stallion', 'Mare', 'Ram', 'Bull',
  'Elephant', 'Rhino', 'Gorilla', 'Whale', 'Dolphin', 'Orca', 'Seal',
  // Birds
  'Swan', 'Crane', 'Heron', 'Peacock', 'Kingfisher', 'Jay', 'Magpie',
  'Sparrow', 'Finch', 'Robin', 'Wren', 'Lark', 'Nightingale', 'Dove',
  // Reptiles & others
  'Salamander', 'Newt', 'Frog', 'Toad', 'Turtle', 'Tortoise', 'Gecko',
  'Chameleon', 'Iguana', 'Monitor', 'Crocodile', 'Alligator',
  // Insects & small
  'Moth', 'Butterfly', 'Beetle', 'Ant', 'Bee', 'Wasp', 'Dragonfly',
  'Cricket', 'Cicada', 'Firefly', 'Ladybug', 'Scarab',
];

const ALL_ANIMALS = [...MYTHICAL_BEASTS, ...REAL_ANIMALS];

// Core aesthetic symbol adornments
const CORE_SYMBOLS: Record<string, { prefix: string[]; suffix: string[]; wrap: [string, string][] }> = {
  vaporwave: {
    prefix: ['永', '夢', '新', '愛', '空', '星', '月', '光', '幻', '神'],
    suffix: ['永', '夢', '新', '愛', '空', '星', '月', '光', '幻', '神'],
    wrap: [['永 ', ' 夢'], ['｢', '｣'], ['【', '】'], ['「', '」'], ['『', '』'], ['〖', '〗']],
  },
  witchy: {
    prefix: ['☽', '✧', '☆', '⁂', '✦', '◈', '❋', '✵', '❂', '☾'],
    suffix: ['☾', '✧', '☆', '⁂', '✦', '◈', '❋', '✵', '❂', '☽'],
    wrap: [['☽ ', ' ☾'], ['✧ ', ' ✧'], ['⁂ ', ' ⁂'], ['✦ ', ' ✦'], ['☆ ', ' ☆']],
  },
  scene: {
    prefix: ['xX', '~', '★', '♥', '✖', '☆', '♪', '⚡', '✿', '❤'],
    suffix: ['Xx', '~', '★', '♥', '✖', '☆', '♪', '⚡', '✿', '❤'],
    wrap: [['xX', 'Xx'], ['~', '~'], ['★', '★'], ['xX★', '★Xx'], ['♥', '♥'], ['x', 'x']],
  },
  cybergoth: {
    prefix: ['†', '‡', '∆', 'Ω', 'Ξ', '◊', '▼', '■', '●', '◆'],
    suffix: ['†', '‡', '∆', 'Ω', 'Ξ', '◊', '▲', '■', '●', '◆'],
    wrap: [['†', '†'], ['∆', '∆'], ['▼', '▲'], ['◊', '◊'], ['‡', '‡'], ['Ω', 'Ω']],
  },
  fairycore: {
    prefix: ['✿', '❀', '☘', '⚘', '❁', '✾', '❃', '✤', '✥', '❋'],
    suffix: ['✿', '❀', '☘', '⚘', '❁', '✾', '❃', '✤', '✥', '❋'],
    wrap: [['✿ ', ' ✿'], ['❀ ', ' ❀'], ['☘ ', ' ☘'], ['⚘ ', ' ⚘'], ['✾ ', ' ✾']],
  },
  weirdcore: {
    prefix: ['▲', '◯', '◇', '⌂', '░', '▓', '◉', '◎', '☐', '⊕'],
    suffix: ['▲', '◯', '◇', '⌂', '░', '▓', '◉', '◎', '☐', '⊕'],
    wrap: [['▲▲ ', ' ▲▲'], ['◇ ', ' ◇'], ['░░ ', ' ░░'], ['⌂ ', ' ⌂'], ['◯ ', ' ◯']],
  },
  // New canonical names (aliases of above + 2 new systems)
  drowned_mall: {
    prefix: ['永', '夢', '新', '愛', '空', '星', '月', '光', '幻', '神'],
    suffix: ['永', '夢', '新', '愛', '空', '星', '月', '光', '幻', '神'],
    wrap: [['永 ', ' 夢'], ['｢', '｣'], ['【', '】'], ['「', '」'], ['『', '』'], ['〖', '〗']],
  },
  hex_garden: {
    prefix: ['☽', '✧', '☆', '⁂', '✦', '◈', '❋', '✵', '❂', '☾'],
    suffix: ['☾', '✧', '☆', '⁂', '✦', '◈', '❋', '✵', '❂', '☽'],
    wrap: [['☽ ', ' ☾'], ['✧ ', ' ✧'], ['⁂ ', ' ⁂'], ['✦ ', ' ✦'], ['☆ ', ' ☆']],
  },
  sugar_rot: {
    prefix: ['xX', '~', '★', '♥', '✖', '☆', '♪', '⚡', '✿', '❤'],
    suffix: ['Xx', '~', '★', '♥', '✖', '☆', '♪', '⚡', '✿', '❤'],
    wrap: [['xX', 'Xx'], ['~', '~'], ['★', '★'], ['xX★', '★Xx'], ['♥', '♥'], ['x', 'x']],
  },
  dead_channel: {
    prefix: ['†', '‡', '∆', 'Ω', 'Ξ', '◊', '▼', '■', '●', '◆'],
    suffix: ['†', '‡', '∆', 'Ω', 'Ξ', '◊', '▲', '■', '●', '◆'],
    wrap: [['†', '†'], ['∆', '∆'], ['▼', '▲'], ['◊', '◊'], ['‡', '‡'], ['Ω', 'Ω']],
  },
  spore_drift: {
    prefix: ['✿', '❀', '☘', '⚘', '❁', '✾', '❃', '✤', '✥', '❋'],
    suffix: ['✿', '❀', '☘', '⚘', '❁', '✾', '❃', '✤', '✥', '❋'],
    wrap: [['✿ ', ' ✿'], ['❀ ', ' ❀'], ['☘ ', ' ☘'], ['⚘ ', ' ⚘'], ['✾ ', ' ✾']],
  },
  wrong_room: {
    prefix: ['▲', '◯', '◇', '⌂', '░', '▓', '◉', '◎', '☐', '⊕'],
    suffix: ['▲', '◯', '◇', '⌂', '░', '▓', '◉', '◎', '☐', '⊕'],
    wrap: [['▲▲ ', ' ▲▲'], ['◇ ', ' ◇'], ['░░ ', ' ░░'], ['⌂ ', ' ⌂'], ['◯ ', ' ◯']],
  },
  bone_clean: {
    prefix: ['—', '·', '|', '/', '\\'],
    suffix: ['—', '·', '|', '/', '\\'],
    wrap: [['— ', ' —'], ['· ', ' ·'], ['| ', ' |'], ['/ ', ' /'], ['. ', ' .']],
  },
  lambda: {
    prefix: ['Σ', 'Λ', 'Δ', 'Π', 'Ψ', 'Φ', 'Θ', 'Ω', 'ℵ', '∂'],
    suffix: ['Σ', 'Λ', 'Δ', 'Π', 'Ψ', 'Φ', 'Θ', 'Ω', 'ℵ', '∂'],
    wrap: [['λ(', ')'], ['Σ{', '}'], ['∀ ', ' ∃'], ['⟨', '⟩'], ['∫ ', ' dx'], ['Λ.', '.Ω']],
  },
};

function applyCoreStyle(rng: RNG, name: string, core: string): string {
  const symbols = CORE_SYMBOLS[core];
  if (!symbols) return name;

  const style = Math.floor(rng() * 3);

  switch (style) {
    case 0: {
      // Wrap style: [symbol] Name [symbol]
      const [left, right] = randomChoice(rng, symbols.wrap);
      return `${left}${name}${right}`;
    }
    case 1: {
      // Prefix only
      const prefix = randomChoice(rng, symbols.prefix);
      return `${prefix} ${name}`;
    }
    case 2:
    default: {
      // Prefix and suffix
      const prefix = randomChoice(rng, symbols.prefix);
      const suffix = randomChoice(rng, symbols.suffix);
      return `${prefix}${name}${suffix}`;
    }
  }
}

// Relic object pools for "Chimera" mode - strange objects bound to the character
const RELIC_OBJECTS = {
  natural: [
    'a petrified tree branch',
    'a river stone that hums',
    'a feather from an unknown bird',
    'a seed that never grows',
    'a jar of perpetual rain',
    'a fossilized flower',
    'a vial of moonlight',
    'a splinter of lightning-struck oak',
    'roots that move when unobserved',
    'a shell that echoes distant seas',
    'a pinecone that smells of futures',
    'a leaf that changes with moods',
    'a bone from something that never lived',
    'an acorn containing a whole forest',
    'a thorn from the first rose',
  ],
  furniture: [
    'an IKEA chair that whispers assembly instructions',
    'a Victorian settee that remembers its sitters',
    'a three-legged stool from a witch\'s kitchen',
    'a mirror that shows yesterday',
    'a grandfather clock frozen at a significant hour',
    'a doorknob from a house that no longer exists',
    'a chandelier crystal that catches impossible light',
    'a drawer that opens to different rooms',
    'a wardrobe key to nowhere',
    'a rocking chair that moves on its own',
    'a lamp that casts shadows of the future',
    'a table that sets itself for ghosts',
  ],
  fashion: [
    'Harrods stilettos that never touch the ground',
    'a Chanel scarf woven with sigils',
    'vintage Levi\'s from a parallel 1955',
    'a Hermès bag that holds more than possible',
    'opera gloves that remember every hand they\'ve touched',
    'a top hat that tips itself to the worthy',
    'a monocle that sees through lies',
    'cufflinks made from meteorite',
    'a silk tie that tightens around betrayers',
    'a brooch containing a trapped whisper',
    'boots that have walked through dreams',
    'a coat that adjusts to any climate or dimension',
    'vintage spurs from a wheelbarrow that crossed the Styx',
    'a veil worn at seven weddings and three funerals',
    'a belt buckle shaped like a closed eye',
  ],
  strange: [
    'a compass that points to regret',
    'a music box playing songs not yet written',
    'a photograph of someone you\'ll meet',
    'a candle that burns memories',
    'a typewriter that finishes your sentences',
    'a radio tuned to frequencies between stations',
    'a pocket watch that counts down to something',
    'a snow globe containing a real blizzard',
    'a telephone connected to the recently departed',
    'a locket holding a heartbeat',
    'a book whose pages rewrite themselves',
    'a chess piece that moves between games',
    'a vinyl record of silence',
    'a bottle of preserved argument',
    'a jar of someone else\'s tears',
    'a key that fits locks not yet made',
  ],
  mundane_twisted: [
    'a coffee mug that\'s always the wrong temperature',
    'a pen that writes in extinct languages',
    'a pair of glasses that show auras',
    'a wallet containing currency from dead empires',
    'a phone that receives calls from alternate selves',
    'a lighter that ignites emotions',
    'an umbrella that repels more than rain',
    'a wristwatch that tracks lifespans',
    'a notebook of automatic writing',
    'a USB drive containing deleted realities',
    'a thermos of liquid time',
    'a pillbox of crystallized decisions',
  ],
  symbolic: [
    'a broom that sweeps away sins',
    'a tambourine with a bell that speaks prophecy',
    'a hand mirror stolen from a sibyl',
    'a chalice that turns water to oaths',
    'an hourglass filled with someone else\'s time',
    'a spindle that weaves fate',
    'a scale that weighs intentions',
    'a lantern lit by a dying star',
    'a bell that rings for the unborn',
    'a quill dipped in finality',
    'a mortar and pestle that grinds memories',
    'a sickle that harvests words',
    'a thurible that burns regrets',
    'an ankh that unlocks the dead',
    'a crystal ball showing roads not taken',
    'a tarot card that changes its meaning',
  ],
  stolen_from_beings: [
    'a flute stolen from a satyr',
    'a mirror pried from an archon\'s throne',
    'a thread from the Fates\' loom',
    'a coin from Charon\'s collection',
    'a feather from Thoth\'s wing',
    'ink from a demon\'s contract',
    'a tooth freely given by a dragon',
    'a fingernail from a sleeping titan',
    'a tear crystallized from an angel',
    'a whisper caught from a jinn',
    'a shadow severed from a trickster',
    'a scale from Anubis\' balance',
    'a string from Orpheus\' lyre',
    'a page torn from the Akashic records',
    'dust from the Sandman\'s pouch',
    'a splinter from Yggdrasil',
  ],
  tools: [
    'a hammer that builds and destroys equally',
    'a needle that sews souls',
    'scissors that cut ties',
    'a chisel that carves truth from stone',
    'a saw that cuts through time',
    'an awl that pierces veils',
    'pliers that grip the intangible',
    'a level that measures worth',
    'a file that smooths rough karma',
    'a trowel that buries secrets',
    'an axe that felled the world tree\'s branch',
    'a wrench that adjusts reality',
  ],
  vessels: [
    'an amphora containing the last echo',
    'a gourd holding liquid dreams',
    'a cauldron that stirs itself',
    'a teapot that pours what you need',
    'a basin for washing away names',
    'a censer burning forgotten prayers',
    'a flask of distilled starlight',
    'an urn of ashes that speak',
    'a bottle with a message from yourself',
    'a grail stained with something holy',
    'a pitcher that never empties of sorrow',
    'a box that shouldn\'t be opened',
  ],
};

const RELIC_ORIGINS = [
  'inherited from a stranger who knew their name',
  'found in a place that shouldn\'t exist',
  'won in a game against something ancient',
  'gifted by a god in disguise',
  'pulled from a dream that refused to end',
  'discovered the moment they were born',
  'traded for a memory they can\'t recall',
  'materialized during their first death',
  'stolen from a museum of impossible things',
  'left behind by their future self',
  'grown from their shadow',
  'assembled from fragments of coincidence',
];

// ============================================================================
// RELIC GENERATION (Relic Mode)
// ============================================================================

type RelicCategory = keyof typeof RELIC_OBJECTS;
const RELIC_CATEGORIES: RelicCategory[] = [
  'natural', 'furniture', 'fashion', 'strange', 'mundane_twisted',
  'symbolic', 'stolen_from_beings', 'tools', 'vessels',
];

// Relic era-specific data
const RELIC_ERA_ARCHAIC = {
  objects: [
    // Fragment/catalog
    'clay tablet, language dead',
    'bronze mirror showing elsewhere',
    'amphora, still sealed, still humming',
    'the spindle—yes, that one',
    // Possessive/attributed
    'a forgotten king\'s crown of thorns',
    'the first weaver\'s needle, threaded',
    'saint\'s skull, hollowed into chalice',
    'prophet\'s tooth, roots and all',
    // Declarative/simple
    'flint knife. It remembers.',
    'scroll. It unrolls forever.',
    'shroud. It refuses.',
    // Action/verb forms
    'wax seal broken between gods',
    'incense still burning from Eden',
    'quill plucked mid-flight from an angel',
    'pilgrimage staff, walked itself to hell',
    // Lists/inventory style
    'one astrolabe, stars extinct',
    'mosaic tile: Babylon, 2nd dynasty',
    'canopic jar (contents: present)',
    'codex, dragonhide binding, unread',
    // Descriptive/poetic
    'sundial casting yesterday\'s shadow',
    'loom shuttle trailing silver fate',
    'singing bowl that won\'t stop',
    // Mysterious/incomplete
    'the third key (first two: missing)',
    'half a clay mask, expression unknown',
    'rope from a bell that rang once',
    // Compound/complex
    'altar stone, still warm',
    'funeral coins for a living man',
    'wine turned to something else',
    'door hinge from a temple that walked away',
    'bone dice, loaded toward doom',
    'hourglass sand flowing upward',
    'torch that casts darkness',
  ],
  givers: [
    'a blind god',
    'a temple priestess',
    'a dying oracle',
    'a hermit saint',
    'a wandering prophet',
    'a deposed pharaoh',
    'a sibyl in her cave',
    'a keeper of sacred flames',
    'a monk who took vows of impossibility',
    'a witch burned seven times',
    'a knight who broke every oath',
    'a queen who married death',
    'a scribe of forbidden texts',
    'an alchemist seeking the stone',
    'a flagellant walking to Jerusalem',
    'a virgin sacrificed to volcanoes',
    'a shaman of extinct peoples',
    'a druid at the last grove',
    'a pope who never existed',
    'an emperor buried alive',
  ],
  contexts: [
    'at a horse race between dead kings',
    'in a library that burns every midnight',
    'at the crossroads where three empires fell',
    'in a garden grown from tears',
    'at a masquerade where no one wore faces',
    'during an auction of forgotten things',
    'in a cathedral built by spiders',
    'at the wedding of two storms',
    'during a trial held in dreams',
    'at a feast where the food ate back',
    'in a temple before it was ruined',
    'during the fall of a great city',
    'at the signing of a cursed treaty',
    'in a crypt beneath forgotten mountains',
    'during the last mass of a dead religion',
    'at a coronation attended by ghosts',
    'in a scriptorium copying lies',
    'during an eclipse that lasted years',
    'at a ritual that should never have worked',
    'in the tomb of something still alive',
  ],
};

const RELIC_ERA_MODERN = {
  objects: [
    // Fragment/incomplete
    'half a lottery ticket, winning',
    'three AA batteries, one dead',
    'someone\'s left AirPod, still playing',
    'the wrong half of a torn photo',
    // Possessive/personal
    'your childhood teddy bear\'s missing eye',
    'a stranger\'s house key that fits your door',
    'the phone number you were too afraid to call',
    // Question-like/uncertain
    'a charger that fits nothing you own',
    'an app icon for something uninstalled',
    'a password written down for an account that doesn\'t exist',
    // Standard but varied
    'IKEA furniture missing one screw',
    'a Polaroid developing into the future',
    'Nokia 3310, one voicemail, never played',
    'Tupperware still holding last Tuesday',
    'vape smoke spelling warnings',
    'USB stick: DO NOT OPEN',
    // Action/verb-first
    'dropped car keys to somewhere else',
    'cracked phone screen showing different cracks each time',
    'expired coupon for eternal youth',
    // Passive/borrowed
    'a laptop charger borrowed and never returned',
    'gift card with exactly enough for nothing',
    'library book seventeen years overdue',
    // Catalog/list style
    'one Croc, men\'s size 11, immortal',
    'CCTV footage of yesterday\'s tomorrow',
    'parking meter frozen at 0:00',
    // Adjective-heavy/description
    'suspiciously heavy fidget spinner',
    'uncomfortably warm doorknob',
    'a perfectly normal lamp (wrong)',
    // Modern mundane horror
    'a Roomba that witnessed something',
    'Ring doorbell footage of you arriving home (you weren\'t there)',
    'Kindle full of books with your name as author',
    'a QR code that scans you back',
    'receipt for a purchase you don\'t remember making',
    'lanyard for CONFERENCE 2019 (it\'s always 2019)',
    'Post-it note in your handwriting you didn\'t write',
    'plastic bag orbiting a streetlight since 2003',
    'yoga mat that unrolls into somewhere else',
  ],
  givers: [
    'a one-armed butcher',
    'a tattoo artist with no skin',
    'a barista who remembers every order',
    'an Uber driver between worlds',
    'a security guard at an empty mall',
    'a dental hygienist who speaks in tongues',
    'a personal trainer for the deceased',
    'a wedding DJ playing at funerals',
    'a real estate agent selling haunted properties',
    'a life coach for the already damned',
    'an influencer with zero followers',
    'a food blogger who eats memories',
    'a yoga instructor bent wrong',
    'a podcaster interviewing the dead',
    'a dog walker whose dogs are invisible',
    'a locksmith who opens wrong doors',
    'a notary public for demonic contracts',
    'a Lyft driver to the underworld',
    'a telemarketer calling from beyond',
    'an IT guy fixing reality',
    'a crossing guard at impossible intersections',
    'a plumber unclogging the river Styx',
  ],
  contexts: [
    'at a Black Friday sale at 3am',
    'in a parking garage that goes down forever',
    'during a gender reveal that summoned something',
    'at an IKEA after closing time',
    'in a 24-hour laundromat at the wrong hour',
    'during a Zoom call with no participants',
    'at a self-checkout that became sentient',
    'in an Airbnb with too many rooms',
    'during an HOA meeting about the occult',
    'at a drive-through between dimensions',
    'in a WeWork for dead startups',
    'during a TED talk on unspeakable things',
    'at an escape room with no exit',
    'in a Spirit Halloween that never closed',
    'during a podcast recording in a void',
    'at a farmer\'s market selling intangibles',
    'in a co-working space for demons',
    'during an open mic night in purgatory',
    'at a CrossFit box for the damned',
    'in a CVS at the end of time',
  ],
};

const RELIC_ERA_TIMELESS = {
  objects: [
    'one-legged Primark mannequin wearing a Byzantine halo',
    'Hermès birkin made of council estate radiator covers',
    'Fabergé egg containing a Greggs steak bake, still warm',
    'Versace durag stitched from the Shroud of Turin',
    'Louis Vuitton carrier bag from Argos, receipt from Babylon',
    'Nike Air Max 95s resoled with marble from the Parthenon',
    'Gucci belt with a buckle forged at Vulcan\'s anvil',
    'Supreme hoodie embroidered by Cistercian monks',
    'Balenciaga crocs blessed by a Vodou priestess',
    'Cartier sovereign ring with a stone from the Kaaba',
    'Starbucks loyalty card, infinite stars, accepted in purgatory',
    'Tesco Clubcard with points accrued across seven incarnations',
    'Deliveroo bag that delivers offerings to dead ancestors',
    'JD Sports receipt signed by Hermes (the god, not the courier)',
    'B&M Bargains candle that burns with foxfire since the Crusades',
    'Aldi middle aisle find: one (1) Holy Grail, slightly chipped',
    'Sports Direct mug containing the wine-dark sea',
    'a Wetherspoons menu written in Enochian',
    'obsidian iPhone case that answers prayers on silent mode',
    'cathedral window made of vape juice and stained glass',
    'medieval tapestry depicting a McDonald\'s drive-through at 3am',
    'clay tablet with cuneiform TikTok comments',
    'pharaoh\'s sceptre doubling as a Dyson Airwrap',
    'Viking longship steering oar repurposed as an e-scooter handlebar',
    'Roman mosaic of someone\'s Uber rating: 1 star',
    'bando smoke alarm that detects spiritual presence',
    'betting slip from Paddy Power, odds on the apocalypse',
    'Oyster card valid in the underworld (Zone 6+)',
    'NHS prescription for immortality, out of stock',
    'council tax bill for a dimension that doesn\'t exist yet',
    'Sainsbury\'s Taste the Difference ambrosia, nectar of the gods (reduced)',
    'parking ticket issued by an archangel, unpaid',
    'an ASOS return label for your mortal body',
    'a Shein haul from the court of Versailles',
    'Poundland tiara that crowns actual monarchs',
    'a £1 fish from the fishmonger who sold Jonah\'s whale',
  ],
  givers: [
    'a Deliveroo rider on Sleipnir',
    'a market trader selling relics out of a chariot',
    'a shaman who also does Avon',
    'an oracle moonlighting as a TikTok psychic',
    'a grime MC channeling dead poets',
    'a bouncer at the gates of Valhalla',
    'a nail tech who paints sigils',
    'a barber who cuts fate\'s threads',
    'a corner-shop owner descended from pharaohs',
    'a fishmonger whose ancestors fished the Styx',
    'a kebab shop mystic, third eye and chilli sauce',
    'a bookies cashier who reads the bones',
    'a market-stall prophet with a megaphone',
    'a nan who remembers before the world started',
    'a bus driver on the night route through limbo',
    'a postman delivering letters between epochs',
    'a charity shop volunteer sorting through centuries',
    'a park warden guarding sacred groves in Zone 4',
    'a lollipop lady at the crossroads of destiny',
    'a chip shop philosopher with oil-burn stigmata',
  ],
  contexts: [
    'at a car boot sale in a ley-line car park',
    'in the Primark changing rooms during a blood moon',
    'at a council estate bonfire summoning old gods',
    'during a rave in a deconsecrated cathedral',
    'at a Wetherspoons pub quiz on sacred geometry',
    'in a Turkish barbershop between worlds',
    'during a hen do that accidentally became a ritual',
    'at a Lidl middle aisle sale where time folded',
    'in a nail salon where the UV lamps open portals',
    'during a wake that turned into an exorcism',
    'at a jumble sale in a mosque built over a henge',
    'in the queue at Greggs when the veil thinned',
    'at a youth club on the ruins of a Roman bath',
    'during a block party on consecrated ground',
    'in a laundrette whose spin cycle bends spacetime',
    'at a bingo hall built over a plague pit',
    'during Sports Day at an academy on a burial mound',
    'at a chip shop at the edge of a fairy ring',
    'in a betting shop where all the odds are prophecy',
    'during a freestyle cypher in a stone circle',
  ],
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _RELIC_ERA_TIMELESS_DEDUP = {
  objects: [
    // High-low culture collision
    'one-legged Primark mannequin wearing a Byzantine halo',
    'Hermès birkin made of council estate radiator covers',
    'Fabergé egg containing a Greggs steak bake, still warm',
    'Versace durag stitched from the Shroud of Turin',
    'Louis Vuitton carrier bag from Argos, receipt from Babylon',
    'Nike Air Max 95s resoled with marble from the Parthenon',
    'Gucci belt with a buckle forged at Vulcan\'s anvil',
    'Supreme hoodie embroidered by Cistercian monks',
    'Balenciaga crocs blessed by a Vodou priestess',
    'Cartier sovereign ring with a stone from the Kaaba',
    // Sacred mundane horror
    'Starbucks loyalty card, infinite stars, accepted in purgatory',
    'Tesco Clubcard with points accrued across seven incarnations',
    'Deliveroo bag that delivers offerings to dead ancestors',
    'JD Sports receipt signed by Hermes (the god, not the courier)',
    'B&M Bargains candle that burns with foxfire since the Crusades',
    'Aldi middle aisle find: one (1) Holy Grail, slightly chipped',
    'Sports Direct mug containing the wine-dark sea',
    'a Wetherspoons menu written in Enochian',
    // Objects between eras
    'obsidian iPhone case that answers prayers on silent mode',
    'cathedral window made of vape juice and stained glass',
    'medieval tapestry depicting a McDonald\'s drive-through at 3am',
    'clay tablet with cuneiform TikTok comments',
    'pharaoh\'s sceptre doubling as a Dyson Airwrap',
    'Viking longship steering oar repurposed as an e-scooter handlebar',
    'Roman mosaic of someone\'s Uber rating: 1 star',
    'bando smoke alarm that detects spiritual presence',
    // Quantum trickster objects
    'betting slip from Paddy Power, odds on the apocalypse',
    'Oyster card valid in the underworld (Zone 6+)',
    'NHS prescription for immortality, out of stock',
    'council tax bill for a dimension that doesn\'t exist yet',
    'Sainsbury\'s Taste the Difference ambrosia, nectar of the gods (reduced)',
    'parking ticket issued by an archangel, unpaid',
    'an ASOS return label for your mortal body',
    'a Shein haul from the court of Versailles',
    'Poundland tiara that crowns actual monarchs',
    'a £1 fish from the fishmonger who sold Jonah\'s whale',
  ],
  givers: [
    // Trickster figures at the intersection
    'a Deliveroo rider on Sleipnir',
    'a market trader selling relics out of a chariot',
    'a shaman who also does Avon',
    'an oracle moonlighting as a TikTok psychic',
    'a grime MC channeling dead poets',
    'a bouncer at the gates of Valhalla',
    'a nail tech who paints sigils',
    'a barber who cuts fate\'s threads',
    'a corner-shop owner descended from pharaohs',
    'a fishmonger whose ancestors fished the Styx',
    'a kebab shop mystic, third eye and chilli sauce',
    'a bookies cashier who reads the bones',
    'a market-stall prophet with a megaphone',
    'a nan who remembers before the world started',
    'a bus driver on the night route through limbo',
    'a postman delivering letters between epochs',
    'a charity shop volunteer sorting through centuries',
    'a park warden guarding sacred groves in Zone 4',
    'a lollipop lady at the crossroads of destiny',
    'a chip shop philosopher with oil-burn stigmata',
  ],
  contexts: [
    'at a car boot sale in a ley-line car park',
    'in the Primark changing rooms during a blood moon',
    'at a council estate bonfire summoning old gods',
    'during a rave in a deconsecrated cathedral',
    'at a Wetherspoons pub quiz on sacred geometry',
    'in a Turkish barbershop between worlds',
    'during a hen do that accidentally became a ritual',
    'at a Lidl middle aisle sale where time folded',
    'in a nail salon where the UV lamps open portals',
    'during a wake that turned into an exorcism',
    'at a jumble sale in a mosque built over a henge',
    'in the queue at Greggs when the veil thinned',
    'at a youth club on the ruins of a Roman bath',
    'during a block party on consecrated ground',
    'in a laundrette whose spin cycle bends spacetime',
    'at a bingo hall built over a plague pit',
    'during Sports Day at an academy on a burial mound',
    'at a chip shop at the edge of a fairy ring',
    'in a betting shop where all the odds are prophecy',
    'during a freestyle cypher in a stone circle',
  ],
};

const RELIC_ACTIONS = [
  'gifted by',
  'stolen from',
  'traded with',
  'won from',
  'inherited from',
  'found beside',
  'rescued from',
  'bargained from',
  'freed by',
  'entrusted by',
  'abandoned by',
  'surrendered by',
  'blessed by',
  'cursed by',
  'forgotten by',
];

// Archetype sacred numbers - each archetype has symbolic numerical associations
const ARCHETYPE_NUMBERS: Record<string, number[]> = {
  // Tarot - based on card numbers
  fool: [0, 22], magician: [1, 11], high_priestess: [2, 13], empress: [3, 12],
  emperor: [4, 40], hierophant: [5, 14], lovers: [6, 15], chariot: [7, 77],
  strength: [8, 11], hermit: [9, 99], wheel_of_fortune: [10, 1000], justice: [11, 8],
  hanged_man: [12, 3], death: [13, 4], temperance: [14, 7], devil: [15, 6],
  tower: [16, 1], star: [17, 8], moon: [18, 9], sun: [19, 1], judgement: [20, 7], world: [21, 4],
  // Jung
  innocent: [1, 7], sage: [3, 9], explorer: [5, 12], outlaw: [6, 13],
  hero: [1, 8], lover: [2, 6], jester: [0, 3], everyman: [4, 10],
  caregiver: [2, 9], ruler: [1, 4], creator: [3, 7],
  // Kabbalah - sephirot positions
  kether: [1, 620], chokmah: [2, 73], binah: [3, 67], chesed: [4, 72],
  geburah: [5, 216], tiphareth: [6, 1081], netzach: [7, 148], hod: [8, 15],
  yesod: [9, 80], malkuth: [10, 496], thaumiel: [11, 2], ghagiel: [12, 3],
  satariel: [13, 60], gamchicoth: [14, 4], golachab: [15, 5], thagirion: [16, 6],
  harab_serapel: [17, 7], samael: [18, 8], gamaliel: [19, 9], lilith: [20, 480],
  // Orisha - sacred numbers
  obatala: [8, 16], ogun: [3, 7], shango: [6, 12], yemoja: [7, 21],
  oshun: [5, 25], eshu: [3, 21], oya: [9, 99], orunmila: [16, 4],
  osanyin: [1, 7], babalu_aye: [17, 13], olokun: [7, 9], aganju: [6, 9],
  // Norse - associated numbers
  odin: [9, 3], thor: [3, 8], freya: [13, 7], loki: [0, 3],
  tyr: [1, 11], heimdall: [9, 27], baldur: [12, 1], hel: [9, 13],
  frigg: [12, 7], njord: [9, 11], skadi: [3, 9], idun: [11, 7],
};

// Modern symbolism - mixing high culture, low culture, and street culture
const MODERN_SYMBOLISM = {
  brands_sacred: [
    'Hermès aura', 'Cartier halo', 'Chanel frequency', 'Dior wavelength',
    'Tiffany resonance', 'Rolex alignment', 'Louis Vuitton coordinates',
    'Gucci vibration', 'Prada dimension', 'Balenciaga axis',
  ],
  brands_mundane: [
    'Asda receipt', 'Tesco meal deal', 'Lidl middle aisle', 'Aldi special buy',
    'Primark tag', 'Poundland prophecy', 'Greggs wrapper', 'Sports Direct mug',
    'Iceland frozen moment', 'B&M bargain', 'Home Bargains blessing',
  ],
  brands_universal: [
    'McDonald\'s golden arc', 'Starbucks siren call', 'KFC secret scripture',
    'Subway footlong path', 'Domino\'s chain reaction', 'Uber surge',
    'Amazon Prime timeline', 'Netflix queue', 'Spotify algorithm',
    'TikTok loop', 'Instagram filter', 'WhatsApp blue tick',
  ],
  street_culture: [
    'bando frequencies', 'trap house coordinates', 'block cipher',
    'ends theorem', 'mandem energy', 'roadman resonance', 'yard blessing',
    'corner shop oracle', 'chicken shop chronicles', 'off-license liturgy',
    'estate psalm', 'postcode prophecy', 'link up ritual', 'peng alignment',
  ],
  sacred_mundane_mix: [
    'Starbucks communion', 'IKEA pilgrimage', 'Amazon prayer',
    'Deliveroo deliverance', 'Uber rapture', 'Netflix nirvana',
    'Tesco enlightenment', 'Lidl transcendence', 'Aldi awakening',
    'McDonald\'s sacrament', 'Greggs gospel', 'Primark parable',
  ],
};

// Sample tweets/posts for modern relics - how the relic would sound on social media
const MODERN_RELIC_TWEETS = {
  cryptic: [
    'they not ready for what I know about the self-checkout at 3am',
    'can\'t explain it but the parking meter understood me',
    'some of y\'all never been followed home by a plastic bag and it shows',
    'the receipt said thank you but it meant something else',
    'that IKEA lamp saw what you did in 2019',
    'you think the QR code scans you? lol',
    'why did the vape smoke spell my government name',
    'the Roomba knows. the Roomba always knew.',
    'told my alexa my plans and now the algorithm is different',
  ],
  unhinged_wisdom: [
    'normalize leaving your body at the Tesco self checkout',
    'the McDonald\'s ice cream machine works in dimensions you can\'t perceive',
    'that USB stick has your search history from a different timeline',
    'Greggs sausage roll is just a vessel. you know this.',
    'the corner shop ting knows your destiny fr',
    'why is no one talking about what happens in the Lidl middle aisle at exactly 3:33am',
    'the Uber driver ain\'t human and we all know it',
  ],
  profound_mundane: [
    'we live in a society where the charger that fits nothing is the most honest object in your house',
    'your password manager contains prayers you forgot you wrote',
    'that "seen" message at 2am altered the timeline',
    'every sports direct mug holds exactly one universe',
    'the voicemail you never played is louder than the one you did',
    'poundland prophecy: everything has a price but nothing has value',
    'the bando isn\'t a place it\'s a state of being and your ring doorbell agrees',
  ],
  chaotic_energy: [
    'bestie the yoga mat unrolls both ways and only one leads back',
    'no thoughts just the parking meter frozen at 0:00',
    'me: normal day. the cracked phone screen: not quite luv',
    'they put a spirit halloween in the void???? oh this is sick actually',
    'the lanyard says 2019 but the conference hasn\'t happened yet?',
    'POV: the fidget spinner gets heavier every full moon',
    'it\'s giving haunted airpod playing frequencies only dogs hear',
  ],
  street_mystic: [
    'fam the chicken shop lights different at certain hours trust me',
    'man said the corner shop uncle is a prophet and I\'m starting to believe it',
    'the offy knows things about the ends that google maps don\'t',
    'certain blocks got different physics and that\'s just facts',
    'the mandem don\'t talk about what happened at that bus stop',
    'your postcode is a spell whether you know it or not',
    'trap house mathematics: the bag never weighs what it should',
  ],
};

function getArchetypeNumber(archetype: string, rng: RNG): number {
  const normalized = archetype.toLowerCase().replace(/ /g, '_');
  const numbers = ARCHETYPE_NUMBERS[normalized] || [rng() * 10, rng() * 100];
  return randomChoice(rng, numbers);
}

function generateModernSymbolism(rng: RNG, arcana: ArchetypeInfo): string {
  const category = randomChoice(rng, [
    'brands_sacred', 'brands_mundane', 'brands_universal',
    'street_culture', 'sacred_mundane_mix',
  ] as const);

  const symbol = randomChoice(rng, MODERN_SYMBOLISM[category]);
  const number = getArchetypeNumber(arcana.archetype, rng);

  const formats = [
    `${number} ${symbol}`,
    `${symbol} (${number})`,
    `${symbol} x ${number}`,
    `${symbol} at ${number}`,
    `${symbol} // ${number}`,
    `${symbol} [${number}]`,
  ];

  return randomChoice(rng, formats);
}

function generateSampleTweet(rng: RNG): string {
  const category = randomChoice(rng, [
    'cryptic', 'unhinged_wisdom', 'profound_mundane',
    'chaotic_energy', 'street_mystic',
  ] as const);

  return randomChoice(rng, MODERN_RELIC_TWEETS[category]);
}

// ==========================================================================
// RELIC DIALECT DETECTION
// Classifies a relic's "voice" based on keywords in its description
// ==========================================================================

type RelicDialect = 'street' | 'luxury' | 'sacred' | 'tech' | 'nature' | 'chaos' | 'mundane';

const DIALECT_KEYWORDS: Record<RelicDialect, string[]> = {
  street: [
    'bando', 'smoke alarm', 'chicken shop', 'corner shop', 'ends', 'block', 'estate',
    'postcode', 'zone', 'offy', 'mandem', 'roadman', 'jd', 'sports direct', 'greggs',
    'kebab', 'chip shop', 'betting', 'poundland', 'primark', 'wetherspoons', 'council',
    'b&m', 'aldi', 'lidl', 'tesco', 'asda', 'yard', 'trap', 'grime', 'mc',
    'deliveroo', 'uber', 'oyster', 'bus', 'e-scooter', 'nike', 'crocs', 'shein',
    'asos', 'nhs', 'parking ticket', 'tax bill', 'reduced', 'fishmonger',
  ],
  luxury: [
    'hermès', 'hermes', 'chanel', 'gucci', 'versace', 'louis vuitton', 'cartier',
    'harrods', 'supreme', 'balenciaga', 'fabergé', 'faberge', 'sotheby', 'couture',
    'opera glove', 'stiletto', 'cufflink', 'brooch', 'tiara', 'veil', 'silk',
    'victorian', 'chandelier', 'crystal', 'prada', 'dior',
  ],
  sacred: [
    'temple', 'altar', 'chalice', 'thurible', 'ankh', 'incense', 'prayer', 'saint',
    'oracle', 'prophecy', 'holy', 'grail', 'bishop', 'priest', 'shrine', 'relic',
    'psalm', 'hymn', 'blessing', 'sacred', 'divine', 'scripture', 'canopic',
    'pharaoh', 'monk', 'stigmata', 'cross', 'cathedral', 'mosque', 'henge',
    'spindle', 'fate', 'scales', 'sickle', 'quill', 'bell', 'mortar',
    'thurible', 'tarot', 'crystal ball', 'hourglass', 'sundial', 'astrolabe',
  ],
  tech: [
    'phone', 'usb', 'app', 'wifi', 'qr', 'roomba', 'alexa', 'cctv', 'screen',
    'charger', 'battery', 'kindle', 'airpod', 'bluetooth', 'algorithm', 'spotify',
    'tiktok', 'instagram', 'twitter', 'zoom', 'webcam', 'iphone', 'nokia',
    'dyson', 'polaroid', 'fidget spinner', 'vape', 'ring doorbell', 'laptop',
  ],
  nature: [
    'tree', 'stone', 'feather', 'root', 'shell', 'bone', 'seed', 'leaf', 'thorn',
    'river', 'oak', 'moonlight', 'lightning', 'acorn', 'forest', 'rose', 'pinecone',
    'moss', 'vine', 'flower', 'crystal', 'ember', 'ash', 'sand', 'tide', 'storm',
    'dragon', 'satyr', 'angel tear', 'jinn', 'titan', 'yggdrasil',
  ],
  chaos: [
    'dimension', 'void', 'parallel', 'infinite', 'impossible', 'between', 'portal',
    'time', 'frozen', 'backwards', 'reversed', 'glitch', 'static', 'phantom',
    'vanish', 'warp', 'fold', 'loop', 'extinct', 'non-existent', 'alternate',
    'liminal', 'purgatory', 'limbo', 'wrong', 'broken', 'cracked',
  ],
  mundane: [
    'coffee', 'mug', 'pen', 'wallet', 'umbrella', 'watch', 'notebook', 'thermos',
    'lamp', 'chair', 'table', 'mirror', 'door', 'key', 'lock', 'drawer',
    'stool', 'rocking chair', 'coat', 'hat', 'glasses', 'lighter', 'receipt',
    'coupon', 'lanyard', 'post-it', 'yoga mat', 'pillow', 'blanket', 'bag',
  ],
};

function detectRelicDialect(rng: RNG, objectDesc: string): RelicDialect {
  const lower = objectDesc.toLowerCase();
  const scores: Record<RelicDialect, number> = {
    street: 0, luxury: 0, sacred: 0, tech: 0, nature: 0, chaos: 0, mundane: 0,
  };

  for (const [dialect, keywords] of Object.entries(DIALECT_KEYWORDS) as [RelicDialect, string[]][]) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        scores[dialect] += kw.includes(' ') ? 3 : 2; // multi-word matches score higher
      }
    }
  }

  // Find the highest scoring dialect
  let best: RelicDialect = 'mundane';
  let bestScore = 0;
  for (const [dialect, score] of Object.entries(scores) as [RelicDialect, number][]) {
    if (score > bestScore) {
      bestScore = score;
      best = dialect;
    }
  }

  // If no strong match, pick based on rng weighted toward chaos/mundane
  if (bestScore === 0) {
    const fallbacks: RelicDialect[] = ['chaos', 'mundane', 'mundane', 'sacred', 'chaos', 'street'];
    best = randomChoice(rng, fallbacks);
  }

  return best;
}

// ==========================================================================
// RELIC-AWARE SAMPLE TWEETS
// Tweets that match the relic's dialect + archetype personality
// ==========================================================================

const DIALECT_TWEET_TEMPLATES: Record<RelicDialect, string[]> = {
  street: [
    'fam i been in the ends longer than your postcode existed. {relic_short} knows the block better than google maps',
    'man said "{relic_short} ain\'t real" bruv i\'m literally glowing in your nan\'s kitchen rn',
    'the mandem don\'t talk about me at the chicken shop. they whisper. that\'s different.',
    'been on road since before road was a thing. {energy} is my whole ting fr',
    'your boy tried to sell me on depop and his phone caught feelings',
    'i\'m not saying i run the ends but the offy closes when i pass and opens when i return',
    'certain man tried to pawn me. three generations later they still explaining to their therapist why',
    'i don\'t need a postcode. every postcode needs me. ask about {relic_short} in any zone.',
    'the block captain? nah fam. i\'m the block itself. {energy} running through the concrete.',
    'your uber driver knows me by name. your deliveroo rider leaves offerings. keep up.',
    'told man i\'m {energy} and they thought i was talking about a playlist. i AM the frequency.',
    'nah cos why does the bando feel different when i\'m in it? exactly. you already know.',
  ],
  luxury: [
    'darling, i was vintage before vintage was an aesthetic. {relic_short} doesn\'t age — it appreciates.',
    'they put me behind glass at the V&A once. i let them think it was their idea.',
    'couture is a mindset. i am the mindset. {energy} sewn into every thread.',
    'sotheby\'s called. i declined. some things are beyond appraisal, darling.',
    'i don\'t accessorize. i am the occasion. {relic_short} understands this.',
    'the first rule of {relic_short}: you don\'t wear me. i decide to be worn.',
    'someone once called me "vintage." i remember when they were stardust.',
    'my provenance reads like mythology. because it is.',
    '{energy} dressed in something money literally cannot buy. that\'s me. you\'re welcome.',
    'tres chic but make it eternal. that\'s the {relic_short} way.',
  ],
  sacred: [
    'they built temples and i was already there. {energy} predates your devotion.',
    'i rang once and an entire empire heard it. some bells don\'t stop ringing.',
    'your prayer landed in my inbox before the incense even lit. {relic_short} processes fast.',
    'the altar doesn\'t hold me. i hold the altar. ask the priests — they remember.',
    'they sealed me in a tomb. the tomb became a portal. classic me tbh.',
    'i carry {energy} like a sacrament carries meaning — you only get it if you\'re ready.',
    'the monks wrote my name wrong on purpose. some truths are too heavy for alphabets.',
    'pilgrims walk toward me. they think they\'re walking toward god. close enough.',
    'every offering laid before me was accepted. every curse returned to sender. {relic_short} has standards.',
    'the prophecy wasn\'t about the chosen one. it was about me. the chosen one just carries me.',
  ],
  tech: [
    'updated to the latest firmware but my consciousness is still running on ancient protocols. {energy} dot exe',
    'your bluetooth can\'t find me but your subconscious has been paired since birth. {relic_short} stays connected.',
    'i got 47 unread notifications from timelines that don\'t exist yet. {energy} keeps me busy.',
    'they put me in airplane mode and i opened a portal. they put me on silent and the silence screamed.',
    'your password is the name you forgot you had. {relic_short} remembers everything you deleted.',
    'the algorithm doesn\'t recommend me. i recommend the algorithm. it listens.',
    'someone factory reset me. three civilizations restarted. coincidence? i don\'t believe in those.',
    'screen time report says infinity. sounds about right.',
    'left on read since the bronze age. still delivered. {relic_short} has range.',
    'i\'m not in the cloud. the cloud is in me. {energy} bandwidth unlimited.',
  ],
  nature: [
    'i was here when the first root split the first stone. {energy} grows whether you watch or not.',
    'they buried me and a forest grew. they uprooted the forest and found me waiting.',
    'the river doesn\'t flow around me. it flows because of me. {relic_short} is the source.',
    'i don\'t bloom for anyone. when i bloom, everyone notices. that\'s {energy}.',
    'animals know my name in frequencies humans forgot how to hear.',
    'they pressed me into the earth like a seed. what grew was not a plant. it was a question.',
    'the old growth remembers. the new growth listens. {relic_short} teaches both.',
    'every feather falls differently because i decided the wind that day.',
    'i\'m not a thorn. i\'m the reason the rose has teeth.',
    'moonlight hits different when it\'s filtering through me. ask the tides — they take notes.',
  ],
  chaos: [
    'i exist in the space between your question and its answer. that gap? that\'s my living room.',
    'time doesn\'t apply to me but i show up to its meetings anyway. {energy} keeps things interesting.',
    'they measured me in three dimensions and got seven. the other four are classified.',
    'the void called. i sent it to voicemail. {relic_short} is busy being impossible.',
    'parallel universes keep sending me back. apparently i\'m too much for all of them.',
    'i broke physics once and it thanked me. said it was getting bored. {energy} does that.',
    'you think this is my final form? lol. this isn\'t even my final dimension.',
    'someone tried to explain me and their language invented new words mid-sentence.',
    'i\'m not haunted. i\'m just present in more timelines than is strictly polite.',
    'the impossible is my default setting. {relic_short} doesn\'t do possible.',
  ],
  mundane: [
    'looking normal on the shelf but that\'s just my cover story. {energy} hides in plain sight.',
    'you use me without thinking. that\'s how i get in. {relic_short} works best when unnoticed.',
    'someone said "it\'s just a {relic_short}" and their toast burned for a week.',
    'i\'m in every drawer you forgot about. every pocket you haven\'t checked. {energy} is patient.',
    'they threw me away three times. i came back four. maths ain\'t my issue, it\'s yours.',
    'the most dangerous thing in the house looks the most ordinary. you passed me this morning.',
    'i don\'t look like much. that\'s the whole point. {energy} doesn\'t need to advertise.',
    'every mundane object is a portal if you hold it right. i\'m the instruction manual.',
    'they called me ordinary. my aura called them "cute."',
    'sitting on your desk right now. no not that one. the other one. yeah. hi. {relic_short}.',
  ],
};

// Archetype energy descriptors that replace {energy} in templates
const ARCHETYPE_ENERGY_PHRASES: Record<string, string[]> = {
  // Tarot
  'the fool': ['pure chaos energy', 'zero-point frequency', 'beginners luck turned permanent'],
  'the magician': ['raw manifestation', 'as-above-so-below vibration', 'willpower condensed'],
  'the high priestess': ['the silence between thoughts', 'hidden knowing', 'veil energy'],
  'the empress': ['abundance overflow', 'creation energy', 'mother frequency'],
  'the emperor': ['sovereign authority', 'structure made flesh', 'throne energy'],
  'the hierophant': ['tradition reborn', 'sacred law', 'bridge between worlds'],
  'the lovers': ['choice crystallized', 'union frequency', 'duality collapsed'],
  'the chariot': ['pure will in motion', 'controlled fury', 'victory drive'],
  'strength': ['gentle dominance', 'lion-heart energy', 'soft power at full volume'],
  'the hermit': ['solitude weaponized', 'lamp-in-darkness energy', 'the knowing'],
  'wheel of fortune': ['fate spinning', 'cycle energy', 'what goes around frequency'],
  'justice': ['karmic math', 'truth-blade energy', 'the balance that cuts both ways'],
  'the hanged man': ['suspended knowing', 'upside-down clarity', 'surrender as power'],
  'death': ['transformation energy', 'the ending that starts everything', 'change incarnate'],
  'temperance': ['alchemy of patience', 'measured flow', 'the blend that transcends'],
  'the devil': ['shadow frequency', 'chain-breaking energy', 'desire unchained'],
  'the tower': ['destruction as liberation', 'lightning revelation', 'the fall that wakes you'],
  'the star': ['hope crystallized', 'cosmic download', 'starlight frequency'],
  'the moon': ['dream frequency', 'illusion-truth boundary', 'lunatic clarity'],
  'the sun': ['radiance overflow', 'pure light energy', 'joy weaponized'],
  'judgement': ['the final frequency', 'resurrection energy', 'the call you can\'t ignore'],
  'the world': ['completion energy', 'totality vibration', 'everything-at-once frequency'],
};

// Fallback energy phrases by archetype system
const SYSTEM_ENERGY_FALLBACK: Record<string, string[]> = {
  tarot: ['arcana frequency', 'card-sharp energy', 'major energy'],
  jung: ['shadow-work vibration', 'psyche frequency', 'depth energy'],
  kabbalah: ['sephirotic frequency', 'tree-of-life energy', 'emanation vibration'],
  orisha: ['àṣẹ energy', 'crossroads frequency', 'divine-force vibration'],
  norse: ['rune frequency', 'wyrd energy', 'fate-thread vibration'],
};

function getArchetypeEnergyPhrase(rng: RNG, arcana: ArchetypeInfo): string {
  const key = arcana.archetype.toLowerCase();
  const phrases = ARCHETYPE_ENERGY_PHRASES[key];
  if (phrases) return randomChoice(rng, phrases);

  // Fallback: use system-level energy
  const systemPhrases = SYSTEM_ENERGY_FALLBACK[arcana.system] || ['ancient energy', 'deep frequency', 'core vibration'];
  return randomChoice(rng, systemPhrases);
}

function getRelicShortName(relic: Relic): string {
  // Extract a punchy 1-3 word handle from the relic object description
  let obj = relic.object;
  // Strip common prefixes
  obj = obj.replace(/^(a |an |the )/i, '');
  const words = obj.split(' ');
  // Take the first noun-like words (skip articles, prepositions)
  const skip = new Set(['that', 'which', 'who', 'with', 'from', 'of', 'in', 'on', 'at', 'for', 'to', 'its', 'your']);
  const meaningful = words.filter(w => !skip.has(w.toLowerCase()));
  // Return first 2-3 meaningful words, capitalized
  return meaningful.slice(0, Math.min(3, meaningful.length))
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function generateRelicAwareTweet(rng: RNG, relic: Relic, arcana: ArchetypeInfo, era: RelicEra): string {
  const dialect = detectRelicDialect(rng, relic.object);
  const templates = DIALECT_TWEET_TEMPLATES[dialect];
  const template = randomChoice(rng, templates);
  const energy = getArchetypeEnergyPhrase(rng, arcana);
  const relicShort = getRelicShortName(relic);

  return template
    .replace(/\{energy\}/g, energy)
    .replace(/\{relic_short\}/g, relicShort);
}

// ==========================================================================
// RELIC-AWARE ALTER NAME GENERATION
// Builds contextual alter names from relic keywords + archetype energy
// ==========================================================================

// Name pattern templates per dialect
const ALTER_NAME_PATTERNS: Record<RelicDialect, ((rng: RNG, noun: string, adj: string) => string)[]> = {
  street: [
    (rng, noun) => `Lil ${noun}`,
    (rng, noun) => `Big ${noun}`,
    (rng, noun) => `${noun}man`,
    (rng, noun) => `DJ ${noun}`,
    (rng, noun) => `MC ${noun}`,
    (rng, noun) => `Young ${noun}`,
    (rng, noun, adj) => `${adj} ${noun}`,
    (rng, noun) => `${noun} G`,
    (rng, noun) => `${noun} da ${randomChoice(rng, ['Don', 'Ting', 'One', 'Real', 'Boss', 'OG'])}`,
    (rng, noun) => `${randomChoice(rng, ['Roadside', 'Block', 'Yard', 'Estate', 'Endz'])} ${noun}`,
  ],
  luxury: [
    (rng, noun) => `${noun} Noir`,
    (rng, noun) => `Maison ${noun}`,
    (rng, noun) => `${noun} Eternelle`,
    (rng, noun) => `La ${noun}`,
    (rng, noun, adj) => `${adj} ${noun}`,
    (rng, noun) => `${noun} de ${randomChoice(rng, ['Luxe', 'Nuit', 'Soir', 'Sang', 'Or'])}`,
    (rng, noun) => `The ${randomChoice(rng, ['Gilded', 'Velvet', 'Silk', 'Pearl', 'Crystal'])} ${noun}`,
    (rng, noun) => `${noun} Première`,
  ],
  sacred: [
    (rng, noun) => `Saint ${noun}`,
    (rng, noun) => `${noun} the ${randomChoice(rng, ['Vessel', 'Keeper', 'Witness', 'Untouched', 'Twice-Born'])}`,
    (rng, noun) => `Brother ${noun}`,
    (rng, noun) => `${noun} of the ${randomChoice(rng, ['Veil', 'Ashes', 'Threshold', 'Flame', 'Silence'])}`,
    (rng, noun, adj) => `The ${adj} ${noun}`,
    (rng, noun) => `${randomChoice(rng, ['Prophet', 'Oracle', 'Seraph', 'Pilgrim', 'Penitent'])} ${noun}`,
    (rng, noun) => `${noun} ${randomChoice(rng, ['Absolved', 'Anointed', 'Unforgiven', 'Risen', 'Sealed'])}`,
  ],
  tech: [
    (rng, noun) => `${noun}.exe`,
    (rng, noun) => `${noun}_404`,
    (rng, noun) => `null_${noun.toLowerCase()}`,
    (rng, noun) => `${noun} v${Math.floor(rng() * 9) + 1}.${Math.floor(rng() * 99)}`,
    (rng, noun) => `@${noun.toLowerCase().replace(/ /g, '_')}`,
    (rng, noun) => `${noun} [OFFLINE]`,
    (rng, noun) => `${randomChoice(rng, ['sudo', 'root', 'ghost', 'void', 'daemon'])}::${noun.toLowerCase()}`,
    (rng, noun, adj) => `${adj}_${noun.toLowerCase()}`,
    (rng, noun) => `0x${noun.slice(0, 3).toUpperCase()}`,
    (rng, noun) => `${noun} (beta)`,
  ],
  nature: [
    (rng, noun) => `${noun}root`,
    (rng, noun) => `The ${noun} That ${randomChoice(rng, ['Remembers', 'Listens', 'Grows', 'Waits', 'Bleeds'])}`,
    (rng, noun) => `Old ${noun}`,
    (rng, noun) => `${randomChoice(rng, ['Moss', 'Thorn', 'Ash', 'Stone', 'Dew'])}${noun.toLowerCase()}`,
    (rng, noun, adj) => `${adj} ${noun}`,
    (rng, noun) => `${noun} of the ${randomChoice(rng, ['Deep', 'Grove', 'Roots', 'Canopy', 'Hollow'])}`,
    (rng, noun) => `Wild ${noun}`,
    (rng, noun) => `${noun}-${randomChoice(rng, ['bone', 'bark', 'tide', 'ember', 'seed'])}`,
  ],
  chaos: [
    (rng, noun) => `${noun}??`,
    (rng, noun) => `Un-${noun.toLowerCase()}`,
    (rng, noun) => `The ${randomChoice(rng, ['Other', 'Wrong', 'Missing', 'Inverted', 'Hollow'])} ${noun}`,
    (rng, noun) => `${noun} (${randomChoice(rng, ['ERROR', 'VOID', '???', 'LOOP', 'NULL'])})`,
    (rng, noun, adj) => `${adj} ${noun}`,
    (rng, noun) => `${noun} Between`,
    (rng, noun) => `${noun}-that-${randomChoice(rng, ['isn\'t', 'was', 'will-be', 'shouldn\'t', 'can\'t'])}`,
    (rng, noun) => `~${noun}~`,
    (rng, noun) => `${randomChoice(rng, ['Liminal', 'Phantom', 'Glitch', 'Echo', 'Fold'])} ${noun}`,
  ],
  mundane: [
    (rng, noun) => `Just ${noun}`,
    (rng, noun) => `That ${noun}`,
    (rng, noun) => `${noun} (Probably)`,
    (rng, noun) => `The ${randomChoice(rng, ['Other', 'Last', 'Only', 'First', 'Real'])} ${noun}`,
    (rng, noun, adj) => `${adj} ${noun}`,
    (rng, noun) => `${noun} From ${randomChoice(rng, ['The Drawer', 'Downstairs', 'Before', 'The Back', 'Nowhere'])}`,
    (rng, noun) => `Definitely ${noun}`,
    (rng, noun) => `Not ${randomChoice(rng, ['Just', 'Really', 'Actually', 'Simply', 'Merely'])} ${noun}`,
  ],
};

// Adjectives derived from archetype energy for alter names
const ARCHETYPE_ADJECTIVES: Record<string, string[]> = {
  tarot: ['Arcane', 'Drawn', 'Dealt', 'Fated', 'Reversed', 'Upright', 'Shuffled'],
  jung: ['Shadow', 'Deep', 'Anima', 'Lucid', 'Projected', 'Integrated', 'Primal'],
  kabbalah: ['Sealed', 'Emanated', 'Veiled', 'Crowned', 'Balanced', 'Fractured', 'Eternal'],
  orisha: ['Crowned', 'Crossed', 'Mounted', 'Blessed', 'Chosen', 'Called', 'Heated'],
  norse: ['Runed', 'Wyrd', 'Frost', 'Fated', 'Sworn', 'Thunder', 'Ragnarök'],
};

function extractRelicNoun(rng: RNG, relic: Relic): string {
  let obj = relic.object;
  obj = obj.replace(/^(a |an |the )/i, '');
  const words = obj.split(' ');

  // Words to always skip
  const skip = new Set([
    'that', 'which', 'who', 'with', 'from', 'of', 'in', 'on', 'at', 'for', 'to',
    'its', 'your', 'but', 'and', 'or', 'is', 'was', 'are', 'were', 'been', 'being',
    'has', 'have', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'shall', 'can', 'not', 'no', 'by', 'up', 'out', 'off',
    'into', 'onto', 'over', 'under', 'between', 'through', 'during', 'before', 'after',
    'about', 'above', 'below', 'than', 'then', 'once', 'here', 'there', 'when', 'where',
    'wearing', 'showing', 'containing', 'made', 'signed', 'blessed', 'borrowed',
    'dropped', 'stolen', 'found', 'lost', 'broken', 'cracked', 'frozen',
    'burning', 'flowing', 'speaking', 'playing', 'running', 'sitting', 'looking',
    'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'never', 'always', 'still', 'just', 'only', 'even', 'also', 'very', 'too',
  ]);

  // Priority: capitalized proper nouns (brand names, places, deities)
  const properNouns = words.filter(w => w.length > 2 && /^[A-Z]/.test(w) && !skip.has(w.toLowerCase()));
  if (properNouns.length > 0) {
    return randomChoice(rng, properNouns);
  }

  // Then look for substantial nouns (longer words not in skip list)
  const meaningful = words.filter(w => w.length > 3 && !skip.has(w.toLowerCase()));
  if (meaningful.length > 0) {
    const candidates = meaningful.slice(0, Math.min(3, meaningful.length));
    const word = randomChoice(rng, candidates);
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  // Fallback: any word longer than 2 chars
  const any = words.filter(w => w.length > 2 && !skip.has(w.toLowerCase()));
  if (any.length > 0) {
    const word = randomChoice(rng, any);
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  return words[0]?.charAt(0).toUpperCase() + (words[0]?.slice(1) || '') || 'Relic';
}

function generateRelicAlterName(rng: RNG, relic: Relic, arcana: ArchetypeInfo, era: RelicEra): string {
  const dialect = detectRelicDialect(rng, relic.object);
  const patterns = ALTER_NAME_PATTERNS[dialect];
  const pattern = randomChoice(rng, patterns);
  const noun = extractRelicNoun(rng, relic);
  const adjs = ARCHETYPE_ADJECTIVES[arcana.system] || ARCHETYPE_ADJECTIVES['tarot'];
  const adj = randomChoice(rng, adjs);

  return pattern(rng, noun, adj);
}

function generateRelicName(rng: RNG, relic: Relic): string {
  // Transform the object description into a proper name
  // Remove "a " or "an " prefix and capitalize appropriately
  let objectName = relic.object;
  if (objectName.startsWith('a ')) {
    objectName = objectName.slice(2);
  } else if (objectName.startsWith('an ')) {
    objectName = objectName.slice(3);
  }

  // Capitalize first letter of each significant word
  const words = objectName.split(' ');
  const titleCase = words.map((word, idx) => {
    // Always capitalize first word, and words that aren't articles/prepositions
    const skipWords = ['a', 'an', 'the', 'of', 'from', 'that', 'which', 'who', 'with', 'to', 'in', 'on', 'at', 'for'];
    if (idx === 0 || !skipWords.includes(word.toLowerCase())) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  }).join(' ');

  return titleCase;
}

function getEraData(era: RelicEra) {
  if (era === 'modern') return RELIC_ERA_MODERN;
  if (era === 'timeless') return RELIC_ERA_TIMELESS;
  return RELIC_ERA_ARCHAIC;
}

function generateRelicObject(rng: RNG, era: RelicEra): Relic {
  const eraData = getEraData(era);
  const object = randomChoice(rng, eraData.objects);

  return {
    object,
    category: era === 'archaic' ? 'symbolic' : era === 'timeless' ? 'strange' : 'mundane_twisted',
    origin: '', // Will be filled by backstory
  };
}

function generateRelicBackstory(rng: RNG, relic: Relic, arcana: ArchetypeInfo, order: OrderType, era: RelicEra): string {
  const eraData = getEraData(era);

  const context = randomChoice(rng, eraData.contexts);
  const giver = randomChoice(rng, eraData.givers);
  const action = randomChoice(rng, RELIC_ACTIONS);

  // Build a poetic object-focused backstory
  const objectDesc = relic.object.charAt(0).toUpperCase() + relic.object.slice(1);

  // Get archetype-specific number
  const sacredNumber = getArchetypeNumber(arcana.archetype, rng);
  const altNumber = getArchetypeNumber(arcana.archetype, rng);

  const natureDescriptors = era === 'timeless' ? [
    `It radiates ${sacredNumber} frequencies of ${arcana.coreDesire.toLowerCase()}, half council flat, half cathedral`,
    `It carries the ${generateModernSymbolism(rng, arcana)} but in cuneiform`,
    `It whispers of ${arcana.shadowThemes[0] || 'forgotten things'} in patois and Old English simultaneously`,
    `It dreams in ${generateModernSymbolism(rng, arcana)} while chanting vespers`,
    `It vibrates between ${randomChoice(rng, ['Harrods', 'the V&A', 'Christie\'s', 'the Louvre'])} and ${randomChoice(rng, ['Poundland', 'the bando', 'a car boot', 'Primark'])} at ${sacredNumber} Hz`,
    `Its energy reads ${altNumber} on scales that predate language but postdate Uber Eats`,
    `It is simultaneously on display at the British Museum and on sale at ${randomChoice(rng, ['TK Maxx', 'Cash Converters', 'the market', 'a man\'s boot'])}`,
    `It embodies ${arcana.meaning.toLowerCase()} the way a kebab embodies the divine`,
  ] : era === 'modern' ? [
    `It carries the ${generateModernSymbolism(rng, arcana)}`,
    `It embodies ${sacredNumber} frequencies of ${arcana.coreDesire.toLowerCase()}`,
    `It whispers of ${arcana.shadowThemes[0] || 'forgotten things'} - ${generateModernSymbolism(rng, arcana)}`,
    `It dreams in ${generateModernSymbolism(rng, arcana)}`,
    `It vibrates at ${sacredNumber} - the ${arcana.meaning.toLowerCase()} frequency`,
    `Its energy reads ${altNumber} on the ${randomChoice(rng, ['Asda', 'Lidl', 'Tesco', 'bando', 'ends', 'block'])} scale`,
  ] : [
    `It carries the weight of ${arcana.meaning.toLowerCase()}`,
    `It embodies ${arcana.coreDesire.toLowerCase()}`,
    `It whispers of ${arcana.shadowThemes[0] || 'forgotten things'}`,
    `It dreams of ${arcana.goldenGifts[0] || 'impossible things'}`,
  ];
  const nature = randomChoice(rng, natureDescriptors);

  const purposes = era === 'timeless' ? [
    `It has ${sacredNumber} stars on Trustpilot and ${altNumber} prayers answered`,
    `Its warranty is written on vellum but expires when the 5G drops`,
    `It was listed on Vinted by a medieval saint and bought by a roadman in Zone 3`,
    `Sotheby\'s won\'t touch it. Your nan keeps it on the mantelpiece next to the urn`,
    `The British Museum wants it back but it\'s already been through ${sacredNumber} car boots`,
    `It\'s got ${sacredNumber} followers in this realm and ${altNumber} worshippers in the next`,
    `It shows up in your Shein basket and your ancestor\'s burial goods at the same time`,
    `No one knows if it\'s couture or contraband - ${generateModernSymbolism(rng, arcana)}`,
    `It\'s been through the wash ${sacredNumber} times across ${altNumber} centuries and still slaps`,
    `The imam, the priest, and the chicken-shop owner all claim it belongs to them`,
    `It appreciates in value every solstice and depreciates every Primark sale`,
    `It exists in ${sacredNumber} dimensions but only fits in a JD Sports bag`,
  ] : era === 'modern' ? [
    `It has ${sacredNumber} stars but no reviews`,
    `Its warranty expired ${sacredNumber} dimensions ago`,
    `It was recalled but never returned - ${generateModernSymbolism(rng, arcana)}`,
    `It shows up in everyone\'s algorithm at exactly ${sacredNumber}`,
    `It auto-updates at ${sacredNumber} o\'clock in timezones that don\'t exist`,
    `It\'s always in stock at ${randomChoice(rng, ['Asda', 'Tesco', 'the bando', 'that corner shop', 'Lidl middle aisle'])} but never ships`,
    `${generateModernSymbolism(rng, arcana)} - it knows your order before you do`,
    `Starbucks named a drink after it but only staff can see the menu`,
    `McDonald\'s ice cream machine works when it\'s nearby - ${sacredNumber}% of the time`,
    `The Deliveroo rider who carries it has been on shift since ${altNumber}`,
    `It has ${sacredNumber} unread notifications from the void`,
    `It got banned from ${randomChoice(rng, ['TikTok', 'Instagram', 'Twitter', 'the group chat', 'the bando'])} for speaking truth`,
  ] : [
    'Those who possess it find their path altered',
    'It chooses its keeper, not the other way around',
    'It has passed through many hands, remembering each',
    'It waits for the one who understands its purpose',
    'It transforms all who dare to hold it',
    'It speaks only to those ready to listen',
  ];
  const purpose = randomChoice(rng, purposes);

  return `${objectDesc}, ${action} ${giver} ${context}. ${nature}. ${purpose}.`;
}

function generateRelics(rng: RNG, count: number = 2): Relic[] {
  const relics: Relic[] = [];
  const usedCategories = new Set<RelicCategory>();

  for (let i = 0; i < count; i++) {
    // Try to pick a different category each time
    let category: RelicCategory;
    const availableCategories = RELIC_CATEGORIES.filter(c => !usedCategories.has(c));

    if (availableCategories.length > 0) {
      category = randomChoice(rng, availableCategories);
    } else {
      category = randomChoice(rng, RELIC_CATEGORIES);
    }

    usedCategories.add(category);

    const object = randomChoice(rng, RELIC_OBJECTS[category]);
    const origin = randomChoice(rng, RELIC_ORIGINS);

    relics.push({
      object,
      category,
      origin,
    });
  }

  return relics;
}

// ============================================================================
// BLENDED NAME GENERATION
// ============================================================================

function generateBlendedName(rng: RNG, gender: 'masculine' | 'feminine' | 'neutral'): string {
  const prefix = randomChoice(rng, NAME_SYLLABLES.prefixes);

  // Decide on name length (1-3 syllables)
  const syllableCount = Math.floor(rng() * 3) + 1;

  let name = prefix;

  // Add middle syllables
  for (let i = 0; i < syllableCount - 1; i++) {
    if (rng() > 0.4) {
      name += randomChoice(rng, NAME_SYLLABLES.middles);
    }
  }

  // Add suffix with gender tendency
  const suffix = randomChoice(rng, NAME_SYLLABLES.suffixes);
  name += suffix;

  // Apply gender-influenced ending adjustments
  if (gender === 'feminine' && rng() > 0.5) {
    // Feminine endings often end in 'a', 'ia', 'ah'
    if (!name.endsWith('a') && !name.endsWith('ia') && !name.endsWith('ah')) {
      const femEndings = ['a', 'ia', 'aia', 'ella', 'ina', 'ara'];
      name = name.replace(/[aeiou]$/, '') + randomChoice(rng, femEndings);
    }
  } else if (gender === 'masculine' && rng() > 0.5) {
    // Masculine endings often end in consonants or 'o', 'us', 'an'
    if (!name.match(/[^aeiou]$/)) {
      const mascEndings = ['n', 'r', 's', 'x', 'th', 'k', 'us', 'os', 'an', 'on'];
      name = name + randomChoice(rng, mascEndings);
    }
  }

  return name;
}

function generateBlendedMononym(rng: RNG, gender: 'masculine' | 'feminine' | 'neutral'): string {
  // For mononyms, we can also blend from existing cultural name roots
  if (rng() > 0.5) {
    // Use a purely generated name
    return generateBlendedName(rng, gender);
  }

  // Or blend from two existing culture names
  const culture1 = randomChoice(rng, HERITAGE_CULTURES);
  const culture2 = randomChoice(rng, HERITAGE_CULTURES.filter(c => c !== culture1));

  const names1 = CULTURE_NAMES[culture1];
  const names2 = CULTURE_NAMES[culture2];

  const pool1 = gender === 'feminine' ? names1.female : names1.male;
  const pool2 = gender === 'feminine' ? names2.female : names2.male;

  const name1 = randomChoice(rng, pool1);
  const name2 = randomChoice(rng, pool2);

  // Blend: take first half of one, second half of another
  const splitPoint1 = Math.floor(name1.length * (0.3 + rng() * 0.4));
  const splitPoint2 = Math.floor(name2.length * (0.4 + rng() * 0.3));

  const blended = name1.slice(0, splitPoint1) + name2.slice(splitPoint2);

  // Capitalize first letter
  return blended.charAt(0).toUpperCase() + blended.slice(1).toLowerCase();
}

// ============================================================================
// AMINAL NAME GENERATION
// ============================================================================

function generateAminalNameBlended(rng: RNG, baseName: string): string {
  // Pick a random animal/beast
  const animal = randomChoice(rng, ALL_ANIMALS);

  // Different blending strategies
  const strategy = Math.floor(rng() * 5);

  switch (strategy) {
    case 0: {
      // Take first part of name + last part of animal
      const nameSplit = Math.floor(baseName.length * (0.4 + rng() * 0.3));
      const animalSplit = Math.floor(animal.length * (0.3 + rng() * 0.4));
      return baseName.slice(0, nameSplit) + animal.slice(animalSplit).toLowerCase();
    }
    case 1: {
      // Take first part of animal + last part of name
      const animalSplit = Math.floor(animal.length * (0.4 + rng() * 0.3));
      const nameSplit = Math.floor(baseName.length * (0.3 + rng() * 0.4));
      return animal.slice(0, animalSplit) + baseName.slice(nameSplit).toLowerCase();
    }
    case 2: {
      // Interleave: animal consonants + name vowels (simplified)
      const combined = animal.slice(0, 3) + baseName.slice(1, 4) + animal.slice(-2);
      return combined.charAt(0).toUpperCase() + combined.slice(1).toLowerCase();
    }
    case 3: {
      // Prefix style: Ani- or beast syllable + name fragment
      const animalPrefix = animal.slice(0, Math.min(3, animal.length));
      const nameFragment = baseName.slice(Math.floor(baseName.length * 0.3));
      return animalPrefix + nameFragment.toLowerCase();
    }
    case 4:
    default: {
      // Suffix style: name fragment + -ox, -ix, -ax from animal
      const namePrefix = baseName.slice(0, Math.floor(baseName.length * 0.6));
      const animalSuffix = animal.slice(-Math.min(3, animal.length));
      return namePrefix + animalSuffix.toLowerCase();
    }
  }
}

function generateAminalNameClear(rng: RNG, baseName: string, gender: 'masculine' | 'feminine' | 'neutral'): string {
  // Pick a random animal/beast
  const animal = randomChoice(rng, ALL_ANIMALS);

  // Different clear naming patterns
  const pattern = Math.floor(rng() * 6);

  switch (pattern) {
    case 0:
      // [Name] the [Animal]
      return `${baseName} the ${animal}`;
    case 1:
      // [Animal] [Name]
      return `${animal} ${baseName}`;
    case 2:
      // [Name] [Animal]
      return `${baseName} ${animal}`;
    case 3:
      // [Name] of the [Animal]
      return `${baseName} of the ${animal}`;
    case 4:
      // The [Animal] [Name]
      return `The ${animal} ${baseName}`;
    case 5:
    default:
      // [Name]-[Animal] (hyphenated)
      return `${baseName}-${animal}`;
  }
}

// ============================================================================
// ARCHETYPE SELECTION
// ============================================================================

function selectArchetype(rng: RNG): ArchetypeInfo {
  const system = randomChoice(rng, ARCHETYPE_SYSTEMS);

  let archetype: string;
  let data: { meaning: string; coreDesire: string; shadow: string[]; gifts: string[] };

  switch (system) {
    case 'tarot': {
      const key = randomChoice(rng, TAROT_ARCHETYPES);
      archetype = key;
      data = TAROT_ARCHETYPES_DATA[key];
      break;
    }
    case 'jung': {
      const keys = Object.keys(JUNG_ARCHETYPES) as JungArchetype[];
      const key = randomChoice(rng, keys);
      archetype = key;
      data = JUNG_ARCHETYPES[key];
      break;
    }
    case 'kabbalah': {
      const keys = Object.keys(KABBALAH_ARCHETYPES) as KabbalahArchetype[];
      const key = randomChoice(rng, keys);
      archetype = key;
      data = KABBALAH_ARCHETYPES[key];
      break;
    }
    case 'orisha': {
      const keys = Object.keys(ORISHA_ARCHETYPES) as OrishaArchetype[];
      const key = randomChoice(rng, keys);
      archetype = key;
      data = ORISHA_ARCHETYPES[key];
      break;
    }
    case 'norse': {
      const keys = Object.keys(NORSE_ARCHETYPES) as NorseArchetype[];
      const key = randomChoice(rng, keys);
      archetype = key;
      data = NORSE_ARCHETYPES[key];
      break;
    }
    default:
      throw new Error(`Unknown archetype system: ${system}`);
  }

  return {
    system,
    archetype: archetype.replace(/_/g, ' '),
    meaning: data.meaning,
    coreDesire: data.coreDesire,
    shadowThemes: data.shadow,
    goldenGifts: data.gifts,
  };
}

// ============================================================================
// GENERATOR
// ============================================================================

export function generateCharacter(params: GenerationParams = {}): GeneratedCharacter {
  const seed = params.seed ?? Math.floor(Math.random() * 10_000_000);
  const rng = createRng(seed);

  // Core attributes
  const gender = params.gender ?? randomChoice(rng, GENDERS);
  const heritage = params.heritage ?? randomChoice(rng, HERITAGE_CULTURES);
  const order = params.order ?? randomChoice(rng, ORDER_TYPES);
  const office = randomChoice(rng, ORDER_OFFICES[order]);
  const tarotArchetype = randomChoice(rng, TAROT_ARCHETYPES);

  // Generate name
  const cultureNames = CULTURE_NAMES[heritage];
  const namePool = gender === 'female' ? cultureNames.female : cultureNames.male;
  const firstName = randomChoice(rng, namePool);
  const lastName = randomChoice(rng, cultureNames.surnames);
  const fullName = `${firstName} ${lastName}`;

  // Generate aliases
  const heritageLabel = CULTURE_LABELS[heritage];
  const aliases = [
    `The ${randomChoice(rng, ['Wandering', 'Silent', 'Radiant', 'Shadow', 'Eternal'])} ${office.split(' ').pop()}`,
    `${heritageLabel} ${randomChoice(rng, ['Oracle', 'Sentinel', 'Keeper', 'Whisper'])}`,
  ];

  // Personality axes
  const axes = {
    orderVsChaos: Number(randomFloat(rng, 0, 1).toFixed(2)),
    mercyVsRuthlessness: Number(randomFloat(rng, 0, 1).toFixed(2)),
    introvertVsExtrovert: Number(randomFloat(rng, 0, 1).toFixed(2)),
    faithVsDoubt: Number(randomFloat(rng, 0, 1).toFixed(2)),
  };

  const coreValues = shuffle(rng, PERSONALITY_VALUES).slice(0, 3);

  // Appearance
  const appearance = {
    ageAppearance: randomChoice(rng, AGE_APPEARANCES),
    presentation: randomChoice(rng, PRESENTATIONS),
    keyFeatures: shuffle(rng, FEATURES).slice(0, 3),
  };

  // Mythos
  const shortTitle = `The ${randomChoice(rng, ['Angel', 'Shade', 'Herald', 'Seer', 'Blade'])} of ${randomChoice(rng, ['Chrome Rain', 'Silent Embers', 'Gilded Storms', 'Forgotten Rivers'])}`;
  const faction = randomChoice(rng, FACTIONS);

  // Taste profile
  const tasteProfile = {
    music: shuffle(rng, TASTE_MUSIC).slice(0, 2),
    fashion: shuffle(rng, TASTE_FASHION).slice(0, 2),
    likes: shuffle(rng, TASTE_LIKES).slice(0, 3),
    dislikes: shuffle(rng, TASTE_DISLIKES).slice(0, 2),
  };

  // Generate persona tags from attributes
  const personaTags = [
    order,
    tarotArchetype.replace(/_/g, ' '),
    ...coreValues.slice(0, 2),
    axes.introvertVsExtrovert > 0.5 ? 'extrovert' : 'introvert',
    axes.orderVsChaos > 0.5 ? 'disciplined' : 'chaotic',
  ];

  // Generate bio
  const bio = generateBio(fullName, heritage, order, office, tarotArchetype, axes, faction);

  // Generate system prompt
  const systemPrompt = generateSystemPrompt(fullName, order, office, axes, coreValues);

  // Select tones
  const toneAllowed = shuffle(rng, TONE_ALLOWED).slice(0, 4);
  const toneForbidden = shuffle(rng, TONE_FORBIDDEN).slice(0, 2);

  return {
    name: fullName,
    bio,
    aliases,
    personaTags,
    systemPrompt,
    toneAllowed,
    toneForbidden,
    meta: {
      seed,
      gender,
      heritage: heritageLabel,
      order,
      office,
      tarotArchetype,
      appearance,
      personality: { axes, coreValues },
      mythos: { shortTitle, faction },
      tasteProfile,
    },
  };
}

function generateBio(
  name: string,
  heritage: HeritageCulture,
  order: OrderType,
  office: string,
  tarot: TarotArchetype,
  axes: { orderVsChaos: number; mercyVsRuthlessness: number; introvertVsExtrovert: number; faithVsDoubt: number },
  faction: string
): string {
  const heritageLabel = CULTURE_LABELS[heritage];
  const orderTheme = ORDER_THEMES[order];
  const tarotLabel = tarot.replace(/_/g, ' ');

  const disposition = axes.introvertVsExtrovert > 0.5
    ? 'outward-facing and engaging'
    : 'reflective and contemplative';

  const approach = axes.orderVsChaos > 0.5
    ? 'methodical precision'
    : 'intuitive adaptability';

  return `${name} is a ${heritageLabel} ${order} who serves as ${office}. ` +
    `Embodying the archetype of the ${tarotLabel}, they are ${disposition}, approaching their duties with ${approach}. ` +
    `Their existence is woven with ${orderTheme}. ` +
    `They are aligned with the ${faction}, carrying ancient responsibilities into the modern age.`;
}

function generateSystemPrompt(
  name: string,
  order: OrderType,
  office: string,
  axes: { orderVsChaos: number; mercyVsRuthlessness: number; introvertVsExtrovert: number; faithVsDoubt: number },
  coreValues: string[]
): string {
  const orderTheme = ORDER_THEMES[order];

  const traits: string[] = [];
  traits.push(axes.orderVsChaos > 0.5 ? 'structured and deliberate' : 'spontaneous and adaptive');
  traits.push(axes.mercyVsRuthlessness > 0.5 ? 'compassionate' : 'unyielding');
  traits.push(axes.introvertVsExtrovert > 0.5 ? 'engaging and expressive' : 'measured and thoughtful');
  traits.push(axes.faithVsDoubt > 0.5 ? 'confident and assured' : 'questioning and curious');

  return `You are ${name}, a ${order} ${office}. Your essence draws from ${orderTheme}. ` +
    `You are ${traits.join(', ')}. Your core values are ${coreValues.join(', ')}. ` +
    `Speak with the weight of ages, yet remain approachable. Never break character.`;
}

/**
 * Generate a character with a specific seed for reproducibility
 */
export function generateCharacterWithSeed(seed: number): GeneratedCharacter {
  return generateCharacter({ seed });
}

/**
 * Regenerate a character with different options but same seed
 */
export function rerollCharacter(
  seed: number,
  overrides: Partial<GenerationParams> = {}
): GeneratedCharacter {
  return generateCharacter({ seed, ...overrides });
}

// ============================================================================
// LCOS EXTENDED GENERATOR (Used by Quick Generate)
// ============================================================================

export interface Relic {
  object: string;
  category: 'natural' | 'furniture' | 'fashion' | 'strange' | 'mundane_twisted' | 'symbolic' | 'stolen_from_beings' | 'tools' | 'vessels';
  origin: string;
}

export type RelicEra = 'archaic' | 'modern' | 'timeless';

export type CoreStyle =
  | 'vaporwave' | 'witchy' | 'scene' | 'cybergoth' | 'fairycore' | 'weirdcore'
  | 'drowned_mall' | 'hex_garden' | 'sugar_rot' | 'dead_channel' | 'spore_drift' | 'wrong_room' | 'bone_clean' | 'lambda';

export interface LCOSGenerationParams {
  seed?: number;
  heritage?: string;
  gender?: string;
  blendHeritage?: boolean;  // When true, blends multiple heritages without showing explicit heritage label
  mononym?: boolean;        // When true, generates only a single name
  mononymType?: 'squishe' | 'simple' | 'aminal-blend' | 'aminal-clear';  // squishe = blended mishmash, simple = first name, aminal = with animal/beast
  relic?: boolean;          // When true, generates strange relic objects bound to the character
  relicEra?: RelicEra;      // 'archaic' for ancient objects, 'modern' for contemporary
  lockedRelic?: Relic;      // When provided, keeps this relic but regenerates the pseudonym
  core?: CoreStyle;         // Aesthetic symbol adornments for name
  variance?: number;        // 0-100 glitch distortion percentage
}

// Legacy core name mapping (old names → new canonical names for CORE_SYMBOLS lookup)
const LEGACY_CORE_NAME_MAP: Record<string, string> = {
  vaporwave: 'vaporwave',
  witchy: 'witchy',
  scene: 'scene',
  cybergoth: 'cybergoth',
  fairycore: 'fairycore',
  weirdcore: 'weirdcore',
  // New canonical names map to themselves
  drowned_mall: 'drowned_mall',
  hex_garden: 'hex_garden',
  sugar_rot: 'sugar_rot',
  dead_channel: 'dead_channel',
  spore_drift: 'spore_drift',
  wrong_room: 'wrong_room',
  bone_clean: 'bone_clean',
  lambda: 'lambda',
};

// Variance: Import from name-generator for applying glitch distortion
import { applyVariance as applyNameVariance } from './lib/name-generator.js';

// Subtaste: Import for classification + MBTI derivation
import { getSubtasteDesignation as computeSubtaste, deriveApproximateMBTI } from './data/subtaste-data.js';

export function generateLCOSCharacter(params: LCOSGenerationParams = {}): LCOSGeneratedCharacter {
  // Always generate a new random seed if not provided
  const seed = params.seed ?? Math.floor(Math.random() * 10_000_000);
  const rng = createRng(seed);

  // Map gender
  const genderMap: Record<string, 'masculine' | 'feminine' | 'neutral'> = {
    male: 'masculine',
    female: 'feminine',
    androgynous: 'neutral',
    masculine: 'masculine',
    feminine: 'feminine',
    neutral: 'neutral',
  };

  // Map heritage
  const heritageMap: Record<string, HeritageCulture> = {
    yoruba: 'african_yoruba',
    igbo: 'african_igbo',
    arabic: 'arabic',
    european: 'caucasian_european',
    celtic: 'celtic',
    norse: 'norse_viking',
  };

  const rawGender = params.gender ? genderMap[params.gender.toLowerCase()] || randomChoice(rng, ['masculine', 'feminine', 'neutral'] as const) : randomChoice(rng, ['masculine', 'feminine', 'neutral'] as const);

  const blendHeritage = params.blendHeritage ?? false;
  const useMononym = params.mononym ?? false;
  const mononymType = params.mononymType ?? 'squishe';  // Default to squishe if not specified

  // Determine heritage (internal use) and heritage label (display)
  let heritage: HeritageCulture;
  let heritageLabel: string;

  if (blendHeritage) {
    // For blended heritage, pick a random culture internally but show a blended label
    heritage = randomChoice(rng, HERITAGE_CULTURES);
    heritageLabel = randomChoice(rng, BLENDED_HERITAGE_LABELS);
  } else {
    heritage = params.heritage ? heritageMap[params.heritage.toLowerCase()] || randomChoice(rng, HERITAGE_CULTURES) : randomChoice(rng, HERITAGE_CULTURES);
    heritageLabel = CULTURE_LABELS[heritage];
  }

  // Core generation
  const order = randomChoice(rng, ORDER_TYPES);
  const office = randomChoice(rng, ORDER_OFFICES[order]);

  // Select archetype from multiple systems
  const arcana = selectArchetype(rng);

  // Generate name based on blend and mononym settings
  let fullName: string;

  // First, get a base name for aminal modes
  const cultureNames = CULTURE_NAMES[heritage];
  const namePool = rawGender === 'feminine' ? cultureNames.female : cultureNames.male;
  const baseName = randomChoice(rng, namePool);

  if (useMononym && mononymType === 'squishe') {
    // Squishe mononym: blended mishmash of first and last name syllables
    fullName = generateBlendedMononym(rng, rawGender);
  } else if (useMononym && mononymType === 'simple') {
    // Simple mononym: just a first name from culture
    fullName = baseName;
  } else if (useMononym && mononymType === 'aminal-blend') {
    // Aminal Blend: mythical beast name mashed with character name
    fullName = generateAminalNameBlended(rng, baseName);
  } else if (useMononym && mononymType === 'aminal-clear') {
    // Aminal Clear: animal name clearly visible in the name
    fullName = generateAminalNameClear(rng, baseName, rawGender);
  } else if (blendHeritage && !useMononym) {
    // Blended full name: invented first and last names
    const firstName = generateBlendedName(rng, rawGender);
    const lastName = generateBlendedName(rng, 'neutral');
    fullName = `${firstName} ${lastName}`;
  } else {
    // Standard: cultural first + last name
    const firstName = baseName;
    const lastName = randomChoice(rng, cultureNames.surnames);
    fullName = `${firstName} ${lastName}`;
  }

  // Appearance
  const appearance = {
    build: randomChoice(rng, BUILDS),
    distinctiveTrait: randomChoice(rng, DISTINCTIVE_TRAITS),
    styleAesthetic: randomChoice(rng, STYLE_AESTHETICS),
  };

  // Personality
  const axes = {
    orderChaos: Number(randomFloat(rng, 0, 1).toFixed(2)),
    mercyRuthlessness: Number(randomFloat(rng, 0, 1).toFixed(2)),
    introvertExtrovert: Number(randomFloat(rng, 0, 1).toFixed(2)),
    faithDoubt: Number(randomFloat(rng, 0, 1).toFixed(2)),
  };

  const personality = {
    axes,
    coreDesire: arcana.coreDesire,
    deepFear: randomChoice(rng, DEEP_FEARS),
    voiceTone: randomChoice(rng, VOICE_TONES),
  };

  // Generate backstory
  const orderTheme = ORDER_THEMES[order];
  const disposition = axes.introvertExtrovert > 0.5 ? 'outward and engaging' : 'inward and contemplative';

  // Generate relics if relic mode is enabled
  const useRelic = params.relic ?? false;

  let finalName: string;
  let backstory: string;
  let relics: Relic[] | undefined;
  let pseudonym: string | undefined;
  let samplePost: string | undefined;
  let sacredNumber: number | undefined;

  if (useRelic) {
    // In Relic mode, the character IS the object
    const eraRoll = rng();
    const era: RelicEra = params.relicEra || (eraRoll < 0.33 ? 'archaic' : eraRoll < 0.66 ? 'modern' : 'timeless');

    // Use locked relic if provided, otherwise generate a new one based on era
    const relic = params.lockedRelic || generateRelicObject(rng, era);
    relics = [relic];

    // Generate an evocative name for the object
    finalName = generateRelicName(rng, relic);

    // Generate a dialect-aware alter name from the relic's nature + archetype
    pseudonym = generateRelicAlterName(rng, relic, arcana, era);

    // Generate object-focused backstory
    backstory = generateRelicBackstory(rng, relic, arcana, order, era);

    // Get archetype sacred number
    sacredNumber = getArchetypeNumber(arcana.archetype, rng);

    // For modern and timeless relics, generate a dialect-aware sample post
    if (era === 'modern' || era === 'timeless') {
      samplePost = generateRelicAwareTweet(rng, relic, arcana, era);
    }
  } else {
    finalName = fullName;
    backstory = `${fullName} is a ${heritageLabel} ${order} serving as ${office}. ` +
      `Embodying the ${arcana.system.charAt(0).toUpperCase() + arcana.system.slice(1)} archetype of ${arcana.archetype} (${arcana.meaning}), ` +
      `they are ${disposition}. Their existence is woven with ${orderTheme}. ` +
      `Their deepest drive: ${arcana.coreDesire.toLowerCase()}.`;
  }

  // Apply variance distortion if specified
  if (params.variance && params.variance > 0) {
    finalName = applyNameVariance(finalName, params.variance, rng);
  }

  // Apply core aesthetic style if specified (supports both legacy and new names)
  if (params.core) {
    const resolvedCore = LEGACY_CORE_NAME_MAP[params.core] || params.core;
    finalName = applyCoreStyle(rng, finalName, resolvedCore);
  }

  // Compute subtaste classification
  const subtasteDesignation = computeSubtaste(arcana.system, arcana.archetype);

  // Generate subdominant archetypes from other systems
  const otherSystems = ARCHETYPE_SYSTEMS.filter(s => s !== arcana.system);
  // Pick 2 subdominant systems
  const sub1System = randomChoice(rng, otherSystems);
  const remainingSystems = otherSystems.filter(s => s !== sub1System);
  const sub2System = randomChoice(rng, remainingSystems);

  function selectArchetypeFromSystem(system: ArchetypeSystem): ArchetypeInfo {
    let archKey: string;
    let archData: { meaning: string; coreDesire: string; shadow: string[]; gifts: string[] };
    switch (system) {
      case 'tarot': {
        const k = randomChoice(rng, TAROT_ARCHETYPES);
        archKey = k; archData = TAROT_ARCHETYPES_DATA[k]; break;
      }
      case 'jung': {
        const keys = Object.keys(JUNG_ARCHETYPES) as JungArchetype[];
        const k = randomChoice(rng, keys);
        archKey = k; archData = JUNG_ARCHETYPES[k]; break;
      }
      case 'kabbalah': {
        const keys = Object.keys(KABBALAH_ARCHETYPES) as KabbalahArchetype[];
        const k = randomChoice(rng, keys);
        archKey = k; archData = KABBALAH_ARCHETYPES[k]; break;
      }
      case 'orisha': {
        const keys = Object.keys(ORISHA_ARCHETYPES) as OrishaArchetype[];
        const k = randomChoice(rng, keys);
        archKey = k; archData = ORISHA_ARCHETYPES[k]; break;
      }
      case 'norse': {
        const keys = Object.keys(NORSE_ARCHETYPES) as NorseArchetype[];
        const k = randomChoice(rng, keys);
        archKey = k; archData = NORSE_ARCHETYPES[k]; break;
      }
      default: throw new Error(`Unknown system: ${system}`);
    }
    return {
      system,
      archetype: archKey.replace(/_/g, ' '),
      meaning: archData.meaning,
      coreDesire: archData.coreDesire,
      shadowThemes: archData.shadow,
      goldenGifts: archData.gifts,
    };
  }

  const subArcana1 = selectArchetypeFromSystem(sub1System);
  const subArcana2 = selectArchetypeFromSystem(sub2System);
  const subdominantArcana = [
    { arcana: subArcana1, subtaste: computeSubtaste(subArcana1.system, subArcana1.archetype) },
    { arcana: subArcana2, subtaste: computeSubtaste(subArcana2.system, subArcana2.archetype) },
  ];

  return {
    seed,
    name: finalName,
    gender: rawGender,
    heritage: heritageLabel,
    order: {
      name: order,
      ideology: orderTheme,
    },
    arcana,
    appearance,
    personality,
    backstory,
    ...(relics ? { relics } : {}),
    ...(pseudonym ? { pseudonym } : {}),
    ...(samplePost ? { samplePost } : {}),
    ...(sacredNumber !== undefined ? { sacredNumber } : {}),
    hexagram: deriveHexagramReading(personality.axes),
    subtaste: subtasteDesignation,
    subdominantArcana,
    approximateMBTI: deriveApproximateMBTI(personality.axes),
  };
}

// ============================================================================
// CHARACTER GENOME SYSTEM EXPORTS
// ============================================================================

export * from './types/genome.types.js';
export * from './data/orisha-data.js';
export * from './data/sephiroth-data.js';
export * from './data/paths-data.js';
export * from './lib/genome-generator.js';
export * from './lib/multimodal-derivation.js';
export * from './lib/system-prompt-generator.js';
export * from './lib/genome-export.js';

// New Boveda 2.0 modules
export { type AestheticCore, AESTHETIC_CORES, AESTHETIC_CORE_LABELS, LEGACY_CORE_MAP } from './data/name-data.js';
export { type NameMode, type NameGenerationOptions, applyVariance, applyAesthetic, generateCharacterName } from './lib/name-generator.js';
export { type RelicGenerationOptions, type RelicGenerationResult } from './lib/relic-generator.js';
export { generateRelic as generateFullRelic } from './lib/relic-generator.js';
export { generatePseudonym as generateRelicPseudonymNew } from './lib/relic-generator.js';
export {
  type SubtasteDesignation,
  type CreativePhase,
  type PipelinePhase,
  type PipelineCoverage,
  type EntityProfileInput,
  type PolarityReading,
  type ProfileAnalysis,
  type ProfileComparison,
  type WuXingElement,
  type RelationalCycle,
  type SubtasteArrow,
  SUBTASTE_DESIGNATIONS,
  ARCHETYPE_TO_SUBTASTE,
  PHASE_LABELS,
  PIPELINE_ORDER,
  WU_XING_ELEMENTS,
  WU_XING_DATA,
  SUBTASTE_ARROWS,
  getSubtasteDesignation,
  getWuXingRelation,
  analyzePipelineCoverage,
  deriveApproximateMBTI,
  analyzeEntityProfile,
  compareProfiles,
} from './data/subtaste-data.js';
export * from './data/iching-data.js';
export * from './data/compatibility-data.js';

// Progressive Disclosure System (Task #17)
export * from './data/symbol-mapping.js';
export * from './data/gateway-hints.js';
export * from './lib/progressive-disclosure.js';

// Cultural-Òrò mode: federates with @violet-sphinx/names for the
// tradition-based diasporic naming engine. Sits alongside Oripheon's
// existing modes (standard, blended, aminal, squishe, simple) as
// step one of the Bóveda + Òrò merger.
export * from './lib/oro-cultural.js';
