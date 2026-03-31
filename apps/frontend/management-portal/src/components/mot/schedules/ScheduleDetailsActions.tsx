'use client';

import React from 'react';
import { Edit, Trash2, Power, Copy, RefreshCw, MoreHorizontal } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@busmate/ui';

interface ScheduleDetailsActionsProps {
  status?: string;
  onRefresh: () => void;
  onClone: () => void;
  onDeactivate: () => void;
  onActivate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ScheduleDetailsActions({
  status,
  onRefresh,
  onClone,
  onDeactivate,
  onActivate,
  onEdit,
  onDelete,
}: ScheduleDetailsActionsProps) {
  const isActive = status === 'ACTIVE';

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={onRefresh} className="hidden sm:inline-flex">
        <RefreshCw className="h-4 w-4" />
        Refresh
      </Button>
      <Button variant="outline" onClick={onClone} className="hidden sm:inline-flex">
        <Copy className="h-4 w-4" />
        Clone
      </Button>
      {isActive ? (
        <Button variant="outline" className="hidden sm:inline-flex border-orange-200 text-orange-700 hover:bg-orange-50" onClick={onDeactivate}>
          <Power className="h-4 w-4" />
          Deactivate
        </Button>
      ) : (
        <Button variant="success" onClick={onActivate} className="hidden sm:inline-flex">
          <Power className="h-4 w-4" />
          Activate
        </Button>
      )}
      <Button onClick={onEdit} className="hidden sm:inline-flex">
        <Edit className="h-4 w-4" />
        Edit
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
          <DropdownMenuItem onClick={onRefresh}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onClone}>
            <Copy className="h-3.5 w-3.5" />
            Clone
          </DropdownMenuItem>
          {isActive ? (
            <DropdownMenuItem onClick={onDeactivate} className="text-orange-700">
              <Power className="h-3.5 w-3.5" />
              Deactivate
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={onActivate}>
              <Power className="h-3.5 w-3.5" />
              Activate
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="h-3.5 w-3.5" />
            Edit
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
