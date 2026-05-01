'use client';

/**
 * TonguePanel · what comes out of the character's mouth.
 *
 * Tongue is separable from lineage. Lineage is the cultural anchor
 * (where you are rooted). Tongue is what comes out of the mouth
 * (which can be a different shape). A Yoruba-lineage character in
 * Paris speaks French primarily, code-switches to Yoruba prayer
 * fragments, lapses into Lagos pidgin when angry. That's real
 * diaspora speech.
 *
 * Five fields:
 *   - primaryLanguage: free-text, doesn't have to match lineage
 *   - dialect: specific dialect they speak (Lagos pidgin, AAVE,
 *     Kreyòl, south London, etc.)
 *   - accent: city / region marker
 *   - idioms: 3-6 specific phrases they reach for; can mix languages
 *   - registerNotes: code-switching triggers ("with the priest she
 *     shifts into Yoruba; with the niece she stays in patois")
 *
 * Per docs/species-becoming.md and docs/slang-cohort.md.
 */

import { useEffect, useState } from 'react';
import { updateCharacter, type Character } from '@/lib/api';

const TYRIAN = '#66023C';

interface TongueShape {
  primaryLanguage?: string;
  dialect?: string;
  accent?: string;
  idioms?: string[];
  registerNotes?: string;
}

export function TonguePanel({
  character,
  onUpdated,
}: {
  character: Character;
  onUpdated: (c: Character) => void;
}) {
  const initial = (character.tongue ?? {}) as TongueShape;
  const [open, setOpen] = useState(false);
  const [primaryLanguage, setPrimaryLanguage] = useState(initial.primaryLanguage ?? '');
  const [dialect, setDialect] = useState(initial.dialect ?? '');
  const [accent, setAccent] = useState(initial.accent ?? '');
  const [idiomsText, setIdiomsText] = useState((initial.idioms ?? []).join(', '));
  const [registerNotes, setRegisterNotes] = useState(initial.registerNotes ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = (character.tongue ?? {}) as TongueShape;
    setPrimaryLanguage(t.primaryLanguage ?? '');
    setDialect(t.dialect ?? '');
    setAccent(t.accent ?? '');
    setIdiomsText((t.idioms ?? []).join(', '));
    setRegisterNotes(t.registerNotes ?? '');
  }, [character.tongue]);

  const persist = async () => {
    setSaving(true);
    try {
      const next: TongueShape = {
        primaryLanguage: primaryLanguage.trim() || undefined,
        dialect: dialect.trim() || undefined,
        accent: accent.trim() || undefined,
        idioms: idiomsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        registerNotes: registerNotes.trim() || undefined,
      };
      const updated = await updateCharacter(character.id, { tongue: next });
      onUpdated(updated);
    } catch {
      // non-fatal
    } finally {
      setSaving(false);
    }
  };

  const hasContent =
    primaryLanguage.trim().length > 0 ||
    dialect.trim().length > 0 ||
    accent.trim().length > 0 ||
    idiomsText.trim().length > 0 ||
    registerNotes.trim().length > 0;

  const summary = [primaryLanguage, dialect, accent].filter(Boolean).join(' · ') || 'unset';

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
          Tongue · {summary}
          {hasContent && (
            <span
              style={{
                width: '0.4rem',
                height: '0.4rem',
                background: TYRIAN,
                display: 'inline-block',
              }}
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
            What comes out of their mouth. Tongue is separable from lineage.
            A Yoruba-lineage character living in Paris can speak French primarily
            and carry Yoruba in idioms, register, and code-switching. Lineage =
            cultural anchor. Tongue = actual speech. They do not have to match.
          </p>

          <div>
            <label style={labelStyle}>Primary language</label>
            <input
              type="text"
              value={primaryLanguage}
              onChange={(e) => setPrimaryLanguage(e.target.value)}
              onBlur={persist}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              placeholder="e.g. English, French, Yoruba, Spanish, Korean. Does not need to match lineage."
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Dialect</label>
            <input
              type="text"
              value={dialect}
              onChange={(e) => setDialect(e.target.value)}
              onBlur={persist}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              placeholder="e.g. Lagos pidgin, AAVE, Kreyòl, patois, Konglish, south London, sijo register"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Accent</label>
            <input
              type="text"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              onBlur={persist}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              placeholder="e.g. Brooklyn, Peckham, Surulere, Kingston, Daikanyama"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>
              Idioms · phrases they reach for (comma-separated, can mix languages)
            </label>
            <input
              type="text"
              value={idiomsText}
              onChange={(e) => setIdiomsText(e.target.value)}
              onBlur={persist}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              placeholder='e.g. "ó wà bóyá", "for real for real", "no be small thing", "kígbe ó", "the lengths"'
              style={inputStyle}
            />
            <p style={hintStyle}>
              Mix languages freely. Invented coinings count and stack against the public-LLM corpus.
              These ground the cohort moat.
            </p>
          </div>

          <div>
            <label style={labelStyle}>Register notes · code-switching triggers</label>
            <textarea
              value={registerNotes}
              onChange={(e) => setRegisterNotes(e.target.value)}
              onBlur={persist}
              placeholder="e.g. shifts into Yoruba praise-poetry with elders. Drops into Lagos pidgin when angry. Petwo Kreyòl when claiming, Rada when blessing. Code-switches mid-sentence; never italicises foreign words."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', minHeight: '4rem' }}
            />
            <p style={hintStyle}>
              Tell the tick how the tongue moves. Who triggers each register. When
              they switch. Code-switching is the texture, not an effect.
            </p>
          </div>

          {saving && (
            <p style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', fontFamily: 'monospace', margin: 0 }}>
              saving…
            </p>
          )}
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

const hintStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  color: 'var(--muted-foreground)',
  fontStyle: 'italic',
  fontFamily: '"Canela", serif',
  lineHeight: 1.5,
  marginTop: '0.35rem',
  marginBottom: 0,
};
