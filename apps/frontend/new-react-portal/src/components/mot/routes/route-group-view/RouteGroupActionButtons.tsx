'use client';

import React from 'react';
import {
  Edit,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@busmate/ui';

interface RouteGroupActionButtonsProps {
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

/**
 * Route group page action buttons.
 *
 * Wraps the shared `<Button>` and `<DropdownMenu>` components
 * with route-group-specific actions.
 */
export function RouteGroupActionButtons({
  onEdit,
  onDelete,
  isDeleting = false,
}: RouteGroupActionButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Edit — sm+ only */}
      <Button variant="outline" onClick={onEdit} disabled={isDeleting} className="hidden sm:inline-flex">
        <Edit className="h-4 w-4" />
        Edit
      </Button>

      {/* Delete — sm+ only */}
      <Button variant="destructive" onClick={onDelete} disabled={isDeleting} className="hidden sm:inline-flex">
        <Trash2 className="h-4 w-4" />
        {isDeleting ? 'Deleting...' : 'Delete'}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="sm:hidden">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit} disabled={isDeleting}>
            <Edit className="h-3.5 w-3.5" />
            Edit Route Group
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} disabled={isDeleting} className="text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
            {isDeleting ? 'Deleting...' : 'Delete Route Group'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
