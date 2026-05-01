/**
 * Cultural lineage catalogue for the aligned character generator.
 *
 * Lineages are explicit and curated (not arbitrary "any African
 * culture") so generation respects the protocol. Each lineage
 * carries naming notes, register hints, and a one-line cultural
 * frame so Claude generates aligned material rather than
 * stereotype-mash.
 *
 * Add to this list deliberately. Cultural-advisor signoff
 * required for sacred-tradition entries before they ship to
 * public surfaces.
 */

export interface Lineage {
  id: string;
  label: string;
  region: string;
  namingNotes: string;
  registerNotes: string;
  culturalFrame: string;
  /** Whether this lineage requires cultural-advisor gating before
   *  use on public-facing cubes. Sacred traditions = true. */
  advisorGated: boolean;
}

export const LINEAGES: Record<string, Lineage> = {
  yoruba: {
    id: 'yoruba',
    label: 'Yoruba',
    region: 'West Africa · Nigeria + diaspora',
    namingNotes:
      'Names carry meaning and circumstance (oríkì lineage poetry). Names like Ade-, Olu-, Adé- prefixes; honour prefixes Babá- (father), Mama-. Day-of-week and birth-circumstance names exist (Babatunde = "father returns").',
    registerNotes:
      'Cadence carries lineage. Praise-poetry rhythm. Direct address to elders. Code-switch between Yoruba terms and English is natural. Avoid pidginising what isn\'t pidgin.',
    culturalFrame:
      'Cosmology of three realms (Orun, Ayé, the unborn). Òrìṣà are real in the everyday. Ancestors speak. Names have power. Generation prefixes the name.',
    advisorGated: true,
  },
  igbo: {
    id: 'igbo',
    label: 'Igbo',
    region: 'West Africa · Nigeria + diaspora',
    namingNotes:
      'Theophoric names (Chi- prefix = personal god): Chinyere, Chioma, Chukwu-. Day-of-market names (Eke, Orie, Afọ, Nkwọ). Surnames often clan-based.',
    registerNotes:
      'Aphoristic. Proverbs and parables in conversation. "I tell you" framing. Direct, sometimes blunt. Code-switch with English carries class signal.',
    culturalFrame:
      'Republican village social structure. Ọfọ na ogu (truth and innocence). Ancestor veneration. Chi (personal spirit / guardian).',
    advisorGated: false,
  },
  akan: {
    id: 'akan',
    label: 'Akan',
    region: 'West Africa · Ghana, Côte d\'Ivoire',
    namingNotes:
      'Day-name (Kofi, Ama, Kwame, Akua). Lineage matrilineal (Abusua). Title names: Nana-, Opoku-, Asantehene.',
    registerNotes:
      'Story-shape matters; Ananse spider tales as conversational form. Indirection by design. Honour for elders embedded in syntax.',
    culturalFrame:
      'Sankofa (return to fetch what was lost). Ananse trickster epistemology. Adinkra symbolic system. Chieftaincy + matrilineal structure.',
    advisorGated: false,
  },
  mande: {
    id: 'mande',
    label: 'Mande · Sundiata lineage',
    region: 'West Africa · Mali, Guinea, Senegal',
    namingNotes:
      'Surnames carry clan history (Keita, Traoré, Touré, Kouyaté = griot lineage). First names often Arabic-Islamic in modern context.',
    registerNotes:
      'Griot-shaped narration. Lineage cited at greeting. Praise-singing as form. Long-winded honour speech is correct, not excess.',
    culturalFrame:
      'Sundiata epic as foundational text. Empire memory (Mali, Songhai). Griot caste as keepers of history. Iron and word as power.',
    advisorGated: false,
  },
  maroon: {
    id: 'maroon',
    label: 'Maroon · Caribbean / South American',
    region: 'Jamaica, Suriname, Brazil, Hispaniola',
    namingNotes:
      'Names from rebellion-era ancestors (Nanny, Cudjoe, Quao). African retention via day-names + reclaimed Akan / Yoruba. New names taken at flight.',
    registerNotes:
      'Voice of refusal. Patois and creole as primary. Pidgin English sits underneath. Direct refusal of plantation register; bush-language is correct.',
    culturalFrame:
      'Maroon is *flight to refuse*: communities formed in the bush by escapees holding their own sovereignty. Obeah practice, drum-talk, retained African ritual.',
    advisorGated: false,
  },
  vodou: {
    id: 'vodou',
    label: 'Haitian Vodou',
    region: 'Haiti + diaspora',
    namingNotes:
      'Christian-name surface (Marie-, Jean-, Louis-) over Lwa-rooted spiritual identity. Spiritual names (sèvitè, mambo, oungan) given at initiation.',
    registerNotes:
      'Kreyòl primary. Spiritual register layered with everyday. Direct address to lwa. Songs (chante) as daily speech-form.',
    culturalFrame:
      'Lwa (Rada cool, Petwo hot, Ghede crossroads). Mèt Kalfou at the crossroads. Asson and djèvo. Communal possession as truth-telling.',
    advisorGated: true,
  },
  lucumi: {
    id: 'lucumi',
    label: 'Lucumí · Afro-Cuban',
    region: 'Cuba + Cuban diaspora',
    namingNotes:
      'Spanish surface names with Yoruba-rooted spiritual names (Eléggua, Yemayá, Oshún) given at kariocha initiation.',
    registerNotes:
      'Spanish primary, Lucumí ritual language layered. Bóveda (the altar) as spiritual centre. Code-switch is constant.',
    culturalFrame:
      'Yoruba religion preserved + transformed in Cuba. Bóveda altar practice. Ifá divination. Egún (ancestor) primacy. Olodumare as supreme.',
    advisorGated: true,
  },
  igbo_diaspora: {
    id: 'igbo_diaspora',
    label: 'Igbo · diaspora · African American',
    region: 'African American (Igbo descent traceable)',
    namingNotes:
      'African American naming (creative, generational). Family-name carrying. Sometimes reclaimed Igbo names in cultural awakening contexts.',
    registerNotes:
      'AAVE primary. Hip-hop register, jazz cadence, blues weight. Code-switch is fluency, not failure.',
    culturalFrame:
      'Survival as substrate. Spiritual blend (Black church + retained African). Nervous-condition inheritance. Refusal as form.',
    advisorGated: false,
  },
  hindu: {
    id: 'hindu',
    label: 'Hindu · Indian subcontinent',
    region: 'India + diaspora',
    namingNotes:
      'Sanskrit-rooted names. Caste / regional variation. Surname signals region or jati. Theophoric (Krishna-, Rama-, Devi-).',
    registerNotes:
      'Polite formal register layers. English code-switch (Hinglish) common in modern context. Honorifics (-ji) embedded.',
    culturalFrame:
      'Cyclical cosmology (kalpa). Karma + dharma. Mahabharata + Ramayana as foundational. Bhakti devotional traditions. Caste tensions present in any modern frame.',
    advisorGated: false,
  },
  daoist: {
    id: 'daoist',
    label: 'Daoist · Chinese',
    region: 'China + Chinese diaspora',
    namingNotes:
      'Surname-first (one or two character family name + given name). Generational name patterns within family. Names carry hopes (Hong "broad", Mei "beautiful").',
    registerNotes:
      'Indirection valued. Wu wei (non-forcing) as conversational mode. Classical reference common in formal speech.',
    culturalFrame:
      'Wu Xing five phases. Wuji-Taiji unfolding. Daoist non-action. Confucian filial structure as social substrate. Ancestors honoured.',
    advisorGated: false,
  },
  norse: {
    id: 'norse',
    label: 'Norse',
    region: 'Scandinavia + Old Norse-rooted diaspora',
    namingNotes:
      'Patronymic / matronymic suffixes (-son, -dóttir). Names from gods (Thor-, Frey-, Odin-). Compound meaning names (Ragnar = "warrior counsel").',
    registerNotes:
      'Direct, kenning-rich. Boasting as form. Saga-shape narration. Cold understatement.',
    culturalFrame:
      'Nine worlds. Ragnarok inevitability. Honour culture. Eddic poetry. Skald tradition.',
    advisorGated: false,
  },
  celtic: {
    id: 'celtic',
    label: 'Celtic',
    region: 'Ireland, Scotland, Wales, Brittany',
    namingNotes:
      'Patronymic (Mac-, O\'-, ap-). Saint-names. Gaelic / Welsh / Breton spelling carries regional weight.',
    registerNotes:
      'Lyric cadence. Triadic phrasing. Indirect address. Bardic shape.',
    culturalFrame:
      'Triple-goddess motifs. Otherworld (Tír na nÓg) adjacent. Bardic memory. Druidic remnants. Cailleach winter-weight.',
    advisorGated: false,
  },
  hebraic: {
    id: 'hebraic',
    label: 'Hebraic',
    region: 'Israel + Jewish diaspora',
    namingNotes:
      'Theophoric (-el, -yah, -iel suffixes). Family names from origin towns / occupations. Hebrew + diaspora-language layering.',
    registerNotes:
      'Argumentative warmth. Question-answer dialectic. Yiddish / Ladino code-switch by tradition.',
    culturalFrame:
      'Covenant. Exodus pattern. Lineage (begats). Diaspora as condition. Talmud as living conversation.',
    advisorGated: false,
  },
  greek: {
    id: 'greek',
    label: 'Greek',
    region: 'Greece + Greek diaspora',
    namingNotes:
      'Saint-day naming. Patronymic ending (-poulos, -ides, -akis). Compound meaning names.',
    registerNotes:
      'Tragic register sits beneath comic. Hospitality (xenia) as social substrate. Argumentative warmth.',
    culturalFrame:
      'Olympian + Orthodox layered. Tragic structure. Symposium as cultural form. Kismet / fate.',
    advisorGated: false,
  },
};

export function listLineages(): Array<Pick<Lineage, 'id' | 'label' | 'region' | 'advisorGated'>> {
  return Object.values(LINEAGES).map((l) => ({
    id: l.id,
    label: l.label,
    region: l.region,
    advisorGated: l.advisorGated,
  }));
}

export function lineageContext(id: string | null | undefined): string {
  if (!id) return '';
  const l = LINEAGES[id];
  if (!l) return '';
  return [
    `## Lineage anchor: ${l.label} (${l.region})`,
    `Cultural frame: ${l.culturalFrame}`,
    `Naming: ${l.namingNotes}`,
    `Register: ${l.registerNotes}`,
    l.advisorGated
      ? 'NOTE: This lineage carries sacred elements. Generate with reverence. Avoid claiming authority over ritual specifics. Reference traditions, do not perform them.'
      : '',
  ]
    .filter(Boolean)
    .join('\n');
}
