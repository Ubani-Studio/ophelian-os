'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getCharacter,
  getContent,
  generateContent,
  approveContent,
  publishContent,
  generateAudio,
  updateCharacter,
  deleteCharacter,
  type Character,
  type ContentItem,
} from '@/lib/api';
import { ImageUpload } from '@/components/ImageUpload';
import { DraggableAvatar } from '@/components/DraggableAvatar';
import { RepositionableCircleAvatar } from '@/components/RepositionableCircleAvatar';
import { ArchetypeDynamics } from '@/components/genome';
import { TizitaPanel, IkengaEmblem } from '@/components/TizitaPanel';
import { GroupMembersPanel } from '@/components/GroupMembersPanel';
import { ComposeGroupSubtasteButton } from '@/components/ComposeGroupSubtasteButton';
import { SpeciesPicker } from '@/components/SpeciesPicker';
import { TonguePanel } from '@/components/TonguePanel';
import { CompositionKindPicker } from '@/components/CompositionKindPicker';
import { SubtastePicker } from '@/components/SubtastePicker';
import { IdentityRegisterPanel } from '@/components/IdentityRegisterPanel';
import { LoraPanel } from '@/components/LoraPanel';
import { ModePill } from '@/components/ModePill';
import { TimelineStrip } from '@/components/TimelineStrip';
import { GoalsPanel } from '@/components/GoalsPanel';
import { TickButton } from '@/components/TickButton';
import { SubtasteBadge } from '@/components/SubtasteBadge';
import { SovereigntyBadge } from '@/components/SovereigntyBadge';
import { BackstoryPanel } from '@/components/BackstoryPanel';
import { VoicePanel } from '@/components/VoicePanel';
import { CohortPhrasePanel } from '@/components/CohortPhrasePanel';
import { CreateTwinButton } from '@/components/CreateTwinButton';
import { ForgePanel } from '@/components/ForgePanel';
import { SUBTASTE_DESIGNATIONS, getSymbolicImprint, type OrishaName } from '@lcos/oripheon';

export default function CharacterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const characterId = params.id as string;

  const [character, setCharacter] = useState<Character | null>(null);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proMode, setProMode] = useState(false);

  // Generate form state
  const [platform, setPlatform] = useState<'X' | 'TIKTOK' | 'INSTAGRAM'>('X');
  const [intent, setIntent] = useState('');
  const [generating, setGenerating] = useState(false);

  // Action states
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [avatarUpdating, setAvatarUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Main panel tab — character expression surface.
  // voice  → Ibis writing samples (federation pending)
  // gallery → generated images (ComfyUI / Genoma, pending)
  // content → published / drafted content (live: existing flow)
  // story  → arcs / beats (existing data, future surface)
  const [activeTab, setActiveTab] = useState<'voice' | 'gallery' | 'content' | 'story'>('content');

  // Editable name state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Editable persona tags state
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  const [editedTag, setEditedTag] = useState('');
  const [savingTag, setSavingTag] = useState(false);

  // Editable bio state
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedBio, setEditedBio] = useState('');
  const [savingBio, setSavingBio] = useState(false);

  // Editable aliases state
  const [editingAliasIndex, setEditingAliasIndex] = useState<number | null>(null);
  const [editedAlias, setEditedAlias] = useState('');
  const [savingAlias, setSavingAlias] = useState(false);

  // Bumped after a tick lands; tells TimelineStrip to refetch.
  const [timelineRefreshKey, setTimelineRefreshKey] = useState(0);

  const loadData = async () => {
    try {
      setLoading(true);
      const [char, content] = await Promise.all([getCharacter(characterId), getContent()]);
      setCharacter(char);
      setContentItems(content.filter((c) => c.characterId === characterId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [characterId]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intent.trim()) return;

    setGenerating(true);
    try {
      await generateContent(characterId, platform, intent);
      setIntent('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await approveContent(id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handlePublish = async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await publishContent(id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleGenerateAudio = async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [`audio-${id}`]: true }));
    try {
      const result = await generateAudio(id);
      alert(`Audio generated: ${result.audioFilePath} (${result.durationSeconds.toFixed(1)}s)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate audio');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`audio-${id}`]: false }));
    }
  };

  const handleAvatarChange = async (url: string | null) => {
    setAvatarUpdating(true);
    try {
      const updated = await updateCharacter(characterId, { avatarUrl: url });
      setCharacter(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update avatar');
    } finally {
      setAvatarUpdating(false);
    }
  };

  const handleAvatarPositionChange = async (position: string) => {
    setAvatarUpdating(true);
    try {
      const updated = await updateCharacter(characterId, { avatarPosition: position });
      setCharacter(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update avatar position');
    } finally {
      setAvatarUpdating(false);
    }
  };

  const handleNameEdit = () => {
    if (character) {
      setEditedName(character.name);
      setIsEditingName(true);
    }
  };

  // Compute preview bio with name replaced (live preview while editing name)
  const previewBio = useMemo(() => {
    // If editing bio directly, show the edited bio
    if (isEditingBio) return editedBio;

    if (!character?.bio) return '';
    if (!isEditingName || !editedName.trim()) return character.bio;
    // Replace old name with new name in bio (case-insensitive)
    const escapedName = character.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedName, 'gi');
    return character.bio.replace(regex, editedName.trim());
  }, [character?.bio, character?.name, isEditingName, editedName, isEditingBio, editedBio]);

  const handleNameSave = async () => {
    if (!character || !editedName.trim() || editedName === character.name) {
      setIsEditingName(false);
      return;
    }

    setSavingName(true);
    try {
      // Create regex to replace old name with new name (case-insensitive)
      const escapedOldName = character.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const nameRegex = new RegExp(escapedOldName, 'gi');
      const newName = editedName.trim();

      // Update bio and systemPrompt to replace old name with new name
      const newBio = character?.bio ? character.bio.replace(nameRegex, newName) : '';
      const newSystemPrompt = character?.systemPrompt
        ? character.systemPrompt.replace(nameRegex, newName)
        : '';

      const updated = await updateCharacter(characterId, {
        name: newName,
        bio: newBio,
        systemPrompt: newSystemPrompt,
      });
      setCharacter(updated);
      setIsEditingName(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update name');
    } finally {
      setSavingName(false);
    }
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  const handleTagEdit = (index: number) => {
    if (character) {
      setEditedTag(character.personaTags[index]);
      setEditingTagIndex(index);
    }
  };

  const handleTagSave = async () => {
    if (!character || editingTagIndex === null) return;

    const newTags = [...character.personaTags];
    if (editedTag.trim()) {
      newTags[editingTagIndex] = editedTag.trim();
    } else {
      // Remove tag if empty
      newTags.splice(editingTagIndex, 1);
    }

    setSavingTag(true);
    try {
      const updated = await updateCharacter(characterId, { personaTags: newTags });
      setCharacter(updated);
      setEditingTagIndex(null);
      setEditedTag('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tag');
    } finally {
      setSavingTag(false);
    }
  };

  const handleTagCancel = () => {
    setEditingTagIndex(null);
    setEditedTag('');
  };

  const handleAddTag = async () => {
    if (!character) return;
    const newTag = 'new-tag';
    const newTags = [...character.personaTags, newTag];

    setSavingTag(true);
    try {
      const updated = await updateCharacter(characterId, { personaTags: newTags });
      setCharacter(updated);
      // Start editing the new tag immediately
      setEditedTag(newTag);
      setEditingTagIndex(newTags.length - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tag');
    } finally {
      setSavingTag(false);
    }
  };

  // Bio editing handlers
  const handleBioEdit = () => {
    if (character) {
      setEditedBio(character.bio || '');
      setIsEditingBio(true);
    }
  };

  const handleBioSave = async () => {
    if (!character) return;

    setSavingBio(true);
    try {
      const updated = await updateCharacter(characterId, { bio: editedBio });
      setCharacter(updated);
      setIsEditingBio(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bio');
    } finally {
      setSavingBio(false);
    }
  };

  const handleBioCancel = () => {
    setIsEditingBio(false);
    setEditedBio('');
  };

  // Alias editing handlers
  const handleAliasEdit = (index: number) => {
    if (character) {
      setEditedAlias(character.aliases[index]);
      setEditingAliasIndex(index);
    }
  };

  const handleAliasSave = async () => {
    if (!character || editingAliasIndex === null) return;

    const newAliases = [...character.aliases];
    if (editedAlias.trim()) {
      newAliases[editingAliasIndex] = editedAlias.trim();
    } else {
      // Remove alias if empty
      newAliases.splice(editingAliasIndex, 1);
    }

    setSavingAlias(true);
    try {
      const updated = await updateCharacter(characterId, { aliases: newAliases });
      setCharacter(updated);
      setEditingAliasIndex(null);
      setEditedAlias('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update alias');
    } finally {
      setSavingAlias(false);
    }
  };

  const handleAliasCancel = () => {
    setEditingAliasIndex(null);
    setEditedAlias('');
  };

  const handleAddAlias = async () => {
    if (!character) return;
    const newAlias = 'new-alias';
    const newAliases = [...character.aliases, newAlias];

    setSavingAlias(true);
    try {
      const updated = await updateCharacter(characterId, { aliases: newAliases });
      setCharacter(updated);
      // Start editing the new alias immediately
      setEditedAlias(newAlias);
      setEditingAliasIndex(newAliases.length - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add alias');
    } finally {
      setSavingAlias(false);
    }
  };

  const handleDelete = async () => {
    if (!character) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${character.name}"? This will also delete all associated content. This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteCharacter(characterId);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete character');
      setDeleting(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'badge-draft';
      case 'APPROVED':
        return 'badge-approved';
      case 'PUBLISHED':
        return 'badge-published';
      case 'FAILED':
        return 'badge-failed';
      default:
        return 'badge-draft';
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="card" style={{ borderColor: 'var(--error)' }}>
          <p style={{ color: 'var(--error)' }}>{error}</p>
          <button
            onClick={loadData}
            style={{
              marginTop: '1rem',
              color: 'var(--foreground)',
              fontSize: '0.875rem',
              padding: '0.5rem 1rem',
              border: '1px solid var(--foreground)',
              borderRadius: '0',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--foreground)'}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>Character not found</p>
          <Link
            href="/"
            style={{
              marginTop: '1rem',
              color: 'var(--foreground)',
              fontSize: '0.875rem',
              padding: '0.5rem 1rem',
              border: '1px solid var(--foreground)',
              borderRadius: '0',
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'border-color 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--foreground)'}
          >
            Back to Characters
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link
            href="/"
            title="Back to Characters"
            style={{
              color: 'var(--foreground)',
              fontSize: '1rem',
              width: '2.5rem',
              height: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--foreground)',
              borderRadius: '0',
              textDecoration: 'none',
              transition: 'border-color 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--foreground)'}
          >
            ←
          </Link>
          {isEditingName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="text"
                className="input"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSave();
                  if (e.key === 'Escape') handleNameCancel();
                }}
                autoFocus
                style={{ fontSize: '1.5rem', fontWeight: 'bold', padding: '0.25rem 0.5rem' }}
              />
              <button
                onClick={handleNameSave}
                disabled={savingName}
                style={{
                  color: 'var(--foreground)',
                  fontSize: '0.875rem',
                  padding: '0.25rem 0.75rem',
                  border: '1px solid var(--foreground)',
                  borderRadius: '0',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                {savingName ? '...' : 'Save'}
              </button>
              <button
                onClick={handleNameCancel}
                style={{
                  color: 'var(--muted-foreground)',
                  fontSize: '0.875rem',
                  padding: '0.25rem 0.75rem',
                  border: '1px solid var(--muted-foreground)',
                  borderRadius: '0',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1
                className="page-title"
                style={{ margin: 0, cursor: 'pointer' }}
                onClick={handleNameEdit}
                title="Click to edit name"
              >
                {character.name}
              </h1>
              <ModePill mode={character.mode} twinOfName={character.twinOf ? 'Ubani' : null} />
              <SubtasteBadge timelineState={character.timelineState} />
              <SovereigntyBadge identity={character.identity} />
              <TickButton
                characterId={character.id}
                mode={character.mode}
                onTicked={() => setTimelineRefreshKey((k) => k + 1)}
              />
              <CreateTwinButton source={character} />
              {character.tizitaPersonaId && <IkengaEmblem />}
            </div>
          )}
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          title={deleting ? 'Deleting...' : 'Delete Character'}
          style={{
            color: 'var(--error)',
            fontSize: '1.25rem',
            width: '2.5rem',
            height: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--error)',
            borderRadius: '0',
            background: 'transparent',
            cursor: deleting ? 'not-allowed' : 'pointer',
            transition: 'border-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!deleting) e.currentTarget.style.borderColor = 'rgba(255, 107, 107, 0.4)';
          }}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--error)'}
        >
          {deleting ? '...' : '×'}
        </button>
      </div>

      <div className="grid grid-cols-3">
        <div style={{ gridColumn: 'span 2' }}>
          {/* Expression tabs — character's actual outputs.
              Voice (Ibis), Gallery (ComfyUI / Genoma), Content
              (current Slayt-adjacent flow), Story (arcs / beats). */}
          <ExpressionTabs activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === 'voice' && (
            <div className="card mb-4" style={{ minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', borderRadius: 0 }}>
              <p style={{ fontSize: '0.55rem', letterSpacing: '0.32em', color: 'var(--muted-foreground)', fontFamily: 'monospace', marginBottom: '0.5rem' }}>
                voice · ibis
              </p>
              <p style={{ fontFamily: '"Canela", serif', fontWeight: 300, fontSize: '1.1rem', color: 'var(--foreground)', maxWidth: '40ch', marginBottom: '0.4rem' }}>
                Writing samples in {character.name}'s voice will live here.
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', maxWidth: '50ch', lineHeight: 1.6 }}>
                Ibis federation pending. When wired, scripts, dialogue, and longform passages written in this character's voice surface here, conditioned on the writing LoRA + bio.
              </p>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="card mb-4" style={{ minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', borderRadius: 0 }}>
              <p style={{ fontSize: '0.55rem', letterSpacing: '0.32em', color: 'var(--muted-foreground)', fontFamily: 'monospace', marginBottom: '0.5rem' }}>
                gallery · comfyui · genoma
              </p>
              <p style={{ fontFamily: '"Canela", serif', fontWeight: 300, fontSize: '1.1rem', color: 'var(--foreground)', maxWidth: '40ch', marginBottom: '0.4rem' }}>
                Generated images for {character.name}.
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', maxWidth: '50ch', lineHeight: 1.6 }}>
                Renders made with this character's Visual / Style LoRAs (ComfyUI workflows or Genoma slider explorations) appear here. Pending federation.
              </p>
            </div>
          )}

          {activeTab === 'story' && (
            <div className="card mb-4" style={{ minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', borderRadius: 0 }}>
              <p style={{ fontSize: '0.55rem', letterSpacing: '0.32em', color: 'var(--muted-foreground)', fontFamily: 'monospace', marginBottom: '0.5rem' }}>
                story · arcs · beats
              </p>
              <p style={{ fontFamily: '"Canela", serif', fontWeight: 300, fontSize: '1.1rem', color: 'var(--foreground)', maxWidth: '40ch', marginBottom: '0.4rem' }}>
                {character.name}'s story.
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', maxWidth: '50ch', lineHeight: 1.6 }}>
                Arcs and beats this character belongs to. Currently lives in the Story Templates / Trajectories surface; merging in here next.
              </p>
            </div>
          )}

          {activeTab === 'content' && (
          <>
          {/* Generate Content Form */}
          <div className="card mb-4">
            <h3 className="card-title">Generate Content</h3>
            <form onSubmit={handleGenerate} className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">Platform</label>
                  <select
                    className="select"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as 'X' | 'TIKTOK' | 'INSTAGRAM')}
                  >
                    <option value="X">X (Twitter)</option>
                    <option value="TIKTOK">TikTok</option>
                    <option value="INSTAGRAM">Instagram</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Intent</label>
                  <input
                    type="text"
                    className="input"
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                    placeholder="e.g., promote new project, engage followers"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={generating || !intent.trim()}
              >
                {generating ? 'Generating...' : 'Generate Draft'}
              </button>
            </form>
          </div>

          {/* Content Table */}
          <div className="card">
            <h3 className="card-title">Content</h3>
            {contentItems.length === 0 ? (
              <div className="empty-state">
                <p>No content yet. Generate your first draft above.</p>
              </div>
            ) : (
              <table className="table mt-4">
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Text</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contentItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.platform}</td>
                      <td style={{ maxWidth: '300px' }}>
                        {item.text.slice(0, 80)}
                        {item.text.length > 80 ? '...' : ''}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          {item.status === 'DRAFT' && (
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleApprove(item.id)}
                              disabled={actionLoading[item.id]}
                            >
                              {actionLoading[item.id] ? '...' : 'Approve'}
                            </button>
                          )}
                          {item.status === 'APPROVED' && (
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handlePublish(item.id)}
                              disabled={actionLoading[item.id]}
                            >
                              {actionLoading[item.id] ? '...' : 'Publish'}
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleGenerateAudio(item.id)}
                            disabled={actionLoading[`audio-${item.id}`]}
                          >
                            {actionLoading[`audio-${item.id}`] ? '...' : 'Audio'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          </>
          )}

          {/* Memory tending · Phase 2 of agentic-build.md.
              Lives below the expression tabs because what a
              character is can be read off their outputs (left column
              tabs) and what they remember (this strip). The right
              column is structural identity. */}
          <TimelineStrip
            characterId={character.id}
            characterName={character.name}
            refreshKey={timelineRefreshKey}
          />
        </div>

        {/* Character Info Sidebar */}
        <div>
          <div className="card">
            {/* Character Header: Name, Avatar, Description */}
            <div className="character-info-header">
              {isEditingName ? (
                <input
                  type="text"
                  className="input"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameSave();
                    if (e.key === 'Escape') handleNameCancel();
                  }}
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    textAlign: 'center',
                    marginBottom: '0.5rem',
                    borderRadius: 0,
                  }}
                />
              ) : (
                <h3
                  className="character-info-name"
                  style={{ cursor: 'pointer' }}
                  onClick={handleNameEdit}
                  title="Click to edit"
                >
                  {character.name}
                </h3>
              )}

              {/* Avatar Circle. Falls back to Tizita's representative
                  photo when no explicit avatar is set, then to the
                  initial-letter placeholder. */}
              {character.avatarUrl ? (
                <RepositionableCircleAvatar
                  src={character.avatarUrl}
                  position={character.avatarPosition || '50% 50% 1'}
                  onPositionChange={handleAvatarPositionChange}
                  size={120}
                  disabled={avatarUpdating}
                />
              ) : character.tizitaRepresentativeUrl ? (
                <div className="character-info-avatar" style={{ width: 120, height: 120, borderRadius: '50%', overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={character.tizitaRepresentativeUrl}
                    alt={character.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ) : (
                <div className="character-info-avatar">
                  <span className="character-avatar-placeholder" style={{ fontSize: '3rem' }}>
                    {character.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {isEditingBio ? (
                <div style={{ width: '100%' }}>
                  <textarea
                    value={editedBio}
                    onChange={(e) => {
                      setEditedBio(e.target.value);
                      // Auto-resize textarea to fit content
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    ref={(el) => {
                      // Initial auto-resize on mount
                      if (el) {
                        el.style.height = 'auto';
                        el.style.height = el.scrollHeight + 'px';
                      }
                    }}
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '0.5rem',
                      fontSize: '0.875rem',
                      border: '1px solid var(--foreground)',
                      borderRadius: '0',
                      background: '#000000',
                      color: 'var(--foreground)',
                      outline: 'none',
                      resize: 'none',
                      fontFamily: 'inherit',
                      overflow: 'hidden',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'center' }}>
                    <button
                      onClick={handleBioSave}
                      disabled={savingBio}
                      style={{
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.75rem',
                        border: '1px solid var(--foreground)',
                        borderRadius: '0',
                        background: 'transparent',
                        color: 'var(--foreground)',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--foreground)'}
                    >
                      {savingBio ? '...' : 'Save'}
                    </button>
                    <button
                      onClick={handleBioCancel}
                      style={{
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.75rem',
                        border: '1px solid var(--muted-foreground)',
                        borderRadius: '0',
                        background: 'transparent',
                        color: 'var(--muted-foreground)',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--muted-foreground)'}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p
                  className="card-description"
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                  onClick={handleBioEdit}
                  title="Click to edit bio"
                >
                  {previewBio || 'No bio provided - click to add'}
                </p>
              )}
            </div>

            {/* Avatar Management. Hidden for Tizita-bound characters
                because Tizita is the face authority — change the
                representative photo there. Custom uploads remain for
                non-Tizita operators. */}
            {!character.tizitaPersonaId && (
              <div className="mt-4" style={{ borderRadius: 0 }}>
                <strong style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', display: 'block', marginBottom: '0.5rem' }}>
                  Avatar
                </strong>
                {character.avatarUrl ? (
                  <DraggableAvatar
                    src={character.avatarUrl}
                    position={character.avatarPosition}
                    onPositionChange={handleAvatarPositionChange}
                    onRemove={() => handleAvatarChange(null)}
                    onReplace={handleAvatarChange}
                    disabled={avatarUpdating}
                  />
                ) : (
                  <ImageUpload
                    value={character.avatarUrl}
                    onChange={handleAvatarChange}
                    disabled={avatarUpdating}
                  />
                )}
              </div>
            )}

            {/* Tizita-bound photos + Ikenga emblem (collapsed by default) */}
            <TizitaPanel characterId={character.id} tizitaPersonaId={character.tizitaPersonaId} />

            {/* Group / collective members. Hidden for solo
                characters (the default). Surfaced when composition
                is duo / group / collective. */}
            <SubtastePicker character={character} onUpdated={setCharacter} />
            <SpeciesPicker character={character} onUpdated={setCharacter} />
            <TonguePanel character={character} onUpdated={setCharacter} />
            <IdentityRegisterPanel character={character} onUpdated={setCharacter} />
            <CompositionKindPicker character={character} onUpdated={setCharacter} />
            {character.compositionKind && character.compositionKind !== 'solo' && (
              <>
                <GroupMembersPanel
                  characterId={character.id}
                  initialMembers={character.groupMembers ?? []}
                />
                <ComposeGroupSubtasteButton
                  character={character}
                  onApplied={() => {
                    void getCharacter(character.id).then(setCharacter);
                  }}
                />
              </>
            )}

            {/* LoRA category slots: visual / voice / writing / music /
                motion / style. Each slot pipes into the matching
                downstream surface (ComfyUI, Chromox, Ibis, etc.). */}
            <LoraPanel
              characterId={character.id}
              initialLoras={character.loras ?? []}
            />

            {/* Goals · perimeter of intent. Shapes the tick prompt.
                Hidden for manual / relic. */}
            <GoalsPanel
              characterId={character.id}
              mode={character.mode}
              initialGoals={character.goals}
            />

            {/* Forge · aligned character generator. Lineage +
                Subtaste + brief produce coherent bio / backstory /
                aliases / tags / goals in one pass. Sheaf theory:
                shared anchor, locally chaotic, globally consistent. */}
            <ForgePanel character={character} onUpdated={setCharacter} />

            {/* Voice · authoredBy + few-shot voice samples. The
                pre-LoRA bridge to per-character voice authenticity.
                Paste artist samples; tick prompt leads with them. */}
            <VoicePanel character={character} onUpdated={setCharacter} />

            {/* Cohort phrases · the slang MOAT review surface.
                Extract → review → promote → Ibis frontier writeback.
                See docs/slang-cohort.md. */}
            <CohortPhrasePanel character={character} />

            {/* Backstory · deeper context for the tick LLM. Never
                displayed in cards, never quoted by the character.
                Collapsed by default. Empty by default. */}
            <BackstoryPanel character={character} onUpdated={setCharacter} />

            <div>
              {/* Aliases Section - Editable like Persona Tags */}
              <div className="mt-4">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    ALIASES
                  </strong>
                  <button
                    onClick={handleAddAlias}
                    disabled={savingAlias}
                    title="Add alias"
                    style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      color: 'var(--muted-foreground)',
                      border: '1px solid var(--muted-foreground)',
                      borderRadius: '0',
                      background: 'transparent',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--foreground)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--muted-foreground)'}
                  >
                    +
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {character.aliases.map((alias, index) => (
                    editingAliasIndex === index ? (
                      <div key={index} style={{ display: 'flex', gap: '0.25rem' }}>
                        <input
                          type="text"
                          value={editedAlias}
                          onChange={(e) => setEditedAlias(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAliasSave();
                            if (e.key === 'Escape') handleAliasCancel();
                          }}
                          autoFocus
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            border: '1px solid var(--foreground)',
                            borderRadius: '0',
                            background: '#000000',
                            color: 'var(--foreground)',
                            outline: 'none',
                            width: '100px',
                          }}
                        />
                        <button
                          onClick={handleAliasSave}
                          disabled={savingAlias}
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.625rem',
                            border: '1px solid var(--foreground)',
                            borderRadius: '0',
                            background: 'transparent',
                            color: 'var(--foreground)',
                            cursor: 'pointer',
                          }}
                        >
                          {savingAlias ? '...' : 'Save'}
                        </button>
                        <button
                          onClick={handleAliasCancel}
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.625rem',
                            border: '1px solid var(--muted-foreground)',
                            borderRadius: '0',
                            background: 'transparent',
                            color: 'var(--muted-foreground)',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        key={index}
                        onClick={() => handleAliasEdit(index)}
                        title="Click to edit"
                        style={{
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: 'var(--foreground)',
                          backgroundColor: '#000000',
                          border: '1px solid var(--foreground)',
                          borderRadius: '0',
                          cursor: 'pointer',
                          transition: 'border-color 0.2s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--foreground)'}
                      >
                        {alias}
                      </button>
                    )
                  ))}
                  {character.aliases.length === 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                      No aliases
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    PERSONA TAGS
                  </strong>
                  <button
                    onClick={handleAddTag}
                    disabled={savingTag}
                    title="Add tag"
                    style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      color: 'var(--muted-foreground)',
                      border: '1px solid var(--muted-foreground)',
                      borderRadius: '0',
                      background: 'transparent',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--foreground)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--muted-foreground)'}
                  >
                    +
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {character.personaTags.map((tag, index) => (
                    editingTagIndex === index ? (
                      <div key={index} style={{ display: 'flex', gap: '0.25rem' }}>
                        <input
                          type="text"
                          value={editedTag}
                          onChange={(e) => setEditedTag(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleTagSave();
                            if (e.key === 'Escape') handleTagCancel();
                          }}
                          autoFocus
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            border: '1px solid var(--foreground)',
                            borderRadius: '0',
                            background: '#000000',
                            color: 'var(--foreground)',
                            outline: 'none',
                            width: '100px',
                          }}
                        />
                        <button
                          onClick={handleTagSave}
                          disabled={savingTag}
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.625rem',
                            border: '1px solid var(--foreground)',
                            borderRadius: '0',
                            background: 'transparent',
                            color: 'var(--foreground)',
                            cursor: 'pointer',
                          }}
                        >
                          {savingTag ? '...' : '✓'}
                        </button>
                        <button
                          onClick={handleTagCancel}
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.625rem',
                            border: '1px solid var(--muted-foreground)',
                            borderRadius: '0',
                            background: 'transparent',
                            color: 'var(--muted-foreground)',
                            cursor: 'pointer',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        key={index}
                        onClick={() => handleTagEdit(index)}
                        title="Click to edit"
                        style={{
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: 'var(--foreground)',
                          backgroundColor: '#000000',
                          border: '1px solid var(--foreground)',
                          borderRadius: '0',
                          cursor: 'pointer',
                          transition: 'border-color 0.2s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--foreground)'}
                      >
                        {tag}
                      </button>
                    )
                  ))}
                  {character.personaTags.length === 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                      No tags
                    </span>
                  )}
                </div>
              </div>

              {character.currentArc && (
                <div className="mt-4">
                  <strong style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    CURRENT ARC
                  </strong>
                  <p style={{ fontSize: '0.875rem' }}>{character.currentArc}</p>
                </div>
              )}

              {/* Pro Mode Toggle */}
              {(() => {
                // Try to get archetype data from timelineState
                const ts = character.timelineState as Record<string, any>;
                const gen = ts?.oripheon?.generated;
                const arcana = gen?.arcana;
                const subtaste = gen?.subtaste;

                // Get aesthetic class from subtaste or derive from orisha
                let aestheticClass: string | null = null;

                if (subtaste?.code) {
                  aestheticClass = subtaste.code;
                } else if (arcana?.archetype) {
                  // Try to look up from archetype
                  const orishaName = arcana.archetype as OrishaName;
                  try {
                    const imprint = getSymbolicImprint(orishaName);
                    aestheticClass = imprint?.aestheticClass || null;
                  } catch {
                    // Not a valid orisha name
                  }
                }

                if (!aestheticClass && !SUBTASTE_DESIGNATIONS[aestheticClass || '']) {
                  return null;
                }

                return (
                  <div className="mt-4" style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    {/* Pro Mode Toggle Button */}
                    <button
                      onClick={() => setProMode(!proMode)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: proMode ? 'var(--foreground)' : '#000000',
                        color: proMode ? 'var(--background)' : 'var(--foreground)',
                        border: '1px solid var(--foreground)',
                        borderRadius: '0',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        letterSpacing: '0.08em',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <span>Pro Mode</span>
                      <span>{proMode ? 'ON' : 'OFF'}</span>
                    </button>

                    {/* Pro Mode Content - Archetype Dynamics */}
                    {proMode && aestheticClass && (
                      <div style={{ marginTop: '1rem' }}>
                        <ArchetypeDynamics aestheticClass={aestheticClass} />
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TYRIAN = '#66023C';

const EXPRESSION_TABS = [
  { id: 'voice', label: 'Voice', sub: 'ibis' },
  { id: 'gallery', label: 'Gallery', sub: 'comfyui · genoma' },
  { id: 'content', label: 'Content', sub: 'slayt' },
  { id: 'story', label: 'Story', sub: 'arcs · beats' },
] as const;

function ExpressionTabs({
  activeTab,
  onChange,
}: {
  activeTab: 'voice' | 'gallery' | 'content' | 'story';
  onChange: (id: 'voice' | 'gallery' | 'content' | 'story') => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '0',
        marginBottom: '1rem',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {EXPRESSION_TABS.map((t) => {
        const active = t.id === activeTab;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            style={{
              padding: '0.6rem 1.1rem 0.7rem 1.1rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.15rem',
              borderBottom: active ? `1px solid ${TYRIAN}` : '1px solid transparent',
              marginBottom: '-1px',
              color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            <span
              style={{
                fontFamily: '"Canela", serif',
                fontWeight: 300,
                fontSize: '1rem',
                letterSpacing: '0.005em',
              }}
            >
              {t.label}
            </span>
            <span
              style={{
                fontSize: '0.5rem',
                letterSpacing: '0.22em',
                fontFamily: 'monospace',
                color: active ? TYRIAN : 'var(--muted-foreground)',
                opacity: active ? 0.85 : 0.5,
              }}
            >
              {t.sub}
            </span>
          </button>
        );
      })}
    </div>
  );
}
