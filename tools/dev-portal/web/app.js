// BusMate live-topology dashboard.
//
// No build step: React + ReactFlow are pulled from esm.sh (fine here — this file is
// served from localhost, not a locked-down sandbox), and htm gives us JSX-like markup
// without a compiler. The graph is redrawn from GET /api/status every REFRESH_MS.

import React, { useState, useEffect, useMemo, useCallback } from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';
import ReactFlow, {
  Background, Controls, MiniMap, Handle, Position, ReactFlowProvider,
} from 'https://esm.sh/reactflow@11.11.4?deps=react@18.3.1,react-dom@18.3.1';
import htm from 'https://esm.sh/htm@3.1.1';

const html = htm.bind(React.createElement);
const REFRESH_MS = 5000;

const ENV_COLORS = { dev: '#46c07f', prod: '#e06f6f', e2e: '#c8a24a', obs: '#5188ad', local: '#46c07f' };

// ── Custom node ───────────────────────────────────────────────────────────
function ServiceNode({ data }) {
  const { label, stack, envs, status, groupColor } = data;
  const running = status?.running;
  const dotColor = running ? 'var(--up)' : 'var(--down)';

  const chips = envs.map((env) => {
    const e = status?.envs?.[env];
    const on = e?.running;
    const cls = on ? (e.source === 'docker' ? 'chip on docker' : 'chip on') : 'chip off';
    const title = on ? `${env}: running via ${e.source}${e.detail ? ` (${e.detail})` : ''}` : `${env}: not running`;
    return html`<span class=${cls} title=${title} key=${env}>${env}</span>`;
  });

  return html`
    <div class=${`snode ${running ? 'up' : 'down'}`} style=${{ '--g': groupColor, '--dotc': dotColor }}>
      <${Handle} type="target" position=${Position.Top} style=${{ opacity: 0 }} />
      <div class="top">
        <span class="status-dot"></span>
        <span class="name">${label}</span>
      </div>
      <div class="stack">${stack}</div>
      <div class="envs">${chips}</div>
      <${Handle} type="source" position=${Position.Bottom} style=${{ opacity: 0 }} />
    </div>`;
}

// ── Group container node (labelled "swimlane" box) ─────────────────────────
function GroupNode({ data }) {
  return html`
    <div class="group-box" style=${{ '--gc': data.color }}>
      <div class="group-head">
        <span class="group-dot"></span>${data.label}
        <span class="group-count">${data.up}/${data.total} up</span>
      </div>
    </div>`;
}

const nodeTypes = { service: ServiceNode, group: GroupNode };

// ── Graph builders ────────────────────────────────────────────────────────
function buildNodes(payload) {
  const colorOf = Object.fromEntries(payload.groups.map((g) => [g.id, g.color]));

  // Per-group running tallies for the container header.
  const tally = {};
  for (const s of payload.services) {
    const t = (tally[s.group] ||= { up: 0, total: 0 });
    t.total += 1;
    if (s.status?.running) t.up += 1;
  }

  // Group containers first so their children render on top of them.
  const groupNodes = payload.groups.map((g) => ({
    id: `group:${g.id}`,
    type: 'group',
    position: { x: g.frame.x, y: g.frame.y },
    style: { width: g.frame.width, height: g.frame.height },
    draggable: false,
    selectable: false,
    data: { label: g.label, color: g.color, up: tally[g.id]?.up ?? 0, total: tally[g.id]?.total ?? 0 },
  }));

  const serviceNodes = payload.services.map((s) => ({
    id: s.id,
    type: 'service',
    parentId: `group:${s.group}`,
    extent: 'parent',
    position: s.pos,
    data: { label: s.label, stack: s.stack, envs: s.envs, status: s.status, groupColor: colorOf[s.group] },
  }));

  return [...groupNodes, ...serviceNodes];
}

function edgeStyle(up, soft) {
  return {
    stroke: up ? '#46c07f' : '#33414f',
    strokeWidth: up ? 2 : 1.4,
    strokeDasharray: soft ? '5 4' : up ? undefined : '4 4',
    opacity: up ? 0.95 : 0.5,
  };
}

function buildEdges(payload) {
  const runMap = Object.fromEntries(payload.services.map((s) => [s.id, s.status?.running]));
  const edges = [];

  for (const s of payload.services) {
    for (const dep of s.dependsOn || []) {
      const up = runMap[s.id] && runMap[dep];
      edges.push({
        id: `${s.id}->${dep}`, source: s.id, target: dep,
        animated: up, style: edgeStyle(up, false),
      });
    }
  }
  for (const e of payload.softEdges || []) {
    const up = runMap[e.source] && runMap[e.target];
    edges.push({
      id: `soft:${e.source}->${e.target}`, source: e.source, target: e.target,
      animated: false, label: e.label, labelStyle: { fill: '#7b8a99', fontSize: 9, fontFamily: 'var(--mono)' },
      labelBgStyle: { fill: '#0d141b' }, style: edgeStyle(up, true),
    });
  }
  return edges;
}

// ── App ───────────────────────────────────────────────────────────────────
function App() {
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/status', { cache: 'no-store' });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const json = await res.json();
      setPayload(json);
      setUpdatedAt(new Date());
      setError(null);
    } catch (err) {
      setError(String(err.message || err));
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const nodes = useMemo(() => (payload ? buildNodes(payload) : []), [payload]);
  const edges = useMemo(() => (payload ? buildEdges(payload) : []), [payload]);

  const counts = useMemo(() => {
    if (!payload) return { up: 0, total: 0 };
    const up = payload.services.filter((s) => s.status?.running).length;
    return { up, total: payload.services.length };
  }, [payload]);

  const legend = payload
    ? payload.groups.map((g) => html`
        <span class="lg" key=${g.id}><span class="dot" style=${{ background: g.color }}></span>${g.label}</span>`)
    : null;

  return html`
    <div class="app">
      <header class="bar">
        <div class="brand"><b>🚦 BusMate — Live Topology</b><span>tools/dev-portal</span></div>
        <div class="legend">${legend}</div>
        <div class="spacer"></div>
        <div class="stat"><span class="swatch" style=${{ background: 'var(--up)' }}></span>
          <b>${counts.up}</b>/${counts.total} running</div>
        <div class="stat">
          <span class="swatch" style=${{ background: payload?.dockerAvailable ? 'var(--docker)' : 'var(--down)' }}></span>
          docker ${payload ? (payload.dockerAvailable ? 'connected' : 'unavailable') : '…'}</div>
        <div class="stat">updated ${updatedAt ? updatedAt.toLocaleTimeString() : '…'}</div>
      </header>

      ${error && html`<div class="banner">⚠ could not reach dev-portal API — ${error}. Retrying every ${REFRESH_MS / 1000}s…</div>`}
      ${payload && !payload.dockerAvailable && html`<div class="banner">Docker daemon not reachable — showing port-probe results only. Environments will read as <b>local</b> for anything answering on its port.</div>`}

      <div class="flow-wrap">
        <${ReactFlowProvider}>
          <${ReactFlow}
            nodes=${nodes} edges=${edges} nodeTypes=${nodeTypes}
            fitView minZoom=${0.3} maxZoom=${1.6}
            proOptions=${{ hideAttribution: true }}
            nodesDraggable=${true} nodesConnectable=${false} elementsSelectable=${false}
          >
            <${Background} color="#22303c" gap=${22} size=${1} />
            <${Controls} showInteractive=${false} />
            <${MiniMap} pannable zoomable
              nodeColor=${(n) => (n.type === 'group' ? 'transparent' : n.data?.status?.running ? '#46c07f' : '#3a4653')}
              nodeStrokeColor=${(n) => (n.type === 'group' ? '#33414f' : 'transparent')}
              maskColor="#0a1016cc" style=${{ background: '#0d141b', border: '1px solid #253340' }} />
          <//>
        <//>
        <div class="rf-note">chip lit = running · blue chip = Docker · solid green edge = both ends up · dashed = observability / down</div>
      </div>
    </div>`;
}

createRoot(document.getElementById('root')).render(html`<${App} />`);
