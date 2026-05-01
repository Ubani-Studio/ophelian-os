'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ReactFlow, {
  Node,
  Edge,
  Connection,
  ConnectionMode,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  NodeTypes,
  EdgeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';

import {
  getCharacters,
  getScenes,
  getWorlds,
  getRelationships,
  getConnections,
  createRelationship,
  createConnection,
  updatePosition,
  updateScenePosition,
  updateWorldPosition,
  deleteRelationship,
  deleteConnection,
  createScene,
  createWorld,
  updateScene,
  updateWorld,
  deleteScene,
  deleteWorld,
  getSnapshots,
  createSnapshot,
  restoreSnapshot,
  deleteSnapshot,
  syncAllOripheonData,
  type Character,
  type Scene,
  type World,
  type CharacterRelationship,
  type WorldConnection,
  type CreateRelationshipInput,
  type CreateSceneInput,
  type CreateWorldInput,
  type UpdateSceneInput,
  type UpdateWorldInput,
  type NexusSnapshot,
} from '@/lib/api';

import { storyTemplates, StoryTemplate, temperatureColors } from '@/lib/story-templates';
import { StoryTemplateDetail } from '@/components/nexus/StoryTemplateDetail';

import { CharacterNode } from '@/components/world/CharacterNode';
import { SceneNode } from '@/components/world/SceneNode';
import { WorldNode } from '@/components/world/WorldNode';
import { RelationshipEdge } from '@/components/world/RelationshipEdge';
import { ConnectionEdge } from '@/components/world/ConnectionEdge';
import { CharacterDetailPanel } from '@/components/world/CharacterDetailPanel';
import { SuggestedRelationshipsPanel } from '@/components/world/SuggestedRelationshipsPanel';
import { SceneDetailPanel } from '@/components/world/SceneDetailPanel';
import { WorldDetailPanel } from '@/components/world/WorldDetailPanel';
import { RelationshipDetailPanel } from '@/components/world/RelationshipDetailPanel';
import { NewRelationshipModal } from '@/components/world/NewRelationshipModal';
import { NewConnectionModal } from '@/components/world/NewConnectionModal';
import { NewSceneModal } from '@/components/world/NewSceneModal';
import { NewWorldModal } from '@/components/world/NewWorldModal';
import { AddCharacterToCube } from '@/components/AddCharacterToCube';

type EntityType = 'character' | 'scene' | 'world';

interface SelectedEntity {
  type: EntityType;
  id: string;
}

interface SelectedRelationship {
  relationship: CharacterRelationship;
  sourceCharacter: Character;
  targetCharacter: Character;
}

interface SelectedConnection {
  connection: WorldConnection;
}

export default function WorldBuilderPage() {
  // Cube scope
  const params = useParams();
  const cubeId = params.id as string;
  const [crossCube, setCrossCube] = useState(false);
  const [cubeName, setCubeName] = useState<string>('');
  // Full cube record for the trajectory pin / unpin surface in the
  // Story Templates panel. Refreshed by loadData.
  const [cube, setCube] = useState<World | null>(null);

  // Data state. The 'characters' / 'scenes' state hold the SCOPED
  // view (only entities belonging to this Cube unless crossCube is
  // on). Cubes themselves are not rendered as nodes here — you're
  // inside the Cube; it's the container, not a peer entity. Sub-
  // locations will become Region nodes once that entity ships.
  const [characters, setCharacters] = useState<Character[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [relationships, setRelationships] = useState<CharacterRelationship[]>([]);
  const [connections, setConnections] = useState<WorldConnection[]>([]);
  const [snapshots, setSnapshots] = useState<NexusSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  // Snapshot UI state
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [overviewOpen, setOverviewOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [restoringSnapshot, setRestoringSnapshot] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Story Templates state
  const [showStoryTemplates, setShowStoryTemplates] = useState(false);
  const [selectedStoryTemplate, setSelectedStoryTemplate] = useState<StoryTemplate | null>(null);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // UI state. showWorlds defaults FALSE inside a per-Cube nexus —
  // the Cube is the container of this view, not a node within it.
  // The crossCube toggle below is what unhides cube-level edges.
  const [showCharacters, setShowCharacters] = useState(true);
  const [showScenes, setShowScenes] = useState(true);
  const [showWorlds, setShowWorlds] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);

  // Selection state
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<SelectedRelationship | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<SelectedConnection | null>(null);

  // Modal state
  const [showRelationshipModal, setShowRelationshipModal] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [showSceneModal, setShowSceneModal] = useState(false);
  const [showWorldModal, setShowWorldModal] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<{ source: string; target: string } | null>(null);

  // Shift+click connection state
  const [shiftConnectSource, setShiftConnectSource] = useState<string | null>(null);

  // Shift-held state for full-surface drag connect
  const [shiftHeld, setShiftHeld] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Shift') setShiftHeld(true); };
    const onKeyUp = (e: KeyboardEvent) => { if (e.key === 'Shift') setShiftHeld(false); };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Node types
  const nodeTypes: NodeTypes = useMemo(() => ({
    character: CharacterNode,
    scene: SceneNode,
    world: WorldNode,
  }), []);

  // Edge types
  const edgeTypes: EdgeTypes = useMemo(() => ({
    relationship: RelationshipEdge,
    connection: ConnectionEdge,
  }), []);

  // Load all data, scoped to this Cube unless crossCube is on.
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [chars, scns, wrlds, rels, conns] = await Promise.all([
        getCharacters(),
        getScenes(),
        getWorlds(),
        getRelationships(),
        getConnections(),
      ]);

      const found = wrlds.find((w) => w.id === cubeId);
      if (found) {
        setCubeName(found.name);
        setCube(found);
      }

      // Cube scope: only characters whose worldId matches this Cube
      // are visible by default. With crossCube on, all characters
      // appear (cross-Cube edges then visible too).
      const scopedChars = crossCube
        ? chars
        : chars.filter((c) => c.worldId === cubeId);
      const scopedCharIds = new Set(scopedChars.map((c) => c.id));
      const scopedRels = crossCube
        ? rels
        : rels.filter(
            (r) =>
              scopedCharIds.has(r.sourceCharacterId) &&
              scopedCharIds.has(r.targetCharacterId),
          );
      // Connections: keep when either endpoint is a visible character,
      // or when sourceType / targetType is SCENE (scenes don't have
      // worldId yet so we show them all). Will tighten when scenes
      // get worldId.
      const scopedConns = crossCube
        ? conns
        : conns.filter((c) => {
            const srcVisible = c.sourceType !== 'CHARACTER' || scopedCharIds.has(c.sourceId);
            const tgtVisible = c.targetType !== 'CHARACTER' || scopedCharIds.has(c.targetId);
            return srcVisible && tgtVisible;
          });

      setCharacters(scopedChars);
      setScenes(scns);
      // Cubes never render as nodes inside a per-Cube nexus, so the
      // worlds state is left empty here even though we fetched them
      // (the fetch is needed for cubeName resolution above).
      setWorlds([]);
      setRelationships(scopedRels);
      setConnections(scopedConns);

      // Load snapshots separately so it doesn't block main data
      try {
        const snaps = await getSnapshots();
        setSnapshots(snaps);
      } catch (snapError) {
        console.error('Failed to load snapshots:', snapError);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [cubeId, crossCube]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle relationship click
  const handleRelationshipClick = useCallback((relationship: CharacterRelationship) => {
    const source = characters.find(c => c.id === relationship.sourceCharacterId);
    const target = characters.find(c => c.id === relationship.targetCharacterId);
    if (source && target) {
      setSelectedEntity(null);
      setSelectedConnection(null);
      setSelectedStoryTemplate(null);
      setSelectedRelationship({ relationship, sourceCharacter: source, targetCharacter: target });
    }
  }, [characters]);

  // Handle connection click
  const handleConnectionClick = useCallback((connection: WorldConnection) => {
    setSelectedEntity(null);
    setSelectedRelationship(null);
    setSelectedStoryTemplate(null);
    setSelectedConnection({ connection });
  }, []);

  // Build nodes from entities
  useEffect(() => {
    const newNodes: Node[] = [];

    if (showCharacters) {
      characters.forEach((char, index) => {
        const nodeId = `character:${char.id}`;
        const position = char.position
          ? { x: char.position.x, y: char.position.y }
          : { x: 100 + (index % 5) * 180, y: 100 + Math.floor(index / 5) * 180 };

        newNodes.push({
          id: nodeId,
          type: 'character',
          position,
          draggable: !shiftHeld,
          data: {
            character: char,
            isConnectSource: shiftConnectSource === nodeId,
            shiftHeld,
            onClick: () => {
              setSelectedRelationship(null);
              setSelectedConnection(null);
              setSelectedStoryTemplate(null);
              setSelectedEntity({ type: 'character', id: char.id });
            },
          },
        });
      });
    }

    if (showScenes) {
      scenes.forEach((scene, index) => {
        const nodeId = `scene:${scene.id}`;
        const position = scene.position
          ? { x: scene.position.x, y: scene.position.y }
          : { x: 500 + (index % 5) * 180, y: 100 + Math.floor(index / 5) * 180 };

        newNodes.push({
          id: nodeId,
          type: 'scene',
          position,
          draggable: !shiftHeld,
          data: {
            scene,
            isConnectSource: shiftConnectSource === nodeId,
            shiftHeld,
            onClick: () => {
              setSelectedRelationship(null);
              setSelectedConnection(null);
              setSelectedStoryTemplate(null);
              setSelectedEntity({ type: 'scene', id: scene.id });
            },
          },
        });
      });
    }

    if (showWorlds) {
      worlds.forEach((world, index) => {
        const nodeId = `world:${world.id}`;
        const position = world.position
          ? { x: world.position.x, y: world.position.y }
          : { x: 300 + (index % 3) * 220, y: 400 + Math.floor(index / 3) * 220 };

        newNodes.push({
          id: nodeId,
          type: 'world',
          position,
          draggable: !shiftHeld,
          data: {
            world,
            isConnectSource: shiftConnectSource === nodeId,
            shiftHeld,
            onClick: () => {
              setSelectedRelationship(null);
              setSelectedConnection(null);
              setSelectedStoryTemplate(null);
              setSelectedEntity({ type: 'world', id: world.id });
            },
          },
        });
      });
    }

    // Focal interaction (TheBrain-style): when something is selected,
    // tag each node so CSS can dim non-neighbours and emphasise the
    // selected node + its 1-hop neighbours. Computed here against
    // current relationships + connections.
    const focalId = selectedEntity
      ? `${selectedEntity.type}:${selectedEntity.id}`
      : null;
    const neighbourIds = new Set<string>();
    if (focalId) {
      neighbourIds.add(focalId);
      for (const r of relationships) {
        const a = `character:${r.sourceCharacterId}`;
        const b = `character:${r.targetCharacterId}`;
        if (a === focalId) neighbourIds.add(b);
        if (b === focalId) neighbourIds.add(a);
      }
      for (const c of connections) {
        const a = `${c.sourceType.toLowerCase()}:${c.sourceId}`;
        const b = `${c.targetType.toLowerCase()}:${c.targetId}`;
        if (a === focalId) neighbourIds.add(b);
        if (b === focalId) neighbourIds.add(a);
      }
    }

    const taggedNodes = newNodes.map((n) => {
      if (!focalId) return { ...n, className: '' };
      if (n.id === focalId) return { ...n, className: 'focal-target' };
      if (neighbourIds.has(n.id)) return { ...n, className: 'focal-neighbour' };
      return { ...n, className: 'focal-faded' };
    });

    setNodes(taggedNodes);
  }, [characters, scenes, worlds, showCharacters, showScenes, showWorlds, shiftConnectSource, shiftHeld, setNodes, selectedEntity, relationships, connections]);

  // Build edges from relationships and connections
  useEffect(() => {
    const newEdges: Edge[] = [];

    // Character-to-character relationships
    if (showCharacters) {
      relationships.forEach((rel) => {
        newEdges.push({
          id: `relationship:${rel.id}`,
          source: `character:${rel.sourceCharacterId}`,
          target: `character:${rel.targetCharacterId}`,
          type: 'relationship',
          data: {
            relationship: rel,
            onClick: handleRelationshipClick,
          },
        });
      });
    }

    // Cross-type connections
    connections.forEach((conn) => {
      const sourceType = conn.sourceType.toLowerCase();
      const targetType = conn.targetType.toLowerCase();

      const sourceVisible =
        (sourceType === 'character' && showCharacters) ||
        (sourceType === 'scene' && showScenes) ||
        (sourceType === 'world' && showWorlds);

      const targetVisible =
        (targetType === 'character' && showCharacters) ||
        (targetType === 'scene' && showScenes) ||
        (targetType === 'world' && showWorlds);

      if (sourceVisible && targetVisible) {
        newEdges.push({
          id: `connection:${conn.id}`,
          source: `${sourceType}:${conn.sourceId}`,
          target: `${targetType}:${conn.targetId}`,
          type: 'connection',
          data: {
            connection: conn,
            onClick: handleConnectionClick,
          },
        });
      }
    });

    setEdges(newEdges);
  }, [relationships, connections, showCharacters, showScenes, showWorlds, setEdges, handleRelationshipClick, handleConnectionClick]);

  // Handle new connection from React Flow
  const onConnect = useCallback((params: Connection) => {
    if (!params.source || !params.target) return;

    const [sourceType] = params.source.split(':');
    const [targetType] = params.target.split(':');

    // Both characters = relationship
    if (sourceType === 'character' && targetType === 'character') {
      setPendingConnection({ source: params.source, target: params.target });
      setShowRelationshipModal(true);
    } else {
      // Cross-type = connection
      setPendingConnection({ source: params.source, target: params.target });
      setShowConnectionModal(true);
    }
  }, []);

  // Handle node drag end to save position
  const onNodeDragStop = useCallback(async (_event: React.MouseEvent, node: Node) => {
    const [type, id] = node.id.split(':');
    const { x, y } = node.position;

    try {
      if (type === 'character') {
        await updatePosition(id, x, y);
      } else if (type === 'scene') {
        await updateScenePosition(id, x, y);
      } else if (type === 'world') {
        await updateWorldPosition(id, x, y);
      }
    } catch (error) {
      console.error('Failed to save position:', error);
    }
  }, []);

  // Handle shift+click to connect nodes
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // If shift is held, start/complete a connection
    if (event.shiftKey) {
      event.stopPropagation();

      if (!shiftConnectSource) {
        // First click - set source
        setShiftConnectSource(node.id);
        // Clear any selection
        setSelectedEntity(null);
        setSelectedRelationship(null);
        setSelectedConnection(null);
      } else if (shiftConnectSource !== node.id) {
        // Second click on different node - create connection
        const [sourceType] = shiftConnectSource.split(':');
        const [targetType] = node.id.split(':');

        setPendingConnection({ source: shiftConnectSource, target: node.id });

        // Both characters = relationship, otherwise = connection
        if (sourceType === 'character' && targetType === 'character') {
          setShowRelationshipModal(true);
        } else {
          setShowConnectionModal(true);
        }

        setShiftConnectSource(null);
      }
    } else {
      // Regular click - clear shift connect mode
      setShiftConnectSource(null);
    }
  }, [shiftConnectSource]);

  // Handle creating relationship
  const handleCreateRelationship = async (data: CreateRelationshipInput) => {
    await createRelationship(data);
    await loadData();
    setShowRelationshipModal(false);
    setPendingConnection(null);
  };

  // Handle creating connection
  const handleCreateConnection = async (connectionType: string, lore: string) => {
    if (!pendingConnection) return;

    const [sourceType, sourceId] = pendingConnection.source.split(':');
    const [targetType, targetId] = pendingConnection.target.split(':');

    await createConnection({
      sourceType: sourceType.toUpperCase() as 'CHARACTER' | 'SCENE' | 'WORLD',
      sourceId,
      targetType: targetType.toUpperCase() as 'CHARACTER' | 'SCENE' | 'WORLD',
      targetId,
      connectionType,
      lore,
    });

    await loadData();
    setShowConnectionModal(false);
    setPendingConnection(null);
  };

  // Handle creating scene
  const handleCreateScene = async (data: CreateSceneInput) => {
    await createScene(data);
    await loadData();
  };

  // Handle creating world
  const handleCreateWorld = async (data: CreateWorldInput) => {
    await createWorld(data);
    await loadData();
  };

  // Handle updating scene
  const handleUpdateScene = async (id: string, data: UpdateSceneInput) => {
    await updateScene(id, data);
    await loadData();
    setSelectedEntity(null);
  };

  // Handle updating world
  const handleUpdateWorld = async (id: string, data: UpdateWorldInput) => {
    await updateWorld(id, data);
    await loadData();
    setSelectedEntity(null);
  };

  // Handle deleting scene
  const handleDeleteScene = async (id: string) => {
    await deleteScene(id);
    await loadData();
    setSelectedEntity(null);
  };

  // Handle deleting world
  const handleDeleteWorld = async (id: string) => {
    await deleteWorld(id);
    await loadData();
    setSelectedEntity(null);
  };

  // Handle deleting relationship
  const handleDeleteRelationship = async (id: string) => {
    await deleteRelationship(id);
    await loadData();
    setSelectedRelationship(null);
  };

  // Handle deleting connection
  const _handleDeleteConnection = async (id: string) => {
    await deleteConnection(id);
    await loadData();
    setSelectedConnection(null);
  };

  // Handle saving snapshot
  const handleSaveSnapshot = async () => {
    if (!snapshotName.trim()) return;
    setSavingSnapshot(true);
    try {
      await createSnapshot({ name: snapshotName.trim() });
      setSnapshotName('');
      const snaps = await getSnapshots();
      setSnapshots(snaps);
    } catch (error) {
      console.error('Failed to save snapshot:', error);
    } finally {
      setSavingSnapshot(false);
    }
  };

  // Handle restoring snapshot
  const handleRestoreSnapshot = async (id: string) => {
    if (!confirm('Restore this snapshot? This will replace current positions, relationships, and connections.')) return;
    setRestoringSnapshot(id);
    try {
      await restoreSnapshot(id);
      await loadData();
    } catch (error) {
      console.error('Failed to restore snapshot:', error);
    } finally {
      setRestoringSnapshot(null);
    }
  };

  // Handle deleting snapshot
  const handleDeleteSnapshot = async (id: string) => {
    if (!confirm('Delete this snapshot?')) return;
    try {
      await deleteSnapshot(id);
      const snaps = await getSnapshots();
      setSnapshots(snaps);
    } catch (error) {
      console.error('Failed to delete snapshot:', error);
    }
  };

  // Handle bulk oripheon sync
  const handleSyncAllOripheon = async () => {
    setSyncingAll(true);
    setSyncResult(null);
    try {
      const result = await syncAllOripheonData();
      const generated = result.results.filter(r => r.status === 'generated').length;
      const enriched = result.results.filter(r => r.status === 'enriched').length;
      const skipped = result.results.filter(r => r.status === 'already_complete').length;
      setSyncResult(`${generated} generated, ${enriched} enriched, ${skipped} skipped`);
      await loadData();
    } catch (error) {
      console.error('Failed to sync oripheon data:', error);
      setSyncResult('Sync failed');
    } finally {
      setSyncingAll(false);
    }
  };

  // Get selected entity data
  const getSelectedCharacter = () => {
    if (selectedEntity?.type === 'character') {
      return characters.find(c => c.id === selectedEntity.id);
    }
    return null;
  };

  const getSelectedScene = () => {
    if (selectedEntity?.type === 'scene') {
      return scenes.find(s => s.id === selectedEntity.id);
    }
    return null;
  };

  const getSelectedWorld = () => {
    if (selectedEntity?.type === 'world') {
      return worlds.find(w => w.id === selectedEntity.id);
    }
    return null;
  };

  const selectedCharacter = getSelectedCharacter();
  const selectedScene = getSelectedScene();
  const selectedWorld = getSelectedWorld();

  // Determine if anything is selected for the right panel
  const hasSelection = selectedCharacter || selectedScene || selectedWorld || selectedRelationship || selectedConnection || selectedStoryTemplate;

  if (loading) {
    return (
      <div className="world-page">
        <div className="loading-message">Loading world...</div>
      </div>
    );
  }

  return (
    <div className="world-page">
      {/* Left Sidebar */}
      <div className="world-sidebar">
        <h1 className="sidebar-title">Nexus</h1>

        {/* Visibility Toggles */}
        <div className="sidebar-section">
          <h3 className="section-title">Show</h3>
          <div className="toggle-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showCharacters}
                onChange={(e) => setShowCharacters(e.target.checked)}
              />
              <span>Characters ({characters.length})</span>
            </label>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showScenes}
                onChange={(e) => setShowScenes(e.target.checked)}
              />
              <span>Scenes ({scenes.length})</span>
            </label>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showWorlds}
                onChange={(e) => setShowWorlds(e.target.checked)}
              />
              <span>Globes ({worlds.length})</span>
            </label>
          </div>
        </div>

        {/* Grid Settings */}
        <div className="sidebar-section">
          <h3 className="section-title">Grid</h3>
          <div className="toggle-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
              />
              <span>Show Grid</span>
            </label>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={snapToGrid}
                onChange={(e) => setSnapToGrid(e.target.checked)}
              />
              <span>Snap to Grid</span>
            </label>
          </div>
        </div>

        {/* Add Buttons */}
        <div className="sidebar-section">
          <h3 className="section-title">Add</h3>
          <div className="add-buttons">
            <button className="btn btn-sm btn-scene" onClick={() => setShowCharacterModal(true)}>
              + Character
            </button>
            <button className="btn btn-sm btn-scene" onClick={() => setShowSceneModal(true)}>
              + Scene
            </button>
            <button className="btn btn-sm btn-world" onClick={() => setShowWorldModal(true)}>
              + Cube
            </button>
          </div>
        </div>

        {/* Oripheon Sync */}
        <div className="sidebar-section">
          <h3 className="section-title">Oripheon</h3>
          <button
            className="btn btn-sm btn-secondary"
            style={{ width: '100%' }}
            onClick={handleSyncAllOripheon}
            disabled={syncingAll}
          >
            {syncingAll ? 'Syncing...' : 'Sync All Characters'}
          </button>
          {syncResult && (
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {syncResult}
            </div>
          )}
        </div>

        {/* Snapshots Section */}
        <div className="sidebar-section">
          <h3
            className="section-title section-title-clickable"
            onClick={() => setShowSnapshots(!showSnapshots)}
          >
            Snapshots {showSnapshots ? '▼' : '▶'} <span className="snapshot-count">({snapshots.length})</span>
          </h3>
          {showSnapshots && (
            <div className="snapshots-panel">
              <div className="snapshot-create">
                <input
                  type="text"
                  className="snapshot-input"
                  placeholder="Snapshot name..."
                  value={snapshotName}
                  onChange={(e) => setSnapshotName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveSnapshot()}
                />
                <button
                  className="btn btn-sm btn-save-snapshot"
                  onClick={handleSaveSnapshot}
                  disabled={!snapshotName.trim() || savingSnapshot}
                >
                  {savingSnapshot ? '...' : 'Save'}
                </button>
              </div>
              {snapshots.length > 0 ? (
                <ul className="snapshot-list">
                  {snapshots.map((snap) => (
                    <li key={snap.id} className="snapshot-item">
                      <div className="snapshot-info">
                        <span className="snapshot-name">{snap.name}</span>
                        <span className="snapshot-date">
                          {new Date(snap.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="snapshot-actions">
                        <button
                          className="btn-icon btn-restore"
                          onClick={() => handleRestoreSnapshot(snap.id)}
                          disabled={restoringSnapshot === snap.id}
                          title="Restore"
                        >
                          {restoringSnapshot === snap.id ? '...' : '↺'}
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDeleteSnapshot(snap.id)}
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="snapshot-empty">No snapshots yet</p>
              )}
            </div>
          )}
        </div>

        {/* Story Templates Section */}
        <div className="sidebar-section">
          <h3
            className="section-title section-title-clickable"
            onClick={() => setShowStoryTemplates(!showStoryTemplates)}
          >
            Story Templates {showStoryTemplates ? '▼' : '▶'} <span className="snapshot-count">({storyTemplates.length})</span>
          </h3>
          {showStoryTemplates && (
            <div className="story-templates-panel">
              <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginBottom: '0.6rem', fontFamily: '"Canela", serif', fontStyle: 'italic', lineHeight: 1.55 }}>
                Pin a trajectory to {cubeName || 'this cube'}. The arc shapes how characters and scenes move.
              </p>
              <ul className="entity-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {storyTemplates.map((template) => {
                  const isPinned = cube?.trajectoryId === template.id;
                  const isSelected = selectedStoryTemplate?.id === template.id;
                  return (
                    <li
                      key={template.id}
                      className={`entity-item ${isSelected ? 'selected' : ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        padding: '0.4rem 0.55rem',
                        borderLeft: isPinned ? '2px solid #66023C' : '2px solid transparent',
                        background: isSelected ? 'rgba(102,2,60,0.06)' : 'transparent',
                      }}
                      onClick={() => {
                        setSelectedEntity(null);
                        setSelectedRelationship(null);
                        setSelectedConnection(null);
                        setSelectedStoryTemplate(template);
                      }}
                    >
                      <span style={{ flex: 1, fontSize: '0.82rem' }}>{template.name}</span>
                      {isPinned && (
                        <span
                          style={{
                            fontSize: '0.5rem',
                            fontFamily: 'monospace',
                            letterSpacing: '0.22em',
                            color: '#66023C',
                            textTransform: 'lowercase',
                          }}
                        >
                          pinned
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Entity Lists */}
        {showCharacters && characters.length > 0 && (
          <div className="sidebar-section">
            <h3 className="section-title">Characters</h3>
            <ul className="entity-list">
              {characters.map((char) => (
                <li
                  key={char.id}
                  className={`entity-item entity-character ${selectedEntity?.id === char.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedRelationship(null);
                    setSelectedConnection(null);
                    setSelectedStoryTemplate(null);
                    setSelectedEntity({ type: 'character', id: char.id });
                  }}
                >
                  {char.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {showScenes && scenes.length > 0 && (
          <div className="sidebar-section">
            <h3 className="section-title">Scenes</h3>
            <ul className="entity-list">
              {scenes.map((scene) => (
                <li
                  key={scene.id}
                  className={`entity-item entity-scene ${selectedEntity?.id === scene.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedRelationship(null);
                    setSelectedConnection(null);
                    setSelectedStoryTemplate(null);
                    setSelectedEntity({ type: 'scene', id: scene.id });
                  }}
                >
                  {scene.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {showWorlds && worlds.length > 0 && (
          <div className="sidebar-section">
            <h3 className="section-title">Globes</h3>
            <ul className="entity-list">
              {worlds.map((world) => (
                <li
                  key={world.id}
                  className={`entity-item entity-world ${selectedEntity?.id === world.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedRelationship(null);
                    setSelectedConnection(null);
                    setSelectedStoryTemplate(null);
                    setSelectedEntity({ type: 'world', id: world.id });
                  }}
                >
                  {world.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Main Canvas */}
      <div className="world-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={shiftHeld ? ConnectionMode.Loose : ConnectionMode.Strict}
          snapToGrid={snapToGrid}
          snapGrid={[20, 20]}
          fitView
          minZoom={0.1}
          maxZoom={2}
        >
          <Controls />
          {showGrid && (
            <Background
              variant={BackgroundVariant.Dots}
              gap={48}
              size={0.7}
              color="rgba(255,255,255,0.06)"
            />
          )}
        </ReactFlow>
      </div>

      {/* Right Panel — collapsible to give the graph more room */}
      <div
        className={`right-panel-container ${rightPanelOpen ? '' : 'collapsed'}`}
        style={{ position: 'relative' }}
      >
        <button
          type="button"
          onClick={() => setRightPanelOpen((v) => !v)}
          aria-label={rightPanelOpen ? 'Collapse panel' : 'Expand panel'}
          title={rightPanelOpen ? 'Collapse panel' : 'Expand panel'}
          style={{
            position: 'absolute',
            top: '0.6rem',
            left: rightPanelOpen ? '0.5rem' : '50%',
            transform: rightPanelOpen ? 'none' : 'translateX(-50%)',
            zIndex: 10,
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000',
            border: '1px solid #1A1A1A',
            color: 'rgba(255,255,255,0.55)',
            fontSize: '0.75rem',
            cursor: 'pointer',
          }}
        >
          {rightPanelOpen ? '›' : '‹'}
        </button>
        {rightPanelOpen && (<>
        {selectedCharacter && (
          <>
            <CharacterDetailPanel
              character={selectedCharacter}
              onClose={() => setSelectedEntity(null)}
              onRefresh={loadData}
            />
            <SuggestedRelationshipsPanel
              selectedCharacter={selectedCharacter}
              allCharacters={characters}
              onCreateRelationship={handleCreateRelationship}
            />
          </>
        )}
        {selectedScene && (
          <SceneDetailPanel
            scene={selectedScene}
            onClose={() => setSelectedEntity(null)}
            onUpdate={handleUpdateScene}
            onDelete={handleDeleteScene}
          />
        )}
        {selectedWorld && (
          <WorldDetailPanel
            world={selectedWorld}
            onClose={() => setSelectedEntity(null)}
            onUpdate={handleUpdateWorld}
            onDelete={handleDeleteWorld}
          />
        )}
        {selectedRelationship && (
          <RelationshipDetailPanel
            relationship={selectedRelationship.relationship}
            sourceCharacter={selectedRelationship.sourceCharacter}
            targetCharacter={selectedRelationship.targetCharacter}
            onClose={() => setSelectedRelationship(null)}
            onDelete={handleDeleteRelationship}
          />
        )}
        {selectedStoryTemplate && !selectedCharacter && !selectedScene && !selectedWorld && !selectedRelationship && (
          <div className="detail-panel" style={{ padding: '1rem', overflow: 'auto' }}>
            <StoryTemplateDetail
              template={selectedStoryTemplate}
              onClose={() => setSelectedStoryTemplate(null)}
              onTemplateClick={(templateId) => {
                const template = storyTemplates.find(t => t.id === templateId);
                if (template) setSelectedStoryTemplate(template);
              }}
              cubeContext={
                cube
                  ? {
                      id: cube.id,
                      name: cube.name,
                      trajectoryId: cube.trajectoryId,
                      trajectoryVariant: cube.trajectoryVariant,
                      onChanged: (next) => setCube(next),
                    }
                  : undefined
              }
            />
          </div>
        )}
        {!hasSelection && (
          <div className="default-panel">
            <button
              type="button"
              onClick={() => setOverviewOpen((v) => !v)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
              }}
            >
              <h2 className="panel-title" style={{ margin: 0 }}>Overview</h2>
              <span
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--muted-foreground)',
                  transform: overviewOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s',
                }}
              >
                ▾
              </span>
            </button>
            {overviewOpen && (
              <>
                <div className="default-panel-content">
                  <div className="stat-item">
                    <span className="stat-label">Characters</span>
                    <span className="stat-value">{characters.length}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Scenes</span>
                    <span className="stat-value">{scenes.length}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Cubes</span>
                    <span className="stat-value">{worlds.length}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Relationships</span>
                    <span className="stat-value">{relationships.length}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Connections</span>
                    <span className="stat-value">{connections.length}</span>
                  </div>
                </div>
                <p className="panel-hint">
                  Select a node or edge to view details. Drag between nodes to create connections.
                </p>
              </>
            )}
          </div>
        )}
        </>)}
      </div>

      {/* Modals */}
      <NewRelationshipModal
        isOpen={showRelationshipModal}
        onClose={() => {
          setShowRelationshipModal(false);
          setPendingConnection(null);
        }}
        onCreate={handleCreateRelationship}
        sourceCharacter={
          pendingConnection
            ? characters.find(c => c.id === pendingConnection.source.split(':')[1])
            : undefined
        }
        targetCharacter={
          pendingConnection
            ? characters.find(c => c.id === pendingConnection.target.split(':')[1])
            : undefined
        }
      />

      <NewConnectionModal
        isOpen={showConnectionModal}
        onClose={() => {
          setShowConnectionModal(false);
          setPendingConnection(null);
        }}
        onCreate={handleCreateConnection}
        sourceType={pendingConnection?.source.split(':')[0] as EntityType}
        targetType={pendingConnection?.target.split(':')[0] as EntityType}
      />

      <NewSceneModal
        isOpen={showSceneModal}
        onClose={() => setShowSceneModal(false)}
        onCreate={handleCreateScene}
      />

      <NewWorldModal
        isOpen={showWorldModal}
        onClose={() => setShowWorldModal(false)}
        onCreate={handleCreateWorld}
      />

      <AddCharacterToCube
        isOpen={showCharacterModal}
        onClose={() => setShowCharacterModal(false)}
        cubeId={cubeId}
        cubeName={cubeName || 'this Cube'}
        onChanged={() => loadData()}
      />
    </div>
  );
}
