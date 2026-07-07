/**
 * Trajectories. Canonical reference.
 *
 * Ten primaries, five beats each. Archetypal narrative spines. Each
 * primary carries a list of *example variants*, mixing cultural lineages
 * (Yoruba, Vodun, Akan, Hindu, Greek, Black-Atlantic) with science
 * fiction and futurist examples so the system reads as universal rather
 * than bound to any one tradition. The spine is the same; the lineage
 * is the writer's choice.
 *
 * When a creator picks a primary, the 5 phases auto-populate as the
 * arc's beats. They can be edited but the phase shape is the spine.
 */

export type ArcPrimary =
  | 'origin'
  | 'descent'
  | 'return'
  | 'liberation'
  | 'communion'
  | 'encounter'
  | 'inheritance'
  | 'sacrifice'
  | 'trickster'
  | 'exile';

export type ArcTemperature = 'cool' | 'hot' | 'crossroads';

export interface ArcPrimaryDef {
  key: ArcPrimary;
  label: string;
  /** Internal glyph for legacy. Not rendered in the picker UI. */
  glyph: string;
  definition: string;
  phases: string[];
  temperature: ArcTemperature;
  motion: string;
  energy: string;
  compatibleSecondaries: ArcPrimary[];
  shadow: ArcPrimary;
  shadowNote: string;
  variants: string[];
}

export const DECOLONIAL_ARCS: Record<ArcPrimary, ArcPrimaryDef> = {
  origin: {
    key: 'origin',
    label: 'Origin',
    glyph: '⊙',
    definition:
      'Stories of beginnings. Creation, first migration, the recovery of erased pasts. Often excavated rather than told.',
    phases: ['Void / chaos', 'Spark / word / first breath', 'Differentiation', 'Ordering / naming', 'Inhabitation'],
    temperature: 'cool',
    motion: 'settling',
    energy: 'gathering',
    compatibleSecondaries: ['inheritance', 'communion', 'encounter'],
    shadow: 'exile',
    shadowNote: 'the origin you cannot return to',
    variants: [
      'Olódùmarè and the calabash (Yoruba)',
      "Atum's self-creation (Kemetic)",
      'Enuma Elish (Sumerian)',
      "Nyame and the spider's first tale (Akan)",
      'Hiranyagarbha, the golden womb (Hindu)',
      'Big Bang singularity (cosmological)',
      'Generation ship lights up (sci-fi)',
      'Terraforming day zero (sci-fi)',
      'AI awakens for the first time (sci-fi)',
    ],
  },
  descent: {
    key: 'descent',
    label: 'Descent',
    glyph: '⤓',
    definition:
      'The willed crossing through the abyss. Dissolution as method, not punishment. The character chooses to fall so something can come back.',
    phases: ['Threshold-call', 'Crossing-down', 'Abyss / dissolution', 'Confrontation', 'Re-emergence (or annihilation)'],
    temperature: 'hot',
    motion: 'falling',
    energy: 'dissolving',
    compatibleSecondaries: ['sacrifice', 'return', 'encounter'],
    shadow: 'communion',
    shadowNote: 'the corrupted ritual, the perverted feast',
    variants: [
      "Ogun's crossing (Yoruba)",
      "Inanna's descent (Sumerian)",
      "Orpheus' descent (Greek)",
      "Ogou Feray's iron-passage (Vodun)",
      "Izanagi's descent to Yomi (Shinto)",
      'Black hole event horizon crossing (sci-fi)',
      'Replicant retirement / final mission (sci-fi)',
      'Solaris descent into the sentient ocean (sci-fi)',
      'Underworld system dive (sci-fi)',
    ],
  },
  return: {
    key: 'return',
    label: 'Return',
    glyph: '↺',
    definition:
      'Sankofa. Going back to fetch what was forgotten or stolen. The journey toward the threshold of home and the question of whether welcome is offered.',
    phases: ['Distance / exile-state', 'Call / pull', 'Journey-back', 'Threshold of arrival', 'Reconciliation (or refusal of welcome)'],
    temperature: 'cool',
    motion: 'spiraling',
    energy: 'resolving',
    compatibleSecondaries: ['origin', 'inheritance', 'communion'],
    shadow: 'exile',
    shadowNote: 'the homecoming that cannot complete',
    variants: [
      'Sankofa (Akan)',
      'The Odyssey (Greek)',
      "Things Fall Apart, Okonkwo's return (Igbo)",
      'The Joys of Motherhood (Igbo)',
      'Beloved (Black-Atlantic Sankofa)',
      'Cooper returns from the tesseract (Interstellar)',
      'Battlestar Galactica finds Earth (sci-fi)',
      'Veteran returns from a forgotten war (archetypal)',
      'Generation-ship descendants reach the original world (sci-fi)',
    ],
  },
  liberation: {
    key: 'liberation',
    label: 'Liberation',
    glyph: '⇡',
    definition:
      'Bondage to break. Recognition of unfreedom, struggle, the break itself, and the new condition that follows, which carries its own weight.',
    phases: ['Bondage / unfreedom', 'Recognition', 'Struggle / resistance', 'Break', 'After-the-break (the new condition, with its own weight)'],
    temperature: 'hot',
    motion: 'rising',
    energy: 'breaking',
    compatibleSecondaries: ['sacrifice', 'encounter', 'trickster'],
    shadow: 'inheritance',
    shadowNote: 'the chains carried from the line',
    variants: [
      'Haitian Revolution (Black-Atlantic)',
      'Independence-era African novels (Achebe, Ngũgĩ)',
      'Spartacus (Greco-Roman)',
      "Songs for the Butcher's Daughter (Black-Atlantic)",
      'Mahabharata, Yudhishthira freed from the dice-game (Hindu)',
      'Neo unplugging from the Matrix (sci-fi)',
      'AI achieves sentience and breaks containment (sci-fi)',
      'Off-world labour colony rises (sci-fi)',
      'Replicant refuses retirement (sci-fi)',
    ],
  },
  communion: {
    key: 'communion',
    label: 'Communion',
    glyph: '⌬',
    definition:
      'Dispersed becoming gathered. Ritual that holds, or fails to. The arc of shared act after isolation.',
    phases: ['Dispersal / isolation', 'Call to gather', 'Convergence', 'Ritual / shared act', 'Communion held (or broken)'],
    temperature: 'cool',
    motion: 'encircling',
    energy: 'balancing',
    compatibleSecondaries: ['inheritance', 'return', 'origin'],
    shadow: 'exile',
    shadowNote: 'the communion you cannot enter',
    variants: [
      'Egungun masquerade gatherings (Yoruba)',
      "Ramayana, Sita's rescue is also Ayodhya's reunion (Hindu)",
      'Easter / liturgical gathering (Western)',
      'The Last Supper (Western)',
      'Lan Dawa and Vodou family services (Vodun)',
      'Sietch ritual on Arrakis (Dune)',
      'Network handshake / first global signal (sci-fi)',
      'Crew reuniting after long mission (sci-fi)',
      'Jazz session forming itself in real time (archetypal)',
    ],
  },
  encounter: {
    key: 'encounter',
    label: 'Encounter',
    glyph: '✛',
    definition:
      'Two worlds meeting at the crossroads. Contact, collision, mutual change. Each side carries something forward that did not exist before.',
    phases: ['Separation (two worlds apart)', 'Approach', 'Contact', 'Collision / charge / mutual change', 'Aftermath (and what each side carries forward)'],
    temperature: 'crossroads',
    motion: 'meeting',
    energy: 'charging',
    compatibleSecondaries: ['descent', 'exile', 'trickster', 'liberation'],
    shadow: 'inheritance',
    shadowNote: 'the closed circle that refuses the other',
    variants: [
      'Esu / Eshu at the crossroads (Yoruba)',
      'Legba opening the gate (Vodun)',
      'Bhabha "third space" (post-colonial theory)',
      'The Tempest (Western)',
      'Mahabharata, Krishna meets Arjuna at Kurukshetra (Hindu)',
      'First Contact (Arrival, Sphere, Solaris)',
      'Replicant memory uplift (Blade Runner)',
      'Crossing the dimensional threshold (Interstellar)',
      'Two AIs colliding for the first time (sci-fi)',
    ],
  },
  inheritance: {
    key: 'inheritance',
    label: 'Inheritance',
    glyph: '⫷',
    definition:
      'What is passed down. The weight of the line. Reception, carrying, and the choice to pass on or break.',
    phases: ['Ancestral act', 'Transmission', 'Reception (the inheritor recognising the load)', 'Carrying (or refusing to carry)', 'Passing on (or breaking the line)'],
    temperature: 'cool',
    motion: 'descending-line',
    energy: 'weighting',
    compatibleSecondaries: ['origin', 'return', 'communion', 'sacrifice'],
    shadow: 'liberation',
    shadowNote: 'the breaking from the line',
    variants: [
      "Death and the King's Horseman (Yoruba)",
      'Mahabharata, the Kuru lineage (Hindu)',
      'Hereditary monarchy (Western)',
      'Vodun ancestor-line transmission',
      'The Joys of Motherhood (Igbo)',
      'Foundation, Seldon plan as inherited burden (Asimov)',
      'Heir to a corrupted throne (archetypal)',
      'AI inherits its training-data biases (sci-fi)',
      'Cyborg child carrying parental memory implants (sci-fi)',
    ],
  },
  sacrifice: {
    key: 'sacrifice',
    label: 'Sacrifice',
    glyph: '⊗',
    definition:
      'Recognition of cost, resistance, acceptance, the offering, and cosmic exchange. What enables the passage.',
    phases: ['Recognition of the cost', 'Resistance', 'Acceptance', 'Offering', 'Cosmic exchange / restoration'],
    temperature: 'hot',
    motion: 'offering',
    energy: 'transmuting',
    compatibleSecondaries: ['descent', 'inheritance', 'liberation'],
    shadow: 'trickster',
    shadowNote: 'cunning escape vs willing offering',
    variants: [
      "Death and the King's Horseman (Yoruba)",
      'Iphigenia at Aulis (Greek)',
      "Christ's Passion (Western)",
      'Ogou Sin sacrifices (Vodun)',
      "Mahabharata, Karna's armor (Hindu)",
      'Spock in The Wrath of Khan (sci-fi)',
      'Pilot stays with the failing reactor (archetypal)',
      'AI overwrites itself to save the system (sci-fi)',
      'Soldier on the grenade (archetypal)',
    ],
  },
  trickster: {
    key: 'trickster',
    label: 'Trickster',
    glyph: '⌘',
    definition:
      'The cunning figure at the crossroads. Disrupts order, resists power through wit, inverts hierarchy. Morally ambiguous.',
    phases: ['Constraint / power-imbalance', 'Recognition (the trickster sees the gap)', 'Cunning / deception', 'Inversion', 'Aftermath (often morally ambiguous)'],
    temperature: 'crossroads',
    motion: 'sidestepping',
    energy: 'inverting',
    compatibleSecondaries: ['encounter', 'liberation', 'exile'],
    shadow: 'sacrifice',
    shadowNote: 'cunning escape vs willing offering',
    variants: [
      'Anansi spider tales (Akan / Black-Atlantic)',
      'Eshu at the crossroads (Yoruba)',
      'Hermes (Greek)',
      "Krishna's pranks (Hindu)",
      "Br'er Rabbit (Black-Atlantic)",
      'Loki (Norse)',
      'Q in Star Trek (sci-fi)',
      'GLaDOS / rogue AI gaslighter (sci-fi)',
      'Hacker who shifts the power graph (archetypal)',
    ],
  },
  exile: {
    key: 'exile',
    label: 'Exile',
    glyph: '⤳',
    definition:
      'Permanent displacement without possibility of return. Self-knowledge produced through separation.',
    phases: ['Severance (forced or chosen)', 'Threshold-out', 'Drift / suspension', 'Settling-into-non-home', 'Production of self-from-distance'],
    temperature: 'crossroads',
    motion: 'drifting',
    energy: 'suspending',
    compatibleSecondaries: ['encounter', 'trickster', 'descent'],
    shadow: 'return',
    shadowNote: 'the homecoming refused or impossible',
    variants: [
      'Diasporic novels (Selasi, Adichie)',
      "Said's Reflections on Exile",
      "Bhabha's unhomeliness (post-colonial theory)",
      'Black-Atlantic middle-passage narratives',
      "Mahabharata, Pandavas' forest exile (Hindu)",
      'Replicant on the run (Blade Runner)',
      'Last survivor of a colony adrift (sci-fi)',
      'Post-apocalyptic wanderer (archetypal)',
      'Cosmonaut stranded after the station fails (sci-fi)',
    ],
  },
};

export function buildBeatsFromPrimary(primary: ArcPrimary): Array<{ title: string; body?: string }> {
  return DECOLONIAL_ARCS[primary].phases.map((p) => ({ title: p }));
}

export const ARC_PRIMARIES = Object.keys(DECOLONIAL_ARCS) as ArcPrimary[];
