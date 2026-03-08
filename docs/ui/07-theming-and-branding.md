# 07 — Theming and Branding

> **Scope**: Defines the complete theming system — color palette, dark mode implementation, brand tokens, Tailwind CSS v4 integration, and long-term theme management.
> **Goal**: Establish a maintainable, token-based theming system that supports light/dark modes and consistent branding.

---

## Table of Contents

1. [Theming Architecture Overview](#1-theming-architecture-overview)
2. [CSS Custom Properties (Design Tokens)](#2-css-custom-properties-design-tokens)
3. [Color Palette](#3-color-palette)
4. [Dark Mode Implementation](#4-dark-mode-implementation)
5. [Typography System](#5-typography-system)
6. [Spacing & Layout Tokens](#6-spacing--layout-tokens)
7. [Shadows & Effects](#7-shadows--effects)
8. [Component-Level Tokens](#8-component-level-tokens)
9. [Tailwind CSS v4 Integration](#9-tailwind-css-v4-integration)
10. [Brand Guidelines](#10-brand-guidelines)
11. [Theme Management Rules](#11-theme-management-rules)

---

## 1. Theming Architecture Overview

### Token Flow

```
Brand Values (design decisions)
  ↓
Primitive Tokens (raw values: blue-500 → 221 83% 53%)
  ↓
Semantic Tokens (purpose-based: --primary, --destructive)
  ↓
Component Tokens (scoped: --sidebar, --card)
  ↓
Tailwind Utilities (classes: bg-primary, text-muted-foreground)
```

### Key Principle

**Never use raw color values in components.** Always reference semantic tokens through Tailwind utility classes:

```tsx
// ✅ Semantic token via Tailwind
<div className="bg-primary text-primary-foreground" />

// ❌ Raw color
<div className="bg-blue-600 text-white" />

// ❌ Arbitrary value
<div className="bg-[#2563EB]" />

// ❌ Hardcoded inline style
<div style={{ backgroundColor: "#2563EB" }} />
```

---

## 2. CSS Custom Properties (Design Tokens)

### Token File Structure

```
libs/ui/src/
  styles/
    globals.css           ← Main entry, imports all token files
    tokens/
      colors.css          ← Color palette tokens
      typography.css      ← Font tokens
      spacing.css         ← Spacing scale
      shadows.css         ← Shadow tokens
      radius.css          ← Border radius tokens
      animations.css      ← Keyframes and animation tokens
```

### Complete Token Definition

```css
/* libs/ui/src/styles/globals.css */

@import "tailwindcss";

/* ── Token layers ─────────────────────────────────── */

@layer base {
  :root {
    /* ─── Primitive Colors (HSL values) ─────────── */
    --white:              0 0% 100%;
    --black:              0 0% 0%;

    /* Gray scale (Zinc-based) */
    --gray-50:            240 5% 96%;
    --gray-100:           240 5% 92%;
    --gray-200:           240 6% 85%;
    --gray-300:           240 5% 74%;
    --gray-400:           240 4% 58%;
    --gray-500:           240 4% 46%;
    --gray-600:           240 5% 34%;
    --gray-700:           240 5% 26%;
    --gray-800:           240 4% 16%;
    --gray-900:           240 6% 10%;
    --gray-950:           240 10% 4%;

    /* Brand Blue */
    --blue-50:            214 100% 97%;
    --blue-100:           214 95% 93%;
    --blue-200:           213 97% 87%;
    --blue-300:           212 96% 78%;
    --blue-400:           213 94% 68%;
    --blue-500:           217 91% 60%;
    --blue-600:           221 83% 53%;
    --blue-700:           224 76% 48%;
    --blue-800:           226 71% 40%;
    --blue-900:           224 64% 33%;

    /* Success Green */
    --green-50:           152 81% 96%;
    --green-500:          160 84% 39%;
    --green-600:          161 94% 30%;
    --green-700:          163 94% 24%;

    /* Warning Amber */
    --amber-50:           48 100% 96%;
    --amber-500:          38 92% 50%;
    --amber-600:          36 77% 49%;

    /* Danger Red */
    --red-50:             0 86% 97%;
    --red-500:            0 84% 60%;
    --red-600:            0 72% 51%;
    --red-700:            0 74% 42%;

    /* ─── Semantic Tokens (Light Mode) ─────────── */

    /* Base surfaces */
    --background:         0 0% 100%;
    --foreground:         240 10% 4%;

    /* Card surfaces */
    --card:               0 0% 100%;
    --card-foreground:    240 10% 4%;

    /* Popover / dropdown */
    --popover:            0 0% 100%;
    --popover-foreground: 240 10% 4%;

    /* Primary (Brand Blue) */
    --primary:            221 83% 53%;
    --primary-foreground: 0 0% 100%;

    /* Secondary */
    --secondary:          240 5% 96%;
    --secondary-foreground: 240 6% 10%;

    /* Muted (subtle backgrounds) */
    --muted:              240 5% 96%;
    --muted-foreground:   240 4% 46%;

    /* Accent (hover states) */
    --accent:             240 5% 96%;
    --accent-foreground:  240 6% 10%;

    /* Destructive (danger actions) */
    --destructive:        0 84% 60%;
    --destructive-foreground: 0 0% 100%;

    /* Warning */
    --warning:            38 92% 50%;
    --warning-foreground: 0 0% 100%;

    /* Success */
    --success:            160 84% 39%;
    --success-foreground: 0 0% 100%;

    /* Borders */
    --border:             240 6% 90%;
    --input:              240 6% 90%;
    --ring:               221 83% 53%;

    /* ─── Component Tokens ─────────────────────── */

    /* Sidebar */
    --sidebar:                222 47% 11%;
    --sidebar-foreground:     210 40% 96%;
    --sidebar-active:         221 83% 48%;
    --sidebar-active-foreground: 0 0% 100%;
    --sidebar-muted:          217 33% 17%;

    /* Chart colors */
    --chart-1:            221 83% 53%;
    --chart-2:            160 84% 39%;
    --chart-3:            38 92% 50%;
    --chart-4:            280 65% 60%;
    --chart-5:            340 75% 55%;

    /* ─── Layout tokens ────────────────────────── */
    --radius:             0.5rem;
  }

  /* ─── Dark Mode Tokens ───────────────────────── */
  .dark {
    --background:         240 10% 4%;
    --foreground:         0 0% 98%;

    --card:               240 6% 10%;
    --card-foreground:    0 0% 98%;

    --popover:            240 6% 10%;
    --popover-foreground: 0 0% 98%;

    --primary:            217 91% 60%;
    --primary-foreground: 240 10% 4%;

    --secondary:          240 4% 16%;
    --secondary-foreground: 0 0% 98%;

    --muted:              240 4% 16%;
    --muted-foreground:   240 4% 58%;

    --accent:             240 4% 16%;
    --accent-foreground:  0 0% 98%;

    --destructive:        0 72% 51%;
    --destructive-foreground: 0 0% 98%;

    --warning:            38 92% 50%;
    --warning-foreground: 240 10% 4%;

    --success:            160 84% 39%;
    --success-foreground: 240 10% 4%;

    --border:             240 4% 16%;
    --input:              240 4% 16%;
    --ring:               217 91% 60%;

    /* Sidebar (dark) */
    --sidebar:                222 47% 8%;
    --sidebar-foreground:     210 40% 96%;
    --sidebar-active:         217 91% 55%;
    --sidebar-active-foreground: 0 0% 100%;
    --sidebar-muted:          217 33% 14%;

    /* Chart colors (dark) */
    --chart-1:            217 91% 65%;
    --chart-2:            160 84% 45%;
    --chart-3:            38 92% 55%;
    --chart-4:            280 65% 65%;
    --chart-5:            340 75% 60%;
  }
}
```

---

## 3. Color Palette

### Brand Colors

| Name | Light HSL | Usage |
|------|-----------|-------|
| **Primary** | `221 83% 53%` | Buttons, links, active sidebar, focus rings |
| **Primary Foreground** | `0 0% 100%` | Text on primary |
| **Secondary** | `240 5% 96%` | Secondary buttons, tags |
| **Accent** | `240 5% 96%` | Hover backgrounds |

### Semantic Colors

| Name | Light | Dark | Usage |
|------|-------|------|-------|
| **Background** | White | Gray 950 | Page background |
| **Card** | White | Gray 900 | Card surfaces |
| **Muted** | Gray 50 | Gray 800 | Subtle backgrounds |
| **Border** | Gray 200 | Gray 800 | All borders |
| **Destructive** | Red 500 | Red 600 | Delete, danger |
| **Warning** | Amber 500 | Amber 500 | Warnings |
| **Success** | Green 500 | Green 500 | Confirmations |

### Status Colors (Semantic)

These map to the `StatusBadge` component from doc 06:

| Status | Background (Light) | Text (Light) | Background (Dark) |
|--------|-------------------|-------------|-------------------|
| Active | `emerald-100` | `emerald-700` | `emerald-500/20` |
| Pending | `amber-100` | `amber-700` | `amber-500/20` |
| Inactive | `gray-100` | `gray-600` | `gray-500/20` |
| Rejected | `red-100` | `red-700` | `red-500/20` |
| Approved | `blue-100` | `blue-700` | `blue-500/20` |

---

## 4. Dark Mode Implementation

### 4.1 Provider Setup

BusMate already has `next-themes` installed. Configure it in the root layout:

```tsx
// apps/frontend/management-portal/src/app/layout.tsx

import { ThemeProvider } from "next-themes";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 4.2 Theme Switcher Component

```tsx
// libs/ui/src/components/theme-switcher.tsx

"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/button";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/dropdown-menu";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeSwitcher() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" /> Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" /> Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" /> System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 4.3 Dark Mode Rules

1. **Always use semantic tokens** — `bg-background`, not `bg-white`
2. **Test both modes** — every component must look correct in light and dark
3. **Use `.dark:` prefix sparingly** — only for cases not covered by tokens
4. **Images/icons** — use `dark:invert` or provide dark variants
5. **Shadows** — lighter in dark mode (already handled by token system)
6. **AG Grid** — apply the AG Grid Quartz dark theme in dark mode

```tsx
// AG Grid theme switching
import { useTheme } from "next-themes";

function DataGrid() {
  const { resolvedTheme } = useTheme();
  return (
    <div className={resolvedTheme === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz"}>
      <AgGridReact ... />
    </div>
  );
}
```

---

## 5. Typography System

### 5.1 Font Stack

```css
/* In globals.css */
@layer base {
  :root {
    --font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif;
    --font-mono: "JetBrains Mono", ui-monospace, "Cascadia Code", monospace;
  }

  body {
    font-family: var(--font-sans);
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}
```

### 5.2 Type Scale

Based on a 4px baseline grid with 1.25 ratio:

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `display` | 36px | 700 | 40px | Dashboard hero numbers |
| `h1` | 30px | 600 | 36px | Page titles |
| `h2` | 24px | 600 | 32px | Section headings |
| `h3` | 20px | 600 | 28px | Card titles |
| `h4` | 16px | 600 | 24px | Sub-section headings |
| `body` | 14px | 400 | 20px | Body text (default) |
| `body-sm` | 13px | 400 | 18px | Compact body text |
| `caption` | 12px | 500 | 16px | Labels, captions |
| `overline` | 11px | 600 | 16px | Sidebar section labels, overlines |

### 5.3 Tailwind Utility Classes

```css
/* Applied via @theme in Tailwind v4 */
@theme {
  --font-size-display: 2.25rem;
  --line-height-display: 2.5rem;
  --font-size-body-sm: 0.8125rem;
  --line-height-body-sm: 1.125rem;
}
```

Usage:

```tsx
<h1 className="text-2xl font-semibold tracking-tight">Page Title</h1>   {/* h1 */}
<p className="text-sm text-muted-foreground">Description</p>             {/* body */}
<span className="text-xs font-medium uppercase tracking-wider">Section</span> {/* overline */}
```

---

## 6. Spacing & Layout Tokens

### 6.1 Spacing Scale

Based on 4px baseline:

| Token | Value | Usage |
|-------|-------|-------|
| `0.5` | 2px | Micro spacing (icon gaps) |
| `1` | 4px | Tight element spacing |
| `1.5` | 6px | Dense padding |
| `2` | 8px | Small padding, small gaps |
| `3` | 12px | Medium gaps |
| `4` | 16px | Standard padding |
| `5` | 20px | Section gaps |
| `6` | 24px | Page padding |
| `8` | 32px | Large section spacing |
| `10` | 40px | Extra large spacing |
| `12` | 48px | Page section separation |

### 6.2 Standard Spacing Rules

| Context | Value | Tailwind |
|---------|-------|----------|
| Page padding | 24px | `p-6` |
| Mobile page padding | 16px | `p-4` |
| Card padding | 24px | `p-6` |
| Section gap | 24px | `space-y-6` or `gap-6` |
| Element gap inside section | 16px | `space-y-4` or `gap-4` |
| Form field gap | 16px | `gap-4` |
| Icon + text gap | 8px | `gap-2` |
| Button icon gap | 8px | `gap-2` |

---

## 7. Shadows & Effects

### 7.1 Shadow Scale

```css
@layer base {
  :root {
    --shadow-xs:    0 1px 2px 0 hsl(0 0% 0% / 0.05);
    --shadow-sm:    0 1px 3px 0 hsl(0 0% 0% / 0.1), 0 1px 2px -1px hsl(0 0% 0% / 0.1);
    --shadow-md:    0 4px 6px -1px hsl(0 0% 0% / 0.1), 0 2px 4px -2px hsl(0 0% 0% / 0.1);
    --shadow-lg:    0 10px 15px -3px hsl(0 0% 0% / 0.1), 0 4px 6px -4px hsl(0 0% 0% / 0.1);
    --shadow-xl:    0 20px 25px -5px hsl(0 0% 0% / 0.1), 0 8px 10px -6px hsl(0 0% 0% / 0.1);
  }

  .dark {
    --shadow-xs:    0 1px 2px 0 hsl(0 0% 0% / 0.2);
    --shadow-sm:    0 1px 3px 0 hsl(0 0% 0% / 0.3), 0 1px 2px -1px hsl(0 0% 0% / 0.3);
    --shadow-md:    0 4px 6px -1px hsl(0 0% 0% / 0.3), 0 2px 4px -2px hsl(0 0% 0% / 0.3);
    --shadow-lg:    0 10px 15px -3px hsl(0 0% 0% / 0.3), 0 4px 6px -4px hsl(0 0% 0% / 0.3);
    --shadow-xl:    0 20px 25px -5px hsl(0 0% 0% / 0.3), 0 8px 10px -6px hsl(0 0% 0% / 0.3);
  }
}
```

### 7.2 Shadow Usage

| Element | Shadow | Dark Shadow |
|---------|--------|-------------|
| Cards | `shadow-sm` | `shadow-sm` (darker) |
| Dropdowns | `shadow-lg` | `shadow-lg` |
| Modals/Dialogs | `shadow-xl` | `shadow-xl` |
| Buttons (hover) | `shadow-sm` | `shadow-sm` |
| Sidebar | `shadow-lg` (mobile sheet) | Same |
| Sticky header | `shadow-sm` (on scroll) | Same |

### 7.3 Border Radius

```css
:root {
  --radius: 0.5rem;  /* 8px — base radius */
}
```

| Element | Radius | Tailwind |
|---------|--------|----------|
| Buttons | 6px | `rounded-md` |
| Cards | 8px | `rounded-lg` |
| Inputs | 6px | `rounded-md` |
| Badges | 9999px | `rounded-full` |
| Dialogs | 12px | `rounded-xl` |
| Avatars | 9999px | `rounded-full` |
| Tooltips | 6px | `rounded-md` |

---

## 8. Component-Level Tokens

### 8.1 Sidebar Tokens

```css
:root {
  --sidebar: 222 47% 11%;
  --sidebar-foreground: 210 40% 96%;
  --sidebar-active: 221 83% 48%;
  --sidebar-active-foreground: 0 0% 100%;
  --sidebar-muted: 217 33% 17%;
}
```

### 8.2 Chart Tokens

```css
:root {
  --chart-1: 221 83% 53%;   /* Primary blue */
  --chart-2: 160 84% 39%;   /* Green */
  --chart-3: 38 92% 50%;    /* Amber */
  --chart-4: 280 65% 60%;   /* Purple */
  --chart-5: 340 75% 55%;   /* Pink */
}
```

Usage with Chart.js / Recharts:

```tsx
// Helper to read CSS variables for chart libraries
function getCSSColor(variable: string): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
  return `hsl(${value})`;
}

const chartColors = {
  primary: getCSSColor("--chart-1"),
  success: getCSSColor("--chart-2"),
  warning: getCSSColor("--chart-3"),
  purple: getCSSColor("--chart-4"),
  pink: getCSSColor("--chart-5"),
};
```

---

## 9. Tailwind CSS v4 Integration

### 9.1 Theme Extension via @theme

BusMate uses Tailwind CSS v4 with the CSS-based configuration approach. Extend the theme using the `@theme` directive:

```css
/* libs/ui/src/styles/globals.css (after token definitions) */

@theme {
  /* Map tokens to Tailwind utilities */
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
  --color-warning: hsl(var(--warning));
  --color-warning-foreground: hsl(var(--warning-foreground));
  --color-success: hsl(var(--success));
  --color-success-foreground: hsl(var(--success-foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));

  /* Sidebar */
  --color-sidebar: hsl(var(--sidebar));
  --color-sidebar-foreground: hsl(var(--sidebar-foreground));
  --color-sidebar-active: hsl(var(--sidebar-active));
  --color-sidebar-active-foreground: hsl(var(--sidebar-active-foreground));
  --color-sidebar-muted: hsl(var(--sidebar-muted));

  /* Charts */
  --color-chart-1: hsl(var(--chart-1));
  --color-chart-2: hsl(var(--chart-2));
  --color-chart-3: hsl(var(--chart-3));
  --color-chart-4: hsl(var(--chart-4));
  --color-chart-5: hsl(var(--chart-5));

  /* Sidebar widths */
  --width-68: 17rem;

  /* Border radius */
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);

  /* Fonts */
  --font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}
```

### 9.2 PostCSS Configuration

```js
// apps/frontend/management-portal/postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

No `tailwind.config.ts` file is needed — Tailwind v4 uses `@theme` in CSS.

---

## 10. Brand Guidelines

### 10.1 Logo Usage

| Context | Logo | Size |
|---------|------|------|
| Sidebar (expanded) | Full logo + "BUSMATE LK" text | 32×32px icon |
| Sidebar (collapsed) | Icon only | 32×32px |
| Login page | Full logo centered | 48×48px |
| Mobile header | Icon only | 28×28px |
| Favicon | Icon | 16×16px, 32×32px |

### 10.2 Brand Color Applications

| Element | Color Token | Example |
|---------|-------------|---------|
| Primary buttons | `--primary` | Create, Save, Submit |
| Active sidebar item | `--sidebar-active` | Selected nav item |
| Links | `--primary` | All text links |
| Focus ring | `--ring` | Input focus, button focus |
| Chart primary | `--chart-1` | Primary data series |
| Success states | `--success` | Confirmation toasts |
| Error states | `--destructive` | Error messages, delete buttons |

### 10.3 Iconography

- **Icon library**: Lucide React (already in use)
- **Default size**: `h-4 w-4` (16×16) for inline, `h-5 w-5` (20×20) for nav
- **Stroke width**: 2px (Lucide default)
- **Color**: Inherit from parent text color via `currentColor`

```tsx
// ✅ Correct icon usage
<Button variant="outline" size="sm">
  <Plus className="h-4 w-4 mr-2" />
  Add Route
</Button>

// ✅ Icon button
<Button variant="ghost" size="icon">
  <Pencil className="h-4 w-4" />
  <span className="sr-only">Edit</span>
</Button>
```

---

## 11. Theme Management Rules

### Rule 1: Single Source of Truth

All color values live in `libs/ui/src/styles/globals.css`. No colors defined elsewhere.

### Rule 2: Semantic Over Primitive

Always use semantic tokens (`bg-primary`) over primitive values (`bg-blue-600`).

### Rule 3: Dark Mode Parity

Every light mode token must have a dark mode equivalent. Test every new component in both modes.

### Rule 4: No Inline Colors

No `style={{ color: "#xxx" }}` or `bg-[#xxx]` unless rendering dynamic, user-defined data (e.g., chart colors from API).

### Rule 5: Contrast Ratios

Maintain WCAG 2.1 AA contrast ratios:
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- Interactive elements: 3:1 minimum

### Rule 6: Component Token Scoping

If a component needs unique colors (like the sidebar), create scoped tokens (`--sidebar-*`). Don't overload semantic tokens (`--primary`) for component-specific needs.

### Rule 7: Chart Colors

Use the `--chart-*` tokens for all data visualizations. Never hardcode chart colors.

---

## Current State vs Target State

| Aspect | Current | Target |
|--------|---------|--------|
| Color definition | Hardcoded Tailwind classes (`bg-gray-50`, `text-blue-600`) | CSS custom properties via `@theme` |
| Dark mode | None | Full dark mode via `next-themes` + `.dark` class |
| Token layers | None | 3-layer: Primitive → Semantic → Component |
| Sidebar colors | Inline classes | `--sidebar-*` tokens |
| Chart colors | Hardcoded | `--chart-*` tokens |
| Typography | Ad-hoc sizes | Systematic type scale |
| Spacing | Inconsistent | 4px grid system |
| Border radius | Mixed values | `--radius` base token |

---

## Next Steps

Proceed to **[08 — Step-by-Step Refactoring Roadmap](./08-step-by-step-refactoring-roadmap.md)** for the detailed, actionable migration plan.
