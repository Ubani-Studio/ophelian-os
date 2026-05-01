'use client';

/**
 * TickButton · runs one autonomous tick for an espíritu / twin.
 * Sits next to the ModePill in the character header. Hidden for
 * manual / relic. On success calls onTicked() so the parent can
 * refresh the timeline.
 */

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5130';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'ophelian-dev-key-2026';

const TYRIAN = '#66023C';

interface TickResult {
  decision: {
    kind: 'message' | 'thought' | 'noop';
    targetName?: string;
    summary: string;
    body?: string;
    source: 'anthropic' | 'stub';
  };
}

export function TickButton({
  characterId,
  mode,
  onTicked,
}: {
  characterId: string;
  mode: string | null | undefined;
  onTicked?: (result: TickResult) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSource, setLastSource] = useState<'anthropic' | 'stub' | null>(null);

  const isAutonomous = mode === 'espíritu' || mode === 'twin';
  if (!isAutonomous) return null;

  const tick = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/characters/${characterId}/tick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify({}),
      });

      if (res.status === 429 || res.status === 402) {
        const err = await res.json().catch(() => ({ error: 'Throttled' }));
        setError(err.error || (res.status === 429 ? 'Throttled' : 'Budget exceeded'));
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || `Tick failed: ${res.status}`);
      }
      const data = (await res.json()) as TickResult;
      setLastSource(data.decision.source);
      onTicked?.(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tick failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <button
        type="button"
        onClick={tick}
        disabled={busy}
        title="Run one autonomous tick"
        style={{
          padding: '0.3rem 0.7rem',
          border: `1px solid ${TYRIAN}`,
          background: TYRIAN,
          color: '#fff',
          fontSize: '0.6rem',
          fontFamily: 'monospace',
          letterSpacing: '0.18em',
          textTransform: 'lowercase',
          borderRadius: 0,
          cursor: busy ? 'wait' : 'pointer',
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? '...' : 'tend'}
      </button>
      {lastSource && !busy && (
        <span
          style={{
            fontSize: '0.5rem',
            fontFamily: 'monospace',
            letterSpacing: '0.22em',
            color: lastSource === 'stub' ? 'var(--muted-foreground)' : TYRIAN,
            textTransform: 'none',
            opacity: 0.7,
          }}
          title={lastSource === 'stub' ? 'No ANTHROPIC_API_KEY set; stub fallback ran' : 'Real LLM tick'}
        >
          {lastSource === 'stub' ? '· stub' : '· live'}
        </span>
      )}
      {error && (
        <span style={{ fontSize: '0.65rem', color: 'var(--error)' }} title={error}>
          {error.slice(0, 40)}
        </span>
      )}
    </div>
  );
}
