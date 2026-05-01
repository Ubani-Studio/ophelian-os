'use client';

/**
 * Trail · the morning ritual.
 *
 * Phase 4 of agentic-build.md. The user opens Bóveda in the
 * morning (or whenever) and reads what every espíritu / twin has
 * been up to since their last visit. Curate as you read: promote
 * worth-keeping events to canonical, demote noise back to
 * ephemeral, "mark all seen" footer to close the day's reading.
 *
 * The morning trail is the protest against feed-shaped social.
 * Curated, not accumulated. Bóveda's daily ritual.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { SovereigntyBadge } from '@/components/SovereigntyBadge';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5130';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'ophelian-dev-key-2026';
const TYRIAN = '#66023C';

interface TrailEvent {
  ts: string;
  edgeId: string;
  kind: string;
  summary: string;
  body?: string;
  retention: 'ephemeral' | 'canonical';
  rolled_back: boolean;
  counterpartId: string;
  counterpartName: string;
}

interface TrailCharacter {
  id: string;
  name: string;
  mode: string;
  avatarUrl: string | null;
  tizitaPersonaId: string | null;
  tizitaRepresentativeUrl: string | null;
  identity?: unknown;
  events: TrailEvent[];
}

interface TrailResponse {
  sinceTs: string;
  userId: string | null;
  userLastSeenAt: string | null;
  characters: TrailCharacter[];
  totalEvents: number;
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
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

function formatRelative(ts: string): string {
  const ms = Date.now() - new Date(ts).getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (ms < minute) return 'just now';
  if (ms < hour) return `${Math.floor(ms / minute)}m ago`;
  if (ms < day) return `${Math.floor(ms / hour)}h ago`;
  return `${Math.floor(ms / day)}d ago`;
}

function formatSinceWindow(sinceTs: string, lastSeenAt: string | null): string {
  const since = new Date(sinceTs);
  const ms = Date.now() - since.getTime();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  if (lastSeenAt) {
    if (ms < hour) return 'since you were last here, just now';
    if (ms < day) return `since you were last here, ${Math.floor(ms / hour)}h ago`;
    return `since you were last here, ${Math.floor(ms / day)}d ago`;
  }
  return 'in the last 24 hours';
}

export default function TrailPage() {
  const [data, setData] = useState<TrailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyEvent, setBusyEvent] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);
  const [tending, setTending] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<TrailResponse>('/trail');
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load trail');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleRetention = async (ev: TrailEvent, characterId: string) => {
    const next = ev.retention === 'canonical' ? 'ephemeral' : 'canonical';
    const key = `${ev.edgeId}|${ev.ts}`;
    setBusyEvent(key);
    try {
      await api(`/relationships/${ev.edgeId}/events/${encodeURIComponent(ev.ts)}`, {
        method: 'PATCH',
        body: JSON.stringify({ retention: next }),
      });
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          characters: prev.characters.map((c) =>
            c.id !== characterId
              ? c
              : {
                  ...c,
                  events: c.events.map((e) =>
                    e.ts === ev.ts && e.edgeId === ev.edgeId ? { ...e, retention: next } : e
                  ),
                }
          ),
        };
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setBusyEvent(null);
    }
  };

  const markAllSeen = async () => {
    setMarking(true);
    try {
      await api('/trail/mark-seen', { method: 'POST', body: JSON.stringify({}) });
      // Re-fetch the trail; events that were within the window before
      // mark-seen drop out, leaving an empty trail until new acts land.
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to mark seen');
    } finally {
      setMarking(false);
    }
  };

  // Tend a single character (manual tick). Absorbed from Altar so
  // Trail is the one place to read + act.
  const tendOne = async (characterId: string) => {
    setTending(characterId);
    setError(null);
    try {
      await api(`/characters/${characterId}/tick`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tend failed');
    } finally {
      setTending(null);
    }
  };

  // Fire one full scheduler pass (all autonomous characters) so the
  // world moves now without waiting for the cron.
  const tendAll = async () => {
    setTending('all');
    setError(null);
    try {
      await api('/scheduler/tick-pass', { method: 'POST', body: JSON.stringify({}) });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tend all failed');
    } finally {
      setTending(null);
    }
  };

  const summaryLine = useMemo(() => {
    if (!data) return '';
    if (data.totalEvents === 0) return 'no acts since you were last here';
    const charCount = data.characters.length;
    return `${data.totalEvents} act${data.totalEvents === 1 ? '' : 's'} across ${charCount} character${charCount === 1 ? '' : 's'}`;
  }, [data]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title">Trail</h1>
            {data && (
              <p
                style={{
                  marginTop: '0.5rem',
                  maxWidth: '60ch',
                  color: 'var(--muted-foreground)',
                  fontSize: '0.85rem',
                  lineHeight: 1.6,
                }}
              >
                What your espíritus and twins have been doing{' '}
                {formatSinceWindow(data.sinceTs, data.userLastSeenAt)}.
                {' '}
                {data.totalEvents > 0
                  ? 'Read the trail. Curate as you go. Mark seen when you\'re done.'
                  : 'The trail is quiet right now.'}
              </p>
            )}
            {data && (
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
                {summaryLine}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              style={{
                padding: '0.45rem 0.85rem',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--muted-foreground)',
                fontSize: '0.6rem',
                fontFamily: 'monospace',
                letterSpacing: '0.2em',
                textTransform: 'lowercase',
                cursor: loading ? 'wait' : 'pointer',
                borderRadius: 0,
              }}
            >
              refresh
            </button>
            <button
              type="button"
              onClick={tendAll}
              disabled={tending !== null}
              title="Run one tick for every autonomous character"
              style={{
                padding: '0.5rem 1rem',
                border: `1px solid ${TYRIAN}`,
                background: 'transparent',
                color: TYRIAN,
                fontSize: '0.65rem',
                fontFamily: 'monospace',
                letterSpacing: '0.22em',
                textTransform: 'lowercase',
                cursor: tending !== null ? 'wait' : 'pointer',
                opacity: tending !== null ? 0.5 : 1,
                borderRadius: 0,
              }}
            >
              {tending === 'all' ? 'tending.' : 'tend all'}
            </button>
            <button
              type="button"
              onClick={markAllSeen}
              disabled={marking || !data || data.totalEvents === 0}
              style={{
                padding: '0.5rem 1rem',
                border: `1px solid ${TYRIAN}`,
                background: TYRIAN,
                color: '#fff',
                fontSize: '0.65rem',
                fontFamily: 'monospace',
                letterSpacing: '0.22em',
                textTransform: 'lowercase',
                cursor: marking || !data || data.totalEvents === 0 ? 'not-allowed' : 'pointer',
                opacity: marking || !data || data.totalEvents === 0 ? 0.5 : 1,
                borderRadius: 0,
              }}
            >
              {marking ? 'marking.' : 'mark all seen'}
            </button>
          </div>
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
      ) : !data || data.characters.length === 0 ? (
        <div
          style={{
            marginTop: '2rem',
            padding: '2.5rem 2rem',
            border: '1px solid var(--border)',
            background: 'rgba(255,255,255,0.015)',
            textAlign: 'center',
            fontFamily: '"Canela", serif',
            fontStyle: 'italic',
            color: 'var(--muted-foreground)',
            fontSize: '0.95rem',
            lineHeight: 1.7,
          }}
        >
          The trail is quiet. No espíritu or twin has acted since you were
          last here. Click <em>tend all</em> above to fire one tick for
          every autonomous character, or wait for the scheduler to run.
        </div>
      ) : (
        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {data.characters.map((c) => (
            <CharacterCard
              key={c.id}
              character={c}
              busyEvent={busyEvent}
              onToggleRetention={(ev) => toggleRetention(ev, c.id)}
              onTend={() => tendOne(c.id)}
              tending={tending === c.id || tending === 'all'}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CharacterCard({
  character,
  busyEvent,
  onToggleRetention,
  onTend,
  tending,
}: {
  character: TrailCharacter;
  busyEvent: string | null;
  onToggleRetention: (ev: TrailEvent) => void;
  onTend: () => void;
  tending: boolean;
}) {
  return (
    <section
      style={{
        border: '1px solid var(--border)',
        background: 'rgba(255,255,255,0.015)',
      }}
    >
      <header
        style={{
          padding: '0.85rem 1.1rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '1px solid var(--border)',
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
            color: 'var(--muted-foreground)',
            flexShrink: 0,
          }}
        >
          {character.avatarUrl || character.tizitaRepresentativeUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={character.avatarUrl || character.tizitaRepresentativeUrl || ''}
              alt={character.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span>{character.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.55rem' }}>
            <Link
              href={`/characters/${character.id}`}
              style={{
                fontFamily: '"Canela", serif',
                fontWeight: 300,
                fontSize: '1.1rem',
                color: 'var(--foreground)',
                textDecoration: 'none',
              }}
            >
              {character.name}
            </Link>
            <span
              style={{
                fontSize: '0.5rem',
                fontFamily: 'monospace',
                letterSpacing: '0.24em',
                color: character.mode === 'twin' ? TYRIAN : 'var(--muted-foreground)',
                textTransform: 'lowercase',
              }}
            >
              {character.mode}
            </span>
            <SovereigntyBadge identity={character.identity} size="small" />
          </div>
          <div
            style={{
              fontSize: '0.55rem',
              fontFamily: 'monospace',
              letterSpacing: '0.22em',
              color: 'var(--muted-foreground)',
              textTransform: 'lowercase',
              marginTop: '0.2rem',
            }}
          >
            {character.events.length} act{character.events.length === 1 ? '' : 's'}
          </div>
        </div>
        <button
          type="button"
          onClick={onTend}
          disabled={tending}
          title="Run one tick now"
          style={{
            padding: '0.3rem 0.7rem',
            border: `1px solid ${TYRIAN}`,
            background: TYRIAN,
            color: '#fff',
            fontSize: '0.6rem',
            fontFamily: 'monospace',
            letterSpacing: '0.18em',
            textTransform: 'lowercase',
            cursor: tending ? 'wait' : 'pointer',
            borderRadius: 0,
            flexShrink: 0,
          }}
        >
          {tending ? '...' : 'tend'}
        </button>
      </header>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {character.events.map((ev) => {
          const key = `${ev.edgeId}|${ev.ts}`;
          const canonical = ev.retention === 'canonical';
          return (
            <li
              key={key}
              style={{
                padding: '0.85rem 1.1rem',
                borderBottom: '1px solid var(--border)',
                display: 'grid',
                gridTemplateColumns: '120px 1fr auto',
                gap: '0.85rem',
                alignItems: 'baseline',
              }}
            >
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.6rem',
                  letterSpacing: '0.12em',
                  color: 'var(--muted-foreground)',
                }}
                title={ev.ts}
              >
                {formatRelative(ev.ts)}
                <div style={{ marginTop: '0.15rem', textTransform: 'lowercase', opacity: 0.7 }}>
                  {ev.kind} · w/ {ev.counterpartName}
                </div>
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', lineHeight: 1.55, color: 'var(--foreground)' }}>
                  {ev.summary}
                </div>
                {ev.body && ev.body !== ev.summary && (
                  <div
                    style={{
                      fontSize: '0.75rem',
                      lineHeight: 1.6,
                      color: 'var(--muted-foreground)',
                      marginTop: '0.3rem',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {ev.body}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => onToggleRetention(ev)}
                disabled={busyEvent === key}
                title={canonical ? 'Canonical · click to demote' : 'Ephemeral · click to promote'}
                style={{
                  fontSize: '0.55rem',
                  fontFamily: 'monospace',
                  letterSpacing: '0.2em',
                  padding: '0.25rem 0.6rem',
                  border: `1px solid ${canonical ? TYRIAN : 'var(--border)'}`,
                  background: canonical ? TYRIAN : 'transparent',
                  color: canonical ? '#fff' : 'var(--muted-foreground)',
                  cursor: busyEvent === key ? 'wait' : 'pointer',
                  borderRadius: 0,
                  textTransform: 'lowercase',
                }}
              >
                {busyEvent === key ? '...' : canonical ? 'canonical' : 'ephemeral'}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
