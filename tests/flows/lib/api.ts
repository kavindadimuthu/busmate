import { ACCOUNTS, type Account } from './accounts';

export const URLS = {
  api: process.env.API_URL ?? 'http://localhost:8090', // the flows stack's own gateway
  web: process.env.WEB_URL ?? 'http://localhost:4000',
  portal: process.env.PORTAL_URL ?? 'http://localhost:5173',
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * One request to the gateway. The gateway allows a limited number a minute and says how long to wait; a flow test
 * that fails against it is testing the limiter, so wait as told and retry.
 */
export async function request(method: string, path: string, opts: { token?: string; body?: unknown } = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(URLS.api + path, {
      method,
      headers: { 'content-type': 'application/json', ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}) },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });
    if (res.status === 429 && attempt < 6) {
      await sleep((Number(res.headers.get('retry-after') ?? 20) + 1) * 1000);
      continue;
    }
    const remaining = Number(res.headers.get('ratelimit-remaining') ?? 99);
    if (remaining <= 3) await sleep((Number(res.headers.get('ratelimit-reset') ?? 5) + 1) * 1000);
    const text = await res.text();
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = text; }
    return { status: res.status, body: json };
  }
}

const tokens = new Map<string, string>();

/** A signed-in account's token, reused across a run. */
export async function tokenFor(account: Account): Promise<string> {
  const cached = tokens.get(account.email);
  if (cached) return cached;
  const res = await request('POST', '/api/auth/login', { body: { email: account.email, password: account.password } });
  if (res.status !== 200) throw new Error(`login as ${account.email} failed: ${res.status}`);
  tokens.set(account.email, res.body.accessToken);
  return res.body.accessToken;
}

export const as = async (account: Account) => ({
  get: async (path: string) => request('GET', path, { token: await tokenFor(account) }),
  post: async (path: string, body?: unknown) => request('POST', path, { token: await tokenFor(account), body }),
  put: async (path: string, body?: unknown) => request('PUT', path, { token: await tokenFor(account), body }),
  delete: async (path: string) => request('DELETE', path, { token: await tokenFor(account) }),
});

/** Every item of a list endpoint that returns either an array or a page. */
export const items = (body: any): any[] => (Array.isArray(body) ? body : body?.content ?? []);

export { ACCOUNTS };
