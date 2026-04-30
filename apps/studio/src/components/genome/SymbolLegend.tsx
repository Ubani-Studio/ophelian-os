/**
 * Symbol Legend Component
 * Interactive reference guide for all Orisha symbols
 * Part of Progressive Disclosure - makes Layer 1 discoverable
 */

'use client';

import React, { useState } from 'react';
import type { OrishaName } from '@lcos/oripheon';
import { getSymbolicImprint, ORISHA_DATA, SUBTASTE_DESIGNATIONS, SUBTASTE_ARROWS } from '@lcos/oripheon';
import { EnhancedGatewayTooltip } from './EnhancedGatewayTooltip';
import { SymbolicImprint } from './SymbolicImprint';
import styles from './SymbolLegend.module.css';

// All 12 Orishas mapped to THE TWELVE subtastes + NULL
const ALL_ORISHAS: OrishaName[] = [
  'Obàtálá',    // S-0 KĔṮU - vision
  'Ọ̀rúnmìlà',  // T-1 LŌRχE - refinement
  'Èṣù',        // V-2 ØMÆRA - vision
  'Yemọja',     // L-3 Dū·ṂȺ - manifestation
  'Ọ̀ṣọ́ọ̀sì',   // C-4 ΞDŌN - refinement
  'Ọ̀ṣun',      // N-5 LIMŊ - flow
  'Ṣàngó',      // H-6 ȺBŌLT - manifestation
  'Ọ̀sanyìn',   // P-7 ȺRVŌ - flow
  'Olókun',     // D-8 RŌχ - flow
  'Ògún',       // F-9 K̄ALØN - genesis
  'Ọya',        // R-10 TΞχRA - genesis
  'Babalú-Ayé', // NULL SÆ - flow
];

interface SymbolCardProps {
  orisha: OrishaName;
}

function SymbolCard({ orisha }: SymbolCardProps) {
  const imprint = getSymbolicImprint(orisha);
  const orishaData = ORISHA_DATA[orisha];
  const subtaste = SUBTASTE_DESIGNATIONS[imprint.aestheticClass];

  return (
    <div className={styles.card}>
      <EnhancedGatewayTooltip
        orisha={orisha}
        title={subtaste?.glyph || imprint.label}
        keywords={imprint.keywords}
        essence={imprint.essence}
        creativePhase={imprint.creativePhase}
      >
        <div className={styles.cardContent}>
          {/* Symbol Display */}
          <div className={styles.symbolDisplay}>
            <SymbolicImprint
              symbol={imprint.symbol}
              primitive={imprint.primitive}
              label={subtaste?.glyph || imprint.label}
              aestheticClass={imprint.aestheticClass}
              onClick={() => {}}
            />
          </div>

          {/* Glyph Name */}
          <div className={styles.orishaName}>{subtaste?.glyph || imprint.label}</div>

          {/* Classification & Label */}
          <div className={styles.orishaTitle}>{imprint.aestheticClass} · {subtaste?.label || ''}</div>

          {/* Key Info */}
          <div className={styles.keyInfo}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Number:</span>
              <span className={styles.infoValue}>{orishaData.number}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Element:</span>
              <span className={styles.infoValue}>{orishaData.element}</span>
            </div>
          </div>

          {/* Color Palette */}
          <div className={styles.colorPalette}>
            {orishaData.colors.map((color, idx) => (
              <div
                key={idx}
                className={styles.colorSwatch}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>

          {/* Growth/Stress Arrows */}
          {(() => {
            const arrows = SUBTASTE_ARROWS[imprint.aestheticClass];
            if (!arrows) return null;
            const growthSubtaste = SUBTASTE_DESIGNATIONS[arrows.growth];
            const stressSubtaste = SUBTASTE_DESIGNATIONS[arrows.stress];
            return (
              <div className={styles.dynamicsRow}>
                <div className={styles.dynamicsArrow} title={`Growth → ${growthSubtaste?.label || arrows.growth}`}>
                  <span className={styles.arrowUp}>↗</span>
                  <span className={styles.arrowTarget}>{growthSubtaste?.glyph || arrows.growth}</span>
                </div>
                <div className={styles.dynamicsArrow} title={`Stress → ${stressSubtaste?.label || arrows.stress}`}>
                  <span className={styles.arrowDown}>↘</span>
                  <span className={styles.arrowTarget}>{stressSubtaste?.glyph || arrows.stress}</span>
                </div>
              </div>
            );
          })()}
        </div>
      </EnhancedGatewayTooltip>
    </div>
  );
}

// Creative Phase descriptions
const CREATIVE_PHASES: Record<string, { label: string; description: string }> = {
  'genesis': { label: 'Genesis', description: 'Origin point — where new patterns emerge from chaos' },
  'vision': { label: 'Vision', description: 'Clarity forms — seeing what could be' },
  'refinement': { label: 'Refinement', description: 'Honing the craft — precision and mastery' },
  'manifestation': { label: 'Manifestation', description: 'Bringing form — will into reality' },
  'flow': { label: 'Flow', description: 'Sustaining force — continuous creation' },
};

// Map Orisha to their Creative Phase (aligned with SUBTASTE_DESIGNATIONS)
const ORISHA_PHASES: Record<OrishaName, string> = {
  // Genesis phase (fire/creation) - F-9, R-10
  'Ògún': 'genesis',       // F-9 K̄ALØN - ignition
  'Ọya': 'genesis',        // R-10 TΞχRA - division
  // Vision phase (wood/scouting) - S-0, V-2
  'Obàtálá': 'vision',     // S-0 KĔṮU - witness
  'Èṣù': 'vision',         // V-2 ØMÆRA - translation
  // Refinement phase (metal/editing) - T-1, C-4
  'Ọ̀rúnmìlà': 'refinement', // T-1 LŌRχE - recursion
  'Ọ̀ṣọ́ọ̀sì': 'refinement',  // C-4 ΞDŌN - interruption
  // Manifestation phase (earth/driving) - L-3, H-6
  'Yemọja': 'manifestation', // L-3 Dū·ṂȺ - transport
  'Ṣàngó': 'manifestation',  // H-6 ȺBŌLT - amplification
  // Flow phase (water/channeling) - N-5, P-7, D-8, NULL
  'Ọ̀ṣun': 'flow',          // N-5 LIMŊ - binding
  'Ọ̀sanyìn': 'flow',       // P-7 ȺRVŌ - dampening
  'Olókun': 'flow',         // D-8 RŌχ - shadow
  'Babalú-Ayé': 'flow',     // NULL SÆ - anchor
};

interface SymbolLegendProps {
  searchable?: boolean;
}

export function SymbolLegend({ searchable = false }: SymbolLegendProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'tree'>('grid');

  const filteredOrishas = searchQuery
    ? ALL_ORISHAS.filter((orisha) => {
        const imprint = getSymbolicImprint(orisha);
        const orishaData = ORISHA_DATA[orisha];
        const searchLower = searchQuery.toLowerCase();

        return (
          orisha.toLowerCase().includes(searchLower) ||
          imprint.label.toLowerCase().includes(searchLower) ||
          imprint.keywords.some(k => k.toLowerCase().includes(searchLower)) ||
          orishaData.title.toLowerCase().includes(searchLower) ||
          imprint.aestheticClass.toLowerCase().includes(searchLower)
        );
      })
    : ALL_ORISHAS;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Symbol Legend</h1>
        <p className={styles.subtitle}>
          Discover the symbolic language of character genomes. Each Orisha represents
          a creative archetype expressed through mathematical symbols and geometric primitives.
        </p>
      </div>

      {/* Search (optional) */}
      {searchable && (
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search by name, symbol, or trait..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      )}

      {/* Legend Info */}
      <div className={styles.legendInfo}>
        <div className={styles.legendItem}>
          <div className={styles.legendIcon}>λ</div>
          <div className={styles.legendText}>
            <strong>Mathematical Symbol</strong>
            <span>Core essence expressed through notation</span>
          </div>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendIcon}>⬡</div>
          <div className={styles.legendText}>
            <strong>Geometric Primitive</strong>
            <span>Visual signature for quick recognition</span>
          </div>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendIcon}>F-9</div>
          <div className={styles.legendText}>
            <strong>Classification Code</strong>
            <span>THE TWELVE: S, T, V, L, C, N, H, P, D, F, R</span>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        <button
          onClick={() => setViewMode('grid')}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'none',
            letterSpacing: '0.08em',
            backgroundColor: viewMode === 'grid' ? 'var(--foreground)' : '#000000',
            color: viewMode === 'grid' ? 'var(--background)' : 'var(--foreground)',
            border: '1px solid var(--foreground)',
            borderRadius: '0',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          Grid View
        </button>
        <button
          onClick={() => setViewMode('tree')}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'none',
            letterSpacing: '0.08em',
            backgroundColor: viewMode === 'tree' ? 'var(--foreground)' : '#000000',
            color: viewMode === 'tree' ? 'var(--background)' : 'var(--foreground)',
            border: '1px solid var(--foreground)',
            borderRadius: '0',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          Creative Phases
        </button>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <>
          <div className={styles.grid}>
            {filteredOrishas.map((orisha) => (
              <SymbolCard key={orisha} orisha={orisha} />
            ))}
          </div>

          {/* No Results */}
          {filteredOrishas.length === 0 && (
            <div className={styles.noResults}>
              <p>No symbols found matching "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery('')}
                className={styles.clearButton}
              >
                Clear Search
              </button>
            </div>
          )}
        </>
      )}

      {/* Creative Phase Constellation View */}
      {viewMode === 'tree' && (() => {
        // Helper to render a node
        const PhaseNode = ({ orisha }: { orisha: OrishaName }) => {
          const imprint = getSymbolicImprint(orisha);
          const subtaste = SUBTASTE_DESIGNATIONS[imprint.aestheticClass];
          return (
            <div style={{
              padding: '1rem',
              backgroundColor: '#000000',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease',
              width: '120px',
              height: '120px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--foreground)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ fontSize: '1.75rem', fontWeight: 300, marginBottom: '0.25rem' }}>{imprint.symbol}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{subtaste?.glyph || imprint.label}</div>
              <div style={{ fontSize: '0.625rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>{imprint.aestheticClass}</div>
            </div>
          );
        };

        const phaseOrder = ['genesis', 'vision', 'refinement', 'manifestation', 'flow'];

        return (
          <div style={{
            maxWidth: '1000px',
            margin: '0 auto 3rem',
            padding: '2rem',
            border: '1px solid var(--border)',
            backgroundColor: '#000000',
          }}>
            {/* Title */}
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              textTransform: 'none',
              letterSpacing: '0.1em',
              color: 'var(--muted-foreground)',
              marginBottom: '0.5rem',
              textAlign: 'center',
            }}>
              Creative Phase Constellation
            </h3>
            <p style={{
              fontSize: '0.75rem',
              color: 'var(--muted-foreground)',
              textAlign: 'center',
              marginBottom: '2rem',
              opacity: 0.7,
            }}>
              The cycle of creation — from origin to sustaining force
            </p>

            {/* Phase Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {phaseOrder.map((phase) => {
                const phaseInfo = CREATIVE_PHASES[phase];
                const orishasInPhase = ALL_ORISHAS.filter(o => ORISHA_PHASES[o] === phase);

                return (
                  <div key={phase} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2rem',
                    padding: '1rem 1.5rem',
                    borderBottom: phase !== 'flow' ? '1px solid var(--border)' : 'none',
                    minHeight: '140px',
                  }}>
                    {/* Phase Label */}
                    <div style={{ width: '120px', flexShrink: 0 }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'none',
                        letterSpacing: '0.1em',
                        marginBottom: '0.25rem',
                      }}>
                        {phaseInfo.label}
                      </div>
                      <div style={{
                        fontSize: '0.625rem',
                        color: 'var(--muted-foreground)',
                        lineHeight: 1.4,
                      }}>
                        {phaseInfo.description}
                      </div>
                    </div>

                    {/* Phase Nodes */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, 120px)',
                      gap: '1rem',
                      flex: 1,
                    }}>
                      {orishasInPhase.map((orisha) => (
                        <PhaseNode key={orisha} orisha={orisha} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Flow Arrow Indicator */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem',
              marginTop: '2rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: '0.625rem', textTransform: 'none', letterSpacing: '0.1em', color: 'var(--muted-foreground)' }}>
                Genesis
              </span>
              <span style={{ color: 'var(--muted-foreground)' }}>→</span>
              <span style={{ fontSize: '0.625rem', textTransform: 'none', letterSpacing: '0.1em', color: 'var(--muted-foreground)' }}>
                Vision
              </span>
              <span style={{ color: 'var(--muted-foreground)' }}>→</span>
              <span style={{ fontSize: '0.625rem', textTransform: 'none', letterSpacing: '0.1em', color: 'var(--muted-foreground)' }}>
                Refinement
              </span>
              <span style={{ color: 'var(--muted-foreground)' }}>→</span>
              <span style={{ fontSize: '0.625rem', textTransform: 'none', letterSpacing: '0.1em', color: 'var(--muted-foreground)' }}>
                Manifestation
              </span>
              <span style={{ color: 'var(--muted-foreground)' }}>→</span>
              <span style={{ fontSize: '0.625rem', textTransform: 'none', letterSpacing: '0.1em', color: 'var(--muted-foreground)' }}>
                Flow
              </span>
              <span style={{ color: 'var(--muted-foreground)' }}>↻</span>
            </div>
          </div>
        );
      })()}

      {/* Usage Guide */}
      <div className={styles.usageGuide}>
        <h2 className={styles.guideTitle}>How to Read Symbolic Imprints</h2>
        <div className={styles.guideContent}>
          <div className={styles.guideSection}>
            <h3>Layer 1: Surface</h3>
            <p>
              Every character displays their imprint upfront: a mathematical symbol
              paired with a geometric primitive. The True Name (K̄ALØN, ØMÆRA, ȺRVŌ)
              and classification code (F-9, V-2, P-7) reveal their creative archetype
              within THE TWELVE pantheon.
            </p>
          </div>
          <div className={styles.guideSection}>
            <h3>Layer 2: Gateway</h3>
            <p>
              Hover over any symbol to reveal keywords and essence. Click to expand
              and discover the archetype's creative mode, shadow tendencies, and
              recognition patterns. Each glyph carries distinct creative energy.
            </p>
          </div>
          <div className={styles.guideSection}>
            <h3>Layer 3: Depths</h3>
            <p>
              After creating 3 characters or spending 7 days in the system, unlock
              Advanced View to see the complete archetype data: full configurations,
              psychometric foundations, and multi-modal signatures.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
