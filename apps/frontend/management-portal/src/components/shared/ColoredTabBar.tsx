'use client';

import React from 'react';

export interface ColoredTab<T extends string = string> {
  key: T;
  label: string;
  icon: React.ReactNode;
}

export interface ColoredTabBarProps<T extends string = string> {
  tabs: ColoredTab<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  colorClass: (tab: T, isActive: boolean) => string;
  counts?: Partial<Record<T, number>>;
  /** Optional trailing element rendered on the right side of the tab bar. */
  trailing?: React.ReactNode;
}

export function ColoredTabBar<T extends string = string>({
  tabs, activeTab, onTabChange, colorClass, counts, trailing,
}: ColoredTabBarProps<T>) {
  return (
    <div className="flex items-center justify-between border-b border-border">
      <div className="flex">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive ? colorClass(tab.key, true) : `border-transparent ${colorClass(tab.key, false)}`
              }`}
            >
              {tab.icon}
              {tab.label}
              {counts && counts[tab.key] !== undefined && (
                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-card/60 font-semibold' : 'bg-muted text-muted-foreground'
                }`}>
                  {counts[tab.key]}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {trailing}
    </div>
  );
}
