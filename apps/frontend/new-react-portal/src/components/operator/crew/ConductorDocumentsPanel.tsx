'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, FileText, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import { ConfirmDialog, FormDialog } from '@busmate/ui';
import { UserDocumentsControllerService } from '@busmate/api-client-user';
import type { UserDocumentResponse } from '@busmate/api-client-user';
import { Field, SectionCard, ToneBadge, inputClassFor } from '@/components/shared/form-primitives';
import { TONE_CLASSES, formatDate, isExpiringSoon } from '@/lib/permits';
import { downloadUserDocument } from '@/lib/api/busMedia';
import { apiErrorMessage } from '@/lib/api/errors';

export const CONDUCTOR_DOCUMENT_TYPES = [
  { value: 'NIC_FRONT', label: 'NIC (front)' },
  { value: 'NIC_BACK', label: 'NIC (back)' },
  { value: 'CONDUCTOR_LICENCE', label: 'Conductor licence' },
  { value: 'DRIVING_LICENCE', label: 'Driving licence' },
  { value: 'POLICE_CLEARANCE', label: 'Police clearance' },
  { value: 'MEDICAL_CERTIFICATE', label: 'Medical certificate' },
  { value: 'OTHER', label: 'Other' },
] as const;

const label = (v?: string) => CONDUCTOR_DOCUMENT_TYPES.find((t) => t.value === v)?.label ?? v ?? 'Document';
const MAX_BYTES = 8 * 1024 * 1024;
type Draft = { documentType: string; title: string; expiryDate: string; file: File | null };

/** A conductor's scanned documents (INC-019). Personal data: visible to the conductor, their operator and MOT. */
export function ConductorDocumentsPanel({ userId, canEdit }: { userId: string; canEdit: boolean }) {
  const [documents, setDocuments] = useState<UserDocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<UserDocumentResponse | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>({ documentType: 'NIC_FRONT', title: '', expiryDate: '', file: null });
  const [deleting, setDeleting] = useState<UserDocumentResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setDocuments(await UserDocumentsControllerService.listUserDocuments(userId));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load documents'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setBusy(true);
    setDialogError(null);
    try {
      if (editing === 'new') {
        if (!draft.file) return setDialogError('Choose a PDF or an image of the document');
        if (draft.file.size > MAX_BYTES) return setDialogError('The file is larger than 8 MB');
        await UserDocumentsControllerService.uploadUserDocument(userId, draft.documentType, draft.title || undefined,
          draft.expiryDate || undefined, { file: draft.file });
      } else if (editing) {
        await UserDocumentsControllerService.updateUserDocument(userId, editing.id!, {
          documentType: draft.documentType,
          title: draft.title,
          ...(draft.expiryDate ? { expiryDate: draft.expiryDate } : { clearExpiryDate: true }),
        });
      }
      setEditing(null);
      await load();
    } catch (err) {
      setDialogError(apiErrorMessage(err, 'Could not save the document'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard
      title={`Documents (${documents.length})`}
      icon={<FileText className="h-4 w-4 text-primary" />}
      actions={canEdit && (
        <button type="button" onClick={() => { setDraft({ documentType: 'NIC_FRONT', title: '', expiryDate: '', file: null }); setDialogError(null); setEditing('new'); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90">
          <Plus className="h-3.5 w-3.5" /> Add document
        </button>
      )}
    >
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" /> Personal documents — only the conductor, your company and the MOT can open them.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {loading ? (
        <div className="h-10 rounded bg-muted animate-pulse" />
      ) : documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No documents yet. Keep the NIC and conductor licence here so expiry dates are tracked.</p>
      ) : (
        <ul className="divide-y divide-border">
          {documents.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center gap-3 py-2.5">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{doc.title || label(doc.documentType)}</p>
                <p className="text-xs text-muted-foreground">{label(doc.documentType)} · {doc.contentType === 'application/pdf' ? 'PDF' : 'Image'}</p>
              </div>
              {doc.expiryDate && (doc.expired
                ? <ToneBadge className={TONE_CLASSES.destructive}>Expired {formatDate(doc.expiryDate)}</ToneBadge>
                : isExpiringSoon(doc.expiryDate)
                  ? <ToneBadge className={TONE_CLASSES.warning}>Expires {formatDate(doc.expiryDate)}</ToneBadge>
                  : <span className="text-xs text-muted-foreground">Valid until {formatDate(doc.expiryDate)}</span>)}
              <div className="flex gap-1">
                <button type="button" aria-label="Download" title="Download" className="p-1.5 rounded hover:bg-muted"
                  onClick={() => downloadUserDocument(userId, doc.id!, `${doc.documentType?.toLowerCase()}.${doc.contentType === 'application/pdf' ? 'pdf' : doc.contentType === 'image/png' ? 'png' : 'jpg'}`)
                    .catch((err) => setError(apiErrorMessage(err, 'Could not download')))}>
                  <Download className="w-4 h-4" />
                </button>
                {canEdit && (
                  <>
                    <button type="button" aria-label="Edit details" title="Edit details" className="p-1.5 rounded hover:bg-muted"
                      onClick={() => { setDraft({ documentType: doc.documentType ?? 'OTHER', title: doc.title ?? '', expiryDate: doc.expiryDate ?? '', file: null }); setDialogError(null); setEditing(doc); }}>
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button type="button" aria-label="Delete document" title="Delete" className="p-1.5 rounded text-destructive hover:bg-destructive/10" onClick={() => setDeleting(doc)}>
                      <Trash2 className="w-4 h-4" />
                    </button>
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
              {CONDUCTOR_DOCUMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Title" hint="Optional, e.g. the licence number">
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
            await UserDocumentsControllerService.deleteUserDocument(userId, deleting.id);
            await load();
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
