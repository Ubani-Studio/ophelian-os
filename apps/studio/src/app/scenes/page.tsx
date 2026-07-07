'use client';

import { useEffect, useState } from 'react';
import {
  getScenes,
  createScene,
  updateScene,
  deleteScene,
  type Scene,
  type CreateSceneInput,
  type UpdateSceneInput,
} from '@/lib/api';

export default function ScenesPage() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [formData, setFormData] = useState<CreateSceneInput>({
    name: '',
    type: 'location',
    description: '',
  });

  const loadScenes = async () => {
    try {
      const data = await getScenes();
      setScenes(data);
    } catch (error) {
      console.error('Failed to load scenes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScenes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingScene) {
        await updateScene(editingScene.id, formData as UpdateSceneInput);
      } else {
        await createScene(formData);
      }
      await loadScenes();
      closeModal();
    } catch (error) {
      console.error('Failed to save scene:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scene?')) return;
    try {
      await deleteScene(id);
      await loadScenes();
    } catch (error) {
      console.error('Failed to delete scene:', error);
    }
  };

  const openModal = (scene?: Scene) => {
    if (scene) {
      setEditingScene(scene);
      setFormData({
        name: scene.name,
        type: scene.type,
        description: scene.description || '',
      });
    } else {
      setEditingScene(null);
      setFormData({ name: '', type: 'location', description: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingScene(null);
    setFormData({ name: '', type: 'location', description: '' });
  };

  const getTypeIcon = (type: string) => {
    return type === 'event' ? '\u2606' : '\u25CB';
  };

  if (loading) {
    return <div className="loading">Loading scenes...</div>;
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Scenes</h1>
          <p className="page-subtitle">Locations and events in your world</p>
        </div>
        <button className="btn btn-secondary" onClick={() => openModal()}>
          New Scene
        </button>
      </div>

      {scenes.length === 0 ? (
        <div className="empty-state">
          <p>No scenes yet. Create your first scene to get started.</p>
        </div>
      ) : (
        <div className="entity-grid">
          {scenes.map((scene) => (
            <div key={scene.id} className="entity-card scene-card">
              <div className="entity-card-header">
                <div className="entity-card-icon scene-icon">
                  {getTypeIcon(scene.type)}
                </div>
                <div className="entity-card-meta">
                  <span className="entity-type-badge scene-badge">{scene.type}</span>
                </div>
              </div>
              <h3 className="entity-card-title">{scene.name}</h3>
              {scene.description && (
                <p className="entity-card-description">{scene.description}</p>
              )}
              <div className="entity-card-actions">
                <a
                  href={`/scenes/${scene.id}`}
                  className="btn btn-sm btn-secondary"
                  style={{ textDecoration: 'none', display: 'inline-block' }}
                >
                  Open
                </a>
                <button className="btn btn-sm btn-secondary" onClick={() => openModal(scene)}>
                  Edit
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(scene.id)}>
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
              <h2 className="modal-title">{editingScene ? 'Edit Scene' : 'New Scene'}</h2>
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
                  placeholder="e.g., The Dark Forest"
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">Type</label>
                <select
                  className="select"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'location' | 'event' })}
                >
                  <option value="location">Location</option>
                  <option value="event">Event</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Description</label>
                <textarea
                  className="input textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this scene..."
                  rows={4}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingScene ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
