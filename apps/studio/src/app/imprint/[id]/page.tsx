'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getImprint,
  updateImprint,
  deleteImprint,
  exportImprint,
  generatePrompt,
  type CharacterImprint,
  type ImprintSystemPrompt,
} from '../../../lib/imprint-api';
import { TreeOfLifeVisualization, MultiModalPreview } from '../../../components/imprint';
import { GenomeDisplay, GenomePuzzleUnlock, ArchetypeDynamics } from '../../../components/genome';
import { ContentGenerator, ContentSuggester } from '../../../components/content';
import { CharacterTimeline } from '../../../components/timeline';
import { VoiceGenerator } from '../../../components/voice/VoiceGenerator';
import { AvatarGenerator } from '../../../components/avatar/AvatarGenerator';
import { RelationshipManager } from '../../../components/relationships/RelationshipManager';
import { TransmediaStoryManager } from '../../../components/transmedia/TransmediaStoryManager';
import { MerchManager } from '../../../components/merch/MerchManager';
import { PsychometricDashboard } from '../../../components/analytics';
import { EthicalCertification } from '../../../components/certification';
import { getSurfaceView, getGatewayHint, getDepthsView } from '@lcos/oripheon';
import { refreshUserProgress } from '../../../lib/user-progress';
import { generateMockTimeline, getCharacterAge } from '../../../lib/timeline-utils';
import puzzleStyles from '../../../components/genome/GenomePuzzleUnlock.module.css';

export default function ImprintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [genome, setGenome] = useState<CharacterImprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_saving, setSaving] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState<ImprintSystemPrompt | null>(null);
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptStyle, setPromptStyle] = useState<'concise' | 'detailed' | 'poetic'>('detailed');
  const [activeTab, setActiveTab] = useState<'overview' | 'multimodal' | 'narrative' | 'prompt' | 'content' | 'timeline' | 'voice' | 'avatar' | 'relationships' | 'stories' | 'merch' | 'social' | 'analytics' | 'certification' | 'cosmology'>('overview');
  const [mysteriesUnlocked, setMysteriesUnlocked] = useState(false);
  const [hasAdvancedAccess, setHasAdvancedAccess] = useState(false);
  const [suggestedIntent, setSuggestedIntent] = useState<string>('');

  const fetchImprint = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getImprint(id);
      setGenome(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch imprint');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchImprint();
  }, [fetchImprint]);

  useEffect(() => {
    // Fetch user progress to determine advanced access
    async function checkAccess() {
      try {
        const progress = await refreshUserProgress();
        setHasAdvancedAccess(progress.hasAdvancedAccess);
      } catch {
        // Default to no access on error
        setHasAdvancedAccess(false);
      }
    }
    checkAccess();
  }, []);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this imprint? This cannot be undone.')) return;

    try {
      await deleteImprint(id);
      router.push('/imprint');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete imprint');
    }
  };

  const handleExport = async (format: 'json' | 'markdown' | 'system-prompt') => {
    try {
      const exported = await exportImprint(id, format, promptStyle);
      const blob = new Blob([exported], {
        type: format === 'json' ? 'application/json' : 'text/plain',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `imprint-${id}.${format === 'json' ? 'json' : format === 'markdown' ? 'md' : 'txt'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export imprint');
    }
  };

  const handleGeneratePrompt = async () => {
    setPromptLoading(true);
    setError(null);

    try {
      const prompt = await generatePrompt(id, promptStyle);
      setSystemPrompt(prompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate prompt');
    } finally {
      setPromptLoading(false);
    }
  };

  const handleNameChange = async (newName: string) => {
    if (!genome) return;
    setSaving(true);

    try {
      const updated = await updateImprint(id, { name: newName });
      setGenome(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
        Loading imprint...
      </div>
    );
  }

  if (error && !genome) {
    return (
      <div className="container" style={{ padding: '2rem' }}>
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--destructive)',
            color: 'white',
            borderRadius: '0',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
        <Link href="/imprint" style={{ color: 'var(--primary)' }}>
          Back to Imprint Library
        </Link>
      </div>
    );
  }

  if (!genome) return null;

  return (
    <div className="container" style={{ padding: '2rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Link href="/imprint" style={{ color: 'var(--muted-foreground)', textDecoration: 'none' }}>
              Imprints
            </Link>
            <span style={{ color: 'var(--muted-foreground)' }}>/</span>
          </div>
          <h1
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleNameChange(e.currentTarget.textContent || genome.name)}
            style={{
              margin: '0 0 0.5rem',
              fontSize: '1.75rem',
              outline: 'none',
              cursor: 'text',
              padding: '0.25rem',
              borderRadius: '0',
            }}
          >
            {genome.name}
          </h1>
          <p style={{ margin: 0, color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
            Created {new Date(genome.createdAt).toLocaleDateString()} | Schema v{genome.schemaVersion}
            {genome.seed && ` | Seed: ${genome.seed}`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select
            value={promptStyle}
            onChange={(e) => setPromptStyle(e.target.value as 'concise' | 'detailed' | 'poetic')}
            style={{
              padding: '0.5rem',
              borderRadius: '0',
              border: '1px solid var(--border)',
              backgroundColor: '#000000',
              color: 'var(--foreground)',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'none',
              letterSpacing: '0.05em',
            }}
          >
            <option value="concise">Concise</option>
            <option value="detailed">Detailed</option>
            <option value="poetic">Poetic</option>
          </select>
          <button
            type="button"
            onClick={() => handleExport('json')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0',
              border: '1px solid var(--border)',
              backgroundColor: '#000000',
              color: 'var(--foreground)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'none',
              letterSpacing: '0.05em',
            }}
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => handleExport('system-prompt')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0',
              border: '1px solid var(--border)',
              backgroundColor: '#000000',
              color: 'var(--foreground)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'none',
              letterSpacing: '0.05em',
            }}
          >
            Export Prompt
          </button>
          <button
            type="button"
            onClick={handleDelete}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0',
              border: '1px solid var(--destructive)',
              backgroundColor: '#000000',
              color: 'var(--destructive)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'none',
              letterSpacing: '0.05em',
            }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--destructive)',
            color: 'white',
            borderRadius: '0',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.25rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        {(['overview', 'timeline', 'cosmology', 'multimodal', 'narrative', 'prompt', 'content', 'voice', 'avatar', 'relationships', 'stories', 'merch', 'social', 'analytics', 'certification'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0',
              border: activeTab === tab ? '1px solid var(--foreground)' : '1px solid var(--border)',
              backgroundColor: activeTab === tab ? 'var(--foreground)' : '#000000',
              color: activeTab === tab ? 'var(--background)' : 'var(--foreground)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'none',
              letterSpacing: '0.05em',
              transition: 'all 0.2s ease',
            }}
          >
            {tab === 'multimodal' ? 'Multi-Modal' : tab === 'prompt' ? 'System Prompt' : tab === 'certification' ? 'Ethics' : tab === 'cosmology' ? 'Layers' : tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <>
          {/* Progressive Disclosure Genome Display */}
          <div style={{ marginBottom: '2rem' }}>
            {(() => {
              const surface = getSurfaceView(genome as any);
              const gateway = getGatewayHint(genome as any);
              const depths = hasAdvancedAccess ? getDepthsView(genome as any) : undefined;

              return (
                <GenomeDisplay
                  genome={{
                    id: genome.id,
                    surface,
                    gateway,
                    depths,
                  }}
                  orisha={genome.orishaConfiguration.headOrisha as any}
                  hasAdvancedAccess={hasAdvancedAccess}
                />
              );
            })()}
          </div>

          {/* Puzzle Unlock for Deep Mysteries */}
          <div style={{ marginBottom: '2rem' }}>
            <div
              style={{
                marginBottom: '1rem',
                fontSize: '0.875rem',
                color: 'var(--muted-foreground)',
              }}
            >
              The full genome mysteries (Orisha configuration, Kabbalistic position, and psychological state)
              are protected by sacred knowledge. Solve the riddle to unlock the depths.
            </div>
            <GenomePuzzleUnlock
              genome={genome}
              onUnlock={() => setMysteriesUnlocked(true)}
              isUnlocked={mysteriesUnlocked}
            />
          </div>

          {mysteriesUnlocked && (
            <div
              className={puzzleStyles.detailsContainer}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem',
              }}
            >
              {/* Orisha Configuration */}
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: '#000000',
              borderRadius: '0',
              border: '1px solid var(--border)',
            }}
          >
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Orisha Configuration</h3>
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
                Head Orisha
              </div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{genome.orishaConfiguration.headOrisha}</div>
            </div>
            {genome.orishaConfiguration.camino && (
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
                  Camino
                </div>
                <div>{genome.orishaConfiguration.camino}</div>
              </div>
            )}
            {genome.orishaConfiguration.secondaryInfluences.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
                  Secondary Influences
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {genome.orishaConfiguration.secondaryInfluences.map((inf) => (
                    <span
                      key={inf.orisha}
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0',
                        backgroundColor: '#000000',
                        border: '1px solid var(--border)',
                        fontSize: '0.8rem',
                      }}
                    >
                      {inf.orisha} ({Math.round(inf.strength * 100)}%)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Kabbalistic Position */}
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: '#000000',
              borderRadius: '0',
              border: '1px solid var(--border)',
            }}
          >
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Kabbalistic Position</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <TreeOfLifeVisualization
                selectedSephira={genome.kabbalisticPosition.primarySephira}
                showDaath={true}
                width={150}
                height={225}
              />
              <div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
                    Primary Sephira
                  </div>
                  <div style={{ fontWeight: 600 }}>{genome.kabbalisticPosition.primarySephira}</div>
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
                    Pillar
                  </div>
                  <div>{genome.kabbalisticPosition.pillar}</div>
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
                    Qliphothic Shadow
                  </div>
                  <div>{genome.kabbalisticPosition.qliphothicShadow}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
                    Daath Relationship
                  </div>
                  <div style={{ textTransform: 'capitalize' }}>{genome.kabbalisticPosition.daathRelationship}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Psychological State */}
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: '#000000',
              borderRadius: '0',
              border: '1px solid var(--border)',
            }}
          >
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Psychological State</h3>
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
                Trajectory
              </div>
              <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                {genome.psychologicalState.trajectory}
              </div>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
                Hot/Cool Axis
              </div>
              <div
                style={{
                  height: '8px',
                  borderRadius: '4px',
                  background: 'linear-gradient(to right, #3b82f6, #8b5cf6, #ef4444)',
                  position: 'relative',
                  marginBottom: '0.25rem',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: `${((genome.psychologicalState.hotCoolAxis + 1) / 2) * 100}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    border: '2px solid var(--foreground)',
                  }}
                />
              </div>
              <div style={{ fontSize: '0.8rem' }}>
                {genome.psychologicalState.hotCoolAxis.toFixed(2)} (
                {genome.psychologicalState.hotCoolAxis <= -0.3
                  ? 'Cool'
                  : genome.psychologicalState.hotCoolAxis >= 0.3
                    ? 'Hot'
                    : 'Balanced'}
                )
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
                  Individuation
                </div>
                <div>{Math.round(genome.psychologicalState.individuationLevel * 100)}%</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
                  Shadow Integration
                </div>
                <div>{Math.round(genome.psychologicalState.shadowIntegration * 100)}%</div>
              </div>
            </div>
            {genome.psychologicalState.activeArchetypes.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
                  Active Archetypes
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {genome.psychologicalState.activeArchetypes.map((arch) => (
                    <span
                      key={arch}
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0',
                        backgroundColor: '#000000',
                        border: '1px solid var(--border)',
                        fontSize: '0.75rem',
                      }}
                    >
                      {arch}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Invariant Markers */}
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: '#000000',
              borderRadius: '0',
              border: '1px solid var(--border)',
            }}
          >
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Invariant Markers</h3>
            {genome.invariantMarkers.identityAnchors.length > 0 && (
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
                  Identity Anchors
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem' }}>
                  {genome.invariantMarkers.identityAnchors.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
            {genome.invariantMarkers.absoluteTaboos.length > 0 && (
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
                  Absolute Taboos
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {genome.invariantMarkers.absoluteTaboos.map((t) => (
                    <span
                      key={t}
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0',
                        backgroundColor: 'var(--destructive)',
                        color: 'white',
                        fontSize: '0.75rem',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {genome.invariantMarkers.sacredValues.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
                  Sacred Values
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {genome.invariantMarkers.sacredValues.map((v) => (
                    <span
                      key={v}
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0',
                        backgroundColor: '#000000',
                        border: '1px solid var(--border)',
                        fontSize: '0.75rem',
                      }}
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Archetype Dynamics - Growth/Stress Arrows + Shadow */}
          {(() => {
            const surface = getSurfaceView(genome as any);
            return (
              <div style={{ gridColumn: '1 / -1' }}>
                <ArchetypeDynamics aestheticClass={surface.classification} />
              </div>
            );
          })()}
            </div>
          )}
        </>
      )}

      {activeTab === 'multimodal' && <MultiModalPreview signature={genome.multiModalSignature} />}

      {activeTab === 'narrative' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1rem',
          }}
        >
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: '#000000',
              borderRadius: '0',
              border: '1px solid var(--border)',
            }}
          >
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'none', letterSpacing: '0.08em', color: 'var(--muted-foreground)' }}>Core Values</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {genome.narrativeIdentity.coreValues.map((v) => (
                <span
                  key={v}
                  style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0',
                    backgroundColor: '#000000',
                    border: '1px solid var(--border)',
                    fontSize: '0.875rem',
                  }}
                >
                  {v}
                </span>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: '1.5rem',
              backgroundColor: '#000000',
              borderRadius: '0',
              border: '1px solid var(--border)',
            }}
          >
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'none', letterSpacing: '0.08em', color: 'var(--muted-foreground)' }}>Central Conflicts</h3>
            <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
              {genome.narrativeIdentity.centralConflicts.map((c, i) => (
                <li key={i} style={{ marginBottom: '0.5rem' }}>
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div
            style={{
              padding: '1.5rem',
              backgroundColor: '#000000',
              borderRadius: '0',
              border: '1px solid var(--border)',
            }}
          >
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'none', letterSpacing: '0.08em', color: 'var(--muted-foreground)' }}>Recurring Themes</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {genome.narrativeIdentity.recurringThemes.map((t) => (
                <span
                  key={t}
                  style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0',
                    backgroundColor: '#000000',
                    border: '1px solid var(--border)',
                    fontSize: '0.875rem',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: '1.5rem',
              backgroundColor: '#000000',
              borderRadius: '0',
              border: '1px solid var(--border)',
            }}
          >
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'none', letterSpacing: '0.08em', color: 'var(--muted-foreground)' }}>Telos (Purpose)</h3>
            <p style={{ margin: 0, lineHeight: 1.6 }}>{genome.narrativeIdentity.telos}</p>
          </div>

          {genome.narrativeIdentity.relationalPatterns.length > 0 && (
            <div
              style={{
                padding: '1.5rem',
                backgroundColor: '#000000',
                borderRadius: '0',
                border: '1px solid var(--border)',
                gridColumn: '1 / -1',
              }}
            >
              <h3 style={{ margin: '0 0 1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'none', letterSpacing: '0.08em', color: 'var(--muted-foreground)' }}>Relational Patterns</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {genome.narrativeIdentity.relationalPatterns.map((rp, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: '#000000',
                      borderRadius: '0',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{rp.archetype}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>{rp.nature}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'prompt' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              backgroundColor: '#000000',
              border: '1px solid var(--border)',
            }}
          >
            <p style={{ margin: 0, color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
              Generate an AI system prompt from this imprint configuration.
            </p>
            <button
              type="button"
              onClick={handleGeneratePrompt}
              disabled={promptLoading}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0',
                border: '1px solid var(--foreground)',
                backgroundColor: 'var(--foreground)',
                color: 'var(--background)',
                cursor: promptLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'none',
                letterSpacing: '0.05em',
              }}
            >
              {promptLoading ? 'Generating...' : 'Generate Prompt'}
            </button>
          </div>

          {systemPrompt && (
            <div
              style={{
                padding: '1.5rem',
                backgroundColor: '#000000',
                borderRadius: '0',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem', textTransform: 'none', letterSpacing: '0.08em', fontWeight: 600 }}>
                  Character Name
                </div>
                <div style={{ fontWeight: 600 }}>{systemPrompt.characterName}</div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem', textTransform: 'none', letterSpacing: '0.08em', fontWeight: 600 }}>
                  Trait Summary
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {systemPrompt.traitSummary.map((t) => (
                    <span
                      key={t}
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0',
                        backgroundColor: '#000000',
                        border: '1px solid var(--border)',
                        fontSize: '0.8rem',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem', textTransform: 'none', letterSpacing: '0.08em', fontWeight: 600 }}>
                  System Prompt
                </div>
                <pre
                  style={{
                    padding: '1rem',
                    backgroundColor: '#000000',
                    borderRadius: '0',
                    border: '1px solid var(--border)',
                    fontSize: '0.85rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: '400px',
                    overflow: 'auto',
                    margin: 0,
                  }}
                >
                  {systemPrompt.prompt}
                </pre>
              </div>

              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(systemPrompt.prompt)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0',
                  border: '1px solid var(--foreground)',
                  backgroundColor: '#000000',
                  color: 'var(--foreground)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  letterSpacing: '0.05em',
                }}
              >
                Copy to Clipboard
              </button>
            </div>
          )}

          {!systemPrompt && !promptLoading && (
            <div
              style={{
                padding: '3rem',
                textAlign: 'center',
                color: 'var(--muted-foreground)',
                backgroundColor: '#000000',
                borderRadius: '0',
                border: '1px solid var(--border)',
              }}
            >
              Click &quot;Generate Prompt&quot; to create an AI system prompt from this imprint.
            </div>
          )}
        </div>
      )}

      {activeTab === 'content' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <p style={{ margin: 0, color: 'var(--muted-foreground)' }}>
            Generate authentic content using {genome.name}&apos;s genome signature.
            The Orisha essence, Sephira themes, and aesthetic class will shape the voice and style.
          </p>

          <ContentSuggester
            characterName={genome.name}
            orisha={genome.orishaConfiguration.headOrisha as any}
            sephira={genome.kabbalisticPosition.primarySephira as any}
            onSelectTopic={(topic) => setSuggestedIntent(`Share insights about ${topic}`)}
          />

          <ContentGenerator
            characterId={id}
            characterName={genome.name}
            orisha={genome.orishaConfiguration.headOrisha as any}
            sephira={genome.kabbalisticPosition.primarySephira as any}
            lClass={(genome.multiModalSignature as any)?.aestheticClass}
            suggestedIntent={suggestedIntent}
          />
        </div>
      )}

      {activeTab === 'timeline' && (
        <div>
          <p style={{ margin: '0 0 1.5rem', color: 'var(--muted-foreground)' }}>
            {genome.name}&apos;s journey through time. {getCharacterAge(genome.createdAt)}.
          </p>
          <CharacterTimeline
            characterName={genome.name}
            events={generateMockTimeline({
              id: genome.id,
              name: genome.name,
              createdAt: genome.createdAt,
              currentArc: genome.narrativeIdentity?.telos,
            })}
            onEventClick={(event) => {
              console.log('Timeline event clicked:', event);
            }}
          />
        </div>
      )}

      {activeTab === 'voice' && (
        <div>
          <p style={{ margin: '0 0 1.5rem', color: 'var(--muted-foreground)' }}>
            Synthesize text into {genome.name}&apos;s voice using advanced prosody and emotion controls.
          </p>
          <VoiceGenerator
            characterId={id}
            characterName={genome.name}
          />
        </div>
      )}

      {activeTab === 'avatar' && (
        <div>
          <p style={{ margin: '0 0 1.5rem', color: 'var(--muted-foreground)' }}>
            Generate a consent-tracked avatar for {genome.name}. Every avatar includes an immutable consent record.
          </p>
          <AvatarGenerator
            characterId={id}
            characterName={genome.name}
          />
        </div>
      )}

      {activeTab === 'relationships' && (
        <div>
          <p style={{ margin: '0 0 1.5rem', color: 'var(--muted-foreground)' }}>
            Define and manage {genome.name}&apos;s relationships with other characters.
            Relationships enable multi-character stories and dynamic interactions.
          </p>
          <RelationshipManager
            characterId={id}
            characterName={genome.name}
          />
        </div>
      )}

      {activeTab === 'stories' && (
        <div>
          <p style={{ margin: '0 0 1.5rem', color: 'var(--muted-foreground)' }}>
            Create transmedia stories featuring {genome.name} that adapt across multiple platforms and media types.
            Stories leverage character relationships and maintain narrative consistency.
          </p>
          <TransmediaStoryManager
            characterId={id}
            characterName={genome.name}
          />
        </div>
      )}

      {activeTab === 'merch' && (
        <div>
          <p style={{ margin: '0 0 1.5rem', color: 'var(--muted-foreground)' }}>
            Create and sell merchandise featuring {genome.name}. Designs are automatically generated from the
            character's visual signature. You earn 70% of all sales.
          </p>
          <MerchManager
            characterId={id}
            characterName={genome.name}
            visualSignature={(genome as any).multiModalSignature?.visual}
          />
        </div>
      )}

      {activeTab === 'social' && (
        <div>
          <p style={{ margin: '0 0 1.5rem', color: 'var(--muted-foreground)' }}>
            Publish {genome.name}'s content across social media platforms. SLAYT automatically adapts content using character genome for platform-specific formatting, hashtags, and attribution.
          </p>

          <div style={{
            padding: '1.5rem',
            background: '#000000',
            border: '1px solid var(--border)',
            borderRadius: '0',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'none', letterSpacing: '0.08em', color: 'var(--foreground)' }}>Social Publishing</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'none', letterSpacing: '0.08em', color: 'var(--muted-foreground)' }}>Content to Publish</label>
                <textarea
                  id="social-content"
                  placeholder={`Share ${genome.name}'s story, thoughts, or updates...`}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0',
                    border: '1px solid var(--border)',
                    backgroundColor: '#000000',
                    color: 'var(--foreground)',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'none', letterSpacing: '0.08em', color: 'var(--muted-foreground)' }}>Platforms</label>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {['Twitter', 'Instagram', 'TikTok'].map(platform => (
                    <label key={platform} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', background: '#000000' }}>
                      <input type="checkbox" defaultChecked style={{ cursor: 'pointer', accentColor: 'var(--foreground)' }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'none', letterSpacing: '0.05em' }}>{platform}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  const content = (document.getElementById('social-content') as HTMLTextAreaElement)?.value;
                  if (!content) {
                    alert('Please enter content to publish');
                    return;
                  }

                  try {
                    const response = await fetch('/api/social/publish', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        characterId: id,
                        characterName: genome.name,
                        genome: {
                          visual: (genome as any).multiModalSignature?.visual,
                          orisha: (genome as any).personality?.orisha,
                          sephira: (genome as any).personality?.sephira,
                          traits: (genome as any).personality?.traits || []
                        },
                        content: {
                          type: 'story',
                          text: content,
                        },
                        platforms: ['TWITTER', 'INSTAGRAM', 'TIKTOK']
                      })
                    });

                    const result = await response.json();
                    if (result.success) {
                      alert(`Published to ${result.publishedTo.join(', ')}!\n\nCheck SLAYT response for details.`);
                      console.log('SLAYT Response:', result.slaytResponse);
                    } else {
                      alert(`Error: ${result.error}\n\n${result.message || ''}`);
                    }
                  } catch (error) {
                    alert(`Failed to publish: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--foreground)',
                  color: 'var(--background)',
                  border: '1px solid var(--foreground)',
                  borderRadius: '0',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Publish to Social Media
              </button>
            </div>
          </div>

          <div style={{
            padding: '1rem',
            background: '#000000',
            border: '1px solid var(--border)',
            borderRadius: '0'
          }}>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'none', letterSpacing: '0.08em', color: 'var(--foreground)' }}>Character-Authentic Adaptation</h4>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
              <li>Auto-generates hashtags from {genome.name}'s personality traits</li>
              <li>Adapts content for each platform's format and character limits</li>
              <li>Creates Twitter threads for long content</li>
              <li>Generates TikTok video scripts</li>
              <li>Adds character attribution and orisha energy references</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div>
          <p style={{ margin: '0 0 1.5rem', color: 'var(--muted-foreground)' }}>
            Deep psychometric analysis of {genome.name}'s personality profile, cognitive functions, and engagement patterns.
          </p>
          <PsychometricDashboard
            characterId={id}
            characterName={genome.name}
            orisha={genome.orishaConfiguration.headOrisha}
            sephira={genome.kabbalisticPosition.primarySephira}
            trajectory={genome.psychologicalState.trajectory}
            hotCoolAxis={genome.psychologicalState.hotCoolAxis}
            activeArchetypes={genome.psychologicalState.activeArchetypes}
          />
        </div>
      )}

      {activeTab === 'certification' && (
        <div>
          <p style={{ margin: '0 0 1.5rem', color: 'var(--muted-foreground)' }}>
            Track ethical AI compliance, consent records, and certification status for {genome.name}.
          </p>
          <EthicalCertification
            characterId={id}
            characterName={genome.name}
            createdAt={genome.createdAt}
          />
        </div>
      )}

      {activeTab === 'cosmology' && (
        <div>
          <p style={{ margin: '0 0 1.5rem', color: 'var(--muted-foreground)' }}>
            The three layers of {genome.name}&apos;s cosmological identity.
          </p>

          {/* Layer 1: Bóveda */}
          <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#000000', border: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'none', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
              Layer 1 — Bóveda
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Surface Classification
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
              The visible layer of personality typing. Materia (elemental essence), growth/stress directions, and relational dynamics.
            </p>
          </div>

          {/* Layer 2: Kabbalah */}
          <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#000000', border: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'none', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
              Layer 2 — Sephirot
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Tree of Life Correspondence
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', lineHeight: 1.6, marginBottom: '1rem' }}>
              The Kabbalistic layer mapping character essence to the ten emanations of the Tree of Life.
            </p>
            <TreeOfLifeVisualization selectedSephira={(genome as any).personality?.sephira} />
          </div>

          {/* Layer 3: Orisha */}
          <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#000000', border: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'none', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
              Layer 3 — Orisha
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Spiritual Archetype
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
              The deepest layer connecting character to Yoruba spiritual archetypes and their domains of influence.
            </p>
          </div>

          {/* I Ching State */}
          <div style={{ padding: '1.5rem', background: '#000000', border: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'none', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
              State — I Ching
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Current Hexagram
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
              The character&apos;s present state and transformation trajectory according to the Book of Changes.
            </p>
          </div>
        </div>
      )}

      {/* Tags */}
      {genome.tags && genome.tags.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>
            Tags
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
            {genome.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0',
                  backgroundColor: '#000000',
                  border: '1px solid var(--border)',
                  fontSize: '0.8rem',
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
