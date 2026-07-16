export type EnvStatus = {
  running: boolean;
  source: 'docker' | 'process' | null;
  detail: string | null;
};

export type ServiceStatus = {
  id: string;
  running: boolean;
  envs: Record<string, EnvStatus>;
  runningEnvs: string[];
  probedUp: boolean;
};

export type Service = {
  id: string;
  label: string;
  group: string;
  stack: string;
  envs: string[];
  pos: { x: number; y: number };
  dependsOn: string[];
  self: boolean;
  actions: Record<string, 'pnpm' | 'compose'>;
  status: ServiceStatus;
};

export type Group = {
  id: string;
  label: string;
  color: string;
  frame: { x: number; y: number; width: number; height: number };
};

export type SoftEdge = { source: string; target: string; label?: string };

export type StatusPayload = {
  generatedAt: string;
  dockerAvailable: boolean;
  groups: Group[];
  softEdges: SoftEdge[];
  services: Service[];
};

// Data carried on each ReactFlow node. The node is purely presentational now —
// clicking it selects the service, which opens the detail card (see DetailPanel).
export type ServiceNodeData = {
  id: string;
  label: string;
  stack: string;
  envs: string[];
  status: ServiceStatus;
  groupColor: string;
  selected: boolean;
};

export type GroupNodeData = {
  label: string;
  color: string;
  up: number;
  total: number;
};
