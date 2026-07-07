'use client';

// Vivarium admin (PLATS-Bioacoustic).
//
// Where Relics are captured, imported, and curated. This is the
// admin surface for the Bóveda-side data store. The daily-use
// surfaces live in Ikenga (Discovery side panel on storyboards) and
// Resonate (Vivarium browser + Listening Room) — this page is the
// ground truth catalogue, the one place you create the Relic.
//
// Spec: /home/sphinxy/boveda/VIVARIUM_ARCHITECTURE.md
// Article: /home/sphinxy/boveda/ARTICLE_NOTES_PLATS_BIOACOUSTIC.md

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  listRelics,
  createRelic,
  importRelicFromUrl,
  deleteRelic,
  type Relic,
  type RelicKind,
  type CreateRelicInput,
} from '@/lib/api';

const KINDS: RelicKind[] = ['recording', 'species', 'phenomenon', 'location', 'tech', 'method'];

const PHENOMENON_KEYS = [
  'infrasonic_elephant',
  'seismic_substrate',
  'whale_call',
  'reef_chorus',
  'volcanic_tremor',
  'glacial_cracking',
  'bat_echolocation',
  'soil_microbiome',
  'edna_trace',
  'astro_sonification',
  'custom',
];

const CAPTURE_METHODS = [
  'hydrophone',
  'contact_mic',
  'geophone',
  'ultrasonic_mic',
  'field_recorder',
  'edna_sampler',
  'lidar',
  'satellite',
  'thermal',
  'drone_photogrammetry',
  'archival',
];

export default function VivariumPage() {
  const [relics, setRelics] = useState<Relic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);

  const [filterKind, setFilterKind] = useState<RelicKind | ''>('');
  const [filterMinStrangeness, setFilterMinStrangeness] = useState<number>(0);
  const [filterMinSaro, setFilterMinSaro] = useState<number>(0);
  const [q, setQ] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await listRelics({
        kind: filterKind || undefined,
        minStrangeness: filterMinStrangeness || undefined,
        minSaro: filterMinSaro || undefined,
        q: q.trim() || undefined,
      });
      setRelics(r);
    } catch (e) {
      setError((e as Error).message ?? 'Failed to load Relics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [filterKind, filterMinStrangeness, filterMinSaro]);

  const onImport = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    setError(null);
    try {
      await importRelicFromUrl(importUrl.trim());
      setShowImport(false);
      setImportUrl('');
      await load();
    } catch (e) {
      setError((e as Error).message ?? 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this Relic? Bindings will break.')) return;
    try {
      await deleteRelic(id);
      await load();
    } catch (e) {
      setError((e as Error).message ?? 'Delete failed');
    }
  };

  return (
    <div style={{ padding: 24, color: '#e8e8e8', minHeight: '100vh', background: '#000' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ marginBottom: 8 }}>
          <Link href="/cubes" style={{ color: '#888', fontSize: 11, textDecoration: 'none' }}>
            ← Cubes
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
          <h1 style={{ fontSize: 18, fontWeight: 400, letterSpacing: '-0.01em', margin: 0 }}>
            Vivarium
          </h1>
          <span style={{ fontSize: 10, color: '#666', fontFamily: 'monospace' }}>
            PLATS — Bioacoustic
          </span>
        </div>
        <p style={{ color: '#888', fontSize: 11, marginBottom: 24, maxWidth: 720, lineHeight: 1.6 }}>
          Where Relics are captured, imported, and curated. The daily-use
          surfaces live in Ikenga (visual side) and Resonate (audio side).
          This page is the catalogue.
        </p>

        {error && (
          <div style={{ color: '#ff7a8c', fontSize: 11, marginBottom: 16 }}>{error}</div>
        )}

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <button onClick={() => setShowCreate(true)} style={btnPrimary}>
            + New Relic
          </button>
          <button onClick={() => setShowImport(true)} style={btnGhost}>
            ↗ Import from URL
          </button>
          <div style={{ flex: 1 }} />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void load();
            }}
            placeholder="search title / taxon / posture…"
            style={{ ...input, width: 240 }}
          />
          <select
            value={filterKind}
            onChange={(e) => setFilterKind(e.target.value as RelicKind | '')}
            style={input}
          >
            <option value="">All kinds</option>
            {KINDS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <label style={{ fontSize: 10, color: '#888' }}>
            strange ≥
            <input
              type="number"
              min={0}
              max={1}
              step={0.1}
              value={filterMinStrangeness}
              onChange={(e) => setFilterMinStrangeness(parseFloat(e.target.value) || 0)}
              style={{ ...input, width: 56, marginLeft: 4 }}
            />
          </label>
          <label style={{ fontSize: 10, color: '#888' }}>
            saro ≥
            <input
              type="number"
              min={0}
              max={1}
              step={0.1}
              value={filterMinSaro}
              onChange={(e) => setFilterMinSaro(parseFloat(e.target.value) || 0)}
              style={{ ...input, width: 56, marginLeft: 4 }}
            />
          </label>
        </div>

        {loading && (
          <p style={{ fontSize: 11, color: '#666' }}>Loading…</p>
        )}

        {!loading && relics.length === 0 && (
          <div style={{ fontSize: 11, color: '#666', lineHeight: 1.6, padding: '16px 0' }}>
            <p>No Relics yet. Try Import from URL with a xeno-canto link:</p>
            <p style={{ marginTop: 8, color: '#888', fontFamily: 'monospace' }}>
              https://xeno-canto.org/123456
            </p>
            <p style={{ marginTop: 8 }}>
              Or pick "+ New Relic" to write one by hand.
            </p>
          </div>
        )}

        {!loading && relics.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
            {relics.map((r) => (
              <RelicCard key={r.id} relic={r} onDelete={() => void onDelete(r.id)} />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateRelicModal
          onClose={() => setShowCreate(false)}
          onCreated={async () => {
            setShowCreate(false);
            await load();
          }}
        />
      )}

      {showImport && (
        <div onClick={() => setShowImport(false)} style={modalBackdrop}>
          <div onClick={(e) => e.stopPropagation()} style={modalCard}>
            <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 400 }}>
              Import Relic from URL
            </h3>
            <p style={{ color: '#888', fontSize: 10, marginBottom: 12, lineHeight: 1.5 }}>
              Supported today: xeno-canto.org (bird recordings). GBIF,
              iNaturalist, OBIS, Macaulay coming next.
            </p>
            <input
              type="text"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://xeno-canto.org/123456"
              style={{ ...input, width: '100%' }}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button onClick={() => setShowImport(false)} style={btnGhost}>Cancel</button>
              <button
                onClick={onImport}
                disabled={importing || !importUrl.trim()}
                style={importing || !importUrl.trim() ? btnDisabled : btnPrimary}
              >
                {importing ? 'Importing…' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RelicCard({ relic, onDelete }: { relic: Relic; onDelete: () => void }) {
  const samples = (relic.audioSamples as Array<{ url?: string }> | null) ?? [];
  const firstAudio = samples[0]?.url;
  return (
    <div style={{ border: '1px solid #1a1a1a', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 12, color: '#e8e8e8' }}>{relic.title}</span>
        <span style={{ fontSize: 9, color: '#666', fontFamily: 'monospace' }}>{relic.kind}</span>
      </div>
      {relic.taxonPath && (
        <span style={{ fontSize: 10, color: '#aaa', fontStyle: 'italic' }}>{relic.taxonPath}</span>
      )}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {relic.phenomenonKey && <Pill>{relic.phenomenonKey}</Pill>}
        {relic.captureMethod && <Pill>{relic.captureMethod}</Pill>}
        {relic.iucnStatus && <Pill>IUCN {relic.iucnStatus}</Pill>}
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 9, color: '#888' }}>
        <span>strange {(relic.strangeness * 100).toFixed(0)}%</span>
        <span>saro {(relic.saroIndex * 100).toFixed(0)}%</span>
        {relic.fieldSite && <span>· {relic.fieldSite}</span>}
      </div>
      {firstAudio && (
        <audio
          controls
          src={firstAudio}
          style={{ width: '100%', height: 24, marginTop: 4 }}
        />
      )}
      {relic.mythicPosture && (
        <p style={{ fontSize: 10, color: '#aaa', margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
          {relic.mythicPosture}
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 4 }}>
        <span style={{ fontSize: 9, color: '#555', fontFamily: 'monospace' }}>
          {relic.sourceProvenance ?? 'manual'}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {relic.sourceUrl && (
            <a href={relic.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: '#9be', textDecoration: 'none' }}>
              ↗ source
            </a>
          )}
          <button
            onClick={onDelete}
            style={{ fontSize: 10, color: '#888', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            delete
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateRelicModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<CreateRelicInput>({
    kind: 'recording',
    title: '',
    phenomenonKey: 'custom',
    captureMethod: 'field_recorder',
    strangeness: 0.5,
    saroIndex: 0.0,
    mythicPosture: '',
  });
  const [saving, setSaving] = useState(false);

  const onSubmit = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await createRelic(form);
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} style={modalBackdrop}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...modalCard, maxWidth: 560 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 400 }}>New Relic</h3>

        <Field label="Title">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Intrasonic elephant rumble near Mwenga shaft 12"
            style={{ ...input, width: '100%' }}
          />
        </Field>
        <Field label="Kind">
          <select
            value={form.kind}
            onChange={(e) => setForm({ ...form, kind: e.target.value as RelicKind })}
            style={input}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </Field>
        <Field label="Phenomenon">
          <select
            value={form.phenomenonKey ?? ''}
            onChange={(e) => setForm({ ...form, phenomenonKey: e.target.value })}
            style={input}
          >
            {PHENOMENON_KEYS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </Field>
        <Field label="Capture method">
          <select
            value={form.captureMethod ?? ''}
            onChange={(e) => setForm({ ...form, captureMethod: e.target.value })}
            style={input}
          >
            {CAPTURE_METHODS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </Field>
        <Field label="Field site">
          <input
            type="text"
            value={form.fieldSite ?? ''}
            onChange={(e) => setForm({ ...form, fieldSite: e.target.value })}
            placeholder="Bonny river estuary, Niger Delta"
            style={{ ...input, width: '100%' }}
          />
        </Field>
        <Field label="Taxon path (optional)">
          <input
            type="text"
            value={form.taxonPath ?? ''}
            onChange={(e) => setForm({ ...form, taxonPath: e.target.value })}
            placeholder="Animalia > Chordata > … > Loxodonta africana"
            style={{ ...input, width: '100%' }}
          />
        </Field>
        <Field label={`Strangeness (${((form.strangeness ?? 0) * 100).toFixed(0)}%)`}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={form.strangeness ?? 0}
            onChange={(e) => setForm({ ...form, strangeness: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </Field>
        <Field label={`Saro index (${((form.saroIndex ?? 0) * 100).toFixed(0)}%)`}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={form.saroIndex ?? 0}
            onChange={(e) => setForm({ ...form, saroIndex: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </Field>
        <Field label="Mythic posture (required: how does this Relic ride?)">
          <textarea
            value={form.mythicPosture ?? ''}
            onChange={(e) => setForm({ ...form, mythicPosture: e.target.value })}
            placeholder="the elephant is grieving the mine, not the season"
            rows={3}
            style={{ ...input, width: '100%', resize: 'vertical' }}
          />
        </Field>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          <button
            onClick={onSubmit}
            disabled={saving || !form.title.trim()}
            style={form.title.trim() && !saving ? btnPrimary : btnDisabled}
          >
            {saving ? 'Creating…' : 'Create Relic'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 9, color: '#bbb', border: '1px solid #2a2a2a', padding: '2px 6px', fontFamily: 'monospace', letterSpacing: '0.02em' }}>
      {children}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: 'block', fontSize: 10, color: '#888', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

const input: React.CSSProperties = {
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

const modalBackdrop: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.85)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 50,
  padding: 24,
};

const modalCard: React.CSSProperties = {
  width: '100%',
  maxWidth: 480,
  background: '#0a0a0a',
  border: '1px solid #2a2a2a',
  padding: 20,
  maxHeight: '88vh',
  overflowY: 'auto',
};
