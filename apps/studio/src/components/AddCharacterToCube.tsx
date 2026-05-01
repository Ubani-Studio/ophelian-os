'use client';

/**
 * AddCharacterToCube · two-mode picker for the Nexus toolbar.
 *
 *  - Bind existing: lists characters whose worldId is not this Cube
 *    (unbound or in a different Cube). Click to bind via PATCH
 *    /characters/:id { worldId }.
 *  - Generate new: launches the existing NewCharacterModal; on
 *    success the freshly created character is patched with worldId
 *    so it lands inside the current Cube.
 */

import { useEffect, useMemo, useState } from 'react';
import { getCharacters, updateCharacter, type Character } from '@/lib/api';
import { NewCharacterModal } from './NewCharacterModal';

const TYRIAN = '#66023C';

export function AddCharacterToCube({
  isOpen,
  onClose,
  cubeId,
  cubeName,
  onChanged,
}: {
  isOpen: boolean;
  onClose: () => void;
  cubeId: string;
  cubeName: string;
  onChanged: () => void;
}) {
  const [tab, setTab] = useState<'existing' | 'new'>('existing');
  const [chars, setChars] = useState<Character[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await getCharacters();
      setChars(list);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load characters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen]);

  const candidates = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return chars
      .filter((c) => c.worldId !== cubeId)
      .filter((c) => (f ? c.name.toLowerCase().includes(f) : true))
      .sort((a, b) => {
        const aUnbound = !a.worldId;
        const bUnbound = !b.worldId;
        if (aUnbound !== bUnbound) return aUnbound ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [chars, cubeId, filter]);

  const bind = async (id: string) => {
    setBusy(id);
    try {
      await updateCharacter(id, { worldId: cubeId } as Partial<Character>);
      onChanged();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to bind character');
    } finally {
      setBusy(null);
    }
  };

  const handleNewCreated = async () => {
    setNewOpen(false);
    try {
      const list = await getCharacters();
      const newest = list
        .filter((c) => !c.worldId)
        .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))[0];
      if (newest) {
        await updateCharacter(newest.id, { worldId: cubeId } as Partial<Character>);
      }
      onChanged();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Created but bind failed');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 50,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(560px, 92vw)',
          maxHeight: '82vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#0a0a0a',
          border: '1px solid var(--border)',
          zIndex: 51,
        }}
      >
        <div
          style={{
            padding: '1rem 1.1rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: '"Canela", serif',
                fontWeight: 300,
                fontSize: '1.15rem',
                margin: 0,
              }}
            >
              Add character
            </h2>
            <span
              style={{
                fontSize: '0.55rem',
                letterSpacing: '0.3em',
                fontFamily: 'monospace',
                color: 'var(--muted-foreground)',
                textTransform: 'lowercase',
              }}
            >
              into {cubeName}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--muted-foreground)',
              cursor: 'pointer',
              fontSize: '1.2rem',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {(['existing', 'new'] as const).map((t) => {
            const active = t === tab;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: active ? `1px solid ${TYRIAN}` : '1px solid transparent',
                  marginBottom: '-1px',
                  color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
                  fontSize: '0.65rem',
                  fontFamily: 'monospace',
                  letterSpacing: '0.22em',
                  cursor: 'pointer',
                  textTransform: 'lowercase',
                }}
              >
                {t === 'existing' ? 'bind existing' : 'generate new'}
              </button>
            );
          })}
        </div>

        {error && (
          <div style={{ padding: '0.6rem 1rem', color: 'var(--error)', fontSize: '0.75rem' }}>
            {error}
          </div>
        )}

        {tab === 'existing' && (
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by name."
              style={{
                margin: '0.85rem 1rem 0.5rem 1rem',
                padding: '0.45rem 0.6rem',
                background: '#000',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />

            <div style={{ overflowY: 'auto', padding: '0.25rem 0' }}>
              {loading ? (
                <p style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Loading.</p>
              ) : candidates.length === 0 ? (
                <p
                  style={{
                    padding: '0.75rem 1rem',
                    fontFamily: '"Canela", serif',
                    fontStyle: 'italic',
                    fontSize: '0.85rem',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  Every character is already in this Cube, or none exist yet.
                  Try the generate-new tab.
                </p>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {candidates.map((c) => {
                    const inOtherCube = !!c.worldId;
                    return (
                      <li
                        key={c.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.55rem 1rem',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        <span style={{ flex: 1, fontSize: '0.85rem' }}>{c.name}</span>
                        {inOtherCube && (
                          <span
                            style={{
                              fontSize: '0.55rem',
                              fontFamily: 'monospace',
                              color: 'var(--muted-foreground)',
                              letterSpacing: '0.18em',
                            }}
                            title="Will be moved out of its current Cube"
                          >
                            in another cube
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => bind(c.id)}
                          disabled={busy === c.id}
                          style={{
                            padding: '0.25rem 0.7rem',
                            border: `1px solid ${TYRIAN}`,
                            background: TYRIAN,
                            color: '#fff',
                            fontSize: '0.6rem',
                            fontFamily: 'monospace',
                            letterSpacing: '0.18em',
                            textTransform: 'lowercase',
                            cursor: busy === c.id ? 'wait' : 'pointer',
                          }}
                        >
                          {busy === c.id ? '...' : inOtherCube ? 'move' : 'bind'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        {tab === 'new' && (
          <div style={{ padding: '1.25rem 1rem' }}>
            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--muted-foreground)',
                lineHeight: 1.55,
                marginBottom: '0.85rem',
              }}
            >
              Open the full character generator. The character will be created
              and then bound to {cubeName}.
            </p>
            <button
              type="button"
              onClick={() => setNewOpen(true)}
              style={{
                padding: '0.5rem 1rem',
                border: `1px solid ${TYRIAN}`,
                background: TYRIAN,
                color: '#fff',
                fontSize: '0.7rem',
                fontFamily: 'monospace',
                letterSpacing: '0.2em',
                cursor: 'pointer',
                textTransform: 'lowercase',
              }}
            >
              open generator
            </button>
          </div>
        )}
      </div>

      <NewCharacterModal
        isOpen={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={handleNewCreated}
      />
    </>
  );
}
