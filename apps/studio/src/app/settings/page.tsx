'use client';

import { useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5130';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'ophelian-dev-key-2026';

interface ImportResult {
  total_in_tizita: number;
  named_in_tizita: number;
  imported: number;
  reused: number;
  errors: Array<{ personaId: string; error: string }>;
}

interface LoraImportResult {
  registry_count: number;
  attached: number;
  skipped: Array<{ file: string; reason: string }>;
  errors: Array<{ file: string; error: string }>;
}

const LORA_CATEGORIES = [
  { id: 'visual', label: 'Visual', note: 'Diffusion adapters for image / video generation. Ikenga.' },
  { id: 'voice', label: 'Voice', note: 'Voice clones for TTS / vocal synthesis. Mmuo.' },
  { id: 'writing', label: 'Writing', note: 'Fine-tunes that write in this character\'s voice. Ibis.' },
  { id: 'music', label: 'Music', note: 'Style / mood adapters for audio composition. Swanblade.' },
  { id: 'motion', label: 'Motion', note: 'Animation / pose / video adapters.' },
  { id: 'style', label: 'Style', note: 'Aesthetic / lighting adapters layered atop visual.' },
] as const;

export default function SettingsPage() {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const [loraImporting, setLoraImporting] = useState(false);
  const [loraResult, setLoraResult] = useState<LoraImportResult | null>(null);
  const [loraError, setLoraError] = useState<string | null>(null);

  const handleImportLoras = async () => {
    setLoraImporting(true);
    setLoraError(null);
    setLoraResult(null);
    try {
      const res = await fetch(`${API_URL}/characters/import-lora-registry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'LoRA import failed');
      setLoraResult(json);
    } catch (e) {
      setLoraError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoraImporting(false);
    }
  };

  const handleImportTizita = async () => {
    setImporting(true);
    setImportError(null);
    setImportResult(null);
    try {
      const res = await fetch(`${API_URL}/characters/bulk-import-tizita`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Import failed');
      setImportResult(json);
    } catch (e) {
      setImportError(e instanceof Error ? e.message : String(e));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p style={{ marginTop: '0.5rem', maxWidth: '60ch', color: 'var(--muted-foreground)', fontSize: '0.85rem', lineHeight: 1.6 }}>
          Federation, identity, and adapter management.
        </p>
      </div>

      <section style={{ border: '1px solid var(--border)', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', marginTop: '1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 400, marginBottom: '0.5rem' }}>
          Tizita federation
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginBottom: '1rem', lineHeight: 1.6, maxWidth: '60ch' }}>
          Import your sorted Tizita people as Bóveda characters. Each named persona
          becomes a character bound to its Tizita persona id, so photo libraries
          stay linked. Unsorted faces are skipped. Idempotent — safe to re-run.
        </p>
        <button
          type="button"
          onClick={handleImportTizita}
          disabled={importing}
          className="btn btn-primary"
        >
          {importing ? 'Importing' : 'Import named Tizita people'}
        </button>

        {importError && (
          <p style={{ marginTop: '1rem', color: 'var(--error)', fontSize: '0.8rem' }}>
            {importError}
          </p>
        )}

        {importResult && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--foreground)', marginBottom: '0.4rem' }}>
              Import complete.
            </p>
            <ul style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', lineHeight: 1.7, listStyle: 'none', padding: 0 }}>
              <li>{importResult.total_in_tizita} total personas in Tizita</li>
              <li>{importResult.named_in_tizita} named (sorted)</li>
              <li>{importResult.imported} imported as new characters</li>
              <li>{importResult.reused} already bound (reused)</li>
              {importResult.errors.length > 0 && (
                <li style={{ color: 'var(--error)' }}>{importResult.errors.length} errors</li>
              )}
            </ul>
            {importResult.imported > 0 && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.7rem' }}>
                <Link href="/operators" style={{ color: 'var(--foreground)', borderBottom: '1px solid var(--border)' }}>
                  View in Operators →
                </Link>
              </p>
            )}
          </div>
        )}
      </section>

      <section style={{ border: '1px solid var(--border)', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', marginTop: '1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 400, marginBottom: '0.5rem' }}>
          LoRA registry
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginBottom: '1rem', lineHeight: 1.6, maxWidth: '60ch' }}>
          Walks <code style={{ background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.3rem' }}>~/boveda/characters/*.json</code>{' '}
          and attaches each LoRA to the matching character. Character LoRAs match by display name; style LoRAs attach to every character that lists them in <code style={{ background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.3rem' }}>stack_with</code>. Idempotent.
        </p>
        <button
          type="button"
          onClick={handleImportLoras}
          disabled={loraImporting}
          className="btn btn-primary"
        >
          {loraImporting ? 'Importing' : 'Import LoRA registry'}
        </button>

        {loraError && (
          <p style={{ marginTop: '1rem', color: 'var(--error)', fontSize: '0.8rem' }}>
            {loraError}
          </p>
        )}

        {loraResult && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--foreground)', marginBottom: '0.4rem' }}>
              Registry walk complete.
            </p>
            <ul style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', lineHeight: 1.7, listStyle: 'none', padding: 0 }}>
              <li>{loraResult.registry_count} JSON files in registry</li>
              <li>{loraResult.attached} LoRA attachments made</li>
              {loraResult.skipped.length > 0 && (
                <li>{loraResult.skipped.length} skipped (no matching character)</li>
              )}
              {loraResult.errors.length > 0 && (
                <li style={{ color: 'var(--error)' }}>{loraResult.errors.length} errors</li>
              )}
            </ul>
          </div>
        )}
      </section>

      <section style={{ border: '1px solid var(--border)', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', marginTop: '1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 400, marginBottom: '0.5rem' }}>
          LoRA categories
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginBottom: '1.25rem', lineHeight: 1.6, maxWidth: '60ch' }}>
          Each character can carry LoRAs across these categories. Attach them
          per character on the Operators detail page, and downstream surfaces
          (ComfyUI, Genoma, Chromox, Ibis) consume the right slot for each job.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
          {LORA_CATEGORIES.map((c) => (
            <div
              key={c.id}
              style={{
                padding: '0.75rem 0.9rem',
                border: '1px solid var(--border)',
                background: 'rgba(0,0,0,0.25)',
              }}
            >
              <p style={{ fontSize: '0.55rem', letterSpacing: '0.25em', color: 'var(--muted-foreground)', fontFamily: 'monospace', marginBottom: '0.3rem' }}>
                {c.id}
              </p>
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 300, marginBottom: '0.3rem' }}>
                {c.label}
              </p>
              <p style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                {c.note}
              </p>
            </div>
          ))}
        </div>

        <p style={{ marginTop: '1rem', fontSize: '0.7rem', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
          Attach a LoRA: <code style={{ background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.3rem' }}>POST /characters/&#123;id&#125;/loras</code> with{' '}
          <code style={{ background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.3rem' }}>{`{ id, name, category, source, trigger, weight, baseModel }`}</code>.
          UI on the character page coming next.
        </p>
      </section>
    </div>
  );
}
