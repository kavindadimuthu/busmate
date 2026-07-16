// Registry of every runnable BusMate component the dev-portal knows how to probe.
//
// This is the single source of truth for the topology dashboard: node identity,
// where it lives on the canvas, which environments it can run in, how to detect
// whether it's up (Docker container match + health/port probe), and which other
// components it talks to (edges).
//
// Ports here are the conventional dev ports (see each app's project.json / compose
// file). Override any of them without editing code via env vars, e.g.
//   MGMT_PORTAL_PORT=3100 pnpm dev-portal
// The `envOverride` field on a probe names the env var that wins if set.

/** @typedef {'http'|'tcp'} ProbeType */

export const groups = [
  { id: 'client', label: 'Client applications', color: '#3f7cac' },
  { id: 'edge', label: 'API gateway', color: '#d98a26' },
  { id: 'service', label: 'Backend services', color: '#3f9b7c' },
  { id: 'data', label: 'Data stores', color: '#7a6ad4' },
  { id: 'observability', label: 'Observability', color: '#5188ad' },
  { id: 'tool', label: 'Internal tools', color: '#8a6f4a' },
];

const port = (name, fallback) => Number(process.env[name] || fallback);

export const services = [
  // ── Client applications ────────────────────────────────────────────────
  {
    id: 'management-portal', label: 'management-portal', group: 'client',
    stack: 'Next.js · staff', envs: ['local'], position: { x: -40, y: 0 },
    dockerService: null, dependsOn: ['api-gateway'],
    probe: { type: 'http', host: 'localhost', port: port('MGMT_PORTAL_PORT', 3000), path: '/' },
  },
  {
    id: 'new-react-portal', label: 'new-react-portal', group: 'client',
    stack: 'Vite · staff', envs: ['local'], position: { x: 200, y: 0 },
    dockerService: null, dependsOn: ['api-gateway'],
    probe: { type: 'http', host: 'localhost', port: port('NEW_PORTAL_PORT', 5173), path: '/' },
  },
  {
    id: 'passenger-web', label: 'passenger-web', group: 'client',
    stack: 'Vite · React', envs: ['local'], position: { x: 440, y: 0 },
    dockerService: null, dependsOn: ['api-gateway'],
    probe: { type: 'http', host: 'localhost', port: port('PASSENGER_WEB_PORT', 4000), path: '/' },
  },
  {
    id: 'passenger-mobile', label: 'passenger-mobile', group: 'client',
    stack: 'Expo · Metro', envs: ['local'], position: { x: 680, y: 0 },
    dockerService: null, dependsOn: ['api-gateway'],
    probe: { type: 'http', host: 'localhost', port: port('EXPO_PASSENGER_PORT', 8081), path: '/status' },
  },
  {
    id: 'conductor-mobile', label: 'conductor-mobile', group: 'client',
    stack: 'Expo · Metro', envs: ['local'], position: { x: 920, y: 0 },
    dockerService: null, dependsOn: ['api-gateway'],
    probe: { type: 'http', host: 'localhost', port: port('EXPO_CONDUCTOR_PORT', 8082), path: '/status' },
  },

  // ── Edge ───────────────────────────────────────────────────────────────
  {
    id: 'api-gateway', label: 'api-gateway', group: 'edge',
    stack: 'Node · Express · :8080', envs: ['dev', 'prod', 'e2e', 'local'],
    position: { x: 440, y: 180 }, dockerService: 'api-gateway',
    dependsOn: ['core-service', 'user-service', 'ticketing-service'],
    probe: { type: 'http', host: 'localhost', port: port('API_GATEWAY_PORT', 8080), path: '/health' },
  },

  // ── Backend services ───────────────────────────────────────────────────
  {
    id: 'core-service', label: 'core-service', group: 'service',
    stack: 'Spring Boot · :9010', envs: ['dev', 'prod', 'e2e', 'local'],
    position: { x: 240, y: 360 }, dockerService: 'core-service', dependsOn: ['postgres'],
    probe: { type: 'http', host: 'localhost', port: port('CORE_SERVICE_PORT', 9010), path: '/actuator/health' },
  },
  {
    id: 'user-service', label: 'user-service', group: 'service',
    stack: 'Spring Boot · :9020', envs: ['dev', 'prod', 'e2e', 'local'],
    position: { x: 470, y: 360 }, dockerService: 'user-service', dependsOn: ['postgres', 'core-service'],
    probe: { type: 'http', host: 'localhost', port: port('USER_SERVICE_PORT', 9020), path: '/actuator/health' },
  },
  {
    id: 'ticketing-service', label: 'ticketing-service', group: 'service',
    stack: 'Spring Boot · :9030', envs: ['dev', 'prod', 'e2e', 'local'],
    position: { x: 700, y: 360 }, dockerService: 'ticketing-service', dependsOn: ['postgres'],
    probe: { type: 'http', host: 'localhost', port: port('TICKETING_SERVICE_PORT', 9030), path: '/actuator/health' },
  },

  // ── Data ───────────────────────────────────────────────────────────────
  {
    id: 'postgres', label: 'postgres', group: 'data',
    stack: 'PostgreSQL 16 · :5433 (dev) · Supabase (prod)', envs: ['dev', 'e2e', 'local'],
    position: { x: 470, y: 540 }, dockerService: 'postgres', dependsOn: [],
    probe: { type: 'tcp', host: 'localhost', port: port('POSTGRES_PORT', 5433) },
  },

  // ── Observability (separate compose: busmate-observability) ─────────────
  {
    id: 'grafana', label: 'Grafana', group: 'observability',
    stack: 'dashboards · :3000', envs: ['obs'], position: { x: 1160, y: 0 },
    dockerService: 'grafana', dependsOn: ['loki', 'prometheus', 'tempo'],
    probe: { type: 'http', host: 'localhost', port: port('GRAFANA_PORT', 3000), path: '/api/health' },
  },
  {
    id: 'prometheus', label: 'Prometheus', group: 'observability',
    stack: 'metrics · :9090', envs: ['obs'], position: { x: 1160, y: 130 },
    dockerService: 'prometheus', dependsOn: ['api-gateway'],
    probe: { type: 'http', host: 'localhost', port: port('PROMETHEUS_PORT', 9090), path: '/-/healthy' },
  },
  {
    id: 'loki', label: 'Loki', group: 'observability',
    stack: 'logs · :3100', envs: ['obs'], position: { x: 1160, y: 260 },
    dockerService: 'loki', dependsOn: [],
    probe: { type: 'http', host: 'localhost', port: port('LOKI_PORT', 3100), path: '/ready' },
  },
  {
    id: 'tempo', label: 'Tempo', group: 'observability',
    stack: 'traces · :3200', envs: ['obs'], position: { x: 1160, y: 390 },
    dockerService: 'tempo', dependsOn: [],
    probe: { type: 'http', host: 'localhost', port: port('TEMPO_PORT', 3200), path: '/ready' },
  },
  {
    id: 'uptime-kuma', label: 'Uptime Kuma', group: 'observability',
    stack: 'uptime · :3001', envs: ['obs'], position: { x: 1160, y: 520 },
    dockerService: 'uptime-kuma', dependsOn: [],
    probe: { type: 'http', host: 'localhost', port: port('UPTIME_KUMA_PORT', 3001), path: '/' },
  },

  // ── Internal tools ─────────────────────────────────────────────────────
  {
    id: 'dbgate', label: 'DbGate', group: 'tool',
    stack: 'DB GUI · :3002', envs: ['local'], position: { x: -40, y: 540 },
    dockerService: 'dbgate', dependsOn: ['postgres'],
    probe: { type: 'http', host: 'localhost', port: port('DBGATE_PORT', 3002), path: '/' },
  },
  {
    id: 'dev-portal', label: 'dev-portal', group: 'tool',
    stack: 'this dashboard', envs: ['local'], position: { x: 180, y: 540 },
    dockerService: null, dependsOn: [], self: true,
    probe: { type: 'http', host: 'localhost', port: port('DEV_PORTAL_PORT', 4321), path: '/api/ping' },
  },
];

// Dependency edges are derived from each service's `dependsOn`. Extra
// cross-cutting edges (observability scrape/collect paths) that aren't a hard
// runtime dependency live here so they can be styled differently.
export const softEdges = [
  { source: 'core-service', target: 'tempo', label: 'OTLP' },
  { source: 'user-service', target: 'tempo', label: 'OTLP' },
  { source: 'ticketing-service', target: 'tempo', label: 'OTLP' },
  { source: 'api-gateway', target: 'tempo', label: 'OTLP' },
  { source: 'grafana', target: 'loki' },
  { source: 'grafana', target: 'prometheus' },
  { source: 'grafana', target: 'tempo' },
];
