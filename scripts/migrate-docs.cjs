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

class DocumentMigrator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.migrationMapPath = path.join(__dirname, 'docs-migration-map.json');
    this.backupDir = path.join(this.projectRoot, 'docs-backup');
    this.dryRun = process.argv.includes('--dry-run');

    console.log(colors.bold('📚 Lightning Talk Circle - Document Migration Tool'));
    console.log(colors.gray(`Project root: ${this.projectRoot}`));
    console.log(colors.gray(`Dry run mode: ${this.dryRun ? 'ON' : 'OFF'}`));
    console.log('');
  }

  loadMigrationMap() {
    try {
      const mapContent = fs.readFileSync(this.migrationMapPath, 'utf8');
      return JSON.parse(mapContent);
    } catch (error) {
      console.error(colors.red(`❌ Failed to load migration map: ${error.message}`));
      process.exit(1);
    }
  }

  ensureDirectoryExists(dirPath) {
    if (!this.dryRun && !fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(colors.gray(`📁 Created directory: ${dirPath}`));
    }
  }

  createBackup() {
    if (this.dryRun) {
      console.log(colors.yellow('🔍 [DRY RUN] Would create backup of docs/ to docs-backup/'));
      return;
    }

    try {
      this.ensureDirectoryExists(this.backupDir);

      // Copy existing docs to backup
      const docsPath = path.join(this.projectRoot, 'docs');
      if (fs.existsSync(docsPath)) {
        this.copyDirectory(docsPath, this.backupDir);
        console.log(colors.green('✅ Created backup of existing documentation'));
      }

      // Backup root-level docs
      const rootDocs = ['README.md', 'CLAUDE.md'];
      rootDocs.forEach(doc => {
        const sourcePath = path.join(this.projectRoot, doc);
        const targetPath = path.join(this.backupDir, doc);
        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, targetPath);
          console.log(colors.gray(`📋 Backed up: ${doc}`));
        }
      });
    } catch (error) {
      console.error(colors.red(`❌ Backup failed: ${error.message}`));
      process.exit(1);
    }
  }

  copyDirectory(source, target) {
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }

    const items = fs.readdirSync(source);
    items.forEach(item => {
      const sourcePath = path.join(source, item);
      const targetPath = path.join(target, item);

      if (fs.statSync(sourcePath).isDirectory()) {
        this.copyDirectory(sourcePath, targetPath);
      } else {
        fs.copyFileSync(sourcePath, targetPath);
      }
    });
  }

  migrateFile(sourcePath, targetPath, type = 'move') {
    const fullSourcePath = path.resolve(this.projectRoot, sourcePath);
    const fullTargetPath = path.resolve(this.projectRoot, targetPath);

    if (this.dryRun) {
      console.log(colors.yellow(`🔍 [DRY RUN] Would ${type}: ${sourcePath} → ${targetPath}`));
      return;
    }

    if (!fs.existsSync(fullSourcePath)) {
      console.log(colors.red(`⚠️  Source not found: ${sourcePath}`));
      return;
    }

    this.ensureDirectoryExists(path.dirname(fullTargetPath));

    try {
      if (type === 'move') {
        fs.copyFileSync(fullSourcePath, fullTargetPath);
        console.log(colors.green(`✅ Migrated: ${sourcePath} → ${targetPath}`));
      } else if (type === 'split') {
        // For split operations, we'll handle them separately
        console.log(colors.blue(`📝 Split operation: ${sourcePath}`));
      }
    } catch (error) {
      console.error(colors.red(`❌ Migration failed for ${sourcePath}: ${error.message}`));
    }
  }

  migrateDirectory(sourcePath, targetPath) {
    const fullSourcePath = path.resolve(this.projectRoot, sourcePath);
    const fullTargetPath = path.resolve(this.projectRoot, targetPath);

    if (this.dryRun) {
      console.log(
        colors.yellow(`🔍 [DRY RUN] Would migrate directory: ${sourcePath} → ${targetPath}`)
      );
      return;
    }

    if (!fs.existsSync(fullSourcePath)) {
      console.log(colors.red(`⚠️  Source directory not found: ${sourcePath}`));
      return;
    }

    try {
      this.copyDirectory(fullSourcePath, fullTargetPath);
      console.log(colors.green(`✅ Migrated directory: ${sourcePath} → ${targetPath}`));
    } catch (error) {
      console.error(
        colors.red(`❌ Directory migration failed for ${sourcePath}: ${error.message}`)
      );
    }
  }

  handleSpecialMigrations() {
    // Handle README.md split
    const readmePath = path.join(this.projectRoot, 'README.md');
    if (fs.existsSync(readmePath)) {
      if (this.dryRun) {
        console.log(colors.yellow('🔍 [DRY RUN] Would split README.md into quick-start sections'));
        return;
      }

      const readmeContent = fs.readFileSync(readmePath, 'utf8');

      // Create overview from README
      const overviewPath = path.join(this.projectRoot, 'docs-new/quick-start/00-overview.md');
      const overviewContent = `# Lightning Talk Circle - プロジェクト概要

${readmeContent.split('## インストール')[0]}

## 関連ドキュメント

- [ローカル開発環境のセットアップ](01-local-development.md)
- [Docker環境のセットアップ](02-docker-setup.md)
- [初回デプロイメント](03-first-deployment.md)
- [トラブルシューティング](04-troubleshooting.md)
`;

      fs.writeFileSync(overviewPath, overviewContent);
      console.log(colors.green('✅ Created overview from README.md'));
    }

    // Handle troubleshooting consolidation
    const troubleshootingDir = path.join(this.projectRoot, 'docs/troubleshooting');
    if (fs.existsSync(troubleshootingDir)) {
      if (this.dryRun) {
        console.log(colors.yellow('🔍 [DRY RUN] Would consolidate troubleshooting docs'));
        return;
      }

      const troubleshootingPath = path.join(
        this.projectRoot,
        'docs-new/quick-start/04-troubleshooting.md'
      );
      let consolidatedContent = '# トラブルシューティング\n\n';

      const files = fs.readdirSync(troubleshootingDir);
      files.forEach(file => {
        if (file.endsWith('.md')) {
          const filePath = path.join(troubleshootingDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          consolidatedContent += `## ${file.replace('.md', '').replace(/[-_]/g, ' ')}\n\n${content}\n\n`;
        }
      });

      fs.writeFileSync(troubleshootingPath, consolidatedContent);
      console.log(colors.green('✅ Consolidated troubleshooting documentation'));
    }
  }

  updateLinks() {
    if (this.dryRun) {
      console.log(colors.yellow('🔍 [DRY RUN] Would update internal links'));
      return;
    }

    // This would be implemented to update internal links
    // For now, we'll create a placeholder
    console.log(colors.blue('📝 Link updating would be implemented here'));
  }

  generateMigrationReport() {
    const reportPath = path.join(this.projectRoot, 'MIGRATION-REPORT.md');
    const timestamp = new Date().toISOString();

    const reportContent = `# Documentation Migration Report

**Generated:** ${timestamp}
**Mode:** ${this.dryRun ? 'Dry Run' : 'Actual Migration'}

## Migration Summary

This report documents the migration of documentation from the old structure to the new optimized hierarchy.

### New Structure

\`\`\`
docs-new/
├── quick-start/           # Getting started guides
│   ├── 00-overview.md
│   ├── 01-local-development.md
│   ├── 02-docker-setup.md
│   ├── 03-first-deployment.md
│   └── 04-troubleshooting.md
├── deployment/            # Deployment guides
├── api/                   # API documentation
├── architecture/          # System architecture
├── development/           # Development guides
└── legacy/               # Archived documentation
\`\`\`

### Actions Taken

${this.dryRun ? '- This was a dry run - no actual changes were made' : '- Documentation successfully migrated to new structure'}
- Backup created at: \`docs-backup/\`
- Migration map used: \`scripts/docs-migration-map.json\`

### Next Steps

1. Review migrated documentation for accuracy
2. Update internal links using \`npm run docs:check-links\`
3. Test documentation accessibility
4. Remove old documentation structure after verification

---
Generated by Lightning Talk Circle Documentation Migration Tool
`;

    if (!this.dryRun) {
      fs.writeFileSync(reportPath, reportContent);
    }

    console.log(colors.green(`📊 Migration report: ${reportPath}`));
  }

  async migrate() {
    console.log(colors.bold('🚀 Starting documentation migration...\n'));

    // Load migration configuration
    const migrationMap = this.loadMigrationMap();

    // Create backup
    console.log(colors.blue('📦 Creating backup...'));
    this.createBackup();
    console.log('');

    // Process mappings
    console.log(colors.blue('📋 Processing file migrations...'));
    Object.entries(migrationMap.mappings).forEach(([source, config]) => {
      if (config.type === 'directory-move') {
        this.migrateDirectory(source, config.target);
      } else if (config.type === 'move') {
        this.migrateFile(source, config.target, 'move');
      } else if (config.type === 'split') {
        console.log(colors.blue(`📝 Special handling required for: ${source}`));
      } else if (config.type === 'consolidate') {
        console.log(colors.blue(`📝 Consolidation required for: ${source}`));
      }
    });
    console.log('');

    // Handle special migrations
    console.log(colors.blue('🔧 Processing special migrations...'));
    this.handleSpecialMigrations();
    console.log('');

    // Update links
    console.log(colors.blue('🔗 Updating internal links...'));
    this.updateLinks();
    console.log('');

    // Generate report
    console.log(colors.blue('📊 Generating migration report...'));
    this.generateMigrationReport();

    console.log(colors.bold(colors.green('✅ Documentation migration completed!')));

    if (this.dryRun) {
      console.log(
        colors.yellow('\n💡 This was a dry run. Use without --dry-run to perform actual migration.')
      );
    } else {
      console.log(colors.blue('\n💡 Next steps:'));
      console.log('  1. Review migrated files in docs-new/');
      console.log('  2. Run: npm run docs:check-links');
      console.log('  3. Test documentation accessibility');
    }
  }
}

// Run migration
const migrator = new DocumentMigrator();
migrator.migrate().catch(error => {
  console.error(colors.red(`❌ Migration failed: ${error.message}`));
  process.exit(1);
});
