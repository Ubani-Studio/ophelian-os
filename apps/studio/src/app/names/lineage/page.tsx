'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5130';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'ophelian-dev-key-2026';

interface LineageForm {
  culture: string;
  name: string;
  note?: string;
}

interface LineageEntry {
  id: string;
  rootMeaning: string;
  origin: string;
  family: 'orisha' | 'day-name' | 'ancestral' | 'motif' | 'trickster' | 'spirit';
  forms: LineageForm[];
}

const FAMILY_LABEL: Record<string, string> = {
  orisha: 'Orisha',
  'day-name': 'Day-name',
  ancestral: 'Ancestral',
  motif: 'Motif',
  trickster: 'Trickster',
  spirit: 'Spirit',
};

export default function LineagePage() {
  const [lineages, setLineages] = useState<LineageEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/characters/oro-lineages`, {
      headers: { 'x-api-key': API_KEY },
    })
      .then((r) => r.json())
      .then((j) => setLineages(j.lineages || []))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const grouped = new Map<string, LineageEntry[]>();
  for (const l of lineages) {
    const list = grouped.get(l.family) ?? [];
    list.push(l);
    grouped.set(l.family, list);
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Names · Lineage</h1>
        <p style={{ marginTop: '0.5rem', maxWidth: '60ch', color: 'var(--muted-foreground)', fontSize: '0.85rem', lineHeight: 1.6 }}>
          Most generators treat names as flat. These threads show how a single
          ancestor crosses water and changes mouth. Kwasi becomes Quashie.
          Èṣù becomes Legba becomes Eleguá. The same lineage, refracted.
        </p>
      </div>

      {error && <p style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '1rem' }}>{error}</p>}

      <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        {[...grouped.entries()].map(([family, list]) => (
          <section key={family}>
            <p style={{ fontSize: '0.55rem', letterSpacing: '0.3em', color: 'var(--muted-foreground)', marginBottom: '1.25rem', fontFamily: 'monospace' }}>
              {FAMILY_LABEL[family] ?? family}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {list.map((l) => (
                <article
                  key={l.id}
                  id={l.id}
                  style={{
                    border: '1px solid var(--border)',
                    padding: '1.25rem',
                    background: 'rgba(255,255,255,0.02)',
                    scrollMarginTop: '3rem',
                  }}
                >
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 300, color: 'var(--foreground)', marginBottom: '0.3rem' }}>
                    {l.rootMeaning}
                  </p>
                  <p style={{ fontSize: '0.6rem', color: 'var(--muted-foreground)', fontFamily: 'monospace', marginBottom: '1rem' }}>
                    origin: {l.origin}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', rowGap: '0.7rem' }}>
                    {l.forms.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'stretch' }}>
                        {i > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', padding: '0 0.7rem', color: 'var(--muted-foreground)', fontSize: '0.65rem', opacity: 0.5 }}>
                            →
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', padding: '0.4rem 0.7rem', border: '1px solid var(--border)', minWidth: '140px' }}>
                          <span style={{ fontSize: '0.5rem', letterSpacing: '0.2em', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
                            {f.culture}
                          </span>
                          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 300, color: 'var(--foreground)' }}>
                            {f.name}
                          </span>
                          {f.note && (
                            <span style={{ fontSize: '0.6rem', color: 'var(--muted-foreground)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                              {f.note}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <footer style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', maxWidth: '60ch', lineHeight: 1.6 }}>
          Sourced from public scholarship: Karade, Bascom, Gates, Yelvington,
          Maya Deren, Karen McCarthy Brown, Lydia Cabrera. Sacred names that
          initiates do not share publicly are intentionally absent.
        </p>
      </footer>
    </div>
  );
}
