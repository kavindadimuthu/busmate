'use client';

import { useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@busmate/ui';
import { Camera, Loader2 } from 'lucide-react';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';

interface ProfilePhotoAvatarProps {
  userId: string | null;
  displayName: string;
  initials: string;
  /** Role dashboards each tint the initials differently; everything else is shared. */
  fallbackClassName?: string;
}

/**
 * The signed-in user's photo, with the control to replace it (INC-005).
 *
 * <p>One component for all four role dashboards, which previously carried four identical
 * copies of an avatar pointing at a placeholder file that does not exist — so every staff
 * user has always seen their initials.
 */
export function ProfilePhotoAvatar({
  userId,
  displayName,
  initials,
  fallbackClassName,
}: ProfilePhotoAvatarProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const { src, error, uploading, upload, clearError } = useProfilePhoto(userId);

  async function handleFileChosen(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset immediately so choosing the same file again still fires a change event.
    event.target.value = '';
    if (file) await upload(file);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative shrink-0">
        <Avatar className="w-24 h-24 ring-4 ring-white/30 shadow-xl">
          {src && <AvatarImage src={src} alt={displayName} className="object-cover" />}
          <AvatarFallback className={fallbackClassName}>{initials}</AvatarFallback>
        </Avatar>

        <button
          type="button"
          onClick={() => {
            clearError();
            fileInput.current?.click();
          }}
          disabled={!userId || uploading}
          aria-label="Change profile photo"
          className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full bg-white text-slate-700 shadow-md ring-2 ring-white transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Camera className="h-4 w-4" aria-hidden />
          )}
        </button>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChosen}
        />
      </div>

      {error && (
        <p role="alert" className="max-w-[16rem] text-center text-xs font-medium text-red-100">
          {error}
        </p>
      )}
    </div>
  );
}
