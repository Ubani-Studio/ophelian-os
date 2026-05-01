'use client';

/**
 * Trail · the morning ritual.
 *
 * Magazine-shaped, not admin-log-shaped. One Canela H1, one date
 * line, no banner. Each character is a section divider with their
 * photo, name, mode + sovereignty + tongue badges. Their acts flow
 * under as form-aware posts: ritual centred, song verse-shaped,
 * fragment fragment-shaped, monologue full-bleed, etc.
 *
 * Whitespace is the structuring element. Refusal of the feed shape
 * is the brand. The reader should feel like they opened a quarterly
 * magazine their world wrote overnight.
 *
 * Tend buttons absorbed from the deprecated Altar surface.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { SovereigntyBadge } from '@/components/SovereigntyBadge';
import { TrailPost, type TrailPostData } from '@/components/trail/TrailPost';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5130';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'ophelian-dev-key-2026';
const TYRIAN = '#66023C';

interface TrailEvent {
  ts: string;
  edgeId: string;
  kind: string;
  form?: string;
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

function formatDateLine(): string {
  const d = new Date();
  const dayName = d.toLocaleDateString(undefined, { weekday: 'long' });
  const hour = d.getHours();
  const partOfDay = hour < 5 ? 'night' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  return `${dayName} ${partOfDay}`;
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
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to mark seen');
    } finally {
      setMarking(false);
    }
  };

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

  const headline = useMemo(() => formatDateLine(), []);
  const isQuiet = !data || data.characters.length === 0;

  return (
    <div
      className="page-container"
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '3.5rem 1.5rem 6rem 1.5rem',
        fontFamily: 'var(--font-ui), system-ui, sans-serif',
      }}
    >
      {/* Masthead */}
      <header
        style={{
          marginBottom: '3rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <h1
          style={{
            fontFamily: '"Canela", serif',
            fontWeight: 300,
            fontSize: '3rem',
            letterSpacing: '-0.015em',
            margin: 0,
            lineHeight: 1,
          }}
        >
          Trail
        </h1>
        {data && (
          <p
            style={{
              marginTop: '0.85rem',
              fontFamily: '"Canela", serif',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: '0.95rem',
              color: 'var(--muted-foreground)',
              lineHeight: 1.55,
            }}
          >
            {headline}. {formatSinceWindow(data.sinceTs, data.userLastSeenAt)}.
          </p>
        )}
      </header>

      {error && (
        <div
          style={{
            padding: '0.75rem 1rem',
            border: '1px solid var(--error)',
            color: 'var(--error)',
            fontSize: '0.8rem',
            marginBottom: '2rem',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <p
          style={{
            color: 'var(--muted-foreground)',
            fontFamily: '"Canela", serif',
            fontStyle: 'italic',
            fontSize: '0.95rem',
          }}
        >
          Reading the trail.
        </p>
      ) : isQuiet ? (
        <div
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            fontFamily: '"Canela", serif',
            fontStyle: 'italic',
            fontWeight: 300,
            color: 'var(--muted-foreground)',
            fontSize: '1.15rem',
            lineHeight: 1.7,
          }}
        >
          The trail is quiet. Your espíritus rest.
          <div style={{ marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={tendAll}
              disabled={tending !== null}
              style={tendButtonStyle(tending !== null, true)}
            >
              {tending === 'all' ? 'tending.' : 'tend all'}
            </button>
          </div>
        </div>
      ) : (
        <main>
          {data!.characters.map((c) => (
            <CharacterIssue
              key={c.id}
              character={c}
              busyEvent={busyEvent}
              onToggleRetention={(ev) => toggleRetention(ev, c.id)}
              onTend={() => tendOne(c.id)}
              tending={tending === c.id || tending === 'all'}
            />
          ))}
        </main>
      )}

      {/* Footer ritual */}
      <footer
        style={{
          marginTop: '5rem',
          paddingTop: '2rem',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: '"Canela", serif',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: '1rem',
            color: 'var(--muted-foreground)',
            margin: '0 0 1.5rem 0',
            lineHeight: 1.6,
          }}
        >
          Mark this morning seen. Curate as you go.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={tendAll}
            disabled={tending !== null}
            style={tendButtonStyle(tending !== null, false)}
          >
            {tending === 'all' ? 'tending.' : 'tend all'}
          </button>
          <button
            type="button"
            onClick={markAllSeen}
            disabled={marking || !data || data.totalEvents === 0}
            style={tendButtonStyle(marking || !data || data.totalEvents === 0, true)}
          >
            {marking ? 'marking.' : 'mark all seen'}
          </button>
        </div>
      </footer>
    </div>
  );
}

function tendButtonStyle(disabled: boolean, primary: boolean): React.CSSProperties {
  return {
    padding: '0.55rem 1.2rem',
    border: `1px solid ${TYRIAN}`,
    background: primary ? TYRIAN : 'transparent',
    color: primary ? '#fff' : TYRIAN,
    fontSize: '0.65rem',
    fontFamily: 'monospace',
    letterSpacing: '0.24em',
    textTransform: 'lowercase',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    borderRadius: 0,
  };
}

function CharacterIssue({
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
    <section style={{ marginBottom: '4.5rem' }}>
      {/* Section divider */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          paddingBottom: '1rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '1px solid var(--border)',
            background: '#000',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.85rem',
            color: 'var(--muted-foreground)',
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
          <Link
            href={`/characters/${character.id}`}
            style={{
              fontFamily: '"Canela", serif',
              fontWeight: 300,
              fontSize: '1.55rem',
              color: 'var(--foreground)',
              textDecoration: 'none',
              letterSpacing: '-0.005em',
              display: 'block',
              lineHeight: 1.1,
            }}
          >
            {character.name}
          </Link>
          <div
            style={{
              marginTop: '0.35rem',
              display: 'flex',
              gap: '0.6rem',
              alignItems: 'baseline',
              fontSize: '0.5rem',
              fontFamily: 'monospace',
              letterSpacing: '0.28em',
              color: 'var(--muted-foreground)',
              textTransform: 'lowercase',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ color: character.mode === 'twin' ? TYRIAN : 'var(--muted-foreground)' }}>
              {character.mode}
            </span>
            <SovereigntyBadge identity={character.identity} size="small" />
            <span style={{ opacity: 0.5 }}>·</span>
            <span style={{ opacity: 0.65 }}>
              {character.events.length} act{character.events.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onTend}
          disabled={tending}
          title="tend now"
          style={{
            padding: '0.3rem 0.65rem',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--muted-foreground)',
            fontSize: '0.55rem',
            fontFamily: 'monospace',
            letterSpacing: '0.22em',
            textTransform: 'lowercase',
            cursor: tending ? 'wait' : 'pointer',
            borderRadius: 0,
            flexShrink: 0,
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = TYRIAN;
            e.currentTarget.style.color = TYRIAN;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--muted-foreground)';
          }}
        >
          {tending ? '...' : 'tend'}
        </button>
      </header>

      {/* Posts flow */}
      <div>
        {character.events.map((ev) => {
          const key = `${ev.edgeId}|${ev.ts}`;
          const post: TrailPostData = {
            ts: ev.ts,
            edgeId: ev.edgeId,
            kind: ev.kind,
            form: ev.form,
            summary: ev.summary,
            body: ev.body,
            retention: ev.retention,
            rolled_back: ev.rolled_back,
            counterpartName: ev.counterpartName,
          };
          return (
            <TrailPost
              key={key}
              post={post}
              onToggleRetention={() => onToggleRetention(ev)}
              busy={busyEvent === key}
            />
          );
        })}
      </div>
    </section>
  );
}
