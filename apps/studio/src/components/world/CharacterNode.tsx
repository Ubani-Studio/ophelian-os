'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import type { Character } from '@/lib/api';

export interface CharacterNodeData {
  character: Character;
  isConnectSource?: boolean;
  shiftHeld?: boolean;
  onClick: (character: Character) => void;
}

const FULLSURFACE_HANDLE_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  transform: 'none',
  borderRadius: 8,
  background: 'transparent',
  border: '2px dashed rgba(245, 158, 11, 0.6)',
  opacity: 1,
  zIndex: 10,
  cursor: 'crosshair',
  pointerEvents: 'all',
};

function CharacterNodeComponent({ data }: NodeProps<CharacterNodeData>) {
  const { character, isConnectSource, shiftHeld, onClick } = data;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Normal small handles for non-shift connections */}
      {!shiftHeld && (
        <>
          <Handle type="target" position={Position.Top} className="character-node-handle" />
          <Handle type="source" position={Position.Bottom} className="character-node-handle" />
        </>
      )}

      <div
        className={`character-node ${isConnectSource ? 'character-node-connecting' : ''} ${shiftHeld ? 'character-node-shift' : ''}`}
        onClick={() => onClick(character)}
      >
        <div className="character-node-avatar">
          {character.avatarUrl ? (
            <img
              src={character.avatarUrl}
              alt={character.name}
              style={{ objectPosition: character.avatarPosition || '50% 50%' }}
            />
          ) : character.tizitaRepresentativeUrl ? (
            <img
              src={character.tizitaRepresentativeUrl}
              alt={character.name}
              style={{ objectPosition: '50% 50%' }}
            />
          ) : (
            <span className="character-node-initials">{getInitials(character.name)}</span>
          )}
        </div>
        <div className="character-node-name">{character.name}</div>
      </div>

      {/* Full-surface handles when shift held — source to drag from, target to drop onto */}
      {shiftHeld && (
        <>
          <Handle
            type="source"
            position={Position.Top}
            id="shift-source"
            style={FULLSURFACE_HANDLE_STYLE}
          />
          <Handle
            type="target"
            position={Position.Bottom}
            id="shift-target"
            style={FULLSURFACE_HANDLE_STYLE}
          />
        </>
      )}
    </>
  );
}

export const CharacterNode = memo(CharacterNodeComponent);
