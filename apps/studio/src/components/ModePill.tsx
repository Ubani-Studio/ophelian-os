'use client';

/**
 * ModePill
 *
 * Surfaces a character's agency mode next to their name. The colour
 * + label do the work:
 *
 *   manual    → silent grey, "Manual". Author-only. The human user.
 *   twin      → ghost-purple outline, "Twin · of {name}". Paired AI.
 *   espíritu  → tyrian filled, "Espíritu". Autonomous. The bóveda holds.
 *   relic     → faint dotted, "Relic". Frozen; memory remains, will silent.
 */

const TYRIAN = '#66023C';

type Mode = 'manual' | 'twin' | 'espíritu' | 'relic';

export function ModePill({
  mode,
  twinOfName,
}: {
  mode?: Mode | string;
  twinOfName?: string | null;
}) {
  const m = (mode as Mode) || 'espíritu';

  const styles: Record<Mode, React.CSSProperties> = {
    manual: {
      color: 'rgba(255,255,255,0.5)',
      border: '1px solid rgba(255,255,255,0.18)',
      background: 'transparent',
    },
    twin: {
      color: 'rgba(180, 130, 170, 0.95)',
      border: `1px solid ${TYRIAN}`,
      background: 'transparent',
    },
    'espíritu': {
      color: '#fff',
      border: `1px solid ${TYRIAN}`,
      background: TYRIAN,
    },
    relic: {
      color: 'rgba(255,255,255,0.3)',
      border: '1px dashed rgba(255,255,255,0.18)',
      background: 'transparent',
    },
  };

  const labels: Record<Mode, string> = {
    manual: 'Manual',
    twin: twinOfName ? `Twin · of ${twinOfName}` : 'Twin',
    'espíritu': 'Espíritu',
    relic: 'Relic',
  };

  return (
    <span
      title={tooltipFor(m)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.18rem 0.55rem',
        fontSize: '0.55rem',
        letterSpacing: '0.18em',
        textTransform: 'lowercase',
        fontFamily: 'monospace',
        ...styles[m],
      }}
    >
      {labels[m].toLowerCase()}
    </span>
  );
}

function tooltipFor(m: Mode): string {
  switch (m) {
    case 'manual':
      return 'Manual · author-only. The human user. Cannot act autonomously.';
    case 'twin':
      return 'Twin · paired AI. Bounded autonomy inside agencyScope. Always tagged with provenance.';
    case 'espíritu':
      return 'Espíritu · fully autonomous. Goals + memory + voice. The bóveda altar holds espíritus.';
    case 'relic':
      return 'Relic · frozen. Memory remains, will is silent. Default posthumous state.';
  }
}
