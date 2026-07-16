import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { ServiceNodeData, EnvStatus } from '../types';

function chipClass(e: EnvStatus | undefined): string {
  if (!e || !e.running) return 'chip off';
  return e.source === 'docker' ? 'chip on docker' : 'chip on';
}

function chipTitle(env: string, e: EnvStatus | undefined): string {
  if (!e || !e.running) return `${env}: not running`;
  return `${env}: running via ${e.source}${e.detail ? ` (${e.detail})` : ''}`;
}

function ServiceNodeImpl({ data }: NodeProps<Node<ServiceNodeData>>) {
  const { status, envs, groupColor, selected } = data;
  const running = status?.running;

  return (
    <div
      className={`snode ${running ? 'up' : 'down'} ${selected ? 'selected' : ''}`}
      style={{ ['--g' as string]: groupColor }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />

      <div className="top">
        <span className="status-dot" style={{ ['--dotc' as string]: running ? 'var(--up)' : 'var(--down)' }} />
        <span className="name">{data.label}</span>
      </div>

      <div className="stack">{data.stack}</div>

      <div className="envs">
        {envs.map((env) => (
          <span key={env} className={chipClass(status?.envs?.[env])} title={chipTitle(env, status?.envs?.[env])}>
            {env}
          </span>
        ))}
      </div>

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

export const ServiceNode = memo(ServiceNodeImpl);
