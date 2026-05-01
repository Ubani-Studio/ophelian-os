'use client';

/**
 * SovereigntyBadge · the data-lineage glyph for a Character.
 *
 * Three levels per docs/sovereignty.md:
 *   ◯  Level 0 — Substrate (Claude only, no licensed LoRAs)
 *   ◇  Level 1 — Partial sovereignty (Claude + cohort LoRAs)
 *   ◆  Level 2 — Full sovereignty (open-weights base + cohort LoRAs)
 *
 * The badge is a quiet glyph. Tooltip surfaces base model + LoRA
 * pins. No text by default — the glyph alone reads as the lineage.
 *
 * Reads from Character.identity.sovereignty. Falls through silently
 * when the envelope is absent (existing characters default to L0
 * but show no badge until explicitly classified).
 */

const TYRIAN = '#66023C';

type Level = 0 | 1 | 2;

interface SovereigntyShape {
  level?: Level;
  base_model?: string;
  inference_path?: string;
  lora_pins?: Array<{
    lora_id: string;
    contributor_id?: string;
    weight?: number;
    role?: string;
  }>;
}

const GLYPH: Record<Level, string> = { 0: '◯', 1: '◇', 2: '◆' };
const LABEL: Record<Level, string> = {
  0: 'substrate',
  1: 'partial',
  2: 'sovereign',
};

function readSovereignty(identity: unknown): SovereigntyShape | null {
  if (!identity || typeof identity !== 'object') return null;
  const env = identity as Record<string, unknown>;
  const sovereignty = env.sovereignty as SovereigntyShape | undefined;
  if (!sovereignty || typeof sovereignty !== 'object') return null;
  return sovereignty;
}

function buildTooltip(s: SovereigntyShape, level: Level): string {
  const parts: string[] = [`Sovereignty ${LABEL[level]}`];
  if (s.base_model) parts.push(`base: ${s.base_model}`);
  if (s.inference_path) parts.push(`via ${s.inference_path}`);
  if (s.lora_pins && s.lora_pins.length > 0) {
    const summary = s.lora_pins
      .map((p) => `${p.role ?? 'lora'}@${p.weight ?? 1}`)
      .join(', ');
    parts.push(`LoRAs: ${summary}`);
  }
  return parts.join(' · ');
}

export function SovereigntyBadge({
  identity,
  size = 'normal',
}: {
  identity: unknown;
  size?: 'normal' | 'small';
}) {
  const sovereignty = readSovereignty(identity);
  if (!sovereignty || sovereignty.level === undefined) return null;
  const level = sovereignty.level as Level;

  const fontSize = size === 'small' ? '0.75rem' : '0.9rem';
  const padding = size === 'small' ? '0.05rem 0.3rem' : '0.15rem 0.45rem';
  const fillColor = level === 2 ? TYRIAN : level === 1 ? TYRIAN : 'var(--muted-foreground)';
  const borderColor =
    level === 2 ? TYRIAN : level === 1 ? TYRIAN : 'var(--border)';
  const opacity = level === 0 ? 0.55 : 1;

  return (
    <span
      title={buildTooltip(sovereignty, level)}
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: '0.3rem',
        padding,
        border: `1px solid ${borderColor}`,
        background: 'transparent',
        color: fillColor,
        fontSize,
        fontFamily: 'monospace',
        letterSpacing: '0.18em',
        lineHeight: 1,
        borderRadius: 0,
        textTransform: 'lowercase',
        opacity,
      }}
    >
      <span>{GLYPH[level]}</span>
      {size !== 'small' && (
        <span style={{ fontSize: '0.55rem', color: 'var(--muted-foreground)' }}>
          · {LABEL[level]}
        </span>
      )}
    </span>
  );
}
