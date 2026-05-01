'use client';

/**
 * Altar · the curated panel of espíritus + twins.
 *
 * Per agentic-build.md, the altar is curated rather than accumulated.
 * Each row shows one autonomous character, their last act, the time
 * since that act, and a tend button. "Tend all" runs ticks for every
 * row sequentially, respecting the per-character cooldown enforced
 * by the API. Throttle and budget refusals surface inline rather
 * than alert-shouting.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getCharacters, type Character } from '@/lib/api';
import { SovereigntyBadge } from '@/components/SovereigntyBadge';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5130';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'ophelian-dev-key-2026';
const TYRIAN = '#66023C';

interface TimelineEvent {
  ts: string;
  kind: string;
  summary: string;
  body?: string;
  retention: 'ephemeral' | 'canonical';
  rolled_back: boolean;
  counterpartId: string;
}

interface TickResult {
  decision: {
    kind: 'message' | 'thought' | 'noop';
    targetName?: string;
    summary: string;
    body?: string;
    source: 'anthropic' | 'stub';
  };
  entry?: { ts: string; summary: string };
}

interface AltarRow {
  character: Character;
  lastEvent: TimelineEvent | null;
  status: 'idle' | 'ticking' | 'throttled' | 'error';
  message?: string;
  body?: string;
  lastSource?: 'anthropic' | 'stub';
  expanded?: boolean;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    const e = new Error(err.error || `API error: ${res.status}`) as Error & { status?: number };
    e.status = res.status;
    throw e;
  }
  return res.json();
}

function formatAge(ts: string | null | undefined): string {
  if (!ts) return 'never';
  const ms = Date.now() - new Date(ts).getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (ms < minute) return 'just now';
  if (ms < hour) return `${Math.floor(ms / minute)}m`;
  if (ms < day) return `${Math.floor(ms / hour)}h`;
  if (ms < 30 * day) return `${Math.floor(ms / day)}d`;
  return `${Math.floor(ms / (30 * day))}mo`;
}

export default function AltarPage() {
  const [rows, setRows] = useState<AltarRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tendingAll, setTendingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await getCharacters();
      const autonomous = all.filter((c) => c.mode === 'espíritu' || c.mode === 'twin');

      const rowData = await Promise.all(
        autonomous.map(async (c): Promise<AltarRow> => {
          try {
            const events = await api<TimelineEvent[]>(`/characters/${c.id}/events?limit=1`);
            return { character: c, lastEvent: events[0] ?? null, status: 'idle' };
          } catch {
            return { character: c, lastEvent: null, status: 'idle' };
          }
        })
      );

      rowData.sort((a, b) => {
        const aTs = a.lastEvent?.ts ?? '';
        const bTs = b.lastEvent?.ts ?? '';
        return aTs < bTs ? 1 : aTs > bTs ? -1 : a.character.name.localeCompare(b.character.name);
      });
      setRows(rowData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load altar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tendOne = useCallback(async (id: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.character.id === id ? { ...r, status: 'ticking', message: undefined } : r
      )
    );
    try {
      const result = await api<TickResult>(`/characters/${id}/tick`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setRows((prev) =>
        prev.map((r) =>
          r.character.id === id
            ? {
                ...r,
                status: 'idle',
                message: result.decision.summary,
                body: result.decision.body,
                lastSource: result.decision.source,
                expanded: true,
              }
            : r
        )
      );
      // refresh just this row's last event
      try {
        const events = await api<TimelineEvent[]>(`/characters/${id}/events?limit=1`);
        setRows((prev) =>
          prev.map((r) => (r.character.id === id ? { ...r, lastEvent: events[0] ?? null } : r))
        );
      } catch {
        /* non-fatal */
      }
    } catch (e) {
      const status: AltarRow['status'] =
        (e as Error & { status?: number }).status === 429 ||
        (e as Error & { status?: number }).status === 402
          ? 'throttled'
          : 'error';
      setRows((prev) =>
        prev.map((r) =>
          r.character.id === id
            ? { ...r, status, message: e instanceof Error ? e.message : 'Failed' }
            : r
        )
      );
    }
  }, []);

  const tendAll = useCallback(async () => {
    setTendingAll(true);
    try {
      for (const r of rows) {
        await tendOne(r.character.id);
      }
    } finally {
      setTendingAll(false);
    }
  }, [rows, tendOne]);

  const counts = useMemo(() => {
    const espiritu = rows.filter((r) => r.character.mode === 'espíritu').length;
    const twin = rows.filter((r) => r.character.mode === 'twin').length;
    return { espiritu, twin };
  }, [rows]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title">Altar</h1>
            <p
              style={{
                marginTop: '0.5rem',
                maxWidth: '60ch',
                color: 'var(--muted-foreground)',
                fontSize: '0.85rem',
                lineHeight: 1.6,
              }}
            >
              The curated panel of espíritus and twins. The altar is curated, not
              accumulated — tend what's actually alive, retire what isn't.
            </p>
            <p
              style={{
                marginTop: '0.4rem',
                fontSize: '0.55rem',
                fontFamily: 'monospace',
                letterSpacing: '0.28em',
                color: 'var(--muted-foreground)',
                textTransform: 'lowercase',
              }}
            >
              {counts.espiritu} espíritu · {counts.twin} twin
            </p>
          </div>

          <button
            type="button"
            onClick={tendAll}
            disabled={tendingAll || rows.length === 0}
            style={{
              padding: '0.5rem 1rem',
              border: `1px solid ${TYRIAN}`,
              background: TYRIAN,
              color: '#fff',
              fontSize: '0.65rem',
              fontFamily: 'monospace',
              letterSpacing: '0.22em',
              textTransform: 'lowercase',
              cursor: tendingAll || rows.length === 0 ? 'not-allowed' : 'pointer',
              opacity: tendingAll || rows.length === 0 ? 0.5 : 1,
              borderRadius: 0,
            }}
          >
            {tendingAll ? 'tending.' : 'tend all'}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            border: '1px solid var(--error)',
            color: 'var(--error)',
            fontSize: '0.8rem',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ marginTop: '1.5rem', color: 'var(--muted-foreground)', fontSize: '0.8rem' }}>
          Loading.
        </p>
      ) : rows.length === 0 ? (
        <div
          style={{
            marginTop: '2rem',
            padding: '2rem',
            border: '1px solid var(--border)',
            background: 'rgba(255,255,255,0.015)',
            textAlign: 'center',
            fontFamily: '"Canela", serif',
            fontStyle: 'italic',
            color: 'var(--muted-foreground)',
            lineHeight: 1.6,
          }}
        >
          No espíritus or twins yet. Set a character's mode to <em>espíritu</em> or
          <em> twin</em> to bring them onto the altar.
        </div>
      ) : (
        <ul
          style={{
            marginTop: '1.5rem',
            listStyle: 'none',
            padding: 0,
            border: '1px solid var(--border)',
            background: 'rgba(255,255,255,0.015)',
          }}
        >
          {rows.map((r) => (
            <li
              key={r.character.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr auto auto',
                gap: '1rem',
                padding: '0.85rem 1rem',
                borderBottom: '1px solid var(--border)',
                alignItems: 'start',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  background: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  color: 'var(--muted-foreground)',
                }}
              >
                {r.character.avatarUrl || r.character.tizitaRepresentativeUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.character.avatarUrl || r.character.tizitaRepresentativeUrl || ''}
                    alt={r.character.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span>{r.character.name.charAt(0).toUpperCase()}</span>
                )}
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.55rem', marginBottom: '0.15rem' }}>
                  <Link
                    href={`/characters/${r.character.id}`}
                    style={{
                      fontFamily: '"Canela", serif',
                      fontWeight: 300,
                      fontSize: '1.05rem',
                      color: 'var(--foreground)',
                      textDecoration: 'none',
                      borderBottom: '1px solid transparent',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
                  >
                    {r.character.name}
                  </Link>
                  <span
                    style={{
                      fontSize: '0.5rem',
                      fontFamily: 'monospace',
                      letterSpacing: '0.24em',
                      color: r.character.mode === 'twin' ? TYRIAN : 'var(--muted-foreground)',
                      textTransform: 'lowercase',
                    }}
                  >
                    {r.character.mode}
                  </span>
                  <SovereigntyBadge identity={r.character.identity} size="small" />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setRows((prev) =>
                      prev.map((row) =>
                        row.character.id === r.character.id
                          ? { ...row, expanded: !row.expanded }
                          : row
                      )
                    )
                  }
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    color: 'var(--muted-foreground)',
                    fontSize: '0.72rem',
                    lineHeight: 1.5,
                    textAlign: 'left',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                  title="Click to toggle full body"
                >
                  {r.message ?? r.lastEvent?.summary ?? 'no acts yet'}
                </button>
                {r.expanded && (r.body || r.lastEvent?.body) && (
                  <div
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.55rem 0.7rem',
                      border: '1px solid var(--border)',
                      background: 'rgba(102,2,60,0.04)',
                      fontSize: '0.72rem',
                      lineHeight: 1.55,
                      color: 'var(--foreground)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {r.body || r.lastEvent?.body}
                  </div>
                )}
                <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.85rem', alignItems: 'baseline' }}>
                  <Link
                    href={`/characters/${r.character.id}`}
                    style={{
                      fontSize: '0.55rem',
                      fontFamily: 'monospace',
                      letterSpacing: '0.22em',
                      color: 'var(--muted-foreground)',
                      textDecoration: 'none',
                      borderBottom: '1px solid transparent',
                      textTransform: 'lowercase',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = TYRIAN)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
                  >
                    open timeline →
                  </Link>
                </div>
              </div>

              <div
                style={{
                  fontSize: '0.55rem',
                  fontFamily: 'monospace',
                  letterSpacing: '0.18em',
                  color: 'var(--muted-foreground)',
                  textTransform: 'lowercase',
                  textAlign: 'right',
                }}
              >
                {formatAge(r.lastEvent?.ts)}
                {r.lastSource && (
                  <div style={{ marginTop: '0.15rem', color: r.lastSource === 'stub' ? 'var(--muted-foreground)' : TYRIAN }}>
                    {r.lastSource === 'stub' ? 'stub' : 'live'}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => tendOne(r.character.id)}
                disabled={r.status === 'ticking'}
                title={
                  r.status === 'throttled'
                    ? r.message
                    : r.status === 'error'
                    ? r.message
                    : 'Run one tick'
                }
                style={{
                  padding: '0.3rem 0.7rem',
                  border: `1px solid ${r.status === 'error' ? 'var(--error)' : r.status === 'throttled' ? 'var(--border)' : TYRIAN}`,
                  background: r.status === 'error' || r.status === 'throttled' ? 'transparent' : TYRIAN,
                  color: r.status === 'error' ? 'var(--error)' : r.status === 'throttled' ? 'var(--muted-foreground)' : '#fff',
                  fontSize: '0.6rem',
                  fontFamily: 'monospace',
                  letterSpacing: '0.18em',
                  textTransform: 'lowercase',
                  cursor: r.status === 'ticking' ? 'wait' : 'pointer',
                  borderRadius: 0,
                  minWidth: 70,
                }}
              >
                {r.status === 'ticking' ? '...' : r.status === 'throttled' ? 'wait' : r.status === 'error' ? 'retry' : 'tend'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
