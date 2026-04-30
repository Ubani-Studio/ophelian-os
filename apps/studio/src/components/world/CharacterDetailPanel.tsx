'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Character } from '@/lib/api';
import { syncOripheonData } from '@/lib/api';
import { getSubtasteInfo } from '@/components/world/SuggestedRelationshipsPanel';

const MATERIA: Record<string, string> = {
  wood: 'Bloom',
  fire: 'Blaze',
  earth: 'Root',
  metal: 'Edge',
  water: 'Deep',
};

interface CharacterDetailPanelProps {
  character: Character;
  onClose: () => void;
  onRefresh?: () => void;
}

export function CharacterDetailPanel({ character, onClose, onRefresh }: CharacterDetailPanelProps) {
  const [showSubtaste, setShowSubtaste] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const subtasteInfo = getSubtasteInfo(character);
  const hasOripheonData = !!(character.timelineState as any)?.oripheon?.generated;

  const handleSyncOripheon = async () => {
    setSyncing(true);
    try {
      await syncOripheonData(character.id);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to sync oripheon data:', error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="detail-panel">
      <div className="detail-panel-header">
        <h2 className="detail-panel-title">Character Details</h2>
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
      </div>

      <div className="character-info-header">
        <div className="character-info-avatar">
          {character.avatarUrl ? (
            <img
              src={character.avatarUrl}
              alt={character.name}
              style={{ objectPosition: character.avatarPosition || '50% 50%' }}
            />
          ) : (
            <span className="character-avatar-placeholder">{getInitials(character.name)}</span>
          )}
        </div>
        <div className="character-info-name">{character.name}</div>
        {character.aliases.length > 0 && (
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.625rem', color: 'var(--muted-foreground)', letterSpacing: '0.03em', marginTop: '0.375rem' }}>
            <span style={{ textTransform: 'none', fontWeight: 600, marginRight: '0.5rem' }}>Aliases</span>
            {character.aliases.join(' · ')}
          </div>
        )}
      </div>

      {/* Bóveda Profile */}
      {subtasteInfo && (
        <div className="detail-section">
          <div
            className="subtaste-ref-header"
            onClick={() => setShowSubtaste(!showSubtaste)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') setShowSubtaste(!showSubtaste); }}
          >
            <label className="label" style={{ cursor: 'pointer', margin: 0 }}>
              Bóveda
            </label>
            <span className="subtaste-ref-toggle">{showSubtaste ? '\u2212' : '+'}</span>
          </div>

          {/* Designation tags */}
          <div style={{ marginTop: '0.5rem', marginBottom: '1rem', display: 'flex', gap: '0.375rem' }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.625rem', fontWeight: 600, padding: '0.25rem 0.5rem', border: '1px solid var(--border)', background: '#000' }}>
              {subtasteInfo.subtaste}
            </span>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.625rem', fontWeight: 600, padding: '0.25rem 0.5rem', border: '1px solid var(--border)', background: '#000' }}>
              {subtasteInfo.label?.toUpperCase()}
            </span>
          </div>

          {showSubtaste && (
            <div className="subtaste-ref-body">
              <div className="subtaste-ref-row">
                <span className="subtaste-ref-key">Materia</span>
                <span className="subtaste-ref-val">{MATERIA[subtasteInfo.wuXingElement] || subtasteInfo.wuXingElement}</span>
              </div>
              <div className="subtaste-ref-row">
                <span className="subtaste-ref-key">Ascends to</span>
                <span className="subtaste-ref-val">{subtasteInfo.growth}</span>
              </div>
              <div className="subtaste-ref-row">
                <span className="subtaste-ref-key">Descends to</span>
                <span className="subtaste-ref-val subtaste-ref-stress">{subtasteInfo.stress}</span>
              </div>
              <div className="subtaste-ref-row">
                <span className="subtaste-ref-key">Awakens</span>
                <span className="subtaste-ref-val">{MATERIA[subtasteInfo.generates] || subtasteInfo.generates}</span>
              </div>
              <div className="subtaste-ref-row">
                <span className="subtaste-ref-key">Anchored by</span>
                <span className="subtaste-ref-val subtaste-ref-stress">{MATERIA[subtasteInfo.overcomeBy] || subtasteInfo.overcomeBy}</span>
              </div>

              {/* Expand toggle */}
              <div
                onClick={() => setShowAdvanced(!showAdvanced)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') setShowAdvanced(!showAdvanced); }}
                style={{
                  marginTop: '0.75rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '1.25rem',
                  height: '1.25rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid var(--border)',
                  color: showAdvanced ? 'var(--foreground)' : 'var(--muted-foreground)',
                }}
              >
                {showAdvanced ? '\u2212' : '+'}
              </div>

              {showAdvanced && (
                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                  <div className="subtaste-ref-row">
                    <span className="subtaste-ref-key">Materia</span>
                    <span className="subtaste-ref-val">{MATERIA[subtasteInfo.wuXingElement]} — {subtasteInfo.phase} phase</span>
                  </div>
                  <div className="subtaste-ref-row">
                    <span className="subtaste-ref-key">Ascends to</span>
                    <span className="subtaste-ref-val">{subtasteInfo.growth} — {subtasteInfo.growthLabel}</span>
                  </div>
                  <div className="subtaste-ref-row">
                    <span className="subtaste-ref-key">Descends to</span>
                    <span className="subtaste-ref-val subtaste-ref-stress">{subtasteInfo.stress} — {subtasteInfo.stressLabel}</span>
                  </div>
                  <div className="subtaste-ref-row">
                    <span className="subtaste-ref-key">Awakens</span>
                    <span className="subtaste-ref-val">{MATERIA[subtasteInfo.generates]} types — generates energy</span>
                  </div>
                  <div className="subtaste-ref-row">
                    <span className="subtaste-ref-key">Anchored by</span>
                    <span className="subtaste-ref-val subtaste-ref-stress">{MATERIA[subtasteInfo.overcomeBy]} types — provides balance</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {character.bio && (
        <div className="detail-section">
          <label className="label">Bio</label>
          <p className="detail-text">{character.bio}</p>
        </div>
      )}

      {character.personaTags.length > 0 && (
        <div className="detail-section" style={{ padding: '0.75rem' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            onClick={() => setShowTags(!showTags)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') setShowTags(!showTags); }}
          >
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'none', color: 'var(--muted-foreground)' }}>
              Traits ({character.personaTags.length})
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{showTags ? '\u2212' : '+'}</span>
          </div>
          {showTags && (
            <div className="tag-list" style={{ marginTop: '0.5rem' }}>
              {character.personaTags.map((tag, i) => (
                <span key={i} className="tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {character.currentArc && (
        <div className="detail-section">
          <label className="label">Current Arc</label>
          <p className="detail-text">{character.currentArc}</p>
        </div>
      )}

      <div className="detail-actions">
        <Link href={`/characters/${character.id}`} className="btn btn-primary">
          View Full Profile
        </Link>
        <button
          className="btn btn-secondary"
          onClick={handleSyncOripheon}
          disabled={syncing}
        >
          {syncing ? 'Syncing...' : hasOripheonData ? 'Sync Oripheon Data' : 'Generate Oripheon Data'}
        </button>
      </div>
    </div>
  );
}
