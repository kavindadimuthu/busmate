'use client';

// This component configures all API client BASE URLs on the client side.
// It renders nothing - it only exists so that the setup side-effect runs
// in the client bundle when the component mounts during hydration.
// NEXT_PUBLIC_* env vars are inlined at build time by Next.js.
import '@/lib/api/setup';

export default function ApiSetup() {
  return null;
}
