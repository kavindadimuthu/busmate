'use client';

import React from 'react';
import { LayoutList, Map } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@busmate/ui';

export type ViewType = 'table' | 'map';

interface ViewTabsProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

/**
 * Bus-stop view switcher — table / map.
 */
export function ViewTabs({
  activeView,
  onViewChange,
}: ViewTabsProps) {
  return (
    <Tabs value={activeView} onValueChange={(v) => onViewChange(v as ViewType)}>
      <TabsList>
        <TabsTrigger value="table"><LayoutList className="h-4 w-4" /> List View</TabsTrigger>
        <TabsTrigger value="map"><Map className="h-4 w-4" /> Map View</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}