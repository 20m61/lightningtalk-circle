#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple color functions for output
const colors = {
  blue: text => `\x1b[34m${text}\x1b[0m`,
  green: text => `\x1b[32m${text}\x1b[0m`,
  yellow: text => `\x1b[33m${text}\x1b[0m`,
  red: text => `\x1b[31m${text}\x1b[0m`,
  gray: text => `\x1b[90m${text}\x1b[0m`,
  bold: text => `\x1b[1m${text}\x1b[0m`
};

class DocumentLinkChecker {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.docsDir = path.join(this.projectRoot, 'docs-new');
    this.brokenLinks = [];
    this.checkedFiles = [];
    this.totalLinks = 0;
    this.fixLinks = process.argv.includes('--fix');

    console.log(colors.bold('🔗 Lightning Talk Circle - Document Link Checker'));
    console.log(colors.gray(`Project root: ${this.projectRoot}`));
    console.log(colors.gray(`Fix mode: ${this.fixLinks ? 'ON' : 'OFF'}`));
    console.log('');
  }

  findMarkdownFiles(directory) {
    const files = [];

    const scanDirectory = dir => {
      if (!fs.existsSync(dir)) {return;}

      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (item.endsWith('.md')) {
          files.push(fullPath);
        }
      });
    };

    scanDirectory(directory);
    return files;
  }

  extractLinks(content, filePath) {
    const links = [];

    // Match markdown links: [text](link)
    const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const linkText = match[1];
      const linkUrl = match[2];
      const lineNumber = content.substring(0, match.index).split('\n').length;

      // Skip external links (http/https)
      if (linkUrl.startsWith('http://') || linkUrl.startsWith('https://')) {
        continue;
      }

      // Skip anchors and special links
      if (linkUrl.startsWith('#') || linkUrl.startsWith('mailto:') || linkUrl.startsWith('tel:')) {
        continue;
      }

      links.push({
        text: linkText,
        url: linkUrl,
        line: lineNumber,
        file: filePath
      });
    }

    return links;
  }

  resolveLink(linkUrl, sourceFile) {
    // Handle relative links
    let resolvedPath;

    if (linkUrl.startsWith('./') || linkUrl.startsWith('../')) {
      // Relative to current file
      const sourceDir = path.dirname(sourceFile);
      resolvedPath = path.resolve(sourceDir, linkUrl);
    } else if (linkUrl.startsWith('/')) {
      // Absolute from project root
      resolvedPath = path.resolve(this.projectRoot, linkUrl.substring(1));
    } else {
      // Relative to current file
      const sourceDir = path.dirname(sourceFile);
      resolvedPath = path.resolve(sourceDir, linkUrl);
    }

    return resolvedPath;
  }

  checkLinkExists(linkPath) {
    // Remove hash fragments
    const cleanPath = linkPath.split('#')[0];

    // Check if file exists
    if (fs.existsSync(cleanPath)) {
      return true;
    }

    // If it's a directory, check for index.md
    const indexPath = path.join(cleanPath, 'index.md');
    if (fs.existsSync(indexPath)) {
      return true;
    }

    return false;
  }

  suggestFix(brokenLink) {
    const suggestions = [];
    const linkFileName = path.basename(brokenLink.url);

    // Search for files with similar names
    const allFiles = this.findMarkdownFiles(this.projectRoot);
    allFiles.forEach(file => {
      const fileName = path.basename(file);
      if (fileName === linkFileName) {
        const relativePath = path.relative(path.dirname(brokenLink.file), file);
        suggestions.push(relativePath);
      }
    });

    return suggestions;
  }

  fixBrokenLink(brokenLink, newUrl) {
    if (!this.fixLinks) {
      return false;
    }

    try {
      const content = fs.readFileSync(brokenLink.file, 'utf8');
      const oldLink = `[${brokenLink.text}](${brokenLink.url})`;
      const newLink = `[${brokenLink.text}](${newUrl})`;
      const updatedContent = content.replace(oldLink, newLink);

      fs.writeFileSync(brokenLink.file, updatedContent);
      console.log(colors.green(`✅ Fixed: ${brokenLink.url} → ${newUrl}`));
      return true;
    } catch (error) {
      console.error(colors.red(`❌ Failed to fix link: ${error.message}`));
      return false;
    }
  }

  checkFile(filePath) {
    console.log(colors.gray(`📄 Checking: ${path.relative(this.projectRoot, filePath)}`));

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const links = this.extractLinks(content, filePath);

      this.totalLinks += links.length;

      links.forEach(link => {
        const resolvedPath = this.resolveLink(link.url, filePath);

        if (!this.checkLinkExists(resolvedPath)) {
          this.brokenLinks.push({
            ...link,
            resolvedPath
          });

          console.log(colors.red(`❌ Broken link: ${link.url} (line ${link.line})`));

          // Try to suggest fixes
          const suggestions = this.suggestFix(link);
          if (suggestions.length > 0) {
            console.log(colors.yellow(`💡 Suggestions: ${suggestions.join(', ')}`));

            // Auto-fix if there's only one suggestion and fix mode is enabled
            if (this.fixLinks && suggestions.length === 1) {
              this.fixBrokenLink(link, suggestions[0]);
            }
          }
        }
      });

      this.checkedFiles.push(filePath);
    } catch (error) {
      console.error(colors.red(`❌ Error reading file ${filePath}: ${error.message}`));
    }
  }

  generateReport() {
    const reportPath = path.join(this.projectRoot, 'LINK-CHECK-REPORT.md');
    const timestamp = new Date().toISOString();

    const reportContent = `# Documentation Link Check Report

**Generated:** ${timestamp}
**Files checked:** ${this.checkedFiles.length}
**Total links:** ${this.totalLinks}
**Broken links:** ${this.brokenLinks.length}

## Summary

${
  this.brokenLinks.length === 0
    ? '✅ All links are working correctly!'
    : `❌ Found ${this.brokenLinks.length} broken link(s)`
}

${
  this.brokenLinks.length > 0
    ? `
## Broken Links

${this.brokenLinks
    .map(
      link => `
### ${path.relative(this.projectRoot, link.file)}:${link.line}
- **Link text:** ${link.text}
- **URL:** ${link.url}
- **Resolved path:** ${link.resolvedPath}
`
    )
    .join('')}

## How to Fix

1. Review the broken links listed above
2. Update the links to point to the correct files
3. Run this check again with: \`npm run docs:check-links\`
4. Use \`npm run docs:check-links --fix\` for automatic fixes (when possible)
`
    : ''
}

## Files Checked

${this.checkedFiles.map(file => `- ${path.relative(this.projectRoot, file)}`).join('\n')}

---
Generated by Lightning Talk Circle Link Checker
`;

    fs.writeFileSync(reportPath, reportContent);
    console.log(colors.blue(`📊 Report saved: ${reportPath}`));
  }

  async check() {
    console.log(colors.bold('🚀 Starting link check...\n'));

    // Find all markdown files
    const files = [
      ...this.findMarkdownFiles(this.docsDir),
      ...this.findMarkdownFiles(path.join(this.projectRoot, 'docs')), // Check old docs too
      path.join(this.projectRoot, 'README.md'),
      path.join(this.projectRoot, 'CLAUDE.md')
    ].filter(file => fs.existsSync(file));

    console.log(colors.blue(`📋 Found ${files.length} markdown files to check\n`));

    // Check each file
    files.forEach(file => this.checkFile(file));

    console.log(`\n${colors.bold('📊 Check Results:')}`);
    console.log(`Files checked: ${colors.blue(this.checkedFiles.length)}`);
    console.log(`Total links: ${colors.blue(this.totalLinks)}`);
    console.log(
      `Broken links: ${this.brokenLinks.length > 0 ? colors.red(this.brokenLinks.length) : colors.green('0')}`
    );

    // Generate report
    console.log(`\n${colors.blue('📄 Generating report...')}`);
    this.generateReport();

    if (this.brokenLinks.length === 0) {
      console.log(colors.bold(colors.green('\n✅ All links are working correctly!')));
    } else {
      console.log(colors.bold(colors.red(`\n❌ Found ${this.brokenLinks.length} broken link(s)`)));
      console.log(colors.yellow('💡 Use --fix flag to attempt automatic repairs'));
      process.exit(1);
    }
  }
}

// Run link checker
const checker = new DocumentLinkChecker();
checker.check().catch(error => {
  console.error(colors.red(`❌ Link check failed: ${error.message}`));
  process.exit(1);
});
