'use client';

import { useRef, useState } from 'react';
import { Camera, ImageOff, Star, Trash2, Upload, X } from 'lucide-react';
import { ConfirmDialog, FormDialog } from '@busmate/ui';
import { BusProfileService } from '@busmate/api-client-core';
import type { BusMediaResponse } from '@busmate/api-client-core';
import { SectionCard } from '@/components/shared/form-primitives';
import { useBusMediaUrl } from '@/hooks/useBusMediaUrl';
import { apiErrorMessage } from '@/lib/api/errors';

const MAX_PHOTOS = 12;
const MAX_BYTES = 8 * 1024 * 1024;

function Thumb({ busId, photo, onOpen }: { busId: string; photo: BusMediaResponse; onOpen: () => void }) {
  const { url, failed } = useBusMediaUrl(busId, photo.id);
  return (
    <button type="button" onClick={onOpen} className="block w-full aspect-[4/3] bg-muted rounded-lg overflow-hidden" aria-label={`Open ${photo.title ?? 'photo'}`}>
      {url ? (
        <img src={url} alt={photo.title ?? 'Bus photo'} className="w-full h-full object-cover" />
      ) : (
        <span className="w-full h-full flex items-center justify-center text-muted-foreground">
          {failed ? <ImageOff className="w-5 h-5" /> : <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
        </span>
      )}
    </button>
  );
}

function Lightbox({ busId, photo, onClose }: { busId: string; photo: BusMediaResponse; onClose: () => void }) {
  const { url } = useBusMediaUrl(busId, photo.id);
  return (
    <FormDialog open onOpenChange={(open) => !open && onClose()} title={photo.title ?? 'Photo'} size="xl">
      <div className="flex justify-center bg-muted rounded-lg min-h-64">
        {url && <img src={url} alt={photo.title ?? 'Bus photo'} className="max-h-[70vh] object-contain" />}
      </div>
    </FormDialog>
  );
}

/** A bus's photos: add several at once, choose the cover, remove (INC-018). */
export function BusPhotoGallery({ busId, photos, canEdit, onChanged }: {
  busId: string;
  photos: BusMediaResponse[];
  canEdit: boolean;
  onChanged: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<BusMediaResponse | null>(null);
  const [deleting, setDeleting] = useState<BusMediaResponse | null>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    const room = MAX_PHOTOS - photos.length;
    const list = Array.from(files).slice(0, room);
    const problems: string[] = [];
    if (files.length > room) problems.push(`Only ${room} more photo(s) fit; the rest were skipped.`);
    for (const [i, file] of list.entries()) {
      if (file.size > MAX_BYTES) {
        problems.push(`${file.name} is larger than 8 MB.`);
        continue;
      }
      setUploading(`Uploading ${i + 1} of ${list.length}…`);
      try {
        await BusProfileService.uploadBusMedia(busId, 'PHOTO', undefined, file.name.replace(/\.[^.]+$/, ''), undefined, { file });
      } catch (err) {
        problems.push(`${file.name}: ${apiErrorMessage(err, 'upload failed')}`);
      }
    }
    setUploading(null);
    if (problems.length) setError(problems.join(' '));
    if (input.current) input.current.value = '';
    onChanged();
  };

  const makeCover = async (photo: BusMediaResponse) => {
    setBusy(true);
    try {
      await BusProfileService.updateBusMedia(busId, photo.id!, { cover: true });
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not change the cover photo'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard
      title={`Photos (${photos.length}/${MAX_PHOTOS})`}
      icon={<Camera className="h-4 w-4 text-primary" />}
      actions={
        canEdit && (
          <>
            <input ref={input} type="file" accept="image/jpeg,image/png" multiple className="hidden" onChange={(e) => upload(e.target.files)} aria-label="Choose photos" />
            <button type="button" onClick={() => input.current?.click()} disabled={!!uploading || photos.length >= MAX_PHOTOS}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50">
              <Upload className="h-3.5 w-3.5" /> {uploading ?? 'Add photos'}
            </button>
          </>
        )
      }
    >
      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive">
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss"><X className="w-4 h-4" /></button>
        </div>
      )}
      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No photos yet.{canEdit ? ' Add exterior and interior photos (JPEG or PNG, up to 8 MB each). Location data is removed on upload.' : ''}
        </p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <li key={photo.id} className="relative group">
              <Thumb busId={busId} photo={photo} onOpen={() => setOpen(photo)} />
              {photo.cover && (
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                  <Star className="w-3 h-3" /> Cover
                </span>
              )}
              {canEdit && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                  {!photo.cover && (
                    <button type="button" onClick={() => makeCover(photo)} disabled={busy} title="Make cover photo"
                      className="p-1.5 rounded-md bg-card/90 border border-border hover:bg-card" aria-label="Make cover photo">
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button type="button" onClick={() => setDeleting(photo)} title="Delete photo"
                    className="p-1.5 rounded-md bg-card/90 border border-border text-destructive hover:bg-card" aria-label="Delete photo">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {photo.title && <p className="mt-1 text-xs text-muted-foreground truncate">{photo.title}</p>}
            </li>
          ))}
        </ul>
      )}
      {open && <Lightbox busId={busId} photo={open} onClose={() => setOpen(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this photo?"
        description={deleting?.cover ? 'It is the cover photo; the next photo becomes the cover.' : undefined}
        confirmLabel="Delete"
        variant="destructive"
        loading={busy}
        onConfirm={async () => {
          if (!deleting?.id) return;
          setBusy(true);
          try {
            await BusProfileService.deleteBusMedia(busId, deleting.id);
            onChanged();
          } catch (err) {
            setError(apiErrorMessage(err, 'Could not delete the photo'));
          } finally {
            setBusy(false);
            setDeleting(null);
          }
        }}
      />
    </SectionCard>
  );
}

/** The cover photo, for headers and lists. */
export function BusCoverImage({ busId, coverPhotoId, className }: { busId?: string; coverPhotoId?: string | null; className?: string }) {
  const { url } = useBusMediaUrl(busId, coverPhotoId ?? null);
  return (
    <div className={`bg-muted overflow-hidden flex items-center justify-center ${className ?? ''}`}>
      {url ? <img src={url} alt="Bus" className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-muted-foreground/60" />}
    </div>
  );
}
