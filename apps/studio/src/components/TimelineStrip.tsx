'use client';

/**
 * TimelineStrip · memory tending surface for a Character.
 *
 * Phase 2 of agentic-build.md. Each event lives on a
 * CharacterRelationship.eventLog and carries a retention flag.
 * Ephemeral events auto-prune after 90 days; canonical persists.
 * The bóveda altar is curated, not accumulated.
 *
 * Interactions:
 *  - Click the retention pill to toggle ephemeral / canonical
 *  - Click the row checkbox to mark a span (two endpoints) and
 *    crystallise into a single canonical entry. The contributing
 *    rows stay in the log marked rolled_back so the compression
 *    is auditable.
 *  - "+" button appends a new manual entry (defaults to ephemeral).
 */

import { useEffect, useMemo, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5130';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'ophelian-dev-key-2026';

const TYRIAN = '#66023C';

type EventKind = 'conversation' | 'deed' | 'thought' | 'ritual';
type Retention = 'ephemeral' | 'canonical';

interface TimelineEvent {
  ts: string;
  actors: string[];
  kind: EventKind;
  summary: string;
  body?: string;
  retention: Retention;
  rolled_back: boolean;
  edgeId: string;
  counterpartId: string;
}

interface CounterpartLite {
  id: string;
  name: string;
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(err.message || `API error: ${res.status}`);
  }
  return res.json();
}

function formatTs(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toISOString().slice(0, 10);
}

function relativeAge(ts: string): string {
  const ms = Date.now() - new Date(ts).getTime();
  const day = 24 * 60 * 60 * 1000;
  if (ms < day) return 'today';
  const days = Math.floor(ms / day);
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
}

const KIND_LABEL: Record<EventKind, string> = {
  conversation: 'conversation',
  deed: 'deed',
  thought: 'thought',
  ritual: 'ritual',
};

export function TimelineStrip({
  characterId,
  characterName,
  refreshKey,
}: {
  characterId: string;
  characterName: string;
  refreshKey?: number;
}) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [counterparts, setCounterparts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeRolledBack, setIncludeRolledBack] = useState(false);
  const [selectedTs, setSelectedTs] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const list = await apiFetch<TimelineEvent[]>(
        `/characters/${characterId}/events?includeRolledBack=${includeRolledBack}&limit=200`
      );
      setEvents(list);

      const counterpartIds = Array.from(new Set(list.map((e) => e.counterpartId).filter(Boolean)));
      const fetched: Record<string, string> = {};
      await Promise.all(
        counterpartIds.map(async (cid) => {
          try {
            const c = await apiFetch<CounterpartLite>(`/characters/${cid}`);
            fetched[cid] = c.name;
          } catch {
            fetched[cid] = cid.slice(0, 6);
          }
        })
      );
      setCounterparts(fetched);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [characterId, includeRolledBack, refreshKey]);

  const sortedSelected = useMemo(
    () => Array.from(selectedTs).sort(),
    [selectedTs]
  );
  const canCrystallise = sortedSelected.length === 2;

  const toggleRetention = async (ev: TimelineEvent) => {
    const next: Retention = ev.retention === 'canonical' ? 'ephemeral' : 'canonical';
    setBusy(ev.ts);
    try {
      await apiFetch(`/relationships/${ev.edgeId}/events/${encodeURIComponent(ev.ts)}`, {
        method: 'PATCH',
        body: JSON.stringify({ retention: next }),
      });
      setEvents((prev) =>
        prev.map((e) => (e.ts === ev.ts && e.edgeId === ev.edgeId ? { ...e, retention: next } : e))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setBusy(null);
    }
  };

  const toggleSelect = (ts: string) => {
    setSelectedTs((prev) => {
      const next = new Set(prev);
      if (next.has(ts)) next.delete(ts);
      else next.add(ts);
      return next;
    });
  };

  const crystalliseSpan = async () => {
    if (!canCrystallise) return;
    const summary = window.prompt(
      'One-line summary for the crystallised memory:',
      `${characterName} · summarised span`
    );
    if (!summary) return;

    const [fromTs, toTs] = sortedSelected;
    const span = events.filter(
      (e) => e.ts >= fromTs && e.ts <= toTs && !e.rolled_back
    );
    const edgeIds = Array.from(new Set(span.map((e) => e.edgeId)));
    if (edgeIds.length !== 1) {
      window.alert(
        `Crystallise requires events on a single relationship edge. Selection spans ${edgeIds.length}.`
      );
      return;
    }

    setBusy('crystallise');
    try {
      await apiFetch(`/relationships/${edgeIds[0]}/events/crystallise`, {
        method: 'POST',
        body: JSON.stringify({ fromTs, toTs, summary }),
      });
      setSelectedTs(new Set());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to crystallise');
    } finally {
      setBusy(null);
    }
  };

  const addManualEvent = async () => {
    const summary = window.prompt('Event summary:');
    if (!summary) return;
    const counterpartName = window.prompt(
      'Counterpart name (existing character) or blank for self-thought:',
      ''
    );

    setAdding(true);
    try {
      let edgeId: string | null = null;
      let actors: string[] = [characterId];

      if (counterpartName && counterpartName.trim()) {
        const all = await apiFetch<Array<{ id: string; name: string }>>(`/characters`);
        const counterpart = all.find(
          (c) => c.name.toLowerCase() === counterpartName.trim().toLowerCase()
        );
        if (!counterpart) {
          window.alert(`No character named "${counterpartName}".`);
          return;
        }
        actors = [characterId, counterpart.id];

        const edges = await apiFetch<Array<{ id: string; sourceCharacterId: string; targetCharacterId: string }>>(
          `/relationships?characterId=${characterId}`
        );
        const edge = edges.find(
          (e) =>
            (e.sourceCharacterId === characterId && e.targetCharacterId === counterpart.id) ||
            (e.targetCharacterId === characterId && e.sourceCharacterId === counterpart.id)
        );
        if (edge) {
          edgeId = edge.id;
        } else {
          const created = await apiFetch<{ id: string }>(`/relationships`, {
            method: 'POST',
            body: JSON.stringify({
              sourceCharacterId: characterId,
              targetCharacterId: counterpart.id,
              relationshipType: 'CUSTOM',
              lore: '',
            }),
          });
          edgeId = created.id;
        }
      } else {
        const edges = await apiFetch<Array<{ id: string }>>(
          `/relationships?characterId=${characterId}`
        );
        if (edges.length === 0) {
          window.alert(
            'Self-thoughts need at least one existing relationship to anchor to. Add a counterpart name.'
          );
          return;
        }
        edgeId = edges[0].id;
      }

      await apiFetch(`/relationships/${edgeId}/events`, {
        method: 'POST',
        body: JSON.stringify({
          actors,
          kind: actors.length > 1 ? 'conversation' : 'thought',
          summary,
          retention: 'ephemeral',
        }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add event');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      style={{
        marginTop: '1rem',
        border: '1px solid var(--border)',
        background: 'rgba(255,255,255,0.015)',
      }}
    >
      <div
        style={{
          padding: '0.85rem 1rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem' }}>
          <span
            style={{
              fontFamily: '"Canela", serif',
              fontWeight: 300,
              fontSize: '1rem',
              color: 'var(--foreground)',
            }}
          >
            Timeline
          </span>
          <span
            style={{
              fontSize: '0.5rem',
              letterSpacing: '0.3em',
              fontFamily: 'monospace',
              color: 'var(--muted-foreground)',
            }}
          >
            memory · ephemeral 90d / canonical kept
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label
            style={{
              fontSize: '0.65rem',
              color: 'var(--muted-foreground)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer',
              fontFamily: 'monospace',
              letterSpacing: '0.08em',
            }}
          >
            <input
              type="checkbox"
              checked={includeRolledBack}
              onChange={(e) => setIncludeRolledBack(e.target.checked)}
            />
            show rolled-back
          </label>
          <button
            type="button"
            onClick={addManualEvent}
            disabled={adding}
            title="Add event"
            style={{
              width: '1.5rem',
              height: '1.5rem',
              border: '1px solid var(--muted-foreground)',
              background: 'transparent',
              color: 'var(--muted-foreground)',
              cursor: adding ? 'wait' : 'pointer',
              fontSize: '0.85rem',
              borderRadius: 0,
            }}
          >
            +
          </button>
          <button
            type="button"
            onClick={crystalliseSpan}
            disabled={!canCrystallise || busy === 'crystallise'}
            title="Crystallise selected span into a single canonical memory"
            style={{
              padding: '0.25rem 0.6rem',
              border: `1px solid ${canCrystallise ? TYRIAN : 'var(--border)'}`,
              background: canCrystallise ? TYRIAN : 'transparent',
              color: canCrystallise ? '#fff' : 'var(--muted-foreground)',
              fontSize: '0.65rem',
              fontFamily: 'monospace',
              letterSpacing: '0.12em',
              cursor: canCrystallise ? 'pointer' : 'not-allowed',
              borderRadius: 0,
              opacity: canCrystallise ? 1 : 0.5,
            }}
          >
            {busy === 'crystallise' ? '...' : 'crystallise'}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '0.75rem 1rem',
            color: 'var(--error)',
            fontSize: '0.75rem',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
          Loading.
        </div>
      ) : events.length === 0 ? (
        <div
          style={{
            padding: '1.25rem 1rem',
            fontFamily: '"Canela", serif',
            fontStyle: 'italic',
            fontSize: '0.85rem',
            color: 'var(--muted-foreground)',
            textAlign: 'center',
            lineHeight: 1.6,
          }}
        >
          No tended memories yet. {characterName} has not yet acted, spoken, or
          been spoken to.
        </div>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {events.map((ev) => {
            const selected = selectedTs.has(ev.ts);
            const canonical = ev.retention === 'canonical';
            const counterpartName = counterparts[ev.counterpartId] || ev.counterpartId.slice(0, 6);
            return (
              <li
                key={`${ev.edgeId}-${ev.ts}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '24px 90px 1fr auto',
                  gap: '0.75rem',
                  padding: '0.7rem 1rem',
                  borderBottom: '1px solid var(--border)',
                  alignItems: 'baseline',
                  background: selected ? 'rgba(102,2,60,0.08)' : 'transparent',
                  opacity: ev.rolled_back ? 0.45 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleSelect(ev.ts)}
                  title="Mark as span endpoint"
                />
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.65rem',
                    color: 'var(--muted-foreground)',
                    letterSpacing: '0.04em',
                  }}
                  title={ev.ts}
                >
                  {formatTs(ev.ts)} · {relativeAge(ev.ts)}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--muted-foreground)',
                      fontFamily: 'monospace',
                      letterSpacing: '0.12em',
                      marginBottom: '0.2rem',
                      textTransform: 'lowercase',
                    }}
                  >
                    {KIND_LABEL[ev.kind]} · with {counterpartName}
                    {ev.rolled_back ? ' · rolled-back' : ''}
                  </div>
                  <div style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>{ev.summary}</div>
                  {ev.body && ev.body !== ev.summary && (
                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--muted-foreground)',
                        lineHeight: 1.55,
                        marginTop: '0.25rem',
                      }}
                    >
                      {ev.body}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => toggleRetention(ev)}
                  disabled={busy === ev.ts || ev.rolled_back}
                  title={
                    canonical
                      ? 'Canonical · click to demote to ephemeral'
                      : 'Ephemeral · click to promote to canonical'
                  }
                  style={{
                    fontSize: '0.6rem',
                    fontFamily: 'monospace',
                    letterSpacing: '0.18em',
                    padding: '0.2rem 0.55rem',
                    border: `1px solid ${canonical ? TYRIAN : 'var(--border)'}`,
                    background: canonical ? TYRIAN : 'transparent',
                    color: canonical ? '#fff' : 'var(--muted-foreground)',
                    cursor: busy === ev.ts ? 'wait' : 'pointer',
                    borderRadius: 0,
                  }}
                >
                  {busy === ev.ts ? '...' : canonical ? 'canonical' : 'ephemeral'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
