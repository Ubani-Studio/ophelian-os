'use client';

/**
 * MemoryPanel · the four-layer memory surface.
 *
 *   Layer 4 (episodic): rolling, auto-pruned. Recent activity. Listed.
 *   Layer 2 (canon): long-term, human-curated, signed. Authoritative timeline.
 *
 * The user reviews episodes and promotes the meaningful ones to canon.
 * Canon is what flows into the tick prompt as authoritative biography.
 *
 * Layer 1 (constitution) lives in CorpusPanel + VoicePanel.
 * Layer 3 (monthly digest) is a future patch.
 */

import { useEffect, useState } from 'react';
import {
  listEpisodes,
  writeEpisode,
  listCanon,
  createCanon,
  promoteEpisodeToCanon,
  retractCanonEntry,
  type Character,
  type MemoryEpisode,
  type CanonEntry,
} from '@/lib/api';

const TYRIAN = '#66023C';
const INK = '#0E0E0F';

export function MemoryPanel({ character }: { character: Character }) {
  const [open, setOpen] = useState(false);
  const [episodes, setEpisodes] = useState<MemoryEpisode[]>([]);
  const [canon, setCanon] = useState<CanonEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'canon' | 'episodes' | 'add'>('canon');

  // add-episode form
  const [epKind, setEpKind] = useState('thought');
  const [epContent, setEpContent] = useState('');

  // create-canon form
  const [canonTitle, setCanonTitle] = useState('');
  const [canonBody, setCanonBody] = useState('');
  const [canonOccurredAt, setCanonOccurredAt] = useState('');
  const [canonTags, setCanonTags] = useState('');
  const [canonScope, setCanonScope] = useState<'public' | 'licensed_only' | 'private'>('public');

  useEffect(() => {
    if (open) void loadAll();
  }, [open]);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [e, c] = await Promise.all([listEpisodes(character.id), listCanon(character.id)]);
      setEpisodes(e.episodes);
      setCanon(c.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load memory');
    } finally {
      setLoading(false);
    }
  }

  async function addEpisode() {
    if (!epContent.trim()) return;
    setLoading(true);
    try {
      await writeEpisode(character.id, { kind: epKind, content: epContent.trim() });
      setEpContent('');
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function addCanon() {
    if (!canonTitle.trim() || !canonBody.trim()) return;
    setLoading(true);
    try {
      await createCanon(character.id, {
        title: canonTitle.trim(),
        body: canonBody.trim(),
        occurredAt: canonOccurredAt || undefined,
        tags: canonTags.split(',').map((t) => t.trim()).filter(Boolean),
        scope: canonScope,
      });
      setCanonTitle('');
      setCanonBody('');
      setCanonOccurredAt('');
      setCanonTags('');
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function promote(ep: MemoryEpisode) {
    const title = window.prompt('Canon title?', ep.content.slice(0, 60));
    if (!title) return;
    setLoading(true);
    try {
      await promoteEpisodeToCanon(character.id, { episodeId: ep.id, title });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function retract(entry: CanonEntry) {
    const reason = window.prompt('Reason for retraction?');
    if (!reason) return;
    setLoading(true);
    try {
      await retractCanonEntry(character.id, entry.id, reason);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ border: `1px solid rgba(255,255,255,0.06)`, borderRadius: 0, marginTop: 12, background: '#0a0a0a' }}>
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
        <span>Memory</span>
        <span style={{ color: TYRIAN, fontSize: 11, opacity: 0.7 }}>
          {canon.filter((c) => !c.retractedAt).length} canon · {episodes.length} episodes {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 16px 16px', color: '#d8d8d8', fontSize: 13, lineHeight: 1.5 }}>
          <p style={{ opacity: 0.55, fontSize: 11, marginBottom: 12, lineHeight: 1.5 }}>
            Canon is authoritative biography. Signed, append-only, injected into prompts.
            Episodes are rolling memory. Auto-pruned after 30 days unless promoted to canon.
          </p>

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

          {/* tab bar */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {(['canon', 'episodes', 'add'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} style={tab === t ? tabBtnActive : tabBtn}>
                {t}
              </button>
            ))}
            <button onClick={loadAll} disabled={loading} style={{ ...tabBtn, marginLeft: 'auto' }}>
              ↻
            </button>
          </div>

          {tab === 'canon' && (
            <div style={{ display: 'grid', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
              {canon.length === 0 && <div style={{ opacity: 0.5, fontSize: 12 }}>No canon entries yet.</div>}
              {canon.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: 10,
                    background: '#111',
                    borderLeft: `3px solid ${c.retractedAt ? '#aa4444' : TYRIAN}`,
                    borderRadius: 0,
                    opacity: c.retractedAt ? 0.5 : 1,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ color: '#e8e8e8', fontSize: 13 }}>{c.title}</strong>
                    <span style={{ fontSize: 11, opacity: 0.55 }}>
                      {c.occurredAt ? new Date(c.occurredAt).toLocaleDateString() : new Date(c.signedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>{c.body}</div>
                  <div style={{ fontSize: 10, opacity: 0.45, marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span>scope: {c.scope}</span>
                    {c.tags.length > 0 && <span>tags: {c.tags.join(', ')}</span>}
                    {c.signedBy && <span>signed by {c.signedBy}</span>}
                    {c.attestationId && <span title={c.attestationId}>· {c.attestationId.slice(0, 24)}…</span>}
                  </div>
                  {c.retractedAt ? (
                    <div style={{ fontSize: 10, color: '#dd9999', marginTop: 4 }}>
                      retracted: {c.retractionReason}
                    </div>
                  ) : (
                    <button onClick={() => retract(c)} style={smallBtn}>
                      retract
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'episodes' && (
            <div style={{ display: 'grid', gap: 6, maxHeight: 360, overflowY: 'auto' }}>
              {episodes.length === 0 && <div style={{ opacity: 0.5, fontSize: 12 }}>No active episodes.</div>}
              {episodes.map((ep) => (
                <div
                  key={ep.id}
                  style={{
                    padding: 8,
                    background: '#111',
                    borderLeft: '2px solid #555',
                    borderRadius: 0,
                  }}
                >
                  <div style={{ fontSize: 11, opacity: 0.55, marginBottom: 3 }}>
                    {ep.kind} · {new Date(ep.createdAt).toLocaleString()} · expires{' '}
                    {new Date(ep.expiresAt).toLocaleDateString()}
                    {ep.promotedToCanonId && <> · <span style={{ color: TYRIAN }}>promoted</span></>}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>{ep.content}</div>
                  {!ep.promotedToCanonId && (
                    <button onClick={() => promote(ep)} style={smallBtn}>
                      promote to canon →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'add' && (
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <div style={{ marginBottom: 6, fontSize: 12, opacity: 0.7 }}>Add episode (Layer 4)</div>
                <select value={epKind} onChange={(e) => setEpKind(e.target.value)} style={inputStyle}>
                  <option value="thought">thought</option>
                  <option value="post">post</option>
                  <option value="reaction">reaction</option>
                  <option value="collab">collab</option>
                  <option value="external_event">external_event</option>
                  <option value="user_input">user_input</option>
                </select>
                <textarea
                  value={epContent}
                  onChange={(e) => setEpContent(e.target.value)}
                  placeholder="What happened?"
                  rows={3}
                  style={{ ...inputStyle, marginTop: 6 }}
                />
                <button onClick={addEpisode} disabled={loading || !epContent.trim()} style={btnPrimary}>
                  Add episode
                </button>
              </div>

              <div>
                <div style={{ marginBottom: 6, fontSize: 11, opacity: 0.55 }}>Add canon entry. Signed, append-only.</div>
                <input
                  value={canonTitle}
                  onChange={(e) => setCanonTitle(e.target.value)}
                  placeholder="Title"
                  style={inputStyle}
                />
                <textarea
                  value={canonBody}
                  onChange={(e) => setCanonBody(e.target.value)}
                  placeholder="What is true about this character?"
                  rows={3}
                  style={{ ...inputStyle, marginTop: 6 }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 6 }}>
                  <input
                    type="date"
                    value={canonOccurredAt}
                    onChange={(e) => setCanonOccurredAt(e.target.value)}
                    style={inputStyle}
                  />
                  <input
                    value={canonTags}
                    onChange={(e) => setCanonTags(e.target.value)}
                    placeholder="tags, comma-sep"
                    style={inputStyle}
                  />
                  <select
                    value={canonScope}
                    onChange={(e) => setCanonScope(e.target.value as 'public' | 'licensed_only' | 'private')}
                    style={inputStyle}
                  >
                    <option value="public">public</option>
                    <option value="licensed_only">licensed_only</option>
                    <option value="private">private</option>
                  </select>
                </div>
                <button
                  onClick={addCanon}
                  disabled={loading || !canonTitle.trim() || !canonBody.trim()}
                  style={btnPrimary}
                >
                  Sign + add to canon
                </button>
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
  marginTop: 8,
  padding: '6px 12px',
  background: TYRIAN,
  color: '#fff',
  border: 'none',
  borderRadius: 0,
  cursor: 'pointer',
  fontSize: 11,
  letterSpacing: 0.3,
};

const smallBtn: React.CSSProperties = {
  marginTop: 6,
  padding: '3px 8px',
  background: 'transparent',
  color: TYRIAN,
  border: `1px solid rgba(255,255,255,0.08)`,
  borderRadius: 0,
  cursor: 'pointer',
  fontSize: 10,
  letterSpacing: 0.3,
};

const tabBtn: React.CSSProperties = {
  padding: '4px 10px',
  background: 'transparent',
  color: '#888',
  border: '1px solid #333',
  borderRadius: 0,
  cursor: 'pointer',
  fontSize: 11,
  letterSpacing: 0.3,
};

const tabBtnActive: React.CSSProperties = {
  ...tabBtn,
  color: TYRIAN,
  border: `1px solid ${TYRIAN}`,
  background: `${TYRIAN}11`,
};
