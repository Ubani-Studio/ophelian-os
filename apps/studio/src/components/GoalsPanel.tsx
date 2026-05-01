'use client';

/**
 * GoalsPanel · the perimeter of an espíritu's intent.
 *
 * Three to five short goals shape the tick prompt. Persisted on
 * Character.goals (JSON string array). Click a goal to edit; "+"
 * appends; empty save deletes. Only meaningful for espíritu / twin
 * modes; hidden for manual / relic.
 */

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5130';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'ophelian-dev-key-2026';

const TYRIAN = '#66023C';

async function patchGoals(characterId: string, goals: string[]): Promise<string[]> {
  const res = await fetch(`${API_URL}/characters/${characterId}/goals`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify({ goals }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(err.message || `API error: ${res.status}`);
  }
  const data = (await res.json()) as { goals: unknown };
  return Array.isArray(data.goals) ? (data.goals as string[]) : [];
}

export function GoalsPanel({
  characterId,
  mode,
  initialGoals,
}: {
  characterId: string;
  mode: string | null | undefined;
  initialGoals: unknown;
}) {
  const initial = Array.isArray(initialGoals) ? (initialGoals as string[]) : [];
  const [goals, setGoals] = useState<string[]>(initial);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAutonomous = mode === 'espíritu' || mode === 'twin';

  if (!isAutonomous) return null;

  const commit = async (next: string[]) => {
    setSaving(true);
    setError(null);
    try {
      const saved = await patchGoals(characterId, next);
      setGoals(saved);
      setEditingIndex(null);
      setDraft('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save goals');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (idx: number) => {
    setEditingIndex(idx);
    setDraft(goals[idx] ?? '');
  };

  const saveEdit = async () => {
    if (editingIndex === null) return;
    const next = [...goals];
    if (draft.trim()) {
      next[editingIndex] = draft.trim();
    } else {
      next.splice(editingIndex, 1);
    }
    await commit(next);
  };

  const addGoal = async () => {
    if (goals.length >= 5) {
      setError('Cap is five goals. Edit one first.');
      return;
    }
    const next = [...goals, 'new goal'];
    await commit(next);
    setEditingIndex(next.length - 1);
    setDraft('new goal');
  };

  return (
    <div className="mt-4">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <strong
          style={{
            fontSize: '0.55rem',
            letterSpacing: '0.32em',
            color: 'var(--muted-foreground)',
            fontFamily: 'monospace',
            textTransform: 'none',
          }}
        >
          Goals · perimeter
        </strong>
        <button
          type="button"
          onClick={addGoal}
          disabled={saving || goals.length >= 5}
          title="Add goal"
          style={{
            width: '1.25rem',
            height: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem',
            color: 'var(--muted-foreground)',
            border: '1px solid var(--muted-foreground)',
            borderRadius: 0,
            background: 'transparent',
            cursor: saving || goals.length >= 5 ? 'not-allowed' : 'pointer',
            opacity: goals.length >= 5 ? 0.4 : 1,
          }}
        >
          +
        </button>
      </div>

      {error && (
        <div style={{ fontSize: '0.7rem', color: 'var(--error)', marginBottom: '0.4rem' }}>{error}</div>
      )}

      {goals.length === 0 ? (
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--muted-foreground)',
            fontFamily: '"Canela", serif',
            fontStyle: 'italic',
            lineHeight: 1.5,
          }}
        >
          No goals yet. The tick will mostly choose stillness.
        </p>
      ) : (
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {goals.map((g, idx) => (
            <li key={idx}>
              {editingIndex === idx ? (
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <input
                    autoFocus
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit();
                      if (e.key === 'Escape') {
                        setEditingIndex(null);
                        setDraft('');
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '0.3rem 0.5rem',
                      fontSize: '0.78rem',
                      border: `1px solid ${TYRIAN}`,
                      background: '#000',
                      color: 'var(--foreground)',
                      borderRadius: 0,
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={saving}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.65rem',
                      border: '1px solid var(--foreground)',
                      background: 'transparent',
                      color: 'var(--foreground)',
                      borderRadius: 0,
                      cursor: saving ? 'wait' : 'pointer',
                    }}
                  >
                    {saving ? '...' : 'save'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => startEdit(idx)}
                  title="Click to edit (empty saves to delete)"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.4rem 0.55rem',
                    border: '1px solid var(--border)',
                    background: 'rgba(255,255,255,0.015)',
                    color: 'var(--foreground)',
                    fontSize: '0.78rem',
                    lineHeight: 1.5,
                    borderRadius: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '0.5rem',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.6rem',
                      color: TYRIAN,
                      flexShrink: 0,
                      letterSpacing: '0.1em',
                      paddingTop: '0.1rem',
                    }}
                  >
                    0{idx + 1}
                  </span>
                  <span>{g}</span>
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
