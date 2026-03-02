'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';

// ── Variant styling ───────────────────────────────────────────────

/**
 * Visual variants available for `<ActionButton>`.
 *
 * | Variant     | Appearance                        |
 * |-------------|-----------------------------------|
 * | `primary`   | Solid blue background, white text |
 * | `secondary` | White with border                 |
 * | `ghost`     | Light-blue tinted background      |
 * | `warning`   | Orange-tinted background          |
 * | `danger`    | Red-tinted background             |
 * | `success`   | Green-tinted background           |
 */
export type ActionButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'warning'
  | 'danger'
  | 'success';

const VARIANT_CLS: Record<ActionButtonVariant, string> = {
  primary:
    'bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-blue-500',
  secondary:
    'border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 focus-visible:ring-gray-400',
  ghost:
    'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 active:bg-blue-200 focus-visible:ring-blue-400',
  warning:
    'border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:border-orange-300 active:bg-orange-200 focus-visible:ring-orange-400',
  danger:
    'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300 active:bg-red-200 focus-visible:ring-red-400',
  success:
    'border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-300 active:bg-green-200 focus-visible:ring-green-400',
};

// ── ActionButton ──────────────────────────────────────────────────

export interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon rendered to the left of the label. */
  icon?: React.ReactNode;
  /** Button label text. */
  label: string;
  /** Visual variant. @default "secondary" */
  variant?: ActionButtonVariant;
  /** Optional numeric badge shown after the label. */
  badge?: number;
}

/**
 * Reusable action button with icon, label, optional badge, and multiple
 * visual variants.
 *
 * @example
 * ```tsx
 * <ActionButton
 *   icon={<Plus className="h-4 w-4" />}
 *   label="Add Item"
 *   variant="primary"
 *   onClick={handleAdd}
 * />
 * ```
 */
export function ActionButton({
  icon,
  label,
  variant = 'secondary',
  badge,
  className = '',
  disabled,
  ...rest
}: ActionButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled}
      className={`
        relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium
        transition-all duration-150 ease-in-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        ${VARIANT_CLS[variant]}
        ${className}
      `}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-0.5 inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] rounded-full bg-white/30 text-[10px] font-bold px-1">
          {badge}
        </span>
      )}
    </button>
  );
}

// ── OverflowMenu ──────────────────────────────────────────────────

/** Descriptor for a single overflow-menu item. */
export interface OverflowMenuItem {
  /** Icon rendered to the left of the label. */
  icon: React.ReactNode;
  /** Menu-item label. */
  label: string;
  /** Callback fired when the item is clicked. */
  onClick: () => void;
  /** Whether the item is disabled. */
  disabled?: boolean;
  /** Visual variant (affects text/hover colours). */
  variant?: 'default' | 'warning' | 'danger';
}

interface OverflowMenuProps {
  /** Menu items to display. */
  items: OverflowMenuItem[];
  /** Extra class names applied to the wrapper `<div>`. */
  className?: string;
}

/**
 * Dropdown overflow menu for secondary actions.
 *
 * Typically used on small screens when there is not enough space to
 * display every `<ActionButton>` inline.
 *
 * @example
 * ```tsx
 * <OverflowMenu
 *   items={[
 *     { icon: <Upload className="h-3.5 w-3.5" />, label: 'Import', onClick: onImport },
 *     { icon: <Download className="h-3.5 w-3.5" />, label: 'Export', onClick: onExport },
 *   ]}
 * />
 * ```
 */
export function OverflowMenu({ items, className = '' }: OverflowMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const variantStyles: Record<string, string> = {
    default: 'text-gray-700 hover:bg-gray-50',
    warning: 'text-orange-700 hover:bg-orange-50',
    danger:  'text-red-700 hover:bg-red-50',
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="More actions"
        aria-expanded={open}
        className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-400"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[168px] rounded-xl border border-gray-100 bg-white shadow-lg py-1.5 ring-1 ring-black/5">
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              className={`
                w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-left
                transition-colors duration-100
                disabled:opacity-50 disabled:cursor-not-allowed
                ${variantStyles[item.variant ?? 'default']}
              `}
            >
              <span className="shrink-0 opacity-70">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ActionButtonsContainer ────────────────────────────────────────

export interface ActionButtonsContainerProps {
  /** Visible `<ActionButton>` elements rendered inline. */
  children: React.ReactNode;
  /**
   * Optional overflow items shown inside a `<OverflowMenu>`.
   * Pass this to collapse secondary actions on smaller screens.
   */
  overflowItems?: OverflowMenuItem[];
  /**
   * CSS breakpoint class at which the overflow menu is hidden.
   *
   * For example, `"sm:hidden"` hides the overflow menu on `sm+` screens.
   *
   * @default "sm:hidden"
   */
  overflowBreakpoint?: string;
  /** Extra class names applied to the wrapper `<div>`. */
  className?: string;
}

/**
 * Horizontal container for `<ActionButton>` components with an optional
 * responsive `<OverflowMenu>`.
 *
 * @example
 * ```tsx
 * <ActionButtonsContainer
 *   overflowItems={[
 *     { icon: <Upload className="h-3.5 w-3.5" />, label: 'Import', onClick: onImport },
 *   ]}
 * >
 *   <ActionButton icon={<Plus className="h-4 w-4" />} label="Add" variant="primary" onClick={onAdd} />
 *   <ActionButton icon={<Download className="h-4 w-4" />} label="Export" onClick={onExport} className="hidden sm:inline-flex" />
 * </ActionButtonsContainer>
 * ```
 */
export function ActionButtonsContainer({
  children,
  overflowItems,
  overflowBreakpoint = 'sm:hidden',
  className = '',
}: ActionButtonsContainerProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {children}
      {overflowItems && overflowItems.length > 0 && (
        <OverflowMenu items={overflowItems} className={overflowBreakpoint} />
      )}
    </div>
  );
}
