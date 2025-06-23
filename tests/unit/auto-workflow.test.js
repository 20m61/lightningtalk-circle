import { jest } from '@jest/globals';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Mock dependencies
jest.mock('child_process');
jest.mock('fs');
jest.mock('path');
jest.mock('@octokit/rest');
jest.mock('dotenv');
jest.mock('chalk', () => ({
  blue: jest.fn((text) => text),
  green: jest.fn((text) => text),
  yellow: jest.fn((text) => text),
  red: jest.fn((text) => text),
  cyan: jest.fn((text) => text),
  gray: jest.fn((text) => text)
}));

// Import after mocking
import AutoWorkflowOrchestrator from '../../scripts/auto-workflow.js';

describe('AutoWorkflowOrchestrator', () => {
  let orchestrator;
  let consoleSpy;
  let mockOctokit;

  beforeEach(() => {
    // Mock Octokit
    mockOctokit = {
      pulls: {
        create: jest.fn(),
        get: jest.fn(),
        merge: jest.fn(),
        createReview: jest.fn()
      },
      issues: {
        addLabels: jest.fn()
      }
    };

    // Mock the Octokit constructor
    const { Octokit } = require('@octokit/rest');
    Octokit.mockImplementation(() => mockOctokit);

    orchestrator = new AutoWorkflowOrchestrator();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      expect(orchestrator.config.owner).toBe('20m61');
      expect(orchestrator.config.repo).toBe('lightningtalk-circle');
      expect(orchestrator.config.baseBranch).toBe('main');
    });
  });

  describe('parseInstruction', () => {
    it('should parse feature instructions', () => {
      const result = orchestrator.parseInstruction('add user authentication feature');
      
      expect(result.type).toBe('feature');
      expect(result.description).toBe('user authentication');
      expect(result.branchName).toMatch(/^feature\/user-authentication-/);
    });

    it('should parse bugfix instructions', () => {
      const result = orchestrator.parseInstruction('fix login bug');
      
      expect(result.type).toBe('bugfix');
      expect(result.description).toBe('login');
      expect(result.branchName).toMatch(/^bugfix\/login-/);
    });

    it('should parse hotfix instructions', () => {
      const result = orchestrator.parseInstruction('hotfix critical security issue');
      
      expect(result.type).toBe('hotfix');
      expect(result.description).toBe('critical security issue');
      expect(result.branchName).toMatch(/^hotfix\/critical-security-issue-/);
    });

    it('should parse refactor instructions', () => {
      const result = orchestrator.parseInstruction('refactor database connection');
      
      expect(result.type).toBe('refactor');
      expect(result.description).toBe('database connection');
      expect(result.branchName).toMatch(/^refactor\/database-connection-/);
    });

    it('should parse documentation instructions', () => {
      const result = orchestrator.parseInstruction('document API endpoints');
      
      expect(result.type).toBe('docs');
      expect(result.description).toBe('API endpoints');
      expect(result.branchName).toMatch(/^docs\/api-endpoints-/);
    });

    it('should parse test instructions', () => {
      const result = orchestrator.parseInstruction('test user registration');
      
      expect(result.type).toBe('test');
      expect(result.description).toBe('user registration');
      expect(result.branchName).toMatch(/^test\/user-registration-/);
    });

    it('should default to feature for unclear instructions', () => {
      const result = orchestrator.parseInstruction('improve system performance');
      
      expect(result.type).toBe('feature');
      expect(result.description).toBe('improve system performance');
    });
  });

  describe('generateBranchName', () => {
    it('should generate valid branch names', () => {
      const branchName = orchestrator.generateBranchName('feature', 'User Authentication System');
      
      expect(branchName).toMatch(/^feature\/user-authentication-system-\d{6}$/);
    });

    it('should sanitize invalid characters', () => {
      const branchName = orchestrator.generateBranchName('feature', 'Fix @#$% Bug!');
      
      expect(branchName).toMatch(/^feature\/fix--bug-\d{6}$/);
    });

    it('should truncate long descriptions', () => {
      const longDescription = 'This is a very long description that should be truncated to avoid extremely long branch names';
      const branchName = orchestrator.generateBranchName('feature', longDescription);
      
      expect(branchName.length).toBeLessThan(70);
    });
  });

  describe('createWorktree', () => {
    it('should create worktree successfully', async () => {
      fs.existsSync.mockImplementation((path) => {
        if (path.includes('worktreeBase')) return false;
        if (path === '.env.example') return true;
        return false;
      });
      fs.mkdirSync.mockImplementation(() => {});
      fs.copyFileSync.mockImplementation(() => {});
      execSync.mockImplementation(() => {});

      const result = await orchestrator.createWorktree('feature/test-branch');

      expect(result.worktreeName).toBe('feature-test-branch');
      expect(fs.mkdirSync).toHaveBeenCalled();
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('git worktree add'),
        expect.any(Object)
      );
    });

    it('should handle worktree creation errors', async () => {
      execSync.mockImplementation(() => {
        throw new Error('Git worktree failed');
      });

      await expect(orchestrator.createWorktree('feature/test-branch'))
        .rejects.toThrow('Git worktree failed');
    });

    it('should copy .env.example if it exists', async () => {
      fs.existsSync.mockImplementation((path) => {
        if (path === '.env.example') return true;
        return false;
      });
      fs.mkdirSync.mockImplementation(() => {});
      fs.copyFileSync.mockImplementation(() => {});
      execSync.mockImplementation(() => {});

      await orchestrator.createWorktree('feature/test-branch');

      expect(fs.copyFileSync).toHaveBeenCalled();
    });
  });

  describe('executeDevelopmentTask', () => {
    beforeEach(() => {
      // Mock process.chdir to avoid actual directory changes
      jest.spyOn(process, 'chdir').mockImplementation(() => {});
    });

    afterEach(() => {
      process.chdir.mockRestore();
    });

    it('should execute feature implementation', async () => {
      const task = {
        type: 'feature',
        description: 'test feature',
        originalInstruction: 'add test feature'
      };

      orchestrator.implementFeature = jest.fn().mockResolvedValue();

      await orchestrator.executeDevelopmentTask(task, '/test/path');

      expect(orchestrator.implementFeature).toHaveBeenCalledWith(task);
      expect(process.chdir).toHaveBeenCalledWith('/test/path');
    });

    it('should execute bug fix', async () => {
      const task = {
        type: 'bugfix',
        description: 'test bug',
        originalInstruction: 'fix test bug'
      };

      orchestrator.fixBug = jest.fn().mockResolvedValue();

      await orchestrator.executeDevelopmentTask(task, '/test/path');

      expect(orchestrator.fixBug).toHaveBeenCalledWith(task);
    });

    it('should restore original directory after execution', async () => {
      const originalCwd = process.cwd();
      const task = { type: 'feature', description: 'test' };

      orchestrator.implementFeature = jest.fn().mockResolvedValue();

      await orchestrator.executeDevelopmentTask(task, '/test/path');

      expect(process.chdir).toHaveBeenLastCalledWith(originalCwd);
    });

    it('should restore directory even if task fails', async () => {
      const originalCwd = process.cwd();
      const task = { type: 'feature', description: 'test' };

      orchestrator.implementFeature = jest.fn().mockRejectedValue(new Error('Task failed'));

      await expect(orchestrator.executeDevelopmentTask(task, '/test/path'))
        .rejects.toThrow('Task failed');

      expect(process.chdir).toHaveBeenLastCalledWith(originalCwd);
    });
  });

  describe('implementFeature', () => {
    it('should create feature file and update package.json', async () => {
      const task = {
        description: 'user authentication',
        originalInstruction: 'add user authentication feature'
      };

      fs.existsSync.mockImplementation((path) => {
        if (path === 'package.json') return true;
        return false;
      });
      fs.mkdirSync.mockImplementation(() => {});
      fs.writeFileSync.mockImplementation(() => {});
      fs.readFileSync.mockReturnValue(JSON.stringify({ scripts: {} }));
      orchestrator.updatePackageJson = jest.fn();

      await orchestrator.implementFeature(task);

      expect(fs.mkdirSync).toHaveBeenCalledWith('src/features', { recursive: true });
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('user-authentication.js'),
        expect.stringContaining('user authentication')
      );
      expect(orchestrator.updatePackageJson).toHaveBeenCalledWith(task);
    });
  });

  describe('fixBug', () => {
    it('should create bug fix documentation', async () => {
      const task = {
        description: 'login issue',
        originalInstruction: 'fix login bug'
      };

      fs.existsSync.mockReturnValue(false);
      fs.mkdirSync.mockImplementation(() => {});
      fs.writeFileSync.mockImplementation(() => {});

      await orchestrator.fixBug(task);

      expect(fs.mkdirSync).toHaveBeenCalledWith('bugfixes');
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('login-issue.md'),
        expect.stringContaining('Bug Fix: login issue')
      );
    });
  });

  describe('implementHotfix', () => {
    it('should create hotfix marker and implement feature', async () => {
      const task = {
        description: 'security patch',
        originalInstruction: 'hotfix security vulnerability'
      };

      fs.writeFileSync.mockImplementation(() => {});
      orchestrator.implementFeature = jest.fn().mockResolvedValue();

      await orchestrator.implementHotfix(task);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        'HOTFIX.json',
        expect.stringContaining('"priority": "CRITICAL"')
      );
      expect(orchestrator.implementFeature).toHaveBeenCalledWith(task);
    });
  });

  describe('runAutomatedTests', () => {
    beforeEach(() => {
      jest.spyOn(process, 'chdir').mockImplementation(() => {});
    });

    afterEach(() => {
      process.chdir.mockRestore();
    });

    it('should run tests successfully', async () => {
      execSync.mockImplementation(() => {});

      const result = await orchestrator.runAutomatedTests('/test/path');

      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('docker-compose'),
        expect.any(Object)
      );
    });

    it('should handle test failures', async () => {
      execSync.mockImplementation(() => {
        throw new Error('Tests failed');
      });

      const result = await orchestrator.runAutomatedTests('/test/path');

      expect(result).toBe(false);
    });

    it('should restore directory after tests', async () => {
      const originalCwd = process.cwd();
      execSync.mockImplementation(() => {});

      await orchestrator.runAutomatedTests('/test/path');

      expect(process.chdir).toHaveBeenLastCalledWith(originalCwd);
    });
  });

  describe('commitChanges', () => {
    beforeEach(() => {
      jest.spyOn(process, 'chdir').mockImplementation(() => {});
    });

    afterEach(() => {
      process.chdir.mockRestore();
    });

    it('should commit and push changes', async () => {
      const task = {
        type: 'feature',
        description: 'test feature',
        originalInstruction: 'add test feature',
        branchName: 'feature/test-feature'
      };

      execSync.mockImplementation(() => {});

      await orchestrator.commitChanges(task, '/test/path');

      expect(execSync).toHaveBeenCalledWith('git add .', expect.any(Object));
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('git commit -m'),
        expect.any(Object)
      );
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('git push -u origin'),
        expect.any(Object)
      );
    });
  });

  describe('createPullRequest', () => {
    it('should create pull request with correct structure', async () => {
      const task = {
        type: 'feature',
        description: 'user authentication',
        originalInstruction: 'add user authentication feature',
        branchName: 'feature/user-auth'
      };

      const mockPr = {
        number: 123,
        html_url: 'https://github.com/test/repo/pull/123'
      };

      mockOctokit.pulls.create.mockResolvedValue({ data: mockPr });
      mockOctokit.issues.addLabels.mockResolvedValue({});

      const result = await orchestrator.createPullRequest(task);

      expect(mockOctokit.pulls.create).toHaveBeenCalledWith({
        owner: '20m61',
        repo: 'lightningtalk-circle',
        title: 'Feature: user authentication',
        body: expect.stringContaining('add user authentication feature'),
        head: 'feature/user-auth',
        base: 'main'
      });

      expect(mockOctokit.issues.addLabels).toHaveBeenCalledWith({
        owner: '20m61',
        repo: 'lightningtalk-circle',
        issue_number: 123,
        labels: ['enhancement', 'feature']
      });

      expect(result).toBe(mockPr);
    });

    it('should handle PR creation errors', async () => {
      const task = {
        type: 'feature',
        description: 'test',
        branchName: 'feature/test'
      };

      mockOctokit.pulls.create.mockRejectedValue(new Error('API Error'));

      await expect(orchestrator.createPullRequest(task))
        .rejects.toThrow('API Error');
    });
  });

  describe('getPRLabels', () => {
    it('should return correct labels for each task type', () => {
      expect(orchestrator.getPRLabels({ type: 'feature' }))
        .toEqual(['enhancement', 'feature']);
      expect(orchestrator.getPRLabels({ type: 'bugfix' }))
        .toEqual(['bug', 'fix']);
      expect(orchestrator.getPRLabels({ type: 'hotfix' }))
        .toEqual(['hotfix', 'urgent']);
      expect(orchestrator.getPRLabels({ type: 'refactor' }))
        .toEqual(['refactor', 'code-quality']);
      expect(orchestrator.getPRLabels({ type: 'docs' }))
        .toEqual(['documentation']);
      expect(orchestrator.getPRLabels({ type: 'test' }))
        .toEqual(['testing']);
    });

    it('should return default labels for unknown types', () => {
      expect(orchestrator.getPRLabels({ type: 'unknown' }))
        .toEqual(['enhancement']);
    });
  });

  describe('performAutomatedReview', () => {
    it('should perform comprehensive review and approve if all checks pass', async () => {
      const task = { branchName: 'feature/test' };
      const pr = { number: 123 };

      orchestrator.runQualityChecks = jest.fn().mockResolvedValue({ passed: true, issues: [] });
      orchestrator.runSecurityScan = jest.fn().mockResolvedValue({ passed: true, issues: [] });
      orchestrator.runPerformanceTests = jest.fn().mockResolvedValue({ passed: true, issues: [] });

      mockOctokit.pulls.createReview.mockResolvedValue({});

      const result = await orchestrator.performAutomatedReview(pr, task);

      expect(mockOctokit.pulls.createReview).toHaveBeenCalledWith({
        owner: '20m61',
        repo: 'lightningtalk-circle',
        pull_number: 123,
        body: expect.stringContaining('All automated checks passed'),
        event: 'APPROVE'
      });

      expect(result.approved).toBe(true);
    });

    it('should request changes if any check fails', async () => {
      const task = { branchName: 'feature/test' };
      const pr = { number: 123 };

      orchestrator.runQualityChecks = jest.fn().mockResolvedValue({ 
        passed: false, 
        issues: ['ESLint error'] 
      });
      orchestrator.runSecurityScan = jest.fn().mockResolvedValue({ passed: true, issues: [] });
      orchestrator.runPerformanceTests = jest.fn().mockResolvedValue({ passed: true, issues: [] });

      mockOctokit.pulls.createReview.mockResolvedValue({});

      const result = await orchestrator.performAutomatedReview(pr, task);

      expect(mockOctokit.pulls.createReview).toHaveBeenCalledWith({
        owner: '20m61',
        repo: 'lightningtalk-circle',
        pull_number: 123,
        body: expect.stringContaining('Issues found'),
        event: 'REQUEST_CHANGES'
      });

      expect(result.approved).toBe(false);
    });
  });

  describe('executeTestsWithRetry', () => {
    it('should succeed on first attempt when tests pass', async () => {
      orchestrator.checkDockerAvailability = jest.fn().mockResolvedValue(true);
      orchestrator.runDockerTests = jest.fn().mockResolvedValue();

      const result = await orchestrator.executeTestsWithRetry(3);

      expect(result.success).toBe(true);
      expect(orchestrator.checkDockerAvailability).toHaveBeenCalledTimes(1);
      expect(orchestrator.runDockerTests).toHaveBeenCalledTimes(1);
    });

    it('should retry when tests fail initially', async () => {
      orchestrator.checkDockerAvailability = jest.fn().mockResolvedValue(true);
      orchestrator.runDockerTests = jest.fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce();

      const result = await orchestrator.executeTestsWithRetry(3);

      expect(result.success).toBe(true);
      expect(orchestrator.runDockerTests).toHaveBeenCalledTimes(2);
    });

    it('should fail after all retries exhausted', async () => {
      orchestrator.checkDockerAvailability = jest.fn().mockResolvedValue(true);
      orchestrator.runDockerTests = jest.fn().mockRejectedValue(new Error('Tests always fail'));

      const result = await orchestrator.executeTestsWithRetry(2);

      expect(result.success).toBe(false);
      expect(result.error).toContain('All 2 attempts failed');
      expect(orchestrator.runDockerTests).toHaveBeenCalledTimes(2);
    });

    it('should fallback to local tests when Docker unavailable', async () => {
      orchestrator.checkDockerAvailability = jest.fn().mockResolvedValue(false);
      orchestrator.runLocalTests = jest.fn().mockResolvedValue();

      const result = await orchestrator.executeTestsWithRetry(1);

      expect(result.success).toBe(true);
      expect(orchestrator.runLocalTests).toHaveBeenCalledTimes(1);
    });
  });

  describe('checkDockerAvailability', () => {
    it('should return true when Docker is available', async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('docker --version') || cmd.includes('docker info')) {
          return 'Docker version info';
        }
      });
      fs.existsSync.mockReturnValue(true);

      const result = await orchestrator.checkDockerAvailability();

      expect(result).toBe(true);
    });

    it('should return false when Docker is not installed', async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('docker --version')) {
          throw new Error('docker: command not found');
        }
      });

      const result = await orchestrator.checkDockerAvailability();

      expect(result).toBe(false);
    });

    it('should return false when Docker Compose file missing', async () => {
      execSync.mockImplementation(() => 'Docker is available');
      fs.existsSync.mockReturnValue(false);

      const result = await orchestrator.checkDockerAvailability();

      expect(result).toBe(false);
    });
  });

  describe('runDockerTests', () => {
    it('should run tests successfully in Docker', async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('pull')) return 'Image pulled';
        if (cmd.includes('run --rm test-runner')) return 'All tests passed';
      });

      await expect(orchestrator.runDockerTests()).resolves.not.toThrow();
    });

    it('should handle Docker test failures', async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('pull')) return 'Image pulled';
        if (cmd.includes('run --rm test-runner')) return 'FAIL: Some tests failed';
      });

      await expect(orchestrator.runDockerTests()).rejects.toThrow('Some tests failed');
    });

    it('should cleanup Docker environment on failure', async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('pull')) return 'Image pulled';
        if (cmd.includes('run --rm test-runner')) throw new Error('Docker run failed');
        if (cmd.includes('down')) return 'Environment cleaned up';
      });

      await expect(orchestrator.runDockerTests()).rejects.toThrow();
      
      // Verify cleanup was attempted
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('down'),
        expect.any(Object)
      );
    });
  });

  describe('runLocalTests', () => {
    it('should install dependencies if node_modules missing', async () => {
      fs.existsSync.mockImplementation((path) => {
        return path !== 'node_modules';
      });
      execSync.mockImplementation((cmd) => {
        if (cmd === 'npm install') return 'Dependencies installed';
        if (cmd === 'npm test') return 'All tests passed';
      });

      await expect(orchestrator.runLocalTests()).resolves.not.toThrow();
      
      expect(execSync).toHaveBeenCalledWith(
        'npm install',
        expect.any(Object)
      );
    });

    it('should skip dependency installation if node_modules exists', async () => {
      fs.existsSync.mockReturnValue(true);
      execSync.mockImplementation((cmd) => {
        if (cmd === 'npm test') return 'All tests passed';
      });

      await expect(orchestrator.runLocalTests()).resolves.not.toThrow();
      
      expect(execSync).not.toHaveBeenCalledWith(
        'npm install',
        expect.any(Object)
      );
    });

    it('should handle local test failures', async () => {
      fs.existsSync.mockReturnValue(true);
      execSync.mockImplementation((cmd) => {
        if (cmd === 'npm test') return 'FAIL: Local tests failed';
      });

      await expect(orchestrator.runLocalTests()).rejects.toThrow('Some tests failed');
    });
  });
    it('should return successful quality check result', async () => {
      const result = await orchestrator.runQualityChecks('feature/test');

      expect(result.passed).toBe(true);
      expect(result.issues).toEqual([]);
    });

    it('should handle quality check errors', async () => {
      // Mock internal error by overriding the method behavior
      const originalMethod = orchestrator.runQualityChecks;
      orchestrator.runQualityChecks = jest.fn().mockImplementation(() => {
        throw new Error('Quality check failed');
      });

      const result = await orchestrator.runQualityChecks('feature/test');

      expect(result.passed).toBe(false);
      expect(result.issues).toContain('Quality check failed');

      // Restore original method
      orchestrator.runQualityChecks = originalMethod;
    });
  });

  describe('performAutoMerge', () => {
    it('should merge PR when auto-merge is enabled and PR is mergeable', async () => {
      orchestrator.config.autoMerge = true;
      
      const pr = { number: 123 };
      const prData = { 
        title: 'Test PR',
        mergeable: true 
      };

      mockOctokit.pulls.get.mockResolvedValue({ data: prData });
      mockOctokit.pulls.merge.mockResolvedValue({});

      const result = await orchestrator.performAutoMerge(pr);

      expect(mockOctokit.pulls.merge).toHaveBeenCalledWith({
        owner: '20m61',
        repo: 'lightningtalk-circle',
        pull_number: 123,
        commit_title: 'Test PR (#123)',
        merge_method: 'squash'
      });

      expect(result).toBe(true);
    });

    it('should not merge when auto-merge is disabled', async () => {
      orchestrator.config.autoMerge = false;
      const pr = { number: 123 };

      const result = await orchestrator.performAutoMerge(pr);

      expect(result).toBe(false);
      expect(mockOctokit.pulls.merge).not.toHaveBeenCalled();
    });

    it('should not merge when PR is not mergeable', async () => {
      orchestrator.config.autoMerge = true;
      
      const pr = { number: 123 };
      const prData = { mergeable: false };

      mockOctokit.pulls.get.mockResolvedValue({ data: prData });

      const result = await orchestrator.performAutoMerge(pr);

      expect(result).toBe(false);
      expect(mockOctokit.pulls.merge).not.toHaveBeenCalled();
    });

    it('should handle merge errors', async () => {
      orchestrator.config.autoMerge = true;
      
      const pr = { number: 123 };
      const prData = { mergeable: true };

      mockOctokit.pulls.get.mockResolvedValue({ data: prData });
      mockOctokit.pulls.merge.mockRejectedValue(new Error('Merge failed'));

      const result = await orchestrator.performAutoMerge(pr);

      expect(result).toBe(false);
    });
  });

  describe('cleanupWorktree', () => {
    it('should remove worktree and branch when merged', async () => {
      execSync.mockImplementation(() => {});

      await orchestrator.cleanupWorktree('/test/path', 'feature/test', true);

      expect(execSync).toHaveBeenCalledWith(
        'git worktree remove /test/path',
        expect.any(Object)
      );
      expect(execSync).toHaveBeenCalledWith(
        'git branch -d feature/test',
        expect.any(Object)
      );
      expect(execSync).toHaveBeenCalledWith(
        'git push origin --delete feature/test',
        expect.any(Object)
      );
    });

    it('should only remove worktree when not merged', async () => {
      execSync.mockImplementation(() => {});

      await orchestrator.cleanupWorktree('/test/path', 'feature/test', false);

      expect(execSync).toHaveBeenCalledWith(
        'git worktree remove /test/path',
        expect.any(Object)
      );
      expect(execSync).not.toHaveBeenCalledWith(
        expect.stringContaining('git branch -d'),
        expect.any(Object)
      );
    });

    it('should handle cleanup errors gracefully', async () => {
      execSync.mockImplementation(() => {
        throw new Error('Cleanup failed');
      });

      // Should not throw, just log warning
      await expect(orchestrator.cleanupWorktree('/test/path', 'feature/test'))
        .resolves.not.toThrow();
    });
  });

  describe('updatePackageJson', () => {
    it('should add script to existing package.json', () => {
      const task = { description: 'test feature' };
      
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        name: 'test',
        scripts: { start: 'node index.js' }
      }));
      fs.writeFileSync.mockImplementation(() => {});

      orchestrator.updatePackageJson(task);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        'package.json',
        expect.stringContaining('test-feature')
      );
    });

    it('should handle missing package.json gracefully', () => {
      const task = { description: 'test feature' };
      
      fs.existsSync.mockReturnValue(false);

      // Should not throw
      expect(() => orchestrator.updatePackageJson(task)).not.toThrow();
    });

    it('should handle JSON parsing errors', () => {
      const task = { description: 'test feature' };
      
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('invalid json');

      // Should not throw
      expect(() => orchestrator.updatePackageJson(task)).not.toThrow();
    });
  });

  describe('executeWorkflow', () => {
    it('should execute complete workflow successfully', async () => {
      const instruction = 'add user authentication feature';

      // Mock all the methods called in the workflow
      orchestrator.createWorktree = jest.fn().mockResolvedValue({
        worktreePath: '/test/path',
        worktreeName: 'feature-auth'
      });
      orchestrator.executeDevelopmentTask = jest.fn().mockResolvedValue();
      orchestrator.runAutomatedTests = jest.fn().mockResolvedValue(true);
      orchestrator.commitChanges = jest.fn().mockResolvedValue();
      orchestrator.createPullRequest = jest.fn().mockResolvedValue({
        number: 123,
        html_url: 'https://github.com/test/repo/pull/123'
      });
      orchestrator.performAutomatedReview = jest.fn().mockResolvedValue({
        approved: true
      });
      orchestrator.performAutoMerge = jest.fn().mockResolvedValue(true);
      orchestrator.cleanupWorktree = jest.fn().mockResolvedValue();

      const result = await orchestrator.executeWorkflow(instruction);

      expect(result.success).toBe(true);
      expect(result.merged).toBe(true);
      expect(result.task.type).toBe('feature');
      expect(orchestrator.createWorktree).toHaveBeenCalled();
      expect(orchestrator.executeDevelopmentTask).toHaveBeenCalled();
      expect(orchestrator.runAutomatedTests).toHaveBeenCalled();
      expect(orchestrator.commitChanges).toHaveBeenCalled();
      expect(orchestrator.createPullRequest).toHaveBeenCalled();
      expect(orchestrator.performAutomatedReview).toHaveBeenCalled();
      expect(orchestrator.performAutoMerge).toHaveBeenCalled();
      expect(orchestrator.cleanupWorktree).toHaveBeenCalled();
    });

    it('should handle workflow failures gracefully', async () => {
      const instruction = 'add failing feature';

      orchestrator.createWorktree = jest.fn().mockRejectedValue(new Error('Worktree failed'));

      const result = await orchestrator.executeWorkflow(instruction);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Worktree failed');
    });

    it('should stop workflow when tests fail', async () => {
      const instruction = 'add feature with failing tests';

      orchestrator.createWorktree = jest.fn().mockResolvedValue({
        worktreePath: '/test/path',
        worktreeName: 'feature-test'
      });
      orchestrator.executeDevelopmentTask = jest.fn().mockResolvedValue();
      orchestrator.runAutomatedTests = jest.fn().mockResolvedValue(false);

      const result = await orchestrator.executeWorkflow(instruction);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Automated tests failed');
    });

    it('should not auto-merge when review is not approved', async () => {
      const instruction = 'add feature needing changes';

      orchestrator.createWorktree = jest.fn().mockResolvedValue({
        worktreePath: '/test/path',
        worktreeName: 'feature-changes'
      });
      orchestrator.executeDevelopmentTask = jest.fn().mockResolvedValue();
      orchestrator.runAutomatedTests = jest.fn().mockResolvedValue(true);
      orchestrator.commitChanges = jest.fn().mockResolvedValue();
      orchestrator.createPullRequest = jest.fn().mockResolvedValue({
        number: 123,
        html_url: 'https://github.com/test/repo/pull/123'
      });
      orchestrator.performAutomatedReview = jest.fn().mockResolvedValue({
        approved: false
      });
      orchestrator.performAutoMerge = jest.fn();
      orchestrator.cleanupWorktree = jest.fn().mockResolvedValue();

      const result = await orchestrator.executeWorkflow(instruction);

      expect(result.success).toBe(true);
      expect(result.merged).toBe(false);
      expect(orchestrator.performAutoMerge).not.toHaveBeenCalled();
    });
  });

  describe('executeTestsWithRetry', () => {
    it('should succeed on first attempt when tests pass', async () => {
      orchestrator.checkDockerAvailability = jest.fn().mockResolvedValue(true);
      orchestrator.runDockerTests = jest.fn().mockResolvedValue();

      const result = await orchestrator.executeTestsWithRetry(3);

      expect(result.success).toBe(true);
      expect(orchestrator.checkDockerAvailability).toHaveBeenCalledTimes(1);
      expect(orchestrator.runDockerTests).toHaveBeenCalledTimes(1);
    });

    it('should retry when tests fail initially', async () => {
      orchestrator.checkDockerAvailability = jest.fn().mockResolvedValue(true);
      orchestrator.runDockerTests = jest.fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce();

      const result = await orchestrator.executeTestsWithRetry(3);

      expect(result.success).toBe(true);
      expect(orchestrator.runDockerTests).toHaveBeenCalledTimes(2);
    });

    it('should fallback to local tests when Docker unavailable', async () => {
      orchestrator.checkDockerAvailability = jest.fn().mockResolvedValue(false);
      orchestrator.runLocalTests = jest.fn().mockResolvedValue();

      const result = await orchestrator.executeTestsWithRetry(1);

      expect(result.success).toBe(true);
      expect(orchestrator.runLocalTests).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateMergeConditions', () => {
    it('should validate all merge conditions successfully', async () => {
      const pr = { number: 123 };
      const mockPrData = {
        mergeable: true,
        mergeable_state: 'clean',
        title: 'Test PR',
        base: { ref: 'main' },
        head: { sha: 'abc123' },
        additions: 100,
        deletions: 50
      };

      mockOctokit.pulls.get.mockResolvedValue({ data: mockPrData });
      
      orchestrator.checkRequiredStatusChecks = jest.fn().mockResolvedValue({
        allPassed: true,
        failedChecks: []
      });
      orchestrator.checkReviewApproval = jest.fn().mockResolvedValue({
        approved: true,
        approvals: 2
      });
      orchestrator.checkBranchProtectionRules = jest.fn().mockResolvedValue({
        canMerge: true
      });
      orchestrator.performSafetyChecks = jest.fn().mockResolvedValue({
        safe: true,
        reason: 'All safety checks passed'
      });

      const result = await orchestrator.validateMergeConditions(pr);

      expect(result.canMerge).toBe(true);
      expect(result.reason).toBe('All merge conditions satisfied');
    });

    it('should block merge when PR has conflicts', async () => {
      const pr = { number: 123 };
      const mockPrData = {
        mergeable: false,
        mergeable_state: 'dirty'
      };

      mockOctokit.pulls.get.mockResolvedValue({ data: mockPrData });

      const result = await orchestrator.validateMergeConditions(pr);

      expect(result.canMerge).toBe(false);
      expect(result.reason).toContain('merge conflicts');
    });
  });
});