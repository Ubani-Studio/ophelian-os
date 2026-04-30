'use client';

/**
 * LoraPanel — luxury minimal high tech.
 *
 * Visual language: Linear / Vercel / Cursor data tables. Hairline
 * dividers, monospace for technical metadata, Canela for LoRA names,
 * tyrian purple only as the load-bearing accent (filled-state colour
 * + trigger words). Empty categories collapse to a single thin row.
 *
 * Each character carries adapters across six dimensions:
 *   visual  → ComfyUI / Genoma / thumbnail compositor
 *   voice   → Chromox
 *   writing → Ibis
 *   music   → audio composition pipeline
 *   motion  → animation / pose / video
 *   style   → aesthetic overlays
 */

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5130';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'ophelian-dev-key-2026';

const TYRIAN = '#66023C';
const TYRIAN_SOFT = 'rgba(176, 60, 116, 0.75)';

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
  { id: 'visual', label: 'Visual', surface: 'ComfyUI · Genoma' },
  { id: 'voice', label: 'Voice', surface: 'Mmuo' },
  { id: 'writing', label: 'Writing', surface: 'Ibis' },
  { id: 'music', label: 'Music', surface: 'Swanblade' },
  { id: 'motion', label: 'Motion', surface: 'Animation' },
  { id: 'style', label: 'Style', surface: 'Overlay' },
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
        marginTop: '1rem',
        background: 'rgba(255,255,255,0.015)',
        border: '1px solid var(--border)',
      }}
    >
      <header
        style={{
          padding: '0.85rem 1rem 0.7rem 1rem',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span
          style={{
            fontSize: '0.5rem',
            letterSpacing: '0.32em',
            color: 'var(--muted-foreground)',
            fontFamily: 'monospace',
            textTransform: 'lowercase',
          }}
        >
          adapters
        </span>
        <span
          style={{
            fontSize: '0.7rem',
            fontFamily: 'monospace',
            color: loras.length > 0 ? TYRIAN_SOFT : 'var(--muted-foreground)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {String(loras.length).padStart(2, '0')}
        </span>
      </header>

      <div>
        {CATEGORIES.map((cat, i) => {
          const inCategory = loras.filter((l) => (l.category ?? 'visual') === cat.id);
          const isOpen = openCategory === cat.id;
          const hasContent = inCategory.length > 0;
          return (
            <div
              key={cat.id}
              style={{
                borderTop: i === 0 ? 'none' : '1px solid var(--border)',
              }}
            >
              {/* Category header — single thin row.
                  Grid 1fr / 24px so the trailing indicator sits in
                  the same column as the row × buttons below. */}
              <button
                type="button"
                onClick={() => setOpenCategory(isOpen ? null : cat.id)}
                style={{
                  width: '100%',
                  display: 'grid',
                  gridTemplateColumns: '1fr 24px',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.7rem 1rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--foreground)',
                  textAlign: 'left',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'baseline', gap: '0.7rem' }}>
                  <span
                    style={{
                      fontFamily: '"Canela", serif',
                      fontWeight: 300,
                      fontSize: '0.95rem',
                      color: hasContent ? TYRIAN : 'var(--foreground)',
                      letterSpacing: '0.005em',
                    }}
                  >
                    {cat.label}
                  </span>
                  <span
                    style={{
                      fontSize: '0.55rem',
                      letterSpacing: '0.18em',
                      color: 'var(--muted-foreground)',
                      fontFamily: 'monospace',
                      opacity: 0.6,
                    }}
                  >
                    {cat.surface}
                  </span>
                </span>
                <span
                  style={{
                    width: '24px',
                    textAlign: 'center',
                    fontSize: '0.7rem',
                    lineHeight: 1,
                    color: 'var(--muted-foreground)',
                    fontFamily: 'monospace',
                    fontVariantNumeric: 'tabular-nums',
                    opacity: hasContent ? 0.7 : 0.4,
                  }}
                >
                  {hasContent ? String(inCategory.length).padStart(2, '0') : isOpen ? '×' : '+'}
                </span>
              </button>

              {/* LoRA rows. Same 1fr / 24px column structure as the
                  category header so the × buttons line up vertically
                  with the +/count indicators above them.
                  Optional thumbnail (40px) prepended when set. */}
              {hasContent && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {inCategory.map((l) => {
                    const hasThumb = Boolean(l.thumbnailUrl);
                    const showRawId = (l.name ?? '').toLowerCase() !== l.id.toLowerCase();
                    return (
                      <li
                        key={l.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: hasThumb
                            ? '40px 1fr 24px'
                            : '1fr 24px',
                          alignItems: 'center',
                          gap: '0.7rem',
                          padding: '0.55rem 1rem',
                          borderTop: '1px solid var(--border)',
                        }}
                      >
                        {hasThumb && (
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              background: 'rgba(0,0,0,0.4)',
                              border: '1px solid var(--border)',
                              overflow: 'hidden',
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={l.thumbnailUrl}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                          </div>
                        )}
                        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.18rem' }}>
                          <span
                            style={{
                              fontFamily: '"Canela", serif',
                              fontWeight: 300,
                              fontSize: '0.95rem',
                              color: 'var(--foreground)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              lineHeight: 1.15,
                            }}
                          >
                            {l.name ?? l.id}
                          </span>
                          {showRawId && (
                            <span
                              style={{
                                fontSize: '0.5rem',
                                letterSpacing: '0.16em',
                                color: 'var(--muted-foreground)',
                                fontFamily: 'monospace',
                                textTransform: 'lowercase',
                                opacity: 0.5,
                              }}
                            >
                              {l.id}
                            </span>
                          )}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.55rem',
                              flexWrap: 'wrap',
                              marginTop: '0.05rem',
                            }}
                          >
                            {l.trigger && (
                              <code
                                style={{
                                  fontSize: '0.6rem',
                                  color: TYRIAN,
                                  background: 'rgba(102, 2, 60, 0.08)',
                                  padding: '0.08rem 0.35rem',
                                  fontFamily: 'monospace',
                                  letterSpacing: '0.02em',
                                }}
                              >
                                {l.trigger}
                              </code>
                            )}
                            {typeof l.weight === 'number' && (
                              <span
                                style={{
                                  fontSize: '0.55rem',
                                  color: 'var(--muted-foreground)',
                                  fontFamily: 'monospace',
                                  fontVariantNumeric: 'tabular-nums',
                                  opacity: 0.7,
                                }}
                              >
                                w {l.weight.toFixed(2)}
                              </span>
                            )}
                            {l.baseModel && (
                              <span
                                style={{
                                  fontSize: '0.5rem',
                                  letterSpacing: '0.18em',
                                  color: 'var(--muted-foreground)',
                                  fontFamily: 'monospace',
                                  textTransform: 'lowercase',
                                  opacity: 0.55,
                                }}
                              >
                                {l.baseModel}
                              </span>
                            )}
                            {l.source && (
                              <span
                                style={{
                                  fontSize: '0.5rem',
                                  letterSpacing: '0.18em',
                                  color: 'var(--muted-foreground)',
                                  fontFamily: 'monospace',
                                  textTransform: 'lowercase',
                                  opacity: 0.55,
                                }}
                              >
                                · {l.source}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => detach(l.id)}
                          title="Detach"
                          style={{
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.85rem',
                            lineHeight: 1,
                            color: 'var(--muted-foreground)',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            opacity: 0.5,
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; }}
                        >
                          ×
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Inline add form */}
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
    <div
      style={{
        padding: '0.85rem 1rem 1rem 1rem',
        background: 'rgba(0,0,0,0.35)',
        borderTop: '1px solid var(--border)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '0.6rem',
      }}
    >
      <FormField label="id" value={id} onChange={setId} placeholder="ubani-v3" required />
      <FormField label="name" value={name} onChange={setName} placeholder="Ubani v3" />
      <FormField label="trigger" value={trigger} onChange={setTrigger} placeholder="ubani" />
      <FormField label="weight" value={weight} onChange={setWeight} placeholder="0.80" />
      <FormSelect label="source" value={source} onChange={setSource} options={[...SOURCES]} />
      <FormSelect label="base" value={baseModel} onChange={setBaseModel} options={[...BASE_MODELS]} />
      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.3rem' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '0.35rem 0.85rem',
            fontSize: '0.65rem',
            letterSpacing: '0.15em',
            background: 'transparent',
            color: 'var(--muted-foreground)',
            border: '1px solid var(--border)',
            cursor: 'pointer',
            textTransform: 'lowercase',
          }}
        >
          cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!id.trim()}
          style={{
            padding: '0.35rem 0.85rem',
            fontSize: '0.65rem',
            letterSpacing: '0.15em',
            background: id.trim() ? TYRIAN : 'rgba(102,2,60,0.3)',
            color: '#fff',
            border: '1px solid transparent',
            cursor: id.trim() ? 'pointer' : 'not-allowed',
            textTransform: 'lowercase',
          }}
        >
          attach
        </button>
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <span
        style={{
          fontSize: '0.5rem',
          letterSpacing: '0.22em',
          color: 'var(--muted-foreground)',
          fontFamily: 'monospace',
          textTransform: 'lowercase',
          opacity: 0.7,
        }}
      >
        {label}{required && '*'}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding: '0.4rem 0.5rem',
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid var(--border)',
          color: 'var(--foreground)',
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          borderRadius: 0,
          outline: 'none',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = TYRIAN; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
      />
    </label>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <span
        style={{
          fontSize: '0.5rem',
          letterSpacing: '0.22em',
          color: 'var(--muted-foreground)',
          fontFamily: 'monospace',
          textTransform: 'lowercase',
          opacity: 0.7,
        }}
      >
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '0.4rem 0.5rem',
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid var(--border)',
          color: 'var(--foreground)',
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          borderRadius: 0,
        }}
      >
        {options.map((o) => (
          <option key={o} value={o} style={{ background: '#000' }}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
