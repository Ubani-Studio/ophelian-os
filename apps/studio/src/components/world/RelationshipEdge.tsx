'use client';

import { memo } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';
import type { CharacterRelationship, RelationshipType } from '@/lib/api';

export interface RelationshipEdgeData {
  relationship: CharacterRelationship;
  onClick: (relationship: CharacterRelationship) => void;
}

// Tight three-tone palette. Tyrian purple variants for warm bonds,
// muted red for cold bonds, neutral for everything else. Beats the
// previous 8-saturated-Tailwind-colors look which read as motley.
const RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
  // Warm bonds — tyrian purple family
  ALLY:   '#66023C',
  FRIEND: '#7C2952',
  FAMILY: '#9B4772',
  LOVER:  '#5A0532',
  // Cold bonds — muted red
  ENEMY: '#8B2635',
  RIVAL: '#A3434F',
  // Neutral
  MENTOR: '#A3A3A3',
  CUSTOM: '#6B7280',
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
