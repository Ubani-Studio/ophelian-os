'use client';

import { useState, useEffect } from 'react';
import { GenomeDisplay } from '@/components/genome';
import { getSurfaceView, getGatewayHint, getDepthsView, hasAdvancedViewAccess } from '@lcos/oripheon';
import { useRouter } from 'next/navigation';

export default function GenomeDemoPage() {
  const router = useRouter();
  const [genomes, setGenomes] = useState<any[]>([]);
  const [selectedGenome, setSelectedGenome] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock user data for testing
  const mockUser = {
    isAdmin: false,
    characterCount: 3, // Change to test unlock behavior
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
  };

  const hasAccess = hasAdvancedViewAccess(mockUser);

  useEffect(() => {
    async function loadGenomes() {
      try {
        setLoading(true);
        // Fetch first few genomes from the API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/genome`);
        if (!response.ok) throw new Error('Failed to fetch genomes');
        const data = await response.json();
        setGenomes(data.genomes || []);
        if (data.genomes && data.genomes.length > 0) {
          setSelectedGenome(data.genomes[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load genomes');
      } finally {
        setLoading(false);
      }
    }

    loadGenomes();
  }, []);

  // Prepare data for GenomeDisplay (before early returns)
  const surface = selectedGenome ? getSurfaceView(selectedGenome) : null;
  const gateway = selectedGenome ? getGatewayHint(selectedGenome) : null;
  const depths = selectedGenome && hasAccess ? getDepthsView(selectedGenome) : undefined;

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading genomes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{
          padding: '1rem',
          backgroundColor: '#ef4444',
          color: 'white',
          borderRadius: '8px',
          marginBottom: '1rem',
        }}>
          {error}
        </div>
        <p style={{ color: '#888', marginBottom: '1rem' }}>
          This demo requires at least one genome to be created in the system.
        </p>
        <button
          onClick={() => router.push('/imprint/create')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          Create a Genome
        </button>
      </div>
    );
  }

  if (!selectedGenome) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>No genomes available</p>
        <button
          onClick={() => router.push('/imprint/create')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem',
            marginTop: '1rem',
          }}
        >
          Create a Genome
        </button>
      </div>
    );
  }

  // This should never happen due to checks above, but TypeScript needs it
  if (!surface || !gateway) {
    return <div>Loading genome data...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Progressive Disclosure System Demo
        </h1>
        <p style={{ color: '#888', marginBottom: '1rem' }}>
          Testing the three-layer genome display system
        </p>
        <div style={{
          padding: '1rem',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '8px',
          fontSize: '0.875rem',
        }}>
          <strong>Mock User Status:</strong>{' '}
          {mockUser.isAdmin && 'Admin'}
          {!mockUser.isAdmin && mockUser.characterCount >= 3 && 'Advanced Access (3+ characters)'}
          {!mockUser.isAdmin && mockUser.characterCount < 3 && `Locked (${mockUser.characterCount}/3 characters)`}
          <br />
          <strong>Advanced View:</strong> {hasAccess ? '[Unlocked]' : '[Locked]'}
        </div>
      </div>

      {/* Genome Selector */}
      {genomes.length > 1 && (
        <div style={{ marginBottom: '2rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
            textTransform: 'none',
            letterSpacing: '0.05em',
            opacity: 0.7,
          }}>
            Select Genome
          </label>
          <select
            value={selectedGenome.id}
            onChange={(e) => {
              const genome = genomes.find(g => g.id === e.target.value);
              setSelectedGenome(genome);
            }}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#1a1a1a',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: 'white',
              fontSize: '0.875rem',
            }}
          >
            {genomes.map(genome => (
              <option key={genome.id} value={genome.id}>
                {genome.name} - {genome.orishaConfiguration.headOrisha}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Progressive Disclosure Display */}
      <GenomeDisplay
        genome={{
          id: selectedGenome!.id,
          surface,
          gateway,
          depths,
        }}
        hasAdvancedAccess={hasAccess}
      />

      {/* System Info */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
      }}>
        <h3 style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          marginBottom: '1rem',
          textTransform: 'none',
          letterSpacing: '0.05em',
          opacity: 0.7,
        }}>
          System Architecture
        </h3>
        <div style={{ fontSize: '0.75rem', lineHeight: 1.6, opacity: 0.8 }}>
          <p><strong>Layer 1 (Surface):</strong> Clean L-class + symbols. Always visible.</p>
          <p><strong>Layer 2 (Gateway):</strong> Hover tooltips with brief context. Creates curiosity.</p>
          <p><strong>Layer 3 (Depths):</strong> Full Orisha/Kabbalah mythology. Unlocked after 3 characters.</p>
          <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>
            This system allows Bóveda to be both accessible AND deep - a blue ocean position.
          </p>
        </div>
      </div>
    </div>
  );
}
