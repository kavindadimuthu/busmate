import type { Service, Group, EnvStatus } from './types';

type Props = {
  service: Service;
  group: Group | undefined;
  pending: Record<string, boolean>; // key `${id}:${env}`
  onAction: (id: string, env: string, verb: 'start' | 'stop') => void;
  onClose: () => void;
};

function envLine(e: EnvStatus | undefined): { label: string; cls: string } {
  if (!e) return { label: 'not running', cls: 'down' };
  if (e.proc === 'starting') return { label: 'starting…', cls: 'starting' };
  if (e.proc === 'failed') return { label: 'failed', cls: 'failed' };
  if (e.running) return { label: `running · ${e.source}${e.detail ? ` · ${e.detail}` : ''}`, cls: 'up' };
  return { label: 'not running', cls: 'down' };
}

export function DetailPanel({ service, group, pending, onAction, onClose }: Props) {
  const s = service;
  const running = s.status?.running;

  return (
    <aside className="detail-panel" role="dialog" aria-label={`${s.label} details`}>
      <header className="dp-head" style={{ ['--gc' as string]: group?.color ?? 'var(--accent)' }}>
        <div className="dp-title">
          <span className="dp-dot" style={{ background: running ? 'var(--up)' : 'var(--down)' }} />
          <div>
            <div className="dp-name">{s.label}</div>
            <div className="dp-group">
              <span className="dp-group-dot" style={{ background: group?.color }} />
              {group?.label ?? s.group}
            </div>
          </div>
        </div>
        <button className="dp-close" onClick={onClose} title="Close" aria-label="Close">
          ✕
        </button>
      </header>

      <div className="dp-body">
        <div className={`dp-status ${running ? 'up' : 'down'}`}>{running ? 'Running' : 'Not running'}</div>

        <dl className="dp-meta">
          <div>
            <dt>Stack</dt>
            <dd>{s.stack}</dd>
          </div>
          {s.dependsOn.length > 0 && (
            <div>
              <dt>Depends on</dt>
              <dd>{s.dependsOn.join(', ')}</dd>
            </div>
          )}
        </dl>

        <div className="dp-section-label">Environments</div>
        <div className="dp-envs">
          {s.envs.map((env) => {
            const e = s.status?.envs?.[env];
            const line = envLine(e);
            const kind = s.actions?.[env];
            const controllable = Boolean(kind);
            const isRunning = Boolean(e?.running) || e?.proc === 'starting' || e?.proc === 'running';
            const isPending = pending[`${s.id}:${env}`];
            return (
              <div className="dp-env-row" key={env}>
                <div className="dp-env-info">
                  <div className="dp-env-name">
                    {env}
                    {kind && <span className="dp-env-kind">{kind}</span>}
                  </div>
                  <div className={`dp-env-state ${line.cls}`}>{line.label}</div>
                </div>
                {!controllable ? (
                  <span className="dp-env-note">status only</span>
                ) : isPending ? (
                  <button className="dp-btn working" disabled>
                    working…
                  </button>
                ) : isRunning ? (
                  <button className="dp-btn stop" onClick={() => onAction(s.id, env, 'stop')}>
                    Stop
                  </button>
                ) : (
                  <button className="dp-btn start" onClick={() => onAction(s.id, env, 'start')}>
                    Start
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
