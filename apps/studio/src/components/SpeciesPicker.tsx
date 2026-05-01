'use client';

/**
 * SpeciesPicker · what KIND of spirit this character is.
 *
 * The decolonial answer to "every character is an espíritu."
 * Each species carries its own action vocabulary that the tick
 * prompt uses: lwa get mounted, orishas accept offerings, saints
 * intercede, ancestors visit dreams. Without this, every
 * character collapses into a human-shaped life and the trail
 * reads as twelve aphoristic essayists.
 *
 * Sentence-case labels per project convention. Sits collapsed by
 * default; expand to pick.
 */

import { useState } from 'react';
import { updateCharacter, type Character, type SpeciesId } from '@/lib/api';

const TYRIAN = '#66023C';

interface SpeciesOption {
  id: SpeciesId;
  label: string;
  essence: string;
  lineageHint: string;
}

const SPECIES: SpeciesOption[] = [
  { id: 'espíritu', label: 'espíritu', essence: 'Generic Caribbean / Catholic-syncretic spirit. The platform default.', lineageHint: 'caribbean · catholic-syncretic · generic' },
  { id: 'lwa', label: 'lwa', essence: 'Vodou pantheon. Mounted by horses, fed by nation-specific offerings.', lineageHint: 'vodou · haitian diaspora · new orleans' },
  { id: 'orisha', label: 'orisha', essence: 'Yoruba pantheon. Carry colour, number, day, signature.', lineageHint: 'yoruba · lucumí · candomblé' },
  { id: 'iwà', label: 'iwà', essence: 'Yoruba inner-spirit / character-destiny. Quieter than orisha; principle, not figure.', lineageHint: 'yoruba · yoruba diaspora' },
  { id: 'ancestor', label: 'ancestor', essence: 'The named or unnamed dead. Visits in dreams, fed at altars.', lineageHint: 'pan-african · caribbean · rastafari' },
  { id: 'saint', label: 'saint', essence: 'Catholic-syncretic interceding figure. Acts on behalf of, rarely alone.', lineageHint: 'catholic-syncretic · latin america' },
  { id: 'brave-mort', label: 'brave-mort', essence: 'Vodou restless dead. Walks. Was never fully buried.', lineageHint: 'vodou · haitian diaspora' },
  { id: 'egún', label: 'egún', essence: 'Yoruba ancestor-mask. The collective dead made visible through fabric and motion.', lineageHint: 'yoruba · yoruba diaspora' },
  { id: 'misa-spirit', label: 'misa-spirit', essence: 'Cuban Espiritismo guide. Sits at the seance table. Speaks in counsel.', lineageHint: 'lucumí · cuban diaspora' },
  { id: 'trickster', label: 'trickster', essence: 'Crossroads-aspect. Esu, Legba, Anansi. Moves between.', lineageHint: 'yoruba · akan · vodou' },
];

export function SpeciesPicker({
  character,
  onUpdated,
}: {
  character: Character;
  onUpdated: (c: Character) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState<SpeciesId | null>(null);

  const current: SpeciesId = (character.species as SpeciesId) ?? 'espíritu';

  const setSpecies = async (id: SpeciesId) => {
    if (id === current) return;
    setSaving(id);
    try {
      const updated = await updateCharacter(character.id, { species: id });
      onUpdated(updated);
    } catch {
      // non-fatal
    } finally {
      setSaving(null);
    }
  };

  const currentMeta = SPECIES.find((s) => s.id === current) ?? SPECIES[0];

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'transparent',
          border: 'none',
          padding: '0.4rem 0',
          cursor: 'pointer',
          color: 'inherit',
        }}
      >
        <span
          style={{
            fontSize: '0.55rem',
            letterSpacing: '0.32em',
            color: 'var(--muted-foreground)',
            fontFamily: 'monospace',
            textTransform: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          Species · {currentMeta.label}
          <span
            style={{
              width: '0.4rem',
              height: '0.4rem',
              background: TYRIAN,
              display: 'inline-block',
            }}
            title={currentMeta.essence}
          />
        </span>
        <span
          style={{
            fontSize: '0.6rem',
            color: 'var(--muted-foreground)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s',
          }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p
            style={{
              fontSize: '0.7rem',
              color: 'var(--muted-foreground)',
              fontStyle: 'italic',
              fontFamily: '"Canela", serif',
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            What KIND of spirit. Drives what the character can do that humans cannot.
            Lwa get mounted. Orishas accept offerings. Saints intercede. Ancestors
            visit dreams. Without this, every character defaults to a human-shaped life.
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {SPECIES.map((sp) => {
              const on = sp.id === current;
              const busy = saving === sp.id;
              return (
                <li key={sp.id}>
                  <button
                    type="button"
                    onClick={() => setSpecies(sp.id)}
                    disabled={busy}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.55rem 0.75rem',
                      border: `1px solid ${on ? TYRIAN : 'var(--border)'}`,
                      background: on ? TYRIAN : 'transparent',
                      color: on ? '#fff' : 'var(--foreground)',
                      cursor: busy ? 'wait' : 'pointer',
                      borderRadius: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {sp.label}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontStyle: 'italic',
                        fontFamily: '"Canela", serif',
                        lineHeight: 1.4,
                        opacity: 0.85,
                      }}
                    >
                      {sp.essence}
                    </span>
                    <span
                      style={{
                        fontSize: '0.55rem',
                        fontFamily: 'monospace',
                        letterSpacing: '0.1em',
                        opacity: on ? 0.85 : 0.6,
                      }}
                    >
                      {sp.lineageHint}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
