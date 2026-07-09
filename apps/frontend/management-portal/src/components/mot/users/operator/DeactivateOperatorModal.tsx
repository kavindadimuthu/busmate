'use client';

import { ConfirmDialog } from '@busmate/ui';
import type { OperatorResponseWithLink } from '@/types/operator';

interface DeactivateOperatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  operator: OperatorResponseWithLink | null;
  isDeactivating?: boolean;
}

/**
 * Deactivation confirmation for operators linked to a user-service account. Deliberately
 * lighter-weight than DeleteOperatorModal (no "type DELETE to confirm" friction) since this
 * is reversible — the account can be reactivated from the Admin dashboard at any time, and
 * the status syncs back to core-service automatically.
 */
export default function DeactivateOperatorModal({
  isOpen,
  onClose,
  onConfirm,
  operator,
  isDeactivating = false,
}: DeactivateOperatorModalProps) {
  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Deactivate Operator"
      description={`Deactivate "${operator?.name ?? 'this operator'}"? Its linked user account will immediately lose access to the platform. This is reversible — reactivate it from the Admin dashboard's User Management at any time, and the status will sync back here automatically.`}
      confirmLabel="Deactivate"
      variant="destructive"
      onConfirm={onConfirm}
      loading={isDeactivating}
    />
  );
}
