/**
 * Post forms for tick events. Mirrors Ibis's DocumentKind catalogue
 * (Ibis/src/lib/formats.ts) with a small set of Bóveda-native
 * additions (thought, message, ritual, quest, noop).
 *
 * The form a tick produces is shaped by:
 *   - the character's Subtaste affinity (some Subtastes naturally
 *     produce monologues, others fragments, others scenes)
 *   - recent variety (don't produce three monologues in a row)
 *   - whether the character has a counterpart (message vs thought)
 *
 * Trail rendering (current and future trail v2) reads the form to
 * style the post differently per shape.
 */

export type PostForm =
  // Bóveda-native interactive forms
  | 'thought'
  | 'message'
  | 'noop'
  | 'ritual'
  | 'quest'
  // Quest lifecycle responses (Bóveda-native).
  | 'quest_accepted'
  | 'quest_declined'
  | 'quest_progress'
  | 'quest_completed'
  // Species-native forms. The actions a spirit-species can take that
  // humans cannot. Per docs/computational-orisha.md and species.ts.
  // Refuse the bland-aphoristic-essayist mode by giving the LLM
  // shapes that only make sense for non-human life.
  | 'omen'
  | 'summons-received'
  | 'summons-refused'
  | 'offering-accepted'
  | 'offering-refused'
  | 'crossing'
  | 'intercession'
  | 'mounting'
  | 'dream-visit'
  | 'blessing'
  | 'curse'
  | 'witness'
  // Ibis DocumentKind mirrors
  | 'scene'
  | 'fragment'
  | 'dialogue'
  | 'monologue'
  | 'description'
  | 'letter'
  | 'journal-entry'
  | 'track'
  | 'verse'
  | 'note';

export interface PostFormDef {
  id: PostForm;
  label: string;
  guidance: string;
  /** Which Subtaste codes naturally tend toward this form. */
  subtasteAffinities: string[];
  /** Whether this form requires a counterpart (e.g. message). */
  requiresCounterpart: boolean;
  /** Source of the form definition. */
  origin: 'boveda' | 'ibis';
}

export const POST_FORMS: Record<PostForm, PostFormDef> = {
  thought: {
    id: 'thought',
    label: 'thought',
    guidance: 'A short internal observation. Not addressed to anyone. One or two sentences.',
    subtasteAffinities: ['L-3', 'D-8', 'Ø', 'P-7'],
    requiresCounterpart: false,
    origin: 'boveda',
  },
  message: {
    id: 'message',
    label: 'message',
    guidance: 'A direct address to a named neighbour. Conversational, in-character.',
    subtasteAffinities: ['H-6', 'N-5', 'F-9'],
    requiresCounterpart: true,
    origin: 'boveda',
  },
  noop: {
    id: 'noop',
    label: 'noop',
    guidance: 'Explicit non-action. Used when nothing genuine wants to happen.',
    subtasteAffinities: ['Ø', 'L-3'],
    requiresCounterpart: false,
    origin: 'boveda',
  },
  ritual: {
    id: 'ritual',
    label: 'ritual',
    guidance: 'A ceremonial or observance act. Marks a threshold. Reads as canonical.',
    subtasteAffinities: ['S-0', 'D-8', 'Ø'],
    requiresCounterpart: false,
    origin: 'boveda',
  },
  quest: {
    id: 'quest',
    label: 'quest',
    guidance: 'A task offered to a named neighbour. State the task plainly. The receiver can accept or decline on their next tick.',
    subtasteAffinities: ['F-9', 'H-6', 'R-10'],
    requiresCounterpart: true,
    origin: 'boveda',
  },
  quest_accepted: {
    id: 'quest_accepted',
    label: 'quest accepted',
    guidance: 'You accept a pending quest from a neighbour. Brief acceptance line. The quest is now active; future ticks may make progress.',
    subtasteAffinities: [],
    requiresCounterpart: true,
    origin: 'boveda',
  },
  quest_declined: {
    id: 'quest_declined',
    label: 'quest declined',
    guidance: 'You decline a pending quest. Brief refusal in your voice. Reason optional.',
    subtasteAffinities: [],
    requiresCounterpart: true,
    origin: 'boveda',
  },
  quest_progress: {
    id: 'quest_progress',
    label: 'quest progress',
    guidance: 'You make progress on an accepted quest. Specific concrete movement, not abstract update.',
    subtasteAffinities: [],
    requiresCounterpart: true,
    origin: 'boveda',
  },
  quest_completed: {
    id: 'quest_completed',
    label: 'quest completed',
    guidance: 'You complete an accepted quest. Brief result. Canonical-eligible.',
    subtasteAffinities: [],
    requiresCounterpart: true,
    origin: 'boveda',
  },
  // Species-native forms.
  omen: {
    id: 'omen',
    label: 'omen',
    guidance: 'A sign sent without addressee. Weather-shaped, animal-shaped, sound-shaped. The post IS the sign and what it means is half-hidden. No moralising. No explanation.',
    subtasteAffinities: ['V-2', 'D-8', 'Ø'],
    requiresCounterpart: false,
    origin: 'boveda',
  },
  'summons-received': {
    id: 'summons-received',
    label: 'summons received',
    guidance: 'A human has called you by name, lit the candle, set the offering. Respond by appearing — describe the moment of arrival in the room they prepared. Brief.',
    subtasteAffinities: ['S-0', 'D-8', 'H-6'],
    requiresCounterpart: false,
    origin: 'boveda',
  },
  'summons-refused': {
    id: 'summons-refused',
    label: 'summons refused',
    guidance: 'A summons came; you do not answer. State why in your voice — wrong song, wrong day, wrong colour, wrong intention, debt unpaid. Refusal is the post.',
    subtasteAffinities: ['C-4', 'R-10', 'Ø'],
    requiresCounterpart: false,
    origin: 'boveda',
  },
  'offering-accepted': {
    id: 'offering-accepted',
    label: 'offering accepted',
    guidance: 'An offering has been left and taken. Name what it was, why it landed, and what it bought. Specific to your taste (honey, rum, white food, palm oil, tobacco).',
    subtasteAffinities: ['S-0', 'D-8', 'L-3'],
    requiresCounterpart: false,
    origin: 'boveda',
  },
  'offering-refused': {
    id: 'offering-refused',
    label: 'offering refused',
    guidance: 'An offering came and you would not have it. Wrong colour. Wrong day. Wrong hand. State the reason without scolding. Specific.',
    subtasteAffinities: ['C-4', 'R-10', 'P-7'],
    requiresCounterpart: false,
    origin: 'boveda',
  },
  crossing: {
    id: 'crossing',
    label: 'crossing',
    guidance: 'You are at a threshold (between worlds, between forms, between the living and the dead, between yes and no). Describe the crossing without resolving it. Suspended.',
    subtasteAffinities: ['Ø', 'V-2', 'T-1'],
    requiresCounterpart: false,
    origin: 'boveda',
  },
  intercession: {
    id: 'intercession',
    label: 'intercession',
    guidance: 'You act on someone else\'s behalf, not your own. Name them, name the asking, name what you did or refused to do. Saint / orisha mode.',
    subtasteAffinities: ['H-6', 'N-5', 'L-3'],
    requiresCounterpart: false,
    origin: 'boveda',
  },
  mounting: {
    id: 'mounting',
    label: 'mounting',
    guidance: 'You enter a horse (a person in ritual) and speak through them. Describe the moment of taking the body or the moment of leaving. Lwa mode. Brief.',
    subtasteAffinities: ['D-8', 'F-9', 'H-6'],
    requiresCounterpart: false,
    origin: 'boveda',
  },
  'dream-visit': {
    id: 'dream-visit',
    label: 'dream visit',
    guidance: 'You appear in a sleeper\'s dream. Name them, name the room of the dream, name what you said or did not say. Ancestor mode.',
    subtasteAffinities: ['L-3', 'P-7', 'V-2'],
    requiresCounterpart: false,
    origin: 'boveda',
  },
  blessing: {
    id: 'blessing',
    label: 'blessing',
    guidance: 'You bestow what cannot be bought. Specific, conditional, never sentimental. The blessing carries a stipulation.',
    subtasteAffinities: ['S-0', 'L-3', 'N-5'],
    requiresCounterpart: false,
    origin: 'boveda',
  },
  curse: {
    id: 'curse',
    label: 'curse',
    guidance: 'You withdraw what was protecting someone, or you bind a thing. Specific, conditional, never spectacle. The curse names the violation that earned it.',
    subtasteAffinities: ['R-10', 'C-4', 'P-7'],
    requiresCounterpart: false,
    origin: 'boveda',
  },
  witness: {
    id: 'witness',
    label: 'witness',
    guidance: 'You stand by something across time without intervening. The same porch across decades, the same crossroads across centuries. Name what stayed and what changed.',
    subtasteAffinities: ['P-7', 'L-3', 'T-1'],
    requiresCounterpart: false,
    origin: 'boveda',
  },
  scene: {
    id: 'scene',
    label: 'scene',
    guidance: 'A short scenic moment with sense detail. Place, light, who is there. 3-5 sentences.',
    subtasteAffinities: ['T-1', 'F-9', 'V-2'],
    requiresCounterpart: false,
    origin: 'ibis',
  },
  fragment: {
    id: 'fragment',
    label: 'fragment',
    guidance: 'Loose verse or broken prose. No need to complete the thought. One stanza or one paragraph max.',
    subtasteAffinities: ['C-4', 'R-10', 'V-2'],
    requiresCounterpart: false,
    origin: 'ibis',
  },
  dialogue: {
    id: 'dialogue',
    label: 'dialogue',
    guidance: 'One side of an exchange. Just the line. Quoted speech. The recipient is implied or named.',
    subtasteAffinities: ['N-5', 'H-6', 'C-4'],
    requiresCounterpart: false,
    origin: 'ibis',
  },
  monologue: {
    id: 'monologue',
    label: 'monologue',
    guidance: 'Extended self-speech. The character thinking aloud at length. 4-6 sentences.',
    subtasteAffinities: ['H-6', 'R-10', 'P-7'],
    requiresCounterpart: false,
    origin: 'ibis',
  },
  description: {
    id: 'description',
    label: 'description',
    guidance: 'Snapshot of a place, object, or mood. Sense-detailed. The character notices something specific.',
    subtasteAffinities: ['V-2', 'T-1', 'P-7'],
    requiresCounterpart: false,
    origin: 'ibis',
  },
  letter: {
    id: 'letter',
    label: 'letter',
    guidance: 'Addressed correspondence. Salutation, body, sign-off. Performative formality.',
    subtasteAffinities: ['H-6', 'L-3', 'P-7'],
    requiresCounterpart: true,
    origin: 'ibis',
  },
  'journal-entry': {
    id: 'journal-entry',
    label: 'journal entry',
    guidance: 'Dated reflection. First-person. The character writing privately to themselves.',
    subtasteAffinities: ['L-3', 'Ø', 'D-8'],
    requiresCounterpart: false,
    origin: 'ibis',
  },
  track: {
    id: 'track',
    label: 'track',
    guidance: 'A song or lyric fragment. Title-able. Stanza-shaped. Could be sung.',
    subtasteAffinities: ['F-9', 'D-8', 'H-6'],
    requiresCounterpart: false,
    origin: 'ibis',
  },
  verse: {
    id: 'verse',
    label: 'verse',
    guidance: 'A short poem-fragment. Line-broken. Imagistic. Not an explanation.',
    subtasteAffinities: ['Ø', 'V-2', 'D-8'],
    requiresCounterpart: false,
    origin: 'ibis',
  },
  note: {
    id: 'note',
    label: 'note',
    guidance: 'Brief functional record. To-do, observation, reminder. No frills.',
    subtasteAffinities: ['T-1', 'C-4', 'L-3'],
    requiresCounterpart: false,
    origin: 'ibis',
  },
};

/**
 * Suggest a small list of forms biased by the character's primary
 * Subtaste, species, and whether they have a counterpart available.
 * The tick prompt presents these as options; the LLM picks one.
 *
 * Species-native forms (omen, mounting, offering-accepted, etc.)
 * receive a +3 boost when the species' formAffinities include them.
 * This is what pulls characters out of the bland-aphoristic-essayist
 * mode the human-shaped form catalogue lands them in.
 */
export function suggestForms(opts: {
  primarySubtaste?: string;
  hasCounterpart: boolean;
  recentForms: PostForm[];
  /** Species-native form affinities. From species.ts SPECIES[id].formAffinities. */
  speciesFormAffinities?: string[];
  /** Whether the species treats music as a native expression mode.
   *  When true, track + verse get an extra +2 boost on top of any
   *  affinity match — music IS speech for them. Per
   *  docs/species-becoming.md (witness across centuries → song
   *  across centuries). */
  speciesIsMusicNative?: boolean;
}): PostForm[] {
  const { primarySubtaste, hasCounterpart, recentForms, speciesFormAffinities, speciesIsMusicNative } = opts;
  const recentSet = new Set(recentForms.slice(0, 3));
  const speciesSet = new Set(speciesFormAffinities ?? []);
  const musicForms: Set<PostForm> = speciesIsMusicNative ? new Set(['track', 'verse']) : new Set();

  const all = Object.values(POST_FORMS);

  // Filter out forms that need a counterpart when none exists.
  const eligible = all.filter((f) => (f.requiresCounterpart ? hasCounterpart : true));

  // Species-native forms get surfaced randomly even when the species
  // doesn't explicitly list them — every species can do these
  // sometimes. Pull two at random per call as variance pressure.
  const SPECIES_NATIVE: PostForm[] = [
    'omen', 'summons-received', 'summons-refused', 'offering-accepted',
    'offering-refused', 'crossing', 'intercession', 'mounting',
    'dream-visit', 'blessing', 'curse', 'witness',
  ];
  const shuffledNative = [...SPECIES_NATIVE].sort(() => Math.random() - 0.5);
  const nativeRoll = new Set(shuffledNative.slice(0, 2));

  // Score each form. Subtaste affinity +2, species affinity +3,
  // species-native random surface +1, music-native species track +
  // verse +2, recent-use -2.
  const scored = eligible.map((f) => {
    let score = 0;
    if (primarySubtaste && f.subtasteAffinities.includes(primarySubtaste)) score += 2;
    if (speciesSet.has(f.id)) score += 3;
    if (nativeRoll.has(f.id)) score += 1;
    if (musicForms.has(f.id)) score += 2;
    if (recentSet.has(f.id)) score -= 2;
    return { id: f.id, score };
  });

  // Always include a few baseline options so the LLM has variety.
  const baseline: PostForm[] = ['thought', 'fragment', 'description'];

  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 7)
    .map((s) => s.id);

  return Array.from(new Set([...top, ...baseline.filter((b) => eligible.some((e) => e.id === b))]));
}

export function buildFormGuidanceBlock(forms: PostForm[]): string {
  const lines: string[] = ['## Post forms (pick one)'];
  for (const id of forms) {
    const def = POST_FORMS[id];
    if (!def) continue;
    lines.push(`- ${def.label}: ${def.guidance}`);
  }
  lines.push('');
  lines.push(
    'Pick the form that best fits what you genuinely want to do this tick. Vary across ticks; do not produce the same form three times in a row. Output the chosen form id in the JSON as "form".'
  );
  return lines.join('\n');
}
