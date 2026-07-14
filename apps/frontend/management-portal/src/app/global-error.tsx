'use client';

import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';
import { useEffect } from 'react';

/**
 * Phase 5 observability — Next.js App Router requires this specific file to catch
 * errors thrown by the root layout itself (regular error.tsx boundaries can't, since
 * they render inside the layout they'd need to replace). See
 * https://nextjs.org/docs/app/building-your-application/configuring/error-handling
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
