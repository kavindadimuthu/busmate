---
description: "Use when creating, modifying, or reviewing any file in the BusMate UI library (libs/ui). Covers all naming conventions: files, components, props, hooks, CVA variants, data attributes, context/providers, types, constants, CSS tokens, exports, Storybook stories, and pattern/layout directory structure."
applyTo: "libs/ui/**"
---

# BusMate UI Library — Naming Conventions

These rules apply to every file under `libs/ui/`. Follow them strictly when generating, modifying, or suggesting code in the BusMate UI library.

---

## 1. File Naming — always `kebab-case`

| File type | Pattern | Examples |
|-----------|---------|---------|
| Component | `{name}.tsx` | `button.tsx`, `alert-dialog.tsx`, `form-wrapper.tsx` |
| Story | `{name}.stories.tsx` | `button.stories.tsx`, `data-table.stories.tsx` |
| Hook | `use-{feature}.ts` | `use-media-query.ts`, `use-mobile.ts`, `use-data-table.ts` |
| Types | `types.ts` | `types.ts` (per pattern directory) |
| Barrel | `index.ts` | `index.ts` (per directory) |
| Utility | `utils.ts` | `utils.ts` |
| Theme/registry | `{name}.ts` or `{name}.tsx` | `theme-registry.ts`, `theme-personality-provider.tsx` |
| Style | `{name}.css` | `globals.css`, `base.css`, `default.css`, `ocean.css`, `slate.css` |

**Never** use PascalCase or `camelCase` for file names inside `libs/ui/`.

---

## 2. Component Naming — `PascalCase`

### 2.1 Base shadcn/ui primitive components
Single-export components use the component name directly.

```tsx
// ✅ correct
export { Button } from "./components/button";
export { Badge, badgeVariants } from "./components/badge";
```

### 2.2 Compound component families
All members of a compound family share the root name as a prefix.

```tsx
// Accordion family
Accordion, AccordionItem, AccordionTrigger, AccordionContent

// Card family
Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, CardAction

// Table family
Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption

// Select family
Select, SelectTrigger, SelectContent, SelectValue, SelectItem, SelectGroup, SelectLabel

// Dialog family
Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter

// Avatar family
Avatar, AvatarImage, AvatarFallback, AvatarBadge, AvatarGroup
```

### 2.3 Pattern components
Named after the domain concept they represent.

```tsx
// data-table pattern
DataTable, DataTablePagination

// form pattern
FormWrapper, FormSection, FormGrid

// stats-card pattern
StatsCard, StatsCardGrid

// other patterns
StatusBadge, EmptyState, ActivityLog, FilterBar, FilterSelect
```

### 2.4 Layout components

```tsx
AppShell, MobileAppShell, ResponsiveShell
Sidebar, Header, PageContainer, Section
```

---

## 3. Prop Interface Naming — `{Component}Props`

Always name the props interface `{Component}Props`. Extend `React.ComponentProps<"element">` or `VariantProps` from CVA where applicable.

```tsx
// ✅ base component
interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

// ✅ layout component
interface AppShellProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
  sidebarCollapsed?: boolean;
}

// ✅ generic pattern component
interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  totalItems: number;
}

// ✅ React Hook Form–connected component
interface FormWrapperProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  onSubmit: (values: T) => void;
  children: React.ReactNode;
}

// ✅ pattern component
interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; direction: "up" | "down" };
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}
```

---

## 4. Hook Naming

| Part | Convention | Examples |
|------|-----------|---------|
| Function name | `use{Feature}` camelCase | `useMediaQuery`, `useMobile`, `useDataTable`, `useThemePersonality` |
| File name | `use-{feature}.ts` kebab-case | `use-media-query.ts`, `use-data-table.ts` |
| State return type | `{Feature}State` | `DataTableState` |
| Options parameter type | `Use{Hook}Options` | `UseDataTableOptions` |
| Return type (combined) | `{Feature}State & methods` (inline) | — |

```ts
// ✅ hook signature
export function useMediaQuery(query: string): boolean

export function useMobile(): boolean

export function useDataTable<TFilter = Record<string, unknown>>(
  options?: UseDataTableOptions<TFilter>,
): DataTableState<TFilter> & {
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSort: (column: string, direction: "asc" | "desc") => void;
  setFilters: (filters: Partial<TFilter>) => void;
  clearFilters: () => void;
  setSearch: (query: string) => void;
  toggleRow: (id: string) => void;
  toggleAll: (ids: string[]) => void;
}
```

---

## 5. CVA Variant Functions — `{component}Variants` camelCase

Name CVA functions after the component in `camelCase`, suffixed with `Variants`. Always export both the component and its variants from the same file.

```tsx
// ✅ naming and export pattern
const buttonVariants = cva("base styles", {
  variants: {
    variant: {
      default: "...",
      destructive: "...",
      outline: "...",
      secondary: "...",
      ghost: "...",
      link: "...",
      success: "...",
    },
    size: {
      default: "...",
      xs: "...",
      sm: "...",
      lg: "...",
      icon: "...",
      "icon-xs": "...",
      "icon-sm": "...",
      "icon-lg": "...",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export { Button, buttonVariants };
```

- **Variant keys** (e.g. `variant`, `size`): `camelCase`
- **Variant values** (e.g. `"icon-sm"`, `"default"`): `kebab-case` quoted strings
- **CVA function**: `camelCase` → `buttonVariants`, `badgeVariants`

---

## 6. Data Attributes

Every component's root element must have `data-slot="{component-name}"`. Sub-parts of compound components use `data-slot="{component-name}-{part}"`.

```tsx
// ✅ root element
<button data-slot="button" ... />
<div data-slot="card" ... />

// ✅ compound sub-parts (kebab-case, matching compound member name)
<div data-slot="card-header" ... />
<div data-slot="card-content" ... />
<tr data-slot="table-row" ... />
<div data-slot="accordion-trigger" ... />
<button data-slot="select-trigger" ... />
```

Additional state/variant attributes (kebab-case values):

```tsx
data-variant="primary"
data-size="sm"
data-state="open"   // from Radix primitives
```

---

## 7. Context & Provider Naming

| Part | Convention | Example |
|------|-----------|---------|
| Context object | `{Feature}Context` | `ThemePersonalityContext` |
| Provider component | `{Feature}Provider` | `ThemePersonalityProvider` |
| Provider props | `{Feature}ProviderProps` | `ThemePersonalityProviderProps` |
| Context value interface | `{Feature}ContextValue` | `ThemePersonalityContextValue` |
| Usage hook | `use{Feature}` | `useThemePersonality` |

```tsx
// ✅ full pattern
interface ThemePersonalityContextValue {
  personality: ThemePersonality;
  setPersonality: (theme: ThemePersonality) => void;
  themes: readonly ThemeConfig[];
}

const ThemePersonalityContext =
  React.createContext<ThemePersonalityContextValue | null>(null);

export function ThemePersonalityProvider({
  children,
  defaultPersonality = DEFAULT_PERSONALITY,
}: ThemePersonalityProviderProps) { ... }

export function useThemePersonality(): ThemePersonalityContextValue { ... }
```

---

## 8. Types & Interfaces

| Category | Convention | Examples |
|----------|-----------|---------|
| Domain model | `PascalCase` | `NavItem`, `NavGroup`, `ActivityItem`, `ColumnDef`, `ThemeConfig` |
| State interface | `{Feature}State` | `DataTableState` |
| Options interface | `Use{Hook}Options` | `UseDataTableOptions` |
| Union type alias | `PascalCase` | `ThemePersonality`, `StatusType` |
| Union values | `kebab-case` quoted strings | `"default" \| "ocean" \| "slate"`, `"in-progress"` |

```ts
// ✅ domain model
interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
  disabled?: boolean;
}

// ✅ state interface
interface DataTableState<TFilter = Record<string, unknown>> {
  page: number;
  pageSize: number;
  sortColumn: string | null;
  sortDirection: "asc" | "desc";
  filters: TFilter;
  selectedRows: Set<string>;
  searchQuery: string;
}

// ✅ union type alias
export type ThemePersonality = "default" | "ocean" | "slate";

type StatusType =
  | "active"
  | "inactive"
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled"
  | "expired"
  | "draft"
  | "in-progress"
  | "warning"
  | "error"
  | "info";
```

---

## 9. Constants

| Category | Convention | Examples |
|----------|-----------|---------|
| Exported constants | `UPPER_SNAKE_CASE` | `DEFAULT_PERSONALITY`, `MOBILE_BREAKPOINT`, `PERSONALITY_STORAGE_KEY`, `THEMES` |
| Internal lookup maps | `camelCase` | `statusConfig`, `hideBelowMap` |
| Internal config objects | `camelCase` | `statusConfig` |

```ts
// ✅ exported constants
const DEFAULT_PERSONALITY = "default" as const;
const PERSONALITY_STORAGE_KEY = "busmate-theme-personality";
const MOBILE_BREAKPOINT = 768;

export const THEMES: readonly ThemeConfig[] = [
  {
    id: "default",
    label: "Default",
    description: "BusMate Blue — the classic brand theme",
    previewColor: "hsl(221 83% 53%)",
  },
] as const;

// ✅ internal maps (camelCase)
const statusConfig: Record<StatusType, { label: string; className: string }> = {
  active: { label: "Active", className: "..." },
};

const hideBelowMap: Record<string, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
};
```

---

## 10. CSS Custom Properties & Design Tokens

All CSS custom properties use `--kebab-case`.

### 10.1 Semantic tokens

```css
/* Color roles */
--primary            --primary-foreground
--secondary          --secondary-foreground
--destructive        --destructive-foreground
--success            --success-foreground
--muted              --muted-foreground
--accent             --accent-foreground
--background         --foreground
--card               --card-foreground
--popover            --popover-foreground
--border             --input             --ring

/* Sidebar-specific */
--sidebar            --sidebar-foreground
--sidebar-active     --sidebar-muted

/* Charts */
--chart-1  --chart-2  --chart-3  --chart-4  --chart-5

/* Layout */
--radius             --width-68

/* Typography */
--font-sans          --font-mono
```

### 10.2 Primitive base tokens (non-semantic, in `tokens/base.css`)

```css
--gray-50: 240 5% 96%;
--gray-500: 240 4% 46%;
--green-500: 160 84% 39%;
--red-500: 0 84% 60%;
/* pattern: --{color}-{shade} */
```

### 10.3 Theme scoping (in `styles/themes/`)

```css
[data-theme="default"] { /* light */ }
[data-theme="default"].dark { /* dark */ }
[data-theme="ocean"] { ... }
[data-theme="ocean"].dark { ... }
[data-theme="slate"] { ... }
[data-theme="slate"].dark { ... }
```

### 10.4 Style directory structure

```
styles/
├── globals.css          ← entry point, uses @import
├── tokens/
│   └── base.css         ← non-color design tokens only
└── themes/
    ├── default.css
    ├── ocean.css
    └── slate.css
```

---

## 11. Export Patterns

### 11.1 Main `src/index.ts` — named exports, grouped with section comments

```ts
// ── Utilities ─────────────────────────────────────────────────────────────────
export { cn } from "./lib/utils";

// ── Hooks ─────────────────────────────────────────────────────────────────────
export { useMediaQuery, useMobile } from "./hooks";

// ── Context ───────────────────────────────────────────────────────────────────
export {
  ThemePersonalityProvider,
  useThemePersonality,
} from "./context/theme-personality-provider";

// ── Base Components (shadcn/ui primitives) ────────────────────────────────────
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./components/accordion";

export { Badge, badgeVariants } from "./components/badge";
export { Button, buttonVariants } from "./components/button";
// ...

// ── Patterns ──────────────────────────────────────────────────────────────────
export {
  DataTable,
  DataTablePagination,
  useDataTable,
} from "./patterns/data-table";

// ── Layouts ───────────────────────────────────────────────────────────────────
export { AppShell } from "./layouts/app-shell";
```

### 11.2 Pattern `index.ts` — export component + hook + types together

```ts
// patterns/data-table/index.ts
export { DataTable } from "./data-table";
export { DataTablePagination } from "./data-table-pagination";
export { useDataTable } from "./use-data-table";
export type { ColumnDef, DataTableProps, DataTableState, UseDataTableOptions } from "./types";
```

**Rules:**
- Always use **named exports** — no default exports for components, hooks, or types
- Always re-export types with `export type { ... }`

---

## 12. Storybook Conventions

### 12.1 File structure

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { ComponentName } from "./component-name";

const meta: Meta<typeof ComponentName> = {
  title: "Components/Category/ComponentName",
  component: ComponentName,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline"],
    },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "lg", "icon"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ComponentName>;

export const Default: Story = {
  args: { children: "Label" },
};
```

### 12.2 Title hierarchy

| Tier | Pattern | Examples |
|------|---------|---------|
| Base components | `"Components/{Category}/{Name}"` | `"Components/Form/Button"`, `"Components/Display/Badge"`, `"Components/Display/Table"` |
| Pattern components | `"Patterns/{Name}"` | `"Patterns/DataTable"`, `"Patterns/StatsCard"` |
| Layout components | `"Layouts/{Name}"` | `"Layouts/AppShell"`, `"Layouts/Sidebar"` |
| Documentation | `"Docs/{Title}"` | — |

### 12.3 Story export names — `PascalCase`, descriptive

Describe the variant or state shown, not the props used.

```ts
// ✅
Default, Secondary, Destructive, Outline, Ghost
WithIcon, WithTrailingIcon, Loading, Disabled
Small, Large
AllVariants
Simple
```

### 12.4 Rules
- Always declare `argTypes` for every `variant` and `size` prop with `control: "select"` and an explicit `options` array
- Use `type Story = StoryObj<typeof ComponentName>` — never `StoryObj<ComponentNameProps>` directly
- Always `export default meta`

---

## 13. Pattern & Layout Directory Structure

### 13.1 Pattern directories (`src/patterns/{name}/`)

Each pattern lives in its own `kebab-case` subdirectory:

```
patterns/
├── data-table/
│   ├── data-table.tsx            ← main component
│   ├── data-table-pagination.tsx ← sub-component (kebab-case suffix)
│   ├── data-table.stories.tsx
│   ├── use-data-table.ts         ← co-located hook
│   ├── types.ts
│   └── index.ts
├── form/
│   ├── form-wrapper.tsx
│   ├── form-section.tsx
│   ├── form-grid.tsx
│   ├── form.stories.tsx
│   └── index.ts
├── stats-card/
│   ├── stats-card.tsx
│   ├── stats-card-grid.tsx
│   ├── stats-card.stories.tsx
│   └── index.ts
├── status-badge/
├── empty-state/
├── activity-log/
├── filter-bar/
└── dialogs/
```

**Rules:**
- Pattern directory name: `kebab-case` matching the primary component name
- Sub-components: `{pattern-name}-{sub-name}.tsx` (e.g. `data-table-pagination.tsx`)
- Always include `index.ts` — no direct deep imports
- Co-locate the pattern's hook inside the pattern directory, not in `src/hooks/`

### 13.2 Layout directories (`src/layouts/`)

```
layouts/
├── app-shell.tsx
├── app-shell.stories.tsx
├── mobile-app-shell.tsx
├── responsive-shell.tsx
├── responsive-shell.stories.tsx
├── index.ts
├── content/
│   ├── page-container.tsx
│   ├── section.tsx
│   └── index.ts
├── header/
│   ├── header.tsx
│   ├── header.stories.tsx
│   ├── types.ts
│   └── index.ts
└── sidebar/
    ├── sidebar.tsx
    ├── sidebar.stories.tsx
    ├── types.ts
    └── index.ts
```

---

## 14. Quick Reference — Casing Summary

| Element | Convention | Example |
|---------|-----------|---------|
| All files | `kebab-case` | `form-wrapper.tsx`, `use-mobile.ts` |
| Components | `PascalCase` | `Button`, `DataTable`, `AppShell` |
| Compound sub-components | `PascalCase`, prefixed | `CardHeader`, `TableRow`, `AccordionTrigger` |
| Prop interfaces | `{Component}Props` | `ButtonProps`, `DataTableProps` |
| Hook functions | `use{Feature}` | `useMediaQuery`, `useDataTable` |
| Hook files | `use-{feature}.ts` | `use-data-table.ts` |
| State interfaces | `{Feature}State` | `DataTableState` |
| Options interfaces | `Use{Hook}Options` | `UseDataTableOptions` |
| Domain model types | `PascalCase` | `NavItem`, `ActivityItem`, `ColumnDef` |
| Union type aliases | `PascalCase` | `ThemePersonality`, `StatusType` |
| Union values | `kebab-case` quoted | `"default"`, `"in-progress"` |
| Exported constants | `UPPER_SNAKE_CASE` | `DEFAULT_PERSONALITY`, `THEMES` |
| Internal maps/configs | `camelCase` | `statusConfig`, `hideBelowMap` |
| CVA functions | `{component}Variants` camelCase | `buttonVariants`, `badgeVariants` |
| Context objects | `{Feature}Context` | `ThemePersonalityContext` |
| Provider components | `{Feature}Provider` | `ThemePersonalityProvider` |
| Context value types | `{Feature}ContextValue` | `ThemePersonalityContextValue` |
| CSS custom properties | `--kebab-case` | `--primary`, `--sidebar-foreground` |
| `data-slot` values | `kebab-case` | `data-slot="card-header"` |
| Story titles | `"Category/Name"` | `"Components/Form/Button"` |
| Story exports | `PascalCase` descriptive | `Default`, `WithIcon`, `Loading` |
| Pattern directories | `kebab-case` | `data-table/`, `stats-card/` |
| Layout sub-directories | `kebab-case` | `sidebar/`, `header/`, `content/` |
