'use client';

/**
 * SubtasteBadge · the new Subtaste twelve glyph for a Character.
 * Reads from timelineState.oripheon.generated.subtaste.code (already
 * computed at character generation time) and renders the canonical
 * glyph + label. Sits next to the ModePill on the character header.
 *
 * Replaces the legacy orisha-archetype reference in bios. Bio is a
 * brief; classification is a glyph. Two jobs, two surfaces.
 */

import { SUBTASTE_DESIGNATIONS } from '@lcos/oripheon';

const TYRIAN = '#66023C';

export function SubtasteBadge({
  timelineState,
}: {
  timelineState: unknown;
}) {
  const code = readSubtasteCode(timelineState);
  if (!code) return null;
  const designation = SUBTASTE_DESIGNATIONS[code];
  if (!designation) return null;

  return (
    <span
      title={`${designation.label} · ${designation.description}`}
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: '0.4rem',
        padding: '0.2rem 0.55rem',
        border: `1px solid ${TYRIAN}`,
        background: 'transparent',
        color: 'var(--foreground)',
        fontSize: '0.6rem',
        fontFamily: 'monospace',
        letterSpacing: '0.16em',
        lineHeight: 1,
        borderRadius: 0,
      }}
    >
      <span style={{ color: TYRIAN, letterSpacing: '0.05em' }}>{designation.glyph}</span>
      <span style={{ color: 'var(--muted-foreground)', textTransform: 'lowercase' }}>
        · {designation.label}
      </span>
    </span>
  );
}

function readSubtasteCode(timelineState: unknown): string | null {
  if (!timelineState || typeof timelineState !== 'object') return null;
  const ts = timelineState as Record<string, unknown>;
  const oripheon = ts.oripheon as Record<string, unknown> | undefined;
  const generated = oripheon?.generated as Record<string, unknown> | undefined;
  const subtaste = generated?.subtaste as Record<string, unknown> | undefined;
  const code = subtaste?.code;
  return typeof code === 'string' ? code : null;
}
