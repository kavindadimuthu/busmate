/**
 * Post-generation script for OpenAPI client libraries.
 *
 * Neutralizes the generated OpenAPI.ts config so shared libraries
 * remain framework-agnostic. Consumers must configure BASE and TOKEN
 * at runtime via their own setup modules.
 *
 * Usage: node scripts/post-generate-api-client.mjs <path-to-OpenAPI.ts>
 */

import { readFileSync, writeFileSync } from 'node:fs';

const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node scripts/post-generate-api-client.mjs <path-to-OpenAPI.ts>');
  process.exit(1);
}

let content = readFileSync(filePath, 'utf-8');

// Replace BASE value: handles patterns like:
//   BASE: 'http://...'
//   BASE: process.env.NEXT_PUBLIC_... || 'http://...'
//   BASE: import.meta.env.VITE_... || 'http://...'
//   BASE: (process.env... || '...') + '/api'
content = content.replace(
  /BASE: .+,/g,
  "BASE: '',"
);

// Neutralize TOKEN: replace any baked-in async/sync token resolver with undefined.
// This handles multi-line TOKEN blocks (e.g., TOKEN: async () => { ... }),)
content = content.replace(
  /TOKEN: async \(\) => \{[\s\S]*?\},/g,
  'TOKEN: undefined,'
);
content = content.replace(
  /TOKEN: \(\) => \{[\s\S]*?\},/g,
  'TOKEN: undefined,'
);

writeFileSync(filePath, content, 'utf-8');

console.log(`Neutralized BASE URL and TOKEN in ${filePath}`);
