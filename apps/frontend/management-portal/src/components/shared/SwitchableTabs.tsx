'use client';

import React from 'react';

// ── Tab descriptor ────────────────────────────────────────────────

/** Descriptor for a single tab item. */
export interface TabItem<T extends string = string> {
  /** Unique identifier for the tab (used as the value). */
  id: T;
  /** Visible label text. */
  label: string;
  /**
   * Optional Lucide icon component or ReactNode rendered before the label.
   * Accepts either a Lucide `Icon` (rendered automatically) or a ReactNode.
   */
  icon?: React.ComponentType<{ className?: string }>;
  /** Optional badge count displayed to the right of the label. */
  count?: number;
}

// ── Props ─────────────────────────────────────────────────────────

export interface SwitchableTabsProps<T extends string = string> {
  /** Array of tab descriptors. */
  tabs: TabItem<T>[];
  /** Currently active tab id. */
  activeTab: T;
  /** Callback fired when a tab is clicked. */
  onTabChange: (tab: T) => void;
  /** ARIA label for the tablist container. @default "View switcher" */
  ariaLabel?: string;
  /** Extra class names applied to the outer wrapper. */
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────

/**
 * Pill-shaped switchable tabs component.
 *
 * Renders a horizontal list of tab buttons inside a rounded container.
 * Each tab can have an icon, a label, and an optional badge count.
 *
 * Generic over `T` so the active tab id is strongly typed.
 *
 * @example
 * ```tsx
 * import { LayoutList, Map } from 'lucide-react';
 *
 * type View = 'table' | 'map';
 *
 * <SwitchableTabs<View>
 *   tabs={[
 *     { id: 'table', label: 'List View', icon: LayoutList, count: 42 },
 *     { id: 'map',   label: 'Map View',  icon: Map,        count: 42 },
 *   ]}
 *   activeTab={currentView}
 *   onTabChange={setCurrentView}
 * />
 * ```
 */
export function SwitchableTabs<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  ariaLabel = 'View switcher',
  className = '',
}: SwitchableTabsProps<T>) {
  return (
    <div className={`flex items-center ${className}`}>
      <div
        className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-xl"
        role="tablist"
        aria-label={ariaLabel}
      >
        {tabs.map(({ id, label, icon: Icon, count }) => {
          const isActive = activeTab === id;

          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(id)}
              className={[
                'relative inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                'transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
                isActive
                  ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/[0.06]'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-white/60',
              ].join(' ')}
            >
              {Icon && (
                <Icon
                  className={[
                    'h-4 w-4 shrink-0 transition-colors duration-200',
                    isActive ? 'text-blue-600' : 'text-gray-400',
                  ].join(' ')}
                  aria-hidden="true"
                />
              )}
              <span>{label}</span>
              {count !== undefined && count > 0 && (
                <span
                  className={[
                    'inline-flex items-center justify-center min-w-[1.4rem] h-5 px-1.5 rounded-full text-[11px] font-semibold transition-colors duration-200',
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-200 text-gray-500',
                  ].join(' ')}
                >
                  {count.toLocaleString()}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
