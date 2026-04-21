// =============================================================================
// MINDI Phase 1 — GraphCanvas
// @xyflow/react force-directed knowledge graph.
// Color-coded regions, confidence rings, drag-to-connect, pinch-to-drill.
// =============================================================================
'use client';

import { useMemo, useCallback, useRef } from 'react';
import ReactFlow, {
  Background, Controls, MiniMap,
  useNodesState, useEdgesState, addEdge,
  type Connection, type Edge, type Node,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { REGIONS } from '../../../../../shared/constants/regions';
import { useDragToConnect, usePinchToDrill } from '../lib/gestures';
import NodeCard from './NodeCard';
import type { BrainNode } from '../../../../../shared/types/node';

const nodeTypes = { brainNode: NodeCard };

interface GraphCanvasProps {
  nodes: BrainNode[];
  onConnect: (sourceId: string, targetId: string) => void;
  onNodeDrill: (node: BrainNode) => void;
}

export default function GraphCanvas({ nodes, onConnect, onNodeDrill }: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const rfNodes: Node[] = useMemo(() =>
    nodes.map((n, i) => ({
      id: n.id,
      type: 'brainNode',
      position: {
        x: 350 + Math.cos((i / nodes.length) * 2 * Math.PI) * 260,
        y: 300 + Math.sin((i / nodes.length) * 2 * Math.PI) * 220,
      },
      data: { node: n, onDrill: onNodeDrill },
    })), [nodes, onNodeDrill]);

  const rfEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    nodes.forEach(n => {
      n.relatedNodeIds?.forEach(tid => {
        edges.push({
          id: `${n.id}-${tid}`,
          source: n.id,
          target: tid,
          style: { stroke: REGIONS[n.region]?.color ?? '#6366f1', strokeWidth: 1.5, opacity: 0.5 },
          animated: false,
        });
      });
    });
    return edges;
  }, [nodes]);

  const [rfNodesState, , onNodesChange] = useNodesState(rfNodes);
  const [rfEdgesState, , onEdgesChange] = useEdgesState(rfEdges);

  const { startDrag, endDrag } = useDragToConnect(onConnect);

  const onConnectHandler = useCallback((conn: Connection) => {
    if (conn.source && conn.target) onConnect(conn.source, conn.target);
  }, [onConnect]);

  // Pinch-to-drill: pinch into a node to open its detail panel
  usePinchToDrill(containerRef, (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) onNodeDrill(node);
  });

  return (
    <div ref={containerRef} className="w-full h-full" role="region" aria-label="Brain Knowledge Graph">
      <ReactFlow
        nodes={rfNodesState}
        edges={rfEdgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnectHandler}
        nodeTypes={nodeTypes}
        fitView fitViewOptions={{ padding: 0.25 }}
        minZoom={0.2} maxZoom={3}
        nodesFocusable edgesFocusable
        onlyRenderVisibleElements
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.05)" />
        <Controls showInteractive={false} className="!bg-white/5 !border-white/10 !rounded-lg" />
        <MiniMap
          nodeColor={n => REGIONS[(n.data as { node: BrainNode })?.node?.region]?.color ?? '#6366f1'}
          className="!bg-white/5 !border-white/10 !rounded-lg"
          maskColor="rgba(0,0,0,0.6)"
        />
      </ReactFlow>
    </div>
  );
}
