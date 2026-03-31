'use client';

import React from 'react';
import { Trash2, CheckCircle2, MoreHorizontal } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@busmate/ui';

interface NotificationDetailActionsProps {
  isReceived: boolean;
  isRead: boolean;
  onToggleRead: () => void;
  onDelete: () => void;
  hasNotification: boolean;
}

export function NotificationDetailActions({
  isReceived,
  isRead,
  onToggleRead,
  onDelete,
  hasNotification,
}: NotificationDetailActionsProps) {
  if (!hasNotification) return null;

  return (
    <div className="flex items-center gap-2">
      {isReceived && (
        <Button
          variant={isRead ? 'success' : 'outline'}
          onClick={onToggleRead}
          className="hidden sm:inline-flex"
        >
          <CheckCircle2 className="h-4 w-4" />
          {isRead ? 'Marked as Read' : 'Mark as Read'}
        </Button>
      )}
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
          {isReceived && (
            <DropdownMenuItem onClick={onToggleRead}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isRead ? 'Marked as Read' : 'Mark as Read'}
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
