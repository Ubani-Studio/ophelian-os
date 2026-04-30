'use client';

import { memo } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';
import type { CharacterRelationship, RelationshipType } from '@/lib/api';

export interface RelationshipEdgeData {
  relationship: CharacterRelationship;
  onClick: (relationship: CharacterRelationship) => void;
}

// Tight three-tone palette. Tyrian purple variants for warm bonds,
// muted red for cold bonds, neutral for everything else.
const RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
  ALLY:   '#66023C',
  FRIEND: '#7C2952',
  FAMILY: '#9B4772',
  LOVER:  '#5A0532',
  ENEMY: '#8B2635',
  RIVAL: '#A3434F',
  MENTOR: '#A3A3A3',
  CUSTOM: '#6B7280',
};

// Text colour per background. Light/neutral bg → black text;
// saturated dark bg → white text. Computed once per type so the
// label is always readable.
const RELATIONSHIP_TEXT: Record<RelationshipType, string> = {
  ALLY:   '#fff',
  FRIEND: '#fff',
  FAMILY: '#fff',
  LOVER:  '#fff',
  ENEMY:  '#fff',
  RIVAL:  '#fff',
  MENTOR: '#000',
  CUSTOM: '#000',
};

function RelationshipEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<RelationshipEdgeData>) {
  const relationship = data?.relationship;
  const onClick = data?.onClick;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const color = relationship ? RELATIONSHIP_COLORS[relationship.relationshipType] : '#6b7280';
  const textColor = relationship ? RELATIONSHIP_TEXT[relationship.relationshipType] : '#fff';
  const label =
    relationship?.customTypeName || relationship?.relationshipType.toLowerCase().replace('_', ' ') || '';

  return (
    <>
      <path
        id={id}
        className="relationship-edge-path"
        d={edgePath}
        stroke={color}
        strokeWidth={2}
        fill="none"
        markerEnd={markerEnd}
        style={{ cursor: 'pointer' }}
        onClick={() => relationship && onClick?.(relationship)}
      />
      <EdgeLabelRenderer>
        <div
          className="relationship-edge-label"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            background: color,
            color: textColor,
            pointerEvents: 'all',
          }}
          onClick={() => relationship && onClick?.(relationship)}
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const RelationshipEdge = memo(RelationshipEdgeComponent);
