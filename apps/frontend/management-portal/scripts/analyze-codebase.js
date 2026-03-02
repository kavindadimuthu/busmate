#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  save: args.includes('--save') || args.includes('-s'),
  outputDir: 'reports/codebase-analysis',
  format: args.includes('--json') ? 'json' : 'text',
  quiet: args.includes('--quiet') || args.includes('-q'),
};

const srcPath = path.join(__dirname, '../src');
const reportsDir = path.join(__dirname, '..', options.outputDir);

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
};

// File extensions to include
const includedExtensions = ['.ts', '.tsx', '.js', '.jsx', '.css', '.scss'];

// Statistics tracker
const stats = {
  totalFiles: 0,
  totalLines: 0,
  totalCodeLines: 0,
  totalCommentLines: 0,
  totalBlankLines: 0,
  byExtension: {},
  byDirectory: {},
  metadata: {
    timestamp: new Date().toISOString(),
    analyzedDirectory: 'src',
    fileExtensions: includedExtensions,
  },
};

/**
 * Count lines in a file
 * Returns { total, code, comments, blank }
 */
function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    let totalLines = lines.length;
    let commentLines = 0;
    let blankLines = 0;
    let inBlockComment = false;

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed === '') {
        blankLines++;
      } else if (trimmed.startsWith('//')) {
        commentLines++;
      } else if (trimmed.startsWith('/*')) {
        inBlockComment = true;
        commentLines++;
      }
      
      if (inBlockComment) {
        if (trimmed.includes('*/')) {
          inBlockComment = false;
        }
      }
    }

    const codeLines = totalLines - commentLines - blankLines;

    return {
      total: totalLines,
      code: codeLines > 0 ? codeLines : 0,
      comments: commentLines,
      blank: blankLines,
    };
  } catch (error) {
    return { total: 0, code: 0, comments: 0, blank: 0 };
  }
}

/**
 * Recursively walk through directory
 */
function walkDir(dirPath, relativePath = '') {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      // Skip node_modules and hidden directories
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
        continue;
      }
      walkDir(fullPath, relPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      
      if (includedExtensions.includes(ext)) {
        stats.totalFiles++;

        // Count lines
        const lineCounts = countLines(fullPath);
        stats.totalLines += lineCounts.total;
        stats.totalCodeLines += lineCounts.code;
        stats.totalCommentLines += lineCounts.comments;
        stats.totalBlankLines += lineCounts.blank;

        // Track by extension
        if (!stats.byExtension[ext]) {
          stats.byExtension[ext] = {
            files: 0,
            lines: 0,
            codeLines: 0,
          };
        }
        stats.byExtension[ext].files++;
        stats.byExtension[ext].lines += lineCounts.total;
        stats.byExtension[ext].codeLines += lineCounts.code;

        // Track by directory
        const dir = path.dirname(relPath) || 'root';
        if (!stats.byDirectory[dir]) {
          stats.byDirectory[dir] = {
            files: 0,
            lines: 0,
            codeLines: 0,
          };
        }
        stats.byDirectory[dir].files++;
        stats.byDirectory[dir].lines += lineCounts.total;
        stats.byDirectory[dir].codeLines += lineCounts.code;
      }
    }
  }
}

/**
 * Format number with commas
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Create directory if it doesn't exist
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Generate timestamped filename
 */
function generateTimestampedFilename(prefix = 'codebase-analysis', extension = 'txt') {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${prefix}-${timestamp}.${extension}`;
}

/**
 * Save analysis results to file
 */
function saveResults(output) {
  ensureDirectoryExists(reportsDir);

  const filename = generateTimestampedFilename('codebase-analysis', options.format === 'json' ? 'json' : 'txt');
  const filePath = path.join(reportsDir, filename);

  fs.writeFileSync(filePath, output, 'utf-8');

  // Update or create index file
  updateReportsIndex(filename);

  return filePath;
}

/**
 * Update reports index file
 */
function updateReportsIndex(newReportFilename) {
  const indexPath = path.join(reportsDir, 'index.json');
  let index = { reports: [] };

  if (fs.existsSync(indexPath)) {
    try {
      index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    } catch (error) {
      // If index is corrupted, start fresh
      index = { reports: [] };
    }
  }

  // Add new report
  const reportEntry = {
    filename: newReportFilename,
    timestamp: stats.metadata.timestamp,
    totalFiles: stats.totalFiles,
    totalLines: stats.totalLines,
    totalCodeLines: stats.totalCodeLines,
  };

  index.reports.push(reportEntry);

  // Sort by timestamp (newest first)
  index.reports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Keep only last 50 reports to prevent index from growing too large
  if (index.reports.length > 50) {
    index.reports = index.reports.slice(0, 50);
  }

  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8');
}

/**
 * Generate JSON output
 */
function generateJsonOutput() {
  const sortedExtensions = Object.entries(stats.byExtension)
    .sort((a, b) => b[1].codeLines - a[1].codeLines);

  const sortedDirs = Object.entries(stats.byDirectory)
    .sort((a, b) => b[1].codeLines - a[1].codeLines);

  const avgLinesPerFile = Math.round(stats.totalCodeLines / stats.totalFiles);
  const avgCodeDensity = ((stats.totalCodeLines / stats.totalLines) * 100).toFixed(1);

  return JSON.stringify({
    metadata: stats.metadata,
    overview: {
      totalFiles: stats.totalFiles,
      totalLines: stats.totalLines,
      totalCodeLines: stats.totalCodeLines,
      totalCommentLines: stats.totalCommentLines,
      totalBlankLines: stats.totalBlankLines,
      codeDensity: parseFloat(avgCodeDensity),
      averageLinesPerFile: avgLinesPerFile,
    },
    byExtension: sortedExtensions.map(([ext, data]) => ({
      extension: ext,
      files: data.files,
      lines: data.lines,
      codeLines: data.codeLines,
    })),
    byDirectory: sortedDirs.map(([dir, data]) => ({
      directory: dir,
      files: data.files,
      lines: data.lines,
      codeLines: data.codeLines,
    })),
  }, null, 2);
}

/**
 * Print header
 */
function printHeader(text) {
  const header = `\n${'='.repeat(60)}\n${text}\n${'='.repeat(60)}\n`;
  if (!options.quiet) {
    console.log(`${colors.bright}${colors.cyan}${header}${colors.reset}`);
  }
  return header;
}

/**
 * Generate text output
 */
function generateTextOutput() {
  let output = '';

  output += `📊 Analyzing codebase...\n\n`;

  // Overview
  output += printHeader('📈 CODEBASE OVERVIEW');
  output += `✓ Total Files: ${formatNumber(stats.totalFiles)}\n`;
  output += `✓ Total Lines: ${formatNumber(stats.totalLines)}\n`;
  output += `✓ Code Lines: ${formatNumber(stats.totalCodeLines)} (${((stats.totalCodeLines / stats.totalLines) * 100).toFixed(1)}%)\n`;
  output += `✓ Comment Lines: ${formatNumber(stats.totalCommentLines)} (${((stats.totalCommentLines / stats.totalLines) * 100).toFixed(1)}%)\n`;
  output += `✓ Blank Lines: ${formatNumber(stats.totalBlankLines)} (${((stats.totalBlankLines / stats.totalLines) * 100).toFixed(1)}%)\n`;

  // By file type
  output += printHeader('📄 BREAKDOWN BY FILE TYPE');
  const sortedExtensions = Object.entries(stats.byExtension)
    .sort((a, b) => b[1].codeLines - a[1].codeLines);

  output += `File Type${''.padEnd(15)} | Files${''.padEnd(8)} | Lines${''.padEnd(10)} | Code Lines${''.padEnd(12)}\n`;
  output += '-'.repeat(55) + '\n';

  for (const [ext, data] of sortedExtensions) {
    const extDisplay = ext.padEnd(15);
    const filesDisplay = data.files.toString().padEnd(8);
    const linesDisplay = formatNumber(data.lines).padEnd(10);
    const codeDisplay = formatNumber(data.codeLines).padEnd(12);
    output += `${extDisplay} | ${filesDisplay} | ${linesDisplay} | ${codeDisplay}\n`;
  }

  // By directory
  output += printHeader('📁 BREAKDOWN BY DIRECTORY');
  const sortedDirs = Object.entries(stats.byDirectory)
    .sort((a, b) => b[1].codeLines - a[1].codeLines);

  output += `Directory${''.padEnd(35)} | Files${''.padEnd(8)} | Code Lines${''.padEnd(12)}\n`;
  output += '-'.repeat(65) + '\n';

  for (const [dir, data] of sortedDirs) {
    const dirDisplay = dir.padEnd(35);
    const filesDisplay = data.files.toString().padEnd(8);
    const codeDisplay = formatNumber(data.codeLines).padEnd(12);
    output += `${dirDisplay} | ${filesDisplay} | ${codeDisplay}\n`;
  }

  // Summary statistics
  output += printHeader('📊 SUMMARY STATISTICS');
  const avgLinesPerFile = Math.round(stats.totalCodeLines / stats.totalFiles);
  const avgCodeDensity = ((stats.totalCodeLines / stats.totalLines) * 100).toFixed(1);

  output += `✓ Average Lines per File: ${formatNumber(avgLinesPerFile)}\n`;
  output += `✓ Code Density: ${avgCodeDensity}%\n`;
  output += `✓ File Types: ${sortedExtensions.length}\n`;
  output += `✓ Directories: ${sortedDirs.length}\n`;

  output += `\n✅ Analysis complete!\n`;

  return output;
}

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
${colors.bright}${colors.cyan}📊 Codebase Analysis Tool${colors.reset}

${colors.yellow}Usage:${colors.reset}
  npm run analyze [options]

${colors.yellow}Options:${colors.reset}
  --save, -s          Save analysis results to file
  --json              Output in JSON format (default: text)
  --quiet, -q         Suppress console output when saving to file
  --help, -h          Show this help message

${colors.yellow}Examples:${colors.reset}
  npm run analyze                    # Display in console only
  npm run analyze --save             # Display in console and save to file
  npm run analyze --save --json      # Save as JSON file (quiet)
  npm run analyze --save --quiet     # Save to file only (no console output)

${colors.yellow}Output:${colors.reset}
  Reports are saved to: ${options.outputDir}/
  Index file tracks all reports: ${options.outputDir}/index.json
`);
}

/**
 * Main execution
 */
function analyze() {
  // Check for help flag
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return;
  }

  if (!options.quiet) {
    console.log(`${colors.bright}${colors.blue}📊 Analyzing codebase...${colors.reset}\n`);
  }

  walkDir(srcPath);

  // Generate output based on format
  let output;
  if (options.format === 'json') {
    output = generateJsonOutput();
  } else {
    output = generateTextOutput();
  }

  // Display in console (unless quiet mode)
  if (!options.quiet) {
    if (options.format === 'json') {
      console.log(output);
    } else {
      // Text output is already formatted for console
      console.log(output);
    }
  }

  // Save to file if requested
  if (options.save) {
    const filePath = saveResults(output);
    const relativePath = path.relative(process.cwd(), filePath);

    if (!options.quiet) {
      console.log(`${colors.green}💾 Report saved to: ${relativePath}${colors.reset}`);
      console.log(`${colors.gray}   View all reports: ${path.relative(process.cwd(), reportsDir)}/${colors.reset}`);
    } else {
      // In quiet mode, just show the file path
      console.log(relativePath);
    }
  }
}

// Run analysis
if (fs.existsSync(srcPath)) {
  analyze();
} else {
  console.error(`${colors.bright}${colors.yellow}⚠️  src directory not found at: ${srcPath}${colors.reset}`);
  process.exit(1);
}
