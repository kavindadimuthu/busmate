import * as React from "react";
import { FilterBar, FilterSelect } from "../../patterns/filter-bar";
import type { ResourceConfig, ResourceController } from "../types";

export interface ResourceFiltersProps<TRow, TFilters extends Record<string, any>> {
  resource: ResourceConfig<TRow, TFilters>;
  controller: ResourceController<TRow, TFilters>;
  className?: string;
}

/** L2 block: search box + one FilterSelect per FilterFieldDef, wired to the resource controller. */
export function ResourceFilters<TRow, TFilters extends Record<string, any>>({
  resource,
  controller,
  className,
}: ResourceFiltersProps<TRow, TFilters>) {
  const fields = resource.filters ?? [];

  return (
    <FilterBar
      className={className}
      searchValue={controller.state.searchQuery}
      onSearchChange={controller.setSearch}
      searchPlaceholder={resource.searchPlaceholder}
      activeFilterCount={controller.activeFilterCount}
      onClearAll={fields.length > 0 ? controller.clearFilters : undefined}
    >
      {fields.length > 0 &&
        fields.map((f) => {
          const raw = f.optionsKey ? controller.filterOptions[f.optionsKey] : f.options;
          const options = f.mapOption && Array.isArray(raw) ? raw.map(f.mapOption) : ((raw as { value: string; label: string }[]) ?? []);
          return (
            <FilterSelect
              key={f.key}
              label={f.label}
              value={(controller.state.filters as Record<string, any>)[f.key] ?? "__all__"}
              onChange={(value) => controller.setFilters({ [f.key]: value } as Partial<TFilters>)}
              options={options}
              placeholder={f.placeholder ?? `All ${f.label}`}
              className={f.width}
            />
          );
        })}
      {resource.renderExtraFilters?.(controller)}
    </FilterBar>
  );
}
