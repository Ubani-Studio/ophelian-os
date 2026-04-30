'use client';

import { useEffect, useState } from 'react';
import { getSurfaceView, getGatewayHint } from '@lcos/oripheon';
import type { CharacterGenome } from '../../lib/imprint-api';
import styles from './GenomePuzzleUnlock.module.css';

interface LiveImprintPreviewProps {
  genome: CharacterGenome | null;
  isGenerating?: boolean;
}

export function LiveImprintPreview({ genome, isGenerating }: LiveImprintPreviewProps) {
  const [surface, setSurface] = useState<ReturnType<typeof getSurfaceView> | null>(null);
  const [gateway, setGateway] = useState<ReturnType<typeof getGatewayHint> | null>(null);

  useEffect(() => {
    if (genome) {
      try {
        setSurface(getSurfaceView(genome as any));
        setGateway(getGatewayHint(genome as any));
      } catch (error) {
        console.error('Error generating imprint preview:', error);
        setSurface(null);
        setGateway(null);
      }
    } else {
      setSurface(null);
      setGateway(null);
    }
  }, [genome]);

  if (isGenerating) {
    return (
      <div
        style={{
          padding: '1.5rem',
          backgroundColor: 'var(--muted)',
          borderRadius: '12px',
          textAlign: 'center',
          color: 'var(--muted-foreground)',
          fontSize: '0.875rem',
        }}
      >
        Generating symbolic imprint...
      </div>
    );
  }

  if (!genome || !surface) {
    return (
      <div
        style={{
          padding: '1.5rem',
          backgroundColor: 'var(--muted)',
          borderRadius: '12px',
          textAlign: 'center',
          color: 'var(--muted-foreground)',
          fontSize: '0.875rem',
        }}
      >
        Select an Orisha to see the symbolic imprint preview
      </div>
    );
  }

  return (
    <div
      className={styles.detailsContainer}
      style={{
        padding: '1.5rem',
        backgroundColor: 'var(--card)',
        border: '2px solid var(--border)',
        borderRadius: '12px',
      }}
    >
      <div
        style={{
          fontSize: '0.75rem',
          textTransform: 'none',
          letterSpacing: '0.1em',
          color: 'var(--muted-foreground)',
          marginBottom: '1rem',
        }}
      >
        Symbolic Imprint Preview
      </div>

      {/* Surface Layer - Symbolic Imprint */}
      <div
        style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: 'var(--muted)',
          borderRadius: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
          <div
            style={{
              fontSize: '3rem',
              fontWeight: 300,
              lineHeight: 1,
            }}
          >
            {surface.imprint.symbol}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                marginBottom: '0.25rem',
              }}
            >
              {surface.imprint.label}
            </div>
            <div
              style={{
                fontSize: '0.875rem',
                color: 'var(--muted-foreground)',
              }}
            >
              {surface.imprint.primitive}
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--muted-foreground)',
            opacity: 0.7,
          }}
        >
          {surface.classification}
        </div>
      </div>

      {/* Gateway Layer - Hints */}
      {gateway && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--background)',
            borderRadius: '8px',
            borderLeft: '3px solid var(--primary)',
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              textTransform: 'none',
              letterSpacing: '0.1em',
              color: 'var(--muted-foreground)',
              marginBottom: '0.5rem',
            }}
          >
            Gateway Hints
          </div>
          <div style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Mythic Role:</strong> {(gateway as any).mythicRole}
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Core Tension:</strong> {(gateway as any).coreTension}
            </div>
            <div>
              <strong>Sacred Path:</strong> {(gateway as any).sacredPath}
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: '1rem',
          fontSize: '0.7rem',
          color: 'var(--muted-foreground)',
          textAlign: 'center',
          fontStyle: 'italic',
        }}
      >
        This preview updates as you configure the genome
      </div>
    </div>
  );
}
