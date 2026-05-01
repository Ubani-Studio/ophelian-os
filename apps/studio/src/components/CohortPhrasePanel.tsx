'use client';

/**
 * CohortPhrasePanel · the slang MOAT review surface.
 *
 * Per docs/slang-cohort.md the cohort is language-source not
 * language-consumer. This panel is where extracted phrasings get
 * reviewed and promoted from "proposed" (LLM surfaced it from
 * voice samples) to "active" (visible to embrace lists in tick +
 * realign system prompts), eventually "promoted" (write-back to
 * Ibis frontier zone, deferred).
 *
 * One-click flow:
 *   1. Extract → LLM scans voice samples, persists candidates.
 *   2. Review → status pill, gloss, source quote.
 *   3. Promote → proposed → active.
 *   4. Revoke → right-to-forget per Vaulted rights envelope.
 */

import { useEffect, useState } from 'react';
import {
  listCohortPhrases,
  extractCohortPhrases,
  updateCohortPhrase,
  type Character,
  type CohortPhrase,
  type CohortPhraseStatus,
} from '@/lib/api';

const TYRIAN = '#66023C';

const STATUS_COLOURS: Record<CohortPhraseStatus, { bg: string; fg: string; label: string }> = {
  proposed: { bg: '#1a1a1a', fg: '#aaa', label: 'proposed' },
  active: { bg: TYRIAN, fg: '#fff', label: 'active' },
  promoted: { bg: '#0a3d2a', fg: '#9be3c1', label: 'promoted' },
  revoked: { bg: '#222', fg: '#666', label: 'revoked' },
};

export function CohortPhrasePanel({ character }: { character: Character }) {
  const [open, setOpen] = useState(false);
  const [phrases, setPhrases] = useState<CohortPhrase[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listCohortPhrases(character.id);
      setPhrases(res.phrases);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load phrases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) void refresh();
  }, [open, character.id]);

  const onExtract = async () => {
    setExtracting(true);
    setError(null);
    setInfo(null);
    try {
      const res = await extractCohortPhrases(character.id);
      if (res.reason === 'no-samples') {
        setInfo('No voice samples yet. Add some in the Voice panel first.');
      } else if (res.reason === 'llm-unavailable') {
        setInfo('LLM not configured.');
      } else if (res.reason === 'none-found') {
        setInfo('No cohort-rooted phrasings detected. Samples may be too generic.');
      } else {
        setInfo(`Extracted ${res.extracted} candidate${res.extracted === 1 ? '' : 's'}.`);
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Extraction failed');
    } finally {
      setExtracting(false);
    }
  };

  const onSetStatus = async (id: string, status: CohortPhraseStatus) => {
    try {
      const updated = await updateCohortPhrase(id, { status });
      setPhrases((rows) => rows.map((r) => (r.id === id ? updated : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Status update failed');
    }
  };

  const proposedCount = phrases.filter((p) => p.status === 'proposed').length;
  const activeCount = phrases.filter((p) => p.status === 'active').length;
  const hasContent = phrases.length > 0;

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
          Cohort phrases · slang moat
          {hasContent && (
            <span
              style={{
                width: '0.4rem',
                height: '0.4rem',
                background: TYRIAN,
                display: 'inline-block',
              }}
              title={`${activeCount} active, ${proposedCount} pending review`}
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
            Cohort-rooted phrasings extracted from this character&apos;s voice samples.
            Active phrases surface in tick and realign prompts as embrace candidates.
            Public-LLM signatures are refused via Ibis automatically; this is the
            inverse half of the moat.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onExtract}
              disabled={extracting}
              style={{
                padding: '0.4rem 0.8rem',
                fontSize: '0.65rem',
                fontFamily: 'monospace',
                letterSpacing: '0.08em',
                border: `1px solid ${TYRIAN}`,
                background: extracting ? 'transparent' : TYRIAN,
                color: extracting ? TYRIAN : '#fff',
                cursor: extracting ? 'wait' : 'pointer',
                borderRadius: 0,
              }}
            >
              {extracting ? 'extracting…' : 'Extract from voice samples'}
            </button>
            {loading && (
              <span style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
                loading…
              </span>
            )}
          </div>

          {info && (
            <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', fontFamily: 'monospace', margin: 0 }}>
              {info}
            </p>
          )}
          {error && (
            <p style={{ fontSize: '0.7rem', color: '#c44', fontFamily: 'monospace', margin: 0 }}>
              {error}
            </p>
          )}

          {phrases.length === 0 && !loading && (
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontStyle: 'italic', margin: 0 }}>
              No phrases yet. Run extract once voice samples are saved.
            </p>
          )}

          {phrases.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {phrases.map((p) => {
                const c = STATUS_COLOURS[p.status];
                return (
                  <li
                    key={p.id}
                    style={{
                      border: '1px solid var(--border)',
                      padding: '0.6rem 0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div style={{ fontFamily: '"Canela", serif', fontSize: '0.95rem', lineHeight: 1.3 }}>
                        {p.phrase}
                      </div>
                      <span
                        style={{
                          padding: '0.15rem 0.45rem',
                          fontSize: '0.55rem',
                          fontFamily: 'monospace',
                          letterSpacing: '0.1em',
                          background: c.bg,
                          color: c.fg,
                          flexShrink: 0,
                        }}
                      >
                        {c.label}
                        {p.useCount > 0 && p.status === 'active' ? ` · ${p.useCount}` : ''}
                      </span>
                    </div>

                    {p.gloss && (
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--muted-foreground)',
                          fontStyle: 'italic',
                          lineHeight: 1.5,
                        }}
                      >
                        {p.gloss}
                      </div>
                    )}

                    {p.sourceQuote && (
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--muted-foreground)',
                          fontFamily: 'monospace',
                          borderLeft: '2px solid var(--border)',
                          paddingLeft: '0.5rem',
                        }}
                      >
                        “{p.sourceQuote}”
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                      {p.status === 'proposed' && (
                        <>
                          <button
                            type="button"
                            onClick={() => onSetStatus(p.id, 'active')}
                            style={pillButton(TYRIAN, '#fff')}
                          >
                            promote → active
                          </button>
                          <button
                            type="button"
                            onClick={() => onSetStatus(p.id, 'revoked')}
                            style={pillButton('transparent', 'var(--muted-foreground)')}
                          >
                            revoke
                          </button>
                        </>
                      )}
                      {p.status === 'active' && (
                        <>
                          <button
                            type="button"
                            onClick={() => onSetStatus(p.id, 'proposed')}
                            style={pillButton('transparent', 'var(--muted-foreground)')}
                          >
                            unpromote
                          </button>
                          <button
                            type="button"
                            onClick={() => onSetStatus(p.id, 'revoked')}
                            style={pillButton('transparent', 'var(--muted-foreground)')}
                          >
                            revoke
                          </button>
                        </>
                      )}
                      {p.status === 'revoked' && (
                        <button
                          type="button"
                          onClick={() => onSetStatus(p.id, 'proposed')}
                          style={pillButton('transparent', 'var(--muted-foreground)')}
                        >
                          restore
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function pillButton(bg: string, fg: string): React.CSSProperties {
  return {
    padding: '0.25rem 0.55rem',
    fontSize: '0.6rem',
    fontFamily: 'monospace',
    letterSpacing: '0.05em',
    border: '1px solid var(--border)',
    background: bg,
    color: fg,
    cursor: 'pointer',
    borderRadius: 0,
  };
}
