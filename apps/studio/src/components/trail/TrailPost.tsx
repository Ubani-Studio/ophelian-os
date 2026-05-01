'use client';

/**
 * TrailPost · form-aware rendering of a single tick act.
 *
 * Each post form (ritual, song, fragment, monologue, scene,
 * description, letter, journal-entry, dialogue, message, thought,
 * verse, track, note, quest, noop) renders with its own typography
 * and rhythm. Whitespace is the structuring element.
 *
 * Retention surfaces on hover (a single small action, not a column).
 * Audio play affordance is a placeholder for Chromox.
 */

import { useState } from 'react';

const TYRIAN = '#66023C';

export interface TrailPostData {
  ts: string;
  edgeId: string;
  kind: string;
  form?: string;
  summary: string;
  body?: string;
  retention: 'ephemeral' | 'canonical';
  rolled_back: boolean;
  counterpartName: string;
}

interface TrailPostProps {
  post: TrailPostData;
  onToggleRetention: () => void;
  busy: boolean;
}

function formatRelative(ts: string): string {
  const ms = Date.now() - new Date(ts).getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (ms < minute) return 'just now';
  if (ms < hour) return `${Math.floor(ms / minute)}m ago`;
  if (ms < day) return `${Math.floor(ms / hour)}h ago`;
  return `${Math.floor(ms / day)}d ago`;
}

export function TrailPost({ post, onToggleRetention, busy }: TrailPostProps) {
  const [hover, setHover] = useState(false);
  const form = post.form ?? post.kind;
  const text = post.body && post.body !== post.summary ? post.body : post.summary;
  const canonical = post.retention === 'canonical';

  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        padding: '1.25rem 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <FormBody form={form} text={text} counterpart={post.counterpartName} summary={post.summary} />

      <footer
        style={{
          marginTop: '0.85rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'baseline',
          fontSize: '0.55rem',
          fontFamily: 'monospace',
          letterSpacing: '0.18em',
          color: 'var(--muted-foreground)',
          textTransform: 'lowercase',
        }}
      >
        <span title={post.ts}>{formatRelative(post.ts)}</span>
        <span style={{ opacity: 0.65 }}>{form}</span>
        {post.counterpartName && form !== 'thought' && form !== 'noop' && (
          <span style={{ opacity: 0.65 }}>· w/ {post.counterpartName}</span>
        )}
        <span style={{ flex: 1 }} />
        <button
          type="button"
          onClick={onToggleRetention}
          disabled={busy}
          title={canonical ? 'canonical · click to demote' : 'ephemeral · click to keep'}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: busy ? 'wait' : 'pointer',
            color: canonical ? TYRIAN : 'var(--muted-foreground)',
            fontFamily: 'monospace',
            fontSize: '0.55rem',
            letterSpacing: '0.2em',
            textTransform: 'lowercase',
            opacity: hover || canonical ? 1 : 0.35,
            transition: 'opacity 0.15s',
          }}
        >
          {busy ? '...' : canonical ? 'kept' : 'keep'}
        </button>
      </footer>
    </article>
  );
}

function FormBody({
  form,
  text,
  counterpart,
  summary,
}: {
  form: string;
  text: string;
  counterpart: string;
  summary: string;
}) {
  switch (form) {
    case 'ritual':
      return (
        <div
          style={{
            textAlign: 'center',
            fontFamily: '"Canela", serif',
            fontWeight: 300,
            fontStyle: 'italic',
            fontSize: '1.4rem',
            lineHeight: 1.45,
            color: 'var(--foreground)',
            padding: '1.5rem 2rem',
            maxWidth: '52ch',
            margin: '0 auto',
            letterSpacing: '0.005em',
          }}
        >
          {text}
        </div>
      );

    case 'song':
    case 'track':
    case 'verse':
    case 'lyrics':
      return (
        <pre
          style={{
            fontFamily: '"Canela", serif',
            fontSize: '1.05rem',
            fontWeight: 300,
            lineHeight: 1.7,
            margin: 0,
            padding: '0 1rem',
            whiteSpace: 'pre-wrap',
            color: 'var(--foreground)',
            maxWidth: '54ch',
            borderLeft: `1px solid ${TYRIAN}`,
          }}
        >
          {text}
        </pre>
      );

    case 'fragment':
      return (
        <div
          style={{
            fontFamily: '"Canela", serif',
            fontSize: '1.1rem',
            fontWeight: 300,
            lineHeight: 1.55,
            color: 'var(--foreground)',
            maxWidth: '46ch',
            fontStyle: 'italic',
          }}
        >
          {text}
        </div>
      );

    case 'message':
    case 'dialogue':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          <div
            style={{
              fontSize: '0.5rem',
              fontFamily: 'monospace',
              letterSpacing: '0.32em',
              color: TYRIAN,
              textTransform: 'uppercase',
            }}
          >
            → {counterpart}
          </div>
          <blockquote
            style={{
              margin: 0,
              padding: '0.4rem 0 0.4rem 1.1rem',
              borderLeft: `2px solid ${TYRIAN}`,
              fontSize: '0.95rem',
              lineHeight: 1.65,
              color: 'var(--foreground)',
              maxWidth: '60ch',
            }}
          >
            {text}
          </blockquote>
        </div>
      );

    case 'monologue':
      return (
        <div
          style={{
            fontSize: '0.95rem',
            lineHeight: 1.75,
            color: 'var(--foreground)',
            maxWidth: '64ch',
            paddingLeft: '1rem',
            borderLeft: '1px solid var(--border)',
          }}
        >
          {text}
        </div>
      );

    case 'scene':
    case 'description':
    case 'freeform':
      return (
        <div
          style={{
            fontSize: '0.95rem',
            lineHeight: 1.7,
            color: 'var(--foreground)',
            maxWidth: '62ch',
          }}
        >
          {text}
        </div>
      );

    case 'letter':
      return (
        <div
          style={{
            fontFamily: '"Canela", serif',
            fontSize: '1rem',
            fontWeight: 300,
            lineHeight: 1.7,
            color: 'var(--foreground)',
            maxWidth: '58ch',
            padding: '1rem 1.25rem',
            border: '1px solid var(--border)',
            background: 'rgba(255,255,255,0.015)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {text}
        </div>
      );

    case 'journal-entry':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div
            style={{
              fontSize: '0.55rem',
              fontFamily: 'monospace',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'var(--muted-foreground)',
            }}
          >
            entry
          </div>
          <div
            style={{
              fontSize: '0.92rem',
              lineHeight: 1.7,
              color: 'var(--foreground)',
              maxWidth: '60ch',
              fontStyle: 'italic',
              fontFamily: '"Canela", serif',
              fontWeight: 300,
            }}
          >
            {text}
          </div>
        </div>
      );

    case 'quest':
      return (
        <div
          style={{
            border: `1px solid ${TYRIAN}`,
            padding: '1rem 1.25rem',
            background: 'rgba(102,2,60,0.05)',
            maxWidth: '58ch',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.55rem',
          }}
        >
          <div
            style={{
              fontSize: '0.55rem',
              fontFamily: 'monospace',
              letterSpacing: '0.32em',
              color: TYRIAN,
              textTransform: 'uppercase',
            }}
          >
            quest → {counterpart}
          </div>
          <div style={{ fontSize: '0.92rem', lineHeight: 1.6 }}>{summary}</div>
          {text !== summary && (
            <div style={{ fontSize: '0.82rem', lineHeight: 1.65, color: 'var(--muted-foreground)' }}>
              {text}
            </div>
          )}
        </div>
      );

    case 'noop':
      return (
        <div
          style={{
            fontFamily: '"Canela", serif',
            fontSize: '0.92rem',
            fontStyle: 'italic',
            fontWeight: 300,
            color: 'var(--muted-foreground)',
            opacity: 0.7,
            paddingLeft: '0.5rem',
          }}
        >
          {text}
        </div>
      );

    case 'note':
      return (
        <div
          style={{
            fontSize: '0.85rem',
            lineHeight: 1.55,
            color: 'var(--foreground)',
            fontFamily: 'monospace',
            maxWidth: '60ch',
            paddingLeft: '0.6rem',
            borderLeft: `1px dashed var(--border)`,
          }}
        >
          {text}
        </div>
      );

    case 'thought':
    default:
      return (
        <div
          style={{
            fontSize: '0.92rem',
            lineHeight: 1.65,
            color: 'var(--foreground)',
            fontStyle: 'italic',
            fontFamily: '"Canela", serif',
            fontWeight: 300,
            paddingLeft: '0.6rem',
            maxWidth: '58ch',
          }}
        >
          {text}
        </div>
      );
  }
}
