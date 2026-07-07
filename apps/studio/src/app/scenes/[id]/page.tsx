'use client';

// Zone detail page (Boveda Scene + Spheres).
//
// A Zone (UI label for Scene) is a themed region inside a Cube. Each
// Sphere bound to this Zone is one divergent media piece — the
// YouTube cut, the game cut, the film, the content reel. Spheres
// listed here as a grid with format / aspect / status pills, plus a
// "New Sphere" modal.
//
// Spec: /home/sphinxy/boveda/CUBE_ZONE_SPHERE_ARCHITECTURE.md

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  getScene,
  listSpheres,
  createSphere,
  type Scene,
  type Sphere,
  type CreateSphereInput,
  type SphereFormat,
  type SphereAudioMode,
  type SphereStatus,
} from '@/lib/api';

const IKENGA_BASE =
  process.env.NEXT_PUBLIC_IKENGA_URL || 'http://localhost:5173';

const FORMATS: SphereFormat[] = [
  'music_video',
  'film',
  'content',
  'game',
  'dialogue',
  'interactive',
  'trailer',
  'reel',
  'mood',
];

const AUDIO_MODES: SphereAudioMode[] = [
  'lead',
  'remix',
  'underscore',
  'silent',
  'diegetic',
];

const STATUSES: SphereStatus[] = [
  'draft',
  'in_production',
  'locked',
  'shipped',
];

const ASPECTS = ['16:9', '9:16', '1:1', '4:5', '2.39:1'];

export default function ZoneDetailPage() {
  const params = useParams<{ id: string }>();
  const sceneId = params?.id ?? '';

  const [zone, setZone] = useState<Scene | null>(null);
  const [spheres, setSpheres] = useState<Sphere[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<CreateSphereInput>({
    sceneId,
    name: '',
    format: 'music_video',
    primaryAspect: '16:9',
    audioMode: 'lead',
    status: 'draft',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm((prev) => ({ ...prev, sceneId }));
  }, [sceneId]);

  const load = async () => {
    if (!sceneId) return;
    setLoading(true);
    setError(null);
    try {
      const [z, s] = await Promise.all([getScene(sceneId), listSpheres(sceneId)]);
      setZone(z);
      setSpheres(s);
    } catch (e) {
      setError((e as Error).message ?? 'Failed to load Zone');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [sceneId]);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.sceneId) return;
    setSaving(true);
    try {
      await createSphere(form);
      setModalOpen(false);
      setForm({
        sceneId,
        name: '',
        format: 'music_video',
        primaryAspect: '16:9',
        audioMode: 'lead',
        status: 'draft',
      });
      await load();
    } catch (e) {
      setError((e as Error).message ?? 'Failed to create Sphere');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 24, color: '#e8e8e8', minHeight: '100vh', background: '#000' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <Link href="/scenes" style={{ color: '#888', fontSize: 11, textDecoration: 'none' }}>
            ← Zones
          </Link>
          <h1 style={{ fontSize: 18, fontWeight: 400, letterSpacing: '-0.01em', margin: 0 }}>
            {zone?.name ?? 'Loading…'}
          </h1>
          {zone?.type && (
            <span style={{ fontSize: 10, color: '#666', fontFamily: 'monospace' }}>
              · {zone.type}
            </span>
          )}
        </div>

        {zone?.description && (
          <p style={{ color: '#aaa', fontSize: 12, marginBottom: 24, maxWidth: 720, lineHeight: 1.6 }}>
            {zone.description}
          </p>
        )}

        {error && (
          <div style={{ color: '#ff7a8c', fontSize: 11, marginBottom: 16 }}>{error}</div>
        )}

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 11, color: '#888', letterSpacing: '0.02em', textTransform: 'lowercase', fontWeight: 400, margin: 0 }}>
            Spheres in this Zone
          </h2>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              background: 'transparent',
              color: '#e8e8e8',
              border: '1px solid #2a2a2a',
              padding: '6px 12px',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            + New Sphere
          </button>
        </div>

        {loading && (
          <p style={{ fontSize: 11, color: '#666' }}>Loading…</p>
        )}

        {!loading && spheres.length === 0 && (
          <p style={{ fontSize: 11, color: '#666', lineHeight: 1.6 }}>
            No Spheres yet. Each Sphere is one divergent take on this Zone — the
            YouTube cut, the game cut, the film. Click "+ New Sphere" to add the
            first one.
          </p>
        )}

        {!loading && spheres.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {spheres.map((s) => (
              <SphereCard key={s.id} sphere={s} />
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 480,
              background: '#0a0a0a',
              border: '1px solid #2a2a2a',
              padding: 20,
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 400 }}>
              New Sphere in {zone?.name ?? 'this Zone'}
            </h3>
            <Field label="Name">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Eden — YouTube cut"
                style={input}
              />
            </Field>
            <Field label="Format">
              <select
                value={form.format}
                onChange={(e) => setForm({ ...form, format: e.target.value as SphereFormat })}
                style={input}
              >
                {FORMATS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </Field>
            <Field label="Primary aspect">
              <select
                value={form.primaryAspect}
                onChange={(e) => setForm({ ...form, primaryAspect: e.target.value })}
                style={input}
              >
                {ASPECTS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </Field>
            <Field label="Audio mode">
              <select
                value={form.audioMode}
                onChange={(e) => setForm({ ...form, audioMode: e.target.value as SphereAudioMode })}
                style={input}
              >
                {AUDIO_MODES.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as SphereStatus })}
                style={input}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Intent (optional)">
              <input
                type="text"
                value={form.intent ?? ''}
                onChange={(e) => setForm({ ...form, intent: e.target.value })}
                placeholder="the lead drop"
                style={input}
              />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button
                onClick={() => setModalOpen(false)}
                style={btnGhost}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !form.name.trim()}
                style={form.name.trim() && !saving ? btnPrimary : btnDisabled}
              >
                {saving ? 'Creating…' : 'Create Sphere'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SphereCard({ sphere }: { sphere: Sphere }) {
  const storyboardUrl = sphere.ikengaSeriesId
    ? `${IKENGA_BASE}/series/${sphere.ikengaSeriesId}`
    : null;

  return (
    <div style={{ border: '1px solid #1a1a1a', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 12, color: '#e8e8e8' }}>{sphere.name}</span>
        <span style={{ fontSize: 9, color: '#666', fontFamily: 'monospace' }}>{sphere.status}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Pill>{sphere.format}</Pill>
        <Pill>{sphere.primaryAspect}</Pill>
        {sphere.siblingAspect && <Pill>+ {sphere.siblingAspect}</Pill>}
        <Pill>{sphere.audioMode}</Pill>
      </div>
      {sphere.intent && (
        <p style={{ fontSize: 10, color: '#888', margin: 0, lineHeight: 1.5 }}>{sphere.intent}</p>
      )}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 4 }}>
        <span style={{ fontSize: 9, color: '#555', fontFamily: 'monospace' }}>
          {sphere.castIds.length > 0 ? `cast ${sphere.castIds.length}` : 'no cast bound'}
        </span>
        {storyboardUrl ? (
          <a
            href={storyboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 10, color: '#9be', textDecoration: 'none' }}
          >
            ↗ Storyboard
          </a>
        ) : (
          <span style={{ fontSize: 10, color: '#555' }}>no storyboard</span>
        )}
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 9,
        color: '#bbb',
        border: '1px solid #2a2a2a',
        padding: '2px 6px',
        fontFamily: 'monospace',
        letterSpacing: '0.02em',
      }}
    >
      {children}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: 'block', fontSize: 10, color: '#888', marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const input: React.CSSProperties = {
  width: '100%',
  background: '#000',
  color: '#e8e8e8',
  border: '1px solid #2a2a2a',
  padding: '6px 10px',
  fontSize: 11,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const btnPrimary: React.CSSProperties = {
  background: '#e8e8e8',
  color: '#0a0a0a',
  border: 'none',
  padding: '6px 12px',
  fontSize: 11,
  cursor: 'pointer',
};

const btnDisabled: React.CSSProperties = {
  background: '#2a2a2a',
  color: '#555',
  border: 'none',
  padding: '6px 12px',
  fontSize: 11,
  cursor: 'not-allowed',
};

const btnGhost: React.CSSProperties = {
  background: 'transparent',
  color: '#888',
  border: '1px solid #2a2a2a',
  padding: '6px 12px',
  fontSize: 11,
  cursor: 'pointer',
};
