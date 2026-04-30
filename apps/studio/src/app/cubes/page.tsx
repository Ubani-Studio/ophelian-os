'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getWorlds,
  createWorld,
  updateWorld,
  deleteWorld,
  getCharacters,
  type World,
  type Character,
  type CreateWorldInput,
  type UpdateWorldInput,
} from '@/lib/api';
import styles from './globes.module.css';

export default function GlobesPage() {
  const [globes, setGlobes] = useState<World[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCubeId, setSelectedCubeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGlobe, setEditingGlobe] = useState<World | null>(null);
  const [formData, setFormData] = useState<CreateWorldInput>({
    name: '',
    type: 'setting',
    description: '',
  });

  const loadGlobes = async () => {
    try {
      const data = await getWorlds();
      setGlobes(data);
    } catch (error) {
      console.error('Failed to load globes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGlobes();
    getCharacters().then(setCharacters).catch(() => {});
  }, []);

  const selectedCube = selectedCubeId ? globes.find((g) => g.id === selectedCubeId) : null;
  const selectedCubeCharacters = selectedCubeId
    ? characters.filter((c) => c.worldId === selectedCubeId)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGlobe) {
        await updateWorld(editingGlobe.id, formData as UpdateWorldInput);
      } else {
        await createWorld(formData);
      }
      await loadGlobes();
      closeModal();
    } catch (error) {
      console.error('Failed to save globe:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this globe?')) return;
    try {
      await deleteWorld(id);
      await loadGlobes();
    } catch (error) {
      console.error('Failed to delete globe:', error);
    }
  };

  const openModal = (globe?: World) => {
    if (globe) {
      setEditingGlobe(globe);
      setFormData({
        name: globe.name,
        type: globe.type,
        description: globe.description || '',
      });
    } else {
      setEditingGlobe(null);
      setFormData({ name: '', type: 'setting', description: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGlobe(null);
    setFormData({ name: '', type: 'setting', description: '' });
  };

  const getTypeIcon = (type: string) => {
    return type === 'story' ? '✦' : '◆';
  };

  if (loading) {
    return <div className="loading">Loading regions...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Cubes</h1>
          <p className={styles.subtitle}>Self-contained realities. Station 8, the Mythos, every cube you build.</p>
        </div>
        <button className={styles.createButton} onClick={() => openModal()}>
          New cube
        </button>
      </div>

      {globes.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No cubes yet. Create one or migrate from Òrò in Settings.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedCube ? '1fr 360px' : '1fr', gap: '1.5rem' }}>
          <div className={styles.grid}>
            {globes.map((globe) => {
              const isSelected = selectedCubeId === globe.id;
              return (
                <div
                  key={globe.id}
                  className={styles.card}
                  onClick={() => setSelectedCubeId(isSelected ? null : globe.id)}
                  style={{
                    cursor: 'pointer',
                    borderColor: isSelected ? '#66023C' : undefined,
                  }}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.cardIcon}>{getTypeIcon(globe.type)}</div>
                    <span className={styles.cardBadge}>{globe.type}</span>
                  </div>

                  <div className={styles.cardContent}>
                    <h3 className={styles.cardTitle}>{globe.name}</h3>
                    {globe.description && (
                      <p className={styles.cardDescription}>{globe.description}</p>
                    )}
                  </div>

                  <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
                    <button className={styles.actionButton} onClick={() => openModal(globe)}>
                      Edit
                    </button>
                    <button
                      className={`${styles.actionButton} ${styles.danger}`}
                      onClick={() => handleDelete(globe.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedCube && (
            <aside
              style={{
                border: '1px solid var(--border)',
                background: 'rgba(255,255,255,0.02)',
                padding: '1.25rem',
                position: 'sticky',
                top: '1rem',
                alignSelf: 'start',
                maxHeight: 'calc(100vh - 2rem)',
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.55rem', letterSpacing: '0.3em', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
                  {selectedCube.type}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCubeId(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  ×
                </button>
              </div>
              <h2 style={{ fontFamily: '"Canela", serif', fontWeight: 300, fontSize: '1.4rem', marginBottom: '0.4rem' }}>
                {selectedCube.name}
              </h2>
              {selectedCube.description && (
                <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                  {selectedCube.description}
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Link
                  href={`/cubes/${selectedCube.id}/nexus`}
                  style={{
                    display: 'block',
                    padding: '0.55rem 0.8rem',
                    fontSize: '0.7rem',
                    letterSpacing: '0.15em',
                    background: '#66023C',
                    color: '#fff',
                    border: '1px solid #66023C',
                    textAlign: 'center',
                    textDecoration: 'none',
                    textTransform: 'lowercase',
                  }}
                >
                  open nexus
                </Link>
                <Link
                  href={`/cubes/${selectedCube.id}/scenes`}
                  style={{
                    display: 'block',
                    padding: '0.55rem 0.8rem',
                    fontSize: '0.7rem',
                    letterSpacing: '0.15em',
                    background: 'transparent',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                    textAlign: 'center',
                    textDecoration: 'none',
                    textTransform: 'lowercase',
                  }}
                >
                  scenes
                </Link>
              </div>

              <div>
                <p style={{ fontSize: '0.55rem', letterSpacing: '0.3em', color: 'var(--muted-foreground)', fontFamily: 'monospace', marginBottom: '0.5rem' }}>
                  inhabitants · {selectedCubeCharacters.length}
                </p>
                {selectedCubeCharacters.length === 0 && (
                  <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
                    No characters bound to this cube yet.
                  </p>
                )}
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {selectedCubeCharacters.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/characters/${c.id}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.55rem',
                          padding: '0.35rem 0.4rem',
                          textDecoration: 'none',
                          color: 'var(--foreground)',
                          background: 'transparent',
                        }}
                      >
                        <span
                          style={{
                            width: 24,
                            height: 24,
                            background: 'rgba(0,0,0,0.4)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.55rem',
                            color: 'var(--muted-foreground)',
                            fontFamily: 'monospace',
                            overflow: 'hidden',
                          }}
                        >
                          {c.avatarUrl || c.tizitaRepresentativeUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={c.avatarUrl || c.tizitaRepresentativeUrl || ''}
                              alt={c.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            c.name.charAt(0)
                          )}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontFamily: '"Canela", serif', fontWeight: 300 }}>
                          {c.name}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <h2 className="modal-title">{editingGlobe ? 'Edit cube' : 'New cube'}</h2>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="label">Name</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Station 8, The Mythos"
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">Type</label>
                <select
                  className="select"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'setting' | 'story' })}
                >
                  <option value="setting">Setting</option>
                  <option value="story">Story</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Description</label>
                <textarea
                  className="input textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this cube..."
                  rows={4}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingGlobe ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
