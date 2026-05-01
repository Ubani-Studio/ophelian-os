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
import { updateCharacter, generateBackstoryDraft, type Character, type SpeciesId } from '@/lib/api';

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
  // Checkpoint state: a candidate species the user has selected but
  // not confirmed yet. The picker shows confirm / confirm-and-regen /
  // cancel inline rather than persisting silently. Spirits-as-
  // ritual-response: changing species is a meaningful identity move,
  // not a setting toggle.
  const [pending, setPending] = useState<SpeciesId | null>(null);
  const [regenStatus, setRegenStatus] = useState<string | null>(null);

  const current: SpeciesId = (character.species as SpeciesId) ?? 'espíritu';
  const hasContent = (character.bio ?? '').trim().length > 0 || (character.backstory ?? '').trim().length > 0;

  // Persist a chosen species. On first set (current === espíritu and
  // no bio/backstory yet) we skip the checkpoint and persist directly.
  // Otherwise we stage as pending and wait for explicit confirm.
  const onPick = (id: SpeciesId) => {
    if (id === current) return;
    if (current === 'espíritu' && !hasContent) {
      void persist(id);
      return;
    }
    setPending(id);
    setRegenStatus(null);
  };

  const persist = async (id: SpeciesId) => {
    setSaving(id);
    try {
      const updated = await updateCharacter(character.id, { species: id });
      onUpdated(updated);
      setPending(null);
    } catch {
      // non-fatal
    } finally {
      setSaving(null);
    }
  };

  const persistAndRegenerate = async (id: SpeciesId) => {
    setSaving(id);
    setRegenStatus('updating species...');
    try {
      const updated = await updateCharacter(character.id, { species: id });
      onUpdated(updated);
      setRegenStatus('regenerating backstory...');
      const draft = await generateBackstoryDraft(character.id);
      const withBackstory = await updateCharacter(character.id, { backstory: draft.draft });
      onUpdated(withBackstory);
      setRegenStatus('done');
      setPending(null);
      setTimeout(() => setRegenStatus(null), 1500);
    } catch (e) {
      setRegenStatus(e instanceof Error ? e.message : 'regenerate failed');
    } finally {
      setSaving(null);
    }
  };

  const currentMeta = SPECIES.find((s) => s.id === current) ?? SPECIES[0];
  const pendingMeta = pending ? SPECIES.find((s) => s.id === pending) : null;

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

          {/* Checkpoint card: appears when user has staged a species
              change but not confirmed yet. Per the design, spirits-as-
              ritual-response — changing species is a meaningful
              identity move, not a setting toggle. Three options:
              change-only / change+regenerate-backstory / cancel. */}
          {pending && pendingMeta && (
            <div
              style={{
                border: `1px solid ${TYRIAN}`,
                padding: '0.75rem 0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.55rem',
                  letterSpacing: '0.32em',
                  color: TYRIAN,
                  fontFamily: 'monospace',
                }}
              >
                Confirm species change
              </div>
              <p
                style={{
                  fontSize: '0.8rem',
                  fontFamily: '"Canela", serif',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                Reclassifying {character.name} from{' '}
                <strong>{currentMeta.label}</strong> to{' '}
                <strong>{pendingMeta.label}</strong>.{' '}
                {hasContent && (
                  <span style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
                    The existing bio and backstory were written under{' '}
                    {currentMeta.label} and may not match the new species.
                  </span>
                )}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => persist(pending)}
                  disabled={saving !== null}
                  style={pillButton(TYRIAN, '#fff', false)}
                >
                  change only
                </button>
                {hasContent && (
                  <button
                    type="button"
                    onClick={() => persistAndRegenerate(pending)}
                    disabled={saving !== null}
                    style={pillButton(TYRIAN, '#fff', false)}
                  >
                    change + regenerate backstory
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setPending(null);
                    setRegenStatus(null);
                  }}
                  disabled={saving !== null}
                  style={pillButton('transparent', 'var(--muted-foreground)', true)}
                >
                  cancel
                </button>
              </div>
              {regenStatus && (
                <p
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--muted-foreground)',
                    fontFamily: 'monospace',
                    margin: 0,
                  }}
                >
                  {regenStatus}
                </p>
              )}
            </div>
          )}

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {SPECIES.map((sp) => {
              const on = sp.id === current;
              const isPending = sp.id === pending;
              const busy = saving === sp.id;
              return (
                <li key={sp.id}>
                  <button
                    type="button"
                    onClick={() => onPick(sp.id)}
                    disabled={busy || saving !== null}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.55rem 0.75rem',
                      border: `1px ${isPending ? 'dashed' : 'solid'} ${on || isPending ? TYRIAN : 'var(--border)'}`,
                      background: on ? TYRIAN : 'transparent',
                      color: on ? '#fff' : 'var(--foreground)',
                      cursor: busy ? 'wait' : 'pointer',
                      borderRadius: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      opacity: saving !== null && !busy ? 0.5 : 1,
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

function pillButton(bg: string, fg: string, ghost: boolean): React.CSSProperties {
  return {
    padding: '0.35rem 0.7rem',
    fontSize: '0.65rem',
    fontFamily: 'monospace',
    letterSpacing: '0.08em',
    border: `1px solid ${ghost ? 'var(--border)' : bg}`,
    background: bg,
    color: fg,
    cursor: 'pointer',
    borderRadius: 0,
  };
}
