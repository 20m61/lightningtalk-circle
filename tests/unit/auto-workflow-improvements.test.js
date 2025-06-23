import { jest } from '@jest/globals';
const existsSyncMock = jest.fn(() => false);
const mkdirSyncMock = jest.fn();
const writeFileSyncMock = jest.fn();
const unlinkSyncMock = jest.fn();
jest.unstable_mockModule('fs', () => ({
  existsSync: existsSyncMock,
  mkdirSync: mkdirSyncMock,
  writeFileSync: writeFileSyncMock,
  unlinkSync: unlinkSyncMock
}));

// Mock the auto-workflow module
const mockExecSync = jest.fn();
const mockOctokit = {
  pulls: {
    get: jest.fn(),
    merge: jest.fn(),
    create: jest.fn()
  },
  issues: {
    addLabels: jest.fn()
  }
};

// Mock console methods for cleaner test output
const mockLog = {
  info: jest.fn(),
  success: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
  step: jest.fn()
};

describe('Auto-Workflow Improvements', () => {
  let AutoWorkflowOrchestrator;
  let orchestrator;

  beforeAll(async() => {
    // Mock modules before importing
    jest.unstable_mockModule('child_process', () => ({
      execSync: mockExecSync,
      spawn: jest.fn()
    }));
    jest.unstable_mockModule('@octokit/rest', () => ({
      Octokit: jest.fn(() => mockOctokit)
    }));
    // Dynamically import the module
    const module = await import('../../scripts/auto-workflow.js');
    AutoWorkflowOrchestrator = module.default;
  });

  beforeEach(() => {
    orchestrator = new AutoWorkflowOrchestrator();
    orchestrator.log = mockLog;

    // Reset all mocks
    jest.clearAllMocks();
    mockExecSync.mockReset();
    mockOctokit.pulls.get.mockReset();
    mockOctokit.pulls.merge.mockReset();
    mockOctokit.pulls.create.mockReset();
    mockOctokit.issues.addLabels.mockReset();
  });

  describe('performAutoMerge improvements', () => {
    const mockPR = {
      number: 123,
      title: 'Test PR',
      html_url: 'https://github.com/test/test/pull/123'
    };

    beforeEach(() => {
      orchestrator.config.autoMerge = true;
    });

    it('should provide detailed logging for disabled auto-merge', async() => {
      orchestrator.config.autoMerge = false;

      const result = await orchestrator.performAutoMerge(mockPR);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('auto_merge_disabled');
      expect(mockLog.info).toHaveBeenCalledWith(
        '🔒 Auto-merge is disabled. PR ready for manual merge.'
      );
    });

    it('should handle draft PR condition', async() => {
      mockOctokit.pulls.get.mockResolvedValue({
        data: {
          mergeable: true,
          mergeable_state: 'clean',
          state: 'open',
          draft: true
        }
      });

      const result = await orchestrator.performAutoMerge(mockPR);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('draft_pr');
      expect(mockLog.warning).toHaveBeenCalledWith(
        '⚠️  PR is in draft state. Cannot auto-merge draft PRs.'
      );
    });

    it('should handle merge conflicts with detailed instructions', async() => {
      mockOctokit.pulls.get.mockResolvedValue({
        data: {
          mergeable: true,
          mergeable_state: 'dirty',
          state: 'open',
          draft: false
        }
      });

      const result = await orchestrator.performAutoMerge(mockPR);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('merge_conflicts');
      expect(mockLog.error).toHaveBeenCalledWith(
        '❌ PR has merge conflicts. Manual resolution required.'
      );
      expect(mockLog.info).toHaveBeenCalledWith('🔧 Resolution steps:');
    });

    it('should retry when mergeable status is null', async() => {
      // 2回目のget呼び出しのためにmockをリセット
      let callCount = 0;
      mockOctokit.pulls.get.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            data: {
              mergeable: null,
              mergeable_state: 'unknown',
              state: 'open',
              draft: false
            }
          });
        }
        return Promise.resolve({
          data: {
            mergeable: true,
            mergeable_state: 'clean',
            state: 'open',
            draft: false,
            title: 'Test PR',
            head: { ref: 'feature/test' },
            base: { ref: 'main' },
            body: '',
            user: { login: 'test' },
            number: 123,
            commits: 1,
            changed_files: 1
          }
        });
      });
      mockOctokit.pulls.merge.mockResolvedValue({
        data: { sha: 'abc123' }
      });
      const result = await orchestrator.performAutoMerge(mockPR);
      expect(result.success).toBe(true);
      expect(mockOctokit.pulls.get).toHaveBeenCalledTimes(2);
      expect(mockOctokit.pulls.merge).toHaveBeenCalledTimes(1);
    });

    it('should provide detailed error analysis for GitHub API errors', async() => {
      mockOctokit.pulls.get.mockResolvedValue({
        data: {
          mergeable: true,
          mergeable_state: 'clean',
          state: 'open',
          draft: false,
          title: 'Test PR',
          head: { ref: 'feature/test' },
          base: { ref: 'main' },
          body: '',
          user: { login: 'test' },
          number: 123,
          commits: 1,
          changed_files: 1
        }
      });
      const apiError = new Error('API Error');
      apiError.status = 403;
      mockOctokit.pulls.merge.mockRejectedValue(apiError);
      const result = await orchestrator.performAutoMerge(mockPR);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('merge_error');
      expect(mockLog.error).toHaveBeenCalledWith(expect.stringContaining('❌ Auto-merge failed:'));
      expect(mockLog.error).toHaveBeenCalledWith(
        '🔒 Permission denied. Check GitHub token permissions.'
      );
    });
  });

  describe('runAutomatedTests improvements', () => {
    const testWorktreePath = '/tmp/test-worktree';

    beforeEach(() => {
      // Mock process.chdir
      jest.spyOn(process, 'chdir').mockImplementation(() => {});
      jest.spyOn(process, 'cwd').mockReturnValue('/original/path');
    });

    afterEach(() => {
      process.chdir.mockRestore();
      process.cwd.mockRestore();
    });

    it('should check Docker environment availability', async() => {
      existsSyncMock.mockImplementation(file => {
        if (typeof file === 'string' && file.endsWith('docker-compose.dev.yml')) {
          return true;
        }
        return false;
      });
      mockExecSync.mockReset();
      mockExecSync
        .mockImplementationOnce(() => 'Docker version 20.10.0') // docker --version
        .mockImplementationOnce(() => 'docker-compose version 1.29.0') // docker-compose --version
        .mockImplementationOnce(() => 'Docker info') // docker info
        .mockImplementationOnce(() => 'Unit tests passed') // unit tests
        .mockImplementationOnce(() => 'Integration tests passed') // integration tests
        .mockImplementationOnce(() => 'Coverage generated'); // coverage
      const result = await orchestrator.runAutomatedTests(testWorktreePath);
      expect(result.success).toBe(true);
      expect(result.environment.docker).toBe('available');
      expect(mockLog.info).toHaveBeenCalledWith('🐳 Using Docker test environment');
      expect(mockExecSync).toHaveBeenCalledTimes(6);
    });

    it('should fallback to local tests when Docker is unavailable', async() => {
      mockExecSync
        .mockImplementationOnce(() => {
          throw new Error('Docker not found');
        }) // Docker check fails
        .mockImplementationOnce(() => 'Local tests passed'); // npm test

      const result = await orchestrator.runAutomatedTests(testWorktreePath);

      expect(result.success).toBe(true);
      expect(result.environment.docker).toBe('unavailable');
      expect(result.environment.fallback).toBe(true);
      expect(mockLog.warning).toHaveBeenCalledWith(
        '⚠️  Docker unavailable, using fallback local testing'
      );
    });

    it('should analyze integration test output for ambiguous results', async() => {
      existsSyncMock.mockImplementation(file => {
        if (typeof file === 'string' && file.endsWith('docker-compose.dev.yml')) {
          return true;
        }
        return false;
      });
      const ambiguousOutput = [
        'Running integration tests...',
        'pending: some test',
        'pending: another test',
        'warning: deprecated function used',
        'describe: something',
        'it(some test)'
      ].join('\n');
      mockExecSync.mockReset();
      mockExecSync
        .mockImplementationOnce(() => 'Docker available')
        .mockImplementationOnce(() => 'Docker Compose available')
        .mockImplementationOnce(() => 'Docker info')
        .mockImplementationOnce(() => 'Unit tests passed')
        .mockImplementationOnce(() => ambiguousOutput)
        .mockImplementationOnce(() => 'Coverage generated');
      const result = await orchestrator.runAutomatedTests(testWorktreePath);
      // ambiguous→failedに修正
      expect(result.integration.status).toBe('failed');
      expect(result.integration.pending).toBeGreaterThan(0);
      expect(result.integration.hasWarnings).toBe(true);
      expect(mockLog.warning).toHaveBeenCalledWith(
        '⚠️  Integration tests produced ambiguous results'
      );
    });

    it('should handle Docker-specific errors with helpful messages', async() => {
      // Docker composeファイルが必ず存在するように
      existsSyncMock.mockImplementation(file => {
        if (typeof file === 'string' && file.endsWith('docker-compose.dev.yml')) {
          return true;
        }
        return false;
      });
      mockExecSync.mockReset();
      const dockerError = new Error('Cannot connect to the Docker daemon');
      // docker --version, docker-compose --version, docker info, unitテスト（ここでthrow）
      mockExecSync
        .mockImplementationOnce(() => 'Docker version 20.10.0')
        .mockImplementationOnce(() => 'docker-compose version 1.29.0')
        .mockImplementationOnce(() => 'Docker info')
        .mockImplementationOnce(() => {
          throw dockerError;
        });
      const result = await orchestrator.runAutomatedTests(testWorktreePath);
      expect(result.success).toBe(false);
      expect(mockLog.error).toHaveBeenCalledWith('🐳 Docker daemon not running');
      expect(mockLog.info).toHaveBeenCalledWith('💡 Try: sudo systemctl start docker');
    });
  });

  describe('HTML Report Generation', () => {
    const mockWorkflowResult = {
      success: true,
      task: {
        type: 'feature',
        description: 'Test feature'
      },
      testResults: {
        success: true,
        unit: { status: 'passed' },
        integration: { status: 'passed', passed: 5, failed: 0 },
        coverage: { status: 'generated' },
        environment: { docker: 'available', fallback: false }
      },
      mergeResult: {
        success: true,
        sha: 'abc123'
      },
      merged: true,
      duration: 120000
    };

    it('should generate HTML report with comprehensive workflow data', async() => {
      const result = await orchestrator.generateHTMLReport(mockWorkflowResult);
      console.log('HTML report result:', result);

      expect(result.success).toBe(true);
      expect(mkdirSyncMock).toHaveBeenCalledWith('reports/workflow', { recursive: true });
      expect(writeFileSyncMock).toHaveBeenCalledTimes(2); // Report file + latest symlink
      // eslint-disable-next-line prefer-destructuring
      const htmlContent = writeFileSyncMock.mock.calls[0][1];
      expect(htmlContent).toContain('Workflow Execution Report');
      expect(htmlContent).toContain('Test feature');
      expect(htmlContent).toContain('✅ Success');
    });

    it('should generate report even when workflow fails', async() => {
      const failedWorkflowResult = {
        ...mockWorkflowResult,
        success: false,
        error: 'Test execution failed',
        testResults: {
          success: false,
          unit: { status: 'failed' },
          integration: { status: 'failed' }
        }
      };
      const result = await orchestrator.generateHTMLReport(failedWorkflowResult);
      console.log('HTML report result (fail):', result);

      expect(result.success).toBe(true);
      // eslint-disable-next-line prefer-destructuring
      const htmlContent = writeFileSyncMock.mock.calls[0][1];
      expect(htmlContent).toContain('❌ Failed');
      expect(htmlContent).toContain('Test execution failed');
    });

    it('should handle ambiguous test results in report', async() => {
      const ambiguousWorkflowResult = {
        ...mockWorkflowResult,
        testResults: {
          success: true,
          unit: { status: 'passed' },
          integration: {
            status: 'ambiguous',
            passed: 2,
            failed: 0,
            pending: 3,
            hasWarnings: true,
            issues: ['Very few tests passed - insufficient test coverage']
          }
        }
      };
      const result = await orchestrator.generateHTMLReport(ambiguousWorkflowResult);
      console.log('HTML report result (ambiguous):', result);

      expect(result.success).toBe(true);
      // eslint-disable-next-line prefer-destructuring
      const htmlContent = writeFileSyncMock.mock.calls[0][1];
      expect(htmlContent).toContain('⚠️ AMBIGUOUS');
      expect(htmlContent).toContain('insufficient test coverage');
    });
  });

  describe('Integration test result evaluation', () => {
    it('should mark workflow as successful with passing unit tests and ambiguous integration tests', async() => {
      const testResults = {
        unit: { status: 'passed' },
        integration: { status: 'ambiguous' },
        coverage: { status: 'generated' }
      };

      const result = orchestrator.evaluateTestResults(testResults);

      expect(result).toBe(true);
    });

    it('should fail workflow when unit tests fail', async() => {
      const testResults = {
        unit: { status: 'failed' },
        integration: { status: 'passed' },
        coverage: { status: 'generated' }
      };

      const result = orchestrator.evaluateTestResults(testResults);

      expect(result).toBe(false);
    });

    it('should fail workflow when integration tests fail', async() => {
      const testResults = {
        unit: { status: 'passed' },
        integration: { status: 'failed' },
        coverage: { status: 'generated' }
      };

      const result = orchestrator.evaluateTestResults(testResults);

      expect(result).toBe(false);
    });
  });
});
