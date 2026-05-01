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

// Forms exposed in the debug dropdown. Quest is the primary
// motivation (smoke-test that the lifecycle fires); the others
// help verify each shape renders and persists correctly.
const DEBUG_FORMS = [
  { id: '', label: 'auto' },
  { id: 'quest', label: 'force quest' },
  { id: 'ritual', label: 'force ritual' },
  { id: 'monologue', label: 'force monologue' },
  { id: 'fragment', label: 'force fragment' },
  { id: 'scene', label: 'force scene' },
];

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
  const [forceForm, setForceForm] = useState<string>('');

  const isAutonomous = mode === 'espíritu' || mode === 'twin';
  if (!isAutonomous) return null;

  const tick = async () => {
    setBusy(true);
    setError(null);
    try {
      const url = forceForm
        ? `${API_URL}/characters/${characterId}/tick?form=${encodeURIComponent(forceForm)}`
        : `${API_URL}/characters/${characterId}/tick`;
      const res = await fetch(url, {
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
      <select
        value={forceForm}
        onChange={(e) => setForceForm(e.target.value)}
        disabled={busy}
        title="Force a specific post form (debug). Use 'force quest' to verify the quest lifecycle."
        style={{
          padding: '0.25rem 0.4rem',
          border: '1px solid var(--border)',
          background: 'transparent',
          color: 'var(--muted-foreground)',
          fontSize: '0.55rem',
          fontFamily: 'monospace',
          letterSpacing: '0.12em',
          borderRadius: 0,
          cursor: 'pointer',
        }}
      >
        {DEBUG_FORMS.map((f) => (
          <option key={f.id || 'auto'} value={f.id}>
            {f.label}
          </option>
        ))}
      </select>
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
