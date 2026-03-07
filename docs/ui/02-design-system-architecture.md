# 02 — Design System Architecture

> **Scope**: The BusMate Design System — a comprehensive set of design tokens, principles, and standards that govern every UI component across all portals.
> **Audience**: Engineers, AI coding agents, and designers.

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Design Token Architecture](#2-design-token-architecture)
3. [Color System](#3-color-system)
4. [Typography System](#4-typography-system)
5. [Spacing System](#5-spacing-system)
6. [Border Radius System](#6-border-radius-system)
7. [Shadow System](#7-shadow-system)
8. [Iconography](#8-iconography)
9. [Accessibility Standards](#9-accessibility-standards)
10. [Component Hierarchy Overview](#10-component-hierarchy-overview)

---

## 1. Design Principles

Every UI decision in BusMate must align with these principles:

### 1.1 Clarity First

Transportation management involves complex data — schedules, routes with dozens of stops, fare matrices, fleet status. The UI must present this complexity without confusion.

- **Information hierarchy**: Most important data is visually prominent
- **Progressive disclosure**: Details appear on demand, not all at once
- **Consistent visual language**: Same visual treatment for same meaning everywhere

### 1.2 Operational Efficiency

Users are professional operators and government officials who use this system daily. Speed matters.

- **Minimal clicks**: Common actions accessible within 1-2 clicks
- **Keyboard navigable**: Power users can navigate without a mouse
- **Dense but readable**: Admin UIs should show more data per screen than consumer apps
- **Fast feedback**: Loading states, optimistic updates, toast notifications

### 1.3 Composability

The system must scale from 4 portals today to many more features tomorrow.

- **Components are building blocks**: Small, focused, composable
- **Patterns over pages**: Reusable patterns (data-table, filter-bar, form) compose into any feature
- **Tokens over hardcoded values**: Every visual property references a token

### 1.4 Consistency

Different portals (MOT, Admin, Operator, Timekeeper) must look and feel like one product.

- **Shared component library**: One source of truth for all UI primitives
- **Shared layout system**: Same sidebar/header/content pattern across roles
- **Shared patterns**: DataTable, filters, stats cards work identically everywhere

### 1.5 Accessibility

The system must be usable by all people, including those with disabilities.

- **WCAG 2.1 AA compliance** as minimum standard
- **Keyboard navigation** for all interactive elements
- **Screen reader support** with proper ARIA attributes
- **Color contrast ratios** ≥ 4.5:1 for normal text, ≥ 3:1 for large text

---

## 2. Design Token Architecture

### 2.1 What Are Design Tokens?

Design tokens are the smallest atomic values of the design system — colors, sizes, spacing, typography — stored as CSS custom properties (variables). They create a single source of truth that all components reference.

### 2.2 Token Layer Architecture

```
┌───────────────────────────────────────────────────────┐
│                    SEMANTIC TOKENS                      │
│  (What things mean in context)                         │
│                                                         │
│  --color-primary        → Used for primary actions      │
│  --color-destructive    → Used for danger/delete        │
│  --color-muted          → Used for secondary text       │
│  --radius-default       → Default border radius         │
│  --shadow-card          → Card elevation                │
│                                                         │
│  Maps to → Component tokens or primitive tokens         │
├───────────────────────────────────────────────────────┤
│                   COMPONENT TOKENS                      │
│  (Component-specific overrides)                         │
│                                                         │
│  --button-primary-bg    → Primary button background     │
│  --card-border          → Card border color             │
│  --sidebar-bg           → Sidebar background            │
│  --table-header-bg      → Table header background       │
│                                                         │
│  Maps to → Semantic tokens                              │
├───────────────────────────────────────────────────────┤
│                   PRIMITIVE TOKENS                       │
│  (Raw values — the palette)                             │
│                                                         │
│  --blue-50 through --blue-950                           │
│  --gray-50 through --gray-950                           │
│  --spacing-1 through --spacing-16                       │
│  --font-size-xs through --font-size-3xl                 │
│                                                         │
│  These are the raw building blocks                      │
└───────────────────────────────────────────────────────┘
```

### 2.3 Token File Structure

```
libs/ui/
  theme/
    tokens/
      colors.css           # Primitive color palette
      typography.css        # Font families, sizes, weights, line-heights
      spacing.css           # Spacing scale
      radius.css            # Border radius scale
      shadows.css           # Shadow/elevation scale
      animations.css        # Transition timing, keyframes
    semantic/
      colors-light.css      # Semantic color mapping (light mode)
      colors-dark.css       # Semantic color mapping (dark mode)
      components.css        # Component-level token overrides
    index.css               # Master import file
```

### 2.4 Token Naming Convention

```
--{category}-{property}-{variant}-{state}

Examples:
--color-primary                    # Primary color
--color-primary-foreground         # Text on primary color
--color-destructive                # Destructive/danger color
--color-muted                      # Muted/subtle color
--color-muted-foreground           # Text on muted backgrounds
--color-card                       # Card background
--color-card-foreground            # Card text color
--radius-sm                        # Small border radius
--radius-md                        # Medium (default) border radius
--shadow-sm                        # Small shadow
--shadow-md                        # Medium shadow
```

This follows the **shadcn/ui convention** for seamless integration.

---

## 3. Color System

### 3.1 Primitive Color Palette

The BusMate palette is built on a **blue/slate foundation** (transportation/government feel) with semantic accent colors.

```css
/* theme/tokens/colors.css */

:root {
  /* ── Brand Blues ─────────────────────────────── */
  --blue-50:  210 100% 97%;    /* #f0f7ff */
  --blue-100: 210 100% 93%;    /* #dbeafe */
  --blue-200: 210 100% 85%;    /* #bfdbfe */
  --blue-300: 210 98% 74%;     /* #93c5fd */
  --blue-400: 213 94% 62%;     /* #60a5fa */
  --blue-500: 217 91% 55%;     /* #3b82f6 */
  --blue-600: 221 83% 48%;     /* #2563eb */
  --blue-700: 224 76% 42%;     /* #1d4ed8 */
  --blue-800: 226 71% 35%;     /* #1e40af */
  --blue-900: 224 64% 29%;     /* #1e3a8a */
  --blue-950: 226 57% 18%;     /* #172554 */

  /* ── Neutral Slate ──────────────────────────── */
  --slate-50:  210 40% 98%;    /* #f8fafc */
  --slate-100: 210 40% 96%;    /* #f1f5f9 */
  --slate-200: 214 32% 91%;    /* #e2e8f0 */
  --slate-300: 213 27% 84%;    /* #cbd5e1 */
  --slate-400: 215 20% 65%;    /* #94a3b8 */
  --slate-500: 215 16% 47%;    /* #64748b */
  --slate-600: 215 19% 35%;    /* #475569 */
  --slate-700: 215 25% 27%;    /* #334155 */
  --slate-800: 217 33% 17%;    /* #1e293b */
  --slate-900: 222 47% 11%;    /* #0f172a */
  --slate-950: 229 84% 5%;     /* #020617 */

  /* ── Success Green ──────────────────────────── */
  --green-50:  138 76% 97%;
  --green-500: 142 71% 45%;    /* #22c55e */
  --green-600: 142 76% 36%;    /* #16a34a */
  --green-700: 142 72% 29%;    /* #15803d */

  /* ── Warning Amber ──────────────────────────── */
  --amber-50:  48 100% 96%;
  --amber-500: 38 92% 50%;     /* #f59e0b */
  --amber-600: 32 95% 44%;     /* #d97706 */

  /* ── Danger Red ─────────────────────────────── */
  --red-50:  0 86% 97%;
  --red-500: 0 84% 60%;        /* #ef4444 */
  --red-600: 0 72% 51%;        /* #dc2626 */
  --red-700: 0 74% 42%;        /* #b91c1c */

  /* ── Info Cyan ──────────────────────────────── */
  --cyan-50:  183 100% 96%;
  --cyan-500: 189 94% 43%;     /* #06b6d4 */
  --cyan-600: 192 91% 36%;     /* #0891b2 */

  /* ── Purple (Analytics/Insights) ─────────────── */
  --purple-50:  270 100% 98%;
  --purple-500: 271 91% 65%;   /* #a855f7 */
  --purple-600: 271 81% 56%;   /* #9333ea */
}
```

### 3.2 Semantic Color Tokens (Light Mode)

```css
/* theme/semantic/colors-light.css */

:root {
  /* ── Base ────────────────────────────────────── */
  --background:           var(--slate-50);
  --foreground:           var(--slate-900);

  /* ── Card ────────────────────────────────────── */
  --card:                 0 0% 100%;          /* white */
  --card-foreground:      var(--slate-900);

  /* ── Popover ─────────────────────────────────── */
  --popover:              0 0% 100%;
  --popover-foreground:   var(--slate-900);

  /* ── Primary ─────────────────────────────────── */
  --primary:              var(--blue-600);
  --primary-foreground:   0 0% 100%;

  /* ── Secondary ───────────────────────────────── */
  --secondary:            var(--slate-100);
  --secondary-foreground: var(--slate-900);

  /* ── Muted ───────────────────────────────────── */
  --muted:                var(--slate-100);
  --muted-foreground:     var(--slate-500);

  /* ── Accent ──────────────────────────────────── */
  --accent:               var(--slate-100);
  --accent-foreground:    var(--slate-900);

  /* ── Destructive ─────────────────────────────── */
  --destructive:          var(--red-600);
  --destructive-foreground: 0 0% 100%;

  /* ── Success ─────────────────────────────────── */
  --success:              var(--green-600);
  --success-foreground:   0 0% 100%;

  /* ── Warning ─────────────────────────────────── */
  --warning:              var(--amber-500);
  --warning-foreground:   var(--slate-900);

  /* ── Info ────────────────────────────────────── */
  --info:                 var(--cyan-600);
  --info-foreground:      0 0% 100%;

  /* ── Border / Input / Ring ───────────────────── */
  --border:               var(--slate-200);
  --input:                var(--slate-200);
  --ring:                 var(--blue-500);

  /* ── Sidebar ─────────────────────────────────── */
  --sidebar:              var(--slate-900);
  --sidebar-foreground:   var(--slate-100);
  --sidebar-active:       var(--blue-600);
  --sidebar-active-foreground: 0 0% 100%;
  --sidebar-muted:        var(--slate-800);

  /* ── Chart Colors ────────────────────────────── */
  --chart-1:              var(--blue-500);
  --chart-2:              var(--green-500);
  --chart-3:              var(--amber-500);
  --chart-4:              var(--purple-500);
  --chart-5:              var(--cyan-500);
}
```

### 3.3 Semantic Color Tokens (Dark Mode)

```css
/* theme/semantic/colors-dark.css */

.dark {
  --background:           var(--slate-950);
  --foreground:           var(--slate-50);

  --card:                 var(--slate-900);
  --card-foreground:      var(--slate-50);

  --popover:              var(--slate-900);
  --popover-foreground:   var(--slate-50);

  --primary:              var(--blue-500);
  --primary-foreground:   0 0% 100%;

  --secondary:            var(--slate-800);
  --secondary-foreground: var(--slate-50);

  --muted:                var(--slate-800);
  --muted-foreground:     var(--slate-400);

  --accent:               var(--slate-800);
  --accent-foreground:    var(--slate-50);

  --destructive:          var(--red-500);
  --destructive-foreground: 0 0% 100%;

  --success:              var(--green-500);
  --success-foreground:   0 0% 100%;

  --warning:              var(--amber-500);
  --warning-foreground:   var(--slate-900);

  --info:                 var(--cyan-500);
  --info-foreground:      0 0% 100%;

  --border:               var(--slate-700);
  --input:                var(--slate-700);
  --ring:                 var(--blue-400);

  --sidebar:              var(--slate-950);
  --sidebar-foreground:   var(--slate-100);
  --sidebar-active:       var(--blue-500);
  --sidebar-active-foreground: 0 0% 100%;
  --sidebar-muted:        var(--slate-900);
}
```

### 3.4 Status Colors for Domain-Specific States

BusMate manages entities with operational statuses. Define consistent status colors:

```css
/* theme/semantic/components.css — status colors */

:root {
  /* ── Entity Status Colors ────────────────────── */
  --status-active:        var(--green-500);
  --status-active-bg:     var(--green-50);
  --status-inactive:      var(--slate-400);
  --status-inactive-bg:   var(--slate-100);
  --status-pending:       var(--amber-500);
  --status-pending-bg:    var(--amber-50);
  --status-suspended:     var(--red-500);
  --status-suspended-bg:  var(--red-50);
  --status-draft:         var(--blue-500);
  --status-draft-bg:      var(--blue-50);
  --status-expired:       var(--slate-500);
  --status-expired-bg:    var(--slate-100);

  /* ── Trip/Schedule Status ────────────────────── */
  --status-on-time:       var(--green-500);
  --status-delayed:       var(--amber-500);
  --status-cancelled:     var(--red-500);
  --status-completed:     var(--blue-600);
  --status-in-progress:   var(--cyan-500);
  --status-scheduled:     var(--purple-500);
}
```

---

## 4. Typography System

### 4.1 Font Stack

```css
/* theme/tokens/typography.css */

:root {
  /* ── Font Families ───────────────────────────── */
  --font-sans:    'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono:    'JetBrains Mono', 'Fira Code', ui-monospace, monospace;

  /* ── Font Sizes ──────────────────────────────── */
  --font-size-xs:    0.75rem;     /* 12px */
  --font-size-sm:    0.875rem;    /* 14px */
  --font-size-base:  1rem;        /* 16px */
  --font-size-lg:    1.125rem;    /* 18px */
  --font-size-xl:    1.25rem;     /* 20px */
  --font-size-2xl:   1.5rem;      /* 24px */
  --font-size-3xl:   1.875rem;    /* 30px */
  --font-size-4xl:   2.25rem;     /* 36px */

  /* ── Line Heights ────────────────────────────── */
  --line-height-tight:   1.25;
  --line-height-snug:    1.375;
  --line-height-normal:  1.5;
  --line-height-relaxed: 1.625;

  /* ── Font Weights ────────────────────────────── */
  --font-weight-normal:   400;
  --font-weight-medium:   500;
  --font-weight-semibold: 600;
  --font-weight-bold:     700;

  /* ── Letter Spacing ──────────────────────────── */
  --tracking-tight:  -0.025em;
  --tracking-normal:  0;
  --tracking-wide:    0.025em;
}
```

### 4.2 Typography Scale Usage

| Role | Size | Weight | Usage |
|------|------|--------|-------|
| **Page Title** | `2xl` (24px) | Semibold | Page headers (`Dashboard`, `Routes Management`) |
| **Section Title** | `xl` (20px) | Semibold | Card/section headings |
| **Subsection** | `lg` (18px) | Medium | Sub-headings within sections |
| **Body** | `sm` (14px) | Normal | Default body text, table cells, form labels |
| **Caption** | `xs` (12px) | Normal/Medium | Timestamps, secondary info, help text |
| **KPI Value** | `3xl` (30px) | Bold | Stats card large numbers |
| **KPI Label** | `sm` (14px) | Medium | Stats card labels |
| **Button** | `sm` (14px) | Medium | Button text |
| **Badge** | `xs` (12px) | Medium | Status badge text |
| **Code/Data** | `sm` (14px) | Normal | Monospace for IDs, codes |

### 4.3 Typography Component Tokens

```css
/* Within theme/semantic/components.css */

:root {
  /* ── Headings ────────────────────────────────── */
  --heading-1-size:   var(--font-size-3xl);
  --heading-1-weight: var(--font-weight-bold);
  --heading-1-tracking: var(--tracking-tight);

  --heading-2-size:   var(--font-size-2xl);
  --heading-2-weight: var(--font-weight-semibold);

  --heading-3-size:   var(--font-size-xl);
  --heading-3-weight: var(--font-weight-semibold);

  --heading-4-size:   var(--font-size-lg);
  --heading-4-weight: var(--font-weight-medium);

  /* ── Body ────────────────────────────────────── */
  --body-size:        var(--font-size-sm);
  --body-weight:      var(--font-weight-normal);
  --body-line-height: var(--line-height-normal);

  /* ── Small ───────────────────────────────────── */
  --small-size:       var(--font-size-xs);
  --small-weight:     var(--font-weight-normal);
}
```

> **Note**: Admin dashboards typically use `14px` as the base body size (not `16px`) for information density. All sizing is relative so this can be adjusted by changing `--font-size-base`.

---

## 5. Spacing System

### 5.1 Spacing Scale

Based on a **4px grid** (0.25rem increments):

```css
/* theme/tokens/spacing.css */

:root {
  --spacing-0:   0;
  --spacing-0.5: 0.125rem;   /*  2px */
  --spacing-1:   0.25rem;    /*  4px */
  --spacing-1.5: 0.375rem;   /*  6px */
  --spacing-2:   0.5rem;     /*  8px */
  --spacing-2.5: 0.625rem;   /* 10px */
  --spacing-3:   0.75rem;    /* 12px */
  --spacing-3.5: 0.875rem;   /* 14px */
  --spacing-4:   1rem;       /* 16px */
  --spacing-5:   1.25rem;    /* 20px */
  --spacing-6:   1.5rem;     /* 24px */
  --spacing-8:   2rem;       /* 32px */
  --spacing-10:  2.5rem;     /* 40px */
  --spacing-12:  3rem;       /* 48px */
  --spacing-16:  4rem;       /* 64px */
  --spacing-20:  5rem;       /* 80px */
  --spacing-24:  6rem;       /* 96px */
}
```

### 5.2 Spacing Usage Guidelines

| Context | Token | Value | Example |
|---------|-------|-------|---------|
| **Component internal padding** | `spacing-3` to `spacing-4` | 12-16px | Card padding, button padding |
| **Between form fields** | `spacing-4` | 16px | Vertical gap between label+input groups |
| **Between sections** | `spacing-6` to `spacing-8` | 24-32px | Gap between dashboard widgets, page sections |
| **Page padding** | `spacing-6` | 24px | Main content area padding |
| **Sidebar item padding** | `spacing-2` to `spacing-3` | 8-12px | Sidebar nav item spacing |
| **Table cell padding** | `spacing-2` to `spacing-3` | 8-12px | `px-3 py-2` for dense rows |
| **Icon-to-text gap** | `spacing-2` | 8px | Icon + label in buttons/nav items |

---

## 6. Border Radius System

```css
/* theme/tokens/radius.css */

:root {
  --radius-none: 0;
  --radius-sm:   0.25rem;    /*  4px — inputs, badges */
  --radius-md:   0.375rem;   /*  6px — buttons, small cards */
  --radius-lg:   0.5rem;     /*  8px — cards, modals */
  --radius-xl:   0.75rem;    /* 12px — larger cards, panels */
  --radius-2xl:  1rem;       /* 16px — hero cards */
  --radius-full: 9999px;     /* pill shapes — avatars, tags */
}
```

### Default Radius

```css
:root {
  --radius: var(--radius-md);   /* Default radius for shadcn components */
}
```

---

## 7. Shadow System

```css
/* theme/tokens/shadows.css */

:root {
  --shadow-xs:   0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-sm:   0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md:   0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg:   0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl:   0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);

  /* ── Inset shadows ───────────────────────────── */
  --shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);

  /* ── Colored ring shadow (focus) ─────────────── */
  --shadow-ring:  0 0 0 2px hsl(var(--ring) / 0.3);
}
```

### Shadow Usage

| Context | Token | Usage |
|---------|-------|-------|
| Cards at rest | `shadow-xs` or `shadow-sm` | Subtle elevation for cards |
| Cards on hover | `shadow-md` | Elevated on interaction |
| Dropdowns/popovers | `shadow-lg` | Floating elements |
| Modals | `shadow-xl` | Maximum elevation for overlays |
| Focus ring | `shadow-ring` | Combined with border for accessibility |
| Input fields | `shadow-xs` | Subtle depth on input focus |

---

## 8. Iconography

### 8.1 Icon Library

**Primary**: [Lucide React](https://lucide.dev/) (already in use across the codebase)

| Guideline | Value |
|-----------|-------|
| Default size | `16px` for inline, `20px` for buttons, `24px` for navigation |
| Stroke width | `2` (Lucide default) |
| Color | Inherits from `currentColor` |

### 8.2 Icon Usage Rules

```tsx
// ✅ Correct — icon inherits color and sizes from parent
<Button variant="ghost" size="icon">
  <Pencil className="h-4 w-4" />
</Button>

// ✅ Correct — icon in nav item
<SidebarItem icon={Route} label="Routes Management" />

// ❌ Avoid — hardcoded icon colors
<Pencil className="h-4 w-4 text-blue-600" />

// ✅ Correct — use semantic color
<Pencil className="h-4 w-4 text-primary" />
```

### 8.3 Domain-Specific Icon Mapping

| Concept | Icon | Lucide Name |
|---------|------|-------------|
| Dashboard | `LayoutDashboard` | `layout-dashboard` |
| Routes | `Route` | `route` |
| Bus Stops | `MapPin` | `map-pin` |
| Buses | `Bus` | `bus` |
| Schedules | `Calendar` | `calendar` |
| Trips | `PlaneTakeoff` | `plane-takeoff` |
| Operators | `Users` | `users` |
| Staff | `Users2` | `users-2` |
| Location Tracking | `Navigation` | `navigation` |
| Analytics | `ChartArea` | `chart-area` |
| Notifications | `Bell` | `bell` |
| Permits | `FileText` | `file-text` |
| Fares | `CircleDollarSign` | `circle-dollar-sign` |
| Policies | `Shield` | `shield` |
| Settings | `Settings` | `settings` |

---

## 9. Accessibility Standards

### 9.1 WCAG 2.1 AA Requirements

| Criterion | Requirement |
|-----------|-------------|
| **Color contrast** | ≥ 4.5:1 for normal text (`<18px`), ≥ 3:1 for large text (`≥18px` or `≥14px bold`) |
| **Focus indicator** | Visible focus ring on all interactive elements |
| **Keyboard navigation** | All actions reachable via Tab, Enter, Space, Escape, Arrow keys |
| **Screen reader** | Meaningful labels, ARIA roles, live regions for dynamic content |
| **Motion** | Respect `prefers-reduced-motion` setting |
| **Target size** | ≥ 44×44px for touch targets (≥ 24×24px for mouse) |

### 9.2 Focus Ring Standard

```css
/* All focusable elements use this pattern */
:root {
  --focus-ring: 0 0 0 2px hsl(var(--background)),
                0 0 0 4px hsl(var(--ring));
}

/* Applied via Tailwind utility or component styles */
.focus-ring {
  outline: none;
  box-shadow: var(--focus-ring);
}
```

### 9.3 Color Contrast Verification

All token color combinations must be verified:

| Combination | Minimum Ratio | Usage |
|-------------|---------------|-------|
| `--foreground` on `--background` | 4.5:1 | Body text |
| `--primary-foreground` on `--primary` | 4.5:1 | Primary buttons |
| `--destructive-foreground` on `--destructive` | 4.5:1 | Danger buttons |
| `--muted-foreground` on `--background` | 4.5:1 | Secondary text |
| `--muted-foreground` on `--card` | 4.5:1 | Card secondary text |
| Status text on status backgrounds | 3:1 | Status badges |

### 9.4 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 10. Component Hierarchy Overview

The design system organizes components into layers:

```
┌──────────────────────────────────────────────────────┐
│ Layer 5: PAGES                                        │
│ Full route pages that compose feature components      │
│ e.g., RoutesPage, DashboardPage, BusStopsPage        │
├──────────────────────────────────────────────────────┤
│ Layer 4: FEATURE COMPONENTS                           │
│ Domain-specific compositions of patterns              │
│ e.g., RoutesTable, BusStopForm, ScheduleWorkspace    │
├──────────────────────────────────────────────────────┤
│ Layer 3: PATTERNS                                     │
│ Reusable UI patterns composed from base components    │
│ e.g., DataTable, FilterBar, FormField, StatsCard     │
├──────────────────────────────────────────────────────┤
│ Layer 2: BASE COMPONENTS                              │
│ Styled wrappers with BusMate design token theming     │
│ e.g., Button, Input, Card, Dialog, Badge             │
├──────────────────────────────────────────────────────┤
│ Layer 1: PRIMITIVES (shadcn/ui + Radix)               │
│ Unstyled accessible UI primitives from Radix          │
│ e.g., @radix-ui/react-dialog, react-slot             │
├──────────────────────────────────────────────────────┤
│ Layer 0: DESIGN TOKENS                                │
│ CSS custom properties — colors, spacing, typography   │
│ Defined in theme/ directory                           │
└──────────────────────────────────────────────────────┘
```

### Layer Dependency Rules

| Rule | Description |
|------|-------------|
| **Downward only** | Each layer may only import from layers below it |
| **No skip imports** | Pages should not directly use Radix primitives |
| **Token-only styling** | All visual values reference design tokens, not raw Tailwind colors |
| **Pattern composition** | Feature components compose patterns, not re-implement them |

### Layer Mapping to File Structure

```
libs/ui/
  theme/              → Layer 0: Design tokens
  components/         → Layer 1-2: Primitives and base components (shadcn)
  patterns/           → Layer 3: Reusable patterns
  layouts/            → Layout system components
  hooks/              → Shared UI hooks

apps/frontend/management-portal/
  src/components/
    features/         → Layer 4: Feature components (domain-specific)
  src/app/            → Layer 5: Pages
```

---

## Summary

This design system architecture provides:

1. **Token-driven theming** — Every color, size, and spacing value is a CSS custom property
2. **Layered composition** — Clear hierarchy from tokens → primitives → patterns → features → pages
3. **Light/dark mode ready** — Semantic tokens swap via `.dark` class
4. **Accessibility by default** — WCAG 2.1 AA standards built into the token system
5. **Domain-aware** — Status colors and icon mappings specific to transportation management

---

## Next Steps

Proceed to **[03 — shadcn Integration Plan](./03-shadcn-integration-plan.md)** to see how to install and configure shadcn/ui to use this design system.
