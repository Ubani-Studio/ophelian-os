'use client';

/**
 * PresencePill. Tiny visual cue: dot + last-active + current location.
 *
 * online   ≤ 15 min   green
 * idle     ≤ 2 hours  amber
 * away     ≤ 24 hours grey
 * dormant  > 24 hours faint outline
 *
 * Designed to live in the Trail row and the character page header.
 */

import type { Character } from '@/lib/api';

const COLOR: Record<NonNullable<Character['presence']>['status'], string> = {
  online: '#7fc77f',
  idle: '#c5a35f',
  away: '#666',
  dormant: 'transparent',
};

const LABEL: Record<NonNullable<Character['presence']>['status'], string> = {
  online: 'online',
  idle: 'idle',
  away: 'away',
  dormant: 'quiet',
};

function formatAgo(iso: string | null): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return 'just now';
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

export function PresencePill({
  presence,
  size = 'sm',
  showLocation = true,
}: {
  presence: NonNullable<Character['presence']> | null | undefined;
  size?: 'sm' | 'xs';
  showLocation?: boolean;
}) {
  if (!presence) return null;
  const dotColor = COLOR[presence.status];
  const dotBorder = presence.status === 'dormant' ? '1px solid rgba(255,255,255,0.15)' : 'none';
  const fontSize = size === 'xs' ? 10 : 11;
  const dotSize = size === 'xs' ? 5 : 6;

  const ago = formatAgo(presence.lastActivityAt);
  const loc = showLocation ? presence.currentLocation : null;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize,
        opacity: presence.status === 'dormant' ? 0.4 : 0.7,
        color: 'var(--muted-foreground)',
        letterSpacing: 0.2,
      }}
    >
      <span
        style={{
          width: dotSize,
          height: dotSize,
          background: dotColor,
          border: dotBorder,
          display: 'inline-block',
          flexShrink: 0,
        }}
        title={`${LABEL[presence.status]}${ago ? ' · ' + ago : ''}`}
      />
      <span style={{ fontFamily: 'monospace', fontSize: fontSize - 1 }}>
        {LABEL[presence.status]}
      </span>
      {ago && (
        <span style={{ opacity: 0.6 }}>
          · {ago}
        </span>
      )}
      {loc && (
        <span style={{ opacity: 0.55, fontStyle: 'italic' }}>
          · at {loc}
        </span>
      )}
    </span>
  );
}
