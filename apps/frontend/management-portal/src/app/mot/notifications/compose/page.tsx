'use client';

import { useNotificationComposer } from '@/hooks/mot/notifications/useNotificationComposer';
import { ComposeNotificationForm } from '@/components/mot/notifications/ComposeNotificationForm';

export default function ComposeNotificationPage() {
  const { form, errors, isSending, set, handleSend, handleCancel } = useNotificationComposer();

  return (
    <div className="space-y-6">
      <ComposeNotificationForm
        form={form}
        errors={errors}
        isSending={isSending}
        set={set}
        onSend={handleSend}
        onCancel={handleCancel}
      />
    </div>
  );
}

