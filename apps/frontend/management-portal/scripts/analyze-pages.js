#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  mode: args.includes('--file') ? 'file' : 'console',
  outputDir: 'reports/page-analysis',
};

// Path to the app directory
const appPath = path.join(__dirname, '../src/app');

// Function to recursively find all page directories
function findPages(dir, relativePath = '') {
  const pages = [];

  // Check if current directory has page.tsx
  const pageFile = path.join(dir, 'page.tsx');
  if (fs.existsSync(pageFile)) {
    pages.push({
      path: relativePath || 'home',
      fullPath: dir,
      pageFile: pageFile
    });
  }

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Recurse into subdirectories
      pages.push(...findPages(fullPath, relativePath ? `${relativePath}/${item}` : item));
    }
  }

  return pages;
}

// Function to parse components from a page file
function parseComponents(pageFile) {
  const content = fs.readFileSync(pageFile, 'utf-8');
  const components = new Set();

  // Path to the components directory
  const componentsDir = path.join(__dirname, '../src/components');
  const projectRoot = path.join(__dirname, '..');

  // Find import statements
  const importRegex = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/gs;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const imports = match[1].split(',').map(s => s.trim());
    let fromPath = match[2];

    let resolvedPath = null;

    if (fromPath.startsWith('@/')) {
      // Handle alias @/ which maps to src/
      const relativePath = fromPath.slice(2); // remove '@/'
      resolvedPath = path.join(projectRoot, 'src', relativePath);
    } else if (fromPath.startsWith('./') || fromPath.startsWith('../')) {
      // Relative import
      resolvedPath = path.resolve(path.dirname(pageFile), fromPath);
    }

    // Only include if it resolves to the components directory
    if (resolvedPath && resolvedPath.startsWith(componentsDir)) {
      imports.forEach(imp => {
        if (imp && !imp.includes(' as ')) {
          components.add(imp);
        }
      });
    }
  }

  return Array.from(components).sort();
}

// Function to build tree structure
function buildTree(pages) {
  const tree = {};

  pages.forEach(page => {
    const parts = page.path.split('/');
    let current = tree;

    parts.forEach((part, index) => {
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
      if (index === parts.length - 1) {
        current._isPage = true;
      }
    });
  });

  return tree;
}

// Function to print tree (now returns string)
function buildTreeString(tree, prefix = '', isLast = true) {
  let result = '';
  const keys = Object.keys(tree).filter(k => k !== '_isPage');
  keys.forEach((key, index) => {
    const isLastItem = index === keys.length - 1;
    const connector = isLastItem ? '└── ' : '├── ';
    const nextPrefix = prefix + (isLast ? '    ' : '│   ');

    result += prefix + connector + key + (tree[key]._isPage ? ' (page)' : '') + '\n';
    result += buildTreeString(tree[key], nextPrefix, isLastItem);
  });
  return result;
}

// Main execution
const pages = findPages(appPath);

// Build outputs
let output = 'BusMate Web Frontend - Page Analysis\n\n';

const tree = buildTree(pages);
const treeString = '=== TREE VIEW ===\n' + buildTreeString(tree) + '\n';

const listString = '=== LIST VIEW ===\n' + pages.map(page => (page.path === 'home' ? '/' : `/${page.path}`)).join('\n') + '\n\n';

let componentsString = '=== PAGES WITH COMPONENTS ===\n';
pages.forEach(page => {
  const components = parseComponents(page.pageFile);
  componentsString += `${page.path === 'home' ? '/' : `/${page.path}`}:\n`;
  if (components.length > 0) {
    components.forEach(comp => componentsString += `  - ${comp}\n`);
  } else {
    componentsString += '  (no components found)\n';
  }
  componentsString += '\n';
});

output += treeString + listString + componentsString;

// Output based on mode
if (options.mode === 'console') {
  console.log(output);
} else if (options.mode === 'file') {
  // Create output directory
  const reportsDir = path.join(__dirname, '..', options.outputDir);
  fs.mkdirSync(reportsDir, { recursive: true });

  // Write files
  fs.writeFileSync(path.join(reportsDir, 'tree-view.txt'), treeString);
  fs.writeFileSync(path.join(reportsDir, 'list-view.txt'), listString);
  fs.writeFileSync(path.join(reportsDir, 'components-view.txt'), componentsString);

  console.log(`Page analysis saved to ${reportsDir}`);
}