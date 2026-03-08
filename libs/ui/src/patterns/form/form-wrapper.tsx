"use client";

import * as React from "react";
import { FormProvider, type UseFormReturn, type FieldValues } from "react-hook-form";
import { Button } from "@/components/button";
import { Loader2 } from "lucide-react";

interface FormWrapperProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  onSubmit: (data: T) => void | Promise<void>;
  children: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isSubmitting?: boolean;
  className?: string;
}

export function FormWrapper<T extends FieldValues>({
  form,
  onSubmit,
  children,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  onCancel,
  isSubmitting = false,
  className,
}: FormWrapperProps<T>) {
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={className}>
        <div className="space-y-6 max-w-3xl">{children}</div>

        {/* Sticky action bar */}
        <div className="sticky bottom-0 bg-background border-t mt-8 -mx-6 px-6 py-4 flex items-center justify-end gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {submitLabel}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
