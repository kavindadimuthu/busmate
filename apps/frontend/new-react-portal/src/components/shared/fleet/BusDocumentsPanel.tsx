'use client';

import { useState } from 'react';
import { Download, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { ConfirmDialog, FormDialog } from '@busmate/ui';
import { BusProfileService } from '@busmate/api-client-core';
import type { BusMediaResponse } from '@busmate/api-client-core';
import { Field, SectionCard, ToneBadge, inputClassFor } from '@/components/shared/form-primitives';
import { DOCUMENT_TYPES, documentTypeLabel } from '@/lib/fleet';
import { TONE_CLASSES, formatDate, isExpiringSoon } from '@/lib/permits';
import { openBusDocument } from '@/lib/api/busMedia';
import { apiErrorMessage } from '@/lib/api/errors';

const MAX_BYTES = 8 * 1024 * 1024;

type Draft = { documentType: string; title: string; expiryDate: string; file: File | null };

/** Scanned documents of a bus: registration, licence, insurance... with expiry tracking (INC-018). */
export function BusDocumentsPanel({ busId, documents, canEdit, onChanged }: {
  busId: string;
  documents: BusMediaResponse[];
  canEdit: boolean;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState<BusMediaResponse | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>({ documentType: 'REGISTRATION_CERTIFICATE', title: '', expiryDate: '', file: null });
  const [deleting, setDeleting] = useState<BusMediaResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const openNew = () => {
    setDraft({ documentType: 'REGISTRATION_CERTIFICATE', title: '', expiryDate: '', file: null });
    setDialogError(null);
    setEditing('new');
  };
  const openEdit = (doc: BusMediaResponse) => {
    setDraft({ documentType: doc.documentType ?? 'OTHER', title: doc.title ?? '', expiryDate: doc.expiryDate ?? '', file: null });
    setDialogError(null);
    setEditing(doc);
  };

  const save = async () => {
    setBusy(true);
    setDialogError(null);
    try {
      if (editing === 'new') {
        if (!draft.file) {
          setDialogError('Choose a PDF or an image of the document');
          return;
        }
        if (draft.file.size > MAX_BYTES) {
          setDialogError('The file is larger than 8 MB');
          return;
        }
        await BusProfileService.uploadBusMedia(busId, 'DOCUMENT', draft.documentType, draft.title || undefined,
          draft.expiryDate || undefined, { file: draft.file });
      } else if (editing) {
        await BusProfileService.updateBusMedia(busId, editing.id!, {
          documentType: draft.documentType,
          title: draft.title,
          ...(draft.expiryDate ? { expiryDate: draft.expiryDate } : { clearExpiryDate: true }),
        });
      }
      setEditing(null);
      onChanged();
    } catch (err) {
      setDialogError(apiErrorMessage(err, 'Could not save the document'));
    } finally {
      setBusy(false);
    }
  };

  const download = async (doc: BusMediaResponse) => {
    setError(null);
    try {
      const ext = doc.contentType === 'application/pdf' ? 'pdf' : doc.contentType === 'image/png' ? 'png' : 'jpg';
      await openBusDocument(busId, doc.id!, `${(doc.title || documentTypeLabel(doc.documentType)).replace(/[^\w-]+/g, '_')}.${ext}`);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not download the document'));
    }
  };

  const expiryBadge = (doc: BusMediaResponse) => {
    if (!doc.expiryDate) return null;
    if (doc.expired) return <ToneBadge className={TONE_CLASSES.destructive}>Expired {formatDate(doc.expiryDate)}</ToneBadge>;
    if (isExpiringSoon(doc.expiryDate)) return <ToneBadge className={TONE_CLASSES.warning}>Expires {formatDate(doc.expiryDate)}</ToneBadge>;
    return <span className="text-xs text-muted-foreground">Valid until {formatDate(doc.expiryDate)}</span>;
  };

  return (
    <SectionCard
      title={`Documents (${documents.length})`}
      icon={<FileText className="h-4 w-4 text-primary" />}
      actions={canEdit && (
        <button type="button" onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90">
          <Plus className="h-3.5 w-3.5" /> Add document
        </button>
      )}
    >
      {error && <p className="text-sm text-destructive">{error}</p>}
      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No documents yet.{canEdit ? ' Keep the registration certificate, revenue licence and insurance here so their expiry dates are tracked.' : ''}</p>
      ) : (
        <ul className="divide-y divide-border">
          {documents.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center gap-3 py-2.5">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{doc.title || documentTypeLabel(doc.documentType)}</p>
                <p className="text-xs text-muted-foreground">
                  {documentTypeLabel(doc.documentType)} · {doc.contentType === 'application/pdf' ? 'PDF' : 'Image'} · {Math.max(1, Math.round((doc.sizeBytes ?? 0) / 1024))} KB
                </p>
              </div>
              {expiryBadge(doc)}
              <div className="flex gap-1">
                <button type="button" onClick={() => download(doc)} className="p-1.5 rounded hover:bg-muted" title="Download" aria-label={`Download ${doc.title || documentTypeLabel(doc.documentType)}`}><Download className="w-4 h-4" /></button>
                {canEdit && (
                  <>
                    <button type="button" onClick={() => openEdit(doc)} className="p-1.5 rounded hover:bg-muted" title="Edit details" aria-label="Edit details"><Pencil className="w-4 h-4" /></button>
                    <button type="button" onClick={() => setDeleting(doc)} className="p-1.5 rounded text-destructive hover:bg-destructive/10" title="Delete" aria-label="Delete document"><Trash2 className="w-4 h-4" /></button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <FormDialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} title={editing === 'new' ? 'Add a document' : 'Edit document details'} size="md">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <Field label="Document type" required>
            <select value={draft.documentType} onChange={(e) => setDraft({ ...draft, documentType: e.target.value })} className={inputClassFor()}>
              {DOCUMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Title" hint="Optional, e.g. the policy or certificate number">
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} maxLength={200} className={inputClassFor()} />
          </Field>
          <Field label="Expiry date" hint="Leave empty if it does not expire">
            <input type="date" value={draft.expiryDate} onChange={(e) => setDraft({ ...draft, expiryDate: e.target.value })} className={inputClassFor()} />
          </Field>
          {editing === 'new' && (
            <Field label="File" required hint="PDF, JPEG or PNG, up to 8 MB">
              <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={(e) => setDraft({ ...draft, file: e.target.files?.[0] ?? null })}
                className="block w-full text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-primary/10 file:text-primary" />
            </Field>
          )}
          {dialogError && <p className="text-sm text-destructive">{dialogError}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">Cancel</button>
            <button type="submit" disabled={busy} className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg disabled:opacity-50">
              {busy ? 'Saving…' : editing === 'new' ? 'Upload' : 'Save'}
            </button>
          </div>
        </form>
      </FormDialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this document?"
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
            setError(apiErrorMessage(err, 'Could not delete the document'));
          } finally {
            setBusy(false);
            setDeleting(null);
          }
        }}
      />
    </SectionCard>
  );
}
