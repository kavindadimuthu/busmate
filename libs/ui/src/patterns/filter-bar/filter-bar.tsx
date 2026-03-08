"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/input";
import { Button } from "@/components/button";
import { Search, X, SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode; // Filter select/date components
  activeFilterCount?: number;
  onClearAll?: () => void;
  className?: string;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  children,
  activeFilterCount = 0,
  onClearAll,
  className,
}: FilterBarProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>

        {/* Desktop: inline filters */}
        {isDesktop && children && (
          <div className="flex items-center gap-2">{children}</div>
        )}

        {/* Mobile: filter sheet */}
        {!isDesktop && children && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <SlidersHorizontal className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-4">{children}</div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && onClearAll && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-7 text-xs"
          >
            <X className="h-3 w-3 mr-1" /> Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
