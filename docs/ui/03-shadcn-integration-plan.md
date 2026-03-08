# 03 — shadcn/ui Integration Plan

> **Scope**: Complete guide to installing, configuring, and using shadcn/ui in the BusMate monorepo.
> **Goal**: Establish a proper shadcn/ui workflow that generates components into a shared UI library.

---

## Table of Contents

1. [Why shadcn/ui](#1-why-shadcnui)
2. [Architecture Decision: Shared UI Library](#2-architecture-decision-shared-ui-library)
3. [Installation & Configuration](#3-installation--configuration)
4. [Folder Structure](#4-folder-structure)
5. [Component Generation Workflow](#5-component-generation-workflow)
6. [Customization Rules](#6-customization-rules)
7. [Tailwind CSS v4 Integration](#7-tailwind-css-v4-integration)
8. [Migration from Current UI Components](#8-migration-from-current-ui-components)
9. [Common Pitfalls & Solutions](#9-common-pitfalls--solutions)

---

## 1. Why shadcn/ui

### What shadcn/ui Is

shadcn/ui is **not a component library** — it's a **component collection** that generates source code directly into your project. You own the code. You can modify it. There is no external dependency to update.

### Why It Fits BusMate

| Requirement | How shadcn/ui Addresses It |
|-------------|---------------------------|
| Full control over styling | Components are source code in your project |
| Radix UI accessibility | Built on Radix primitives (WCAG compliant) |
| Tailwind CSS native | Uses Tailwind + `class-variance-authority` (CVA) |
| Design token compatible | Uses CSS custom properties natively |
| Incremental adoption | Add components one at a time |
| No version lock-in | No `npm update` breaking changes |
| AI-agent friendly | Clear, predictable file structure and patterns |

### Current State vs. Target State

```
CURRENT STATE                          TARGET STATE
─────────────                          ────────────
17 manually copied ui/ components  →   Full shadcn/ui CLI setup
No components.json                 →   Proper components.json config
Hardcoded Tailwind colors          →   CSS variable tokens
Components in app directory        →   Shared libs/ui library
Mixed modification patterns        →   Clear customization rules
```

---

## 2. Architecture Decision: Shared UI Library

### Decision

Create a **shared UI library** at `libs/ui/` that:
- Contains all shadcn-generated components
- Contains custom patterns built on top of shadcn
- Contains the design token theme
- Is imported by all frontend apps (`management-portal`, `passenger-web`, future apps)

### Monorepo Package Structure

```
busmate/
├── libs/
│   ├── ui/                          # NEW — Shared UI library
│   │   ├── package.json             # @busmate/ui
│   │   ├── tsconfig.json
│   │   ├── project.json             # Nx project config
│   │   ├── components.json          # shadcn CLI config
│   │   ├── src/
│   │   │   ├── index.ts             # Main barrel export
│   │   │   ├── components/          # shadcn-generated components
│   │   │   ├── patterns/            # Reusable composed patterns
│   │   │   ├── layouts/             # Layout system components
│   │   │   ├── hooks/               # Shared UI hooks
│   │   │   └── lib/                 # Utilities (cn, etc.)
│   │   └── theme/                   # Design tokens (CSS files)
│   ├── api-clients/                 # Existing API clients
│   │   ├── route-management/
│   │   ├── ticketing-management/
│   │   └── location-tracking/
```

### Why a Shared Library (Not In-App)

| Approach | Pros | Cons |
|----------|------|------|
| **In-app** (`src/components/ui/`) | Simple setup | Not reusable across apps; `passenger-web` can't use it |
| **Shared library** (`libs/ui/`) | Reusable across all apps; single source of truth; enforces design system | Slightly more complex setup |

BusMate already has `libs/api-clients/` — the same pattern applies to UI components.

---

## 3. Installation & Configuration

### Step 1: Create the UI Library Directory

```bash
mkdir -p libs/ui/src/{components,patterns,layouts,hooks,lib}
mkdir -p libs/ui/theme/{tokens,semantic}
```

### Step 2: Create `libs/ui/package.json`

```json
{
  "name": "@busmate/ui",
  "version": "0.1.0",
  "private": true,
  "sideEffects": false,
  "type": "module",
  "exports": {
    ".": {
      "import": "./src/index.ts",
      "types": "./src/index.ts"
    },
    "./theme": {
      "import": "./theme/index.css"
    },
    "./components/*": {
      "import": "./src/components/*.tsx",
      "types": "./src/components/*.tsx"
    },
    "./patterns/*": {
      "import": "./src/patterns/*.tsx",
      "types": "./src/patterns/*.tsx"
    },
    "./layouts/*": {
      "import": "./src/layouts/*.tsx",
      "types": "./src/layouts/*.tsx"
    },
    "./hooks/*": {
      "import": "./src/hooks/*.tsx",
      "types": "./src/hooks/*.tsx"
    }
  },
  "dependencies": {
    "@radix-ui/react-accordion": "1.2.2",
    "@radix-ui/react-alert-dialog": "1.1.4",
    "@radix-ui/react-avatar": "1.1.2",
    "@radix-ui/react-checkbox": "1.1.3",
    "@radix-ui/react-collapsible": "1.1.2",
    "@radix-ui/react-dialog": "1.1.4",
    "@radix-ui/react-dropdown-menu": "2.1.4",
    "@radix-ui/react-label": "2.1.1",
    "@radix-ui/react-popover": "1.1.4",
    "@radix-ui/react-progress": "1.1.1",
    "@radix-ui/react-radio-group": "1.2.2",
    "@radix-ui/react-scroll-area": "1.2.2",
    "@radix-ui/react-select": "2.1.4",
    "@radix-ui/react-separator": "1.1.1",
    "@radix-ui/react-slider": "1.2.2",
    "@radix-ui/react-slot": "1.1.1",
    "@radix-ui/react-switch": "1.1.2",
    "@radix-ui/react-tabs": "1.1.2",
    "@radix-ui/react-toast": "1.2.4",
    "@radix-ui/react-toggle": "1.1.1",
    "@radix-ui/react-toggle-group": "1.1.1",
    "@radix-ui/react-tooltip": "1.1.6",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "1.0.4",
    "embla-carousel-react": "8.5.1",
    "input-otp": "1.4.1",
    "lucide-react": "^0.522.0",
    "react-day-picker": "^9.8.0",
    "react-resizable-panels": "^2.1.7",
    "recharts": "2.15.0",
    "sonner": "^1.7.1",
    "tailwind-merge": "^3.3.1",
    "vaul": "^1.1.2"
  },
  "peerDependencies": {
    "react": "^19",
    "react-dom": "^19",
    "tailwindcss": "^4"
  },
  "devDependencies": {
    "typescript": "^5"
  }
}
```

### Step 3: Create `libs/ui/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### Step 4: Create `libs/ui/components.json` (shadcn CLI Config)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "theme/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

> **Note**: We use the `"new-york"` style which is the more modern, compact variant.

### Step 5: Create `libs/ui/src/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Step 6: Create `libs/ui/project.json` (Nx Config)

```json
{
  "name": "ui",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/ui/src",
  "projectType": "library",
  "tags": ["scope:shared", "type:ui"]
}
```

### Step 7: Register in `tsconfig.base.json`

Add the path alias to the root `tsconfig.base.json`:

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@busmate/ui": ["libs/ui/src/index.ts"],
      "@busmate/ui/*": ["libs/ui/src/*"]
    }
  }
}
```

### Step 8: Register in `pnpm-workspace.yaml`

Ensure the workspace config includes:

```yaml
packages:
  - 'apps/**'
  - 'libs/**'    # libs/ui/ will be auto-discovered
  - 'tests/**'
```

### Step 9: Add to Management Portal's `tsconfig.json`

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@busmate/ui": ["../../../libs/ui/src/index.ts"],
      "@busmate/ui/*": ["../../../libs/ui/src/*"]
    }
  }
}
```

### Step 10: Add to `next.config.ts` transpilePackages

```typescript
transpilePackages: [
  '@busmate/ui',
  // ... existing packages
]
```

---

## 4. Folder Structure

### Complete `libs/ui/` Structure

```
libs/ui/
├── package.json                    # @busmate/ui package
├── tsconfig.json                   # TypeScript config
├── project.json                    # Nx project
├── components.json                 # shadcn CLI config
│
├── theme/                          # Design tokens (CSS)
│   ├── index.css                   # Master import
│   ├── tokens/
│   │   ├── colors.css              # Primitive color palette
│   │   ├── typography.css          # Font sizes, weights, families
│   │   ├── spacing.css             # Spacing scale
│   │   ├── radius.css              # Border radius scale
│   │   ├── shadows.css             # Shadow/elevation scale
│   │   └── animations.css          # Transitions, keyframes
│   └── semantic/
│       ├── colors-light.css        # Light mode semantic colors
│       ├── colors-dark.css         # Dark mode semantic colors
│       └── components.css          # Component-level tokens
│
├── src/
│   ├── index.ts                    # Main barrel export
│   │
│   ├── lib/
│   │   └── utils.ts                # cn() utility
│   │
│   ├── components/                 # shadcn-generated components
│   │   ├── accordion.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── button.tsx
│   │   ├── calendar.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── collapsible.tsx
│   │   ├── command.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── pagination.tsx
│   │   ├── popover.tsx
│   │   ├── progress.tsx
│   │   ├── radio-group.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── skeleton.tsx
│   │   ├── slider.tsx
│   │   ├── sonner.tsx
│   │   ├── switch.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   ├── toaster.tsx
│   │   ├── toggle.tsx
│   │   ├── toggle-group.tsx
│   │   └── tooltip.tsx
│   │
│   ├── patterns/                   # Composed patterns (see doc 06)
│   │   ├── data-table/
│   │   │   ├── data-table.tsx
│   │   │   ├── data-table-column-header.tsx
│   │   │   ├── data-table-pagination.tsx
│   │   │   ├── data-table-toolbar.tsx
│   │   │   └── index.ts
│   │   ├── filter-bar/
│   │   │   ├── filter-bar.tsx
│   │   │   ├── search-input.tsx
│   │   │   ├── filter-select.tsx
│   │   │   ├── filter-chips.tsx
│   │   │   └── index.ts
│   │   ├── stats-card/
│   │   │   ├── stats-card.tsx
│   │   │   ├── stats-card-grid.tsx
│   │   │   └── index.ts
│   │   ├── form-field/
│   │   │   ├── form-field.tsx
│   │   │   ├── form-section.tsx
│   │   │   └── index.ts
│   │   ├── confirm-dialog/
│   │   │   ├── confirm-dialog.tsx
│   │   │   └── index.ts
│   │   ├── status-badge/
│   │   │   ├── status-badge.tsx
│   │   │   └── index.ts
│   │   ├── page-header/
│   │   │   ├── page-header.tsx
│   │   │   ├── breadcrumbs.tsx
│   │   │   └── index.ts
│   │   ├── empty-state/
│   │   │   ├── empty-state.tsx
│   │   │   └── index.ts
│   │   └── loading-state/
│   │       ├── loading-state.tsx
│   │       ├── skeleton-table.tsx
│   │       ├── skeleton-card.tsx
│   │       └── index.ts
│   │
│   ├── layouts/                    # Layout system (see doc 05)
│   │   ├── app-shell.tsx           # Full app shell (sidebar + header + content)
│   │   ├── sidebar/
│   │   │   ├── sidebar.tsx
│   │   │   ├── sidebar-nav.tsx
│   │   │   ├── sidebar-item.tsx
│   │   │   ├── sidebar-group.tsx
│   │   │   └── index.ts
│   │   ├── header/
│   │   │   ├── header.tsx
│   │   │   ├── header-breadcrumbs.tsx
│   │   │   ├── header-actions.tsx
│   │   │   └── index.ts
│   │   ├── content/
│   │   │   ├── page-container.tsx
│   │   │   ├── section.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   └── hooks/                      # Shared UI hooks
│       ├── use-mobile.ts
│       ├── use-debounce.ts
│       ├── use-media-query.ts
│       └── index.ts
```

---

## 5. Component Generation Workflow

### Adding a New shadcn Component

```bash
# Run from the libs/ui/ directory
cd libs/ui

# Generate a component
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add table

# Generate multiple components at once
npx shadcn@latest add button card dialog input label select tabs textarea toast
```

The CLI reads `components.json` and places files into `src/components/`.

### Verification After Generation

After adding a component, verify:

1. **File location**: Component is in `libs/ui/src/components/`
2. **Import path**: Uses `@/lib/utils` (which maps to `libs/ui/src/lib/utils.ts`)
3. **CSS variables**: Uses `hsl(var(--primary))` syntax, not hardcoded colors
4. **Export**: Add to `libs/ui/src/index.ts` barrel export

### Barrel Export Pattern

```typescript
// libs/ui/src/index.ts

// ── Utilities ─────────────────────────────────────
export { cn } from './lib/utils';

// ── Base Components (shadcn) ──────────────────────
export { Button, buttonVariants } from './components/button';
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/card';
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './components/dialog';
export { Input } from './components/input';
export { Label } from './components/label';
export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from './components/select';
export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './components/table';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './components/tabs';
export { Badge, badgeVariants } from './components/badge';
export { Checkbox } from './components/checkbox';
export { Textarea } from './components/textarea';
export { Switch } from './components/switch';
export { Avatar, AvatarFallback, AvatarImage } from './components/avatar';
export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from './components/dropdown-menu';
// ... add more as needed

// ── Patterns ──────────────────────────────────────
export { DataTable } from './patterns/data-table';
export { FilterBar } from './patterns/filter-bar';
export { StatsCard, StatsCardGrid } from './patterns/stats-card';
export { ConfirmDialog } from './patterns/confirm-dialog';
export { StatusBadge } from './patterns/status-badge';
export { PageHeader } from './patterns/page-header';
export { EmptyState } from './patterns/empty-state';

// ── Layouts ───────────────────────────────────────
export { AppShell } from './layouts/app-shell';
export { Sidebar } from './layouts/sidebar';
export { Header } from './layouts/header';
export { PageContainer, Section } from './layouts/content';

// ── Hooks ─────────────────────────────────────────
export { useMobile } from './hooks/use-mobile';
export { useDebounce } from './hooks/use-debounce';
export { useMediaQuery } from './hooks/use-media-query';
```

---

## 6. Customization Rules

### RULE 1: Never Modify Generated File Content Directly

Generated shadcn components should remain **as close to the upstream source as possible** so they can be regenerated/updated.

```
❌ WRONG: Edit libs/ui/src/components/button.tsx to add BusMate-specific logic
✅ RIGHT: Create a wrapper in libs/ui/src/patterns/ that extends the button
```

### RULE 2: Extend via Composition, Not Modification

```tsx
// ❌ WRONG — modifying the generated button.tsx directly
// libs/ui/src/components/button.tsx
const buttonVariants = cva("...", {
  variants: {
    variant: {
      default: "...",
      busmate_action: "..." // ← Don't add custom variants here
    }
  }
});

// ✅ RIGHT — extend in a pattern file
// libs/ui/src/patterns/action-button.tsx
import { Button, type ButtonProps } from "../components/button";
import { cn } from "../lib/utils";

interface ActionButtonProps extends ButtonProps {
  icon?: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export function ActionButton({ icon: Icon, badge, children, className, ...props }: ActionButtonProps) {
  return (
    <Button className={cn("gap-2", className)} {...props}>
      {Icon && <Icon className="h-4 w-4" />}
      {children}
      {badge !== undefined && (
        <span className="ml-1 rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-xs">
          {badge}
        </span>
      )}
    </Button>
  );
}
```

### RULE 3: Allowed Modifications to Generated Components

The ONLY acceptable modifications to generated shadcn files:

| Modification | When Allowed |
|-------------|-------------|
| **Adding new CVA variants** | When the variant is part of the design system (e.g., adding `success`, `warning` button variants) |
| **Adjusting default tokens** | When aligning with BusMate design tokens |
| **Adding additional sizes** | When the design system requires sizes not in upstream |

Document all modifications with a comment:

```tsx
// BUSMATE-CUSTOM: Added success and warning variants for status actions
variant: {
  // ... upstream variants ...
  success: "bg-success text-success-foreground hover:bg-success/90",
  warning: "bg-warning text-warning-foreground hover:bg-warning/90",
}
```

### RULE 4: Token-Only Styling

All components must use CSS variables from the theme, never raw Tailwind colors:

```tsx
// ❌ WRONG
className="bg-blue-600 text-white hover:bg-blue-700"

// ✅ RIGHT
className="bg-primary text-primary-foreground hover:bg-primary/90"
```

### RULE 5: Domain Logic Stays in Feature Components

The UI library (`libs/ui/`) must be domain-agnostic:

```tsx
// ❌ WRONG — domain logic in UI library
// libs/ui/src/patterns/route-table.tsx
import { RouteManagementService } from "@busmate/api-client-route";

// ✅ RIGHT — domain logic in app feature component
// apps/frontend/management-portal/src/components/features/routes/routes-table.tsx
import { DataTable } from "@busmate/ui";
import { RouteManagementService } from "@busmate/api-client-route";
```

---

## 7. Tailwind CSS v4 Integration

### Current Setup

BusMate uses **Tailwind CSS v4** with the CSS-based configuration approach:
- PostCSS plugin: `@tailwindcss/postcss`
- Import: `@import "tailwindcss"` in `globals.css`
- No `tailwind.config.ts` file (Tailwind v4 uses CSS `@theme` directive)

### Theme Configuration via CSS

In Tailwind v4, theme customization happens in CSS using the `@theme` directive:

```css
/* libs/ui/theme/index.css — Master theme file */

/* ── Import Tailwind ───────────────────────────── */
@import "tailwindcss";

/* ── Import token files ────────────────────────── */
@import "./tokens/colors.css";
@import "./tokens/typography.css";
@import "./tokens/spacing.css";
@import "./tokens/radius.css";
@import "./tokens/shadows.css";
@import "./tokens/animations.css";
@import "./semantic/colors-light.css";
@import "./semantic/colors-dark.css";
@import "./semantic/components.css";

/* ── Tailwind v4 Theme Extension ───────────────── */
@theme {
  /* Map CSS variables to Tailwind utilities */
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-success: hsl(var(--success));
  --color-success-foreground: hsl(var(--success-foreground));
  --color-warning: hsl(var(--warning));
  --color-warning-foreground: hsl(var(--warning-foreground));
  --color-info: hsl(var(--info));
  --color-info-foreground: hsl(var(--info-foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --color-sidebar: hsl(var(--sidebar));
  --color-sidebar-foreground: hsl(var(--sidebar-foreground));

  /* Border radius */
  --radius-sm: var(--radius-sm);
  --radius-md: var(--radius-md);
  --radius-lg: var(--radius-lg);
  --radius-xl: var(--radius-xl);

  /* Font families */
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
}
```

### App-Level CSS (Management Portal)

The app's `globals.css` becomes a simple import:

```css
/* apps/frontend/management-portal/src/app/globals.css */

/* Import the shared theme (includes Tailwind + all tokens) */
@import "@busmate/ui/theme";

/* App-specific overrides (if any) */
@layer base {
  body {
    font-family: var(--font-sans);
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
  }
}

/* App-specific animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}
```

### Tailwind Content Configuration

Tailwind v4 auto-detects content files. However, to ensure the shared library is scanned, add a source in the app's CSS:

```css
/* In globals.css, if needed */
@source "../../../libs/ui/src/**/*.{ts,tsx}";
```

---

## 8. Migration from Current UI Components

### Migration Mapping

| Current File | Migration Target |
|-------------|-----------------|
| `src/components/ui/button.tsx` | `libs/ui/src/components/button.tsx` (regenerate via CLI) |
| `src/components/ui/card.tsx` | `libs/ui/src/components/card.tsx` (regenerate via CLI) |
| `src/components/ui/dialog.tsx` | `libs/ui/src/components/dialog.tsx` (regenerate via CLI) |
| `src/components/ui/input.tsx` | `libs/ui/src/components/input.tsx` (regenerate via CLI) |
| `src/components/ui/label.tsx` | `libs/ui/src/components/label.tsx` (regenerate via CLI) |
| `src/components/ui/select.tsx` | `libs/ui/src/components/select.tsx` (regenerate via CLI) |
| `src/components/ui/table.tsx` | `libs/ui/src/components/table.tsx` (regenerate via CLI) |
| `src/components/ui/tabs.tsx` | `libs/ui/src/components/tabs.tsx` (regenerate via CLI) |
| `src/components/ui/badge.tsx` | `libs/ui/src/components/badge.tsx` (regenerate via CLI) |
| `src/components/ui/checkbox.tsx` | `libs/ui/src/components/checkbox.tsx` (regenerate via CLI) |
| `src/components/ui/textarea.tsx` | `libs/ui/src/components/textarea.tsx` (regenerate via CLI) |
| `src/components/ui/switch.tsx` | `libs/ui/src/components/switch.tsx` (regenerate via CLI) |
| `src/components/ui/avatar.tsx` | `libs/ui/src/components/avatar.tsx` (regenerate via CLI) |
| `src/components/ui/dropdown-menu.tsx` | `libs/ui/src/components/dropdown-menu.tsx` (regenerate via CLI) |
| `src/components/ui/radio-group.tsx` | `libs/ui/src/components/radio-group.tsx` (regenerate via CLI) |
| `src/components/ui/toast.tsx` | `libs/ui/src/components/toast.tsx` (regenerate via CLI) |
| `src/components/ui/toaster.tsx` | `libs/ui/src/components/toaster.tsx` (regenerate via CLI) |

### Import Path Migration

```typescript
// BEFORE (current)
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";

// AFTER (migrated)
import { Button, Card, Dialog } from "@busmate/ui";
// or granular imports:
import { Button } from "@busmate/ui/components/button";
```

### Migration Script

Create a script to automate import path changes:

```bash
# Find and replace import paths across all files
find apps/frontend/management-portal/src -name "*.tsx" -o -name "*.ts" | \
  xargs sed -i 's|from "@/components/ui/\([^"]*\)"|from "@busmate/ui/components/\1"|g'
```

---

## 9. Common Pitfalls & Solutions

### Pitfall 1: shadcn CLI Doesn't Work with Tailwind v4

**Problem**: Some older versions of the shadcn CLI expect `tailwind.config.ts`.

**Solution**: Use `npx shadcn@latest` (canary) which supports Tailwind v4, or manually copy components from the shadcn/ui GitHub repository and adapt them.

### Pitfall 2: HSL Color Syntax Mismatch

**Problem**: shadcn uses `hsl(var(--primary))` with space-separated HSL values. If tokens are defined differently, colors break.

**Solution**: Ensure all color tokens use space-separated HSL format:

```css
/* ✅ Correct: space-separated HSL */
--primary: 221 83% 48%;

/* ❌ Wrong: full hsl() or hex */
--primary: hsl(221, 83%, 48%);
--primary: #2563eb;
```

### Pitfall 3: cn() Conflicts Between Old and New

**Problem**: Both old `src/lib/utils.ts` and new `libs/ui/src/lib/utils.ts` export `cn()`.

**Solution**: During migration, keep both. After migration, delete the old one. Use explicit imports:

```typescript
// During migration, be explicit
import { cn } from "@busmate/ui";          // new
import { cn } from "@/lib/utils";          // old (deprecated)
```

### Pitfall 4: Server Components Can't Use Client Components Directly

**Problem**: shadcn components use `"use client"` directives. Next.js server components can't directly import them.

**Solution**: This is expected behavior. Server components render server-side content, then client components hydrate. No special handling needed — just ensure client components have the `"use client"` directive.

### Pitfall 5: Monorepo Module Resolution

**Problem**: Next.js may not resolve `@busmate/ui` from `libs/ui/` without configuration.

**Solution**: 
1. Add to `transpilePackages` in `next.config.ts`
2. Add path aliases in `tsconfig.json`
3. Ensure `pnpm-workspace.yaml` includes `libs/**`

### Pitfall 6: CSS Import Order

**Problem**: Theme CSS must be imported before component styles.

**Solution**: Import order in `globals.css`:

```css
/* 1. Theme (includes Tailwind + tokens) — MUST be first */
@import "@busmate/ui/theme";

/* 2. App-specific styles — after theme */
@layer base { ... }
@layer components { ... }
@layer utilities { ... }
```

---

## Summary

| Step | Action | Output |
|------|--------|--------|
| 1 | Create `libs/ui/` directory structure | Empty library skeleton |
| 2 | Configure `package.json`, `tsconfig.json`, `components.json` | Package configuration |
| 3 | Create design tokens in `theme/` | CSS custom property files |
| 4 | Run shadcn CLI to generate components | ~35 base components |
| 5 | Create `cn()` utility and barrel exports | Import infrastructure |
| 6 | Register library in monorepo config | `@busmate/ui` importable |
| 7 | Migrate app's `globals.css` to use shared theme | Token-based styling |
| 8 | Update import paths in app code | Components from `@busmate/ui` |

---

## Next Steps

Proceed to **[04 — UI Component Architecture](./04-ui-component-architecture.md)** to see how components at each layer should be structured and how to compose them.
