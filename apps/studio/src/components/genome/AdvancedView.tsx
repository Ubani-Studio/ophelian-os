/**
 * Advanced View Component
 * Shows Layer 3 (Depths) - Full Orisha/Kabbalah mythology
 */

import React from 'react';

interface DepthsData {
  orisha: {
    name: string;
    title: string;
    camino: {
      name: string;
      aspect: string;
      description: string;
    };
    domain: string[];
    colors: string[];
    element: string;
    number: number;
    day: string;
    planet?: string;
    offerings?: string[];
    shadowForm?: {
      name: string;
      aspect: string;
      manifestation: string;
    };
  };
  kabbalah: {
    sephira: {
      name: string;
      hebrewName: string;
      meaning: string;
      pillar: string;
      planet?: string;
      archangel?: string;
      choir?: string;
    };
    qliphoth?: {
      name: string;
      meaning: string;
    };
    paths?: Array<{
      from: string;
      to: string;
      tarot?: string;
    }>;
  };
  correspondences: {
    tarot?: string[];
    jung?: string;
    norse?: string;
    iching?: string;
    enneagram?: string;
    mbti?: string;
  };
  psychological: {
    strengths: string[];
    shadowTendencies: string[];
    integrationPath: string;
  };
}

interface AdvancedViewProps {
  data: DepthsData;
  isOpen: boolean;
  onClose: () => void;
}

export function AdvancedView({ data, isOpen, onClose }: AdvancedViewProps) {
  if (!isOpen) return null;

  return (
    <div
      className="advanced-view-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 9999,
        overflow: 'auto',
        padding: '2rem',
      }}
      onClick={onClose}
    >
      <div
        className="advanced-view-content"
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          backgroundColor: '#0a0a0a',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '8px',
          padding: '2rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Full Archetype Data</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '1.5rem',
              cursor: 'pointer',
              opacity: 0.7,
            }}
          >
            ×
          </button>
        </div>

        {/* Orisha Section */}
        <section style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'none', letterSpacing: '0.05em', opacity: 0.7 }}>
            ORISHA: {data.orisha.name}
          </h3>
          <p style={{ fontSize: '1rem', fontStyle: 'italic', marginBottom: '1rem', opacity: 0.9 }}>
            {data.orisha.title}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
            <div>
              <strong>Camino:</strong> {data.orisha.camino.name}
              <p style={{ opacity: 0.7, marginTop: '0.25rem' }}>{data.orisha.camino.aspect}</p>
            </div>
            <div>
              <strong>Colors:</strong> {data.orisha.colors.join(', ')}
            </div>
            <div>
              <strong>Element:</strong> {data.orisha.element}
            </div>
            <div>
              <strong>Sacred Number:</strong> {data.orisha.number}
            </div>
            <div>
              <strong>Day:</strong> {data.orisha.day}
            </div>
            {data.orisha.planet && (
              <div>
                <strong>Planet:</strong> {data.orisha.planet}
              </div>
            )}
          </div>

          {data.orisha.domain && (
            <div style={{ marginTop: '1rem' }}>
              <strong>Domain:</strong> {data.orisha.domain.join(', ')}
            </div>
          )}

          {data.orisha.offerings && (
            <div style={{ marginTop: '1rem' }}>
              <strong>Offerings:</strong> {data.orisha.offerings.join(', ')}
            </div>
          )}

          {data.orisha.shadowForm && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: '4px' }}>
              <strong>Shadow Form:</strong> {data.orisha.shadowForm.name}
              <p style={{ opacity: 0.8, marginTop: '0.25rem' }}>{data.orisha.shadowForm.manifestation}</p>
            </div>
          )}
        </section>

        {/* Kabbalah Section */}
        <section style={{ marginBottom: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'none', letterSpacing: '0.05em', opacity: 0.7 }}>
            KABBALAH: {data.kabbalah.sephira.name}
          </h3>
          <p style={{ fontSize: '1rem', marginBottom: '1rem', opacity: 0.9 }}>
            <strong>{data.kabbalah.sephira.hebrewName}</strong> — {data.kabbalah.sephira.meaning}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
            <div>
              <strong>Pillar:</strong> {data.kabbalah.sephira.pillar}
            </div>
            {data.kabbalah.sephira.planet && (
              <div>
                <strong>Planet:</strong> {data.kabbalah.sephira.planet}
              </div>
            )}
            {data.kabbalah.sephira.archangel && (
              <div>
                <strong>Archangel:</strong> {data.kabbalah.sephira.archangel}
              </div>
            )}
            {data.kabbalah.sephira.choir && (
              <div>
                <strong>Choir:</strong> {data.kabbalah.sephira.choir}
              </div>
            )}
          </div>

          {data.kabbalah.qliphoth && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: '4px' }}>
              <strong>Qliphoth:</strong> {data.kabbalah.qliphoth.name}
              <p style={{ opacity: 0.8, marginTop: '0.25rem' }}>The shadow: {data.kabbalah.qliphoth.meaning}</p>
            </div>
          )}
        </section>

        {/* Correspondences */}
        <section style={{ marginBottom: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'none', letterSpacing: '0.05em', opacity: 0.7 }}>
            CROSS-SYSTEM CORRESPONDENCES
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
            {data.correspondences.tarot && (
              <div><strong>Tarot:</strong> {data.correspondences.tarot.join(', ')}</div>
            )}
            {data.correspondences.jung && (
              <div><strong>Jung:</strong> {data.correspondences.jung}</div>
            )}
            {data.correspondences.norse && (
              <div><strong>Norse:</strong> {data.correspondences.norse}</div>
            )}
            {data.correspondences.iching && (
              <div><strong>I Ching:</strong> {data.correspondences.iching}</div>
            )}
            {data.correspondences.enneagram && (
              <div><strong>Enneagram:</strong> {data.correspondences.enneagram}</div>
            )}
            {data.correspondences.mbti && (
              <div><strong>MBTI:</strong> {data.correspondences.mbti}</div>
            )}
          </div>
        </section>

        {/* Psychological Profile */}
        <section style={{ paddingTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'none', letterSpacing: '0.05em', opacity: 0.7 }}>
            PSYCHOLOGICAL PROFILE
          </h3>

          {data.psychological.strengths.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ fontSize: '0.875rem' }}>Strengths:</strong>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', fontSize: '0.875rem', opacity: 0.9 }}>
                {data.psychological.strengths.map((strength, i) => (
                  <li key={i} style={{ marginBottom: '0.25rem' }}>{strength}</li>
                ))}
              </ul>
            </div>
          )}

          {data.psychological.shadowTendencies.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ fontSize: '0.875rem' }}>Shadow Tendencies:</strong>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', fontSize: '0.875rem', opacity: 0.9 }}>
                {data.psychological.shadowTendencies.map((tendency, i) => (
                  <li key={i} style={{ marginBottom: '0.25rem' }}>{tendency}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <strong style={{ fontSize: '0.875rem' }}>Integration Path:</strong>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', opacity: 0.9 }}>
              {data.psychological.integrationPath}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
