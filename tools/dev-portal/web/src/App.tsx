import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  type OnNodeDrag,
  type NodeMouseHandler,
} from '@xyflow/react';
import { ServiceNode } from './nodes/ServiceNode';
import { GroupNode } from './nodes/GroupNode';
import { DetailPanel } from './DetailPanel';
import { usePersistedPositions } from './usePersistedPositions';
import { getStatus, runAction } from './api';
import type { StatusPayload, ServiceNodeData, GroupNodeData } from './types';

const REFRESH_MS = 5000;
const nodeTypes: NodeTypes = { service: ServiceNode as unknown as NodeTypes[string], group: GroupNode as unknown as NodeTypes[string] };

type Toast = { text: string; ok: boolean } | null;
type Pending = Record<string, boolean>; // key `${id}:${env}`

function edgeStyle(up: boolean, soft: boolean) {
  return {
    stroke: up ? '#46c07f' : '#33414f',
    strokeWidth: up ? 2 : 1.4,
    strokeDasharray: soft ? '5 4' : up ? undefined : '4 4',
    opacity: up ? 0.95 : 0.5,
  };
}

function buildEdges(payload: StatusPayload): Edge[] {
  const runMap = Object.fromEntries(payload.services.map((s) => [s.id, s.status?.running]));
  const edges: Edge[] = [];
  for (const s of payload.services) {
    for (const dep of s.dependsOn || []) {
      const up = Boolean(runMap[s.id] && runMap[dep]);
      edges.push({ id: `${s.id}->${dep}`, source: s.id, target: dep, animated: up, style: edgeStyle(up, false) });
    }
  }
  for (const e of payload.softEdges || []) {
    const up = Boolean(runMap[e.source] && runMap[e.target]);
    edges.push({
      id: `soft:${e.source}->${e.target}`,
      source: e.source,
      target: e.target,
      label: e.label,
      labelStyle: { fill: '#7b8a99', fontSize: 9 },
      labelBgStyle: { fill: '#0d141b' },
      style: edgeStyle(up, true),
    });
  }
  return edges;
}

function Flow() {
  const [payload, setPayload] = useState<StatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [pending, setPending] = useState<Pending>({});
  const [toast, setToast] = useState<Toast>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { positions, savePosition, reset, hasOverrides } = usePersistedPositions();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ServiceNodeData | GroupNodeData>>([]);
  const [edges, setEdges] = useEdgesState<Edge>([]);

  // Bump on reset so the rebuild snaps nodes back to registry positions.
  const [layoutVersion, setLayoutVersion] = useState(0);
  const appliedLayout = useRef(-1);

  const load = useCallback(async () => {
    try {
      const json = await getStatus();
      setPayload(json);
      setUpdatedAt(new Date());
      setError(null);
    } catch (err) {
      setError(String((err as Error).message || err));
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const onAction = useCallback(
    async (id: string, env: string, verb: 'start' | 'stop') => {
      const key = `${id}:${env}`;
      setPending((p) => ({ ...p, [key]: true }));
      setToast({ text: `${verb === 'start' ? 'Starting' : 'Stopping'} ${id} · ${env}…`, ok: true });
      const result = await runAction(id, env, verb);
      setToast({ text: `${id} · ${env}: ${result.message}`, ok: result.ok });
      setPending((p) => {
        const n = { ...p };
        delete n[key];
        return n;
      });
      load(); // refresh immediately so the state transition shows without waiting for the poll
    },
    [load],
  );

  // Rebuild nodes/edges whenever status, pending, or the layout version changes.
  useEffect(() => {
    if (!payload) return;
    const colorOf = Object.fromEntries(payload.groups.map((g) => [g.id, g.color]));

    const tally: Record<string, { up: number; total: number }> = {};
    for (const s of payload.services) {
      const t = (tally[s.group] ||= { up: 0, total: 0 });
      t.total += 1;
      if (s.status?.running) t.up += 1;
    }

    const groupNodes: Node<GroupNodeData>[] = payload.groups.map((g) => ({
      id: `group:${g.id}`,
      type: 'group',
      position: { x: g.frame.x, y: g.frame.y },
      style: { width: g.frame.width, height: g.frame.height },
      draggable: false,
      selectable: false,
      data: { label: g.label, color: g.color, up: tally[g.id]?.up ?? 0, total: tally[g.id]?.total ?? 0 },
    }));

    const forceLayout = appliedLayout.current !== layoutVersion;

    setNodes((prev) => {
      const prevPos = new Map(prev.map((n) => [n.id, n.position]));
      const serviceNodes: Node<ServiceNodeData>[] = payload.services.map((s) => {
        const position = forceLayout
          ? positions[s.id] ?? s.pos
          : prevPos.get(s.id) ?? positions[s.id] ?? s.pos;
        return {
          id: s.id,
          type: 'service',
          parentId: `group:${s.group}`,
          extent: 'parent',
          draggable: true,
          position,
          data: {
            id: s.id,
            label: s.label,
            stack: s.stack,
            envs: s.envs,
            status: s.status,
            groupColor: colorOf[s.group],
            selected: selectedId === s.id,
          },
        };
      });
      return [...groupNodes, ...serviceNodes];
    });
    appliedLayout.current = layoutVersion;
    setEdges(buildEdges(payload));
  }, [payload, layoutVersion, positions, selectedId, setNodes, setEdges]);

  const onNodeDragStop: OnNodeDrag<Node<ServiceNodeData | GroupNodeData>> = useCallback(
    (_evt, node) => {
      if (node.type === 'service') savePosition(node.id, node.position);
    },
    [savePosition],
  );

  // Clicking a service selects it and opens the detail card; clicking empty
  // canvas deselects and closes it.
  const onNodeClick: NodeMouseHandler<Node<ServiceNodeData | GroupNodeData>> = useCallback((_evt, node) => {
    if (node.type === 'service') setSelectedId(node.id);
  }, []);
  const onPaneClick = useCallback(() => setSelectedId(null), []);
  const closePanel = useCallback(() => setSelectedId(null), []);

  const onReset = useCallback(() => {
    reset();
    setLayoutVersion((v) => v + 1);
    setToast({ text: 'Layout reset to defaults', ok: true });
  }, [reset]);

  // Auto-dismiss toasts.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const counts = useMemo(() => {
    if (!payload) return { up: 0, total: 0 };
    return { up: payload.services.filter((s) => s.status?.running).length, total: payload.services.length };
  }, [payload]);

  // Re-read the selected service from the latest payload so the card live-updates
  // (status/env transitions) while it's open. Clears itself if the id disappears.
  const selected = useMemo(() => {
    if (!payload || !selectedId) return null;
    const service = payload.services.find((s) => s.id === selectedId);
    if (!service) return null;
    return { service, group: payload.groups.find((g) => g.id === service.group) };
  }, [payload, selectedId]);

  return (
    <div className="app">
      <header className="bar">
        <div className="brand">
          <b>🚦 BusMate — Live Topology</b>
          <span>tools/dev-portal</span>
        </div>
        <div className="legend">
          {payload?.groups.map((g) => (
            <span className="lg" key={g.id}>
              <span className="dot" style={{ background: g.color }} />
              {g.label}
            </span>
          ))}
        </div>
        <div className="spacer" />
        <button className="reset-btn" onClick={onReset} disabled={!hasOverrides} title="Move every component back to its default position">
          ⤺ Reset layout
        </button>
        <div className="stat">
          <span className="swatch" style={{ background: 'var(--up)' }} />
          <b>{counts.up}</b>/{counts.total} running
        </div>
        <div className="stat">
          <span className="swatch" style={{ background: payload?.dockerAvailable ? 'var(--docker)' : 'var(--down)' }} />
          docker {payload ? (payload.dockerAvailable ? 'connected' : 'unavailable') : '…'}
        </div>
        <div className="stat">updated {updatedAt ? updatedAt.toLocaleTimeString() : '…'}</div>
      </header>

      {error && <div className="banner">⚠ could not reach dev-portal API — {error}. Retrying every {REFRESH_MS / 1000}s…</div>}
      {payload && !payload.dockerAvailable && (
        <div className="banner">Docker daemon not reachable — showing port-probe results only, and Docker start/stop actions will fail.</div>
      )}

      <div className="flow-wrap">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          fitView
          minZoom={0.3}
          maxZoom={1.6}
          nodesConnectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#22303c" gap={22} size={1} />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            nodeColor={(n) => (n.type === 'group' ? 'transparent' : (n.data as ServiceNodeData)?.status?.running ? '#46c07f' : '#3a4653')}
            nodeStrokeColor={(n) => (n.type === 'group' ? '#33414f' : 'transparent')}
            maskColor="#0a1016cc"
            style={{ background: '#0d141b', border: '1px solid #253340' }}
          />
        </ReactFlow>
        {selected && (
          <DetailPanel
            service={selected.service}
            group={selected.group}
            pending={pending}
            onAction={onAction}
            onClose={closePanel}
          />
        )}
        <div className="rf-note">
          click a component for details &amp; run/stop · drag to rearrange · chip lit = running, blue = Docker
        </div>
        {toast && <div className={`toast ${toast.ok ? 'ok' : 'err'}`}>{toast.text}</div>}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
