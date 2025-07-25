#!/usr/bin/env node
/**
 * 統合ワークフローCLI
 * 指示から自動的にworktree、開発、テスト、PR、レビュー、マージまでを実行
 */

import AutoWorkflowOrchestrator from './auto-workflow.js';
import InstructionDispatcher from './instruction-dispatcher.js';
import QualityGateSystem from './quality-gates.js';
import chalk from 'chalk';
import { program } from 'commander';

class WorkflowCLI {
  constructor() {
    this.setupCommands();
  }

  setupCommands() {
    program
      .name('workflow-cli')
      .description('Automated development workflow management')
      .version('1.0.0');

    // 指示実行コマンド
    program
      .command('execute <instruction>')
      .description('Execute a development instruction automatically')
      .option('-a, --auto-merge', 'Enable auto-merge after successful review')
      .option('-p, --parallel', 'Run tests in parallel')
      .option('--dry-run', 'Show what would be done without executing')
      .action(async(instruction, options) => {
        await this.executeInstruction(instruction, options);
      });

    // 指示分析コマンド
    program
      .command('analyze <instruction>')
      .description('Analyze an instruction without executing')
      .option('-o, --output <file>', 'Output analysis to file')
      .action(async(instruction, options) => {
        await this.analyzeInstruction(instruction, options);
      });

    // 品質ゲートコマンド
    program
      .command('quality-check')
      .description('Run quality gates on current code')
      .option('-c, --coverage <number>', 'Coverage threshold', '80')
      .option('-p, --parallel', 'Run checks in parallel')
      .option('--export <file>', 'Export results to file')
      .action(async options => {
        await this.runQualityCheck(options);
      });

    // ワークフロー状態確認
    program
      .command('status')
      .description('Show workflow status and active branches')
      .action(async() => {
        await this.showStatus();
      });

    // インタラクティブモード
    program
      .command('interactive')
      .alias('i')
      .description('Start interactive workflow mode')
      .action(async() => {
        await this.startInteractiveMode();
      });

    // ワークフロー履歴
    program
      .command('history')
      .description('Show workflow execution history')
      .option('-n, --count <number>', 'Number of entries to show', '10')
      .action(async options => {
        await this.showHistory(options);
      });

    program.parse();
  }

  /**
   * 指示を実行
   */
  async executeInstruction(instruction, options) {
    console.log(chalk.cyan('🚀 Starting Automated Workflow Execution'));
    console.log(chalk.gray('─'.repeat(50)));

    try {
      // 1. 指示を分析
      console.log(chalk.blue('📋 Step 1: Analyzing instruction...'));
      const dispatcher = new InstructionDispatcher();
      const analysis = dispatcher.analyzeInstruction(instruction);

      if (options.dryRun) {
        dispatcher.displayAnalysis(analysis);
        console.log(chalk.yellow('\n🔍 DRY RUN MODE - No changes will be made'));
        return;
      }

      // 2. ワークフローを実行
      console.log(chalk.blue('\n⚙️  Step 2: Executing workflow...'));
      const orchestrator = new AutoWorkflowOrchestrator();

      // 設定を適用
      if (options.autoMerge) {
        process.env.AUTO_MERGE = 'true';
      }

      const result = await orchestrator.executeWorkflow(instruction);

      // 3. 結果をレポート
      console.log(chalk.blue('\n📊 Step 3: Workflow completed'));
      this.displayExecutionResult(result);

      // 4. 履歴に記録
      await this.recordExecution(instruction, analysis, result);
    } catch (error) {
      console.error(chalk.red('❌ Workflow execution failed:'), error.message);
      process.exit(1);
    }
  }

  /**
   * 指示を分析のみ
   */
  async analyzeInstruction(instruction, options) {
    const dispatcher = new InstructionDispatcher();
    const analysis = dispatcher.analyzeInstruction(instruction);

    dispatcher.displayAnalysis(analysis);

    if (options.output) {
      dispatcher.exportAnalysis(analysis, options.output);
    }
  }

  /**
   * 品質チェック実行
   */
  async runQualityCheck(options) {
    const qualityGates = new QualityGateSystem({
      coverage: parseInt(options.coverage),
      parallel: options.parallel
    });

    const results = await qualityGates.runAllGates();

    if (options.export) {
      qualityGates.exportResults(options.export);
    }

    return results;
  }

  /**
   * ワークフロー状態表示
   */
  async showStatus() {
    console.log(chalk.cyan('📊 Workflow Status Report'));
    console.log(chalk.gray('═'.repeat(50)));

    // Git状態
    console.log(chalk.white('\n🌳 Git Status:'));
    try {
      const { execSync } = await import('child_process');

      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      console.log(`   Current Branch: ${chalk.green(currentBranch)}`);

      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (status.trim()) {
        console.log(`   Working Directory: ${chalk.yellow('Modified files present')}`);
      } else {
        console.log(`   Working Directory: ${chalk.green('Clean')}`);
      }

      // Worktree一覧
      try {
        const worktrees = execSync('git worktree list', { encoding: 'utf8' });
        console.log(chalk.white('\n🌿 Active Worktrees:'));
        worktrees
          .split('\n')
          .filter(line => line.trim())
          .forEach(line => {
            console.log(`   ${line}`);
          });
      } catch (error) {
        console.log(chalk.gray('   No additional worktrees'));
      }
    } catch (error) {
      console.log(chalk.red('   Error reading git status'));
    }

    // 実行中のプロセス
    console.log(chalk.white('\n🔄 Active Processes:'));
    try {
      const processes = await this.getActiveWorkflowProcesses();
      if (processes.length > 0) {
        processes.forEach(proc => {
          console.log(`   ${proc.name}: ${chalk.blue(proc.status)}`);
        });
      } else {
        console.log(chalk.gray('   No active workflow processes'));
      }
    } catch (error) {
      console.log(chalk.gray('   Could not check process status'));
    }

    // 最近のPR
    console.log(chalk.white('\n📝 Recent Pull Requests:'));
    try {
      const recentPRs = await this.getRecentPullRequests();
      if (recentPRs.length > 0) {
        recentPRs.slice(0, 5).forEach(pr => {
          const status = pr.merged ? '✅ Merged' : pr.draft ? '📝 Draft' : '🔄 Open';
          console.log(`   #${pr.number}: ${pr.title} ${status}`);
        });
      } else {
        console.log(chalk.gray('   No recent pull requests'));
      }
    } catch (error) {
      console.log(chalk.gray('   Could not fetch PR information'));
    }
  }

  /**
   * インタラクティブモード開始
   */
  async startInteractiveMode() {
    const { default: inquirer } = await import('inquirer');

    console.log(chalk.cyan('🎯 Interactive Workflow Mode'));
    console.log(chalk.gray('Type "exit" to quit\n'));

    let shouldContinue = true;
    while (shouldContinue) {
      try {
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
              { name: '📝 Execute new instruction', value: 'execute' },
              { name: '🔍 Analyze instruction', value: 'analyze' },
              { name: '🧪 Run quality check', value: 'quality' },
              { name: '📊 Show status', value: 'status' },
              { name: '📜 Show history', value: 'history' },
              { name: '🚪 Exit', value: 'exit' }
            ]
          }
        ]);

        if (action === 'exit') {
          console.log(chalk.green('👋 Goodbye!'));
          shouldContinue = false;
          break;
        }

        await this.handleInteractiveAction(action);
      } catch (error) {
        if (error.isTtyError) {
          console.log(chalk.red('Interactive mode not supported in this terminal'));
          break;
        }
        console.error(chalk.red('Error:'), error.message);
      }
    }
  }

  /**
   * インタラクティブアクションを処理
   */
  async handleInteractiveAction(action) {
    const { default: inquirer } = await import('inquirer');

    switch (action) {
    case 'execute': {
      const { instruction } = await inquirer.prompt([
        {
          type: 'input',
          name: 'instruction',
          message: 'Enter your development instruction:',
          validate: input => input.trim().length > 0 || 'Instruction cannot be empty'
        }
      ]);

      const { autoMerge } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'autoMerge',
          message: 'Enable auto-merge?',
          default: false
        }
      ]);

      await this.executeInstruction(instruction, { autoMerge });
      break;
    }

    case 'analyze': {
      const { analyzeInstruction } = await inquirer.prompt([
        {
          type: 'input',
          name: 'analyzeInstruction',
          message: 'Enter instruction to analyze:',
          validate: input => input.trim().length > 0 || 'Instruction cannot be empty'
        }
      ]);

      await this.analyzeInstruction(analyzeInstruction, {});
      break;
    }

    case 'quality':
      await this.runQualityCheck({ parallel: true });
      break;

    case 'status':
      await this.showStatus();
      break;

    case 'history':
      await this.showHistory({ count: 10 });
      break;
    }

    // 続行確認
    const { continue: shouldContinue } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: 'Continue with another action?',
        default: true
      }
    ]);

    if (!shouldContinue) {
      console.log(chalk.green('👋 Goodbye!'));
      process.exit(0);
    }
  }

  /**
   * 実行結果表示
   */
  displayExecutionResult(result) {
    if (result.success) {
      console.log(chalk.green('✅ Workflow executed successfully!'));
      console.log(chalk.white('📋 Summary:'));
      console.log(`   Task: ${result.task?.description || 'Unknown'}`);
      console.log(`   Type: ${result.task?.type || 'Unknown'}`);
      console.log(`   PR: ${result.pr?.html_url || 'Not created'}`);
      console.log(`   Status: ${result.merged ? '✅ Merged' : '⏳ Pending Review'}`);
    } else {
      console.log(chalk.red('❌ Workflow failed!'));
      console.log(`   Error: ${result.error}`);
    }
  }

  /**
   * 実行履歴表示
   */
  async showHistory(options) {
    const historyFile = '.workflow-history.json';

    try {
      const { readFileSync } = await import('fs');
      const history = JSON.parse(readFileSync(historyFile, 'utf8'));

      console.log(chalk.cyan('📜 Workflow Execution History'));
      console.log(chalk.gray('─'.repeat(50)));

      const count = parseInt(options.count);
      const entries = history.slice(-count).reverse();

      for (const entry of entries) {
        const status = entry.result.success ? chalk.green('✅ SUCCESS') : chalk.red('❌ FAILED');
        const date = new Date(entry.timestamp).toLocaleDateString();

        console.log(`\n${status} ${chalk.gray(date)}`);
        console.log(`   Instruction: ${chalk.white(entry.instruction)}`);
        console.log(`   Task Type: ${chalk.blue(entry.analysis.taskType)}`);

        if (entry.result.pr) {
          console.log(`   PR: ${chalk.blue(entry.result.pr.html_url)}`);
        }
      }
    } catch (error) {
      console.log(chalk.gray('No execution history found'));
    }
  }

  /**
   * 実行を履歴に記録
   */
  async recordExecution(instruction, analysis, result) {
    const historyFile = '.workflow-history.json';

    try {
      const { readFileSync, writeFileSync } = await import('fs');

      let history = [];
      try {
        history = JSON.parse(readFileSync(historyFile, 'utf8'));
      } catch (error) {
        // ファイルが存在しない場合は新規作成
      }

      const entry = {
        timestamp: new Date().toISOString(),
        instruction,
        analysis,
        result
      };

      history.push(entry);

      // 最新100件のみ保持
      if (history.length > 100) {
        history = history.slice(-100);
      }

      writeFileSync(historyFile, JSON.stringify(history, null, 2));
    } catch (error) {
      console.warn(chalk.yellow('Warning: Could not save execution history'));
    }
  }

  /**
   * アクティブなワークフロープロセスを取得
   */
  async getActiveWorkflowProcesses() {
    // GitHub Actionsの実行状況をチェック（実際の実装では GitHub API を使用）
    return [];
  }

  /**
   * 最近のプルリクエストを取得
   */
  async getRecentPullRequests() {
    // GitHub API でPRを取得（実際の実装ではOctokitを使用）
    return [];
  }
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  new WorkflowCLI();
}

export default WorkflowCLI;
