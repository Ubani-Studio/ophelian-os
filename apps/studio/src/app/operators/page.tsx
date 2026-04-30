'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCharacters, type Character } from '@/lib/api';
import { NewCharacterModal } from '@/components/NewCharacterModal';
import { SUBTASTE_DESIGNATIONS } from '@lcos/oripheon';

// Helper to check if character is a relic
function isRelic(character: Character) {
  const ts = character.timelineState as Record<string, any>;
  const gen = ts?.oripheon?.generated;
  return !!(gen?.relics && gen.relics.length > 0);
}

// Helper to get subtaste data from character
// Uses current glyph names from SUBTASTE_DESIGNATIONS (True Names) instead of stored values
function getSubtaste(character: Character): { glyph: string; code: string; label: string } | null {
  const ts = character.timelineState as Record<string, any>;
  const subtaste = ts?.oripheon?.generated?.subtaste;
  if (!subtaste?.code) return null;

  // Look up current designation from the code to get updated glyph/label
  const designation = SUBTASTE_DESIGNATIONS[subtaste.code];
  if (!designation) return null;

  return { glyph: designation.glyph, code: subtaste.code, label: designation.label };
}

// Parse avatar position string "50% 50% 1.5" into position and zoom
function parseAvatarPosition(position: string | null | undefined): { objectPosition: string; zoom: number } {
  if (!position) return { objectPosition: '50% 50%', zoom: 1 };
  const parts = position.split(' ');
  const x = parts[0] || '50%';
  const y = parts[1] || '50%';
  const zoom = parts[2] ? parseFloat(parts[2]) : 1;
  return { objectPosition: `${x} ${y}`, zoom: isNaN(zoom) ? 1 : zoom };
}

function CharacterCard({ character }: { character: Character }) {
  const subtaste = getSubtaste(character);
  const { objectPosition, zoom } = parseAvatarPosition(character.avatarPosition);

  return (
    <Link
      href={`/characters/${character.id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div className="card character-card" style={{ cursor: 'pointer' }}>
        <div className="character-card-header">
          <div className="character-avatar-circle" style={{ overflow: 'hidden' }}>
            {character.avatarUrl ? (
              <img
                src={character.avatarUrl}
                alt={character.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: objectPosition,
                  transform: `scale(${zoom})`,
                }}
              />
            ) : character.tizitaRepresentativeUrl ? (
              <img
                src={character.tizitaRepresentativeUrl}
                alt={character.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <span className="character-avatar-placeholder">
                {character.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <h3 className="card-title">{character.name}</h3>
        </div>
        <p className="card-description">
          {character.bio?.slice(0, 100) || 'No bio'}
          {character.bio && character.bio.length > 100 ? '...' : ''}
        </p>
        {subtaste && (
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginTop: '1rem',
            flexWrap: 'wrap',
          }}>
            <span style={{
              padding: '0.25rem 0.75rem',
              border: '1px solid var(--foreground)',
              borderRadius: '0',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--foreground)',
              backgroundColor: 'transparent',
            }}>
              {subtaste.glyph}
            </span>
            <span style={{
              padding: '0.25rem 0.75rem',
              border: '1px solid var(--foreground)',
              borderRadius: '0',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--foreground)',
              backgroundColor: 'transparent',
            }}>
              {subtaste.code}
            </span>
            <span style={{
              padding: '0.25rem 0.75rem',
              border: '1px solid var(--foreground)',
              borderRadius: '0',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--foreground)',
              backgroundColor: 'transparent',
            }}>
              {subtaste.label}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function OperatorsPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const charactersData = await getCharacters();
      setCharacters(charactersData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load characters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Separate characters and relics
  const regularCharacters = characters.filter(c => !isRelic(c));
  const relics = characters.filter(c => isRelic(c));

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Operators</h1>
        <button className="btn btn-secondary" onClick={() => setShowModal(true)}>
          New Character
        </button>
      </div>

      {loading && <div className="loading">Loading operators...</div>}

      {error && (
        <div className="card" style={{ borderColor: 'var(--error)' }}>
          <p style={{ color: 'var(--error)' }}>{error}</p>
          <button className="btn btn-secondary mt-4" onClick={loadData}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && characters.length === 0 && (
        <div className="empty-state">
          <p>No operators yet. Create your first operator to get started.</p>
        </div>
      )}

      {!loading && !error && regularCharacters.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.25rem',
            fontWeight: 600,
            marginBottom: '1rem',
            color: 'var(--foreground)',
          }}>
            Operators
          </h2>
          <div className="grid grid-cols-2">
            {regularCharacters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
              />
            ))}
          </div>
        </div>
      )}

      {!loading && !error && relics.length > 0 && (
        <div>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.25rem',
            fontWeight: 600,
            marginBottom: '1rem',
            color: 'var(--foreground)',
          }}>
            Relics
          </h2>
          <div className="grid grid-cols-2">
            {relics.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
              />
            ))}
          </div>
        </div>
      )}

      <NewCharacterModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreated={loadData}
      />
    </div>
  );
}
