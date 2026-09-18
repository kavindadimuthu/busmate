'use client';

import React from 'react';
import { ArrowLeft, Edit, Trash2, RefreshCw, MoreHorizontal, PauseCircle, PlayCircle, Archive } from 'lucide-react';
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
  /** Recorded permit status; decides which of suspend / reinstate / withdraw apply (INC-017). */
  status?: string;
  onSuspend?: () => void;
  onReinstate?: () => void;
  onWithdraw?: () => void;
}

export function PermitDetailsActions({
  onBack,
  onRefresh,
  onEdit,
  onDelete,
  status,
  onSuspend,
  onReinstate,
  onWithdraw,
}: PermitDetailsActionsProps) {
  const canSuspend = status === 'active';
  const canReinstate = status === 'inactive' || status === 'cancelled';
  const canWithdraw = status !== 'cancelled';
  return (
    <div className="flex items-center gap-2">
      {canSuspend && onSuspend && (
        <Button variant="outline" onClick={onSuspend} className="hidden sm:inline-flex">
          <PauseCircle className="h-4 w-4" />
          Suspend
        </Button>
      )}
      {canReinstate && onReinstate && (
        <Button variant="outline" onClick={onReinstate} className="hidden sm:inline-flex">
          <PlayCircle className="h-4 w-4" />
          Reinstate
        </Button>
      )}
      {canWithdraw && onWithdraw && (
        <Button variant="outline" onClick={onWithdraw} className="hidden sm:inline-flex">
          <Archive className="h-4 w-4" />
          Withdraw
        </Button>
      )}
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
          {canSuspend && onSuspend && (
            <DropdownMenuItem onClick={onSuspend}>
              <PauseCircle className="h-3.5 w-3.5" />
              Suspend
            </DropdownMenuItem>
          )}
          {canReinstate && onReinstate && (
            <DropdownMenuItem onClick={onReinstate}>
              <PlayCircle className="h-3.5 w-3.5" />
              Reinstate
            </DropdownMenuItem>
          )}
          {canWithdraw && onWithdraw && (
            <DropdownMenuItem onClick={onWithdraw}>
              <Archive className="h-3.5 w-3.5" />
              Withdraw
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
