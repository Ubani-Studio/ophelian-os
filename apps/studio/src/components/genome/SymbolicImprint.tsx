/**
 * Symbolic Imprint Display Component
 * Shows Layer 1 (Surface) view of character genome
 */

import React from 'react';
import { HelpIcon } from './HelpIcon';

interface SymbolicImprintProps {
  symbol: string;      // λ
  primitive: string;   // ⬡
  label: string;       // Architect
  aestheticClass: string; // L-3 (Industrial)
  showHelp?: boolean;  // Show help icon with explanation
  onHover?: () => void;
  onClick?: () => void;
}

export function SymbolicImprint({
  symbol,
  primitive,
  label,
  aestheticClass,
  showHelp = false,
  onHover,
  onClick,
}: SymbolicImprintProps) {
  return (
    <div
      className="symbolic-imprint"
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--foreground)';
        onHover?.();
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        padding: '1.5rem',
        backgroundColor: '#000000',
        border: '1px solid var(--border)',
        borderRadius: '0',
        transition: 'border-color 0.2s ease',
        textAlign: 'center',
      }}
    >
      <div className="imprint-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
        <span className="imprint-symbol" style={{ fontSize: '2.5rem', fontWeight: 300 }}>
          {symbol}
        </span>
        {showHelp && (
          <HelpIcon
            title="Symbolic Imprint"
            content={
              <div>
                <p>This is your character's symbolic signature:</p>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', lineHeight: 1.6 }}>
                  <li><strong>{symbol}</strong> - Mathematical symbol representing the Orisha's essence</li>
                  <li><strong>{primitive}</strong> - Geometric primitive for visual recognition</li>
                  <li><strong>{aestheticClass}</strong> - Classification code</li>
                </ul>
                <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', opacity: 0.8 }}>
                  Visit the <strong>Symbols</strong> page to learn about all archetypes.
                </p>
              </div>
            }
            position="right"
          />
        )}
      </div>
      <div className="imprint-label" style={{ fontSize: '1.25rem', fontWeight: 500, marginTop: '0.25rem' }}>
        {label}
      </div>
      <div className="imprint-class" style={{ fontSize: '0.875rem', opacity: 0.6, marginTop: '0.125rem' }}>
        {aestheticClass}
      </div>
    </div>
  );
}

interface ImprintBadgeProps {
  symbol: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export function ImprintBadge({ symbol, size = 'md', showTooltip = true }: ImprintBadgeProps) {
  const sizeMap = {
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
  };

  return (
    <span
      className="imprint-badge"
      style={{
        fontSize: sizeMap[size],
        fontWeight: 300,
        opacity: 0.9,
        cursor: showTooltip ? 'help' : 'default',
      }}
      title={showTooltip ? 'Hover for details' : undefined}
    >
      {symbol}
    </span>
  );
}

interface MarkerListProps {
  markers: string[];
}

export function MarkerList({ markers }: MarkerListProps) {
  return (
    <div className="marker-list" style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
      <span style={{ fontSize: '0.75rem', opacity: 0.5, textTransform: 'none', letterSpacing: '0.05em' }}>
        Symbolic Markers
      </span>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {markers.map((marker, i) => (
          <span
            key={i}
            style={{
              fontSize: '1.125rem',
              fontWeight: 300,
              opacity: 0.7,
              cursor: 'help',
            }}
            title="Hover for meaning"
          >
            {marker}
          </span>
        ))}
      </div>
    </div>
  );
}
