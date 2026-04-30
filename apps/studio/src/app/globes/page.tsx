'use client';

import { useEffect, useState } from 'react';
import {
  getWorlds,
  createWorld,
  updateWorld,
  deleteWorld,
  type World,
  type CreateWorldInput,
  type UpdateWorldInput,
} from '@/lib/api';
import styles from './globes.module.css';

export default function GlobesPage() {
  const [globes, setGlobes] = useState<World[]>([]);
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
  }, []);

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
          <h1 className={styles.title}>Universes</h1>
          <p className={styles.subtitle}>Top-level worlds. Station 8, the Mythos, every reality you build.</p>
        </div>
        <button className={styles.createButton} onClick={() => openModal()}>
          New universe
        </button>
      </div>

      {globes.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No universes yet. Create one or migrate from Òrò in Settings.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {globes.map((globe) => (
            <div key={globe.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>
                  {getTypeIcon(globe.type)}
                </div>
                <span className={styles.cardBadge}>{globe.type}</span>
              </div>

              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{globe.name}</h3>
                {globe.description && (
                  <p className={styles.cardDescription}>{globe.description}</p>
                )}
              </div>

              <div className={styles.cardActions}>
                <button
                  className={styles.actionButton}
                  onClick={() => openModal(globe)}
                >
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
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <h2 className="modal-title">{editingGlobe ? 'Edit Region' : 'New Region'}</h2>
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
                  placeholder="e.g., The Realm of Shadows"
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
                  placeholder="Describe this region..."
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
