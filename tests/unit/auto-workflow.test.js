import { jest } from '@jest/globals';
import fs from 'fs';
import AutoWorkflowOrchestrator from '../../scripts/auto-workflow.js';

describe('AutoWorkflowOrchestrator', () => {
  let orchestrator;
  beforeEach(() => {
    orchestrator = new AutoWorkflowOrchestrator();
  });

  describe('parseInstruction', () => {
    it('feature指示を正しくパースする', () => {
      const result = orchestrator.parseInstruction('add user authentication feature');
      expect(result.type).toBe('feature');
      expect(result.description).toBe('user authentication');
      expect(result.branchName).toMatch(/^feature\/user-authentication-/);
    });
    it('bugfix指示を正しくパースする', () => {
      const result = orchestrator.parseInstruction('fix login bug');
      expect(result.type).toBe('bugfix');
      expect(result.description).toBe('login');
      expect(result.branchName).toMatch(/^bugfix\/login-/);
    });
  });

  describe('generateBranchName', () => {
    it('ブランチ名が正しく生成される', () => {
      const branchName = orchestrator.generateBranchName('feature', 'User Authentication System');
      expect(branchName).toMatch(/^feature\/user-authentication-system-\d{6}$/);
    });
  });

  describe('createWorktree', () => {
    it('worktree作成が正常に動作する（fs, execSyncをモック）', async() => {
      // fs, execSyncをモック
      const mockMkdirSync = jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
      const mockExistsSync = jest.spyOn(fs, 'existsSync').mockImplementation(p => {
        if (p === orchestrator.config.worktreeBase) {
          return false;
        }
        if (p === '.env.example') {
          return true;
        }
        return false;
      });
      const mockCopyFileSync = jest.spyOn(fs, 'copyFileSync').mockImplementation(() => {});
      const execSync = jest.fn();
      // execSyncをグローバルに差し替え
      orchestrator.execSync = execSync;
      const branchName = 'feature/test-branch';
      const result = await orchestrator.createWorktree(branchName);
      expect(result.worktreeName).toBe('feature-test-branch');
      expect(mockMkdirSync).toHaveBeenCalled();
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('git worktree add'),
        expect.any(Object)
      );
      expect(mockCopyFileSync).toHaveBeenCalled();

      // モック解除
      mockMkdirSync.mockRestore();
      mockExistsSync.mockRestore();
      mockCopyFileSync.mockRestore();
      execSync.mockReset();
    });
  });

  describe('implementFeature', () => {
    it('featureファイルとpackage.jsonが生成される', async() => {
      const mockExistsSync = jest.spyOn(fs, 'existsSync').mockImplementation(p => {
        if (p === 'src/features') {
          return false;
        }
        if (p === 'package.json') {
          return true;
        }
        return false;
      });
      const mockMkdirSync = jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
      const mockReadFileSync = jest
        .spyOn(fs, 'readFileSync')
        .mockReturnValue(JSON.stringify({ scripts: {} }));

      const task = {
        description: 'user authentication',
        originalInstruction: 'add user authentication feature'
      };
      await orchestrator.implementFeature(task);

      expect(mockMkdirSync).toHaveBeenCalledWith('src/features', { recursive: true });
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('user-authentication.js'),
        expect.stringContaining('user authentication')
      );
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        'package.json',
        expect.stringContaining('user authentication')
      );

      // モック解除
      mockExistsSync.mockRestore();
      mockMkdirSync.mockRestore();
      mockWriteFileSync.mockRestore();
      mockReadFileSync.mockRestore();
    });
  });
});

describe('fs.existsSyncのテスト', () => {
  it('fs.existsSyncは関数である', () => {
    expect(typeof fs.existsSync).toBe('function');
  });
});

describe('最小構成テスト', () => {
  it('trueはtrueである', () => {
    expect(true).toBe(true);
  });
});
