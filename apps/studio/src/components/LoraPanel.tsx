'use client';

/**
 * LoraPanel
 *
 * Category-grouped LoRA slots for a character. Each character can
 * carry adapters across six dimensions:
 *   visual  → ComfyUI / Genoma / thumbnail compositor
 *   voice   → Chromox
 *   writing → Ibis
 *   music   → audio composition pipeline
 *   motion  → animation / pose / video
 *   style   → aesthetic overlays
 *
 * Each entry stores enough metadata for downstream surfaces to
 * pick the right adapter automatically: id, name, source (replicate /
 * comfyui / civitai / local / starforge), trigger word, weight,
 * baseModel (sdxl / sd15 / flux / etc.), and the optional
 * trainedFromPersonaId linking back to Tizita.
 */

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5130';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'ophelian-dev-key-2026';

const TYRIAN = '#66023C';

export interface LoraRef {
  id: string;
  name?: string;
  category?: string;
  source?: string;
  trigger?: string;
  weight?: number;
  baseModel?: string;
  trainedFromPersonaId?: string;
  thumbnailUrl?: string;
}

const CATEGORIES = [
  { id: 'visual', label: 'Visual', note: 'ComfyUI / Genoma' },
  { id: 'voice', label: 'Voice', note: 'Chromox' },
  { id: 'writing', label: 'Writing', note: 'Ibis' },
  { id: 'music', label: 'Music', note: 'audio pipeline' },
  { id: 'motion', label: 'Motion', note: 'animation / pose' },
  { id: 'style', label: 'Style', note: 'aesthetic overlay' },
] as const;

const SOURCES = ['replicate', 'comfyui', 'civitai', 'local', 'starforge', 'tizita'] as const;
const BASE_MODELS = ['sdxl', 'sd15', 'flux', 'sd3', 'pony', 'illustrious', 'other'] as const;

export function LoraPanel({
  characterId,
  initialLoras,
  onChange,
}: {
  characterId: string;
  initialLoras?: LoraRef[];
  onChange?: (loras: LoraRef[]) => void;
}) {
  const [loras, setLoras] = useState<LoraRef[]>(initialLoras ?? []);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = (next: LoraRef[]) => {
    setLoras(next);
    onChange?.(next);
  };

  const attach = async (lora: LoraRef) => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/characters/${characterId}/loras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify(lora),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Attach failed');
      refresh(json.loras ?? []);
      setOpenCategory(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const detach = async (loraId: string) => {
    try {
      const res = await fetch(`${API_URL}/characters/${characterId}/loras/${encodeURIComponent(loraId)}`, {
        method: 'DELETE',
        headers: { 'x-api-key': API_KEY },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Detach failed');
      refresh(json.loras ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <section
      style={{
        border: '1px solid var(--border)',
        background: 'rgba(255,255,255,0.02)',
        marginTop: '1rem',
      }}
    >
      <div style={{ padding: '0.7rem 1rem', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.55rem', letterSpacing: '0.3em', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
          LoRAs · {loras.length}
        </p>
      </div>

      <div>
        {CATEGORIES.map((cat) => {
          const inCategory = loras.filter((l) => (l.category ?? 'visual') === cat.id);
          const isOpen = openCategory === cat.id;
          return (
            <div key={cat.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <div style={{ padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.7rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.7rem' }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 300, color: inCategory.length > 0 ? TYRIAN : 'var(--foreground)' }}>
                    {cat.label}
                  </span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--muted-foreground)', fontFamily: 'monospace', letterSpacing: '0.15em' }}>
                    {cat.note}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenCategory(isOpen ? null : cat.id)}
                  style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', background: 'transparent', border: '1px solid var(--border)', padding: '0.25rem 0.6rem', cursor: 'pointer' }}
                >
                  {isOpen ? 'Cancel' : '+ Add'}
                </button>
              </div>

              {inCategory.length > 0 && (
                <ul style={{ listStyle: 'none', padding: '0 1rem 0.6rem 1rem', margin: 0 }}>
                  {inCategory.map((l) => (
                    <li key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0', borderTop: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', fontWeight: 400, color: 'var(--foreground)' }}>
                          {l.name ?? l.id}
                        </span>
                        {l.trigger && (
                          <code style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.35rem', color: TYRIAN }}>
                            {l.trigger}
                          </code>
                        )}
                        {typeof l.weight === 'number' && (
                          <span style={{ fontSize: '0.6rem', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
                            w{l.weight}
                          </span>
                        )}
                        {l.baseModel && (
                          <span style={{ fontSize: '0.55rem', color: 'var(--muted-foreground)', fontFamily: 'monospace', letterSpacing: '0.15em' }}>
                            {l.baseModel}
                          </span>
                        )}
                        {l.source && (
                          <span style={{ fontSize: '0.55rem', color: 'var(--muted-foreground)', fontFamily: 'monospace', letterSpacing: '0.15em' }}>
                            {l.source}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => detach(l.id)}
                        title="Detach"
                        style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {isOpen && (
                <AddLoraForm
                  category={cat.id}
                  onSubmit={attach}
                  onCancel={() => setOpenCategory(null)}
                />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <p style={{ padding: '0.6rem 1rem', fontSize: '0.7rem', color: 'var(--error)' }}>{error}</p>
      )}
    </section>
  );
}

function AddLoraForm({
  category,
  onSubmit,
  onCancel,
}: {
  category: string;
  onSubmit: (lora: LoraRef) => void;
  onCancel: () => void;
}) {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [source, setSource] = useState<string>(SOURCES[0]);
  const [trigger, setTrigger] = useState('');
  const [weight, setWeight] = useState('0.8');
  const [baseModel, setBaseModel] = useState<string>(BASE_MODELS[0]);

  const submit = () => {
    if (!id.trim()) return;
    const lora: LoraRef = {
      id: id.trim(),
      category,
      source,
      ...(name.trim() ? { name: name.trim() } : {}),
      ...(trigger.trim() ? { trigger: trigger.trim() } : {}),
      ...(Number.isFinite(parseFloat(weight)) ? { weight: parseFloat(weight) } : {}),
      ...(baseModel ? { baseModel } : {}),
    };
    onSubmit(lora);
  };

  return (
    <div style={{ padding: '0.6rem 1rem 1rem 1rem', background: 'rgba(0,0,0,0.25)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
      <FormField label="ID *" value={id} onChange={setId} placeholder="ubani-v3" />
      <FormField label="Name" value={name} onChange={setName} placeholder="Ubani v3" />
      <FormField label="Trigger" value={trigger} onChange={setTrigger} placeholder="ubaniv3" />
      <FormField label="Weight" value={weight} onChange={setWeight} placeholder="0.8" />
      <FormSelect label="Source" value={source} onChange={setSource} options={[...SOURCES]} />
      <FormSelect label="Base model" value={baseModel} onChange={setBaseModel} options={[...BASE_MODELS]} />
      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', marginTop: '0.4rem' }}>
        <button type="button" onClick={onCancel} className="btn btn-secondary" style={{ padding: '0.3rem 0.7rem', fontSize: '0.7rem' }}>
          Cancel
        </button>
        <button type="button" onClick={submit} className="btn btn-primary" style={{ padding: '0.3rem 0.7rem', fontSize: '0.7rem' }} disabled={!id.trim()}>
          Attach
        </button>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
      <span style={{ fontSize: '0.5rem', letterSpacing: '0.2em', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ padding: '0.35rem 0.5rem', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: '0.75rem', borderRadius: 0 }}
      />
    </label>
  );
}

function FormSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
      <span style={{ fontSize: '0.5rem', letterSpacing: '0.2em', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: '0.35rem 0.5rem', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: '0.75rem', borderRadius: 0 }}
      >
        {options.map((o) => (
          <option key={o} value={o} style={{ background: '#000' }}>{o}</option>
        ))}
      </select>
    </label>
  );
}
