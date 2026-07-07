/**
 * Poetic forms per lineage.
 *
 * Each lineage carries one or more native poetic shapes the character
 * moves through. Tongue is not just dialect; it is the form the
 * speaker reaches for when they want to say something that matters.
 * Yoruba reaches for oríkì. Persian reaches for ghazal. Japanese
 * reaches for haiku or tanka. Black-Atlantic reaches for freestyle,
 * dub, sound-system call-and-response.
 *
 * Setting modulates the form like a lens. Modern setting + oríkì =
 * high-fashion oríkì where the praise-names are Birkin and the
 * Wilcox and your last sold-out book. Past-life setting + oríkì =
 * cosmic time scale ("the door I knew before there were doors").
 * Mythic setting + ghazal = the radif refrains as if spoken from
 * outside time.
 *
 * Used by realign / forge to inject a "## Poetic form" block so the
 * generated tongue + bio + backstory carry a real lineage-specific
 * shape rather than collapsing into standard English voice.
 */

// Setting register, mirrors realign.ts SETTING_OPTIONS so the lens can
// modulate a chosen form by present-day vs archaic vs past-life vs mythic.
export type Setting = 'modern' | 'mystical' | 'archaic' | 'past_life' | 'mythic' | 'surreal' | 'mixed';

export interface PoeticForm {
  /** Slug for the form (oriki, ghazal, jueju, koan, etc.). */
  id: string;
  /** Display name. */
  label: string;
  /** One-line shape note: how the form is structured. */
  shape: string;
  /** Cadence rule: how it sounds when spoken. */
  cadence: string;
  /** Examples of moves the form makes (NOT phrases to copy, patterns). */
  moves: string[];
}

const ORIKI: PoeticForm = {
  id: 'oriki',
  label: 'oríkì',
  shape: 'praise-naming. The speaker calls the listener by their hidden names: lineage names, deed names, body-part praise, what-you-survived names. Short stacked lines. Each line is a name, not a sentence.',
  cadence: 'declamatory, repetitive, cumulative. The praise stacks. The same construction (you who...) repeats with a new image each time.',
  moves: [
    'You-who-X (where X is a deed, a refusal, a body part, a survived thing)',
    'Mother of X (where X is what you bear)',
    'Owner of X (where X is what you hold)',
    'The X who Y (where X is a creature or element, Y the action that defines them)',
    'Ascending stack of names, each one specific, each one praise even when it sounds like description',
  ],
};

const GHAZAL: PoeticForm = {
  id: 'ghazal',
  label: 'ghazal',
  shape: 'couplets, each one self-contained. A radif (refrain word) returns at the end of every couplet. The speaker addresses an absent beloved (literal or divine). The last couplet often names the speaker.',
  cadence: 'lyrical, longing, repetitive at the line-end. Each couplet is a complete thought. The radif word makes the form audible.',
  moves: [
    'Sustained address to a "you" who is absent',
    'A repeating refrain word that returns each couplet',
    'Image-driven, not narrative',
    'Final couplet self-naming (takhallus)',
    'The longing is unresolved, never landed',
  ],
};

const JUEJU: PoeticForm = {
  id: 'jueju',
  label: 'jueju (truncated verse)',
  shape: 'four lines. Each line a complete picture. The fourth line turns the meaning. Compact, image-heavy, no abstraction.',
  cadence: 'spare, paratactic. No connective tissue between lines. Each line stands.',
  moves: [
    'Open with a setting image (mountain, river, frost, lamp)',
    'Build a second image that reflects the first',
    'Introduce a small human action or absence',
    'Turn the meaning on the fourth line',
    'Leave the reader inside the image, not the conclusion',
  ],
};

const HAIKU_TANKA: PoeticForm = {
  id: 'haiku_tanka',
  label: 'haiku / tanka',
  shape: 'three lines (haiku) or five lines (tanka). Seasonal word (kigo) anchors the moment. A cutting word (kireji) breaks the line and pivots. No metaphor. The image is the meaning.',
  cadence: 'breath-paced, clean. A pause between the second and third image where the meaning lives.',
  moves: [
    'Open with a season-anchor (cherry, persimmon, frost, cicada)',
    'A small precise observation',
    'A pivot or cut that opens the meaning sideways',
    'Tanka extends with two more lines: the speaker enters the image',
    'No abstraction. No declared emotion. The thing seen is the feeling.',
  ],
};

const PROVERB_CHAIN: PoeticForm = {
  id: 'proverb_chain',
  label: 'proverb-chain (Igbo / Akan style)',
  shape: 'speech threaded with proverbs. The speaker reaches for a proverb to make a point, then immediately layers a second proverb on top. Conversation moves by aphorism, not argument.',
  cadence: 'oratorical, layered, indirect. The point is approached sideways.',
  moves: [
    'Drop a proverb where another speaker would assert',
    'Follow with a counter-proverb that bends the first',
    'Refuse the direct sentence; the indirect carries the weight',
    'Quote elders or ancestors as the source of authority',
    'End on an aphorism that seems to settle, but actually opens',
  ],
};

const FREESTYLE_DUB: PoeticForm = {
  id: 'freestyle_dub',
  label: 'freestyle / dub / sound-system',
  shape: 'over a beat or against a heartbeat-pulse. Internal rhyme dense. Code-switches mid-bar. Punchlines stack double-meanings; the second meaning lands a bar later.',
  cadence: 'rhythmic, breath-pocketed, density-forward. Multi-syllabic rhymes. The pause before the punch is the punch.',
  moves: [
    'Rhyme inside the bar, not just at the end',
    'Code-switch in the middle of a line',
    'Stack double meanings; one for the casual ear, one for the close listener',
    'Drop in a name (a specific person, a brand, a track) to anchor the bar',
    'Use call-and-response or echo to widen the moment',
    'Refuse the explanation; the punchline does the work',
  ],
};

const KOAN: PoeticForm = {
  id: 'koan',
  label: 'koan',
  shape: 'a question or scene that breaks logic. The point is the break. The speaker offers the koan as gift, not riddle.',
  cadence: 'plain, low, paced. Long pauses. The voice does not push.',
  moves: [
    'Offer a small everyday image (the cup, the bell, the dog)',
    'Place a question that cannot be answered with logic',
    'Refuse to resolve. The unresolution is the teaching.',
    'Use silence and gesture as much as words',
    'When the listener tries to explain, gently turn the explanation back',
  ],
};

const PSALMIC: PoeticForm = {
  id: 'psalmic',
  label: 'psalmic / lamentation',
  shape: 'address to a higher (or absent) listener. Couplet parallelism: the second line reframes the first. Praise and grief are the same gesture.',
  cadence: 'cantillated, breath-driven. The voice rises and falls in pairs.',
  moves: [
    'Address by name or epithet',
    'Couplet parallelism: line two restates line one with a turn',
    'Move freely between praise, complaint, and request',
    'Quote the absent listener back at themselves',
    'End on a vow or a stilled refusal',
  ],
};

const ZIKR: PoeticForm = {
  id: 'zikr',
  label: 'zikr / mantra fragment',
  shape: 'a phrase the speaker returns to. The phrase is not explained. It punctuates speech the way breath punctuates breath. Often in the lineage tongue, never translated.',
  cadence: 'cyclic, breath-paced. The phrase comes back at uneven intervals.',
  moves: [
    'Drop a single phrase from the lineage liturgy mid-paragraph',
    'Do not translate it',
    'Let it return three or four times across a longer passage',
    'When asked what it means, refuse the gloss',
  ],
};

const SPOKEN_WORD: PoeticForm = {
  id: 'spoken_word',
  label: 'spoken-word / slam',
  shape: 'argument-as-rhythm. Each line is a beat, each stanza is a turn. The speaker performs themselves into existence on the stage. Personal and political braid.',
  cadence: 'percussive, building, breaking. Crescendos. Drops. Repetition with variation.',
  moves: [
    'Open with a hook: a refusal, a confession, a name',
    'Build through repetition with variation',
    'Use second person to make the audience the listener-as-witness',
    'Drop a one-line truth-bomb that resets the rhythm',
    'Close on a refrain that returns from the open',
  ],
};

const WAKA_DAYO: PoeticForm = {
  id: 'waka_dayo',
  label: 'wákà / dayọ̀ (Yoruba-Islamic praise-song)',
  shape: 'long-form sung praise that weaves Quranic register with Yoruba praise-naming. The form moves between supplication and declaration.',
  cadence: 'chanted, melismatic, antiphonal.',
  moves: [
    'Open with bismillah-style invocation in Yoruba register',
    'Stack praise-names of the subject',
    'Quote the elders in their own register',
    'Return to refrain at irregular intervals',
  ],
};

const VAJRA_DOHA: PoeticForm = {
  id: 'vajra_doha',
  label: 'doha (Vajrayana spontaneous song)',
  shape: 'spontaneous song-of-realisation. The speaker addresses a student, a deity, or no-one. Imagery from the body, the elements, and the bardo.',
  cadence: 'freely metered, lifted. Bardo-imagery dense.',
  moves: [
    'Open by acknowledging the impermanence of the moment',
    'Use body-and-element imagery (wind, channel, drop, mirror)',
    'Refuse linear narrative; the meaning is positional',
    'End in a stilling, not a conclusion',
  ],
};

/**
 * Per-lineage poetic form bank. Each lineage gets one or more native
 * forms. The picker chooses one based on character setting / brief.
 */
export const LINEAGE_POETIC_FORMS: Record<string, PoeticForm[]> = {
  yoruba: [ORIKI, WAKA_DAYO, FREESTYLE_DUB],
  igbo: [PROVERB_CHAIN, FREESTYLE_DUB, ORIKI],
  hausa: [WAKA_DAYO, PROVERB_CHAIN, GHAZAL],
  akan: [PROVERB_CHAIN, FREESTYLE_DUB, ORIKI],
  vodun: [ORIKI, PSALMIC, FREESTYLE_DUB],
  haitian: [ORIKI, FREESTYLE_DUB, PSALMIC, ZIKR],
  cuban: [ORIKI, FREESTYLE_DUB, PSALMIC],
  black_atlantic: [FREESTYLE_DUB, ORIKI, SPOKEN_WORD, PSALMIC],
  black_american: [FREESTYLE_DUB, SPOKEN_WORD, PSALMIC, PROVERB_CHAIN],
  black_british: [FREESTYLE_DUB, SPOKEN_WORD, ORIKI],
  hindu: [GHAZAL, JUEJU, PROVERB_CHAIN, ZIKR],
  daoist: [JUEJU, KOAN, ZIKR],
  hebraic: [PSALMIC, ZIKR, SPOKEN_WORD],
  japanese: [HAIKU_TANKA, KOAN, JUEJU],
  korean: [JUEJU, ZIKR, SPOKEN_WORD],
  tibetan: [VAJRA_DOHA, KOAN, ZIKR],
  javanese: [WAKA_DAYO, KOAN, PROVERB_CHAIN],
};

/**
 * Pick one poetic form for a character given their lineage(s) and
 * setting. Sets a deterministic-ish seed via Math.random so each
 * forge call gets a fresh form and the cohort doesn't converge on
 * one form per lineage.
 */
export function pickPoeticForm(lineageIds: string[], _setting?: Setting): PoeticForm | null {
  const candidates: PoeticForm[] = [];
  for (const lid of lineageIds) {
    const bank = LINEAGE_POETIC_FORMS[lid];
    if (bank) candidates.push(...bank);
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Setting acts as a lens that modulates the chosen form. Returns a
 * one-line directive for how the form should be inflected by the
 * setting register.
 */
export function settingFormLens(form: PoeticForm, setting?: Setting): string {
  switch (setting) {
    case 'modern':
      return `MODERN LENS on ${form.label}: keep the form's shape and cadence; pull the imagery from present-day specifics. The praise-name is a Birkin or a sold-out drop. The proverb is a group-chat aphorism. The ghazal radif is an Instagram caption that returns. Concrete contemporary references replace classical ones. The form stays; the references move.`;
    case 'archaic':
      return `ARCHAIC LENS on ${form.label}: pull the imagery from pre-modern register. Court life, monastery, marketplace, the lineage liturgy. No contemporary references.`;
    case 'past_life':
      return `PAST-LIFE LENS on ${form.label}: cosmic time scale. "I knew this stranger ten thousand years before there were doors." The form moves through cosmic recurrence. Specific, but the time is geological.`;
    case 'mythic':
      return `MYTHIC LENS on ${form.label}: high register. Named only by archetype (the Mother, the Threshold, the One Who Returns). Out-of-time. Each line carries weight beyond the personal.`;
    case 'mystical':
      return `MYSTICAL LENS on ${form.label}: ritual register. Altars, ancestors, divinatory practice. The form is shaped by who it addresses (lwa, orisha, ancestor) and what is offered.`;
    case 'surreal':
      return `SURREAL LENS on ${form.label}: dream-logic. Images do not need to cohere. The form holds the cohesion the content refuses.`;
    default:
      return `Carry the form's native cadence. Do not translate it into standard English narrative voice.`;
  }
}

/** Build the prompt block to inject. */
export function buildPoeticFormBlock(
  lineageIds: string[],
  setting?: Setting,
): { block: string; form: PoeticForm } | null {
  const form = pickPoeticForm(lineageIds, setting);
  if (!form) return null;
  const lensLine = settingFormLens(form, setting);
  const block = [
    '## Poetic form',
    `This character moves through **${form.label}** when their tongue carries weight.`,
    `Shape: ${form.shape}`,
    `Cadence: ${form.cadence}`,
    `Native moves the form makes (use these as patterns, NOT phrases to copy):`,
    ...form.moves.map((m) => `  · ${m}`),
    '',
    lensLine,
    '',
    'When generating bio + backstory + tongue: the character should sound like someone who reaches for this form. The dialect, the idioms, the cadence of their inner monologue all carry it. Do not name the form by its label in the bio (oríkì, ghazal, jueju, etc. should not appear); the form lives in the cadence, not in the description.',
  ].join('\n');
  return { block, form };
}
