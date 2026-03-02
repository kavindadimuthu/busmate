### Detailed File and Directory Count Summary for Project Cleanup Investigation

Based on the analysis, here's a breakdown of the file and directory counts in your Next.js project (excluding .next, node_modules, and .git for project code focus). This highlights areas with high file counts that may need cleanup, refactoring, or organization.

#### Overall Counts (Excluding .next, node_modules, .git)
- **Total Files**: 568 (project code/assets)
- **Total Directories**: 468

#### File Types (Top Extensions)
- **tsx** (React components): 429
- **ts** (TypeScript files): 113
- **png** (Images): 7
- **svg** (Icons/Images): 6
- **json** (Config/Data): 6
- **md** (Documentation): 3
- **mjs** (Modules): 1
- **ico** (Icons): 1
- **env** (Environment): 1
- **css** (Styles): 1

#### Top-Level Directory Breakdown
- **src/**: 542 files (main code)
- **public/**: 14 files (static assets like images)
- **docs/**: 2 files
- **schema/**: 0 files
- **.vscode/**: 1 file

#### Breakdown of src (Main Code Directory)
- **components/**: 320 files (highest - many React components)
  - **mot/**: 166 files (largest component group - Ministry of Transport related?)
  - **admin/**: 78 files
  - **operator/**: 47 files
  - **timeKeeper/**: 20 files
  - **shared/**: 9 files
  - **ui/**: 0 files
- **app/**: 126 files (Next.js app router pages)
  - **mot/**: 59 files
  - **admin/**: 43 files
  - **operator/**: 14 files
  - **timeKeeper/**: 6 files
- **lib/**: 72 files (utilities and logic)
  - **api-client/**: 58 files (many API client files - potential for consolidation?)
  - **api/**: 7 files
  - **data/**: 3 files
  - **utils/**: 2 files
- **types/**: 14 files
- **hooks/**: 6 files
- **context/**: 1 file
- **supabase/**: 2 files

#### Key Areas for Cleanup Investigation
1. **Components Directory (320 files)**: The `mot` subdirectory alone has 166 files. Consider:
   - Consolidating similar components
   - Moving shared logic to utilities
   - Checking for unused components

2. **API Client (58 files in `lib/api-client/`)**: Many API-related files. Review for:
   - Duplication across endpoints
   - Opportunities to use a more generic API client pattern

3. **App Pages (126 files)**: Spread across admin, mot, operator, timeKeeper. Ensure:
   - Consistent page structure
   - No redundant layouts or components

4. **File Types**: 429 `.tsx` files indicate a component-heavy app. Ensure proper component composition and avoid over-fragmentation.

This breakdown should help identify where to focus cleanup efforts, such as removing unused files, consolidating duplicates, or reorganizing large directories. If you need deeper dives into specific directories (e.g., listing files in `mot` components), let me know!