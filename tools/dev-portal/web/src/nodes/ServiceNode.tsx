import { memo, useState } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { ServiceNodeData, EnvStatus } from '../types';

function chipClass(e: EnvStatus | undefined): string {
  if (!e) return 'chip off';
  if (e.proc === 'starting') return 'chip pending';
  if (e.proc === 'failed') return 'chip failed';
  if (e.running) return e.source === 'docker' ? 'chip on docker' : 'chip on';
  return 'chip off';
}

function chipTitle(env: string, e: EnvStatus | undefined): string {
  if (!e) return `${env}: not running`;
  if (e.proc === 'starting') return `${env}: starting…`;
  if (e.proc === 'failed') return `${env}: failed — open the menu for logs`;
  if (e.running) return `${env}: running via ${e.source}${e.detail ? ` (${e.detail})` : ''}`;
  return `${env}: not running`;
}

function ServiceNodeImpl({ data }: NodeProps<Node<ServiceNodeData>>) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { status, envs, actions, groupColor } = data;
  const running = status?.running;

  return (
    <div className={`snode ${running ? 'up' : 'down'}`} style={{ ['--g' as string]: groupColor }}>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />

      <div className="top">
        <span className="status-dot" style={{ ['--dotc' as string]: running ? 'var(--up)' : 'var(--down)' }} />
        <span className="name">{data.label}</span>
        <button
          className="kebab"
          title="Run / stop this component"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((o) => !o);
          }}
        >
          ⋯
        </button>
      </div>

      <div className="stack">{data.stack}</div>

      <div className="envs">
        {envs.map((env) => (
          <span key={env} className={chipClass(status?.envs?.[env])} title={chipTitle(env, status?.envs?.[env])}>
            {env}
          </span>
        ))}
      </div>

      {menuOpen && (
        <div className="node-menu" onClick={(e) => e.stopPropagation()}>
          <div className="node-menu-head">Run / stop</div>
          {envs.map((env) => {
            const e = status?.envs?.[env];
            const controllable = Boolean(actions?.[env]);
            const isRunning = Boolean(e?.running) || e?.proc === 'starting' || e?.proc === 'running';
            const pending = data.pending?.[env];
            return (
              <div className="node-menu-row" key={env}>
                <span className="mrow-env">
                  {env}
                  {actions?.[env] && <span className="mrow-kind">{actions[env]}</span>}
                </span>
                {!controllable ? (
                  <span className="mrow-note">status only</span>
                ) : pending ? (
                  <span className="mrow-note">working…</span>
                ) : isRunning ? (
                  <button className="btn stop" onClick={() => data.onAction(data.id, env, 'stop')}>
                    Stop
                  </button>
                ) : (
                  <button className="btn start" onClick={() => data.onAction(data.id, env, 'start')}>
                    Start
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

export const ServiceNode = memo(ServiceNodeImpl);
