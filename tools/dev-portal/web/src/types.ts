export type EnvStatus = {
  running: boolean;
  source: 'docker' | 'process' | null;
  detail: string | null;
  proc: 'starting' | 'running' | 'exited' | 'failed' | null;
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

// Data carried on each ReactFlow node.
export type ServiceNodeData = {
  label: string;
  stack: string;
  envs: string[];
  actions: Record<string, 'pnpm' | 'compose'>;
  status: ServiceStatus;
  groupColor: string;
  onAction: (id: string, env: string, verb: 'start' | 'stop') => void;
  pending: Record<string, boolean>; // key `${env}` → in-flight
  id: string;
};

export type GroupNodeData = {
  label: string;
  color: string;
  up: number;
  total: number;
};
