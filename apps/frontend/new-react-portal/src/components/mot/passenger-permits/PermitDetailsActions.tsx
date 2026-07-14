'use client';

import React from 'react';
import { ArrowLeft, Edit, Trash2, RefreshCw, MoreHorizontal } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@busmate/ui';

interface PermitDetailsActionsProps {
  onBack: () => void;
  onRefresh: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function PermitDetailsActions({
  onBack,
  onRefresh,
  onEdit,
  onDelete,
}: PermitDetailsActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={onBack} className="hidden sm:inline-flex">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <Button variant="outline" onClick={onRefresh} className="hidden sm:inline-flex">
        <RefreshCw className="h-4 w-4" />
        Refresh
      </Button>
      <Button variant="outline" onClick={onEdit} className="hidden sm:inline-flex">
        <Edit className="h-4 w-4" />
        Edit Permit
      </Button>
      <Button variant="destructive" onClick={onDelete} className="hidden sm:inline-flex">
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="sm:hidden">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onBack}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onRefresh}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="h-3.5 w-3.5" />
            Edit Permit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
