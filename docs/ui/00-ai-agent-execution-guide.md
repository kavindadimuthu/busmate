# AI Agent Execution Guide

> **How to use AI coding agents to execute the BusMate UI refactoring plan step by step**

---

## Table of Contents

1. [Overview](#overview)
2. [Which Document to Follow](#which-document-to-follow)
3. [Prompt Strategy](#prompt-strategy)
4. [Token Limits & Batch Sizing](#token-limits--batch-sizing)
5. [Phase-by-Phase Prompts](#phase-by-phase-prompts)
6. [Verification After Each Step](#verification-after-each-step)
7. [Error Handling](#error-handling)
8. [Example Conversation Flow](#example-conversation-flow)

---

## Overview

The refactoring plan consists of **46 steps** organized into **6 phases**. To execute this with an AI coding agent:

1. **Follow document 08** (`08-step-by-step-refactoring-roadmap.md`) as the primary execution guide
2. **Work in small batches** (1-5 steps per prompt)
3. **Verify after each batch** before proceeding
4. **Provide context** by attaching relevant documents
5. **Be specific** about the current step number

---

## Which Document to Follow

### Primary Document: `08-step-by-step-refactoring-roadmap.md`

This is your **execution blueprint**. It contains:
- 46 sequential steps
- Clear objectives per step
- Files to create/modify per step
- Verification criteria
- Dependency graph

### Supporting Documents (attach as context):

| Document | When to Attach |
|----------|---------------|
| `02-design-system-architecture.md` | Phase 2 (Design System Core) |
| `04-ui-component-architecture.md` | Phase 3 (Pattern Library) |
| `05-layout-and-navigation-architecture.md` | Phase 4 (Layout Migration) |
| `06-feature-ui-patterns.md` | Phase 5 (Feature Module Migration) |
| `07-theming-and-branding.md` | Phase 2 & 6 (Tokens & Dark Mode) |
| `09-long-term-ui-maintenance-guidelines.md` | Throughout (reference) |

---

## Prompt Strategy

### Rule 1: One Phase at a Time

Don't ask the AI to execute the entire plan in one prompt. Break it by phase.

### Rule 2: Attach Relevant Documents

Always attach:
- `08-step-by-step-refactoring-roadmap.md` (the execution guide)
- The supporting doc relevant to the current phase

### Rule 3: State Step Numbers Explicitly

```
Execute Step 1 from the roadmap: Initialize shared UI library
```

### Rule 4: Verify Before Moving On

After each batch (1-5 steps), verify the app still runs:

```bash
pnpm install
pnpm typecheck
pnpm dev
```

---

## Token Limits & Batch Sizing

### Context Window Limits

Most AI coding agents (including Claude Sonnet 4.5) have:
- **Input context**: ~200K tokens (~400 pages of text)
- **Output limit**: ~16K tokens per response

### Recommended Batch Sizes

| Phase | Steps per Prompt | Reason |
|-------|-----------------|--------|
| **Phase 1** (Foundation) | 5 steps (all) | Simple setup, no complex code |
| **Phase 2** (Design System) | 2-3 steps | Each step generates many components |
| **Phase 3** (Patterns) | 2-3 steps | Complex components with lots of code |
| **Phase 4** (Layouts) | 2-3 steps | Medium complexity |
| **Phase 5** (Features) | 1-2 steps | Each feature is large, verify frequently |
| **Phase 6** (Polish) | 2-4 steps | Mix of simple and complex |

### When to Attach Documents

**Always attach in first prompt**:
- `08-step-by-step-refactoring-roadmap.md`

**Attach phase-specific docs when entering that phase**:
- Phase 2: + `02-design-system-architecture.md`, `07-theming-and-branding.md`
- Phase 3: + `06-feature-ui-patterns.md`
- Phase 4: + `05-layout-and-navigation-architecture.md`
- Phase 5: + `04-ui-component-architecture.md`, `06-feature-ui-patterns.md`

---

## Phase-by-Phase Prompts

### Phase 1: Foundation (Steps 1-5)

**Prompt 1** — Execute all 5 foundation steps:

```
I need you to execute Phase 1 (Foundation) of the UI refactoring roadmap.

Please complete Steps 1-5 from the attached roadmap document:
- Step 1: Initialize shared UI library
- Step 2: Set up shadcn/ui CLI
- Step 3: Create design token CSS file
- Step 4: Add workspace dependency
- Step 5: Add PostCSS compatibility

Follow the exact tasks listed for each step. After completing all 5 steps, 
verify that:
1. pnpm install succeeds
2. The app compiles (pnpm typecheck)
3. The app starts (pnpm dev)

Attachments: 
- 08-step-by-step-refactoring-roadmap.md
- 07-theming-and-branding.md (for Step 3 token definitions)
```

**What to expect**: The AI will create:
- `libs/ui/` directory structure
- `components.json`
- `globals.css` with all design tokens
- Updated `package.json` and `tsconfig.json`

---

### Phase 2: Design System Core (Steps 6-12)

**Prompt 2** — Generate primitives (Steps 6-7):

```
Execute Steps 6-7 from Phase 2:
- Step 6: Generate shadcn/ui primitive components
- Step 7: Generate additional primitives

Use the shadcn CLI as specified in the roadmap. Generate all components into 
libs/ui/src/components/ and export them from libs/ui/src/index.ts.

Verify all components are generated and exported correctly.

Attachments:
- 08-step-by-step-refactoring-roadmap.md
```

**Prompt 3** — Create utilities and custom variants (Steps 8-9):

```
Execute Steps 8-9:
- Step 8: Create cn() utility and hooks
- Step 9: Create ButtonVariants with CVA

Verify that the cn() utility works and Button has all required variants 
(default, destructive, outline, secondary, ghost, link, success).

Attachments:
- 08-step-by-step-refactoring-roadmap.md
```

**Prompt 4** — Create initial patterns (Steps 10-12):

```
Execute Steps 10-12:
- Step 10: Create StatusBadge pattern component
- Step 11: Create StatsCard pattern
- Step 12: Create ConfirmDialog and FormDialog

Use the exact component code from document 06 (Feature UI Patterns).

Verify each pattern renders correctly.

Attachments:
- 08-step-by-step-refactoring-roadmap.md
- 06-feature-ui-patterns.md
```

---

### Phase 3: Pattern Library (Steps 13-20)

**Prompt 5** — DataTable foundation (Steps 13-16):

```
Execute Steps 13-16 from Phase 3:
- Step 13: Create DataTable column types
- Step 14: Create useDataTable hook
- Step 15: Create DataTablePagination
- Step 16: Create DataTable component

Follow the exact implementations from document 06, section 2 (DataTable Pattern).

Verify the DataTable renders with mock data.

Attachments:
- 08-step-by-step-refactoring-roadmap.md
- 06-feature-ui-patterns.md (DataTable section)
```

**Prompt 6** — Remaining patterns (Steps 17-20):

```
Execute Steps 17-20:
- Step 17: Create FilterBar pattern
- Step 18: Create Form pattern components
- Step 19: Create EmptyState pattern
- Step 20: Create ActivityLog and DashboardGrid patterns

Use implementations from document 06.

Verify all patterns are exported from @busmate/ui.

Attachments:
- 08-step-by-step-refactoring-roadmap.md
- 06-feature-ui-patterns.md
```

---

### Phase 4: Layout Migration (Steps 21-26)

**Prompt 7** — Create layout components (Steps 21-24):

```
Execute Steps 21-24 from Phase 4:
- Step 21: Create AppShell layout component
- Step 22: Create Sidebar component
- Step 23: Create Header component
- Step 24: Create content layout components

Use the implementations from document 05 (Layout and Navigation Architecture).

Verify the components compile and export correctly.

Attachments:
- 08-step-by-step-refactoring-roadmap.md
- 05-layout-and-navigation-architecture.md
```

**Prompt 8** — Create navigation configs (Step 25):

```
Execute Step 25:
- Create navigation config files for all 4 role portals

Use the navigation config structure from document 05, section 8.2.

Verify the config exports motNavigation, adminNavigation, operatorNavigation, 
and timekeeperNavigation.

Attachments:
- 08-step-by-step-refactoring-roadmap.md
- 05-layout-and-navigation-architecture.md
```

**Prompt 9** — Migrate MOT layout (Step 26a):

```
Execute Step 26a:
- Migrate MOT layout to use AppShell + Sidebar + Header

Follow the implementation example in document 05, section 9.1 and 9.2.

IMPORTANT: Keep the old SidebarClient.tsx intact (other roles still use it).

After migration, verify:
1. MOT portal loads correctly
2. Sidebar navigation works
3. Sidebar collapses/expands
4. User can navigate between MOT pages

Attachments:
- 08-step-by-step-refactoring-roadmap.md
- 05-layout-and-navigation-architecture.md
```

**Prompt 10** — Migrate remaining layouts (Steps 26b-26e):

```
Execute Steps 26b-26e:
- Step 26b: Migrate Admin layout
- Step 26c: Migrate Operator layout
- Step 26d: Migrate Timekeeper layout
- Step 26e: Remove old layout components

Verify all 4 portals work correctly with the new layout system.

After Step 26e, verify:
- No broken imports
- All portals load correctly
- Sidebar works in all portals

Attachments:
- 08-step-by-step-refactoring-roadmap.md
- 05-layout-and-navigation-architecture.md
```

---

### Phase 5: Feature Module Migration (Steps 27-40)

⚠️ **This is the longest phase. Do ONE feature at a time.**

**Prompt 11** — Migrate Bus Stops (Step 27):

```
Execute Step 27:
- Migrate the Bus Stops feature to the new pattern-based architecture

Follow the Feature Migration Template from document 08, section 6.

Create:
1. bus-stops-columns.tsx (column definitions)
2. bus-stops-table.tsx (compose DataTable)
3. bus-stops-filter-bar.tsx (compose FilterBar)
4. bus-stops-stats-cards.tsx (compose StatsCardGrid)
5. Refactor page.tsx to orchestrator pattern

Delete old components that are replaced.

Verify:
- Bus Stops page loads
- Table displays data correctly
- Filters work
- Pagination works
- Delete confirmation dialog works

Attachments:
- 08-step-by-step-refactoring-roadmap.md
- 04-ui-component-architecture.md
- 06-feature-ui-patterns.md
```

**Prompt 12-25** — Migrate remaining features:

Repeat the pattern for each feature (Steps 28-40):

```
Execute Step {N}:
- Migrate {Feature Name} to pattern-based architecture

Follow the same migration pattern as Bus Stops (Step 27).

Special considerations for {Feature Name}:
[List any feature-specific notes from the roadmap]

Verify the feature works correctly after migration.

Attachments:
- 08-step-by-step-refactoring-roadmap.md
- 06-feature-ui-patterns.md
```

**Features to migrate** (one prompt per feature):
- Step 28: Operators
- Step 29: Staff Management
- Step 30: Permits
- Step 31: Fleet Management
- Step 32: Trips
- Step 33: Schedules
- Step 34: Fares
- Step 35: Analytics
- Step 36: Dashboards
- Step 37: Notifications
- Step 38: Settings/Policies
- Step 39: Location Tracking
- Step 40: AI Studio

---

### Phase 6: Polish & Cleanup (Steps 41-46)

**Prompt 26** — Dark mode (Step 41):

```
Execute Step 41:
- Implement dark mode across the entire app

Follow the implementation guide from document 07, section 4 (Dark Mode Implementation).

Verify:
- ThemeProvider is added to root layout
- ThemeSwitcher component works
- All pages render correctly in dark mode
- AG Grid switches themes correctly

Attachments:
- 08-step-by-step-refactoring-roadmap.md
- 07-theming-and-branding.md
```

**Prompt 27** — Cleanup (Steps 42-44):

```
Execute Steps 42-44:
- Step 42: Remove old shared components
- Step 43: Remove old ui/ components
- Step 44: Apply consistent naming conventions

Verify:
- No broken imports
- App compiles successfully
- All imports use @busmate/ui

Attachments:
- 08-step-by-step-refactoring-roadmap.md
```

**Prompt 28** — Final verification (Steps 45-46):

```
Execute Steps 45-46:
- Step 45: Accessibility audit
- Step 46: Final verification

Perform all verification tasks listed in the roadmap.

Provide a full report of:
- Build status
- Type check status
- Pages tested
- Issues found (if any)

Attachments:
- 08-step-by-step-refactoring-roadmap.md
```

---

## Verification After Each Step

After each prompt response from the AI, **you** must verify:

### 1. Check for Errors

```bash
# Type check
pnpm tsc --noEmit

# Build check
pnpm build
```

If errors occur, **stop** and ask the AI to fix them before proceeding.

### 2. Visual Verification

```bash
# Start dev server
pnpm dev
```

Navigate to affected pages and verify:
- Page loads without errors
- UI renders correctly
- Interactions work (click, type, scroll)

### 3. Git Checkpoint

After each successful batch, commit:

```bash
git add .
git commit -m "feat(ui): complete step X - {description}"
```

This allows easy rollback if needed.

---

## Error Handling

### If the AI Makes a Mistake

**Prompt for correction**:

```
There's an error: [paste error message]

Please review Step {N} in the roadmap and fix this error.
```

### If You Need to Rollback

```bash
# Revert last commit
git reset --hard HEAD~1

# Or revert to specific commit
git reset --hard {commit-hash}
```

Then re-prompt the AI:

```
Let's retry Step {N}. Here's the error from the previous attempt:
[error details]

Please fix the issue and try again.
```

### If You Need to Skip a Step

Sometimes a step may not apply (e.g., a feature doesn't exist yet). Tell the AI:

```
Skip Step {N} as [reason]. Proceed to Step {N+1}.
```

---

## Example Conversation Flow

### Turn 1: Start Phase 1

**You**:
```
I need to execute the BusMate UI refactoring plan. Let's start with Phase 1.

Please complete Steps 1-5 from the roadmap (Foundation phase).

Attachments:
- 08-step-by-step-refactoring-roadmap.md
- 07-theming-and-branding.md
```

**AI**: [Creates libs/ui/, tokens, configs]

---

### Turn 2: Verify Phase 1

**You**:
```bash
pnpm install
pnpm tsc --noEmit
pnpm dev
```

✅ All checks pass → Commit and continue

---

### Turn 3: Start Phase 2

**You**:
```
Phase 1 is complete. Now execute Steps 6-7 (generate shadcn primitives).

Attachments:
- 08-step-by-step-refactoring-roadmap.md
```

**AI**: [Generates components]

---

### Turn 4: Verify & Continue

Repeat this pattern for every batch of steps.

---

## Tips for Success

### ✅ Do:
- Work in small batches (1-5 steps)
- Verify after each batch
- Commit frequently
- Attach relevant docs to each prompt
- State step numbers explicitly
- Test in the browser, not just compile checks

### ❌ Don't:
- Ask the AI to execute 10+ steps at once
- Skip verification steps
- Proceed if there are errors
- Delete old code until new code is verified working
- Rush through phases

---

## Summary: Your Workflow

```
1. Read 08-step-by-step-refactoring-roadmap.md
2. For each phase:
   a. Prompt AI with 1-5 step batch + attach relevant docs
   b. AI implements the steps
   c. You verify (typecheck, build, browser test)
   d. Commit if successful, or ask AI to fix if errors
   e. Repeat for next batch
3. After all 46 steps: Full verification
4. Done!
```

---

## Estimated Timeline

| Phase | Steps | Prompts | Time |
|-------|-------|---------|------|
| Phase 1 | 5 | 1 | 30 min |
| Phase 2 | 7 | 3 | 2 hours |
| Phase 3 | 8 | 2-3 | 2 hours |
| Phase 4 | 6 | 4 | 2 hours |
| Phase 5 | 14 | 14 | 7 hours |
| Phase 6 | 6 | 3 | 1.5 hours |
| **Total** | **46** | **27-28** | **~15 hours** |

*Note: Times include verification, testing, and fixing any issues.*

---

## Starting Right Now

**Your first prompt should be**:

```
I need to execute the BusMate UI refactoring plan. Let's start with Phase 1 (Foundation).

Please complete Steps 1-5 from the attached roadmap:
- Step 1: Initialize shared UI library
- Step 2: Set up shadcn/ui CLI  
- Step 3: Create design token CSS file
- Step 4: Add workspace dependency
- Step 5: Add PostCSS compatibility

Follow the exact tasks listed for each step in the roadmap document.

After completion, I'll verify that pnpm install, typecheck, and dev server all work.

Attachments:
- 08-step-by-step-refactoring-roadmap.md
- 07-theming-and-branding.md
```

Then verify, commit, and continue with the next batch.

---

**Good luck with your refactoring! 🚀**
