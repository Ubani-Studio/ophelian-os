'use client';

/**
 * IdentityRegisterPanel · gender + pronouns.
 *
 * Free-text fields. Quick chips for the most common patterns
 * (she/her, he/him, they/them, ó/ó for Yoruba, e/em, etc.) but
 * the input accepts anything.
 *
 * Why these matter: real grammar variance in tick output.
 * Without pronouns the model defaults to flat third-person
 * narration; with them, characters write in voice.
 */

import { useEffect, useState } from 'react';
import { updateCharacter, type Character } from '@/lib/api';

const TYRIAN = '#66023C';

const PRONOUN_CHIPS = [
  'she/her',
  'he/him',
  'they/them',
  'ó/ó',
  'e/em',
  'she/they',
  'he/they',
];

export function IdentityRegisterPanel({
  character,
  onUpdated,
}: {
  character: Character;
  onUpdated: (c: Character) => void;
}) {
  const [open, setOpen] = useState(false);
  const [gender, setGender] = useState(character.gender ?? '');
  const [pronouns, setPronouns] = useState(character.pronouns ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setGender(character.gender ?? '');
    setPronouns(character.pronouns ?? '');
  }, [character.gender, character.pronouns]);

  const persist = async (next: Partial<Character>) => {
    setSaving(true);
    try {
      const updated = await updateCharacter(character.id, next);
      onUpdated(updated);
    } catch {
      // non-fatal
    } finally {
      setSaving(false);
    }
  };

  const hasContent = (gender || '').trim().length > 0 || (pronouns || '').trim().length > 0;

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
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          Identity register
          {hasContent && (
            <span
              style={{
                width: '0.4rem',
                height: '0.4rem',
                background: TYRIAN,
                display: 'inline-block',
              }}
              title={`${gender || 'unspecified'} · ${pronouns || 'no pronouns'}`}
            />
          )}
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
        <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
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
            Real grammar variance in tick output. Pronouns shape sentence
            structure. Gender shapes register. Both optional.
          </p>

          {/* Pronouns */}
          <div>
            <label style={labelStyle}>Pronouns</label>
            <input
              type="text"
              value={pronouns}
              onChange={(e) => setPronouns(e.target.value)}
              onBlur={() => persist({ pronouns: pronouns.trim() || null })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              placeholder="e.g. she/her, they/them, ó/ó, e/em"
              style={inputStyle}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.4rem' }}>
              {PRONOUN_CHIPS.map((chip) => {
                const on = pronouns === chip;
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setPronouns(chip);
                      void persist({ pronouns: chip });
                    }}
                    style={{
                      padding: '0.25rem 0.6rem',
                      fontSize: '0.65rem',
                      fontFamily: 'monospace',
                      letterSpacing: '0.05em',
                      border: `1px solid ${on ? TYRIAN : 'var(--border)'}`,
                      background: on ? TYRIAN : 'transparent',
                      color: on ? '#fff' : 'var(--foreground)',
                      cursor: saving ? 'wait' : 'pointer',
                      borderRadius: 0,
                    }}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gender */}
          <div>
            <label style={labelStyle}>Gender</label>
            <input
              type="text"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              onBlur={() => persist({ gender: gender.trim() || null })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              placeholder="free-text · woman, man, nonbinary, fluid, two-spirit, fae, none, etc."
              style={inputStyle}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.55rem',
  letterSpacing: '0.28em',
  color: 'var(--muted-foreground)',
  fontFamily: 'monospace',
  textTransform: 'none',
  display: 'block',
  marginBottom: '0.3rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.45rem 0.6rem',
  fontSize: '0.82rem',
  fontFamily: 'inherit',
  background: '#000',
  color: 'var(--foreground)',
  border: '1px solid var(--border)',
  borderRadius: 0,
  outline: 'none',
};
