'use client';

import { useEffect, useState } from 'react';
import { fetchBusMediaBlob } from '@/lib/api/busMedia';

/** An object URL for a bus photo, revoked when the component unmounts or the id changes. */
export function useBusMediaUrl(busId?: string, mediaId?: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!busId || !mediaId) {
      setUrl(null);
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;
    setFailed(false);
    fetchBusMediaBlob(busId, mediaId)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [busId, mediaId]);

  return { url, failed };
}
