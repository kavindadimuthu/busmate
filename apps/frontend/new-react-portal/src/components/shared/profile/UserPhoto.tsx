'use client';

import type { ReactNode } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@busmate/ui';
import { useUserPhotoSrc } from '@/hooks/useUserPhoto';

interface UserPhotoProps {
  userId?: string | null;
  name: string;
  /** What each screen already showed before photos existed, so rows without one look unchanged. */
  fallback: ReactNode;
  className?: string;
  fallbackClassName?: string;
  title?: string;
}

/** Another person's photo, read-only, for list rows and detail headers (INC-006). */
export function UserPhoto({ userId, name, fallback, className, fallbackClassName, title }: UserPhotoProps) {
  const src = useUserPhotoSrc(userId);
  return (
    <Avatar className={className} title={title}>
      {src && <AvatarImage src={src} alt={name} className="object-cover" />}
      <AvatarFallback className={fallbackClassName}>{fallback}</AvatarFallback>
    </Avatar>
  );
}
