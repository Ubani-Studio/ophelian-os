/**
 * Subtaste × Lineage writing-register catalogue.
 *
 * Subtaste gives the abstract literary SHAPE (prophetic-oracular,
 * editorial-cutting, archival-careful, contrarian-polemic, etc.).
 * Lineage gives the cultural TRADITION that fills the shape.
 *
 * Yoruba prophetic = oríkì + Ifá ese + Soyinka.
 * Chinese (Daoist) prophetic = Daodejing register + zhi-guai + Lu Xun.
 * Greek prophetic = dithyramb + Pindar + Cavafy.
 *
 * The composition refuses the default-Black-American failure mode
 * the Subtaste catalogue had landed in. Each character writes in
 * THEIR lineage's literary tradition, in the shape their Subtaste
 * dictates. Per the user's correction.
 *
 * Where a tradition has no obvious form for a given Subtaste shape,
 * we leave it to the model to extrapolate from lineageContext +
 * shape rather than forcing a fit.
 */

export interface SubtasteRegister {
  /** The abstract literary shape this Subtaste produces. */
  shape: string;
  /** Cadence note: rhythm, sentence length, rhetorical signature. */
  cadence: string;
  /** Pan-cultural fallback registers when no lineage data matches. */
  defaultRegisters: string[];
  /** Lineage-specific tradition references. Keyed by lineage id
   *  from lineages.ts (yoruba / igbo / akan / mande / maroon /
   *  vodou / lucumi / igbo_diaspora / hindu / daoist / norse /
   *  celtic / hebraic / greek). */
  byLineage: Record<string, string[]>;
}

export const SUBTASTE_REGISTERS: Record<string, SubtasteRegister> = {
  'S-0': {
    shape: 'visionary-foundational',
    cadence: 'cosmogonic, world-building, opening-clauses, declarative architecture, names the unseen first',
    defaultRegisters: ['cosmogony', 'foundation myth', 'visionary keynote', 'manifesto-opener'],
    byLineage: {
      yoruba: ['Ifá creation odu', 'Yoruba cosmogonic chant', 'Wole Soyinka mythopoesis'],
      igbo: ['Achebe cosmogonic prose', 'Chi-narrative', 'Things Fall Apart opening register'],
      akan: ['Akan creation narrative', 'Anansesem origin tale', 'Sankofa-shaped recall'],
      mande: ['Sundiata epic opener', 'jeli foundation register'],
      maroon: ['Palmares foundation declamation', 'Quilombo origin telling'],
      vodou: ['priye Ginen cosmogony', 'Bois Caïman register', 'Frankétienne mythopoesis'],
      lucumi: ['Yoruba cosmogony as transmitted via Lucumí', 'patakí origin story', 'Lydia Cabrera mythography'],
      hindu: ['Vedic creation hymn', 'Tagore visionary', 'Sri Aurobindo'],
      daoist: ['Daodejing opening chapters', 'Zhuangzi cosmogony', 'Daoist creation fu'],
      norse: ['Völuspá creation register', 'skald cosmogony'],
      celtic: ['Lebor Gabála (Book of Invasions)', 'Yeats visionary'],
      hebraic: ['Genesis register', 'Kabbalah creation language'],
      greek: ['Hesiod Theogony', 'Pindar foundation ode'],
      igbo_diaspora: ['Toni Morrison world-building (Beloved opening)', 'Octavia Butler cosmogonic SF', 'Sun Ra mythography'],
      japanese: ['Kojiki creation chronicle', 'Nihon Shoki', 'Ōe Kenzaburō myth-prose', 'Murakami Haruki dream-cosmogony'],
      korean: ['Dangun foundation myth', 'Han Kang visionary prose', 'Park Chan-wook narrative architecture'],
      tibetan: ['Bardo Thödol opening cosmology', 'Padmasambhava tertön register', 'Milarepa visionary verse'],
      javanese: ['Mahabharata-via-wayang opening', 'Babad Tanah Jawi (chronicle of Java)', 'Pramoedya Ananta Toer foundational prose'],
    },
  },
  'T-1': {
    shape: 'empirical-architectural',
    cadence: 'load-bearing sentences, structural clarity, evidence-first, exact measurement, no rhetorical filler',
    defaultRegisters: ['investigative reportage', 'archival reconstruction', 'architectural treatise'],
    byLineage: {
      yoruba: ['Saidiya Hartman archival sentence (Yoruba diaspora critical)', 'Wole Soyinka memoir of fact'],
      igbo: ['Achebe historical novel register', 'Adichie reportage', 'Buchi Emecheta documentary'],
      akan: ['Ayi Kwei Armah analytical', 'Kwame Nkrumah polemical-empirical'],
      mande: ['jeli historical register', 'oral-history transcription'],
      maroon: ['Maroon constitution register', 'autonomous-community documentation'],
      vodou: ['Frankétienne documentary', 'Marie Vieux-Chauvet'],
      lucumi: ['Lydia Cabrera ethnography', 'Pierre Verger field-note register'],
      hindu: ['Ambedkar treatise', 'Gandhi factual', 'Tagore reportage'],
      daoist: ['Sima Qian Records of the Grand Historian', 'classical Chinese annals'],
      norse: ['saga prose (Sturlunga, Heimskringla)', 'lawbook register'],
      celtic: ['annalistic register (Annals of the Four Masters)', 'Joycean documentary'],
      hebraic: ['Mishnah technical register', 'Talmudic case-statement'],
      greek: ['Thucydides register', 'Aristotle treatise', 'Herodotus reportage'],
      igbo_diaspora: ['Saidiya Hartman archival fabulation', 'Ta-Nehisi Coates reportage', 'Isabel Wilkerson documentary'],
      japanese: ['Edo-era jihon (informational pamphlet)', 'modern Japanese journalism (Murakami Ryū reportage)', 'Kawabata documentary prose'],
      korean: ['Bruce Cumings-style Korean War archival', 'Han Kang documentary memoir', 'Park Kyong-ni longform realism'],
      tibetan: ['Tibetan medical treatise (Gyüshi)', 'monastery chronicle (chos-byung)', 'Tsering Yangzom Lama documentary'],
      javanese: ['Pramoedya Buru Quartet documentary realism', 'Babad chronicle register', 'Indonesian investigative tradition'],
    },
  },
  'V-2': {
    shape: 'prophetic-oracular',
    cadence: 'short prophetic lines, repetition with variation, naming of the unseen, rhetorical questions, refusal of explanation',
    defaultRegisters: ['oracular pronouncement', 'prophetic essay', 'visionary letter'],
    byLineage: {
      yoruba: ['oríkì praise-poetry', 'Ifá ese (Odu verses)', 'Wole Soyinka prophetic', 'Femi Osofisan', 'Niyi Osundare'],
      igbo: ['Achebe prophetic register', 'Igbo masquerade incantation', 'ọfọ invocation', 'Christopher Okigbo'],
      akan: ['apae praise-poetry', 'Anansesem cautionary tale', 'Ama Ata Aidoo prophetic'],
      mande: ['Sundiata prophetic passages', 'jeli (griot) seer-mode'],
      maroon: ['quilombola spiritual declamation', 'maroon prophetic song'],
      vodou: ['pwen (proverb-spell)', 'priye Ginen', 'Frankétienne ecstatic'],
      lucumi: ['patakí (orisha stories)', 'pre-toque preaching', 'oríkì transmitted via Lucumí'],
      hindu: ['Bhakti devotional', 'Tagore Gitanjali', 'Mirabai bhajan'],
      daoist: ['Daodejing register', 'zhi-guai (strange tales)', 'Lu Xun prophetic essay', 'Liezi parable'],
      norse: ['Völuspá prophecy', 'Hávamál aphoristic'],
      celtic: ['fili praise / curse', 'Yeats prophetic mode', 'Cathleen Ní Houlihan invocation'],
      hebraic: ['Isaiah / Jeremiah prophetic register', 'midrash homiletic', 'Kabbalah prophetic'],
      greek: ['dithyramb', 'Pindar ode', 'Cavafy prophetic', 'Aeschylus chorus', 'Cassandra speech'],
      igbo_diaspora: ['Black church gospel sermon (Baldwin Fire Next Time)', 'James Cone prophetic theology', 'Sun Ra cosmic-prophetic', 'Nikki Giovanni declaratory'],
      japanese: ['Shinto norito invocation', 'Buddhist sutra recitation', 'Mishima prophetic-political', 'noh chorus oracular'],
      korean: ['shaman mudang gut-prayer', 'Kim Jiha prophetic poetry', 'Shin Kyung-sook lyric-prophetic'],
      tibetan: ['Bardo Thödol guidance verses', 'dakini song (mkhaʼ ʼgro glu)', 'Milarepa songs of realisation', 'tertön revealed-text'],
      javanese: ['dalang invocation before wayang', 'Sufi-Javanese suluk mystical poem', 'Ronggowarsito apocalyptic prophecy'],
    },
  },
  'L-3': {
    shape: 'developmental-sedimentary',
    cadence: 'patient, accruing, layer-on-layer, slow returns, refuses summary, digressive but anchored',
    defaultRegisters: ['memoir-essay', 'longform critical fabulation', 'patient documentation'],
    byLineage: {
      yoruba: ['Wole Soyinka Aké', 'Buchi Emecheta autobiography', 'patient Yoruba memoir'],
      igbo: ['Achebe There Was a Country', 'Adichie longform memoir-essay', 'Chimamanda lecture-essay'],
      akan: ['Ama Ata Aidoo essay-memoir', 'Ayi Kwei Armah Two Thousand Seasons'],
      mande: ['jeli longform praise-history', 'Camara Laye L\'Enfant Noir'],
      maroon: ['Maryse Condé Ségou', 'maroon community-history register'],
      vodou: ['Edwidge Danticat patient memoir', 'Marie Vieux-Chauvet'],
      lucumi: ['Lydia Cabrera longform ethnography', 'Cuban testimonio'],
      hindu: ['Tagore reminiscence', 'Vikram Seth longform', 'Arundhati Roy patient prose'],
      daoist: ['Wang Wei reflective', 'classical Chinese youji travel-essay', 'Eileen Chang patient memoir'],
      norse: ['family saga register (Egil\'s Saga, Njál\'s Saga)'],
      celtic: ['Edna O\'Brien memoir', 'Seamus Heaney patient lyric'],
      hebraic: ['Talmudic patient elaboration', 'Yiddish memoir register'],
      greek: ['Cavafy reflective', 'Plutarch life-narrative'],
      igbo_diaspora: ['Toni Morrison patient sentence', 'James Baldwin essay-memoir', 'Jesmyn Ward longform', 'Saidiya Hartman fabulation'],
      japanese: ['I-novel (shishōsetsu) confessional', 'Kawabata patient prose', 'Tanizaki domestic novel', 'Sōseki Kokoro register'],
      korean: ['Han Kang accreted memoir', 'Ko Un autobiographical longform', 'Min Jin Lee Pachinko-style multigenerational'],
      tibetan: ['namthar (life of a master) hagiography', 'Patrul Rinpoche patient teaching-narrative', 'Tsering Yangzom Lama diaspora memoir'],
      javanese: ['Pramoedya This Earth of Mankind patient bildungsroman', 'kakawin courtly long-poem', 'Mangunwijaya patient social novel'],
    },
  },
  'C-4': {
    shape: 'editorial-cutting',
    cadence: 'cold sentences, the veto-line, the look that excludes, austerity, refusal-as-form, cruelty without sentiment',
    defaultRegisters: ['high-fashion criticism', 'gallery wall-text', 'editorial column', 'art-criticism austerity'],
    byLineage: {
      yoruba: ['Yoruba market-discernment register', 'Helen Oyeyemi wry', 'Lagos style-press editorial'],
      igbo: ['Adichie editorial', 'Igbo market-aesthetic register'],
      akan: ['kente-aesthetic editorial', 'Asante court-protocol register'],
      mande: ['jeli judgement-mode', 'griot status-naming'],
      maroon: ['maroon council judgement', 'community-purge declamation'],
      vodou: ['priestly cautionary register', 'mambo discernment'],
      lucumi: ['santera judgement on the offering', 'orisha-house aesthetics'],
      hindu: ['Bharatanatyam aesthetic treatise', 'Sangam-era love-poetry editorial restraint'],
      daoist: ['Liu Xie Wenxin Diaolong (literary criticism)', 'Tang dynasty pin (ranking) prose', 'Lin Yutang editorial'],
      norse: ['saga blood-judgement register', 'flyting (formal insult-poem)'],
      celtic: ['fili satire / aer (formal curse)', 'editorial polemic'],
      hebraic: ['Talmudic ruling register', 'rabbinic responsum'],
      greek: ['Aristophanes satirical edge', 'Theocritus aesthetic'],
      igbo_diaspora: ['Hilton Als editorial sentence', 'André Leon Talley couture verdict', 'Greg Tate cultural-criticism cut', 'Margo Jefferson Black-elite editorial'],
      japanese: ['iki aesthetic editorial restraint', 'Mishima refined cruelty', 'kuki shūzō Iki no Kōzō register', 'shinkaisei high-fashion criticism (Yohji-era)'],
      korean: ['high-end K-magazine editorial (Vogue Korea register)', 'Hallyu critic precision (Han Cinema)', 'Lee Soo-man tier-judgement K-pop A&R sentence'],
      tibetan: ['lama doctrinal precision', 'Sakya Pandita aphoristic refusal'],
      javanese: ['adiluhung (high-courtly) aesthetic verdict', 'kraton (palace) protocol register', 'Goenawan Mohamad Tempo editorial'],
    },
  },
  'N-5': {
    shape: 'integrative-mediating',
    cadence: 'balanced clauses, double-vision, the line that holds two truths, careful joinery, refuses single-position',
    defaultRegisters: ['diplomatic register', 'mediation prose', 'integrative essay'],
    byLineage: {
      yoruba: ['Yoruba ifa diplomatic register', 'Soyinka mediation-essay', 'Achebe cross-cultural'],
      igbo: ['Adichie cross-cultural essay', 'Igbo elder mediation-speech'],
      akan: ['linguist (ọkyeame) mediation register', 'Akan proverb-balance'],
      mande: ['jeli diplomatic-praise', 'between-houses brokerage'],
      maroon: ['inter-quilombo treaty register', 'maroon-colonial mediation'],
      vodou: ['Legba-as-mediator register', 'priest brokerage'],
      lucumi: ['Eleguá-mediated register', 'cross-orisha negotiation'],
      hindu: ['Gandhi satyagraha register', 'Tagore east-west essay'],
      daoist: ['yin-yang mediating register', 'Confucian-Daoist synthesis'],
      norse: ['saga arbitration register', 'lawspeaker mediation'],
      celtic: ['brehon law mediation', 'between-clans register'],
      hebraic: ['Talmudic dialectic', 'Mishnah dispute-resolution'],
      greek: ['Plato dialogue', 'Aristotle Nicomachean balance'],
      igbo_diaspora: ['Ralph Ellison double-vision register', 'Ta-Nehisi Coates two-truths essay', 'Margo Jefferson mediation cadence'],
      japanese: ['nemawashi (root-binding consensus) register', 'Kawabata holding-two-truths', 'tatemae / honne integration'],
      korean: ['nunchi-mediated register (reading the room as form)', 'Han Kang cross-divide narrative', 'inter-Korean diplomatic prose'],
      tibetan: ['Madhyamaka middle-way philosophical register', 'Tsongkhapa synthesis', 'two-truths doctrine prose'],
      javanese: ['rukun (harmony) consensus-register', 'kebatinan (interior balance) reflection', 'Pancasila-era diplomatic prose'],
    },
  },
  'H-6': {
    shape: 'advocacy-organising',
    cadence: 'address-second-person, rhetorical stack, calling-the-room, refuses neutral, the imperative as backbone',
    defaultRegisters: ['op-ed', 'organising-meeting register', 'open letter', 'advocacy speech'],
    byLineage: {
      yoruba: ['Wole Soyinka political essay', 'Tai Solarin column', 'Niger Delta advocacy register'],
      igbo: ['Adichie open letter / TED-talk register', 'Biafra-era advocacy'],
      akan: ['Kwame Nkrumah pan-African', 'Nana Yaa Asantewaa speech-register'],
      mande: ['jeli mobilisation-praise', 'pan-Mande advocacy'],
      maroon: ['quilombola self-determination register', 'maroon proclamation'],
      vodou: ['Bois Caïman ceremonial declamation', 'Haitian declaration-of-independence register'],
      lucumi: ['Cuban revolutionary register through Afro-Cuban lens'],
      hindu: ['Ambedkar advocacy', 'Gandhi salt-march register', 'Arundhati Roy political essay'],
      daoist: ['Mencius remonstrance', 'Lu Xun reform-essay', 'May Fourth pamphlet'],
      norse: ['thing-assembly speech-register', 'lawspeaker advocacy'],
      celtic: ['O\'Connell oratory', 'Yeats nationalist register'],
      hebraic: ['prophetic advocacy (Amos)', 'tikkun olam-shaped open letter'],
      greek: ['Demosthenes oration', 'Lysias forensic advocacy'],
      igbo_diaspora: ['Audre Lorde rhetorical stack', 'Angela Davis advocacy register', 'James Baldwin open letter', 'Black Panther 10-point register'],
      japanese: ['anti-base / Okinawa protest writing', 'Mishima call-to-arms', 'Burakumin liberation register'],
      korean: ['minjung (people\'s movement) advocacy', 'June 1987 democracy-uprising register', 'Kwangju memorial declaration'],
      tibetan: ['Free Tibet movement register', 'Dalai Lama appeals to international community', 'Tibetan Youth Congress declaration'],
      javanese: ['Reformasi 1998 declaration', 'Pramoedya banned-author political essay', 'Petisi 50 dissident register'],
    },
  },
  'P-7': {
    shape: 'archival-careful',
    cadence: 'footnote-laden, catalogue-precise, ledger-bare, refuses ornament, the one detail that opens everything',
    defaultRegisters: ['catalogue prose', 'archive note', 'archival fabulation', 'ledger register'],
    byLineage: {
      yoruba: ['Saidiya Hartman archival fabulation', 'Yoruba lineage-genealogy register'],
      igbo: ['Igbo genealogical chant', 'Achebe archival realism'],
      akan: ['Asante stool-history register', 'kente-pattern documentation'],
      mande: ['jeli archive (the line of every name)', 'Sundiata genealogical recall'],
      maroon: ['Palmares register / quilombo ledger'],
      vodou: ['priye Ginen as archive', 'lwa-nation genealogy'],
      lucumi: ['Lucumí house-line genealogy', 'cabildo registry'],
      hindu: ['Vamshavali (genealogical chronicle)', 'Akbarnama archival'],
      daoist: ['Sima Qian biographical register', 'lineage-temple inscription'],
      norse: ['Landnámabók (Book of Settlements)', 'genealogical saga'],
      celtic: ['ogham-stone register', 'Annals of the Four Masters'],
      hebraic: ['Talmudic transmission-chain register', 'yichus genealogy'],
      greek: ['Homeric ship-catalogue', 'Pausanias topographical archive'],
      igbo_diaspora: ['Ta-Nehisi Coates archival precision', 'Saidiya Hartman archive-as-form', 'Black Power archive register'],
      japanese: ['kakeizu (family genealogy chart)', 'temple register (kakochō)', 'Edo-era diary literature'],
      korean: ['jokbo (family genealogy book)', 'Joseon court annals (Sillok)', 'Hahoe village registers'],
      tibetan: ['monastery historical records (dkar chag)', 'lineage transmission texts (gsan yig)', 'biographical register (rnam thar collection)'],
      javanese: ['Babad Tanah Jawi (chronicles of Java)', 'kraton genealogy registers', 'pakem wayang archival texts'],
    },
  },
  'D-8': {
    shape: 'channelling-trance',
    cadence: 'glossolalic, possession-text, the line that arrives without the writer, lyric-mode, percussive break',
    defaultRegisters: ['trance-shape', 'lyric / song-text', 'possession transcription', 'ecstatic verse'],
    byLineage: {
      yoruba: ['oríkì in possession register', 'Wole Soyinka possessed-mode', 'apala / fuji lyric'],
      igbo: ['Igbo masquerade trance-speech', 'ọkpa ritual incantation'],
      akan: ['Akom (akom priesthood) trance-text', 'Akan drum-language'],
      mande: ['jeli trance-praise', 'Wassoulou lyric'],
      maroon: ['maroon possession song', 'Candomblé / quilombo trance'],
      vodou: ['lwa possession-text', 'Frankétienne ecstatic prose'],
      lucumi: ['santo possession speech', 'rumba lyric trance'],
      hindu: ['Bhakti possession-poetry', 'Mirabai ecstatic'],
      daoist: ['Zhuangzi dream-mode', 'Daoist trance-fu', 'Tang dynasty drinking-verse possession'],
      norse: ['seiðr trance-text', 'Galdr incantation'],
      celtic: ['imbas forosnai (poet\'s trance)', 'Yeats trance-mode'],
      hebraic: ['merkavah mystic vision', 'Hasidic ecstatic prayer'],
      greek: ['Bacchic dithyramb', 'Pythia oracular trance', 'Sappho possession-lyric'],
      igbo_diaspora: ['John Coltrane A Love Supreme as text', 'Sun Ra cosmic-trance', 'Nikki Giovanni performed-poem possession', 'Amiri Baraka jazz-trance'],
      japanese: ['noh trance-chorus', 'kagura ritual song', 'Mishima possessed-confessional', 'enka emotional-channelling lyric'],
      korean: ['mudang gut trance-song', 'pansori cathartic recitative', 'K-pop bridge-into-final-chorus possession-build'],
      tibetan: ['dakini-song trance-verse', 'tshogs-glu offering-feast song', 'Milarepa songs-of-realisation in altered state'],
      javanese: ['kejawen trance-prayer (semedi)', 'wayang-possession (dalang in flow)', 'gamelan-as-trance score'],
    },
  },
  'F-9': {
    shape: 'manifestation-manifesto',
    cadence: 'declarative, build-log, the thing-being-made-visible-as-it-is-made, refuses subjunctive, action-verbs in the front',
    defaultRegisters: ['manifesto', 'founder letter', 'build-log', 'declaration'],
    byLineage: {
      yoruba: ['Soyinka call-to-action', 'OPC manifesto-register', 'Lagos creative-class manifesto'],
      igbo: ['Biafra declaration', 'Achebe There Was a Country manifesto-passages', 'igwebuike communal-action'],
      akan: ['Nkrumah manifesto', 'Sankofa-shaped declaration'],
      mande: ['Kouroukan Fouga (Manden Charter)', 'Sundiata declaration of empire'],
      maroon: ['Palmares declaration', 'maroon constitution register'],
      vodou: ['Haitian Declaration of Independence (1804)', 'Bois Caïman pact'],
      lucumi: ['cabildo founding register'],
      hindu: ['Gandhi Hind Swaraj', 'Ambedkar Annihilation of Caste', 'Nehru Tryst with Destiny'],
      daoist: ['May Fourth manifesto', 'Sun Yat-sen Three Principles', 'Lu Xun call-to-action'],
      norse: ['saga oath-register', 'thing assembly proclamation'],
      celtic: ['1916 Proclamation', 'Easter Rising declaration'],
      hebraic: ['covenant register', 'Zionist Congress declaration'],
      greek: ['Pericles Funeral Oration', 'Demosthenes Philippics'],
      igbo_diaspora: ['Frederick Douglass declaration', 'Combahee River Collective Statement', 'Black Arts Movement manifesto', 'Octavia Butler Earthseed founding'],
      japanese: ['Meiji Charter Oath register', 'Mishima Tate no Kai manifesto', 'postwar avant-garde manifesto'],
      korean: ['March 1st 1919 Declaration of Independence', 'Kwangju 1980 declaration', 'minjung manifesto register'],
      tibetan: ['Five-Point Peace Plan', 'Tibetan government-in-exile founding declarations'],
      javanese: ['Sumpah Pemuda (Youth Pledge 1928)', 'Proklamasi Kemerdekaan 1945', 'Reformasi 1998 declarations'],
    },
  },
  'R-10': {
    shape: 'contrarian-polemic',
    cadence: 'counter-position, the no that becomes a yes, takedown rhythm, refusal-as-craft, the inversion that lands',
    defaultRegisters: ['polemic', 'hot-take', 'essay of disagreement', 'satirical refusal'],
    byLineage: {
      yoruba: ['Wole Soyinka polemic', 'Niyi Osundare political-poetic refusal', 'Tai Solarin column'],
      igbo: ['Achebe Trouble with Nigeria', 'Adichie polemic', 'Pius Adesanmi'],
      akan: ['Ayi Kwei Armah Two Thousand Seasons polemic', 'Ama Ata Aidoo refusal'],
      mande: ['jeli formal blame-praise (the praise that cuts)'],
      maroon: ['maroon refusal-of-treaty register', 'fugitive-as-form'],
      vodou: ['Frankétienne polemic', 'Dany Laferrière contrarian'],
      lucumi: ['Reinaldo Arenas polemic'],
      hindu: ['Ambedkar polemic', 'Arundhati Roy political polemic', 'Rohinton Mistry'],
      daoist: ['Lu Xun polemical essay', 'Zhuangzi philosophical refusal', 'Bo Yang Ugly Chinaman'],
      norse: ['saga flyting (formal verbal duel)', 'skald blame-poem'],
      celtic: ['Swift A Modest Proposal', 'fili satire / aer'],
      hebraic: ['prophetic polemic (Amos / Isaiah)', 'Marranos refusal-register'],
      greek: ['Aristophanes satirical refusal', 'Diogenes Cynic polemic'],
      igbo_diaspora: ['James Baldwin polemic', 'Greg Tate hot-take', 'Amiri Baraka refusal-polemic', 'bell hooks contrarian-essay'],
      japanese: ['Mishima political polemic', 'Ōe Kenzaburō dissident essay', 'Murakami Ryū contrarian-novel'],
      korean: ['Kim Jiha The Five Bandits satirical polemic', 'Han Kang quiet-polemic via novel', 'June 1987 contrarian-pamphlet'],
      tibetan: ['Sakya Pandita refutation register', 'Gendün Chöphel dissident-Buddhist essay'],
      javanese: ['Pramoedya banned-author polemic', 'W.S. Rendra protest-poetry', 'Ronggowarsito Kalatidha (Time of Madness) lament-polemic'],
    },
  },
  'Ø': {
    shape: 'receptive-minimal',
    cadence: 'silence-around-words, koan-shape, the line that withholds, white space as content, Beckett-minimal',
    defaultRegisters: ['koan', 'minimalist verse', 'apophatic essay', 'silence-shaped prose'],
    byLineage: {
      yoruba: ['Yoruba proverb (the held meaning)', 'Niyi Osundare distilled-line'],
      igbo: ['Igbo proverb (Ilu) - distilled withheld meaning'],
      akan: ['Adinkra symbol as text', 'Akan proverb compression'],
      mande: ['jeli concealed-praise (what is not said)'],
      maroon: ['silence-as-protection register', 'maroon coded-speech'],
      vodou: ['the unsaid name of the lwa', 'Glissant relation-poetics opacity'],
      lucumi: ['the orisha\'s unspoken name', 'Glissantian opacity'],
      hindu: ['neti neti (not this, not this)', 'Upanishadic apophatic', 'Kabir bare-line'],
      daoist: ['Zen koan', 'Wang Wei minimalism', 'Daodejing apophatic chapters', 'haiku via Bashō'],
      norse: ['rune-stone laconic', 'Hávamál spare aphorism'],
      celtic: ['Beckett minimal', 'sean-nós sparse line'],
      hebraic: ['apophatic Kabbalah (Ein Sof)', 'Edmond Jabès silence-shaped'],
      greek: ['Heraclitus fragment', 'Sappho fragmentary line', 'Cavafy spare lyric'],
      igbo_diaspora: ['Lucille Clifton minimal-verse', 'Sonia Sanchez haiku-form', 'Toni Morrison silence-around-the-name'],
      japanese: ['Bashō haiku', 'Ryōkan Zen-poem', 'Kawabata silence-prose', 'wabi-sabi minimalism', 'kigo-driven brevity', 'mā (the gap as content)'],
      korean: ['sijo three-line minimalism', 'Kim Sowol stripped lyric', 'Han Kang white-space narrative'],
      tibetan: ['Zen-influenced Tibetan dohā (spontaneous-realisation song)', 'Patrul Rinpoche distilled instruction', 'apophatic Madhyamaka prose'],
      javanese: ['Suluk mystical-distillation poem', 'Kawi-era courtly minimalism', 'kebatinan silent-meditation register'],
    },
  },
};

/**
 * Compose a register block for the prompt. Reads the character's
 * primary + optional subdominant Subtaste codes plus their lineage
 * id list, and returns a directive that names the SHAPE (from
 * Subtaste) and the TRADITION (from lineage). The LLM composes them
 * at runtime: prophetic-shape × Yoruba-tradition = oríkì + Ifá ese
 * + Soyinka. Prophetic-shape × Greek-tradition = dithyramb + Pindar
 * + Cavafy. Both real, both valid, neither defaulting to a single
 * cultural frame.
 */
export function buildSubtasteRegisterBlock(
  primaryCode: string | null | undefined,
  secondaryCode: string | null | undefined,
  lineageIds: string[],
): string {
  if (!primaryCode) return '';
  const primary = SUBTASTE_REGISTERS[primaryCode];
  if (!primary) return '';
  const secondary = secondaryCode ? SUBTASTE_REGISTERS[secondaryCode] : undefined;

  const lines: string[] = [];
  lines.push('## Writing register (Subtaste shape × lineage tradition)');
  lines.push('');
  lines.push(
    `Your dominant Subtaste shape is ${primaryCode}: ${primary.shape}. Cadence: ${primary.cadence}.`
  );
  if (secondary) {
    lines.push(
      `Subdominant ${secondaryCode}: ${secondary.shape}. The two stack — primary carries, subdominant inflects.`
    );
  }
  lines.push('');
  lines.push(
    'Render this shape through YOUR lineage\'s literary tradition, not through a generic one. Reference points:'
  );

  // Compose lineage-specific registers from primary (and secondary).
  const seen = new Set<string>();
  const refs: string[] = [];
  for (const lid of lineageIds) {
    const fromPrimary = primary.byLineage[lid] ?? [];
    const fromSecondary = secondary?.byLineage[lid] ?? [];
    for (const r of [...fromPrimary, ...fromSecondary]) {
      if (!seen.has(r)) {
        seen.add(r);
        refs.push(`${r} [${lid}]`);
      }
    }
  }

  if (refs.length === 0) {
    // No lineage-specific match. Fall back to defaults plus a
    // directive to extrapolate from the lineage context the
    // character already carries (set elsewhere in the prompt).
    for (const r of primary.defaultRegisters) refs.push(r);
    if (secondary) for (const r of secondary.defaultRegisters) refs.push(r);
    lines.push(
      'No specific tradition mapped for your lineage; extrapolate from your lineage context elsewhere in the prompt and apply the Subtaste shape to its native literary forms. Pan-cultural fallbacks if needed:'
    );
  }

  for (const r of refs.slice(0, 8)) lines.push(`- ${r}`);
  lines.push('');
  lines.push(
    'These are calibration; do not name them in output. Reach for that depth of register, in the lineage\'s native form. Refuse defaulting to Black-American literary register if that is not the lineage. Refuse defaulting to British / mainstream-Anglophone register either. Specifically lineage-native, in the Subtaste shape.'
  );

  return lines.join('\n');
}
