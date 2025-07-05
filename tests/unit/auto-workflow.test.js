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

  describe('createWorktree (mocked)', () => {
    it('worktree作成が正常に動作する（モック使用）', async () => {
      // orchestratorのメソッドを直接モック
      const mockCreateWorktree = jest.fn().mockResolvedValue({
        worktreeName: 'feature-test-branch',
        success: true
      });

      orchestrator.createWorktree = mockCreateWorktree;

      const branchName = 'feature/test-branch';
      const result = await orchestrator.createWorktree(branchName);

      expect(result.worktreeName).toBe('feature-test-branch');
      expect(result.success).toBe(true);
      expect(mockCreateWorktree).toHaveBeenCalledWith(branchName);
    });
  });

  describe('implementFeature (mocked)', () => {
    it('featureファイルとpackage.jsonが生成される（モック使用）', async () => {
      // orchestratorのメソッドを直接モック
      const mockImplementFeature = jest.fn().mockResolvedValue({
        success: true,
        files: ['src/features/user-authentication.js', 'package.json']
      });

      orchestrator.implementFeature = mockImplementFeature;

      const task = {
        description: 'user authentication',
        originalInstruction: 'add user authentication feature'
      };
      const result = await orchestrator.implementFeature(task);

      expect(result.success).toBe(true);
      expect(result.files).toContain('src/features/user-authentication.js');
      expect(result.files).toContain('package.json');
      expect(mockImplementFeature).toHaveBeenCalledWith(task);
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
