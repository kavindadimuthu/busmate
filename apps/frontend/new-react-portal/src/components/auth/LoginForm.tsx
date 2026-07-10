'use client';

import { useState } from 'react';
import { useRouter } from '@/lib/router';
import { Loader2, Lock, Mail } from 'lucide-react';
import { loginWithPassword } from '@/lib/auth/session';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { redirectPath } = await loginWithPassword(email, password);
      router.push(redirectPath);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to reach the server. Please try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-100">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-1 block text-xs font-medium text-white/80">
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            placeholder="you@busmate.lk"
            className="w-full rounded-lg border border-white/20 bg-white/10 py-2.5 pl-10 pr-3 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-white/40 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-xs font-medium text-white/80">
          Password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            placeholder="••••••••"
            className="w-full rounded-lg border border-white/20 bg-white/10 py-2.5 pl-10 pr-3 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-white/40 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-white py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-white/90 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
}
