'use client';

/**
 * ForgePanel · the aligned character generator.
 *
 * Pick a lineage, optionally pin a Subtaste, optionally write a
 * brief. Pick which fields to regenerate. Click Forge. One Claude
 * call returns coherent bio + backstory + aliases + persona tags +
 * goals so they reference each other naturally instead of mismatching.
 *
 * Sheaf theory: locally chaotic, globally consistent. The lineage
 * + Subtaste + brief is the shared anchor every field is generated
 * against.
 *
 * Default behaviour: preview the draft, let the user edit and apply
 * per-field. Locked fields (Ubani's Starforge-anchored bio) are
 * skipped automatically.
 */

import { useEffect, useState } from 'react';
import {
  listLineages,
  realignCharacter,
  updateCharacter,
  type Character,
  type LineageOption,
  type RealignField,
  type RealignDraft,
  type Setting,
} from '@/lib/api';

const TYRIAN = '#66023C';

const ALL_FIELDS: RealignField[] = ['bio', 'backstory', 'aliases', 'personaTags', 'goals', 'tongue'];
const FIELD_LABELS: Record<RealignField, string> = {
  bio: 'bio',
  backstory: 'backstory',
  aliases: 'aliases',
  personaTags: 'tags',
  goals: 'goals',
  tongue: 'tongue',
};

const SETTING_OPTIONS: Array<{ id: Setting; label: string; hint: string }> = [
  { id: 'modern', label: 'modern', hint: 'present-day specifics, real shops + venues + bus routes' },
  { id: 'mystical', label: 'mystical', hint: 'altars, ancestors, divinatory practice' },
  { id: 'archaic', label: 'archaic', hint: 'pre-modern, courts, monasteries, lineage memory' },
  { id: 'past_life', label: 'past life', hint: 'present character with archaic flashbacks' },
  { id: 'mythic', label: 'mythic', hint: 'legendary, out-of-time, archetype-named' },
  { id: 'surreal', label: 'surreal', hint: 'absurd, dream-logic, non-naturalistic but specific' },
  { id: 'mixed', label: 'mixed', hint: 'generator picks 1-2 and blends per generation' },
];

const SUBTASTE_OPTIONS: Array<{ code: string; display: string }> = [
  { code: 'S-0', display: 'S-0 KETH · Visionary' },
  { code: 'T-1', display: 'T-1 STRATA · Architectural' },
  { code: 'V-2', display: 'V-2 OMEN · Prophetic' },
  { code: 'L-3', display: 'L-3 SILT · Developmental' },
  { code: 'C-4', display: 'C-4 CULL · Editorial' },
  { code: 'N-5', display: 'N-5 LIMN · Integrative' },
  { code: 'H-6', display: 'H-6 TOLL · Advocacy' },
  { code: 'P-7', display: 'P-7 VAULT · Archival' },
  { code: 'D-8', display: 'D-8 WICK · Channelling' },
  { code: 'F-9', display: 'F-9 ANVIL · Manifestation' },
  { code: 'R-10', display: 'R-10 SCHISM · Contrarian' },
  { code: 'Ø', display: 'Ø VOID · Receptive' },
];

export function ForgePanel({
  character,
  onUpdated,
}: {
  character: Character;
  onUpdated: (c: Character) => void;
}) {
  const [open, setOpen] = useState(false);
  const [lineages, setLineages] = useState<LineageOption[]>([]);
  const [selectedLineages, setSelectedLineages] = useState<Set<string>>(new Set());
  const [brief, setBrief] = useState('');
  const [subtasteCode, setSubtasteCode] = useState('');
  const [setting, setSetting] = useState<Setting | ''>(
    (character.setting as Setting | undefined) ?? ''
  );
  const [fields, setFields] = useState<Set<RealignField>>(new Set(ALL_FIELDS));
  const [draft, setDraft] = useState<RealignDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);

  useEffect(() => {
    if (open && lineages.length === 0) {
      listLineages().then(setLineages).catch(() => setLineages([]));
    }
  }, [open, lineages.length]);

  const toggleField = (f: RealignField) => {
    const next = new Set(fields);
    if (next.has(f)) next.delete(f);
    else next.add(f);
    setFields(next);
  };

  const lineageList = Array.from(selectedLineages);

  const toggleLineage = (id: string) => {
    const next = new Set(selectedLineages);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLineages(next);
  };

  const forge = async () => {
    setLoading(true);
    setError(null);
    setDraft(null);
    setSkipped([]);
    try {
      const result = await realignCharacter(character.id, {
        lineage: lineageList.length > 0 ? lineageList : undefined,
        brief: brief.trim() || undefined,
        subtasteCode: subtasteCode || undefined,
        setting: setting || undefined,
        fields: Array.from(fields),
        apply: false,
      });
      setDraft(result.draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Forge failed');
    } finally {
      setLoading(false);
    }
  };

  // Persist setting on the character record so it sticks across
  // generations and other surfaces can read it.
  const onSettingClick = async (id: Setting | '') => {
    setSetting(id);
    if (!id) return;
    try {
      const updated = await updateCharacter(character.id, { setting: id });
      onUpdated(updated);
    } catch {
      // non-fatal; the setting still applies to the next forge call
    }
  };

  const applyField = async (field: RealignField) => {
    if (!draft || draft[field] === undefined) return;
    setApplying(field);
    setError(null);
    try {
      const value = draft[field];
      const updated = await updateCharacter(character.id, {
        [field]: value,
      } as Partial<Character>);
      onUpdated(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to apply ${field}`);
    } finally {
      setApplying(null);
    }
  };

  const applyAll = async () => {
    if (!draft) return;
    setApplying('all');
    setError(null);
    try {
      const result = await realignCharacter(character.id, {
        lineage: lineageList.length > 0 ? lineageList : undefined,
        brief: brief.trim() || undefined,
        subtasteCode: subtasteCode || undefined,
        setting: setting || undefined,
        fields: Array.from(fields),
        apply: true,
      });
      setSkipped(result.skipped ?? []);
      // refetch to update parent
      const refreshed = await updateCharacter(character.id, {});
      onUpdated(refreshed);
      setDraft(result.draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Apply-all failed');
    } finally {
      setApplying(null);
    }
  };

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
          Forge · aligned chaos
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
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <p
            style={{
              fontSize: '0.78rem',
              color: 'var(--muted-foreground)',
              fontStyle: 'italic',
              fontFamily: '"Canela", serif',
              lineHeight: 1.55,
            }}
          >
            Pick a lineage, optionally pin a Subtaste, write a brief.
            Forge generates aligned bio, backstory, aliases, tags, and
            goals in one pass so they cohere with each other.
          </p>

          {error && (
            <div style={{ fontSize: '0.7rem', color: 'var(--error)' }}>{error}</div>
          )}

          {/* Lineage picker · multi-select pill grid */}
          <div>
            <label style={labelStyle}>
              Lineage{lineageList.length > 0 ? ` (${lineageList.length})` : ''}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {lineages.map((l) => {
                const on = selectedLineages.has(l.id);
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => toggleLineage(l.id)}
                    title={`${l.region}${l.advisorGated ? ' · advisor-gated' : ''}`}
                    style={{
                      padding: '0.35rem 0.7rem',
                      fontSize: '0.7rem',
                      fontFamily: 'inherit',
                      letterSpacing: '0.04em',
                      border: `1px solid ${on ? TYRIAN : 'var(--border)'}`,
                      background: on ? TYRIAN : 'transparent',
                      color: on ? '#fff' : 'var(--foreground)',
                      cursor: 'pointer',
                      borderRadius: 0,
                      transition: 'border-color 0.12s, background 0.12s',
                    }}
                  >
                    {l.label}
                    {l.advisorGated && (
                      <span
                        style={{
                          marginLeft: '0.3rem',
                          fontSize: '0.55rem',
                          opacity: 0.7,
                          fontFamily: 'monospace',
                        }}
                      >
                        ◇
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {lineageList.length > 1 && (
              <p
                style={{
                  fontSize: '0.62rem',
                  color: 'var(--muted-foreground)',
                  marginTop: '0.35rem',
                  fontFamily: '"Canela", serif',
                  fontStyle: 'italic',
                  lineHeight: 1.5,
                }}
              >
                Multiple lineages blend at the intersection. Names from one,
                register from another, idioms code-switching across.
              </p>
            )}
          </div>

          {/* Subtaste pin · 12-glyph pill picker (matches lineage). */}
          <div>
            <label style={labelStyle}>
              Subtaste anchor{subtasteCode ? '' : ' (optional, uses character\'s existing)'}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={() => setSubtasteCode('')}
                style={{
                  padding: '0.4rem 0.7rem',
                  fontSize: '0.7rem',
                  fontFamily: 'inherit',
                  letterSpacing: '0.04em',
                  border: `1px solid ${subtasteCode === '' ? TYRIAN : 'var(--border)'}`,
                  background: subtasteCode === '' ? TYRIAN : 'transparent',
                  color: subtasteCode === '' ? '#fff' : 'var(--foreground)',
                  cursor: 'pointer',
                  borderRadius: 0,
                  fontStyle: 'italic',
                }}
              >
                use existing
              </button>
              {SUBTASTE_OPTIONS.map((s) => {
                const on = subtasteCode === s.code;
                // s.display = "S-0 KETH · Visionary"
                const match = s.display.match(/^(\S+)\s+(\S+)\s+·\s+(.+)$/);
                const code = match?.[1] ?? s.code;
                const glyph = match?.[2] ?? '';
                const mode = match?.[3] ?? '';
                return (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => setSubtasteCode(s.code)}
                    title={s.display}
                    style={{
                      padding: '0.4rem 0.7rem',
                      fontSize: '0.7rem',
                      fontFamily: 'inherit',
                      letterSpacing: '0.04em',
                      border: `1px solid ${on ? TYRIAN : 'var(--border)'}`,
                      background: on ? TYRIAN : 'transparent',
                      color: on ? '#fff' : 'var(--foreground)',
                      cursor: 'pointer',
                      borderRadius: 0,
                      display: 'inline-flex',
                      alignItems: 'baseline',
                      gap: '0.35rem',
                    }}
                  >
                    <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', opacity: 0.7 }}>
                      {code}
                    </span>
                    <span style={{ fontFamily: 'monospace' }}>{glyph}</span>
                    <span style={{ opacity: 0.65, fontSize: '0.62rem' }}>
                      {mode.toLowerCase()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Setting register · pill grid */}
          <div>
            <label style={labelStyle}>
              Setting register{setting ? '' : ' (default: mixed)'}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {SETTING_OPTIONS.map((s) => {
                const on = setting === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSettingClick(s.id)}
                    title={s.hint}
                    style={{
                      padding: '0.4rem 0.7rem',
                      fontSize: '0.7rem',
                      fontFamily: 'inherit',
                      letterSpacing: '0.04em',
                      border: `1px solid ${on ? TYRIAN : 'var(--border)'}`,
                      background: on ? TYRIAN : 'transparent',
                      color: on ? '#fff' : 'var(--foreground)',
                      cursor: 'pointer',
                      borderRadius: 0,
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
            {setting && (
              <p
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--muted-foreground)',
                  fontStyle: 'italic',
                  fontFamily: '"Canela", serif',
                  marginTop: '0.4rem',
                  lineHeight: 1.55,
                }}
              >
                {SETTING_OPTIONS.find((s) => s.id === setting)?.hint}
              </p>
            )}
          </div>

          {/* Brief */}
          <div>
            <label style={labelStyle}>Brief (optional · 1-3 sentences anchoring who they are)</label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder={`e.g. "${character.name} is a Yoruba diviner who refuses to read for the wealthy. They live by the river. They are not afraid."`}
              style={{
                ...inputStyle,
                minHeight: '80px',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Field toggles */}
          <div>
            <label style={labelStyle}>Fields to forge</label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {ALL_FIELDS.map((f) => {
                const on = fields.has(f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleField(f)}
                    style={{
                      padding: '0.25rem 0.6rem',
                      fontSize: '0.6rem',
                      fontFamily: 'monospace',
                      letterSpacing: '0.18em',
                      textTransform: 'lowercase',
                      border: `1px solid ${on ? TYRIAN : 'var(--border)'}`,
                      background: on ? TYRIAN : 'transparent',
                      color: on ? '#fff' : 'var(--muted-foreground)',
                      cursor: 'pointer',
                      borderRadius: 0,
                    }}
                  >
                    {FIELD_LABELS[f]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Forge buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
            <button
              type="button"
              onClick={forge}
              disabled={loading || fields.size === 0}
              style={primaryButtonStyle(loading)}
            >
              {loading ? 'forging.' : 'forge preview'}
            </button>
            {draft && (
              <button
                type="button"
                onClick={applyAll}
                disabled={applying === 'all'}
                style={{
                  ...primaryButtonStyle(applying === 'all'),
                  background: 'transparent',
                  color: TYRIAN,
                }}
              >
                {applying === 'all' ? 'applying.' : 'apply all'}
              </button>
            )}
          </div>

          {skipped.length > 0 && (
            <div style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)' }}>
              Skipped (locked): {skipped.join(', ')}
            </div>
          )}

          {/* Draft preview */}
          {draft && (
            <div
              style={{
                marginTop: '0.5rem',
                border: '1px solid var(--border)',
                background: 'rgba(102,2,60,0.04)',
              }}
            >
              {draft.bio !== undefined && (
                <DraftRow
                  field="bio"
                  label="Bio"
                  body={draft.bio}
                  onApply={() => applyField('bio')}
                  applying={applying === 'bio'}
                />
              )}
              {draft.backstory !== undefined && (
                <DraftRow
                  field="backstory"
                  label="Backstory"
                  body={draft.backstory}
                  onApply={() => applyField('backstory')}
                  applying={applying === 'backstory'}
                />
              )}
              {draft.aliases !== undefined && (
                <DraftRow
                  field="aliases"
                  label="Aliases"
                  body={draft.aliases.join(' · ')}
                  onApply={() => applyField('aliases')}
                  applying={applying === 'aliases'}
                />
              )}
              {draft.personaTags !== undefined && (
                <DraftRow
                  field="personaTags"
                  label="Tags"
                  body={draft.personaTags.join(' · ')}
                  onApply={() => applyField('personaTags')}
                  applying={applying === 'personaTags'}
                />
              )}
              {draft.goals !== undefined && (
                <DraftRow
                  field="goals"
                  label="Goals"
                  body={draft.goals.map((g, i) => `0${i + 1} ${g}`).join('\n')}
                  onApply={() => applyField('goals')}
                  applying={applying === 'goals'}
                />
              )}
              {draft.tongue !== undefined && (
                <DraftRow
                  field="tongue"
                  label="Tongue"
                  body={[
                    draft.tongue.primaryLanguage && `Language: ${draft.tongue.primaryLanguage}`,
                    draft.tongue.dialect && `Dialect: ${draft.tongue.dialect}`,
                    draft.tongue.accent && `Accent: ${draft.tongue.accent}`,
                    draft.tongue.idioms && draft.tongue.idioms.length > 0
                      ? `Idioms: ${draft.tongue.idioms.join(' · ')}`
                      : null,
                    draft.tongue.registerNotes && `Register: ${draft.tongue.registerNotes}`,
                  ]
                    .filter(Boolean)
                    .join('\n')}
                  onApply={() => applyField('tongue')}
                  applying={applying === 'tongue'}
                />
              )}
            </div>
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
  padding: '0.4rem 0.55rem',
  fontSize: '0.78rem',
  background: '#000',
  color: 'var(--foreground)',
  border: '1px solid var(--border)',
  borderRadius: 0,
  outline: 'none',
};

const primaryButtonStyle = (loading: boolean): React.CSSProperties => ({
  padding: '0.4rem 0.85rem',
  border: `1px solid ${TYRIAN}`,
  background: TYRIAN,
  color: '#fff',
  fontSize: '0.65rem',
  fontFamily: 'monospace',
  letterSpacing: '0.2em',
  textTransform: 'lowercase',
  cursor: loading ? 'wait' : 'pointer',
  borderRadius: 0,
});

function DraftRow({
  label,
  body,
  onApply,
  applying,
}: {
  field: string;
  label: string;
  body: string;
  onApply: () => void;
  applying: boolean;
}) {
  return (
    <article
      style={{
        padding: '1.5rem 1.4rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <h3
          style={{
            fontFamily: '"Canela", serif',
            fontWeight: 300,
            fontSize: '1.1rem',
            color: 'var(--foreground)',
            margin: 0,
            letterSpacing: '0.005em',
          }}
        >
          {label}
        </h3>
        <button
          type="button"
          onClick={onApply}
          disabled={applying}
          style={{
            padding: '0.35rem 0.85rem',
            border: `1px solid ${TYRIAN}`,
            background: 'transparent',
            color: TYRIAN,
            fontSize: '0.6rem',
            fontFamily: 'monospace',
            letterSpacing: '0.22em',
            textTransform: 'lowercase',
            cursor: applying ? 'wait' : 'pointer',
            borderRadius: 0,
            flexShrink: 0,
          }}
        >
          {applying ? 'applying.' : 'apply'}
        </button>
      </header>
      <div
        style={{
          fontSize: '0.92rem',
          lineHeight: 1.7,
          color: 'var(--foreground)',
          whiteSpace: 'pre-wrap',
          maxWidth: '60ch',
        }}
      >
        {body}
      </div>
    </article>
  );
}
