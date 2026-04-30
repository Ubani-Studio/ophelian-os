'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5130';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'ophelian-dev-key-2026';

const CULTURES = [
  { id: 'yoruba', label: 'Yoruba', region: 'african' },
  { id: 'igbo', label: 'Igbo', region: 'african' },
  { id: 'akan', label: 'Akan', region: 'african' },
  { id: 'egyptian', label: 'Egyptian', region: 'african' },
  { id: 'vodou', label: 'Vodou', region: 'diaspora' },
  { id: 'rastafari', label: 'Rastafari', region: 'diaspora' },
  { id: 'maroon', label: 'Maroon', region: 'diaspora' },
  { id: 'lucumi', label: 'Lucumí', region: 'diaspora' },
  { id: 'taino', label: 'Taíno', region: 'diaspora' },
];

const FORMS = [
  { id: 'first', label: 'First only' },
  { id: 'first_surname', label: 'First + surname' },
  { id: 'mononym', label: 'Mononym' },
  { id: 'full_with_epithet', label: 'Full + epithet' },
] as const;

const ORNAMENTS = [
  { value: 0, label: 'Clean ASCII' },
  { value: 0.5, label: 'Diacritics' },
  { value: 1, label: 'Avant-garde' },
] as const;

const SURNAME_REGISTERS = [
  { id: 'auto', label: 'Auto', note: 'Historically accurate (colonial for diaspora, compound for African)' },
  { id: 'colonial', label: 'Colonial', note: 'Slave-name afterlife (Henderson, Rodríguez, Toussaint)' },
  { id: 'reclaimed', label: 'Reclaimed', note: 'Post-emancipation refusal (X, Africa, Selassie)' },
  { id: 'compound', label: 'Compound', note: 'African source-culture (Adebayo, Okonkwo, Asante)' },
] as const;

interface Lineage {
  threadId: string;
  rootMeaning: string;
  otherShores: Array<{ culture: string; name: string }>;
}

interface NameResult {
  fullName: string;
  raw: {
    primary: string;
    primaryOrnamented?: string;
    surname?: string;
    title?: string;
    titlePlacement?: 'prefix' | 'suffix' | 'standalone';
    cultureId: string;
    region: string;
    era: string;
    gender: string;
    source: string;
    sacred?: boolean;
    rationale?: string;
    lineage?: Lineage;
  };
}

export default function NamesPage() {
  const [selectedCultures, setSelectedCultures] = useState<string[]>(['yoruba', 'igbo', 'akan']);
  const [form, setForm] = useState<typeof FORMS[number]['id']>('first_surname');
  const [ornament, setOrnament] = useState<0 | 0.5 | 1>(0.5);
  const [withTitle, setWithTitle] = useState(false);
  const [surnameRegister, setSurnameRegister] = useState<typeof SURNAME_REGISTERS[number]['id']>('auto');
  const [count, setCount] = useState(12);
  const [results, setResults] = useState<NameResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCulture = (id: string) => {
    setSelectedCultures((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/characters/names`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify({
          cultures: selectedCultures,
          form,
          ornament,
          withTitle,
          surnameRegister: surnameRegister !== 'auto' ? surnameRegister : undefined,
          count,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Generate failed');
      setResults(json.names || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1.5rem' }}>
        <div>
          <h1 className="page-title">Names</h1>
          <p style={{ marginTop: '0.5rem', maxWidth: '60ch', color: 'var(--muted-foreground)', fontSize: '0.85rem', lineHeight: 1.6 }}>
            Diasporic / decolonial cultural naming. Tradition-based corpora,
            register-aware titles, surname-as-history, lineage threading.
          </p>
        </div>
        <Link href="/names/lineage" style={{ fontSize: '0.7rem', letterSpacing: '0.2em', color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)', paddingBottom: '0.2rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>
          Lineage threads
        </Link>
      </div>

      <section style={{ border: '1px solid var(--border)', padding: '1.25rem', background: 'rgba(255,255,255,0.02)', marginTop: '1rem' }}>
        <Section label="Cultures">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {CULTURES.map((c) => (
              <Pill key={c.id} active={selectedCultures.includes(c.id)} onClick={() => toggleCulture(c.id)} label={c.label} />
            ))}
          </div>
        </Section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
          <Section label="Form">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {FORMS.map((f) => (
                <Pill key={f.id} active={form === f.id} onClick={() => setForm(f.id)} label={f.label} />
              ))}
            </div>
          </Section>
          <Section label="Ornament">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {ORNAMENTS.map((o) => (
                <Pill key={o.value} active={ornament === o.value} onClick={() => setOrnament(o.value as 0 | 0.5 | 1)} label={o.label} />
              ))}
            </div>
          </Section>
        </div>

        {(form === 'first_surname' || form === 'surname') && (
          <Section label="Surname register">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {SURNAME_REGISTERS.map((r) => (
                <Pill key={r.id} active={surnameRegister === r.id} onClick={() => setSurnameRegister(r.id)} label={r.label} title={r.note} />
              ))}
            </div>
          </Section>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
            <input type="checkbox" checked={withTitle} onChange={(e) => setWithTitle(e.target.checked)} />
            Attach title (Eze, Mmuo, Ras, the Quiet Door)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
            Count
            <input type="number" min={1} max={48} value={count} onChange={(e) => setCount(Math.max(1, Math.min(48, Number(e.target.value))))} style={{ width: '4rem', padding: '0.2rem 0.4rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
          </label>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <button onClick={generate} disabled={loading} className="btn btn-primary">
            {loading ? 'Generating' : 'Generate'}
          </button>
        </div>
      </section>

      {error && <p style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '1rem' }}>{error}</p>}

      {results.length > 0 && (
        <section style={{ border: '1px solid var(--border)', padding: '1.25rem', background: 'rgba(255,255,255,0.02)', marginTop: '1.5rem' }}>
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.3em', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>Results</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {results.map((n, i) => (
              <li key={i} style={{ padding: '0.7rem 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none', display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'baseline' }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 300, color: 'var(--foreground)' }}>
                    {n.fullName}
                  </p>
                  <p style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                    {n.raw.cultureId} · {n.raw.region} · {n.raw.era} · {n.raw.gender}
                  </p>
                  {n.raw.lineage && (
                    <p style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', marginTop: '0.2rem' }}>
                      <Link href={`/names/lineage#${n.raw.lineage.threadId}`} style={{ borderBottom: '1px solid var(--border)', color: 'inherit', textDecoration: 'none' }}>thread</Link>{' '}
                      <span style={{ opacity: 0.7 }}>{n.raw.lineage.rootMeaning}</span>
                      {n.raw.lineage.otherShores.length > 0 && (
                        <span style={{ opacity: 0.6 }}>{' '}· {n.raw.lineage.otherShores.map((s) => `${s.name} (${s.culture})`).join(' · ')}</span>
                      )}
                    </p>
                  )}
                  {n.raw.rationale && <p style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', fontStyle: 'italic', marginTop: '0.2rem' }}>{n.raw.rationale}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {n.raw.sacred && (
                    <span title="Sacred / culturally weighted; treat with care" style={{ fontSize: '0.55rem', letterSpacing: '0.2em', color: 'rgba(255,200,140,0.7)' }}>
                      sacred
                    </span>
                  )}
                  <span style={{ fontSize: '0.55rem', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>{n.raw.source}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: '0.75rem' }}>
      <p style={{ fontSize: '0.55rem', letterSpacing: '0.2em', color: 'var(--muted-foreground)', marginBottom: '0.4rem', fontFamily: 'monospace' }}>{label}</p>
      {children}
    </div>
  );
}

function Pill({ active, onClick, label, title }: { active: boolean; onClick: () => void; label: string; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        padding: '0.3rem 0.7rem',
        fontSize: '0.7rem',
        border: active ? '1px solid var(--foreground)' : '1px solid var(--border)',
        background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
        color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
        cursor: 'pointer',
        borderRadius: 0,
      }}
    >
      {label}
    </button>
  );
}
