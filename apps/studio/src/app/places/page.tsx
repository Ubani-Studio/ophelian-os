'use client';

import { useEffect, useState } from 'react';
import {
  listPlaces,
  getPlace,
  upsertPlace,
  syncPlaceImageFromTizita,
  generateAtmosphericEvent,
  type Place,
  type PlaceDetail,
} from '@/lib/api';

const TYRIAN = '#66023C';
const INK = '#0a0a0a';

export default function PlacesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selected, setSelected] = useState<PlaceDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const r = await listPlaces();
      setPlaces(r.places);
    } finally {
      setLoading(false);
    }
  }

  async function open(name: string) {
    const d = await getPlace(name);
    setSelected(d);
  }

  async function save(name: string, patch: Partial<Place>) {
    await upsertPlace(name, patch);
    await load();
    if (selected?.place.name === name) await open(name);
  }

  return (
    <div style={{ padding: 24, color: '#e8e8e8', minHeight: '100vh', background: '#000' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ color: TYRIAN, letterSpacing: 0.5, margin: 0, fontWeight: 400 }}>Places</h1>
        <button
          onClick={() => setCreating(!creating)}
          style={{
            padding: '8px 14px',
            background: 'transparent',
            color: TYRIAN,
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            letterSpacing: 0.5,
          }}
        >
          {creating ? 'Cancel' : '+ New'}
        </button>
      </header>

      {creating && (
        <div style={{ padding: 16, background: INK, border: `1px solid ${TYRIAN}55`, borderRadius: 0, marginBottom: 24 }}>
          <input
            placeholder="Place name (e.g. The Saltway)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={inputStyle}
          />
          <button
            onClick={async () => {
              if (!newName.trim()) return;
              await upsertPlace(newName.trim(), {});
              setNewName('');
              setCreating(false);
              await load();
            }}
            style={{ ...btnPrimary, marginTop: 8 }}
          >
            Create
          </button>
        </div>
      )}

      {loading && <div style={{ opacity: 0.5 }}>Loading…</div>}

      {/* grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
        {places.map((p) => (
          <button
            key={p.name}
            onClick={() => open(p.name)}
            style={{
              textAlign: 'left',
              background: INK,
              border: `1px solid ${TYRIAN}33`,
              borderRadius: 0,
              padding: 0,
              overflow: 'hidden',
              cursor: 'pointer',
              color: '#e8e8e8',
            }}
          >
            <div
              style={{
                height: 140,
                background: p.imageUrl ? `#222 url(${p.imageUrl}) center/cover` : '#1a0e15',
                position: 'relative',
              }}
            >
              {!p.imageUrl && (
                <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: TYRIAN, fontSize: 11, letterSpacing: 0.5 }}>
                  no image
                </div>
              )}
            </div>
            <div style={{ padding: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
              <div style={{ fontSize: 11, opacity: 0.65, marginTop: 4 }}>{p.kind} · {p.vibe || '(no vibe)'}</div>
              <div style={{ fontSize: 11, opacity: 0.55, marginTop: 6 }}>
                {p.charactersHere ?? 0} here · {p.eventsActive ?? 0} events
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* detail modal */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'grid', placeItems: 'center', zIndex: 50 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 720, maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', background: INK, border: `1px solid ${TYRIAN}`, borderRadius: 0, padding: 20 }}
          >
            <div
              style={{
                height: 220,
                background: selected.place.imageUrl ? `#222 url(${selected.place.imageUrl}) center/cover` : '#1a0e15',
                borderRadius: 0,
                marginBottom: 16,
                position: 'relative',
              }}
            >
              {!selected.place.imageUrl && (
                <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: TYRIAN }}>
                  no image set
                </div>
              )}
            </div>

            <h2 style={{ color: TYRIAN, marginBottom: 4 }}>{selected.place.name}</h2>
            <div style={{ opacity: 0.6, fontSize: 12, marginBottom: 12 }}>{selected.place.kind}</div>

            <textarea
              defaultValue={selected.place.description}
              onBlur={(e) => save(selected.place.name, { description: e.target.value })}
              placeholder="Description (visible to characters in tick prompts)"
              rows={3}
              style={inputStyle}
            />
            <input
              defaultValue={selected.place.vibe}
              onBlur={(e) => save(selected.place.name, { vibe: e.target.value })}
              placeholder="Vibe (one line)"
              style={{ ...inputStyle, marginTop: 8 }}
            />
            <input
              defaultValue={selected.place.imageUrl ?? ''}
              onBlur={(e) => save(selected.place.name, { imageUrl: e.target.value || null })}
              placeholder="Image URL (or sync from Ikenga ↓)"
              style={{ ...inputStyle, marginTop: 8 }}
            />

            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <button onClick={async () => { await syncPlaceImageFromTizita(selected.place.name, true); await open(selected.place.name); }} style={btnGhost}>
                Sync image from Ikenga
              </button>
              <button onClick={async () => { await generateAtmosphericEvent(selected.place.name); await open(selected.place.name); }} style={btnPrimary}>
                Generate atmospheric event
              </button>
            </div>

            <h3 style={{ color: TYRIAN, marginTop: 20, fontSize: 12, letterSpacing: 0.5, fontWeight: 400 }}>Who is here</h3>
            {selected.charactersHere.length === 0 && <div style={{ opacity: 0.5, fontSize: 12 }}>No-one is here.</div>}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {selected.charactersHere.map((c) => (
                <a key={c.id} href={`/characters/${c.id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: '#111', borderRadius: 16, fontSize: 12, textDecoration: 'none', color: '#e8e8e8' }}>
                  {c.avatarUrl && <img src={c.avatarUrl} alt="" style={{ width: 20, height: 20, borderRadius: 10, objectFit: 'cover' }} />}
                  {c.name}
                </a>
              ))}
            </div>

            <h3 style={{ color: TYRIAN, marginTop: 20, fontSize: 12, letterSpacing: 0.5, fontWeight: 400 }}>Recent events</h3>
            {selected.recentEvents.length === 0 && <div style={{ opacity: 0.5, fontSize: 12 }}>None.</div>}
            <div style={{ display: 'grid', gap: 6 }}>
              {selected.recentEvents.map((e) => (
                <div key={e.id} style={{ padding: 8, background: '#111', borderLeft: `2px solid ${TYRIAN}`, borderRadius: 0 }}>
                  <div style={{ fontSize: 10, opacity: 0.55 }}>[{e.kind}] · {new Date(e.createdAt).toLocaleString()}</div>
                  <div style={{ fontSize: 12, marginTop: 3 }}>{e.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
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
