'use client';

import { memo } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';
import type { WorldConnection } from '@/lib/api';

export interface ConnectionEdgeData {
  connection: WorldConnection;
  onClick: (connection: WorldConnection) => void;
}

// Connection type colors. Tight palette: tyrian purple variants per
// connection axis. Saturated motley palette has been retired.
const getConnectionColor = (connectionType: string): string => {
  // Character-Scene connections (presence)
  if (['appears_in', 'owns', 'haunts', 'born_at', 'died_at'].includes(connectionType)) {
    return '#66023C';
  }
  // Scene-World connections (location)
  if (['located_in', 'gateway_to', 'hidden_within'].includes(connectionType)) {
    return '#9B4772';
  }
  // Character-World connections (authority)
  if (['rules', 'exiled_from', 'created', 'protects'].includes(connectionType)) {
    return '#5A0532';
  }
  return '#6B7280';
};

function ConnectionEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<ConnectionEdgeData>) {
  const connection = data?.connection;
  const onClick = data?.onClick;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const color = connection ? getConnectionColor(connection.connectionType) : '#6b7280';
  const label = connection?.connectionType.replace(/_/g, ' ') || '';

  return (
    <>
      <path
        id={id}
        className="connection-edge-path"
        d={edgePath}
        stroke={color}
        strokeWidth={2}
        strokeDasharray="5,5"
        fill="none"
        markerEnd={markerEnd}
        style={{ cursor: 'pointer' }}
        onClick={() => connection && onClick?.(connection)}
      />
      <EdgeLabelRenderer>
        <div
          className="connection-edge-label"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            background: color,
            pointerEvents: 'all',
          }}
          onClick={() => connection && onClick?.(connection)}
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const ConnectionEdge = memo(ConnectionEdgeComponent);
