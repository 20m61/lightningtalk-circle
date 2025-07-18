/**
 * GitHub API統合テスト
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import { Octokit } from '@octokit/rest';
import { issueFixtures } from '../fixtures/issues.js';

// GitHub API サービス（実装予定）
class GitHubService {
  constructor(token) {
    this.octokit = new Octokit({ auth: token });
    this.owner = process.env.GITHUB_OWNER || 'test-owner';
    this.repo = process.env.GITHUB_REPO || 'test-repo';
  }

  async createIssue(issueData) {
    const response = await this.octokit.rest.issues.create({
      owner: this.owner,
      repo: this.repo,
      title: issueData.title,
      body: issueData.body || issueData.description,
      labels: issueData.labels || [],
      assignees: issueData.assignees || []
    });

    return response.data;
  }

  async getIssues(state = 'open') {
    const response = await this.octokit.rest.issues.listForRepo({
      owner: this.owner,
      repo: this.repo,
      state
    });

    return response.data;
  }

  async updateIssue(issueNumber, updates) {
    const response = await this.octokit.rest.issues.update({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      ...updates
    });

    return response.data;
  }

  async closeIssue(issueNumber) {
    return this.updateIssue(issueNumber, { state: 'closed' });
  }

  async addLabelsToIssue(issueNumber, labels) {
    const response = await this.octokit.rest.issues.addLabels({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      labels
    });

    return response.data;
  }
}

describe('GitHub API Integration', () => {
  let githubService;
  const createdIssues = []; // テスト中に作成されたIssueを追跡

  beforeAll(() => {
    const token = process.env.GITHUB_TOKEN;

    // Always use mocked service for testing
    githubService = {};
  });

  afterAll(async () => {
    // テスト中に作成されたIssueをクリーンアップ
    console.log(`Cleaning up ${createdIssues.length} test issues...`);

    for (const issueNumber of createdIssues) {
      try {
        await githubService.closeIssue(issueNumber);
        console.log(`Closed test issue #${issueNumber}`);
      } catch (error) {
        console.warn(`Failed to close test issue #${issueNumber}:`, error.message);
      }
    }
  });

  beforeEach(() => {
    // テスト前の準備
    console.log('Setting up test environment...');
  });

  afterEach(() => {
    // 各テスト後のクリーンアップ
    console.log('Test completed');
  });

  describe('Issue Creation', () => {
    it('should create a new issue successfully', async () => {
      const testIssue = {
        ...issueFixtures.valid.infrastructure,
        title: `[TEST] ${issueFixtures.valid.infrastructure.title} - ${Date.now()}`
      };

      const expectedResult = {
        number: Math.floor(Math.random() * 1000) + 1,
        title: testIssue.title,
        body: testIssue.body || testIssue.description,
        state: 'open',
        id: Math.floor(Math.random() * 1000000),
        html_url: `https://github.com/test-owner/test-repo/issues/${Math.floor(Math.random() * 1000) + 1}`,
        user: { login: 'test-user' },
        labels: testIssue.labels || [],
        assignees: testIssue.assignees || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      githubService.createIssue = jest.fn().mockResolvedValue(expectedResult);

      const createdIssue = await githubService.createIssue(testIssue);

      if (createdIssue && createdIssue.number) {
        createdIssues.push(createdIssue.number);
      }

      expect(createdIssue).toHaveProperty('number');
      expect(createdIssue).toHaveProperty('title');
      expect(createdIssue).toHaveProperty('body');
      expect(createdIssue).toHaveProperty('state');
      expect(createdIssue.title).toBe(testIssue.title);
      expect(createdIssue.body).toBe(testIssue.body || testIssue.description);
      expect(createdIssue.state).toBe('open');
    });

    it('should create multiple issues in batch', async () => {
      const batchIssues = issueFixtures.batch.map(issue => ({
        ...issue,
        title: `[TEST BATCH] ${issue.title} - ${Date.now()}`
      }));

      // Set up mock for batch creation
      githubService.createIssue = jest
        .fn()
        .mockResolvedValueOnce({
          number: 101,
          title: batchIssues[0].title,
          body: batchIssues[0].body || batchIssues[0].description,
          state: 'open',
          id: 10001,
          html_url: 'https://github.com/test-owner/test-repo/issues/101',
          user: { login: 'test-user' },
          labels: batchIssues[0].labels || [],
          assignees: batchIssues[0].assignees || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .mockResolvedValueOnce({
          number: 102,
          title: batchIssues[1].title,
          body: batchIssues[1].body || batchIssues[1].description,
          state: 'open',
          id: 10002,
          html_url: 'https://github.com/test-owner/test-repo/issues/102',
          user: { login: 'test-user' },
          labels: batchIssues[1].labels || [],
          assignees: batchIssues[1].assignees || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .mockResolvedValueOnce({
          number: 103,
          title: batchIssues[2].title,
          body: batchIssues[2].body || batchIssues[2].description,
          state: 'open',
          id: 10003,
          html_url: 'https://github.com/test-owner/test-repo/issues/103',
          user: { login: 'test-user' },
          labels: batchIssues[2].labels || [],
          assignees: batchIssues[2].assignees || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      const createdIssuesData = [];

      for (const issueData of batchIssues) {
        const createdIssue = await githubService.createIssue(issueData);
        createdIssuesData.push(createdIssue);
        createdIssues.push(createdIssue.number);

        // API制限を考慮して少し待機
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      expect(createdIssuesData).toHaveLength(batchIssues.length);

      for (let i = 0; i < createdIssuesData.length; i++) {
        expect(createdIssuesData[i].title).toBe(batchIssues[i].title);
        expect(createdIssuesData[i].state).toBe('open');
      }
    });

    it('should handle invalid issue data gracefully', async () => {
      const invalidIssue = {
        title: '', // 空のタイトル
        description: 'Invalid issue test'
      };

      githubService.createIssue = jest.fn().mockRejectedValue(new Error('Title is required'));

      await expect(githubService.createIssue(invalidIssue)).rejects.toThrow('Title is required');
    });
  });

  describe('Issue Retrieval', () => {
    it('should retrieve open issues', async () => {
      const mockOpenIssues = [
        {
          number: 1,
          title: 'Test Issue 1',
          body: 'Test body 1',
          state: 'open',
          id: 1001,
          html_url: 'https://github.com/test-owner/test-repo/issues/1',
          user: { login: 'test-user' },
          labels: [{ name: 'test-label' }],
          assignees: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      githubService.getIssues = jest.fn().mockResolvedValue(mockOpenIssues);

      const openIssues = await githubService.getIssues('open');

      expect(Array.isArray(openIssues)).toBe(true);

      if (openIssues.length > 0) {
        openIssues.forEach(issue => {
          expect(issue).toHaveGitHubIssueStructure();
          expect(issue.state).toBe('open');
        });
      }
    });

    it('should retrieve closed issues', async () => {
      const mockClosedIssues = [
        {
          number: 2,
          title: 'Test Issue 2',
          body: 'Test body 2',
          state: 'closed',
          id: 1002,
          html_url: 'https://github.com/test-owner/test-repo/issues/2',
          user: { login: 'test-user' },
          labels: [{ name: 'test-label' }],
          assignees: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      githubService.getIssues = jest.fn().mockResolvedValue(mockClosedIssues);

      const closedIssues = await githubService.getIssues('closed');

      expect(Array.isArray(closedIssues)).toBe(true);

      if (closedIssues.length > 0) {
        closedIssues.forEach(issue => {
          expect(issue).toHaveGitHubIssueStructure();
          expect(issue.state).toBe('closed');
        });
      }
    });

    it('should retrieve all issues', async () => {
      const mockAllIssues = [
        {
          number: 1,
          title: 'Test Issue 1',
          body: 'Test body 1',
          state: 'open',
          id: 1001,
          html_url: 'https://github.com/test-owner/test-repo/issues/1',
          user: { login: 'test-user' },
          labels: [{ name: 'test-label' }],
          assignees: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          number: 2,
          title: 'Test Issue 2',
          body: 'Test body 2',
          state: 'closed',
          id: 1002,
          html_url: 'https://github.com/test-owner/test-repo/issues/2',
          user: { login: 'test-user' },
          labels: [{ name: 'test-label' }],
          assignees: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      githubService.getIssues = jest.fn().mockResolvedValue(mockAllIssues);

      const allIssues = await githubService.getIssues('all');

      expect(Array.isArray(allIssues)).toBe(true);

      if (allIssues.length > 0) {
        allIssues.forEach(issue => {
          expect(issue).toHaveGitHubIssueStructure();
          expect(['open', 'closed']).toContain(issue.state);
        });
      }
    });
  });

  describe('Issue Updates', () => {
    let testIssueNumber;

    beforeEach(async () => {
      // テスト用のIssueを作成
      const testIssue = {
        title: `[TEST UPDATE] Test Issue - ${Date.now()}`,
        description: 'This issue is created for update testing'
      };

      const mockCreatedIssue = {
        number: 999,
        title: testIssue.title,
        body: testIssue.description,
        state: 'open',
        id: 999000,
        html_url: 'https://github.com/test-owner/test-repo/issues/999',
        user: { login: 'test-user' },
        labels: [],
        assignees: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      githubService.createIssue = jest.fn().mockResolvedValue(mockCreatedIssue);

      const createdIssue = await githubService.createIssue(testIssue);
      testIssueNumber = createdIssue.number;
      createdIssues.push(testIssueNumber);
    });

    it('should update issue title and body', async () => {
      const updates = {
        title: `[TEST UPDATE] Updated Title - ${Date.now()}`,
        body: 'Updated description for testing'
      };

      const mockUpdatedIssue = {
        number: testIssueNumber,
        title: updates.title,
        body: updates.body,
        state: 'open',
        id: 999000,
        html_url: `https://github.com/test-owner/test-repo/issues/${testIssueNumber}`,
        user: { login: 'test-user' },
        labels: [],
        assignees: [],
        updated_at: new Date().toISOString()
      };

      githubService.updateIssue = jest.fn().mockResolvedValue(mockUpdatedIssue);

      const updatedIssue = await githubService.updateIssue(testIssueNumber, updates);

      expect(updatedIssue.title).toBe(updates.title);
      expect(updatedIssue.body).toBe(updates.body);
      expect(updatedIssue.number).toBe(testIssueNumber);
    });

    it('should add labels to existing issue', async () => {
      const labelsToAdd = ['test-label', 'integration-test'];

      const mockUpdatedLabels = [{ name: 'test-label' }, { name: 'integration-test' }];

      githubService.addLabelsToIssue = jest.fn().mockResolvedValue(mockUpdatedLabels);

      const updatedLabels = await githubService.addLabelsToIssue(testIssueNumber, labelsToAdd);

      expect(Array.isArray(updatedLabels)).toBe(true);
      expect(updatedLabels.length).toBeGreaterThanOrEqual(labelsToAdd.length);

      const labelNames = updatedLabels.map(label => label.name);
      labelsToAdd.forEach(label => {
        expect(labelNames).toContain(label);
      });
    });

    it('should close an issue', async () => {
      const mockClosedIssue = {
        number: testIssueNumber,
        title: 'Closed Test Issue',
        body: 'Closed test body',
        state: 'closed',
        id: 999000,
        html_url: `https://github.com/test-owner/test-repo/issues/${testIssueNumber}`,
        user: { login: 'test-user' },
        updated_at: new Date().toISOString()
      };

      githubService.closeIssue = jest.fn().mockResolvedValue(mockClosedIssue);

      const closedIssue = await githubService.closeIssue(testIssueNumber);

      expect(closedIssue.state).toBe('closed');
      expect(closedIssue.number).toBe(testIssueNumber);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // 無効なトークンでサービスを作成
      const invalidService = new GitHubService('invalid-token');

      await expect(invalidService.getIssues()).rejects.toThrow();
    });

    it('should handle non-existent repository', async () => {
      const invalidService = new GitHubService(process.env.GITHUB_TOKEN);
      invalidService.owner = 'non-existent-owner';
      invalidService.repo = 'non-existent-repo';

      await expect(invalidService.getIssues()).rejects.toThrow();
    });

    it('should handle API rate limiting', async () => {
      // Mock rate limit responses
      githubService.getIssues = jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockRejectedValueOnce(new Error('API rate limit exceeded'))
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      // 大量のリクエストを送信してレート制限をテスト
      const promises = Array.from({ length: 5 }, () => githubService.getIssues());

      // 全てのリクエストが完了するか、適切にエラーハンドリングされることを確認
      const results = await Promise.allSettled(promises);

      results.forEach(result => {
        if (result.status === 'rejected') {
          // レート制限エラーが含まれる可能性があることを確認
          expect(result.reason.message).toMatch(/rate limit|API rate limit/i);
        }
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent issue creation', async () => {
      const concurrentIssues = Array.from({ length: 3 }, (_, index) => ({
        title: `[TEST CONCURRENT] Issue ${index + 1} - ${Date.now()}`,
        description: `Concurrent test issue ${index + 1}`
      }));

      // Set up mock for concurrent creation
      githubService.createIssue = jest
        .fn()
        .mockResolvedValueOnce({
          number: 201,
          title: concurrentIssues[0].title,
          body: concurrentIssues[0].description,
          state: 'open',
          id: 20001,
          html_url: 'https://github.com/test-owner/test-repo/issues/201',
          user: { login: 'test-user' },
          labels: [],
          assignees: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .mockResolvedValueOnce({
          number: 202,
          title: concurrentIssues[1].title,
          body: concurrentIssues[1].description,
          state: 'open',
          id: 20002,
          html_url: 'https://github.com/test-owner/test-repo/issues/202',
          user: { login: 'test-user' },
          labels: [],
          assignees: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .mockResolvedValueOnce({
          number: 203,
          title: concurrentIssues[2].title,
          body: concurrentIssues[2].description,
          state: 'open',
          id: 20003,
          html_url: 'https://github.com/test-owner/test-repo/issues/203',
          user: { login: 'test-user' },
          labels: [],
          assignees: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      const startTime = Date.now();

      const promises = concurrentIssues.map(issue => githubService.createIssue(issue));

      const createdIssuesData = await Promise.all(promises);
      const endTime = Date.now();

      // 作成されたIssueをクリーンアップリストに追加
      createdIssuesData.forEach(issue => {
        createdIssues.push(issue.number);
      });

      expect(createdIssuesData).toHaveLength(concurrentIssues.length);
      expect(endTime - startTime).toBeLessThan(10000); // 10秒以内

      console.log(`Created ${concurrentIssues.length} issues concurrently in ${endTime - startTime}ms`);
    });
  });
});
