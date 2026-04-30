'use client';

/**
 * GroupMembersPanel
 *
 * Lightweight member list for group / collective characters
 * (Triarch, councils, bands, family units). Members are stored as
 * { name, role?, characterId? } entries on Character.groupMembers.
 *
 * Two ways to add a member:
 *   1. Type a name manually
 *   2. Generate a name via the diasporic naming engine (the same
 *      /characters/names endpoint that powers /names) — pull a
 *      candidate, accept or reroll
 */

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5130';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'ophelian-dev-key-2026';

interface GroupMember {
  name: string;
  role?: string;
  characterId?: string;
}

const QUICK_CULTURES = [
  { id: 'yoruba', label: 'Yoruba' },
  { id: 'igbo', label: 'Igbo' },
  { id: 'akan', label: 'Akan' },
  { id: 'vodou', label: 'Vodou' },
  { id: 'lucumi', label: 'Lucumí' },
  { id: 'maroon', label: 'Maroon' },
  { id: 'taino', label: 'Taíno' },
  { id: 'egyptian', label: 'Egyptian' },
  { id: 'rastafari', label: 'Rastafari' },
];

const ARCHETYPES = [
  'trickster', 'sage', 'mystic', 'warrior', 'rebel',
  'lover', 'sovereign', 'hermit', 'healer', 'magician',
] as const;

const FORMS = [
  { id: 'first', label: 'First' },
  { id: 'first_surname', label: 'First + surname' },
] as const;

export function GroupMembersPanel({
  characterId,
  initialMembers,
  onChange,
}: {
  characterId: string;
  initialMembers: GroupMember[];
  onChange?: (members: GroupMember[]) => void;
}) {
  const [members, setMembers] = useState<GroupMember[]>(initialMembers ?? []);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [genCulture, setGenCulture] = useState('yoruba');
  const [genForm, setGenForm] = useState<'first' | 'first_surname'>('first');
  const [genArchetype, setGenArchetype] = useState<string>('');
  const [genTitle, setGenTitle] = useState(false);
  const [genOptionsOpen, setGenOptionsOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = (next: GroupMember[]) => {
    setMembers(next);
    onChange?.(next);
  };

  const addMember = async (memberName: string, memberRole?: string) => {
    setAdding(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/characters/${characterId}/group-members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify({ name: memberName, role: memberRole?.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Add failed');
      refresh(json.groupMembers ?? []);
      setName('');
      setRole('');
      setSuggestion(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setAdding(false);
    }
  };

  const removeMember = async (idx: number) => {
    try {
      const res = await fetch(`${API_URL}/characters/${characterId}/group-members/${idx}`, {
        method: 'DELETE',
        headers: { 'x-api-key': API_KEY },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Remove failed');
      refresh(json.groupMembers ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const generateName = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/characters/names`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify({
          cultures: [genCulture],
          form: genForm,
          archetype: genArchetype || undefined,
          mode: genArchetype ? 'archetype' : 'real',
          ornament: 0.5,
          withTitle: genTitle,
          count: 1,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Generate failed');
      const first = json.names?.[0];
      setSuggestion(first ? first.fullName : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <section
      style={{
        border: '1px solid var(--border)',
        padding: '1rem 1.25rem',
        background: 'rgba(255,255,255,0.02)',
        marginTop: '1rem',
      }}
    >
      <p style={{ fontSize: '0.55rem', letterSpacing: '0.3em', color: 'var(--muted-foreground)', fontFamily: 'monospace', marginBottom: '0.75rem' }}>
        Members
      </p>

      {members.length === 0 && (
        <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', fontStyle: 'italic', marginBottom: '0.75rem' }}>
          No members yet. Add by name or generate one.
        </p>
      )}

      {members.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0' }}>
          {members.map((m, i) => (
            <li
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.4rem 0',
                borderBottom: i < members.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 300, color: 'var(--foreground)' }}>
                  {m.name}
                </span>
                {m.role && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', marginLeft: '0.6rem', fontStyle: 'italic' }}>
                    {m.role}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeMember(i)}
                title="Remove"
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--muted-foreground)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr)) auto', gap: '0.4rem', alignItems: 'center' }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Member name"
          style={{ padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: '0.8rem' }}
        />
        <input
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Role (optional)"
          style={{ padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: '0.8rem' }}
        />
        <button
          type="button"
          onClick={() => name.trim() && addMember(name, role)}
          disabled={adding || !name.trim()}
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.9rem', fontSize: '0.75rem' }}
        >
          {adding ? 'Adding' : 'Add'}
        </button>
      </div>

      <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <p style={{ fontSize: '0.55rem', letterSpacing: '0.25em', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
            Generate a name
          </p>
          <button
            type="button"
            onClick={() => setGenOptionsOpen((v) => !v)}
            style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            {genOptionsOpen ? 'Less' : 'More'}
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.5rem' }}>
          {QUICK_CULTURES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setGenCulture(c.id)}
              style={{
                padding: '0.2rem 0.55rem',
                fontSize: '0.65rem',
                border: genCulture === c.id ? '1px solid var(--foreground)' : '1px solid var(--border)',
                background: genCulture === c.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: genCulture === c.id ? 'var(--foreground)' : 'var(--muted-foreground)',
                cursor: 'pointer',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {genOptionsOpen && (
          <div style={{ marginBottom: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div>
              <p style={{ fontSize: '0.5rem', letterSpacing: '0.25em', color: 'var(--muted-foreground)', fontFamily: 'monospace', marginBottom: '0.25rem' }}>
                Archetype (optional)
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => setGenArchetype('')}
                  style={pillStyle(genArchetype === '')}
                >
                  None
                </button>
                {ARCHETYPES.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setGenArchetype(a)}
                    style={pillStyle(genArchetype === a)}
                  >
                    {a.charAt(0).toUpperCase() + a.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: '0.5rem', letterSpacing: '0.25em', color: 'var(--muted-foreground)', fontFamily: 'monospace', marginBottom: '0.25rem' }}>
                  Form
                </p>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {FORMS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setGenForm(f.id)}
                      style={pillStyle(genForm === f.id)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--muted-foreground)', cursor: 'pointer' }}>
                <input type="checkbox" checked={genTitle} onChange={(e) => setGenTitle(e.target.checked)} />
                Attach title
              </label>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={generateName}
            disabled={generating}
            className="btn btn-secondary"
            style={{ padding: '0.3rem 0.7rem', fontSize: '0.7rem' }}
          >
            {generating ? 'Generating' : suggestion ? 'Reroll' : 'Generate'}
          </button>
          {suggestion && (
            <>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 300, color: 'var(--foreground)', flex: 1 }}>
                {suggestion}
              </span>
              <button
                type="button"
                onClick={() => addMember(suggestion)}
                disabled={adding}
                className="btn btn-primary"
                style={{ padding: '0.3rem 0.7rem', fontSize: '0.7rem' }}
              >
                Add
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <p style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--error)' }}>{error}</p>
      )}
    </section>
  );
}

function pillStyle(active: boolean): React.CSSProperties {
  return {
    padding: '0.2rem 0.55rem',
    fontSize: '0.65rem',
    border: active ? '1px solid var(--foreground)' : '1px solid var(--border)',
    background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
    color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
    cursor: 'pointer',
    borderRadius: 0,
  };
}
