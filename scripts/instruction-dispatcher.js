#!/usr/bin/env node
/**
 * 指示分析・ディスパッチャー
 * 自然言語の指示を解析し、適切なワークフローに振り分ける
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

class InstructionDispatcher {
  constructor() {
    this.patterns = this.loadPatterns();
    this.context = this.loadContext();

    this.log = {
      info: msg => console.log(chalk.blue('📋'), msg),
      success: msg => console.log(chalk.green('✅'), msg),
      warning: msg => console.log(chalk.yellow('⚠️ '), msg),
      error: msg => console.log(chalk.red('❌'), msg)
    };
  }

  /**
   * パターン定義を読み込み
   */
  loadPatterns() {
    return {
      // 機能開発パターン
      feature: {
        keywords: ['add', 'implement', 'create', 'build', 'develop', 'make'],
        patterns: [
          /(?:add|implement|create|build|develop|make)\s+(?:a\s+)?(.+?)(?:\s+feature|\s+functionality|\s+component|$)/i,
          /(?:add|implement|create|build)\s+(.+?)(?:\s+to|\s+for|\s+in|$)/i,
          /(?:develop|make)\s+(.+?)(?:\s+that|\s+which|$)/i
        ],
        priority: 'medium',
        estimatedHours: 4
      },

      // バグ修正パターン
      bugfix: {
        keywords: ['fix', 'resolve', 'repair', 'debug', 'solve'],
        patterns: [
          /(?:fix|resolve|repair|debug|solve)\s+(?:the\s+)?(.+?)(?:\s+bug|\s+issue|\s+problem|$)/i,
          /(?:fix|resolve)\s+(.+?)(?:\s+in|\s+on|\s+with|$)/i,
          /(?:bug|issue|problem)\s+(?:with|in)\s+(.+)/i
        ],
        priority: 'high',
        estimatedHours: 2
      },

      // 緊急修正パターン
      hotfix: {
        keywords: ['hotfix', 'urgent', 'critical', 'emergency', 'asap'],
        patterns: [
          /(?:hotfix|urgent|critical|emergency)\s*:?\s*(.+)/i,
          /(?:fix|resolve)\s+(.+?)(?:\s+urgently|\s+asap|\s+immediately|$)/i,
          /critical\s+(.+?)(?:\s+fix|\s+issue|$)/i
        ],
        priority: 'critical',
        estimatedHours: 1
      },

      // リファクタリングパターン
      refactor: {
        keywords: ['refactor', 'improve', 'optimize', 'clean', 'restructure'],
        patterns: [
          /(?:refactor|improve|optimize|clean|restructure)\s+(.+)/i,
          /(?:make|update)\s+(.+?)(?:\s+better|\s+cleaner|\s+more efficient|$)/i,
          /(?:performance|optimization)\s+(?:of|for)\s+(.+)/i
        ],
        priority: 'low',
        estimatedHours: 3
      },

      // ドキュメント作成パターン
      docs: {
        keywords: ['document', 'doc', 'documentation', 'readme', 'guide'],
        patterns: [
          /(?:document|doc|documentation)\s+(.+)/i,
          /(?:create|write|update)\s+(?:documentation|docs|readme)\s+(?:for|about)\s+(.+)/i,
          /(?:add|write)\s+(.+?)(?:\s+documentation|\s+docs|\s+guide|$)/i
        ],
        priority: 'low',
        estimatedHours: 1
      },

      // テスト作成パターン
      test: {
        keywords: ['test', 'testing', 'spec', 'unit test', 'integration test'],
        patterns: [
          /(?:test|testing)\s+(.+)/i,
          /(?:add|write|create)\s+(?:tests|testing)\s+(?:for|to)\s+(.+)/i,
          /(?:unit|integration|e2e)\s+test(?:s)?\s+(?:for|of)\s+(.+)/i
        ],
        priority: 'medium',
        estimatedHours: 2
      },

      // 設定・インフラパターン
      infrastructure: {
        keywords: ['setup', 'configure', 'deploy', 'infrastructure', 'ci/cd'],
        patterns: [
          /(?:setup|configure|deploy)\s+(.+)/i,
          /(?:infrastructure|ci\/cd|pipeline)\s+(?:for|to)\s+(.+)/i,
          /(?:add|create)\s+(.+?)(?:\s+configuration|\s+setup|$)/i
        ],
        priority: 'medium',
        estimatedHours: 3
      },

      // データベース操作パターン
      database: {
        keywords: ['database', 'db', 'migration', 'schema', 'sql'],
        patterns: [
          /(?:database|db)\s+(.+)/i,
          /(?:migration|schema)\s+(?:for|to)\s+(.+)/i,
          /(?:add|create|update)\s+(.+?)(?:\s+table|\s+model|\s+schema|$)/i
        ],
        priority: 'high',
        estimatedHours: 2
      },

      // API開発パターン
      api: {
        keywords: ['api', 'endpoint', 'route', 'service', 'controller'],
        patterns: [
          /(?:api|endpoint|route)\s+(?:for|to)\s+(.+)/i,
          /(?:add|create|implement)\s+(.+?)(?:\s+api|\s+endpoint|\s+service|$)/i,
          /(?:controller|service)\s+(?:for|to)\s+(.+)/i
        ],
        priority: 'medium',
        estimatedHours: 3
      },

      // UI/UX改善パターン
      ui: {
        keywords: ['ui', 'ux', 'interface', 'design', 'style', 'css'],
        patterns: [
          /(?:ui|ux|interface|design)\s+(.+)/i,
          /(?:style|css)\s+(?:for|of)\s+(.+)/i,
          /(?:improve|update)\s+(.+?)(?:\s+design|\s+interface|\s+ui|$)/i
        ],
        priority: 'medium',
        estimatedHours: 2
      }
    };
  }

  /**
   * プロジェクトコンテキストを読み込み
   */
  loadContext() {
    const context = {
      projectType: 'node.js',
      frameworks: [],
      currentFeatures: [],
      knownIssues: [],
      technicalDebt: []
    };

    try {
      // package.jsonから技術スタックを推測
      if (fs.existsSync('package.json')) {
        const packageData = JSON.parse(fs.readFileSync('package.json', 'utf8'));

        if (packageData.dependencies) {
          const deps = Object.keys(packageData.dependencies);

          if (deps.includes('react')) {
            context.frameworks.push('React');
          }
          if (deps.includes('vue')) {
            context.frameworks.push('Vue');
          }
          if (deps.includes('angular')) {
            context.frameworks.push('Angular');
          }
          if (deps.includes('express')) {
            context.frameworks.push('Express');
          }
          if (deps.includes('fastify')) {
            context.frameworks.push('Fastify');
          }
          if (deps.includes('next')) {
            context.frameworks.push('Next.js');
          }
        }
      }

      // README.mdから機能情報を抽出
      if (fs.existsSync('README.md')) {
        const readmeContent = fs.readFileSync('README.md', 'utf8');
        const featureMatches = readmeContent.match(/## Features?\n(.*?)(?=\n##|\n$)/s);
        if (featureMatches) {
          context.currentFeatures = featureMatches[1]
            .split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.replace(/^-\s*/, '').trim());
        }
      }

      // 既知の問題をGitHubイシューから取得（簡易版）
      if (fs.existsSync('docs/project/known-issues.md')) {
        const issuesContent = fs.readFileSync('docs/project/known-issues.md', 'utf8');
        context.knownIssues = issuesContent
          .split('\n')
          .filter(line => line.trim().startsWith('-'))
          .map(line => line.replace(/^-\s*/, '').trim());
      }
    } catch (error) {
      console.warn('Warning: Could not load full project context:', error.message);
    }

    return context;
  }

  /**
   * 指示を解析してタスクタイプと詳細を特定
   */
  analyzeInstruction(instruction) {
    const analysis = {
      instruction: instruction.trim(),
      taskType: 'unknown',
      description: '',
      priority: 'medium',
      estimatedHours: 2,
      confidence: 0,
      suggestions: [],
      relatedFiles: [],
      prerequisites: []
    };

    let bestMatch = null;
    let bestConfidence = 0;

    // 各パターンタイプをチェック
    for (const [type, config] of Object.entries(this.patterns)) {
      for (const pattern of config.patterns) {
        const match = instruction.match(pattern);
        if (match) {
          const confidence = this.calculateConfidence(instruction, config, match);

          if (confidence > bestConfidence) {
            bestConfidence = confidence;
            bestMatch = {
              type,
              description: match[1]?.trim() || instruction,
              priority: config.priority,
              estimatedHours: config.estimatedHours,
              confidence
            };
          }
        }
      }
    }

    if (bestMatch) {
      Object.assign(analysis, bestMatch);
      analysis.taskType = bestMatch.type;
    } else {
      // パターンマッチしない場合、キーワードベースで推測
      analysis.taskType = this.inferTaskType(instruction);
      analysis.description = instruction;
    }

    // コンテキストベースの拡張分析
    this.enrichWithContext(analysis);

    return analysis;
  }

  /**
   * マッチ信頼度を計算
   */
  calculateConfidence(instruction, config, match) {
    let confidence = 0.5; // ベース信頼度

    // キーワードの存在をチェック
    const lowerInstruction = instruction.toLowerCase();
    const keywordMatches = config.keywords.filter(keyword =>
      lowerInstruction.includes(keyword.toLowerCase())
    ).length;

    confidence += (keywordMatches / config.keywords.length) * 0.3;

    // マッチした部分の長さ
    if (match[1] && match[1].length > 3) {
      confidence += 0.1;
    }

    // 特定のコンテキストキーワード
    const contextBonus = {
      authentication: ['auth', 'login', 'user', 'session'],
      database: ['db', 'sql', 'table', 'schema', 'model'],
      api: ['endpoint', 'route', 'controller', 'service'],
      ui: ['component', 'page', 'style', 'design']
    };

    for (const [context, keywords] of Object.entries(contextBonus)) {
      if (keywords.some(keyword => lowerInstruction.includes(keyword))) {
        confidence += 0.1;
      }
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * キーワードベースのタスクタイプ推測
   */
  inferTaskType(instruction) {
    const lowerInstruction = instruction.toLowerCase();

    const typeScores = {};

    for (const [type, config] of Object.entries(this.patterns)) {
      typeScores[type] = 0;

      for (const keyword of config.keywords) {
        if (lowerInstruction.includes(keyword.toLowerCase())) {
          typeScores[type] += 1;
        }
      }
    }

    const bestType = Object.entries(typeScores).sort(([, a], [, b]) => b - a)[0];

    return bestType[1] > 0 ? bestType[0] : 'feature';
  }

  /**
   * コンテキスト情報で分析を拡張
   */
  enrichWithContext(analysis) {
    // 関連ファイルの推測
    analysis.relatedFiles = this.suggestRelatedFiles(analysis);

    // 前提条件の特定
    analysis.prerequisites = this.identifyPrerequisites(analysis);

    // 改善提案
    analysis.suggestions = this.generateSuggestions(analysis);
  }

  /**
   * 関連ファイルを推測
   */
  suggestRelatedFiles(analysis) {
    const files = [];
    const description = analysis.description.toLowerCase();

    // 一般的なファイルパターン
    const filePatterns = {
      authentication: ['src/auth/', 'src/middleware/auth.js', 'src/models/User.js'],
      database: ['src/models/', 'migrations/', 'src/db/'],
      api: ['src/routes/', 'src/controllers/', 'src/services/'],
      ui: ['src/components/', 'src/pages/', 'src/styles/'],
      test: ['tests/', 'src/**/*.test.js', 'src/**/*.spec.js']
    };

    // 説明文からファイル候補を特定
    for (const [keyword, patterns] of Object.entries(filePatterns)) {
      if (description.includes(keyword)) {
        files.push(...patterns);
      }
    }

    // タスクタイプベースの候補
    switch (analysis.taskType) {
    case 'feature':
      files.push('src/features/', 'src/components/');
      break;
    case 'bugfix':
      files.push('src/', 'tests/');
      break;
    case 'docs':
      files.push('docs/', 'README.md');
      break;
    case 'test':
      files.push('tests/', 'src/**/*.test.js');
      break;
    }

    return [...new Set(files)]; // 重複除去
  }

  /**
   * 前提条件を特定
   */
  identifyPrerequisites(analysis) {
    const prerequisites = [];
    const description = analysis.description.toLowerCase();

    // 技術的前提条件
    if (description.includes('authentication') && !this.context.frameworks.includes('Auth')) {
      prerequisites.push('Install authentication library (e.g., passport, auth0)');
    }

    if (description.includes('database') && !fs.existsSync('src/db/')) {
      prerequisites.push('Setup database connection and models');
    }

    if (description.includes('api') && !this.context.frameworks.includes('Express')) {
      prerequisites.push('Setup API framework (Express, Fastify, etc.)');
    }

    if (analysis.taskType === 'test' && !fs.existsSync('tests/')) {
      prerequisites.push('Setup testing framework (Jest, Mocha, etc.)');
    }

    // プロジェクト固有の前提条件
    if (analysis.taskType === 'feature' && this.context.knownIssues.length > 0) {
      prerequisites.push('Resolve known issues that may conflict');
    }

    return prerequisites;
  }

  /**
   * 改善提案を生成
   */
  generateSuggestions(analysis) {
    const suggestions = [];

    // タスクタイプ別の提案
    switch (analysis.taskType) {
    case 'feature':
      suggestions.push('Consider writing tests alongside the feature');
      suggestions.push('Update documentation after implementation');
      break;

    case 'bugfix':
      suggestions.push('Add regression tests to prevent future occurrences');
      suggestions.push('Consider if this indicates a larger architectural issue');
      break;

    case 'refactor':
      suggestions.push('Ensure comprehensive test coverage before refactoring');
      suggestions.push('Consider performance benchmarks');
      break;

    case 'docs':
      suggestions.push('Include code examples and usage scenarios');
      suggestions.push('Consider adding diagrams for complex concepts');
      break;
    }

    // 優先度別の提案
    if (analysis.priority === 'critical') {
      suggestions.push('Consider creating a hotfix branch');
      suggestions.push('Plan for immediate deployment after testing');
    }

    // 工数別の提案
    if (analysis.estimatedHours > 4) {
      suggestions.push('Consider breaking this into smaller tasks');
      suggestions.push('Plan for incremental delivery');
    }

    return suggestions;
  }

  /**
   * 分析結果をフォーマットして表示
   */
  displayAnalysis(analysis) {
    console.log(chalk.cyan(`\n${'='.repeat(60)}`));
    console.log(chalk.cyan('📋 INSTRUCTION ANALYSIS REPORT'));
    console.log(chalk.cyan('='.repeat(60)));

    console.log(chalk.white('\n📝 Original Instruction:'));
    console.log(chalk.gray(`   "${analysis.instruction}"`));

    console.log(chalk.white('\n🔍 Analysis Results:'));
    console.log(
      `   Task Type: ${this.getTaskTypeEmoji(analysis.taskType)} ${chalk.bold(analysis.taskType.toUpperCase())}`
    );
    console.log(`   Description: ${chalk.green(analysis.description)}`);
    console.log(
      `   Priority: ${this.getPriorityEmoji(analysis.priority)} ${chalk.bold(analysis.priority.toUpperCase())}`
    );
    console.log(`   Estimated Hours: ${chalk.yellow(`${analysis.estimatedHours}h`)}`);
    console.log(`   Confidence: ${chalk.blue(`${Math.round(analysis.confidence * 100)}%`)}`);

    if (analysis.prerequisites.length > 0) {
      console.log(chalk.white('\n⚠️  Prerequisites:'));
      analysis.prerequisites.forEach(prereq => {
        console.log(chalk.yellow(`   • ${prereq}`));
      });
    }

    if (analysis.relatedFiles.length > 0) {
      console.log(chalk.white('\n📁 Related Files:'));
      analysis.relatedFiles.slice(0, 5).forEach(file => {
        console.log(chalk.gray(`   • ${file}`));
      });
      if (analysis.relatedFiles.length > 5) {
        console.log(chalk.gray(`   ... and ${analysis.relatedFiles.length - 5} more`));
      }
    }

    if (analysis.suggestions.length > 0) {
      console.log(chalk.white('\n💡 Suggestions:'));
      analysis.suggestions.forEach(suggestion => {
        console.log(chalk.cyan(`   • ${suggestion}`));
      });
    }

    console.log(chalk.cyan(`\n${'='.repeat(60)}`));
  }

  /**
   * タスクタイプ絵文字を取得
   */
  getTaskTypeEmoji(taskType) {
    const emojis = {
      feature: '🆕',
      bugfix: '🐛',
      hotfix: '🚨',
      refactor: '♻️',
      docs: '📖',
      test: '🧪',
      infrastructure: '⚙️',
      database: '🗄️',
      api: '🔌',
      ui: '🎨',
      unknown: '❓'
    };
    return emojis[taskType] || emojis.unknown;
  }

  /**
   * 優先度絵文字を取得
   */
  getPriorityEmoji(priority) {
    const emojis = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢'
    };
    return emojis[priority] || emojis.medium;
  }

  /**
   * 分析結果をJSONで出力
   */
  exportAnalysis(analysis, outputPath = null) {
    const exportData = {
      ...analysis,
      timestamp: new Date().toISOString(),
      context: this.context
    };

    if (outputPath) {
      fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
      this.log.success(`Analysis exported to ${outputPath}`);
    }

    return exportData;
  }
}

// CLI実行部分
if (import.meta.url === `file://${process.argv[1]}`) {
  const instruction = process.argv[2];
  const outputPath = process.argv[3];

  if (!instruction) {
    console.log(`
Usage: node instruction-dispatcher.js "<instruction>" [output-file]

Examples:
  node instruction-dispatcher.js "add user authentication"
  node instruction-dispatcher.js "fix login bug" analysis.json
  node instruction-dispatcher.js "refactor database connection"
`);
    process.exit(1);
  }

  const dispatcher = new InstructionDispatcher();
  const analysis = dispatcher.analyzeInstruction(instruction);

  dispatcher.displayAnalysis(analysis);

  if (outputPath) {
    dispatcher.exportAnalysis(analysis, outputPath);
  }
}

export default InstructionDispatcher;
