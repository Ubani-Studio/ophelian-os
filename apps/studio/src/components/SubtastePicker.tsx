'use client';

/**
 * SubtastePicker · primary + secondary Subtaste designation.
 *
 * For isUser=true characters (Ubani), the picker is read-only and
 * shows "from Starforge Nommo" since their Subtaste is inherited
 * from the cached quiz result. Clicking takes them to the Starforge
 * import action (or a hint).
 *
 * For everyone else, two grids of 12 glyphs (primary + secondary).
 * Click to set. Persists to timelineState.oripheon.generated.subtaste.
 */

import { useState, useMemo } from 'react';
import { setSubtaste, type Character } from '@/lib/api';

const TYRIAN = '#66023C';

const SUBTASTE_TWELVE: Array<{ code: string; glyph: string; label: string; essence: string }> = [
  { code: 'S-0', glyph: 'KETH', label: 'Visionary', essence: 'The unmarked throne. First without announcement.' },
  { code: 'T-1', glyph: 'STRATA', label: 'Architectural', essence: 'The hidden architecture. Layers beneath surfaces.' },
  { code: 'V-2', glyph: 'OMEN', label: 'Prophetic', essence: 'What arrives before itself.' },
  { code: 'L-3', glyph: 'SILT', label: 'Developmental', essence: 'Patient sediment.' },
  { code: 'C-4', glyph: 'CULL', label: 'Editorial', essence: 'The necessary cut.' },
  { code: 'N-5', glyph: 'LIMN', label: 'Integrative', essence: 'To illuminate by edge.' },
  { code: 'H-6', glyph: 'TOLL', label: 'Advocacy', essence: 'The bell that cannot be unheard.' },
  { code: 'P-7', glyph: 'VAULT', label: 'Archival', essence: 'What is kept.' },
  { code: 'D-8', glyph: 'WICK', label: 'Channelling', essence: 'Draws flame upward without burning.' },
  { code: 'F-9', glyph: 'ANVIL', label: 'Manifestation', essence: 'Where pressure becomes form.' },
  { code: 'R-10', glyph: 'SCHISM', label: 'Contrarian', essence: 'The productive fracture.' },
  { code: 'Ø', glyph: 'VOID', label: 'Receptive', essence: 'The deliberate absence.' },
];

// Wu Xing overcoming cycle: each Subtaste's structural opposite.
// Used to auto-suggest a shadow when the user picks dominant.
const SHADOW_OF: Record<string, string> = {
  'S-0': 'R-10', 'T-1': 'P-7', 'V-2': 'C-4', 'L-3': 'D-8',
  'C-4': 'R-10', 'N-5': 'Ø',  'H-6': 'F-9', 'P-7': 'L-3',
  'D-8': 'N-5', 'F-9': 'C-4', 'R-10': 'S-0', 'Ø': 'T-1',
};

function readSubtasteCodes(character: Character): {
  primary: string | null;
  secondary: string | null;
  shadow: string | null;
} {
  const ts = character.timelineState as
    | { oripheon?: { generated?: { subtaste?: { code?: unknown; secondaryCode?: unknown; shadowCode?: unknown } } } }
    | undefined;
  const subtaste = ts?.oripheon?.generated?.subtaste ?? {};
  return {
    primary: typeof subtaste.code === 'string' ? subtaste.code : null,
    secondary: typeof subtaste.secondaryCode === 'string' ? subtaste.secondaryCode : null,
    shadow: typeof subtaste.shadowCode === 'string' ? subtaste.shadowCode : null,
  };
}

export function SubtastePicker({
  character,
  onUpdated,
}: {
  character: Character;
  onUpdated: (c: Character) => void;
}) {
  const initial = useMemo(() => readSubtasteCodes(character), [character]);
  const [primary, setPrimary] = useState<string | null>(initial.primary);
  const [secondary, setSecondary] = useState<string | null>(initial.secondary);
  const [shadow, setShadow] = useState<string | null>(initial.shadow);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  // Subdominant + shadow are advanced. Default-collapsed so the
  // picker reads as one decision (dominant) for sandbox use.
  const [showMore, setShowMore] = useState(initial.secondary !== null || initial.shadow !== null);
  // Shadow override is even further behind: auto-display only,
  // override grid revealed when the user clicks "override".
  const [shadowOverride, setShadowOverride] = useState(initial.shadow !== null);

  const isUser = character.isUser === true;

  const persist = async (
    nextPrimary: string | null,
    nextSecondary: string | null,
    nextShadow: string | null | undefined
  ) => {
    if (!nextPrimary) return;
    setSaving(nextPrimary + (nextSecondary ?? '') + (nextShadow ?? ''));
    setError(null);
    try {
      await setSubtaste(character.id, nextPrimary, nextSecondary, nextShadow);
      const ts = (character.timelineState as Record<string, unknown>) ?? {};
      const oripheon = (ts.oripheon as Record<string, unknown>) ?? {};
      const generated = (oripheon.generated as Record<string, unknown>) ?? {};
      const primaryMeta = SUBTASTE_TWELVE.find((s) => s.code === nextPrimary);
      const secondaryMeta = nextSecondary
        ? SUBTASTE_TWELVE.find((s) => s.code === nextSecondary)
        : null;
      // When shadow is undefined, server auto-suggested via Wu Xing.
      const resolvedShadow = nextShadow === undefined ? SHADOW_OF[nextPrimary] : nextShadow;
      const shadowMeta = resolvedShadow
        ? SUBTASTE_TWELVE.find((s) => s.code === resolvedShadow)
        : null;
      const updatedCharacter: Character = {
        ...character,
        timelineState: {
          ...ts,
          oripheon: {
            ...oripheon,
            generated: {
              ...generated,
              subtaste: {
                code: nextPrimary,
                glyph: primaryMeta?.glyph,
                label: primaryMeta?.label,
                secondaryCode: nextSecondary ?? null,
                secondaryGlyph: secondaryMeta?.glyph ?? null,
                secondaryLabel: secondaryMeta?.label ?? null,
                shadowCode: resolvedShadow ?? null,
                shadowGlyph: shadowMeta?.glyph ?? null,
                shadowLabel: shadowMeta?.label ?? null,
              },
            },
          },
        },
      };
      // Reflect resolved shadow locally so the badge updates.
      if (resolvedShadow) setShadow(resolvedShadow);
      onUpdated(updatedCharacter);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to set Subtaste');
    } finally {
      setSaving(null);
    }
  };

  const onPrimaryClick = (code: string) => {
    if (isUser) return;
    const nextSecondary = secondary === code ? null : secondary;
    const nextShadow = shadow === code ? null : shadow;
    setPrimary(code);
    if (secondary === code) setSecondary(null);
    if (shadow === code) setShadow(null);
    // Pass undefined for shadow so server auto-suggests via Wu Xing
    // when none was explicitly chosen yet.
    void persist(code, nextSecondary, shadow === null ? null : shadow === code ? null : nextShadow ?? undefined);
  };

  const onSecondaryClick = (code: string) => {
    if (isUser) return;
    if (code === primary) return;
    const next = secondary === code ? null : code;
    setSecondary(next);
    void persist(primary, next, shadow);
  };

  const onShadowClick = (code: string) => {
    if (isUser) return;
    if (code === primary || code === secondary) return;
    const next = shadow === code ? null : code;
    setShadow(next);
    void persist(primary, secondary, next);
  };

  const autoShadow = primary ? SHADOW_OF[primary] : null;
  const primaryMeta = primary ? SUBTASTE_TWELVE.find((s) => s.code === primary) : null;
  const secondaryMeta = secondary ? SUBTASTE_TWELVE.find((s) => s.code === secondary) : null;
  const shadowMeta = shadow ? SUBTASTE_TWELVE.find((s) => s.code === shadow) : null;
  const autoShadowMeta = autoShadow ? SUBTASTE_TWELVE.find((s) => s.code === autoShadow) : null;

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
          }}
        >
          Subtaste{isUser ? ' · from Starforge' : ''}
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
        <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{ fontSize: '0.7rem', color: 'var(--error)' }}>{error}</div>
          )}

          {isUser && (
            <p
              style={{
                fontSize: '0.78rem',
                color: 'var(--muted-foreground)',
                fontStyle: 'italic',
                fontFamily: '"Canela", serif',
                lineHeight: 1.6,
              }}
            >
              Your Subtaste is inherited from your Starforge Nommo quiz. Run
              <em> POST /characters/{character.id}/import-from-starforge</em> to refresh it.
            </p>
          )}

          {/* Current selection summary */}
          <div
            style={{
              padding: '0.95rem 1rem',
              border: '1px solid var(--border)',
              background: 'rgba(102,2,60,0.04)',
              fontSize: '0.82rem',
              lineHeight: 1.65,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
            }}
          >
            <SummaryRow label="dominant" meta={primaryMeta ?? null} />
            {(showMore || secondaryMeta) && (
              <SummaryRow label="subdominant" meta={secondaryMeta ?? null} />
            )}
            {(showMore || shadowMeta) && (
              <SummaryRow
                label="shadow"
                meta={shadowMeta ?? null}
                suggestion={!shadowMeta && autoShadowMeta ? autoShadowMeta : null}
              />
            )}
          </div>

          {/* Dominant picker · always visible */}
          {!isUser && (
            <div>
              <div style={pickerLabelStyle}>Dominant</div>
              <div style={gridStyle}>
                {SUBTASTE_TWELVE.map((s) => (
                  <SubtasteButton
                    key={'p-' + s.code}
                    code={s.code}
                    glyph={s.glyph}
                    label={s.label}
                    essence={s.essence}
                    selected={primary === s.code}
                    onClick={() => onPrimaryClick(s.code)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* More toggle · reveals subdominant and shadow */}
          {!isUser && primary && (
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                color: 'var(--muted-foreground)',
                fontSize: '0.6rem',
                fontFamily: 'monospace',
                letterSpacing: '0.24em',
                textTransform: 'none',
                cursor: 'pointer',
                alignSelf: 'flex-start',
              }}
            >
              {showMore ? '− less' : '+ more (subdominant, shadow)'}
            </button>
          )}

          {/* Subdominant picker · behind more toggle */}
          {!isUser && primary && showMore && (
            <div>
              <div style={pickerLabelStyle}>Subdominant (optional counterpoint)</div>
              <div style={gridStyle}>
                {SUBTASTE_TWELVE.map((s) => (
                  <SubtasteButton
                    key={'s-' + s.code}
                    code={s.code}
                    glyph={s.glyph}
                    label={s.label}
                    essence={s.essence}
                    selected={secondary === s.code}
                    disabled={s.code === primary}
                    onClick={() => onSecondaryClick(s.code)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Shadow · auto-displayed read-only behind more toggle.
              Override link reveals the picker grid one click further. */}
          {!isUser && primary && showMore && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  marginBottom: '0.4rem',
                }}
              >
                <div style={pickerLabelStyle}>
                  Shadow (auto, computed by Wu Xing)
                </div>
                <button
                  type="button"
                  onClick={() => setShadowOverride((v) => !v)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    color: 'var(--muted-foreground)',
                    fontSize: '0.55rem',
                    fontFamily: 'monospace',
                    letterSpacing: '0.22em',
                    textTransform: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {shadowOverride ? 'use auto' : 'override'}
                </button>
              </div>

              {/* Read-only display when override is closed */}
              {!shadowOverride && autoShadowMeta && (
                <div
                  style={{
                    padding: '0.7rem 0.85rem',
                    border: '1px dashed var(--border)',
                    fontSize: '0.78rem',
                    color: 'var(--foreground)',
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'baseline',
                  }}
                >
                  <span style={{ color: TYRIAN, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                    {autoShadowMeta.code} {autoShadowMeta.glyph}
                  </span>
                  <span style={{ color: 'var(--muted-foreground)' }}>· {autoShadowMeta.label}</span>
                  <span style={{ flex: 1 }} />
                  <span
                    style={{
                      fontSize: '0.55rem',
                      fontFamily: 'monospace',
                      letterSpacing: '0.2em',
                      color: 'var(--muted-foreground)',
                      opacity: 0.7,
                    }}
                  >
                    auto · wu xing
                  </span>
                </div>
              )}

              {/* Override grid */}
              {shadowOverride && (
                <div style={gridStyle}>
                  {SUBTASTE_TWELVE.map((s) => {
                    const isAuto = !shadow && autoShadow === s.code;
                    return (
                      <SubtasteButton
                        key={'sh-' + s.code}
                        code={s.code}
                        glyph={s.glyph}
                        label={s.label}
                        essence={s.essence}
                        selected={shadow === s.code || isAuto}
                        disabled={s.code === primary || s.code === secondary}
                        ghost={isAuto}
                        onClick={() => onShadowClick(s.code)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const pickerLabelStyle: React.CSSProperties = {
  fontSize: '0.55rem',
  letterSpacing: '0.28em',
  color: 'var(--muted-foreground)',
  fontFamily: 'monospace',
  textTransform: 'none',
  marginBottom: '0.4rem',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '0.3rem',
};

function SummaryRow({
  label,
  meta,
  suggestion,
}: {
  label: string;
  meta: { code: string; glyph: string; label: string } | null;
  suggestion?: { code: string; glyph: string; label: string } | null;
}) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
      <span
        style={{
          color: 'var(--muted-foreground)',
          fontFamily: 'monospace',
          fontSize: '0.55rem',
          letterSpacing: '0.22em',
          textTransform: 'none',
          minWidth: '90px',
        }}
      >
        {label}
      </span>
      {meta ? (
        <span>
          <span style={{ color: TYRIAN, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
            {meta.code} {meta.glyph}
          </span>
          <span style={{ color: 'var(--muted-foreground)' }}> · {meta.label}</span>
        </span>
      ) : suggestion ? (
        <span style={{ opacity: 0.55 }}>
          <em style={{ color: 'var(--muted-foreground)' }}>auto: </em>
          <span style={{ color: TYRIAN, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
            {suggestion.code} {suggestion.glyph}
          </span>
          <span style={{ color: 'var(--muted-foreground)' }}> · {suggestion.label}</span>
        </span>
      ) : (
        <em style={{ color: 'var(--muted-foreground)' }}>none</em>
      )}
    </div>
  );
}

function SubtasteButton({
  code,
  glyph,
  label,
  essence,
  selected,
  disabled,
  ghost,
  onClick,
}: {
  code: string;
  glyph: string;
  label: string;
  essence: string;
  selected: boolean;
  disabled?: boolean;
  ghost?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={`${code} ${glyph} · ${label}\n${essence}`}
      style={{
        padding: '0.5rem 0.55rem',
        textAlign: 'left',
        border: `1px ${ghost ? 'dashed' : 'solid'} ${selected ? TYRIAN : 'var(--border)'}`,
        background: selected && !ghost ? TYRIAN : ghost ? 'rgba(102,2,60,0.06)' : 'transparent',
        color: selected && !ghost
          ? '#fff'
          : ghost
          ? TYRIAN
          : disabled
          ? 'var(--muted-foreground)'
          : 'var(--foreground)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        borderRadius: 0,
        opacity: disabled ? 0.4 : 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.15rem',
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '0.55rem',
          letterSpacing: '0.18em',
          opacity: 0.7,
        }}
      >
        {code}
      </span>
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '0.78rem',
          letterSpacing: '0.05em',
        }}
      >
        {glyph}
      </span>
      <span
        style={{
          fontSize: '0.6rem',
          opacity: 0.6,
          letterSpacing: '0.02em',
        }}
      >
        {label.toLowerCase()}
      </span>
    </button>
  );
}
