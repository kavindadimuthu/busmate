import type { StatusPayload } from './types';

export async function getStatus(): Promise<StatusPayload> {
  const res = await fetch('/api/status', { cache: 'no-store' });
  if (!res.ok) throw new Error(`status ${res.status}`);
  return res.json();
}

export type ActionResult = { ok: boolean; message: string };

export async function runAction(id: string, env: string, verb: 'start' | 'stop'): Promise<ActionResult> {
  const res = await fetch(`/api/services/${encodeURIComponent(id)}/${encodeURIComponent(env)}/${verb}`, {
    method: 'POST',
  });
  return res.json().catch(() => ({ ok: res.ok, message: res.ok ? 'OK' : `HTTP ${res.status}` }));
}
