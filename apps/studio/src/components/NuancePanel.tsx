'use client';

/**
 * NuancePanel — collapsed-by-default editor for the surprise mechanics:
 * tongue.idioms, preoccupations, tensions, fixations, modernity bleed,
 * currentLocation, homeBase. Includes "auto-generate" that calls the LLM
 * to seed everything from the genome (returns a suggestion you preview
 * before committing).
 *
 * Without nuance these characters speak in the LLM's house register.
 * With it, each one diverges. This panel is the human review surface.
 */

import { useState } from 'react';
import {
  patchNuance,
  autoGenerateNuance,
  type Character,
  type NuanceFields,
} from '@/lib/api';

const TYRIAN = '#66023C';

export function NuancePanel({
  character,
  onUpdated,
}: {
  character: Character;
  onUpdated: (c: Character) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<'save' | 'gen' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = (character.tongue ?? {}) as NonNullable<NuanceFields['tongue']>;
  const m = (character.modernity ?? {}) as NonNullable<NuanceFields['modernity']>;
  const idiomsCount = (t.idioms ?? []).length;
  const preoccCount = (character.preoccupations ?? []).length;
  const tensCount = (character.tensions ?? []).length;
  const fixCount = (character.fixations ?? []).length;
  const filledScore = (idiomsCount > 0 ? 1 : 0) + (preoccCount > 0 ? 1 : 0) + (tensCount > 0 ? 1 : 0) + (fixCount > 0 ? 1 : 0);

  const [idioms, setIdioms] = useState((t.idioms ?? []).join('\n'));
  const [registerNotes, setRegisterNotes] = useState(t.registerNotes ?? '');
  const [preocc, setPreocc] = useState((character.preoccupations ?? []).join('\n\n'));
  const [tensions, setTensions] = useState(
    (character.tensions ?? []).map((x) => `${x.beliefA} / ${x.beliefB}${x.note ? ' :: ' + x.note : ''}`).join('\n'),
  );
  const [fixations, setFixations] = useState((character.fixations ?? []).join('\n\n'));
  const [anchorEra, setAnchorEra] = useState(m.anchorEra ?? '');
  const [bleed, setBleed] = useState(m.contemporaryBleed ?? 0);
  const [contemporarySlang, setContemporarySlang] = useState((m.contemporarySlang ?? []).join('\n'));
  const [refusedSlang, setRefusedSlang] = useState((m.refusedSlang ?? []).join('\n'));
  const [currentLocation, setCurrentLocation] = useState(character.currentLocation ?? '');
  const [homeBase, setHomeBase] = useState(character.homeBase ?? '');

  function parseTensions(raw: string): NonNullable<NuanceFields['tensions']> {
    return raw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const [pair, note] = line.split('::').map((s) => s.trim());
        const [beliefA, beliefB] = pair.split(/[⇄/|]/).map((s) => s.trim());
        return { beliefA: beliefA ?? '', beliefB: beliefB ?? '', note: note || undefined };
      })
      .filter((x) => x.beliefA && x.beliefB);
  }

  function splitLines(s: string): string[] {
    return s.split('\n').map((l) => l.trim()).filter(Boolean);
  }
  function splitParas(s: string): string[] {
    return s.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  }

  async function save() {
    setBusy('save');
    setError(null);
    try {
      const payload: NuanceFields = {
        tongue: {
          ...t,
          idioms: splitLines(idioms),
          registerNotes: registerNotes || undefined,
        },
        preoccupations: splitParas(preocc),
        tensions: parseTensions(tensions),
        fixations: splitParas(fixations),
        modernity: {
          anchorEra: anchorEra || undefined,
          contemporaryBleed: Number.isFinite(bleed) ? bleed : 0,
          contemporarySlang: splitLines(contemporarySlang),
          refusedSlang: splitLines(refusedSlang),
        },
        currentLocation: currentLocation || null,
        homeBase: homeBase || null,
      };
      await patchNuance(character.id, payload);
      onUpdated({
        ...character,
        tongue: payload.tongue,
        preoccupations: payload.preoccupations,
        tensions: payload.tensions,
        fixations: payload.fixations,
        modernity: payload.modernity,
        currentLocation: payload.currentLocation ?? null,
        homeBase: payload.homeBase ?? null,
      } as Character);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function autoGen() {
    setBusy('gen');
    setError(null);
    try {
      const r = await autoGenerateNuance(character.id, {
        fields: ['tongue', 'preoccupations', 'tensions', 'fixations'],
      });
      const s = r.suggestion;
      if (s.tongue?.idioms) setIdioms(s.tongue.idioms.join('\n'));
      if (s.tongue?.registerNotes !== undefined) setRegisterNotes(s.tongue.registerNotes ?? '');
      if (s.preoccupations) setPreocc(s.preoccupations.join('\n\n'));
      if (s.tensions) {
        setTensions(
          s.tensions.map((x) => `${x.beliefA} / ${x.beliefB}${x.note ? ' :: ' + x.note : ''}`).join('\n'),
        );
      }
      if (s.fixations) setFixations(s.fixations.join('\n\n'));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '6px 8px',
          backgroundColor: 'transparent',
          color: 'var(--foreground)',
          border: `1px solid rgba(255,255,255,0.06)`,
          borderRadius: 0,
          cursor: 'pointer',
          fontSize: 12,
          letterSpacing: 0.3,
          fontWeight: 400,
        }}
      >
        <span>Nuance</span>
        <span style={{ color: TYRIAN, opacity: 0.7, fontSize: 11 }}>
          {filledScore}/4 {open ? '−' : '+'}
        </span>
      </button>

      {open && (
        <div
          style={{
            marginTop: 6,
            padding: 10,
            background: '#0a0a0a',
            border: `1px solid rgba(255,255,255,0.04)`,
            borderRadius: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button onClick={autoGen} disabled={busy !== null} style={btnGhost}>
              {busy === 'gen' ? 'Generating' : 'Auto'}
            </button>
            <button onClick={save} disabled={busy !== null} style={btnPrimary}>
              {busy === 'save' ? 'Saving' : 'Save'}
            </button>
          </div>

          {error && <div style={{ fontSize: 11, color: '#aa4444' }}>{error}</div>}

          <Field label="Idioms" hint="One per line">
            <textarea value={idioms} onChange={(e) => setIdioms(e.target.value)} style={ta(110)} />
          </Field>

          <Field label="Register notes">
            <textarea value={registerNotes} onChange={(e) => setRegisterNotes(e.target.value)} style={ta(48)} />
          </Field>

          <Field label="Preoccupations" hint="Paragraphs separated by blank line">
            <textarea value={preocc} onChange={(e) => setPreocc(e.target.value)} style={ta(130)} />
          </Field>

          <Field label="Tensions" hint="Per line: belief / belief :: note">
            <textarea value={tensions} onChange={(e) => setTensions(e.target.value)} style={ta(90)} />
          </Field>

          <Field label="Fixations" hint="Paragraphs">
            <textarea value={fixations} onChange={(e) => setFixations(e.target.value)} style={ta(130)} />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="Anchor era">
              <input value={anchorEra} onChange={(e) => setAnchorEra(e.target.value)} placeholder="1973-Lagos" style={inp} />
            </Field>
            <Field label="Contemporary bleed" hint={bleed.toFixed(2)}>
              <input type="range" min={0} max={1} step={0.05} value={bleed} onChange={(e) => setBleed(parseFloat(e.target.value))} style={{ width: '100%' }} />
            </Field>
          </div>

          <Field label="Contemporary slang" hint="One per line">
            <textarea value={contemporarySlang} onChange={(e) => setContemporarySlang(e.target.value)} style={ta(56)} />
          </Field>
          <Field label="Refused slang" hint="Won't use; one per line">
            <textarea value={refusedSlang} onChange={(e) => setRefusedSlang(e.target.value)} style={ta(56)} />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="Current location">
              <input value={currentLocation} onChange={(e) => setCurrentLocation(e.target.value)} style={inp} />
            </Field>
            <Field label="Home base">
              <input value={homeBase} onChange={(e) => setHomeBase(e.target.value)} style={inp} />
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span
        style={{
          fontSize: 11,
          color: 'var(--muted-foreground)',
          letterSpacing: 0.2,
          fontWeight: 400,
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
        }}
      >
        <span>{label}</span>
        {hint && <span style={{ fontSize: 10, opacity: 0.5 }}>{hint}</span>}
      </span>
      {children}
    </label>
  );
}

const inp: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  background: '#000',
  color: '#e8e8e8',
  border: `1px solid rgba(255,255,255,0.08)`,
  borderRadius: 0,
  fontSize: 12,
  fontFamily: 'inherit',
  lineHeight: 1.5,
};
const ta = (h: number): React.CSSProperties => ({
  ...inp,
  minHeight: h,
  resize: 'vertical' as const,
});
const btnGhost: React.CSSProperties = {
  padding: '4px 12px',
  background: 'transparent',
  color: TYRIAN,
  border: `1px solid rgba(255,255,255,0.08)`,
  borderRadius: 0,
  cursor: 'pointer',
  fontSize: 11,
  letterSpacing: 0.3,
};
const btnPrimary: React.CSSProperties = {
  padding: '4px 12px',
  background: TYRIAN,
  color: '#fff',
  border: 'none',
  borderRadius: 0,
  cursor: 'pointer',
  fontSize: 11,
  letterSpacing: 0.3,
};
