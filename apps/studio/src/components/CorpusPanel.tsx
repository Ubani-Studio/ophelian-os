'use client';

/**
 * CorpusPanel · Layer 1 of the three-layer training corpus.
 *
 * Pulls writing from Ibis to populate the character's voiceSamples.
 * Sits next to VoicePanel; the difference is provenance:
 *   - VoicePanel: paste samples manually
 *   - CorpusPanel: pull from your Ibis writing automatically
 *
 * Layer 2 (collaborators with consent) and Layer 3 (character-specific
 * corpus auto-collected from approved posts) ship later.
 *
 * Why the panel exists: without explicit Ibis-pulled samples, every
 * character converges on the LLM's house register. With them, each
 * character speaks in its actual author's voice.
 */

import { useEffect, useState } from 'react';
import {
  getCorpusStatus,
  refreshCorpus,
  type CorpusStatus,
  type CorpusRefreshResult,
  type Character,
} from '@/lib/api';

const TYRIAN = '#66023C';
const INK = '#0E0E0F';

export function CorpusPanel({
  character,
  onUpdated,
}: {
  character: Character;
  onUpdated: (c: Character) => void;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<CorpusStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<CorpusRefreshResult | null>(null);

  // filter knobs
  const [ibisUserId, setIbisUserId] = useState('');
  const [titleContains, setTitleContains] = useState(character.name ?? '');
  const [maxSamples, setMaxSamples] = useState(8);
  const [replace, setReplace] = useState(false);

  useEffect(() => {
    if (!open || status) return;
    void loadStatus();
  }, [open]);

  useEffect(() => {
    setTitleContains(character.name ?? '');
  }, [character.name]);

  async function loadStatus() {
    setLoading(true);
    setError(null);
    try {
      const s = await getCorpusStatus(character.id);
      setStatus(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load corpus status');
    } finally {
      setLoading(false);
    }
  }

  async function runRefresh(dryRun: boolean) {
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const result = await refreshCorpus(character.id, {
        authorIbisUserId: ibisUserId.trim() || undefined,
        titleContains: titleContains.trim(),
        maxSamples,
        replace,
        dryRun,
      });
      setPreview(result);
      if (!dryRun) {
        // Bump character.voiceSamples in parent state from refreshed samples.
        const next = {
          ...character,
          voiceSamples: result.ibisResult.samplesReturned.map((s) => s.text),
        };
        onUpdated(next);
        await loadStatus();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Refresh failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        border: `1px solid rgba(255,255,255,0.06)`,
        borderRadius: 0,
        marginTop: 12,
        background: '#0a0a0a',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: '10px 12px',
          background: 'transparent',
          color: 'var(--foreground)',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: 12,
          letterSpacing: 0.3,
          fontWeight: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>Training corpus</span>
        <span style={{ color: TYRIAN, fontSize: 11, opacity: 0.7 }}>
          Ibis · {open ? '−' : '+'}
        </span>
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px', color: '#d8d8d8', fontSize: 13, lineHeight: 1.5 }}>
          <p style={{ opacity: 0.7, fontSize: 12, marginBottom: 12 }}>
            Pulls real writing from Ibis to populate this character's voice samples.
            The tick prompt few-shots these into every generation, so the character
            speaks in your actual register, not the LLM's defaults.
          </p>

          {loading && <div style={{ opacity: 0.6 }}>Loading…</div>}

          {error && (
            <div
              style={{
                padding: 8,
                marginBottom: 12,
                background: '#33000088',
                border: '1px solid #aa0000',
                borderRadius: 0,
                color: '#ffaaaa',
                fontSize: 12,
              }}
            >
              {error}
            </div>
          )}

          {/* Status */}
          {status && (
            <div style={{ marginBottom: 16, fontSize: 12, opacity: 0.85 }}>
              <div>
                <strong>Layer 1 (author Ibis):</strong> {status.layer1.sampleCount} samples ·
                last updated {new Date(status.layer1.lastUpdated).toLocaleString()}
              </div>
              <div style={{ opacity: 0.5 }}>
                Layer 2 (collaborators): {status.layer2_collaborators.status}
              </div>
              <div style={{ opacity: 0.5 }}>
                Layer 3 (character corpus): {status.layer3_character_corpus.status}
              </div>
            </div>
          )}

          {/* Filter controls */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <label style={{ fontSize: 11 }}>
              <div style={{ opacity: 0.7, marginBottom: 4 }}>Ibis user ID (optional)</div>
              <input
                type="text"
                value={ibisUserId}
                onChange={(e) => setIbisUserId(e.target.value)}
                placeholder="user_demo"
                style={inputStyle}
              />
            </label>
            <label style={{ fontSize: 11 }}>
              <div style={{ opacity: 0.7, marginBottom: 4 }}>Title contains</div>
              <input
                type="text"
                value={titleContains}
                onChange={(e) => setTitleContains(e.target.value)}
                placeholder={character.name ?? 'leave empty for all'}
                style={inputStyle}
              />
            </label>
            <label style={{ fontSize: 11 }}>
              <div style={{ opacity: 0.7, marginBottom: 4 }}>Max samples (1-20)</div>
              <input
                type="number"
                min={1}
                max={20}
                value={maxSamples}
                onChange={(e) => setMaxSamples(Math.max(1, Math.min(20, Number(e.target.value) || 8)))}
                style={inputStyle}
              />
            </label>
            <label style={{ fontSize: 11, display: 'flex', alignItems: 'flex-end', gap: 6 }}>
              <input
                type="checkbox"
                checked={replace}
                onChange={(e) => setReplace(e.target.checked)}
              />
              <span>Replace existing samples (else merge + dedupe)</span>
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => runRefresh(true)} disabled={loading} style={btnGhost}>
              Preview
            </button>
            <button onClick={() => runRefresh(false)} disabled={loading} style={btnPrimary}>
              Refresh corpus
            </button>
          </div>

          {/* Preview */}
          {preview && (
            <div style={{ marginTop: 16, fontSize: 12 }}>
              <div style={{ opacity: 0.7, marginBottom: 8 }}>
                {preview.dryRun ? 'Preview' : 'Wrote'}: matched{' '}
                <strong>{preview.ibisResult.matchedDocs}</strong> docs from{' '}
                {preview.ibisResult.totalDocsScanned} scanned ·{' '}
                {preview.ibisResult.samplesReturned.length} samples ready
              </div>
              {preview.ibisResult.warnings.length > 0 && (
                <div style={{ opacity: 0.7, color: '#ddaa44', fontSize: 11, marginBottom: 8 }}>
                  {preview.ibisResult.warnings.map((w, i) => (
                    <div key={i}>· {w}</div>
                  ))}
                </div>
              )}
              <div style={{ display: 'grid', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
                {preview.ibisResult.samplesReturned.map((s) => (
                  <div
                    key={s.ibisDocumentId}
                    style={{ padding: 8, background: '#111', borderLeft: `2px solid ${TYRIAN}`, borderRadius: 4 }}
                  >
                    <div style={{ opacity: 0.6, fontSize: 11, marginBottom: 4 }}>
                      {s.title} · {s.wordCount}w
                    </div>
                    <div style={{ opacity: 0.95, fontStyle: 'italic' }}>{s.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  background: INK,
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
  letterSpacing: 0.3,
};

const btnGhost: React.CSSProperties = {
  ...btnPrimary,
  background: 'transparent',
  color: TYRIAN,
  border: `1px solid rgba(255,255,255,0.08)`,
};
