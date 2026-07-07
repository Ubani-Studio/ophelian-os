'use client';

import { useEffect, useState } from 'react';
import {
  listArcs,
  listArcPrimaries,
  createArc,
  patchArc,
  advanceArc,
  type StoryArc,
  type ArcPrimaryDef,
} from '@/lib/api';

const TYRIAN = '#66023C';
const INK = '#0a0a0a';

const TEMP_COLOR: Record<string, string> = {
  hot: '#aa4444',
  cool: '#5fb1c5',
  crossroads: '#c5a35f',
};

export default function ArcsPage() {
  const [arcs, setArcs] = useState<StoryArc[]>([]);
  const [primaries, setPrimaries] = useState<ArcPrimaryDef[]>([]);
  const [creating, setCreating] = useState(false);
  const [picked, setPicked] = useState<ArcPrimaryDef | null>(null);
  const [variant, setVariant] = useState('');
  const [title, setTitle] = useState('');
  const [opened, setOpened] = useState<string | null>(null);

  useEffect(() => {
    void load();
    void listArcPrimaries().then((r) => setPrimaries(r.primaries));
  }, []);

  async function load() {
    const r = await listArcs();
    setArcs(r.arcs);
  }

  async function create() {
    if (!title.trim() || !picked) return;
    await createArc({
      title: title.trim(),
      primary: picked.key,
      variant: variant || undefined,
      status: 'active',
    });
    setTitle('');
    setVariant('');
    setPicked(null);
    setCreating(false);
    await load();
  }

  async function advance(id: string) {
    await advanceArc(id);
    await load();
  }

  return (
    <div style={{ padding: 24, color: '#e8e8e8', minHeight: '100vh', background: '#000' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: TYRIAN, letterSpacing: 0.5, margin: 0, fontWeight: 400 }}>Trajectories</h1>
          <div style={{ opacity: 0.5, fontSize: 11, marginTop: 4, letterSpacing: 0.3 }}>
            Where each character is heading. Ten primaries, five beats each.
          </div>
        </div>
        <button onClick={() => setCreating(!creating)} style={btnGhost}>
          {creating ? 'Cancel' : '+ New'}
        </button>
      </header>

      {/* Create form */}
      {creating && (
        <div style={{ padding: 16, background: INK, border: `1px solid ${TYRIAN}55`, borderRadius: 0, marginBottom: 24 }}>
          <h3 style={{ color: TYRIAN, fontSize: 11, letterSpacing: 0.5, marginBottom: 12, fontWeight: 400, opacity: 0.7 }}>
            Choose a primary
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 1, marginBottom: 16 }}>
            {primaries.map((p) => {
              const active = picked?.key === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => { setPicked(p); setVariant(''); }}
                  style={{
                    padding: '10px 12px',
                    background: active ? `${TYRIAN}22` : '#0a0a0a',
                    border: `1px solid ${active ? TYRIAN : 'rgba(255,255,255,0.04)'}`,
                    borderRadius: 0,
                    cursor: 'pointer',
                    color: active ? '#fff' : '#e8e8e8',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 6,
                    fontSize: 13,
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  <span>{p.label}</span>
                  <span style={{ fontSize: 9, color: TEMP_COLOR[p.temperature] ?? '#888', letterSpacing: 0.3, opacity: active ? 0.9 : 0.5 }}>
                    {p.temperature}
                  </span>
                </button>
              );
            })}
          </div>
          {picked && (
            <div style={{ fontSize: 11, opacity: 0.55, marginBottom: 12, lineHeight: 1.5 }}>
              {picked.definition}
            </div>
          )}

          {picked && (
            <div>
              <input
                placeholder={`Arc title (e.g. "Glass Motel · ${picked.label}")`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={inputStyle}
              />
              <select value={variant} onChange={(e) => setVariant(e.target.value)} style={{ ...inputStyle, marginTop: 8 }}>
                <option value="">No variant. Primary alone.</option>
                {picked.variants.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <div style={{ marginTop: 12, padding: 10, background: '#0a0a0a', borderRadius: 0, border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: 10, opacity: 0.5, letterSpacing: 0.4, marginBottom: 6 }}>
                  Beats
                </div>
                {picked.phases.map((ph, i) => (
                  <div key={i} style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.7 }}>
                    <span style={{ opacity: 0.4, fontFamily: 'monospace', marginRight: 6 }}>{String(i + 1).padStart(2, '0')}</span>
                    {ph}
                  </div>
                ))}
                <div style={{ fontSize: 10, opacity: 0.4, marginTop: 8 }}>
                  Shadow: {picked.shadow}. {picked.shadowNote}.
                </div>
              </div>
              <button onClick={create} disabled={!title.trim()} style={{ ...btnGhost, marginTop: 12 }}>
                Create
              </button>
            </div>
          )}
        </div>
      )}

      {/* Arc list */}
      <div style={{ display: 'grid', gap: 12 }}>
        {arcs.length === 0 && <div style={{ opacity: 0.5 }}>No arcs yet. Create one above.</div>}
        {arcs.map((a) => {
          const isOpen = opened === a.id;
          const beats = Array.isArray(a.beats) ? a.beats : [];
          const current = beats[a.currentBeatIndex];
          const tempColor = a.temperature ? TEMP_COLOR[a.temperature] ?? '#888' : '#888';
          return (
            <div key={a.id} style={{ background: INK, border: `1px solid rgba(255,255,255,0.06)`, borderLeft: `2px solid ${tempColor}`, borderRadius: 0, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <h3 style={{ margin: 0, color: '#e8e8e8', fontSize: 16, fontWeight: 400 }}>{a.title}</h3>
                    <span style={{ fontSize: 10, color: tempColor, letterSpacing: 0.4, opacity: 0.8 }}>
                      {a.temperature ?? ''}
                    </span>
                    <span style={{ fontSize: 10, color: '#666', letterSpacing: 0.4 }}>
                      {a.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                    {a.primary && <span style={{ color: TYRIAN }}>{a.primary}</span>}
                    {a.variant && <span> · variant: {a.variant}</span>}
                    {a.shadowPrimary && <span> · shadow: {a.shadowPrimary}</span>}
                  </div>
                  {current && (
                    <div style={{ fontSize: 13, marginTop: 8 }}>
                      <span style={{ opacity: 0.55 }}>Beat {a.currentBeatIndex + 1}/{beats.length}:</span> <strong>{current.title}</strong>
                      {current.body && <div style={{ opacity: 0.7, fontSize: 12, marginTop: 2 }}>{current.body}</div>}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button onClick={() => setOpened(isOpen ? null : a.id)} style={btnGhost}>
                    {isOpen ? 'Collapse' : 'Beats'}
                  </button>
                  {a.status === 'active' && (
                    <button onClick={() => advance(a.id)} style={btnPrimary}>
                      Advance →
                    </button>
                  )}
                </div>
              </div>

              {isOpen && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${TYRIAN}22` }}>
                  {beats.map((b, i) => {
                    const isCurrent = i === a.currentBeatIndex;
                    const isPast = i < a.currentBeatIndex;
                    return (
                      <div
                        key={i}
                        style={{
                          padding: 8,
                          background: isCurrent ? `${TYRIAN}22` : '#111',
                          borderLeft: `2px solid ${isCurrent ? TYRIAN : isPast ? '#444' : '#222'}`,
                          borderRadius: 0,
                          marginBottom: 6,
                          opacity: isPast ? 0.55 : 1,
                        }}
                      >
                        <div style={{ fontSize: 12 }}>
                          <span style={{ opacity: 0.55 }}>{i + 1}.</span> {b.title}
                          {isCurrent && <span style={{ marginLeft: 8, fontSize: 10, color: TYRIAN, textTransform: 'uppercase', letterSpacing: 0.5 }}>now</span>}
                        </div>
                        {b.body && <div style={{ fontSize: 11, opacity: 0.7, marginTop: 3 }}>{b.body}</div>}
                      </div>
                    );
                  })}
                  {a.participants && a.participants.length > 0 && (
                    <div style={{ marginTop: 12, fontSize: 11, opacity: 0.7 }}>
                      Participants: {a.participants.length} character(s) · attach more from a character page
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  background: '#000',
  color: '#e8e8e8',
  border: `1px solid ${TYRIAN}55`,
  borderRadius: 0,
  fontSize: 12,
  fontFamily: 'inherit',
};
const btnPrimary: React.CSSProperties = {
  padding: '6px 12px',
  background: TYRIAN,
  color: '#fff',
  border: 'none',
  borderRadius: 0,
  cursor: 'pointer',
  fontSize: 11,
  letterSpacing: 0.5,
};
const btnGhost: React.CSSProperties = {
  padding: '6px 12px',
  background: 'transparent',
  color: TYRIAN,
  border: 'none',
  borderRadius: 0,
  cursor: 'pointer',
  fontSize: 12,
  letterSpacing: 0.5,
};
